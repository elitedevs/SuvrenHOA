# Sentinel Security Audit v3 — SuvrenHOA (Faircroft DAO)

**Date:** 2026-04-07
**Auditor:** Sentinel Adversarial Security Engine
**Scope:** Smart Contracts, Frontend (Next.js), Infrastructure
**Codebase:** faircroft-dao @ HEAD
**Previous Audits:** v1, v2 — all Critical/High findings reportedly fixed
**Forge Tests:** 482/482 passing (0 failures, 0 skipped)

---

## Executive Summary

This v3 audit identified **39 new findings** across the full stack. The smart contract layer is well-defended with ReentrancyGuard, role-based access control, and comprehensive test coverage (482 tests). However, the frontend and infrastructure layers contain multiple Critical and High severity issues — most notably **committed credentials in version control**, **missing authorization on admin endpoints**, and **rate limiter bypass in distributed deployments**.

| Severity | Count |
|----------|-------|
| Critical | 4     |
| High     | 10    |
| Medium   | 15    |
| Low      | 6     |
| Info     | 4     |
| **Total**| **39**|

---

## Table of Contents

1. [Critical Findings](#critical-findings)
2. [High Findings](#high-findings)
3. [Medium Findings](#medium-findings)
4. [Low Findings](#low-findings)
5. [Informational Findings](#informational-findings)
6. [Confirmed Defenses](#confirmed-defenses)
7. [Forge Test Results](#forge-test-results)
8. [Remediation Priority](#remediation-priority)

---

## Critical Findings

### C-01: Credentials Committed to Version Control
- **Severity:** CRITICAL
- **File:** `frontend/.env.local`
- **Description:** The `.env.local` file is committed to git containing: Supabase service role key, Supabase anon key, Google Maps API key, session secret, Upstash Redis credentials, and Sentry DSN. The Supabase service role key bypasses Row Level Security entirely — possession of this key grants full read/write access to every table.
- **Impact:** Complete database compromise. Any contributor or person with repo access can extract production credentials. These persist in git history even after deletion.
- **Recommendation:**
  1. Remove `.env.local` from git history: `git filter-branch --tree-filter 'rm -f frontend/.env.local' -- --all`
  2. Verify `.env.local` is in `.gitignore` (currently present but file was committed before the rule)
  3. **Rotate ALL exposed keys immediately** — Supabase service role, anon key, session secret, Upstash tokens
  4. Use deployment environment variables exclusively (Vercel env vars, Docker secrets)

### C-02: DuesLending ↔ Treasury Interface Mismatch — Entire Lending Module Non-Functional
- **Severity:** CRITICAL
- **File:** `contracts/src/DuesLending.sol` (interface declarations, lines ~343-349)
- **Description:** DuesLending declares an `IFaircroftTreasury` interface with three functions (`withdrawForLoan`, `payDuesFor`, `depositFromLoan`) that do not exist on the actual FaircroftTreasury contract. The Treasury implements entirely different function signatures for these operations.
- **Impact:** Every call to `requestLoan()`, `makePayment()`, and `payOffLoan()` will revert at the interface boundary. The lending module is completely non-functional as deployed. The SecurityAudit.t.sol test confirms this finding (test_SC01_DuesLending_TreasuryInterfaceMismatch).
- **Recommendation:** Align the IFaircroftTreasury interface in DuesLending.sol with the actual FaircroftTreasury public function signatures, OR add the expected functions to FaircroftTreasury.

### C-03: Missing Authorization on Admin Founding Endpoint
- **Severity:** CRITICAL
- **File:** `frontend/src/app/api/founding/[id]/route.ts` (lines 8-26)
- **Description:** The PATCH endpoint to approve/reject founding applications authenticates via Supabase OAuth (email/password), not via the SIWE wallet authentication used everywhere else. Any user with a Supabase account can potentially reach the update logic. The board_member role check is insufficient — it relies on a different auth mechanism than the rest of the application.
- **Impact:** Unauthorized approval of founding communities, privilege escalation, inconsistent auth boundary.
- **Recommendation:** Use consistent SIWE authentication (`withAuth` wrapper) across all admin endpoints. Verify board membership via on-chain governance token or wallet-address-based board member lookup. Add audit logging.

### C-04: Production Error Messages Leak Database Schema
- **Severity:** CRITICAL
- **Files:** `frontend/src/app/api/board-check/route.ts`, `frontend/src/app/api/founding/apply/route.ts`, and 20+ other API routes
- **Description:** Many API routes conditionally return database error messages based on `NODE_ENV`. However, several routes leak raw Supabase/Postgres errors unconditionally in production. Error messages expose table names, column names, constraint names, and query structure.
- **Impact:** Attackers can enumerate the database schema, discover table relationships, and craft targeted SQL injection or IDOR attacks.
- **Recommendation:** Always return generic error messages. Log detailed errors server-side via the existing Sentry integration. Create a shared `handleDbError()` utility for consistent error handling.

---

## High Findings

### H-01: Rate Limit Bypass via In-Memory Fallback in Distributed Deployment
- **Severity:** HIGH
- **File:** `frontend/src/lib/rate-limit.ts` (lines 74-92)
- **Description:** The rate limiter falls back to an in-memory token bucket when Upstash Redis is unconfigured. In Vercel's serverless environment, each function instance maintains its own independent bucket. An attacker distributing requests across instances effectively faces no rate limit. The warning is only logged in production, with no alerting mechanism.
- **Impact:** Complete rate limit bypass enabling brute-force, spam, newsletter abuse, and auth endpoint flooding.
- **Recommendation:** Fail closed in production — if Upstash Redis is unavailable, return 503 Service Unavailable. Add health monitoring for the Redis connection.

### H-02: Any Authenticated User Can Create Board Announcements
- **Severity:** HIGH
- **File:** `frontend/src/app/api/announcements/route.ts` (POST endpoint, lines 34-54)
- **Description:** The POST endpoint uses `withAuth` to verify the user is authenticated, but never checks if they are a board member. Any authenticated resident can create announcements and self-assign `author_role: 'Board'`, since the role field is accepted from user input.
- **Impact:** Impersonation of board members, malicious announcements, social engineering within the community.
- **Recommendation:** Verify board membership before allowing POST. Hard-code `author_role` from database lookup, never accept it from user input.

### H-03: Any Authenticated User Can Approve Architectural Requests
- **Severity:** HIGH
- **File:** `frontend/src/app/api/architectural/route.ts` (PATCH endpoint, lines 53-72)
- **Description:** The PATCH endpoint allows any authenticated user to review and approve/reject architectural requests. No board member or committee check is performed. Users can approve their own requests.
- **Impact:** Authorization bypass, unapproved construction/modifications, liability exposure.
- **Recommendation:** Add board/committee membership verification. Prevent self-review (submitter cannot be reviewer).

### H-04: Session Secret Exposed and Weak
- **Severity:** HIGH
- **File:** `frontend/.env.local`, `frontend/src/lib/auth.ts` (lines 12-19)
- **Description:** The session secret committed to git is `faircroft-dao-local-dev-secret-key-32chars` — a human-readable, low-entropy string at the minimum 32-char threshold. Iron-session uses this to sign/encrypt session cookies. With this secret, an attacker can forge arbitrary sessions and impersonate any user.
- **Impact:** Complete session forgery, user impersonation, privilege escalation to any role.
- **Recommendation:** Rotate immediately. Use a cryptographically random 64-character secret. Implement session rotation on sensitive actions.

### H-05: VendorEscrow Refunds Bypass Treasury Fund Accounting
- **Severity:** HIGH
- **File:** `contracts/src/VendorEscrow.sol` (lines 257-261, 306-313)
- **Description:** When disputes are resolved against the vendor or work orders are cancelled, the contract calls `treasury.creditFromEscrow()` which credits `operatingBalance`. If the escrow was originally funded from reserve, the refund lands in the wrong fund category. Reserve balance tracking becomes permanently incorrect.
- **Impact:** Governance cannot accurately report reserve availability. Over time, reserve funds silently migrate to operating, undermining the financial model.
- **Recommendation:** Track the source fund (reserve vs. operating) in the work order struct. Create a `creditRefundFromEscrow()` function that routes refunds to the correct fund.

### H-06: IDOR on Founding Application Review
- **Severity:** HIGH
- **File:** `frontend/src/app/api/founding/[id]/route.ts` (lines 27-44)
- **Description:** The PATCH endpoint accepts `params.id` from the URL and updates the corresponding founding application without verifying the reviewer has specific access to that application. Any board member can approve/reject ANY application by enumerating UUIDs.
- **Impact:** Unauthorized modification of application statuses across community boundaries.
- **Recommendation:** Use Supabase RLS policies to enforce per-community authorization. Add audit logging for all approval/rejection actions.

### H-07: HTML Injection in Admin Notification Emails
- **Severity:** HIGH
- **File:** `frontend/src/app/api/founding/apply/route.ts` (lines 62-73)
- **Description:** User-supplied fields (`contact_name`, `contact_email`, `role`, `pain_points`) are interpolated directly into HTML email templates without escaping. The `pain_points` array is joined without sanitization. An attacker can inject arbitrary HTML, including phishing links, into emails sent to administrators.
- **Impact:** Targeted phishing of board members via official system emails, credential theft, social engineering.
- **Recommendation:** Use a template engine with auto-escaping (Handlebars, React Email). At minimum, escape all user input with HTML entity encoding.

### H-08: Governor activeProposalCount Desynchronization Risk
- **Severity:** HIGH
- **File:** `contracts/src/FaircroftGovernor.sol` (lines 125-157)
- **Description:** The `activeProposalCount` is decremented with `if (activeProposalCount > 0)` guards in state transition callbacks. On L2 chains where async state transitions can occur, race conditions could desynchronize the counter. If the counter reaches 0 incorrectly, proposal creation is permanently DoS'd (blocked by `maxActiveProposals` check).
- **Impact:** Denial of service on governance — no new proposals can be created.
- **Recommendation:** Add a governance-only function to manually resync the counter. Emit events on every counter change for off-chain monitoring.

### H-09: Hardcoded Secrets in Docker Compose
- **Severity:** HIGH
- **File:** `frontend/docker-compose.yml`
- **Description:** Environment variables including Supabase keys and session secrets are hardcoded directly in the docker-compose file. These are visible in `docker inspect`, build logs, and container image layers.
- **Impact:** Secret exposure via container inspection, CI logs, or image registry access.
- **Recommendation:** Use Docker secrets, `.env` file references, or external secret managers. Never embed secrets in compose files.

### H-10: Insufficient Content Security Policy
- **Severity:** HIGH
- **File:** `frontend/next.config.ts`
- **Description:** The CSP header permits `'unsafe-inline'` and `'unsafe-eval'` for scripts. This nullifies the primary XSS protection that CSP provides. A single XSS vector can execute arbitrary JavaScript despite the CSP being present.
- **Impact:** XSS containment failure, supply chain attack amplification.
- **Recommendation:** Remove `'unsafe-inline'` and `'unsafe-eval'`. Use nonces or hashes for inline scripts. Refactor any code relying on `eval()`.

---

## Medium Findings

### M-01: Soulbound NFT Protection Removable via Single Governance Cycle
- **Severity:** MEDIUM
- **File:** `contracts/src/PropertyNFT.sol` (lines 177-183)
- **Description:** `setTransfersRequireApproval(false)` requires `SOULBOUND_ADMIN_ROLE` (two-proposal gate: first grant role, then call setter). However, once the role is granted, the setter can be called in the next proposal with only the standard Timelock delay. No additional cooldown prevents rapid removal of soulbound protections.
- **Recommendation:** Add a minimum cooldown period between role grant and setter activation.

### M-02: DuesLending totalOutstanding Not Decremented on Partial Payments
- **Severity:** MEDIUM
- **File:** `contracts/src/DuesLending.sol` (lines 217-228)
- **Description:** `makePayment()` does not decrement `totalOutstanding`. It only decreases in `_settleLoan()` when the loan is fully paid. This causes `totalOutstanding` to over-report actual outstanding debt after partial payments, making `_loanPoolAvailable()` inaccurate.
- **Impact:** Loan pool availability calculation becomes wrong — may block valid borrowers or allow excess lending.
- **Recommendation:** Decrement `totalOutstanding` proportionally with each payment.

### M-03: DocumentRegistry supersedes=0 Ambiguity
- **Severity:** MEDIUM
- **File:** `contracts/src/DocumentRegistry.sol` (lines 153-156)
- **Description:** The `supersedes` field uses 0 to mean "no supersession" (original document). The `getLatestVersion()` logic assumes all version chains start with `supersedes > 0`, creating fragile lookup behavior for single-version documents.
- **Recommendation:** Use a sentinel value (e.g., `type(uint48).max`) for "no supersession" to make the state explicit.

### M-04: Middleware Public Route Short-Circuit Uses Prefix Matching
- **Severity:** MEDIUM
- **File:** `frontend/src/lib/supabase-middleware.ts` (lines 8-27)
- **Description:** Public routes are matched with `pathname.startsWith(route + '/')`. This prefix-based matching means adding `/api/profile` to publicRoutes would also make `/api/profile/link-wallet` public. A developer error in the publicRoutes list could accidentally expose protected subroutes.
- **Recommendation:** Use exact path matching or explicit route trees. Require protected routes to declare themselves explicitly rather than relying on implicit exclusion.

### M-05: Race Condition on Founding Application Deduplication
- **Severity:** MEDIUM
- **File:** `frontend/src/app/api/founding/apply/route.ts` (lines 45-51)
- **Description:** Duplicate check (SELECT then INSERT) is vulnerable to TOCTOU — concurrent requests can both pass the existence check and insert duplicates.
- **Recommendation:** Use a database UNIQUE constraint on `contact_email` and handle the unique_violation error gracefully.

### M-06: Race Condition on Survey Vote Deduplication
- **Severity:** MEDIUM
- **File:** `frontend/src/app/api/surveys/route.ts` (lines 74-79)
- **Description:** Survey vote deduplication uses SELECT-then-INSERT, vulnerable to the same TOCTOU race as M-05. Users can vote multiple times by racing concurrent requests.
- **Recommendation:** Add UNIQUE constraint on `(survey_id, wallet_address)` in `hoa_survey_responses`.

### M-07: No CORS Preflight (OPTIONS) Handlers
- **Severity:** MEDIUM
- **File:** All API routes
- **Description:** No routes implement OPTIONS handlers. While `next.config.ts` sets CORS headers, OPTIONS preflight requests return 405 before headers middleware runs, causing CORS failures for browser clients.
- **Recommendation:** Add OPTIONS handlers to key endpoints returning 204 with appropriate CORS headers.

### M-08: Email Address Exposed in URL Parameters
- **Severity:** MEDIUM
- **File:** `frontend/src/app/api/founding/[id]/route.ts` (line 60)
- **Description:** Founding invite links encode the recipient's email in a URL query parameter. Email addresses in URLs are logged in server access logs, browser history, referrer headers, and analytics.
- **Recommendation:** Use a signed JWT token instead of raw email in the invite URL.

### M-09: Auth Nonce Endpoint Rate Limit Too Permissive
- **Severity:** MEDIUM
- **File:** `frontend/src/app/api/auth/nonce/route.ts`
- **Description:** The nonce endpoint uses `RATE_LIMITS.write` (30/min) while verify uses `RATE_LIMITS.strict` (5/min). The 6:1 ratio allows nonce enumeration and replay preparation far faster than verification.
- **Recommendation:** Apply `RATE_LIMITS.strict` to all auth endpoints.

### M-10: Insufficient String Length Validation
- **Severity:** MEDIUM
- **File:** `frontend/src/lib/validation.ts`
- **Description:** The generic `nonEmptyStr` validator allows up to 5000 characters. Fields like post titles, announcement bodies, and survey options all share this generous limit. Malicious users can submit excessive content causing database bloat and UI rendering issues.
- **Recommendation:** Define per-field length limits (e.g., titles: 200 chars, posts: 2000 chars, announcements: 5000 chars).

### M-11: Google Maps API Key Exposed Client-Side
- **Severity:** MEDIUM
- **File:** `frontend/.env.example` (NEXT_PUBLIC_GOOGLE_MAPS_KEY)
- **Description:** The Google Maps API key is prefixed with `NEXT_PUBLIC_`, making it available in the client-side JavaScript bundle. It's visible in browser DevTools and page source.
- **Impact:** API quota exhaustion, geolocation data scraping by unauthorized parties.
- **Recommendation:** Apply HTTP referrer restrictions in the Google Cloud Console. Set per-API and per-day quotas. Monitor usage for anomalies.

### M-12: Sentry Session Replay Sampling in Production
- **Severity:** MEDIUM
- **File:** `frontend/sentry.client.config.ts`
- **Description:** Session replay is configured with non-zero sampling in production. Depending on the rate, this could capture sensitive user interactions including wallet addresses, form inputs, and financial data.
- **Recommendation:** Review replay sampling rate. Ensure all sensitive fields are masked in the Sentry replay configuration. Disable replay in production or reduce to error-only captures.

### M-13: Insufficient Vehicle/Pet Query Parameter Validation
- **Severity:** MEDIUM
- **File:** `frontend/src/app/api/vehicles/route.ts` (lines 17-18), other API routes
- **Description:** GET endpoints accept query parameters and cast to integers with `parseInt()` without validation. `parseInt('abc')` returns `NaN`, which silently produces incorrect Supabase queries.
- **Recommendation:** Validate query parameters with Zod before use.

### M-14: Deployment Script Missing Contract Verification
- **Severity:** MEDIUM
- **File:** `contracts/script/Deploy.s.sol`, `contracts/script/DeployMainnet.s.sol`
- **Description:** Deployment scripts deploy contracts but may not automatically verify them on block explorers. Unverified contracts reduce transparency and make it harder for the community to audit on-chain behavior.
- **Recommendation:** Add `--verify` flag to forge deployment commands. Include Etherscan/Basescan API keys in deployment workflow.

### M-15: No Database RLS Enforcement Validation
- **Severity:** MEDIUM
- **File:** `backend/schema.sql`, all API routes using `supabaseAdmin`
- **Description:** Many API routes use `supabaseAdmin` (service role) which bypasses RLS entirely. If any route has an auth bypass vulnerability, the attacker gets unrestricted database access. There's no defense-in-depth at the database layer.
- **Recommendation:** Use the user's Supabase session (`supabase-server.ts`) wherever possible instead of `supabaseAdmin`. Reserve admin client for operations that genuinely require elevated privileges.

---

## Low Findings

### L-01: DocumentRegistry getDocumentsByType Unbounded O(n) Loop
- **Severity:** LOW
- **File:** `contracts/src/DocumentRegistry.sol` (lines 141-155)
- **Description:** `getDocumentsByType()` iterates through ALL documents twice (count + collect). For an HOA with thousands of documents, this risks hitting block gas limits on view calls.
- **Recommendation:** Implement pagination parameters or maintain a per-type index mapping. Acceptable at current HOA scale (<10K documents).

### L-02: DocumentRegistry getLatestVersion Forward-Scan Inefficiency
- **Severity:** LOW
- **File:** `contracts/src/DocumentRegistry.sol` (lines 158-171)
- **Description:** `getLatestVersion()` scans forward from a given docId to find the next replacement. Long version chains result in O(n) per query with no caching.
- **Recommendation:** Add a reverse mapping `mapping(uint256 => uint256)` for O(1) version chain traversal.

### L-03: YIELD_MANAGER_ROLE Can Move Reserve Without Governance Vote
- **Severity:** LOW
- **File:** `contracts/src/FaircroftTreasury.sol` (lines 40-41)
- **Description:** The `YIELD_MANAGER_ROLE` can call `releaseReserveForYield()` and `creditYieldReturn()`, moving reserve funds without per-transaction governance approval. If the TreasuryYield contract is compromised, reserve could be extracted.
- **Recommendation:** Consider governance approval for reserve releases exceeding a configurable threshold (e.g., >10% of total reserve).

### L-04: Incomplete HTML Sanitization in Founding Email
- **Severity:** LOW
- **File:** `frontend/src/app/api/founding/apply/route.ts` (lines 80-84)
- **Description:** Pain points array is joined and inserted into HTML email body without entity escaping. While Zod validates max length, HTML special characters pass through.
- **Recommendation:** Apply HTML entity escaping to all user-supplied values before email interpolation.

### L-05: Inconsistent Error Handling Patterns Across API Routes
- **Severity:** LOW
- **File:** Various API routes
- **Description:** Some routes check `NODE_ENV === 'production'` to suppress error details, others leak errors unconditionally. No shared error handling utility exists.
- **Recommendation:** Create a shared `handleDbError(error, context)` utility. Log to Sentry, return generic messages to clients in all environments.

### L-06: No Rate Limit Response Headers
- **Severity:** LOW
- **File:** `frontend/src/lib/rate-limit.ts`, all API routes
- **Description:** Rate-limited responses don't include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, or `X-RateLimit-Reset` headers. Clients have no way to implement backoff or understand limits.
- **Recommendation:** Include rate limit metadata in response headers for all endpoints.

---

## Informational Findings

### I-01: No Audit Logging for Sensitive Operations
- **Severity:** INFO
- **File:** All API routes
- **Description:** No audit trail exists for sensitive operations (founding approvals, architectural reviews, announcement creation, board member actions). Forensic investigation of incidents is not possible.
- **Recommendation:** Log to a dedicated `audit_logs` Supabase table with user, action, resource, and timestamp.

### I-02: Missing API Documentation on Public Endpoints
- **Severity:** INFO
- **File:** All public API routes
- **Description:** Public endpoints lack rate limit documentation and usage guidelines. External integrators have no way to understand constraints.
- **Recommendation:** Add OpenAPI/Swagger documentation or at minimum JSDoc comments documenting rate limits and expected inputs.

### I-03: LENDING_ROLE Has Broad Treasury Access
- **Severity:** INFO
- **File:** `contracts/src/DuesLending.sol`, `contracts/src/FaircroftTreasury.sol`
- **Description:** The DuesLending contract (granted `LENDING_ROLE`) can call `withdrawForLoan()`, `payDuesFor()`, and `depositFromLoan()` repeatedly. A bug in DuesLending could drain the reserve through the lending interface.
- **Recommendation:** Consider adding per-transaction or per-epoch caps on lending withdrawals at the Treasury level.

### I-04: No Dependency Audit in CI Pipeline
- **Severity:** INFO
- **File:** `.github/workflows/ci.yml`
- **Description:** The CI pipeline does not run `npm audit` or `snyk` to check for known vulnerabilities in npm dependencies. The project uses wagmi, viem, supabase, and many other packages that receive regular CVE disclosures.
- **Recommendation:** Add `npm audit --audit-level=high` to the CI pipeline. Consider integrating Dependabot or Snyk for automated dependency monitoring.

---

## Confirmed Defenses

The following security mechanisms were verified as correctly implemented:

| Defense | Status | Notes |
|---------|--------|-------|
| ReentrancyGuard on all fund-movement functions | ✅ Confirmed | All payDues, withdraw, deposit functions are `nonReentrant` |
| Loan-lock prevents NFT transfer during active loan | ✅ Confirmed | PropertyNFT._update() checks `loanLocked[tokenId]` |
| Timestamp-based clock (EIP-6372) for L2 | ✅ Confirmed | Correct for Base L2 where block.number is unreliable |
| Inspector ≠ Vendor check in VendorEscrow | ✅ Confirmed | SC-11 fix verified: `if (inspector == vendor) revert` |
| Restructured loan payment acceptance | ✅ Confirmed | SC-04 fix verified: makePayment() accepts Restructured status |
| Risk cap uses total reserve (not shrinking) | ✅ Confirmed | SC-06 fix verified: uses reserveBalance + depositedAmount |
| Abstain votes in quorum denominator | ✅ Confirmed | SC-07 fix verified: totalCast includes abstainVotes |
| Governor propose() enforces maxActiveProposals | ✅ Confirmed | Override correctly catches all proposal paths |
| HSTS with preload enabled | ✅ Confirmed | next.config.ts headers |
| X-Frame-Options: DENY | ✅ Confirmed | Prevents clickjacking |
| Timelock (2-day delay) for governance | ✅ Confirmed | TimelockController with 48hr minimum delay |
| Input validation with Zod schemas | ✅ Confirmed | All POST/PATCH routes validate request bodies |
| Sanitization library present | ✅ Confirmed | lib/sanitize.ts with DOMPurify |

---

## Forge Test Results

```
Forge test executed: 2026-04-07
Command: cd contracts && forge test --summary

Result: ALL TESTS PASSING

Total Tests: 482
Passed:      482
Failed:        0
Skipped:       0

Suite Breakdown:
  DuesLendingTest .............. 88 passed (incl. 4 fuzz tests)
  VendorEscrowTest ............. 79 passed (incl. 1 fuzz test)
  TreasuryYieldTest ............ 69 passed
  PropertyNFTTest .............. 47 passed
  FaircroftGovernorTest ........ 37 passed
  FaircroftTreasuryTest ........ 28 passed
  DocumentRegistryTest ......... 27 passed
  SecurityAuditTest ............ 13 passed
  GovernanceLifecycleTest ....... 7 passed
  LendingFlowTest ............... 6 passed
  TreasuryYieldAaveFailureTest .. 4 passed

Execution time: ~271ms
```

---

## Remediation Priority

### Week 1 — Immediate (Critical + High)
1. **Rotate all credentials** exposed in `.env.local` git history (C-01)
2. **Remove `.env.local` from git history** with `git filter-branch` (C-01)
3. **Fix DuesLending ↔ Treasury interface** — lending module is non-functional (C-02)
4. **Add board member authorization** to founding PATCH, announcements POST, architectural PATCH (C-03, H-02, H-03)
5. **Standardize error handling** — never leak DB errors to clients (C-04)
6. **Generate and deploy new session secret** (H-04)
7. **Fix rate limiter** to fail closed when Redis unavailable (H-01)
8. **Add fund-source tracking** to VendorEscrow refunds (H-05)
9. **Remove hardcoded secrets** from docker-compose.yml (H-09)
10. **Harden CSP** — remove unsafe-inline and unsafe-eval (H-10)

### Month 1 — High Priority (Medium)
11. Fix all TOCTOU race conditions with database UNIQUE constraints (M-05, M-06)
12. Add per-field validation length limits (M-10)
13. Apply strict rate limits to all auth endpoints (M-09)
14. Restrict Google Maps API key by referrer (M-11)
15. Add OPTIONS handlers for CORS preflight (M-07)
16. Switch API routes to user Supabase session where possible (M-15)
17. Add contract verification to deployment scripts (M-14)
18. Validate all query parameters with Zod (M-13)

### Quarter 1 — Hardening (Low + Info)
19. Add audit logging table and middleware (I-01)
20. Add `npm audit` to CI pipeline (I-04)
21. Implement rate limit response headers (L-06)
22. Add pagination to DocumentRegistry view functions (L-01, L-02)
23. Add per-epoch caps on lending withdrawals (I-03)

---

*End of Sentinel Security Audit v3*
