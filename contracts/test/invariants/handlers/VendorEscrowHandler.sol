// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../../src/VendorEscrow.sol";
import "../../helpers/MockUSDC.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockTreasuryForEscrow
 * @notice Minimal treasury stand-in that (a) holds USDC, (b) approves the
 *         escrow contract as spender so createWorkOrder can pull funds, and
 *         (c) implements creditRefundFromEscrow so resolveDispute(false) and
 *         cancelWorkOrder can push funds back. Tracks a simple counter so
 *         the invariant contract can cross-check fund flow.
 */
contract MockTreasuryForEscrow {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    uint256 public refundsReceived;

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    /// @notice One-time setup: approve the escrow contract as spender.
    function approveEscrow(address escrow) external {
        usdc.forceApprove(escrow, type(uint256).max);
    }

    function creditRefundFromEscrow(uint256 amount, bool /*isReserve*/) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        refundsReceived += amount;
    }
}

/**
 * @title VendorEscrowHandler
 * @notice Handler for VendorEscrow invariant fuzzing. Exercises
 *         createWorkOrder, approveMilestone (via inspector prank), disputeMilestone,
 *         resolveDispute, and cancelWorkOrder across a bounded set of actors.
 *
 *         The handler itself holds BOARD_ROLE and GOVERNOR_ROLE — the two
 *         roles that gate the "control" surface. Inspector and vendor actions
 *         are executed via vm.prank against actors kept in the vendor/inspector
 *         pools.
 *
 * Invariant exercised:
 *   FUND INTEGRITY — escrow's USDC balance equals the sum of milestone.amount
 *   over milestones that are still held (Pending or Disputed) in non-cancelled
 *   work orders. Nothing can get stuck and nothing can leak.
 */
contract VendorEscrowHandler is Test {
    VendorEscrow public immutable escrow;
    MockTreasuryForEscrow public immutable treasury;
    MockUSDC public immutable usdc;

    // Disjoint pools so vendor != inspector is trivially true in most calls
    address[] public vendors;
    address[] public inspectors;

    // Ghost counters
    uint256 public callsCreate;
    uint256 public callsApprove;
    uint256 public callsDispute;
    uint256 public callsResolve;
    uint256 public callsCancel;

    uint256 public ghost_ordersCreated;
    uint256 public ghost_totalEscrowedEver;

    constructor(
        VendorEscrow _escrow,
        MockTreasuryForEscrow _treasury,
        MockUSDC _usdc,
        address[] memory _vendors,
        address[] memory _inspectors
    ) {
        escrow = _escrow;
        treasury = _treasury;
        usdc = _usdc;
        for (uint256 i = 0; i < _vendors.length; i++) vendors.push(_vendors[i]);
        for (uint256 i = 0; i < _inspectors.length; i++) inspectors.push(_inspectors[i]);
    }

    function _pickVendor(uint256 seed) internal view returns (address) {
        return vendors[seed % vendors.length];
    }

    function _pickInspector(uint256 seed, address vendor) internal view returns (address) {
        address chosen = inspectors[seed % inspectors.length];
        if (chosen == vendor) chosen = inspectors[(seed + 1) % inspectors.length];
        return chosen;
    }

    // ── Create a new work order ──────────────────────────────────────────────

    function createWorkOrder(
        uint256 vendorSeed,
        uint256 inspectorSeed,
        uint256 milestoneCountSeed,
        uint256 amountSeed,
        bool fromReserve
    ) external {
        callsCreate++;
        address vendor = _pickVendor(vendorSeed);
        address inspector = _pickInspector(inspectorSeed, vendor);
        if (inspector == vendor) return;

        uint256 count = bound(milestoneCountSeed, 1, 4);
        uint256 perMilestone = bound(amountSeed, 1e6, 500e6); // $1 - $500

        VendorEscrow.MilestoneInput[] memory ms = new VendorEscrow.MilestoneInput[](count);
        uint256 total;
        for (uint256 i = 0; i < count; i++) {
            ms[i] = VendorEscrow.MilestoneInput({
                description: "m",
                amount: perMilestone
            });
            total += perMilestone;
        }

        // Treasury is seeded once in setUp. If it's exhausted, short-circuit.
        if (usdc.balanceOf(address(treasury)) < total) return;

        try escrow.createWorkOrder(vendor, "fuzz", "fuzz-desc", ms, inspector, fromReserve) {
            ghost_ordersCreated++;
            ghost_totalEscrowedEver += total;
        } catch {}
    }

    // ── Inspector approves a milestone ───────────────────────────────────────

    function approveMilestone(uint256 orderSeed, uint256 msSeed) external {
        callsApprove++;
        uint256 n = escrow.getWorkOrderCount();
        if (n == 0) return;
        uint256 orderId = orderSeed % n;

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(orderId);
        if (wo.milestones.length == 0) return;
        uint256 msIndex = msSeed % wo.milestones.length;

        vm.prank(wo.inspector);
        try escrow.approveMilestone(orderId, msIndex) {} catch {}
    }

    // ── Board or vendor raises a dispute ─────────────────────────────────────

    function disputeMilestone(uint256 orderSeed, uint256 msSeed, bool asVendor) external {
        callsDispute++;
        uint256 n = escrow.getWorkOrderCount();
        if (n == 0) return;
        uint256 orderId = orderSeed % n;

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(orderId);
        if (wo.milestones.length == 0) return;
        uint256 msIndex = msSeed % wo.milestones.length;

        if (asVendor) {
            vm.prank(wo.vendor);
            try escrow.disputeMilestone(orderId, msIndex, "fuzz") {} catch {}
        } else {
            // Handler holds BOARD_ROLE
            try escrow.disputeMilestone(orderId, msIndex, "fuzz") {} catch {}
        }
    }

    // ── Governance resolves a disputed milestone ─────────────────────────────

    function resolveDispute(uint256 orderSeed, uint256 msSeed, bool releaseToVendor) external {
        callsResolve++;
        uint256 n = escrow.getWorkOrderCount();
        if (n == 0) return;
        uint256 orderId = orderSeed % n;

        VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(orderId);
        if (wo.milestones.length == 0) return;
        uint256 msIndex = msSeed % wo.milestones.length;

        // Handler holds GOVERNOR_ROLE
        try escrow.resolveDispute(orderId, msIndex, releaseToVendor) {} catch {}
    }

    // ── Board cancels a work order ───────────────────────────────────────────

    function cancelWorkOrder(uint256 orderSeed) external {
        callsCancel++;
        uint256 n = escrow.getWorkOrderCount();
        if (n == 0) return;
        uint256 orderId = orderSeed % n;

        // Handler holds BOARD_ROLE
        try escrow.cancelWorkOrder(orderId) {} catch {}
    }
}
