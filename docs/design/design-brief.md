# SuvrenHOA — Design Brief

## Target Aesthetic
**"Governance meets luxury fintech"** — Think Stripe's clarity meets Bloomberg's data density meets a high-end real estate platform. Dark, authoritative, trustworthy. Not "crypto bro" — more "institutional grade."

## Reference Products
- **Linear** — spacing, typography hierarchy, clean dark UI
- **Stripe Dashboard** — data presentation, card layouts, premium feel
- **Vercel** — developer elegance, minimal but powerful
- **Robinhood** — financial data that feels approachable
- **NOT:** Generic SaaS templates, WordPress themes, crypto dashboards with neon everywhere

## Negative Constraints (what to AVOID)
- ❌ Default purple gradients everywhere
- ❌ Inter/system font as the only choice  
- ❌ Glass-card-on-everything (overused)
- ❌ Cookie-cutter hero sections with centered text
- ❌ Emoji as primary navigation icons
- ❌ Rounded-everything (mix sharp + round intentionally)
- ❌ Low contrast text (gray-500 on dark = unreadable)

## Brand Values to Express
- **Trust** — this handles real money and governance
- **Transparency** — everything is on-chain, nothing hidden
- **Authority** — board members need to take this seriously  
- **Accessibility** — a 60-year-old HOA member should feel comfortable
- **Innovation** — blockchain tech that doesn't look like blockchain

## Color Palette (oklch-based)

### Primary
- Background: `oklch(0.08 0.015 280)` — near-black with cool undertone
- Surface 1: `oklch(0.12 0.02 280)` — card backgrounds
- Surface 2: `oklch(0.16 0.02 280)` — elevated elements
- Surface 3: `oklch(0.20 0.02 280)` — hover states

### Accent (used sparingly)
- Primary accent: `oklch(0.65 0.20 275)` — refined purple (not neon)
- Secondary accent: `oklch(0.70 0.15 195)` — teal/cyan for data
- Success: `oklch(0.65 0.18 155)` — muted green
- Warning: `oklch(0.70 0.18 85)` — amber
- Danger: `oklch(0.60 0.20 25)` — muted red

### Text
- Primary: `oklch(0.93 0.01 280)` — almost white
- Secondary: `oklch(0.65 0.02 280)` — for descriptions
- Muted: `oklch(0.45 0.02 280)` — labels, timestamps
- Disabled: `oklch(0.30 0.01 280)` — truly dim

### Borders
- Subtle: `oklch(0.20 0.01 280)` — barely visible
- Default: `oklch(0.25 0.02 280)` — standard borders
- Accent: `oklch(0.35 0.10 275)` — purple tint for focus

## Typography

### Font Pairing
- **Headings:** "Satoshi" or "General Sans" — geometric, modern, authoritative
- **Body:** "Inter" is fine for body at 15px with proper weight hierarchy
- **Mono:** "JetBrains Mono" — for addresses, hashes, numbers

### Scale (based on 1.25 ratio)
- Display: 48px / 700 / -0.02em tracking
- H1: 36px / 700 / -0.02em
- H2: 28px / 600 / -0.01em  
- H3: 22px / 600 / 0
- Body: 15px / 400 / 0
- Small: 13px / 500 / 0.01em
- Caption: 11px / 600 / 0.04em uppercase

### Weight Hierarchy
- 700+ for headings only
- 500-600 for labels, nav items, badges
- 400 for body text
- Never use 300 (too thin on dark backgrounds)

## Spacing System (8px grid)
- 4px — inner padding (badges, pills)
- 8px — tight spacing
- 16px — standard spacing
- 24px — section padding
- 32px — card padding
- 48px — section gaps
- 64px — major section separation
- 96px — page-level vertical rhythm

## Component Philosophy
- **Cards:** Solid backgrounds with subtle border, NOT frosted glass everywhere. Glass reserved for 1-2 hero elements max.
- **Buttons:** Clear hierarchy — primary (filled), secondary (outlined), ghost (text only). No gradients on buttons.
- **Inputs:** Clean, generous padding, visible borders. Focus state = accent border + subtle shadow.
- **Tables/Lists:** Generous row height, alternating subtle backgrounds, no heavy borders.
- **Charts/Data:** Accent colors for data, gray for axes. Clean, no 3D effects.

## Interaction Design
- Transitions: 200ms ease-out (never more than 300ms)
- Hover: subtle background shift, NOT dramatic transforms
- Focus: visible accent outline (accessibility)
- Loading: skeleton screens with subtle pulse (not spinner)
- Page transitions: simple fade (no slide/scale)

## Layout Principles
- Max width: 1200px centered
- Sidebar: none on public pages, optional on authenticated pages
- Grid: 12-column on desktop, 1-2 column on mobile
- Cards: consistent padding (32px), consistent border radius (12px)
- White space: generous — when in doubt, add more space
