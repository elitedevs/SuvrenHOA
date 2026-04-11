// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";
import "../../src/VendorEscrow.sol";
import "../helpers/MockUSDC.sol";
import "./handlers/VendorEscrowHandler.sol";

/**
 * @title VendorEscrowInvariants
 * @notice StdInvariant suite for VendorEscrow.
 *
 * Invariants:
 *   INV_A — FUND INTEGRITY. usdc.balanceOf(escrow) equals the sum of
 *           milestone.amount over milestones whose status is Pending or
 *           Disputed AND whose work order is NOT Cancelled. This is the
 *           central escrow-trust property: held exactly what's still due,
 *           nothing stuck, nothing leaked.
 *   INV_B — PER-ORDER ACCOUNTING. For every work order:
 *             releasedAmount == Σ milestones.amount where status == Approved
 *             releasedAmount <= totalAmount
 *   INV_C — SC-11 GUARD. For every work order, inspector != vendor.
 *   INV_D — TOTAL-SUM CONSERVATION. treasury balance + escrow balance +
 *           vendor payouts == initial mint (cumulative). The whole system
 *           is a closed loop — nothing is lost or created.
 */
contract VendorEscrowInvariants is StdInvariant, Test {
    VendorEscrow public escrow;
    MockTreasuryForEscrow public treasury;
    MockUSDC public usdc;
    VendorEscrowHandler public handler;

    address public board    = address(0xB0A2D);
    address public governor = address(0x60718);

    address public v1 = address(0xA1);
    address public v2 = address(0xA2);
    address public v3 = address(0xA3);

    address public i1 = address(0xB1);
    address public i2 = address(0xB2);
    address public i3 = address(0xB3);

    uint256 public constant INITIAL_TREASURY_USDC = 10_000_000e6; // $10M — plenty of headroom for 32k fuzz calls

    function setUp() public {
        usdc = new MockUSDC();
        treasury = new MockTreasuryForEscrow(address(usdc));
        usdc.mint(address(treasury), INITIAL_TREASURY_USDC);

        escrow = new VendorEscrow(
            address(usdc),
            address(treasury),
            board,    // BOARD_ROLE initial
            governor  // GOVERNOR_ROLE initial
        );

        // Treasury must approve escrow as spender for createWorkOrder to work
        treasury.approveEscrow(address(escrow));

        address[] memory vendors = new address[](3);
        vendors[0] = v1; vendors[1] = v2; vendors[2] = v3;
        address[] memory inspectors = new address[](3);
        inspectors[0] = i1; inspectors[1] = i2; inspectors[2] = i3;

        handler = new VendorEscrowHandler(escrow, treasury, usdc, vendors, inspectors);

        // Grant the handler BOARD and GOVERNOR so it can exercise the full surface
        vm.prank(board);
        escrow.grantRole(escrow.BOARD_ROLE(), address(handler));
        vm.prank(governor);
        escrow.grantRole(escrow.GOVERNOR_ROLE(), address(handler));

        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = VendorEscrowHandler.createWorkOrder.selector;
        selectors[1] = VendorEscrowHandler.approveMilestone.selector;
        selectors[2] = VendorEscrowHandler.disputeMilestone.selector;
        selectors[3] = VendorEscrowHandler.resolveDispute.selector;
        selectors[4] = VendorEscrowHandler.cancelWorkOrder.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  Helpers
    // ═══════════════════════════════════════════════════════════════════════

    /// @dev Walk every work order and accumulate the amount of every milestone
    ///      whose status is Pending or Disputed AND whose parent work order is
    ///      NOT Cancelled. This is exactly what the escrow contract should be
    ///      holding in USDC at any point in time.
    function _expectedEscrowBalance() internal view returns (uint256 held) {
        uint256 n = escrow.getWorkOrderCount();
        for (uint256 o = 0; o < n; o++) {
            VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(o);
            if (wo.status == VendorEscrow.WorkOrderStatus.Cancelled) continue;
            for (uint256 m = 0; m < wo.milestones.length; m++) {
                VendorEscrow.MilestoneStatus s = wo.milestones[m].status;
                if (
                    s == VendorEscrow.MilestoneStatus.Pending ||
                    s == VendorEscrow.MilestoneStatus.Disputed
                ) {
                    held += wo.milestones[m].amount;
                }
            }
        }
    }

    function _sumVendorBalances() internal view returns (uint256 total) {
        total += usdc.balanceOf(v1);
        total += usdc.balanceOf(v2);
        total += usdc.balanceOf(v3);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  INVARIANTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice INV_A — FUND INTEGRITY. Escrow's USDC balance matches exactly
    ///         the sum of still-held milestones. Nothing stuck, nothing leaked.
    function invariant_A_fundIntegrity() public view {
        assertEq(
            usdc.balanceOf(address(escrow)),
            _expectedEscrowBalance(),
            "INV_A: escrow balance drifted from held milestones"
        );
    }

    /// @notice INV_B — Per-order accounting. releasedAmount == sum(approved)
    ///         and releasedAmount <= totalAmount.
    function invariant_B_perOrderAccounting() public view {
        uint256 n = escrow.getWorkOrderCount();
        for (uint256 o = 0; o < n; o++) {
            VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(o);

            uint256 approvedSum;
            for (uint256 m = 0; m < wo.milestones.length; m++) {
                if (wo.milestones[m].status == VendorEscrow.MilestoneStatus.Approved) {
                    approvedSum += wo.milestones[m].amount;
                }
            }

            assertEq(wo.releasedAmount, approvedSum, "INV_B: releasedAmount mismatch");
            assertLe(wo.releasedAmount, wo.totalAmount, "INV_B: releasedAmount > totalAmount");
        }
    }

    /// @notice INV_C — SC-11: inspector is never the same as vendor.
    function invariant_C_inspectorNotVendor() public view {
        uint256 n = escrow.getWorkOrderCount();
        for (uint256 o = 0; o < n; o++) {
            VendorEscrow.WorkOrder memory wo = escrow.getWorkOrder(o);
            assertTrue(wo.inspector != wo.vendor, "INV_C: inspector == vendor");
        }
    }

    /// @notice INV_D — Total-sum conservation. All USDC minted by setUp must
    ///         still exist somewhere (treasury + escrow + vendor payouts).
    ///         Nothing is lost or created.
    function invariant_D_conservation() public view {
        uint256 sum =
            usdc.balanceOf(address(treasury)) +
            usdc.balanceOf(address(escrow))   +
            _sumVendorBalances();
        assertEq(sum, INITIAL_TREASURY_USDC, "INV_D: USDC conservation broken");
    }

    /// @notice Fuzz-distribution sanity.
    function invariant_callTrace() public view { /* no-op */ }
}
