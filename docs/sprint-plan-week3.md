# Sprint Plan — Week 3: Mainnet Prep, Security Audit & USDC Payment Testing
**Dates:** Monday–Sunday (Week 3)  
**Theme:** Harden everything before real money goes on-chain  
**Goal:** Contracts pass security review, USDC payment flow works end-to-end, mainnet deployment is ready

---

## Overview

| Day | Focus | Goal |
|-----|-------|------|
| Monday | Security Audit Prep | Automated analysis, known vulnerability check |
| Tuesday | Contract Security Review | Manual audit of all 5 contracts |
| Wednesday | USDC Payment Integration | End-to-end dues payment with real USDC on Sepolia |
| Thursday | Mainnet Deploy Scripts | Deployment pipeline, gas estimates, multisig setup |
| Friday | Base Mainnet Deploy | Deploy contracts; verify; update frontend |
| Saturday | E2E Testing on Mainnet | Full flow on mainnet with real (small) amounts |
| Sunday | Incident Plan & Monitoring | Set up alerts, runbooks, emergency pause procedures |

---

## Monday — Security Audit Prep

*Goal: Run automated tools, catalog all findings before manual review*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Install and run Slither on all 5 contracts: `slither . --print human-summary` | 🔴 Critical | 1.5h | None |
| 2 | Install and run Mythril on FaircroftTreasury and FaircroftGovernor (highest risk) | 🔴 Critical | 2h | None |
| 3 | Run `solhint` for style/security lint across all contracts | 🟡 High | 45m | None |
| 4 | Check all OpenZeppelin contract versions — ensure no known CVEs in used version | 🔴 Critical | 45m | None |
| 5 | Compile findings into `docs/security-audit.md` — list all warnings with severity | 🟡 High | 1h | Tasks 1-4 |
| 6 | Research any Governor/Timelock-specific attack vectors (flash loan governance attacks, proposal frontrunning) | 🟡 High | 1h | None |

**Day Total: ~7h**

---

## Tuesday — Manual Contract Security Review

*Goal: Manually audit logic for business logic flaws that automated tools miss*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | **PropertyNFT audit:** review mint/transfer restrictions; verify only admin can mint; check tokenURI generation | 🔴 Critical | 1h | None |
| 2 | **FaircroftGovernor audit:** verify quorum calculation; check proposal threshold; review vote counting logic; test for double-vote | 🔴 Critical | 1.5h | None |
| 3 | **FaircroftTreasury audit:** verify all withdrawal paths require timelock; check for reentrancy on ETH/USDC transfers; verify access control | 🔴 Critical | 2h | None |
| 4 | **DocumentRegistry audit:** verify document hash storage is immutable post-submission; check for hash collision handling | 🟡 High | 1h | None |
| 5 | **TimelockController audit:** verify minimum delay is set correctly; check proposer/executor roles; ensure no bypasses | 🔴 Critical | 1h | None |
| 6 | Document all findings with severity (Critical/High/Medium/Low/Informational) in `docs/security-audit.md` | 🔴 Critical | 1h | Tasks 1-5 |
| 7 | Fix all Critical and High severity issues found | 🔴 Critical | 2h | Task 6 |

**Day Total: ~9.5h**

---

## Wednesday — USDC Payment Integration

*Goal: Homeowners can pay HOA dues in USDC — full flow from connect wallet to receipt*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Get Base Sepolia USDC test tokens — contract address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | 🔴 Critical | 30m | None |
| 2 | Update FaircroftTreasury to accept USDC via `IERC20.transferFrom` — add `payDuesUSDC(uint256 amount)` function | 🔴 Critical | 1.5h | None |
| 3 | Add USDC approval step to Dues page — user must approve Treasury contract to spend USDC before payment | 🔴 Critical | 1.5h | Task 2 |
| 4 | Implement two-step UX: Step 1 "Approve USDC" → Step 2 "Pay Dues" with loading states and tx hash display | 🔴 Critical | 1.5h | Task 3 |
| 5 | Add payment receipt — after successful tx, show confirmation with amount, date, tx hash, BaseScan link | 🟡 High | 1h | Task 4 |
| 6 | Store payment record in Supabase `payments` table (wallet, amount, tx_hash, block_number, timestamp) | 🟡 High | 1h | Task 4 |
| 7 | Test full USDC payment flow 3x with different test wallets — verify balances update on-chain and in UI | 🔴 Critical | 1h | Tasks 4-6 |

**Day Total: ~8h**

---

## Thursday — Mainnet Deployment Scripts

*Goal: Deployment pipeline ready; never deploy blind*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Create `scripts/deploy-mainnet.ts` — single idempotent deploy script for all 5 contracts in correct order | 🔴 Critical | 2h | None |
| 2 | Add deployment validation — after each contract deploy, verify bytecode matches; log all addresses | 🟡 High | 1h | Task 1 |
| 3 | Create `scripts/verify-mainnet.ts` — verify all contracts on BaseScan in one run | 🟡 High | 1h | Task 1 |
| 4 | Estimate mainnet deployment gas costs — run simulation on fork; document expected ETH needed | 🟡 High | 45m | Task 1 |
| 5 | Set up Gnosis Safe multisig on Base mainnet — add 3 signers (at minimum 2-of-3 for admin operations) | 🔴 Critical | 1.5h | None |
| 6 | Update deployment scripts to set multisig as owner/admin for all contracts post-deploy | 🔴 Critical | 1h | Tasks 1, 5 |
| 7 | Create `docs/deployment-runbook.md` — step-by-step mainnet deploy guide | 🟡 High | 1h | Tasks 1-6 |

**Day Total: ~8.25h**

---

## Friday — Base Mainnet Deployment

*Goal: All 5 contracts live on Base mainnet, verified, owned by multisig*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Final security check — re-read all contracts after Tuesday's fixes | 🔴 Critical | 1h | Tue Task 7 |
| 2 | Deploy TimelockController to mainnet; verify on BaseScan | 🔴 Critical | 30m | Thu Task 1 |
| 3 | Deploy FaircroftGovernor with Timelock address; verify | 🔴 Critical | 30m | Task 2 |
| 4 | Deploy PropertyNFT; transfer ownership to multisig; verify | 🔴 Critical | 30m | Task 2 |
| 5 | Deploy FaircroftTreasury; transfer ownership to Timelock; verify | 🔴 Critical | 30m | Tasks 2, 3 |
| 6 | Deploy DocumentRegistry; set admin roles; verify | 🔴 Critical | 30m | Task 2 |
| 7 | Save all mainnet contract addresses to `config/contracts.mainnet.ts` | 🔴 Critical | 30m | Tasks 2-6 |
| 8 | Update frontend env vars — add `NEXT_PUBLIC_CHAIN_ID=8453` and mainnet addresses | 🔴 Critical | 45m | Task 7 |

**Day Total: ~5.25h**

---

## Saturday — End-to-End Testing on Mainnet

*Goal: Full user journey works on mainnet with real (small) ETH/USDC*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Connect wallet to mainnet — verify frontend detects correct chain; shows "Base" not "Base Sepolia" | 🔴 Critical | 30m | Fri deploy |
| 2 | Mint a test PropertyNFT — verify token appears in wallet and on Dashboard | 🔴 Critical | 45m | Fri deploy |
| 3 | Create a test governance proposal — verify it enters Timelock queue | 🔴 Critical | 1h | Fri deploy |
| 4 | Test USDC dues payment on mainnet with $1 USDC — verify Treasury balance updates | 🔴 Critical | 1h | Fri deploy |
| 5 | Upload a test document — verify hash stored on DocumentRegistry on mainnet | 🟡 High | 45m | Fri deploy |
| 6 | Check all BaseScan links in UI point to mainnet (not Sepolia) explorer | 🟡 High | 45m | Fri Task 8 |
| 7 | Test chain-switching UX — what happens when user is on wrong network? Prompt to switch. | 🟡 High | 1h | Fri Task 8 |

**Day Total: ~5.75h**

---

## Sunday — Incident Plan & Monitoring

*Goal: Know exactly what to do if something breaks in production*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Set up contract monitoring with OpenZeppelin Defender — watch for unusual Treasury withdrawals | 🟡 High | 1.5h | Fri deploy |
| 2 | Create `docs/incident-runbook.md` — playbook for: contract exploit, frontend down, DB breach | 🔴 Critical | 2h | None |
| 3 | Add emergency pause function to FaircroftTreasury (if not already) — allows multisig to pause all withdrawals | 🔴 Critical | 1h | Fri deploy |
| 4 | Set up Vercel alerts — notify on deploy failure, function errors >1% rate | 🟡 High | 30m | None |
| 5 | Document all admin keys and their safe storage locations in `docs/key-management.md` | 🔴 Critical | 1h | None |

**Day Total: ~6h**

---

## Week 3 Success Criteria

- [ ] All Critical and High findings from security audit are fixed
- [ ] USDC dues payment works end-to-end (approve → pay → receipt → Supabase record)
- [ ] All 5 contracts deployed and verified on Base mainnet
- [ ] Multisig owns all admin functions
- [ ] Incident runbook written
- [ ] E2E mainnet test passes with real funds

---

## Notes

- **Do not deploy to mainnet without finishing Tuesday's security review.** Real money = real consequences.
- **Gas on Base mainnet is cheap** (~$0.01-0.05 per tx) but budget $50-100 ETH for deployment + testing.
- **Timelock delay:** Set minimum 24h delay for governance actions on mainnet. 0 delay is only for testing.
- **USDC on Base mainnet:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **OpenZeppelin Defender** free tier works for monitoring — set up before going live.
