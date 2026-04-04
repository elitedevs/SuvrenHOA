---
title: "SuvrenHOA Source Code Deposit"
subtitle: "© 2026 Suvren LLC — All Rights Reserved"
date: "2026-03-24"
---

<style>
  body { font-family: 'Courier New', monospace; font-size: 9.5pt; color: #000; background: #fff; margin: 1in; }
  h1 { font-size: 16pt; text-align: center; margin-bottom: 4px; }
  h2 { font-size: 12pt; text-align: center; margin-bottom: 4px; }
  .cover { text-align: center; margin: 3in auto 0; }
  .cover-rule { border: 2px solid black; margin: 24px auto; width: 80%; }
  pre { font-family: 'Courier New', monospace; font-size: 8pt; line-height: 1.35; white-space: pre-wrap; word-wrap: break-word; }
  .file-header { background: #000; color: #fff; padding: 4px 8px; font-weight: bold; font-size: 9pt; margin-top: 16px; }
  .page-break { page-break-after: always; }
  .section-title { font-size: 13pt; font-weight: bold; border-bottom: 1px solid black; margin: 20px 0 10px; }
</style>

<div class="cover">

# SuvrenHOA Source Code Deposit

<hr class="cover-rule">

## © 2026 Suvren LLC — All Rights Reserved

**Work Title:** SuvrenHOA: Blockchain-Based Homeowners Association Governance Platform

**Type of Work:** Computer Program (Literary Work)

**Year of Completion:** 2026

**Date of First Use:** 2026-03-24

**Author / Claimant:** Suvren LLC North Carolina

**Inventor:** Ryan Shanahan

<hr class="cover-rule">

*This deposit contains the first 25 pages and last 25 pages of source code as required by the U.S. Copyright Office for unpublished software registration. Certain environment variables and service keys have been replaced with [REDACTED] to protect trade secrets.*

*Deposit prepared: 2026-03-25*

</div>

<div class="page-break"></div>

---

# PART I — FIRST 25 PAGES OF SOURCE CODE
## (Lines 1–1250, beginning of codebase)

---

<div class="file-header">contracts/src/PropertyNFT.sol</div>

<pre>
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/governance/utils/Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title PropertyNFT
 * @notice ERC-721 token representing property ownership in Faircroft HOA.
 *         Each lot gets exactly one NFT. The NFT carries voting power (1 NFT = 1 vote)
 *         and is transfer-restricted (soulbound except during verified property sales).
 * @dev Inherits ERC721Enumerable for totalSupply/tokenByIndex, Votes for governance,
 *      and AccessControl for role-based permissions.
 *      Uses TIMESTAMP-based clock mode (EIP-6372) — critical for L2 deployment.
 */
contract PropertyNFT is ERC721, ERC721Enumerable, Votes, AccessControl {
    // ── Roles ────────────────────────────────────────────────────────────────

    /// @notice Role for minting NFTs and approving transfers (board multisig)
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    /// @notice Role for governance operations (Governor contract via Timelock)
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    // ── Immutables ───────────────────────────────────────────────────────────

    /// @notice Maximum number of lots in the community (set at deploy, cannot change)
    uint256 public immutable maxLots;

    // ── Configuration ────────────────────────────────────────────────────────

    /// @notice Whether transfers require board approval (default: true)
    bool public transfersRequireApproval;

    /// @notice Whether new mints auto-delegate to self (default: true)
    bool public autoDelegateOnMint;

    // ── Property Data ────────────────────────────────────────────────────────

    struct PropertyInfo {
        uint64  lotNumber;
        uint64  squareFootage;
        uint128 lastDuesTimestamp;
        string  streetAddress;
    }

    /// @notice Property data keyed by tokenId
    mapping(uint256 tokenId => PropertyInfo) public properties;

    // ── Transfer Control ─────────────────────────────────────────────────────

    /// @notice Pending transfer approvals: tokenId → approved buyer address
    mapping(uint256 tokenId => address approvedBuyer) public pendingTransfers;

    // ── Counters ─────────────────────────────────────────────────────────────

    uint256 private _totalMinted;

    // ── Events ───────────────────────────────────────────────────────────────

    event PropertyMinted(uint256 indexed tokenId, address indexed owner,
        uint64 lotNumber, string streetAddress);
    event TransferApproved(uint256 indexed tokenId, address indexed currentOwner,
        address indexed approvedBuyer);
    event TransferApprovalRevoked(uint256 indexed tokenId);
    event DuesStatusUpdated(uint256 indexed tokenId, uint128 lastDuesTimestamp);
    event ConfigUpdated(string parameter, bool value);

    // ── Errors ───────────────────────────────────────────────────────────────

    error MaxLotsReached(uint256 maxLots);
    error LotAlreadyMinted(uint256 lotNumber);
    error TransferNotApproved(uint256 tokenId);
    error InvalidLotNumber(uint256 lotNumber);
    error ZeroAddress();
    error TokenDoesNotExist(uint256 tokenId);

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(uint256 _maxLots, string memory _name, string memory _symbol)
        ERC721(_name, _symbol) EIP712(_name, "1") {
        if (_maxLots == 0) revert InvalidLotNumber(0);
        maxLots = _maxLots;
        transfersRequireApproval = true;
        autoDelegateOnMint = true;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }

    // ── Core Functions ───────────────────────────────────────────────────────

    function mintProperty(address to, uint64 lotNumber,
        string calldata streetAddress, uint64 sqft)
        external onlyRole(REGISTRAR_ROLE) returns (uint256) {
        if (to == address(0)) revert ZeroAddress();
        if (lotNumber == 0 || lotNumber > maxLots) revert InvalidLotNumber(lotNumber);
        if (_ownerOf(lotNumber) != address(0)) revert LotAlreadyMinted(lotNumber);

        uint256 tokenId = lotNumber;
        _safeMint(to, tokenId);
        _totalMinted++;

        properties[tokenId] = PropertyInfo({
            lotNumber: lotNumber,
            streetAddress: streetAddress,
            squareFootage: sqft,
            lastDuesTimestamp: 0
        });

        if (autoDelegateOnMint) {
            _delegate(to, to);
        }

        emit PropertyMinted(tokenId, to, lotNumber, streetAddress);
        return tokenId;
    }

    function approveTransfer(uint256 tokenId, address newOwner)
        external onlyRole(REGISTRAR_ROLE) {
        if (newOwner == address(0)) revert ZeroAddress();
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        pendingTransfers[tokenId] = newOwner;
        emit TransferApproved(tokenId, ownerOf(tokenId), newOwner);
    }

    function revokeTransferApproval(uint256 tokenId)
        external onlyRole(REGISTRAR_ROLE) {
        delete pendingTransfers[tokenId];
        emit TransferApprovalRevoked(tokenId);
    }

    function updateDuesStatus(uint256 tokenId, uint128 timestamp)
        external onlyRole(GOVERNOR_ROLE) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        properties[tokenId].lastDuesTimestamp = timestamp;
        emit DuesStatusUpdated(tokenId, timestamp);
    }

    function setTransfersRequireApproval(bool value) external onlyRole(GOVERNOR_ROLE) {
        transfersRequireApproval = value;
        emit ConfigUpdated("transfersRequireApproval", value);
    }

    function setAutoDelegateOnMint(bool value) external onlyRole(GOVERNOR_ROLE) {
        autoDelegateOnMint = value;
        emit ConfigUpdated("autoDelegateOnMint", value);
    }

    // ── View Functions ───────────────────────────────────────────────────────

    function getProperty(uint256 tokenId) external view returns (PropertyInfo memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return properties[tokenId];
    }

    function isTransferPending(uint256 tokenId) external view returns (bool, address) {
        address buyer = pendingTransfers[tokenId];
        return (buyer != address(0), buyer);
    }

    function totalMinted() external view returns (uint256) { return _totalMinted; }

    function lotExists(uint64 lotNumber) external view returns (bool) {
        return _ownerOf(lotNumber) != address(0);
    }

    // ── EIP-6372: Timestamp-Based Clock ──────────────────────────────────────

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // ── Internal Overrides ───────────────────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && transfersRequireApproval) {
            if (to == address(0)) revert TransferNotApproved(tokenId);
            address approvedBuyer = pendingTransfers[tokenId];
            if (approvedBuyer == address(0) || approvedBuyer != to) {
                revert TransferNotApproved(tokenId);
            }
            delete pendingTransfers[tokenId];
        }
        address previousOwner = super._update(to, tokenId, auth);
        _transferVotingUnits(from, to, 1);
        if (from != address(0) && to != address(0) && autoDelegateOnMint) {
            _delegate(to, to);
        }
        return previousOwner;
    }

    function _increaseBalance(address account, uint128 amount)
        internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }

    function _getVotingUnits(address account) internal view virtual override
        returns (uint256) {
        return balanceOf(account);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
</pre>

<div class="file-header">contracts/src/FaircroftGovernor.sol</div>

<pre>
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorProposalGuardian.sol";

/**
 * @title FaircroftGovernor
 * @notice On-chain governance for Faircroft HOA. Supports four proposal categories
 *         with different quorum and threshold requirements.
 */
contract FaircroftGovernor is Governor, GovernorSettings, GovernorCountingSimple,
    GovernorVotes, GovernorTimelockControl, GovernorProposalGuardian {

    enum ProposalCategory {
        Routine,        // 15% quorum, simple majority, 2-day timelock
        Financial,      // 33% quorum, simple majority, 4-day timelock
        Governance,     // 51% quorum, simple majority, 4-day timelock
        Constitutional  // 67% quorum, 2/3 supermajority, 7-day timelock
    }

    mapping(uint256 proposalId => ProposalCategory) public proposalCategories;
    mapping(ProposalCategory => uint256) public categoryQuorumBps;
    mapping(ProposalCategory => uint256) public categoryThresholdBps;
    mapping(uint256 proposalId => string) public proposalMetadataUri;
    uint256 public maxActiveProposals;
    uint256 public activeProposalCount;

    event ProposalCategorized(uint256 indexed proposalId,
        ProposalCategory category, string metadataUri);
    event QuorumUpdated(ProposalCategory category, uint256 oldBps, uint256 newBps);
    event ThresholdUpdated(ProposalCategory category, uint256 oldBps, uint256 newBps);
    event MaxActiveProposalsUpdated(uint256 oldMax, uint256 newMax);

    error TooManyActiveProposals(uint256 max);
    error InvalidBps(uint256 bps);

    constructor(IVotes _propertyNFT, TimelockController _timelock,
        address _proposalGuardian)
        Governor("FaircroftGovernor")
        GovernorSettings(1 days, 7 days, 1)
        GovernorVotes(_propertyNFT)
        GovernorTimelockControl(_timelock) {
        _setProposalGuardian(_proposalGuardian);
        categoryQuorumBps[ProposalCategory.Routine] = 1500;
        categoryQuorumBps[ProposalCategory.Financial] = 3300;
        categoryQuorumBps[ProposalCategory.Governance] = 5100;
        categoryQuorumBps[ProposalCategory.Constitutional] = 6700;
        categoryThresholdBps[ProposalCategory.Routine] = 5000;
        categoryThresholdBps[ProposalCategory.Financial] = 5000;
        categoryThresholdBps[ProposalCategory.Governance] = 5000;
        categoryThresholdBps[ProposalCategory.Constitutional] = 6667;
        maxActiveProposals = 10;
    }

    function proposeWithCategory(address[] memory targets, uint256[] memory values,
        bytes[] memory calldatas, string memory description,
        ProposalCategory category, string memory metadataUri) public returns (uint256) {
        if (activeProposalCount >= maxActiveProposals)
            revert TooManyActiveProposals(maxActiveProposals);
        uint256 proposalId = propose(targets, values, calldatas, description);
        proposalCategories[proposalId] = category;
        proposalMetadataUri[proposalId] = metadataUri;
        activeProposalCount++;
        emit ProposalCategorized(proposalId, category, metadataUri);
        return proposalId;
    }

    function quorum(uint256 timepoint) public view override(Governor) returns (uint256) {
        uint256 totalWeight = token().getPastTotalSupply(timepoint);
        return (totalWeight * 1500) / 10000;
    }

    function proposalQuorum(uint256 proposalId) public view returns (uint256) {
        ProposalCategory category = proposalCategories[proposalId];
        uint256 snapshot = proposalSnapshot(proposalId);
        uint256 totalWeight = token().getPastTotalSupply(snapshot);
        return (totalWeight * categoryQuorumBps[category]) / 10000;
    }

    function _quorumReached(uint256 proposalId)
        internal view override(Governor, GovernorCountingSimple) returns (bool) {
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) =
            proposalVotes(proposalId);
        uint256 totalVotes = forVotes + againstVotes + abstainVotes;
        return totalVotes >= proposalQuorum(proposalId);
    }

    function _voteSucceeded(uint256 proposalId)
        internal view override(Governor, GovernorCountingSimple) returns (bool) {
        (uint256 againstVotes, uint256 forVotes, ) = proposalVotes(proposalId);
        ProposalCategory category = proposalCategories[proposalId];
        uint256 thresholdBps = categoryThresholdBps[category];
        uint256 totalCast = forVotes + againstVotes;
        if (totalCast == 0) return false;
        return (forVotes * 10000) > (thresholdBps * totalCast);
    }

    function updateCategoryQuorum(ProposalCategory category, uint256 newBps)
        external onlyGovernance {
        if (newBps > 10000) revert InvalidBps(newBps);
        emit QuorumUpdated(category, categoryQuorumBps[category], newBps);
        categoryQuorumBps[category] = newBps;
    }

    function updateCategoryThreshold(ProposalCategory category, uint256 newBps)
        external onlyGovernance {
        if (newBps > 10000) revert InvalidBps(newBps);
        emit ThresholdUpdated(category, categoryThresholdBps[category], newBps);
        categoryThresholdBps[category] = newBps;
    }

    function updateMaxActiveProposals(uint256 newMax) external onlyGovernance {
        emit MaxActiveProposalsUpdated(maxActiveProposals, newMax);
        maxActiveProposals = newMax;
    }

    function clock() public view override(Governor, GovernorVotes) returns (uint48) {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE() public pure override(Governor, GovernorVotes)
        returns (string memory) { return "mode=timestamp"; }

    function votingDelay() public view override(Governor, GovernorSettings)
        returns (uint256) { return super.votingDelay(); }
    function votingPeriod() public view override(Governor, GovernorSettings)
        returns (uint256) { return super.votingPeriod(); }
    function proposalThreshold() public view override(Governor, GovernorSettings)
        returns (uint256) { return super.proposalThreshold(); }
    function state(uint256 proposalId)
        public view override(Governor, GovernorTimelockControl)
        returns (ProposalState) { return super.state(proposalId); }
    function proposalNeedsQueuing(uint256 proposalId)
        public view override(Governor, GovernorTimelockControl)
        returns (bool) { return super.proposalNeedsQueuing(proposalId); }

    function _queueOperations(uint256 proposalId, address[] memory targets,
        uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(uint256 proposalId, address[] memory targets,
        uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(address[] memory targets, uint256[] memory values,
        bytes[] memory calldatas, bytes32 descriptionHash)
        internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl)
        returns (address) { return super._executor(); }

    function _validateCancel(uint256 proposalId, address caller)
        internal view override(Governor, GovernorProposalGuardian) returns (bool) {
        return super._validateCancel(proposalId, caller);
    }
}
</pre>

<div class="file-header">contracts/src/FaircroftTreasury.sol (partial)</div>

<pre>
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FaircroftTreasury
 * @notice Holds all community funds in USDC. Collects dues, auto-splits between
 *         operating and reserve funds, and disburses payments to vendors.
 */
contract FaircroftTreasury is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    IERC20 public immutable usdc;

    uint256 public quarterlyDuesAmount;
    uint256 public annualDuesDiscount;
    uint256 public lateFeePercent;
    uint256 public gracePeriod;
    uint256 public operatingReserveSplitBps;
    uint256 public operatingBalance;
    uint256 public reserveBalance;
    uint256 public emergencySpendingLimit;
    uint256 public emergencySpentThisPeriod;
    uint256 public emergencyPeriodStart;
    uint256 public emergencyPeriodDuration;

    struct DuesRecord {
        uint128 paidThrough;
        uint128 totalPaid;
    }

    struct Expenditure {
        address vendor;
        uint128 amount;
        uint48  timestamp;
        uint48  proposalId;
        string  description;
        string  category;
    }

    mapping(uint256 tokenId => DuesRecord) public duesRecords;
    Expenditure[] public expenditures;

    event DuesPaid(uint256 indexed tokenId, address indexed payer,
        uint256 amount, uint256 quarters, uint128 paidThrough);
    event LateFeeCharged(uint256 indexed tokenId, uint256 feeAmount);
    event ExpenditureMade(uint256 indexed expId, address indexed vendor,
        uint256 amount, string description, string category, uint48 proposalId);
    event EmergencySpend(uint256 indexed expId, address indexed vendor,
        uint256 amount, string description, address authorizedBy);

    error InvalidPaymentPeriod();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientOperatingBalance(uint256 requested, uint256 available);
    error InsufficientReserveBalance(uint256 requested, uint256 available);
    error EmergencyLimitExceeded(uint256 requested, uint256 remaining);
    error InvalidBps(uint256 bps);

    constructor(address _usdc, uint256 _quarterlyDues,
        uint256 _annualDiscount, uint256 _emergencyLimit) {
        if (_usdc == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
        quarterlyDuesAmount = _quarterlyDues;
        annualDuesDiscount = _annualDiscount;
        emergencySpendingLimit = _emergencyLimit;
        operatingReserveSplitBps = 8000;
        lateFeePercent = 1000;
        gracePeriod = 30 days;
        emergencyPeriodDuration = 30 days;
        emergencyPeriodStart = block.timestamp;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function payDues(uint256 tokenId, uint256 quarters) external nonReentrant {
        if (quarters == 0 || quarters > 4) revert InvalidPaymentPeriod();
        uint256 amount;
        if (quarters == 4) {
            uint256 annual = quarterlyDuesAmount * 4;
            amount = annual - (annual * annualDuesDiscount / 10000);
        } else {
            amount = quarterlyDuesAmount * quarters;
        }
        DuesRecord storage record = duesRecords[tokenId];
        if (record.paidThrough > 0 &&
            block.timestamp > record.paidThrough + gracePeriod) {
            uint256 lateFee = amount * lateFeePercent / 10000;
            amount += lateFee;
            emit LateFeeCharged(tokenId, lateFee);
        }
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        uint256 startDate = record.paidThrough > block.timestamp
            ? record.paidThrough : block.timestamp;
        record.paidThrough = uint128(startDate + (quarters * 91 days));
        record.totalPaid += uint128(amount);
        uint256 toOperating = amount * operatingReserveSplitBps / 10000;
        uint256 toReserve = amount - toOperating;
        operatingBalance += toOperating;
        reserveBalance += toReserve;
        emit DuesPaid(tokenId, msg.sender, amount, quarters, record.paidThrough);
    }
    // ... [remainder of FaircroftTreasury — see full source]
</pre>

<div class="page-break"></div>

---

# PART II — LAST 25 PAGES OF SOURCE CODE
## (Final ~1250 lines, end of codebase)

---

<div class="file-header">frontend/src/hooks/useMessages.ts</div>

<pre>
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

export interface Message {
  id: string;
  from: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  lotId: string;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

interface MessageStore {
  conversations: Conversation[];
  optIn: boolean;
}

function getStoreKey(address: string): string {
  return `suvren_messages_${address.toLowerCase()}`;
}

function loadStore(address: string): MessageStore {
  if (typeof window === 'undefined') return { conversations: [], optIn: false };
  try {
    const raw = localStorage.getItem(getStoreKey(address));
    if (!raw) return { conversations: [], optIn: false };
    return JSON.parse(raw) as MessageStore;
  } catch {
    return { conversations: [], optIn: false };
  }
}

function saveStore(address: string, store: MessageStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStoreKey(address), JSON.stringify(store));
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function useMessages() {
  const { address, isConnected } = useAccount();
  const [store, setStore] = useState<MessageStore>({ conversations: [], optIn: false });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!address || !isConnected) {
      setStore({ conversations: [], optIn: false });
      setIsLoaded(false);
      return;
    }
    const s = loadStore(address);
    setStore(s);
    setIsLoaded(true);
  }, [address, isConnected]);

  const persist = useCallback((next: MessageStore) => {
    if (!address) return;
    setStore(next);
    saveStore(address, next);
  }, [address]);

  const sendMessage = useCallback((toLotId: string, text: string, myLotId: string) => {
    if (!address || !text.trim()) return;
    const newMsg: Message = {
      id: generateId(), from: myLotId, text: text.trim(),
      timestamp: Date.now(), read: true,
    };
    const next = { ...store };
    const existing = next.conversations.find((c) => c.lotId === toLotId);
    if (existing) {
      existing.messages = [...existing.messages, newMsg];
      existing.lastMessage = newMsg;
      existing.unreadCount = existing.messages.filter(
        (m) => !m.read && m.from !== myLotId).length;
    } else {
      next.conversations = [...next.conversations,
        { lotId: toLotId, messages: [newMsg], lastMessage: newMsg, unreadCount: 0 }];
    }
    persist(next);
  }, [address, store, persist]);

  const receiveMessage = useCallback((fromLotId: string, text: string) => {
    if (!address || !text.trim()) return;
    const newMsg: Message = {
      id: generateId(), from: fromLotId, text: text.trim(),
      timestamp: Date.now(), read: false,
    };
    const next = { ...store };
    const existing = next.conversations.find((c) => c.lotId === fromLotId);
    if (existing) {
      existing.messages = [...existing.messages, newMsg];
      existing.lastMessage = newMsg;
      existing.unreadCount = existing.messages.filter((m) => !m.read).length;
    } else {
      next.conversations = [...next.conversations,
        { lotId: fromLotId, messages: [newMsg], lastMessage: newMsg, unreadCount: 1 }];
    }
    persist(next);
  }, [address, store, persist]);

  const markAsRead = useCallback((lotId: string) => {
    const next = { ...store };
    const convo = next.conversations.find((c) => c.lotId === lotId);
    if (!convo) return;
    convo.messages = convo.messages.map((m) => ({ ...m, read: true }));
    convo.unreadCount = 0;
    persist(next);
  }, [store, persist]);

  const setOptIn = useCallback((value: boolean) => {
    persist({ ...store, optIn: value });
  }, [store, persist]);

  const totalUnread = store.conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return {
    isLoaded, optIn: store.optIn,
    conversations: [...store.conversations].sort((a, b) =>
      (b.lastMessage?.timestamp ?? 0) - (a.lastMessage?.timestamp ?? 0)),
    totalUnread,
    getMessages: (lotId: string) =>
      store.conversations.find((c) => c.lotId === lotId)?.messages ?? [],
    sendMessage, receiveMessage, markAsRead, setOptIn,
  };
}
</pre>

<div class="file-header">frontend/src/hooks/useNeighborhoodMap.ts</div>

<pre>
'use client';

import { useState, useEffect, useCallback } from 'react';
import { publicClient } from '@/lib/publicClient';
import { CONTRACTS } from '@/config/contracts';
import PropertyNFTAbi from '@/config/abis/PropertyNFT.json';
import FaircroftTreasuryAbi from '@/config/abis/FaircroftTreasury.json';

export interface LotData {
  tokenId: number;
  lotNumber: number;
  streetAddress: string;
  sqft: number;
  owner: string;
  isDuesCurrent: boolean | null;
}

const REFRESH_INTERVAL = 2 * 60 * 1000;

export function useNeighborhoodMap() {
  const [lots, setLots] = useState<LotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contracts = CONTRACTS.baseSepolia;
      const supply = await publicClient.readContract({
        address: contracts.propertyNFT, abi: PropertyNFTAbi,
        functionName: 'totalSupply',
      }) as bigint;
      const totalCount = Number(supply);
      setTotalSupply(totalCount);
      if (totalCount === 0) { setLots([]); return; }

      const tokenIds = Array.from({ length: totalCount }, (_, i) => BigInt(i + 1));
      const [propertyResults, ownerResults, duesResults] = await Promise.all([
        Promise.all(tokenIds.map((id) =>
          publicClient.readContract({ address: contracts.propertyNFT,
            abi: PropertyNFTAbi, functionName: 'getProperty', args: [id] }).catch(() => null))),
        Promise.all(tokenIds.map((id) =>
          publicClient.readContract({ address: contracts.propertyNFT,
            abi: PropertyNFTAbi, functionName: 'ownerOf', args: [id] }).catch(() => null))),
        Promise.all(tokenIds.map((id) =>
          publicClient.readContract({ address: contracts.treasury,
            abi: FaircroftTreasuryAbi, functionName: 'isDuesCurrent',
            args: [id] }).catch(() => null))),
      ]);

      setLots(tokenIds.map((tokenId, i) => {
        const prop = propertyResults[i] as { lotNumber: bigint;
          squareFootage: bigint; streetAddress: string } | null;
        return {
          tokenId: Number(tokenId),
          lotNumber: prop ? Number(prop.lotNumber) : Number(tokenId),
          streetAddress: prop?.streetAddress ?? 'Unknown Address',
          sqft: prop ? Number(prop.squareFootage) : 0,
          owner: (ownerResults[i] as string) ?? '0x0000000000000000000000000000000000000000',
          isDuesCurrent: duesResults[i] as boolean | null,
        };
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load neighborhood data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { lots, loading, error, totalSupply, refresh: fetchData };
}
</pre>

<div class="file-header">frontend/src/hooks/useNotifications.ts</div>

<pre>
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

export interface Notification {
  id: string; type: string; title: string;
  message: string; link: string | null; read: boolean; created_at: string;
}

export function useNotifications() {
  const { address } = useAccount();
  const { data, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', address],
    queryFn: async () => {
      if (!address) return [];
      const res = await fetch(`/api/notifications?wallet=${address}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!address, staleTime: 30_000, refetchInterval: 60_000,
  });
  return {
    notifications: data || [],
    unreadCount: (data || []).filter(n => !n.read).length,
    isLoading,
  };
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
</pre>

<div class="file-header">frontend/src/hooks/usePayDues.ts</div>

<pre>
'use client';

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useContracts } from './useContracts';
import { erc20Abi, parseUnits } from 'viem';

export function usePayDues() {
  const { treasury, usdc } = useContracts();
  const { writeContract: writeApprove, data: approveHash, isPending: isApproving } =
    useWriteContract();
  const { isLoading: isApproveTxPending, isSuccess: isApproved } =
    useWaitForTransactionReceipt({ hash: approveHash });
  const { writeContract: writePayDues, data: payHash, isPending: isPaying } =
    useWriteContract();
  const { isLoading: isPayTxPending, isSuccess: isPaid } =
    useWaitForTransactionReceipt({ hash: payHash });

  const approve = (amount: string) => {
    writeApprove({ address: usdc, abi: erc20Abi, functionName: 'approve',
      args: [treasury.address, parseUnits(amount, 6)] });
  };

  const payDues = (tokenId: number, quarters: number) => {
    writePayDues({ ...treasury, functionName: 'payDues',
      args: [BigInt(tokenId), BigInt(quarters)] });
  };

  return { approve, payDues,
    isApproving: isApproving || isApproveTxPending, isApproved,
    isPaying: isPaying || isPayTxPending, isPaid, approveHash, payHash };
}

export function useUSDCAllowance(ownerAddress: string | undefined) {
  const { treasury, usdc } = useContracts();
  const { data } = useReadContract({
    address: usdc, abi: erc20Abi, functionName: 'allowance',
    args: ownerAddress ? [ownerAddress as `0x${string}`, treasury.address] : undefined,
    query: { enabled: !!ownerAddress, refetchInterval: 10_000 },
  });
  return data ? Number(data) / 1e6 : 0;
}

export function useUSDCBalance(address: string | undefined) {
  const { usdc } = useContracts();
  const { data } = useReadContract({
    address: usdc, abi: erc20Abi, functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
  return data ? Number(data) / 1e6 : 0;
}
</pre>

<div class="file-header">frontend/src/hooks/useProposals.ts</div>

<pre>
'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useContracts } from './useContracts';

export type ProposalCategory = 'Routine' | 'Financial' | 'Governance' | 'Constitutional';

export const CATEGORIES = [
  { value: 0, label: 'Routine', quorum: '15%', threshold: '>50%', color: 'green', icon: '🔧' },
  { value: 1, label: 'Financial', quorum: '33%', threshold: '>50%', color: 'blue', icon: '💰' },
  { value: 2, label: 'Governance', quorum: '51%', threshold: '>50%', color: 'purple', icon: '⚖️' },
  { value: 3, label: 'Constitutional', quorum: '67%', threshold: '>66.7%', color: 'red', icon: '📜' },
];

export const PROPOSAL_STATES = [
  'Pending', 'Active', 'Canceled', 'Defeated',
  'Succeeded', 'Queued', 'Expired', 'Executed',
] as const;

export function useProposalState(proposalId: bigint | undefined) {
  const { governor } = useContracts();
  const { data: state } = useReadContract({
    ...governor, functionName: 'state',
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: proposalId !== undefined, refetchInterval: 30_000 },
  });
  const stateNum = state !== undefined ? Number(state) : undefined;
  const stateLabel = stateNum !== undefined ? PROPOSAL_STATES[stateNum] : undefined;
  return { state: stateNum, stateLabel };
}

export function useCastVote() {
  const { governor } = useContracts();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const castVote = (proposalId: bigint, support: number) => {
    writeContract({ ...governor, functionName: 'castVote', args: [proposalId, support] });
  };
  return { castVote, isPending, isConfirming, isSuccess, hash };
}

export function useProposeWithCategory() {
  const { governor } = useContracts();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const propose = (targets: `0x${string}`[], values: bigint[],
    calldatas: `0x${string}`[], description: string,
    category: number, metadataUri: string) => {
    writeContract({ ...governor, functionName: 'proposeWithCategory',
      args: [targets, values, calldatas, description, category, metadataUri] });
  };
  return { propose, isPending, isConfirming, isSuccess, hash };
}
</pre>

<div class="file-header">frontend/src/hooks/useProperty.ts</div>

<pre>
'use client';

import { useAccount, useReadContract } from 'wagmi';
import { useContracts } from './useContracts';

export function useProperty() {
  const { address } = useAccount();
  const { propertyNFT } = useContracts();

  const { data: balance } = useReadContract({
    ...propertyNFT, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: votes } = useReadContract({
    ...propertyNFT, functionName: 'getVotes',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: delegatee } = useReadContract({
    ...propertyNFT, functionName: 'delegates',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: totalSupply } = useReadContract({
    ...propertyNFT, functionName: 'totalSupply',
  });

  const { data: tokenId } = useReadContract({
    ...propertyNFT, functionName: 'tokenOfOwnerByIndex',
    args: address ? [address, BigInt(0)] : undefined,
    query: { enabled: !!address && !!balance && (balance as bigint) > BigInt(0) },
  });

  const { data: propertyInfo } = useReadContract({
    ...propertyNFT, functionName: 'getProperty',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });

  return {
    address,
    hasProperty: balance !== undefined && (balance as bigint) > BigInt(0),
    balance: balance ? Number(balance) : 0,
    votes: votes ? Number(votes) : 0,
    delegatee: delegatee as string | undefined,
    totalSupply: totalSupply ? Number(totalSupply) : 0,
    tokenId: tokenId !== undefined ? Number(tokenId) : undefined,
    propertyInfo: propertyInfo as {
      lotNumber: bigint; squareFootage: bigint;
      lastDuesTimestamp: bigint; streetAddress: string;
    } | undefined,
  };
}
</pre>

<div class="file-header">frontend/src/hooks/useTreasury.ts</div>

<pre>
'use client';

import { useReadContract } from 'wagmi';
import { useContracts } from './useContracts';
import { formatUnits } from 'viem';

export function useTreasury() {
  const { treasury } = useContracts();
  const { data: snapshot } = useReadContract({ ...treasury, functionName: 'getTreasurySnapshot' });
  const { data: quarterlyDues } = useReadContract({ ...treasury, functionName: 'quarterlyDuesAmount' });
  const { data: annualDiscount } = useReadContract({ ...treasury, functionName: 'annualDuesDiscount' });
  const { data: expenditureCount } = useReadContract({ ...treasury, functionName: 'getExpenditureCount' });

  const snap = snapshot as [bigint, bigint, bigint, bigint] | undefined;
  const fmt = (v: bigint) => parseFloat(formatUnits(v, 6)).toLocaleString('en-US',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return {
    totalBalance: snap ? fmt(snap[0]) : '0.00',
    operatingBalance: snap ? fmt(snap[1]) : '0.00',
    reserveBalance: snap ? fmt(snap[2]) : '0.00',
    quarterlyDues: quarterlyDues ? fmt(quarterlyDues as bigint) : '200.00',
    annualDiscount: annualDiscount ? Number(annualDiscount) / 100 : 5,
    annualAmount: quarterlyDues
      ? fmt((quarterlyDues as bigint) * BigInt(4) *
          BigInt(10000 - Number(annualDiscount)) / BigInt(10000))
      : '760.00',
    expenditureCount: expenditureCount ? Number(expenditureCount) : 0,
  };
}

export function useDuesStatus(tokenId: number | undefined) {
  const { treasury } = useContracts();
  const { data: isCurrent } = useReadContract({
    ...treasury, functionName: 'isDuesCurrent',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  });
  const { data: duesOwed } = useReadContract({
    ...treasury, functionName: 'getDuesOwed',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  });
  const fmt = (v: bigint) => parseFloat(formatUnits(v, 6)).toLocaleString('en-US',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    isCurrent: isCurrent as boolean | undefined,
    quartersOwed: duesOwed ? Number((duesOwed as [bigint, bigint])[0]) : 0,
    amountOwed: duesOwed ? fmt((duesOwed as [bigint, bigint])[1]) : '0.00',
  };
}
</pre>

<div class="file-header">frontend/src/lib/publicClient.ts</div>

<pre>
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

/**
 * Shared public client for wallet-less chain reads.
 * Used by usePublicData, useActivityFeed, and any public-facing pages.
 */
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

export const CHAIN_ID = 84532;
</pre>

<div class="file-header">frontend/src/lib/supabase.ts</div>

<pre>
import { createClient } from '@supabase/supabase-js';

// Environment variables — actual values stored in .env.local (not committed to repo)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '[REDACTED]';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '[REDACTED]';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '[REDACTED]';

// Server-side client (service role — full access, use in API routes only)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Client-side client (anon key — RLS enforced)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</pre>

---

*End of Source Code Deposit*

**Total source files in deposit:** Contracts (4 core + 1 deploy script + 5 tests) + Frontend (50+ TypeScript/React modules)

**This deposit represents first and last 25 pages (~1,250 lines each) of the SuvrenHOA codebase, prepared in compliance with U.S. Copyright Office deposit requirements for computer programs.**

*© 2026 Suvren LLC North Carolina — All Rights Reserved*
*Inventor / Author: Ryan Shanahan*
*Date of First Use / First Commit: 2026-03-24*
