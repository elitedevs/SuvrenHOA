# Sprint Plan — Week 4: Launch Prep, Beta Testing & Go-Live
**Dates:** Monday–Sunday (Week 4)  
**Theme:** Ship it — production domain, real users, final polish, launch  
**Goal:** FaircroftDAO / SuvrenHOA is live with a real HOA board running their first governance vote

---

## Overview

| Day | Focus | Goal |
|-----|-------|------|
| Monday | Domain & Hosting | Production domain, SSL, Vercel production env |
| Tuesday | Documentation | User guides, admin docs, API reference |
| Wednesday | UAT with HOA Board | Real users: board members test governance flow |
| Thursday | UAT Bug Fixes | Address all UAT feedback |
| Friday | Soft Launch | Invite beta homeowners; monitor closely |
| Saturday | Beta Monitoring | Watch metrics, fix issues in real-time |
| Sunday | Launch Checklist & Celebration | Final sign-off, announce publicly |

---

## Monday — Domain, SSL & Production Hosting

*Goal: App is live at a real domain with HTTPS — not a Vercel preview URL*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Purchase/configure production domain (e.g., `faircroftdao.com` or `suvren.app`) | 🔴 Critical | 30m | None |
| 2 | Add domain to Vercel project; configure DNS (A record or CNAME to Vercel) | 🔴 Critical | 45m | Task 1 |
| 3 | Verify SSL certificate auto-provisioned by Vercel; test HTTPS works | 🔴 Critical | 15m | Task 2 |
| 4 | Configure production environment variables in Vercel dashboard: Supabase, Resend, contract addresses, chain ID | 🔴 Critical | 45m | None |
| 5 | Set up `www` → apex redirect; configure canonical URLs for SEO | 🟡 High | 20m | Task 2 |
| 6 | Add `next.config.ts` security headers: CSP, HSTS, X-Frame-Options, referrer policy | 🔴 Critical | 1h | None |
| 7 | Test production build locally with `next build && next start` — zero errors | 🔴 Critical | 30m | None |
| 8 | Deploy to production Vercel; smoke test all routes | 🔴 Critical | 45m | Tasks 1-7 |

**Day Total: ~4.75h**

---

## Tuesday — User Documentation

*Goal: Every user type (homeowner, board member, admin) knows how to use the app*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Write `docs/user-guide-homeowner.md` — onboarding, voting, paying dues, submitting maintenance, messaging neighbors | 🔴 Critical | 2h | None |
| 2 | Write `docs/user-guide-board-member.md` — creating proposals, managing treasury, uploading documents, reviewing arch submissions | 🔴 Critical | 2h | None |
| 3 | Write `docs/user-guide-admin.md` — minting PropertyNFTs, managing users, sending alerts, admin panel usage | 🟡 High | 1.5h | None |
| 4 | Add in-app onboarding tooltips for 5 key actions (first wallet connect, first vote, first payment, first message, first maintenance request) | 🟡 High | 2h | None |
| 5 | Create 1-page PDF quick-start guide for board members (for printing and handing out) | 🟢 Medium | 1h | Task 2 |
| 6 | Update README.md with production URL, tech stack, and developer setup instructions | 🟡 High | 45m | None |

**Day Total: ~9.25h**

---

## Wednesday — User Acceptance Testing with HOA Board

*Goal: 3-5 real board members test the app; find every UX failure before public launch*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Onboard board members — send setup instructions, help install wallet (Coinbase Wallet recommended for non-technical users) | 🔴 Critical | 1.5h | Mon Task 8 |
| 2 | Facilitate UAT session (screen share / in-person): each board member completes: connect wallet → view dashboard → vote on test proposal → pay $1 dues | 🔴 Critical | 2h | Task 1 |
| 3 | UAT scenario: admin creates emergency alert → board members receive it + email | 🔴 Critical | 45m | Task 1 |
| 4 | UAT scenario: homeowner submits architectural review → board member approves it | 🟡 High | 45m | Task 1 |
| 5 | UAT scenario: board member creates a survey → homeowners respond | 🟡 High | 45m | Task 1 |
| 6 | Collect written feedback from each tester — use `docs/uat-feedback.md` template | 🔴 Critical | 30m | Tasks 2-5 |
| 7 | Prioritize all UAT feedback items — Critical (blocks launch), Should-fix, Nice-to-have | 🔴 Critical | 45m | Task 6 |

**Day Total: ~7h**

---

## Thursday — UAT Bug Fixes

*Goal: All "blocks launch" items resolved; "should-fix" items addressed where possible*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Fix all Critical UAT items (expect 3-8 issues — common: wallet UX confusion, form validation, mobile layout) | 🔴 Critical | 4h | Wed Task 7 |
| 2 | Fix High-priority UAT items | 🟡 High | 2h | Task 1 |
| 3 | Improve onboarding — if board members were confused about wallet setup, add clearer guidance and "What is a wallet?" explainer modal | 🟡 High | 1h | Wed Task 6 |
| 4 | Re-test fixed items with one board member (async — send them a Loom or test link) | 🔴 Critical | 30m | Tasks 1-3 |
| 5 | Final performance audit: run Lighthouse on 5 key pages — target 90+ on mobile | 🟢 Medium | 45m | Tasks 1-2 |

**Day Total: ~8.25h**

---

## Friday — Soft Launch

*Goal: Invite 10-20 homeowners to use the app; monitor for issues; don't announce publicly yet*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Mint PropertyNFTs for all beta homeowners | 🔴 Critical | 1h | Thu fixes |
| 2 | Send beta invite emails via Resend — include production URL, wallet setup guide, support contact | 🔴 Critical | 45m | None |
| 3 | Set up Vercel Analytics + Sentry error tracking — monitor first user sessions | 🔴 Critical | 1h | None |
| 4 | Monitor Supabase dashboard — watch for RLS errors, unusual query patterns | 🔴 Critical | ongoing | None |
| 5 | Monitor OZ Defender — watch for unexpected contract interactions | 🔴 Critical | ongoing | None |
| 6 | Set up a Discord or Telegram channel for beta user support | 🟡 High | 30m | None |
| 7 | Fix any P0 issues that emerge during beta day | 🔴 Critical | ~2h buffer | None |

**Day Total: ~5.25h + monitoring**

---

## Saturday — Beta Monitoring & Polish

*Goal: Users are active; issues are caught and fixed same day*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Review Sentry errors from Day 1 beta — fix any that >3 users hit | 🔴 Critical | 2h | Fri launch |
| 2 | Review Vercel Analytics — check bounce rates on key pages; investigate drop-offs | 🟡 High | 1h | Fri launch |
| 3 | Respond to all beta user support questions/issues | 🔴 Critical | ongoing | Fri Task 6 |
| 4 | Collect NPS or simple "rate your experience" feedback from beta users | 🟡 High | 30m | Fri launch |
| 5 | Nice-to-have UX wins based on beta feedback (quick wins only — no major features) | 🟢 Medium | 2h | Tasks 1-4 |

**Day Total: ~5.5h + support**

---

## Sunday — Final Launch Checklist & Announcement

*Goal: Ship with confidence; let the world know*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Complete final launch checklist (see below) | 🔴 Critical | 1h | All week |
| 2 | Write launch announcement — Twitter/X thread, Farcaster cast, LinkedIn post | 🟡 High | 1h | Task 1 |
| 3 | Post to relevant communities: r/ethereum, HOA-focused forums, Base ecosystem channels | 🟡 High | 45m | Task 2 |
| 4 | Send "we're live!" email to beta users thanking them | 🟡 High | 30m | Task 1 |
| 5 | Tag v1.0.0 release in GitHub; write release notes | 🟡 High | 30m | Task 1 |

**Day Total: ~3.75h**

---

## 🚀 Final Launch Checklist

### Infrastructure
- [ ] Production domain with valid SSL cert
- [ ] All env vars set in Vercel production
- [ ] Database backups enabled on Supabase (point-in-time recovery)
- [ ] Vercel Analytics enabled
- [ ] Sentry error tracking active

### Security
- [ ] All security headers configured
- [ ] RLS policies tested and locked down
- [ ] Multisig owns all contract admin functions
- [ ] Emergency pause functions tested
- [ ] No sensitive keys in client-side code or git history

### Contracts
- [ ] All 5 contracts deployed on Base mainnet
- [ ] All 5 contracts verified on BaseScan
- [ ] Timelock delay set to ≥24h
- [ ] Contract addresses documented

### App Quality
- [ ] Zero P0 bugs open
- [ ] Lighthouse mobile score ≥ 90 on dashboard
- [ ] All 31+ routes tested on mobile
- [ ] Empty states on all data-driven pages
- [ ] Error boundaries on all contract interaction components

### Documentation
- [ ] Homeowner user guide complete
- [ ] Board member user guide complete
- [ ] Admin guide complete
- [ ] README updated with live URL
- [ ] Incident runbook ready

### Support
- [ ] Support channel live (Discord/Telegram)
- [ ] Contact email configured and monitored

---

## Week 4 Success Criteria

- [ ] App live at production domain with SSL
- [ ] All UAT critical issues resolved
- [ ] 10+ beta homeowners onboarded and active
- [ ] Launch announcement posted
- [ ] v1.0.0 tagged in GitHub

---

## Notes

- **Wallet UX is always the #1 friction point** for non-crypto users. Budget extra time for board member onboarding.
- **Don't announce publicly until beta users validate** — a broken launch hurts more than a delayed one.
- **Supabase backups:** Enable daily backups on the paid plan before launch. Free tier has no PITR.
- **Sentry free tier:** 5,000 errors/month — enough for launch. Upgrade if you see volume.
