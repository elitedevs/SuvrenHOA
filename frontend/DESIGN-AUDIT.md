# SuvrenHOA — Redesign Audit Report

**Date:** March 26, 2026
**Auditor:** Claude (Cowork)
**Context:** The original Ultra-Luxury Design Direction was delivered on March 26, 2026. The development team implemented changes. This audit evaluates what was implemented correctly, what was implemented incorrectly, and what still needs to be fixed.

---

## What They Got Right

Credit where it's due — a significant amount of the design direction was implemented, and some of it is genuinely well-done.

**Background colors — nailed it.** Body background is `rgb(12, 12, 14)` which is exactly `#0C0C0E` (Obsidian). Sidebar background is `rgb(17, 17, 20)` / `#111114`, a proper L1 surface color. Stat card surfaces are `rgb(20, 20, 22)` / `#141416`, the correct L1 elevation. The tonal stacking — background → sidebar → card — is precisely what was recommended.

**Text colors — correct.** Primary heading text is `rgb(245, 240, 232)` / `#F5F0E8` (Parchment). Body text uses `rgba(245, 240, 232, 0.65)`, an appropriate secondary opacity. These are the exact values from the Obsidian palette.

**Heading weight — correct.** All headings render at `font-weight: 400`. No bold headings anywhere. This is a key luxury signal.

**Sidebar architecture — correct.** Collapsed to 8 primary sections (Home, Property, Governance, Treasury, Community, Documents, Services, Settings) with expandable children. Active item indicated by a vertical left-edge bar in aged brass. No background highlights on active items. This is exactly what was recommended.

**Seasonal banner — mostly correct.** No emoji. Text only. The banner reads "Spring at Faircroft — enjoy the blooms!" without the 🌸 that was there before.

**Dues treatment — correct.** The dashboard shows "Payment Reminder — 1 quarter outstanding" with "$200.00" and a quiet "Settle Balance >" link in rosewood tones. No red alert, no exclamation marks. The button uses `background: rgba(107, 58, 58, 0.15)` and `color: rgb(139, 90, 90)` — appropriately muted rosewood. This is the concierge treatment that was recommended.

**Card borders removed.** All stat cards show `border: 0px solid`. The old dashed/solid borders wrapping every card are gone.

**"ON-CHAIN FINANCE" / "COMMUNITY RECORDS" category labels.** These use small caps and muted color at small size — a good editorial touch, though "ON-CHAIN FINANCE" should still be reconsidered (see fixes below).

**Accent color usage.** The aged brass `#B09B71` is used correctly for active states, buttons, and the sidebar indicator. Rosewood `#6B3A3A` derivatives are used for the dues/alert states.

---

## The Scoring — 0 to 60 Luxury Framework

Applying the evaluation framework from the Agent Profile:

**PALETTE: 6/10**
Background and text colors are excellent. Accent colors (brass, rosewood) are well-chosen. Loses points because: (a) the Governance Stats page still uses bright green, yellow, and blue-teal for progress bars and voter rankings — at least 5 competing accent colors on one page; (b) the allocation overview bar on Treasury uses green and blue; (c) proposal lifecycle steps use green and blue circles; (d) the "For/Against/Abstain" voting buttons introduce green and red. The core palette is right, but secondary/semantic colors haven't been brought into the luxury system.

**TYPOGRAPHY: 2/10**
This is the single biggest failure. Every element on every page renders in the browser's default serif — `"Times"`. The CSS correctly specifies `font-family: "Playfair Display"` for headings and `"DM Sans"` for body text, and `@font-face` rules exist for both, but **no fonts are actually loading**. All 16+ `@font-face` declarations show `status: "unloaded"` via the `document.fonts` API. The woff2 files return HTTP 200 from the server, but the browser isn't applying them. The likely cause: the CSS font-family declarations aren't including proper fallback stacks, or the `@font-face` `src` URLs are resolving to the wrong path at runtime. The result is that *the entire app renders in Times New Roman* — which immediately signals "broken website" rather than "luxury portal." Additionally, body text is `16px` on the body element but many labels and secondary text render at `10px–12px`, which is too small. Letter-spacing on body copy is `normal` instead of the recommended `+0.01em`.

**DENSITY: 4/10**
The dashboard still shows 6 stat cards, a Getting Started checklist (7 items), a dues card, a resident spotlight carousel, property insights, property improvements (3 line items), quick actions (5 cards), a delegation card, and a "Complete Your Setup" prompt — all on one page. The recommendation was 3 content blocks above the fold. The current page has 10+ blocks. The stat cards alone (Voting Power, Treasury, Active Proposals, Documents, HOA Health, Weather) create visual noise. Treasury, Governance Stats, and Documents pages are better but still show 4 stat cards each across the top.

**SURFACE TREATMENT: 6/10**
Card backgrounds use proper tonal elevation (`#141416` on `#0C0C0E`). Card borders are removed. However, there are **no box-shadows anywhere** — every card shows `box-shadow: none`. The recommendation was `box-shadow: 0 1px 2px rgba(0,0,0,0.4)` for L2 surfaces. Without shadows, cards feel flat rather than physically elevated. On the Proposals page, stat cards still have visible thin borders despite the dashboard cards being borderless — implementation is inconsistent. The border-radius of `16px` is slightly too round for a luxury feel; `8–12px` would be more restrained.

**EMOTIONAL REGISTER: 6/10**
In dark mode, the overall feeling is a clear improvement — quiet, dark, not aggressive. The seasonal banner is text-only. Dues are a gentle reminder. The sidebar is calm. However, the HOA Health donut chart with a red "F" grade still reads as an alarming failure report. The Getting Started checklist with its progress bar and green checkmarks reads as onboarding SaaS, not members' club. Quick Actions with 5 icon cards reads as a mobile app launcher. The emotional register is split between "private club" and "productivity tool."

**ICONOGRAPHY: 5/10**
The app uses Lucide icons (confirmed: `stroke-width="2"` in SVGs). The recommendation was thin-stroke icons at `stroke-width: 1` or `1.5` and at low opacity (40%). Current icons are at full opacity and `stroke-width: 2`, which makes them more prominent than they should be. The forum heading includes an inline SVG icon before "Discussion Forum" — headings should stand alone typographically. On the positive side, emoji usage has been dramatically reduced. Only one 🏠 emoji was found (in forum post content). The sidebar, headers, and navigation are now emoji-free.

**TOTAL: 29/60 — Mid-market. Significant refinements needed.**

The bones are right — palette, elevation structure, sidebar architecture, dues treatment. But the font loading failure alone drops it from "premium" into "broken." Fix fonts and density, and this could score 42–48.

---

## Priority Fix List

### FIX-01: CRITICAL — Fonts Not Loading (Typography Collapse)

**The problem:** `@font-face` rules exist for Playfair Display (400/500, normal/italic) and DM Sans (400/500, normal), but all fonts show `status: "unloaded"`. The woff2 files return HTTP 200, but the browser default serif ("Times") renders everywhere.

**The fix — three things to check:**

1. **Font-family fallback stacks are missing.** The computed `font-family` on `<h1>` resolves to just `"Times"` — this means the CSS is either not being applied, or the declaration has no fallback. Every `font-family` declaration should include a full stack:
   - Headings: `font-family: "Playfair Display", "Georgia", "Times New Roman", serif;`
   - Body: `font-family: "DM Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;`

2. **Next.js font loading may be misconfigured.** If using `next/font/google`, verify the font import is correct:
   ```js
   import { Playfair_Display, DM_Sans } from 'next/font/google'

   const playfair = Playfair_Display({
     subsets: ['latin'],
     weight: ['400', '500'],
     style: ['normal', 'italic'],
     variable: '--font-playfair',
     display: 'swap'
   })

   const dmSans = DM_Sans({
     subsets: ['latin'],
     weight: ['400', '500'],
     variable: '--font-dm-sans',
     display: 'swap'
   })
   ```
   Then apply: `<body className={`${playfair.variable} ${dmSans.variable}`}>` and use `font-family: var(--font-playfair)` / `var(--font-dm-sans)` in CSS.

3. **Verify the woff2 paths resolve correctly.** The current `@font-face` sources use relative paths like `url("../media/35161b7740c25d33-s.woff2")`. If the app's base path or deployment directory differs from build time, these will 404 silently. Use the browser's Network tab → filter "woff2" to verify each file loads with a 200 status and non-zero file size.

**Verification:** After fixing, `document.fonts.check('400 16px "Playfair Display"')` should return `true`.

---

### FIX-02: CRITICAL — Light Mode Is Broken

**The problem:** Toggling to light mode changes the body background to `#FAF8F5` (correct) and body text to `#1A1A1E` (correct), but nearly everything else stays in dark mode values:
- Sidebar background remains `rgb(17, 17, 20)` — should be `#FAF8F5` or `#F2F0ED`
- Page headings remain `rgb(245, 240, 232)` (parchment) — invisible on ivory. Should be `#1A1A1E`
- Card borders use `rgba(245, 240, 232, 0.06)` — invisible on white. Should be `none` with `box-shadow: 0 1px 3px rgba(0,0,0,0.06)` instead
- Filter buttons text disappears — still using parchment-opacity colors
- Category labels ("COMMUNITY RECORDS") invisible — still parchment

**The fix:** The CSS variable system needs a complete light mode override. Create a `[data-theme="light"]` or `.light` class that remaps every token:

```css
.light {
  --bg-primary: #FAF8F5;
  --bg-surface: #FFFFFF;
  --bg-elevated: #FFFFFF;
  --bg-sidebar: #F2F0ED;
  --text-primary: #1A1A1E;
  --text-secondary: rgba(26, 26, 30, 0.55);
  --accent: #8A7A5A;        /* darker brass for contrast on light */
  --negative: #7A3B3B;
  --positive: #2A5D4F;
  --border-subtle: rgba(26, 26, 30, 0.08);
  --card-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
```

Every component must reference these tokens instead of hardcoded color values.

---

### FIX-03: HIGH — Dashboard Information Density

**The problem:** The dashboard currently displays 10+ content blocks: 6 stat cards, Getting Started (7-item checklist), dues reminder, resident spotlight, delegation card, property insights, complete your setup prompt, quick actions (5 cards), and property improvements (3 items). This is a SaaS admin panel, not a luxury concierge.

**The fix — above the fold, show exactly three things:**

1. **Greeting + address line.** "Good afternoon, Don. 456 Faircroft Drive." Below it, a single prose line: "1 quarter past due · 2 active votes · 6 documents." No cards, no stat boxes.

2. **Most urgent action.** If dues are past due: a single card with amount, date, and "Settle" link. If no dues: show the next upcoming vote.

3. **Community pulse.** One card with 2–3 recent items: a proposal, an announcement, an event. Text only, with timestamps.

**Remove from dashboard entirely:**
- Weather widget (belongs in a footer or settings)
- Getting Started / Complete Your Setup (move to a first-time-only onboarding overlay, or `/settings/setup`)
- Quick Actions grid (the sidebar IS the quick actions)
- Resident Spotlight carousel
- Property Improvements list (move to `/property/improvements`)

**Keep below the fold (collapsible):**
- Property Insights (single card)
- Delegation status (single line, not a card)

---

### FIX-04: HIGH — No Box-Shadows on Cards

**The problem:** Every card across every page has `box-shadow: none`. Cards differentiate from the background only by a 2-point tonal shift (`#141416` on `#0C0C0E`). While the tonal elevation is correct, without a shadow, cards feel like flat colored rectangles rather than physical surfaces.

**The fix:** Add a subtle shadow to all L1 and L2 card surfaces:

```css
/* Dark mode cards */
.card, [class*="card"] {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Hover state */
.card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  transition: all 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* Light mode cards */
.light .card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
```

---

### FIX-05: HIGH — HOA Health Donut Chart Still Uses Red "F"

**The problem:** The HOA Health widget on the dashboard still displays a multi-color donut chart with a large red "F" grade and the number "20" in teal. This is the most emotionally aggressive element on the dashboard — it reads as a failing report card.

**The fix:** Replace with a single letter grade in the heading serif font. "F" becomes just the letter, set large (48px) in Playfair Display, at 60% parchment opacity. Below it: "Community Health Score" in small caps. The score value (20) appears on click/expansion only.

If the grade must use color:
- A+ through B: `#2A5D4F` (verdigris)
- B- through C: `#B09B71` (brass)
- D through F: `#6B3A3A` (rosewood)

Never use saturated red or green. Remove the donut chart entirely.

---

### FIX-06: HIGH — Stat Card Borders Inconsistent

**The problem:** Dashboard stat cards correctly have `border: 0px solid`. But on the Proposals page, stat cards (Active Proposals, Voting Delay, Voting Period, Categories) show visible thin dark borders. The Documents page stat cards also show subtle borders. Implementation is inconsistent across pages.

**The fix:** Global rule — no visible borders on any card, anywhere:

```css
[class*="card"], [class*="stat"] {
  border: none !important;
  /* Use tonal bg + shadow instead */
  background: var(--bg-surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
```

---

### FIX-07: HIGH — Governance Progress Bars Use Too Many Colors

**The problem:** The Gov Stats page has voter ranking bars in green, dark green, yellow, and blue-teal. The Pass/Fail breakdown bar uses green and teal gradient. The Treasury allocation bar uses green and blue. These introduce 4–5 accent colors outside the approved palette.

**The fix:** All progress bars, charts, and data visualizations should use only:
- Primary data: `#B09B71` (aged brass)
- Secondary data: `rgba(176, 155, 113, 0.4)` (brass at 40%)
- Negative/alert: `#6B3A3A` (rosewood)
- Positive: `#2A5D4F` (verdigris)
- Neutral: `rgba(245, 240, 232, 0.15)` (parchment at 15%)

The voter ranking bars should all be brass at decreasing opacity (100%, 80%, 60%, 40%, 20%) to show ranking without introducing new colors. The pass/fail bar: passed = verdigris `#2A5D4F`, failed = rosewood `#6B3A3A`.

---

### FIX-08: MEDIUM — Body Text Size Too Small in Places

**The problem:** While the body element specifies `font-size: 16px`, many labels, descriptions, and secondary text render at `10px–12px`. The smallest font size detected on the dashboard was `10px`. The recommendation was 14–16px for body copy with monospace data at 85% (≈13px minimum).

**The fix:** Set minimum body text to `13px`. Sidebar items should be `14px–15px`. Card labels ("VOTING POWER", "TOTAL DOCUMENTS") can be `11px–12px` since they're decorative labels in small caps. But descriptive text, timestamps, and readable content should never go below `13px`.

```css
/* Global minimum */
body { font-size: 15px; line-height: 1.65; letter-spacing: 0.01em; }

/* Small caps labels can be smaller */
[class*="label"], [class*="caption"] { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }

/* Never below 13px for readable text */
p, span, li, td { min-font-size: 13px; /* or use clamp */ font-size: max(13px, 0.875rem); }
```

---

### FIX-09: MEDIUM — Icons Too Prominent

**The problem:** All Lucide icons use `stroke-width: 2` at full opacity. The recommendation was `stroke-width: 1` to `1.5` at 40% opacity for a recessive, luxury feel.

**The fix:**

```css
svg.lucide, [class*="lucide"] {
  stroke-width: 1.5;
  opacity: 0.4;
}

/* Sidebar icons */
aside svg { stroke-width: 1.5; opacity: 0.35; width: 18px; height: 18px; }

/* Remove icons from page headings */
h1 svg, h2 svg { display: none; }
```

The Discussion Forum heading currently shows an inline SVG before the text. Remove it — the heading text should stand alone.

---

### FIX-10: MEDIUM — Seasonal Banner Font Style

**The problem:** The seasonal banner text "Spring at Faircroft — enjoy the blooms!" renders in `font-style: normal`. The recommendation was italicized serif type for seasonal/editorial messaging.

**The fix:**

```css
.seasonal-banner, [class*="banner"] {
  font-family: "Playfair Display", Georgia, serif;
  font-style: italic;
  font-size: 13px;
  letter-spacing: 0.02em;
  opacity: 0.7;
}
```

---

### FIX-11: MEDIUM — Border Radius Too Rounded

**The problem:** Cards use `border-radius: 16px`. This is the radius of an iOS app card or a pill button — playful and consumer-facing. Luxury interfaces use tighter radii.

**The fix:** `border-radius: 8px` for cards, `border-radius: 6px` for buttons, `border-radius: 4px` for tags/badges. The roundness should barely register.

---

### FIX-12: MEDIUM — "ON-CHAIN FINANCE" Exposes Technology

**The problem:** The Treasury page heading reads "ON-CHAIN FINANCE" above "Community Treasury." The design direction specified that blockchain terminology should be invisible in the primary UI. "On-chain" is tech jargon.

**The fix:** Replace "ON-CHAIN FINANCE" with simply "TREASURY" or "COMMUNITY FINANCE." The blockchain backing can be mentioned in a footer note or an "About" section, not as the primary section label.

Similarly, "COMMUNITY RECORDS" on the Documents page is fine. But the subtitle "Immutable community records — verified on-chain, stored permanently on Arweave" should be simplified to "Community records — verified and permanently stored."

---

### FIX-13: MEDIUM — Forum Emoji Still Present

**The problem:** The forum post "Welcome to the Faircroft Community Forum! 🏠" still contains a house emoji. The design direction stated: remove all emoji, replace with nothing.

**The fix:** Strip the 🏠 from the forum post content. If this is user-generated content, implement an emoji filter that strips or replaces emoji with nothing on render.

---

### FIX-14: LOW — Proposal Lifecycle Uses Non-Palette Colors

**The problem:** The proposal lifecycle diagram (Pending → Active → Succeeded → Queued → Executed) uses green and blue-tinted circles for steps 2–3. These colors are outside the approved palette.

**The fix:** All lifecycle steps should use brass variants:
- Completed steps: `#B09B71` (solid brass)
- Current step: `#B09B71` with a subtle glow/ring
- Future steps: `rgba(245, 240, 232, 0.15)` (parchment at 15%)

---

### FIX-15: LOW — No Page Transition Animations

**The problem:** Page changes are instant. The recommendation was: content fades in at 300ms with a 6px upward translate, child elements staggered by 40ms.

**The fix:**

```css
/* Page entry animation */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

main > * {
  animation: fadeInUp 300ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

main > *:nth-child(1) { animation-delay: 0ms; }
main > *:nth-child(2) { animation-delay: 40ms; }
main > *:nth-child(3) { animation-delay: 80ms; }
main > *:nth-child(4) { animation-delay: 120ms; }
main > *:nth-child(5) { animation-delay: 160ms; }
```

---

### FIX-16: LOW — Treasury "$0.00" Still a Giant Hero Number

**The problem:** The Treasury page displays "$0.00" at `font-size: 72px`. The recommendation was to present financial data as prose: "Community Treasury: $0.00" in a single line of body text, with operating and reserve breakdowns as subordinate text.

**The fix:** Reduce the hero number to a reasonable heading size (36px max) or, better yet, present it as: "The community treasury holds $0.00 USDC, with $0.00 allocated to operations and $0.00 in reserves." One sentence. Below the fold, expandable detail.

---

## Summary — What to Fix First

| Priority | Fix | Impact |
|----------|-----|--------|
| CRITICAL | FIX-01: Font loading | Every page looks broken without fonts |
| CRITICAL | FIX-02: Light mode | Half the user experience is unusable |
| HIGH | FIX-03: Dashboard density | First impression is cluttered SaaS |
| HIGH | FIX-04: Card box-shadows | Cards feel flat without elevation |
| HIGH | FIX-05: HOA Health donut | Most aggressive element on dashboard |
| HIGH | FIX-06: Inconsistent borders | Some pages border-free, some not |
| HIGH | FIX-07: Chart/bar colors | 5+ non-palette colors on Gov Stats |
| MEDIUM | FIX-08: Small text sizes | Readability issue |
| MEDIUM | FIX-09: Icon prominence | Too bold, not recessive enough |
| MEDIUM | FIX-10: Banner font style | Should be italic serif |
| MEDIUM | FIX-11: Border radius | 16px is too playful |
| MEDIUM | FIX-12: Tech jargon labels | "ON-CHAIN FINANCE" visible |
| MEDIUM | FIX-13: Forum emoji | 🏠 still present |
| LOW | FIX-14: Lifecycle colors | Non-palette greens/blues |
| LOW | FIX-15: Page transitions | No animation on navigation |
| LOW | FIX-16: Treasury hero number | 72px is dashboard-style, not luxury |

**Projected score after fixes: 46–52/60 (Premium, approaching world-class)**

Fix the fonts and the score jumps from 29 to ~38 overnight. Fix density and light mode and you're at 46. The remaining refinements (shadows, icons, animations) push toward 52.

---

*"The details are not the details. They make the design." — Charles Eames*
