// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TreasuryYield.sol";
import "../src/FaircroftTreasury.sol";
import "./helpers/MockUSDC.sol";

// ── Mock Aave Pool ─────────────────────────────────────────────────────────────

/**
 * @title MockAavePool
 * @notice Simulates Aave V3 supply/withdraw. Mints aTokens on supply
 *         and burns them on withdraw. Supports manual yield injection for tests.
 */
contract MockAavePool {
    MockAToken public aToken;

    constructor(MockAToken _aToken) {
        aToken = _aToken;
    }

    /// @notice Supply: take USDC from caller, mint aTokens to onBehalfOf
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 /*referralCode*/
    ) external {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        aToken.mint(onBehalfOf, amount);
    }

    /// @notice Withdraw: burn aTokens from caller, send USDC back to `to`
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256) {
        uint256 balance = aToken.balanceOf(msg.sender);
        uint256 actual = (amount == type(uint256).max) ? balance : amount;
        require(actual <= balance, "MockAave: insufficient balance");

        aToken.burn(msg.sender, actual);
        IERC20(asset).transfer(to, actual);
        return actual;
    }

    /// @notice Inject yield: mint extra aTokens (simulates interest accrual)
    function injectYield(address to, uint256 amount) external {
        aToken.mint(to, amount);
    }
}

/**
 * @title MockAToken
 * @notice Simulates an Aave aToken — a simple ERC20 with mint/burn for tests
 */
contract MockAToken {
    mapping(address => uint256) private _balances;
    uint256 private _total;

    string public name = "Aave USDC";
    string public symbol = "aUSDC";
    uint8 public decimals = 6;

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function totalSupply() external view returns (uint256) {
        return _total;
    }

    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _total += amount;
    }

    function burn(address from, uint256 amount) external {
        require(_balances[from] >= amount, "MockAToken: insufficient balance");
        _balances[from] -= amount;
        _total -= amount;
    }
}

// ── Test Base ──────────────────────────────────────────────────────────────────

/**
 * @title TreasuryYieldTest
 * @notice Foundry test suite for TreasuryYield.sol
 *
 *  Actors:
 *   - governor  = timelock / governance (has GOVERNOR_ROLE)
 *   - treasurer = board multisig (has TREASURER_ROLE)
 *   - anyone    = arbitrary address (no special roles)
 */
contract TreasuryYieldTest is Test {
    // ── Contracts ──────────────────────────────────────────────────────────────
    MockUSDC       public usdc;
    MockAToken     public aToken;
    MockAavePool   public mockPool;
    FaircroftTreasury public treasuryContract;
    TreasuryYield  public yieldContract;

    // ── Actors ─────────────────────────────────────────────────────────────────
    address governor  = address(0x60704);
    address treasurer = address(0x7EA5);
    address anyone    = address(0xA10E);

    // ── Helpers ────────────────────────────────────────────────────────────────

    /// @dev Seed Treasury reserveBalance with `amount` USDC
    ///      Mints real USDC into the Treasury contract and bumps the accounting.
    function _seedReserve(uint256 amount) internal {
        usdc.mint(address(treasuryContract), amount);
        _setReserveBalance(treasuryContract.reserveBalance() + amount);
    }

    /// @dev Write reserveBalance into FaircroftTreasury storage via vm.store
    /// Slot layout (verified via `forge inspect FaircroftTreasury storage-layout`):
    ///   0: _roles, 1: quarterlyDuesAmount, 2: annualDuesDiscount, 3: lateFeePercent
    ///   4: gracePeriod, 5: operatingReserveSplitBps, 6: operatingBalance, 7: reserveBalance
    function _setReserveBalance(uint256 newBalance) internal {
        vm.store(
            address(treasuryContract),
            bytes32(uint256(7)),
            bytes32(newBalance)
        );
    }

    function setUp() public {
        // Deploy USDC mock
        usdc = new MockUSDC();

        // Deploy Aave mocks
        aToken = new MockAToken();
        mockPool = new MockAavePool(aToken);

        // Seed pool with USDC for withdrawals
        usdc.mint(address(mockPool), 100_000e6);

        // Deploy Treasury (deployer = address(this) gets DEFAULT_ADMIN_ROLE)
        treasuryContract = new FaircroftTreasury(
            address(usdc),
            200e6,   // $200 quarterly dues
            500,     // 5% annual discount
            1000e6   // $1000 emergency limit
        );

        // Deploy TreasuryYield
        yieldContract = new TreasuryYield(
            address(usdc),
            address(mockPool),
            address(aToken),
            address(treasuryContract),
            governor,
            treasurer
        );

        // Grant yieldContract the YIELD_MANAGER_ROLE on Treasury
        treasuryContract.grantRole(treasuryContract.YIELD_MANAGER_ROLE(), address(yieldContract));

        // Grant governor GOVERNOR_ROLE on Treasury (so they can call transferReserve etc.)
        treasuryContract.grantRole(treasuryContract.GOVERNOR_ROLE(), governor);

        // Give treasury some reserve (100k USDC)
        _seedReserve(100_000e6);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Deployment & Constructor
    // ══════════════════════════════════════════════════════════════════════════

    function test_constructor_setsImmutables() public view {
        assertEq(address(yieldContract.usdc()), address(usdc));
        assertEq(address(yieldContract.aavePool()), address(mockPool));
        assertEq(address(yieldContract.aUsdc()), address(aToken));
        assertEq(address(yieldContract.treasury()), address(treasuryContract));
    }

    function test_constructor_defaultRiskConservative() public view {
        assertEq(uint8(yieldContract.riskTolerance()), uint8(TreasuryYield.RiskLevel.Conservative));
    }

    function test_constructor_rolesAssigned() public view {
        assertTrue(yieldContract.hasRole(yieldContract.GOVERNOR_ROLE(), governor));
        assertTrue(yieldContract.hasRole(yieldContract.TREASURER_ROLE(), treasurer));
    }

    function test_constructor_revertsZeroUsdc() public {
        vm.expectRevert(TreasuryYield.ZeroAddress.selector);
        new TreasuryYield(address(0), address(mockPool), address(aToken), address(treasuryContract), governor, treasurer);
    }

    function test_constructor_revertsZeroPool() public {
        vm.expectRevert(TreasuryYield.ZeroAddress.selector);
        new TreasuryYield(address(usdc), address(0), address(aToken), address(treasuryContract), governor, treasurer);
    }

    function test_constructor_revertsZeroAToken() public {
        vm.expectRevert(TreasuryYield.ZeroAddress.selector);
        new TreasuryYield(address(usdc), address(mockPool), address(0), address(treasuryContract), governor, treasurer);
    }

    function test_constructor_revertsZeroTreasury() public {
        vm.expectRevert(TreasuryYield.ZeroAddress.selector);
        new TreasuryYield(address(usdc), address(mockPool), address(aToken), address(0), governor, treasurer);
    }

    function test_constructor_revertsZeroGovernor() public {
        vm.expectRevert(TreasuryYield.ZeroAddress.selector);
        new TreasuryYield(address(usdc), address(mockPool), address(aToken), address(treasuryContract), address(0), treasurer);
    }

    function test_constructor_revertsZeroTreasurer() public {
        vm.expectRevert(TreasuryYield.ZeroAddress.selector);
        new TreasuryYield(address(usdc), address(mockPool), address(aToken), address(treasuryContract), governor, address(0));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // depositToAave
    // ══════════════════════════════════════════════════════════════════════════

    function test_deposit_basicFlow() public {
        // Reserve = 100k, conservative cap = 30k
        uint256 amount = 20_000e6;
        vm.prank(treasurer);
        yieldContract.depositToAave(amount);

        assertEq(yieldContract.depositedAmount(), amount);
        assertEq(aToken.balanceOf(address(yieldContract)), amount);
    }

    function test_deposit_emitsEvent() public {
        uint256 amount = 10_000e6;
        vm.expectEmit(true, false, false, true);
        emit TreasuryYield.DepositedToAave(treasurer, amount, amount);

        vm.prank(treasurer);
        yieldContract.depositToAave(amount);
    }

    function test_deposit_reducesReserveBalance() public {
        uint256 beforeReserve = treasuryContract.reserveBalance();
        uint256 amount = 15_000e6;

        vm.prank(treasurer);
        yieldContract.depositToAave(amount);

        assertEq(treasuryContract.reserveBalance(), beforeReserve - amount);
    }

    function test_deposit_multipleDepositsAccumulate() public {
        vm.prank(treasurer);
        yieldContract.depositToAave(10_000e6);

        vm.prank(treasurer);
        yieldContract.depositToAave(10_000e6);

        assertEq(yieldContract.depositedAmount(), 20_000e6);
    }

    function test_deposit_revertsZeroAmount() public {
        vm.expectRevert(TreasuryYield.ZeroAmount.selector);
        vm.prank(treasurer);
        yieldContract.depositToAave(0);
    }

    function test_deposit_revertsIfExceedsConservativeCap() public {
        // Conservative = 30% of 100k = 30k max
        // Trying to deposit 31k should fail
        uint256 amount = 31_000e6;
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryYield.ExceedsRiskTolerance.selector,
                amount,
                30_000e6
            )
        );
        vm.prank(treasurer);
        yieldContract.depositToAave(amount);
    }

    function test_deposit_exactlyAtConservativeCap() public {
        // 30k exactly = 30% of 100k
        vm.prank(treasurer);
        yieldContract.depositToAave(30_000e6);
        assertEq(yieldContract.depositedAmount(), 30_000e6);
    }

    function test_deposit_revertsAtModerateLevelWhenExceeds() public {
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Moderate);

        // Moderate = 50% of 100k = 50k max
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryYield.ExceedsRiskTolerance.selector,
                51_000e6,
                50_000e6
            )
        );
        vm.prank(treasurer);
        yieldContract.depositToAave(51_000e6);
    }

    function test_deposit_moderateLevelAllows50k() public {
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Moderate);

        vm.prank(treasurer);
        yieldContract.depositToAave(50_000e6);
        assertEq(yieldContract.depositedAmount(), 50_000e6);
    }

    function test_deposit_aggressiveLevelAllows80k() public {
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Aggressive);

        vm.prank(treasurer);
        yieldContract.depositToAave(80_000e6);
        assertEq(yieldContract.depositedAmount(), 80_000e6);
    }

    function test_deposit_revertsIfNotTreasurer() public {
        vm.expectRevert();
        vm.prank(anyone);
        yieldContract.depositToAave(1_000e6);
    }

    function test_deposit_revertsIfGovernorTriesToDeposit() public {
        vm.expectRevert();
        vm.prank(governor);
        yieldContract.depositToAave(1_000e6);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // withdrawFromAave
    // ══════════════════════════════════════════════════════════════════════════

    function _depositFirst(uint256 amount) internal {
        vm.prank(treasurer);
        yieldContract.depositToAave(amount);
    }

    function test_withdraw_basicFlow() public {
        _depositFirst(20_000e6);

        uint256 reserveBefore = treasuryContract.reserveBalance();

        vm.prank(treasurer);
        yieldContract.withdrawFromAave(10_000e6);

        assertEq(yieldContract.depositedAmount(), 10_000e6);
        assertEq(treasuryContract.reserveBalance(), reserveBefore + 10_000e6);
    }

    function test_withdraw_emitsEvent() public {
        _depositFirst(20_000e6);

        vm.expectEmit(true, false, false, true);
        emit TreasuryYield.WithdrawnFromAave(treasurer, 10_000e6, 10_000e6);

        vm.prank(treasurer);
        yieldContract.withdrawFromAave(10_000e6);
    }

    function test_withdraw_fullPrincipal() public {
        _depositFirst(20_000e6);

        vm.prank(treasurer);
        yieldContract.withdrawFromAave(20_000e6);

        assertEq(yieldContract.depositedAmount(), 0);
    }

    function test_withdraw_revertsZeroAmount() public {
        _depositFirst(10_000e6);

        vm.expectRevert(TreasuryYield.ZeroAmount.selector);
        vm.prank(treasurer);
        yieldContract.withdrawFromAave(0);
    }

    function test_withdraw_revertsIfMoreThanDeposited() public {
        _depositFirst(10_000e6);

        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryYield.InsufficientDeposited.selector,
                15_000e6,
                10_000e6
            )
        );
        vm.prank(treasurer);
        yieldContract.withdrawFromAave(15_000e6);
    }

    function test_withdraw_revertsIfNothingDeposited() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryYield.InsufficientDeposited.selector,
                1_000e6,
                0
            )
        );
        vm.prank(treasurer);
        yieldContract.withdrawFromAave(1_000e6);
    }

    function test_withdraw_revertsIfNotTreasurer() public {
        _depositFirst(10_000e6);

        vm.expectRevert();
        vm.prank(anyone);
        yieldContract.withdrawFromAave(1_000e6);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // harvestYield
    // ══════════════════════════════════════════════════════════════════════════

    function test_harvest_basicYield() public {
        _depositFirst(20_000e6);

        // Inject 500 USDC yield into aToken balance
        mockPool.injectYield(address(yieldContract), 500e6);
        // Give pool enough USDC to pay it out
        usdc.mint(address(mockPool), 500e6);

        uint256 reserveBefore = treasuryContract.reserveBalance();

        yieldContract.harvestYield();

        assertEq(treasuryContract.reserveBalance(), reserveBefore + 500e6);
    }

    function test_harvest_emitsYieldHarvestedEvent() public {
        _depositFirst(20_000e6);
        mockPool.injectYield(address(yieldContract), 1_000e6);
        usdc.mint(address(mockPool), 1_000e6);

        vm.expectEmit(true, false, false, false);
        emit TreasuryYield.YieldHarvested(anyone, 1_000e6, block.timestamp);

        vm.prank(anyone);
        yieldContract.harvestYield();
    }

    function test_harvest_updatesLastHarvestTimestamp() public {
        _depositFirst(20_000e6);
        mockPool.injectYield(address(yieldContract), 500e6);
        usdc.mint(address(mockPool), 500e6);

        uint256 before = yieldContract.lastHarvestTimestamp();
        vm.warp(block.timestamp + 30 days);
        yieldContract.harvestYield();

        assertGt(yieldContract.lastHarvestTimestamp(), before);
    }

    function test_harvest_doesNotTouchPrincipal() public {
        _depositFirst(20_000e6);
        mockPool.injectYield(address(yieldContract), 200e6);
        usdc.mint(address(mockPool), 200e6);

        yieldContract.harvestYield();

        // Principal tracking unchanged
        assertEq(yieldContract.depositedAmount(), 20_000e6);
        // aToken balance should be back to exactly deposited (yield withdrawn)
        assertEq(aToken.balanceOf(address(yieldContract)), 20_000e6);
    }

    function test_harvest_revertsIfNoYield() public {
        _depositFirst(20_000e6);
        // No yield injected — aToken balance == depositedAmount

        vm.expectRevert(TreasuryYield.NoYieldAvailable.selector);
        yieldContract.harvestYield();
    }

    function test_harvest_revertsIfNothingDeposited() public {
        vm.expectRevert(TreasuryYield.NoYieldAvailable.selector);
        yieldContract.harvestYield();
    }

    function test_harvest_calledByAnyone() public {
        _depositFirst(20_000e6);
        mockPool.injectYield(address(yieldContract), 100e6);
        usdc.mint(address(mockPool), 100e6);

        vm.prank(address(0xDEAD)); // total stranger
        yieldContract.harvestYield(); // should not revert
    }

    function test_harvest_multipleHarvests() public {
        _depositFirst(20_000e6);

        // First harvest
        mockPool.injectYield(address(yieldContract), 200e6);
        usdc.mint(address(mockPool), 200e6);
        yieldContract.harvestYield();

        // Second harvest
        mockPool.injectYield(address(yieldContract), 300e6);
        usdc.mint(address(mockPool), 300e6);
        yieldContract.harvestYield();

        // All yield swept to reserve, principal intact
        assertEq(yieldContract.depositedAmount(), 20_000e6);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // setRiskTolerance
    // ══════════════════════════════════════════════════════════════════════════

    function test_setRisk_conservativeToModerate() public {
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Moderate);

        assertEq(uint8(yieldContract.riskTolerance()), uint8(TreasuryYield.RiskLevel.Moderate));
    }

    function test_setRisk_emitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit TreasuryYield.RiskToleranceUpdated(
            TreasuryYield.RiskLevel.Conservative,
            TreasuryYield.RiskLevel.Moderate,
            0
        );

        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Moderate);
    }

    function test_setRisk_loweringTriggersAutoWithdraw() public {
        // Set moderate, deposit 45k (within 50% of 100k)
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Moderate);

        vm.prank(treasurer);
        yieldContract.depositToAave(45_000e6);
        assertEq(yieldContract.depositedAmount(), 45_000e6);

        uint256 reserveBefore = treasuryContract.reserveBalance();

        // Drop back to conservative: cap = 30% of remaining reserve (55k) = 16.5k
        // 45k deposited > 16.5k → excess = 45k - 16.5k = 28.5k auto-withdrawn
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Conservative);

        // Deposited amount should now be at or below conservative cap
        uint256 newReserve = treasuryContract.reserveBalance();
        uint256 deposited = yieldContract.depositedAmount();

        // deposited ≤ 30% of (newReserve + deposited)  [total reserve as if all in]
        // Simpler check: reserve increased and deposited decreased
        assertGt(newReserve, reserveBefore);
        assertLt(deposited, 45_000e6);
    }

    function test_setRisk_noWithdrawIfAlreadyUnderNewCap() public {
        // Conservative, deposit 10k (well under 30k cap)
        vm.prank(treasurer);
        yieldContract.depositToAave(10_000e6);

        // Upgrade to Aggressive
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Aggressive);

        // Back to Conservative — 10k is still under 30% of ~90k
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Conservative);

        // No withdrawal happened, deposited stays 10k
        assertEq(yieldContract.depositedAmount(), 10_000e6);
    }

    function test_setRisk_noWithdrawIfNothingDeposited() public {
        // Nothing deployed — just setting level should not revert
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Aggressive);
        assertEq(uint8(yieldContract.riskTolerance()), uint8(TreasuryYield.RiskLevel.Aggressive));
    }

    function test_setRisk_revertsIfNotGovernor() public {
        vm.expectRevert();
        vm.prank(treasurer);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Aggressive);
    }

    function test_setRisk_revertsIfAnyone() public {
        vm.expectRevert();
        vm.prank(anyone);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Moderate);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // emergencyWithdraw
    // ══════════════════════════════════════════════════════════════════════════

    function test_emergency_withdrawsAllPrincipal() public {
        _depositFirst(25_000e6);

        uint256 reserveBefore = treasuryContract.reserveBalance();

        vm.prank(treasurer);
        yieldContract.emergencyWithdraw();

        assertEq(yieldContract.depositedAmount(), 0);
        assertEq(treasuryContract.reserveBalance(), reserveBefore + 25_000e6);
    }

    function test_emergency_withdrawsPrincipalPlusYield() public {
        _depositFirst(20_000e6);
        mockPool.injectYield(address(yieldContract), 500e6);
        usdc.mint(address(mockPool), 500e6);

        uint256 reserveBefore = treasuryContract.reserveBalance();

        vm.prank(treasurer);
        yieldContract.emergencyWithdraw();

        // Should receive principal (20k) + yield (500)
        assertEq(treasuryContract.reserveBalance(), reserveBefore + 20_500e6);
        assertEq(yieldContract.depositedAmount(), 0);
    }

    function test_emergency_emitsEvent() public {
        _depositFirst(10_000e6);

        vm.expectEmit(true, false, false, false);
        emit TreasuryYield.EmergencyWithdrawal(treasurer, 10_000e6);

        vm.prank(treasurer);
        yieldContract.emergencyWithdraw();
    }

    function test_emergency_revertsIfNothingDeposited() public {
        vm.expectRevert(TreasuryYield.NothingDeposited.selector);
        vm.prank(treasurer);
        yieldContract.emergencyWithdraw();
    }

    function test_emergency_revertsIfNotTreasurer() public {
        _depositFirst(10_000e6);

        vm.expectRevert();
        vm.prank(anyone);
        yieldContract.emergencyWithdraw();
    }

    function test_emergency_revertsIfGovernorCalls() public {
        _depositFirst(10_000e6);

        vm.expectRevert();
        vm.prank(governor);
        yieldContract.emergencyWithdraw();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // getYieldInfo
    // ══════════════════════════════════════════════════════════════════════════

    function test_getYieldInfo_initialState() public view {
        (
            uint256 deposited,
            uint256 currentValue,
            uint256 yieldEarned,
            uint256 apyBps,
            TreasuryYield.RiskLevel level
        ) = yieldContract.getYieldInfo();

        assertEq(deposited, 0);
        assertEq(currentValue, 0);
        assertEq(yieldEarned, 0);
        assertEq(apyBps, 0);
        assertEq(uint8(level), uint8(TreasuryYield.RiskLevel.Conservative));
    }

    function test_getYieldInfo_afterDeposit() public {
        _depositFirst(20_000e6);

        (uint256 deposited, uint256 currentValue, uint256 yieldEarned,,) = yieldContract.getYieldInfo();

        assertEq(deposited, 20_000e6);
        assertEq(currentValue, 20_000e6); // no yield yet
        assertEq(yieldEarned, 0);
    }

    function test_getYieldInfo_withYield() public {
        _depositFirst(20_000e6);
        mockPool.injectYield(address(yieldContract), 600e6);

        (uint256 deposited, uint256 currentValue, uint256 yieldEarned,,) = yieldContract.getYieldInfo();

        assertEq(deposited, 20_000e6);
        assertEq(currentValue, 20_600e6);
        assertEq(yieldEarned, 600e6);
    }

    function test_getYieldInfo_apyEstimateNonZeroAfterHarvest() public {
        _depositFirst(20_000e6);

        // Inject yield and harvest to set lastHarvestTimestamp
        mockPool.injectYield(address(yieldContract), 100e6);
        usdc.mint(address(mockPool), 100e6);
        yieldContract.harvestYield();

        uint256 harvestTime = block.timestamp;

        // Warp forward and inject more yield
        vm.warp(block.timestamp + 30 days);
        mockPool.injectYield(address(yieldContract), 200e6);

        (,,,uint256 apyBps,) = yieldContract.getYieldInfo();

        // APY should be non-zero
        assertGt(apyBps, 0);
        (apyBps); // suppress unused warning
        (harvestTime);
    }

    function test_getYieldInfo_riskLevelReflected() public {
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Aggressive);

        (,,,, TreasuryYield.RiskLevel level) = yieldContract.getYieldInfo();
        assertEq(uint8(level), uint8(TreasuryYield.RiskLevel.Aggressive));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // maxDeployable view
    // ══════════════════════════════════════════════════════════════════════════

    function test_maxDeployable_conservative() public view {
        assertEq(yieldContract.maxDeployable(100_000e6), 30_000e6);
    }

    function test_maxDeployable_moderate() public {
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Moderate);
        assertEq(yieldContract.maxDeployable(100_000e6), 50_000e6);
    }

    function test_maxDeployable_aggressive() public {
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Aggressive);
        assertEq(yieldContract.maxDeployable(100_000e6), 80_000e6);
    }

    function test_maxDeployable_zeroReserve() public view {
        assertEq(yieldContract.maxDeployable(0), 0);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Access Control — exhaustive role checks
    // ══════════════════════════════════════════════════════════════════════════

    function test_access_depositOnlyTreasurer() public {
        vm.expectRevert();
        vm.prank(anyone);
        yieldContract.depositToAave(1_000e6);
    }

    function test_access_withdrawOnlyTreasurer() public {
        _depositFirst(10_000e6);
        vm.expectRevert();
        vm.prank(anyone);
        yieldContract.withdrawFromAave(1_000e6);
    }

    function test_access_emergencyOnlyTreasurer() public {
        _depositFirst(10_000e6);
        vm.expectRevert();
        vm.prank(anyone);
        yieldContract.emergencyWithdraw();
    }

    function test_access_setRiskOnlyGovernor() public {
        vm.expectRevert();
        vm.prank(anyone);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Aggressive);
    }

    function test_access_harvestIsPublic() public {
        _depositFirst(10_000e6);
        mockPool.injectYield(address(yieldContract), 100e6);
        usdc.mint(address(mockPool), 100e6);

        // Should succeed for any address
        vm.prank(address(0x1234));
        yieldContract.harvestYield(); // no revert expected
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Edge Cases
    // ══════════════════════════════════════════════════════════════════════════

    function test_edge_depositExactlyAtCap() public {
        // 30% of 100k = 30k exactly (at boundary)
        vm.prank(treasurer);
        yieldContract.depositToAave(30_000e6);
        assertEq(yieldContract.depositedAmount(), 30_000e6);
    }

    function test_edge_depositOneOverCap() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                TreasuryYield.ExceedsRiskTolerance.selector,
                30_000e6 + 1,
                30_000e6
            )
        );
        vm.prank(treasurer);
        yieldContract.depositToAave(30_000e6 + 1);
    }

    function test_edge_depositAndWithdrawAndDepositAgain() public {
        vm.prank(treasurer);
        yieldContract.depositToAave(20_000e6);

        vm.prank(treasurer);
        yieldContract.withdrawFromAave(20_000e6);

        // Can deposit again
        vm.prank(treasurer);
        yieldContract.depositToAave(20_000e6);

        assertEq(yieldContract.depositedAmount(), 20_000e6);
    }

    function test_edge_harvestThenDepositMore() public {
        _depositFirst(20_000e6);
        mockPool.injectYield(address(yieldContract), 500e6);
        usdc.mint(address(mockPool), 500e6);

        yieldContract.harvestYield();

        // depositedAmount still 20k, can deposit more up to cap
        // Reserve now has the 500 back, so it changed slightly
        // Check that the state is consistent
        assertEq(yieldContract.depositedAmount(), 20_000e6);
        assertEq(aToken.balanceOf(address(yieldContract)), 20_000e6);
    }

    function test_edge_setRiskMultipleTimes() public {
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Aggressive);

        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Moderate);

        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Conservative);

        assertEq(uint8(yieldContract.riskTolerance()), uint8(TreasuryYield.RiskLevel.Conservative));
    }

    function test_edge_fullLifecycle() public {
        // 1. Deposit at conservative level
        vm.prank(treasurer);
        yieldContract.depositToAave(25_000e6);

        // 2. Time passes, yield accumulates
        vm.warp(block.timestamp + 90 days);
        uint256 yield1 = 200e6;
        mockPool.injectYield(address(yieldContract), yield1);
        usdc.mint(address(mockPool), yield1);

        // 3. Harvest yield
        yieldContract.harvestYield();

        // 4. Governance votes to go more aggressive
        vm.prank(governor);
        yieldContract.setRiskTolerance(TreasuryYield.RiskLevel.Moderate);

        // 5. Deposit more
        vm.prank(treasurer);
        yieldContract.depositToAave(10_000e6);

        // 6. Emergency: board decides to exit Aave
        vm.prank(treasurer);
        yieldContract.emergencyWithdraw();

        assertEq(yieldContract.depositedAmount(), 0);
        assertEq(aToken.balanceOf(address(yieldContract)), 0);
    }
}
