// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";
import "../../src/FaircroftTreasury.sol";
import "../helpers/MockUSDC.sol";
import "./handlers/FaircroftTreasuryHandler.sol";

/**
 * @title FaircroftTreasuryInvariants
 * @notice StdInvariant suite for FaircroftTreasury. The critical property is
 *         FUND CONSERVATION — the USDC balance of the treasury contract must
 *         always equal operatingBalance + reserveBalance. Every code path that
 *         touches USDC (payDues, makeExpenditure, emergencySpend, transferReserve,
 *         releaseReserveForYield, creditYieldReturn, withdrawForLoan,
 *         depositFromLoan, payDuesFor, creditRefundFromEscrow) must preserve
 *         this identity, otherwise we've leaked funds or phantom-credited the
 *         ledger. This is the single most important invariant in the system.
 *
 * Invariants:
 *   INV_A — usdc.balanceOf(treasury) == operatingBalance + reserveBalance      (FUND CONSERVATION)
 *   INV_B — getExpenditureCount() is monotonic (append-only log)
 *   INV_C — emergencySpentThisPeriod <= emergencySpendingLimit                 (always bounded)
 *   INV_D — operatingReserveSplitBps <= 10_000                                 (config sanity)
 */
contract FaircroftTreasuryInvariants is StdInvariant, Test {
    FaircroftTreasury public treasury;
    MockUSDC public usdc;
    FaircroftTreasuryHandler public handler;

    // ── Role holders / actors ────────────────────────────────────────────────
    address[] public payers;

    // ── Constants ────────────────────────────────────────────────────────────
    uint256 public constant QUARTERLY_DUES    = 200e6;      // $200 USDC
    uint256 public constant ANNUAL_DISCOUNT   = 500;        // 5%
    uint256 public constant EMERGENCY_LIMIT   = 10_000e6;   // $10k per period
    uint256 public constant USDC_PER_PAYER    = 50_000e6;   // $50k walking money

    function setUp() public {
        // ── Deploy core ─────────────────────────────────────────────────────
        usdc = new MockUSDC();
        treasury = new FaircroftTreasury(
            address(usdc),
            QUARTERLY_DUES,
            ANNUAL_DISCOUNT,
            EMERGENCY_LIMIT
        );

        // ── Build payer set and fund with USDC ──────────────────────────────
        payers.push(address(0xA11CE));
        payers.push(address(0xB0B));
        payers.push(address(0xCA201));
        payers.push(address(0xDA7E));
        payers.push(address(0xE7E));
        for (uint256 i = 0; i < payers.length; i++) {
            usdc.mint(payers[i], USDC_PER_PAYER);
        }

        // ── Deploy handler ──────────────────────────────────────────────────
        handler = new FaircroftTreasuryHandler(treasury, usdc, payers);

        // ── Grant EVERY operational role to the handler ─────────────────────
        // The handler exercises the entire contract surface directly without
        // per-call pranks, so it needs TREASURER, GOVERNOR, YIELD_MANAGER,
        // LENDING, and ESCROW. DEFAULT_ADMIN was granted to this test contract
        // by the constructor (msg.sender == this).
        treasury.grantRole(treasury.TREASURER_ROLE(),     address(handler));
        treasury.grantRole(treasury.GOVERNOR_ROLE(),      address(handler));
        treasury.grantRole(treasury.YIELD_MANAGER_ROLE(), address(handler));
        treasury.grantRole(treasury.LENDING_ROLE(),       address(handler));
        treasury.grantRole(treasury.ESCROW_ROLE(),        address(handler));

        // ── Wire handler as the sole invariant target ───────────────────────
        bytes4[] memory selectors = new bytes4[](11);
        selectors[0]  = FaircroftTreasuryHandler.payDues.selector;
        selectors[1]  = FaircroftTreasuryHandler.makeExpenditure.selector;
        selectors[2]  = FaircroftTreasuryHandler.emergencySpend.selector;
        selectors[3]  = FaircroftTreasuryHandler.transferReserve.selector;
        selectors[4]  = FaircroftTreasuryHandler.releaseReserveForYield.selector;
        selectors[5]  = FaircroftTreasuryHandler.creditYieldReturn.selector;
        selectors[6]  = FaircroftTreasuryHandler.withdrawForLoan.selector;
        selectors[7]  = FaircroftTreasuryHandler.depositFromLoan.selector;
        selectors[8]  = FaircroftTreasuryHandler.payDuesFor.selector;
        selectors[9]  = FaircroftTreasuryHandler.creditRefundFromEscrow.selector;
        selectors[10] = FaircroftTreasuryHandler.expireEmergencyPeriod.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  INVARIANTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice INV_A — FUND CONSERVATION. The single most important property in
    ///         the contract: every USDC movement must be mirrored in the
    ///         operating/reserve ledger. If this ever breaks we've either
    ///         leaked funds or double-credited the books.
    function invariant_A_fundConservation() public view {
        uint256 held = usdc.balanceOf(address(treasury));
        uint256 ledger = treasury.operatingBalance() + treasury.reserveBalance();
        assertEq(held, ledger, "INV_A: USDC balance != operating + reserve");
    }

    /// @notice INV_B — getExpenditureCount() is monotonic (append-only log).
    function invariant_B_expenditureCountMonotonic() public view {
        assertGe(
            treasury.getExpenditureCount(),
            handler.ghost_maxExpenditureCount(),
            "INV_B: expenditure count regressed"
        );
    }

    /// @notice INV_C — emergencySpentThisPeriod never exceeds emergencySpendingLimit.
    function invariant_C_emergencyUnderLimit() public view {
        assertLe(
            treasury.emergencySpentThisPeriod(),
            treasury.emergencySpendingLimit(),
            "INV_C: emergency spend exceeded limit"
        );
    }

    /// @notice INV_D — config sanity: split bps never exceeds 10_000.
    function invariant_D_splitBpsBounded() public view {
        assertLe(
            treasury.operatingReserveSplitBps(),
            10_000,
            "INV_D: operatingReserveSplitBps out of bounds"
        );
    }

    /// @notice Visibility checkpoint — non-asserting, emits handler call counts
    ///         when run with `forge test --match-contract FaircroftTreasuryInvariants -vv`.
    function invariant_callTrace() public view {
        // no-op
    }
}
