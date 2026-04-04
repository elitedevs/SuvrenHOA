# SuvrenHOA — Retail Side Build Phases
> The complete plan to turn the MVP into a sellable SaaS product
> From "Connect Wallet" to "Start Free Trial" to first paying customer

---

## Current State
- ✅ 80+ page app built (governance, treasury, documents, community)
- ✅ Smart contracts deployed on Base Sepolia (7 contracts, 122 tests)
- ✅ Landing page live at /landing
- ✅ Design system polished (V6 audit: 52/60)
- ✅ Legal docs ready (ToS, Privacy, LLC, Patent)
- ✅ Business docs ready (pricing, GTM, pitch deck)
- ❌ No email auth (wallet-only)
- ❌ No payment/billing (Stripe)
- ❌ No onboarding flow
- ❌ No multi-community support
- ❌ No admin community creation
- ❌ Landing page not wired as homepage
- ❌ No marketing site (about, blog, docs)

---

## Phase 1: Foundation (Week 1-2)
> **Goal:** Email auth works, landing page is the front door

### 1.1 — Email-First Auth
- [ ] Install Supabase Auth (email/password + magic links)
- [ ] Create `/signup` page — email, password, name, role selector (board member / property manager / resident)
- [ ] Create `/login` page — email/password + "Forgot password"
- [ ] Email verification flow (Supabase sends verification link)
- [ ] Session management — Supabase session + middleware
- [ ] Create `profiles` table in Supabase (id, email, name, role, wallet_address nullable, avatar_url, created_at)
- [ ] Auth context provider wrapping the app
- [ ] Protected route middleware — redirect unauthenticated to /login

### 1.2 — Landing Page as Homepage
- [ ] Move current `/` (wallet dashboard) to `/dashboard`
- [ ] Wire landing page as the new `/` for unauthenticated visitors
- [ ] Authenticated users hitting `/` redirect to `/dashboard`
- [ ] Update all internal links (/dashboard, not /)
- [ ] Nav bar: show "Sign In" / "Start Free Trial" when logged out, show user menu when logged in

### 1.3 — Wallet Linking (Separate from Auth)
- [ ] New `/settings/wallet` page — "Connect Your Governance Key"
- [ ] Guided MetaMask/WalletConnect setup with plain-English explainer
- [ ] "Skip for now" option — sets `wallet_linked: false` in profile
- [ ] Wallet address stored in `profiles.wallet_address`
- [ ] Persistent banner when wallet not linked: "Connect your governance key to vote and pay dues"
- [ ] Feature gating: voting, dues, proposals require wallet. Forum, directory, docs, calendar don't.

**Deliverable:** Someone can sign up with email, browse the app, and optionally connect a wallet later.

---

## Phase 2: Community & Billing (Week 3-4)
> **Goal:** Board members can create a community and start a subscription

### 2.1 — Community Creation Flow
- [ ] Create `communities` table (id, name, address, city, state, zip, unit_count, logo_url, created_by, plan, status, created_at)
- [ ] Create `community_members` table (id, community_id, profile_id, role: admin/manager/member, joined_at)
- [ ] `/create-community` page — name, address, unit count, upload logo
- [ ] Creator automatically becomes admin
- [ ] Community dashboard at `/c/[community_id]/dashboard`
- [ ] Community settings page (name, address, dues amount, meeting schedule)
- [ ] Multi-community support — user can belong to multiple communities
- [ ] Community switcher in sidebar header

### 2.2 — Stripe Integration
- [ ] Install Stripe SDK
- [ ] Create Stripe products matching 3 tiers (Starter $49, Professional $129, Enterprise $249)
- [ ] Create `subscriptions` table (id, community_id, stripe_customer_id, stripe_subscription_id, plan, status, trial_end, current_period_end)
- [ ] `/checkout` page — plan selection → Stripe Checkout session
- [ ] 60-day free trial (no CC required) — Stripe trial period
- [ ] Webhook handler: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
- [ ] Subscription status displayed in community settings
- [ ] Grace period logic — 7 days after failed payment before access restricted
- [ ] Annual billing option (Stripe price IDs for both monthly + annual)

### 2.3 — Plan Enforcement
- [ ] Middleware checks community plan + status on every request
- [ ] Starter: max 50 property NFTs
- [ ] Professional: max 200, unlocks health score, advanced reports, custom branding
- [ ] Enterprise: unlimited, API access, white-label
- [ ] Expired/cancelled: read-only mode (can view, can't create)
- [ ] Upgrade/downgrade flow in community settings

**Deliverable:** Board member signs up → creates community → picks plan → starts trial. Stripe handles billing.

---

## Phase 3: Resident Onboarding (Week 5-6)
> **Goal:** Board can invite residents, residents can join and participate

### 3.1 — Invitation System
- [ ] Create `invitations` table (id, community_id, email, role, token, status: pending/accepted/expired, invited_by, created_at, expires_at)
- [ ] Admin `/invite` page — single email invite + bulk CSV upload
- [ ] Invitation email template (Supabase edge function or Resend/SendGrid)
- [ ] Magic link: recipient clicks → lands on signup (pre-filled community + role)
- [ ] QR code generator for in-person onboarding (encodes invite URL)
- [ ] Printable invite card template (for board meetings)
- [ ] Invitation management page — see pending, resend, revoke

### 3.2 — Resident Experience
- [ ] Resident sees their community dashboard after login
- [ ] "Getting Started" checklist widget:
  - [ ] Complete your profile ✓
  - [ ] Connect your governance key (optional) ✓
  - [ ] Read the community rules ✓
  - [ ] Cast your first vote ✓
  - [ ] View the treasury ✓
- [ ] Progress bar showing completion percentage
- [ ] Sample/demo proposal for first vote experience
- [ ] Welcome message from board (configurable)

### 3.3 — Property NFT Minting (Admin Action)
- [ ] Admin page: "Assign Properties" — upload CSV of lot numbers + wallet addresses
- [ ] Batch mint Property NFTs to resident wallets
- [ ] Require resident to have linked wallet before NFT assignment
- [ ] NFT assignment confirmation + notification to resident
- [ ] Property list view with assignment status (assigned / unassigned / pending wallet)

**Deliverable:** Full loop — board creates community, invites residents, residents join, connect wallets, get NFTs, can vote.

---

## Phase 4: Marketing Site & Content (Week 7-8)
> **Goal:** Professional web presence that converts visitors to trials

### 4.1 — Marketing Pages
- [ ] `/about` — Company story, Ryan's background, mission statement
- [ ] `/pricing` — Standalone pricing page (expanded from landing section)
- [ ] `/security` — Deep dive on the technology, how blockchain works (plain English)
- [ ] `/contact` — Contact form + support@suvren.co
- [ ] `/blog` — Blog framework (MDX or Supabase-backed)
- [ ] `/docs` — Public documentation / knowledge base
- [ ] `/demo` — Interactive demo walkthrough (no signup required)

### 4.2 — SEO & Content
- [ ] Write 5 launch blog posts:
  1. "Why Your HOA Board Can't Be Trusted (And What to Do About It)"
  2. "HOA Embezzlement: $100M/Year Problem Nobody Talks About"
  3. "What 'Tamper-Proof' Actually Means for Your HOA"
  4. "SuvrenHOA vs. AppFolio vs. TownSq: An Honest Comparison"
  5. "How We Built an Unhackable HOA Treasury"
- [ ] Meta tags, OG images, structured data for all pages
- [ ] Sitemap.xml + robots.txt
- [ ] Google Search Console setup
- [ ] Schema markup for SaaS product

### 4.3 — Video & Social
- [ ] Record 90-second explainer video (script is written)
- [ ] Create 30-second social cut for LinkedIn/Twitter
- [ ] Upload to YouTube + embed on landing page
- [ ] LinkedIn company page for Suvren LLC
- [ ] Twitter/X account @SuvrenHOA

**Deliverable:** Complete web presence — marketing site, blog, docs, video, social profiles.

---

## Phase 5: Production Readiness (Week 9-10)
> **Goal:** Base mainnet, real money, real communities

### 5.1 — Mainnet Deployment
- [ ] Deploy all 7 contracts to Base mainnet
- [ ] Verify contracts on BaseScan
- [ ] Update frontend to point to mainnet
- [ ] Test full flow on mainnet with real USDC (small amounts)
- [ ] Gas station / relayer for gasless transactions
- [ ] Environment switching (testnet for demo, mainnet for production)

### 5.2 — Security Hardening
- [ ] Smart contract audit (at minimum: self-audit + OpenZeppelin Defender)
- [ ] Rate limiting on all API routes
- [ ] CORS configuration
- [ ] CSP headers
- [ ] Input sanitization on all user inputs
- [ ] Supabase RLS (Row Level Security) on all tables
- [ ] Penetration testing on auth flows
- [ ] Error monitoring (Sentry or similar)

### 5.3 — Operations
- [ ] Uptime monitoring (UptimeRobot or Betterstack)
- [ ] Automated database backups
- [ ] Log aggregation
- [ ] Alert system for failed payments, contract errors, high gas
- [ ] Customer support workflow (email → ticket → response SLA)
- [ ] Admin panel for Suvren team (view all communities, subscriptions, health)

**Deliverable:** Production system that handles real money, real governance, real communities.

---

## Phase 6: Launch (Week 11-12)
> **Goal:** First paying customers

### 6.1 — Founding Community Program
- [ ] Identify 3 HOA communities in Raleigh/Triangle area
- [ ] Offer 12-month free access in exchange for feedback + case study
- [ ] White-glove onboarding: Ryan personally helps each board set up
- [ ] Weekly check-ins for first month
- [ ] Collect testimonials + screenshot permissions
- [ ] Document everything for case studies

### 6.2 — Soft Launch
- [ ] Publish case studies from founding communities
- [ ] Activate Stripe billing for new signups
- [ ] Submit to Product Hunt
- [ ] Post launch announcement on LinkedIn, Twitter, HN
- [ ] Email HOA management companies in NC with pitch deck
- [ ] Attend local HOA board meeting (offer to present)
- [ ] CAI Carolinas Chapter outreach

### 6.3 — Iterate
- [ ] Weekly user feedback sessions
- [ ] Track activation metrics (signup → community created → first vote)
- [ ] Track retention (monthly active communities)
- [ ] A/B test landing page headline
- [ ] Prioritize feature requests from paying customers
- [ ] Monthly product update email to all communities

**Deliverable:** Paying customers, case studies, organic growth started.

---

## Timeline Summary

| Phase | Weeks | Focus | Key Deliverable |
|-------|-------|-------|-----------------|
| 1 | 1-2 | Email auth + landing page | Users can sign up |
| 2 | 3-4 | Community creation + Stripe | Boards can create + subscribe |
| 3 | 5-6 | Resident invites + NFT minting | Full community loop works |
| 4 | 7-8 | Marketing site + content | Professional web presence |
| 5 | 9-10 | Mainnet + security + ops | Production-ready |
| 6 | 11-12 | Founding communities + launch | First paying customers |

**Total: 12 weeks from today to first revenue.**

---

## Cost Estimate (12-week build)

| Item | Cost |
|------|------|
| AI compute (Jenny + sub-agents) | ~$1,500-2,500 |
| Patent filing | $160 |
| LLC filing | $125 |
| Registered agent (annual) | $100 |
| Domain (suvren.co) | Already owned |
| Supabase (Pro plan) | $25/mo × 3 = $75 |
| Stripe | Free until revenue |
| Hosting (Docker on xrpburner) | $0 (existing infra) |
| SendGrid/Resend (email) | Free tier |
| Vercel or Cloudflare (if needed) | Free tier |
| **Total to launch** | **~$2,000-3,000** |

That's the cost of a weekend trip to build a company with patent-pending technology, a complete product, and a path to $24K-60K ARR Year 1.

---

## Success Metrics

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Communities signed up | 3 (free pilots) | 8-12 | 20-30 |
| Paying communities | 0 | 5-8 | 15-25 |
| MRR | $0 | $400-800 | $1,500-3,000 |
| Churn (monthly) | N/A | <5% | <5% |
| NPS | >50 | >60 | >70 |

---

*"One community is a customer. Ten communities is a network. A hundred communities is an economy."*

*© 2026 Suvren LLC · Patent Pending · Built on Base*
