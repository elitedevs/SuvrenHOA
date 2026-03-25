# Sprint Plan — Week 2: Backend Infrastructure & Supabase Integration
**Dates:** Monday–Sunday (Week 2)  
**Theme:** Replace localStorage with real persistence — Supabase for everything, email notifications, contract verification  
**Goal:** Production-grade data layer. No more losing state on refresh.

---

## Overview

| Day | Focus | Goal |
|-----|-------|------|
| Monday | Supabase Setup | Schema design, env config, RLS policies |
| Tuesday | Alerts & Messaging | Emergency Alerts + Neighbor Messaging → Supabase |
| Wednesday | Onboarding & Profiles | Move-In/Out Wizard + User Profiles → Supabase |
| Thursday | Email Notifications | Resend/SendGrid setup, transactional emails |
| Friday | Contract Verification | Verify all 5 contracts on BaseScan |
| Saturday | Integration Testing | Full data flow tests, RLS checks |
| Sunday | Buffer + Documentation | Fix issues, update API docs |

---

## Monday — Supabase Setup & Schema Design

*Goal: Production-ready schema with RLS policies before writing a single line of integration code*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Create Supabase project (if not exists); add env vars to `.env.local` and Vercel dashboard | 🔴 Critical | 30m | None |
| 2 | Design and run migrations for `users` table (wallet_address PK, display_name, email, avatar_url, move_in_date, unit_number, created_at) | 🔴 Critical | 1h | Task 1 |
| 3 | Design and run migrations for `alerts` table (id, type, title, body, created_by, created_at, dismissed_by uuid[], expires_at) | 🔴 Critical | 45m | Task 1 |
| 4 | Design and run migrations for `messages` table (id, sender_address, recipient_address, body, read, created_at) | 🔴 Critical | 45m | Task 1 |
| 5 | Design and run migrations for `onboarding_submissions` table (id, wallet_address, type [move_in/move_out], data jsonb, status, created_at) | 🟡 High | 45m | Task 1 |
| 6 | Configure Row Level Security (RLS) on all tables — users can only read/write their own data; admins have full access | 🔴 Critical | 1.5h | Tasks 2-5 |
| 7 | Install `@supabase/supabase-js` and `@supabase/ssr`; create `lib/supabase/client.ts` and `lib/supabase/server.ts` | 🟡 High | 1h | Task 1 |

**Day Total: ~6.25h**

---

## Tuesday — Emergency Alerts & Neighbor Messaging

*Goal: Both features fully migrated from localStorage to Supabase with real-time updates*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Create `lib/api/alerts.ts` — CRUD functions using Supabase client (createAlert, getAlerts, dismissAlert) | 🔴 Critical | 1h | Mon Task 7 |
| 2 | Update Emergency Alerts page — replace all localStorage reads/writes with Supabase calls | 🔴 Critical | 1.5h | Task 1 |
| 3 | Add Supabase Realtime subscription to alerts — new alerts appear instantly for all users | 🟡 High | 1h | Task 2 |
| 4 | Create `lib/api/messages.ts` — CRUD functions (sendMessage, getInbox, markAsRead, getConversation) | 🔴 Critical | 1h | Mon Task 7 |
| 5 | Update Neighbor Messaging page — replace localStorage with Supabase; fix unread count to query DB | 🔴 Critical | 1.5h | Task 4 |
| 6 | Add Realtime subscription to messages — new messages appear without page refresh | 🟡 High | 1h | Task 5 |
| 7 | Test: send alert as admin, verify regular user sees it; send message, verify recipient sees it | 🟡 High | 45m | Tasks 3, 6 |

**Day Total: ~7.75h**

---

## Wednesday — Move-In/Out Wizard & User Profiles

*Goal: Onboarding flow and profile data persisted in Supabase*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Create `lib/api/onboarding.ts` — submitMoveIn, submitMoveOut, getSubmission, updateStatus | 🔴 Critical | 1h | Mon Task 7 |
| 2 | Update Move-In/Out Wizard — replace localStorage with Supabase; each wizard step saves progress to DB | 🔴 Critical | 2h | Task 1 |
| 3 | Add Admin view for onboarding submissions — paginated table with approve/reject actions | 🟡 High | 1.5h | Task 2 |
| 4 | Create `lib/api/profiles.ts` — getProfile, upsertProfile (upsert on wallet_address) | 🔴 Critical | 45m | Mon Task 7 |
| 5 | Update Profile page — load from Supabase on mount; save edits to DB; remove localStorage | 🔴 Critical | 1.5h | Task 4 |
| 6 | Auto-create user record on first wallet connect (wagmi `useAccount` onConnect callback) | 🟡 High | 1h | Task 4 |
| 7 | Test full move-in flow: connect wallet → complete wizard → verify record in Supabase dashboard | 🟡 High | 30m | Tasks 2, 6 |

**Day Total: ~8.25h**

---

## Thursday — Email Notification System

*Goal: Transactional emails for key HOA events (dues reminders, alert broadcasts, message notifications)*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Set up Resend account; add `RESEND_API_KEY` to env vars; install `resend` package | 🔴 Critical | 30m | None |
| 2 | Create `lib/email/templates/` — build React Email templates for: dues-reminder, emergency-alert, new-message, onboarding-confirmation | 🔴 Critical | 2h | Task 1 |
| 3 | Create `/api/email/send` Route Handler — validates payload, calls Resend, logs to Supabase `email_log` table | 🟡 High | 1h | Tasks 1, 2 |
| 4 | Wire dues reminder emails — when Smart Dues Reminders triggers, send email to user's address from Supabase profile | 🟡 High | 1h | Mon Task 4, Task 3 |
| 5 | Wire emergency alert emails — when admin broadcasts alert, email all active users | 🟡 High | 1h | Tue Task 3, Task 3 |
| 6 | Wire new message notification — email recipient when they receive a Neighbor Message (if email set) | 🟢 Medium | 1h | Tue Task 6, Task 3 |
| 7 | Add email opt-out field to `users` table; respect it in all email sends | 🟡 High | 45m | Task 3 |
| 8 | Test all 4 email templates — verify rendering in Resend dashboard | 🟡 High | 30m | Tasks 4-6 |

**Day Total: ~7.75h**

---

## Friday — Contract Verification on BaseScan

*Goal: All 5 contracts verified and readable on Base Sepolia BaseScan*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Register BaseScan API key; add to Hardhat/Foundry config as `BASESCAN_API_KEY` | 🔴 Critical | 30m | None |
| 2 | Verify PropertyNFT contract on BaseScan — `npx hardhat verify --network base-sepolia <address> <constructor-args>` | 🔴 Critical | 45m | Task 1 |
| 3 | Verify FaircroftGovernor contract — note: OpenZeppelin Governor has specific verification quirks, may need `--contract` flag | 🔴 Critical | 1h | Task 1 |
| 4 | Verify FaircroftTreasury contract | 🔴 Critical | 45m | Task 1 |
| 5 | Verify DocumentRegistry contract | 🔴 Critical | 30m | Task 1 |
| 6 | Verify TimelockController contract | 🔴 Critical | 30m | Task 1 |
| 7 | Confirm all contracts show "Contract" tab on BaseScan with readable source + ABI | 🟡 High | 30m | Tasks 2-6 |
| 8 | Update `docs/contracts.md` with verified BaseScan links for all 5 contracts | 🟢 Medium | 30m | Task 7 |

**Day Total: ~5h**

---

## Saturday — Integration Testing

*Goal: Full data flow works end-to-end; RLS is secure*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Test RLS: as regular user, attempt to read another user's messages — should 403 | 🔴 Critical | 1h | All week |
| 2 | Test RLS: as regular user, attempt to create an emergency alert — should fail | 🔴 Critical | 45m | All week |
| 3 | Test Realtime: open two browser tabs with different wallets — send message, verify instant delivery | 🟡 High | 1h | All week |
| 4 | Test email delivery end-to-end: trigger dues reminder → verify email received | 🟡 High | 45m | Thu Tasks 4-6 |
| 5 | Stress test messages: send 50 messages in conversation — verify pagination/performance | 🟢 Medium | 45m | Tue Task 5 |
| 6 | Verify no localStorage dependency remains for alerts, messages, profiles, onboarding | 🔴 Critical | 1h | All week |
| 7 | Clear all localStorage in browser — reload app — confirm no broken state | 🔴 Critical | 30m | Task 6 |

**Day Total: ~5.75h**

---

## Sunday — Buffer, Fixes & Documentation

*Goal: Fix integration issues; document API layer*

| # | Task | Priority | Est. Time | Dependencies |
|---|------|----------|-----------|--------------|
| 1 | Address any bugs/failures found on Saturday | 🔴 Critical | 3h | Sat testing |
| 2 | Write `docs/supabase-schema.md` — document all tables, columns, RLS policies | 🟡 High | 1h | All week |
| 3 | Write `docs/email-system.md` — document email templates and trigger conditions | 🟢 Medium | 45m | Thu work |
| 4 | Update `.env.example` with all new required env vars (Supabase URL, anon key, Resend key) | 🟡 High | 20m | All week |
| 5 | Deploy updated build to staging; smoke test all new integrations | 🟡 High | 45m | Task 1 |

**Day Total: ~5.75h**

---

## Week 2 Success Criteria

- [ ] Zero localStorage dependencies for alerts, messages, profiles, onboarding
- [ ] Supabase RLS passes security tests (users can't access others' data)
- [ ] Email delivery working for dues reminders, alerts, and message notifications
- [ ] All 5 contracts verified and readable on Base Sepolia BaseScan
- [ ] Realtime updates working for alerts and messages
- [ ] `docs/supabase-schema.md` written and accurate

---

## Notes

- **Supabase RLS is non-negotiable** — don't skip it to save time. A misconfigured policy means any user can read all messages.
- **Resend free tier:** 3,000 emails/month — more than enough for testing. Keep logs in Supabase.
- **Contract verification:** If you used constructor arguments with ABI encoding, use `hardhat-etherscan`'s `--constructor-args` flag with an args file.
- **Realtime quotas:** Supabase free tier allows 200 concurrent connections — fine for beta.
