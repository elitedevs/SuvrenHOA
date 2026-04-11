// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../../src/TreasuryYield.sol";
import "../../helpers/MockUSDC.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockAavePool
 * @notice Minimal IPool implementation. Tracks deposits per (asset, holder)
 *         and mints matching "aUSDC" balance via paired MockAToken. Supports
 *         a manual yield-accrual helper so invariant fuzz can simulate time.
 */
contract MockAavePool {
    using SafeERC20 for IERC20;

    mapping(address holder => uint256) public supplied;
    MockAToken public aToken;

    function setAToken(MockAToken a) external { aToken = a; }

    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        supplied[onBehalfOf] += amount;
        aToken.credit(onBehalfOf, amount);
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        uint256 bal = aToken.balanceOf(msg.sender);
        if (amount == type(uint256).max || amount > bal) amount = bal;
        aToken.debit(msg.sender, amount);
        if (supplied[msg.sender] >= amount) supplied[msg.sender] -= amount;
        else supplied[msg.sender] = 0;
        IERC20(asset).safeTransfer(to, amount);
        return amount;
    }

    /// @dev Simulate yield accrual by minting extra aTokens to a holder.
    ///      The MockUSDC must also be minted to this pool so withdraws succeed.
    function accrueYield(address asset, address holder, uint256 amount) external {
        aToken.credit(holder, amount);
        // Assume test seeded this contract with extra asset liquidity
        asset; // silence warning
    }
}

/**
 * @title MockAToken
 * @notice Minimal IAToken implementation — just a balance ledger.
 */
contract MockAToken {
    mapping(address => uint256) private _balances;
    address public immutable pool;

    constructor(address _pool) { pool = _pool; }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function credit(address to, uint256 amount) external {
        require(msg.sender == pool, "only pool");
        _balances[to] += amount;
    }

    function debit(address from, uint256 amount) external {
        require(msg.sender == pool, "only pool");
        require(_balances[from] >= amount, "insufficient");
        _balances[from] -= amount;
    }
}

/**
 * @title MockFaircroftTreasuryForYield
 * @notice Minimal Treasury stand-in exposing the subset TreasuryYield needs:
 *         reserveBalance(), releaseReserveForYield(), creditYieldReturn().
 *         Tracks a standalone USDC pot and grants TreasuryYield the ability
 *         to pull funds directly via transferFrom semantics.
 */
contract MockFaircroftTreasuryForYield {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    uint256 public reserveBalance;

    constructor(address _usdc, uint256 _seed) {
        usdc = IERC20(_usdc);
        reserveBalance = _seed;
    }

    function setReserveBalance(uint256 v) external { reserveBalance = v; }

    /// @dev Treasury's real implementation pulls from its own balance and
    ///      transfers to the yield contract. Here we mirror that: reduce the
    ///      reserve counter and send USDC from this contract.
    function releaseReserveForYield(address to, uint256 amount) external {
        require(reserveBalance >= amount, "MT: insufficient reserve");
        reserveBalance -= amount;
        usdc.safeTransfer(to, amount);
    }

    /// @dev Yield contract pushes USDC back. Pull via safeTransferFrom so
    ///      the yield contract's forceApprove is exercised.
    function creditYieldReturn(uint256 amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        reserveBalance += amount;
    }
}

/**
 * @title TreasuryYieldHandler
 * @notice Handler for TreasuryYield invariant fuzzing. Exercises deposit,
 *         withdraw, harvest, emergency withdraw, risk-tolerance change, and
 *         simulated yield accrual.
 */
contract TreasuryYieldHandler is Test {
    TreasuryYield public immutable yield_;
    MockFaircroftTreasuryForYield public immutable treasury;
    MockAavePool public immutable pool;
    MockAToken public immutable aToken;
    MockUSDC public immutable usdc;
    address public immutable governor;
    address public immutable treasurer;

    // Ghost counters
    uint256 public callsDeposit;
    uint256 public callsWithdraw;
    uint256 public callsHarvest;
    uint256 public callsEmergency;
    uint256 public callsAccrue;
    uint256 public callsSetRisk;

    uint256 public ghost_totalYieldHarvested;
    uint256 public ghost_maxRiskLevelSeen;

    constructor(
        TreasuryYield _yield,
        MockFaircroftTreasuryForYield _treasury,
        MockAavePool _pool,
        MockAToken _aToken,
        MockUSDC _usdc,
        address _governor,
        address _treasurer
    ) {
        yield_ = _yield;
        treasury = _treasury;
        pool = _pool;
        aToken = _aToken;
        usdc = _usdc;
        governor = _governor;
        treasurer = _treasurer;
    }

    function deposit(uint256 amountSeed) external {
        callsDeposit++;
        uint256 reserve = treasury.reserveBalance();
        if (reserve == 0) return;

        // Bound to the maximum that would be accepted under current risk tolerance
        uint256 total = reserve + yield_.depositedAmount();
        uint256 cap = yield_.maxDeployable(total);
        uint256 headroom = cap > yield_.depositedAmount() ? cap - yield_.depositedAmount() : 0;
        uint256 maxAmount = headroom > reserve ? reserve : headroom;
        if (maxAmount == 0) return;

        uint256 amount = bound(amountSeed, 1, maxAmount);
        vm.prank(treasurer);
        try yield_.depositToAave(amount) {} catch {}
    }

    function withdraw(uint256 amountSeed) external {
        callsWithdraw++;
        uint256 deposited = yield_.depositedAmount();
        if (deposited == 0) return;
        uint256 amount = bound(amountSeed, 1, deposited);
        vm.prank(treasurer);
        try yield_.withdrawFromAave(amount) {} catch {}
    }

    function accrue(uint256 amountSeed) external {
        callsAccrue++;
        // Simulate Aave yield by minting extra aTokens + seeding USDC liquidity
        uint256 deposited = yield_.depositedAmount();
        if (deposited == 0) return;
        uint256 amount = bound(amountSeed, 1, deposited / 10 + 1); // up to 10% yield
        usdc.mint(address(pool), amount); // Pool needs USDC to pay out the yield
        pool.accrueYield(address(usdc), address(yield_), amount);
    }

    function harvest() external {
        callsHarvest++;
        try yield_.harvestYield() {
            // Track ghost — noop, the event is the source of truth
        } catch {}
    }

    function emergency() external {
        callsEmergency++;
        if (yield_.depositedAmount() == 0) return;
        vm.prank(treasurer);
        try yield_.emergencyWithdraw() {} catch {}
    }

    function setRisk(uint8 levelSeed) external {
        callsSetRisk++;
        uint8 level = uint8(bound(uint256(levelSeed), 0, 2));
        if (level > ghost_maxRiskLevelSeen) ghost_maxRiskLevelSeen = level;
        vm.prank(governor);
        try yield_.setRiskTolerance(TreasuryYield.RiskLevel(level)) {} catch {}
    }
}
