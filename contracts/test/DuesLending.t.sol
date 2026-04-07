// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/DuesLending.sol";
import "../src/PropertyNFT.sol";
import "./helpers/MockUSDC.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

// ── Mock Treasury ─────────────────────────────────────────────────────────────

/**
 * @title MockTreasury
 * @notice Minimal IFaircroftTreasury implementation for DuesLending unit tests.
 *         Handles real USDC flows (withdrawForLoan, payDuesFor, depositFromLoan)
 *         and exposes mutable state so tests can configure reserve balance.
 */
contract MockTreasury {
    using SafeERC20 for IERC20;

    IERC20  public immutable usdc;
    uint256 public quarterlyDuesAmount;
    uint256 public reserveBalance;

    constructor(address _usdc, uint256 _quarterly, uint256 _reserve) {
        usdc                = IERC20(_usdc);
        quarterlyDuesAmount = _quarterly;
        reserveBalance      = _reserve;
    }

    // ── Admin helpers ──────────────────────────────────────────────────────────

    function setQuarterlyDues(uint256 v)  external { quarterlyDuesAmount = v; }
    function setReserveBalance(uint256 v) external { reserveBalance = v; }

    // ── IFaircroftTreasury ─────────────────────────────────────────────────────

    /// @dev DuesLending calls this first; send USDC from treasury → DuesLending.
    function withdrawForLoan(uint256 amount) external {
        require(reserveBalance >= amount, "MT: insufficient reserve");
        reserveBalance -= amount;
        usdc.safeTransfer(msg.sender, amount);
    }

    /// @dev DuesLending calls this after withdrawForLoan to "pay dues" for the
    ///      borrower. DuesLending has approved treasury before calling here.
    function payDuesFor(uint256, uint256 quarters, address payer) external {
        uint256 amount = quarterlyDuesAmount * quarters;
        usdc.safeTransferFrom(payer, address(this), amount);
        reserveBalance += amount; // principal flows back as dues credit
    }

    /// @dev DuesLending calls this when a borrower makes an installment payment.
    function depositFromLoan(uint256 amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        reserveBalance += amount;
    }
}

// ── Reverting Treasury ────────────────────────────────────────────────────────

/// @dev Used to test InsufficientLoanPool when reserve is zero.
contract ZeroReserveTreasury {
    using SafeERC20 for IERC20;

    IERC20  public immutable usdc;
    uint256 public quarterlyDuesAmount;
    uint256 public reserveBalance;

    constructor(address _usdc, uint256 _quarterly) {
        usdc                = IERC20(_usdc);
        quarterlyDuesAmount = _quarterly;
        reserveBalance      = 0; // deliberately zero
    }

    function withdrawForLoan(uint256) external pure { revert("no funds"); }
    function payDuesFor(uint256, uint256, address) external pure {}
    function depositFromLoan(uint256) external pure {}
}

// ── Main Test Contract ────────────────────────────────────────────────────────

/**
 * @title DuesLendingTest
 * @notice Comprehensive tests for DuesLending.sol.
 *
 * Coverage targets:
 *  - Happy-path: requestLoan, makePayment, payOffLoan
 *  - All revert paths on requestLoan (ownership, duplicates, bad params, pool cap)
 *  - makePayment: overpayment cap, minimum enforcement, defaulting-to-active reset
 *  - Default management: checkDefault (grace period, threshold, role)
 *  - Governance: restructureLoan, writeOffLoan
 *  - View functions: getLoan, getActiveLoan, canBorrow, calculateLoanTerms
 *  - Parameter governance: all setters (valid and invalid)
 *  - Accounting: totalOutstanding, totalInterestEarned
 *  - Fuzz: interest calculation, pool availability, installment amounts
 */
contract DuesLendingTest is Test {

    // ── Contracts ─────────────────────────────────────────────────────────────

    DuesLending  public lending;
    PropertyNFT  public nft;
    MockTreasury public treasury;
    MockUSDC     public usdc;

    // ── Actors ────────────────────────────────────────────────────────────────

    address public deployer   = address(this);
    address public board      = address(0xB0A2D);
    address public governor   = address(0x60718);
    address public alice      = address(0xA11CE);
    address public bob        = address(0xB0B);
    address public unauthorized = address(0xDEAD);

    // ── Constants ─────────────────────────────────────────────────────────────

    uint256 constant QUARTERLY_DUES = 200e6;     // $200 USDC
    uint256 constant LARGE_RESERVE  = 100_000e6; // $100k in reserve
    uint256 constant MAX_LOTS       = 150;

    // ── Setup ─────────────────────────────────────────────────────────────────

    function setUp() public {
        usdc     = new MockUSDC();
        nft      = new PropertyNFT(MAX_LOTS, "Faircroft Property", "FAIR");
        treasury = new MockTreasury(address(usdc), QUARTERLY_DUES, LARGE_RESERVE);

        // Fund treasury with real USDC (for withdrawForLoan)
        usdc.mint(address(treasury), LARGE_RESERVE);

        // Deploy lending with deployer as admin (will grant roles manually)
        lending = new DuesLending(
            address(usdc),
            address(nft),
            address(treasury),
            governor,
            board
        );

        // Grant LENDING_ROLE on PropertyNFT to DuesLending
        nft.grantRole(nft.LENDING_ROLE(), address(lending));

        // Deployer (test contract) already has DEFAULT_ADMIN_ROLE on PropertyNFT
        // and REGISTRAR_ROLE is held by DEFAULT_ADMIN role holder for minting
        // PropertyNFT grants DEFAULT_ADMIN_ROLE to msg.sender in constructor,
        // so deployer can grant roles. We also need REGISTRAR_ROLE to mint.
        nft.grantRole(nft.REGISTRAR_ROLE(), deployer);

        // Mint lot 1 to alice, lot 2 to bob
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        nft.mintProperty(bob,   2, "103 Faircroft Dr", 3000);

        // Fund alice and bob with USDC for loan repayments
        usdc.mint(alice, 10_000e6);
        usdc.mint(bob,   10_000e6);

        vm.prank(alice);
        usdc.approve(address(lending), type(uint256).max);
        vm.prank(bob);
        usdc.approve(address(lending), type(uint256).max);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: Constructor / Initial State
    // ─────────────────────────────────────────────────────────────────────────

    function test_Constructor_InitialState() public view {
        assertEq(address(lending.usdc()),        address(usdc));
        assertEq(address(lending.propertyNFT()), address(nft));
        assertEq(address(lending.treasury()),    address(treasury));

        assertEq(lending.interestRateBps(),    500);
        assertEq(lending.maxLoanQuarters(),    4);
        assertEq(lending.maxInstallments(),    12);
        assertEq(lending.minInstallments(),    2);
        assertEq(lending.installmentPeriod(),  30 days);
        assertEq(lending.gracePeriodSeconds(), 7 days);
        assertEq(lending.maxLoanPoolBps(),     1500);
        assertEq(lending.originationFeeBps(),  100);
        assertEq(lending.defaultThreshold(),   3);

        assertEq(lending.totalOutstanding(),    0);
        assertEq(lending.totalInterestEarned(), 0);
        assertEq(lending.getLoanCount(),        0);
    }

    function test_Constructor_Roles() public view {
        assertTrue(lending.hasRole(lending.GOVERNOR_ROLE(), governor));
        assertTrue(lending.hasRole(lending.BOARD_ROLE(),    board));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: requestLoan — happy paths
    // ─────────────────────────────────────────────────────────────────────────

    function test_RequestLoan_OneQuarter_TwoInstallments() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        assertEq(lending.getLoanCount(), 1);

        DuesLending.Loan memory loan = lending.getLoan(0);
        assertEq(loan.tokenId,          1);
        assertEq(loan.borrower,         alice);
        assertEq(loan.principal,        QUARTERLY_DUES);
        assertGt(loan.totalOwed,        QUARTERLY_DUES); // includes interest + origination
        assertEq(loan.totalPaid,        0);
        assertEq(loan.installmentsTotal, 2);
        assertEq(loan.installmentsPaid,  0);
        assertEq(loan.missedPayments,    0);
        assertEq(uint8(loan.status),    uint8(DuesLending.LoanStatus.Active));
        assertEq(loan.startDate,        uint48(block.timestamp));
        assertEq(loan.nextDueDate,      uint48(block.timestamp + 30 days));
    }

    function test_RequestLoan_FourQuarters_TwelveInstallments() public {
        vm.prank(alice);
        lending.requestLoan(1, 4, 12);

        DuesLending.Loan memory loan = lending.getLoan(0);
        assertEq(loan.principal,        QUARTERLY_DUES * 4);
        assertEq(loan.installmentsTotal, 12);
    }

    function test_RequestLoan_MinInstallments() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2); // min installments = 2
        assertEq(lending.getLoan(0).installmentsTotal, 2);
    }

    function test_RequestLoan_MaxInstallments() public {
        vm.prank(alice);
        lending.requestLoan(1, 4, 12); // max installments = 12
        assertEq(lending.getLoan(0).installmentsTotal, 12);
    }

    function test_RequestLoan_LockProperty() public {
        assertFalse(nft.loanLocked(1));

        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        assertTrue(nft.loanLocked(1));
    }

    function test_RequestLoan_ActiveLoanByProperty() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        assertEq(lending.activeLoanByProperty(1), 1); // loanId 0 + 1
    }

    function test_RequestLoan_TotalOutstandingIncreased() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        assertEq(lending.totalOutstanding(), QUARTERLY_DUES);
    }

    function test_RequestLoan_InterestCalculation() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        // principal=200e6, rate=500bps, duration=2*30days, origFee=100bps
        uint256 principal  = QUARTERLY_DUES;
        uint256 duration   = 2 * 30 days;
        uint256 interest   = (principal * 500 * duration) / (10000 * 365 days);
        uint256 origFee    = (principal * 100) / 10000;
        uint256 totalOwed  = principal + interest + origFee;

        DuesLending.Loan memory loan = lending.getLoan(0);
        assertEq(loan.totalOwed, uint128(totalOwed));
        assertEq(loan.installmentAmount, uint128(totalOwed / 2));
    }

    function test_RequestLoan_EmitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, false);
        emit DuesLending.LoanRequested(0, 1, alice, uint128(QUARTERLY_DUES), 0, 2);
        lending.requestLoan(1, 1, 2);
    }

    function test_RequestLoan_MultipleDifferentProperties() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        vm.prank(bob);
        lending.requestLoan(2, 1, 2);

        assertEq(lending.getLoanCount(),      2);
        assertEq(lending.totalOutstanding(),  QUARTERLY_DUES * 2);
        assertTrue(nft.loanLocked(1));
        assertTrue(nft.loanLocked(2));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: requestLoan — revert paths
    // ─────────────────────────────────────────────────────────────────────────

    function test_RequestLoan_RevertNotPropertyOwner() public {
        vm.prank(bob); // bob doesn't own lot 1
        vm.expectRevert(DuesLending.NotPropertyOwner.selector);
        lending.requestLoan(1, 1, 2);
    }

    function test_RequestLoan_RevertActiveLoanExists() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        // Try again while loan is active
        vm.prank(alice);
        vm.expectRevert(DuesLending.ActiveLoanExists.selector);
        lending.requestLoan(1, 1, 2);
    }

    function test_RequestLoan_RevertInvalidQuartersZero() public {
        vm.prank(alice);
        vm.expectRevert(DuesLending.InvalidQuarters.selector);
        lending.requestLoan(1, 0, 2);
    }

    function test_RequestLoan_RevertInvalidQuartersTooMany() public {
        vm.prank(alice);
        vm.expectRevert(DuesLending.InvalidQuarters.selector);
        lending.requestLoan(1, 5, 2); // max is 4
    }

    function test_RequestLoan_RevertInvalidInstallmentsTooFew() public {
        vm.prank(alice);
        vm.expectRevert(DuesLending.InvalidInstallments.selector);
        lending.requestLoan(1, 1, 1); // min is 2
    }

    function test_RequestLoan_RevertInvalidInstallmentsTooMany() public {
        vm.prank(alice);
        vm.expectRevert(DuesLending.InvalidInstallments.selector);
        lending.requestLoan(1, 1, 13); // max is 12
    }

    function test_RequestLoan_RevertInsufficientLoanPool() public {
        // Drain reserve to 0 so pool = 0
        treasury.setReserveBalance(0);
        // Also drain actual USDC so transfer doesn't succeed
        // We just need the pool check to fail: pool = (0 * 1500) / 10000 = 0 < principal
        vm.prank(alice);
        vm.expectRevert(DuesLending.InsufficientLoanPool.selector);
        lending.requestLoan(1, 1, 2);
    }

    function test_RequestLoan_RevertInsufficientLoanPool_TotalOutstandingFull() public {
        // Max pool = 15% of LARGE_RESERVE = 15_000e6
        // Take two loans to approach limit
        // First, mint more properties and give them all loans
        // Simpler: set reserve such that pool < one quarterly due
        // Pool = (reserve * 1500) / 10000; if reserve=1200e6, pool=180e6 < 200e6
        treasury.setReserveBalance(1200e6);
        // But we still need treasury to have USDC — burn excess by setting balance directly
        // Reset USDC balance to match:
        // (We can't do that easily, so instead set reserveBalance very low on mock)
        // The mock uses reserveBalance for the check, not actual USDC balance
        vm.prank(alice);
        vm.expectRevert(DuesLending.InsufficientLoanPool.selector);
        lending.requestLoan(1, 1, 2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: makePayment
    // ─────────────────────────────────────────────────────────────────────────

    function test_MakePayment_SingleInstallment() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loanBefore = lending.getLoan(0);
        uint256 installment = loanBefore.installmentAmount;

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        lending.makePayment(0, installment);
        uint256 aliceAfter = usdc.balanceOf(alice);

        assertEq(aliceBefore - aliceAfter, installment);

        DuesLending.Loan memory loan = lending.getLoan(0);
        assertEq(loan.totalPaid, uint128(installment));
        assertEq(loan.missedPayments, 0);
        assertEq(uint8(loan.status), uint8(DuesLending.LoanStatus.Active));
    }

    function test_MakePayment_FullPayoffViaInstallments() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loan = lending.getLoan(0);
        uint256 installment = loan.installmentAmount;

        // Pay first installment
        vm.prank(alice);
        lending.makePayment(0, installment);

        // Pay last installment (exact remaining to handle rounding)
        vm.prank(alice);
        lending.makePayment(0, loan.totalOwed - installment);

        DuesLending.Loan memory settled = lending.getLoan(0);
        assertEq(uint8(settled.status), uint8(DuesLending.LoanStatus.Settled));
        assertFalse(nft.loanLocked(1));
        assertEq(lending.activeLoanByProperty(1), 0);
        assertEq(lending.totalOutstanding(), 0);
    }

    function test_MakePayment_OverpaymentCappedAtRemaining() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loan = lending.getLoan(0);
        uint256 totalOwed = loan.totalOwed;

        // Pay 2x totalOwed — should be capped at totalOwed and settle
        vm.prank(alice);
        lending.makePayment(0, totalOwed * 2);

        DuesLending.Loan memory settled = lending.getLoan(0);
        assertEq(settled.totalPaid, uint128(totalOwed));
        assertEq(uint8(settled.status), uint8(DuesLending.LoanStatus.Settled));
    }

    function test_MakePayment_RevertPaymentTooSmall() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loan = lending.getLoan(0);
        uint256 tooSmall = loan.installmentAmount - 1;

        vm.prank(alice);
        vm.expectRevert(DuesLending.PaymentTooSmall.selector);
        lending.makePayment(0, tooSmall);
    }

    function test_MakePayment_RevertLoanNotActive_Settled() public {
        // Settle loan first
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        vm.prank(alice);
        lending.payOffLoan(0);

        // Can't pay settled loan
        vm.prank(alice);
        vm.expectRevert(DuesLending.LoanNotActive.selector);
        lending.makePayment(0, 1e6);
    }

    function test_MakePayment_ResetsDefaultingToActive() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        // Push loan to Defaulting via board
        vm.warp(block.timestamp + 30 days + 7 days + 1); // past nextDueDate + grace
        vm.prank(board); lending.checkDefault(0);
        vm.prank(board); lending.checkDefault(0);
        vm.prank(board); lending.checkDefault(0);

        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Defaulting));

        // Make a payment — should restore to Active
        DuesLending.Loan memory loan = lending.getLoan(0);
        vm.prank(alice);
        lending.makePayment(0, loan.installmentAmount);

        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Active));
        assertEq(lending.getLoan(0).missedPayments, 0);
    }

    function test_MakePayment_EmitsEvent() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loan = lending.getLoan(0);
        uint128 installment = loan.installmentAmount;
        uint128 remaining   = loan.totalOwed - installment;

        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit DuesLending.LoanPayment(0, alice, installment, remaining);
        lending.makePayment(0, installment);
    }

    function test_MakePayment_SettledEmitsLoanSettled() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loan = lending.getLoan(0);

        vm.prank(alice);
        vm.expectEmit(true, false, false, false);
        emit DuesLending.LoanSettled(0, loan.totalOwed, 0);
        lending.makePayment(0, loan.totalOwed); // pay entire balance in one shot
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: payOffLoan
    // ─────────────────────────────────────────────────────────────────────────

    function test_PayOffLoan_HappyPath() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loan = lending.getLoan(0);
        uint256 remaining = loan.totalOwed;

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        lending.payOffLoan(0);
        uint256 aliceAfter = usdc.balanceOf(alice);

        assertEq(aliceBefore - aliceAfter, remaining);
        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Settled));
        assertFalse(nft.loanLocked(1));
        assertEq(lending.activeLoanByProperty(1), 0);
    }

    function test_PayOffLoan_UnlocksNFT_AllowsTransfer() public {
        // Setup: enable free transfers
        nft.grantRole(nft.SOULBOUND_ADMIN_ROLE(), deployer);
        nft.setTransfersRequireApproval(false);

        vm.prank(alice);
        lending.requestLoan(1, 1, 2);
        assertTrue(nft.loanLocked(1));

        vm.prank(alice);
        lending.payOffLoan(0);
        assertFalse(nft.loanLocked(1));

        // Now alice can freely transfer
        vm.prank(alice);
        nft.safeTransferFrom(alice, bob, 1);
        assertEq(nft.ownerOf(1), bob);
    }

    function test_PayOffLoan_RevertLoanNotActive() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        vm.prank(alice);
        lending.payOffLoan(0); // settle

        vm.prank(alice);
        vm.expectRevert(DuesLending.LoanNotActive.selector);
        lending.payOffLoan(0); // double payoff
    }

    function test_PayOffLoan_TotalInterestEarnedUpdated() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loan = lending.getLoan(0);
        uint256 expectedInterest = loan.totalOwed - loan.principal;

        vm.prank(alice);
        lending.payOffLoan(0);

        assertEq(lending.totalInterestEarned(), expectedInterest);
    }

    function test_PayOffLoan_TotalOutstandingDecremented() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);
        assertEq(lending.totalOutstanding(), QUARTERLY_DUES);

        vm.prank(alice);
        lending.payOffLoan(0);
        assertEq(lending.totalOutstanding(), 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: checkDefault
    // ─────────────────────────────────────────────────────────────────────────

    function test_CheckDefault_WithinGracePeriod_Noop() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        // Warp to just within grace period (nextDueDate + gracePeriod - 1 second)
        DuesLending.Loan memory loan = lending.getLoan(0);
        vm.warp(loan.nextDueDate + lending.gracePeriodSeconds() - 1);

        vm.prank(board);
        lending.checkDefault(0); // should be a no-op, not revert

        assertEq(lending.getLoan(0).missedPayments, 0);
        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Active));
    }

    function test_CheckDefault_IncrementsMissedPayments() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loan = lending.getLoan(0);
        vm.warp(loan.nextDueDate + lending.gracePeriodSeconds() + 1);

        vm.prank(board);
        lending.checkDefault(0);

        assertEq(lending.getLoan(0).missedPayments, 1);
        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Active));
    }

    function test_CheckDefault_ThresholdTriggersDefaulting() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loan = lending.getLoan(0);
        vm.warp(loan.nextDueDate + lending.gracePeriodSeconds() + 1);

        // 3 calls (defaultThreshold = 3) → Defaulting
        vm.prank(board); lending.checkDefault(0);
        vm.prank(board); lending.checkDefault(0);

        vm.prank(board);
        vm.expectEmit(true, false, false, true);
        emit DuesLending.LoanDefaulting(0, 3);
        lending.checkDefault(0);

        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Defaulting));
    }

    function test_CheckDefault_RevertNotBoard() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loan = lending.getLoan(0);
        vm.warp(loan.nextDueDate + lending.gracePeriodSeconds() + 1);

        vm.prank(unauthorized);
        vm.expectRevert();
        lending.checkDefault(0);
    }

    function test_CheckDefault_RevertLoanNotActive() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        // Settle it
        vm.prank(alice);
        lending.payOffLoan(0);

        vm.prank(board);
        vm.expectRevert(DuesLending.LoanNotActive.selector);
        lending.checkDefault(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: restructureLoan
    // ─────────────────────────────────────────────────────────────────────────

    function test_RestructureLoan_HappyPath() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2); // 2 installments

        vm.prank(governor);
        lending.restructureLoan(0, 6); // extend to 6 installments

        DuesLending.Loan memory loan = lending.getLoan(0);
        assertEq(loan.installmentsTotal, 6);
        assertEq(loan.missedPayments, 0);
        assertEq(uint8(loan.status), uint8(DuesLending.LoanStatus.Restructured));
        // installmentAmount = remaining / remainingInstallments
        assertGt(loan.installmentAmount, 0);
    }

    function test_RestructureLoan_FromDefaulting() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        // Push to defaulting
        DuesLending.Loan memory loan = lending.getLoan(0);
        vm.warp(loan.nextDueDate + lending.gracePeriodSeconds() + 1);
        vm.prank(board); lending.checkDefault(0);
        vm.prank(board); lending.checkDefault(0);
        vm.prank(board); lending.checkDefault(0);

        vm.prank(governor);
        lending.restructureLoan(0, 8);

        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Restructured));
    }

    function test_RestructureLoan_EmitsEvent() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        vm.prank(governor);
        vm.expectEmit(true, false, false, false);
        emit DuesLending.LoanRestructured(0, 6, 0);
        lending.restructureLoan(0, 6);
    }

    function test_RestructureLoan_RevertNotGovernor() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        vm.prank(board); // board is not governor
        vm.expectRevert();
        lending.restructureLoan(0, 6);
    }

    function test_RestructureLoan_RevertNewInstallmentsNotHigher() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2); // 2 installments

        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidInstallments.selector);
        lending.restructureLoan(0, 2); // same as current
    }

    function test_RestructureLoan_RevertNewInstallmentsLower() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 4); // 4 installments

        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidInstallments.selector);
        lending.restructureLoan(0, 3); // lower than current
    }

    function test_RestructureLoan_RevertLoanSettled() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);
        vm.prank(alice);
        lending.payOffLoan(0);

        vm.prank(governor);
        vm.expectRevert(DuesLending.LoanNotActive.selector);
        lending.restructureLoan(0, 6);
    }

    // NOTE: After restructureLoan, status = Restructured.
    // makePayment only accepts Active or Defaulting — this is a known contract behavior.
    function test_RestructureLoan_RestructuredStatusAllowsPayment() public {
        // SC-04: governance restructure must not freeze repayment — Restructured loans accept payments
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        vm.prank(governor);
        lending.restructureLoan(0, 6);

        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Restructured));

        DuesLending.Loan memory loan = lending.getLoan(0);
        deal(address(usdc), alice, loan.installmentAmount);
        vm.startPrank(alice);
        usdc.approve(address(lending), loan.installmentAmount);
        lending.makePayment(0, loan.installmentAmount); // must not revert
        vm.stopPrank();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: writeOffLoan
    // ─────────────────────────────────────────────────────────────────────────

    function test_WriteOffLoan_HappyPath() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        uint256 outstanding = lending.totalOutstanding();

        vm.prank(governor);
        vm.expectEmit(true, false, false, false);
        emit DuesLending.LoanWrittenOff(0, 0);
        lending.writeOffLoan(0);

        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.WrittenOff));
        assertFalse(nft.loanLocked(1));
        assertEq(lending.activeLoanByProperty(1), 0);
        assertLt(lending.totalOutstanding(), outstanding);
    }

    function test_WriteOffLoan_UnlocksNFT() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);
        assertTrue(nft.loanLocked(1));

        vm.prank(governor);
        lending.writeOffLoan(0);
        assertFalse(nft.loanLocked(1));
    }

    function test_WriteOffLoan_PartiallyRepaid() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        // Make one payment
        DuesLending.Loan memory loan = lending.getLoan(0);
        vm.prank(alice);
        lending.makePayment(0, loan.installmentAmount);

        // Write off the rest
        vm.prank(governor);
        lending.writeOffLoan(0);

        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.WrittenOff));
    }

    function test_WriteOffLoan_RevertAlreadySettled() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);
        vm.prank(alice);
        lending.payOffLoan(0);

        vm.prank(governor);
        vm.expectRevert(DuesLending.LoanNotActive.selector);
        lending.writeOffLoan(0);
    }

    function test_WriteOffLoan_RevertAlreadyWrittenOff() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        vm.prank(governor);
        lending.writeOffLoan(0);

        vm.prank(governor);
        vm.expectRevert(DuesLending.LoanNotActive.selector);
        lending.writeOffLoan(0);
    }

    function test_WriteOffLoan_RevertNotGovernor() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        vm.prank(board);
        vm.expectRevert();
        lending.writeOffLoan(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: View Functions
    // ─────────────────────────────────────────────────────────────────────────

    function test_GetActiveLoan_HappyPath() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        (uint256 loanId, DuesLending.Loan memory loan) = lending.getActiveLoan(1);
        assertEq(loanId,        0);
        assertEq(loan.borrower, alice);
        assertEq(loan.tokenId,  1);
    }

    function test_GetActiveLoan_RevertNoActiveLoan() public {
        vm.expectRevert(DuesLending.NoActiveLoan.selector);
        lending.getActiveLoan(1);
    }

    function test_GetActiveLoan_RevertAfterSettlement() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);
        vm.prank(alice);
        lending.payOffLoan(0);

        vm.expectRevert(DuesLending.NoActiveLoan.selector);
        lending.getActiveLoan(1);
    }

    function test_CanBorrow_True() public {
        (bool eligible, string memory reason) = lending.canBorrow(1);
        assertTrue(eligible);
        assertEq(bytes(reason).length, 0);
    }

    function test_CanBorrow_False_ActiveLoan() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        (bool eligible, string memory reason) = lending.canBorrow(1);
        assertFalse(eligible);
        assertEq(keccak256(bytes(reason)), keccak256(bytes("Active loan exists")));
    }

    function test_CanBorrow_False_InsufficientPool() public {
        treasury.setReserveBalance(1000e6); // pool = 150e6 < 200e6 quarterly
        (bool eligible, string memory reason) = lending.canBorrow(1);
        assertFalse(eligible);
        assertEq(keccak256(bytes(reason)), keccak256(bytes("Insufficient loan pool")));
    }

    function test_CalculateLoanTerms_MatchesRequestLoan() public view {
        (
            uint256 principal,
            uint256 interest,
            uint256 originationFee,
            uint256 totalOwed,
            uint256 installmentAmount
        ) = lending.calculateLoanTerms(1, 2);

        assertEq(principal,        QUARTERLY_DUES);
        assertGt(interest,         0);
        assertGt(originationFee,   0);
        assertEq(totalOwed,        principal + interest + originationFee);
        assertEq(installmentAmount, totalOwed / 2);
    }

    function test_GetLoanPoolAvailable() public view {
        uint256 available = lending.getLoanPoolAvailable();
        // pool = (LARGE_RESERVE * 1500) / 10000 - totalOutstanding
        uint256 expected = (LARGE_RESERVE * 1500) / 10000;
        assertEq(available, expected);
    }

    function test_GetLoanPoolAvailable_DecreasesAfterLoan() public {
        uint256 before = lending.getLoanPoolAvailable();

        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        uint256 afterLoan = lending.getLoanPoolAvailable();
        assertEq(before - afterLoan, QUARTERLY_DUES);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: Parameter Updates (Governance)
    // ─────────────────────────────────────────────────────────────────────────

    function test_SetInterestRate() public {
        vm.prank(governor);
        vm.expectEmit(false, false, false, true);
        emit DuesLending.ParameterUpdated("interestRateBps", 500, 300);
        lending.setInterestRate(300);
        assertEq(lending.interestRateBps(), 300);
    }

    function test_SetInterestRate_RevertTooHigh() public {
        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidParameter.selector);
        lending.setInterestRate(2001); // max is 2000
    }

    function test_SetInterestRate_RevertNotGovernor() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        lending.setInterestRate(300);
    }

    function test_SetMaxLoanPool() public {
        vm.prank(governor);
        lending.setMaxLoanPool(2000);
        assertEq(lending.maxLoanPoolBps(), 2000);
    }

    function test_SetMaxLoanPool_RevertTooHigh() public {
        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidParameter.selector);
        lending.setMaxLoanPool(5001); // max is 5000
    }

    function test_SetOriginationFee() public {
        vm.prank(governor);
        lending.setOriginationFee(200);
        assertEq(lending.originationFeeBps(), 200);
    }

    function test_SetOriginationFee_RevertTooHigh() public {
        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidParameter.selector);
        lending.setOriginationFee(501); // max is 500
    }

    function test_SetInstallmentLimits() public {
        vm.prank(governor);
        lending.setInstallmentLimits(3, 18);
        assertEq(lending.minInstallments(), 3);
        assertEq(lending.maxInstallments(), 18);
    }

    function test_SetInstallmentLimits_RevertMinZero() public {
        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidParameter.selector);
        lending.setInstallmentLimits(0, 12); // min < 1
    }

    function test_SetInstallmentLimits_RevertMaxTooHigh() public {
        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidParameter.selector);
        lending.setInstallmentLimits(2, 25); // max > 24
    }

    function test_SetInstallmentLimits_RevertMinGeMax() public {
        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidParameter.selector);
        lending.setInstallmentLimits(6, 6); // min == max
    }

    function test_SetInstallmentPeriod() public {
        vm.prank(governor);
        lending.setInstallmentPeriod(45 days);
        assertEq(lending.installmentPeriod(), 45 days);
    }

    function test_SetInstallmentPeriod_RevertTooShort() public {
        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidParameter.selector);
        lending.setInstallmentPeriod(13 days); // min is 14 days
    }

    function test_SetInstallmentPeriod_RevertTooLong() public {
        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidParameter.selector);
        lending.setInstallmentPeriod(91 days); // max is 90 days
    }

    function test_SetGracePeriod() public {
        vm.prank(governor);
        lending.setGracePeriod(14 days);
        assertEq(lending.gracePeriodSeconds(), 14 days);
    }

    function test_SetGracePeriod_RevertTooLong() public {
        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidParameter.selector);
        lending.setGracePeriod(31 days); // max is 30 days
    }

    function test_SetDefaultThreshold() public {
        vm.prank(governor);
        lending.setDefaultThreshold(5);
        assertEq(lending.defaultThreshold(), 5);
    }

    function test_SetDefaultThreshold_RevertZero() public {
        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidParameter.selector);
        lending.setDefaultThreshold(0); // min is 1
    }

    function test_SetDefaultThreshold_RevertTooHigh() public {
        vm.prank(governor);
        vm.expectRevert(DuesLending.InvalidParameter.selector);
        lending.setDefaultThreshold(13); // max is 12
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: Accounting Invariants
    // ─────────────────────────────────────────────────────────────────────────

    function test_Accounting_MultipleLoansConcurrent() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);
        vm.prank(bob);
        lending.requestLoan(2, 2, 4);

        assertEq(lending.totalOutstanding(), QUARTERLY_DUES + QUARTERLY_DUES * 2);
        assertEq(lending.getLoanCount(), 2);

        // Settle alice's loan
        vm.prank(alice);
        lending.payOffLoan(0);
        assertEq(lending.totalOutstanding(), QUARTERLY_DUES * 2);

        // Settle bob's loan
        vm.prank(bob);
        lending.payOffLoan(1);
        assertEq(lending.totalOutstanding(), 0);
    }

    function test_Accounting_InterestAccumulates_MultipleLoans() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);
        vm.prank(bob);
        lending.requestLoan(2, 1, 2);

        DuesLending.Loan memory aliceLoan = lending.getLoan(0);
        DuesLending.Loan memory bobLoan   = lending.getLoan(1);

        uint256 aliceInterest = aliceLoan.totalOwed - aliceLoan.principal;
        uint256 bobInterest   = bobLoan.totalOwed   - bobLoan.principal;

        vm.prank(alice);
        lending.payOffLoan(0);
        vm.prank(bob);
        lending.payOffLoan(1);

        assertEq(lending.totalInterestEarned(), aliceInterest + bobInterest);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: Loan Lock Integration with PropertyNFT
    // ─────────────────────────────────────────────────────────────────────────

    function test_LoanLock_BlocksTransferDuringLoan() public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        // Even if alice gets a board-approved transfer, loan lock blocks it
        nft.approveTransfer(1, bob);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TokenIsLoanLocked.selector, 1));
        nft.safeTransferFrom(alice, bob, 1);
    }

    function test_LoanLock_UnblocksAfterWriteOff() public {
        nft.grantRole(nft.SOULBOUND_ADMIN_ROLE(), deployer);
        nft.setTransfersRequireApproval(false);

        vm.prank(alice);
        lending.requestLoan(1, 1, 2);
        assertTrue(nft.loanLocked(1));

        vm.prank(governor);
        lending.writeOffLoan(0);
        assertFalse(nft.loanLocked(1));

        // Transfer now works
        vm.prank(alice);
        nft.safeTransferFrom(alice, bob, 1);
        assertEq(nft.ownerOf(1), bob);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: Fuzz Tests
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Fuzz interest calculation: any valid (quarters, installments) combo
    ///         must produce totalOwed >= principal and installmentAmount > 0.
    function testFuzz_InterestCalculation(
        uint8 quarters,
        uint8 installments
    ) public view {
        quarters     = uint8(bound(quarters,     1, 4));
        installments = uint8(bound(installments, 2, 12));

        (
            uint256 principal,
            uint256 interest,
            uint256 originationFee,
            uint256 totalOwed,
            uint256 installmentAmount
        ) = lending.calculateLoanTerms(quarters, installments);

        assertEq(principal,  QUARTERLY_DUES * quarters);
        assertGe(interest,   0);
        assertGt(originationFee, 0);
        assertEq(totalOwed,  principal + interest + originationFee);
        assertGt(installmentAmount, 0);
        assertLe(installmentAmount * installments, totalOwed); // never over-collects
    }

    /// @notice Fuzz loan pool: pool is always <= 15% of reserve, never negative.
    function testFuzz_LoanPoolAvailable(uint128 reserve) public {
        vm.assume(reserve > 0 && reserve < 1_000_000_000e6);
        treasury.setReserveBalance(reserve);

        uint256 pool = lending.getLoanPoolAvailable();
        uint256 maxPool = (uint256(reserve) * 1500) / 10000;

        assertLe(pool, maxPool);
    }

    /// @notice Fuzz: any payment >= installmentAmount on an active loan should not revert.
    function testFuzz_MakePayment_ValidAmounts(uint256 payAmount) public {
        vm.prank(alice);
        lending.requestLoan(1, 1, 2);

        DuesLending.Loan memory loan = lending.getLoan(0);
        payAmount = bound(payAmount, loan.installmentAmount, loan.totalOwed);

        // Fund alice with enough
        usdc.mint(alice, payAmount);

        vm.prank(alice);
        lending.makePayment(0, payAmount);
        // Must not revert
    }

    /// @notice Fuzz: quarterly dues change should update calculateLoanTerms proportionally.
    function testFuzz_QuarterlyDuesScaling(uint32 duesAmount) public {
        vm.assume(duesAmount > 0 && duesAmount < 100_000e6);
        treasury.setQuarterlyDues(duesAmount);

        (uint256 principal,,,,) = lending.calculateLoanTerms(2, 4);
        assertEq(principal, uint256(duesAmount) * 2);
    }
}
