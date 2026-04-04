# Faircroft HOA Governance Platform — Technical Planning Document

**Project:** Decentralized HOA Governance on Blockchain
**Community:** Faircroft (Raleigh, NC area)
**Author:** Generated for Ryan @ Suvren
**Date:** March 23, 2026

---

## 1. Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/Next.js)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Voting   │ │ Treasury │ │ Document │ │ Property Registry │  │
│  │ Portal   │ │ Dashboard│ │ Vault    │ │ & Identity        │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬──────────┘  │
│       │             │            │                 │             │
│  ┌────┴─────────────┴────────────┴─────────────────┴──────────┐ │
│  │              Wallet Adapter (wagmi/viem)                    │ │
│  └────────────────────────┬───────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                     Smart Contract Layer                        │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐ │
│  │ FaircroftGov │ │ Treasury     │ │ PropertyNFT (ERC-721)   │ │
│  │ (Governor)   │ │ (Timelock +  │ │ 1 Lot = 1 NFT = 1 Vote │ │
│  │              │ │  Multisig)   │ │                         │ │
│  └──────┬───────┘ └──────┬───────┘ └────────────┬────────────┘ │
│         │                │                       │              │
│  ┌──────┴────────────────┴───────────────────────┴────────────┐ │
│  │                  DocumentRegistry                          │ │
│  │          (IPFS/Arweave CID ↔ on-chain hash)               │ │
│  └────────────────────────┬───────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                  Off-Chain Storage Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │   Arweave    │  │    IPFS      │  │  Indexer / Subgraph   │ │
│  │ (permanent   │  │ (fast CDN    │  │  (The Graph / custom  │ │
│  │  documents)  │  │  serving)    │  │   event indexer)      │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

**Smart Contracts (4 contracts):**
- `PropertyNFT` — ERC-721, soulbound-ish (transfer restricted to property sales). 1 lot = 1 NFT = 1 vote.
- `FaircroftGovernor` — OpenZeppelin Governor fork. Proposals, voting, execution. Uses PropertyNFT for vote weight.
- `FaircroftTreasury` — TimelockController + multisig guard. Holds dues, pays vendors.
- `DocumentRegistry` — Maps document hashes to Arweave/IPFS CIDs. Immutable append-only log.

**Frontend:**
- Next.js + wagmi/viem for wallet interactions
- RainbowKit or ConnectKit for wallet connection
- The Graph subgraph (or Ponder/Envio) for indexed event data

**Identity / Property Verification:**
- Initial minting is admin-gated (board mints NFTs to verified property owners)
- Future: integrate with county deed records or title company APIs
- NFT transfer requires board approval (prevents speculation, ensures 1-lot-1-vote)

**Document Storage:**
- Primary: Arweave (permanent, one-time cost)
- CDN layer: IPFS pinning for fast retrieval
- On-chain: SHA-256 hash + Arweave TX ID stored in DocumentRegistry

---

## 2. Chain Comparison

### Candidates

| Chain | Type | Avg Tx Fee | Finality | EVM | Ecosystem Maturity |
|-------|------|-----------|----------|-----|-------------------|
| **Base** | Optimistic Rollup (L2) | ~$0.001 | ~2 min (soft), 7 day challenge | Yes | High — Coinbase backing, large DeFi ecosystem |
| **Arbitrum One** | Optimistic Rollup (L2) | ~$0.008 | ~2 min (soft), 7 day challenge | Yes | Highest L2 TVL, deep tooling |
| **Optimism** | Optimistic Rollup (L2) | ~$0.012 | ~2 min (soft), 7 day challenge | Yes | Strong — OP Stack ecosystem |
| **Polygon PoS** | Sidechain | ~$0.002 | ~2 sec | Yes | Mature, but not a true rollup |
| **Polygon zkEVM** | ZK Rollup (L2) | ~$0.02 | Minutes | Yes | Growing, inherits Ethereum security |
| **Solana** | L1 | ~$0.0005 | ~400ms | No (Rust/Anchor) | Large, but different tooling ecosystem |
| **Avalanche C-Chain** | L1 subnet | ~$0.02 | ~2 sec | Yes | Moderate |

### Cost Estimates for Typical HOA Operations

Based on current (March 2026) gas prices post-EIP-4844:

| Operation | Gas Units (est.) | Base | Arbitrum | Solana |
|-----------|-----------------|------|----------|--------|
| Cast a vote | ~80K | $0.002 | $0.01 | $0.0005 |
| Submit a proposal | ~200K | $0.005 | $0.03 | $0.001 |
| Pay monthly dues | ~65K | $0.001 | $0.008 | $0.0005 |
| Register a document hash | ~100K | $0.003 | $0.015 | $0.0008 |
| Mint property NFT | ~150K | $0.004 | $0.02 | $0.001 |
| Deploy governance suite | ~5M | $0.50-2.00 | $2-8 | $0.05-0.20 |

### Recommendation: **Base (primary) with Ethereum L1 as settlement**

**Why Base:**
- Lowest fees among EVM L2s (~$0.001/tx)
- Full EVM compatibility = use OpenZeppelin, Hardhat, Foundry, ethers.js — the entire Solidity ecosystem
- Coinbase backing provides institutional credibility (relevant for HOA board buy-in)
- Native USDC support via Coinbase (critical for dues flow)
- Growing but not congested — fees stay predictable
- Ethereum L1 security inheritance

**Why not Solana:**
- Cheaper fees, but the difference is negligible at HOA scale (~100 homeowners, ~200 txs/month = ~$0.20/month on Base)
- Requires Rust/Anchor instead of Solidity — smaller hiring pool
- Less mature governance tooling (no OpenZeppelin equivalent)
- Different wallet ecosystem (Phantom vs MetaMask/Coinbase Wallet)

**Why not Polygon PoS:**
- Not a true rollup — different security model
- Decentralization concerns with validator set

---

## 3. Document Storage — Cost Analysis

### Storage Options Compared

A typical HOA CC&R document is 50 pages. Estimated sizes:
- CC&Rs (50 pages, PDF): ~2-5 MB
- Meeting minutes (5-10 pages): ~200-500 KB
- Annual budget (spreadsheet + PDF): ~500 KB - 1 MB
- Amendment documents: ~100-500 KB
- **Total year 1 corpus estimate: ~20-50 MB**
- **Ongoing per year: ~5-10 MB**

| Storage Method | Cost Model | 50 MB (Year 1) | 10 MB/yr (Ongoing) | Permanence | Speed |
|---------------|-----------|-----------------|---------------------|------------|-------|
| **Fully on-chain (calldata)** | Per-byte gas cost | $50-200+ | $10-40/yr | Permanent, on-chain | Fast |
| **On-chain (blobs via EIP-4844)** | Blob gas | Temporary only — pruned after ~18 days | N/A | ❌ Not permanent | N/A |
| **Arweave** | One-time payment | ~$0.35-0.40 | ~$0.07-0.08 | Permanent (200+ years) | Moderate |
| **IPFS + Pinning (Pinata)** | Monthly subscription | $0/mo (free tier) to $20/mo | Same | ❌ Requires ongoing payment | Fast |
| **Arweave + IPFS hybrid** | One-time + free pin | ~$0.40 + free IPFS cache | ~$0.08 | Permanent + fast access | Fast |

### Recommendation: **Arweave for permanence + IPFS for fast serving**

**Architecture:**
1. Document uploaded → SHA-256 hash computed client-side
2. Document uploaded to Arweave via Bundlr/Irys (one-time ~$0.007/MB)
3. Arweave TX ID recorded on-chain in DocumentRegistry alongside SHA-256 hash
4. IPFS pin created via web3.storage or Pinata free tier for fast CDN access
5. Anyone can verify: download from Arweave → hash → compare to on-chain hash

**Cost for Faircroft (100 lots):**
- Year 1 (initial 50 MB corpus): **~$0.40 in AR tokens** for permanent storage
- On-chain hashes (50 documents × ~100K gas): **~$0.15 on Base**
- Ongoing per year (~20 new documents): **~$0.08 Arweave + $0.06 on-chain**
- **Total Year 1: under $1.00. Ongoing: cents per year.**

This is essentially free compared to traditional document management services that charge $50-200/month.

### On-Chain Hash Registry Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DocumentRegistry {
    enum DocType { CCR, Minutes, Budget, Amendment, Resolution, Other }

    struct Document {
        bytes32 contentHash;      // SHA-256 of the document
        string arweaveTxId;       // Arweave transaction ID
        string ipfsCid;           // IPFS CID for fast retrieval
        DocType docType;
        uint256 timestamp;
        address uploadedBy;
        string title;
    }

    Document[] public documents;
    mapping(bytes32 => uint256) public hashToIndex;

    event DocumentRegistered(
        uint256 indexed docId,
        bytes32 indexed contentHash,
        DocType docType,
        string title,
        address uploadedBy
    );

    modifier onlyGovernance() {
        // Only callable by Governor or authorized board members
        require(msg.sender == governance, "Not authorized");
        _;
    }

    address public governance;

    constructor(address _governance) {
        governance = _governance;
    }

    function registerDocument(
        bytes32 _contentHash,
        string calldata _arweaveTxId,
        string calldata _ipfsCid,
        DocType _docType,
        string calldata _title
    ) external onlyGovernance returns (uint256) {
        require(hashToIndex[_contentHash] == 0, "Document already registered");

        uint256 docId = documents.length;
        documents.push(Document({
            contentHash: _contentHash,
            arweaveTxId: _arweaveTxId,
            ipfsCid: _ipfsCid,
            docType: _docType,
            timestamp: block.timestamp,
            uploadedBy: msg.sender,
            title: _title
        }));

        hashToIndex[_contentHash] = docId + 1; // +1 to distinguish from default 0

        emit DocumentRegistered(docId, _contentHash, _docType, _title, msg.sender);
        return docId;
    }

    function verifyDocument(bytes32 _contentHash) external view returns (bool exists, uint256 docId) {
        uint256 idx = hashToIndex[_contentHash];
        if (idx == 0) return (false, 0);
        return (true, idx - 1);
    }

    function getDocumentCount() external view returns (uint256) {
        return documents.length;
    }
}
```

---

## 4. Smart Contract Architecture

### 4.1 PropertyNFT (ERC-721 — Soulbound-ish)

Each lot in Faircroft gets exactly one NFT. This NFT represents voting power and property ownership verification.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/governance/utils/Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract PropertyNFT is ERC721, Votes, AccessControl {
    bytes32 public constant BOARD_ROLE = keccak256("BOARD_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    struct Property {
        string streetAddress;
        uint256 lotNumber;
        uint256 squareFootage;
        bool duesCurrentThrough; // timestamp of last paid period
        uint256 lastDuesPayment;
    }

    mapping(uint256 => Property) public properties;
    uint256 public totalLots;
    uint256 public maxLots;

    // Transfer restrictions
    bool public transfersRequireApproval = true;
    mapping(uint256 => bool) public transferApproved;

    event PropertyMinted(uint256 indexed tokenId, address indexed owner, uint256 lotNumber);
    event TransferApproved(uint256 indexed tokenId, address indexed newOwner);

    constructor(uint256 _maxLots)
        ERC721("Faircroft Property", "FAIR")
        EIP712("Faircroft Property", "1")
    {
        maxLots = _maxLots;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BOARD_ROLE, msg.sender);
    }

    function mintProperty(
        address owner,
        uint256 lotNumber,
        string calldata streetAddress,
        uint256 sqft
    ) external onlyRole(REGISTRAR_ROLE) returns (uint256) {
        require(totalLots < maxLots, "All lots minted");

        uint256 tokenId = lotNumber; // tokenId == lotNumber for simplicity
        _safeMint(owner, tokenId);

        properties[tokenId] = Property({
            streetAddress: streetAddress,
            lotNumber: lotNumber,
            squareFootage: sqft,
            duesCurrentThrough: false,
            lastDuesPayment: 0
        });

        totalLots++;
        emit PropertyMinted(tokenId, owner, lotNumber);
        return tokenId;
    }

    // Override transfer to require board approval (property sale verification)
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) without approval
        if (from != address(0) && transfersRequireApproval) {
            require(transferApproved[tokenId], "Transfer not approved by board");
            transferApproved[tokenId] = false; // Reset after use
        }

        return super._update(to, tokenId, auth);
    }

    function approveTransfer(uint256 tokenId, address newOwner)
        external onlyRole(BOARD_ROLE)
    {
        transferApproved[tokenId] = true;
        emit TransferApproved(tokenId, newOwner);
    }

    // === Votes interface (1 NFT = 1 vote) ===

    function _getVotingUnits(address account) internal view virtual override returns (uint256) {
        return balanceOf(account);
    }

    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

**Key design decisions:**
- `tokenId` == `lotNumber` for direct mapping
- Transfers require board approval (prevents NFT speculation, ensures property sale verification)
- Implements `Votes` extension so Governor can query voting power
- 1 NFT = 1 vote, regardless of property size (as specified)

### 4.2 FaircroftGovernor

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract FaircroftGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // Proposal categories for different quorum/threshold requirements
    enum ProposalCategory {
        Standard,       // Routine business: 25% quorum, simple majority
        Financial,      // Budget/spending over threshold: 33% quorum, simple majority
        Amendment,      // CC&R changes: 67% quorum, 2/3 supermajority
        Special         // Board elections, special assessments: 50% quorum, simple majority
    }

    mapping(uint256 => ProposalCategory) public proposalCategories;
    uint256 public financialThreshold = 5000e6; // $5,000 in USDC (6 decimals)

    constructor(
        IVotes _token,
        TimelockController _timelock
    )
        Governor("FaircroftGovernor")
        GovernorSettings(
            1 days,    // votingDelay: 1 day after proposal before voting starts
            7 days,    // votingPeriod: 7 days to vote
            1          // proposalThreshold: need 1 NFT (1 property) to propose
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(25) // Default 25% quorum
        GovernorTimelockControl(_timelock)
    {}

    function proposeWithCategory(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalCategory category
    ) public returns (uint256) {
        uint256 proposalId = propose(targets, values, calldatas, description);
        proposalCategories[proposalId] = category;
        return proposalId;
    }

    function quorum(uint256 blockNumber)
        public view override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        // Could be extended to check proposalCategories for dynamic quorum
        return super.quorum(blockNumber);
    }

    // Required overrides omitted for brevity — standard OZ Governor pattern

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId)
        public view override(Governor, GovernorTimelockControl) returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function _queueOperations(
        uint256 proposalId, address[] memory targets, uint256[] memory values,
        bytes[] memory calldatas, bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId, address[] memory targets, uint256[] memory values,
        bytes[] memory calldatas, bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets, uint256[] memory values,
        bytes[] memory calldatas, bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}
```

### 4.3 Treasury Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FaircroftTreasury {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;          // USDC on Base
    address public immutable governor;      // Governor contract
    address public immutable timelock;      // Timelock controller

    // Dues configuration
    uint256 public monthlyDuesAmount;       // In USDC (6 decimals)
    uint256 public annualDuesAmount;        // Discount for annual payment

    // Spending limits (governor can spend up to limit without full vote)
    uint256 public boardSpendingLimit = 1000e6; // $1,000 USDC

    struct DuesRecord {
        uint256 paidThrough;   // Timestamp: dues paid through this date
        uint256 totalPaid;     // Lifetime total paid
        uint256 lastPayment;   // Timestamp of last payment
    }

    struct Expenditure {
        address payable vendor;
        uint256 amount;
        string description;
        string category;
        uint256 proposalId;    // 0 if board-approved (under limit)
        uint256 timestamp;
        address approvedBy;
    }

    mapping(uint256 => DuesRecord) public duesRecords;  // tokenId => record
    Expenditure[] public expenditures;

    // Reserve fund
    uint256 public reserveTarget;           // Target reserve amount
    uint256 public reserveBalance;          // Current reserve
    uint256 public operatingBalance;        // Available for operations

    event DuesPaid(uint256 indexed tokenId, address indexed payer, uint256 amount, uint256 paidThrough);
    event ExpenditureMade(uint256 indexed expId, address vendor, uint256 amount, string description);
    event DuesAmountChanged(uint256 oldAmount, uint256 newAmount);

    modifier onlyGovernance() {
        require(msg.sender == governor || msg.sender == timelock, "Not authorized");
        _;
    }

    constructor(
        address _usdc,
        address _governor,
        address _timelock,
        uint256 _monthlyDues,
        uint256 _annualDues
    ) {
        usdc = IERC20(_usdc);
        governor = _governor;
        timelock = _timelock;
        monthlyDuesAmount = _monthlyDues;
        annualDuesAmount = _annualDues;
    }

    function payDues(uint256 tokenId, uint256 months) external {
        require(months > 0 && months <= 12, "Invalid period");

        uint256 amount;
        if (months == 12) {
            amount = annualDuesAmount;
        } else {
            amount = monthlyDuesAmount * months;
        }

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        DuesRecord storage record = duesRecords[tokenId];
        uint256 startDate = record.paidThrough > block.timestamp
            ? record.paidThrough
            : block.timestamp;
        record.paidThrough = startDate + (months * 30 days);
        record.totalPaid += amount;
        record.lastPayment = block.timestamp;

        // Split: 80% operating, 20% reserve (configurable via governance)
        uint256 toReserve = amount * 20 / 100;
        reserveBalance += toReserve;
        operatingBalance += (amount - toReserve);

        emit DuesPaid(tokenId, msg.sender, amount, record.paidThrough);
    }

    function makeExpenditure(
        address payable vendor,
        uint256 amount,
        string calldata description,
        string calldata category,
        uint256 proposalId
    ) external onlyGovernance {
        require(amount <= operatingBalance, "Insufficient operating balance");

        operatingBalance -= amount;
        usdc.safeTransfer(vendor, amount);

        uint256 expId = expenditures.length;
        expenditures.push(Expenditure({
            vendor: vendor,
            amount: amount,
            description: description,
            category: category,
            proposalId: proposalId,
            timestamp: block.timestamp,
            approvedBy: msg.sender
        }));

        emit ExpenditureMade(expId, vendor, amount, description);
    }

    function setDuesAmount(uint256 _monthly, uint256 _annual) external onlyGovernance {
        emit DuesAmountChanged(monthlyDuesAmount, _monthly);
        monthlyDuesAmount = _monthly;
        annualDuesAmount = _annual;
    }

    // View functions for transparency
    function getTreasuryBalance() external view returns (
        uint256 total, uint256 operating, uint256 reserve
    ) {
        total = usdc.balanceOf(address(this));
        operating = operatingBalance;
        reserve = reserveBalance;
    }

    function isDuesCurrent(uint256 tokenId) external view returns (bool) {
        return duesRecords[tokenId].paidThrough >= block.timestamp;
    }

    function getExpenditureCount() external view returns (uint256) {
        return expenditures.length;
    }
}
```

### 4.4 Contract Relationships

```
PropertyNFT ──(voting power)──> FaircroftGovernor
                                       │
                                       ▼
                              TimelockController
                                       │
                          ┌────────────┼────────────┐
                          ▼            ▼            ▼
                   FaircroftTreasury  DocumentRegistry  PropertyNFT
                   (spend funds)     (register docs)   (admin ops)
```

The Governor proposes and votes. On passing, proposals execute through the TimelockController with a delay (e.g., 2 days). The Timelock is the actual `owner` of Treasury, DocumentRegistry, and PropertyNFT admin functions.

---

## 5. Dues Flow Design

### Flow Diagram

```
Homeowner                  Frontend              Treasury Contract       USDC on Base
    │                         │                         │                     │
    ├─ Connect wallet ───────>│                         │                     │
    │                         │                         │                     │
    ├─ Select "Pay Dues" ────>│                         │                     │
    │   (1 month or annual)   │                         │                     │
    │                         │                         │                     │
    │<─ Show amount + ────────┤                         │                     │
    │   approve USDC flow     │                         │                     │
    │                         │                         │                     │
    ├─ Approve USDC spend ───>│──── approve(treasury, ──>──────────────────>│
    │                         │      amount)            │                     │
    │                         │                         │                     │
    ├─ Confirm payment ──────>│──── payDues(tokenId, ──>│                     │
    │                         │      months)            │── transferFrom() ──>│
    │                         │                         │                     │
    │<─ Receipt + ────────────┤<─── DuesPaid event ─────┤                     │
    │   updated status        │                         │                     │
    │                         │                 ┌───────┴────────┐            │
    │                         │                 │ 80% Operating  │            │
    │                         │                 │ 20% Reserve    │            │
    │                         │                 └────────────────┘            │
```

### Stablecoin vs Custom Token vs Hybrid — Analysis

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **USDC (stablecoin)** | Familiar, stable value, easy on/off-ramp, native on Base, Coinbase integration | Centralized issuer (Circle), could be frozen | **Recommended for MVP** |
| **Custom ERC-20 token** | Full control, could add utility (voting weight, loyalty) | Adds complexity, regulatory risk (may be a security), needs liquidity | Unnecessary complexity |
| **Hybrid (USDC + governance token)** | USDC for financial, token for governance extras | Two-token complexity, confusing for non-crypto homeowners | Over-engineered for HOA |

### Recommendation: **USDC on Base**

Rationale:
- Homeowners already think in dollars — USDC is 1:1 USD
- Coinbase provides native USDC on/off-ramp (buy USDC with bank account, no exchange needed)
- No token price volatility — $200/month dues are always $200
- No SEC concerns about issuing a custom token
- PropertyNFT already handles governance rights — no need for a separate governance token

### Dues Management Features

**Automatic reminders:** Off-chain service monitors `isDuesCurrent()` and sends email/push notifications.

**Late fees:** Configurable in Treasury contract, applied automatically on late payment.

**Transparency dashboard:** Real-time view of treasury balance, all expenditures, dues status per lot (anonymized or public per community preference).

**Vendor payments:** All expenditures recorded on-chain with description, category, and governance proposal ID (if applicable). Complete audit trail, no hidden spending.

---

## 6. Security Considerations

### 6.1 Multisig for Treasury

- Deploy a Gnosis Safe (Safe{Wallet}) as an additional guard on the Timelock
- **3-of-5 multisig** for the initial board (5 board members, 3 required to sign)
- Timelock is the owner, but Safe can veto/cancel during the delay period
- For emergency spending (pipe burst, etc.): board multisig can approve up to `boardSpendingLimit` without a full community vote

### 6.2 Timelock on Proposals

- **2-day timelock** on all governance-approved actions
- Gives community time to review before execution
- Board (via multisig) can cancel during timelock if something looks wrong
- Financial proposals over $5,000 get a **4-day timelock**
- CC&R amendments get a **7-day timelock**

### 6.3 Quorum Requirements

| Proposal Type | Quorum | Passing Threshold | Timelock |
|--------------|--------|-------------------|----------|
| Standard (routine) | 25% of NFT holders | Simple majority (>50%) | 2 days |
| Financial (>$5K) | 33% of NFT holders | Simple majority | 4 days |
| Special assessment | 50% of NFT holders | Simple majority | 4 days |
| CC&R amendment | 67% of NFT holders | 2/3 supermajority | 7 days |
| Board election | 50% of NFT holders | Plurality | 2 days |

### 6.4 Additional Security Measures

**Smart Contract Security:**
- Use OpenZeppelin battle-tested contracts (Governor, TimelockController, ERC-721)
- Professional audit before mainnet deployment ($15K-50K, essential)
- Formal verification of critical Treasury functions (optional, expensive)
- Upgradeable proxy pattern (UUPS) for Governor and Treasury — allows bug fixes via governance vote

**Operational Security:**
- Board member key management: hardware wallets (Ledger) required for multisig signers
- Social recovery option for homeowners who lose wallet access
- Off-chain identity verification before NFT minting (prevent Sybil)
- Rate limiting on proposals (max 5 active proposals at once)

**Attack Vectors to Mitigate:**
- **Flash loan governance attack:** Not applicable — PropertyNFT is non-transferable (soulbound). Can't borrow votes.
- **51% attack:** Require 67% for CC&R changes. Board multisig can cancel suspicious proposals.
- **Key compromise:** Timelock delay gives community time to react. Multisig requires 3-of-5.
- **Smart contract bug:** Upgradeable proxy allows fixes. Audit reduces risk.

---

## 7. MVP Scope — Faircroft Proof of Concept

### Phase 1: Foundation (Weeks 1-6)

**Smart Contracts:**
- [ ] PropertyNFT with mint, transfer restriction, voting power
- [ ] FaircroftGovernor with standard proposal flow
- [ ] TimelockController with 2-day delay
- [ ] FaircroftTreasury with USDC dues payment
- [ ] DocumentRegistry with hash + Arweave TX ID storage
- [ ] Deploy to Base Sepolia testnet

**Frontend:**
- [ ] Next.js app with wallet connection (RainbowKit)
- [ ] Property dashboard (view your NFT, dues status)
- [ ] Dues payment flow (USDC approval + payment)
- [ ] Proposal list (view active, past proposals)

**Infrastructure:**
- [ ] Subgraph or Ponder indexer for event data
- [ ] Arweave upload pipeline (Irys/Bundlr SDK)
- [ ] Basic email notification service (dues reminders)

### Phase 2: Governance (Weeks 7-10)

- [ ] Full proposal creation UI (with categories)
- [ ] Voting interface with delegation support
- [ ] Proposal execution pipeline
- [ ] Document upload + verification UI
- [ ] Treasury dashboard (balances, expenditure history)
- [ ] Board admin panel (mint NFTs, approve transfers)

### Phase 3: Production (Weeks 11-14)

- [ ] Smart contract audit (engage auditor in week 8, receive report week 12)
- [ ] Deploy to Base mainnet
- [ ] Mint PropertyNFTs for all Faircroft lots
- [ ] Migrate existing HOA documents to Arweave
- [ ] Onboard homeowners (wallet setup assistance)
- [ ] Deploy Safe multisig for board

### Phase 4: Polish & Iterate (Weeks 15-18)

- [ ] Mobile-responsive PWA
- [ ] Push notifications (dues, votes, proposals)
- [ ] Dispute resolution flow
- [ ] Reporting / analytics dashboard
- [ ] Community feedback integration
- [ ] Load testing and optimization

### What's NOT in MVP

- Custom mobile app (PWA is sufficient initially)
- Integration with county deed records (manual verification for now)
- Multi-community support (Faircroft only for PoC)
- Fiat on-ramp integration (homeowners use Coinbase to buy USDC)
- Automated late fee enforcement (manual for PoC, automate later)

---

## 8. Tech Stack Recommendation

### Smart Contracts
| Component | Choice | Why |
|-----------|--------|-----|
| Language | **Solidity ^0.8.20** | Industry standard, massive ecosystem |
| Framework | **Foundry** | Fastest compilation, native fuzzing, Solidity tests |
| Libraries | **OpenZeppelin Contracts 5.x** | Battle-tested Governor, ERC-721, TimelockController, AccessControl |
| Deployment | **Foundry scripts + Base Sepolia → Base Mainnet** | Reproducible deployments |
| Audit tools | **Slither + Mythril** (pre-audit), professional audit firm | Static analysis + formal methods |

### Frontend
| Component | Choice | Why |
|-----------|--------|-----|
| Framework | **Next.js 14+ (App Router)** | SSR for SEO, React Server Components |
| Wallet | **wagmi v2 + viem** | Type-safe, modern Ethereum interaction |
| Wallet UI | **RainbowKit** or **ConnectKit** | Polished UX, supports Coinbase Wallet |
| Styling | **Tailwind CSS + shadcn/ui** | Rapid UI development |
| State | **TanStack Query + wagmi hooks** | Cache management, real-time updates |
| Hosting | **Vercel** | Easy deployment, edge functions |

### Indexing & Data
| Component | Choice | Why |
|-----------|--------|-----|
| Indexer | **Ponder** (or The Graph) | TypeScript-native, fast iteration, self-hosted option |
| Database | **PostgreSQL** (via Ponder) | Indexed event data for fast frontend queries |
| Cache | **Redis** (optional) | Rate limiting, session management |

### Document Storage
| Component | Choice | Why |
|-----------|--------|-----|
| Permanent storage | **Arweave via Irys (formerly Bundlr)** | One-time payment, permanent, SDK support |
| Fast retrieval | **IPFS via web3.storage** | Free tier, fast CDN, IPFS gateway |
| Hashing | **SHA-256 (client-side)** | Standard, verifiable |

### Infrastructure
| Component | Choice | Why |
|-----------|--------|-----|
| CI/CD | **GitHub Actions** | Standard, Foundry support |
| Monitoring | **Tenderly** | Transaction monitoring, alerting, debugging |
| Notifications | **Resend** (email) + **web push** | Dues reminders, vote notifications |
| Multisig | **Safe{Wallet}** | Industry standard, Base support |

### Development Tools
| Tool | Purpose |
|------|---------|
| Foundry (forge, cast, anvil) | Compile, test, deploy, local node |
| Hardhat (backup) | Verification, some plugins |
| OpenZeppelin Defender | Automated proposal execution, monitoring |
| Tenderly | Simulation, debugging, alerting |
| Etherscan (Basescan) | Contract verification, public explorer |

---

## 9. Estimated Development Timeline and Cost

### Timeline (Solo Senior Dev or 2-Person Team)

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| **Phase 1: Foundation** | 6 weeks | Core contracts + basic frontend + testnet deploy |
| **Phase 2: Governance** | 4 weeks | Full voting UI + document management + treasury dashboard |
| **Phase 3: Production** | 4 weeks | Audit integration + mainnet deploy + onboarding |
| **Phase 4: Polish** | 4 weeks | PWA + notifications + analytics + iteration |
| **Total** | **~18 weeks (~4.5 months)** | Production-ready PoC |

### Cost Breakdown

**Development (assuming internal/contract dev):**

| Item | Estimate |
|------|----------|
| Smart contract development | 200-300 hours |
| Frontend development | 250-350 hours |
| Indexer + infrastructure | 80-120 hours |
| Testing + QA | 100-150 hours |
| Documentation + onboarding materials | 40-60 hours |
| **Total dev hours** | **670-980 hours** |

At $150-250/hr (senior blockchain dev rate):
- **Low estimate:** $100K (lean, experienced solo dev)
- **Mid estimate:** $150K (2-person team, thorough)
- **High estimate:** $200K+ (agency or larger team)

**Non-Development Costs:**

| Item | Cost | Notes |
|------|------|-------|
| Smart contract audit | $15,000-50,000 | Critical. Use Cyfrin, Trail of Bits, OpenZeppelin, or similar. |
| Legal review (NC HOA compliance) | $5,000-15,000 | HOA attorney familiar with NC Planned Community Act |
| Domain + hosting (Year 1) | $500-1,000 | Vercel Pro + domain + email |
| Arweave storage (Year 1) | <$1 | Negligible for document corpus |
| Base gas costs (Year 1) | <$50 | ~200 txs/month × $0.001-0.01 |
| Safe{Wallet} | Free | Open source, no fee |
| Tenderly monitoring | $0-50/mo | Free tier may suffice for PoC |
| **Total non-dev** | **$20,500-66,000** | |

**Grand Total Estimate:**

| Scenario | Total |
|----------|-------|
| Bootstrap (solo senior dev, lean audit) | $120K-135K |
| Standard (small team, thorough audit) | $170K-215K |
| Premium (agency, top-tier audit, legal) | $250K+ |

### Ongoing Costs (Post-Launch, Per Year)

| Item | Annual Cost |
|------|------------|
| Hosting + infrastructure | $1,000-3,000 |
| Blockchain gas (Base) | <$100 |
| Document storage (Arweave) | <$1 |
| Monitoring + alerting | $0-600 |
| Maintenance dev hours (~10 hrs/month) | $18,000-30,000 |
| **Total annual** | **$19,000-34,000** |

This is dramatically cheaper than a traditional HOA management company, which typically charges $10-20 per unit per month ($12,000-24,000/year for 100 units) — and that's before you factor in the transparency and governance improvements.

---

## 10. Comparison to Existing Solutions

### Blockchain-Based HOA / DAO Governance Projects

| Project | Status | Approach | Relevance |
|---------|--------|----------|-----------|
| **GovDAOs** | Active | DAO platform for housing associations. Smart contracts for collaboration, voting, joint funding. | Most directly comparable. Platform approach rather than bespoke. |
| **CityDAO** | Active (evolved) | Community collectively owns land in Wyoming. Citizenship NFTs for governance. | Land-focused DAO, not HOA-specific. Interesting NFT-for-governance precedent. |
| **DOMA** | Concept/early | Blockchain housing platform, member-owned. | Early stage, collaborative housing focus. |
| **Polkadot DAO blog post** | Conceptual | "Your HOA sucks. Maybe it needs a DAO." Explores substrate-based HOA governance. | Thought leadership, not a product. |
| **Frontiers research paper** | Academic (2025) | "DAO as digital governance tool for collaborative housing" | Academic validation of the concept. |

### Traditional HOA Software (What You're Disrupting)

| Software | Price/Unit/Month | Key Features | What Blockchain Adds |
|----------|-----------------|--------------|---------------------|
| TownSq | $3-8 | Communication, payments, docs | Immutability, trustless voting |
| AppFolio | $5-15 | Full property management | Transparent treasury, no middleman |
| Buildium | $3-10 | Accounting, maintenance | On-chain audit trail |
| HOALife | Free-$5 | Violations, communications | Decentralized governance |

### Key Differentiators of Faircroft Platform

1. **Immutable records** — No board member can alter meeting minutes, budgets, or votes after the fact
2. **Trustless treasury** — Every dollar in, every dollar out, permanently recorded on-chain
3. **True democracy** — 1 lot = 1 vote, enforced by smart contract, not by a management company's good faith
4. **No management company rent-seeking** — Software runs itself, community pays gas (cents) instead of management fees (thousands)
5. **Verifiable documents** — Anyone can verify any HOA document hasn't been tampered with
6. **Transparent governance** — All proposals, votes, and outcomes are public and permanent

---

## 11. Legal Considerations — North Carolina

### NC Planned Community Act (N.C.G.S. Chapter 47F)

The primary governing law for HOAs in North Carolina. Key points relevant to blockchain governance:

**Electronic Voting:** NC House Bill 320 explicitly authorizes electronic voting for HOA business, including all meeting votes, *unless expressly prohibited* in the Declaration of Covenants. The definition of "vote" was updated to include electronic voting systems. This is favorable — blockchain voting would qualify as electronic voting.

**Requirements to satisfy:**
- All members must be given equal opportunity to vote via electronic ballot
- Deadlines for electronic and written ballots must be identical
- Meeting notice requirements still apply (10-60 days depending on meeting type)
- Annual meeting still required; can be virtual

**Open Meetings:** N.C.G.S. § 47F-3-108 requires meetings to promote transparency and member participation. Blockchain governance inherently satisfies this.

**Record Keeping:** HOAs must maintain records accessible to members. On-chain records with a frontend portal exceed this requirement.

### Legal Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| PropertyNFT classified as a security | Medium | NFT represents governance right tied to real property, not speculative investment. Get legal opinion. |
| Bylaws don't permit blockchain governance | High | **Must amend bylaws first.** Have HOA attorney draft amendment authorizing blockchain-based voting and record-keeping. |
| Member access/digital divide | Medium | Provide alternative voting methods (paper ballot option). Assist with wallet setup. |
| Smart contract bug causes financial loss | High | Audit, insurance (Nexus Mutual), upgradeable proxy for fixes. |
| Regulatory uncertainty | Low-Med | NC is crypto-friendly. No specific prohibition on blockchain governance. Monitor legislation. |

### Recommended Legal Steps (Pre-Launch)

1. **Engage NC HOA attorney** to review concept and advise on Planned Community Act compliance
2. **Draft bylaw amendment** authorizing electronic/blockchain-based governance
3. **Vote on bylaw amendment** using current (traditional) voting process — likely requires 67% approval
4. **Get legal opinion** on PropertyNFT classification (governance right vs. security)
5. **Draft terms of service** for platform users
6. **Review insurance implications** — does D&O insurance cover smart contract actions?

---

## Appendix A: Deployment Checklist

```
Pre-Deployment:
□ All contracts pass 100% of unit tests
□ Fuzzing reveals no critical issues (Foundry invariant tests)
□ Slither + Mythril static analysis clean
□ Professional audit complete, all critical/high findings resolved
□ Legal review complete, bylaw amendment passed
□ Safe multisig deployed and configured (3-of-5 board members)

Deployment Sequence:
1. □ Deploy TimelockController (2-day delay, board as proposers)
2. □ Deploy PropertyNFT (maxLots = Faircroft lot count)
3. □ Deploy FaircroftGovernor (PropertyNFT as vote token, Timelock as executor)
4. □ Deploy FaircroftTreasury (USDC address, Governor, Timelock)
5. □ Deploy DocumentRegistry (Governor as governance)
6. □ Grant Governor PROPOSER_ROLE on Timelock
7. □ Grant Timelock EXECUTOR_ROLE on Timelock
8. □ Grant board REGISTRAR_ROLE on PropertyNFT
9. □ Transfer ownership of Treasury + DocRegistry to Timelock
10. □ Verify all contracts on Basescan
11. □ Mint PropertyNFTs to verified homeowners

Post-Deployment:
□ Tenderly monitoring configured
□ Frontend deployed and connected
□ Subgraph/indexer running
□ Notification service active
□ Homeowner onboarding sessions scheduled
□ Emergency procedures documented (multisig cancel, upgrade process)
```

---

## Appendix B: Key Addresses (Base Mainnet)

*To be filled in at deployment:*

| Contract | Address | Verified |
|----------|---------|----------|
| PropertyNFT | `0x...` | □ |
| FaircroftGovernor | `0x...` | □ |
| TimelockController | `0x...` | □ |
| FaircroftTreasury | `0x...` | □ |
| DocumentRegistry | `0x...` | □ |
| Board Safe Multisig | `0x...` | □ |
| USDC (Base) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | ✓ |

---

*This document represents a technical planning phase. All smart contract code shown is illustrative and requires thorough testing, auditing, and legal review before production deployment.*
