// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VendorEscrow.sol";
import "./helpers/MockUSDC.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

/**
 * @title VendorEscrowTest
 * @notice Comprehensive test suite for VendorEscrow.sol
 *
 * Test coverage:
 *  - Happy path: create → approve milestones → auto-complete
 *  - Dispute flow: dispute → governance resolution (both outcomes)
 *  - Cancellation before any approval
 *  - Cannot cancel after milestone approved
 *  - Inspector-only milestone approval
 *  - USDC flows (escrow → vendor on approve, escrow → treasury on cancel/return)
 *  - Access control on all role-gated functions
 *  - Edge cases: zero amount, empty milestones, double approval, out-of-bounds, etc.
 */
contract VendorEscrowTest is Test {

    // ── Contracts ────────────────────────────────────────────────────────────

    VendorEscrow public escrow;
    MockUSDC     public usdc;

    // ── Actors ───────────────────────────────────────────────────────────────

    address public deployer   = address(this);
    address public board      = address(0xB0A2D);
    address public governor   = address(0x60718);
    address public treasury   = address(0x7EA5);
    address public vendor     = address(0xC04C);
    address public inspector  = address(0x1115);
    address public stranger   = address(0xBAD);
    address public vendor2    = address(0xC04D);

    // ── USDC amounts ────────────────────────────────────────────────────────

    uint256 constant M1 = 500e6;   // $500
    uint256 constant M2 = 300e6;   // $300
    uint256 constant M3 = 200e6;   // $200
    uint256 constant TOTAL = M1 + M2 + M3; // $1000

    // ── Setup ────────────────────────────────────────────────────────────────

    function setUp() public {
        usdc   = new MockUSDC();
        escrow = new VendorEscrow(address(usdc), treasury, board, governor);

        // Seed treasury with USDC and have it approve the escrow contract
        usdc.mint(treasury, 100_000e6);
        vm.prank(treasury);
        usdc.approve(address(escrow), type(uint256).max);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// @dev Build a 3-milestone input array
    function _threeMs() internal pure returns (VendorEscrow.MilestoneInput[] memory ms) {
        ms = new VendorEscrow.MilestoneInput[](3);
        ms[0] = VendorEscrow.MilestoneInput("Site prep",      M1);
        ms[1] = VendorEscrow.MilestoneInput("Installation",   M2);
        ms[2] = VendorEscrow.MilestoneInput("Final cleanup",  M3);
    }

    /// @dev Create the standard work order and return its id
    function _createOrder() internal returns (uint256 id) {
        vm.prank(board);
        id = escrow.createWorkOrder(vendor, "Landscaping Q1", "Full front yard", _threeMs(), inspector);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONSTRUCTION & DEPLOYMENT
    // ════════════════════════════════════════════════════════════════════════

    function test_DeployedCorrectly() public view {
        assertEq(address(escrow.usdc()), address(usdc));
        assertEq(escrow.treasury(), treasury);
        assertTrue(escrow.hasRole(escrow.BOARD_ROLE(), board));
        assertTrue(escrow.hasRole(escrow.GOVERNOR_ROLE(), governor));
    }

    function test_DeployRevertsZeroUsdc() public {
        vm.expectRevert(VendorEscrow.ZeroAddress.selector);
        new VendorEscrow(address(0), treasury, board, governor);
    }

    function test_DeployRevertsZeroTreasury() public {
        vm.expectRevert(VendorEscrow.ZeroAddress.selector);
        new VendorEscrow(address(usdc), address(0), board, governor);
    }

    function test_DeployRevertsZeroBoard() public {
        vm.expectRevert(VendorEscrow.ZeroAddress.selector);
        new VendorEscrow(address(usdc), treasury, address(0), governor);
    }

    function test_DeployRevertsZeroGovernor() public {
        vm.expectRevert(VendorEscrow.ZeroAddress.selector);
        new VendorEscrow(address(usdc), treasury, board, address(0));
    }

    // ════════════════════════════════════════════════════════════════════════
    // CREATE WORK ORDER
    // ════════════════════════════════════════════════════════════════════════

    function test_CreateWorkOrder_HappyPath() public {
        uint256 treasuryBefore = usdc.balanceOf(treasury);
        uint256 escrowBefore   = usdc.balanceOf(address(escrow));

        vm.expectEmit(true, true, true, true);
        emit VendorEscrow.WorkOrderCreated(0, vendor, inspector, TOTAL, 3);

        uint256 id = _createOrder();

        assertEq(id, 0);
        assertEq(escrow.getWorkOrderCount(), 1);

        // USDC moved from treasury to escrow
        assertEq(usdc.balanceOf(treasury),         treasuryBefore - TOTAL);
        assertEq(usdc.balanceOf(address(escrow)),  escrowBefore   + TOTAL);

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(wo.id,          0);
        assertEq(wo.vendor,      vendor);
        assertEq(wo.title,       "Landscaping Q1");
        assertEq(wo.totalAmount, TOTAL);
        assertEq(wo.releasedAmount, 0);
        assertEq(wo.inspector,   inspector);
        assertEq(uint8(wo.status), uint8(VendorEscrow.WorkOrderStatus.Created));
        assertEq(wo.milestones.length, 3);
        assertEq(wo.milestones[0].amount, M1);
        assertEq(wo.milestones[1].amount, M2);
        assertEq(wo.milestones[2].amount, M3);
    }

    function test_CreateWorkOrder_TracksTwoVendors() public {
        _createOrder();
        vm.prank(board);
        VendorEscrow.MilestoneInput[] memory ms = new VendorEscrow.MilestoneInput[](1);
        ms[0] = VendorEscrow.MilestoneInput("Roof repair", 800e6);
        escrow.createWorkOrder(vendor2, "Roof job", "Fix shingles", ms, inspector);

        uint256[] memory v1Orders = escrow.getVendorWorkOrders(vendor);
        uint256[] memory v2Orders = escrow.getVendorWorkOrders(vendor2);
        assertEq(v1Orders.length, 1);
        assertEq(v2Orders.length, 1);
        assertEq(v1Orders[0], 0);
        assertEq(v2Orders[0], 1);
        assertEq(escrow.getWorkOrderCount(), 2);
    }

    function test_CreateWorkOrder_RevertsNotBoard() public {
        vm.prank(stranger);
        vm.expectRevert();
        escrow.createWorkOrder(vendor, "title", "desc", _threeMs(), inspector);
    }

    function test_CreateWorkOrder_RevertsZeroVendor() public {
        vm.prank(board);
        vm.expectRevert(VendorEscrow.ZeroAddress.selector);
        escrow.createWorkOrder(address(0), "title", "desc", _threeMs(), inspector);
    }

    function test_CreateWorkOrder_RevertsZeroInspector() public {
        vm.prank(board);
        vm.expectRevert(VendorEscrow.ZeroAddress.selector);
        escrow.createWorkOrder(vendor, "title", "desc", _threeMs(), address(0));
    }

    function test_CreateWorkOrder_RevertsEmptyTitle() public {
        vm.prank(board);
        vm.expectRevert(VendorEscrow.EmptyTitle.selector);
        escrow.createWorkOrder(vendor, "", "desc", _threeMs(), inspector);
    }

    function test_CreateWorkOrder_RevertsEmptyMilestones() public {
        vm.prank(board);
        VendorEscrow.MilestoneInput[] memory empty = new VendorEscrow.MilestoneInput[](0);
        vm.expectRevert(VendorEscrow.EmptyMilestones.selector);
        escrow.createWorkOrder(vendor, "title", "desc", empty, inspector);
    }

    function test_CreateWorkOrder_RevertsZeroMilestoneAmount() public {
        vm.prank(board);
        VendorEscrow.MilestoneInput[] memory ms = new VendorEscrow.MilestoneInput[](2);
        ms[0] = VendorEscrow.MilestoneInput("Good milestone", 500e6);
        ms[1] = VendorEscrow.MilestoneInput("Zero milestone", 0);
        vm.expectRevert(VendorEscrow.ZeroAmount.selector);
        escrow.createWorkOrder(vendor, "title", "desc", ms, inspector);
    }

    // ════════════════════════════════════════════════════════════════════════
    // APPROVE MILESTONE
    // ════════════════════════════════════════════════════════════════════════

    function test_ApproveMilestone_ReleasesUSDC() public {
        _createOrder();
        uint256 vendorBefore = usdc.balanceOf(vendor);
        uint256 escrowBefore = usdc.balanceOf(address(escrow));

        vm.expectEmit(true, true, true, true);
        emit VendorEscrow.MilestoneApproved(0, 0, inspector, M1);

        vm.prank(inspector);
        escrow.approveMilestone(0, 0);

        assertEq(usdc.balanceOf(vendor),         vendorBefore + M1);
        assertEq(usdc.balanceOf(address(escrow)), escrowBefore - M1);

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(uint8(wo.milestones[0].status), uint8(VendorEscrow.MilestoneStatus.Approved));
        assertEq(wo.releasedAmount, M1);
        assertEq(uint8(wo.status), uint8(VendorEscrow.WorkOrderStatus.Active));
    }

    function test_ApproveMilestone_AllMilestones_AutoCompletes() public {
        uint256 id = _createOrder();

        vm.prank(inspector);
        escrow.approveMilestone(0, 0);
        vm.prank(inspector);
        escrow.approveMilestone(0, 1);

        vm.expectEmit(true, true, false, true);
        emit VendorEscrow.WorkOrderCompleted(id, TOTAL);

        vm.prank(inspector);
        escrow.approveMilestone(0, 2);

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(uint8(wo.status), uint8(VendorEscrow.WorkOrderStatus.Completed));
        assertGt(wo.completedAt, 0);
        assertEq(wo.releasedAmount, TOTAL);
        assertEq(usdc.balanceOf(vendor), TOTAL);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function test_ApproveMilestone_RevertsNotInspector() public {
        _createOrder();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.NotInspector.selector, stranger, inspector));
        escrow.approveMilestone(0, 0);
    }

    function test_ApproveMilestone_RevertsNotInspector_Board() public {
        _createOrder();
        vm.prank(board);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.NotInspector.selector, board, inspector));
        escrow.approveMilestone(0, 0);
    }

    function test_ApproveMilestone_RevertsAlreadyApproved() public {
        _createOrder();
        vm.prank(inspector);
        escrow.approveMilestone(0, 0);

        vm.prank(inspector);
        vm.expectRevert(abi.encodeWithSelector(
            VendorEscrow.MilestoneNotPending.selector,
            0,
            VendorEscrow.MilestoneStatus.Approved
        ));
        escrow.approveMilestone(0, 0);
    }

    function test_ApproveMilestone_RevertsOutOfBounds() public {
        _createOrder();
        vm.prank(inspector);
        vm.expectRevert(abi.encodeWithSelector(
            VendorEscrow.MilestoneIndexOutOfBounds.selector,
            99,
            3
        ));
        escrow.approveMilestone(0, 99);
    }

    function test_ApproveMilestone_RevertsOnCancelledOrder() public {
        _createOrder();
        vm.prank(board);
        escrow.cancelWorkOrder(0);

        vm.prank(inspector);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.WorkOrderAlreadyCancelled.selector, 0));
        escrow.approveMilestone(0, 0);
    }

    function test_ApproveMilestone_RevertsOnCompletedOrder() public {
        _createOrder();
        vm.prank(inspector); escrow.approveMilestone(0, 0);
        vm.prank(inspector); escrow.approveMilestone(0, 1);
        vm.prank(inspector); escrow.approveMilestone(0, 2);

        vm.prank(inspector);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.WorkOrderAlreadyCompleted.selector, 0));
        escrow.approveMilestone(0, 0);
    }

    function test_ApproveMilestone_RevertsInvalidWorkOrderId() public {
        vm.prank(inspector);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.WorkOrderNotFound.selector, 99));
        escrow.approveMilestone(99, 0);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DISPUTE MILESTONE
    // ════════════════════════════════════════════════════════════════════════

    function test_DisputeMilestone_ByBoard() public {
        _createOrder();

        vm.expectEmit(true, true, true, true);
        emit VendorEscrow.MilestoneDisputed(0, 1, board, "Work incomplete");

        vm.prank(board);
        escrow.disputeMilestone(0, 1, "Work incomplete");

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(uint8(wo.milestones[1].status), uint8(VendorEscrow.MilestoneStatus.Disputed));
        assertEq(wo.milestones[1].disputeReason, "Work incomplete");
        assertEq(uint8(wo.status), uint8(VendorEscrow.WorkOrderStatus.Disputed));
    }

    function test_DisputeMilestone_ByVendor() public {
        _createOrder();

        vm.prank(vendor);
        escrow.disputeMilestone(0, 0, "Inspector overstepping");

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(uint8(wo.milestones[0].status), uint8(VendorEscrow.MilestoneStatus.Disputed));
        assertEq(uint8(wo.status), uint8(VendorEscrow.WorkOrderStatus.Disputed));
    }

    function test_DisputeMilestone_RevertsStranger() public {
        _createOrder();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.NotBoardOrVendor.selector, stranger));
        escrow.disputeMilestone(0, 0, "bad actor");
    }

    function test_DisputeMilestone_RevertsOnAlreadyApproved() public {
        _createOrder();
        vm.prank(inspector);
        escrow.approveMilestone(0, 0);

        vm.prank(board);
        vm.expectRevert(abi.encodeWithSelector(
            VendorEscrow.MilestoneNotPending.selector,
            0,
            VendorEscrow.MilestoneStatus.Approved
        ));
        escrow.disputeMilestone(0, 0, "Too late");
    }

    function test_DisputeMilestone_RevertsOnCancelledOrder() public {
        _createOrder();
        vm.prank(board);
        escrow.cancelWorkOrder(0);

        vm.prank(board);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.WorkOrderAlreadyCancelled.selector, 0));
        escrow.disputeMilestone(0, 0, "reason");
    }

    function test_DisputeMilestone_RevertsOnCompletedOrder() public {
        _createOrder();
        vm.prank(inspector); escrow.approveMilestone(0, 0);
        vm.prank(inspector); escrow.approveMilestone(0, 1);
        vm.prank(inspector); escrow.approveMilestone(0, 2);

        vm.prank(board);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.WorkOrderAlreadyCompleted.selector, 0));
        escrow.disputeMilestone(0, 0, "Too late");
    }

    function test_DisputeMilestone_RevertsOutOfBounds() public {
        _createOrder();
        vm.prank(board);
        vm.expectRevert(abi.encodeWithSelector(
            VendorEscrow.MilestoneIndexOutOfBounds.selector,
            5,
            3
        ));
        escrow.disputeMilestone(0, 5, "reason");
    }

    // ════════════════════════════════════════════════════════════════════════
    // RESOLVE DISPUTE
    // ════════════════════════════════════════════════════════════════════════

    function test_ResolveDispute_ReleaseToVendor() public {
        _createOrder();
        vm.prank(board);
        escrow.disputeMilestone(0, 1, "Dispute A");

        uint256 vendorBefore   = usdc.balanceOf(vendor);
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        vm.expectEmit(true, true, false, true);
        emit VendorEscrow.DisputeResolved(0, 1, true, governor);

        vm.prank(governor);
        escrow.resolveDispute(0, 1, true);

        // Vendor received milestone 2 amount
        assertEq(usdc.balanceOf(vendor),   vendorBefore   + M2);
        assertEq(usdc.balanceOf(treasury), treasuryBefore); // treasury unchanged

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(uint8(wo.milestones[1].status), uint8(VendorEscrow.MilestoneStatus.Approved));
        assertEq(wo.releasedAmount, M2);
        // Dispute cleared → back to Created (no milestones approved yet via inspector)
        assertEq(uint8(wo.status), uint8(VendorEscrow.WorkOrderStatus.Active));
    }

    function test_ResolveDispute_ReturnToTreasury() public {
        _createOrder();
        vm.prank(board);
        escrow.disputeMilestone(0, 1, "Dispute B");

        uint256 treasuryBefore = usdc.balanceOf(treasury);
        uint256 vendorBefore   = usdc.balanceOf(vendor);

        vm.expectEmit(true, true, false, true);
        emit VendorEscrow.DisputeResolved(0, 1, false, governor);

        vm.prank(governor);
        escrow.resolveDispute(0, 1, false);

        // Treasury gets refund, vendor untouched
        assertEq(usdc.balanceOf(treasury), treasuryBefore + M2);
        assertEq(usdc.balanceOf(vendor),   vendorBefore);

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(uint8(wo.milestones[1].status), uint8(VendorEscrow.MilestoneStatus.Returned));
    }

    function test_ResolveDispute_AllReturned_AutoCompletes() public {
        // dispute all 3 milestones then return all → should auto-complete
        _createOrder();
        vm.prank(board); escrow.disputeMilestone(0, 0, "d0");
        // need to re-dispute each — but can only dispute Pending milestones
        // After resolving 0 back to Returned, ms1 and ms2 are still Pending
        vm.prank(governor); escrow.resolveDispute(0, 0, false);

        vm.prank(board); escrow.disputeMilestone(0, 1, "d1");
        vm.prank(governor); escrow.resolveDispute(0, 1, false);

        vm.prank(board); escrow.disputeMilestone(0, 2, "d2");

        vm.expectEmit(true, true, false, false);
        emit VendorEscrow.WorkOrderCompleted(0, TOTAL);

        vm.prank(governor); escrow.resolveDispute(0, 2, false);

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(uint8(wo.status), uint8(VendorEscrow.WorkOrderStatus.Completed));
    }

    function test_ResolveDispute_MixedOutcome_AutoCompletes() public {
        // Approve ms0, dispute ms1 (return), approve ms2 → complete
        _createOrder();
        vm.prank(inspector); escrow.approveMilestone(0, 0); // approved
        vm.prank(board);     escrow.disputeMilestone(0, 1, "issue");
        vm.prank(governor);  escrow.resolveDispute(0, 1, false); // returned
        vm.prank(inspector); escrow.approveMilestone(0, 2); // approved

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(uint8(wo.status), uint8(VendorEscrow.WorkOrderStatus.Completed));
        assertEq(usdc.balanceOf(vendor), M1 + M3);
        assertEq(usdc.balanceOf(treasury), 100_000e6 - TOTAL + M2); // got M2 back
    }

    function test_ResolveDispute_RevertsNotGovernor() public {
        _createOrder();
        vm.prank(board); escrow.disputeMilestone(0, 0, "x");

        vm.prank(board);
        vm.expectRevert();
        escrow.resolveDispute(0, 0, true);
    }

    function test_ResolveDispute_RevertsNotDisputed() public {
        _createOrder();
        vm.prank(governor);
        vm.expectRevert(abi.encodeWithSelector(
            VendorEscrow.MilestoneNotDisputed.selector,
            0,
            VendorEscrow.MilestoneStatus.Pending
        ));
        escrow.resolveDispute(0, 0, true);
    }

    function test_ResolveDispute_RevertsOnCancelled() public {
        _createOrder();
        vm.prank(board); escrow.cancelWorkOrder(0);

        vm.prank(governor);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.WorkOrderAlreadyCancelled.selector, 0));
        escrow.resolveDispute(0, 0, true);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CANCEL WORK ORDER
    // ════════════════════════════════════════════════════════════════════════

    function test_CancelWorkOrder_BeforeAnyApproval() public {
        _createOrder();
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        vm.expectEmit(true, true, false, true);
        emit VendorEscrow.WorkOrderCancelled(0, board, TOTAL);

        vm.prank(board);
        escrow.cancelWorkOrder(0);

        // All USDC returned to treasury
        assertEq(usdc.balanceOf(treasury),        treasuryBefore + TOTAL);
        assertEq(usdc.balanceOf(address(escrow)), 0);

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(uint8(wo.status), uint8(VendorEscrow.WorkOrderStatus.Cancelled));
        assertGt(wo.completedAt, 0);
    }

    function test_CancelWorkOrder_RevertsAfterMilestoneApproved() public {
        _createOrder();
        vm.prank(inspector);
        escrow.approveMilestone(0, 0);

        vm.prank(board);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.CannotCancelAfterApproval.selector, 0));
        escrow.cancelWorkOrder(0);
    }

    function test_CancelWorkOrder_RevertsAlreadyCancelled() public {
        _createOrder();
        vm.prank(board); escrow.cancelWorkOrder(0);

        vm.prank(board);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.WorkOrderAlreadyCancelled.selector, 0));
        escrow.cancelWorkOrder(0);
    }

    function test_CancelWorkOrder_RevertsAlreadyCompleted() public {
        _createOrder();
        vm.prank(inspector); escrow.approveMilestone(0, 0);
        vm.prank(inspector); escrow.approveMilestone(0, 1);
        vm.prank(inspector); escrow.approveMilestone(0, 2);

        vm.prank(board);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.WorkOrderAlreadyCompleted.selector, 0));
        escrow.cancelWorkOrder(0);
    }

    function test_CancelWorkOrder_RevertsNotBoard() public {
        _createOrder();
        vm.prank(stranger);
        vm.expectRevert();
        escrow.cancelWorkOrder(0);
    }

    function test_CancelWorkOrder_RevertsInvalidId() public {
        vm.prank(board);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.WorkOrderNotFound.selector, 0));
        escrow.cancelWorkOrder(0);
    }

    function test_CancelWorkOrder_WithDisputedMilestone_StillCancels() public {
        // Disputed milestone still Pending-status-wise for cancel check (releasedAmount == 0)
        _createOrder();
        vm.prank(board); escrow.disputeMilestone(0, 0, "pre-cancel dispute");
        // releasedAmount is still 0 — cancel should fail because status is Disputed
        // Actually: cancelWorkOrder checks releasedAmount > 0, not disputed state.
        // A disputed order has releasedAmount == 0, so cancel should succeed.
        uint256 treasuryBefore = usdc.balanceOf(treasury);
        vm.prank(board);
        escrow.cancelWorkOrder(0);
        assertEq(usdc.balanceOf(treasury), treasuryBefore + TOTAL);
    }

    // ════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════

    function test_GetWorkOrder_Reverts_InvalidId() public {
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.WorkOrderNotFound.selector, 0));
        escrow.getWorkOrder(0);
    }

    function test_GetWorkOrderCount_Zero() public view {
        assertEq(escrow.getWorkOrderCount(), 0);
    }

    function test_GetWorkOrderCount_Multiple() public {
        _createOrder();
        _createOrder();
        assertEq(escrow.getWorkOrderCount(), 2);
    }

    function test_GetVendorWorkOrders_Empty() public view {
        assertEq(escrow.getVendorWorkOrders(vendor).length, 0);
    }

    function test_GetVendorWorkOrders_Multiple() public {
        _createOrder(); // id 0
        _createOrder(); // id 1 (same vendor)
        uint256[] memory orders = escrow.getVendorWorkOrders(vendor);
        assertEq(orders.length, 2);
        assertEq(orders[0], 0);
        assertEq(orders[1], 1);
    }

    function test_GetActiveWorkOrders_Empty() public view {
        VendorEscrow.WorkOrder[] memory active = escrow.getActiveWorkOrders();
        assertEq(active.length, 0);
    }

    function test_GetActiveWorkOrders_ExcludesCompleted() public {
        _createOrder();
        vm.prank(inspector); escrow.approveMilestone(0, 0);
        vm.prank(inspector); escrow.approveMilestone(0, 1);
        vm.prank(inspector); escrow.approveMilestone(0, 2);

        VendorEscrow.WorkOrder[] memory active = escrow.getActiveWorkOrders();
        assertEq(active.length, 0);
    }

    function test_GetActiveWorkOrders_ExcludesCancelled() public {
        _createOrder();
        vm.prank(board); escrow.cancelWorkOrder(0);

        VendorEscrow.WorkOrder[] memory active = escrow.getActiveWorkOrders();
        assertEq(active.length, 0);
    }

    function test_GetActiveWorkOrders_IncludesCreatedActiveDisputed() public {
        _createOrder();           // Created → id 0
        _createOrder();           // Created → id 1
        vm.prank(inspector); escrow.approveMilestone(0, 0); // id 0 → Active
        vm.prank(board);     escrow.disputeMilestone(1, 1, "d"); // id 1 → Disputed

        _createOrder(); // id 2 → Created
        vm.prank(inspector); escrow.approveMilestone(2, 0);
        vm.prank(inspector); escrow.approveMilestone(2, 1);
        vm.prank(inspector); escrow.approveMilestone(2, 2); // id 2 → Completed

        VendorEscrow.WorkOrder[] memory active = escrow.getActiveWorkOrders();
        assertEq(active.length, 2); // id 0 (Active) and id 1 (Disputed)
    }

    // ════════════════════════════════════════════════════════════════════════
    // USDC FLOW ASSERTIONS
    // ════════════════════════════════════════════════════════════════════════

    function test_UsdcFlow_FullHappyPath() public {
        uint256 treasuryStart = usdc.balanceOf(treasury);
        uint256 vendorStart   = usdc.balanceOf(vendor);

        _createOrder();

        // After create: TOTAL in escrow
        assertEq(usdc.balanceOf(address(escrow)), TOTAL);
        assertEq(usdc.balanceOf(treasury), treasuryStart - TOTAL);

        // Approve M1
        vm.prank(inspector); escrow.approveMilestone(0, 0);
        assertEq(usdc.balanceOf(vendor),          vendorStart + M1);
        assertEq(usdc.balanceOf(address(escrow)), M2 + M3);

        // Approve M2
        vm.prank(inspector); escrow.approveMilestone(0, 1);
        assertEq(usdc.balanceOf(vendor),          vendorStart + M1 + M2);
        assertEq(usdc.balanceOf(address(escrow)), M3);

        // Approve M3 — completes
        vm.prank(inspector); escrow.approveMilestone(0, 2);
        assertEq(usdc.balanceOf(vendor),          vendorStart + TOTAL);
        assertEq(usdc.balanceOf(address(escrow)), 0);
        assertEq(usdc.balanceOf(treasury),        treasuryStart - TOTAL);
    }

    function test_UsdcFlow_CancelReturnsAll() public {
        uint256 treasuryStart = usdc.balanceOf(treasury);

        _createOrder();
        assertEq(usdc.balanceOf(address(escrow)), TOTAL);

        vm.prank(board); escrow.cancelWorkOrder(0);

        assertEq(usdc.balanceOf(address(escrow)), 0);
        assertEq(usdc.balanceOf(treasury),        treasuryStart); // fully restored
        assertEq(usdc.balanceOf(vendor),          0);
    }

    function test_UsdcFlow_DisputeReturnedToTreasury() public {
        uint256 treasuryStart = usdc.balanceOf(treasury);

        _createOrder();
        vm.prank(board);     escrow.disputeMilestone(0, 0, "dispute");
        vm.prank(governor);  escrow.resolveDispute(0, 0, false);

        assertEq(usdc.balanceOf(treasury),        treasuryStart - TOTAL + M1);
        assertEq(usdc.balanceOf(address(escrow)), M2 + M3);
        assertEq(usdc.balanceOf(vendor),          0);
    }

    // ════════════════════════════════════════════════════════════════════════
    // FULL SCENARIO TESTS
    // ════════════════════════════════════════════════════════════════════════

    function test_FullHappyPath() public {
        uint256 id = _createOrder();
        assertEq(uint8(escrow.getWorkOrder(id).status), uint8(VendorEscrow.WorkOrderStatus.Created));

        vm.prank(inspector); escrow.approveMilestone(id, 0);
        assertEq(uint8(escrow.getWorkOrder(id).status), uint8(VendorEscrow.WorkOrderStatus.Active));

        vm.prank(inspector); escrow.approveMilestone(id, 1);
        assertEq(uint8(escrow.getWorkOrder(id).status), uint8(VendorEscrow.WorkOrderStatus.Active));

        vm.prank(inspector); escrow.approveMilestone(id, 2);
        assertEq(uint8(escrow.getWorkOrder(id).status), uint8(VendorEscrow.WorkOrderStatus.Completed));

        assertEq(usdc.balanceOf(vendor), TOTAL);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function test_FullDisputeFlow_ReleaseToVendor() public {
        _createOrder();

        // Inspector approves ms0
        vm.prank(inspector); escrow.approveMilestone(0, 0);

        // Board disputes ms1
        vm.prank(board); escrow.disputeMilestone(0, 1, "Work not up to code");
        assertEq(uint8(escrow.getWorkOrder(0).status), uint8(VendorEscrow.WorkOrderStatus.Disputed));

        // Governance releases ms1 to vendor
        vm.prank(governor); escrow.resolveDispute(0, 1, true);
        assertEq(uint8(escrow.getWorkOrder(0).status), uint8(VendorEscrow.WorkOrderStatus.Active));

        // Inspector approves ms2 → complete
        vm.prank(inspector); escrow.approveMilestone(0, 2);
        assertEq(uint8(escrow.getWorkOrder(0).status), uint8(VendorEscrow.WorkOrderStatus.Completed));

        assertEq(usdc.balanceOf(vendor), TOTAL);
    }

    function test_FullDisputeFlow_ReturnToTreasury() public {
        uint256 treasuryStart = usdc.balanceOf(treasury);
        _createOrder();

        vm.prank(inspector); escrow.approveMilestone(0, 0); // vendor gets M1
        vm.prank(board);     escrow.disputeMilestone(0, 1, "No show");
        vm.prank(governor);  escrow.resolveDispute(0, 1, false); // M2 returned
        vm.prank(inspector); escrow.approveMilestone(0, 2); // vendor gets M3

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(uint8(wo.status), uint8(VendorEscrow.WorkOrderStatus.Completed));

        assertEq(usdc.balanceOf(vendor),   M1 + M3);
        assertEq(usdc.balanceOf(treasury), treasuryStart - TOTAL + M2);
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACCESS CONTROL
    // ════════════════════════════════════════════════════════════════════════

    function test_AccessControl_OnlyBoardCanCreate() public {
        vm.prank(governor);
        vm.expectRevert();
        escrow.createWorkOrder(vendor, "t", "d", _threeMs(), inspector);

        vm.prank(inspector);
        vm.expectRevert();
        escrow.createWorkOrder(vendor, "t", "d", _threeMs(), inspector);
    }

    function test_AccessControl_OnlyGovernorCanResolve() public {
        _createOrder();
        vm.prank(board); escrow.disputeMilestone(0, 0, "x");

        vm.prank(inspector);
        vm.expectRevert();
        escrow.resolveDispute(0, 0, true);

        vm.prank(vendor);
        vm.expectRevert();
        escrow.resolveDispute(0, 0, true);
    }

    function test_AccessControl_OnlyBoardCanCancel() public {
        _createOrder();
        vm.prank(governor);
        vm.expectRevert();
        escrow.cancelWorkOrder(0);

        vm.prank(inspector);
        vm.expectRevert();
        escrow.cancelWorkOrder(0);
    }

    function test_AccessControl_InspectorCannotDisputeOwnOrder() public {
        _createOrder();
        // Inspector is not board and not vendor — should revert
        vm.prank(inspector);
        vm.expectRevert(abi.encodeWithSelector(VendorEscrow.NotBoardOrVendor.selector, inspector));
        escrow.disputeMilestone(0, 0, "I'm the inspector");
    }

    // ════════════════════════════════════════════════════════════════════════
    // SINGLE MILESTONE WORK ORDER
    // ════════════════════════════════════════════════════════════════════════

    function test_SingleMilestone_HappyPath() public {
        vm.prank(board);
        VendorEscrow.MilestoneInput[] memory ms = new VendorEscrow.MilestoneInput[](1);
        ms[0] = VendorEscrow.MilestoneInput("Full plumbing repair", 1500e6);
        uint256 id = escrow.createWorkOrder(vendor, "Plumbing", "Fix all pipes", ms, inspector);

        vm.expectEmit(true, true, false, true);
        emit VendorEscrow.WorkOrderCompleted(id, 1500e6);

        vm.prank(inspector);
        escrow.approveMilestone(id, 0);

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(id);
        assertEq(uint8(wo.status), uint8(VendorEscrow.WorkOrderStatus.Completed));
        assertEq(usdc.balanceOf(vendor), 1500e6);
    }

    // ════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════════════════════

    function test_Event_WorkOrderCreated() public {
        vm.expectEmit(true, true, true, true);
        emit VendorEscrow.WorkOrderCreated(0, vendor, inspector, TOTAL, 3);
        _createOrder();
    }

    function test_Event_WorkOrderCancelled() public {
        _createOrder();
        vm.expectEmit(true, true, false, true);
        emit VendorEscrow.WorkOrderCancelled(0, board, TOTAL);
        vm.prank(board); escrow.cancelWorkOrder(0);
    }

    function test_Event_WorkOrderCompleted_OnLastMilestone() public {
        _createOrder();
        vm.prank(inspector); escrow.approveMilestone(0, 0);
        vm.prank(inspector); escrow.approveMilestone(0, 1);

        vm.expectEmit(true, true, false, true);
        emit VendorEscrow.WorkOrderCompleted(0, TOTAL);
        vm.prank(inspector); escrow.approveMilestone(0, 2);
    }

    function test_Event_MilestoneDisputed() public {
        _createOrder();
        vm.expectEmit(true, true, true, true);
        emit VendorEscrow.MilestoneDisputed(0, 0, board, "Dispute reason");
        vm.prank(board); escrow.disputeMilestone(0, 0, "Dispute reason");
    }

    function test_Event_DisputeResolved() public {
        _createOrder();
        vm.prank(board); escrow.disputeMilestone(0, 0, "x");
        vm.expectEmit(true, true, false, true);
        emit VendorEscrow.DisputeResolved(0, 0, true, governor);
        vm.prank(governor); escrow.resolveDispute(0, 0, true);
    }

    // ════════════════════════════════════════════════════════════════════════
    // TIMESTAMPS
    // ════════════════════════════════════════════════════════════════════════

    function test_Timestamps_CreatedAt() public {
        vm.warp(1_700_000_000);
        _createOrder();
        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(wo.createdAt, 1_700_000_000);
        assertEq(wo.completedAt, 0);
    }

    function test_Timestamps_CompletedAt_OnComplete() public {
        _createOrder();
        vm.warp(1_800_000_000);
        vm.prank(inspector); escrow.approveMilestone(0, 0);
        vm.prank(inspector); escrow.approveMilestone(0, 1);
        vm.prank(inspector); escrow.approveMilestone(0, 2);
        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(wo.completedAt, 1_800_000_000);
    }

    function test_Timestamps_CompletedAt_OnCancel() public {
        _createOrder();
        vm.warp(1_900_000_000);
        vm.prank(board); escrow.cancelWorkOrder(0);
        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(0);
        assertEq(wo.completedAt, 1_900_000_000);
    }

    // ════════════════════════════════════════════════════════════════════════
    // MULTI-ORDER ISOLATION
    // ════════════════════════════════════════════════════════════════════════

    function test_MultipleOrders_Independent() public {
        // Two independent work orders
        uint256 id0 = _createOrder();

        vm.prank(board);
        VendorEscrow.MilestoneInput[] memory ms = new VendorEscrow.MilestoneInput[](1);
        ms[0] = VendorEscrow.MilestoneInput("Roof", 400e6);
        uint256 id1 = escrow.createWorkOrder(vendor2, "Roofing", "desc", ms, inspector);

        // Cancel order 0
        vm.prank(board); escrow.cancelWorkOrder(id0);

        // Order 1 should be unaffected
        VendorEscrow.WorkOrder memory wo1 = escrow.getWorkOrder(id1);
        assertEq(uint8(wo1.status), uint8(VendorEscrow.WorkOrderStatus.Created));

        // Complete order 1
        vm.prank(inspector); escrow.approveMilestone(id1, 0);
        assertEq(uint8(escrow.getWorkOrder(id1).status), uint8(VendorEscrow.WorkOrderStatus.Completed));
    }
}
