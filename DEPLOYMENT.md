# SuvrenHOA — Production Deployment Checklist

> Complete this checklist in order for a clean Base mainnet launch.

---

## 1. Prerequisites

- [ ] Node 20.x and npm installed
- [ ] Foundry installed (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- [ ] Access to a hardware wallet or HSM for the deployer key
- [ ] 3-of-5 Gnosis Safe deployed on Base mainnet (board multisig)
- [ ] Alchemy account with Base mainnet RPC access

---

## 2. Environment Variables

### Frontend (`frontend/.env.production`)
Copy `frontend/.env.example` and fill in all values:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API (keep secret) |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | `https://app.suvren.com` |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Cloud Console |
| `NEXT_PUBLIC_COINBASE_PROJECT_ID` | Coinbase Developer Platform |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys (keep secret) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project → Settings → Client Keys |
| `SENTRY_DSN` | Same as above |
| `SENTRY_AUTH_TOKEN` | Sentry → User Settings → Auth Tokens |

### Contracts (`contracts/.env`)
Copy `contracts/.env.example` and fill in:

| Variable | Source |
|---|---|
| `DEPLOYER_PRIVATE_KEY` | Hardware wallet (never a hot key in prod) |
| `BOARD_MULTISIG` | Gnosis Safe address on Base mainnet |
| `MAX_LOTS` | Community lot count |
| `ALCHEMY_API_KEY` | Alchemy dashboard |
| `BASESCAN_API_KEY` | basescan.org → API Keys |

---

## 3. Supabase Setup

- [ ] Create a new Supabase project (or promote staging)
- [ ] Run all migrations in order:
  ```bash
  supabase db push
  # or manually in the SQL editor:
  # 001_profiles.sql → 002_communities.sql → 003_community_members.sql
  # → 004_invitations.sql → 007_rls_hardening.sql
  ```
- [ ] Verify RLS is enabled on all tables:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
  ```
- [ ] Enable email auth in Supabase Auth → Providers
- [ ] Set site URL and redirect URLs in Supabase Auth → URL Configuration
  - Site URL: `https://app.suvren.com`
  - Redirect URLs: `https://app.suvren.com/**`
- [ ] Configure email templates (Supabase Auth → Email Templates)

---

## 4. Stripe Setup

- [ ] Activate Stripe account for live payments
- [ ] Create products and prices for 3 tiers:
  - Starter: $49/mo or $490/yr
  - Professional: $129/mo or $1,290/yr
  - Enterprise: $249/mo or $2,490/yr
- [ ] Create webhook endpoint pointing to `https://app.suvren.com/api/stripe/webhook`
  - Events: `customer.subscription.*`, `invoice.*`, `checkout.session.*`
- [ ] Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

---

## 5. Smart Contract Deployment

### 5.1 Dry Run (simulation)
```bash
cd contracts
cp .env.example .env
# Fill in DEPLOYER_PRIVATE_KEY, BOARD_MULTISIG, ALCHEMY_API_KEY

forge script script/DeployMainnet.s.sol \
  --rpc-url base_mainnet \
  --slow
# No --broadcast flag = simulation only
```

### 5.2 Broadcast (live deployment)
```bash
forge script script/DeployMainnet.s.sol \
  --rpc-url base_mainnet \
  --broadcast \
  --verify \
  --slow
```

Expected output:
```
PropertyNFT:       0x...
TimelockController: 0x...
FaircroftGovernor:  0x...
DocumentRegistry:   0x...
FaircroftTreasury:  0x...
DuesLending:        0x...
TreasuryYield:      0x...
VendorEscrow:       0x...
```

### 5.3 Update Frontend Config
Edit `frontend/src/config/contracts.ts` → `addresses.base` block with deployed addresses.

### 5.4 Verify on BaseScan
```bash
# If --verify flag didn't catch all contracts:
forge verify-contract <ADDRESS> src/PropertyNFT.sol:PropertyNFT \
  --chain base \
  --etherscan-api-key $BASESCAN_API_KEY
```

---

## 6. Frontend Deployment (Vercel)

- [ ] Connect GitHub repo to Vercel project
- [ ] Set all env vars in Vercel dashboard (Production environment)
- [ ] Set root directory to `frontend`
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `.next`
- [ ] Deploy: `vercel --prod` or push to `main`
- [ ] Verify `https://app.suvren.com/api/health` returns `{"status":"ok"}`

---

## 7. DNS & Domain

- [ ] Point `app.suvren.com` CNAME to Vercel deployment
- [ ] Point `suvren.com` / `www.suvren.com` to marketing site
- [ ] Verify HTTPS and HSTS headers

---

## 8. Sentry

- [ ] Create Sentry project (type: Next.js)
- [ ] Add `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` to Vercel env vars
- [ ] Set up alert rules: notify Slack/email on new error spikes
- [ ] Set environment to `production` in Sentry release settings

---

## 9. Post-Launch Verification

- [ ] `GET /api/health` → `{"status":"ok","db":"ok"}`
- [ ] Sign up with a test email → receive verification email
- [ ] Create a community → admin member created automatically
- [ ] Send an invitation → test accept flow
- [ ] Connect Coinbase Smart Wallet → wallet linked to profile
- [ ] Start a Stripe trial → subscription row created in `subscriptions` table
- [ ] Deploy a test PropertyNFT from the admin UI
- [ ] Submit a governance proposal → timelock flow works
- [ ] Check Sentry dashboard — no critical errors

---

## 10. Base Mainnet RPC Reference

| Network | Chain ID | RPC |
|---|---|---|
| Base Mainnet | 8453 | `https://base-mainnet.g.alchemy.com/v2/<key>` |
| Base Mainnet (public) | 8453 | `https://base-rpc.publicnode.com` |
| Base Sepolia (testnet) | 84532 | `https://base-sepolia.g.alchemy.com/v2/<key>` |

Explorer: https://basescan.org
Bridge: https://bridge.base.org
USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
