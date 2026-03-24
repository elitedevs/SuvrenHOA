// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../helpers/TestSetup.sol";
import "../helpers/MockUSDC.sol";
import "../../src/FaircroftTreasury.sol";
import "@openzeppelin/contracts/governance/IGovernor.sol";

/**
 * @title GovernanceLifecycle
 * @notice Full end-to-end integration tests spanning all 4 contracts.
 *         Tests the complete governance lifecycle: mint → propose → vote → execute.
 */
contract GovernanceLifecycleTest is TestSetup {
    FaircroftTreasury public treasury;
    MockUSDC public usdc;

    function setUp() public {
        _deploySystem();

        // Deploy USDC + Treasury
        usdc = new MockUSDC();
        treasury = new FaircroftTreasury(
            address(usdc),
            200e6,  // $200/quarter
            500,    // 5% annual discount
            5000e6  // $5K emergency limit
        );

        // Wire treasury roles
        treasury.grantRole(treasury.GOVERNOR_ROLE(), address(timelock));
        treasury.grantRole(treasury.TREASURER_ROLE(), boardMultisig);

        // Transfer treasury admin to timelock
        treasury.grantRole(treasury.DEFAULT_ADMIN_ROLE(), address(timelock));
        treasury.renounceRole(treasury.DEFAULT_ADMIN_ROLE(), deployer);

        // Mint properties
        _mintProperties();

        // Fund the treasury through dues
        _fundTreasuryViaDues(5000e6);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Full Lifecycle: Treasury Expenditure via Governance
    // ═══════════════════════════════════════════════════════════════════════

    function test_FullLifecycle_ProposeAndExecuteExpenditure() public {
        address vendor = address(0x7E4D01);
        uint128 amount = 1000e6; // $1,000

        // 1. Build proposal: call treasury.makeExpenditure
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(treasury);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            FaircroftTreasury.makeExpenditure.selector,
            vendor,
            amount,
            "Landscaping contract Q1 2026",
            "maintenance",
            uint48(0) // proposalId filled in later (or left as 0)
        );

        string memory description = "Pay $1,000 to landscaper for Q1 maintenance";

        // 2. Alice proposes (she has 1 NFT)
        vm.prank(alice);
        uint256 proposalId = governor.proposeWithCategory(
            targets, values, calldatas,
            description,
            FaircroftGovernor.ProposalCategory.Routine,
            "ipfs://QmLandscapingProposal"
        );

        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Pending));

        // 3. Wait for voting delay
        _skipVotingDelay();
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Active));

        // 4. Vote: 4 for, 1 against
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

        // 5. Wait for voting period to end
        _skipVotingPeriod();
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Succeeded));

        // 6. Queue
        bytes32 descHash = keccak256(bytes(description));
        governor.queue(targets, values, calldatas, descHash);
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Queued));

        // 7. Wait for timelock delay
        _skipTimelockDelay();

        // 8. Execute
        uint256 vendorBalanceBefore = usdc.balanceOf(vendor);
        uint256 opBalanceBefore = treasury.operatingBalance();

        governor.execute(targets, values, calldatas, descHash);

        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Executed));

        // 9. Verify: vendor got paid, treasury balance updated
        assertEq(usdc.balanceOf(vendor), vendorBalanceBefore + amount);
        assertEq(treasury.operatingBalance(), opBalanceBefore - amount);
        assertEq(treasury.getExpenditureCount(), 1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Full Lifecycle: Document Registration via Governance
    // ═══════════════════════════════════════════════════════════════════════

    function test_FullLifecycle_ProposeAndExecuteDocRegistration() public {
        bytes32 contentHash = keccak256("Faircroft CC&Rs v2.0 - amended March 2026");

        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(docRegistry);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            docRegistry.registerDocument.selector,
            contentHash,
            "arweave-tx-abc123",
            "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
            DocumentRegistry.DocType.Amendment,
            "CC&Rs v2.0 Amendment",
            uint256(0)
        );

        string memory description = "Register amended CC&Rs v2.0 on-chain";

        // Propose (Constitutional category for CC&R changes)
        vm.prank(alice);
        uint256 proposalId = governor.proposeWithCategory(
            targets, values, calldatas,
            description,
            FaircroftGovernor.ProposalCategory.Constitutional,
            ""
        );

        _skipVotingDelay();

        // Need 67% quorum + 2/3 supermajority → all 5 vote for
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
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Succeeded));

        bytes32 descHash = keccak256(bytes(description));
        governor.queue(targets, values, calldatas, descHash);
        _skipTimelockDelay();
        governor.execute(targets, values, calldatas, descHash);

        // Verify document was registered
        assertEq(docRegistry.getDocumentCount(), 1);
        (bool exists,,) = docRegistry.verifyDocument(contentHash);
        assertTrue(exists);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Constitutional Supermajority Failure
    // ═══════════════════════════════════════════════════════════════════════

    function test_ConstitutionalFailsWithSimpleMajority() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(docRegistry);
        calldatas[0] = abi.encodeWithSelector(docRegistry.getDocumentCount.selector);

        vm.prank(alice);
        uint256 proposalId = governor.proposeWithCategory(
            targets, values, calldatas,
            "Constitutional that should fail at 60%",
            FaircroftGovernor.ProposalCategory.Constitutional,
            ""
        );

        _skipVotingDelay();

        // 3 for, 2 against = 60% < 66.67% required
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

        // Should be defeated despite majority — needs 2/3
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Board Cancel Power
    // ═══════════════════════════════════════════════════════════════════════

    function test_BoardCancelsQueuedProposal() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(docRegistry);
        calldatas[0] = abi.encodeWithSelector(docRegistry.getDocumentCount.selector);

        string memory description = "Board will cancel this";

        vm.prank(alice);
        uint256 proposalId = governor.proposeWithCategory(
            targets, values, calldatas, description,
            FaircroftGovernor.ProposalCategory.Routine, ""
        );

        _skipVotingDelay();

        // All vote for
        vm.prank(alice);
        governor.castVote(proposalId, 1);
        vm.prank(bob);
        governor.castVote(proposalId, 1);
        vm.prank(carol);
        governor.castVote(proposalId, 1);

        _skipVotingPeriod();

        bytes32 descHash = keccak256(bytes(description));
        governor.queue(targets, values, calldatas, descHash);
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Queued));

        // Board cancels during timelock
        vm.prank(boardMultisig);
        governor.cancel(targets, values, calldatas, descHash);

        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Canceled));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Emergency Spending (No Governance)
    // ═══════════════════════════════════════════════════════════════════════

    function test_EmergencySpendByBoard() public {
        address vendor = address(0x7E4D01);

        uint256 opBefore = treasury.operatingBalance();

        vm.prank(boardMultisig);
        treasury.emergencySpend(vendor, 2000e6, "Emergency: broken pipe flooding unit 12");

        assertEq(usdc.balanceOf(vendor), 2000e6);
        assertEq(treasury.operatingBalance(), opBefore - 2000e6);
        assertEq(treasury.emergencySpentThisPeriod(), 2000e6);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Dues + Treasury Integration
    // ═══════════════════════════════════════════════════════════════════════

    function test_DuesPaymentAndTreasurySnapshot() public {
        (uint256 total, uint256 operating, uint256 reserve, uint256 expCount) = treasury.getTreasurySnapshot();

        assertTrue(total > 0);
        assertEq(operating + reserve, total); // Internal accounting matches actual balance
        assertEq(expCount, 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Property Transfer + Voting Power
    // ═══════════════════════════════════════════════════════════════════════

    function test_PropertyTransferUpdatesVotingPower() public {
        address newOwner = address(0x4EF0);

        // Alice has 1 vote
        assertEq(propertyNFT.getVotes(alice), 1);
        assertEq(propertyNFT.getVotes(newOwner), 0);

        // Board approves transfer
        propertyNFT.approveTransfer(1, newOwner);

        // Alice transfers to new owner
        vm.prank(alice);
        propertyNFT.safeTransferFrom(alice, newOwner, 1);

        // Warp so checkpoints are in the past
        vm.warp(block.timestamp + 1);

        // New owner has voting power, alice does not
        assertEq(propertyNFT.getVotes(newOwner), 1);
        assertEq(propertyNFT.balanceOf(alice), 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════

    function _fundTreasuryViaDues(uint256 targetAmount) internal {
        uint256 funded = 0;
        uint256 lotId = 9000;

        while (funded < targetAmount) {
            address payer = address(uint160(0xFEED0000 + lotId));
            usdc.mint(payer, 200e6);
            vm.startPrank(payer);
            usdc.approve(address(treasury), 200e6);
            treasury.payDues(lotId, 1);
            vm.stopPrank();
            funded += 200e6;
            lotId++;
        }
    }
}
