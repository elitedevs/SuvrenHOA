// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FaircroftTreasury.sol";

// ── Aave V3 Minimal Interfaces ─────────────────────────────────────────────────

/// @notice Minimal IPool interface for Aave V3 supply/withdraw
interface IPool {
    /// @notice Supply an asset into Aave
    /// @param asset     The ERC-20 address of the asset to supply
    /// @param amount    Amount to supply (in asset decimals)
    /// @param onBehalfOf  Who will receive the aTokens
    /// @param referralCode  Referral code (0 for none)
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    /// @notice Withdraw an asset from Aave
    /// @param asset   The ERC-20 address
    /// @param amount  Amount to withdraw (use type(uint256).max for full balance)
    /// @param to      Recipient of the withdrawn USDC
    /// @return        Actual amount withdrawn
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/// @notice Minimal IAToken interface (Aave receipt token)
interface IAToken {
    /// @notice Returns the aToken balance — includes accrued yield
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title TreasuryYield
 * @notice Deploys idle SuvrenHOA reserve funds into Aave V3 to earn yield.
 *         Board (TREASURER_ROLE) controls deposit/withdraw operations.
 *         Governance (GOVERNOR_ROLE via Timelock) controls risk tolerance.
 *         Anyone can call harvestYield() to sweep accrued interest back to Treasury.
 *
 * @dev Integration pattern:
 *      1. Treasury grants this contract YIELD_MANAGER_ROLE
 *      2. Treasurer calls depositToAave() — pulls USDC from Treasury → supplies to Aave
 *      3. aUSDC grows in value over time (Aave rebasing)
 *      4. harvestYield() sweeps surplus (aUSDC.balance - deposited) back to Treasury
 *      5. Treasurer calls withdrawFromAave() to return principal to Treasury
 *
 * Architecture notes:
 *  - `depositedAmount` tracks principal only (what we sent to Aave)
 *  - `aUSDC.balanceOf(address(this))` always reflects current value (principal + yield)
 *  - Yield = aUSDC.balance - depositedAmount
 *  - Risk tolerance caps the max percentage of Treasury.reserveBalance that can be deployed
 */
contract TreasuryYield is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Roles ──────────────────────────────────────────────────────────────────

    /// @notice Role for governance-approved operations (Timelock)
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    /// @notice Role for operational tasks (board multisig)
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    // ── Risk Levels ────────────────────────────────────────────────────────────

    /**
     * @notice Risk tolerance levels controlling maximum Aave deployment percentage
     * @dev conservative = 30%, moderate = 50%, aggressive = 80% of reserve
     */
    enum RiskLevel {
        Conservative, // max 30% of reserve in Aave
        Moderate,     // max 50% of reserve in Aave
        Aggressive    // max 80% of reserve in Aave
    }

    // ── Immutables ─────────────────────────────────────────────────────────────

    /// @notice USDC token contract (6 decimals on Base)
    IERC20 public immutable usdc;

    /// @notice Aave V3 Pool contract
    IPool public immutable aavePool;

    /// @notice Aave V3 aUSDC receipt token
    IAToken public immutable aUsdc;

    /// @notice The FaircroftTreasury contract we pull from / return to
    FaircroftTreasury public immutable treasury;

    // ── State ──────────────────────────────────────────────────────────────────

    /// @notice Total USDC principal currently deposited into Aave
    uint256 public depositedAmount;

    /// @notice Block timestamp of the last harvest
    uint256 public lastHarvestTimestamp;

    /// @notice Current risk tolerance governing max deployment percentage
    RiskLevel public riskTolerance;

    // ── Basis points for each risk level ──────────────────────────────────────

    uint256 private constant CONSERVATIVE_BPS = 3000; // 30%
    uint256 private constant MODERATE_BPS      = 5000; // 50%
    uint256 private constant AGGRESSIVE_BPS    = 8000; // 80%
    uint256 private constant BPS_DENOM         = 10000;

    // ── Events ─────────────────────────────────────────────────────────────────

    /// @notice Emitted when USDC is deposited into Aave
    event DepositedToAave(address indexed caller, uint256 amount, uint256 totalDeposited);

    /// @notice Emitted when USDC principal is withdrawn from Aave back to Treasury
    event WithdrawnFromAave(address indexed caller, uint256 requested, uint256 received);

    /// @notice Emitted when accrued yield is swept to Treasury
    event YieldHarvested(address indexed caller, uint256 yieldAmount, uint256 timestamp);

    /// @notice Emitted when risk tolerance level is updated by governance
    event RiskToleranceUpdated(RiskLevel oldLevel, RiskLevel newLevel, uint256 excessWithdrawn);

    /// @notice Emitted on full emergency withdrawal from Aave
    event EmergencyWithdrawal(address indexed caller, uint256 amount);

    // ── Custom Errors ──────────────────────────────────────────────────────────

    error ZeroAmount();
    error ZeroAddress();
    error ExceedsRiskTolerance(uint256 wouldDeposit, uint256 maxAllowed);
    error InsufficientDeposited(uint256 requested, uint256 deposited);
    error NoYieldAvailable();
    error NothingDeposited();
    error AaveWithdrawFailed();

    // ── Constructor ────────────────────────────────────────────────────────────

    /**
     * @notice Deploy TreasuryYield
     * @param _usdc     USDC token address
     * @param _aavePool Aave V3 Pool address
     * @param _aUsdc    Aave V3 aUSDC receipt token address
     * @param _treasury FaircroftTreasury address (must have YIELD_MANAGER_ROLE granted to this contract)
     * @param _governor Initial holder of GOVERNOR_ROLE (Timelock)
     * @param _treasurer Initial holder of TREASURER_ROLE (board multisig)
     */
    constructor(
        address _usdc,
        address _aavePool,
        address _aUsdc,
        address _treasury,
        address _governor,
        address _treasurer
    ) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_aavePool == address(0)) revert ZeroAddress();
        if (_aUsdc == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_governor == address(0)) revert ZeroAddress();
        if (_treasurer == address(0)) revert ZeroAddress();

        usdc = IERC20(_usdc);
        aavePool = IPool(_aavePool);
        aUsdc = IAToken(_aUsdc);
        treasury = FaircroftTreasury(_treasury);

        riskTolerance = RiskLevel.Conservative; // safe default

        _grantRole(DEFAULT_ADMIN_ROLE, _governor);
        _grantRole(GOVERNOR_ROLE, _governor);
        _grantRole(TREASURER_ROLE, _treasurer);
    }

    // ── Core: Deposit ──────────────────────────────────────────────────────────

    /**
     * @notice Deploy reserve USDC into Aave V3 to earn yield.
     *         Pulls USDC directly from Treasury (this contract needs YIELD_MANAGER_ROLE).
     *         Amount must not push total deployed past the risk tolerance cap.
     * @param amount USDC amount to deposit (6-decimal)
     */
    function depositToAave(uint256 amount)
        external
        nonReentrant
        onlyRole(TREASURER_ROLE)
    {
        if (amount == 0) revert ZeroAmount();

        // SC-06 fix: enforce risk cap against TOTAL community reserve (in-treasury + already
        // deployed), not just the remaining in-treasury balance.  Using only reserveBalance()
        // produces a shrinking denominator after each deposit, allowing the effective
        // deployed-to-reserve ratio to exceed the configured cap.
        uint256 totalCommunityReserve = treasury.reserveBalance() + depositedAmount;
        uint256 maxAllowed = _maxDeployable(totalCommunityReserve);
        uint256 wouldDeposit = depositedAmount + amount;

        if (wouldDeposit > maxAllowed) {
            revert ExceedsRiskTolerance(wouldDeposit, maxAllowed);
        }

        // Pull USDC from Treasury reserve
        treasury.releaseReserveForYield(address(this), amount);

        // Approve Aave pool and supply
        usdc.forceApprove(address(aavePool), amount);
        aavePool.supply(address(usdc), amount, address(this), 0);

        depositedAmount += amount;

        emit DepositedToAave(msg.sender, amount, depositedAmount);
    }

    // ── Core: Withdraw ─────────────────────────────────────────────────────────

    /**
     * @notice Redeem aUSDC for USDC principal and return it to the Treasury reserve.
     *         Caller must not request more than the tracked principal.
     * @param amount USDC principal amount to withdraw
     */
    function withdrawFromAave(uint256 amount)
        external
        nonReentrant
        onlyRole(TREASURER_ROLE)
    {
        if (amount == 0) revert ZeroAmount();
        if (amount > depositedAmount) {
            revert InsufficientDeposited(amount, depositedAmount);
        }

        // Withdraw from Aave directly to this contract
        uint256 received = aavePool.withdraw(address(usdc), amount, address(this));

        depositedAmount -= received;

        // Return principal to Treasury
        usdc.forceApprove(address(treasury), received);
        treasury.creditYieldReturn(received);

        emit WithdrawnFromAave(msg.sender, amount, received);
    }

    // ── Core: Harvest Yield ────────────────────────────────────────────────────

    /**
     * @notice Sweep accrued yield (aUSDC balance − deposited principal) back to Treasury.
     *         Anyone can call this — no role restriction. Excess aUSDC is swapped to USDC
     *         via Aave withdraw and credited to the Treasury reserve.
     */
    function harvestYield() external nonReentrant {
        uint256 currentValue = aUsdc.balanceOf(address(this));
        if (currentValue <= depositedAmount) revert NoYieldAvailable();

        uint256 yieldAmount = currentValue - depositedAmount;

        // Withdraw only the yield portion from Aave
        uint256 received = aavePool.withdraw(address(usdc), yieldAmount, address(this));

        // Return yield to Treasury reserve
        usdc.forceApprove(address(treasury), received);
        treasury.creditYieldReturn(received);

        lastHarvestTimestamp = block.timestamp;

        emit YieldHarvested(msg.sender, received, block.timestamp);
    }

    // ── Core: Risk Tolerance ───────────────────────────────────────────────────

    /**
     * @notice Change the risk tolerance level (governance only).
     *         If the new level is more conservative, any excess is immediately
     *         withdrawn from Aave and returned to Treasury.
     * @param newLevel New RiskLevel to set
     */
    function setRiskTolerance(RiskLevel newLevel)
        external
        nonReentrant
        onlyRole(GOVERNOR_ROLE)
    {
        RiskLevel oldLevel = riskTolerance;
        riskTolerance = newLevel;

        uint256 excessWithdrawn = 0;

        // Check if current deployment exceeds the new cap
        // CR-07: use totalCommunityReserve (reserveBalance + depositedAmount) consistent
        // with depositToAave's SC-06 fix — bare reserveBalance() shrinks the denominator
        // because deployed funds have already left the treasury, producing a cap that is
        // lower than intended and triggering unnecessary auto-withdrawals.
        if (depositedAmount > 0) {
            uint256 totalCommunityReserve = treasury.reserveBalance() + depositedAmount;
            uint256 newMax = _maxDeployable(totalCommunityReserve);

            if (depositedAmount > newMax) {
                uint256 excess = depositedAmount - newMax;

                uint256 received = aavePool.withdraw(address(usdc), excess, address(this));
                depositedAmount -= received;
                usdc.forceApprove(address(treasury), received);
                treasury.creditYieldReturn(received);

                excessWithdrawn = received;
            }
        }

        emit RiskToleranceUpdated(oldLevel, newLevel, excessWithdrawn);
    }

    // ── Core: Emergency Withdraw ───────────────────────────────────────────────

    /**
     * @notice Immediately pull all Aave funds (principal + yield) back to Treasury.
     *         Resets depositedAmount to 0. For use in emergencies or protocol sunset.
     */
    function emergencyWithdraw()
        external
        nonReentrant
        onlyRole(TREASURER_ROLE)
    {
        if (depositedAmount == 0) revert NothingDeposited();

        uint256 preDepositedAmount = depositedAmount; // CR-08: snapshot before zeroing
        uint256 totalAave = aUsdc.balanceOf(address(this));

        // Use type(uint256).max to pull everything
        uint256 received = aavePool.withdraw(address(usdc), type(uint256).max, address(this));

        depositedAmount = 0;
        lastHarvestTimestamp = block.timestamp;

        // Return everything to Treasury
        usdc.forceApprove(address(treasury), received);
        treasury.creditYieldReturn(received);

        // CR-08: yield = aToken balance - principal deposited (not received - totalAave,
        // which is always 0 since received ≤ totalAave). Capture before zeroing depositedAmount.
        uint256 yieldPortion = totalAave > preDepositedAmount ? totalAave - preDepositedAmount : 0;
        emit EmergencyWithdrawal(msg.sender, received);
        emit YieldHarvested(msg.sender, yieldPortion, block.timestamp);
    }

    // ── Views ──────────────────────────────────────────────────────────────────

    /**
     * @notice Returns a snapshot of the current yield position
     * @return deposited        USDC principal currently in Aave
     * @return currentValue     Current aUSDC balance (principal + accrued yield)
     * @return yieldEarned      Unrealized yield available to harvest
     * @return apyEstimateBps   Rough APY estimate in basis points (requires lastHarvestTimestamp)
     * @return level            Current risk tolerance level
     */
    function getYieldInfo() external view returns (
        uint256 deposited,
        uint256 currentValue,
        uint256 yieldEarned,
        uint256 apyEstimateBps,
        RiskLevel level
    ) {
        deposited = depositedAmount;
        currentValue = aUsdc.balanceOf(address(this));
        yieldEarned = currentValue > deposited ? currentValue - deposited : 0;
        level = riskTolerance;

        // APY estimate: annualized rate based on time since last harvest
        // Only meaningful if we have a prior harvest timestamp and non-zero principal
        if (deposited > 0 && lastHarvestTimestamp > 0 && block.timestamp > lastHarvestTimestamp) {
            uint256 elapsed = block.timestamp - lastHarvestTimestamp;
            // apyBps = (yield / principal) * (365 days / elapsed) * 10000
            apyEstimateBps = (yieldEarned * 365 days * BPS_DENOM) / (deposited * elapsed);
        } else {
            apyEstimateBps = 0;
        }
    }

    /**
     * @notice Returns the maximum USDC deployable given the current risk tolerance
     * @param totalReserve Total reserve balance to cap against
     * @return max Maximum USDC that can be deployed at the current risk level
     */
    function maxDeployable(uint256 totalReserve) external view returns (uint256) {
        return _maxDeployable(totalReserve);
    }

    // ── Internal Helpers ───────────────────────────────────────────────────────

    /**
     * @dev Returns the max USDC deployable for the current risk level
     * @param totalReserve Reserve balance to compute percentage of
     */
    function _maxDeployable(uint256 totalReserve) internal view returns (uint256) {
        if (riskTolerance == RiskLevel.Conservative) {
            return totalReserve * CONSERVATIVE_BPS / BPS_DENOM;
        } else if (riskTolerance == RiskLevel.Moderate) {
            return totalReserve * MODERATE_BPS / BPS_DENOM;
        } else {
            return totalReserve * AGGRESSIVE_BPS / BPS_DENOM;
        }
    }
}
