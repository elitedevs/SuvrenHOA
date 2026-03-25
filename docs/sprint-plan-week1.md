# Sprint Plan — Week 1: Polish, QA & Demo Readiness
**Dates:** Wednesday–Sunday (Current Week)  
**Theme:** Get the app demo-ready — squash bugs, tighten mobile UX, and make every feature shine  
**Goal:** A polished, presentation-quality build on Base Sepolia that can be shown to potential HOA clients or investors

---

## Overview

| Day | Focus | Goal |
|-----|-------|------|
| Wednesday | Audit & Triage | Full app walkthrough, bug inventory |
| Thursday | Core Pages Polish | Dashboard, Proposals, Treasury, Documents |
| Friday | New Features QA | Activity Ticker, Health Score, Leaderboard, Alerts |
| Saturday | Mobile Responsiveness | All 31+ routes — responsive pass |
| Sunday | Demo Prep & Final QA | End-to-end demo flow, deploy to staging |

---

## Wednesday — Audit & Triage

*Goal: Know exactly what's broken before fixing anything*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Walk every route (31+) — log broken UI, console errors, 404s | 🔴 Critical | 2.5h | None |
| 2 | Test wallet connect / disconnect on all key pages (wagmi v2 edge cases) | 🔴 Critical | 1h | None |
| 3 | Document all localStorage usage — map which features depend on it | 🟡 High | 1h | None |
| 4 | Check RainbowKit modal on mobile (iOS Safari + Android Chrome) | 🟡 High | 45m | None |
| 5 | Verify all 5 contract ABIs are current — no stale imports | 🟡 High | 30m | None |
| 6 | Create `BUGS.md` in `/docs` — prioritized issue tracker for this sprint | 🟢 Medium | 30m | Task 1 |

**Day Total: ~6.25h**

---

## Thursday — Core Pages Polish

*Goal: Dashboard, Proposals, Treasury, Documents are flawless*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Dashboard: fix loading states — add skeletons for all data-fetching sections | 🔴 Critical | 1.5h | None |
| 2 | Dashboard: HOA Health Score widget — verify score calculation logic, add tooltip explaining each metric | 🟡 High | 1h | None |
| 3 | Proposals: fix pagination if >5 proposals exist; test vote confirmation flow end-to-end | 🔴 Critical | 1.5h | None |
| 4 | Treasury: ensure USDC/ETH balances display correctly on Sepolia; fix any wei/decimal formatting bugs | 🔴 Critical | 1h | None |
| 5 | Documents: test IPFS/DocumentRegistry upload + retrieval — confirm hashes resolve | 🟡 High | 1h | None |
| 6 | Add consistent empty states to Proposals, Documents, Treasury (no blank white boxes) | 🟢 Medium | 1h | None |
| 7 | Fix any broken Tailwind v4 utility classes flagged in audit | 🟢 Medium | 45m | Wed Task 1 |

**Day Total: ~7.75h**

---

## Friday — New Features QA

*Goal: All 10 new features work correctly and look polished*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Activity Ticker: verify real-time updates work; test with multiple wallet events | 🔴 Critical | 1h | None |
| 2 | Emergency Alerts: test create/dismiss flow; ensure localStorage persistence works across refresh | 🟡 High | 45m | None |
| 3 | Neighbor Messaging: full send/receive flow test; fix any unread count badge bugs | 🟡 High | 1h | None |
| 4 | Move-In/Out Wizard: walk all steps — confirm form validation, data saves, confirmation screen | 🟡 High | 1h | None |
| 5 | Neighborhood Map: verify markers render correctly; test info popups on all property types | 🟡 High | 1h | None |
| 6 | AI Community Assistant: test 5+ query types; ensure fallback state for no API key | 🟡 High | 45m | None |
| 7 | Community Leaderboard: verify point calculations; test with multiple mock users | 🟢 Medium | 45m | None |
| 8 | Smart Dues Reminders: confirm reminder logic triggers at correct intervals | 🟢 Medium | 45m | None |

**Day Total: ~8h**

---

## Saturday — Mobile Responsiveness

*Goal: Every page works on 375px (iPhone SE) and 768px (iPad)*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Navigation: test mobile nav menu, hamburger toggle, wallet address truncation | 🔴 Critical | 1h | None |
| 2 | Dashboard + all widgets: responsive grid → stacked layout on mobile | 🔴 Critical | 1.5h | None |
| 3 | Tables (Directory, Violations, Maintenance, Vehicles): add horizontal scroll or card view on mobile | 🔴 Critical | 2h | None |
| 4 | Forms (Architectural Review, Surveys, Reservations, Maintenance requests): test input UX on touch devices | 🟡 High | 1.5h | None |
| 5 | Calendar: verify month/week view collapses gracefully on small screens | 🟡 High | 1h | None |
| 6 | Neighborhood Map: pan/zoom on touch — test pinch-to-zoom behavior | 🟡 High | 45m | None |
| 7 | Community Forum + Announcements: reading experience on mobile | 🟢 Medium | 45m | None |

**Day Total: ~8.5h**

---

## Sunday — Demo Prep & Final QA

*Goal: Deploy a clean staging build; record demo flow*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Seed demo data — create 3 test wallets, mint PropertyNFTs, populate proposals/docs/payments | 🔴 Critical | 2h | All prior days |
| 2 | Full end-to-end demo run: connect wallet → dashboard → vote on proposal → pay dues → view documents | 🔴 Critical | 1.5h | Task 1 |
| 3 | Fix any blockers found in demo run | 🔴 Critical | 1.5h | Task 2 |
| 4 | Deploy to Vercel (or chosen host) with production env vars for Sepolia | 🟡 High | 1h | Task 3 |
| 5 | Write 1-page demo script — key talking points per feature | 🟡 High | 1h | Task 2 |
| 6 | Screenshot every major page — add to `/docs/screenshots/` for reference | 🟢 Medium | 45m | Task 4 |

**Day Total: ~7.75h**

---

## Week 1 Success Criteria

- [ ] Zero critical console errors in production build
- [ ] All 31+ routes load without 404 or blank screens
- [ ] Mobile-responsive on iPhone SE (375px) and iPad (768px)
- [ ] Full demo flow completes without interruption
- [ ] Deployed to public staging URL on Base Sepolia
- [ ] Demo script written and reviewed

---

## Notes

- **Wallet testing:** Use Coinbase Wallet + MetaMask for cross-wallet QA
- **Base Sepolia faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Don't get sidetracked with new features** — this week is pure polish
- Track bugs in `BUGS.md` as you find them; don't fix everything inline — triage first
