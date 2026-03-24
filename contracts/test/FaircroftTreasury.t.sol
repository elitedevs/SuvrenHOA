// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/FaircroftTreasury.sol";
import "./helpers/MockUSDC.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

contract FaircroftTreasuryTest is Test {
    FaircroftTreasury public treasury;
    MockUSDC public usdc;

    address public deployer = address(this);
    address public boardMultisig = address(0xB0A2D);
    address public timelockAddr = address(0x71AECC);
    address public alice = address(0xA11CE);
    address public vendor1 = address(0x7E4D01);
    address public vendor2 = address(0x7E4D02);
    address public unauthorized = address(0xDEAD);

    uint256 constant QUARTERLY_DUES = 200e6;   // $200
    uint256 constant ANNUAL_DISCOUNT = 500;     // 5%
    uint256 constant EMERGENCY_LIMIT = 5000e6;  // $5,000

    function setUp() public {
        usdc = new MockUSDC();
        treasury = new FaircroftTreasury(
            address(usdc),
            QUARTERLY_DUES,
            ANNUAL_DISCOUNT,
            EMERGENCY_LIMIT
        );

        // Grant roles
        treasury.grantRole(treasury.TREASURER_ROLE(), boardMultisig);
        treasury.grantRole(treasury.GOVERNOR_ROLE(), timelockAddr);

        // Fund alice with USDC
        usdc.mint(alice, 10_000e6); // $10,000

        // Alice approves treasury to spend her USDC
        vm.prank(alice);
        usdc.approve(address(treasury), type(uint256).max);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Dues Payment
    // ═══════════════════════════════════════════════════════════════════════

    function test_PayOneQuarter() public {
        vm.prank(alice);
        treasury.payDues(1, 1);

        (uint128 paidThrough, uint128 totalPaid) = treasury.duesRecords(1);
        assertEq(totalPaid, QUARTERLY_DUES);
        assertTrue(paidThrough > block.timestamp);
        assertTrue(treasury.isDuesCurrent(1));

        // Check split: 80% operating, 20% reserve
        assertEq(treasury.operatingBalance(), QUARTERLY_DUES * 8000 / 10000);
        assertEq(treasury.reserveBalance(), QUARTERLY_DUES * 2000 / 10000);
    }

    function test_PayAnnualWithDiscount() public {
        vm.prank(alice);
        treasury.payDues(1, 4); // Annual

        uint256 annual = QUARTERLY_DUES * 4;
        uint256 discounted = annual - (annual * ANNUAL_DISCOUNT / 10000);

        (, uint128 totalPaid) = treasury.duesRecords(1);
        assertEq(totalPaid, uint128(discounted));

        // $200 * 4 = $800, -5% = $760
        assertEq(discounted, 760e6);
    }

    function test_PayMultipleQuarters() public {
        vm.prank(alice);
        treasury.payDues(1, 2);

        (, uint128 totalPaid) = treasury.duesRecords(1);
        assertEq(totalPaid, QUARTERLY_DUES * 2);
    }

    function test_PayForSomeoneElse() public {
        // Bob pays for lot 1 (alice's lot) — gifts/trusts
        address bob = address(0xB0B);
        usdc.mint(bob, 1000e6);
        vm.prank(bob);
        usdc.approve(address(treasury), type(uint256).max);

        vm.prank(bob);
        treasury.payDues(1, 1);

        assertTrue(treasury.isDuesCurrent(1));
    }

    function test_ExtendDuesPaidThrough() public {
        vm.prank(alice);
        treasury.payDues(1, 1);

        (uint128 firstPaidThrough,) = treasury.duesRecords(1);

        vm.prank(alice);
        treasury.payDues(1, 1);

        (uint128 secondPaidThrough,) = treasury.duesRecords(1);
        assertGt(secondPaidThrough, firstPaidThrough);
    }

    function test_LateFeeApplied() public {
        // Pay first quarter
        vm.prank(alice);
        treasury.payDues(1, 1);

        (uint128 paidThrough,) = treasury.duesRecords(1);

        // Warp past grace period
        vm.warp(paidThrough + 30 days + 1);

        // Pay next quarter — should include late fee
        uint256 balanceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        treasury.payDues(1, 1);
        uint256 balanceAfter = usdc.balanceOf(alice);

        uint256 paid = balanceBefore - balanceAfter;
        uint256 expected = QUARTERLY_DUES + (QUARTERLY_DUES * 1000 / 10000); // +10%
        assertEq(paid, expected);
    }

    function test_NoLateFeeWithinGracePeriod() public {
        vm.prank(alice);
        treasury.payDues(1, 1);

        (uint128 paidThrough,) = treasury.duesRecords(1);

        // Warp to just within grace period
        vm.warp(paidThrough + 29 days);

        uint256 balanceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        treasury.payDues(1, 1);
        uint256 paid = balanceBefore - usdc.balanceOf(alice);

        assertEq(paid, QUARTERLY_DUES); // No late fee
    }

    function test_RevertInvalidPaymentPeriod() public {
        vm.prank(alice);
        vm.expectRevert(FaircroftTreasury.InvalidPaymentPeriod.selector);
        treasury.payDues(1, 0);

        vm.prank(alice);
        vm.expectRevert(FaircroftTreasury.InvalidPaymentPeriod.selector);
        treasury.payDues(1, 5);
    }

    function test_EmitsDuesPaidEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, false);
        emit FaircroftTreasury.DuesPaid(1, alice, QUARTERLY_DUES, 1, 0);
        treasury.payDues(1, 1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Expenditures (Governance-Approved)
    // ═══════════════════════════════════════════════════════════════════════

    function test_MakeExpenditure() public {
        // Fund the treasury
        _fundTreasury(1000e6);

        vm.prank(timelockAddr);
        treasury.makeExpenditure(vendor1, 500e6, "Landscaping Q1", "maintenance", 42);

        assertEq(usdc.balanceOf(vendor1), 500e6);
        assertEq(treasury.operatingBalance(), 800e6 - 500e6); // 1000 * 80% - 500
        assertEq(treasury.getExpenditureCount(), 1);

        FaircroftTreasury.Expenditure memory exp = treasury.getExpenditure(0);
        assertEq(exp.vendor, vendor1);
        assertEq(exp.amount, 500e6);
        assertEq(exp.proposalId, 42);
    }

    function test_RevertExpenditureUnauthorized() public {
        _fundTreasury(1000e6);

        bytes32 govRole = treasury.GOVERNOR_ROLE();
        vm.startPrank(unauthorized);
        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            unauthorized, govRole
        ));
        treasury.makeExpenditure(vendor1, 100e6, "Nope", "rejected", 0);
        vm.stopPrank();
    }

    function test_RevertExpenditureInsufficientBalance() public {
        _fundTreasury(100e6); // Funds 1 quarter ($200), operating = $160

        vm.prank(timelockAddr);
        vm.expectRevert(abi.encodeWithSelector(
            FaircroftTreasury.InsufficientOperatingBalance.selector, 500e6, 160e6
        ));
        treasury.makeExpenditure(vendor1, 500e6, "Too much", "rejected", 0);
    }

    function test_RevertExpenditureZeroAmount() public {
        vm.prank(timelockAddr);
        vm.expectRevert(FaircroftTreasury.ZeroAmount.selector);
        treasury.makeExpenditure(vendor1, 0, "Zero", "rejected", 0);
    }

    function test_RevertExpenditureZeroAddress() public {
        vm.prank(timelockAddr);
        vm.expectRevert(FaircroftTreasury.ZeroAddress.selector);
        treasury.makeExpenditure(address(0), 100e6, "Null", "rejected", 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Emergency Spending
    // ═══════════════════════════════════════════════════════════════════════

    function test_EmergencySpend() public {
        _fundTreasury(10_000e6);

        vm.prank(boardMultisig);
        treasury.emergencySpend(vendor1, 2000e6, "Emergency pipe repair");

        assertEq(usdc.balanceOf(vendor1), 2000e6);
        assertEq(treasury.emergencySpentThisPeriod(), 2000e6);
        assertEq(treasury.getExpenditureCount(), 1);
    }

    function test_EmergencySpendLimit() public {
        _fundTreasury(20_000e6);

        vm.prank(boardMultisig);
        treasury.emergencySpend(vendor1, 3000e6, "Repair 1");

        vm.prank(boardMultisig);
        treasury.emergencySpend(vendor2, 2000e6, "Repair 2");

        // Total: $5000 = limit. Next should fail.
        vm.prank(boardMultisig);
        vm.expectRevert(abi.encodeWithSelector(
            FaircroftTreasury.EmergencyLimitExceeded.selector, 1e6, 0
        ));
        treasury.emergencySpend(vendor1, 1e6, "Over limit");
    }

    function test_EmergencyPeriodResets() public {
        _fundTreasury(20_000e6);

        vm.prank(boardMultisig);
        treasury.emergencySpend(vendor1, 5000e6, "Max spend");
        assertEq(treasury.emergencySpentThisPeriod(), 5000e6);

        // Warp past emergency period (30 days)
        vm.warp(block.timestamp + 31 days);

        // Period resets — can spend again
        vm.prank(boardMultisig);
        treasury.emergencySpend(vendor2, 3000e6, "New period");
        assertEq(treasury.emergencySpentThisPeriod(), 3000e6);
    }

    function test_RevertEmergencyUnauthorized() public {
        _fundTreasury(1000e6);

        bytes32 treasurerRole = treasury.TREASURER_ROLE();
        vm.startPrank(unauthorized);
        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            unauthorized, treasurerRole
        ));
        treasury.emergencySpend(vendor1, 100e6, "Unauthorized");
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Reserve Management
    // ═══════════════════════════════════════════════════════════════════════

    function test_TransferReserveToOperating() public {
        _fundTreasury(1000e6);
        // After funding: 800 operating, 200 reserve

        vm.prank(timelockAddr);
        treasury.transferReserve(100e6, true); // reserve → operating

        assertEq(treasury.operatingBalance(), 900e6);
        assertEq(treasury.reserveBalance(), 100e6);
    }

    function test_TransferOperatingToReserve() public {
        _fundTreasury(1000e6);

        vm.prank(timelockAddr);
        treasury.transferReserve(200e6, false); // operating → reserve

        assertEq(treasury.operatingBalance(), 600e6);
        assertEq(treasury.reserveBalance(), 400e6);
    }

    function test_RevertTransferInsufficientReserve() public {
        _fundTreasury(1000e6); // 200 reserve

        vm.prank(timelockAddr);
        vm.expectRevert(abi.encodeWithSelector(
            FaircroftTreasury.InsufficientReserveBalance.selector, 500e6, 200e6
        ));
        treasury.transferReserve(500e6, true);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // View Functions
    // ═══════════════════════════════════════════════════════════════════════

    function test_IsDuesCurrent() public {
        assertFalse(treasury.isDuesCurrent(1)); // Never paid

        vm.prank(alice);
        treasury.payDues(1, 1);
        assertTrue(treasury.isDuesCurrent(1));

        // Warp past paid period
        vm.warp(block.timestamp + 92 days);
        assertFalse(treasury.isDuesCurrent(1));
    }

    function test_GetDuesOwed() public {
        (uint256 q, uint256 amount) = treasury.getDuesOwed(1);
        assertEq(q, 1);
        assertEq(amount, QUARTERLY_DUES);

        vm.prank(alice);
        treasury.payDues(1, 1);

        (q, amount) = treasury.getDuesOwed(1);
        assertEq(q, 0);
        assertEq(amount, 0);
    }

    function test_GetTreasurySnapshot() public {
        _fundTreasury(1000e6);

        (uint256 total, uint256 operating, uint256 reserve, uint256 expCount) = treasury.getTreasurySnapshot();
        assertEq(total, 1000e6);
        assertEq(operating, 800e6);
        assertEq(reserve, 200e6);
        assertEq(expCount, 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Config Updates
    // ═══════════════════════════════════════════════════════════════════════

    function test_SetQuarterlyDues() public {
        vm.prank(timelockAddr);
        treasury.setQuarterlyDues(250e6);
        assertEq(treasury.quarterlyDuesAmount(), 250e6);
    }

    function test_SetAnnualDiscount() public {
        vm.prank(timelockAddr);
        treasury.setAnnualDiscount(1000); // 10%
        assertEq(treasury.annualDuesDiscount(), 1000);
    }

    function test_RevertDiscountTooHigh() public {
        vm.prank(timelockAddr);
        vm.expectRevert(abi.encodeWithSelector(FaircroftTreasury.InvalidBps.selector, 6000));
        treasury.setAnnualDiscount(6000); // 60% — too high
    }

    function test_SetOperatingReserveSplit() public {
        vm.prank(timelockAddr);
        treasury.setOperatingReserveSplit(7000); // 70/30
        assertEq(treasury.operatingReserveSplitBps(), 7000);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════

    /// @dev Fund the treasury by paying dues from a funded wallet.
    ///      This properly updates internal accounting (operating/reserve split).
    function _fundTreasury(uint256 targetAmount) internal {
        // Pay enough quarters across different lots to reach targetAmount
        // Each quarter = $200. 4 quarters (annual) = $760 after 5% discount.
        // Use single quarter payments for simplicity ($200 each).
        uint256 funded = 0;
        uint256 lotId = 9000;

        while (funded < targetAmount) {
            address payer = address(uint160(0xFEED0000 + lotId));
            usdc.mint(payer, QUARTERLY_DUES);

            vm.startPrank(payer);
            usdc.approve(address(treasury), QUARTERLY_DUES);
            treasury.payDues(lotId, 1);
            vm.stopPrank();

            funded += QUARTERLY_DUES;
            lotId++;
        }
    }
}
