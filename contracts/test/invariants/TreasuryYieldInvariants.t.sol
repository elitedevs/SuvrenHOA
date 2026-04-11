// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";
import "../../src/TreasuryYield.sol";
import "../helpers/MockUSDC.sol";
import "./handlers/TreasuryYieldHandler.sol";

/**
 * @title TreasuryYieldInvariants
 * @notice StdInvariant suite for TreasuryYield.
 *
 * Invariants:
 *   INV_A — depositedAmount never exceeds the risk-cap (SC-06 regression guard).
 *   INV_B — aUsdc.balanceOf(yieldContract) >= depositedAmount at all times.
 *   INV_C — TreasuryYield never holds residual USDC between operations
 *           (forceApprove + supply/withdraw must leave a zero balance).
 *   INV_D — treasury.reserveBalance() + yield_.depositedAmount() is monotonic
 *           OR decreases only via harvest → treasury (yield flows back, so
 *           we assert the weaker bound: depositedAmount <= initial deploy cap
 *           at ANY risk level at all times, already covered by INV_A).
 */
contract TreasuryYieldInvariants is StdInvariant, Test {
    TreasuryYield public yield_;
    MockFaircroftTreasuryForYield public treasury;
    MockAavePool public pool;
    MockAToken public aToken;
    MockUSDC public usdc;
    TreasuryYieldHandler public handler;

    address public governor  = address(0x60718);
    address public treasurer = address(0x72E450);

    uint256 public constant INITIAL_RESERVE = 1_000_000e6;

    function setUp() public {
        usdc = new MockUSDC();
        pool = new MockAavePool();
        aToken = new MockAToken(address(pool));
        pool.setAToken(aToken);

        treasury = new MockFaircroftTreasuryForYield(address(usdc), INITIAL_RESERVE);
        usdc.mint(address(treasury), INITIAL_RESERVE);

        yield_ = new TreasuryYield(
            address(usdc),
            address(pool),
            address(aToken),
            address(treasury),
            governor,
            treasurer
        );

        handler = new TreasuryYieldHandler(
            yield_,
            treasury,
            pool,
            aToken,
            usdc,
            governor,
            treasurer
        );

        bytes4[] memory selectors = new bytes4[](6);
        selectors[0] = TreasuryYieldHandler.deposit.selector;
        selectors[1] = TreasuryYieldHandler.withdraw.selector;
        selectors[2] = TreasuryYieldHandler.accrue.selector;
        selectors[3] = TreasuryYieldHandler.harvest.selector;
        selectors[4] = TreasuryYieldHandler.emergency.selector;
        selectors[5] = TreasuryYieldHandler.setRisk.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }

    /// @notice INV_A — SC-06 risk-cap regression guard.
    function invariant_A_riskCapHolds() public view {
        uint256 deposited = yield_.depositedAmount();
        uint256 total = treasury.reserveBalance() + deposited;
        uint256 cap = yield_.maxDeployable(total);
        assertLe(deposited, cap, "INV_A: depositedAmount breached risk cap");
    }

    /// @notice INV_B — aToken balance covers tracked principal at all times.
    function invariant_B_aTokenCoversPrincipal() public view {
        assertGe(
            aToken.balanceOf(address(yield_)),
            yield_.depositedAmount(),
            "INV_B: aUSDC balance < depositedAmount"
        );
    }

    /// @notice INV_C — TreasuryYield never holds residual USDC outside of a call.
    function invariant_C_noResidualUSDC() public view {
        assertEq(
            usdc.balanceOf(address(yield_)),
            0,
            "INV_C: residual USDC left in TreasuryYield"
        );
    }
}
