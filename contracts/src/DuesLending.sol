// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DuesLending
 * @notice Community micro-loan program for HOA dues. The treasury's reserve fund
 *         acts as the lender, offering installment plans to members who need
 *         flexibility on their dues payments. No external DeFi protocol needed —
 *         this is a neighbor-helping-neighbor system with on-chain transparency.
 *
 * @dev Lifecycle: REQUEST → ACTIVE → REPAYING → SETTLED (or DEFAULTING → governance)
 *      - Loans pay dues directly to FaircroftTreasury on behalf of the borrower
 *      - PropertyNFT transfer is locked until the loan is settled
 *      - Interest earned flows back to the reserve fund
 *      - Defaults are handled by governance, never automated liquidation
 */
contract DuesLending is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Roles ────────────────────────────────────────────────────────────────

    /// @notice Governance role (Timelock) — can adjust parameters, restructure, write off
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    /// @notice Board role — can flag defaults, trigger reviews
    bytes32 public constant BOARD_ROLE = keccak256("BOARD_ROLE");

    // ── External Contracts ───────────────────────────────────────────────────

    IERC20 public immutable usdc;

    /// @notice PropertyNFT — we check ownership and set transfer locks
    IPropertyNFT public immutable propertyNFT;

    /// @notice FaircroftTreasury — we pay dues on behalf of borrowers
    IFaircroftTreasury public immutable treasury;

    // ── Loan Configuration (DAO-adjustable) ──────────────────────────────────

    /// @notice Annual interest rate in basis points (default: 500 = 5%)
    uint256 public interestRateBps;

    /// @notice Max quarters coverable by a single loan (default: 4)
    uint256 public maxLoanQuarters;

    /// @notice Max installment count (default: 12)
    uint256 public maxInstallments;

    /// @notice Min installment count (default: 2)
    uint256 public minInstallments;

    /// @notice Days between installments (default: 30 days)
    uint256 public installmentPeriod;

    /// @notice Grace period after due date before marking missed (default: 7 days)
    uint256 public gracePeriodSeconds;

    /// @notice Max percentage of reserve fund available for loans (bps, default: 1500 = 15%)
    uint256 public maxLoanPoolBps;

    /// @notice One-time origination fee in basis points (default: 100 = 1%)
    uint256 public originationFeeBps;

    /// @notice Missed payments before loan enters defaulting status
    uint256 public defaultThreshold;

    // ── Loan Data ────────────────────────────────────────────────────────────

    enum LoanStatus { Active, Settled, Defaulting, Restructured, WrittenOff }

    struct Loan {
        uint256 tokenId;           // Property NFT token ID
        address borrower;          // Wallet that took the loan
        uint128 principal;         // Original loan amount (USDC, 6 decimals)
        uint128 totalOwed;         // Principal + interest + origination fee
        uint128 totalPaid;         // Amount repaid so far
        uint128 installmentAmount; // Amount per installment
        uint48  startDate;         // Loan start timestamp
        uint48  nextDueDate;       // Next payment due timestamp
        uint8   installmentsTotal; // Total scheduled installments
        uint8   installmentsPaid;  // Installments completed
        uint8   missedPayments;    // Consecutive missed payments
        LoanStatus status;
    }

    /// @notice All loans ever created (append-only)
    Loan[] public loans;

    /// @notice Active loan per property (tokenId → loanId). 0 = no active loan (loanId is 1-indexed via +1)
    mapping(uint256 tokenId => uint256 loanIdPlusOne) public activeLoanByProperty;

    /// @notice Total USDC currently lent out (outstanding principal)
    uint256 public totalOutstanding;

    /// @notice Total interest earned lifetime
    uint256 public totalInterestEarned;

    // ── Events ───────────────────────────────────────────────────────────────

    event LoanRequested(
        uint256 indexed loanId,
        uint256 indexed tokenId,
        address borrower,
        uint128 principal,
        uint128 totalOwed,
        uint8   installments
    );

    event LoanPayment(
        uint256 indexed loanId,
        address payer,
        uint128 amount,
        uint128 remaining
    );

    event LoanSettled(
        uint256 indexed loanId,
        uint128 totalPaid,
        uint128 interestEarned
    );

    event LoanDefaulting(uint256 indexed loanId, uint8 missedPayments);
    event LoanRestructured(uint256 indexed loanId, uint8 newInstallments, uint128 newInstallmentAmount);
    event LoanWrittenOff(uint256 indexed loanId, uint128 outstandingAmount);
    event ParameterUpdated(string param, uint256 oldValue, uint256 newValue);

    // ── Errors ───────────────────────────────────────────────────────────────

    error NotPropertyOwner();
    error ActiveLoanExists();
    error InvalidQuarters();
    error InvalidInstallments();
    error InsufficientLoanPool();
    error LoanNotActive();
    error PaymentTooSmall();
    error NoActiveLoan();
    error InvalidParameter();

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _propertyNFT,
        address _treasury,
        address _governor,
        address _board
    ) {
        usdc = IERC20(_usdc);
        propertyNFT = IPropertyNFT(_propertyNFT);
        treasury = IFaircroftTreasury(_treasury);

        _grantRole(DEFAULT_ADMIN_ROLE, _governor);
        _grantRole(GOVERNOR_ROLE, _governor);
        _grantRole(BOARD_ROLE, _board);

        // Defaults
        interestRateBps = 500;       // 5% APR
        maxLoanQuarters = 4;
        maxInstallments = 12;
        minInstallments = 2;
        installmentPeriod = 30 days;
        gracePeriodSeconds = 7 days;
        maxLoanPoolBps = 1500;       // 15% of reserve
        originationFeeBps = 100;     // 1% origination fee
        defaultThreshold = 3;        // 3 missed payments → defaulting
    }

    // ── Core: Request Loan ───────────────────────────────────────────────────

    /**
     * @notice Request a loan to cover upcoming dues. The contract pays your dues
     *         immediately, and you repay in installments.
     * @param tokenId Your property NFT token ID
     * @param quarters Number of quarters to cover (1-4)
     * @param installments Number of monthly installments (2-12)
     */
    function requestLoan(
        uint256 tokenId,
        uint256 quarters,
        uint8 installments
    ) external nonReentrant {
        // Ownership check
        if (propertyNFT.ownerOf(tokenId) != msg.sender) revert NotPropertyOwner();

        // No existing active loan
        if (activeLoanByProperty[tokenId] != 0) revert ActiveLoanExists();

        // Validate parameters
        if (quarters == 0 || quarters > maxLoanQuarters) revert InvalidQuarters();
        if (installments < minInstallments || installments > maxInstallments) revert InvalidInstallments();

        // Calculate principal (what the dues cost)
        uint256 principal = treasury.quarterlyDuesAmount() * quarters;

        // Calculate interest (simple interest based on loan duration)
        // Duration in years = (installments * installmentPeriod) / 365 days
        uint256 durationSeconds = uint256(installments) * installmentPeriod;
        uint256 interest = (principal * interestRateBps * durationSeconds) / (10000 * 365 days);

        // Origination fee
        uint256 originationFee = (principal * originationFeeBps) / 10000;

        uint256 totalOwed = principal + interest + originationFee;
        uint256 installmentAmount = totalOwed / installments;
        // Last installment absorbs rounding remainder
        // (handled in makePayment by checking remaining balance)

        // Check loan pool availability
        uint256 available = _loanPoolAvailable();
        if (principal > available) revert InsufficientLoanPool();

        // Create loan
        uint256 loanId = loans.length;
        loans.push(Loan({
            tokenId: tokenId,
            borrower: msg.sender,
            principal: uint128(principal),
            totalOwed: uint128(totalOwed),
            totalPaid: 0,
            installmentAmount: uint128(installmentAmount),
            startDate: uint48(block.timestamp),
            nextDueDate: uint48(block.timestamp + installmentPeriod),
            installmentsTotal: installments,
            installmentsPaid: 0,
            missedPayments: 0,
            status: LoanStatus.Active
        }));

        activeLoanByProperty[tokenId] = loanId + 1; // +1 so 0 = no loan
        totalOutstanding += principal;

        // Lock property transfer
        propertyNFT.setLoanLock(tokenId, true);

        // Withdraw from reserve and pay dues
        treasury.withdrawForLoan(principal);

        // Approve treasury to pull USDC for dues payment
        usdc.approve(address(treasury), principal);
        treasury.payDuesFor(tokenId, quarters, address(this));

        emit LoanRequested(loanId, tokenId, msg.sender, uint128(principal), uint128(totalOwed), installments);
    }

    // ── Core: Make Payment ───────────────────────────────────────────────────

    /**
     * @notice Make a payment on your loan. Can pay any amount ≥ one installment.
     *         Overpayments reduce future obligations. Early payoff welcome.
     * @param loanId The loan ID
     * @param amount USDC amount to pay (6 decimals)
     */
    function makePayment(uint256 loanId, uint256 amount) external nonReentrant {
        Loan storage loan = loans[loanId];
        // SC-04 fix: accept Restructured status — governance restructure must not freeze repayment
        if (loan.status != LoanStatus.Active &&
            loan.status != LoanStatus.Defaulting &&
            loan.status != LoanStatus.Restructured) revert LoanNotActive();

        uint256 remaining = loan.totalOwed - loan.totalPaid;
        if (amount > remaining) amount = remaining; // Don't overpay past total
        if (amount < loan.installmentAmount && amount < remaining) revert PaymentTooSmall();

        // Transfer USDC from payer
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Return funds to treasury reserve
        usdc.approve(address(treasury), amount);
        treasury.depositFromLoan(amount);

        loan.totalPaid += uint128(amount);

        // Count installments covered
        uint256 installmentsCovered = amount / loan.installmentAmount;
        if (installmentsCovered == 0 && amount >= remaining) installmentsCovered = 1;
        loan.installmentsPaid += uint8(installmentsCovered > type(uint8).max ? type(uint8).max : installmentsCovered);
        loan.missedPayments = 0; // Reset on any payment

        // Advance next due date
        loan.nextDueDate = uint48(block.timestamp + installmentPeriod);

        // If defaulting or restructured, return to active on payment
        if (loan.status == LoanStatus.Defaulting || loan.status == LoanStatus.Restructured) {
            loan.status = LoanStatus.Active;
        }

        uint256 newRemaining = loan.totalOwed - loan.totalPaid;
        emit LoanPayment(loanId, msg.sender, uint128(amount), uint128(newRemaining));

        // Check if fully paid
        if (newRemaining == 0) {
            _settleLoan(loanId);
        }
    }

    /**
     * @notice Pay off the entire remaining balance in one transaction.
     * @param loanId The loan ID
     */
    function payOffLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        // SC-04 fix: accept Restructured status — governance restructure must not freeze repayment
        if (loan.status != LoanStatus.Active &&
            loan.status != LoanStatus.Defaulting &&
            loan.status != LoanStatus.Restructured) revert LoanNotActive();

        uint256 remaining = loan.totalOwed - loan.totalPaid;

        usdc.safeTransferFrom(msg.sender, address(this), remaining);
        usdc.approve(address(treasury), remaining);
        treasury.depositFromLoan(remaining);

        loan.totalPaid = loan.totalOwed;
        loan.installmentsPaid = loan.installmentsTotal;
        loan.missedPayments = 0;

        emit LoanPayment(loanId, msg.sender, uint128(remaining), 0);
        _settleLoan(loanId);
    }

    // ── Internal: Settle ─────────────────────────────────────────────────────

    function _settleLoan(uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        loan.status = LoanStatus.Settled;

        uint256 interestEarned = loan.totalPaid - loan.principal;
        totalInterestEarned += interestEarned;
        totalOutstanding -= loan.principal;

        // Unlock property transfer
        propertyNFT.setLoanLock(loan.tokenId, false);
        activeLoanByProperty[loan.tokenId] = 0;

        emit LoanSettled(loanId, loan.totalPaid, uint128(interestEarned));
    }

    // ── Default Management ───────────────────────────────────────────────────

    /**
     * @notice Mark a loan as defaulting if payments are past due. Callable by board.
     * @dev Does NOT liquidate — just flags for governance review.
     */
    function checkDefault(uint256 loanId) external onlyRole(BOARD_ROLE) {
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.Active) revert LoanNotActive();

        // Check if past grace period
        if (block.timestamp <= loan.nextDueDate + gracePeriodSeconds) return;

        loan.missedPayments += 1;

        if (loan.missedPayments >= defaultThreshold) {
            loan.status = LoanStatus.Defaulting;
            emit LoanDefaulting(loanId, loan.missedPayments);
        }
    }

    // ── Governance: Restructure & Write-Off ──────────────────────────────────

    /**
     * @notice Restructure a loan with more installments (extend term).
     *         Only governance can do this — typically after a default.
     */
    function restructureLoan(uint256 loanId, uint8 newInstallments) external onlyRole(GOVERNOR_ROLE) {
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.Active && loan.status != LoanStatus.Defaulting) revert LoanNotActive();
        if (newInstallments <= loan.installmentsTotal) revert InvalidInstallments();

        uint256 remaining = loan.totalOwed - loan.totalPaid;
        uint256 remainingInstallments = newInstallments - loan.installmentsPaid;
        uint128 newAmount = uint128(remaining / remainingInstallments);

        loan.installmentsTotal = newInstallments;
        loan.installmentAmount = newAmount;
        loan.missedPayments = 0;
        loan.status = LoanStatus.Restructured;
        loan.nextDueDate = uint48(block.timestamp + installmentPeriod);

        emit LoanRestructured(loanId, newInstallments, newAmount);
    }

    /**
     * @notice Write off a loan as unrecoverable. Only governance.
     *         The outstanding amount is absorbed by the reserve fund.
     */
    function writeOffLoan(uint256 loanId) external onlyRole(GOVERNOR_ROLE) {
        Loan storage loan = loans[loanId];
        if (loan.status == LoanStatus.Settled || loan.status == LoanStatus.WrittenOff) revert LoanNotActive();

        uint128 outstanding = loan.totalOwed - loan.totalPaid;
        loan.status = LoanStatus.WrittenOff;
        totalOutstanding -= loan.principal > loan.totalPaid ? loan.principal - loan.totalPaid : 0;

        // Unlock property transfer
        propertyNFT.setLoanLock(loan.tokenId, false);
        activeLoanByProperty[loan.tokenId] = 0;

        emit LoanWrittenOff(loanId, outstanding);
    }

    // ── Views ────────────────────────────────────────────────────────────────

    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    function getActiveLoan(uint256 tokenId) external view returns (uint256 loanId, Loan memory loan) {
        uint256 stored = activeLoanByProperty[tokenId];
        if (stored == 0) revert NoActiveLoan();
        loanId = stored - 1;
        loan = loans[loanId];
    }

    function getLoanCount() external view returns (uint256) {
        return loans.length;
    }

    function getLoanPoolAvailable() external view returns (uint256) {
        return _loanPoolAvailable();
    }

    function canBorrow(uint256 tokenId) external view returns (bool eligible, string memory reason) {
        if (activeLoanByProperty[tokenId] != 0) return (false, "Active loan exists");
        try propertyNFT.ownerOf(tokenId) returns (address) {
            // Owner exists
        } catch {
            return (false, "Invalid property");
        }
        if (_loanPoolAvailable() < treasury.quarterlyDuesAmount()) return (false, "Insufficient loan pool");
        return (true, "");
    }

    /**
     * @notice Calculate loan terms for a given quarters + installments combo.
     *         Pure view — no state changes. Use for frontend calculators.
     */
    function calculateLoanTerms(
        uint256 quarters,
        uint8 installments
    ) external view returns (
        uint256 principal,
        uint256 interest,
        uint256 originationFee,
        uint256 totalOwed,
        uint256 installmentAmount
    ) {
        principal = treasury.quarterlyDuesAmount() * quarters;
        uint256 durationSeconds = uint256(installments) * installmentPeriod;
        interest = (principal * interestRateBps * durationSeconds) / (10000 * 365 days);
        originationFee = (principal * originationFeeBps) / 10000;
        totalOwed = principal + interest + originationFee;
        installmentAmount = totalOwed / installments;
    }

    function _loanPoolAvailable() internal view returns (uint256) {
        uint256 reserveBalance = treasury.reserveBalance();
        uint256 maxPool = (reserveBalance * maxLoanPoolBps) / 10000;
        return maxPool > totalOutstanding ? maxPool - totalOutstanding : 0;
    }

    // ── Governance: Parameter Updates ────────────────────────────────────────

    function setInterestRate(uint256 newBps) external onlyRole(GOVERNOR_ROLE) {
        if (newBps > 2000) revert InvalidParameter();
        emit ParameterUpdated("interestRateBps", interestRateBps, newBps);
        interestRateBps = newBps;
    }

    function setMaxLoanPool(uint256 newBps) external onlyRole(GOVERNOR_ROLE) {
        if (newBps > 5000) revert InvalidParameter();
        emit ParameterUpdated("maxLoanPoolBps", maxLoanPoolBps, newBps);
        maxLoanPoolBps = newBps;
    }

    function setOriginationFee(uint256 newBps) external onlyRole(GOVERNOR_ROLE) {
        if (newBps > 500) revert InvalidParameter();
        emit ParameterUpdated("originationFeeBps", originationFeeBps, newBps);
        originationFeeBps = newBps;
    }

    function setInstallmentLimits(uint256 min, uint256 max) external onlyRole(GOVERNOR_ROLE) {
        if (min < 1 || max > 24 || min >= max) revert InvalidParameter();
        emit ParameterUpdated("minInstallments", minInstallments, min);
        emit ParameterUpdated("maxInstallments", maxInstallments, max);
        minInstallments = min;
        maxInstallments = max;
    }

    function setInstallmentPeriod(uint256 newPeriod) external onlyRole(GOVERNOR_ROLE) {
        if (newPeriod < 14 days || newPeriod > 90 days) revert InvalidParameter();
        emit ParameterUpdated("installmentPeriod", installmentPeriod, newPeriod);
        installmentPeriod = newPeriod;
    }

    function setGracePeriod(uint256 newPeriod) external onlyRole(GOVERNOR_ROLE) {
        if (newPeriod > 30 days) revert InvalidParameter();
        emit ParameterUpdated("gracePeriodSeconds", gracePeriodSeconds, newPeriod);
        gracePeriodSeconds = newPeriod;
    }

    function setDefaultThreshold(uint256 newThreshold) external onlyRole(GOVERNOR_ROLE) {
        if (newThreshold < 1 || newThreshold > 12) revert InvalidParameter();
        emit ParameterUpdated("defaultThreshold", defaultThreshold, newThreshold);
        defaultThreshold = newThreshold;
    }
}

// ── Interfaces ───────────────────────────────────────────────────────────────

interface IPropertyNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function setLoanLock(uint256 tokenId, bool locked) external;
}

interface IFaircroftTreasury {
    function quarterlyDuesAmount() external view returns (uint256);
    function reserveBalance() external view returns (uint256);
    function payDuesFor(uint256 tokenId, uint256 quarters, address payer) external;
    function withdrawForLoan(uint256 amount) external;
    function depositFromLoan(uint256 amount) external;
}
