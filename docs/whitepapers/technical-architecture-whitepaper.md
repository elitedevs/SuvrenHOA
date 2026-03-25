# SuvrenHOA Technical Architecture Whitepaper
## Smart Contracts, Frontend Stack, and Security Design

**Version 1.0** | March 2026  
**Platform:** SuvrenHOA on Base (Ethereum L2)  
**Status:** Deployed on Base Sepolia Testnet

---

## Executive Summary

SuvrenHOA is a full-stack decentralized application for homeowner association governance. It combines battle-tested smart contract primitives (OpenZeppelin Governor, ERC-721, AccessControl), a modern React/Next.js frontend, and the Ethereum Layer 2 network Base to deliver a governance platform that is secure, low-cost, and capable of serving communities of any size.

This whitepaper describes the complete technical architecture: smart contract design, frontend stack, security model, and the rationale for key technical decisions. It is intended for technical reviewers, security auditors, and engineering teams evaluating the platform.

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────┐
│                    User Interface                     │
│         Next.js 16 + wagmi + RainbowKit              │
│              31+ pages / routes                       │
└────────────────────┬─────────────────────────────────┘
                     │ JSON-RPC / WalletConnect
┌────────────────────▼─────────────────────────────────┐
│                   Base L2 Network                     │
│              (Ethereum Layer 2)                       │
└────────────────────┬─────────────────────────────────┘
         ┌───────────┼───────────┬──────────────┐
         ▼           ▼           ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ PropertyNFT  │ │FaircroftG│ │Faircroft │ │Document  │
│ (ERC-721 +   │ │overnor   │ │Treasury  │ │Registry  │
│  Votes)      │ │(OZ Gov.) │ │(USDC)    │ │(Arweave) │
└──────────────┘ └──────────┘ └──────────┘ └──────────┘
                      │
               ┌──────▼──────┐
               │  Timelock   │
               │  Controller │
               └─────────────┘
                                    ┌─────────────────┐
                                    │ Arweave Network │
                                    │ (Perm. Storage) │
                                    └─────────────────┘
```

### 1.2 Component Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| PropertyNFT | Solidity, ERC-721+Votes | HOA membership tokens |
| FaircroftGovernor | OZ Governor | On-chain voting |
| FaircroftTreasury | Solidity, USDC | Dues collection + fund management |
| DocumentRegistry | Solidity | Document hash registry |
| TimelockController | OZ Timelock | Execution delay |
| Frontend | Next.js 16 | User interface |
| Wallet Integration | wagmi + viem | Blockchain interaction |
| Wallet Connect | RainbowKit | Multi-wallet support |
| Document Storage | Arweave | Permanent file storage |

---

## 2. Smart Contract Architecture

### 2.1 PropertyNFT

**Inheritance chain:**
```
ERC721 → ERC721Votes → AccessControl → PropertyNFT
```

The PropertyNFT contract is the identity layer. Key design decisions:

**Soulbound via override:** The `_beforeTokenTransfer` hook is overridden to revert on all transfers except those explicitly approved by the `TRANSFER_APPROVER_ROLE`. This implements soulbound semantics without requiring a separate interface.

**Votes integration:** ERC721Votes provides the `delegate()`, `delegates()`, `getVotes()`, and `getPastVotes()` functions that the Governor contract relies on. The voting power snapshot mechanism is inherited from OpenZeppelin's ERC721Votes implementation.

**AccessControl roles:**
```solidity
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
bytes32 public constant TRANSFER_APPROVER_ROLE = keccak256("TRANSFER_APPROVER_ROLE");
bytes32 public constant METADATA_UPDATER_ROLE = keccak256("METADATA_UPDATER_ROLE");
```

**On-chain metadata:** Property metadata (lot number, address, sqft, owner info) is stored in a mapping keyed by token ID. All metadata updates emit events for off-chain indexing.

### 2.2 FaircroftGovernor

**Inheritance chain:**
```
Governor → GovernorSettings → GovernorCountingSimple → 
GovernorVotes → GovernorVotesQuorumFraction → 
GovernorTimelockControl → FaircroftGovernor
```

The Governor is the heart of the governance system. Key design decisions:

**Four-tier proposal categories:** The standard OpenZeppelin Governor does not natively support multiple proposal categories with different thresholds. FaircroftGovernor extends the base Governor with a `ProposalCategory` enum and per-category threshold storage:

```solidity
enum ProposalCategory { 
    Routine,        // 15% threshold
    Financial,      // 33% threshold
    Governance,     // 51% threshold
    Constitutional  // 67% threshold
}

mapping(ProposalCategory => uint256) public proposalThresholds;
mapping(uint256 => ProposalCategory) public proposalCategories;
```

**Dynamic quorum:** The quorum requirement (percentage of total supply that must participate) is dynamically calculated based on current total voting power. This means quorum automatically scales as new properties are added to the community.

**Timelock integration:** GovernorTimelockControl delegates execution to the TimelockController, adding a mandatory delay between vote success and execution. This is the critical safety mechanism that prevents immediate execution of governance attacks.

### 2.3 FaircroftTreasury

The Treasury contract manages all community funds. Key design decisions:

**Atomic split on receipt:** The `receive()` function (triggered when USDC is transferred to the treasury) immediately executes the 80/20 split, incrementing internal accounting for operating and reserve fund balances. There is no period during which funds are in a unified pool.

**USDC ERC-20 integration:** The contract uses OpenZeppelin's `IERC20` interface to interact with USDC. Payment is made via `USDC.transferFrom()` on the homeowner's approval, or via `USDC.transfer()` for outgoing vendor payments.

**Governance-gated withdrawals:** All withdrawal functions require that the calling contract is the TimelockController (meaning a governance vote was passed and queued). Direct withdrawal by any address is not possible.

**Dues tracking:**
```solidity
mapping(uint256 => DuesRecord) public duesRecords;  // tokenId → dues status

struct DuesRecord {
    uint256 lastPaymentTimestamp;
    uint256 totalPaid;
    PaymentFrequency frequency;
    bool isCurrent;
}
```

### 2.4 DocumentRegistry

**Minimal and focused:** The DocumentRegistry is intentionally simple — it is a mapping of document hashes to metadata. It does not validate document content, enforce document types, or manage access. It is purely a registry.

```solidity
struct DocumentRecord {
    bytes32 contentHash;      // SHA-256 of document content
    string arweaveId;         // Arweave transaction ID
    string title;
    string documentType;
    address registeredBy;
    uint256 registeredAt;
    uint256 proposalId;       // 0 if not linked to governance
    bool superseded;
}

mapping(bytes32 => DocumentRecord) public documents;
```

**Events for indexing:** All document registrations emit a `DocumentRegistered` event, allowing off-chain indexers to build searchable document libraries without scanning all contract storage.

### 2.5 TimelockController

SuvrenHOA uses OpenZeppelin's battle-tested `TimelockController` without modification. The Timelock:
- Enforces a minimum delay between proposal queue and execution
- Is the sole address authorized to call restricted functions on Treasury and other contracts
- Can be administered by the Governor (enabling the community to change timelock parameters through governance)
- Supports a canceller role that can cancel malicious proposals during the delay period

Default timelock delays:
- Routine: 24 hours
- Financial: 48 hours
- Governance: 72 hours
- Constitutional: 7 days

---

## 3. Frontend Architecture

### 3.1 Next.js 16 Application

The SuvrenHOA frontend is a Next.js 16 application with 31+ routes covering:

**Public routes:**
- Landing page, community overview
- Document library (public documents)
- Governance history (all proposals, all votes)
- Property records (public metadata)

**Authenticated routes (wallet connected):**
- Homeowner dashboard (personal dues, voting record)
- Governance: create proposals, vote, delegate
- Treasury: dues payment, balance visibility
- Property management: profile, transfer requests
- Document upload and verification

**Admin routes (board roles):**
- Transfer approval queue
- Document registration
- Emergency actions
- Role management

### 3.2 wagmi + viem

**wagmi** is a React hooks library for Ethereum that provides:
- Wallet connection state management
- Contract read/write hooks with automatic caching
- Transaction lifecycle management (pending, confirmed, failed)
- Multi-chain support

**viem** is a TypeScript library for Ethereum interaction that provides:
- Type-safe contract ABI interaction
- Transaction building and signing
- ABI encoding/decoding
- Low-level EVM interaction

Together, wagmi and viem provide a modern, type-safe alternative to ethers.js/web3.js. The combination results in:
- Smaller bundle size (~40% smaller than ethers.js equivalent)
- Better TypeScript types (full type inference from contract ABIs)
- React-native state management for blockchain data
- Automatic cache invalidation on transaction confirmation

### 3.3 RainbowKit

RainbowKit is a React library for wallet connection UI. It provides:
- Pre-built connect wallet button and modal
- Support for 100+ wallets (MetaMask, Coinbase Wallet, WalletConnect, etc.)
- Mobile wallet support via WalletConnect protocol
- Consistent UX across all wallet types

For homeowner adoption, wallet UX is critical. RainbowKit's polished UI reduces the friction of wallet connection, particularly for homeowners new to blockchain applications.

### 3.4 Frontend Performance Patterns

**Contract reads:** wagmi's `useContractRead` hooks cache blockchain reads with configurable staleness times. Treasury balance is refreshed every 30 seconds; voting power is refreshed on each block (since it affects active proposals).

**Optimistic updates:** Votes and dues payments show immediate optimistic UI updates while the transaction confirms on-chain, then resolve to confirmed state.

**Event subscriptions:** The frontend subscribes to Governor, Treasury, and Registry events via wagmi's `useContractEvent` hook to receive real-time updates when proposals are created, votes cast, or documents registered.

---

## 4. Base L2: Why We Chose It

### 4.1 What Is Base?

Base is an Ethereum Layer 2 network developed by Coinbase. It is built on the OP Stack (same technology as Optimism) and secured by Ethereum mainnet.

Layer 2 networks like Base achieve low transaction costs by:
1. Batching hundreds of transactions together
2. Executing them off the Ethereum mainnet
3. Posting a compressed proof to Ethereum mainnet periodically
4. Inheriting Ethereum's security guarantees

### 4.2 Why Base for SuvrenHOA

**Low gas costs:** Governance participation must be cheap enough that homeowners don't face meaningful financial barriers to voting. On Ethereum mainnet, a governance vote might cost $5–20. On Base, the same transaction costs $0.005–0.02 — 99% cheaper.

**EVM compatibility:** Base is fully EVM-compatible, meaning all Ethereum smart contracts, tooling (Hardhat, Foundry), and libraries (OpenZeppelin) work without modification. There is no SuvrenHOA-specific chain risk.

**Coinbase ecosystem:** Base is developed and supported by Coinbase, the largest regulated US cryptocurrency exchange. This provides:
- Coinbase Wallet integration (prominent in RainbowKit)
- Fiat on-ramp integration (buy USDC directly to Base)
- Institutional credibility for communities considering the platform

**Developer tooling:** Base has excellent developer support, block explorer (Basescan), testnet (Base Sepolia), and compatibility with the full Ethereum developer ecosystem.

**Security:** Base transactions are ultimately settled on Ethereum mainnet, the most secure public blockchain by total value secured. Base inherits this security guarantee.

### 4.3 Gas Cost Analysis

For a 100-home community with active governance:

| Transaction Type | Frequency/Year | Gas per Tx | Annual Cost |
|-----------------|----------------|------------|-------------|
| Dues payment | 400 (100 homes × 4 quarters) | $0.02 | $8.00 |
| Vote cast | 2,000 (100 homes × 20 proposals) | $0.01 | $20.00 |
| Proposal create | 20 proposals/year | $0.05 | $1.00 |
| Execute proposal | 20 proposals/year | $0.05 | $1.00 |
| Document register | 50 docs/year | $0.02 | $1.00 |
| **Total** | | | **$31.00/year** |

This is approximately $0.31 per home per year in gas costs — negligible compared to any alternative governance system.

---

## 5. Security Model

### 5.1 Access Control Architecture

SuvrenHOA uses a layered access control model:

**Layer 1: Smart contract roles (AccessControl)**
- `DEFAULT_ADMIN_ROLE`: Governance contract (Timelock)
- `MINTER_ROLE`: Community administrator during setup; board thereafter
- `TRANSFER_APPROVER_ROLE`: Board of directors multisig
- `PROPOSER_ROLE` (Timelock): Governor contract only
- `EXECUTOR_ROLE` (Timelock): Any address (permissionless execution after delay)
- `CANCELLER_ROLE` (Timelock): Emergency committee multisig

**Layer 2: Governance gates**
Any action that modifies contract state (treasury withdrawals, rule changes, role assignments) requires a successfully executed governance proposal. This is enforced by requiring the caller to be the Timelock contract.

**Layer 3: Timelock delay**
All governance-approved actions wait in the Timelock before execution, giving the community time to review and potentially cancel malicious proposals.

### 5.2 Attack Vector Analysis

**Governance takeover:** An attacker would need to acquire 51%+ of voting power (majority of all property NFTs) to pass a Governance-tier proposal. Since NFTs are soulbound and only transferred through board approval, acquiring this many is essentially impossible without physically taking ownership of majority of homes.

**Flash loan / manipulation attacks:** Snapshot voting prevents manipulation by requiring voting power to be established before proposal creation. Same-block attacks are structurally impossible.

**Rug pull / admin key compromise:** Admin roles are held by the governance contract (Timelock), not a private key. No individual can modify contracts unilaterally. A multisig is recommended for emergency roles.

**Smart contract bugs:** SuvrenHOA is built on OpenZeppelin's audited contract library. The FaircroftGovernor and FaircroftTreasury custom extensions are covered by 122 automated tests (unit and integration). Third-party audit is recommended before mainnet deployment.

**Oracle manipulation:** SuvrenHOA has no price oracles. Dues are denominated in fixed USDC amounts, eliminating oracle risk entirely.

**Phishing / social engineering:** These are user-facing risks mitigated by UX design: explicit transaction confirmations, clear descriptions of what each transaction does, and hardware wallet support.

### 5.3 Test Coverage

SuvrenHOA has 122 automated contract tests covering:
- PropertyNFT minting, transfer restriction, delegation, metadata
- FaircroftGovernor proposal creation across all four tiers
- Voting period mechanics, quorum calculation, vote counting
- Timelock queue, execution, and cancellation
- FaircroftTreasury dues payment, 80/20 split, withdrawal governance
- DocumentRegistry registration, hash verification, supersession

Test suite is run in CI on every commit. Coverage targets: 95%+ on all contract lines.

### 5.4 Multisig Recommendations

For production deployment, SuvrenHOA recommends:
- Emergency committee: 3-of-5 multisig (board members)
- Canceller role: Above multisig
- Initial admin (pre-governance): 2-of-3 founding member multisig
- Transfer Approver: 2-of-3 board member multisig

---

## 6. Scalability and Future Roadmap

### 6.1 Current Limits

Base can theoretically support thousands of transactions per second. SuvrenHOA contracts have no hard scalability limits. A community of 10 homes and a community of 10,000 homes use the same contracts.

Gas costs scale linearly with transaction volume but remain negligible at realistic HOA scales (hundreds of homes, dozens of annual transactions per home).

### 6.2 Multi-Community Architecture

SuvrenHOA is architected to support multi-community deployment:
- Each community deploys its own contract suite (PropertyNFT, Governor, Treasury, Registry)
- A community registry contract indexes all deployed communities
- The frontend handles multi-community views through a community selector

### 6.3 Upgradeability

The current deployment is non-upgradeable by design — upgrades require governance approval, which means the community controls any changes. Future architectural options include:
- **UUPS proxy pattern:** Enables contract upgrades via governance vote with full code replacement
- **Modular extensions:** New features (dispute resolution, committee governance, inter-community federation) deployed as separate contracts that integrate with the core

Constitutional-tier governance (67% threshold, 66.7% quorum) controls any upgrade proposals, ensuring community consensus before code changes.

### 6.4 Roadmap

**Q2 2026: Base Mainnet Launch**
- Security audit completion
- Mainnet deployment
- First pilot community onboarding
- USDC fiat on-ramp integration for non-crypto-native homeowners

**Q3 2026: Enhanced Governance**
- Committee sub-DAOs with delegated spending authority
- Mobile wallet optimization
- Notification system (email/push for governance events)
- Enhanced document search and filtering

**Q4 2026: Platform Features**
- Violation tracking and dispute resolution module
- Architectural review workflow
- Neighbor-to-neighbor direct messaging (off-chain, E2E encrypted)
- Reserve study integration and adequacy tracking

**2027: Scale and Ecosystem**
- Multi-community federation for master planned developments
- Developer API for third-party integrations
- Legal integration (model CC&Rs, state law compliance guides)
- Cross-HOA analytics and benchmarking (anonymized)

---

## 7. Developer Setup

### 7.1 Smart Contracts

Built with Hardhat + TypeScript. Dependencies:
- OpenZeppelin Contracts 5.x
- Hardhat 2.x
- Ethers.js 6.x (testing only)
- Chai + Mocha (testing)

Deploy to Base Sepolia:
```bash
npx hardhat run scripts/deploy.ts --network base-sepolia
```

Run tests:
```bash
npx hardhat test
# 122 tests, target <60 seconds
```

### 7.2 Frontend

Built with Next.js 16. Dependencies:
- wagmi 2.x
- viem 2.x
- RainbowKit 2.x
- TailwindCSS 3.x

Run locally:
```bash
npm install
npm run dev
# Runs on localhost:3000
```

### 7.3 Environment Variables

Required for frontend:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_CHAIN_ID=84532 (Base Sepolia) or 8453 (Base Mainnet)
NEXT_PUBLIC_PROPERTY_NFT_ADDRESS=...
NEXT_PUBLIC_GOVERNOR_ADDRESS=...
NEXT_PUBLIC_TREASURY_ADDRESS=...
NEXT_PUBLIC_DOCUMENT_REGISTRY_ADDRESS=...
```

---

## 8. Conclusion

SuvrenHOA's technical architecture reflects a core philosophy: use proven, audited components wherever possible, add custom code only where necessary, and let governance — not admin keys — control the system.

OpenZeppelin's battle-tested contract library provides the foundation. Base L2 provides the cost efficiency. wagmi/viem/RainbowKit provide the frontend infrastructure. The custom code — FaircroftGovernor's four-tier system, FaircroftTreasury's automatic split, PropertyNFT's soulbound transfer restriction — is targeted, well-tested, and well-scoped.

With 122 automated tests, a clear security model, and a governance-controlled upgrade path, SuvrenHOA is engineered to be trusted with real community assets and real governance decisions.

---

*SuvrenHOA is deployed on Base Sepolia. Production mainnet deployment pending security audit completion.*  
*Smart contract source code available for review. Contact the team for audit documentation.*

*© 2026 SuvrenHOA. All rights reserved.*
