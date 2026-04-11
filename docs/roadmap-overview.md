# FaircroftDAO / SuvrenHOA — 4-Week Launch Roadmap
**Project:** Blockchain-based HOA governance platform  
**Stack:** Next.js 16 + React 19 + Tailwind v4 + wagmi v2 + RainbowKit + viem + Supabase  
**Network:** Base Sepolia (testnet) → Base Mainnet (Week 3)  
**Status:** 10 major features shipped across 4 phases ✅

---

## 30-Second Summary

We've built a complete HOA governance platform with 31+ routes, 5 smart contracts, and every feature from basic governance to AI-powered community assistance. The path to mainnet is now **strictly serialized** on the advice of the Council (Atlas audit, 2026-04-10): contracts cannot deploy until audit is clean, mainnet cannot go live until DEPLOY_V2 is in place, and the first real HOA pilot cannot start until mainnet has had a stabilization window. Running these in parallel is what "fast" founders do to produce slow launches.

```
Phase A  CONTRACTS_AUDIT   ──►  all 5 contracts clean, 0 High/Critical open
Phase B  DEPLOY_V2         ──►  GHA → GHCR → self-hosted runners on xrpburner
Phase C  MAINNET_LAUNCH    ──►  mainnet deploy, USDC rails live, Gnosis Safe owning roles
Phase D  STABILIZATION     ──►  14-day zero-P0 watch window on mainnet
Phase E  FIRST_HOA_PILOT   ──►  onboard the first real HOA (deferred behind D)
```

Each phase is a **hard gate**. You do not start phase N+1 until phase N's exit criteria are met. No exceptions, not even under pressure.

---

## Phase Gates

The phases replace the old Week 1/2/3/4 shape. Weeks are still useful as budgeting units inside a phase, but week labels no longer govern what we do next — phase exit criteria do.

| Phase | Name | Exit Criteria (ALL must be green) | Blocks |
|-------|------|-----------------------------------|--------|
| **A** | CONTRACTS_AUDIT | • Foundry invariant suite green (26 tests, 851k+ state transitions, 0 reverts)<br>• External Nemesis security pass: 0 HIGH, 0 CRITICAL<br>• Hephaestus code-quality pass on contracts dir<br>• Apollo test-truthfulness pass on contracts dir<br>• All 5 contracts verified on Base Sepolia with deploy transcripts archived | B, C, D, E |
| **B** | DEPLOY_V2 | • GitHub Actions pipeline builds to GHCR on every merge to main<br>• Self-hosted runner on xrpburner (canary) healthy for 72h<br>• Self-hosted runner on new prod VM healthy for 72h<br>• jenny-kush retired or demoted to read-only mirror<br>• Rollback drill executed end-to-end (deploy → revert → verify within 10 min) | C, D, E |
| **C** | MAINNET_LAUNCH | • All 5 contracts deployed to Base mainnet and verified on BaseScan<br>• Gnosis Safe (3-of-5) owns BOARD + GOVERNOR roles on every contract<br>• USDC payment rail tested with ≥10 real mainnet transactions<br>• Emergency pause drill executed and timed (target < 5 min)<br>• Sentry alerting wired to on-call rotation | D, E |
| **D** | STABILIZATION | • 14 consecutive days on mainnet with 0 P0 incidents<br>• Zero contract state-corruption alerts<br>• Zero unresolved security findings older than 72h<br>• Sentry error rate below threshold baseline for 7 consecutive days | E |
| **E** | FIRST_HOA_PILOT | • Phase D closed<br>• Onboarding runbook executed with 1 real HOA board (≥3 board members on mainnet wallets)<br>• First dues payment settled on mainnet<br>• First governance proposal voted and executed on mainnet<br>• NPS ≥ 7 from pilot users at 14-day mark | — |

**Deferred from old Week 4:** FIRST_HOA_PILOT was previously slotted parallel to mainnet launch. Atlas flagged this as the single largest schedule risk in the project — putting a real HOA on unstabilized infrastructure is how platforms lose trust they never recover. Phase E is now hard-gated behind Phase D.

---

## Weekly Milestones (intra-phase budgeting)

Weeks are retained as budgeting units so we can still say "we're in Week 2 of Phase C" and have it mean something. They do NOT override phase gates.

| Week | Phase | Theme | Done When... |
|------|-------|-------|--------------|
| **Week 1** | A | Polish & QA, invariant coverage, audit remediation | Phase A exit criteria green |
| **Week 2** | B | DEPLOY_V2 rollout, runner migration, rollback drill | Phase B exit criteria green |
| **Week 3** | C | Mainnet deploy, Safe handoff, USDC rail hardening | Phase C exit criteria green |
| **Week 4** | D (begin) | Stabilization watch begins | D clock starts ticking |
| **Week 5-6** | D | Stabilization watch continues | 14 days zero-P0 |
| **Week 7+** | E | First HOA pilot onboarding | Phase E exit criteria green |

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
Phase A  CONTRACTS_AUDIT ──────────────────────────────
  └── No external dependencies
  └── INPUTS:  Foundry toolchain, Nemesis/Hephaestus/Apollo agents
  └── OUTPUTS: Invariant suite green, audit report signed, contracts
               verified on Base Sepolia with deploy transcripts
                               │
                               ▼
Phase B  DEPLOY_V2 ────────────────────────────────────
  └── REQUIRES: Phase A complete
  └── INPUTS:   New prod VM provisioned, GHCR access, SSH keys
  └── OUTPUTS:  GHA → GHCR pipeline live, self-hosted runners on
                xrpburner + new VM, jenny-kush retired, rollback
                drill evidence archived
                               │
                               ▼
Phase C  MAINNET_LAUNCH ───────────────────────────────
  └── REQUIRES: Phase B complete
  └── INPUTS:   ~0.1 ETH mainnet gas, ~$50 USDC test float,
                Gnosis Safe (3-of-5 signers confirmed available)
  └── OUTPUTS:  Mainnet contracts verified, Safe ownership handoff
                executed, USDC payment rail proven on mainnet,
                pause drill timed
                               │
                               ▼
Phase D  STABILIZATION ────────────────────────────────
  └── REQUIRES: Phase C complete
  └── INPUTS:   On-call rotation staffed, Sentry alerting wired
  └── OUTPUTS:  14-day zero-P0 watch window closed cleanly,
                baseline error-rate envelope established
                               │
                               ▼
Phase E  FIRST_HOA_PILOT ──────────────────────────────
  └── REQUIRES: Phase D complete (NOT negotiable)
  └── INPUTS:   1 real HOA board recruited, production domain,
                onboarding runbook dry-run completed
  └── OUTPUTS:  First real dues payment on mainnet, first real
                proposal voted and executed, NPS baseline
```

---

## Critical Path

The phases themselves ARE the critical path. Slipping any gate shifts every downstream phase by the same amount — there is no longer a "parallel track" that can absorb delay. Inside each phase the items below are the long poles:

### Phase A — CONTRACTS_AUDIT
1. **External security pass (Nemesis)** — 0 HIGH, 0 CRITICAL required. Budget 2 days to triage + fix.
2. **Foundry invariant suite** — DONE ✅ (26 tests, 851k+ state transitions, 0 reverts, 2026-04-10).
3. **Geocoding remediation** — DONE ✅ (Nominatim + cache + 20 unit tests, 2026-04-10).

### Phase B — DEPLOY_V2
1. **New prod VM provisioning** — blocks GHCR runner registration.
2. **Rollback drill** — must be executed end-to-end, not simulated. 10-minute target.
3. **jenny-kush retirement** — do not skip; leaving old infra alive creates a split-brain deploy surface.

### Phase C — MAINNET_LAUNCH
1. **Gnosis Safe ownership handoff** — contracts without multisig admin = unacceptable risk.
2. **USDC rail stress test** — 10+ real mainnet transactions before opening to any user.
3. **Emergency pause drill** — must be timed. Un-drilled emergency paths are indistinguishable from broken ones.

### Phase D — STABILIZATION
1. **14-day zero-P0 clock** — non-compressible. The point of the window is that it can't be rushed.
2. **On-call rotation** — if there's no one watching, the clock is lying.

### Phase E — FIRST_HOA_PILOT (DEFERRED)
1. **Board recruitment** — can run in background during Phase D but cannot onboard until D closes.
2. **Onboarding runbook dry-run** — do a dress rehearsal with internal team before touching a real HOA.

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

*Last updated: 2026-04-10 — Atlas remediation. Roadmap re-sequenced into strict phase gates (A → B → C → D → E). FIRST_HOA_PILOT deferred behind a 14-day mainnet stabilization window. Parallel-track tolerance reduced to zero.*
