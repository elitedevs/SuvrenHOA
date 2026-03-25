# FaircroftDAO / SuvrenHOA — 4-Week Launch Roadmap
**Project:** Blockchain-based HOA governance platform  
**Stack:** Next.js 16 + React 19 + Tailwind v4 + wagmi v2 + RainbowKit + viem + Supabase  
**Network:** Base Sepolia (testnet) → Base Mainnet (Week 3)  
**Status:** 10 major features shipped across 4 phases ✅

---

## 30-Second Summary

We've built a complete HOA governance platform with 31+ routes, 5 smart contracts, and every feature from basic governance to AI-powered community assistance. The next 4 weeks take this from "impressive demo" to "real HOA running real governance on-chain."

```
Week 1: Polish → Demo-ready
Week 2: Backend → Production-grade data
Week 3: Mainnet → Real money, real security
Week 4: Launch → Real users, real HOA
```

---

## Weekly Milestones

| Week | Theme | Key Deliverable | Done When... |
|------|-------|-----------------|--------------|
| **Week 1** | Polish & QA | Demo-ready build on Base Sepolia | Full demo flow runs without interruption; mobile-responsive |
| **Week 2** | Backend Infra | Supabase integration + email system | Zero localStorage for persistent data; emails deliver |
| **Week 3** | Mainnet & Security | Contracts live on Base mainnet | All 5 contracts verified; USDC payment works; audit done |
| **Week 4** | Launch | Real HOA using the app | 10+ homeowners onboarded; v1.0.0 tagged; announced |

---

## Feature Inventory (Shipped ✅)

### Core Governance
- ✅ Proposals — create, vote, execute via Governor + Timelock
- ✅ Treasury — ETH balance, USDC dues, spending history
- ✅ Documents — IPFS hash storage via DocumentRegistry
- ✅ PropertyNFT — proof of residency / voting rights

### Community Operations
- ✅ Dues — payment tracking, balance display
- ✅ Maintenance — request submission, status tracking
- ✅ Violations — issue tracking and resolution
- ✅ Architectural Review — submission + board approval workflow
- ✅ Reservations — community amenity booking
- ✅ Pets & Vehicles — resident registration

### Community Engagement
- ✅ Community Forum — threaded discussion
- ✅ Announcements — board broadcasts
- ✅ Calendar — community events
- ✅ Surveys — governance polling
- ✅ Directory — resident directory

### New Features (Phase 4)
- ✅ Transparency Dashboard — all financial/governance data visible
- ✅ Activity Ticker — real-time on-chain event feed
- ✅ HOA Health Score — composite governance health metric
- ✅ Smart Dues Reminders — automated payment nudges
- ✅ Community Leaderboard — engagement gamification
- ✅ Emergency Alerts — urgent broadcast system
- ✅ Neighbor Messaging — direct wallet-to-wallet messaging
- ✅ Move-In/Out Wizard — onboarding/offboarding flow
- ✅ Neighborhood Map — property visualization
- ✅ AI Community Assistant — natural language HOA queries

---

## Timeline & Dependencies

```
Week 1 ──────────────────────────────────────────────
  └── No external dependencies (internal QA work)
  └── OUTPUTS: Staging URL, Bug inventory, Demo script

Week 2 ──────────────────────────────────────────────
  └── REQUIRES: Week 1 complete (stable codebase)
  └── REQUIRES: Supabase project, Resend account
  └── OUTPUTS: Data persistence, email system, verified contracts

Week 3 ──────────────────────────────────────────────
  └── REQUIRES: Week 2 complete (Supabase live)
  └── REQUIRES: ETH for mainnet deployment (~0.05 ETH)
  └── REQUIRES: USDC for payment testing (~$10)
  └── REQUIRES: Gnosis Safe setup (3 signers available)
  └── OUTPUTS: Mainnet contracts, security audit report, USDC payment flow

Week 4 ──────────────────────────────────────────────
  └── REQUIRES: Week 3 complete (mainnet deployed)
  └── REQUIRES: Production domain (~$15/yr)
  └── REQUIRES: 3-5 board members willing to UAT
  └── OUTPUTS: Live app, beta users, v1.0.0
```

---

## Critical Path

The items below will **block launch** if delayed. Everything else can slip.

1. **Security audit (Week 3, Tue)** — Cannot deploy to mainnet without this. If critical issues found, delays cascade.
2. **Supabase RLS (Week 2, Mon)** — Must be correct before real user data goes in. Cannot shortcut.
3. **Board member UAT (Week 4, Wed)** — If board is unavailable, soft launch can't happen on schedule.
4. **Gnosis Safe setup (Week 3, Thu)** — Contracts without multisig admin = unacceptable risk. Block launch.
5. **Production domain (Week 4, Mon)** — No real launch without real domain. Buy it early.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Security audit finds critical bug in Treasury/Governor | Medium | 🔴 High | Schedule audit Week 3 Mon-Tue; have 2 days buffer to fix before mainnet deploy |
| Board members struggle with wallet setup | High | 🟡 Medium | Prepare Coinbase Wallet setup guide; offer 1:1 onboarding session |
| Supabase RLS misconfiguration exposes user data | Low | 🔴 High | Explicit RLS tests in Week 2 Saturday; penetration test before launch |
| Base mainnet deployment fails (gas, constructor args) | Low | 🟡 Medium | Test deploy script on fork before real deployment; have extra ETH |
| OpenAI/AI assistant API costs spike in beta | Medium | 🟢 Low | Add rate limiting (10 queries/user/day); cache common questions |
| USDC payment approval UX confuses users | High | 🟡 Medium | Add explanatory modal on first payment; "Why do I need to approve?" link |
| Timelock delay blocks urgent governance actions | Medium | 🟡 Medium | Document process; keep 2-of-3 multisig for emergency bypass |
| Vercel cold start latency on contract reads | Medium | 🟢 Low | Add edge caching for read-heavy routes; use viem public client |

---

## Technical Debt Register

These items were deferred during feature development. Address post-launch or in parallel.

| Item | Severity | Recommended Sprint |
|------|----------|-------------------|
| Replace localStorage for all remaining features (Calendar, Forum, Surveys) | Medium | Week 2 extension |
| Add proper TypeScript types to all API response objects | Low | Post-launch |
| Implement proper error boundaries on every page | Medium | Week 1 Day 4 |
| Add unit tests for contract interactions (wagmi hooks) | Medium | Post-launch |
| Implement pagination for Forum + Announcements at scale | Low | Post-launch |
| Add OpenGraph meta tags for social sharing | Low | Week 4 |
| Migrate to Supabase Auth (currently wallet-only) | High | Post-launch v1.1 |

---

## Success Metrics

### Week 1
- [ ] Demo runs without interruption (5+ consecutive runs)
- [ ] Lighthouse mobile score ≥ 85 on Dashboard
- [ ] Zero "Failed to fetch" or RPC errors in console

### Week 2  
- [ ] localStorage usage = 0 for persistent user data
- [ ] Email deliverability rate ≥ 95% (check Resend dashboard)
- [ ] All 5 contracts readable on Base Sepolia BaseScan

### Week 3
- [ ] Security audit: 0 Critical, 0 High unresolved findings
- [ ] USDC payment success rate = 100% in testing (10+ test transactions)
- [ ] Mainnet deployment cost < 0.1 ETH total

### Week 4 (Launch KPIs)
- [ ] **10+ homeowners** onboarded in beta
- [ ] **1 governance proposal** created and voted on by real users
- [ ] **1 dues payment** processed via USDC on mainnet
- [ ] **Net Promoter Score** ≥ 7/10 from beta users
- [ ] **Zero P0 incidents** in first 48 hours post-launch

### 30-Day Post-Launch
- [ ] 25+ active wallets connected
- [ ] 5+ governance proposals created
- [ ] $500+ in dues processed on-chain
- [ ] HOA board using app as primary governance tool

---

## Budget Estimate

| Item | Cost | When |
|------|------|------|
| Production domain (1 year) | ~$15 | Week 4 |
| Mainnet deployment gas | ~$5-20 | Week 3 |
| USDC for payment testing | ~$10 | Week 3 |
| Supabase Pro (if needed) | $25/mo | Week 2+ |
| Resend (free tier) | $0 | Week 2 |
| Vercel Pro (if needed) | $20/mo | Week 4 |
| OZ Defender (free tier) | $0 | Week 3 |
| Gnosis Safe | $0 | Week 3 |
| **Estimated Total** | **~$50-70** | |

---

## Contacts & Resources

| Resource | URL/Info |
|----------|---------|
| Base Sepolia Explorer | https://sepolia.basescan.org |
| Base Mainnet Explorer | https://basescan.org |
| Base Sepolia Faucet | https://www.coinbase.com/faucets/base-ethereum-goerli-faucet |
| Base USDC (Mainnet) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Base Sepolia USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Supabase Dashboard | https://supabase.com/dashboard |
| Resend Dashboard | https://resend.com |
| OpenZeppelin Defender | https://defender.openzeppelin.com |
| Gnosis Safe | https://app.safe.global |

---

*Last updated: Week 1 start — update this doc as milestones are hit.*
