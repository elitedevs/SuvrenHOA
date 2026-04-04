# SuvrenHOA Pricing Model

**Version 1.0** | April 2026  
**Status:** Draft for Review

---

## Competitive Landscape

Before setting prices, it's worth knowing what homeowners and HOA boards are already paying — and what they're getting for it.

### What the Competition Charges

| Platform | Pricing Model | Typical Monthly Cost | Notes |
|----------|--------------|---------------------|-------|
| **AppFolio** | ~$1.49/unit/mo + $298/mo minimum | $298–$1,500+/mo | Aimed at professional management companies, not HOA boards directly |
| **Buildium** | Flat tiers + per-unit fees | $52–$479+/mo | Essential ($52), Growth ($166), Premium ($479) — unit caps per tier |
| **TownSq** | ~$3–8/unit/mo | $150–$800/mo for 50–100 units | Popular HOA-specific tool, decent UX, no blockchain |
| **CINC Systems** | Custom / per-unit | $150–$400+/mo | Popular with property management companies |
| **HOALife** | Free–$5/unit/mo | $0–$150/mo | Limited free tier; paid plan adds enforcement tools |
| **PayHOA** | Flat tiers | $30–$110/mo | Budget-friendly; payments + basic features only |
| **Enumerate (Tops ONE)** | ~$1–3/unit/mo | $100–$300+/mo | Legacy system, widely used by management companies |
| **Vantaca** | Enterprise custom | $500+/mo | Full management company suite |
| **HOA Start** | Flat tiers | $39–$149/mo | Community website + basic features |

### Key Observations

1. **Price anchors:** Most mid-tier HOA software runs $100–$300/mo for a 50–150 unit community. Homeowners don't feel this — management companies absorb it into their fees.
2. **Per-unit pricing** ($1–8/unit/mo) is common for companies managing many properties; flat pricing is more common for self-managed HOAs.
3. **Free tiers exist** (HOALife, limited PayHOA) — we need a compelling free/trial offer or risk losing self-managed small HOAs to free tools.
4. **Nobody does blockchain.** SuvrenHOA is genuinely in a category of one.

---

## Pricing Philosophy

SuvrenHOA's value proposition isn't just features — it's **trust infrastructure**. The on-chain treasury, immutable voting records, and permanent document storage solve problems that no traditional software can even attempt to solve.

That said: HOA boards are made of volunteers with day jobs. They don't want to pay more. The blockchain backend has to be invisible enough that the price is compared to TownSq, not to a Ethereum node.

**Guiding principles:**
- Price below TownSq/CINC at all tiers (we can afford to — infra costs are nearly zero)
- Absorb gas fees at the platform level; never put "gas cost" on an invoice
- Reward annual commitment with meaningful discounts
- Don't nickel-and-dime on features — give the full product, charge for scale

---

## Blockchain Gas Costs — Who Pays?

**Short answer: The platform absorbs gas on behalf of HOAs.**

Gas costs on Base are negligible:
- A typical 100-unit HOA generates ~200 transactions/month
- At ~$0.001–0.005/tx on Base, that's **$0.20–$1.00/month in gas per community**
- Even at 1,000 communities, total gas is under $1,000/mo — a rounding error vs. subscription revenue

**Implementation:**
- Platform deploys a **gas station / relayer** (ERC-4337 paymaster or simple backend signer)
- Governance actions, votes, dues payments, and document registrations are **gasless for users**
- Users only interact with their wallets for approval signatures — they never pay gas
- Platform charges a flat monthly fee that covers gas as a cost of goods
- This eliminates the #1 crypto UX friction point for non-crypto users

**Exception:** Direct USDC treasury payments (dues) go wallet-to-contract; gas for this is ~$0.001 and MetaMask/Coinbase Wallet handles it natively. Still negligible.

---

## Pricing Tiers

### Tier 1 — Starter
**For self-managed HOAs under 50 units**

| | |
|---|---|
| **Monthly** | **$49/mo** |
| **Annual (billed yearly)** | **$39/mo ($468/yr)** — save $120 |
| **Per-unit equivalent** | $1.00–4.90/unit/mo depending on community size |
| **Setup fee** | None |
| **Free trial** | 60 days free, no credit card required |

**Included:**
- Up to 50 property NFTs (soulbound, 1 lot = 1 vote)
- On-chain governance: proposals, voting, timelock execution
- USDC treasury with auto 80/20 operating/reserve split
- Arweave document storage (permanent, tamper-proof) — up to 100 MB
- Community forum + announcements + calendar
- Maintenance requests + violation tracking
- Resident directory + pet/vehicle registration
- Architectural review workflow
- Transparency dashboard (public, shareable link)
- Email notifications (dues, votes, alerts)
- HOA Health Score
- AI community assistant (50 queries/mo)
- Gasless transactions (platform pays gas)
- Standard support (email, 48h response)

**Not included:**
- White-label/custom domain
- Property management company multi-community dashboard
- Priority support

---

### Tier 2 — Professional
**For HOAs with 50–200 units, or self-managed communities wanting more power**

| | |
|---|---|
| **Monthly** | **$129/mo** |
| **Annual (billed yearly)** | **$99/mo ($1,188/yr)** — save $360 |
| **Per-unit equivalent** | $0.65–2.60/unit/mo |
| **Setup fee** | None |
| **Free trial** | 60 days free, no credit card required |

**Everything in Starter, plus:**
- Up to 200 property NFTs
- Custom subdomain (`yourcommunity.suvren.co`)
- White-label emails (from your HOA's domain)
- Advanced governance: proposal categories, dynamic quorum, supermajority rules
- Expanded document storage: 1 GB on Arweave
- Amenity reservations system
- Neighbor messaging (wallet-to-wallet, encrypted)
- Move-in/out wizard with automated onboarding
- Emergency alert broadcast system
- Neighborhood map with property visualization
- Community leaderboard + engagement gamification
- Activity ticker (real-time on-chain event feed)
- Smart dues reminders (automated 3-stage workflow)
- AI community assistant (unlimited queries)
- Priority support (email + Discord, 24h response)
- Quarterly governance health report

---

### Tier 3 — Enterprise
**For large communities (200+ units) or property management companies managing multiple HOAs**

| | |
|---|---|
| **Per community (200+ units)** | **$249/mo** or **$199/mo annual** |
| **Management company bundle** | **Starting at $499/mo for up to 5 communities** (each up to 500 units) |
| **Additional communities** | $99/mo per additional community (annual commitment) |
| **Per-unit equivalent** | ~$0.40–1.25/unit/mo |
| **Setup fee** | $500 one-time (includes white-glove onboarding) |
| **Free trial** | 30-day pilot, full features |

**Everything in Professional, plus:**
- Unlimited property NFTs per community
- Custom domain (`governance.yourhoaname.com`)
- Full white-label (remove SuvrenHOA branding)
- Multi-community management dashboard
- Bulk NFT minting via CSV import
- API access (read/write governance data)
- Custom governance rule configuration
- Advanced reporting + CSV/PDF exports
- Board member role management + fine-grained permissions
- Dedicated Gnosis Safe deployment per community (platform-assisted)
- Integration support (existing accounting software, property management tools)
- Dedicated account manager
- SLA: 4-hour response, 99.9% uptime guarantee
- Onboarding assistance (board training, homeowner setup guides, wallet setup help)
- Smart contract upgrade notifications

---

## Feature Comparison Matrix

| Feature | Starter | Professional | Enterprise |
|---------|---------|-------------|------------|
| Max units | 50 | 200 | Unlimited |
| Soulbound property NFTs | ✅ | ✅ | ✅ |
| On-chain voting | ✅ | ✅ | ✅ |
| USDC treasury | ✅ | ✅ | ✅ |
| 80/20 auto reserve split | ✅ | ✅ | ✅ |
| Arweave document storage | 100 MB | 1 GB | Unlimited |
| Community forum | ✅ | ✅ | ✅ |
| Maintenance requests | ✅ | ✅ | ✅ |
| Violation tracking | ✅ | ✅ | ✅ |
| Transparency dashboard | ✅ | ✅ | ✅ |
| HOA Health Score | ✅ | ✅ | ✅ |
| AI assistant | 50/mo | Unlimited | Unlimited |
| Email notifications | ✅ | ✅ | ✅ |
| Custom subdomain | ❌ | ✅ | ✅ |
| Custom domain | ❌ | ❌ | ✅ |
| White-label | ❌ | ❌ | ✅ |
| Amenity reservations | ❌ | ✅ | ✅ |
| Neighbor messaging | ❌ | ✅ | ✅ |
| Move-in/out wizard | ❌ | ✅ | ✅ |
| Emergency alerts | ❌ | ✅ | ✅ |
| Neighborhood map | ❌ | ✅ | ✅ |
| Multi-community dashboard | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Bulk NFT minting (CSV) | ❌ | ❌ | ✅ |
| Dedicated account manager | ❌ | ❌ | ✅ |
| Gasless transactions | ✅ | ✅ | ✅ |
| Support | Email, 48h | Email + Discord, 24h | Dedicated, 4h SLA |

---

## Setup Fees & Onboarding

| Tier | Setup Fee | What's Included |
|------|-----------|-----------------|
| Starter | Free | Self-service setup wizard, video tutorials, docs |
| Professional | Free | Self-service + email onboarding support |
| Enterprise | $500 one-time | White-glove: 2 onboarding calls, bulk NFT minting, document migration, board training session, custom governance config |

**Note:** The $500 Enterprise setup fee is intentionally low — it's not a revenue driver, it's a barrier that ensures committed customers and funds the actual time spent on onboarding.

---

## Payment Processing

- Platform collects subscription fees via Stripe (credit/debit card)
- HOA dues flow directly wallet-to-smart-contract (USDC) — platform takes no cut of dues
- No transaction fees on HOA dues payments
- Optional: Platform can offer USDC on-ramp assistance (Coinbase integration guide) at no charge

**Revenue model is pure SaaS subscription — not a payment processor taking a cut of HOA funds.** This is an important trust signal. The platform makes money from subscriptions, not from touching the community's money.

---

## Free Trial Terms

- 60-day free trial (Starter/Professional), 30-day (Enterprise)
- Full feature access during trial
- No credit card required
- At trial end: subscribe or community data archived (downloadable for 90 days)
- For pilot communities (Raleigh/Triangle area, 2026): extended free access in exchange for feedback and case study participation

---

## Annual Pricing Summary

| Tier | Monthly | Annual (monthly equiv.) | Annual savings |
|------|---------|------------------------|---------------|
| Starter | $49 | $39/mo ($468/yr) | $120/yr |
| Professional | $129 | $99/mo ($1,188/yr) | $360/yr |
| Enterprise (per community) | $249 | $199/mo ($2,388/yr) | $600/yr |
| Enterprise (5-community bundle) | $499 | $399/mo ($4,788/yr) | $1,200/yr |

---

## Competitive Positioning

At $49/mo for Starter, SuvrenHOA undercuts TownSq and CINC on price while delivering something no competitor can touch: **immutable, on-chain governance**. A 30-unit HOA paying $49/mo is getting a platform that would otherwise cost $90–240/mo from traditional software — plus blockchain transparency that isn't available at any price from legacy tools.

The goal for Year 1 is not to maximize revenue per customer. It's to get communities on-chain, build case studies, and make the blockchain-native HOA governance model feel normal. Pricing achieves that.

---

*Last updated: April 2026*
