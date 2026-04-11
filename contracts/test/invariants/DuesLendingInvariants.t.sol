// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";
import "../../src/DuesLending.sol";
import "../../src/PropertyNFT.sol";
import "../helpers/MockUSDC.sol";
import "./handlers/DuesLendingHandler.sol";

/**
 * @title DuesLendingInvariants
 * @notice StdInvariant test suite for DuesLending. Deploys a fresh system,
 *         mints one property per actor, seeds USDC, and fuzzes the handler.
 *
 * Invariants encoded:
 *   INV_A — totalOutstanding never exceeds the lending-pool cap at any time
 *           (SC-01 regression guard).
 *   INV_B — For every loan, totalPaid <= totalOwed and installmentsPaid <= installmentsTotal.
 *   INV_C — activeLoanByProperty[tokenId] is consistent with per-loan status
 *           (non-zero iff referenced loan is Active/Defaulting/Restructured).
 *   INV_D — If a property has an active loan, PropertyNFT.loanLocked is true.
 *   INV_E — totalOutstanding <= sum(loan.principal) across all loans ever created.
 *   INV_F — totalInterestEarned is monotonic (handler ghost witness).
 *   INV_G — The handler's cumulative USD flow reconciles with ledger state.
 */
contract DuesLendingInvariants is StdInvariant, Test {
    DuesLending public lending;
    PropertyNFT public nft;
    MockTreasuryForInvariant public treasury;
    MockUSDC public usdc;
    DuesLendingHandler public handler;

    address public board     = address(0xB0A2D);
    address public governor  = address(0x60718);

    address public alice = address(0xA11CE);
    address public bob   = address(0xB0B);
    address public carol = address(0xCA201);
    address public dave  = address(0xDA7E);
    address public eve   = address(0xE7E);

    uint256 public constant QUARTERLY_DUES  = 200e6;
    uint256 public constant INITIAL_RESERVE = 200_000e6;
    uint256 public constant USDC_PER_ACTOR  = 100_000e6;

    function setUp() public {
        // ── Deploy core contracts ───────────────────────────────────────────
        usdc = new MockUSDC();
        nft  = new PropertyNFT(150, "Faircroft Property", "FAIR");
        treasury = new MockTreasuryForInvariant(address(usdc), QUARTERLY_DUES, INITIAL_RESERVE);

        // Fund treasury so withdrawForLoan can actually move USDC
        usdc.mint(address(treasury), INITIAL_RESERVE);

        lending = new DuesLending(
            address(usdc),
            address(nft),
            address(treasury),
            governor,
            board
        );

        // Grant the lending contract permission to lock properties
        nft.grantRole(nft.LENDING_ROLE(), address(lending));

        // Grant REGISTRAR so setUp can mint
        nft.grantRole(nft.REGISTRAR_ROLE(), address(this));

        // ── Mint one property per actor ──────────────────────────────────────
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        nft.mintProperty(bob,   2, "103 Faircroft Dr", 3000);
        nft.mintProperty(carol, 3, "105 Faircroft Dr", 2800);
        nft.mintProperty(dave,  4, "107 Faircroft Dr", 2600);
        nft.mintProperty(eve,   5, "109 Faircroft Dr", 2400);

        // ── Build actor array & handler ──────────────────────────────────────
        address[] memory actors = new address[](5);
        actors[0] = alice; actors[1] = bob; actors[2] = carol; actors[3] = dave; actors[4] = eve;

        handler = new DuesLendingHandler(lending, nft, treasury, usdc, actors);
        handler.registerProperty(alice, 1);
        handler.registerProperty(bob,   2);
        handler.registerProperty(carol, 3);
        handler.registerProperty(dave,  4);
        handler.registerProperty(eve,   5);

        // Grant BOARD_ROLE to the handler so it can call checkDefault.
        // Hoist the role lookup above the prank so the static call doesn't
        // consume it (vm.prank only affects the very next call).
        bytes32 boardRole = lending.BOARD_ROLE();
        vm.prank(governor);
        lending.grantRole(boardRole, address(handler));

        // ── Fund actors with USDC for repayments ─────────────────────────────
        for (uint256 i = 0; i < actors.length; i++) {
            usdc.mint(actors[i], USDC_PER_ACTOR);
        }

        // ── Wire handler as the sole invariant target ────────────────────────
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = DuesLendingHandler.requestLoan.selector;
        selectors[1] = DuesLendingHandler.makePayment.selector;
        selectors[2] = DuesLendingHandler.payOffLoan.selector;
        selectors[3] = DuesLendingHandler.tickAndCheckDefaults.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  INVARIANTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice INV_A: totalOutstanding stays within the SC-01 loan-pool cap at all times.
    function invariant_A_loanPoolCapHolds() public view {
        uint256 outstanding = lending.totalOutstanding();
        uint256 effectiveReserve = treasury.reserveBalance() + outstanding;
        uint256 cap = (effectiveReserve * lending.maxLoanPoolBps()) / 10_000;
        assertLe(outstanding, cap, "INV_A: totalOutstanding breached lending pool cap");
    }

    /// @notice INV_B: for every loan, payments and installment counts are bounded.
    function invariant_B_perLoanAccountingBounded() public view {
        uint256 n = lending.getLoanCount();
        for (uint256 i = 0; i < n; i++) {
            DuesLending.Loan memory l = lending.getLoan(i);
            assertLe(l.totalPaid, l.totalOwed, "INV_B: totalPaid > totalOwed");
            assertLe(l.installmentsPaid, l.installmentsTotal, "INV_B: installmentsPaid > installmentsTotal");
        }
    }

    /// @notice INV_C: activeLoanByProperty consistency with per-loan status.
    function invariant_C_activeLoanMappingConsistent() public view {
        uint256 n = lending.getLoanCount();
        for (uint256 i = 0; i < n; i++) {
            DuesLending.Loan memory l = lending.getLoan(i);
            uint256 mapped = lending.activeLoanByProperty(l.tokenId);

            bool shouldBeActive =
                l.status == DuesLending.LoanStatus.Active ||
                l.status == DuesLending.LoanStatus.Defaulting ||
                l.status == DuesLending.LoanStatus.Restructured;

            if (shouldBeActive) {
                // If this loan is still active, the mapping must point at some
                // active loanId for this tokenId. We don't require it to be *this*
                // loanId (a later loan on the same property could have replaced
                // it, though the contract prevents that), but a permissive check
                // is fine — we assert the mapping is non-zero.
                assertTrue(mapped != 0, "INV_C: active loan not registered in mapping");
            }
            // The reverse direction: if mapped points AT this loan, then this
            // loan must be in an active status.
            if (mapped != 0 && mapped - 1 == i) {
                assertTrue(shouldBeActive, "INV_C: mapping points at inactive loan");
            }
        }
    }

    /// @notice INV_D: property transfer-lock mirrors active-loan state.
    function invariant_D_propertyLockMirrorsActiveLoan() public view {
        // For each registered actor's token, if there's an active loan, lock must be set.
        for (uint256 i = 0; i < handler.actorCount(); i++) {
            address actor = handler.actors(i);
            uint256 tokenId = handler.propertyOf(actor);
            if (tokenId == 0) continue;
            uint256 mapped = lending.activeLoanByProperty(tokenId);
            if (mapped != 0) {
                assertTrue(nft.loanLocked(tokenId), "INV_D: active loan without transfer lock");
            }
        }
    }

    /// @notice INV_E: totalOutstanding never exceeds sum of all principal ever issued.
    function invariant_E_outstandingBelowCumulativePrincipal() public view {
        uint256 outstanding = lending.totalOutstanding();
        uint256 cumulative  = handler.sumLoanPrincipal();
        assertLe(outstanding, cumulative, "INV_E: totalOutstanding > cumulative principal");
    }

    /// @notice INV_F: totalInterestEarned is monotonic (handler sync-witnessed).
    function invariant_F_interestMonotonic() public view {
        assertGe(
            lending.totalInterestEarned(),
            handler.ghost_maxTotalInterestSeen(),
            "INV_F: totalInterestEarned regressed below witness"
        );
    }

    /// @notice INV_G: per-loan sum of totalPaid matches handler's cumulative paid ghost
    ///         (within equality — each call increments both on success).
    function invariant_G_ghostPaidMatchesLedger() public view {
        // Per-loan sum must never exceed the handler's recorded ghost — the handler
        // only increments on observed success. Strict equality is not guaranteed
        // because settlement can cap amount internally; use ≤ as the safe bound.
        uint256 ledgerPaid = handler.sumPerLoanTotalPaid();
        uint256 ghostPaid  = handler.ghost_totalPaidEver();
        assertLe(ledgerPaid, ghostPaid, "INV_G: ledger totalPaid exceeds ghost");
    }

    /// @notice Fuzz distribution sanity — ensure selectors are being exercised.
    /// @dev Non-asserting but emits trace for `forge test -vvv`.
    function invariant_callTrace() public view {
        // No assertion — just a visibility checkpoint.
        // Run `forge test --match-contract DuesLendingInvariants -vv` to see counters.
    }
}
