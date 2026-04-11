// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../../src/DuesLending.sol";
import "../../../src/PropertyNFT.sol";
import "../../helpers/MockUSDC.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockTreasuryForInvariant
 * @notice Minimal IFaircroftTreasury implementation for invariant fuzzing.
 *         Mirrors MockTreasury from DuesLending.t.sol but exposes direct
 *         reserve credit/debit helpers the handler uses to simulate external
 *         dues payments unrelated to lending activity.
 */
contract MockTreasuryForInvariant {
    using SafeERC20 for IERC20;

    IERC20  public immutable usdc;
    uint256 public quarterlyDuesAmount;
    uint256 public reserveBalance;

    constructor(address _usdc, uint256 _quarterly, uint256 _reserve) {
        usdc                = IERC20(_usdc);
        quarterlyDuesAmount = _quarterly;
        reserveBalance      = _reserve;
    }

    function setReserveBalance(uint256 v) external { reserveBalance = v; }

    // ── IFaircroftTreasury ─────────────────────────────────────────────────────

    function withdrawForLoan(uint256 amount) external {
        require(reserveBalance >= amount, "MT: insufficient reserve");
        reserveBalance -= amount;
        usdc.safeTransfer(msg.sender, amount);
    }

    function payDuesFor(uint256, uint256 quarters, address payer) external {
        uint256 amount = quarterlyDuesAmount * quarters;
        usdc.safeTransferFrom(payer, address(this), amount);
        reserveBalance += amount;
    }

    function depositFromLoan(uint256 amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        reserveBalance += amount;
    }
}

/**
 * @title DuesLendingHandler
 * @notice Invariant-test handler for DuesLending. Fuzzes requestLoan, makePayment,
 *         payOffLoan, and checkDefault through a bounded set of actors, each
 *         owning a single property NFT. Tracks ghost totals used by the
 *         invariant contract to cross-check DuesLending's own accounting.
 *
 * @dev    Philosophy: the handler NEVER reverts. If a call would revert given
 *         current state (e.g. requesting a loan on a property that already has
 *         one), the handler short-circuits. This keeps fuzz call success rate
 *         high and ensures every handler invocation touches state, exposing
 *         accounting bugs rather than silently drowning in reverts.
 */
contract DuesLendingHandler is Test {
    using SafeERC20 for IERC20;

    // ── Wired contracts ──────────────────────────────────────────────────────
    DuesLending public immutable lending;
    PropertyNFT public immutable nft;
    MockTreasuryForInvariant public immutable treasury;
    MockUSDC public immutable usdc;

    // ── Actors ───────────────────────────────────────────────────────────────
    address[] public actors;
    mapping(address actor => uint256 tokenId) public propertyOf;

    // ── Ghost accounting ─────────────────────────────────────────────────────
    uint256 public ghost_totalPrincipalIssued;   // sum of principal on every loan ever created
    uint256 public ghost_totalPaidEver;          // sum of makePayment/payOffLoan amounts
    uint256 public ghost_loansOpened;            // count of requestLoan successes
    uint256 public ghost_loansSettled;           // count of settled loans observed
    uint256 public ghost_maxTotalInterestSeen;   // monotonic witness for interest earnings

    // ── Call counters (for selector distribution debug) ──────────────────────
    uint256 public callsRequestLoan;
    uint256 public callsMakePayment;
    uint256 public callsPayOff;
    uint256 public callsCheckDefault;

    // ── Constants ────────────────────────────────────────────────────────────
    uint256 public constant QUARTERLY_DUES = 200e6;        // $200 USDC
    uint256 public constant INITIAL_RESERVE = 200_000e6;   // $200k
    uint256 public constant USDC_PER_ACTOR  = 100_000e6;   // $100k walking money

    constructor(
        DuesLending _lending,
        PropertyNFT _nft,
        MockTreasuryForInvariant _treasury,
        MockUSDC _usdc,
        address[] memory _actors
    ) {
        lending  = _lending;
        nft      = _nft;
        treasury = _treasury;
        usdc     = _usdc;
        for (uint256 i = 0; i < _actors.length; i++) {
            actors.push(_actors[i]);
        }
    }

    /// @notice Register a pre-minted tokenId to an actor so the handler knows what to fuzz.
    function registerProperty(address actor, uint256 tokenId) external {
        propertyOf[actor] = tokenId;
    }

    // ── Internal utilities ───────────────────────────────────────────────────

    function _pickActor(uint256 seed) internal view returns (address) {
        if (actors.length == 0) return address(0);
        return actors[seed % actors.length];
    }

    function _syncInterestWitness() internal {
        uint256 cur = lending.totalInterestEarned();
        if (cur > ghost_maxTotalInterestSeen) ghost_maxTotalInterestSeen = cur;
    }

    // ── Handler actions ──────────────────────────────────────────────────────

    /**
     * @notice Fuzz requestLoan for a random actor.
     * @dev Short-circuits (does not revert) when the actor already has an
     *      active loan or when the bounded parameters would exceed the pool.
     */
    function requestLoan(uint256 actorSeed, uint256 quarters, uint8 installments) external {
        callsRequestLoan++;
        address actor = _pickActor(actorSeed);
        if (actor == address(0)) return;
        uint256 tokenId = propertyOf[actor];
        if (tokenId == 0) return;
        if (lending.activeLoanByProperty(tokenId) != 0) return;

        quarters     = bound(quarters, 1, lending.maxLoanQuarters());
        installments = uint8(bound(installments, lending.minInstallments(), lending.maxInstallments()));

        uint256 principalEstimate = QUARTERLY_DUES * quarters;
        if (principalEstimate > lending.getLoanPoolAvailable()) return;

        vm.prank(actor);
        try lending.requestLoan(tokenId, quarters, installments) {
            ghost_totalPrincipalIssued += principalEstimate;
            ghost_loansOpened += 1;
        } catch {
            // bounded inputs should not revert, but swallow anything unexpected.
        }
        _syncInterestWitness();
    }

    /**
     * @notice Fuzz makePayment on a random actor's active loan.
     */
    function makePayment(uint256 actorSeed, uint256 amountSeed) external {
        callsMakePayment++;
        address actor = _pickActor(actorSeed);
        if (actor == address(0)) return;
        uint256 tokenId = propertyOf[actor];
        uint256 loanIdPlusOne = lending.activeLoanByProperty(tokenId);
        if (loanIdPlusOne == 0) return;
        uint256 loanId = loanIdPlusOne - 1;

        DuesLending.Loan memory loan = lending.getLoan(loanId);
        if (loan.totalPaid >= loan.totalOwed) return;
        uint256 remaining = loan.totalOwed - loan.totalPaid;

        uint256 amount = bound(amountSeed, loan.installmentAmount, remaining);
        if (amount == 0) return;
        if (usdc.balanceOf(actor) < amount) return;

        vm.startPrank(actor);
        usdc.approve(address(lending), amount);
        try lending.makePayment(loanId, amount) {
            ghost_totalPaidEver += amount;
        } catch {}
        vm.stopPrank();
        _syncInterestWitness();

        // Detect settlement via post-state read
        DuesLending.Loan memory post = lending.getLoan(loanId);
        if (post.status == DuesLending.LoanStatus.Settled) {
            ghost_loansSettled += 1;
        }
    }

    /**
     * @notice Fuzz payOffLoan on a random actor's active loan.
     */
    function payOffLoan(uint256 actorSeed) external {
        callsPayOff++;
        address actor = _pickActor(actorSeed);
        if (actor == address(0)) return;
        uint256 tokenId = propertyOf[actor];
        uint256 loanIdPlusOne = lending.activeLoanByProperty(tokenId);
        if (loanIdPlusOne == 0) return;
        uint256 loanId = loanIdPlusOne - 1;

        DuesLending.Loan memory loan = lending.getLoan(loanId);
        uint256 remaining = loan.totalOwed - loan.totalPaid;
        if (remaining == 0) return;
        if (usdc.balanceOf(actor) < remaining) return;

        vm.startPrank(actor);
        usdc.approve(address(lending), remaining);
        try lending.payOffLoan(loanId) {
            ghost_totalPaidEver += remaining;
            ghost_loansSettled += 1;
        } catch {}
        vm.stopPrank();
        _syncInterestWitness();
    }

    /**
     * @notice Warp time and fuzz checkDefault across all actors' active loans.
     * @dev Default checks must be called by BOARD_ROLE — the invariant harness
     *      grants that role to the handler directly.
     */
    function tickAndCheckDefaults(uint256 warpDays) external {
        callsCheckDefault++;
        warpDays = bound(warpDays, 0, 60);
        vm.warp(block.timestamp + warpDays * 1 days);

        for (uint256 i = 0; i < actors.length; i++) {
            uint256 tokenId = propertyOf[actors[i]];
            uint256 loanIdPlusOne = lending.activeLoanByProperty(tokenId);
            if (loanIdPlusOne == 0) continue;
            uint256 loanId = loanIdPlusOne - 1;
            DuesLending.Loan memory loan = lending.getLoan(loanId);
            if (loan.status != DuesLending.LoanStatus.Active) continue;
            try lending.checkDefault(loanId) {} catch {}
        }
    }

    // ── Views for invariant contract ─────────────────────────────────────────

    function actorCount() external view returns (uint256) { return actors.length; }

    function sumLoanPrincipal() external view returns (uint256 total) {
        uint256 n = lending.getLoanCount();
        for (uint256 i = 0; i < n; i++) {
            DuesLending.Loan memory l = lending.getLoan(i);
            total += l.principal;
        }
    }

    function sumPerLoanTotalPaid() external view returns (uint256 total) {
        uint256 n = lending.getLoanCount();
        for (uint256 i = 0; i < n; i++) {
            DuesLending.Loan memory l = lending.getLoan(i);
            total += l.totalPaid;
        }
    }
}
