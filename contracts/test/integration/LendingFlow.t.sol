// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/DuesLending.sol";
import "../../src/PropertyNFT.sol";
import "../helpers/MockUSDC.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ── Minimal Treasury Stub ─────────────────────────────────────────────────────

/**
 * @title IntegrationTreasury
 * @notice Full-fidelity stub for integration tests. Tracks dues payments per
 *         tokenId so the lending ↔ treasury interaction can be verified end-to-end.
 */
contract IntegrationTreasury {
    using SafeERC20 for IERC20;

    IERC20  public immutable usdc;
    uint256 public quarterlyDuesAmount;
    uint256 public reserveBalance;

    // tokenId → quarters paid via DuesLending
    mapping(uint256 => uint256) public duesPaidQuarters;

    event DuesPaidForToken(uint256 indexed tokenId, uint256 quarters, address payer);

    constructor(address _usdc, uint256 _quarterly, uint256 _reserve) {
        usdc                = IERC20(_usdc);
        quarterlyDuesAmount = _quarterly;
        reserveBalance      = _reserve;
    }

    function withdrawForLoan(uint256 amount) external {
        require(reserveBalance >= amount, "IT: insufficient reserve");
        reserveBalance -= amount;
        usdc.safeTransfer(msg.sender, amount);
    }

    function payDuesFor(uint256 tokenId, uint256 quarters, address payer) external {
        uint256 amount = quarterlyDuesAmount * quarters;
        usdc.safeTransferFrom(payer, address(this), amount);
        reserveBalance += amount;
        duesPaidQuarters[tokenId] += quarters;
        emit DuesPaidForToken(tokenId, quarters, payer);
    }

    function depositFromLoan(uint256 amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        reserveBalance += amount;
    }
}

// ── Integration Test ──────────────────────────────────────────────────────────

/**
 * @title LendingFlowTest
 * @notice End-to-end integration tests for the DuesLending ↔ PropertyNFT ↔ Treasury flow.
 *
 * Scenario coverage:
 *  1. Full lifecycle: request loan → NFT locked → pay installments → NFT unlocked
 *  2. Full lifecycle: request loan → pay off early → NFT unlocked → property transfers
 *  3. Default path: request loan → miss payments → board flags → governance writes off
 *  4. Multi-borrower: concurrent loans on different properties
 *  5. Sequential loans: same property, loan settles, new loan taken
 */
contract LendingFlowTest is Test {
    using SafeERC20 for IERC20;

    // ── Contracts ─────────────────────────────────────────────────────────────

    DuesLending          public lending;
    PropertyNFT          public nft;
    IntegrationTreasury  public treasury;
    MockUSDC             public usdc;

    // ── Actors ────────────────────────────────────────────────────────────────

    address public deployer   = address(this);
    address public board      = address(0xB0A2D);
    address public governor   = address(0x60718);
    address public alice      = address(0xA11CE);
    address public bob        = address(0xB0B);
    address public carol      = address(0xCA201);

    uint256 constant QUARTERLY_DUES = 300e6;     // $300
    uint256 constant RESERVE        = 200_000e6; // $200k reserve

    function setUp() public {
        usdc     = new MockUSDC();
        nft      = new PropertyNFT(150, "Faircroft Property", "FAIR");
        treasury = new IntegrationTreasury(address(usdc), QUARTERLY_DUES, RESERVE);

        usdc.mint(address(treasury), RESERVE);

        lending = new DuesLending(
            address(usdc),
            address(nft),
            address(treasury),
            governor,
            board
        );

        // Roles
        nft.grantRole(nft.LENDING_ROLE(),    address(lending));
        nft.grantRole(nft.REGISTRAR_ROLE(),  deployer);
        nft.grantRole(nft.GOVERNOR_ROLE(),        deployer);
        nft.grantRole(nft.SOULBOUND_ADMIN_ROLE(), deployer);

        // Properties
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        nft.mintProperty(bob,   2, "103 Faircroft Dr", 3000);
        nft.mintProperty(carol, 3, "105 Faircroft Dr", 2800);

        // Fund borrowers for repayments
        usdc.mint(alice,  20_000e6);
        usdc.mint(bob,    20_000e6);
        usdc.mint(carol,  20_000e6);

        vm.prank(alice);  usdc.approve(address(lending), type(uint256).max);
        vm.prank(bob);    usdc.approve(address(lending), type(uint256).max);
        vm.prank(carol);  usdc.approve(address(lending), type(uint256).max);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 1: Full lifecycle — installment repayment
    // ─────────────────────────────────────────────────────────────────────────

    function test_FullLifecycle_InstallmentRepayment() public {
        // ── Step 1: Alice takes a 1-quarter, 3-installment loan ──────────────
        vm.prank(alice);
        lending.requestLoan(1, 1, 3);

        // NFT is locked
        assertTrue(nft.loanLocked(1), "NFT should be loan-locked after requestLoan");
        assertEq(lending.totalOutstanding(), QUARTERLY_DUES);

        // Treasury credited dues for lot 1
        assertEq(treasury.duesPaidQuarters(1), 1, "Treasury should record 1 quarter paid");

        // ── Step 2: Alice cannot transfer her property while loan is active ──
        nft.approveTransfer(1, bob);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TokenIsLoanLocked.selector, 1));
        nft.safeTransferFrom(alice, bob, 1);

        // ── Step 3: Alice pays each installment ──────────────────────────────
        DuesLending.Loan memory loan = lending.getLoan(0);
        uint128 installment = loan.installmentAmount;
        uint128 remaining   = loan.totalOwed;

        // Installment 1
        vm.prank(alice);
        lending.makePayment(0, installment);
        remaining -= installment;

        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Active));
        assertTrue(nft.loanLocked(1), "NFT still locked after first installment");

        // Installment 2
        vm.prank(alice);
        lending.makePayment(0, installment);
        remaining -= installment;

        // Installment 3 (pays exact remaining to handle rounding)
        vm.prank(alice);
        lending.makePayment(0, remaining);

        // ── Step 4: Loan settled — NFT unlocked ──────────────────────────────
        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Settled));
        assertFalse(nft.loanLocked(1), "NFT should be unlocked after full repayment");
        assertEq(lending.activeLoanByProperty(1), 0);
        assertEq(lending.totalOutstanding(), 0);
        assertGt(lending.totalInterestEarned(), 0, "Interest should have accrued");

        // ── Step 5: Alice can now transfer her property ───────────────────────
        vm.prank(alice);
        nft.safeTransferFrom(alice, bob, 1); // board approval still pending from step 2
        assertEq(nft.ownerOf(1), bob);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 2: Early payoff then property transfer
    // ─────────────────────────────────────────────────────────────────────────

    function test_FullLifecycle_EarlyPayoff_ThenTransfer() public {
        nft.setTransfersRequireApproval(false); // free transfers for simplicity

        vm.prank(alice);
        lending.requestLoan(1, 2, 6);
        assertTrue(nft.loanLocked(1));

        // Pay off immediately in one shot
        vm.prank(alice);
        lending.payOffLoan(0);

        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Settled));
        assertFalse(nft.loanLocked(1));

        // Alice can immediately transfer the property
        vm.prank(alice);
        nft.safeTransferFrom(alice, carol, 1);
        assertEq(nft.ownerOf(1), carol);

        // Carol (new owner) can take a new loan on the same lot
        vm.prank(carol);
        usdc.approve(address(lending), type(uint256).max);
        vm.prank(carol);
        lending.requestLoan(1, 1, 2);
        assertTrue(nft.loanLocked(1));
        assertEq(lending.getLoan(1).borrower, carol);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 3: Default path — board flags, governance writes off
    // ─────────────────────────────────────────────────────────────────────────

    function test_DefaultPath_WriteOff() public {
        vm.prank(bob);
        lending.requestLoan(2, 1, 2);

        assertEq(lending.totalOutstanding(), QUARTERLY_DUES);
        assertTrue(nft.loanLocked(2));

        // Bob pays nothing. Push past grace period.
        DuesLending.Loan memory loan = lending.getLoan(0);
        vm.warp(loan.nextDueDate + lending.gracePeriodSeconds() + 1);

        // Board calls checkDefault 3 times (defaultThreshold = 3)
        vm.prank(board); lending.checkDefault(0);
        vm.prank(board); lending.checkDefault(0);
        vm.prank(board); lending.checkDefault(0);

        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Defaulting));
        assertEq(lending.getLoan(0).missedPayments, 3);

        // Governance decides to write off the loan
        vm.prank(governor);
        vm.expectEmit(true, false, false, false);
        emit DuesLending.LoanWrittenOff(0, 0);
        lending.writeOffLoan(0);

        // NFT unlocked — bob can sell the property
        assertFalse(nft.loanLocked(2));
        assertEq(lending.activeLoanByProperty(2), 0);

        // total outstanding decremented by full principal
        assertEq(lending.totalOutstanding(), 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 4: Multi-borrower concurrent loans
    // ─────────────────────────────────────────────────────────────────────────

    function test_MultiBorrower_ConcurrentLoans() public {
        // All three borrow simultaneously
        vm.prank(alice); lending.requestLoan(1, 1, 2);
        vm.prank(bob);   lending.requestLoan(2, 2, 4);
        vm.prank(carol); lending.requestLoan(3, 1, 3);

        assertEq(lending.getLoanCount(), 3);
        assertTrue(nft.loanLocked(1));
        assertTrue(nft.loanLocked(2));
        assertTrue(nft.loanLocked(3));

        uint256 expectedOutstanding = QUARTERLY_DUES + QUARTERLY_DUES * 2 + QUARTERLY_DUES;
        assertEq(lending.totalOutstanding(), expectedOutstanding);

        // Alice and carol settle
        vm.prank(alice); lending.payOffLoan(0);
        vm.prank(carol); lending.payOffLoan(2);

        assertFalse(nft.loanLocked(1));
        assertFalse(nft.loanLocked(3));
        assertTrue(nft.loanLocked(2)); // bob still has active loan
        assertEq(lending.totalOutstanding(), QUARTERLY_DUES * 2);

        // Bob settles
        vm.prank(bob); lending.payOffLoan(1);
        assertFalse(nft.loanLocked(2));
        assertEq(lending.totalOutstanding(), 0);

        // Interest earned from all three loans
        assertGt(lending.totalInterestEarned(), 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 5: Sequential loans on same property
    // ─────────────────────────────────────────────────────────────────────────

    function test_SequentialLoans_SameProperty() public {
        // First loan
        vm.prank(alice); lending.requestLoan(1, 1, 2);
        assertEq(lending.activeLoanByProperty(1), 1); // loanId 0 + 1

        vm.prank(alice); lending.payOffLoan(0);
        assertEq(lending.activeLoanByProperty(1), 0);
        assertFalse(nft.loanLocked(1));

        // Second loan (different loanId)
        vm.prank(alice); lending.requestLoan(1, 2, 4);
        assertEq(lending.getLoanCount(), 2);
        assertEq(lending.activeLoanByProperty(1), 2); // loanId 1 + 1
        assertTrue(nft.loanLocked(1));

        vm.prank(alice); lending.payOffLoan(1);
        assertFalse(nft.loanLocked(1));

        // Both loans recorded
        assertEq(uint8(lending.getLoan(0).status), uint8(DuesLending.LoanStatus.Settled));
        assertEq(uint8(lending.getLoan(1).status), uint8(DuesLending.LoanStatus.Settled));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 6: Loan pool cap enforced across multiple loans
    // ─────────────────────────────────────────────────────────────────────────

    function test_LoanPoolCap_EnforcedAcrossLoans() public {
        // Pool = (reserveBalance * 1500) / 10000.
        // With reserve = 5000e6 → pool = 750e6.
        // Two loans at 300e6 each = 600e6 outstanding. Remaining pool = 150e6 < 300e6.
        // Third loan should revert with InsufficientLoanPool.
        //
        // IntegrationTreasury storage layout (immutables not in storage):
        //   slot 0: quarterlyDuesAmount
        //   slot 1: reserveBalance           ← we set this
        //   slot 2: duesPaidQuarters (mapping)
        uint256 lowReserve = 5000e6;
        vm.store(
            address(treasury),
            bytes32(uint256(1)), // slot 1 = reserveBalance
            bytes32(lowReserve)
        );
        assertEq(treasury.reserveBalance(), lowReserve);

        vm.prank(alice); lending.requestLoan(1, 1, 2);
        vm.prank(bob);   lending.requestLoan(2, 1, 2);
        // totalOutstanding = 600e6; pool = 750e6 - 600e6 = 150e6 < 300e6

        vm.prank(carol);
        vm.expectRevert(DuesLending.InsufficientLoanPool.selector);
        lending.requestLoan(3, 1, 2);
    }
}
