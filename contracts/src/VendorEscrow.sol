// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VendorEscrow
 * @notice Milestone-based escrow for HOA contractor payments. Board creates work orders
 *         with milestone breakdowns; an assigned inspector approves each milestone and
 *         USDC auto-releases to the vendor. Disputes are escalated to governance (Timelock).
 *
 * @dev Flow:
 *      1. BOARD_ROLE calls createWorkOrder() — USDC pulled from Treasury into escrow.
 *      2. Inspector calls approveMilestone() per milestone — USDC released to vendor.
 *      3. All milestones approved → work order auto-completes.
 *      4. Any party can disputeMilestone() — governance resolves via resolveDispute().
 *      5. BOARD_ROLE can cancelWorkOrder() before any milestone is approved.
 *
 *      The Treasury must approve this contract as a spender (or hold a role that allows
 *      safeTransferFrom). In tests, USDC can be minted directly to this contract.
 */
contract VendorEscrow is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Roles ────────────────────────────────────────────────────────────────

    /// @notice Board multisig — creates work orders, cancels, raises disputes
    bytes32 public constant BOARD_ROLE = keccak256("BOARD_ROLE");

    /// @notice Governance Timelock — resolves disputes
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    // ── Immutables ───────────────────────────────────────────────────────────

    /// @notice USDC token contract (6 decimals on Base)
    IERC20 public immutable usdc;

    /// @notice Treasury address — source of escrow funds and destination for refunds
    address public immutable treasury;

    // ── Enums ────────────────────────────────────────────────────────────────

    /// @notice Life-cycle states for a work order
    enum WorkOrderStatus {
        Created,   // Funded; no milestones approved yet
        Active,    // At least one milestone approved
        Completed, // All milestones settled (approved or returned)
        Cancelled, // Cancelled before any approval — all funds refunded
        Disputed   // One or more milestones under active dispute
    }

    /// @notice Life-cycle states for an individual milestone
    enum MilestoneStatus {
        Pending,  // Awaiting inspector sign-off
        Approved, // Inspector approved; USDC sent to vendor
        Disputed, // Under governance dispute; release paused
        Returned  // Governance resolved against vendor; USDC returned to Treasury
    }

    // ── Structs ──────────────────────────────────────────────────────────────

    /// @notice Individual milestone
    struct Milestone {
        string description;
        uint256 amount;          // USDC (6 decimals)
        MilestoneStatus status;
        string disputeReason;    // populated on dispute
    }

    /// @notice Full work order record
    struct WorkOrder {
        uint256 id;
        address vendor;
        string title;
        string description;
        uint256 totalAmount;     // Sum of original milestone amounts
        uint256 releasedAmount;  // Running total of USDC released to vendor
        WorkOrderStatus status;
        uint48 createdAt;
        uint48 completedAt;
        address inspector;       // Signs off on milestones
        Milestone[] milestones;
    }

    /// @notice Input type for createWorkOrder to avoid stack-too-deep
    struct MilestoneInput {
        string description;
        uint256 amount;
    }

    // ── Storage ──────────────────────────────────────────────────────────────

    /// @notice Work orders indexed by id
    mapping(uint256 => WorkOrder) private _workOrders;

    /// @notice Total work orders created (also next id)
    uint256 private _workOrderCount;

    /// @notice vendor → list of work order ids
    mapping(address => uint256[]) private _vendorWorkOrders;

    // ── Events ───────────────────────────────────────────────────────────────

    event WorkOrderCreated(
        uint256 indexed workOrderId,
        address indexed vendor,
        address indexed inspector,
        uint256 totalAmount,
        uint256 milestoneCount
    );

    event MilestoneApproved(
        uint256 indexed workOrderId,
        uint256 indexed milestoneIndex,
        address indexed inspector,
        uint256 amount
    );

    event MilestoneDisputed(
        uint256 indexed workOrderId,
        uint256 indexed milestoneIndex,
        address indexed raisedBy,
        string reason
    );

    event DisputeResolved(
        uint256 indexed workOrderId,
        uint256 indexed milestoneIndex,
        bool releasedToVendor,
        address resolvedBy
    );

    event WorkOrderCancelled(
        uint256 indexed workOrderId,
        address indexed cancelledBy,
        uint256 refundAmount
    );

    event WorkOrderCompleted(
        uint256 indexed workOrderId,
        uint256 totalAmount
    );

    // ── Custom Errors ────────────────────────────────────────────────────────

    error ZeroAddress();
    error ZeroAmount();
    error EmptyTitle();
    error EmptyMilestones();
    error WorkOrderNotFound(uint256 workOrderId);
    error MilestoneIndexOutOfBounds(uint256 milestoneIndex, uint256 length);
    error NotInspector(address caller, address inspector);
    error MilestoneNotPending(uint256 milestoneIndex, MilestoneStatus status);
    error MilestoneNotDisputed(uint256 milestoneIndex, MilestoneStatus status);
    error WorkOrderAlreadyCancelled(uint256 workOrderId);
    error WorkOrderAlreadyCompleted(uint256 workOrderId);
    error CannotCancelAfterApproval(uint256 workOrderId);
    error NotBoardOrVendor(address caller);
    /// @notice SC-11: vendor cannot be their own inspector
    error InspectorCannotBeVendor();

    // ── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _usdc     USDC token address
     * @param _treasury FaircroftTreasury address (source of escrow funds)
     * @param _board    Board multisig (granted BOARD_ROLE)
     * @param _governor Governance Timelock (granted GOVERNOR_ROLE)
     */
    constructor(
        address _usdc,
        address _treasury,
        address _board,
        address _governor
    ) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_board == address(0)) revert ZeroAddress();
        if (_governor == address(0)) revert ZeroAddress();

        usdc = IERC20(_usdc);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BOARD_ROLE, _board);
        _grantRole(GOVERNOR_ROLE, _governor);
    }

    // ── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Create a new work order and pull USDC from Treasury into escrow.
     * @dev    BOARD_ROLE only. Treasury must have approved this contract as a spender
     *         for at least `sum(milestones.amount)` USDC before calling this.
     *         Milestone amounts must sum to a non-zero total.
     * @param vendor      Contractor receiving payments
     * @param title       Short title (non-empty)
     * @param description Scope of work
     * @param milestones  Ordered milestone inputs; each amount must be > 0
     * @param inspector   Address authorised to approve milestones
     * @return workOrderId  Newly created work order id
     */
    function createWorkOrder(
        address vendor,
        string calldata title,
        string calldata description,
        MilestoneInput[] calldata milestones,
        address inspector
    ) external nonReentrant onlyRole(BOARD_ROLE) returns (uint256 workOrderId) {
        if (vendor == address(0)) revert ZeroAddress();
        if (inspector == address(0)) revert ZeroAddress();
        // SC-11: prevent vendor from acting as their own inspector (self-approval attack)
        if (inspector == vendor) revert InspectorCannotBeVendor();
        if (bytes(title).length == 0) revert EmptyTitle();
        if (milestones.length == 0) revert EmptyMilestones();

        // Validate milestone amounts
        uint256 totalAmount;
        for (uint256 i; i < milestones.length; ++i) {
            if (milestones[i].amount == 0) revert ZeroAmount();
            totalAmount += milestones[i].amount;
        }

        workOrderId = _workOrderCount++;

        WorkOrder storage wo = _workOrders[workOrderId];
        wo.id          = workOrderId;
        wo.vendor      = vendor;
        wo.title       = title;
        wo.description = description;
        wo.totalAmount = totalAmount;
        wo.status      = WorkOrderStatus.Created;
        wo.createdAt   = uint48(block.timestamp);
        wo.inspector   = inspector;

        for (uint256 i; i < milestones.length; ++i) {
            wo.milestones.push(Milestone({
                description:   milestones[i].description,
                amount:        milestones[i].amount,
                status:        MilestoneStatus.Pending,
                disputeReason: ""
            }));
        }

        _vendorWorkOrders[vendor].push(workOrderId);

        // Pull USDC from Treasury into this escrow contract
        usdc.safeTransferFrom(treasury, address(this), totalAmount);

        emit WorkOrderCreated(workOrderId, vendor, inspector, totalAmount, milestones.length);
    }

    /**
     * @notice Inspector approves a milestone, releasing its USDC to the vendor.
     * @dev    Only the inspector assigned to this work order may call this.
     *         Auto-completes the work order when the last milestone is settled.
     * @param workOrderId    Work order id
     * @param milestoneIndex Zero-based milestone index
     */
    function approveMilestone(
        uint256 workOrderId,
        uint256 milestoneIndex
    ) external nonReentrant {
        WorkOrder storage wo = _requireWorkOrder(workOrderId);

        if (msg.sender != wo.inspector) revert NotInspector(msg.sender, wo.inspector);
        if (wo.status == WorkOrderStatus.Cancelled) revert WorkOrderAlreadyCancelled(workOrderId);
        if (wo.status == WorkOrderStatus.Completed)  revert WorkOrderAlreadyCompleted(workOrderId);

        _requireValidMilestoneIndex(wo, milestoneIndex);
        Milestone storage ms = wo.milestones[milestoneIndex];
        if (ms.status != MilestoneStatus.Pending) revert MilestoneNotPending(milestoneIndex, ms.status);

        // Mark approved and update accounting
        ms.status            = MilestoneStatus.Approved;
        wo.releasedAmount   += ms.amount;

        // Upgrade work order from Created → Active on first approval
        if (wo.status == WorkOrderStatus.Created) {
            wo.status = WorkOrderStatus.Active;
        }

        usdc.safeTransfer(wo.vendor, ms.amount);

        emit MilestoneApproved(workOrderId, milestoneIndex, msg.sender, ms.amount);

        _tryComplete(wo, workOrderId);
    }

    /**
     * @notice Flag a milestone as disputed, pausing its release.
     * @dev    BOARD_ROLE or the vendor on this work order may raise a dispute.
     *         Milestone must be in Pending status.
     * @param workOrderId    Work order id
     * @param milestoneIndex Zero-based milestone index
     * @param reason         Human-readable dispute reason
     */
    function disputeMilestone(
        uint256 workOrderId,
        uint256 milestoneIndex,
        string calldata reason
    ) external nonReentrant {
        WorkOrder storage wo = _requireWorkOrder(workOrderId);

        bool isBoard  = hasRole(BOARD_ROLE, msg.sender);
        bool isVendor = (msg.sender == wo.vendor);
        if (!isBoard && !isVendor) revert NotBoardOrVendor(msg.sender);

        if (wo.status == WorkOrderStatus.Cancelled) revert WorkOrderAlreadyCancelled(workOrderId);
        if (wo.status == WorkOrderStatus.Completed)  revert WorkOrderAlreadyCompleted(workOrderId);

        _requireValidMilestoneIndex(wo, milestoneIndex);
        Milestone storage ms = wo.milestones[milestoneIndex];
        if (ms.status != MilestoneStatus.Pending) revert MilestoneNotPending(milestoneIndex, ms.status);

        ms.status        = MilestoneStatus.Disputed;
        ms.disputeReason = reason;
        wo.status        = WorkOrderStatus.Disputed;

        emit MilestoneDisputed(workOrderId, milestoneIndex, msg.sender, reason);
    }

    /**
     * @notice Governance resolves a disputed milestone.
     * @dev    GOVERNOR_ROLE only. Milestone must be in Disputed status.
     *         releaseToVendor=true → USDC sent to vendor and milestone marked Approved.
     *         releaseToVendor=false → USDC returned to Treasury and milestone marked Returned.
     * @param workOrderId     Work order id
     * @param milestoneIndex  Zero-based milestone index
     * @param releaseToVendor true = pay vendor; false = refund Treasury
     */
    function resolveDispute(
        uint256 workOrderId,
        uint256 milestoneIndex,
        bool releaseToVendor
    ) external nonReentrant onlyRole(GOVERNOR_ROLE) {
        WorkOrder storage wo = _requireWorkOrder(workOrderId);

        if (wo.status == WorkOrderStatus.Cancelled) revert WorkOrderAlreadyCancelled(workOrderId);
        if (wo.status == WorkOrderStatus.Completed)  revert WorkOrderAlreadyCompleted(workOrderId);

        _requireValidMilestoneIndex(wo, milestoneIndex);
        Milestone storage ms = wo.milestones[milestoneIndex];
        if (ms.status != MilestoneStatus.Disputed) revert MilestoneNotDisputed(milestoneIndex, ms.status);

        uint256 amount = ms.amount;

        if (releaseToVendor) {
            ms.status          = MilestoneStatus.Approved;
            wo.releasedAmount += amount;
            usdc.safeTransfer(wo.vendor, amount);
        } else {
            ms.status = MilestoneStatus.Returned;
            // SC-05: credit treasury accounting, not raw transfer
            usdc.approve(treasury, amount);
            IFaircroftTreasury(treasury).creditFromEscrow(amount);
        }

        emit DisputeResolved(workOrderId, milestoneIndex, releaseToVendor, msg.sender);

        // Restore work order status now that dispute is resolved (if no others remain)
        _updateStatusAfterResolution(wo);

        _tryComplete(wo, workOrderId);
    }

    /**
     * @notice Cancel a work order, returning all escrowed USDC to Treasury.
     * @dev    BOARD_ROLE only. Reverts if any milestone has been approved (releasedAmount > 0).
     * @param workOrderId Work order id to cancel
     */
    function cancelWorkOrder(uint256 workOrderId)
        external
        nonReentrant
        onlyRole(BOARD_ROLE)
    {
        WorkOrder storage wo = _requireWorkOrder(workOrderId);

        if (wo.status == WorkOrderStatus.Cancelled) revert WorkOrderAlreadyCancelled(workOrderId);
        if (wo.status == WorkOrderStatus.Completed)  revert WorkOrderAlreadyCompleted(workOrderId);
        if (wo.releasedAmount > 0)                   revert CannotCancelAfterApproval(workOrderId);

        wo.status      = WorkOrderStatus.Cancelled;
        wo.completedAt = uint48(block.timestamp);

        // Refund all escrowed USDC — only non-released milestones still sit here
        // (releasedAmount == 0 means nothing left the escrow yet)
        uint256 refund = wo.totalAmount;
        // SC-05: credit treasury accounting, not raw transfer
        usdc.approve(treasury, refund);
        IFaircroftTreasury(treasury).creditFromEscrow(refund);

        emit WorkOrderCancelled(workOrderId, msg.sender, refund);
    }

    // ── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Return the complete work order record.
     * @param workOrderId Work order id
     */
    function getWorkOrder(uint256 workOrderId)
        external
        view
        returns (WorkOrder memory)
    {
        if (workOrderId >= _workOrderCount) revert WorkOrderNotFound(workOrderId);
        return _workOrders[workOrderId];
    }

    /**
     * @notice Total number of work orders ever created.
     */
    function getWorkOrderCount() external view returns (uint256) {
        return _workOrderCount;
    }

    /**
     * @notice All work order ids associated with a vendor address.
     * @param vendor Vendor address
     */
    function getVendorWorkOrders(address vendor)
        external
        view
        returns (uint256[] memory)
    {
        return _vendorWorkOrders[vendor];
    }

    /**
     * @notice All work orders that are not Completed or Cancelled.
     * @dev    Linear scan — acceptable at HOA scale.
     */
    function getActiveWorkOrders()
        external
        view
        returns (WorkOrder[] memory active)
    {
        // Count active first
        uint256 count;
        for (uint256 i; i < _workOrderCount; ++i) {
            WorkOrderStatus s = _workOrders[i].status;
            if (s != WorkOrderStatus.Completed && s != WorkOrderStatus.Cancelled) {
                ++count;
            }
        }

        active = new WorkOrder[](count);
        uint256 idx;
        for (uint256 i; i < _workOrderCount; ++i) {
            WorkOrderStatus s = _workOrders[i].status;
            if (s != WorkOrderStatus.Completed && s != WorkOrderStatus.Cancelled) {
                active[idx++] = _workOrders[i];
            }
        }
    }

    // ── Internal Helpers ─────────────────────────────────────────────────────

    /// @dev Retrieve work order storage or revert if id is out of range
    function _requireWorkOrder(uint256 workOrderId)
        internal
        view
        returns (WorkOrder storage)
    {
        if (workOrderId >= _workOrderCount) revert WorkOrderNotFound(workOrderId);
        return _workOrders[workOrderId];
    }

    /// @dev Revert if milestoneIndex is out of bounds
    function _requireValidMilestoneIndex(WorkOrder storage wo, uint256 milestoneIndex)
        internal
        view
    {
        if (milestoneIndex >= wo.milestones.length) {
            revert MilestoneIndexOutOfBounds(milestoneIndex, wo.milestones.length);
        }
    }

    /**
     * @dev Mark work order Completed when every milestone is terminal
     *      (Approved or Returned — both are settled, just in different directions).
     */
    function _tryComplete(WorkOrder storage wo, uint256 workOrderId) internal {
        uint256 len = wo.milestones.length;
        for (uint256 i; i < len; ++i) {
            MilestoneStatus s = wo.milestones[i].status;
            if (s != MilestoneStatus.Approved && s != MilestoneStatus.Returned) {
                return; // still open milestones
            }
        }
        wo.status      = WorkOrderStatus.Completed;
        wo.completedAt = uint48(block.timestamp);
        emit WorkOrderCompleted(workOrderId, wo.totalAmount);
    }

    /**
     * @dev After a dispute is resolved, check if any milestones remain Disputed.
     *      If not, drop work order status back to Active or Created.
     */
    function _updateStatusAfterResolution(WorkOrder storage wo) internal {
        if (wo.status != WorkOrderStatus.Disputed) return;

        for (uint256 i; i < wo.milestones.length; ++i) {
            if (wo.milestones[i].status == MilestoneStatus.Disputed) {
                return; // still a live dispute
            }
        }

        // No live disputes remain — restore to appropriate state
        wo.status = (wo.releasedAmount > 0)
            ? WorkOrderStatus.Active
            : WorkOrderStatus.Created;
    }
}

// ── Interface ────────────────────────────────────────────────────────────────

/// @dev Minimal interface to FaircroftTreasury — used for SC-05 accounting fix
interface IFaircroftTreasury {
    function creditFromEscrow(uint256 amount) external;
}
