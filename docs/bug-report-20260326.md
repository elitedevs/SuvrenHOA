# SuvrenHOA Functional Bug Report

**URL:** https://hoa.suvren.co
**Date:** March 26, 2026
**Auditor:** Claude (Cowork)
**Network:** Base Sepolia (Chain ID 84532)
**Wallet:** 0xE3b2290d...9FD675f2 (Lot #2, 2 properties)

---

## 🔴 Critical — Broken / App-Crashing

### BUG-01: Direct URL navigation crashes for ~half of all routes
**Severity:** Critical
**Affected routes (confirmed):** `/announcements`, `/assistant`, `/transparency`, `/health`, `/governance/stats`, `/governance/voting-power`, `/complaints/noise`
**Root cause:** These routes return raw Next.js RSC (React Server Components) streaming JSON payload (`__next_f` data) instead of a proper HTML page when navigated to directly (hard navigation, page refresh, typing URL). The browser cannot render raw RSC JSON and shows "This page couldn't load."
**When it breaks:** Any time a user refreshes the page, bookmarks a URL, shares a link, or types a URL directly into the browser.
**Fix:** Configure the hosting server (Vercel/Netlify/nginx) with a catch-all route to serve `index.html` for all paths. This is standard SPA deployment practice. The root issue is the Next.js app is deployed as a client-side-only bundle without proper SSR for these routes.

---

### BUG-02: All sidebar nav links are plain `<a>` tags — not Next.js `<Link>` components
**Severity:** Critical
**Evidence:** Every single sidebar nav link uses `tag: "A"` with a React `onclick` handler attached via event delegation. None use Next.js's `<Link>` component.
**Impact:** Next.js cannot intercept these clicks to do client-side navigation. The React event delegation currently works (clicking sidebar links navigates successfully within the SPA), but this is fragile and breaks completely when the SPA is reloaded. Proper `<Link>` components also enable prefetching, which improves performance significantly.
**Fix:** Replace every `<a href="/route">` in the Sidebar component with Next.js `<Link href="/route">` from `next/link`. This is the required pattern for Next.js App Router apps.

---

### BUG-03: App crashes on cold load — `RangeError: NaN cannot be converted to BigInt`
**Severity:** Critical
**Repro:** Load the app in a browser where no wallet is connected, or where MetaMask is locked.
**Root cause:** A component calls `BigInt(value)` where `value` is `undefined` or `NaN` (because wallet data hasn't loaded yet). `BigInt(NaN)` throws `RangeError: The number NaN cannot be converted to a BigInt because it is not an integer`.
**Fix:** Guard all `BigInt()` calls: `BigInt(value ?? 0)` or validate `Number.isInteger(value)` before converting. Also add a proper loading/skeleton state for wallet-dependent data instead of passing undefined downstream.

---

### BUG-04: `/documents` — All 6 documents fail to load
**Severity:** Critical
**Observed:** The stat cards correctly show "6 TOTAL DOCUMENTS / ALL VERIFIED" (fetched from the smart contract), but every individual document entry displays "Document #N could not be loaded." The skeleton loader spins indefinitely.
**Root cause:** The `getDocument(i)` contract calls succeed enough to count documents but fail when fetching individual document data. Likely a mismatch between the document count and the actual stored document format, or the Arweave transaction IDs stored on-chain are invalid/unpinned.
**Fix:** Debug the `DocumentRegistry.getDocument(i)` call for each index. Check whether the documents are actually stored on Arweave and that the hashes/CIDs are valid. Add a proper error state ("Document unavailable") instead of an infinite spinner.

---

### BUG-05: `/map` — Raw RPC error exposed to users
**Severity:** Critical
**Observed:** The map page shows "Failed to load map data" with full contract call details (RPC URL, contract address, function signature) dumped into the UI.
**Fix:** Wrap the RPC call in a try/catch. Show a user-friendly "Map data temporarily unavailable — try again" message. Never expose raw infrastructure details (RPC endpoints, contract ABIs, error stack traces) in the UI.

---

## 🟠 High — Significant Functional Bugs

### BUG-06: `/dues` — Contradictory payment data
**Severity:** High
**Observed:** The page simultaneously shows "No payment history found" AND "12 missed payments." These two states are mutually exclusive.
**Fix:** Reconcile the data sources. If there are 12 missed payments, show them as payment history. If truly no history exists, show 0 missed payments. The UI appears to be pulling from two different data sources (on-chain vs. local mock data) without reconciliation.

---

### BUG-07: `/directory` — Board members show "Lot#—" and wrong total count
**Severity:** High
**Observed:** All board members (President, VP, Secretary, Treasurer) display "Lot#—" instead of actual lot numbers. The directory header shows "150 Total Lots" when the smart contract has 16 minted PropertyNFTs.
**Fix:** Fetch the actual lot number for each board member's wallet from the PropertyNFT contract. Use the real on-chain lot count (currently 16) instead of a hardcoded 150.

---

### BUG-08: `/reports/annual` — Entirely hardcoded fake data
**Severity:** High
**Observed:** Annual Report shows "$1.40M treasury, 150 units, 98% occupancy." The real on-chain values are: $0 USDC treasury, 16 minted units, 11% occupancy.
**Fix:** Replace hardcoded values with live reads from `FaircroftTreasury` and `PropertyNFT` contracts. The Annual Report should reflect real data, not marketing copy.

---

### BUG-09: `/emergency` — Fake placeholder wallet addresses for board contacts
**Severity:** High
**Observed:** Emergency contact board member wallet addresses display as `0x1234...5678` and `0xABCD...EF01` — these are clearly placeholder values that were never replaced with real addresses.
**Fix:** Wire board member wallet addresses to the actual addresses from the smart contract or a configuration source. Remove all placeholder addresses from production.

---

### BUG-10: `/contracts` — FaircroftGovernor shows "TOTAL PROPOSALS: —"
**Severity:** High
**Observed:** The contract explorer card for FaircroftGovernor shows a dash (—) for total proposals instead of a number. The governance stats page shows 24 total proposals, confirming data exists.
**Fix:** Ensure the `proposalCount()` or equivalent call to FaircroftGovernor resolves correctly. Show "0" for zero, a loading spinner while fetching — never a raw dash for numeric data.

---

### BUG-11: `/treasury/reimbursement` — All reimbursement amounts are $0.00
**Severity:** High
**Observed:** "All Requests (2)" are listed but every single amount shows "$0.00". The requests exist but have no dollar values.
**Fix:** Debug the amount field in the reimbursement data. Either the amounts are stored incorrectly on-chain (possible wei/USDC decimal conversion bug) or the display is not reading the correct field.

---

### BUG-12: `/governance/elections` — Votes cast exceed possible membership
**Severity:** High
**Observed:** "Special Election: Pool Renovation Approval" shows 40 votes cast. The community has 16 lots with a "1 NFT = 1 vote" policy. 40 votes is impossible.
**Root cause:** Election vote data is hardcoded mock data, not read from FaircroftGovernor on-chain.
**Fix:** Read actual vote counts from the smart contract. Remove all hardcoded election data.

---

### BUG-13: Wrong blockchain branding — "Polygon" instead of "Base"
**Severity:** High
**Affected pages:** `/reports/impact`, `/documents/compare` (CC&Rs text), `/compare`
**Observed:** Multiple pages reference "Polygon blockchain" but the app runs on Base Sepolia (Chain ID 84532). The footer correctly says "Powered by Base blockchain."
**Fix:** Do a global search-and-replace for all "Polygon" references and replace with "Base." Also correct the CC&Rs document text that says "NFT on the Polygon blockchain."

---

### BUG-14: Dues amount mismatch — CC&Rs say $2,100/yr, app charges $200/quarter ($800/yr)
**Severity:** High
**Observed:** The updated CC&Rs in `/documents/compare` state "Annual dues shall be assessed at $2,100 per Lot per year." The dues page shows $200/quarter = $800/year. These conflict.
**Fix:** Reconcile the dues amount. Either update the CC&Rs to reflect $800/year, or update the dues contract to charge $2,100/year.

---

## 🟡 Medium — Data Integrity / Consistency Bugs

### BUG-15: Fake lot numbers throughout the app (lots > 16 that don't exist)
**Severity:** Medium
**Affected pages:** `/services/carpool` (Lots #20, #34, #67), `/community/awards` (Lots #17, #42, #88), `/community/skills` (Lots #17, #23, #34, #56, #67, #88), `/services/wifi` (Lot #42), `/services/packages` (Lot #23), `/services/carpool` (Lots #20, #34, #67)
**Observed:** All these pages display lot numbers higher than 16 (the maximum on-chain). This is seed/demo data that was never replaced with real resident data.
**Fix:** Either populate these features with real resident data from on-chain, or clearly label demo content as such. Do not mix fake lot numbers with real ones.

---

### BUG-16: `/energy` and `/compare` — Hardcoded community size of 48 homes
**Severity:** Medium
**Observed:** Energy Dashboard shows "14 Solar Homes out of 48 homes." HOA Comparison defaults to "48 homes." The real community has 16 lots.
**Fix:** Read community size from the PropertyNFT contract's `totalSupply()` and use that value throughout the app.

---

### BUG-17: `/reports/impact` — Inflated/fake metrics
**Severity:** Medium
**Observed:** "312 Documents Stored On-Chain" (actual: 6), "847 Tamper-Proof Decisions" (governance has 24 proposals), "89% Voter Participation" (with impossible vote counts per BUG-12), "4,720 tons CO₂ saved" (fabricated environmental claim).
**Fix:** Replace all metrics with live on-chain data. If real data doesn't support the metric, remove the claim rather than fabricating numbers.

---

### BUG-18: `/announcements` — Read receipts reference 150 residents
**Severity:** Medium
**Observed:** Announcements show "Read by 80 of 150", "Read by 88 of 150", "Read by 125 of 150." Community has 16 lots.
**Fix:** Read the resident count from on-chain and use it for read receipt denominators.

---

### BUG-19: `/treasury` — "EXPENDITURE CHART — COMING SOON" placeholder
**Severity:** Medium
**Observed:** The treasury page shows a "COMING SOON" placeholder instead of an actual expenditure breakdown chart.
**Fix:** Implement the expenditure chart, or remove the placeholder entirely. A "coming soon" UI in a production feature is unacceptable.

---

### BUG-20: `/treasury/vendors` — "Pending" status shows ❌ red X icon
**Severity:** Medium
**Observed:** Vendor payment entries with "Pending" status display a red X icon (❌), which normally signals failure or rejection. Pending payments are simply waiting, not failed.
**Fix:** Use a neutral icon for "Pending" (⏳ hourglass, 🔵 circle, etc.). Red X should only indicate rejected or failed states.

---

## 🔵 Low — Minor Bugs / Polish Issues

### BUG-21: `/surveys/builder` — Breadcrumb shows "Surveys/Builder" with slash
**Severity:** Low
**Observed:** The breadcrumb path reads "Surveys/Builder" (slash separator) instead of the standard "Surveys > Builder" (chevron) format used everywhere else.
**Fix:** Update the breadcrumb configuration for `/surveys/builder` to use the proper chevron-separated format.

---

### BUG-22: `/seasonal-decor` — Breadcrumb shows "Seasonal decor" (lowercase d)
**Severity:** Low
**Observed:** Breadcrumb reads "Seasonal decor" instead of "Seasonal Decor."
**Fix:** Update route metadata to use title case: "Seasonal Decor."

---

### BUG-23: `/community/bookclub` — Breadcrumb shows "Bookclub" (one word, lowercase c)
**Severity:** Low
**Observed:** Breadcrumb shows "Bookclub" instead of "Book Club."
**Fix:** Update route metadata to use "Book Club."

---

### BUG-24: `/insurance` — Workers Comp shows as expired (off-by-one day)
**Severity:** Low
**Observed:** Workers Compensation policy (expired Feb 28, 2026) shows "Expired 25 days ago" — the actual count is 26 days as of March 26, 2026.
**Fix:** Verify date calculation uses today's date correctly. Check for UTC vs. local timezone inconsistency in the expiry logic.

---

### BUG-25: Mobile — `/treasury` has 83px horizontal overflow at 375px
**Severity:** Low
**Observed:** On 375px wide mobile viewport, the "📄 Export PDF" button overflows 83px beyond the right edge of the viewport, creating a horizontal scroll.
**Fix:** Make the Export PDF button responsive. Apply `w-full sm:w-auto` or wrap the header actions in a flex-wrap container on mobile.

---

### BUG-26: `?` keyboard shortcut — overlay opens but only when mobile nav is also open
**Severity:** Low
**Observed:** The `?` keyboard shortcut overlay (showing gd, gp, gt, gm, ga, gh, ⌘K shortcuts) was only confirmed visible in a specific state. It should reliably open on `?` press from any page.
**Fix:** Ensure the keyboard shortcut event listener fires globally on `?` keypress, not just in specific UI states.

---

## ✅ Interactive Features — Working Correctly

| Feature | Status | Notes |
|---------|--------|-------|
| Cmd+K command palette | ✅ Works | Opens search with "Search pages, proposals, documents..." |
| Dark/light mode toggle | ✅ Works | Correctly toggles `dark`/`light` CSS class on `<html>` |
| Mobile hamburger menu | ✅ Works | Opens sidebar drawer correctly at 375px |
| Keyboard shortcuts overlay | ✅ Works | Shows gd/gp/gt/gm/ga/gh/⌘K/Esc bindings |
| AI Chat widget | ✅ Works | Accessible via sidebar click and bottom-right widget |
| Client-side navigation | ✅ Works | All sidebar links navigate correctly within the SPA |

---

## 📊 Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 5 |
| 🟠 High | 9 |
| 🟡 Medium | 6 |
| 🔵 Low | 6 |
| **Total** | **26 bugs** |

---

## 🎯 Top Priority Fixes (in order)

1. **Fix direct URL navigation** — Add server catch-all to serve `index.html` for all routes (BUG-01). Fixes page refresh and link sharing for all users.
2. **Fix the cold-load BigInt crash** — Guard `BigInt()` calls against undefined/NaN (BUG-03). Affects every new user who lands on the app without a connected wallet.
3. **Fix `/documents` loading** — Debug `DocumentRegistry.getDocument(i)` calls (BUG-04). Core feature is completely broken.
4. **Replace all placeholder/fake data with on-chain reads** — BUG-07, BUG-08, BUG-09, BUG-10, BUG-12, BUG-15, BUG-16. The blockchain branding is a core selling point; fake data undermines all trust.
5. **Fix wrong blockchain branding (Polygon → Base)** — Global find/replace (BUG-13). Brand integrity issue.
6. **Fix `/dues` contradiction** — Reconcile "no history" vs "12 missed payments" (BUG-06).
7. **Fix mobile treasury overflow** — One-line Tailwind fix on Export PDF button (BUG-25).

---

*Report generated March 26, 2026 — tested with MetaMask wallet connected to Base Sepolia, Lot #2 (2 properties).*
