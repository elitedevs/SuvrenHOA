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

    /// @notice Tracks proposals that have already been cleaned up (decremented)
    mapping(uint256 proposalId => bool) public proposalCleaned;

    // ── Events ───────────────────────────────────────────────────────────────

    event ProposalCategorized(
        uint256 indexed proposalId,
        ProposalCategory category,
        string metadataUri
    );

    event QuorumUpdated(ProposalCategory category, uint256 oldBps, uint256 newBps);
    event ThresholdUpdated(ProposalCategory category, uint256 oldBps, uint256 newBps);
    event MaxActiveProposalsUpdated(uint256 oldMax, uint256 newMax);
    /// @notice H-08: emitted whenever activeProposalCount changes so indexers can detect desync
    event ActiveProposalCountChanged(uint256 newCount);

    // ── Errors ───────────────────────────────────────────────────────────────

    error TooManyActiveProposals(uint256 max);
    error InvalidBps(uint256 bps);
    error ProposalStillActive(uint256 proposalId);
    error ProposalAlreadyCleaned(uint256 proposalId);

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
     * @notice Override base propose() to enforce maxActiveProposals rate limit.
     *         All proposal paths (including proposeWithCategory) funnel through here,
     *         so the limit cannot be bypassed via the inherited public function.
     * @dev SC-02 fix: closes the direct propose() bypass.
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override returns (uint256) {
        if (activeProposalCount >= maxActiveProposals) {
            revert TooManyActiveProposals(maxActiveProposals);
        }
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        activeProposalCount++;
        emit ActiveProposalCountChanged(activeProposalCount);
        return proposalId;
    }

    /**
     * @notice Create a proposal with a specific governance category.
     *         Delegates limit enforcement and counting to the overridden propose().
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
        // propose() enforces the limit and increments activeProposalCount
        uint256 proposalId = propose(targets, values, calldatas, description);
        proposalCategories[proposalId] = category;
        proposalMetadataUri[proposalId] = metadataUri;

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
     * @dev Supports supermajority for Constitutional proposals.
     *      SC-07 fix: abstain votes are included in the denominator to prevent
     *      a minority from passing proposals by having accomplices abstain to
     *      reach quorum while only one member votes FOR.
     */
    function _voteSucceeded(uint256 proposalId)
        internal view override(Governor, GovernorCountingSimple)
        returns (bool)
    {
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = proposalVotes(proposalId);
        ProposalCategory category = proposalCategories[proposalId];
        uint256 thresholdBps = categoryThresholdBps[category];

        // Include abstain in denominator: a FOR vote must exceed threshold% of ALL votes cast
        uint256 totalCast = forVotes + againstVotes + abstainVotes;
        if (totalCast == 0) return false;

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
     * @dev SC-14: bounded 1–100 to prevent governance DoS from an unreachable cap
     *      or an unintended zero-value that permanently blocks all proposals.
     */
    function updateMaxActiveProposals(uint256 newMax) external onlyGovernance {
        if (newMax == 0 || newMax > 100) revert InvalidBps(newMax);
        emit MaxActiveProposalsUpdated(maxActiveProposals, newMax);
        maxActiveProposals = newMax;
    }

    /**
     * @notice Decrement activeProposalCount for proposals that are no longer active.
     *         Anyone can call this for proposals in Defeated, Expired, Canceled, or Executed state.
     *         H-08: Executed proposals are also terminal — without this they permanently consume slots.
     * @param proposalId The proposal to clean up
     */
    function cleanupProposal(uint256 proposalId) public {
        if (proposalCleaned[proposalId]) revert ProposalAlreadyCleaned(proposalId);

        ProposalState currentState = state(proposalId);
        if (
            currentState != ProposalState.Defeated &&
            currentState != ProposalState.Canceled &&
            currentState != ProposalState.Expired &&
            currentState != ProposalState.Executed
        ) {
            revert ProposalStillActive(proposalId);
        }

        proposalCleaned[proposalId] = true;
        if (activeProposalCount > 0) {
            activeProposalCount--;
            emit ActiveProposalCountChanged(activeProposalCount);
        }
    }

    /**
     * @notice Governance-only manual resync in case activeProposalCount drifts.
     *         H-08: escape hatch if the counter ever desyncs despite the safeguards above.
     * @param newCount The correct active proposal count
     */
    function resyncActiveCount(uint256 newCount) external onlyGovernance {
        activeProposalCount = newCount;
        emit ActiveProposalCountChanged(newCount);
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
        // H-08: auto-decrement on execute so executed proposals never occupy slots indefinitely
        if (!proposalCleaned[proposalId] && activeProposalCount > 0) {
            proposalCleaned[proposalId] = true;
            activeProposalCount--;
            emit ActiveProposalCountChanged(activeProposalCount);
        }
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
        uint256 proposalId = super._cancel(targets, values, calldatas, descriptionHash);
        // H-08: auto-decrement on cancel
        if (!proposalCleaned[proposalId] && activeProposalCount > 0) {
            proposalCleaned[proposalId] = true;
            activeProposalCount--;
            emit ActiveProposalCountChanged(activeProposalCount);
        }
        return proposalId;
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
