// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./helpers/TestSetup.sol";
import "@openzeppelin/contracts/governance/IGovernor.sol";

contract FaircroftGovernorTest is TestSetup {
    function setUp() public {
        _deploySystem();
        _mintProperties();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Proposal Creation
    // ═══════════════════════════════════════════════════════════════════════

    function test_CreateRoutineProposal() public {
        uint256 proposalId = _createProposal("Hire landscaper", FaircroftGovernor.ProposalCategory.Routine);
        assertTrue(proposalId != 0);
        assertEq(uint8(governor.proposalCategories(proposalId)), uint8(FaircroftGovernor.ProposalCategory.Routine));
    }

    function test_CreateConstitutionalProposal() public {
        uint256 proposalId = _createProposal("Amend CC&Rs", FaircroftGovernor.ProposalCategory.Constitutional);
        assertEq(uint8(governor.proposalCategories(proposalId)), uint8(FaircroftGovernor.ProposalCategory.Constitutional));
    }

    function test_ProposalStoresMetadata() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(governor);

        vm.prank(alice);
        uint256 proposalId = governor.proposeWithCategory(
            targets, values, calldatas,
            "Test proposal",
            FaircroftGovernor.ProposalCategory.Financial,
            "ipfs://QmTest123"
        );

        assertEq(
            keccak256(bytes(governor.proposalMetadataUri(proposalId))),
            keccak256(bytes("ipfs://QmTest123"))
        );
    }

    function test_RevertProposeWithoutNFT() public {
        address nobody = address(0x9999);
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(governor);

        vm.prank(nobody);
        vm.expectRevert();
        governor.proposeWithCategory(
            targets, values, calldatas,
            "Unauthorized",
            FaircroftGovernor.ProposalCategory.Routine,
            ""
        );
    }

    function test_ActiveProposalCount() public {
        _createProposal("Proposal 1", FaircroftGovernor.ProposalCategory.Routine);
        assertEq(governor.activeProposalCount(), 1);

        _createProposal("Proposal 2", FaircroftGovernor.ProposalCategory.Financial);
        assertEq(governor.activeProposalCount(), 2);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Voting
    // ═══════════════════════════════════════════════════════════════════════

    function test_CastVote() public {
        uint256 proposalId = _createProposal("Test vote", FaircroftGovernor.ProposalCategory.Routine);
        _skipVotingDelay();

        vm.prank(alice);
        governor.castVote(proposalId, 1); // 1 = For

        (uint256 against, uint256 forVotes, uint256 abstain) = governor.proposalVotes(proposalId);
        assertEq(forVotes, 1);
        assertEq(against, 0);
        assertEq(abstain, 0);
    }

    function test_MultipleVoters() public {
        uint256 proposalId = _createProposal("Multi vote", FaircroftGovernor.ProposalCategory.Routine);
        _skipVotingDelay();

        vm.prank(alice);
        governor.castVote(proposalId, 1); // For

        vm.prank(bob);
        governor.castVote(proposalId, 0); // Against

        vm.prank(carol);
        governor.castVote(proposalId, 2); // Abstain

        (uint256 against, uint256 forVotes, uint256 abstain) = governor.proposalVotes(proposalId);
        assertEq(forVotes, 1);
        assertEq(against, 1);
        assertEq(abstain, 1);
    }

    function test_RevertVoteBeforeDelay() public {
        uint256 proposalId = _createProposal("Too early", FaircroftGovernor.ProposalCategory.Routine);

        vm.prank(alice);
        vm.expectRevert();
        governor.castVote(proposalId, 1);
    }

    function test_RevertVoteAfterPeriod() public {
        uint256 proposalId = _createProposal("Too late", FaircroftGovernor.ProposalCategory.Routine);
        _skipVotingDelay();
        _skipVotingPeriod();

        vm.prank(alice);
        vm.expectRevert();
        governor.castVote(proposalId, 1);
    }

    function test_RevertDoubleVote() public {
        uint256 proposalId = _createProposal("Double", FaircroftGovernor.ProposalCategory.Routine);
        _skipVotingDelay();

        vm.prank(alice);
        governor.castVote(proposalId, 1);

        vm.prank(alice);
        vm.expectRevert();
        governor.castVote(proposalId, 0);
    }

    function test_DelegatedVotes() public {
        // Alice delegates to bob — bob now has 2 votes
        vm.prank(alice);
        propertyNFT.delegate(bob);

        // Warp so checkpoint is in past
        vm.warp(block.timestamp + 1);

        // Bob proposes (alice has 0 votes after delegation, can't propose)
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(docRegistry); // use docRegistry as harmless target
        calldatas[0] = "";

        vm.prank(bob);
        uint256 proposalId = governor.proposeWithCategory(
            targets, values, calldatas,
            "Delegation test", FaircroftGovernor.ProposalCategory.Routine, ""
        );
        _skipVotingDelay();

        vm.prank(bob);
        governor.castVote(proposalId, 1);

        (,uint256 forVotes,) = governor.proposalVotes(proposalId);
        assertEq(forVotes, 2); // bob's 1 + alice's delegated 1
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Quorum & Threshold
    // ═══════════════════════════════════════════════════════════════════════

    function test_RoutineQuorum15Percent() public {
        uint256 proposalId = _createProposal("Routine test", FaircroftGovernor.ProposalCategory.Routine);
        // Warp past voting delay so snapshot is in the past
        _skipVotingDelay();
        uint256 required = governor.proposalQuorum(proposalId);
        // 5 * 1500 / 10000 = 0 (integer math). With 5 voters, 15% rounds to 0.
        assertEq(required, 0);
    }

    function test_ConstitutionalQuorum67Percent() public {
        uint256 proposalId = _createProposal("Constitutional test", FaircroftGovernor.ProposalCategory.Constitutional);
        // proposalSnapshot is set to clock() + votingDelay at creation time.
        // We need to warp past that so getPastTotalSupply can look it up.
        _skipVotingDelay();

        // At this point the snapshot is in the past, and totalSupply was 5 at that timestamp
        uint256 required = governor.proposalQuorum(proposalId);
        // 5 * 6700 / 10000 = 3.35 → 3
        // But if the snapshot was before minting, totalSupply might be 0.
        // Let's check what the snapshot actually is:
        uint256 snapshot = governor.proposalSnapshot(proposalId);
        uint256 totalAtSnapshot = propertyNFT.getPastTotalSupply(snapshot);

        // The snapshot is votingDelay after proposal creation.
        // Properties were minted at t=1 (setUp warps +1).
        // Proposal created at t=2 (setUp warp + 1 from _createProposal's internal structure).
        // Snapshot = t=2 + 86400 (1 day) = 86402.
        // We minted at t=1, so at t=86402 the supply should be 5.
        assertEq(totalAtSnapshot, 5);
        assertEq(required, 3);
    }

    function test_RoutinePassesWithSimpleMajority() public {
        uint256 proposalId = _createProposal("Simple majority", FaircroftGovernor.ProposalCategory.Routine);
        _skipVotingDelay();

        // 3 for, 2 against = 60% > 50% → passes
        vm.prank(alice);
        governor.castVote(proposalId, 1);
        vm.prank(bob);
        governor.castVote(proposalId, 1);
        vm.prank(carol);
        governor.castVote(proposalId, 1);
        vm.prank(dave);
        governor.castVote(proposalId, 0);
        vm.prank(eve);
        governor.castVote(proposalId, 0);

        _skipVotingPeriod();

        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Succeeded));
    }

    function test_RoutineFailsWithoutMajority() public {
        uint256 proposalId = _createProposal("Fails", FaircroftGovernor.ProposalCategory.Routine);
        _skipVotingDelay();

        // 2 for, 3 against = 40% < 50% → fails
        vm.prank(alice);
        governor.castVote(proposalId, 1);
        vm.prank(bob);
        governor.castVote(proposalId, 1);
        vm.prank(carol);
        governor.castVote(proposalId, 0);
        vm.prank(dave);
        governor.castVote(proposalId, 0);
        vm.prank(eve);
        governor.castVote(proposalId, 0);

        _skipVotingPeriod();

        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));
    }

    function test_ConstitutionalRequiresSupermajority() public {
        uint256 proposalId = _createProposal("Need 2/3", FaircroftGovernor.ProposalCategory.Constitutional);
        _skipVotingDelay();

        // 4 for, 1 against = 80% > 66.67% → passes (also meets 67% quorum: 4/5 = 80%)
        vm.prank(alice);
        governor.castVote(proposalId, 1);
        vm.prank(bob);
        governor.castVote(proposalId, 1);
        vm.prank(carol);
        governor.castVote(proposalId, 1);
        vm.prank(dave);
        governor.castVote(proposalId, 1);
        vm.prank(eve);
        governor.castVote(proposalId, 0);

        _skipVotingPeriod();

        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Succeeded));
    }

    function test_ConstitutionalFailsAt60Percent() public {
        uint256 proposalId = _createProposal("Not enough", FaircroftGovernor.ProposalCategory.Constitutional);
        _skipVotingDelay();

        // 3 for, 2 against = 60% < 66.67% → fails (even though quorum met)
        vm.prank(alice);
        governor.castVote(proposalId, 1);
        vm.prank(bob);
        governor.castVote(proposalId, 1);
        vm.prank(carol);
        governor.castVote(proposalId, 1);
        vm.prank(dave);
        governor.castVote(proposalId, 0);
        vm.prank(eve);
        governor.castVote(proposalId, 0);

        _skipVotingPeriod();

        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Execution Lifecycle
    // ═══════════════════════════════════════════════════════════════════════

    function test_FullLifecycle_ProposeVoteQueueExecute() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        // Use docRegistry as target with a no-op call (getDocumentCount)
        targets[0] = address(docRegistry);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(DocumentRegistry.getDocumentCount.selector);

        string memory description = "Full lifecycle test";

        vm.prank(alice);
        uint256 proposalId = governor.proposeWithCategory(
            targets, values, calldatas,
            description,
            FaircroftGovernor.ProposalCategory.Routine,
            ""
        );

        // State: Pending
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Pending));

        _skipVotingDelay();

        // State: Active
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Active));

        // Vote (all 5 vote For)
        vm.prank(alice);
        governor.castVote(proposalId, 1);
        vm.prank(bob);
        governor.castVote(proposalId, 1);
        vm.prank(carol);
        governor.castVote(proposalId, 1);
        vm.prank(dave);
        governor.castVote(proposalId, 1);
        vm.prank(eve);
        governor.castVote(proposalId, 1);

        _skipVotingPeriod();

        // State: Succeeded
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Succeeded));

        // Queue
        bytes32 descHash = keccak256(bytes(description));
        governor.queue(targets, values, calldatas, descHash);

        // State: Queued
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Queued));

        _skipTimelockDelay();

        // Execute
        governor.execute(targets, values, calldatas, descHash);

        // State: Executed
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Executed));
    }

    function test_DefeatedProposalCannotBeQueued() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(governor);

        string memory description = "Will fail";

        vm.prank(alice);
        governor.proposeWithCategory(
            targets, values, calldatas, description,
            FaircroftGovernor.ProposalCategory.Routine, ""
        );

        _skipVotingDelay();

        // All vote against
        vm.prank(alice);
        governor.castVote(governor.hashProposal(targets, values, calldatas, keccak256(bytes(description))), 0);

        _skipVotingPeriod();

        bytes32 descHash = keccak256(bytes(description));
        vm.expectRevert();
        governor.queue(targets, values, calldatas, descHash);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Guardian (Cancel Power)
    // ═══════════════════════════════════════════════════════════════════════

    function test_GuardianCanCancelActiveProposal() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(governor);

        string memory description = "Guardians cancel me";

        vm.prank(alice);
        uint256 proposalId = governor.proposeWithCategory(
            targets, values, calldatas, description,
            FaircroftGovernor.ProposalCategory.Routine, ""
        );

        _skipVotingDelay();
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Active));

        // Board multisig cancels
        bytes32 descHash = keccak256(bytes(description));
        vm.prank(boardMultisig);
        governor.cancel(targets, values, calldatas, descHash);

        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Canceled));
    }

    function test_NonGuardianCannotCancel() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(governor);

        string memory description = "Non-guardian cancel attempt";

        vm.prank(alice);
        governor.proposeWithCategory(
            targets, values, calldatas, description,
            FaircroftGovernor.ProposalCategory.Routine, ""
        );

        bytes32 descHash = keccak256(bytes(description));
        vm.prank(dave); // dave is not the guardian
        vm.expectRevert();
        governor.cancel(targets, values, calldatas, descHash);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Clock Mode
    // ═══════════════════════════════════════════════════════════════════════

    function test_ClockReturnsTimestamp() public view {
        assertEq(governor.clock(), uint48(block.timestamp));
    }

    function test_ClockModeString() public view {
        assertEq(keccak256(bytes(governor.CLOCK_MODE())), keccak256(bytes("mode=timestamp")));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Settings
    // ═══════════════════════════════════════════════════════════════════════

    function test_VotingDelayIs1Day() public view {
        assertEq(governor.votingDelay(), 1 days);
    }

    function test_VotingPeriodIs7Days() public view {
        assertEq(governor.votingPeriod(), 7 days);
    }

    function test_ProposalThresholdIs1() public view {
        assertEq(governor.proposalThreshold(), 1);
    }
}
