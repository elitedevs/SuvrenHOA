# SuvrenHOA — Audit Fix Plan v3

**Created:** 2026-04-07
**Target:** Product Hunt launch May 1, 2026
**Sources:** Sentinel Security Audit v3, Code Audit Report v2, Design Audit V10 (39.5/60), Marketing/SEO Audit (22/100)

---

## Summary

| Phase | Name | Items | Effort | Deadline |
|-------|------|-------|--------|----------|
| 0 | Emergency | 3 | S | Immediately |
| 1 | Launch Blockers | 8 | M–L | Before May 1 |
| 2 | Security | 12 | L | Before real users |
| 3 | Code Quality | 22 | L | Sprint after launch |
| 4 | Polish | 8 | M | Ongoing |
| **Total** | | **53** | | |

**Effort key:** S = <1 hr, M = 1–4 hrs, L = 4–16 hrs

---

## Phase 0 — Emergency (Do Right Now)

These must be done before any other work. Credentials are live in git history.

| # | Finding | Severity | Effort | File(s) | Fix |
|---|---------|----------|--------|---------|-----|
| 0.1 | C-01 | CRITICAL | S | Supabase Dashboard | Rotate Supabase service role key and anon key in Supabase Dashboard → Settings → API. Update Vercel/Docker env vars with new keys. Old keys in git history grant full RLS-bypass DB access. |
| 0.2 | C-01 / H-04 | CRITICAL / HIGH | S | Supabase Dashboard, Google Cloud Console, Upstash Dashboard | Rotate ALL other exposed credentials: session secret (generate 64-char crypto-random), Google Maps API key, Upstash Redis tokens, Sentry DSN. Update all deployment env vars. |
| 0.3 | C-01 | CRITICAL | S | `.gitignore`, git history | Run `git filter-branch --tree-filter 'rm -f frontend/.env.local' -- --all` (or BFG Repo-Cleaner) to purge `.env.local` from all history. Force-push. Verify `.gitignore` entry is present. |

---

## Phase 1 — Launch Blockers (Must Fix Before May 1 Product Hunt)

These block a functional public launch. Without them suvren.co is either broken or trivially exploitable.

| # | Finding | Severity | Effort | File(s) | Fix |
|---|---------|----------|--------|---------|-----|
| 1.1 | Design/SEO Audit | CRITICAL | L | Deployment infra (DNS, Docker, Vercel) | **suvren.co serves login SPA on ALL routes — no marketing pages live.** The xrpburner Docker build contains the full marketing site but suvren.co isn't pointing at it. Fix: update DNS/reverse-proxy/Vercel config so suvren.co serves the xrpburner Docker build. Verify marketing pages, meta tags, and OG images render. |
| 1.2 | Infra | CRITICAL | M | Supabase Dashboard, `supabase/migrations/` | Run Supabase migrations 001–004 and 007–009 on production. Migration 009 blocks newsletter signup. Verify with `supabase db diff` after each migration. |
| 1.3 | Infra | HIGH | S | Vercel/Docker env vars | Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production environment. Without these, rate limiter falls back to in-memory (see 1.6). |
| 1.4 | C-03 | CRITICAL | M | `frontend/src/app/api/founding/[id]/route.ts` | Admin founding endpoint uses Supabase OAuth instead of SIWE `withAuth`. Any Supabase user can approve/reject applications. Fix: replace auth with `withAuth` wrapper, verify board membership via on-chain governance token or wallet-based lookup, add audit logging. |
| 1.5 | C-04 | CRITICAL | M | `frontend/src/app/api/board-check/route.ts`, `frontend/src/app/api/founding/apply/route.ts`, 20+ other API routes | Production error messages expose table names, column names, constraint names. Fix: create shared `handleDbError(error, context)` utility that logs to Sentry and returns generic `{ error: "Internal server error" }` to clients. Retrofit all API routes. |
| 1.6 | H-01 | HIGH | M | `frontend/src/lib/rate-limit.ts` (lines 74–92) | In-memory fallback in serverless = no rate limiting. Fix: fail closed in production — if Upstash is unavailable, return `503 Service Unavailable`. Add health monitoring for Redis connection. Keep in-memory fallback for local dev only (`NODE_ENV === 'development'`). |
| 1.7 | FE-03 | CRITICAL | M | `frontend/src/context/AuthContext.tsx` | AuthProvider wraps entire app with no error boundary. Any throw in `fetchProfile()` crashes the full component tree. Fix: add error state + try-catch in all async ops. Render recovery UI (retry button, clear session) on error. |
| 1.8 | FE-01 | CRITICAL | S | `frontend/package.json` | 6 TypeScript errors in NeighborhoodMap.tsx from missing `google` namespace. Fix: `npm install --save-dev @types/google.maps`. Kills all 6 TS errors in one shot. |

---

## Phase 2 — Security (Fix Before Any Real Users)

These are exploitable vulnerabilities that must be patched before the platform handles real communities or funds.

| # | Finding | Severity | Effort | File(s) | Fix |
|---|---------|----------|--------|---------|-----|
| 2.1 | C-02 | CRITICAL | L | `contracts/src/DuesLending.sol` (lines ~343–349), `contracts/src/FaircroftTreasury.sol` | DuesLending declares `IFaircroftTreasury` with functions (`withdrawForLoan`, `payDuesFor`, `depositFromLoan`) that don't exist on Treasury. Entire lending module reverts. Fix: align interface with actual Treasury function signatures OR add the expected functions to Treasury. Redeploy contracts. Update tests. |
| 2.2 | H-02 | HIGH | M | `frontend/src/app/api/announcements/route.ts` (POST, lines 34–54) | Any authenticated user can create board announcements and self-assign `author_role: 'Board'`. Fix: verify board membership before allowing POST. Hard-code `author_role` from DB lookup, never accept from user input. |
| 2.3 | H-03 | HIGH | M | `frontend/src/app/api/architectural/route.ts` (PATCH, lines 53–72) | Any authenticated user can approve/reject architectural requests, including their own. Fix: add board/committee membership verification. Prevent self-review (submitter ≠ reviewer). |
| 2.4 | H-04 | HIGH | S | `frontend/src/lib/auth.ts` (lines 12–19), env vars | Session secret is `faircroft-dao-local-dev-secret-key-32chars`. Fix: already rotated in Phase 0 — verify new secret is 64-char crypto-random and deployed to all environments. Add session rotation on privilege-escalating actions. |
| 2.5 | H-05 | HIGH | M | `contracts/src/VendorEscrow.sol` (lines 257–261, 306–313) | Refunds from escrow always credit `operatingBalance` even when originally funded from reserve. Fix: add `sourceFund` field to work order struct. Create `creditRefundFromEscrow(uint256 amount, bool isReserve)` that routes to correct fund. |
| 2.6 | H-06 | HIGH | M | `frontend/src/app/api/founding/[id]/route.ts` (lines 27–44) | IDOR: any board member can approve/reject ANY founding application by enumerating UUIDs. Fix: enforce per-community authorization via Supabase RLS policies. Add audit logging for all approval/rejection actions. |
| 2.7 | H-07 / L-04 | HIGH | M | `frontend/src/app/api/founding/apply/route.ts` (lines 62–73, 80–84) | User-supplied fields (`contact_name`, `contact_email`, `role`, `pain_points`) interpolated into HTML email without escaping. Fix: use React Email or Handlebars with auto-escaping. At minimum, escape all user input with HTML entity encoding before interpolation. |
| 2.8 | H-08 / SC-02 | HIGH | M | `contracts/src/FaircroftGovernor.sol` (lines 125–157, 195–203) | `activeProposalCount` only decrements on execute/cancel/cleanup. Expired/defeated proposals without cleanup permanently consume slots → governance DoS at `maxActiveProposals`. Fix: auto-decrement on state transitions (Defeated, Expired). Add governance-only manual resync function. Emit events on every counter change. |
| 2.9 | H-09 | HIGH | S | `frontend/docker-compose.yml` | Supabase keys and session secrets hardcoded in compose file. Fix: use Docker secrets or `.env` file references. Remove all inline secret values from compose. |
| 2.10 | H-10 | HIGH | M | `frontend/next.config.ts` | CSP allows `'unsafe-inline'` and `'unsafe-eval'` — nullifies XSS protection. Fix: remove both. Use nonces or hashes for inline scripts. Refactor any `eval()` usage. Test thoroughly — CSP changes can break dynamic imports. |
| 2.11 | FE-10 | HIGH | S | `frontend/src/lib/auth.ts` | Nonce has no expiration. Replay attacks possible indefinitely. Fix: add `nonce_created_at` timestamp. Reject nonces older than 5 minutes. Delete after first use. |
| 2.12 | SC-03 | HIGH | S | `contracts/src/VendorEscrow.sol` (line 145) | Inspector self-approval gap: constructor checks `inspector != vendor` but `approveMilestone()` does not. Fix: add `require(msg.sender != wo.vendor)` in `approveMilestone()`. |

---

## Phase 3 — Code Quality (Sprint After Launch)

Bugs, edge cases, and medium/low findings that affect correctness and maintainability.

### 3A — Smart Contract Fixes

| # | Finding | Severity | Effort | File(s) | Fix |
|---|---------|----------|--------|---------|-----|
| 3.1 | SC-01 / M-02 | HIGH / MEDIUM | M | `contracts/src/DuesLending.sol` (~line 420, lines 217–228) | Pool calculation uses shrinking denominator; `totalOutstanding` not decremented on partial payments. Fix: calculate pool as `((treasury.reserveBalance() + totalOutstanding) * 1500) / 10000`. Decrement `totalOutstanding` proportionally in `makePayment()`. |
| 3.2 | SC-04 | MEDIUM | S | `contracts/src/FaircroftTreasury.sol` (line 265) | `releaseReserveForYield()` missing `nonReentrant`. Fix: add the modifier. |
| 3.3 | SC-05 | MEDIUM | S | `contracts/src/PropertyNFT.sol` (lines 320–325) | Auto-delegation on transfer overrides user's existing delegation. Fix: separate auto-delegation for mints vs transfers. |
| 3.4 | SC-06 | MEDIUM | S | `contracts/src/DuesLending.sol` (~line 346) | Interest uses 365 days not 365.25. Fix: use `365.25 days` or governance-adjustable constant. |
| 3.5 | SC-07 / L-01 / L-02 | MEDIUM / LOW | M | `contracts/src/DocumentRegistry.sol` (lines 141–171, 213–229) | O(n) forward scan in `getLatestVersion()` and `getDocumentsByType()`. Fix: add reverse mapping `mapping(uint256 => uint256)` for O(1) lookups. Add pagination parameters. |
| 3.6 | SC-08 | MEDIUM | S | `contracts/src/VendorEscrow.sol` (lines 279–300) | Cancel guard blocks refund of returned milestones. Fix: check `hasApprovedMilestone` instead of `releasedAmount > 0`. |
| 3.7 | M-01 | MEDIUM | S | `contracts/src/PropertyNFT.sol` (lines 177–183) | Soulbound protection removable in single governance cycle. Fix: add minimum cooldown between role grant and setter activation. |
| 3.8 | M-03 | MEDIUM | S | `contracts/src/DocumentRegistry.sol` (lines 153–156) | `supersedes=0` ambiguity. Fix: use sentinel value `type(uint48).max` for "no supersession". |
| 3.9 | SC-09 | LOW | S | `contracts/src/PropertyNFT.sol` (line 41) | Redundant `_totalMinted` counter. Fix: remove; use `totalSupply()`. |
| 3.10 | SC-10 | LOW | S | `contracts/src/FaircroftTreasury.sol` (lines 138–142) | Late fee on first-ever payment. Fix: add first-payment flag or document grace period starts at lot creation. |
| 3.11 | SC-11 | LOW | S | `contracts/src/TreasuryYield.sol` (lines 406–410) | APY assumes linear accrual. Fix: add JSDoc disclaimer, consider TWAP-style calculation. |
| 3.12 | SC-12 | LOW | S | `contracts/src/DuesLending.sol` (line 556) | Restructure bypasses installment limits. Fix: add `require(newInstallments >= minInstallments && newInstallments <= maxInstallments)`. |
| 3.13 | SC-13 | LOW | S | `contracts/src/VendorEscrow.sol` (line 148) | No milestone description length limit. Fix: `require(bytes(description).length <= 1024)`. |
| 3.14 | SC-14 | LOW | S | `contracts/src/FaircroftGovernor.sol` (line 184) | No upper bound on `maxActiveProposals`. Fix: `require(newMax > 0 && newMax <= 100)`. |
| 3.15 | SC-15 | LOW | S | `contracts/src/DocumentRegistry.sol` (line 125) | No IPFS CID format validation. Fix: document expected CIDv1 format; add optional prefix check. |

### 3B — Frontend Fixes

| # | Finding | Severity | Effort | File(s) | Fix |
|---|---------|----------|--------|---------|-----|
| 3.16 | FE-02 | CRITICAL | M | `frontend/src/components/NeighborhoodMap.tsx` | Race condition in map initialization — multiple useEffects interact with mapRef unsynchronized. Fix: single initialization effect with `mapReady` state flag. Render markers only when map is confirmed ready. |
| 3.17 | FE-04 / FE-05 | HIGH | M | `frontend/src/hooks/useMessages.ts`, `frontend/src/components/DuesAutoPay.tsx` | Sensitive data (messages, autopay config) in unencrypted localStorage. Fix: move to authenticated Supabase storage. Use localStorage only for UI state (read markers, collapsed threads). |
| 3.18 | FE-06 | HIGH | M | `frontend/src/components/NeighborhoodMap.tsx` | XSS risk in popup HTML via string interpolation. Fix: use DOMPurify on all popup content or replace with React-rendered InfoWindow. |
| 3.19 | FE-07 | HIGH | M | `frontend/src/hooks/useAIAssistant.ts` | Dependency array causes infinite re-renders — hooks return new refs each render. Fix: memoize hook returns with `useMemo`, use `useCallback` with stable deps. |
| 3.20 | FE-08 | HIGH | S | `frontend/src/components/CommandPalette.tsx` | Event listener memory leak — incomplete cleanup, global keydown fires when closed. Fix: store handlers as named functions, move keyboard listener inside `isOpen` conditional, full cleanup on unmount. |
| 3.21 | FE-09 | HIGH | S | `frontend/src/hooks/useAuth.ts` | Silent error swallowing on wallet linking, nonce, verify. Fix: log to Sentry, show toast on auth failures, retry with exponential backoff for network errors. |

### 3C — Medium Frontend / Infra Findings

| # | Finding | Severity | Effort | File(s) | Fix |
|---|---------|----------|--------|---------|-----|
| 3.22 | M-04 | MEDIUM | S | `frontend/src/lib/supabase-middleware.ts` (lines 8–27) | Prefix-based public route matching can accidentally expose subroutes. Fix: use exact path matching or explicit route trees. |
| 3.23 | M-05 / M-06 | MEDIUM | S | `frontend/src/app/api/founding/apply/route.ts`, `frontend/src/app/api/surveys/route.ts` | TOCTOU race on founding apps and survey votes. Fix: add UNIQUE constraints (`contact_email`; `survey_id, wallet_address`) and handle `unique_violation` errors. |
| 3.24 | M-07 | MEDIUM | S | All API routes | No CORS OPTIONS handlers → preflight returns 405. Fix: add OPTIONS handlers returning 204 with CORS headers to key endpoints. |
| 3.25 | M-08 | MEDIUM | S | `frontend/src/app/api/founding/[id]/route.ts` (line 60) | Email in URL parameters. Fix: use signed JWT token in invite URL instead of raw email. |
| 3.26 | M-09 | MEDIUM | S | `frontend/src/app/api/auth/nonce/route.ts` | Auth nonce rate limit too permissive (30/min vs 5/min for verify). Fix: apply `RATE_LIMITS.strict` to all auth endpoints. |
| 3.27 | M-10 | MEDIUM | S | `frontend/src/lib/validation.ts` | Generic 5000-char limit on all string fields. Fix: define per-field limits (titles: 200, posts: 2000, announcements: 5000). |
| 3.28 | M-11 | MEDIUM | S | Google Cloud Console | Google Maps API key exposed client-side via `NEXT_PUBLIC_` prefix. Fix: apply HTTP referrer restrictions and per-day quotas in Google Cloud Console. |
| 3.29 | M-12 | MEDIUM | S | `frontend/sentry.client.config.ts` | Session replay sampling in production may capture sensitive data. Fix: review rate, mask sensitive fields, reduce to error-only captures. |
| 3.30 | M-13 | MEDIUM | S | `frontend/src/app/api/vehicles/route.ts`, other routes | Query params parsed with `parseInt()` without validation. Fix: validate all query params with Zod. |
| 3.31 | M-14 | MEDIUM | S | `contracts/script/Deploy.s.sol`, `contracts/script/DeployMainnet.s.sol` | Deployment scripts missing contract verification. Fix: add `--verify` flag and Etherscan/Basescan API keys to deployment workflow. |
| 3.32 | M-15 | MEDIUM | M | All API routes using `supabaseAdmin` | Many routes bypass RLS entirely via service role client. Fix: use user's Supabase session wherever possible. Reserve `supabaseAdmin` for genuinely elevated operations only. |
| 3.33 | FE-11 | MEDIUM | M | `frontend/src/components/NotificationBell.tsx` | Hardcoded sample notifications. Fix: implement `useNotifications()` hook wired to `/api/notifications`. |
| 3.34 | FE-12 | MEDIUM | S | `frontend/src/components/CommandPalette.tsx` | Fuzzy search on every keystroke, no debounce. Fix: debounce 200ms, memoize results, deduplicate items. |
| 3.35 | FE-15 | MEDIUM | M | `frontend/src/components/NeighborhoodMap.tsx` | All markers destroyed/recreated on data change. Fix: diff markers on update, memoize SVG generation. |
| 3.36 | FE-16 | MEDIUM | S | `frontend/src/lib/apiAuth.ts` | `withAuth` doesn't apply rate limiting. Fix: add per-address rate limits on write endpoints. |
| 3.37 | FE-17 | MEDIUM | S | `frontend/src/lib/supabase-browser.ts` | Silent failure on missing env vars. Fix: validate at startup, log initialization errors. |
| 3.38 | FE-18 | MEDIUM | S | `frontend/src/components/AIChatWidget.tsx` | No error state in AI chat. Fix: add error state with retry button, timeout after 10s. |
| 3.39 | FE-19 | MEDIUM | S | `frontend/src/components/Header.tsx` | Hardcoded nav paths. Fix: create central `routes.ts`, import paths from there. |
| 3.40 | FE-20 | MEDIUM | S | `frontend/src/components/Header.tsx` | Missing null check on `useMessages()`. Fix: conditional call or error boundary wrapper. |

---

## Phase 4 — Polish (Ongoing)

Design audit scored 39.5/60 — target 52+/60. Marketing/SEO audit scored 22/100 — root cause is deployment (Phase 1.1).

| # | Finding | Severity | Effort | File(s) | Fix |
|---|---------|----------|--------|---------|-----|
| 4.1 | Design Audit | MEDIUM | M | `frontend/src/app/not-found.tsx` (create) | Custom 404 page — currently returns default Next.js 404. Create branded 404 with navigation back to dashboard. |
| 4.2 | Design Audit | MEDIUM | M | Multiple components | Mobile responsiveness pass — audit flagged breakpoint issues on dashboard cards, sidebar collapse, and map container. Test all pages at 375px, 768px, 1024px. |
| 4.3 | Design Audit | MEDIUM | M | Multiple components | Loading skeletons — replace spinner/blank states with skeleton components for dashboard, property list, announcements, and governance pages. |
| 4.4 | Design Audit | LOW | M | `frontend/src/components/` | Typography and spacing consistency — audit flagged inconsistent heading sizes, card padding, and button styles across pages. Create/enforce design tokens. |
| 4.5 | FE-13 | MEDIUM | S | `frontend/src/components/AlertBanner.tsx` | Missing keyboard accessibility. Fix: add focus outlines, semantic `<button>`, `aria-live="polite"` for countdown. |
| 4.6 | FE-14 | MEDIUM | M | `frontend/src/components/NeighborhoodMap.tsx` | Map markers are mouse-only. Fix: add tabindex, aria labels, arrow-key navigation between markers. |
| 4.7 | FE-21 | LOW | S | `frontend/src/components/ThemeToggle.tsx` | Theme doesn't sync across tabs. Fix: add `window.addEventListener('storage', updateTheme)`. |
| 4.8 | L-03 | LOW | S | `contracts/src/FaircroftTreasury.sol` (lines 40–41) | YIELD_MANAGER_ROLE can move reserve without governance vote. Fix: consider governance approval for releases exceeding configurable threshold. |

---

## Informational / Tech Debt (No Deadline)

These are improvements, not bugs. Address as time permits.

| # | Finding | Severity | Effort | File(s) | Fix |
|---|---------|----------|--------|---------|-----|
| TD.1 | I-01 | INFO | M | All API routes, Supabase | Add `audit_logs` table with user, action, resource, timestamp. Create middleware to log sensitive operations. |
| TD.2 | I-02 | INFO | M | All public API routes | Add OpenAPI/Swagger docs or JSDoc for rate limits and expected inputs. |
| TD.3 | I-03 | INFO | S | `contracts/src/FaircroftTreasury.sol` | Add per-transaction or per-epoch caps on lending withdrawals at Treasury level. |
| TD.4 | I-04 | INFO | S | `.github/workflows/ci.yml` | Add `npm audit --audit-level=high` to CI pipeline. Consider Dependabot or Snyk. |
| TD.5 | L-05 | LOW | M | Various API routes | Inconsistent error handling patterns. Fix: create shared `handleDbError()` (overlaps with 1.5). |
| TD.6 | L-06 | LOW | S | `frontend/src/lib/rate-limit.ts` | No `X-RateLimit-*` response headers. Fix: include rate limit metadata in all responses. |
| TD.7 | SC-16 | INFO | M | Multiple contracts | Magic numbers without named constants. Fix: create shared `Constants.sol` with `BPS_DENOMINATOR`, etc. |
| TD.8 | SC-17 | INFO | M | PropertyNFT, Treasury, DuesLending, VendorEscrow | ~200 lines of duplicate struct packing. Fix: consider shared `DataTypes.sol` library. |
| TD.9 | SC-18 / SC-19 | INFO | M | `contracts/test/DuesLending.t.sol` | Test gaps: interest boundary conditions, concurrent loan defaults. Fix: add fuzz tests for 0 rate / 1-day / max rate. Add stress test for simultaneous defaults. |
| TD.10 | SC-20 | INFO | S | `contracts/src/TreasuryYield.sol` (line 290) | Redundant USDC approvals every tx. Fix: conditional `forceApprove()` only when allowance insufficient. |
| TD.11 | SC-21 | INFO | S | FaircroftTreasury.sol, DocumentRegistry.sol | String operations in events are expensive. Fix: emit `bytes32(keccak256(...))` and store full strings off-chain. |
| TD.12 | SC-22 | INFO | M | `docs/` (create) | Role authority matrix undocumented. Fix: create `docs/role-authority-matrix.md` mapping GOVERNOR_ROLE vs BOARD_ROLE. |

---

## Cross-Reference: Finding IDs to Fix Plan Items

| Audit Source | Finding ID | Fix Plan Item |
|-------------|------------|---------------|
| Sentinel v3 | C-01 | 0.1, 0.2, 0.3 |
| Sentinel v3 | C-02 | 2.1 |
| Sentinel v3 | C-03 | 1.4 |
| Sentinel v3 | C-04 | 1.5 |
| Sentinel v3 | H-01 | 1.6 |
| Sentinel v3 | H-02 | 2.2 |
| Sentinel v3 | H-03 | 2.3 |
| Sentinel v3 | H-04 | 2.4 |
| Sentinel v3 | H-05 | 2.5 |
| Sentinel v3 | H-06 | 2.6 |
| Sentinel v3 | H-07 | 2.7 |
| Sentinel v3 | H-08 | 2.8 |
| Sentinel v3 | H-09 | 2.9 |
| Sentinel v3 | H-10 | 2.10 |
| Sentinel v3 | M-01 | 3.7 |
| Sentinel v3 | M-02 | 3.1 |
| Sentinel v3 | M-03 | 3.8 |
| Sentinel v3 | M-04 | 3.22 |
| Sentinel v3 | M-05 | 3.23 |
| Sentinel v3 | M-06 | 3.23 |
| Sentinel v3 | M-07 | 3.24 |
| Sentinel v3 | M-08 | 3.25 |
| Sentinel v3 | M-09 | 3.26 |
| Sentinel v3 | M-10 | 3.27 |
| Sentinel v3 | M-11 | 3.28 |
| Sentinel v3 | M-12 | 3.29 |
| Sentinel v3 | M-13 | 3.30 |
| Sentinel v3 | M-14 | 3.31 |
| Sentinel v3 | M-15 | 3.32 |
| Sentinel v3 | L-01 | 3.5 |
| Sentinel v3 | L-02 | 3.5 |
| Sentinel v3 | L-03 | 4.8 |
| Sentinel v3 | L-04 | 2.7 |
| Sentinel v3 | L-05 | TD.5 |
| Sentinel v3 | L-06 | TD.6 |
| Sentinel v3 | I-01 | TD.1 |
| Sentinel v3 | I-02 | TD.2 |
| Sentinel v3 | I-03 | TD.3 |
| Sentinel v3 | I-04 | TD.4 |
| Code Audit v2 | SC-01 | 3.1 |
| Code Audit v2 | SC-02 | 2.8 |
| Code Audit v2 | SC-03 | 2.12 |
| Code Audit v2 | SC-04 | 3.2 |
| Code Audit v2 | SC-05 | 3.3 |
| Code Audit v2 | SC-06 | 3.4 |
| Code Audit v2 | SC-07 | 3.5 |
| Code Audit v2 | SC-08 | 3.6 |
| Code Audit v2 | SC-09 | 3.9 |
| Code Audit v2 | SC-10 | 3.10 |
| Code Audit v2 | SC-11 | 3.11 |
| Code Audit v2 | SC-12 | 3.12 |
| Code Audit v2 | SC-13 | 3.13 |
| Code Audit v2 | SC-14 | 3.14 |
| Code Audit v2 | SC-15 | 3.15 |
| Code Audit v2 | SC-16 | TD.7 |
| Code Audit v2 | SC-17 | TD.8 |
| Code Audit v2 | SC-18 | TD.9 |
| Code Audit v2 | SC-19 | TD.9 |
| Code Audit v2 | SC-20 | TD.10 |
| Code Audit v2 | SC-21 | TD.11 |
| Code Audit v2 | SC-22 | TD.12 |
| Code Audit v2 | FE-01 | 1.8 |
| Code Audit v2 | FE-02 | 3.16 |
| Code Audit v2 | FE-03 | 1.7 |
| Code Audit v2 | FE-04 | 3.17 |
| Code Audit v2 | FE-05 | 3.17 |
| Code Audit v2 | FE-06 | 3.18 |
| Code Audit v2 | FE-07 | 3.19 |
| Code Audit v2 | FE-08 | 3.20 |
| Code Audit v2 | FE-09 | 3.21 |
| Code Audit v2 | FE-10 | 2.11 |
| Code Audit v2 | FE-11 | 3.33 |
| Code Audit v2 | FE-12 | 3.34 |
| Code Audit v2 | FE-13 | 4.5 |
| Code Audit v2 | FE-14 | 4.6 |
| Code Audit v2 | FE-15 | 3.35 |
| Code Audit v2 | FE-16 | 3.36 |
| Code Audit v2 | FE-17 | 3.37 |
| Code Audit v2 | FE-18 | 3.38 |
| Code Audit v2 | FE-19 | 3.39 |
| Code Audit v2 | FE-20 | 3.40 |
| Code Audit v2 | FE-21 | 4.7 |
| Design Audit V10 | — | 4.1–4.6 |
| Marketing/SEO Audit | — | 1.1 |

---

*Total unique items: 53 fixes + 12 tech debt items = 65 action items across 4 audits.*
*All 82 original findings from Sentinel v3 (39) and Code Audit v2 (43) are accounted for above.*
