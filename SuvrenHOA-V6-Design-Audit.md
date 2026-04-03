# SuvrenHOA — V6 Design Audit

**Auditor:** Lux — Design Review Agent (World-Class Luxury Standard)
**Date:** 2026-04-03
**Build reviewed:** http://192.168.7.63:3300 (all routes, dark mode, desktop 1440×900 + mobile 390×844)
**Prior audits:** V1 (29/60) → V2 (35.5/60) → V3 (36/60)

---

## Overall Feel

SuvrenHOA V6 has crossed a threshold. The font loading problem that plagued every prior audit — the single catastrophic failure that suppressed scores across Typography, Emotional Register, and Palette — is **solved**. Playfair Display and Inter both load reliably, `<html>` carries the correct CSS variable classes (`playfair_display_*__variable` and `inter_*__variable`), and headings render in Playfair with the gold gradient treatment exactly as designed. This is the first audit where fonts are not the top finding. That alone represents a fundamental shift in the product's credibility.

The pages that have received dedicated attention — Home, Treasury, Transparency, Map, Documents — look genuinely premium. The obsidian-to-card tonal elevation works. The gold gradient H1s are elegant. The fund tint cards on Treasury (`rgba(20, 26, 22, 0.9)` for Operating, `rgba(16, 18, 26, 0.9)` for Reserve) are among the most sophisticated color decisions in the app. Card backgrounds have converged to `rgb(21, 21, 24)` (#151518) across these pages — close to but not exactly the target `#1A1A1E`, which we'll discuss.

The central tension now is a split personality. The five content-rich pages feel like a luxury product. But Dashboard, Governance, Community, Admin, and Maintenance behind the auth wall show only sign-in prompts with no visible design system content — and the sidebar navigation (detected as `<nav>` with width `1136px`) doesn't present as a traditional sidebar at all. Two sub-routes (`/governance/proposals` and `/community/events`) return styled 404 pages. And a persistent `lab()` color leak from a chat widget component bleeds across **every single page**. Fix the lab() leak and the 404 routes, and this product scores 50+.

---

## Score Table

| Category | Max | V3 | V6 Current | V6 Projected* | Notes |
|---|---|---|---|---|---|
| **Palette Cohesion** | 10 | 6.5 | **7** | **9** | `lab()` values from chat widget on every page; transparency has `oklab()` too. Fix the widget → +2 |
| **Typography** | 10 | 4 | **8.5** | **9** | Fonts load! Playfair headings, Inter body, gold gradient H1s. Minor: H2 sizing inconsistent (11px–20px) |
| **Density & Spacing** | 10 | 6 | **7.5** | **8.5** | Content pages well-spaced. Auth-wall pages are empty voids. Card widths standardized. |
| **Surface Treatment** | 10 | 6 | **8** | **9** | Tonal stack works: `#0C0C0E` → `#111113` → `#151518`. Fund tints are excellent. Shadow use tasteful. |
| **Emotional Register** | 10 | 5 | **7** | **8.5** | Transparency page is strong. Trust signals present. Empty states need prose-first treatment. |
| **Iconography & Details** | 10 | 5 | **6** | **8** | Styled 404 page (good!). But 2 routes 404. Mobile OK. No custom scrollbar/selection. Chat widget unscoped. |
| **TOTAL** | **60** | **32.5** | **44** | **52** | |

*Projected = if `lab()` leak fixed, 404 routes resolved, and H2 scale standardized.

---

## What's Working — DO NOT TOUCH

**1. Font Loading Infrastructure**
`<html>` className: `dark playfair_display_831d3327-module__WpRgNG__variable inter_873b865f-module__TrX0vq__variable`. CSS vars `--font-inter: "Inter", "Inter Fallback"`, `--font-playfair: "Playfair Display", "Playfair Display Fallback"`. Both families confirmed loaded via `document.fonts` API across all pages. This took five audit iterations to fix. **Do not touch the ThemeToggle class-merging logic.**

**2. Body Foundation**
`background-color: rgb(12, 12, 14)` (#0C0C0E), `color: rgba(245, 240, 232, 0.65)`, `font-family: Inter, "Inter Fallback", Inter, system-ui, sans-serif`, `font-size: 15px`. Consistent across all 12 tested routes.

**3. H1 Gold Gradient Treatment**
`font-family: "Playfair Display"`, `font-size: 36px` (inner pages) / `72px` (home hero), `font-weight: 400`, `letter-spacing: -1.08px`, `background-image: linear-gradient(135deg, rgb(245, 240, 232) 0%, rgb(212, 196, 160) 50%, rgb(176, 155, 113) 100%)`, `-webkit-background-clip: text`. Verified on Treasury ("Community Treasury"), Map ("Neighborhood Map"), Documents ("Documents"). This is the signature brand element.

**4. Primary CTA Button**
`background: rgb(176, 155, 113)` (brass), `color: rgb(12, 12, 14)` (obsidian), `border-radius: 8px`, `font-size: 15px`, `font-weight: 700`. Used consistently on "Sign In", "Get Started" buttons.

**5. Standard Card Treatment**
`background: rgb(21, 21, 24)` (#151518), `border: 0px none`, `border-radius: 8px`, `box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 2px 0px`. Consistent across Treasury stat cards, Map stat cards, Documents stat cards, Home feature cards. No visible borders — shadow-only depth. This is the luxury approach.

**6. Treasury Fund Tint Cards**
Operating: `background: rgba(20, 26, 22, 0.9)` (verdigris tint). Reserve: `background: rgba(16, 18, 26, 0.9)` (cool blue tint). These ambient-color cards communicate fund purpose visually. Most sophisticated color decision in the app.

**7. Chat Widget Container**
`background: rgb(17, 17, 19)` (#111113), `border: 1px solid rgba(245, 240, 232, 0.08)`, `border-radius: 12px 12px 8px`. The container itself is well-integrated tonally. (The button pills inside it are the problem — see below.)

**8. Secondary/Ghost Button Style**
`background: rgba(245, 240, 232, 0.04)`, `color: rgba(245, 240, 232, 0.35)`, `border: 1px solid rgba(245, 240, 232, 0.08)`, `border-radius: 6px`. Used on "Export PDF", filter tabs, document type pills. Correctly uses palette colors at low opacity.

**9. Transparency Page Hero**
H1 at `60px`, Playfair Display, `letter-spacing: -1.8px`. Stats banner: `background: rgba(255, 255, 255, 0.03)`, `border: 1px solid rgba(255, 255, 255, 0.06)`, `border-radius: 12px`. This page is the emotional high point of the product — the "why we exist" moment. The layout with trust cards left / activity feed right is well-structured.

**10. Projection Mini-Cards (Treasury)**
`background: rgba(245, 240, 232, 0.03)`, `border-radius: 12px`. Subtly tinted, no border, no shadow. The lightest surface in the elevation stack. These work as tertiary containers within the projection card.

**11. Home Page Hero**
H1 "Welcome to SuvrenHOA" at `72px` with full gold gradient. Feature cards with consistent `#151518` backgrounds and shadow-only depth. The "How It Works" section with 3-card layout is clean. Overall home page is the strongest first impression the product has ever had.

**12. Mobile Responsiveness**
At 390×844, sidebar collapses, content reflows vertically, touch targets are adequate, typography scales appropriately. Home page hero stacks well. No horizontal overflow detected.

---

## Page-by-Page Fixes

### Global (affects all pages)

```
ELEMENT: Chat widget quick-action pills ("My Dues", "Treasury", "Proposals", "Health Score")
CURRENT: background: lab(65.0883 3.43254 25.0703 / 0.15), border: 1px solid lab(65.0883 3.43254 25.0703 / 0.2)
CHANGE TO: background: rgba(176, 155, 113, 0.15), border: 1px solid rgba(176, 155, 113, 0.2)
PRIORITY: Critical — lab() values bypass palette system and appear on EVERY page
```

```
ELEMENT: Chat widget quick-action pills — text color
CURRENT: color: rgb(212, 196, 160) — a warm gold not in the declared palette
CHANGE TO: color: rgb(176, 155, 113) (brass) — or define rgb(212, 196, 160) as an official "light brass" token
PRIORITY: Medium — functionally fine but technically off-palette
```

```
ELEMENT: Chat widget quick-action pills — font size
CURRENT: font-size: 11px
CHANGE TO: font-size: 12px minimum — 11px is below readability floor on dark backgrounds
PRIORITY: Medium
```

```
ELEMENT: Sidebar/nav detection — <nav> element
CURRENT: width: 1136px, bg: transparent, no boxShadow, no borderRight
CHANGE TO: Appears to be a breadcrumb nav, not a true sidebar. If a proper sidebar exists behind auth, verify it has: bg: rgb(17, 17, 19), box-shadow: 1px 0 8px rgba(0,0,0,0.3), width: 240-280px
PRIORITY: Low — cannot fully evaluate without auth
```

```
ELEMENT: Nav link font size
CURRENT: font-size: 13.872px — this is a font-metric-adjusted size, likely from rem calculation
CHANGE TO: Verify this rounds to 14px with font loaded. The 0.872 fractional pixel suggests rem-to-px calculation, not a problem per se, but worth confirming it's intentional.
PRIORITY: Low
```

### Home Page (/)

```
ELEMENT: Home hero background decorative elements
CURRENT: background: lab(65.0883 3.43254 25.0703 / 0.05), lab(…/0.04), lab(…/0.8), lab(…/0.1), lab(…/0.25)
CHANGE TO: background: rgba(176, 155, 113, 0.05), rgba(176, 155, 113, 0.04), rgba(176, 155, 113, 0.8), rgba(176, 155, 113, 0.1), rgba(176, 155, 113, 0.25)
PRIORITY: High — 8 lab() values on home page alone, mostly from decorative gradient orbs
```

```
ELEMENT: RainbowKit "Sign In to Get Started" button
CURRENT: font-family: SFRounded, ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont...
CHANGE TO: Should use Inter (via --font-sans) to match design system. Scope override in .wallet-wrapper: font-family: var(--font-sans)
PRIORITY: High — the primary CTA uses a different font family than the rest of the app
```

```
ELEMENT: Home page — verdigris accent color
CURRENT: rgb(58, 125, 111) used as status indicator (chat "Online" badge)
CHANGE TO: Acceptable — close to palette verdigris #2A5D4F (rgb(42, 93, 79)) but brighter. Define rgb(58, 125, 111) as "verdigris-light" or adjust to rgb(42, 93, 79)
PRIORITY: Low — minor palette variant
```

### Dashboard (/dashboard)

```
ELEMENT: Entire page content
CURRENT: Only shows "Sign In" button and chat widget — no headings, no cards, no page content visible
CHANGE TO: Consider showing a read-only dashboard preview with blurred/placeholder data for unauthenticated users, or at minimum a styled empty state with Playfair heading and description
PRIORITY: Medium — authenticated content can't be audited
```

### Governance (/governance)

```
ELEMENT: Entire page content
CURRENT: Only shows "Sign In" button — identical to dashboard auth-wall
CHANGE TO: Same recommendation as dashboard — show at minimum a gradient H1 "Governance" heading and a description of what the user will see when authenticated
PRIORITY: Medium
```

### Governance > Proposals (/governance/proposals)

```
ELEMENT: 404 page
CURRENT: H1 "404" in Playfair Display, 36px — styled, not raw framework default. Good.
CHANGE TO: Route should exist and render content (or redirect to /governance). A navigable route returning 404 is a broken promise.
PRIORITY: High — navigation links to non-existent pages undermine trust
```

### Treasury (/treasury)

```
ELEMENT: H2 "12-Month Projections" inside projection card
CURRENT: font-size: 14px (Playfair Display)
CHANGE TO: font-size: 18px to match other H2s ("Expenditures", "Spending Breakdown")
PRIORITY: Medium — inconsistent H2 sizing within the same page
```

```
ELEMENT: H2 heading scale
CURRENT: Mix of 18px and 14px H2s on same page
CHANGE TO: Standardize all H2s to 18-20px. The 14px H2 feels like an H3.
PRIORITY: Medium
```

```
ELEMENT: "No Expenditures Yet" empty state
CURRENT: H3 in Inter, 18px, 500 weight — functional but generic
CHANGE TO: Consider italic Playfair Display for empty state headings: font-family: var(--font-serif), font-style: italic, font-size: 16px. "No expenditures yet — all community spending will appear here."
PRIORITY: Low — polish
```

```
ELEMENT: Spending breakdown chart colors
CURRENT: Uses rgb(139, 155, 176) (slate blue), rgb(90, 122, 154) (steel blue), rgb(138, 117, 80) (dark brass) — partially off-palette
CHANGE TO: Define chart color tokens: brass #B09B71, verdigris #2A5D4F, steel rgba(90, 122, 154, 1), rosewood #6B3A3A. Chart colors should be documented palette members.
PRIORITY: Medium — charts are a common palette leak point
```

### Community (/community)

```
ELEMENT: Entire page
CURRENT: Auth-wall only, same as dashboard/governance
CHANGE TO: Show community overview with placeholder content or styled empty state
PRIORITY: Medium
```

### Community > Events (/community/events)

```
ELEMENT: 404 page
CURRENT: Styled 404 (Playfair H1), but route doesn't exist
CHANGE TO: Route should exist or navigation link should be removed
PRIORITY: High — same as /governance/proposals
```

### Map (/map)

```
ELEMENT: H2 "Active Incidents 5"
CURRENT: font-size: 11px (Playfair Display) — absurdly small for an H2
CHANGE TO: font-size: 18-20px. An 11px heading is functionally invisible and semantically wrong.
PRIORITY: High — this is likely a responsive sizing bug
```

```
ELEMENT: Map toggle buttons ("Map", "Grid", "Both", "Properties", "Incidents")
CURRENT: Active state: bg: lab(65.0883 3.43254 25.0703 / 0.15), border: 1px solid lab(65.0883 3.43254 25.0703 / 0.3)
CHANGE TO: bg: rgba(176, 155, 113, 0.15), border: 1px solid rgba(176, 155, 113, 0.3)
PRIORITY: High — more lab() leaks
```

```
ELEMENT: "Report Incident" button
CURRENT: bg: lab(65.0883 3.43254 25.0703 / 0.15), border: 1px solid lab(65.0883 3.43254 25.0703 / 0.3)
CHANGE TO: bg: rgba(176, 155, 113, 0.15), border: 1px solid rgba(176, 155, 113, 0.3)
PRIORITY: High — lab() on a primary action button
```

```
ELEMENT: Google Maps embed
CURRENT: Loads default Google Maps light-mode tiles with rgb(255, 255, 255) backgrounds, rgb(229, 227, 223), rgb(245, 245, 245) — pure off-palette whites
CHANGE TO: Apply dark-mode map styling via Google Maps style array or use Mapbox with custom dark theme matching the obsidian palette
PRIORITY: Medium — the map creates a jarring brightness hole in the dark UI (but third-party embed styling is limited)
```

```
ELEMENT: Map page colors
CURRENT: rgb(184, 148, 46) (bright gold) used for incident markers — not in declared palette
CHANGE TO: Use brass #B09B71 or define rgb(184, 148, 46) as "alert-gold" in the token system
PRIORITY: Low
```

### Transparency (/transparency)

```
ELEMENT: H1 treatment
CURRENT: font-size: 60px, NO gradient — uses plain rgb(245, 240, 232). Other pages use the gold gradient.
CHANGE TO: Add gradient-text class for consistency: background-image: linear-gradient(135deg, rgb(245, 240, 232) 0%, rgb(212, 196, 160) 50%, rgb(176, 155, 113) 100%), -webkit-background-clip: text
PRIORITY: Medium — the transparency H1 is intentionally dramatic, but inconsistent with other pages
```

```
ELEMENT: Trust indicator decorative dots
CURRENT: background: lab(65.0883 3.43254 25.0703 / 0.5) and oklab(0.567684 -0.0221854 -0.0577461 / 0.5)
CHANGE TO: background: rgba(176, 155, 113, 0.5) and rgba(42, 93, 79, 0.5) respectively
PRIORITY: High — both lab() AND oklab() on the same page
```

```
ELEMENT: Stats banner container
CURRENT: border: 1px solid rgba(255, 255, 255, 0.06) — uses #fff instead of palette parchment
CHANGE TO: border: 1px solid rgba(245, 240, 232, 0.06)
PRIORITY: Low — visually identical but semantically should use the palette base
```

```
ELEMENT: H2 "Verify the Contracts"
CURRENT: font-size: 13px — too small for H2
CHANGE TO: font-size: 18-20px to match other H2s on this page
PRIORITY: Medium
```

```
ELEMENT: Activity color tokens
CURRENT: Uses Tailwind defaults — rgba(59, 130, 246, 0.08) (blue-500), rgba(34, 197, 94, 0.08) (green-500), rgba(245, 158, 11, 0.08) (amber-500)
CHANGE TO: Map to palette: blue → rgba(90, 122, 154, 0.1) (steel), green → rgba(42, 93, 79, 0.1) (verdigris), amber → rgba(176, 155, 113, 0.1) (brass)
PRIORITY: Medium — these are functional status colors but should use palette tokens
```

### Documents (/documents)

```
ELEMENT: "Upload Document" button border
CURRENT: border: 1px solid lab(65.0883 3.43254 25.0703 / 0.3)
CHANGE TO: border: 1px solid rgba(176, 155, 113, 0.3)
PRIORITY: High — lab() on a primary action
```

```
ELEMENT: "All Types" filter pill (active state)
CURRENT: bg: lab(65.0883 3.43254 25.0703 / 0.15), border: 1px solid lab(65.0883 3.43254 25.0703 / 0.3)
CHANGE TO: bg: rgba(176, 155, 113, 0.15), border: 1px solid rgba(176, 155, 113, 0.3)
PRIORITY: High — lab() on filter controls
```

```
ELEMENT: "Document unavailable" error cards
CURRENT: Shows "Retry" button — suggests Arweave fetch failures
CHANGE TO: Style the error state: italic text, muted color, gentle warning icon. Currently looks like a broken page rather than a graceful degradation.
PRIORITY: Medium — this is an emotional register issue
```

### Admin (/admin) & Maintenance (/maintenance)

```
ELEMENT: Auth-wall pages
CURRENT: Sign-in prompt only, no styled empty state
CHANGE TO: Styled landing with Playfair gradient H1 and description of what the section contains
PRIORITY: Medium
```

### 404 Page (custom)

```
ELEMENT: Custom 404 page
CURRENT: H1 "404" in Playfair, 36px, with "Return to Dashboard" link — styled, matches design system
CHANGE TO: Consider adding gradient-text to the "404" heading and a more evocative message: "This page hasn't been built yet" or "Nothing to see here — yet."
PRIORITY: Low — already much better than framework default
```

---

## The Single Biggest Issue

### `lab()` / `oklab()` Color Leak — Chat Widget & Shared Button Component

The declared goal of V6 was "all 228 oklch values replaced with palette hex/rgba/var tokens (zero oklch remaining)." The oklch values are indeed gone. But they've been replaced — not entirely with hex/rgba — but partially with `lab()` values, which are equally opaque to the palette system.

**The source:** A single `lab()` color value — `lab(65.0883 3.43254 25.0703)` — appears at various opacities across every page. Converting this lab() value: it's approximately `rgb(176, 155, 113)` — **the brass accent color itself**. So the color is correct in hue, but expressed in a format that bypasses CSS variable resolution and makes automated palette auditing impossible.

**Where it appears:**
- Chat widget quick-action pills (My Dues, Treasury, Proposals, Health Score) — **every page**
- Map toggle buttons (Map/Grid, Both/Properties/Incidents)
- Documents filter pills and Upload Document button border
- Transparency page decorative dots (both `lab()` and `oklab()` variants)
- Home page decorative gradient orbs (8 instances)

**Total lab()/oklab() instances found:** ~15-20 unique computed values across the site.

**The fix:** Search the codebase for any Tailwind `bg-[lab(` or CSS `lab(` declarations. These likely originate from:
1. The chat widget component (jsx class `jsx-c71bc505029975a5`) — probably using styled-jsx or a CSS-in-JS library that outputs lab()
2. A shared button/pill component used for active states
3. Decorative elements on the home and transparency pages

Replace all `lab(65.0883 3.43254 25.0703 / X)` with `rgba(176, 155, 113, X)`.
Replace all `oklab(0.567684 -0.0221854 -0.0577461 / X)` with `rgba(42, 93, 79, X)` (this is the verdigris).

**Impact:** Fixing this single issue would earn +2 on Palette Cohesion (bringing it to 9) and +0.5 on Iconography (cleaner computed styles). It's the difference between a 44 and a 46.5.

---

## Path to 60

### Phase 1: The Lab Leak (gets you to 48/60)
| Fix | Points | Effort |
|---|---|---|
| Replace all `lab()` values with `rgba()` equivalents | +2 Palette | Low |
| Replace `oklab()` on transparency page | +0.5 Palette | Low |
| Fix RainbowKit button font-family to Inter | +0.5 Typography | Low |
| Fix H2 sizing (11px on Map, 13px/14px on Transparency/Treasury) | +0.5 Typography | Low |
| Resolve /governance/proposals and /community/events 404s | +1 Iconography | Medium |

### Phase 2: Emotional Depth (gets you to 52/60)
| Fix | Points | Effort |
|---|---|---|
| Styled auth-wall pages (gradient H1 + description) | +1 Emotional, +0.5 Density | Medium |
| Prose-first empty states ("No expenditures yet") | +0.5 Emotional | Low |
| Chart colors mapped to palette tokens | +0.5 Palette | Medium |
| Transparency page H1 gradient consistency | +0.5 Typography | Low |
| Document error state styling | +0.5 Emotional | Low |

### Phase 3: Surface Polish (gets you to 56/60)
| Fix | Points | Effort |
|---|---|---|
| Custom scrollbar (`scrollbar-color: rgba(176,155,113,0.2) transparent`) | +1 Iconography | Low |
| `::selection` styled (`background: rgba(176,155,113,0.3); color: #F5F0E8`) | +0.5 Iconography | Low |
| `:focus-visible` ring styled (brass outline) | +0.5 Iconography | Low |
| Google Maps dark theme or Mapbox migration | +1 Surface, +0.5 Palette | High |
| Micro-interactions (card hover lift, button press scale) | +0.5 Iconography | Medium |
| `prefers-reduced-motion` respect | +0.5 Iconography | Low |

### Phase 4: The Last Four (gets you to 60/60)
| Fix | Points | Effort |
|---|---|---|
| Seasonal/contextual touches (time-of-day greeting on dashboard) | +1 Emotional | Medium |
| Onboarding story flow (progress checklist for new residents) | +1 Emotional | High |
| Light mode implementation | +1 Iconography | High |
| Footer with brand grounding | +1 Emotional | Medium |

---

## The V1→V6 Journey

| Audit | Score | Key Moment |
|---|---|---|
| V1 | 29/60 | Fonts broken, oklch everywhere, no design system coherence |
| V2 | 35.5/60 | Shadows added, prose-first concepts introduced, palette declared |
| V3 | 36/60 | Dashboard component polished, but sub-pages inconsistent |
| **V6** | **44/60** | **Fonts fixed. oklch eliminated. Cards normalized. H1s standardized. The product has a voice.** |

The trajectory is clear and accelerating. V1→V3 gained 7 points across three audits (incremental polish, recurring font regressions). V3→V6 gained **11.5 points** in a single iteration — the largest single-version improvement in the audit history. The team stopped treating symptoms and fixed root infrastructure: font loading on `<html>`, palette token migration, card background normalization, H1 standardization across 81 pages. These are architectural fixes, not cosmetic patches.

The `lab()` leak is the last echo of the old oklch problem — same category of issue (CSS Color Level 4 values bypassing the palette), just a different format. Once that's resolved, the palette category jumps to 9/10 and the product crosses the 50-point threshold for the first time.

---

## Summary

**Score: 44/60** — up from 36, the largest single-audit gain in SuvrenHOA's history.

The three highest-impact fixes: (1) eliminate the `lab()` color leak from the chat widget and shared button components — it's the brass color expressed in the wrong format, appearing on every page; (2) resolve the two 404 routes that navigation promises exist; (3) standardize H2 sizes so no heading renders at 11px.

Do not touch: the font loading infrastructure, the gold gradient H1 treatment, the standard card style (`#151518`, shadow-only, 8px radius), the Treasury fund tint cards, or the Transparency page layout. These are the product's identity now.

The mansion is built. The facade is stunning, the foyer is golden, and the main halls are furnished with taste. But someone left lab() values in the light fixtures — the bulbs work, they're the right color, they just aren't connected to the dimmer system. Wire them in, hang the missing room signs, and this product walks into the 50s.
