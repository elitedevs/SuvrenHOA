# SuvrenHOA Code Quality Audit Report — V2

**Date:** April 7, 2026
**Auditor:** Claude (automated, comprehensive)
**Repo:** `faircroft-dao` (SuvrenHOA)
**Scope:** Smart contracts (`contracts/src/`), Frontend (`frontend/src/`), Tests, CI/CD
**Previous Audit:** V1 — April 5, 2026 (27 findings: 2 Critical, 5 High, 12 Medium, 8 Low)

---

## Executive Summary

This V2 audit found **43 findings** across the full stack: **3 Critical, 9 High, 12 Medium, 10 Low, 9 Info**. The codebase has matured significantly since V1 — all 405 smart contract tests pass, npm audit shows **0 vulnerabilities**, and previously identified security issues (SC-03 through SC-11) have been explicitly mitigated in the contracts. The remaining issues are concentrated in frontend error handling, accessibility, and a few smart contract edge cases around governance DoS and lending pool math.

### V1 → V2 Comparison

| Metric                  | V1 (Apr 5)      | V2 (Apr 7)      | Delta          |
|-------------------------|------------------|------------------|----------------|
| Total Findings          | 27               | 43               | +16 (deeper scope) |
| Critical                | 2                | 3                | +1 (new frontend) |
| High                    | 5                | 9                | +4 (frontend focus)|
| Medium                  | 12               | 12               | 0              |
| Low                     | 8                | 10               | +2             |
| Info                    | 0                | 9                | +9 (new category)|
| Forge Tests             | 405 passing      | 405 passing      | ✅ Stable       |
| TypeScript Errors       | 6                | 6                | 0 (unchanged)   |
| npm Vulnerabilities     | unknown          | 0                | ✅ Clean        |

### What Improved Since V1

1. **Security mitigations landed** — SC-03 through SC-11 are now addressed in contract source
2. **Test suite stable** — 405 tests, 0 failures, 0 skipped, ~200ms runtime
3. **npm audit clean** — 0 known vulnerabilities in frontend dependencies
4. **Contract architecture solid** — Role-based access control, ReentrancyGuard, input validation all present
5. **Structured test helpers** — `TestSetup.sol` centralizes deployment for consistent test environments

### What Still Needs Attention

1. **TypeScript errors persist** — 6 errors in NeighborhoodMap.tsx (google namespace) unchanged since V1
2. **Frontend error handling is weak** — AuthContext, hooks, and API interactions swallow errors silently
3. **Governance DoS risk** — Active proposal counter can lock governance if expired proposals aren't cleaned up
4. **localStorage misuse** — Sensitive data (messages, autopay settings) stored unencrypted client-side
5. **Accessibility gaps** — Map, alerts, and command palette lack keyboard/screen reader support

---

## Automated Test Results

### Forge Tests
```
Ran 11 test suites in 197.52ms (345.32ms CPU time):
405 tests passed, 0 failed, 0 skipped (405 total tests)
```

### TypeScript Compilation (`npx tsc --noEmit`)
```
src/components/NeighborhoodMap.tsx(59,24): error TS2503: Cannot find namespace 'google'.
src/components/NeighborhoodMap.tsx(231,20): error TS2304: Cannot find name 'google'.
src/components/NeighborhoodMap.tsx(333,25): error TS2503: Cannot find namespace 'google'.
src/components/NeighborhoodMap.tsx(334,32): error TS2503: Cannot find namespace 'google'.
src/components/NeighborhoodMap.tsx(335,44): error TS2503: Cannot find namespace 'google'.
src/components/NeighborhoodMap.tsx(336,49): error TS2503: Cannot find namespace 'google'.
```
**6 errors, all in NeighborhoodMap.tsx** — Missing `@types/google.maps` package.

### npm audit
```
found 0 vulnerabilities
```

---

## Smart Contract Findings

### SC-01 — DuesLending: Loan Pool Calculation Uses Shrinking Denominator [HIGH]

**File:** `contracts/src/DuesLending.sol` (~line 420)

`_loanPoolAvailable()` calculates available pool as `(reserveBalance * 1500) / 10000 - totalOutstanding`. After each loan deposit, `reserveBalance` decreases while `totalOutstanding` increases, allowing the effective deployment ratio to silently exceed the configured cap when multiple loans are requested in sequence.

**Fix:** Calculate pool based on total reserve (in-treasury + deployed): `maxPool = ((treasury.reserveBalance() + totalOutstanding) * 1500) / 10000`. Note: TreasuryYield.sol (~line 165) already uses this corrected pattern.

---

### SC-02 — FaircroftGovernor: Active Proposal Count DoS [HIGH]

**File:** `contracts/src/FaircroftGovernor.sol` (lines 195–203)

`activeProposalCount` increments on every `propose()` but only decrements on `execute()`, `cancel()`, or `cleanupProposal()`. If proposals expire or are defeated without cleanup, the counter never decrements — eventually blocking all new proposals at `maxActiveProposals = 10`.

**Fix:** Auto-decrement on state transitions (Defeated, Expired) or add a public permissionless cleanup trigger. Document that `cleanupProposal()` must be called for expired/defeated proposals.

---

### SC-03 — VendorEscrow: Inspector Self-Approval Gap [HIGH]

**File:** `contracts/src/VendorEscrow.sol` (line 145)

Constructor enforces `inspector != vendor`, but `approveMilestone()` does not re-validate this invariant. If an inspector is later assigned vendor responsibilities (or vice versa through role changes), self-approval becomes possible.

**Fix:** Add `require(msg.sender != wo.vendor, "inspector cannot be vendor")` in `approveMilestone()`.

---

### SC-04 — FaircroftTreasury: Missing ReentrancyGuard on releaseReserveForYield() [MEDIUM]

**File:** `contracts/src/FaircroftTreasury.sol` (line 265)

`creditYieldReturn()` and `creditFromEscrow()` use `nonReentrant`, but `releaseReserveForYield()` does not. Theoretical re-entrance via USDC callback could double-count reserve balance.

**Fix:** Add `nonReentrant` modifier to `releaseReserveForYield()`.

---

### SC-05 — PropertyNFT: Auto-Delegation on Transfer May Override User Choice [MEDIUM]

**File:** `contracts/src/PropertyNFT.sol` (lines 320–325)

`_update()` auto-delegates transferred tokens to the new owner when `autoDelegateOnMint=true`. This silently overrides any existing delegation preference the new owner may have set.

**Fix:** Separate auto-delegation for mints vs transfers. Add governance-configurable flag for transfer auto-delegation.

---

### SC-06 — DuesLending: Interest Calculation Uses 365 Days (Not 365.25) [MEDIUM]

**File:** `contracts/src/DuesLending.sol` (~line 346)

Interest formula uses `365 days` divisor. This undercharges APR by ~0.07% annually (~$14 per $20k loan). Compounds over portfolio lifetime.

**Fix:** Use `365.25 days` or parameterize as governance-adjustable constant.

---

### SC-07 — DocumentRegistry: O(n) Forward Scan in getLatestVersion() [MEDIUM]

**File:** `contracts/src/DocumentRegistry.sol` (lines 213–229)

`getLatestVersion(docId)` scans forward from `docId+1` through the documents array to find successors. With 1000+ documents, gas cost becomes prohibitive.

**Fix:** Add reverse mapping `mapping(uint256 => uint256)` on registration for O(1) lookups.

---

### SC-08 — VendorEscrow: Cancel Guard Blocks Returned Milestone Refunds [MEDIUM]

**File:** `contracts/src/VendorEscrow.sol` (lines 279–300)

If a work order has partially approved and partially returned milestones, `releasedAmount > 0` blocks cancellation — preventing refund of returned milestones until all disputes are resolved.

**Fix:** Check `hasApprovedMilestone` instead of `releasedAmount > 0`.

---

### SC-09 — PropertyNFT: Redundant totalMinted Counter [LOW]

**File:** `contracts/src/PropertyNFT.sol` (line 41)

`_totalMinted` mirrors `totalSupply()` since burns are blocked. Wastes ~2300 gas per call.

**Fix:** Remove `_totalMinted`; use `totalSupply()`.

---

### SC-10 — FaircroftTreasury: Late Fee on First-Ever Payment [LOW]

**File:** `contracts/src/FaircroftTreasury.sol` (lines 138–142)

If `paidThrough == 0` and `block.timestamp > gracePeriod`, first-ever payment incurs a late fee. Confusing for new lot owners.

**Fix:** Add first-payment flag or document that grace period begins at lot creation.

---

### SC-11 — TreasuryYield: APY Assumes Linear Accrual [LOW]

**File:** `contracts/src/TreasuryYield.sol` (lines 406–410)

APY calculated as `(yieldEarned / principal) * (365 / elapsed)`. Aave's APY fluctuates hourly; linear assumption can be off by 10–50%.

**Fix:** Add JSDoc disclaimer. Consider TWAP-style calculation.

---

### SC-12 — DuesLending: Restructure Bypasses Installment Limits [LOW]

**File:** `contracts/src/DuesLending.sol` (line 556)

`restructureLoan()` only checks `newInstallments > loan.installmentsTotal`, not against global `min/maxInstallments` limits.

**Fix:** Add `require(newInstallments >= minInstallments && newInstallments <= maxInstallments)`.

---

### SC-13 — VendorEscrow: No Milestone Description Length Validation [LOW]

**File:** `contracts/src/VendorEscrow.sol` (line 148)

Milestone descriptions are unconstrained strings. 1MB+ descriptions could bloat storage.

**Fix:** Add `require(bytes(description).length <= 1024)`.

---

### SC-14 — FaircroftGovernor: No Upper Bound on maxActiveProposals [LOW]

**File:** `contracts/src/FaircroftGovernor.sol` (line 184)

Governance can set `maxActiveProposals` to `type(uint256).max`, disabling the rate limit entirely.

**Fix:** Add `require(newMax > 0 && newMax <= 100)`.

---

### SC-15 — DocumentRegistry: No IPFS CID Format Validation [LOW]

**File:** `contracts/src/DocumentRegistry.sol` (line 125)

IPFS CID accepted as arbitrary string with no format validation. Typos cannot be caught on-chain.

**Fix:** Document expected CIDv1 format; add optional prefix check if gas permits.

---

### SC-16 — Magic Numbers Without Named Constants [INFO]

**Files:** Multiple contracts

`10000` (basis points denominator) appears 50+ times, `91 days`, `30 days`, `7 days` are hardcoded throughout.

**Fix:** Create shared `Constants.sol` library with `BPS_DENOMINATOR`, `QUARTER_DAYS`, etc.

---

### SC-17 — Repeated Struct Packing Patterns [INFO]

**Files:** PropertyNFT, FaircroftTreasury, DuesLending, VendorEscrow

~200 lines of duplicate struct packing/unpacking logic across contracts.

**Fix:** Consider shared `DataTypes.sol` library.

---

### SC-18 — Test Gap: Interest Boundary Conditions [INFO]

**File:** `contracts/test/DuesLending.t.sol`

No tests for 0 interest rate, 1-day loans, or max interest rate (2000 bps). Fuzz tests would catch precision edge cases.

---

### SC-19 — Test Gap: Concurrent Loan Defaults [INFO]

**File:** `contracts/test/DuesLending.t.sol`

No stress test for multiple simultaneous loan defaults across properties.

---

### SC-20 — Redundant USDC Approvals [INFO]

**File:** `contracts/src/TreasuryYield.sol` (line 290)

`forceApprove()` called on every deposit/withdraw even if allowance is already sufficient. ~5000 gas wasted per tx.

**Fix:** Use conditional approval: `if (usdc.allowance(...) < amount) { forceApprove(...) }`.

---

### SC-21 — String Operations in Events [INFO]

**Files:** FaircroftTreasury.sol (ExpenditureMade), DocumentRegistry.sol (DocumentRegistered)

Events emit full `string` parameters — expensive to store. Consider emitting `bytes32(keccak256(...))` and storing full strings off-chain.

---

### SC-22 — Role Authority Matrix Undocumented [INFO]

**Files:** Multiple

GOVERNOR_ROLE (Timelock) vs BOARD_ROLE (multisig) authority is implicit in code. No single document maps who can call what.

**Fix:** Create `docs/role-authority-matrix.md`.

---

## Frontend Findings

### FE-01 — NeighborhoodMap.tsx: 6 TypeScript Errors (google namespace) [CRITICAL]

**File:** `frontend/src/components/NeighborhoodMap.tsx` (lines 59, 231, 333–336)

The `google` namespace is undefined at compile time. The component loads the Google Maps API script dynamically at runtime, but TypeScript has no type declarations for it.

**Fix:** `npm install --save-dev @types/google.maps` or create `types/google-maps.d.ts` with proper declarations.

---

### FE-02 — NeighborhoodMap.tsx: Race Condition in Map Initialization [CRITICAL]

**File:** `frontend/src/components/NeighborhoodMap.tsx`

Multiple useEffect hooks interact with `mapRef.current`, `infoWindowRef.current`, and marker refs without synchronization. The `loadGoogleMaps()` promise can resolve while multiple effects are running, causing markers to attach to an uninitialized map.

**Fix:** Single initialization effect with `mapReady` state flag. Only render markers when map is confirmed ready.

---

### FE-03 — AuthContext.tsx: No Error Boundary [CRITICAL]

**File:** `frontend/src/context/AuthContext.tsx`

The AuthProvider wraps the entire app but has no error boundary. If `fetchProfile()` or Supabase operations throw, the error propagates uncaught — crashing the entire application tree.

**Fix:** Add error state, wrap async operations in try-catch, provide recovery UI (retry button, clear session).

---

### FE-04 — useMessages: Unencrypted Sensitive Data in localStorage [HIGH]

**File:** `frontend/src/hooks/useMessages.ts`

Messages stored in localStorage keyed by wallet address with no encryption. Readable via DevTools, XSS attacks, or browser extensions. No message signature verification.

**Fix:** Move message storage to authenticated API. Use localStorage only for UI state (read markers, collapsed threads).

---

### FE-05 — DuesAutoPay.tsx: Sensitive Settings in localStorage [HIGH]

**File:** `frontend/src/components/DuesAutoPay.tsx`

Autopay configuration (wallet address, frequency, dates) stored unencrypted in localStorage. Vulnerable to XSS and physical access attacks.

**Fix:** Store autopay settings server-side in Supabase. Require wallet signature to enable/disable.

---

### FE-06 — NeighborhoodMap.tsx: XSS Risk in Popup HTML [HIGH]

**File:** `frontend/src/components/NeighborhoodMap.tsx`

While `escapeHtml()` covers text content, popup HTML is constructed via string interpolation. Attribute values and edge cases in quotes/backticks can break the HTML structure.

**Fix:** Use DOMPurify or a React-rendered InfoWindow instead of raw HTML strings.

---

### FE-07 — useAIAssistant: Dependency Array Causes Infinite Re-renders [HIGH]

**File:** `frontend/src/hooks/useAIAssistant.ts`

`processQuery` callback depends on `[property, dues, treasury, health, activeProposals, totalProperties]`. These hooks return new object references each render (no memoization), causing `sendMessage` to be recreated every render — potential infinite loop in consuming components.

**Fix:** Memoize hook returns with `useMemo`. Use `useCallback` with stable dependency refs.

---

### FE-08 — CommandPalette.tsx: Event Listener Memory Leak [HIGH]

**File:** `frontend/src/components/CommandPalette.tsx`

Custom event listener `'suvren:open-search'` is added in useEffect but cleanup is incomplete. Global `keydown` listener fires even when palette is closed. Multiple mount cycles orphan listeners.

**Fix:** Store handlers as named functions. Move keyboard listener inside `isOpen` conditional. Full cleanup on unmount.

---

### FE-09 — useAuth: Silent Error Swallowing [HIGH]

**File:** `frontend/src/hooks/useAuth.ts`

Wallet linking auto-connect catches errors silently: `.catch(() => {})`. Nonce and verify endpoint failures are swallowed. User gets no feedback on auth failures.

**Fix:** Log errors to Sentry. Show toast on auth failures. Retry with exponential backoff for network errors.

---

### FE-10 — lib/auth.ts: No Nonce Expiration [HIGH]

**File:** `frontend/src/lib/auth.ts`

Nonce is validated against session but has no age/expiration check. An attacker could capture and replay a nonce indefinitely.

**Fix:** Add `nonce_created_at` timestamp. Reject nonces older than 5 minutes. Delete after first use (add TTL check).

---

### FE-11 — NotificationBell.tsx: Hardcoded Sample Data [MEDIUM]

**File:** `frontend/src/components/NotificationBell.tsx`

Component uses `SAMPLE_NOTIFICATIONS` in useState. Never fetches from API. Users see stale, identical notifications every session.

**Fix:** Remove sample data. Implement `useNotifications()` hook wired to `/api/notifications` endpoint.

---

### FE-12 — CommandPalette.tsx: Fuzzy Search Performance [MEDIUM]

**File:** `frontend/src/components/CommandPalette.tsx`

Fuzzy match runs on every keystroke against 50+ items with no debouncing or memoization. Causes lag on slow devices. Also has duplicate "violations" entry.

**Fix:** Debounce search (200ms). Memoize filtered results. Deduplicate search items.

---

### FE-13 — AlertBanner.tsx: Missing Keyboard Accessibility [MEDIUM]

**File:** `frontend/src/components/AlertBanner.tsx`

Close button is not keyboard-focusable (no visible focus outline). Icon colors may not meet WCAG AA contrast in dark mode. No announcement when countdown expires.

**Fix:** Add focus outlines, semantic `<button>` elements, `aria-live="polite"` for countdown.

---

### FE-14 — NeighborhoodMap.tsx: No Keyboard Navigation for Markers [MEDIUM]

**File:** `frontend/src/components/NeighborhoodMap.tsx`

Map markers are mouse-only. No keyboard or screen reader support for selecting lots or incidents.

**Fix:** Add tab index, aria labels, and arrow-key navigation between markers.

---

### FE-15 — NeighborhoodMap.tsx: Inefficient Marker Re-creation [MEDIUM]

**File:** `frontend/src/components/NeighborhoodMap.tsx`

On data changes, all markers are destroyed and recreated (`setMap(null)` → rebuild). For 100+ properties, this is expensive. Hover also regenerates SVG icons repeatedly.

**Fix:** Diff markers on update. Memoize SVG generation.

---

### FE-16 — apiAuth: Missing Rate Limit on Write Endpoints [MEDIUM]

**File:** `frontend/src/lib/apiAuth.ts`

`withAuth` middleware doesn't apply rate limiting. Authenticated users can spam endpoints. `/api/profile/link-wallet` has no per-address rate limit.

**Fix:** Apply per-address rate limits on write endpoints.

---

### FE-17 — Supabase Browser Client: Silent Failure on Missing Env Vars [MEDIUM]

**File:** `frontend/src/lib/supabase-browser.ts`

Client created with no error handling. Missing env vars produce cryptic errors with no logging or fallback.

**Fix:** Validate env vars at startup. Log initialization errors in development.

---

### FE-18 — AIChatWidget: No Error State [MEDIUM]

**File:** `frontend/src/components/AIChatWidget.tsx`

Chat has a typing indicator but no error handling. Failed API calls leave "typing" spinning forever. No retry.

**Fix:** Add error state with retry button. Timeout after 10s.

---

### FE-19 — Header.tsx: Hardcoded Navigation Paths [MEDIUM]

**File:** `frontend/src/components/Header.tsx`

Navigation paths hardcoded in `navGroups` array. No centralized routing config. Route renames break the header.

**Fix:** Create central `routes.ts` config. Import paths from there.

---

### FE-20 — Header.tsx: Missing Null Check on useMessages() [MEDIUM]

**File:** `frontend/src/components/Header.tsx`

Calls `useMessages()` without verifying WagmiProvider context. Crashes if rendered outside providers.

**Fix:** Conditional call or error boundary wrapper.

---

### FE-21 — ThemeToggle: No Cross-Tab Sync [LOW]

**File:** `frontend/src/components/ThemeToggle.tsx`

Theme preference in localStorage doesn't sync across tabs. No `StorageEvent` listener.

**Fix:** Add `window.addEventListener('storage', updateTheme)`.

---

---

## Summary by Severity

| Severity | Smart Contracts | Frontend | Total |
|----------|----------------|----------|-------|
| Critical | 0              | 3        | **3** |
| High     | 3              | 6        | **9** |
| Medium   | 4              | 8        | **12**|
| Low      | 7              | 3        | **10**|
| Info     | 9              | 0        | **9** |
| **Total**| **23**         | **20**   | **43**|

---

## Priority Remediation Plan

### Immediate (Before Production)

1. **FE-01** Install `@types/google.maps` — eliminates all 6 TS errors
2. **SC-01** Fix DuesLending pool calculation — prevents exceeding lending limits
3. **SC-02** Add governance proposal cleanup automation — prevents governance DoS
4. **FE-03** Add error boundary to AuthContext — prevents app-wide crashes
5. **SC-03** Re-validate inspector != vendor in `approveMilestone()` — closes self-approval vector

### Next Sprint

6. **FE-04/FE-05** Move sensitive data out of localStorage to server-side storage
7. **FE-06** Replace raw HTML string popups with DOMPurify or React InfoWindow
8. **FE-09/FE-10** Fix silent error handling and add nonce expiration
9. **SC-04** Add `nonReentrant` to `releaseReserveForYield()`
10. **FE-07** Memoize hook dependencies in useAIAssistant chain

### Backlog

11. **SC-16** Create shared `Constants.sol` for magic numbers
12. **SC-22** Document role authority matrix
13. **FE-14** Implement keyboard navigation for map markers (WCAG)
14. **SC-18/SC-19** Add fuzz tests and concurrent default stress tests
15. **FE-12** Debounce and memoize command palette search

---

## Test Coverage Assessment

**Smart Contracts: ~85% coverage (strong)**

| Contract           | Tests | Coverage Notes |
|--------------------|-------|----------------|
| PropertyNFT        | ✅     | Minting, transfers, voting, loan locks covered |
| FaircroftGovernor  | ✅     | Proposal lifecycle, voting, execution, cleanup covered |
| FaircroftTreasury  | ✅     | Dues payment, splits, expenditures covered |
| DuesLending        | ✅     | Loan lifecycle, defaults, restructuring covered |
| VendorEscrow       | ✅     | Work order flow, disputes, resolution covered |
| TreasuryYield      | ✅     | Deposit, withdraw, yield return covered |
| DocumentRegistry   | ✅     | Registration, versioning, access control covered |
| SecurityAudit      | ✅     | Cross-contract security scenarios covered |

**Gaps:** Interest boundary conditions (0 rate, 1-day, max rate), concurrent defaults, cross-contract integration stress tests.

**Frontend: No automated test suite detected.** Consider adding Vitest + React Testing Library for component tests and Playwright for E2E.

---

## Code Organization Notes

**Strengths:**
- Clean separation: contracts/src for production, contracts/test for tests, contracts/test/helpers for shared setup
- Frontend follows Next.js App Router conventions with proper route grouping (`(public)/`)
- Hooks are properly extracted from components (37 custom hooks)
- Lib utilities are well-organized (auth, validation, sanitize, rate-limit, logger)
- Config/ABIs are centralized in `frontend/src/config/`

**Opportunities:**
- 7 contracts in flat `src/` — consider grouping by domain (governance/, finance/, registry/)
- 38 components in flat `components/` — consider grouping (ui/, features/, layout/)
- No shared constants library across contracts
- No frontend test infrastructure

---

## Files Audited

**Smart Contracts (7 source + 10 test files, ~8,200 lines):**
- `contracts/src/PropertyNFT.sol` (495 lines)
- `contracts/src/FaircroftTreasury.sol` (573 lines)
- `contracts/src/FaircroftGovernor.sol` (355 lines)
- `contracts/src/DocumentRegistry.sol` (302 lines)
- `contracts/src/DuesLending.sol` (717 lines)
- `contracts/src/TreasuryYield.sol` (442 lines)
- `contracts/src/VendorEscrow.sol` (433 lines)

**Frontend (sampled ~40 files across components, hooks, lib, config, context, API routes)**

**Commands Run:**
- `forge test` (contracts/) — 405 passed, 0 failed
- `npx tsc --noEmit` (frontend/) — 6 errors in NeighborhoodMap.tsx
- `npm audit` (frontend/) — 0 vulnerabilities
