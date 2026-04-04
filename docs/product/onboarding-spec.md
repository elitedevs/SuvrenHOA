# SuvrenHOA — Email-First Onboarding Flow
## Product Specification v1.0

**Status:** Draft  
**Author:** Jenny (AI)  
**Date:** 2026-04-04  
**Audience:** Engineering, Design, Product

---

## Overview

SuvrenHOA is a blockchain-powered HOA governance platform. This spec defines the full onboarding experience following the **email-first authentication decision**: users sign up with traditional email/password credentials, and wallet connection is introduced later as a feature — not a prerequisite.

### Design Philosophy

- **Meet users where they are.** HOA board members and residents are not crypto natives. The platform must feel like any modern SaaS product on day one.
- **Earn trust before asking for change.** Wallet setup is introduced only after the user has experienced value — not as a gating mechanism.
- **Progressive disclosure.** Complexity is revealed in layers. Blockchain capabilities are unlocked, not required.
- **Plain English throughout.** No wallet jargon, no gas fees, no "Web3" labels. Use "governance key," "secure identity," "tamper-proof record."

---

## Onboarding Flow Overview

```
[Landing Page]
      ↓
[Step 1: Account Creation]   ← Email + Password (Supabase Auth)
      ↓
[Step 2: Email Verification] ← Magic link confirmation
      ↓
[Step 3: Profile Setup]      ← Name, role selection
      ↓
[Step 4: Plan Selection]     ← Tiers or Free Trial
      ↓
[Step 5: Community Setup]    ← Board/Manager only (residents skip)
      ↓
[Step 6: Wallet Setup]       ← Optional, skippable, clearly framed
      ↓
[Step 7: Invite Residents]   ← Board/Manager only
      ↓
[Step 8: Guided First Actions] ← Interactive checklist tour
      ↓
[Dashboard]
```

Residents invited by a board member enter at Step 1 via magic link and skip Steps 4–5.

---

## Step 1: Account Creation

### Screen: Sign Up

**URL:** `/signup`

**Fields:**
| Field | Type | Validation |
|-------|------|------------|
| Email address | `<input type="email">` | Valid email format, unique in Supabase Auth |
| Password | `<input type="password">` | Min 8 chars, 1 uppercase, 1 number |
| Confirm Password | `<input type="password">` | Must match password |
| Terms of Service | Checkbox | Required to proceed |

**UI Notes:**
- Show/hide password toggle on both password fields
- Inline validation on blur (not on every keystroke)
- "Already have an account? Sign in" link
- Social auth is out of scope for v1 but don't break the layout if added later

**Backend:**
- Call `supabase.auth.signUp({ email, password })`
- On success: Supabase sends verification email automatically
- Store nothing beyond what Supabase Auth provides at this point
- Redirect to `/verify-email` holding page

**Error States:**
- `Email already registered` → Show "Try signing in instead" with link
- `Weak password` → Surface inline before submission
- `Network error` → Toast: "Something went wrong. Please try again."

---

## Step 2: Email Verification

### Screen: Check Your Inbox

**URL:** `/verify-email`

**Content:**
- Heading: "Check your inbox"
- Body: "We sent a confirmation link to **{email}**. Click it to activate your account."
- Resend link: "Didn't get it? Resend email" (rate-limited: once per 60 seconds, 3× per hour)
- "Wrong email?" link → returns to signup with email pre-filled

**Backend:**
- Supabase handles verification token via `PKCE` flow or magic link
- On click of email link → Supabase confirms session → redirect to `/onboarding/profile`
- If token expired (>24h): show error page with "Request a new link" button

**Database:**
- No custom schema changes needed here — Supabase `auth.users` tracks `email_confirmed_at`

---

## Step 3: Profile Setup

### Screen: Tell Us About Yourself

**URL:** `/onboarding/profile`

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| First Name | Text | Required |
| Last Name | Text | Required |
| Display Name | Text | Auto-populated as "First Last", editable |
| Role | Radio / Select | See roles below |
| Phone (optional) | Tel | Used for urgent HOA notices |

**Role Options:**
| Role Value | Label | Description shown to user |
|------------|-------|--------------------------|
| `admin` | Board Member | "I serve on the HOA board or am a community administrator" |
| `manager` | Property Manager | "I manage the community on behalf of the board" |
| `member` | Resident / Homeowner | "I live in the community" |

**UI Notes:**
- Role selection should use visual cards (icon + label + description), not a plain dropdown
- Selected role card gets a highlighted border
- Tooltip: "You can change this later in settings"

**Backend:**
- On submit: upsert to `public.profiles` table

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
  wallet_address TEXT,
  wallet_linked_at TIMESTAMPTZ,
  onboarding_step TEXT DEFAULT 'profile',
  onboarding_completed_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

- `onboarding_step` tracks where in the flow the user is for resume-on-return
- RLS policy: users can only read/write their own profile row

**Routing After Submit:**
- `admin` or `manager` → `/onboarding/plan`
- `member` → `/onboarding/plan` (limited plan view) OR skip to `/onboarding/wallet` if invited by a community

---

## Step 4: Plan Selection

### Screen: Choose Your Plan

**URL:** `/onboarding/plan`

**Plan Tiers:**

| Plan | Price | Unit Limit | Key Features |
|------|-------|------------|--------------|
| **Starter** | $49/mo | ≤ 50 units | Voting, docs, forum, maintenance, email support |
| **Professional** | $129/mo | ≤ 200 units | Everything in Starter + treasury dashboard, reporting, priority support |
| **Enterprise** | $249/mo | Unlimited | Everything in Pro + custom domain, dedicated onboarding, SLA |
| **Free Trial** | $0 | Any size | Full Professional features, 60 days, no credit card |

**UI Notes:**
- "Most Popular" badge on Professional
- Toggle: Monthly / Annual (Annual = 2 months free — show savings)
- "Start Free Trial" CTA should be the primary action — visually dominant
- Paid plan CTAs: "Get Started" → redirects to Stripe Checkout
- Free trial: no redirect needed, activate in-app immediately
- Show feature comparison table collapsed by default, expandable

**Free Trial Flow:**
1. User clicks "Start Free Trial"
2. Record `trial_started_at = now()`, `trial_ends_at = now() + 60 days` in `public.subscriptions`
3. Grant `plan = 'professional'` access for duration
4. No credit card collected
5. Reminder emails at: Day 45, Day 55, Day 58, Day 60 (expiry)

**Paid Plan Flow (Stripe):**
1. Create Stripe Customer if not exists → store `stripe_customer_id` on profile
2. Create Stripe Checkout Session with `mode: 'subscription'`
3. Pass `client_reference_id: supabase_user_id` for webhook reconciliation
4. On `checkout.session.completed` webhook:
   - Update `public.subscriptions` with `stripe_subscription_id`, `plan`, `status: 'active'`
   - Redirect user back to `/onboarding/community`

**Database:**
```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id),
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise', 'trial')),
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Member / Resident Path:**
- Members invited to an existing community skip plan selection (billed through the community admin)
- Show: "Your community covers your access — no payment needed"
- Auto-redirect to `/onboarding/wallet`

---

## Step 5: Community Setup

### Screen: Set Up Your Community

**URL:** `/onboarding/community`

**Who sees this:** `admin` and `manager` roles only. Members are redirected to wallet setup.

### 5a. Basic Info

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Community Name | Text | Required. E.g. "Faircroft HOA" |
| Street Address | Text | Required |
| City | Text | Required |
| State | Select | US states + territories |
| ZIP Code | Text | Required, 5-digit or ZIP+4 |
| Number of Units | Number | Required. Used for plan enforcement |
| Community Type | Select | Single-Family, Condo/Townhome, Mixed-Use, Other |

**Validation:**
- If `unit_count` exceeds selected plan limit → show upgrade prompt inline
- Example: "Your Starter plan supports up to 50 units. You've entered 75. Upgrade to Professional."

### 5b. Document Upload (Optional)

**Section heading:** "Upload your community documents (optional)"  
**Subtext:** "You can always add these later. Accepted formats: PDF, DOCX, DOC."

**Upload slots:**
- CC&Rs (Covenants, Conditions & Restrictions)
- Bylaws
- Rules & Regulations
- Other (freeform label)

**Backend:**
- Upload to Supabase Storage bucket `community-documents`
- Store metadata in `public.documents` table (community_id, filename, category, uploaded_by, url)
- Max file size: 25MB per file
- Storage path: `/{community_id}/onboarding/{filename}`

### 5c. Resident List Import (Optional)

**Section heading:** "Import your residents (optional)"  
**Subtext:** "Upload a CSV to invite your community at once. You can also add residents manually later."

**CSV Format Requirements:**
```
first_name,last_name,email,unit_number,phone
Jane,Smith,jane@example.com,101,555-0100
```

**UI:**
- Download CSV template button
- Drag-and-drop upload zone
- Preview table after upload (first 10 rows visible, scrollable)
- Column mapping interface if headers don't match exactly
- Validation errors shown per row (e.g., "Row 4: invalid email format")
- "Import [N] residents" CTA — only enabled if no errors

**Backend:**
- Parse CSV server-side (Next.js API route or Supabase Edge Function)
- Create `pending_invitations` records (not yet sent)
- Invitations sent in Step 7

### 5d. Basic Settings

**Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Monthly Dues Amount | Currency ($) | Optional. Used for dues reminders and payment setup |
| Regular Meeting Day | Select | Monday–Sunday |
| Regular Meeting Time | Time picker | Optional |
| Dues Due Date | Select | 1st–28th of month |
| Fiscal Year Start | Month select | January by default |

**Database:**
```sql
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  unit_count INTEGER NOT NULL,
  community_type TEXT,
  dues_amount NUMERIC(10,2),
  dues_due_day INTEGER CHECK (dues_due_day BETWEEN 1 AND 28),
  meeting_day TEXT,
  meeting_time TIME,
  fiscal_year_start INTEGER CHECK (fiscal_year_start BETWEEN 1 AND 12),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
  unit_number TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, user_id)
);
```

---

## Step 6: Wallet Setup

### Screen: Set Up Your Governance Key

**URL:** `/onboarding/wallet`

**Philosophy:** This must not feel like a crypto tutorial. Frame it as identity and security.

### Hero Copy

> **"Set up your secure governance key"**
>
> Your governance key is like a digital signature — unique to you and impossible to forge. It's how your votes are recorded permanently and transparently, so your voice in the HOA can never be altered or disputed.
>
> No one can vote on your behalf. No one can change your vote. That's the point.

**Do NOT use:** "crypto wallet," "blockchain," "Web3," "gas fees," "seed phrase" (on first screen)

### Wallet Options

Display as cards:

| Option | Label | Description |
|--------|-------|-------------|
| MetaMask | "MetaMask (Recommended)" | Works in your browser. We'll walk you through setup. |
| WalletConnect | "Mobile Wallet" | Use any wallet app on your phone |
| Coinbase Wallet | "Coinbase Wallet" | Easy setup, works on mobile and desktop |

**MetaMask Guided Install Flow:**
1. Check if `window.ethereum` is present
2. If not: Show step-by-step "Install MetaMask" mini-guide (link to metamask.io, screenshot steps)
3. Poll `window.ethereum` every 2 seconds for up to 60 seconds after link click
4. Once detected: auto-advance to "Connect" step
5. Call `wagmi.connect({ connector: metaMaskConnector })`
6. On success: show wallet address (truncated: `0x1234...abcd`)
7. Store in `profiles.wallet_address`

**WalletConnect Flow:**
- Show QR code modal (standard RainbowKit flow)
- On scan + approve: capture address, store in profile

**Coinbase Wallet Flow:**
- Standard RainbowKit Coinbase connector
- Deep link to Coinbase Wallet app if on mobile

### Skip Option

Below the wallet cards, always show:

> **"I'll set this up later"**  
> *You can still access the community forum, documents, directory, and calendar. Voting and dues payment require a governance key.*

**UI:** Secondary link, not a button — reduce visual weight but never hide it.

**Backend on Skip:**
- Set `profiles.wallet_address = NULL` (already default)
- Set `onboarding_step = 'wallet_skipped'`
- Queue a follow-up email: 48h after signup — "Your governance key is still waiting"

**Backend on Connect:**
- Verify address hasn't been claimed by another user (unique constraint on `wallet_address`)
- Store: `profiles.wallet_address = address`, `profiles.wallet_linked_at = now()`
- Set `onboarding_step = 'wallet_complete'`
- If applicable: trigger property NFT minting eligibility check (admin only)

### Persistent Wallet Banner (post-onboarding)

If wallet not linked, show a dismissible banner in the dashboard:

```
🔑 Set up your governance key to unlock voting, dues payment, and proposals.
   [Set Up Now]  [Remind Me Later]
```

- "Remind Me Later" suppresses banner for 7 days
- Banner reappears on vote/dues/proposal page regardless of dismiss

---

## Step 7: Resident Invitation

### Screen: Invite Your Community

**URL:** `/onboarding/invite`

**Who sees this:** `admin` and `manager` roles only. Shown after wallet setup step.

### 7a. Email Invitations

- If CSV was imported in Step 5c: show pre-populated list with checkboxes
- "Select All" / "Deselect All" controls
- Can add individual emails via input + "Add" button
- Each row shows: Name, Email, Unit #, Status (Pending / Sent / Accepted)

**Invitation Email Template:**

> **Subject:** You've been invited to [Community Name] on SuvrenHOA
>
> Hi [First Name],
>
> [Board Member Name] has invited you to join [Community Name]'s online community portal.
>
> Use SuvrenHOA to:
> - Pay dues securely
> - Vote on community matters
> - Access community documents
> - Submit maintenance requests
>
> [Accept Invitation →]  ← Magic link, valid 7 days
>
> Questions? Reply to this email or contact your HOA board.

**Magic Link Backend:**
- Generate signed token: `jwt.sign({ email, community_id, invited_by }, secret, { expiresIn: '7d' })`
- Store in `public.invitations` table with `status: 'pending'`
- On click: verify token, create Supabase account (or sign in if exists), auto-join community

```sql
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  unit_number TEXT,
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired')),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 7b. QR Code Invitation

**Use case:** Board meeting, in-person onboarding

- Generate a community-specific QR code that encodes a signed invite URL
- URL format: `/join/{community_slug}?token={short_token}`
- QR code is downloadable as PNG
- Valid for 30 days (refreshable)
- Anyone who scans goes through normal signup flow, auto-joined to community

**Display:**
- Show QR code on screen with instructions: "Show this at your next board meeting"
- "Download QR Code" button
- "Print Flyer" button — generates a simple one-page PDF (community name, QR, instructions)

### 7c. Sending Invitations

- "Send [N] Invitations" button
- Progress indicator for bulk sends (email service rate limits)
- Show success summary: "23 invitations sent. 2 already have accounts and have been added automatically."

**Skipping:**
- "I'll invite residents later" link at bottom
- Residents can always be invited from the admin dashboard post-onboarding

---

## Step 8: Guided First Actions (Interactive Tour)

### Screen: Let's Get You Started

**URL:** `/onboarding/tour` (then redirect to dashboard with overlay)

**Implementation:** Overlay/tooltip-based tour using a library like `react-joyride` or custom implementation.

### Tour Stops

**1. Cast Your First Vote**
- Tooltip on "Proposals" nav item
- "This is where your community makes decisions together. Let's try a sample vote."
- Action: Opens a sandboxed test proposal: "Should we plant new trees in the common area?"
- Users can vote Yes/No/Abstain — response is recorded as test data, not real governance
- Completion unlocks: "✅ You've voted! In a real proposal, your vote is permanent and tamper-proof."
- Requires wallet to complete. If no wallet: "Connect your governance key to unlock voting."

**2. View Your Treasury**
- Tooltip on "Treasury" nav item
- "Every dollar that comes in and goes out is publicly visible here."
- Action: Navigate to treasury page, highlight key stats (balance, recent transactions)
- No action required — just a view

**3. Upload a Document**
- Tooltip on "Documents" nav item
- "Keep all your community documents in one place — CC&Rs, bylaws, meeting minutes."
- Action: Upload any file (or use the CC&Rs from Step 5b if already uploaded)
- Completion: Document appears in the shared library

**4. Submit a Maintenance Request** (residents only)
- Tooltip on "Maintenance" nav item
- "Report issues around the community — your board will see it immediately."
- Action: Fill out a test maintenance request form
- Completion: Request shown in board's maintenance queue

### Progress Checklist Widget

Persistent widget in the dashboard sidebar (collapsible):

```
Getting Started  [3/5 complete] ████████░░ 60%
✅ Set up your account
✅ Joined your community
✅ Viewed your treasury
⬜ Cast your first vote  →
⬜ Set up your governance key  →
```

- Items link directly to the relevant section
- Widget disappears after 100% or user dismisses ("Got it, I know my way around")
- Completion percentage stored in `profiles.onboarding_progress JSONB`

---

## Resident Invitation Acceptance Flow

When a resident clicks their magic link invite email:

1. Land on `/join/{community_slug}?token={token}` 
2. Token is verified server-side
3. If no account → simplified signup form (email pre-filled, just needs password)
4. If account exists → auto-sign in and join community
5. Redirect to profile setup (Step 3) — role pre-set to `member`
6. Skip plan selection (Step 4) — message: "Your community handles billing."
7. Skip community setup (Step 5)
8. Go directly to wallet setup (Step 6) — same guided flow
9. Proceed to guided tour (Step 8)

---

## Technical Architecture

### Authentication

**Provider:** Supabase Auth

- `signUp()` with email/password
- `signInWithPassword()` for returning users
- `signInWithOtp()` for magic link invitations (existing user sign-in via link)
- Session tokens stored in `httpOnly` cookies via `@supabase/ssr`
- No wallet-gating at the auth layer — wallets are profile attributes, not auth identifiers

**Auth State:**
```typescript
type AuthUser = {
  id: string;          // Supabase UUID
  email: string;
  email_confirmed_at: string | null;
  // Extended via public.profiles join:
  role: 'admin' | 'manager' | 'member';
  wallet_address: string | null;
  community_id: string | null;
  plan: 'starter' | 'professional' | 'enterprise' | 'trial' | null;
}
```

### Wallet Integration

**Libraries:** `wagmi` v2, `@rainbow-me/rainbowkit` (already in stack)

**Positioning change:** Remove wallet connect from auth flow. Move to:
- Onboarding Step 6 (guided, optional)
- Settings > "Governance Key"
- In-context prompts (on voting/dues pages)

**Wallet link endpoint:**
```typescript
// POST /api/user/link-wallet
// Body: { address: string, signature: string, message: string }
// Verify signature server-side (ethers.verifyMessage)
// On success: UPDATE profiles SET wallet_address = $1 WHERE id = $2
```

Sign a challenge message to prove wallet ownership:
```
Sign this message to link your wallet to SuvrenHOA:
Nonce: {random_uuid}
User: {supabase_user_id}
```

### Middleware

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  
  // Not logged in → redirect to /login
  if (!session && isProtectedRoute(request.pathname)) {
    return NextResponse.redirect('/login');
  }
  
  // Logged in, no wallet → show banner (NOT redirect) unless hitting wallet-required route
  if (session && !session.wallet_address) {
    const walletRequired = ['/vote', '/pay-dues', '/proposals/create'];
    if (walletRequired.some(r => request.pathname.startsWith(r))) {
      return NextResponse.redirect('/onboarding/wallet?from=' + request.pathname);
    }
    // Otherwise: let through, banner will render
  }
  
  return NextResponse.next();
}
```

### Stripe Integration

**Webhooks to handle:**
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription, update `subscriptions` table |
| `invoice.payment_succeeded` | Extend `current_period_end` |
| `invoice.payment_failed` | Set `status = 'past_due'`, send warning email |
| `customer.subscription.deleted` | Set `status = 'canceled'`, downgrade access |
| `customer.subscription.updated` | Handle plan upgrades/downgrades |

**Webhook handler:** `/api/webhooks/stripe` — verify `Stripe-Signature` header before processing.

### Feature Access Matrix (Enforced)

```typescript
export const FEATURE_ACCESS = {
  forum:                { requiresEmail: true,   requiresWallet: false, plans: ['all'] },
  directory:            { requiresEmail: true,   requiresWallet: false, plans: ['all'] },
  documents:            { requiresEmail: true,   requiresWallet: false, plans: ['all'] },
  calendar:             { requiresEmail: true,   requiresWallet: false, plans: ['all'] },
  maintenanceRequests:  { requiresEmail: true,   requiresWallet: false, plans: ['all'] },
  voting:               { requiresEmail: true,   requiresWallet: true,  plans: ['all'] },
  duesPayment:          { requiresEmail: true,   requiresWallet: true,  plans: ['all'] },
  proposals:            { requiresEmail: true,   requiresWallet: true,  plans: ['professional', 'enterprise', 'trial'] },
  treasury:             { requiresEmail: true,   requiresWallet: false, plans: ['professional', 'enterprise', 'trial'] },
  reporting:            { requiresEmail: true,   requiresWallet: false, plans: ['professional', 'enterprise', 'trial'] },
  nftMinting:           { requiresEmail: true,   requiresWallet: true,  plans: ['all'], roles: ['admin'] },
} as const;
```

### Property NFT Minting

- **Trigger:** Admin action only, after wallet is connected
- **Flow:** Admin navigates to Settings > Properties > "Mint Property NFT" per unit
- **Not part of onboarding** — this is a deliberate post-setup admin function
- Minting uses existing smart contract infrastructure
- Residents must have wallet connected to receive their property NFT

### Role-Based Access Control

```typescript
type Role = 'admin' | 'manager' | 'member';

const ROLE_PERMISSIONS = {
  admin: {
    canManageCommunity: true,
    canInviteResidents: true,
    canMintNFTs: true,
    canManageDocuments: true,
    canCreateProposals: true,
    canViewTreasury: true,
    canManageDues: true,
  },
  manager: {
    canManageCommunity: true,
    canInviteResidents: true,
    canMintNFTs: false,
    canManageDocuments: true,
    canCreateProposals: true,
    canViewTreasury: true,
    canManageDues: true,
  },
  member: {
    canManageCommunity: false,
    canInviteResidents: false,
    canMintNFTs: false,
    canManageDocuments: false, // view only
    canCreateProposals: false,
    canViewTreasury: true, // view only
    canManageDues: false,
  },
};
```

---

## User State Matrix

| Has Email | Has Wallet | Status | Can Access |
|-----------|-----------|--------|------------|
| ✅ | ❌ | Active | Forum, directory, docs, calendar, maintenance requests |
| ✅ | ✅ | Full | Everything above + voting, dues payment, proposals, treasury |
| ❌ | ✅ | Legacy | Redirect to `/signup` with message: "Please create an email account to continue." |
| ❌ | ❌ | Anonymous | Public pages only (`/`, `/login`, `/signup`) |

---

## Email Notifications

### Transactional Emails (Triggered)

| Trigger | Subject | Timing |
|---------|---------|--------|
| Signup | Confirm your email | Immediate |
| Invitation received | You've been invited to {Community} | Immediate |
| Wallet not linked | Your governance key is still waiting | 48h after signup |
| Trial ending | Your free trial ends in 15 days | Day 45 |
| Trial ending | 5 days left on your trial | Day 55 |
| Trial ending | Your trial expires tomorrow | Day 59 |
| Trial expired | Your trial has ended | Day 60 |
| Payment failed | Action required: payment issue | Immediate on failure |

**Provider:** Supabase built-in email for auth, Resend (or SendGrid) for product emails.

---

## Onboarding State Persistence

Users may abandon onboarding mid-flow. Track progress to resume:

```typescript
type OnboardingStep = 
  | 'email_unverified'
  | 'profile'
  | 'plan'
  | 'community'
  | 'wallet'
  | 'wallet_skipped'
  | 'invite'
  | 'tour'
  | 'complete';
```

- Store in `profiles.onboarding_step`
- On login, check `onboarding_step` — if not `'complete'`, redirect to appropriate step
- Admins/managers who haven't created a community are gated to the onboarding flow
- Members who haven't completed profile setup are gated similarly

**Resume URL map:**
```typescript
const STEP_URLS: Record<OnboardingStep, string> = {
  email_unverified: '/verify-email',
  profile: '/onboarding/profile',
  plan: '/onboarding/plan',
  community: '/onboarding/community',
  wallet: '/onboarding/wallet',
  wallet_skipped: '/dashboard',  // proceed to dashboard
  invite: '/onboarding/invite',
  tour: '/onboarding/tour',
  complete: '/dashboard',
};
```

---

## Analytics Events

Track the following events (PostHog or equivalent):

| Event | Properties |
|-------|-----------|
| `signup_started` | source, role |
| `email_verified` | time_to_verify |
| `plan_selected` | plan, is_trial |
| `community_created` | unit_count, has_docs, has_csv |
| `wallet_connected` | connector_type |
| `wallet_skipped` | step |
| `invitations_sent` | count, method (email/csv/qr) |
| `onboarding_completed` | has_wallet, plan, role |
| `tour_step_completed` | step_name |

---

## Open Questions / Out of Scope for v1

- **SSO / social auth** (Google, Apple) — defer to v2
- **Multi-community support** — one community per admin account in v1
- **Mobile app onboarding** — this spec covers web only
- **HOA document e-signature** — out of scope
- **ACH dues payment** — deferred; dues payment via wallet in v1 only
- **Subdomain routing** (`faircroft.suvren.com`) — phase 2
- **Reseller / white-label** — enterprise tier add-on, not v1

---

## Acceptance Criteria

A developer should be able to consider this spec complete when:

- [ ] User can sign up with email + password and receive a verification email
- [ ] User can select a role and see role-appropriate onboarding steps
- [ ] Free trial activates with no credit card and full Professional access for 60 days
- [ ] Paid plan completes via Stripe Checkout and subscription is recorded
- [ ] Board member / manager can create a community with all fields in Step 5
- [ ] CSV import validates, previews, and creates pending invitations
- [ ] Wallet connection works via MetaMask, WalletConnect, and Coinbase Wallet
- [ ] "Skip wallet" is clearly available and results in reduced-feature access (not lockout)
- [ ] Wallet-required features show a contextual prompt, not an error
- [ ] Invitation emails include magic links that expire after 7 days
- [ ] QR code invitations work for in-person community enrollment
- [ ] Dashboard shows onboarding progress checklist until dismissed or complete
- [ ] User's onboarding step is persisted and resumed correctly on re-login
- [ ] Stripe webhooks correctly update subscription status
- [ ] All email notifications fire at the correct times

---

*Spec version: 1.0 | Last updated: 2026-04-04*
