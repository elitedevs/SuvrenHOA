---
title: "SuvrenHOA Patent Drawings — FIG. 1–7"
author: "Ryan Shanahan"
date: "2026-03-24"
---

<style>
  body { font-family: 'Courier New', monospace; font-size: 11pt; color: #000; background: #fff; }
  h1 { font-size: 14pt; text-align: center; border-bottom: 2px solid black; padding-bottom: 8px; }
  h2 { font-size: 12pt; text-align: center; margin-top: 40px; }
  .fig-container { margin: 30px auto; text-align: center; }
  .diagram { display: inline-block; text-align: left; border: 1px solid #888; padding: 20px; background: #fff; font-family: monospace; font-size: 10pt; line-height: 1.4; }
  .fig-caption { margin-top: 12px; font-size: 10pt; font-style: italic; }
  pre { font-family: 'Courier New', monospace; font-size: 9.5pt; line-height: 1.5; white-space: pre; }
  .page-break { page-break-after: always; }
</style>

# PATENT DRAWINGS
## Application: Blockchain-Based HOA Governance System
### Inventor: Ryan Shanahan | Assignee: Suvren LLC North Carolina

---

## FIG. 1 — System Architecture Overview

<div class="fig-container">
<pre>
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SUVREN HOA GOVERNANCE SYSTEM                           │
│                              FIG. 1 — ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────────────────────┐
                         │         BASE L2 NETWORK       │
                         │      (Ethereum Layer 2)       │
                         └──────────────┬───────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
   │    PropertyNFT       │   │  FaircroftGovernor   │   │  FaircroftTreasury   │
   │    (ERC-721)         │◄──│  (OpenZeppelin       │   │  (USDC Holdings)     │
   │                      │   │   Governor)          │   │                      │
   │  • Soulbound token  │   │                      │   │  • Operating fund    │
   │  • 1 NFT = 1 vote   │   │  • Category quorum   │   │  • Reserve fund      │
   │  • Transfer control │   │  • Supermajority     │   │  • 80/20 split       │
   │  • Auto-delegation  │   │  • Rate limiting     │   │  • Expenditure log   │
   └─────────┬───────────┘   └──────────┬──────────┘   └──────────┬──────────┘
             │                          │                          │
             │               ┌──────────▼──────────┐              │
             │               │  TimelockController  │              │
             │               │  (OpenZeppelin)       │◄────────────┘
             │               │                      │
             │               │  • Delay enforcement  │
             │               │  • Multi-sig control  │
             │               └──────────────────────┘
             │
   ┌─────────▼───────────┐
   │   DocumentRegistry   │
   │   (Append-Only)      │                    ┌──────────────────────────┐
   │                      │───────────────────►│     ARWEAVE NETWORK       │
   │  • SHA-256 hashes   │                    │   (Permanent Storage)    │
   │  • Arweave Tx IDs   │                    │                          │
   │  • IPFS CIDs        │                    │  • CC&Rs                 │
   │  • Tamper-proof     │                    │  • Meeting minutes       │
   └─────────────────────┘                    │  • Financial reports     │
                                              └──────────────────────────┘

     ┌──────────────────────────────────────────────────────────────┐
     │                    FRONTEND APPLICATION                       │
     │           Next.js + wagmi + viem + RainbowKit                 │
     └──────────────────────────────────────────────────────────────┘
</pre>
<p class="fig-caption"><strong>FIG. 1.</strong> System architecture showing five smart contracts deployed on Base L2 network, with Arweave integration for permanent document storage and a Next.js frontend application.</p>
</div>

<div class="page-break"></div>

## FIG. 2 — PropertyNFT Lifecycle

<div class="fig-container">
<pre>
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      FIG. 2 — PropertyNFT LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────────────────────┘

   PHASE 1: MINTING
   ─────────────────
   ┌──────────────┐        ┌─────────────────────────────────────────────────────┐
   │   REGISTRAR  │        │                   PROPERTYNFT CONTRACT               │
   │   (Board     │        │                                                      │
   │   Multisig)  │        │  ┌─────────────────────────────────────────────┐   │
   └──────┬───────┘        │  │  mintProperty(to, lotNumber, address, sqft)  │   │
          │ mintProperty() │  │                                              │   │
          │────────────────►  │  1. Validate: lotNumber ≤ maxLots            │   │
          │                │  │  2. Validate: lot not already minted         │   │
          │                │  │  3. _safeMint(owner, tokenId)               │   │
          │                │  │  4. Store: PropertyInfo struct               │   │
          │                │  │  5. Auto-delegate voting power to owner      │   │
          │                │  │  6. Emit: PropertyMinted event               │   │
          │                │  └─────────────────────────────────────────────┘   │
          │                └──────────────────────────────────────────────────────┘

   PHASE 2: METADATA & GOVERNANCE
   ────────────────────────────────
           ┌──────────────────┐          ┌──────────────────────┐
           │  PropertyInfo    │          │  Voting Power (Votes) │
           │                  │          │                       │
           │  lotNumber       │          │  • getVotes(owner)    │
           │  streetAddress   │          │  • delegates(owner)   │
           │  squareFootage   │          │  • getPastVotes()     │
           │  lastDuesTstamp  │          │  • delegateTo(other)  │
           └──────────────────┘          └──────────────────────┘

   PHASE 3: RESTRICTED TRANSFER (Property Sale)
   ──────────────────────────────────────────────
   ┌───────────┐   approveTransfer()    ┌──────────────────────┐
   │ REGISTRAR │ ─────────────────────► │  pendingTransfers     │
   └───────────┘                        │  [tokenId] = buyer    │
                                        └──────────┬───────────┘
                                                   │
   ┌───────────┐   safeTransferFrom()              │
   │  SELLER   │ ─────────────────────────────────►│ _update() validates:
   └───────────┘                                   │  • to == approvedBuyer
                                                   │  • Clears approval
                                                   │  • Updates voting units
                                                   │  • Auto-delegates new owner
                                                   ▼
                                        ┌──────────────────────┐
                                        │   NEW OWNER holds    │
                                        │   PropertyNFT with   │
                                        │   full voting power  │
                                        └──────────────────────┘
</pre>
<p class="fig-caption"><strong>FIG. 2.</strong> PropertyNFT lifecycle illustrating minting, metadata storage, auto-delegation of voting power, and restricted transfer mechanism requiring board approval for property sales.</p>
</div>

<div class="page-break"></div>

## FIG. 3 — Proposal State Machine

<div class="fig-container">
<pre>
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     FIG. 3 — GOVERNANCE PROPOSAL STATE MACHINE                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                         ┌────────────────────────────┐
                         │    proposeWithCategory()    │
                         │                            │
                         │  Inputs:                   │
                         │  • targets / calldatas     │
                         │  • description             │
                         │  • ProposalCategory:       │
                         │    [Routine|Financial|     │
                         │     Governance|            │
                         │     Constitutional]        │
                         │  • metadataUri (IPFS)      │
                         └───────────────┬────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │       PENDING        │
                              │  (votingDelay: 1d)   │
                              └──────────┬──────────┘
                                         │  [delay expires]
                          ┌──────────────▼─────────────┐
                          │            ACTIVE            │
                          │   (votingPeriod: 7 days)     │
                          │                              │
                          │  Quorum Requirements:        │
                          │  • Routine:       15%        │
                          │  • Financial:     33%        │
                          │  • Governance:    51%        │
                          │  • Constitutional: 67%       │
                          └───┬──────────────────┬──────┘
                              │                  │
              [guardian       │                  │  [voting ends]
               cancels]       │                  │
                              ▼                  ▼
                    ┌──────────────┐    ┌────────────────────────────────────┐
                    │  CANCELED    │    │        QUORUM REACHED?              │
                    └──────────────┘    └──────────────┬─────────────────────┘
                                                       │
                              ┌────────────────────────┼────────────────────────┐
                              │ NO                     │ YES                    │
                              ▼                        ▼                        │
                    ┌──────────────┐         ┌──────────────────────┐          │
                    │   DEFEATED   │         │  THRESHOLD MET?      │          │
                    └──────────────┘         │  (simple majority    │          │
                                             │   or 2/3 super)      │          │
                                             └────────────┬─────────┘          │
                                                          │                     │
                                        ┌─────────────────┼──────────────┐     │
                                        │ NO              │ YES          │     │
                                        ▼                 ▼              │     │
                             ┌──────────────┐   ┌──────────────────┐    │     │
                             │   DEFEATED   │   │    SUCCEEDED      │    │     │
                             └──────────────┘   └────────┬─────────┘    │     │
                                                          │ [queue()]    │     │
                                                          ▼              │     │
                                               ┌──────────────────┐     │     │
                                               │     QUEUED        │     │     │
                                               │  (Timelock delay) │     │     │
                                               │  • Routine: 2d    │     │     │
                                               │  • Financial: 4d  │     │     │
                                               │  • Governance: 4d │     │     │
                                               │  • Constit.: 7d   │     │     │
                                               └────────┬──────────┘     │     │
                                                        │                │     │
                                         ┌──────────────┼──────────┐     │     │
                                         │ [expired]    │ [execute] │     │     │
                                         ▼              ▼          │     │     │
                              ┌──────────────┐  ┌──────────────┐   │     │     │
                              │   EXPIRED    │  │   EXECUTED   │   │     │     │
                              └──────────────┘  └──────────────┘   │     │     │
</pre>
<p class="fig-caption"><strong>FIG. 3.</strong> Proposal state machine for the FaircroftGovernor contract, showing transitions from creation through execution with per-category quorum requirements and timelock delays.</p>
</div>

<div class="page-break"></div>

## FIG. 4 — Treasury Fund Flow

<div class="fig-container">
<pre>
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       FIG. 4 — TREASURY FUND FLOW DIAGRAM                       │
└─────────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────────────┐
   │                          DUES PAYMENT ENTRY                               │
   │                                                                          │
   │  payDues(tokenId, quarters)                                              │
   │                                                                          │
   │  ┌────────────────┐     ┌────────────────────┐     ┌──────────────────┐ │
   │  │  HOMEOWNER     │     │  USDC TOKEN         │     │  TREASURY        │ │
   │  │  (Property     │────►│  safeTransferFrom() │────►│  CONTRACT        │ │
   │  │   Owner)       │     │                    │     │                  │ │
   │  └────────────────┘     └────────────────────┘     └────────┬─────────┘ │
   │                                                             │           │
   │       Payment Calculation:                                  │           │
   │       • 1 quarter:  $200 USDC                              │           │
   │       • 4 quarters: $760 USDC (5% annual discount)         │           │
   │       • Late fee:   +10% if overdue                        │           │
   └─────────────────────────────────────────────────────────────┼───────────┘
                                                                 │
                               ┌─────────────────────────────────▼───────────────────┐
                               │              AUTOMATED FUND SPLIT                     │
                               │                                                       │
                               │         Amount × 80%              Amount × 20%        │
                               │         ──────────────►           ─────────────►      │
                               │                                                       │
                               │    ┌──────────────────┐     ┌──────────────────────┐ │
                               │    │  OPERATING FUND   │     │    RESERVE FUND       │ │
                               │    │                  │     │                      │ │
                               │    │  Day-to-day ops  │     │  Capital expenditures│ │
                               │    │  Maintenance     │     │  Emergency repairs   │ │
                               │    │  Insurance       │     │  Long-term savings   │ │
                               │    │  Management fees │     │                      │ │
                               │    └────────┬─────────┘     └──────────────────────┘ │
                               └────────────┼──────────────────────────────────────────┘
                                            │
              ┌─────────────────────────────▼──────────────────────────────────────┐
              │                    WITHDRAWAL PATHS                                  │
              │                                                                      │
              │  PATH A: Board Emergency Spend (≤ limit, no vote required)           │
              │  ┌──────────────┐  emergencySpend()   ┌────────────────────────┐    │
              │  │ TREASURER    │────────────────────►│  VENDOR / PAYEE         │    │
              │  │ (Multisig)   │                     │  (e.g., contractor)    │    │
              │  └──────────────┘                     └────────────────────────┘    │
              │                                                                      │
              │  PATH B: Governance-Approved Expenditure (proposal required)         │
              │  ┌──────────────┐  makeExpenditure()  ┌────────────────────────┐    │
              │  │ TIMELOCK     │────────────────────►│  VENDOR / PAYEE         │    │
              │  │ (Post-vote)  │                     │  (linked to proposalId)│    │
              │  └──────────────┘                     └────────────────────────┘    │
              │                                                                      │
              │  ALL expenditures logged on-chain: vendor + amount + category +      │
              │  timestamp + proposalId (0 for board emergency)                      │
              └──────────────────────────────────────────────────────────────────────┘
</pre>
<p class="fig-caption"><strong>FIG. 4.</strong> Treasury fund flow illustrating USDC collection, automated 80/20 operating-to-reserve split, and dual withdrawal pathways (board emergency vs. governance-approved expenditures).</p>
</div>

<div class="page-break"></div>

## FIG. 5 — Document Registration Workflow

<div class="fig-container">
<pre>
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FIG. 5 — DOCUMENT REGISTRATION WORKFLOW                       │
└─────────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐
   │   SOURCE    │
   │  DOCUMENT   │  (CC&R, minutes, budget, amendment, resolution, etc.)
   │  (PDF/file) │
   └──────┬──────┘
          │
          │  STEP 1: Hash Generation
          ▼
   ┌──────────────────────────────────────────────────────┐
   │               SHA-256 HASH COMPUTATION                │
   │                                                       │
   │   contentHash = SHA256(document_bytes)               │
   │   → 32-byte hash (deterministic, collision-resistant) │
   └──────────────────────────┬───────────────────────────┘
                              │
          ┌───────────────────┴──────────────────────┐
          │                                          │
          │  STEP 2a: Permanent Storage               │  STEP 2b: Fast Retrieval Cache
          ▼                                          ▼
   ┌──────────────────────┐               ┌──────────────────────┐
   │    ARWEAVE NETWORK   │               │    IPFS NETWORK       │
   │                      │               │                       │
   │  • Upload raw doc    │               │  • Pin document       │
   │  • Receive Tx ID     │               │  • Receive CID v1     │
   │    (43-char base64)  │               │    (content-addressed)│
   │  • Permanent storage │               │  • Fast access        │
   │  • Pay AR token once │               │  • P2P distribution   │
   └──────────┬───────────┘               └────────────┬──────────┘
              │                                        │
              │  arweaveTxId                           │  ipfsCid
              └────────────────────┬───────────────────┘
                                   │
          STEP 3: On-Chain Registration
                                   ▼
   ┌──────────────────────────────────────────────────────────────────────────────┐
   │                  DocumentRegistry.registerDocument()                          │
   │                                                                               │
   │  Input:  contentHash | arweaveTxId | ipfsCid | docType | title | supersedes  │
   │                                                                               │
   │  Validates:                                                                   │
   │    ✓ contentHash != 0x0                                                      │
   │    ✓ arweaveTxId not empty                                                   │
   │    ✓ hash not already registered (immutability check)                        │
   │    ✓ supersedes docId exists (if replacing prior version)                    │
   │                                                                               │
   │  Stores (append-only — no delete, no modify):                                │
   │    Document { contentHash, timestamp, supersedes, docType,                   │
   │               uploadedBy, arweaveTxId, ipfsCid, title }                      │
   │                                                                               │
   │  Emits: DocumentRegistered(docId, contentHash, docType, title, arweaveTxId)  │
   └──────────────────────────────────────────────────────────────────────────────┘

   STEP 4: Verification (Anyone, Anytime)
   ────────────────────────────────────────
   ┌────────────────────────────────────────────────────────────────────┐
   │  verifyDocument(contentHash) → (exists, docId, Document)           │
   │                                                                     │
   │  User downloads doc from Arweave ──► compute SHA-256 ──►           │
   │  compare to on-chain contentHash ──► cryptographic proof of        │
   │  authenticity and timestamp (immutable blockchain record)           │
   └────────────────────────────────────────────────────────────────────┘
</pre>
<p class="fig-caption"><strong>FIG. 5.</strong> Document registration workflow showing SHA-256 hash computation, dual storage in Arweave (permanent) and IPFS (fast retrieval), on-chain hash registration with append-only immutability, and public verification.</p>
</div>

<div class="page-break"></div>

## FIG. 6 — Community Health Score Computation

<div class="fig-container">
<pre>
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FIG. 6 — COMPOSITE HEALTH SCORE ALGORITHM                    │
└─────────────────────────────────────────────────────────────────────────────────┘

   INPUT SIGNALS (5 components)
   ──────────────────────────────

   ┌──────────────────────────────────────────────────────────────┐
   │  SIGNAL 1: Dues Collection Rate                  Weight: 30% │
   │                                                              │
   │  Source: FaircroftTreasury.isDuesCurrent(tokenId)           │
   │  Formula: (lots current / total lots) × 100                  │
   │  Range: 0–100 → Score: 0–30                                  │
   └──────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────┐
   │  SIGNAL 2: Governance Participation Rate         Weight: 25% │
   │                                                              │
   │  Source: FaircroftGovernor (proposal vote counts)           │
   │  Formula: (votes cast / eligible voters) × 100              │
   │  Range: 0–100 → Score: 0–25                                  │
   └──────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────┐
   │  SIGNAL 3: Reserve Fund Health                   Weight: 25% │
   │                                                              │
   │  Source: FaircroftTreasury.getTreasurySnapshot()            │
   │  Formula: (reserve / total) vs. target 20%                  │
   │  Range: 0–100 → Score: 0–25                                  │
   └──────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────┐
   │  SIGNAL 4: Document Transparency Index           Weight: 10% │
   │                                                              │
   │  Source: DocumentRegistry.getDocumentCount()                │
   │  Formula: log-normalized count of registered documents       │
   │  Range: 0–100 → Score: 0–10                                  │
   └──────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────┐
   │  SIGNAL 5: Open Maintenance Issues               Weight: 10% │
   │                                                              │
   │  Source: Supabase maintenance_requests table                 │
   │  Formula: 100 − (open issues / total issues × 100)          │
   │  Range: 0–100 → Score: 0–10                                  │
   └──────────────────────────────────────────────────────────────┘

                              │
                              │  Weighted Aggregation
                              ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │                    COMPOSITE HEALTH SCORE FORMULA                            │
   │                                                                             │
   │  H = (S1 × 0.30) + (S2 × 0.25) + (S3 × 0.25) + (S4 × 0.10) + (S5 × 0.10) │
   │                                                                             │
   │  Range: 0–100 (integer)                                                     │
   └────────────────────────────────┬────────────────────────────────────────────┘
                                    │
                                    ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │                          SCORE CLASSIFICATION                             │
   │                                                                           │
   │   90–100 ████████████████████  EXCELLENT  — Exemplary governance         │
   │   75–89  ████████████████░░░░  GOOD       — Healthy community            │
   │   50–74  ████████████░░░░░░░░  FAIR       — Needs attention              │
   │   25–49  ████████░░░░░░░░░░░░  POOR       — Significant issues           │
   │    0–24  ████░░░░░░░░░░░░░░░░  CRITICAL   — Requires immediate action    │
   └──────────────────────────────────────────────────────────────────────────┘
</pre>
<p class="fig-caption"><strong>FIG. 6.</strong> Composite community health scoring algorithm showing five input signals with assigned weights, the weighted aggregation formula, and the five-tier classification system.</p>
</div>

<div class="page-break"></div>

## FIG. 7 — Frontend Application Architecture

<div class="fig-container">
<pre>
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      FIG. 7 — FRONTEND APPLICATION ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────────────────┐
   │                      BROWSER / CLIENT LAYER                                   │
   │                                                                               │
   │   ┌─────────────────────────────────────────────────────────────────────┐   │
   │   │                     NEXT.JS APP ROUTER                               │   │
   │   │                                                                      │   │
   │   │  /dashboard  /proposals  /treasury  /documents  /health  /map  ...  │   │
   │   └───────────────────────────────────────────────────────┬─────────────┘   │
   │                                                           │                  │
   │   ┌─────────────────────────────────────────────────────────────────────┐   │
   │   │                    PROVIDER LAYER                                    │   │
   │   │                                                                      │   │
   │   │   ┌──────────────────────┐    ┌────────────────────────────────────┐│   │
   │   │   │   RainbowKit          │    │      wagmi WagmiProvider           ││   │
   │   │   │   ConnectButton      │    │      (wallet connection mgmt)      ││   │
   │   │   │   (wallet UX/modal)  │    │                                    ││   │
   │   │   └──────────────────────┘    └────────────────────────────────────┘│   │
   │   │                                                                      │   │
   │   │   ┌──────────────────────────────────────────────────────────────┐  │   │
   │   │   │              TanStack Query (React Query)                     │  │   │
   │   │   │              (caching + refetch + mutation state)             │  │   │
   │   │   └──────────────────────────────────────────────────────────────┘  │   │
   │   └─────────────────────────────────────────────────────────────────────┘   │
   │                                                                               │
   │   ┌─────────────────────────────────────────────────────────────────────┐   │
   │   │                       HOOKS LAYER                                    │   │
   │   │                                                                      │   │
   │   │  useProperty()    useProposals()    useTreasury()    useDocuments()  │   │
   │   │  useContracts()   useCastVote()     usePayDues()     useProfile()    │   │
   │   │  usePublicStats() useHealthScore()  useMessages()    useNeighMap()   │   │
   │   └────────────────────────────────────┬─────────────────────────────────┘  │
   └────────────────────────────────────────┼────────────────────────────────────┘
                                            │
              ┌─────────────────────────────┼──────────────────────────────┐
              │                             │                               │
              ▼                             ▼                               ▼
   ┌─────────────────────┐    ┌────────────────────────┐    ┌────────────────────┐
   │     viem            │    │      WAGMI              │    │    SUPABASE         │
   │   publicClient      │    │   useReadContract()     │    │   (Off-chain DB)   │
   │                     │    │   useWriteContract()    │    │                   │
   │  Wallet-less reads  │    │   useAccount()          │    │  • Profiles        │
   │  (public data,      │    │   (signed txns,         │    │  • Pets            │
   │   transparency page)│    │    wallet state)        │    │  • Vehicles        │
   └──────────┬──────────┘    └───────────┬─────────────┘    │  • Posts           │
              │                           │                   │  • Reservations    │
              └────────────────┬──────────┘                   └────────────────────┘
                               │
                               ▼
              ┌─────────────────────────────────────────────────┐
              │              BASE L2 NETWORK (RPC)               │
              │         https://sepolia.base.org                  │
              │                                                   │
              │  PropertyNFT | FaircroftGovernor |               │
              │  FaircroftTreasury | DocumentRegistry |           │
              │  TimelockController                               │
              └─────────────────────────────────────────────────┘
</pre>
<p class="fig-caption"><strong>FIG. 7.</strong> Frontend application architecture illustrating the Next.js app router, RainbowKit wallet connection, wagmi contract interaction hooks, viem public client for wallet-less reads, and Supabase for off-chain data storage.</p>
</div>

---

*All figures © 2026 Suvren LLC. Prepared in support of provisional patent application.*
*Inventor: Ryan Shanahan*
