# FaircroftDAO — Engineering Specification

**Version:** 1.0
**Date:** March 24, 2026
**Author:** Ryan @ Suvren
**Status:** Pre-Development

---

## Build Order & Dependencies

```
PropertyNFT (no dependencies)
    └──> DocumentRegistry (governance address from Governor)
    └──> FaircroftGovernor (depends on PropertyNFT for vote weight)
              └──> TimelockController (executor for Governor)
                        └──> FaircroftTreasury (depends on Governor + Timelock + USDC)
```

**Phase 1:** PropertyNFT + DocumentRegistry + unit tests
**Phase 2:** TimelockController + FaircroftGovernor + integration tests
**Phase 3:** FaircroftTreasury + full system integration tests
**Phase 4:** Frontend + Ponder indexer + Arweave pipeline
**Phase 5:** Audit prep + testnet deployment + mainnet

---

## Global Architecture Decisions

### Chain: Base Mainnet (Chain ID: 8453)

| Parameter | Value |
|-----------|-------|
| Chain ID | 8453 |
| Block time | 2 seconds |
| RPC | `https://mainnet.base.org` (public) or Alchemy/Infura |
| Explorer | https://basescan.org |
| USDC address | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals) |
| Testnet | Base Sepolia (Chain ID: 84532) |

### Clock Mode: Timestamps (not block numbers)

**Critical decision.** On L2s, `block.number` behavior is unreliable — it may reference L1 block numbers or have inconsistent timing. All contracts use **timestamp-based** clock mode per EIP-6372.

Both PropertyNFT and FaircroftGovernor override:
```solidity
function clock() public view override returns (uint48) {
    return uint48(block.timestamp);
}

function CLOCK_MODE() public pure override returns (string memory) {
    return "mode=timestamp";
}
```

This means voting delays and periods are specified in **seconds**, not blocks.

### Solidity Version: `^0.8.24`

Using 0.8.24+ for transient storage opcodes and latest optimizations. OpenZeppelin Contracts v5.x requires `^0.8.20` minimum.

### OpenZeppelin Contracts: v5.x

All contracts inherit from OZ v5. Key changes from v4:
- `_countVote` returns `uint256` (total votes cast)
- `GovernorCountingOverridable` available (not needed for MVP)
- `GovernorProposalGuardian` available (useful for board cancel power)
- Storage optimized (2 slots per proposal vs 3)

---

## Contract 1: PropertyNFT

### Purpose

ERC-721 token representing property ownership in Faircroft. Each lot gets exactly one NFT. The NFT carries voting power (1 NFT = 1 vote) and is transfer-restricted (soulbound except during verified property sales).

### Inheritance Chain

```
ERC721 (OZ)
  └── ERC721Enumerable (OZ) — for totalSupply() and tokenByIndex()
        └── ERC721Votes (OZ) — voting power + delegation + checkpointing
              └── AccessControl (OZ) — role-based permissions
                    └── PropertyNFT
```

### Roles

| Role | Bytes32 | Who | Can Do |
|------|---------|-----|--------|
| `DEFAULT_ADMIN_ROLE` | `0x00` | Deployer → transferred to Timelock | Grant/revoke roles |
| `REGISTRAR_ROLE` | `keccak256("REGISTRAR_ROLE")` | Board multisig | Mint NFTs, approve transfers |
| `GOVERNOR_ROLE` | `keccak256("GOVERNOR_ROLE")` | Governor contract | Update config via governance |

### State Variables

```solidity
// ── Immutables ──
uint256 public immutable maxLots;           // Set at deploy, cannot change

// ── Configuration (governor-changeable) ──
bool public transfersRequireApproval;        // Default: true
bool public autoDelegateOnMint;              // Default: true

// ── Property Data ──
struct PropertyInfo {
    uint64 lotNumber;                        // 1-indexed lot number
    uint64 squareFootage;                    // Optional metadata
    uint128 lastDuesTimestamp;               // Last dues payment timestamp (set by Treasury)
    string streetAddress;                    // "123 Faircroft Dr"
}

mapping(uint256 tokenId => PropertyInfo) public properties;

// ── Transfer Control ──
mapping(uint256 tokenId => address approvedBuyer) public pendingTransfers;

// ── Counters ──
uint256 private _totalMinted;                // Total mints (never decremented)
```

### Token ID Strategy

`tokenId == lotNumber`. Lot numbers are 1-indexed and sequential. Token ID 0 is never used. This gives a direct, intuitive mapping: Lot 42 = Token 42.

### Events

```solidity
event PropertyMinted(
    uint256 indexed tokenId,
    address indexed owner,
    uint64 lotNumber,
    string streetAddress
);

event TransferApproved(
    uint256 indexed tokenId,
    address indexed currentOwner,
    address indexed approvedBuyer
);

event TransferApprovalRevoked(uint256 indexed tokenId);

event DuesStatusUpdated(
    uint256 indexed tokenId,
    uint128 lastDuesTimestamp
);

event ConfigUpdated(string parameter, bool value);
```

### Custom Errors

```solidity
error MaxLotsReached(uint256 maxLots);
error LotAlreadyMinted(uint256 lotNumber);
error TransferNotApproved(uint256 tokenId);
error InvalidLotNumber(uint256 lotNumber);
error ZeroAddress();
error TokenDoesNotExist(uint256 tokenId);
```

### Constructor

```solidity
constructor(
    uint256 _maxLots,
    string memory _name,      // "Faircroft Property"
    string memory _symbol     // "FAIR"
) ERC721(_name, _symbol) EIP712(_name, "1") {
    if (_maxLots == 0) revert InvalidLotNumber(0);
    maxLots = _maxLots;
    transfersRequireApproval = true;
    autoDelegateOnMint = true;
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(REGISTRAR_ROLE, msg.sender);
}
```

### Core Functions

#### `mintProperty`

```solidity
/// @notice Mint a property NFT for a verified homeowner
/// @dev Only callable by REGISTRAR_ROLE. Auto-delegates to owner if enabled.
/// @param to The property owner's wallet address
/// @param lotNumber The lot number (1-indexed, must be <= maxLots)
/// @param streetAddress Human-readable street address
/// @param sqft Square footage of the property
/// @return tokenId The minted token ID (== lotNumber)
function mintProperty(
    address to,
    uint64 lotNumber,
    string calldata streetAddress,
    uint64 sqft
) external onlyRole(REGISTRAR_ROLE) returns (uint256) {
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

    // Auto-delegate to self so voting power is immediately active
    // Without this, the owner has 0 voting power until they manually delegate
    if (autoDelegateOnMint) {
        _delegate(to, to);
    }

    emit PropertyMinted(tokenId, to, lotNumber, streetAddress);
    return tokenId;
}
```

**Why auto-delegate matters:** OZ ERC721Votes requires explicit delegation before voting power activates. If we don't auto-delegate, every homeowner would need to call `delegate(self)` before they can vote — terrible UX for non-crypto users. The `_delegate` call in mint costs ~25K extra gas (~$0.0005 on Base) but eliminates a critical UX friction point.

#### `approveTransfer`

```solidity
/// @notice Board approves a property sale transfer
/// @dev Called when a property sale closes. The new owner must then call safeTransferFrom.
/// @param tokenId The lot being transferred
/// @param newOwner The verified buyer's wallet address
function approveTransfer(
    uint256 tokenId,
    address newOwner
) external onlyRole(REGISTRAR_ROLE) {
    if (newOwner == address(0)) revert ZeroAddress();
    if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);

    pendingTransfers[tokenId] = newOwner;
    emit TransferApproved(tokenId, ownerOf(tokenId), newOwner);
}
```

#### `revokeTransferApproval`

```solidity
/// @notice Revoke a pending transfer approval
function revokeTransferApproval(uint256 tokenId) external onlyRole(REGISTRAR_ROLE) {
    delete pendingTransfers[tokenId];
    emit TransferApprovalRevoked(tokenId);
}
```

#### `_update` (Transfer Hook Override)

```solidity
/// @notice Override to enforce transfer restrictions
/// @dev Allows minting (from == 0) freely. Blocks all other transfers unless approved.
function _update(
    address to,
    uint256 tokenId,
    address auth
) internal virtual override(ERC721, ERC721Enumerable, ERC721Votes) returns (address) {
    address from = _ownerOf(tokenId);

    // Minting: no restriction
    if (from != address(0) && transfersRequireApproval) {
        // Burning: not supported (revert)
        if (to == address(0)) revert TransferNotApproved(tokenId);

        // Transfer: must be approved and to the correct buyer
        address approvedBuyer = pendingTransfers[tokenId];
        if (approvedBuyer == address(0) || approvedBuyer != to) {
            revert TransferNotApproved(tokenId);
        }

        // Clear the approval after use
        delete pendingTransfers[tokenId];

        // Auto-delegate new owner
        if (autoDelegateOnMint) {
            _delegate(to, to);
        }
    }

    return super._update(to, tokenId, auth);
}
```

#### `updateDuesStatus` (Called by Treasury)

```solidity
/// @notice Update the dues payment timestamp for a property
/// @dev Only callable by the Treasury contract (granted GOVERNOR_ROLE or custom TREASURY_ROLE)
function updateDuesStatus(
    uint256 tokenId,
    uint128 timestamp
) external onlyRole(GOVERNOR_ROLE) {
    if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
    properties[tokenId].lastDuesTimestamp = timestamp;
    emit DuesStatusUpdated(tokenId, timestamp);
}
```

#### Clock Mode Override (EIP-6372)

```solidity
function clock() public view override(ERC721Votes) returns (uint48) {
    return uint48(block.timestamp);
}

function CLOCK_MODE() public pure override(ERC721Votes) returns (string memory) {
    return "mode=timestamp";
}
```

### View Functions

```solidity
/// @notice Get full property info for a token
function getProperty(uint256 tokenId) external view returns (PropertyInfo memory) {
    if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
    return properties[tokenId];
}

/// @notice Check if a property transfer is pending
function isTransferPending(uint256 tokenId) external view returns (bool, address) {
    address buyer = pendingTransfers[tokenId];
    return (buyer != address(0), buyer);
}

/// @notice Total properties currently minted (active)
function totalMinted() external view returns (uint256) {
    return _totalMinted;
}

/// @notice Check if a specific lot has been minted
function lotExists(uint64 lotNumber) external view returns (bool) {
    return _ownerOf(lotNumber) != address(0);
}
```

### Required Overrides (Solidity diamond)

```solidity
function _increaseBalance(address account, uint128 amount)
    internal override(ERC721, ERC721Enumerable, ERC721Votes)
{
    super._increaseBalance(account, amount);
}

function supportsInterface(bytes4 interfaceId)
    public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool)
{
    return super.supportsInterface(interfaceId);
}
```

### Gas Estimates (Base L2)

| Operation | Estimated Gas | Cost on Base |
|-----------|--------------|-------------|
| `mintProperty` (with auto-delegate) | ~180K | ~$0.004 |
| `approveTransfer` | ~50K | ~$0.001 |
| `safeTransferFrom` (approved) | ~120K | ~$0.003 |
| `delegate` (manual) | ~80K | ~$0.002 |
| `getVotes` (view) | ~5K | Free |

### Test Scenarios

```
PropertyNFT Tests
├── Minting
│   ├── ✅ Registrar can mint to valid address with valid lot number
│   ├── ✅ Minted NFT has correct property info
│   ├── ✅ Auto-delegation gives immediate voting power
│   ├── ✅ Voting power == 1 after mint
│   ├── ❌ Non-registrar cannot mint
│   ├── ❌ Cannot mint lot 0
│   ├── ❌ Cannot mint lot > maxLots
│   ├── ❌ Cannot mint same lot twice
│   ├── ❌ Cannot mint to address(0)
│   └── ❌ Cannot mint after maxLots reached
│
├── Transfers
│   ├── ✅ Registrar can approve transfer to specific buyer
│   ├── ✅ Approved buyer can receive transfer
│   ├── ✅ Transfer clears pending approval
│   ├── ✅ New owner gets auto-delegated voting power
│   ├── ✅ Old owner loses voting power
│   ├── ❌ Cannot transfer without approval
│   ├── ❌ Cannot transfer to wrong buyer (approval mismatch)
│   ├── ❌ Cannot burn tokens
│   └── ❌ Approval can be revoked
│
├── Voting Power
│   ├── ✅ Total supply == number of minted tokens
│   ├── ✅ Each token == 1 vote
│   ├── ✅ Delegation works (A delegates to B, B gets 2 votes)
│   ├── ✅ Past votes checkpointing works (getVotes at timestamp)
│   ├── ✅ clock() returns block.timestamp
│   └── ✅ CLOCK_MODE returns "mode=timestamp"
│
├── Access Control
│   ├── ✅ Admin can grant REGISTRAR_ROLE
│   ├── ✅ Admin can revoke REGISTRAR_ROLE
│   ├── ❌ Non-admin cannot grant roles
│   └── ✅ Admin role can be transferred to Timelock
│
└── Edge Cases
    ├── ✅ Batch mint 150 properties (gas benchmark)
    ├── ✅ Property info survives transfer
    ├── ✅ Multiple pending transfers for different lots
    └── ✅ Voting power snapshot at specific timestamps
```

### Foundry Test Structure

```
test/
├── PropertyNFT.t.sol
│   ├── PropertyNFTMintTest
│   ├── PropertyNFTTransferTest
│   ├── PropertyNFTVotingTest
│   ├── PropertyNFTAccessControlTest
│   └── PropertyNFTFuzzTest
```

### Invariant Tests (Foundry Fuzzing)

```solidity
// Invariant: totalSupply == number of distinct owners with balance > 0
// Invariant: sum of all getVotes() == totalSupply (assuming self-delegation)
// Invariant: no token can exist with ID 0 or > maxLots
// Invariant: every token has a non-empty streetAddress
// Invariant: transfersRequireApproval == true => no transfer succeeds without pending approval
```

---

## Contract 2: DocumentRegistry

### Purpose

Append-only registry of HOA documents. Stores SHA-256 content hashes on-chain with references to Arweave transaction IDs and IPFS CIDs. Provides tamper-proof verification — anyone can download a document from Arweave, hash it, and compare to the on-chain record.

### Inheritance Chain

```
AccessControl (OZ)
  └── DocumentRegistry
```

### Design: Minimal and Immutable

This is intentionally the simplest contract. Documents are append-only — once registered, they cannot be modified or deleted. This is the whole point.

### State Variables

```solidity
enum DocType {
    CCR,            // 0 — Covenants, Conditions & Restrictions
    Minutes,        // 1 — Meeting minutes
    Budget,         // 2 — Annual/quarterly budget
    Amendment,      // 3 — CC&R or bylaw amendment
    Resolution,     // 4 — Board resolution
    Financial,      // 5 — Financial report/audit
    Architectural,  // 6 — Architectural guidelines
    Notice,         // 7 — Community notices
    Election,       // 8 — Election results
    Other           // 9 — Catch-all
}

struct Document {
    bytes32 contentHash;         // SHA-256 hash of document bytes
    uint48 timestamp;            // When registered on-chain
    uint48 supersedes;           // docId this replaces (0 = none / original)
    DocType docType;
    address uploadedBy;
    string arweaveTxId;          // Arweave transaction ID (43 chars)
    string ipfsCid;              // IPFS CID v1 for fast retrieval
    string title;                // Human-readable title
}

Document[] public documents;                           // docId == array index
mapping(bytes32 contentHash => uint256 docId) public hashToDocId;  // 0 = not found (docId 0 is valid, handle with +1 offset)

// Better approach: use a separate exists mapping
mapping(bytes32 contentHash => bool) public hashExists;
```

### Events

```solidity
event DocumentRegistered(
    uint256 indexed docId,
    bytes32 indexed contentHash,
    DocType indexed docType,
    string title,
    string arweaveTxId,
    address uploadedBy
);

event DocumentSuperseded(
    uint256 indexed newDocId,
    uint256 indexed oldDocId
);
```

### Custom Errors

```solidity
error DocumentAlreadyRegistered(bytes32 contentHash);
error EmptyContentHash();
error EmptyArweaveId();
error EmptyTitle();
error InvalidDocId(uint256 docId);
error InvalidSupersedes(uint256 docId);
```

### Roles

| Role | Who | Can Do |
|------|-----|--------|
| `DEFAULT_ADMIN_ROLE` | Timelock | Manage roles |
| `RECORDER_ROLE` | Governor (via Timelock), Board multisig | Register documents |

Board multisig gets RECORDER_ROLE directly for operational efficiency — registering meeting minutes shouldn't require a governance vote. CC&R amendments and other governed documents get registered through the Governor execution path (which also has RECORDER_ROLE via the Timelock).

### Core Functions

#### `registerDocument`

```solidity
/// @notice Register a new document hash with storage references
/// @param contentHash SHA-256 hash of the raw document bytes
/// @param arweaveTxId Arweave transaction ID (permanent storage)
/// @param ipfsCid IPFS Content ID for fast retrieval
/// @param docType Category of document
/// @param title Human-readable document title
/// @param supersedes DocId this document replaces (0 if original/none)
/// @return docId The assigned document ID
function registerDocument(
    bytes32 contentHash,
    string calldata arweaveTxId,
    string calldata ipfsCid,
    DocType docType,
    string calldata title,
    uint256 supersedes
) external onlyRole(RECORDER_ROLE) returns (uint256) {
    if (contentHash == bytes32(0)) revert EmptyContentHash();
    if (bytes(arweaveTxId).length == 0) revert EmptyArweaveId();
    if (bytes(title).length == 0) revert EmptyTitle();
    if (hashExists[contentHash]) revert DocumentAlreadyRegistered(contentHash);
    if (supersedes > 0 && supersedes >= documents.length) revert InvalidSupersedes(supersedes);

    uint256 docId = documents.length;
    documents.push(Document({
        contentHash: contentHash,
        timestamp: uint48(block.timestamp),
        supersedes: uint48(supersedes),
        docType: docType,
        uploadedBy: msg.sender,
        arweaveTxId: arweaveTxId,
        ipfsCid: ipfsCid,
        title: title
    }));

    hashExists[contentHash] = true;
    hashToDocId[contentHash] = docId;

    emit DocumentRegistered(docId, contentHash, docType, title, arweaveTxId, msg.sender);

    if (supersedes > 0) {
        emit DocumentSuperseded(docId, supersedes);
    }

    return docId;
}
```

#### `verifyDocument`

```solidity
/// @notice Verify a document by its content hash
/// @param contentHash SHA-256 hash to look up
/// @return exists Whether the hash is registered
/// @return docId The document ID (only valid if exists == true)
/// @return doc The full document record
function verifyDocument(bytes32 contentHash) external view returns (
    bool exists,
    uint256 docId,
    Document memory doc
) {
    if (!hashExists[contentHash]) return (false, 0, doc);
    docId = hashToDocId[contentHash];
    return (true, docId, documents[docId]);
}
```

### View Functions

```solidity
function getDocument(uint256 docId) external view returns (Document memory) {
    if (docId >= documents.length) revert InvalidDocId(docId);
    return documents[docId];
}

function getDocumentCount() external view returns (uint256) {
    return documents.length;
}

/// @notice Get all document IDs of a specific type
/// @dev O(n) scan — fine for small document sets (<1000). For large sets, use the indexer.
function getDocumentsByType(DocType docType) external view returns (uint256[] memory) {
    uint256 count = 0;
    for (uint256 i = 0; i < documents.length; i++) {
        if (documents[i].docType == docType) count++;
    }
    uint256[] memory result = new uint256[](count);
    uint256 idx = 0;
    for (uint256 i = 0; i < documents.length; i++) {
        if (documents[i].docType == docType) {
            result[idx++] = i;
        }
    }
    return result;
}

/// @notice Get the latest version of a document chain
/// @dev Follows supersedes chain to find the original, then finds latest
function getLatestVersion(uint256 docId) external view returns (uint256) {
    if (docId >= documents.length) revert InvalidDocId(docId);
    // Linear scan for latest doc that supersedes this one
    // Fine for small sets. Indexer handles this for frontend.
    uint256 latest = docId;
    for (uint256 i = docId + 1; i < documents.length; i++) {
        if (documents[i].supersedes == uint48(latest)) {
            latest = i;
        }
    }
    return latest;
}
```

### Gas Estimates

| Operation | Estimated Gas | Cost on Base |
|-----------|--------------|-------------|
| `registerDocument` | ~120K (depends on string lengths) | ~$0.003 |
| `verifyDocument` (view) | ~8K | Free |
| `getDocument` (view) | ~5K | Free |

### Test Scenarios

```
DocumentRegistry Tests
├── Registration
│   ├── ✅ Recorder can register a document with all fields
│   ├── ✅ Returns correct docId (sequential from 0)
│   ├── ✅ Emits DocumentRegistered event with all fields
│   ├── ✅ hashExists returns true after registration
│   ├── ❌ Cannot register duplicate content hash
│   ├── ❌ Cannot register with empty content hash
│   ├── ❌ Cannot register with empty arweave ID
│   ├── ❌ Cannot register with empty title
│   ├── ❌ Non-recorder cannot register
│   └── ❌ Cannot supersede non-existent document
│
├── Verification
│   ├── ✅ verifyDocument returns true + correct data for registered hash
│   ├── ✅ verifyDocument returns false for unregistered hash
│   └── ✅ getDocument returns correct data by ID
│
├── Version Chain
│   ├── ✅ Document with supersedes links to previous version
│   ├── ✅ getLatestVersion follows chain correctly
│   ├── ✅ Emits DocumentSuperseded event
│   └── ✅ Multiple versions chain correctly (v1 → v2 → v3)
│
└── Access Control
    ├── ✅ Board multisig has RECORDER_ROLE
    ├── ✅ Timelock has RECORDER_ROLE
    └── ❌ Random address cannot register
```

---

## Contract 3: FaircroftGovernor

### Purpose

On-chain governance engine. Homeowners create proposals, vote on them, and approved proposals execute automatically through the Timelock. Supports four proposal categories with different quorum and threshold requirements.

### Inheritance Chain

```
Governor (OZ)
  └── GovernorSettings (OZ) — voting delay, period, proposal threshold
        └── GovernorCountingSimple (OZ) — for/against/abstain counting
              └── GovernorVotes (OZ) — reads vote weight from PropertyNFT
                    └── GovernorTimelockControl (OZ) — queues execution through Timelock
                          └── GovernorProposalGuardian (OZ v5.3+) — board can cancel
                                └── FaircroftGovernor
```

**Not using `GovernorVotesQuorumFraction`** — we need per-category quorum, so we override `quorum()` manually.

### Proposal Categories

```solidity
enum ProposalCategory {
    Routine,         // 0 — 15% quorum, simple majority, 2-day timelock
    Financial,       // 1 — 33% quorum, simple majority, 4-day timelock
    Governance,      // 2 — 51% quorum, simple majority, 4-day timelock
    Constitutional   // 3 — 67% quorum, 2/3 supermajority, 7-day timelock
}
```

| Category | Quorum | Pass Threshold | Timelock Delay | Example |
|----------|--------|---------------|---------------|---------|
| Routine | 15% | >50% For | 2 days | Landscaping vendor |
| Financial | 33% | >50% For | 4 days | Budget approval, special assessment |
| Governance | 51% | >50% For | 4 days | Board election, bylaw change |
| Constitutional | 67% | >66.7% For | 7 days | CC&R amendment, dissolution |

### State Variables

```solidity
// ── Category Tracking ──
mapping(uint256 proposalId => ProposalCategory) public proposalCategories;

// ── Quorum Config (in basis points, 10000 = 100%) ──
mapping(ProposalCategory => uint256) public categoryQuorumBps;

// ── Supermajority Config ──
mapping(ProposalCategory => uint256) public categoryThresholdBps; // 5000 = simple majority

// ── Timelock Delays per Category ──
mapping(ProposalCategory => uint256) public categoryTimelockDelay;

// ── Rate Limiting ──
uint256 public maxActiveProposals;           // Default: 10
uint256 public activeProposalCount;

// ── Proposal metadata ──
mapping(uint256 proposalId => string) public proposalMetadataUri; // IPFS CID with full proposal text
```

### Constructor

```solidity
constructor(
    IVotes _propertyNFT,
    TimelockController _timelock,
    address _proposalGuardian          // Board multisig — can cancel proposals
) Governor("FaircroftGovernor")
  GovernorSettings(
      1 days,       // votingDelay: 1 day review period before voting opens
      7 days,       // votingPeriod: 7 days to vote (in seconds, timestamp mode)
      1             // proposalThreshold: must own 1 NFT to propose
  )
  GovernorVotes(_propertyNFT)
  GovernorTimelockControl(_timelock)
  GovernorProposalGuardian(_proposalGuardian)
{
    // Set default quorum percentages
    categoryQuorumBps[ProposalCategory.Routine] = 1500;        // 15%
    categoryQuorumBps[ProposalCategory.Financial] = 3300;      // 33%
    categoryQuorumBps[ProposalCategory.Governance] = 5100;     // 51%
    categoryQuorumBps[ProposalCategory.Constitutional] = 6700; // 67%

    // Set pass thresholds
    categoryThresholdBps[ProposalCategory.Routine] = 5000;       // >50%
    categoryThresholdBps[ProposalCategory.Financial] = 5000;     // >50%
    categoryThresholdBps[ProposalCategory.Governance] = 5000;    // >50%
    categoryThresholdBps[ProposalCategory.Constitutional] = 6667; // >66.67%

    // Set timelock delays (in seconds)
    categoryTimelockDelay[ProposalCategory.Routine] = 2 days;
    categoryTimelockDelay[ProposalCategory.Financial] = 4 days;
    categoryTimelockDelay[ProposalCategory.Governance] = 4 days;
    categoryTimelockDelay[ProposalCategory.Constitutional] = 7 days;

    maxActiveProposals = 10;
}
```

### Core Functions

#### `proposeWithCategory`

```solidity
/// @notice Create a proposal with a specific governance category
/// @param targets Contract addresses to call on execution
/// @param values ETH values to send (usually 0 for USDC operations)
/// @param calldatas Encoded function calls
/// @param description Human-readable description (hashed for proposalId)
/// @param category Governance category determining quorum/threshold/delay
/// @param metadataUri IPFS CID containing full proposal text + supporting docs
/// @return proposalId The unique proposal identifier
function proposeWithCategory(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    ProposalCategory category,
    string memory metadataUri
) public returns (uint256) {
    if (activeProposalCount >= maxActiveProposals) {
        revert TooManyActiveProposals(maxActiveProposals);
    }

    uint256 proposalId = propose(targets, values, calldatas, description);
    proposalCategories[proposalId] = category;
    proposalMetadataUri[proposalId] = metadataUri;
    activeProposalCount++;

    emit ProposalCategorized(proposalId, category, metadataUri);
    return proposalId;
}
```

#### Custom Quorum Override

```solidity
/// @notice Dynamic quorum based on proposal category
/// @dev Returns the minimum number of votes needed for the proposal to be valid
function quorum(uint256 timepoint) public view override returns (uint256) {
    // Default quorum for proposals created via standard propose() (not categorized)
    // Uses Routine category as default
    uint256 totalWeight = token().getPastTotalSupply(timepoint);
    return (totalWeight * 1500) / 10000; // 15% default
}

/// @notice Get required quorum for a specific proposal
function proposalQuorum(uint256 proposalId) public view returns (uint256) {
    ProposalCategory category = proposalCategories[proposalId];
    uint256 snapshot = proposalSnapshot(proposalId);
    uint256 totalWeight = token().getPastTotalSupply(snapshot);
    return (totalWeight * categoryQuorumBps[category]) / 10000;
}
```

#### Custom Vote Counting (Supermajority for Constitutional)

```solidity
/// @notice Check if a proposal has succeeded
/// @dev Overrides to support supermajority for Constitutional proposals
function _voteSucceeded(uint256 proposalId)
    internal view override returns (bool)
{
    (uint256 againstVotes, uint256 forVotes, ) = proposalVotes(proposalId);
    ProposalCategory category = proposalCategories[proposalId];
    uint256 thresholdBps = categoryThresholdBps[category];

    uint256 totalCast = forVotes + againstVotes;
    if (totalCast == 0) return false;

    // For > threshold% of (for + against) votes
    return (forVotes * 10000) > (thresholdBps * totalCast);
}

/// @notice Check if quorum has been reached for a specific proposal
function _quorumReached(uint256 proposalId)
    internal view override returns (bool)
{
    (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = proposalVotes(proposalId);
    uint256 totalVotes = forVotes + againstVotes + abstainVotes;
    return totalVotes >= proposalQuorum(proposalId);
}
```

### Events

```solidity
event ProposalCategorized(
    uint256 indexed proposalId,
    ProposalCategory category,
    string metadataUri
);

event QuorumUpdated(ProposalCategory category, uint256 oldBps, uint256 newBps);
event ThresholdUpdated(ProposalCategory category, uint256 oldBps, uint256 newBps);

error TooManyActiveProposals(uint256 max);
error InvalidQuorum(uint256 bps);
```

### Governance-Updatable Parameters

These can only be changed through the governance process itself (proposal → vote → execute via Timelock):

```solidity
function updateCategoryQuorum(ProposalCategory category, uint256 newBps) external onlyGovernance {
    if (newBps > 10000) revert InvalidQuorum(newBps);
    emit QuorumUpdated(category, categoryQuorumBps[category], newBps);
    categoryQuorumBps[category] = newBps;
}

function updateCategoryThreshold(ProposalCategory category, uint256 newBps) external onlyGovernance {
    if (newBps > 10000) revert InvalidQuorum(newBps);
    emit ThresholdUpdated(category, categoryThresholdBps[category], newBps);
    categoryThresholdBps[category] = newBps;
}

function updateMaxActiveProposals(uint256 newMax) external onlyGovernance {
    maxActiveProposals = newMax;
}
```

### Clock Mode Override

```solidity
function clock() public view override(Governor, GovernorVotes) returns (uint48) {
    return uint48(block.timestamp);
}

function CLOCK_MODE() public pure override(Governor, GovernorVotes) returns (string memory) {
    return "mode=timestamp";
}
```

### State Lifecycle

```
Proposal Created
    │ (1 day voting delay)
    ▼
Active (voting open)
    │ (7 day voting period)
    ▼
Succeeded ──or── Defeated
    │                  │
    ▼                  └── (end)
Queued (in Timelock)
    │ (2-7 day delay per category)
    ▼
Executed ──or── Expired (if not executed within grace period)

At any point before Executed:
    ProposalGuardian (board multisig) can → Canceled
```

### Test Scenarios

```
FaircroftGovernor Tests
├── Proposal Creation
│   ├── ✅ Property owner (1 NFT) can propose
│   ├── ✅ Proposal stores correct category
│   ├── ✅ Proposal stores metadata URI
│   ├── ❌ Non-property-owner cannot propose
│   ├── ❌ Cannot exceed maxActiveProposals
│   └── ✅ proposalId is deterministic from inputs
│
├── Voting
│   ├── ✅ Property owner can vote For/Against/Abstain
│   ├── ✅ Vote weight == 1 per NFT
│   ├── ✅ Delegated votes count for delegate
│   ├── ✅ Cannot vote twice on same proposal
│   ├── ❌ Cannot vote before votingDelay passes
│   ├── ❌ Cannot vote after votingPeriod ends
│   └── ❌ Non-NFT-holder cannot vote
│
├── Quorum & Threshold
│   ├── ✅ Routine: passes with 15% quorum + simple majority
│   ├── ✅ Financial: requires 33% quorum
│   ├── ✅ Governance: requires 51% quorum
│   ├── ✅ Constitutional: requires 67% quorum + 2/3 supermajority
│   ├── ❌ Routine fails if quorum not met
│   └── ❌ Constitutional fails with simple majority (needs 66.7%)
│
├── Execution
│   ├── ✅ Succeeded proposal can be queued
│   ├── ✅ Queued proposal executes after timelock delay
│   ├── ✅ Routine timelock == 2 days
│   ├── ✅ Constitutional timelock == 7 days
│   └── ❌ Defeated proposal cannot be queued
│
├── Guardian (Cancel Power)
│   ├── ✅ Board multisig can cancel any active proposal
│   ├── ✅ Board multisig can cancel queued proposal
│   └── ❌ Non-guardian cannot cancel
│
└── Integration
    ├── ✅ Full lifecycle: propose → vote → queue → execute
    ├── ✅ Proposal that calls Treasury.makeExpenditure succeeds
    ├── ✅ Proposal that calls DocumentRegistry.registerDocument succeeds
    └── ✅ Proposal that updates Governor settings succeeds
```

---

## Contract 4: FaircroftTreasury

### Purpose

Holds all community funds in USDC. Collects dues, auto-splits between operating and reserve funds, and disburses payments to vendors. Every transaction is permanently recorded on-chain for full transparency.

### Inheritance Chain

```
AccessControl (OZ)
  └── ReentrancyGuard (OZ)
        └── FaircroftTreasury
```

### Design Decision: Not Using TimelockController as Treasury

The Treasury is a separate contract from the Timelock. The Timelock controls *access* to Treasury functions, but the Treasury manages its own accounting, balances, and dues logic.

### State Variables

```solidity
// ── Immutables ──
IERC20 public immutable usdc;
address public immutable governor;
address public immutable timelock;

// ── Dues Configuration ──
uint256 public quarterlyDuesAmount;          // In USDC (6 decimals). e.g., 200e6 = $200
uint256 public annualDuesDiscount;           // Basis points discount for annual. e.g., 500 = 5%
uint256 public lateFeePercent;               // Basis points. e.g., 1000 = 10%
uint256 public gracePeriod;                  // Seconds after due date before late fee. e.g., 30 days

// ── Fund Allocation ──
uint256 public operatingReserveSplitBps;     // Operating portion in bps. e.g., 8000 = 80%
uint256 public operatingBalance;
uint256 public reserveBalance;

// ── Dues Records ──
struct DuesRecord {
    uint128 paidThrough;                     // Timestamp: dues current through this date
    uint128 totalPaid;                       // Lifetime total in USDC (6 decimals)
}
mapping(uint256 tokenId => DuesRecord) public duesRecords;

// ── Expenditure Log ──
struct Expenditure {
    address vendor;
    uint128 amount;                          // USDC amount
    uint48 timestamp;
    uint48 proposalId;                       // 0 = board-approved (under emergency limit)
    string description;
    string category;                         // "maintenance", "legal", "insurance", etc.
}
Expenditure[] public expenditures;

// ── Emergency Spending ──
uint256 public emergencySpendingLimit;       // Max per-tx for board multisig without vote
uint256 public emergencySpentThisPeriod;
uint256 public emergencyPeriodStart;
uint256 public emergencyPeriodDuration;      // e.g., 30 days

// ── Quarter Tracking ──
uint256 public currentQuarterStart;          // Timestamp of current quarter start
```

### Roles

| Role | Who | Can Do |
|------|-----|--------|
| `DEFAULT_ADMIN_ROLE` | Timelock | Manage roles, update config |
| `TREASURER_ROLE` | Board multisig | Emergency spending, mark dues received |
| `GOVERNOR_ROLE` | Timelock (via Governor) | All treasury operations, config changes |

### Core Functions

#### `payDues`

```solidity
/// @notice Pay dues for a property. Anyone can pay for any lot (gift, trust, etc.)
/// @param tokenId The property lot number
/// @param quarters Number of quarters to pay (1-4)
function payDues(
    uint256 tokenId,
    uint256 quarters
) external nonReentrant {
    if (quarters == 0 || quarters > 4) revert InvalidPaymentPeriod();
    // Verify token exists (will revert if not)
    // We check via the PropertyNFT — but we don't need to, we just need a valid tokenId

    uint256 amount;
    if (quarters == 4) {
        // Annual payment with discount
        uint256 annual = quarterlyDuesAmount * 4;
        amount = annual - (annual * annualDuesDiscount / 10000);
    } else {
        amount = quarterlyDuesAmount * quarters;
    }

    // Check for late fee
    DuesRecord storage record = duesRecords[tokenId];
    if (record.paidThrough > 0 &&
        block.timestamp > record.paidThrough + gracePeriod)
    {
        uint256 lateFee = amount * lateFeePercent / 10000;
        amount += lateFee;
        emit LateFeecharged(tokenId, lateFee);
    }

    // Transfer USDC from payer
    usdc.safeTransferFrom(msg.sender, address(this), amount);

    // Update dues record
    uint256 startDate = record.paidThrough > block.timestamp
        ? record.paidThrough
        : block.timestamp;
    record.paidThrough = uint128(startDate + (quarters * 91 days)); // ~91 days per quarter
    record.totalPaid += uint128(amount);

    // Split funds
    uint256 toOperating = amount * operatingReserveSplitBps / 10000;
    uint256 toReserve = amount - toOperating;
    operatingBalance += toOperating;
    reserveBalance += toReserve;

    emit DuesPaid(tokenId, msg.sender, amount, quarters, record.paidThrough);
}
```

#### `makeExpenditure`

```solidity
/// @notice Spend from operating fund (governance-approved)
/// @param vendor Recipient address
/// @param amount USDC amount to send
/// @param description What the payment is for
/// @param category Spending category
/// @param proposalId The governance proposal that approved this (0 for emergency)
function makeExpenditure(
    address vendor,
    uint128 amount,
    string calldata description,
    string calldata category,
    uint48 proposalId
) external nonReentrant onlyRole(GOVERNOR_ROLE) {
    if (vendor == address(0)) revert ZeroAddress();
    if (amount == 0) revert ZeroAmount();
    if (amount > operatingBalance) revert InsufficientOperatingBalance(amount, operatingBalance);

    operatingBalance -= amount;
    usdc.safeTransfer(vendor, amount);

    uint256 expId = expenditures.length;
    expenditures.push(Expenditure({
        vendor: vendor,
        amount: amount,
        timestamp: uint48(block.timestamp),
        proposalId: proposalId,
        description: description,
        category: category
    }));

    emit ExpenditureMade(expId, vendor, amount, description, category, proposalId);
}
```

#### `emergencySpend`

```solidity
/// @notice Board multisig emergency spending (no governance vote required)
/// @dev Subject to per-period limit. Must be ratified within 30 days.
function emergencySpend(
    address vendor,
    uint128 amount,
    string calldata description
) external nonReentrant onlyRole(TREASURER_ROLE) {
    // Reset period if expired
    if (block.timestamp > emergencyPeriodStart + emergencyPeriodDuration) {
        emergencyPeriodStart = block.timestamp;
        emergencySpentThisPeriod = 0;
    }

    if (emergencySpentThisPeriod + amount > emergencySpendingLimit) {
        revert EmergencyLimitExceeded(amount, emergencySpendingLimit - emergencySpentThisPeriod);
    }
    if (amount > operatingBalance) revert InsufficientOperatingBalance(amount, operatingBalance);

    emergencySpentThisPeriod += amount;
    operatingBalance -= amount;
    usdc.safeTransfer(vendor, amount);

    uint256 expId = expenditures.length;
    expenditures.push(Expenditure({
        vendor: vendor,
        amount: amount,
        timestamp: uint48(block.timestamp),
        proposalId: 0,
        description: description,
        category: "emergency"
    }));

    emit EmergencySpend(expId, vendor, amount, description, msg.sender);
}
```

### Events

```solidity
event DuesPaid(uint256 indexed tokenId, address indexed payer, uint256 amount, uint256 quarters, uint128 paidThrough);
event LateFeeCharged(uint256 indexed tokenId, uint256 feeAmount);
event ExpenditureMade(uint256 indexed expId, address indexed vendor, uint256 amount, string description, string category, uint48 proposalId);
event EmergencySpend(uint256 indexed expId, address indexed vendor, uint256 amount, string description, address authorizedBy);
event DuesAmountUpdated(uint256 oldAmount, uint256 newAmount);
event SplitUpdated(uint256 oldBps, uint256 newBps);
event ReserveTransfer(uint256 amount, bool toOperating); // true = reserve→operating
```

### Custom Errors

```solidity
error InvalidPaymentPeriod();
error ZeroAddress();
error ZeroAmount();
error InsufficientOperatingBalance(uint256 requested, uint256 available);
error InsufficientReserveBalance(uint256 requested, uint256 available);
error EmergencyLimitExceeded(uint256 requested, uint256 remaining);
```

### View Functions

```solidity
function isDuesCurrent(uint256 tokenId) external view returns (bool) {
    return duesRecords[tokenId].paidThrough >= block.timestamp;
}

function getDuesOwed(uint256 tokenId) external view returns (uint256 quarters, uint256 amount) {
    DuesRecord memory record = duesRecords[tokenId];
    if (record.paidThrough >= block.timestamp) return (0, 0);
    uint256 elapsed = block.timestamp - record.paidThrough;
    quarters = (elapsed / 91 days) + 1;
    amount = quarters * quarterlyDuesAmount;
}

function getTreasurySnapshot() external view returns (
    uint256 totalBalance,
    uint256 operating,
    uint256 reserve,
    uint256 expenditureCount
) {
    totalBalance = usdc.balanceOf(address(this));
    operating = operatingBalance;
    reserve = reserveBalance;
    expenditureCount = expenditures.length;
}

function getExpenditure(uint256 expId) external view returns (Expenditure memory) {
    return expenditures[expId];
}
```

### Gas Estimates

| Operation | Estimated Gas | Cost on Base |
|-----------|--------------|-------------|
| `payDues` (1 quarter) | ~95K | ~$0.002 |
| `payDues` (annual) | ~100K | ~$0.002 |
| `makeExpenditure` | ~110K | ~$0.003 |
| `emergencySpend` | ~105K | ~$0.003 |
| `isDuesCurrent` (view) | ~3K | Free |

---

## TimelockController Configuration

Using OZ's `TimelockController` directly — no custom contract needed.

```solidity
// Deployment parameters:
uint256 minDelay = 2 days;  // Minimum delay (Routine category)
address[] proposers = [address(governor)];  // Only Governor can propose
address[] executors = [address(0)];         // Anyone can execute (after delay)
address admin = address(0);                 // No admin (fully decentralized after setup)
```

**Roles on Timelock:**
- `PROPOSER_ROLE` → Governor contract
- `EXECUTOR_ROLE` → `address(0)` (open execution — anyone can trigger after delay)
- `CANCELLER_ROLE` → Board multisig (emergency cancel)
- `DEFAULT_ADMIN_ROLE` → Renounced after setup (or transferred to Timelock itself)

---

## Deployment Script (Foundry)

```solidity
// script/Deploy.s.sol
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address boardMultisig = vm.envAddress("BOARD_MULTISIG");
        address usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // Base USDC

        vm.startBroadcast(deployerKey);

        // 1. PropertyNFT
        PropertyNFT propertyNFT = new PropertyNFT(
            150,                    // maxLots for Faircroft
            "Faircroft Property",
            "FAIR"
        );

        // 2. TimelockController
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(0); // placeholder, updated after Governor deploy
        executors[0] = address(0); // open execution
        TimelockController timelock = new TimelockController(
            2 days,     // minDelay
            proposers,
            executors,
            address(0)  // no admin
        );

        // 3. Governor
        FaircroftGovernor governor = new FaircroftGovernor(
            propertyNFT,
            timelock,
            boardMultisig  // proposal guardian
        );

        // 4. Grant Governor the PROPOSER_ROLE on Timelock
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));

        // 5. Grant board multisig CANCELLER_ROLE on Timelock
        timelock.grantRole(timelock.CANCELLER_ROLE(), boardMultisig);

        // 6. DocumentRegistry
        DocumentRegistry docRegistry = new DocumentRegistry();
        docRegistry.grantRole(docRegistry.RECORDER_ROLE(), address(timelock));
        docRegistry.grantRole(docRegistry.RECORDER_ROLE(), boardMultisig);

        // 7. Treasury
        FaircroftTreasury treasury = new FaircroftTreasury(
            usdc,
            address(governor),
            address(timelock),
            200e6,      // $200/quarter dues
            500,        // 5% annual discount
            5000e6      // $5,000 emergency limit
        );
        treasury.grantRole(treasury.TREASURER_ROLE(), boardMultisig);

        // 8. Grant PropertyNFT roles
        propertyNFT.grantRole(propertyNFT.REGISTRAR_ROLE(), boardMultisig);
        propertyNFT.grantRole(propertyNFT.GOVERNOR_ROLE(), address(timelock));

        // 9. Transfer admin of all contracts to Timelock
        bytes32 adminRole = propertyNFT.DEFAULT_ADMIN_ROLE();
        propertyNFT.grantRole(adminRole, address(timelock));
        propertyNFT.renounceRole(adminRole, msg.sender);

        docRegistry.grantRole(adminRole, address(timelock));
        docRegistry.renounceRole(adminRole, msg.sender);

        treasury.grantRole(adminRole, address(timelock));
        treasury.renounceRole(adminRole, msg.sender);

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("PropertyNFT:", address(propertyNFT));
        console.log("TimelockController:", address(timelock));
        console.log("FaircroftGovernor:", address(governor));
        console.log("DocumentRegistry:", address(docRegistry));
        console.log("FaircroftTreasury:", address(treasury));
    }
}
```

---

## Frontend Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14+ |
| Wallet | wagmi v2 + viem | Latest |
| Wallet UI | RainbowKit | v2 |
| Styling | Tailwind CSS + shadcn/ui | Latest |
| State/Cache | TanStack Query (via wagmi) | v5 |
| Indexer | Ponder | Latest |
| Auth | Coinbase Smart Wallet (passkey) | - |
| Hosting | Vercel | - |

### Page Structure

```
app/
├── layout.tsx                    # Providers (Wagmi, RainbowKit, QueryClient)
├── page.tsx                      # Landing / dashboard redirect
│
├── dashboard/
│   ├── page.tsx                  # Property overview (lot info, dues status, voting power)
│   └── layout.tsx                # Dashboard shell (sidebar, header)
│
├── proposals/
│   ├── page.tsx                  # List all proposals (active, passed, defeated)
│   ├── new/page.tsx              # Create proposal form
│   └── [id]/page.tsx             # Proposal detail + voting interface
│
├── treasury/
│   ├── page.tsx                  # Balance overview (operating, reserve, total)
│   ├── dues/page.tsx             # Pay dues interface
│   ├── expenditures/page.tsx     # Expenditure history (filterable, sortable)
│   └── reports/page.tsx          # Financial reports / charts
│
├── documents/
│   ├── page.tsx                  # Document library (filterable by type)
│   ├── upload/page.tsx           # Upload document (board only)
│   ├── [id]/page.tsx             # Document detail + verification
│   └── verify/page.tsx           # Public verification tool (paste hash → check)
│
├── admin/                        # Board-only pages
│   ├── page.tsx                  # Admin dashboard
│   ├── properties/page.tsx       # Mint NFTs, approve transfers
│   ├── emergency/page.tsx        # Emergency spending interface
│   └── multisig/page.tsx         # Safe multisig link/status
│
└── api/                          # API routes
    ├── notifications/route.ts    # Email/push notification triggers
    └── arweave/upload/route.ts   # Server-side Arweave upload via Irys
```

### Key Components

```
components/
├── web3/
│   ├── ConnectButton.tsx         # RainbowKit connect (wraps for Coinbase Smart Wallet priority)
│   ├── PropertyCard.tsx          # Shows lot info, dues status, voting power
│   ├── VoteButton.tsx            # For/Against/Abstain voting with simulation
│   ├── DuesPayment.tsx           # USDC approval + payDues flow
│   ├── ProposalCard.tsx          # Proposal summary with status badge
│   └── TransactionStatus.tsx     # Pending/confirmed/failed tx indicator
│
├── treasury/
│   ├── BalanceWidget.tsx         # Operating + reserve balances
│   ├── ExpenditureTable.tsx      # Paginated expenditure list
│   └── DuesStatusBadge.tsx       # Current/Late/Delinquent indicator
│
├── documents/
│   ├── DocumentList.tsx          # Filterable document grid
│   ├── DocumentUpload.tsx        # Drag-drop + hash + Arweave upload
│   ├── VerificationWidget.tsx    # Hash comparison tool
│   └── VersionHistory.tsx        # Document version chain view
│
└── governance/
    ├── ProposalForm.tsx          # Multi-step proposal creation
    ├── VotingProgress.tsx        # Bar chart of For/Against/Abstain
    ├── QuorumIndicator.tsx       # Progress toward quorum
    └── TimelockCountdown.tsx     # Days/hours until execution
```

### Document Upload Pipeline

```
User drops PDF in DocumentUpload component
    │
    ├── 1. Client-side: SHA-256 hash computed (Web Crypto API)
    │       const hash = await crypto.subtle.digest('SHA-256', fileBuffer)
    │
    ├── 2. Client sends file + hash to /api/arweave/upload
    │
    ├── 3. Server: Upload to Arweave via Irys SDK
    │       const receipt = await irys.uploadFile(file, { tags })
    │       const arweaveTxId = receipt.id
    │
    ├── 4. Server: Pin to IPFS via Tarlo/Filebase
    │       const cid = await ipfsClient.add(file)
    │
    ├── 5. Return arweaveTxId + cid to client
    │
    ├── 6. Client calls DocumentRegistry.registerDocument(hash, txId, cid, ...)
    │       via wagmi useWriteContract
    │
    └── 7. Ponder indexes DocumentRegistered event → appears in UI
```

---

## Ponder Indexer Schema

```typescript
// ponder.schema.ts
import { onchainTable, index } from "ponder";

export const properties = onchainTable("properties", (t) => ({
    tokenId: t.bigint().primaryKey(),
    owner: t.hex().notNull(),
    lotNumber: t.int().notNull(),
    streetAddress: t.text().notNull(),
    squareFootage: t.int(),
    mintedAt: t.int().notNull(),
    duesPaidThrough: t.int(),
    totalDuesPaid: t.bigint(),
    votingPower: t.int().notNull(),       // 1 (or 0 if delegated away)
    delegatedTo: t.hex(),
}), (table) => ({
    ownerIdx: index().on(table.owner),
}));

export const proposals = onchainTable("proposals", (t) => ({
    id: t.bigint().primaryKey(),
    proposer: t.hex().notNull(),
    category: t.int().notNull(),           // 0=Routine, 1=Financial, etc.
    state: t.text().notNull(),             // Pending, Active, Succeeded, etc.
    forVotes: t.bigint().notNull(),
    againstVotes: t.bigint().notNull(),
    abstainVotes: t.bigint().notNull(),
    quorumRequired: t.bigint().notNull(),
    description: t.text().notNull(),
    metadataUri: t.text(),
    createdAt: t.int().notNull(),
    votingStart: t.int().notNull(),
    votingEnd: t.int().notNull(),
    executedAt: t.int(),
    canceledAt: t.int(),
}), (table) => ({
    stateIdx: index().on(table.state),
    proposerIdx: index().on(table.proposer),
}));

export const votes = onchainTable("votes", (t) => ({
    id: t.text().primaryKey(),             // "{proposalId}-{voter}"
    proposalId: t.bigint().notNull(),
    voter: t.hex().notNull(),
    support: t.int().notNull(),            // 0=against, 1=for, 2=abstain
    weight: t.bigint().notNull(),
    reason: t.text(),
    timestamp: t.int().notNull(),
}), (table) => ({
    proposalIdx: index().on(table.proposalId),
    voterIdx: index().on(table.voter),
}));

export const duesPayments = onchainTable("dues_payments", (t) => ({
    id: t.text().primaryKey(),             // "{txHash}-{logIndex}"
    tokenId: t.bigint().notNull(),
    payer: t.hex().notNull(),
    amount: t.bigint().notNull(),
    quarters: t.int().notNull(),
    paidThrough: t.int().notNull(),
    timestamp: t.int().notNull(),
}), (table) => ({
    tokenIdx: index().on(table.tokenId),
    payerIdx: index().on(table.payer),
}));

export const expenditures = onchainTable("expenditures", (t) => ({
    id: t.bigint().primaryKey(),
    vendor: t.hex().notNull(),
    amount: t.bigint().notNull(),
    description: t.text().notNull(),
    category: t.text().notNull(),
    proposalId: t.bigint(),
    isEmergency: t.boolean().notNull(),
    timestamp: t.int().notNull(),
}), (table) => ({
    vendorIdx: index().on(table.vendor),
    categoryIdx: index().on(table.category),
}));

export const documents = onchainTable("documents", (t) => ({
    id: t.bigint().primaryKey(),
    contentHash: t.hex().notNull(),
    docType: t.int().notNull(),
    title: t.text().notNull(),
    arweaveTxId: t.text().notNull(),
    ipfsCid: t.text(),
    uploadedBy: t.hex().notNull(),
    supersedes: t.bigint(),
    timestamp: t.int().notNull(),
}), (table) => ({
    docTypeIdx: index().on(table.docType),
    hashIdx: index().on(table.contentHash),
}));
```

---

## Testing Strategy

### Layer 1: Unit Tests (Foundry)

Per-contract, per-function tests. Target: 100% branch coverage.

```bash
forge test --match-contract PropertyNFTTest -vvv
forge test --match-contract DocumentRegistryTest -vvv
forge test --match-contract FaircroftGovernorTest -vvv
forge test --match-contract FaircroftTreasuryTest -vvv
```

### Layer 2: Integration Tests (Foundry)

Full lifecycle tests spanning multiple contracts:
- **Governance lifecycle:** Mint → Propose → Vote → Queue → Execute
- **Treasury flow:** Mint → Pay Dues → Propose Expenditure → Vote → Execute → Vendor receives USDC
- **Document flow:** Upload to Arweave → Register on-chain → Verify hash
- **Transfer flow:** Board approves → Seller transfers → Buyer gets voting power

### Layer 3: Invariant/Fuzz Tests (Foundry)

```solidity
// Key invariants to fuzz:
// 1. operatingBalance + reserveBalance <= usdc.balanceOf(treasury)
// 2. Sum of all voting power == propertyNFT.totalSupply()
// 3. No token exists with ID > maxLots
// 4. Every registered document has hashExists[hash] == true
// 5. No duplicate content hashes in DocumentRegistry
```

### Layer 4: Frontend E2E Tests (Playwright)

- Wallet connection flow
- Dues payment flow (with mock USDC)
- Proposal creation and voting
- Document upload and verification

### Pre-Audit Checklist

```
□ Slither static analysis — 0 high/medium findings
□ Mythril symbolic execution — 0 critical paths
□ 100% unit test branch coverage
□ All invariant tests pass with 10K+ runs
□ Gas benchmarks documented
□ NatSpec complete on all external/public functions
□ Access control matrix documented and tested
□ Upgrade path documented (if using UUPS proxy)
□ Emergency procedures documented
```

---

## Foundry Project Structure

```
faircroft-contracts/
├── foundry.toml
├── .env.example
├── script/
│   ├── Deploy.s.sol
│   ├── MintProperties.s.sol      # Batch mint for all Faircroft lots
│   └── VerifyContracts.s.sol
├── src/
│   ├── PropertyNFT.sol
│   ├── DocumentRegistry.sol
│   ├── FaircroftGovernor.sol
│   ├── FaircroftTreasury.sol
│   └── interfaces/
│       ├── IPropertyNFT.sol
│       ├── IDocumentRegistry.sol
│       ├── IFaircroftGovernor.sol
│       └── IFaircroftTreasury.sol
├── test/
│   ├── PropertyNFT.t.sol
│   ├── DocumentRegistry.t.sol
│   ├── FaircroftGovernor.t.sol
│   ├── FaircroftTreasury.t.sol
│   ├── integration/
│   │   ├── GovernanceLifecycle.t.sol
│   │   ├── TreasuryFlow.t.sol
│   │   └── FullSystem.t.sol
│   ├── invariant/
│   │   ├── TreasuryInvariant.t.sol
│   │   └── VotingInvariant.t.sol
│   └── helpers/
│       ├── TestSetup.sol          # Common deploy + mint helpers
│       └── MockUSDC.sol           # ERC20 mock for testing
└── lib/
    └── openzeppelin-contracts/    # Installed via forge install
```

### `foundry.toml`

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"
optimizer = true
optimizer_runs = 200
via_ir = false
evm_version = "cancun"

[rpc_endpoints]
base_mainnet = "${BASE_RPC_URL}"
base_sepolia = "${BASE_SEPOLIA_RPC_URL}"
localhost = "http://127.0.0.1:8545"

[etherscan]
base_mainnet = { key = "${BASESCAN_API_KEY}", url = "https://api.basescan.org/api" }
base_sepolia = { key = "${BASESCAN_API_KEY}", url = "https://api-sepolia.basescan.org/api" }

[fuzz]
runs = 1000
max_test_rejects = 65536

[invariant]
runs = 256
depth = 128
```

---

## Next Steps

1. **Initialize Foundry project** — `forge init faircroft-contracts`
2. **Install OZ** — `forge install OpenZeppelin/openzeppelin-contracts`
3. **Write PropertyNFT.sol** — First contract, no dependencies
4. **Write PropertyNFT.t.sol** — Full unit test suite
5. **Write DocumentRegistry.sol** — Second contract
6. **Write DocumentRegistry.t.sol** — Tests
7. **Write FaircroftGovernor.sol** — Depends on PropertyNFT
8. **Write FaircroftTreasury.sol** — Depends on Governor + Timelock
9. **Write integration tests** — Full lifecycle
10. **Deploy to Base Sepolia** — First testnet deployment
