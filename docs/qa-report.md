# SuvrenHOA — QA Report

> **Date:** 2026-03-25 17:40 UTC
> **Tested by:** Jenny (automated) + Ryan (manual)

---

## ✅ All Pages Load (28/28)
Every page returns HTTP 200 — no 404s.

## ✅ All API Routes Work (13/13)
- `/api/pets` — 1 record ✅
- `/api/vehicles` — 0 records ✅ (empty but working)
- `/api/posts` — 3 records ✅
- `/api/announcements` — 3 records ✅
- `/api/events` — 0 records ✅ (empty but working)
- `/api/surveys` — ✅
- `/api/reservations` — ✅
- `/api/maintenance` — 2 records ✅
- `/api/violations` — ✅
- `/api/architectural` — ✅
- `/api/directory` — 2 entries ✅
- `/api/notifications` — ✅
- `/api/profile` — ✅ (requires wallet param)

## ✅ On-Chain Data
- Total Supply: **6 properties** ✅
- Treasury: **$0 USDC** (no dues paid yet — expected)
- Active Proposals: **0** (none created yet — expected)
- Documents: **0** (none registered yet — expected)

---

## 🐛 Bugs Found

### B1 — 🔴 HIGH: Treasury shows $0 (no test data)
**Page:** Dashboard, /transparency, /treasury
**Issue:** Treasury balance is 0 because no dues have been paid. Makes the app look empty.
**Fix:** Need testnet USDC to pay dues, OR seed the treasury contract directly.

### B2 — 🟡 MEDIUM: No proposals exist for testing
**Page:** /proposals, Dashboard
**Issue:** Active proposals = 0. Can't test voting flow without creating one.
**Fix:** Create a test proposal via the governance contract.

### B3 — 🟡 MEDIUM: No documents registered
**Page:** /documents, /transparency
**Issue:** Document count = 0. Can't demo document verification.
**Fix:** Register a test document via the DocumentRegistry contract.

### B4 — 🟡 MEDIUM: Console 413 errors may still appear
**Page:** All pages with blockchain hooks
**Issue:** Some hooks may still have large block scan ranges that weren't caught.
**Fix:** Audit all hooks for scan range > 2000 blocks.

### B5 — 🟡 MEDIUM: Onboarding wizard 404 (reported by Ryan)
**Page:** /onboarding
**Issue:** Ryan reported 404 when adding pets/vehicles in move-in wizard.
**Fix:** Could not reproduce — add pet/vehicle buttons add inline forms, don't navigate. May have been a cached build. Need Ryan to retest after latest deploy.

### B6 — 🔵 LOW: MetaMask "Unrecognized chain" warning
**Page:** Connection flow
**Issue:** MetaMask may show chain warning for Base Sepolia. Should auto-add chain.
**Fix:** wagmi/RainbowKit should handle this, but may need explicit chain config.

### B7 — 🔵 LOW: Leaderboard empty (no on-chain activity)
**Page:** /community/leaderboard
**Issue:** No votes, proposals, or dues payments → leaderboard is empty.
**Fix:** Seed test activity (create proposal, vote, pay dues).

### B8 — 🔵 LOW: Activity Ticker empty
**Page:** Dashboard, /transparency
**Issue:** Activity feed shows empty state because reduced block scan (2000) may not reach old events.
**Fix:** After new on-chain activity (minting happened recently, should show PropertyMinted events).

---

## 🎯 Recommended Test Data Seeding

To make the app demo-ready, we need:

1. **Fund treasury** — Send test USDC to treasury contract
2. **Create a proposal** — Test governance flow
3. **Register documents** — Test document verification
4. **Pay dues** — Test payment flow + populate leaderboard
5. **More properties** — Mint remaining lots (need deployer ETH)

### Priority Order:
1. B1 (Treasury) — Most visible, affects multiple pages
2. B2 (Proposals) — Core governance feature
3. B3 (Documents) — Important for trust narrative
4. B7+B8 (Activity) — Makes app feel alive

---

## 📱 Manual Testing Needed (Ryan)

These require visual/interaction testing:
- [ ] Mobile responsive on phone
- [ ] Dropdown nav on desktop (hover behavior)
- [ ] Hamburger menu on mobile
- [ ] AI chat widget (click floating button)
- [ ] Onboarding wizard full flow (try again after refresh)
- [ ] Alert creation (if board wallet)
- [ ] Messaging between lots
