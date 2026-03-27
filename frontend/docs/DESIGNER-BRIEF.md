# SuvrenHOA — Designer Review Brief

**Date:** March 27, 2026
**Live URL:** http://192.168.7.63:3300 (internal — requires VPN/local network)
**Public URL:** https://hoa.suvren.co (if deployed)
**Repo:** github.com/elitedevs/faircroft-dao
**Stack:** Next.js 16 + React + TypeScript + Tailwind CSS v4

---

## What This Is

SuvrenHOA is a blockchain-powered HOA governance platform. Homeowners use it to vote on proposals, pay dues, view community documents, and manage their property — all recorded permanently on the Base blockchain.

**Target user:** Homeowners in a 16-lot community. Not crypto-native. Think "my HOA portal" not "my DeFi dashboard." The blockchain should be invisible unless someone goes looking for it.

**Design aspiration:** Digital concierge for a premium property — Soho House app meets Stripe Dashboard meets Aman Resorts booking portal. Quiet, confident, minimal.

---

## What's Been Implemented (Current State)

### Palette (Obsidian — Dark Mode)
- Background: `#0C0C0E`
- Card surfaces: `#141416`
- Elevated surfaces: `#1A1A1E`
- Sidebar: `#111114`
- Text primary: `#F5F0E8` (Parchment)
- Text secondary: `rgba(245, 240, 232, 0.60)`
- Text muted: `rgba(245, 240, 232, 0.35)`
- Accent: `#B09B71` (Aged Brass)
- Negative/alert: `#6B3A3A` (Rosewood)
- Positive/success: `#2A5D4F` (Verdigris)

### Palette (Ivory — Light Mode)
- Background: `#FAF8F5`
- Surfaces: `#FFFFFF`
- Sidebar: `#F2F0ED`
- Text: `#1A1A1E`
- Accent: `#8A7A5A` (darker brass for contrast)

### Typography
- **Headings:** Playfair Display (400 weight, normal + italic)
- **Body:** DM Sans (400/500 weight, 15px base)
- **Monospace:** JetBrains Mono at 85% size, 60% opacity (for wallet addresses, contract data)
- Heading letter-spacing: -0.03em (h1), -0.02em (h2), -0.01em (h3)
- Body letter-spacing: +0.01em, line-height: 1.65

### Surface Treatment
- Cards: `border-radius: 8px`, no visible borders, `box-shadow: 0 1px 2px rgba(0,0,0,0.3)`
- Hover: `translateY(-1px)` + shadow increase over 200ms with `cubic-bezier(0.23, 1, 0.32, 1)`
- No glass morphism, no gradient borders, no glow effects

### Sidebar
- 8 primary sections: Home, Property, Governance, Treasury, Community, Documents, Services, Settings
- Expandable children on click
- Active indicator: 2px brass left-edge bar (no background highlight)
- Brand whisper at bottom: "Faircroft — Est. 2025" in 10px italic Playfair

### Dashboard
- Time-of-day greeting ("Good afternoon, Lot #2")
- Prose summary line with key data
- 3 stat cards (Voting Power, Treasury, Active Proposals)
- 6 minimal navigation cards (no emoji, no colored left borders)
- Activity ticker below the fold

### Global
- All emoji removed from all 60+ pages
- Seasonal banner: italic serif, text-only, dismissible
- Health score: single letter grade (no donut chart)
- Icons: Lucide, stroke-width 1.5, 40% opacity
- Page entry animation: fadeInUp 300ms staggered

---

## What We Need From You

### 1. Visual Audit (Priority)

Walk through the live site and score using this framework:

| Category | Score /10 | Notes |
|----------|-----------|-------|
| Palette | /10 | Are colors consistent? Any off-palette elements? |
| Typography | /10 | Font loading, hierarchy, sizes, spacing |
| Density | /10 | Too much on screen? Enough whitespace? |
| Surface Treatment | /10 | Cards, shadows, borders, elevation |
| Emotional Register | /10 | Does it feel like a private club or a SaaS tool? |
| Iconography | /10 | Icon weight, opacity, consistency |

### 2. Page-by-Page Feedback

For each page that needs work, please provide:
- **Page URL** (e.g., `/treasury`, `/proposals`)
- **What's wrong** — be specific (hex codes, pixel values, element names)
- **What it should be** — exact values I can implement (color, size, font, spacing)
- **Priority** — Critical / High / Medium / Low

### 3. Feedback Format That Helps Us Most

The dev building this (AI agent) works best with **specific, implementable instructions**. The more precise, the faster the turnaround.

**Great feedback:**
> `/treasury` — The expenditure chart progress bars use `#3B82F6` (blue). Replace with `#B09B71` (brass) at decreasing opacity: 100%, 80%, 60%, 40%. The bar track should be `rgba(245, 240, 232, 0.06)`.

**Less helpful feedback:**
> The treasury page colors feel off.

**Ideal format per fix:**
```
PAGE: /treasury
ELEMENT: Expenditure progress bars
CURRENT: Blue (#3B82F6)
CHANGE TO: Brass (#B09B71) at decreasing opacity per bar
PRIORITY: Medium
```

### 4. Key Questions We'd Love Answers On

1. **Dashboard density** — We reduced from 10+ blocks to ~4. Is this enough? Too sparse? Should the navigation cards be there at all?

2. **Stat card numbers** — Currently using Playfair Display at ~30px for stat values. Should these be larger? Different treatment?

3. **Progress bars / charts** — Several pages have data visualization (governance stats, treasury breakdown, utility budgets). Currently these use mixed colors. Should ALL data viz be brass-only? Or is a limited secondary palette OK for distinguishing data series?

4. **Empty states** — Many pages show "No data yet" type messages. Should these have illustrations? Just text? What's the right treatment?

5. **Mobile** — Haven't touched mobile-specific layouts yet. Any guidance on mobile sidebar behavior, card stacking, responsive breakpoints?

6. **Landing page** — The pre-login page still has some visual weight (logo mark, feature cards). Should this match the minimal interior or can it be slightly more expressive?

---

## Technical Constraints

Things I can implement easily:
- Any CSS change (colors, sizes, spacing, animations, shadows)
- Component restructuring (move/remove/add elements)
- Typography changes (fonts, weights, sizes, letter-spacing)
- New components or page layouts
- Responsive breakpoints
- Dark/light mode adjustments

Things that take more effort:
- Custom illustrations or SVG artwork (would need assets provided)
- Custom fonts not on Google Fonts (need the font files)
- Complex scroll-driven animations (doable but needs specification)
- Sound design (need audio files)

---

## Pages to Review

**High priority (most visited):**
- `/` — Dashboard (logged in)
- `/` — Landing page (logged out)
- `/proposals` — Proposal list
- `/treasury` — Treasury overview
- `/documents` — Document registry
- `/governance/stats` — Governance statistics
- `/community/forum` — Discussion forum

**Medium priority:**
- `/dashboard` — Property profile (My Lots)
- `/dues` — Dues payment
- `/calendar` — Community calendar
- `/directory` — Resident directory
- `/announcements` — Announcements
- `/admin` — Board admin panel

**Lower priority (less traffic):**
- `/maintenance` — Maintenance requests
- `/amenities` — Amenity booking
- `/safety` — Safety reports
- `/parking` — Parking grid
- All other service pages

---

## Reference Points

These are our north star references — not to copy, but for emotional calibration:

- **Linear** — Best dark-mode UI. Tonal elevation, no borders.
- **Stripe Dashboard** — Complex data made clean and simple.
- **Aman Resorts** — 80% whitespace. Every element earns its place.
- **Soho House app** — Members-only warmth. Quiet navigation.

---

*Looking forward to your feedback. The faster we get specific direction, the faster we ship.*
