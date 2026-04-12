// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title FaircroftTreasury
 * @notice Holds all community funds in USDC. Collects dues, auto-splits between
 *         operating and reserve funds, and disburses payments to vendors.
 *         Every transaction is permanently recorded on-chain for full transparency.
 * @dev Separate from TimelockController — the Timelock controls ACCESS to this
 *      contract, but Treasury manages its own accounting.
 */
contract FaircroftTreasury is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Roles ────────────────────────────────────────────────────────────────

    /// @notice Role for emergency spending + operational tasks (board multisig)
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    /// @notice Role for governance-approved operations (Timelock)
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    /// @notice Role for yield manager contract (TreasuryYield)
    bytes32 public constant YIELD_MANAGER_ROLE = keccak256("YIELD_MANAGER_ROLE");

    /// @notice Role for DuesLending contract — can withdraw/deposit reserve and pay dues on behalf
    bytes32 public constant LENDING_ROLE = keccak256("LENDING_ROLE");

    /// @notice Role for VendorEscrow contract — can credit refunded funds back to accounting
    bytes32 public constant ESCROW_ROLE = keccak256("ESCROW_ROLE");

    // ── Immutables ───────────────────────────────────────────────────────────

    /// @notice USDC token contract (6 decimals on Base)
    IERC20 public immutable usdc;

    /// @notice PropertyNFT contract — used to validate token existence on payDues.
    ///         CR-04: set post-deploy via setPropertyNFT(); zero-address means no guard.
    IERC721 public propertyNft;

    // ── Dues Configuration ───────────────────────────────────────────────────

    /// @notice Quarterly dues in USDC (6 decimals). e.g., 200e6 = $200
    uint256 public quarterlyDuesAmount;

    /// @notice Discount for annual payment (basis points). e.g., 500 = 5%
    uint256 public annualDuesDiscount;

    /// @notice Late fee percentage (basis points). e.g., 1000 = 10%
    uint256 public lateFeePercent;

    /// @notice Grace period before late fee applies (seconds). Default: 30 days
    uint256 public gracePeriod;

    // ── Fund Allocation ──────────────────────────────────────────────────────

    /// @notice Operating portion in basis points. e.g., 8000 = 80%
    uint256 public operatingReserveSplitBps;

    /// @notice Current operating fund balance
    uint256 public operatingBalance;

    /// @notice Current reserve fund balance
    uint256 public reserveBalance;

    // ── Dues Records ─────────────────────────────────────────────────────────

    struct DuesRecord {
        uint128 paidThrough; // Timestamp: dues current through this date
        uint128 totalPaid;   // Lifetime total paid in USDC (6 decimals)
    }

    /// @notice Dues payment status per property (tokenId → record)
    mapping(uint256 tokenId => DuesRecord) public duesRecords;

    // ── Expenditure Log ──────────────────────────────────────────────────────

    struct Expenditure {
        address vendor;
        uint128 amount;       // USDC amount
        uint48  timestamp;
        uint48  proposalId;   // 0 = board-approved (under emergency limit)
        string  description;
        string  category;     // "maintenance", "legal", "insurance", etc.
    }

    /// @notice All expenditures ever made (append-only)
    Expenditure[] public expenditures;

    // ── Emergency Spending ───────────────────────────────────────────────────

    /// @notice Max per-transaction for board without governance vote
    uint256 public emergencySpendingLimit;

    /// @notice Amount spent this period under emergency authority
    uint256 public emergencySpentThisPeriod;

    /// @notice Start of current emergency spending period
    uint256 public emergencyPeriodStart;

    /// @notice Duration of emergency spending period (default: 30 days)
    uint256 public emergencyPeriodDuration;

    // ── Events ───────────────────────────────────────────────────────────────

    event DuesPaid(
        uint256 indexed tokenId,
        address indexed payer,
        uint256 amount,
        uint256 quarters,
        uint128 paidThrough
    );

    event LateFeeCharged(uint256 indexed tokenId, uint256 feeAmount);

    event ExpenditureMade(
        uint256 indexed expId,
        address indexed vendor,
        uint256 amount,
        string  description,
        string  category,
        uint48  proposalId
    );

    event EmergencySpend(
        uint256 indexed expId,
        address indexed vendor,
        uint256 amount,
        string  description,
        address authorizedBy
    );

    event DuesAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event SplitUpdated(uint256 oldBps, uint256 newBps);
    event ReserveTransfer(uint256 amount, bool toOperating);
    event ReserveReleasedForYield(address indexed to, uint256 amount);
    event YieldReturned(address indexed from, uint256 amount);
    event LoanWithdrawn(address indexed lendingContract, uint256 amount);
    event LoanRepaid(address indexed lendingContract, uint256 amount);
    event DuesPaidForLoan(uint256 indexed tokenId, address indexed payer, uint256 amount, uint256 quarters);
    event EscrowCreditReceived(address indexed escrowContract, uint256 amount);
    event DonationReconciled(uint256 amount, address indexed reconciledBy);
    event PropertyNFTSet(address indexed oldAddr, address indexed newAddr);

    // ── Errors ───────────────────────────────────────────────────────────────

    error InvalidPaymentPeriod();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientOperatingBalance(uint256 requested, uint256 available);
    error InsufficientReserveBalance(uint256 requested, uint256 available);
    error EmergencyLimitExceeded(uint256 requested, uint256 remaining);
    error InvalidBps(uint256 bps);
    error TokenDoesNotExist(uint256 tokenId);

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        uint256 _quarterlyDues,
        uint256 _annualDiscount,
        uint256 _emergencyLimit
    ) {
        if (_usdc == address(0)) revert ZeroAddress();

        usdc = IERC20(_usdc);
        quarterlyDuesAmount = _quarterlyDues;
        annualDuesDiscount = _annualDiscount;
        emergencySpendingLimit = _emergencyLimit;

        operatingReserveSplitBps = 8000; // 80% operating, 20% reserve
        lateFeePercent = 1000;           // 10%
        gracePeriod = 30 days;
        emergencyPeriodDuration = 30 days;
        emergencyPeriodStart = block.timestamp;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ── Core: Dues Payment ───────────────────────────────────────────────────

    /**
     * @notice Pay dues for a property. Anyone can pay for any lot (gift, trust, etc.)
     * @param tokenId The property lot number
     * @param quarters Number of quarters to pay (1-4)
     */
    function payDues(uint256 tokenId, uint256 quarters) external nonReentrant {
        if (quarters == 0 || quarters > 4) revert InvalidPaymentPeriod();

        // CR-05: reject payments for non-existent lots (ghost-lot griefing).
        // When propertyNft is set, ownerOf reverts for unminted tokenIds via
        // OZ ERC721NonexistentToken — we catch and rethrow with our own error.
        if (address(propertyNft) != address(0)) {
            try propertyNft.ownerOf(tokenId) returns (address) {} catch {
                revert TokenDoesNotExist(tokenId);
            }
        }

        uint256 amount;
        if (quarters == 4) {
            // Annual payment with discount
            uint256 annual = quarterlyDuesAmount * 4;
            amount = annual - (annual * annualDuesDiscount / 10000);
        } else {
            amount = quarterlyDuesAmount * quarters;
        }

        // Check for late fee
        DuesRecord storage record = duesRecords[tokenId];
        if (record.paidThrough > 0 && block.timestamp > record.paidThrough + gracePeriod) {
            uint256 lateFee = amount * lateFeePercent / 10000;
            amount += lateFee;
            emit LateFeeCharged(tokenId, lateFee);
        }

        // Transfer USDC from payer
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Update dues record
        uint256 startDate = record.paidThrough > block.timestamp
            ? record.paidThrough
            : block.timestamp;
        record.paidThrough = uint128(startDate + (quarters * 91 days));
        record.totalPaid += uint128(amount);

        // Split funds
        uint256 toOperating = amount * operatingReserveSplitBps / 10000;
        uint256 toReserve = amount - toOperating;
        operatingBalance += toOperating;
        reserveBalance += toReserve;

        emit DuesPaid(tokenId, msg.sender, amount, quarters, record.paidThrough);
    }

    // ── Core: Expenditures ───────────────────────────────────────────────────

    /**
     * @notice Spend from operating fund (governance-approved via Timelock)
     */
    function makeExpenditure(
        address vendor,
        uint128 amount,
        string calldata description,
        string calldata category,
        uint48 proposalId
    ) external nonReentrant onlyRole(GOVERNOR_ROLE) {
        if (vendor == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > operatingBalance) revert InsufficientOperatingBalance(amount, operatingBalance);

        operatingBalance -= amount;
        usdc.safeTransfer(vendor, amount);

        uint256 expId = expenditures.length;
        expenditures.push(Expenditure({
            vendor: vendor,
            amount: amount,
            timestamp: uint48(block.timestamp),
            proposalId: proposalId,
            description: description,
            category: category
        }));

        emit ExpenditureMade(expId, vendor, amount, description, category, proposalId);
    }

    /**
     * @notice Board emergency spending (no governance vote required)
     * @dev Subject to per-period limit.
     */
    function emergencySpend(
        address vendor,
        uint128 amount,
        string calldata description
    ) external nonReentrant onlyRole(TREASURER_ROLE) {
        if (vendor == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        // Reset period if expired
        if (block.timestamp > emergencyPeriodStart + emergencyPeriodDuration) {
            emergencyPeriodStart = block.timestamp;
            emergencySpentThisPeriod = 0;
        }

        if (emergencySpentThisPeriod + amount > emergencySpendingLimit) {
            revert EmergencyLimitExceeded(amount, emergencySpendingLimit - emergencySpentThisPeriod);
        }
        if (amount > operatingBalance) revert InsufficientOperatingBalance(amount, operatingBalance);

        emergencySpentThisPeriod += amount;
        operatingBalance -= amount;
        usdc.safeTransfer(vendor, amount);

        uint256 expId = expenditures.length;
        expenditures.push(Expenditure({
            vendor: vendor,
            amount: amount,
            timestamp: uint48(block.timestamp),
            proposalId: 0,
            description: description,
            category: "emergency"
        }));

        emit EmergencySpend(expId, vendor, amount, description, msg.sender);
    }

    // ── Reserve Management ───────────────────────────────────────────────────

    /**
     * @notice Transfer funds between operating and reserve (governance only)
     * @param amount USDC amount to transfer
     * @param toOperating true = reserve→operating, false = operating→reserve
     */
    function transferReserve(uint256 amount, bool toOperating) external onlyRole(GOVERNOR_ROLE) {
        if (amount == 0) revert ZeroAmount();

        if (toOperating) {
            if (amount > reserveBalance) revert InsufficientReserveBalance(amount, reserveBalance);
            reserveBalance -= amount;
            operatingBalance += amount;
        } else {
            if (amount > operatingBalance) revert InsufficientOperatingBalance(amount, operatingBalance);
            operatingBalance -= amount;
            reserveBalance += amount;
        }

        emit ReserveTransfer(amount, toOperating);
    }

    // ── Governance Config Updates ────────────────────────────────────────────

    function setQuarterlyDues(uint256 newAmount) external onlyRole(GOVERNOR_ROLE) {
        emit DuesAmountUpdated(quarterlyDuesAmount, newAmount);
        quarterlyDuesAmount = newAmount;
    }

    function setAnnualDiscount(uint256 newBps) external onlyRole(GOVERNOR_ROLE) {
        if (newBps > 5000) revert InvalidBps(newBps); // Max 50% discount
        annualDuesDiscount = newBps;
    }

    function setOperatingReserveSplit(uint256 newBps) external onlyRole(GOVERNOR_ROLE) {
        if (newBps > 10000) revert InvalidBps(newBps);
        emit SplitUpdated(operatingReserveSplitBps, newBps);
        operatingReserveSplitBps = newBps;
    }

    function setEmergencyLimit(uint256 newLimit) external onlyRole(GOVERNOR_ROLE) {
        emergencySpendingLimit = newLimit;
    }

    function setLateFeePercent(uint256 newBps) external onlyRole(GOVERNOR_ROLE) {
        if (newBps > 5000) revert InvalidBps(newBps); // Max 50%
        lateFeePercent = newBps;
    }

    function setGracePeriod(uint256 newPeriod) external onlyRole(GOVERNOR_ROLE) {
        gracePeriod = newPeriod;
    }

    /**
     * @notice Set the PropertyNFT contract address.
     * @dev CR-04: enables ownerOf guard in payDues/payDuesFor. Set post-deploy
     *      via governance. When non-zero, paying dues for a non-existent lot reverts.
     *
     *      Future: once PropertyNFT grants a TREASURY_ROLE, this contract can also
     *      call propertyNFT.updateDuesStatus() to keep the NFT's lastDuesTimestamp
     *      in sync with Treasury's duesRecords. That requires a PropertyNFT upgrade
     *      + governance role-grant and is tracked separately.
     */
    function setPropertyNFT(address _nft) external onlyRole(GOVERNOR_ROLE) {
        emit PropertyNFTSet(address(propertyNft), _nft);
        propertyNft = IERC721(_nft);
    }

    // ── Yield Management ─────────────────────────────────────────────────────

    /**
     * @notice Release reserve funds to yield manager contract for Aave deployment
     * @param to   Address to receive the USDC (should be TreasuryYield contract)
     * @param amount Amount of USDC to release from reserve
     */
    function releaseReserveForYield(address to, uint256 amount)
        external
        nonReentrant
        onlyRole(YIELD_MANAGER_ROLE)
    {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > reserveBalance) revert InsufficientReserveBalance(amount, reserveBalance);

        reserveBalance -= amount;
        usdc.safeTransfer(to, amount);

        emit ReserveReleasedForYield(to, amount);
    }

    /**
     * @notice Accept USDC returned from yield manager and credit reserve balance
     * @dev Caller must have approved this contract to spend `amount` USDC first
     * @param amount Amount of USDC being returned
     */
    function creditYieldReturn(uint256 amount)
        external
        nonReentrant
        onlyRole(YIELD_MANAGER_ROLE)
    {
        if (amount == 0) revert ZeroAmount();

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        reserveBalance += amount;

        emit YieldReturned(msg.sender, amount);
    }

    // ── DuesLending Support ───────────────────────────────────────────────────

    /**
     * @notice Transfer reserve USDC to DuesLending so it can pay dues on a borrower's behalf.
     *         Decrements reserveBalance; the lending contract will deposit payments back over time.
     * @param amount USDC amount to release from reserve
     */
    function withdrawForLoan(uint256 amount)
        external
        nonReentrant
        onlyRole(LENDING_ROLE)
    {
        if (amount == 0) revert ZeroAmount();
        if (amount > reserveBalance) revert InsufficientReserveBalance(amount, reserveBalance);

        reserveBalance -= amount;
        usdc.safeTransfer(msg.sender, amount);

        emit LoanWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Accept USDC installment repayment from DuesLending back into the reserve.
     * @dev Caller (DuesLending) must approve this contract to spend `amount` USDC first.
     * @param amount USDC being returned to the reserve
     */
    function depositFromLoan(uint256 amount)
        external
        nonReentrant
        onlyRole(LENDING_ROLE)
    {
        if (amount == 0) revert ZeroAmount();

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        reserveBalance += amount;

        emit LoanRepaid(msg.sender, amount);
    }

    /**
     * @notice Pay dues for a property on behalf of a borrower.
     *         Called by DuesLending after withdrawing the principal; the lending
     *         contract approves this contract to pull the USDC back and record
     *         the dues as paid.
     * @param tokenId Property lot number
     * @param quarters Number of quarters to cover (1-4)
     * @param payer   Address that holds the USDC (DuesLending contract)
     */
    function payDuesFor(uint256 tokenId, uint256 quarters, address payer)
        external
        nonReentrant
        onlyRole(LENDING_ROLE)
    {
        if (quarters == 0 || quarters > 4) revert InvalidPaymentPeriod();

        // CR-05: same ghost-lot guard as payDues
        if (address(propertyNft) != address(0)) {
            try propertyNft.ownerOf(tokenId) returns (address) {} catch {
                revert TokenDoesNotExist(tokenId);
            }
        }

        // No discount, no late fee — loan covers face-value dues
        uint256 amount = quarterlyDuesAmount * quarters;

        usdc.safeTransferFrom(payer, address(this), amount);

        DuesRecord storage record = duesRecords[tokenId];
        uint256 startDate = record.paidThrough > block.timestamp
            ? record.paidThrough
            : block.timestamp;
        record.paidThrough = uint128(startDate + (quarters * 91 days));
        record.totalPaid += uint128(amount);

        uint256 toOperating = amount * operatingReserveSplitBps / 10000;
        uint256 toReserve = amount - toOperating;
        operatingBalance += toOperating;
        reserveBalance += toReserve;

        emit DuesPaidForLoan(tokenId, payer, amount, quarters);
    }

    // ── VendorEscrow Support ──────────────────────────────────────────────────

    /**
     * @notice Accept USDC refund from VendorEscrow and credit the correct fund.
     *         Called when a work order is cancelled or a dispute is resolved in Treasury's favour.
     *         Caller (VendorEscrow) must approve this contract to spend `amount` USDC first.
     * @param amount     USDC being returned from escrow
     * @param isReserve  H-05: true = credit reserveBalance (work order was funded from reserve),
     *                   false = credit operatingBalance (work order was funded from operating)
     */
    function creditRefundFromEscrow(uint256 amount, bool isReserve)
        external
        nonReentrant
        onlyRole(ESCROW_ROLE)
    {
        if (amount == 0) revert ZeroAmount();

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        if (isReserve) {
            reserveBalance += amount;
        } else {
            operatingBalance += amount;
        }

        emit EscrowCreditReceived(msg.sender, amount);
    }

    // ── Donation / Reconciliation ─────────────────────────────────────────────

    /**
     * @notice Sweep untracked USDC (direct transfers, accidental sends, donations)
     *         into the reserve fund so it shows up in accounting.
     * @dev    CR-03: usdc.balanceOf(this) can exceed operatingBalance + reserveBalance
     *         when someone calls usdc.transfer() directly instead of payDues(). Without
     *         reconciliation those funds are invisible to on-chain accounting and drift
     *         forever.  Board (TREASURER_ROLE) or governance (GOVERNOR_ROLE) can sweep.
     */
    function reconcileDonations() external nonReentrant {
        if (!hasRole(TREASURER_ROLE, msg.sender) && !hasRole(GOVERNOR_ROLE, msg.sender)) {
            revert AccessControlUnauthorizedAccount(msg.sender, TREASURER_ROLE);
        }

        uint256 actual = usdc.balanceOf(address(this));
        uint256 tracked = operatingBalance + reserveBalance;
        if (actual <= tracked) return; // nothing to sweep (rounding / zero case)

        uint256 surplus = actual - tracked;
        reserveBalance += surplus;

        emit DonationReconciled(surplus, msg.sender);
    }

    // ── View Functions ───────────────────────────────────────────────────────

    function isDuesCurrent(uint256 tokenId) external view returns (bool) {
        return duesRecords[tokenId].paidThrough >= block.timestamp;
    }

    function getDuesOwed(uint256 tokenId) external view returns (uint256 quartersOwed, uint256 amount) {
        DuesRecord memory record = duesRecords[tokenId];
        if (record.paidThrough >= block.timestamp) return (0, 0);
        if (record.paidThrough == 0) return (1, quarterlyDuesAmount); // Never paid

        uint256 elapsed = block.timestamp - record.paidThrough;
        quartersOwed = (elapsed / 91 days) + 1;
        amount = quartersOwed * quarterlyDuesAmount;
    }

    function getTreasurySnapshot() external view returns (
        uint256 totalBalance,
        uint256 operating,
        uint256 reserve,
        uint256 expenditureCount
    ) {
        totalBalance = usdc.balanceOf(address(this));
        operating = operatingBalance;
        reserve = reserveBalance;
        expenditureCount = expenditures.length;
    }

    function getExpenditure(uint256 expId) external view returns (Expenditure memory) {
        return expenditures[expId];
    }

    function getExpenditureCount() external view returns (uint256) {
        return expenditures.length;
    }
}
