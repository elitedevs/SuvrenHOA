# CODE APPENDIX — SuvrenHOA Smart Contracts

**Inventor:** Ryan Shanahan  
**Assignee:** Suvren LLC  
**Application:** Blockchain-Based Homeowners Association Governance System  
**Date Prepared:** April 2026

---

> This appendix contains the complete source code of the SuvrenHOA smart contract system as filed with the provisional patent application. All contracts are written in Solidity ^0.8.24 and deploy to Base L2 (Ethereum Layer 2). Source code is provided for reference to support the claimed invention.

---

## APPENDIX A-1: PropertyNFT.sol

**Description:** ERC-721 soulbound token representing property ownership in a homeowners association. Each lot receives exactly one NFT with transfer restrictions, on-chain voting power, and timestamp-based clock mode for L2 compatibility.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/governance/utils/Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title PropertyNFT
 * @notice ERC-721 token representing property ownership in Faircroft HOA.
 *         Each lot gets exactly one NFT. The NFT carries voting power (1 NFT = 1 vote)
 *         and is transfer-restricted (soulbound except during verified property sales).
 * @dev Inherits ERC721Enumerable for totalSupply/tokenByIndex, Votes for governance,
 *      and AccessControl for role-based permissions.
 *      Uses TIMESTAMP-based clock mode (EIP-6372) — critical for L2 deployment.
 */
contract PropertyNFT is ERC721, ERC721Enumerable, Votes, AccessControl {
    // ── Roles ────────────────────────────────────────────────────────────────

    /// @notice Role for minting NFTs and approving transfers (board multisig)
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    /// @notice Role for governance operations (Governor contract via Timelock)
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    // ── Immutables ───────────────────────────────────────────────────────────

    /// @notice Maximum number of lots in the community (set at deploy, cannot change)
    uint256 public immutable maxLots;

    // ── Configuration ────────────────────────────────────────────────────────

    /// @notice Whether transfers require board approval (default: true)
    bool public transfersRequireApproval;

    /// @notice Whether new mints auto-delegate to self (default: true)
    bool public autoDelegateOnMint;

    // ── Property Data ────────────────────────────────────────────────────────

    struct PropertyInfo {
        uint64  lotNumber;         // 1-indexed lot number
        uint64  squareFootage;     // Optional metadata
        uint128 lastDuesTimestamp;  // Last dues payment timestamp (set by Treasury)
        string  streetAddress;      // "123 Faircroft Dr"
    }

    /// @notice Property data keyed by tokenId (tokenId == lotNumber)
    mapping(uint256 tokenId => PropertyInfo) public properties;

    // ── Transfer Control ─────────────────────────────────────────────────────

    /// @notice Pending transfer approvals: tokenId → approved buyer address
    mapping(uint256 tokenId => address approvedBuyer) public pendingTransfers;

    // ── Counters ─────────────────────────────────────────────────────────────

    /// @notice Total properties ever minted (never decremented)
    uint256 private _totalMinted;

    // ── Events ───────────────────────────────────────────────────────────────

    event PropertyMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint64 lotNumber,
        string streetAddress
    );

    event TransferApproved(
        uint256 indexed tokenId,
        address indexed currentOwner,
        address indexed approvedBuyer
    );

    event TransferApprovalRevoked(uint256 indexed tokenId);

    event DuesStatusUpdated(
        uint256 indexed tokenId,
        uint128 lastDuesTimestamp
    );

    event ConfigUpdated(string parameter, bool value);

    // ── Errors ───────────────────────────────────────────────────────────────

    error MaxLotsReached(uint256 maxLots);
    error LotAlreadyMinted(uint256 lotNumber);
    error TransferNotApproved(uint256 tokenId);
    error InvalidLotNumber(uint256 lotNumber);
    error ZeroAddress();
    error TokenDoesNotExist(uint256 tokenId);

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(
        uint256 _maxLots,
        string memory _name,   // "Faircroft Property"
        string memory _symbol  // "FAIR"
    ) ERC721(_name, _symbol) EIP712(_name, "1") {
        if (_maxLots == 0) revert InvalidLotNumber(0);

        maxLots = _maxLots;
        transfersRequireApproval = true;
        autoDelegateOnMint = true;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }

    // ── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Mint a property NFT for a verified homeowner
     * @dev Only callable by REGISTRAR_ROLE. Auto-delegates to owner if enabled.
     * @param to The property owner's wallet address
     * @param lotNumber The lot number (1-indexed, must be <= maxLots)
     * @param streetAddress Human-readable street address
     * @param sqft Square footage of the property
     * @return tokenId The minted token ID (== lotNumber)
     */
    function mintProperty(
        address to,
        uint64 lotNumber,
        string calldata streetAddress,
        uint64 sqft
    ) external onlyRole(REGISTRAR_ROLE) returns (uint256) {
        if (to == address(0)) revert ZeroAddress();
        if (lotNumber == 0 || lotNumber > maxLots) revert InvalidLotNumber(lotNumber);
        if (_ownerOf(lotNumber) != address(0)) revert LotAlreadyMinted(lotNumber);

        uint256 tokenId = lotNumber;
        _safeMint(to, tokenId);
        _totalMinted++;

        properties[tokenId] = PropertyInfo({
            lotNumber: lotNumber,
            streetAddress: streetAddress,
            squareFootage: sqft,
            lastDuesTimestamp: 0
        });

        // Auto-delegate to self so voting power is immediately active.
        // Without this, OZ ERC721Votes requires explicit delegate(self) before
        // voting power activates — terrible UX for non-crypto users.
        // Cost: ~25K extra gas (~$0.0005 on Base). Worth it.
        if (autoDelegateOnMint) {
            _delegate(to, to);
        }

        emit PropertyMinted(tokenId, to, lotNumber, streetAddress);
        return tokenId;
    }

    /**
     * @notice Board approves a property sale transfer
     * @dev Called when a property sale closes. The new owner must then call safeTransferFrom.
     * @param tokenId The lot being transferred
     * @param newOwner The verified buyer's wallet address
     */
    function approveTransfer(
        uint256 tokenId,
        address newOwner
    ) external onlyRole(REGISTRAR_ROLE) {
        if (newOwner == address(0)) revert ZeroAddress();
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);

        pendingTransfers[tokenId] = newOwner;
        emit TransferApproved(tokenId, ownerOf(tokenId), newOwner);
    }

    /**
     * @notice Revoke a pending transfer approval
     */
    function revokeTransferApproval(uint256 tokenId) external onlyRole(REGISTRAR_ROLE) {
        delete pendingTransfers[tokenId];
        emit TransferApprovalRevoked(tokenId);
    }

    /**
     * @notice Update the dues payment timestamp for a property
     * @dev Only callable by GOVERNOR_ROLE (Treasury via Timelock)
     */
    function updateDuesStatus(
        uint256 tokenId,
        uint128 timestamp
    ) external onlyRole(GOVERNOR_ROLE) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        properties[tokenId].lastDuesTimestamp = timestamp;
        emit DuesStatusUpdated(tokenId, timestamp);
    }

    /**
     * @notice Update contract configuration via governance
     */
    function setTransfersRequireApproval(bool value) external onlyRole(GOVERNOR_ROLE) {
        transfersRequireApproval = value;
        emit ConfigUpdated("transfersRequireApproval", value);
    }

    function setAutoDelegateOnMint(bool value) external onlyRole(GOVERNOR_ROLE) {
        autoDelegateOnMint = value;
        emit ConfigUpdated("autoDelegateOnMint", value);
    }

    // ── View Functions ───────────────────────────────────────────────────────

    /// @notice Get full property info for a token
    function getProperty(uint256 tokenId) external view returns (PropertyInfo memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return properties[tokenId];
    }

    /// @notice Check if a property transfer is pending
    function isTransferPending(uint256 tokenId) external view returns (bool, address) {
        address buyer = pendingTransfers[tokenId];
        return (buyer != address(0), buyer);
    }

    /// @notice Total properties currently minted (active)
    function totalMinted() external view returns (uint256) {
        return _totalMinted;
    }

    /// @notice Check if a specific lot has been minted
    function lotExists(uint64 lotNumber) external view returns (bool) {
        return _ownerOf(lotNumber) != address(0);
    }

    // ── EIP-6372: Timestamp-Based Clock ──────────────────────────────────────
    // CRITICAL: On L2s (Base/Optimism), block.number is unreliable.
    // We use block.timestamp for all voting power checkpoints.

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // ── Internal Overrides ───────────────────────────────────────────────────

    /**
     * @dev Override to enforce soulbound transfer restrictions.
     *      Allows minting (from == 0) freely. Blocks all other transfers
     *      unless approved by board. Burns are not supported.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);

        // Minting: no restriction
        if (from != address(0) && transfersRequireApproval) {
            // Burning: not supported
            if (to == address(0)) revert TransferNotApproved(tokenId);

            // Transfer: must be approved and to the correct buyer
            address approvedBuyer = pendingTransfers[tokenId];
            if (approvedBuyer == address(0) || approvedBuyer != to) {
                revert TransferNotApproved(tokenId);
            }

            // Clear the approval after use
            delete pendingTransfers[tokenId];
        }

        // Execute the actual transfer/mint (ERC721Enumerable._update)
        address previousOwner = super._update(to, tokenId, auth);

        // Track voting units for Votes checkpointing
        // This is what ERC721Votes does internally — we must call it manually
        // since we inherit Votes directly instead of ERC721Votes
        _transferVotingUnits(from, to, 1);

        // Auto-delegate new owner AFTER transfer completes (not on mint — handled in mintProperty)
        if (from != address(0) && to != address(0) && autoDelegateOnMint) {
            _delegate(to, to);
        }

        return previousOwner;
    }

    function _increaseBalance(
        address account,
        uint128 amount
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }

    /**
     * @dev Voting units = number of NFTs held by account (1 NFT = 1 vote)
     */
    function _getVotingUnits(address account) internal view virtual override returns (uint256) {
        return balanceOf(account);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

---

## APPENDIX A-2: FaircroftGovernor.sol

**Description:** On-chain governance contract implementing tiered proposal categories (Routine, Financial, Governance, Constitutional) with category-specific quorum requirements and supermajority thresholds. Uses timestamp-based clock mode for Base L2 compatibility.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorProposalGuardian.sol";

/**
 * @title FaircroftGovernor
 * @notice On-chain governance for Faircroft HOA. Homeowners create proposals,
 *         vote on them, and approved proposals execute through the Timelock.
 *         Supports four proposal categories with different quorum and threshold requirements.
 * @dev Key customizations over standard OZ Governor:
 *      1. Per-category quorum (not single GovernorVotesQuorumFraction)
 *      2. Supermajority threshold for Constitutional proposals (2/3)
 *      3. Timestamp-based clock mode (critical for Base L2)
 *      4. Board can cancel via ProposalGuardian
 *      5. Rate limiting on active proposals
 */
contract FaircroftGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorTimelockControl,
    GovernorProposalGuardian
{
    // ── Types ────────────────────────────────────────────────────────────────

    enum ProposalCategory {
        Routine,        // 0 — 15% quorum, simple majority, 2-day timelock
        Financial,      // 1 — 33% quorum, simple majority, 4-day timelock
        Governance,     // 2 — 51% quorum, simple majority, 4-day timelock
        Constitutional  // 3 — 67% quorum, 2/3 supermajority, 7-day timelock
    }

    // ── State ────────────────────────────────────────────────────────────────

    /// @notice Category assigned to each proposal
    mapping(uint256 proposalId => ProposalCategory) public proposalCategories;

    /// @notice Quorum percentage per category (in basis points, 10000 = 100%)
    mapping(ProposalCategory => uint256) public categoryQuorumBps;

    /// @notice Pass threshold per category (bps). 5000 = simple majority, 6667 = 2/3
    mapping(ProposalCategory => uint256) public categoryThresholdBps;

    /// @notice IPFS CID with full proposal text + supporting documents
    mapping(uint256 proposalId => string) public proposalMetadataUri;

    /// @notice Maximum concurrent active proposals
    uint256 public maxActiveProposals;

    /// @notice Current count of active proposals
    uint256 public activeProposalCount;

    // ── Events ───────────────────────────────────────────────────────────────

    event ProposalCategorized(
        uint256 indexed proposalId,
        ProposalCategory category,
        string metadataUri
    );

    event QuorumUpdated(ProposalCategory category, uint256 oldBps, uint256 newBps);
    event ThresholdUpdated(ProposalCategory category, uint256 oldBps, uint256 newBps);
    event MaxActiveProposalsUpdated(uint256 oldMax, uint256 newMax);

    // ── Errors ───────────────────────────────────────────────────────────────

    error TooManyActiveProposals(uint256 max);
    error InvalidBps(uint256 bps);

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(
        IVotes _propertyNFT,
        TimelockController _timelock,
        address _proposalGuardian  // Board multisig — can cancel proposals
    )
        Governor("FaircroftGovernor")
        GovernorSettings(
            1 days,  // votingDelay: 1 day review period
            7 days,  // votingPeriod: 7 days to vote (seconds, timestamp mode)
            1        // proposalThreshold: must own 1 NFT to propose
        )
        GovernorVotes(_propertyNFT)
        GovernorTimelockControl(_timelock)
    {
        _setProposalGuardian(_proposalGuardian);
        // Default quorum percentages
        categoryQuorumBps[ProposalCategory.Routine] = 1500;        // 15%
        categoryQuorumBps[ProposalCategory.Financial] = 3300;      // 33%
        categoryQuorumBps[ProposalCategory.Governance] = 5100;     // 51%
        categoryQuorumBps[ProposalCategory.Constitutional] = 6700; // 67%

        // Default pass thresholds
        categoryThresholdBps[ProposalCategory.Routine] = 5000;        // >50%
        categoryThresholdBps[ProposalCategory.Financial] = 5000;      // >50%
        categoryThresholdBps[ProposalCategory.Governance] = 5000;     // >50%
        categoryThresholdBps[ProposalCategory.Constitutional] = 6667; // >66.67%

        maxActiveProposals = 10;
    }

    // ── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Create a proposal with a specific governance category
     * @param targets Contract addresses to call on execution
     * @param values ETH values to send (usually 0 for USDC operations)
     * @param calldatas Encoded function calls
     * @param description Human-readable description
     * @param category Governance category determining quorum/threshold
     * @param metadataUri IPFS CID with full proposal text
     * @return proposalId The unique proposal identifier
     */
    function proposeWithCategory(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalCategory category,
        string memory metadataUri
    ) public returns (uint256) {
        if (activeProposalCount >= maxActiveProposals) {
            revert TooManyActiveProposals(maxActiveProposals);
        }

        uint256 proposalId = propose(targets, values, calldatas, description);
        proposalCategories[proposalId] = category;
        proposalMetadataUri[proposalId] = metadataUri;
        activeProposalCount++;

        emit ProposalCategorized(proposalId, category, metadataUri);
        return proposalId;
    }

    // ── Quorum Overrides ─────────────────────────────────────────────────────

    /**
     * @notice Default quorum (for proposals created via standard propose())
     * @dev Uses Routine category (15%) as fallback
     */
    function quorum(uint256 timepoint)
        public view override(Governor) returns (uint256)
    {
        uint256 totalWeight = token().getPastTotalSupply(timepoint);
        return (totalWeight * 1500) / 10000; // 15% default
    }

    /**
     * @notice Get required quorum for a specific proposal
     */
    function proposalQuorum(uint256 proposalId) public view returns (uint256) {
        ProposalCategory category = proposalCategories[proposalId];
        uint256 snapshot = proposalSnapshot(proposalId);
        uint256 totalWeight = token().getPastTotalSupply(snapshot);
        return (totalWeight * categoryQuorumBps[category]) / 10000;
    }

    // ── Custom Vote Counting ─────────────────────────────────────────────────

    /**
     * @notice Check if quorum has been reached for a specific proposal
     * @dev Uses per-category quorum instead of global
     */
    function _quorumReached(uint256 proposalId)
        internal view override(Governor, GovernorCountingSimple)
        returns (bool)
    {
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = proposalVotes(proposalId);
        uint256 totalVotes = forVotes + againstVotes + abstainVotes;
        return totalVotes >= proposalQuorum(proposalId);
    }

    /**
     * @notice Check if a proposal has succeeded (threshold check)
     * @dev Supports supermajority for Constitutional proposals
     */
    function _voteSucceeded(uint256 proposalId)
        internal view override(Governor, GovernorCountingSimple)
        returns (bool)
    {
        (uint256 againstVotes, uint256 forVotes, ) = proposalVotes(proposalId);
        ProposalCategory category = proposalCategories[proposalId];
        uint256 thresholdBps = categoryThresholdBps[category];

        uint256 totalCast = forVotes + againstVotes;
        if (totalCast == 0) return false;

        // For > threshold% of (for + against) votes
        return (forVotes * 10000) > (thresholdBps * totalCast);
    }

    // ── Governance-Updatable Parameters ──────────────────────────────────────

    /**
     * @notice Update quorum for a category (only via governance)
     */
    function updateCategoryQuorum(ProposalCategory category, uint256 newBps)
        external onlyGovernance
    {
        if (newBps > 10000) revert InvalidBps(newBps);
        emit QuorumUpdated(category, categoryQuorumBps[category], newBps);
        categoryQuorumBps[category] = newBps;
    }

    /**
     * @notice Update pass threshold for a category (only via governance)
     */
    function updateCategoryThreshold(ProposalCategory category, uint256 newBps)
        external onlyGovernance
    {
        if (newBps > 10000) revert InvalidBps(newBps);
        emit ThresholdUpdated(category, categoryThresholdBps[category], newBps);
        categoryThresholdBps[category] = newBps;
    }

    /**
     * @notice Update max active proposals (only via governance)
     */
    function updateMaxActiveProposals(uint256 newMax) external onlyGovernance {
        emit MaxActiveProposalsUpdated(maxActiveProposals, newMax);
        maxActiveProposals = newMax;
    }

    // ── EIP-6372: Timestamp Clock ────────────────────────────────────────────

    function clock()
        public view override(Governor, GovernorVotes)
        returns (uint48)
    {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE()
        public pure override(Governor, GovernorVotes)
        returns (string memory)
    {
        return "mode=timestamp";
    }

    // ── Required Overrides (Solidity diamond) ────────────────────────────────

    function votingDelay()
        public view override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public view override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function proposalThreshold()
        public view override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId)
        public view override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public view override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal override(Governor, GovernorTimelockControl)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal override(Governor, GovernorTimelockControl)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal view override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function _validateCancel(uint256 proposalId, address caller)
        internal view override(Governor, GovernorProposalGuardian)
        returns (bool)
    {
        return super._validateCancel(proposalId, caller);
    }
}
```

---

## APPENDIX A-3: FaircroftTreasury.sol

**Description:** Community treasury holding all funds in USDC. Implements automated operating/reserve fund splits (80/20), dues collection with late fees, board emergency spending with period limits, and governance-approved expenditures. Every transaction is permanently recorded on-chain.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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

    // ── Immutables ───────────────────────────────────────────────────────────

    /// @notice USDC token contract (6 decimals on Base)
    IERC20 public immutable usdc;

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

    // ── Errors ───────────────────────────────────────────────────────────────

    error InvalidPaymentPeriod();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientOperatingBalance(uint256 requested, uint256 available);
    error InsufficientReserveBalance(uint256 requested, uint256 available);
    error EmergencyLimitExceeded(uint256 requested, uint256 remaining);
    error InvalidBps(uint256 bps);

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
```

---

## APPENDIX A-4: DocumentRegistry.sol

**Description:** Append-only on-chain registry of HOA documents. Stores SHA-256 content hashes with references to Arweave transaction IDs and IPFS CIDs, enabling tamper-proof document verification by any party without trust in a central authority.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DocumentRegistry
 * @notice Append-only registry of HOA documents. Stores SHA-256 content hashes
 *         on-chain with references to Arweave transaction IDs and IPFS CIDs.
 *         Provides tamper-proof verification — anyone can download a document
 *         from Arweave, hash it, and compare to the on-chain record.
 * @dev Intentionally simple and immutable. Documents are append-only —
 *      once registered, they cannot be modified or deleted. This is the whole point.
 */
contract DocumentRegistry is AccessControl {
    // ── Roles ────────────────────────────────────────────────────────────────

    /// @notice Role for registering documents (board multisig + Timelock)
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    // ── Types ────────────────────────────────────────────────────────────────

    enum DocType {
        CCR,            // 0 — Covenants, Conditions & Restrictions
        Minutes,        // 1 — Meeting minutes
        Budget,         // 2 — Annual/quarterly budget
        Amendment,      // 3 — CC&R or bylaw amendment
        Resolution,     // 4 — Board resolution
        Financial,      // 5 — Financial report/audit
        Architectural,  // 6 — Architectural guidelines
        Notice,         // 7 — Community notices
        Election,       // 8 — Election results
        Other           // 9 — Catch-all
    }

    struct Document {
        bytes32 contentHash;    // SHA-256 hash of document bytes
        uint48  timestamp;      // When registered on-chain
        uint48  supersedes;     // docId this replaces (0 = none / original)
        DocType docType;
        address uploadedBy;
        string  arweaveTxId;    // Arweave transaction ID (43 chars)
        string  ipfsCid;        // IPFS CID v1 for fast retrieval
        string  title;          // Human-readable title
    }

    // ── Storage ──────────────────────────────────────────────────────────────

    /// @notice All registered documents. docId == array index.
    Document[] public documents;

    /// @notice Lookup docId by content hash
    mapping(bytes32 contentHash => uint256 docId) public hashToDocId;

    /// @notice Whether a content hash has been registered
    mapping(bytes32 contentHash => bool) public hashExists;

    // ── Events ───────────────────────────────────────────────────────────────

    event DocumentRegistered(
        uint256 indexed docId,
        bytes32 indexed contentHash,
        DocType indexed docType,
        string  title,
        string  arweaveTxId,
        address uploadedBy
    );

    event DocumentSuperseded(
        uint256 indexed newDocId,
        uint256 indexed oldDocId
    );

    // ── Errors ───────────────────────────────────────────────────────────────

    error DocumentAlreadyRegistered(bytes32 contentHash);
    error EmptyContentHash();
    error EmptyArweaveId();
    error EmptyTitle();
    error InvalidDocId(uint256 docId);
    error InvalidSupersedes(uint256 docId);

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RECORDER_ROLE, msg.sender);
    }

    // ── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Register a new document hash with storage references
     * @param contentHash SHA-256 hash of the raw document bytes
     * @param arweaveTxId Arweave transaction ID (permanent storage)
     * @param ipfsCid IPFS Content ID for fast retrieval (optional)
     * @param docType Category of document
     * @param title Human-readable document title
     * @param supersedes DocId this document replaces (0 if original/none)
     * @return docId The assigned document ID
     */
    /// @dev Packed input struct to avoid stack-too-deep
    struct RegisterParams {
        bytes32 contentHash;
        string  arweaveTxId;
        string  ipfsCid;
        DocType docType;
        string  title;
        uint256 supersedes;
    }

    function registerDocument(
        bytes32 contentHash,
        string calldata arweaveTxId,
        string calldata ipfsCid,
        DocType docType,
        string calldata title,
        uint256 supersedes
    ) external onlyRole(RECORDER_ROLE) returns (uint256) {
        return _register(RegisterParams({
            contentHash: contentHash,
            arweaveTxId: arweaveTxId,
            ipfsCid: ipfsCid,
            docType: docType,
            title: title,
            supersedes: supersedes
        }));
    }

    function _register(RegisterParams memory p) internal returns (uint256) {
        if (p.contentHash == bytes32(0)) revert EmptyContentHash();
        if (bytes(p.arweaveTxId).length == 0) revert EmptyArweaveId();
        if (bytes(p.title).length == 0) revert EmptyTitle();
        if (hashExists[p.contentHash]) revert DocumentAlreadyRegistered(p.contentHash);
        if (p.supersedes > 0 && p.supersedes >= documents.length) revert InvalidSupersedes(p.supersedes);

        uint256 docId = documents.length;
        documents.push(Document({
            contentHash: p.contentHash,
            timestamp: uint48(block.timestamp),
            supersedes: uint48(p.supersedes),
            docType: p.docType,
            uploadedBy: msg.sender,
            arweaveTxId: p.arweaveTxId,
            ipfsCid: p.ipfsCid,
            title: p.title
        }));

        hashExists[p.contentHash] = true;
        hashToDocId[p.contentHash] = docId;

        emit DocumentRegistered(docId, p.contentHash, p.docType, p.title, p.arweaveTxId, msg.sender);

        if (p.supersedes > 0) {
            emit DocumentSuperseded(docId, p.supersedes);
        }

        return docId;
    }

    // ── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Verify a document by its content hash
     * @param contentHash SHA-256 hash to look up
     * @return exists Whether the hash is registered
     * @return docId The document ID (only valid if exists == true)
     * @return doc The full document record
     */
    function verifyDocument(bytes32 contentHash) external view returns (
        bool exists,
        uint256 docId,
        Document memory doc
    ) {
        if (!hashExists[contentHash]) return (false, 0, doc);
        docId = hashToDocId[contentHash];
        return (true, docId, documents[docId]);
    }

    /**
     * @notice Get a document by its ID
     */
    function getDocument(uint256 docId) external view returns (Document memory) {
        if (docId >= documents.length) revert InvalidDocId(docId);
        return documents[docId];
    }

    /**
     * @notice Total number of registered documents
     */
    function getDocumentCount() external view returns (uint256) {
        return documents.length;
    }

    /**
     * @notice Get all document IDs of a specific type
     * @dev O(n) scan — fine for small document sets (<1000). Use indexer for large sets.
     */
    function getDocumentsByType(DocType docType) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < documents.length; i++) {
            if (documents[i].docType == docType) count++;
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < documents.length; i++) {
            if (documents[i].docType == docType) {
                result[idx++] = i;
            }
        }
        return result;
    }

    /**
     * @notice Get the latest version of a document chain
     * @dev Follows supersedes chain forward to find the newest version.
     *      O(n) scan — fine for small sets. Indexer handles this for frontend.
     */
    function getLatestVersion(uint256 docId) external view returns (uint256) {
        if (docId >= documents.length) revert InvalidDocId(docId);
        uint256 latest = docId;
        for (uint256 i = docId + 1; i < documents.length; i++) {
            // Skip docs with supersedes=0 (means "no supersession") unless we're tracking docId>0
            uint48 sup = documents[i].supersedes;
            if (sup > 0 && sup == uint48(latest)) {
                latest = i;
            }
        }
        return latest;
    }
}
```

---

## APPENDIX A-5: DuesLending.sol

**Description:** Community micro-loan program enabling HOA members to finance dues payments via installment plans funded by the treasury reserve. Implements loan lifecycle management (REQUEST → ACTIVE → REPAYING → SETTLED), property transfer locks during outstanding loans, and governance-controlled default resolution without automated liquidation.

```solidity
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
        if (loan.status != LoanStatus.Active && loan.status != LoanStatus.Defaulting) revert LoanNotActive();

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

        // If defaulting, return to active on payment
        if (loan.status == LoanStatus.Defaulting) {
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
        if (loan.status != LoanStatus.Active && loan.status != LoanStatus.Defaulting) revert LoanNotActive();

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
```

---

## APPENDIX A-6: TreasuryYield.sol

**Description:** Yield generation module that deploys idle HOA reserve funds into Aave V3 lending protocol to earn interest. Implements governance-controlled risk tolerance levels (Conservative 30%, Moderate 50%, Aggressive 80% of reserve), automatic yield harvesting, and emergency withdrawal capabilities.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FaircroftTreasury.sol";

// ── Aave V3 Minimal Interfaces ─────────────────────────────────────────────────

/// @notice Minimal IPool interface for Aave V3 supply/withdraw
interface IPool {
    /// @notice Supply an asset into Aave
    /// @param asset     The ERC-20 address of the asset to supply
    /// @param amount    Amount to supply (in asset decimals)
    /// @param onBehalfOf  Who will receive the aTokens
    /// @param referralCode  Referral code (0 for none)
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    /// @notice Withdraw an asset from Aave
    /// @param asset   The ERC-20 address
    /// @param amount  Amount to withdraw (use type(uint256).max for full balance)
    /// @param to      Recipient of the withdrawn USDC
    /// @return        Actual amount withdrawn
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/// @notice Minimal IAToken interface (Aave receipt token)
interface IAToken {
    /// @notice Returns the aToken balance — includes accrued yield
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title TreasuryYield
 * @notice Deploys idle SuvrenHOA reserve funds into Aave V3 to earn yield.
 *         Board (TREASURER_ROLE) controls deposit/withdraw operations.
 *         Governance (GOVERNOR_ROLE via Timelock) controls risk tolerance.
 *         Anyone can call harvestYield() to sweep accrued interest back to Treasury.
 *
 * @dev Integration pattern:
 *      1. Treasury grants this contract YIELD_MANAGER_ROLE
 *      2. Treasurer calls depositToAave() — pulls USDC from Treasury → supplies to Aave
 *      3. aUSDC grows in value over time (Aave rebasing)
 *      4. harvestYield() sweeps surplus (aUSDC.balance - deposited) back to Treasury
 *      5. Treasurer calls withdrawFromAave() to return principal to Treasury
 *
 * Architecture notes:
 *  - `depositedAmount` tracks principal only (what we sent to Aave)
 *  - `aUSDC.balanceOf(address(this))` always reflects current value (principal + yield)
 *  - Yield = aUSDC.balance - depositedAmount
 *  - Risk tolerance caps the max percentage of Treasury.reserveBalance that can be deployed
 */
contract TreasuryYield is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Roles ──────────────────────────────────────────────────────────────────

    /// @notice Role for governance-approved operations (Timelock)
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    /// @notice Role for operational tasks (board multisig)
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    // ── Risk Levels ────────────────────────────────────────────────────────────

    /**
     * @notice Risk tolerance levels controlling maximum Aave deployment percentage
     * @dev conservative = 30%, moderate = 50%, aggressive = 80% of reserve
     */
    enum RiskLevel {
        Conservative, // max 30% of reserve in Aave
        Moderate,     // max 50% of reserve in Aave
        Aggressive    // max 80% of reserve in Aave
    }

    // ── Immutables ─────────────────────────────────────────────────────────────

    /// @notice USDC token contract (6 decimals on Base)
    IERC20 public immutable usdc;

    /// @notice Aave V3 Pool contract
    IPool public immutable aavePool;

    /// @notice Aave V3 aUSDC receipt token
    IAToken public immutable aUsdc;

    /// @notice The FaircroftTreasury contract we pull from / return to
    FaircroftTreasury public immutable treasury;

    // ── State ──────────────────────────────────────────────────────────────────

    /// @notice Total USDC principal currently deposited into Aave
    uint256 public depositedAmount;

    /// @notice Block timestamp of the last harvest
    uint256 public lastHarvestTimestamp;

    /// @notice Current risk tolerance governing max deployment percentage
    RiskLevel public riskTolerance;

    // ── Basis points for each risk level ──────────────────────────────────────

    uint256 private constant CONSERVATIVE_BPS = 3000; // 30%
    uint256 private constant MODERATE_BPS      = 5000; // 50%
    uint256 private constant AGGRESSIVE_BPS    = 8000; // 80%
    uint256 private constant BPS_DENOM         = 10000;

    // ── Events ─────────────────────────────────────────────────────────────────

    /// @notice Emitted when USDC is deposited into Aave
    event DepositedToAave(address indexed caller, uint256 amount, uint256 totalDeposited);

    /// @notice Emitted when USDC principal is withdrawn from Aave back to Treasury
    event WithdrawnFromAave(address indexed caller, uint256 requested, uint256 received);

    /// @notice Emitted when accrued yield is swept to Treasury
    event YieldHarvested(address indexed caller, uint256 yieldAmount, uint256 timestamp);

    /// @notice Emitted when risk tolerance level is updated by governance
    event RiskToleranceUpdated(RiskLevel oldLevel, RiskLevel newLevel, uint256 excessWithdrawn);

    /// @notice Emitted on full emergency withdrawal from Aave
    event EmergencyWithdrawal(address indexed caller, uint256 amount);

    // ── Custom Errors ──────────────────────────────────────────────────────────

    error ZeroAmount();
    error ZeroAddress();
    error ExceedsRiskTolerance(uint256 wouldDeposit, uint256 maxAllowed);
    error InsufficientDeposited(uint256 requested, uint256 deposited);
    error NoYieldAvailable();
    error NothingDeposited();
    error AaveWithdrawFailed();

    // ── Constructor ────────────────────────────────────────────────────────────

    /**
     * @notice Deploy TreasuryYield
     * @param _usdc     USDC token address
     * @param _aavePool Aave V3 Pool address
     * @param _aUsdc    Aave V3 aUSDC receipt token address
     * @param _treasury FaircroftTreasury address (must have YIELD_MANAGER_ROLE granted to this contract)
     * @param _governor Initial holder of GOVERNOR_ROLE (Timelock)
     * @param _treasurer Initial holder of TREASURER_ROLE (board multisig)
     */
    constructor(
        address _usdc,
        address _aavePool,
        address _aUsdc,
        address _treasury,
        address _governor,
        address _treasurer
    ) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_aavePool == address(0)) revert ZeroAddress();
        if (_aUsdc == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_governor == address(0)) revert ZeroAddress();
        if (_treasurer == address(0)) revert ZeroAddress();

        usdc = IERC20(_usdc);
        aavePool = IPool(_aavePool);
        aUsdc = IAToken(_aUsdc);
        treasury = FaircroftTreasury(_treasury);

        riskTolerance = RiskLevel.Conservative; // safe default

        _grantRole(DEFAULT_ADMIN_ROLE, _governor);
        _grantRole(GOVERNOR_ROLE, _governor);
        _grantRole(TREASURER_ROLE, _treasurer);
    }

    // ── Core: Deposit ──────────────────────────────────────────────────────────

    /**
     * @notice Deploy reserve USDC into Aave V3 to earn yield.
     *         Pulls USDC directly from Treasury (this contract needs YIELD_MANAGER_ROLE).
     *         Amount must not push total deployed past the risk tolerance cap.
     * @param amount USDC amount to deposit (6-decimal)
     */
    function depositToAave(uint256 amount)
        external
        nonReentrant
        onlyRole(TREASURER_ROLE)
    {
        if (amount == 0) revert ZeroAmount();

        // Enforce risk cap against current reserve BEFORE this deposit
        uint256 currentReserve = treasury.reserveBalance();
        uint256 maxAllowed = _maxDeployable(currentReserve);
        uint256 wouldDeposit = depositedAmount + amount;

        if (wouldDeposit > maxAllowed) {
            revert ExceedsRiskTolerance(wouldDeposit, maxAllowed);
        }

        // Pull USDC from Treasury reserve
        treasury.releaseReserveForYield(address(this), amount);

        // Approve Aave pool and supply
        usdc.forceApprove(address(aavePool), amount);
        aavePool.supply(address(usdc), amount, address(this), 0);

        depositedAmount += amount;

        emit DepositedToAave(msg.sender, amount, depositedAmount);
    }

    // ── Core: Withdraw ─────────────────────────────────────────────────────────

    /**
     * @notice Redeem aUSDC for USDC principal and return it to the Treasury reserve.
     *         Caller must not request more than the tracked principal.
     * @param amount USDC principal amount to withdraw
     */
    function withdrawFromAave(uint256 amount)
        external
        nonReentrant
        onlyRole(TREASURER_ROLE)
    {
        if (amount == 0) revert ZeroAmount();
        if (amount > depositedAmount) {
            revert InsufficientDeposited(amount, depositedAmount);
        }

        depositedAmount -= amount;

        // Withdraw from Aave directly to this contract
        uint256 received = aavePool.withdraw(address(usdc), amount, address(this));

        // Return principal to Treasury
        usdc.forceApprove(address(treasury), received);
        treasury.creditYieldReturn(received);

        emit WithdrawnFromAave(msg.sender, amount, received);
    }

    // ── Core: Harvest Yield ────────────────────────────────────────────────────

    /**
     * @notice Sweep accrued yield (aUSDC balance − deposited principal) back to Treasury.
     *         Anyone can call this — no role restriction. Excess aUSDC is swapped to USDC
     *         via Aave withdraw and credited to the Treasury reserve.
     */
    function harvestYield() external nonReentrant {
        uint256 currentValue = aUsdc.balanceOf(address(this));
        if (currentValue <= depositedAmount) revert NoYieldAvailable();

        uint256 yieldAmount = currentValue - depositedAmount;

        // Withdraw only the yield portion from Aave
        uint256 received = aavePool.withdraw(address(usdc), yieldAmount, address(this));

        // Return yield to Treasury reserve
        usdc.forceApprove(address(treasury), received);
        treasury.creditYieldReturn(received);

        lastHarvestTimestamp = block.timestamp;

        emit YieldHarvested(msg.sender, received, block.timestamp);
    }

    // ── Core: Risk Tolerance ───────────────────────────────────────────────────

    /**
     * @notice Change the risk tolerance level (governance only).
     *         If the new level is more conservative, any excess is immediately
     *         withdrawn from Aave and returned to Treasury.
     * @param newLevel New RiskLevel to set
     */
    function setRiskTolerance(RiskLevel newLevel)
        external
        nonReentrant
        onlyRole(GOVERNOR_ROLE)
    {
        RiskLevel oldLevel = riskTolerance;
        riskTolerance = newLevel;

        uint256 excessWithdrawn = 0;

        // Check if current deployment exceeds the new cap
        if (depositedAmount > 0) {
            uint256 currentReserve = treasury.reserveBalance();
            uint256 newMax = _maxDeployable(currentReserve);

            if (depositedAmount > newMax) {
                uint256 excess = depositedAmount - newMax;
                depositedAmount -= excess;

                uint256 received = aavePool.withdraw(address(usdc), excess, address(this));
                usdc.forceApprove(address(treasury), received);
                treasury.creditYieldReturn(received);

                excessWithdrawn = received;
            }
        }

        emit RiskToleranceUpdated(oldLevel, newLevel, excessWithdrawn);
    }

    // ── Core: Emergency Withdraw ───────────────────────────────────────────────

    /**
     * @notice Immediately pull all Aave funds (principal + yield) back to Treasury.
     *         Resets depositedAmount to 0. For use in emergencies or protocol sunset.
     */
    function emergencyWithdraw()
        external
        nonReentrant
        onlyRole(TREASURER_ROLE)
    {
        if (depositedAmount == 0) revert NothingDeposited();

        uint256 totalAave = aUsdc.balanceOf(address(this));

        // Use type(uint256).max to pull everything
        uint256 received = aavePool.withdraw(address(usdc), type(uint256).max, address(this));

        depositedAmount = 0;
        lastHarvestTimestamp = block.timestamp;

        // Return everything to Treasury
        usdc.forceApprove(address(treasury), received);
        treasury.creditYieldReturn(received);

        emit EmergencyWithdrawal(msg.sender, received);
        emit YieldHarvested(msg.sender, received > totalAave ? received - totalAave : 0, block.timestamp);
    }

    // ── Views ──────────────────────────────────────────────────────────────────

    /**
     * @notice Returns a snapshot of the current yield position
     * @return deposited        USDC principal currently in Aave
     * @return currentValue     Current aUSDC balance (principal + accrued yield)
     * @return yieldEarned      Unrealized yield available to harvest
     * @return apyEstimateBps   Rough APY estimate in basis points (requires lastHarvestTimestamp)
     * @return level            Current risk tolerance level
     */
    function getYieldInfo() external view returns (
        uint256 deposited,
        uint256 currentValue,
        uint256 yieldEarned,
        uint256 apyEstimateBps,
        RiskLevel level
    ) {
        deposited = depositedAmount;
        currentValue = aUsdc.balanceOf(address(this));
        yieldEarned = currentValue > deposited ? currentValue - deposited : 0;
        level = riskTolerance;

        // APY estimate: annualized rate based on time since last harvest
        // Only meaningful if we have a prior harvest timestamp and non-zero principal
        if (deposited > 0 && lastHarvestTimestamp > 0 && block.timestamp > lastHarvestTimestamp) {
            uint256 elapsed = block.timestamp - lastHarvestTimestamp;
            // apyBps = (yield / principal) * (365 days / elapsed) * 10000
            apyEstimateBps = (yieldEarned * 365 days * BPS_DENOM) / (deposited * elapsed);
        } else {
            apyEstimateBps = 0;
        }
    }

    /**
     * @notice Returns the maximum USDC deployable given the current risk tolerance
     * @param totalReserve Total reserve balance to cap against
     * @return max Maximum USDC that can be deployed at the current risk level
     */
    function maxDeployable(uint256 totalReserve) external view returns (uint256) {
        return _maxDeployable(totalReserve);
    }

    // ── Internal Helpers ───────────────────────────────────────────────────────

    /**
     * @dev Returns the max USDC deployable for the current risk level
     * @param totalReserve Reserve balance to compute percentage of
     */
    function _maxDeployable(uint256 totalReserve) internal view returns (uint256) {
        if (riskTolerance == RiskLevel.Conservative) {
            return totalReserve * CONSERVATIVE_BPS / BPS_DENOM;
        } else if (riskTolerance == RiskLevel.Moderate) {
            return totalReserve * MODERATE_BPS / BPS_DENOM;
        } else {
            return totalReserve * AGGRESSIVE_BPS / BPS_DENOM;
        }
    }
}
```

---

## APPENDIX A-7: VendorEscrow.sol

**Description:** Milestone-based payment escrow for HOA contractor work orders. Implements a three-party system (board, inspector, vendor) with milestone-by-milestone USDC release, dispute escalation to governance, and automatic work order completion tracking.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VendorEscrow
 * @notice Milestone-based escrow for HOA contractor payments. Board creates work orders
 *         with milestone breakdowns; an assigned inspector approves each milestone and
 *         USDC auto-releases to the vendor. Disputes are escalated to governance (Timelock).
 *
 * @dev Flow:
 *      1. BOARD_ROLE calls createWorkOrder() — USDC pulled from Treasury into escrow.
 *      2. Inspector calls approveMilestone() per milestone — USDC released to vendor.
 *      3. All milestones approved → work order auto-completes.
 *      4. Any party can disputeMilestone() — governance resolves via resolveDispute().
 *      5. BOARD_ROLE can cancelWorkOrder() before any milestone is approved.
 *
 *      The Treasury must approve this contract as a spender (or hold a role that allows
 *      safeTransferFrom). In tests, USDC can be minted directly to this contract.
 */
contract VendorEscrow is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Roles ────────────────────────────────────────────────────────────────

    /// @notice Board multisig — creates work orders, cancels, raises disputes
    bytes32 public constant BOARD_ROLE = keccak256("BOARD_ROLE");

    /// @notice Governance Timelock — resolves disputes
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    // ── Immutables ───────────────────────────────────────────────────────────

    /// @notice USDC token contract (6 decimals on Base)
    IERC20 public immutable usdc;

    /// @notice Treasury address — source of escrow funds and destination for refunds
    address public immutable treasury;

    // ── Enums ────────────────────────────────────────────────────────────────

    /// @notice Life-cycle states for a work order
    enum WorkOrderStatus {
        Created,   // Funded; no milestones approved yet
        Active,    // At least one milestone approved
        Completed, // All milestones settled (approved or returned)
        Cancelled, // Cancelled before any approval — all funds refunded
        Disputed   // One or more milestones under active dispute
    }

    /// @notice Life-cycle states for an individual milestone
    enum MilestoneStatus {
        Pending,  // Awaiting inspector sign-off
        Approved, // Inspector approved; USDC sent to vendor
        Disputed, // Under governance dispute; release paused
        Returned  // Governance resolved against vendor; USDC returned to Treasury
    }

    // ── Structs ──────────────────────────────────────────────────────────────

    /// @notice Individual milestone
    struct Milestone {
        string description;
        uint256 amount;          // USDC (6 decimals)
        MilestoneStatus status;
        string disputeReason;    // populated on dispute
    }

    /// @notice Full work order record
    struct WorkOrder {
        uint256 id;
        address vendor;
        string title;
        string description;
        uint256 totalAmount;     // Sum of original milestone amounts
        uint256 releasedAmount;  // Running total of USDC released to vendor
        WorkOrderStatus status;
        uint48 createdAt;
        uint48 completedAt;
        address inspector;       // Signs off on milestones
        Milestone[] milestones;
    }

    /// @notice Input type for createWorkOrder to avoid stack-too-deep
    struct MilestoneInput {
        string description;
        uint256 amount;
    }

    // ── Storage ──────────────────────────────────────────────────────────────

    /// @notice Work orders indexed by id
    mapping(uint256 => WorkOrder) private _workOrders;

    /// @notice Total work orders created (also next id)
    uint256 private _workOrderCount;

    /// @notice vendor → list of work order ids
    mapping(address => uint256[]) private _vendorWorkOrders;

    // ── Events ───────────────────────────────────────────────────────────────

    event WorkOrderCreated(
        uint256 indexed workOrderId,
        address indexed vendor,
        address indexed inspector,
        uint256 totalAmount,
        uint256 milestoneCount
    );

    event MilestoneApproved(
        uint256 indexed workOrderId,
        uint256 indexed milestoneIndex,
        address indexed inspector,
        uint256 amount
    );

    event MilestoneDisputed(
        uint256 indexed workOrderId,
        uint256 indexed milestoneIndex,
        address indexed raisedBy,
        string reason
    );

    event DisputeResolved(
        uint256 indexed workOrderId,
        uint256 indexed milestoneIndex,
        bool releasedToVendor,
        address resolvedBy
    );

    event WorkOrderCancelled(
        uint256 indexed workOrderId,
        address indexed cancelledBy,
        uint256 refundAmount
    );

    event WorkOrderCompleted(
        uint256 indexed workOrderId,
        uint256 totalAmount
    );

    // ── Custom Errors ────────────────────────────────────────────────────────

    error ZeroAddress();
    error ZeroAmount();
    error EmptyTitle();
    error EmptyMilestones();
    error WorkOrderNotFound(uint256 workOrderId);
    error MilestoneIndexOutOfBounds(uint256 milestoneIndex, uint256 length);
    error NotInspector(address caller, address inspector);
    error MilestoneNotPending(uint256 milestoneIndex, MilestoneStatus status);
    error MilestoneNotDisputed(uint256 milestoneIndex, MilestoneStatus status);
    error WorkOrderAlreadyCancelled(uint256 workOrderId);
    error WorkOrderAlreadyCompleted(uint256 workOrderId);
    error CannotCancelAfterApproval(uint256 workOrderId);
    error NotBoardOrVendor(address caller);

    // ── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _usdc     USDC token address
     * @param _treasury FaircroftTreasury address (source of escrow funds)
     * @param _board    Board multisig (granted BOARD_ROLE)
     * @param _governor Governance Timelock (granted GOVERNOR_ROLE)
     */
    constructor(
        address _usdc,
        address _treasury,
        address _board,
        address _governor
    ) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_board == address(0)) revert ZeroAddress();
        if (_governor == address(0)) revert ZeroAddress();

        usdc = IERC20(_usdc);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BOARD_ROLE, _board);
        _grantRole(GOVERNOR_ROLE, _governor);
    }

    // ── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Create a new work order and pull USDC from Treasury into escrow.
     * @dev    BOARD_ROLE only. Treasury must have approved this contract as a spender
     *         for at least `sum(milestones.amount)` USDC before calling this.
     *         Milestone amounts must sum to a non-zero total.
     * @param vendor      Contractor receiving payments
     * @param title       Short title (non-empty)
     * @param description Scope of work
     * @param milestones  Ordered milestone inputs; each amount must be > 0
     * @param inspector   Address authorised to approve milestones
     * @return workOrderId  Newly created work order id
     */
    function createWorkOrder(
        address vendor,
        string calldata title,
        string calldata description,
        MilestoneInput[] calldata milestones,
        address inspector
    ) external nonReentrant onlyRole(BOARD_ROLE) returns (uint256 workOrderId) {
        if (vendor == address(0)) revert ZeroAddress();
        if (inspector == address(0)) revert ZeroAddress();
        if (bytes(title).length == 0) revert EmptyTitle();
        if (milestones.length == 0) revert EmptyMilestones();

        // Validate milestone amounts
        uint256 totalAmount;
        for (uint256 i; i < milestones.length; ++i) {
            if (milestones[i].amount == 0) revert ZeroAmount();
            totalAmount += milestones[i].amount;
        }

        workOrderId = _workOrderCount++;

        WorkOrder storage wo = _workOrders[workOrderId];
        wo.id          = workOrderId;
        wo.vendor      = vendor;
        wo.title       = title;
        wo.description = description;
        wo.totalAmount = totalAmount;
        wo.status      = WorkOrderStatus.Created;
        wo.createdAt   = uint48(block.timestamp);
        wo.inspector   = inspector;

        for (uint256 i; i < milestones.length; ++i) {
            wo.milestones.push(Milestone({
                description:   milestones[i].description,
                amount:        milestones[i].amount,
                status:        MilestoneStatus.Pending,
                disputeReason: ""
            }));
        }

        _vendorWorkOrders[vendor].push(workOrderId);

        // Pull USDC from Treasury into this escrow contract
        usdc.safeTransferFrom(treasury, address(this), totalAmount);

        emit WorkOrderCreated(workOrderId, vendor, inspector, totalAmount, milestones.length);
    }

    /**
     * @notice Inspector approves a milestone, releasing its USDC to the vendor.
     * @dev    Only the inspector assigned to this work order may call this.
     *         Auto-completes the work order when the last milestone is settled.
     * @param workOrderId    Work order id
     * @param milestoneIndex Zero-based milestone index
     */
    function approveMilestone(
        uint256 workOrderId,
        uint256 milestoneIndex
    ) external nonReentrant {
        WorkOrder storage wo = _requireWorkOrder(workOrderId);

        if (msg.sender != wo.inspector) revert NotInspector(msg.sender, wo.inspector);
        if (wo.status == WorkOrderStatus.Cancelled) revert WorkOrderAlreadyCancelled(workOrderId);
        if (wo.status == WorkOrderStatus.Completed)  revert WorkOrderAlreadyCompleted(workOrderId);

        _requireValidMilestoneIndex(wo, milestoneIndex);
        Milestone storage ms = wo.milestones[milestoneIndex];
        if (ms.status != MilestoneStatus.Pending) revert MilestoneNotPending(milestoneIndex, ms.status);

        // Mark approved and update accounting
        ms.status            = MilestoneStatus.Approved;
        wo.releasedAmount   += ms.amount;

        // Upgrade work order from Created → Active on first approval
        if (wo.status == WorkOrderStatus.Created) {
            wo.status = WorkOrderStatus.Active;
        }

        usdc.safeTransfer(wo.vendor, ms.amount);

        emit MilestoneApproved(workOrderId, milestoneIndex, msg.sender, ms.amount);

        _tryComplete(wo, workOrderId);
    }

    /**
     * @notice Flag a milestone as disputed, pausing its release.
     * @dev    BOARD_ROLE or the vendor on this work order may raise a dispute.
     *         Milestone must be in Pending status.
     * @param workOrderId    Work order id
     * @param milestoneIndex Zero-based milestone index
     * @param reason         Human-readable dispute reason
     */
    function disputeMilestone(
        uint256 workOrderId,
        uint256 milestoneIndex,
        string calldata reason
    ) external nonReentrant {
        WorkOrder storage wo = _requireWorkOrder(workOrderId);

        bool isBoard  = hasRole(BOARD_ROLE, msg.sender);
        bool isVendor = (msg.sender == wo.vendor);
        if (!isBoard && !isVendor) revert NotBoardOrVendor(msg.sender);

        if (wo.status == WorkOrderStatus.Cancelled) revert WorkOrderAlreadyCancelled(workOrderId);
        if (wo.status == WorkOrderStatus.Completed)  revert WorkOrderAlreadyCompleted(workOrderId);

        _requireValidMilestoneIndex(wo, milestoneIndex);
        Milestone storage ms = wo.milestones[milestoneIndex];
        if (ms.status != MilestoneStatus.Pending) revert MilestoneNotPending(milestoneIndex, ms.status);

        ms.status        = MilestoneStatus.Disputed;
        ms.disputeReason = reason;
        wo.status        = WorkOrderStatus.Disputed;

        emit MilestoneDisputed(workOrderId, milestoneIndex, msg.sender, reason);
    }

    /**
     * @notice Governance resolves a disputed milestone.
     * @dev    GOVERNOR_ROLE only. Milestone must be in Disputed status.
     *         releaseToVendor=true → USDC sent to vendor and milestone marked Approved.
     *         releaseToVendor=false → USDC returned to Treasury and milestone marked Returned.
     * @param workOrderId     Work order id
     * @param milestoneIndex  Zero-based milestone index
     * @param releaseToVendor true = pay vendor; false = refund Treasury
     */
    function resolveDispute(
        uint256 workOrderId,
        uint256 milestoneIndex,
        bool releaseToVendor
    ) external nonReentrant onlyRole(GOVERNOR_ROLE) {
        WorkOrder storage wo = _requireWorkOrder(workOrderId);

        if (wo.status == WorkOrderStatus.Cancelled) revert WorkOrderAlreadyCancelled(workOrderId);
        if (wo.status == WorkOrderStatus.Completed)  revert WorkOrderAlreadyCompleted(workOrderId);

        _requireValidMilestoneIndex(wo, milestoneIndex);
        Milestone storage ms = wo.milestones[milestoneIndex];
        if (ms.status != MilestoneStatus.Disputed) revert MilestoneNotDisputed(milestoneIndex, ms.status);

        uint256 amount = ms.amount;

        if (releaseToVendor) {
            ms.status          = MilestoneStatus.Approved;
            wo.releasedAmount += amount;
            usdc.safeTransfer(wo.vendor, amount);
        } else {
            ms.status = MilestoneStatus.Returned;
            usdc.safeTransfer(treasury, amount);
        }

        emit DisputeResolved(workOrderId, milestoneIndex, releaseToVendor, msg.sender);

        // Restore work order status now that dispute is resolved (if no others remain)
        _updateStatusAfterResolution(wo);

        _tryComplete(wo, workOrderId);
    }

    /**
     * @notice Cancel a work order, returning all escrowed USDC to Treasury.
     * @dev    BOARD_ROLE only. Reverts if any milestone has been approved (releasedAmount > 0).
     * @param workOrderId Work order id to cancel
     */
    function cancelWorkOrder(uint256 workOrderId)
        external
        nonReentrant
        onlyRole(BOARD_ROLE)
    {
        WorkOrder storage wo = _requireWorkOrder(workOrderId);

        if (wo.status == WorkOrderStatus.Cancelled) revert WorkOrderAlreadyCancelled(workOrderId);
        if (wo.status == WorkOrderStatus.Completed)  revert WorkOrderAlreadyCompleted(workOrderId);
        if (wo.releasedAmount > 0)                   revert CannotCancelAfterApproval(workOrderId);

        wo.status      = WorkOrderStatus.Cancelled;
        wo.completedAt = uint48(block.timestamp);

        // Refund all escrowed USDC — only non-released milestones still sit here
        // (releasedAmount == 0 means nothing left the escrow yet)
        uint256 refund = wo.totalAmount;
        usdc.safeTransfer(treasury, refund);

        emit WorkOrderCancelled(workOrderId, msg.sender, refund);
    }

    // ── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Return the complete work order record.
     * @param workOrderId Work order id
     */
    function getWorkOrder(uint256 workOrderId)
        external
        view
        returns (WorkOrder memory)
    {
        if (workOrderId >= _workOrderCount) revert WorkOrderNotFound(workOrderId);
        return _workOrders[workOrderId];
    }

    /**
     * @notice Total number of work orders ever created.
     */
    function getWorkOrderCount() external view returns (uint256) {
        return _workOrderCount;
    }

    /**
     * @notice All work order ids associated with a vendor address.
     * @param vendor Vendor address
     */
    function getVendorWorkOrders(address vendor)
        external
        view
        returns (uint256[] memory)
    {
        return _vendorWorkOrders[vendor];
    }

    /**
     * @notice All work orders that are not Completed or Cancelled.
     * @dev    Linear scan — acceptable at HOA scale.
     */
    function getActiveWorkOrders()
        external
        view
        returns (WorkOrder[] memory active)
    {
        // Count active first
        uint256 count;
        for (uint256 i; i < _workOrderCount; ++i) {
            WorkOrderStatus s = _workOrders[i].status;
            if (s != WorkOrderStatus.Completed && s != WorkOrderStatus.Cancelled) {
                ++count;
            }
        }

        active = new WorkOrder[](count);
        uint256 idx;
        for (uint256 i; i < _workOrderCount; ++i) {
            WorkOrderStatus s = _workOrders[i].status;
            if (s != WorkOrderStatus.Completed && s != WorkOrderStatus.Cancelled) {
                active[idx++] = _workOrders[i];
            }
        }
    }

    // ── Internal Helpers ─────────────────────────────────────────────────────

    /// @dev Retrieve work order storage or revert if id is out of range
    function _requireWorkOrder(uint256 workOrderId)
        internal
        view
        returns (WorkOrder storage)
    {
        if (workOrderId >= _workOrderCount) revert WorkOrderNotFound(workOrderId);
        return _workOrders[workOrderId];
    }

    /// @dev Revert if milestoneIndex is out of bounds
    function _requireValidMilestoneIndex(WorkOrder storage wo, uint256 milestoneIndex)
        internal
        view
    {
        if (milestoneIndex >= wo.milestones.length) {
            revert MilestoneIndexOutOfBounds(milestoneIndex, wo.milestones.length);
        }
    }

    /**
     * @dev Mark work order Completed when every milestone is terminal
     *      (Approved or Returned — both are settled, just in different directions).
     */
    function _tryComplete(WorkOrder storage wo, uint256 workOrderId) internal {
        uint256 len = wo.milestones.length;
        for (uint256 i; i < len; ++i) {
            MilestoneStatus s = wo.milestones[i].status;
            if (s != MilestoneStatus.Approved && s != MilestoneStatus.Returned) {
                return; // still open milestones
            }
        }
        wo.status      = WorkOrderStatus.Completed;
        wo.completedAt = uint48(block.timestamp);
        emit WorkOrderCompleted(workOrderId, wo.totalAmount);
    }

    /**
     * @dev After a dispute is resolved, check if any milestones remain Disputed.
     *      If not, drop work order status back to Active or Created.
     */
    function _updateStatusAfterResolution(WorkOrder storage wo) internal {
        if (wo.status != WorkOrderStatus.Disputed) return;

        for (uint256 i; i < wo.milestones.length; ++i) {
            if (wo.milestones[i].status == MilestoneStatus.Disputed) {
                return; // still a live dispute
            }
        }

        // No live disputes remain — restore to appropriate state
        wo.status = (wo.releasedAmount > 0)
            ? WorkOrderStatus.Active
            : WorkOrderStatus.Created;
    }
}
```

---

## Security Scan Results

All 7 contracts were scanned for hardcoded secrets, API keys, private keys, and credentials. **No secrets found.** Solidity contracts do not contain API keys or private keys by design — wallet addresses referenced are constructor parameters set at deploy time, not hardcoded credentials.

---

*End of Code Appendix*
