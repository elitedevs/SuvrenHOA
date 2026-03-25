# SuvrenHOA — What's Next: Planning Document

> **Status:** Active Development · Base Sepolia · 31+ Routes · 5 Smart Contracts · 11 Properties Minted
> **Last Updated:** March 2026
> **Purpose:** Roadmap for launch readiness, competitive differentiation, and long-term vision.

---

## Current State Snapshot

| Metric | Value |
|--------|-------|
| Routes | 31+ |
| Smart Contracts Deployed | 5 (Base Sepolia) |
| Properties Minted | 11 |
| Documents Registered On-Chain | 2 |
| Off-Chain Backend | Supabase (pets, vehicles, community data) |
| Phases Shipped | 4 phases + nav redesign, design system, legal/IP |

---

## Effort Key

| Symbol | Estimate |
|--------|----------|
| **S** | < 1 day |
| **M** | 1–3 days |
| **L** | 3–7 days |
| **XL** | 1–3 weeks |

---

## Section 1: MUST HAVE — Required for Launch

> These items must be complete before presenting SuvrenHOA to a real HOA board, investor, or pilot community. Nothing ships without these.

---

### 1.1 Multi-Property Support

**Description:** When a wallet holds multiple lot NFTs, the dashboard should display all owned properties — not just the first one. Property switcher or unified view for residents with multiple lots (e.g., board members who own investment units).

**Effort:** M  
**Dependencies:** NFT enumeration via contract, Supabase property-to-wallet mapping  
**Priority Notes:** Core UX — any HOA has residents with 2+ lots. A board member can't use the platform if they only see one property. HIGH priority, quick win.

---

### 1.2 Google Maps Integration

**Description:** Replace the current placeholder grid map with real Google Maps (or Mapbox) showing actual property pins. Each lot is a clickable marker with resident info, status indicators (violation, dues owed, etc.), and incident overlays.

**Effort:** L  
**Dependencies:** Google Maps API key (or Mapbox), property address data in Supabase, lat/lng geocoding for each lot  
**Priority Notes:** Visual centerpiece of the admin dashboard. Investors and HOA boards will click this first. HIGH priority — strong demo value.

---

### 1.3 Contract Verification on BaseScan

**Description:** Verify all 5 deployed smart contracts on BaseScan so source code is publicly auditable. Required for trust and transparency — any HOA or investor will look these up.

**Effort:** S  
**Dependencies:** Hardhat Verify or Foundry verify, BaseScan API key  
**Priority Notes:** One-time task, takes an afternoon. Unverified contracts are a red flag for sophisticated users. Do this immediately.

---

### 1.4 Real Arweave Document Upload

**Description:** Replace placeholder Arweave transaction IDs with actual uploads using the Arweave SDK or Bundlr/Turbo. Documents (meeting minutes, rules, amendments) should be truly immutable and retrievable by tx ID.

**Effort:** M  
**Dependencies:** Arweave wallet funded with AR tokens (or Turbo credits), file upload UI, MIME type handling  
**Priority Notes:** The "blockchain document registry" value prop falls apart if docs aren't actually on Arweave. Must be real before any demo.

---

### 1.5 USDC Payment Flow (End-to-End)

**Description:** Full test of the dues payment flow: resident connects wallet → sees balance owed → approves USDC → transaction confirmed → balance updates on-chain and in Supabase. Includes edge cases: insufficient balance, failed tx, already paid.

**Effort:** L  
**Dependencies:** USDC contract on Base Sepolia (faucet tokens), payment contract, Supabase dues ledger sync  
**Priority Notes:** This is how the HOA gets paid. If payments don't work flawlessly, nothing else matters. Must be bulletproof.

---

### 1.6 Email Notifications

**Description:** Automated email delivery via Resend for three critical triggers: (1) dues reminders 7 days and 1 day before due date, (2) new proposal created / voting opens, (3) new community announcements from the board. Emails should be branded, mobile-friendly HTML.

**Effort:** M  
**Dependencies:** Resend API key (already planned), email templates, resident email stored in Supabase, cron jobs or Supabase Edge Functions for scheduling  
**Priority Notes:** HOA residents will not check a dashboard daily. Email is how they participate. Required for any real community engagement.

---

### 1.7 Mobile Responsiveness Audit + Fixes

**Description:** Full audit of all 31+ routes on mobile viewports (375px, 390px, 428px). Fix broken layouts, overflow issues, unclickable buttons, and unreadable text. Target: fully usable on iOS Safari and Android Chrome without horizontal scroll.

**Effort:** L  
**Dependencies:** None — purely frontend work  
**Priority Notes:** Residents use phones. If it doesn't work on mobile, you've eliminated 60–70% of your actual user base. Non-negotiable.

---

### 1.8 Smart Contract Security Audit

**Description:** Engage a third-party auditor (or use automated tools like Slither, Mythril, and Certora for a preliminary pass) to review all 5 contracts. Document findings and remediate critical/high severity issues before mainnet deployment.

**Effort:** XL  
**Dependencies:** Finalized contract code, audit budget (~$5K–$50K for professional audit; free for automated tools)  
**Priority Notes:** HOA boards are legally responsible for community funds. Unaudited contracts handling real USDC will kill any serious adoption conversation. Plan and budget for this now.

---

### 1.9 Production Deployment

**Description:** Deploy to Base mainnet with a real domain (e.g., app.suvren.com or app.faircroftdao.com), HTTPS/SSL, environment variable management, and a CI/CD pipeline. Supabase project should be production-tier (not free tier for real data).

**Effort:** L  
**Dependencies:** Domain, Cloudflare or Vercel, Base mainnet RPC, funded deployer wallet, Supabase pro plan  
**Priority Notes:** Required to go from "demo" to "product." Base Sepolia is testnet — you can't onboard a real HOA on testnet.

---

### 1.10 Proper Error Handling on All Pages

**Description:** Every blockchain call, API request, and form submission needs try/catch with user-friendly error messages. Errors should explain what went wrong and what to do ("Transaction failed — check your USDC balance" vs. a raw revert message).

**Effort:** M  
**Dependencies:** Audit of all existing pages, consistent error component/toast system  
**Priority Notes:** Nothing destroys trust faster than silent failures or raw error dumps. This is table stakes for any product going to real users.

---

### 1.11 Loading States for Blockchain Data

**Description:** Every on-chain data fetch needs a skeleton loader or spinner — property data, dues balances, proposal states, voting results. Users on slow connections or congested networks should never see empty/broken UI.

**Effort:** M  
**Dependencies:** Existing component library, React Suspense or custom loading hooks  
**Priority Notes:** Blockchain data is inherently slower than REST APIs. Perceived performance matters enormously for first impressions.

---

### 1.12 Wallet Chain Switching Prompts

**Description:** When a user connects to the wrong network (e.g., Ethereum mainnet instead of Base), the app should automatically prompt them to switch via MetaMask/WalletConnect. Don't just show an error — guide them through the fix.

**Effort:** S  
**Dependencies:** wagmi/viem `switchChain` hook, network detection  
**Priority Notes:** Every non-crypto-native HOA resident will connect on the wrong chain. This is a required UX guard.

---

### 1.13 API Rate Limiting

**Description:** Add rate limiting to all Next.js API routes using a library like `upstash/ratelimit` or `express-rate-limit`. Prevent abuse, protect Supabase quota, and ensure fair use across residents.

**Effort:** S  
**Dependencies:** Upstash Redis (free tier works), middleware setup  
**Priority Notes:** Without rate limiting, one bad actor or bot can take down the platform. Required before public exposure.

---

### 1.14 Profile + Display Name Support

**Description:** First-time setup flow where residents enter their name, preferred display name, and optionally a photo. Everywhere a wallet address is shown, replace it with "Rick, Lot 12" or "Sarah Chen." Stored in Supabase, referenced globally.

**Effort:** M  
**Dependencies:** Supabase `profiles` table, profile setup route, global address-to-name resolver hook  
**Priority Notes:** "0x1234...abcd voted YES" is not a product experience. Real people need real names. This transforms the app from "crypto tool" to "community platform."

---

### 1.15 Onboarding Flow — Polished + Tested

**Description:** End-to-end onboarding: connect wallet → verify property ownership → set up profile → tour key features → done. Should work for both new residents and board members. Includes edge cases: no NFT found, wrong wallet, already registered.

**Effort:** L  
**Dependencies:** Profile system (1.14), NFT ownership verification, walkthroughs (can use Shepherd.js or similar)  
**Priority Notes:** The first 5 minutes determine if someone ever comes back. Invest in this — it's the difference between a confused prospect and a converted user.

---

### 1.16 Admin Dashboard — Batch Operations + Analytics

**Description:** Board members need to (1) batch-mint properties for new communities, (2) batch-update dues amounts, (3) see analytics — payment rates, voter participation, open violations. Replaces one-at-a-time management workflows.

**Effort:** L  
**Dependencies:** Batch mint contract function, Supabase analytics queries, charting library (Recharts or Chart.js)  
**Priority Notes:** An HOA board managing 200 units can't mint one property at a time. Batch ops are required for any community over ~20 lots.

---

## Section 2: SHOULD HAVE — Competitive Differentiators

> Features that elevate SuvrenHOA above basic HOA software. Not required for initial launch, but required to win against incumbents (Appfolio, HOA Express, Nabr) and justify blockchain-native design.

---

### 2.1 Map Incident Reporting System

**Description:** Residents can drop a pin on the community map to report incidents — noise complaints, damage, suspicious activity, or maintenance needs. Reports are color-coded by type, timestamped, and visible to board members. Status updates as the issue progresses.

**Effort:** L  
**Dependencies:** Google Maps integration (1.2), incident table in Supabase, geolocation API  
**Priority Notes:** Unique feature vs. traditional HOA tools. High resident engagement driver. Pairs well with the map-first UX vision.

---

### 2.2 Push Notifications (Web Push API)

**Description:** Browser-native push notifications for residents who opt in. Triggered by: dues due, voting open, announcements, violation notices, maintenance updates. Works on desktop and mobile (including iOS 16.4+ Safari).

**Effort:** M  
**Dependencies:** Service worker setup, VAPID keys, Supabase push subscription storage, notification trigger hooks  
**Priority Notes:** Complements email (1.6). Some residents ignore email — push gets their attention for time-sensitive items like voting deadlines.

---

### 2.3 SMS Notifications (Twilio)

**Description:** Opt-in SMS for critical alerts: dues overdue, emergency announcements, voting deadline reminders. Short, actionable messages with a deep link back to the platform.

**Effort:** M  
**Dependencies:** Twilio account, phone number storage in Supabase, opt-in consent flow  
**Priority Notes:** Highest open rate of any notification channel (~98%). Worth the cost for critical community communications. Especially valuable for older residents less engaged with apps.

---

### 2.4 Multi-Language Support

**Description:** i18n support for Spanish, French, and Mandarin at minimum. UI strings extracted to locale files, user language preference saved in profile. Many HOA communities are multilingual — English-only limits reach.

**Effort:** XL  
**Dependencies:** `next-intl` or `react-i18next`, translation files, RTL support consideration  
**Priority Notes:** Opens the platform to underserved communities. Important for HOA management companies operating in diverse markets.

---

### 2.5 Accessibility Audit (WCAG 2.1 AA)

**Description:** Full accessibility audit covering: color contrast ratios, keyboard navigation, screen reader compatibility (ARIA labels), focus management, and form field labeling. Fix all AA-level violations.

**Effort:** L  
**Dependencies:** Axe DevTools or Lighthouse CI, manual screen reader testing (NVDA/VoiceOver)  
**Priority Notes:** Legal requirement in some jurisdictions. Practical requirement for any community with elderly residents or members with disabilities. Also improves SEO.

---

### 2.6 PDF Export

**Description:** One-click PDF export for: proposal history with vote tallies, annual budget reports, meeting minutes, violation records. Formatted, branded PDFs suitable for board meetings and legal records.

**Effort:** M  
**Dependencies:** `@react-pdf/renderer` or Puppeteer PDF generation, data aggregation queries  
**Priority Notes:** HOA boards print everything. Board members will specifically ask for this. Strong enterprise credibility signal for investor demos.

---

### 2.7 Board Election System

**Description:** On-chain board elections with candidate nominations, voting period, and transparent results. Supports at-large positions, seat-specific elections, and term tracking. Results immutably recorded.

**Effort:** XL  
**Dependencies:** Election smart contract (new), candidate nomination flow, voter eligibility via NFT ownership  
**Priority Notes:** Core HOA governance feature. Many HOA legal disputes center on election integrity — blockchain transparency is a strong value proposition here.

---

### 2.8 Proxy Voting Delegation

**Description:** Token holders who can't vote (traveling, busy) can delegate their vote to another wallet for a specific proposal or time period. Delegation is revocable and on-chain.

**Effort:** M  
**Dependencies:** Delegation contract function or off-chain signature scheme, delegation UI  
**Priority Notes:** Increases governance participation rates. A governance system without delegation will see low turnout on important votes.

---

### 2.9 Recurring Payment Automation

**Description:** Residents can authorize recurring USDC dues payments on a monthly/quarterly schedule. Smart contract or off-chain scheduler handles auto-pay with wallet signature approval. Resident receives reminder and can cancel anytime.

**Effort:** XL  
**Dependencies:** Recurring payment contract (or Sablier stream), resident USDC approval flow, cancellation mechanism  
**Priority Notes:** Reduces delinquency rates dramatically. HOA boards love anything that eliminates dues chasing. Strong selling point.

---

### 2.10 HOA Fee Calculator

**Description:** Interactive calculator that estimates monthly dues based on: lot size, amenity access (pool, gym, gate), unit type (SFH vs. condo), and community budget inputs. Helps new communities set fair dues structures.

**Effort:** M  
**Dependencies:** Fee formula configuration in admin, lot data in Supabase  
**Priority Notes:** Useful onboarding tool for new HOA communities setting up the platform. Good lead gen content — shareable tool that drives traffic.

---

### 2.11 Meeting Scheduling + RSVP + Zoom Integration

**Description:** Board members schedule meetings (in-person or virtual), residents RSVP, and a Zoom meeting link is auto-generated and sent to attendees. Meeting agendas posted, minutes uploaded post-meeting.

**Effort:** L  
**Dependencies:** Zoom API, calendar integration (or custom), Supabase meeting/RSVP tables, email notifications (1.6)  
**Priority Notes:** HOA boards meet regularly. If the platform can replace the current "reply-all email chain" meeting coordination, it becomes deeply embedded in operations.

---

### 2.12 Resident Satisfaction Surveys

**Description:** Board-created surveys sent to residents with multiple choice, rating, and open text options. Results aggregated with charts. Optional anonymity. Useful for: amenity priority voting, contractor feedback, community sentiment.

**Effort:** M  
**Dependencies:** Survey table in Supabase, charting library, email/push delivery of survey invites  
**Priority Notes:** Differentiates from basic HOA tools. Boards that run surveys have higher resident satisfaction scores — gives them a reason to pay for the platform.

---

### 2.13 Maintenance Request Tracking

**Description:** Residents submit maintenance requests with description, location, and photo. Requests are assigned to a vendor or staff, with status updates (Submitted → Assigned → In Progress → Resolved). Resident gets notified at each stage.

**Effort:** L  
**Dependencies:** Photo upload (2.14), vendor management module, Supabase request table, notification hooks  
**Priority Notes:** One of the top 3 resident complaints about HOA management is "my request disappeared into a black hole." Solving this is a direct retention driver.

---

### 2.14 Photo Upload (Violations, Maintenance, Pets)

**Description:** File upload to Supabase Storage (or S3) for: violation evidence photos, maintenance request photos, pet registry photos, profile avatars. Includes image compression, file type validation, and size limits.

**Effort:** M  
**Dependencies:** Supabase Storage bucket setup, image compression (browser-side with `browser-image-compression`), upload progress UI  
**Priority Notes:** Foundational capability that unlocks violations, maintenance, and pet registry features. Build this once, use everywhere.

---

### 2.15 Dark/Light Theme Toggle

**Description:** System-aware and manual toggle between dark (current) and light themes. Theme preference saved in user profile and localStorage. All components audited for both theme compatibility.

**Effort:** M  
**Dependencies:** Tailwind dark mode config, CSS variable theming, preference storage  
**Priority Notes:** Currently dark-only. Broad user base will expect light mode. Simple win for accessibility and preference inclusivity.

---

### 2.16 Print-Friendly Views

**Description:** CSS print stylesheets for: meeting agendas, budget summaries, violation notices, and resident rosters. Sidebar nav and interactive elements hidden. Clean, professional formatting suitable for physical board meeting packets.

**Effort:** S  
**Dependencies:** None — purely CSS  
**Priority Notes:** HOA boards are paper-heavy. This takes hours to implement and makes the platform usable in a board meeting context. Easy win.

---

### 2.17 Batch Property Minting

**Description:** Admin workflow to mint multiple property NFTs at once from a CSV upload (address, lot number, owner wallet). Contract supports batch mint to reduce gas costs. Progress tracking for large communities.

**Effort:** L  
**Dependencies:** Batch mint contract function, CSV parser, admin UI with progress indicators  
**Priority Notes:** Any HOA with 50+ units needs this. One-at-a-time minting is a non-starter for board onboarding. Required for growth beyond small communities.

---

### 2.18 CSV Import/Export for Property Data

**Description:** Import property records from CSV (common export format from existing HOA software like Appfolio or CINC). Export resident roster, payment history, and violation history to CSV for external reporting.

**Effort:** M  
**Dependencies:** CSV parsing library (`papaparse`), Supabase bulk insert, data validation and conflict handling  
**Priority Notes:** Migration path from existing tools. Any HOA switching from another platform needs an import path — otherwise adoption requires manual re-entry of years of data.

---

## Section 3: NICE TO HAVE — Future Roadmap / V2

> Long-term vision features for V2 and beyond. These are the ideas that make SuvrenHOA a platform, not just an app. Build the foundation right (Sections 1–2) and these become achievable.

---

### 3.1 Nextdoor Integration

**Description:** Research and implement a connection to Nextdoor's API (if available) to cross-post community announcements, pull neighborhood activity, or allow single sign-on for Nextdoor-active residents.

**Effort:** L (pending API access research)  
**Dependencies:** Nextdoor developer API access (currently limited), legal review for data sharing  
**Priority Notes:** Nextdoor is already where HOA residents talk. Meeting them there reduces friction. However, API access is not guaranteed — validate feasibility before investing.

---

### 3.2 AI-Powered Violation Detection

**Description:** AI model that analyzes submitted photos to automatically detect potential violations — overgrown lawn, unauthorized structures, vehicle violations, exterior paint issues. Flags for human board review, doesn't auto-issue violations.

**Effort:** XL  
**Dependencies:** Vision AI API (Google Vision, OpenAI Vision, or custom fine-tune), photo upload infrastructure (2.14), violation workflow  
**Priority Notes:** High wow factor for demos and investor conversations. Practically useful for large communities where board members can't physically inspect everything. Build violation system first (2.13).

---

### 3.3 Predictive Maintenance Scheduling

**Description:** Based on asset age, usage patterns, and historical maintenance records, predict when community assets (pool pumps, HVAC, elevators, roofing) will need service. Generates proactive maintenance schedules and budget projections.

**Effort:** XL  
**Dependencies:** Asset inventory system, historical maintenance records, ML model or rules engine  
**Priority Notes:** Significant value for boards managing reserve funds. Prevents the "surprise $80K roof replacement" problem. Builds on maintenance tracking (2.13).

---

### 3.4 Insurance Integration

**Description:** Connect with HOA insurance providers to track policy status, generate certificates of insurance, manage claims, and remind boards of renewal dates. Possible commission revenue stream.

**Effort:** XL  
**Dependencies:** Insurance partner API agreements, compliance review  
**Priority Notes:** Multi-billion dollar market. Insurance is a pain point for every HOA board. Revenue opportunity beyond SaaS subscription.

---

### 3.5 Real Estate Listing Integration

**Description:** When a property in the community is listed for sale, surface the listing within the platform (Zillow/Realtor API). Allow board to share HOA documents with buyers during due diligence.

**Effort:** L  
**Dependencies:** Zillow/Realtor API access, property address-to-listing matching  
**Priority Notes:** Useful for prospective buyers researching a community. Also a natural upsell opportunity for real estate agents. Low effort if APIs are accessible.

---

### 3.6 Multi-HOA SaaS Platform

**Description:** Transform SuvrenHOA from a single-community tool to a multi-tenant SaaS platform. Each HOA gets their own subdomain (meadowbrook.suvren.com), brand colors, and isolated data. Billing per community or per unit.

**Effort:** XL  
**Dependencies:** Multi-tenancy architecture overhaul, white-labeling (3.7), billing integration (Stripe), community admin onboarding flow  
**Priority Notes:** This is the business model that scales. $30–$100/unit/year × thousands of HOAs is the path to a real company. Plan the architecture for this from day one — retrofitting multi-tenancy is painful.

---

### 3.7 White-Label Solution

**Description:** Full white-labeling for HOA management companies: custom domain, logo, brand colors, and optionally custom smart contract deployment. Management companies resell the platform to their portfolio communities.

**Effort:** XL  
**Dependencies:** Multi-HOA platform (3.6), theming system, management company admin tier  
**Priority Notes:** B2B2C channel. HOA management companies manage hundreds of communities — one enterprise sale unlocks massive distribution. High strategic value.

---

### 3.8 Mobile App (React Native / PWA)

**Description:** Native mobile app for iOS and Android (React Native) or enhanced PWA with offline support, push notifications, biometric login, and native camera access. Residents shouldn't need to visit a website to check their dues status.

**Effort:** XL  
**Dependencies:** API-first backend (already building this), React Native setup, mobile wallet integration (WalletConnect mobile deep links)  
**Priority Notes:** Consumer expectation is an app. A well-designed mobile app dramatically increases engagement. Consider PWA first as a faster path — modern PWAs are near-native quality.

---

### 3.9 Voice Assistant Integration

**Description:** Alexa and Google Home skills for community updates: "Alexa, ask my HOA what my dues balance is" or "Hey Google, any announcements from the community today?"

**Effort:** L  
**Dependencies:** Alexa Skills Kit, Google Actions, read-only API endpoints for dues/announcements  
**Priority Notes:** Novelty factor is high for demos. Practical utility is real for residents who check their smart speaker regularly. Low-risk V2 feature.

---

### 3.10 Smart Home Integration

**Description:** NFT-gated access to community amenities: pool entry, gym access, gate open/close, package room entry. Resident's wallet signature or NFT ownership authorizes hardware access via IoT bridge.

**Effort:** XL  
**Dependencies:** IoT hardware partners (smart locks, gate controllers), wallet-to-device auth bridge, legal/liability review  
**Priority Notes:** The ultimate "blockchain HOA" feature — physical access controlled by digital ownership. Technically complex but extremely compelling as a proof-of-concept and differentiator.

---

### 3.11 Carbon Footprint Tracking

**Description:** Per-household carbon footprint dashboard using utility data, EV ownership, and community sustainability metrics. Gamified leaderboard for community eco-challenges.

**Effort:** XL  
**Dependencies:** Utility data API (Green Button standard), emissions calculations, household profile data  
**Priority Notes:** ESG angle for environmentally conscious communities. Differentiates in premium markets (high-end condos, eco-communities). Secondary priority behind core governance features.

---

### 3.12 Community Marketplace

**Description:** Resident-to-resident buying, selling, and trading within the community. Think Facebook Marketplace but HOA-gated. Optional: NFT-based ownership transfer for high-value items.

**Effort:** L  
**Dependencies:** Listing/messaging system, Supabase marketplace tables, photo upload (2.14)  
**Priority Notes:** Increases platform stickiness and daily active usage. Residents who use the marketplace are more likely to engage with governance features. Lower effort than it sounds if built on existing infrastructure.

---

### 3.13 Neighborhood Watch Integration

**Description:** Connect with Ring or SimpliSafe neighborhood watch networks. Share alert clips (with consent) to community feed. Motion alert notifications during designated hours.

**Effort:** XL  
**Dependencies:** Ring API / SimpliSafe API (limited access), privacy/consent framework, legal review  
**Priority Notes:** High demand from gated communities and townhome associations. Privacy implications require careful design. API access from Ring/SimpliSafe may be limited.

---

### 3.14 Service Scheduling (Snow Removal / Lawn Care)

**Description:** Residents or the board can schedule recurring services — snow removal, lawn mowing, gutter cleaning — through vetted vendors. Schedule visible on community calendar. Batch orders reduce cost.

**Effort:** L  
**Dependencies:** Vendor management module, community calendar, payment integration  
**Priority Notes:** Practical everyday utility that keeps residents logging in year-round. Potential revenue share with vendors.

---

### 3.15 EV Charging Station Management

**Description:** For communities with EV charging stations: reservation system, usage tracking, billing per kWh, and waitlist management. NFT ownership could determine charging priority.

**Effort:** L  
**Dependencies:** OCPP-compliant charger API or vendor SDK, billing integration, reservation calendar  
**Priority Notes:** EV adoption is accelerating. New developments frequently include charging stations. First-mover advantage in HOA-specific EV management is real.

---

## Summary Table

| # | Feature | Effort | Section |
|---|---------|--------|---------|
| 1.1 | Multi-Property Support | M | Must Have |
| 1.2 | Google Maps Integration | L | Must Have |
| 1.3 | Contract Verification | S | Must Have |
| 1.4 | Real Arweave Upload | M | Must Have |
| 1.5 | USDC Payment Flow | L | Must Have |
| 1.6 | Email Notifications | M | Must Have |
| 1.7 | Mobile Responsiveness | L | Must Have |
| 1.8 | Smart Contract Audit | XL | Must Have |
| 1.9 | Production Deployment | L | Must Have |
| 1.10 | Error Handling | M | Must Have |
| 1.11 | Loading States | M | Must Have |
| 1.12 | Chain Switching Prompts | S | Must Have |
| 1.13 | API Rate Limiting | S | Must Have |
| 1.14 | Profile / Display Names | M | Must Have |
| 1.15 | Onboarding Flow | L | Must Have |
| 1.16 | Admin Batch + Analytics | L | Must Have |
| 2.1 | Map Incident Reporting | L | Should Have |
| 2.2 | Push Notifications | M | Should Have |
| 2.3 | SMS Notifications | M | Should Have |
| 2.4 | Multi-Language Support | XL | Should Have |
| 2.5 | Accessibility (WCAG) | L | Should Have |
| 2.6 | PDF Export | M | Should Have |
| 2.7 | Board Election System | XL | Should Have |
| 2.8 | Proxy Voting Delegation | M | Should Have |
| 2.9 | Recurring Payments | XL | Should Have |
| 2.10 | HOA Fee Calculator | M | Should Have |
| 2.11 | Meeting + Zoom Integration | L | Should Have |
| 2.12 | Resident Surveys | M | Should Have |
| 2.13 | Maintenance Request Tracking | L | Should Have |
| 2.14 | Photo Upload | M | Should Have |
| 2.15 | Dark/Light Theme | M | Should Have |
| 2.16 | Print-Friendly Views | S | Should Have |
| 2.17 | Batch Property Minting | L | Should Have |
| 2.18 | CSV Import/Export | M | Should Have |
| 3.1 | Nextdoor Integration | L | Nice to Have |
| 3.2 | AI Violation Detection | XL | Nice to Have |
| 3.3 | Predictive Maintenance | XL | Nice to Have |
| 3.4 | Insurance Integration | XL | Nice to Have |
| 3.5 | Real Estate Listings | L | Nice to Have |
| 3.6 | Multi-HOA SaaS Platform | XL | Nice to Have |
| 3.7 | White-Label Solution | XL | Nice to Have |
| 3.8 | Mobile App / PWA | XL | Nice to Have |
| 3.9 | Voice Assistant | L | Nice to Have |
| 3.10 | Smart Home / NFT Access | XL | Nice to Have |
| 3.11 | Carbon Footprint Tracking | XL | Nice to Have |
| 3.12 | Community Marketplace | L | Nice to Have |
| 3.13 | Neighborhood Watch | XL | Nice to Have |
| 3.14 | Service Scheduling | L | Nice to Have |
| 3.15 | EV Charging Management | L | Nice to Have |

---

## Recommended Launch Sequence

**Sprint 1 (Week 1–2): Foundation Hardening**
- Contract verification (1.3) — half day
- API rate limiting (1.13) — half day
- Chain switching prompts (1.12) — half day
- Error handling audit (1.10) — 2 days
- Loading states (1.11) — 2 days

**Sprint 2 (Week 3–4): Core UX**
- Profile + display names (1.14) — 3 days
- Multi-property support (1.1) — 2 days
- Mobile responsiveness (1.7) — 3 days

**Sprint 3 (Week 5–6): Blockchain Integrity**
- Real Arweave upload (1.4) — 2 days
- USDC payment flow end-to-end test (1.5) — 3 days
- Onboarding flow polish (1.15) — 3 days

**Sprint 4 (Week 7–8): Communication + Maps**
- Email notifications (1.6) — 2 days
- Google Maps integration (1.2) — 3 days
- Admin batch operations (1.16) — 2 days

**Sprint 5 (Week 9–12): Launch Prep**
- Smart contract audit (1.8) — ongoing, start early
- Production deployment (1.9) — 3 days
- Print views + PDF (2.16, 2.6) — quick wins during audit wait

---

*This document is intended for internal planning and co-founder / investor conversations. All estimates are best-effort given current codebase familiarity — actual timelines depend on team size and blockchain complexity.*
