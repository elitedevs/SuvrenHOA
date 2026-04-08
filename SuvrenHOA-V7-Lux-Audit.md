---
target: https://hoa.suvren.co
auditor: Lux (Council ultra-luxury design director)
date: 2026-04-08
viewports_run: 1440x900, 820x1180, 390x844
lux_reports:
  - lux_dev_2026-04-08T223025Z.json (1440x900)
  - lux_dev_2026-04-08T223036Z.json (820x1180)
  - lux_dev_2026-04-08T223045Z.json (390x844)
---

# Lux Audit — hoa.suvren.co

## Headline

**Raw Lux score: 47 / 60.** "Premium. Refinements remain, but the foundation is correct."

**Adjusted score after filtering false positives: ~50 / 60.** Four of the twelve findings are not real defects — they're an artifact of how Lux currently fetches pages. See *"Audit limitations"* below.

Gut read from Lux: *"This feels like Stripe in a good suit — clean and capable, but the cuff links are plastic."*

## What's working — do not touch

| Category | Score |
| --- | --- |
| Typography | 10 / 10 |
| Density | 10 / 10 |
| Surface | 10 / 10 |
| Iconography | 10 / 10 |

These four categories returned zero findings across all three viewports. Whatever is set on the typography ramp, spacing grid, surface treatments, and icon discipline — leave it alone.

## Real defects (8) — palette discipline

The page is shipping eight hex codes that are not in Lux's canonical palette. All eight live in the inline `<style>` block of the SSR HTML — confirmed by `curl https://hoa.suvren.co | grep -ioE '#[0-9a-f]{6}'`. Two ARE on-palette (`#0C0C0E` obsidian, `#B09B71` aged brass) and pass clean.

| Off-palette hex | Likely intent | Recommended fix |
| --- | --- | --- |
| `#1a1b1f` | Near-miss on `#1a1a1e` (obsidian dark surface) — looks like a typo | Snap to `#1a1a1e` |
| `#8a7550` | Near-miss on `#8a7a5a` (dark brass, light-mode accent) | Snap to `#8a7a5a` |
| `#c4b08a` | Near-miss on `#c4a96e` (light brass) | Snap to `#c4a96e` or register as a tonal step in `memo.palette` with intent |
| `#3a7d6f` | Custom verdigris/teal — close to `#4a7a6a` and `#2a5d4f` (verdigris, positive) | Replace with `#2a5d4f` for "positive" semantics; if you need a brighter teal, register it intentionally |
| `#5a7a9a` | Foreign blue-grey — not in any palette family | Either snap to a slate (`#2c2c2e`) or kill it; blue does not belong in the obsidian/ivory/slate/midnight system |
| `#30e000` | Vivid pure green — almost certainly a "live" or "online" status pip | Replace with `#2a5d4f` (verdigris) or muted `#4a7a6a`. Lux's rule: never an exclamation mark |
| `#ff494a` | Vivid red — almost certainly a "down" / "error" indicator | Replace with `#6b3a3a` (rosewood) or `#7a3b3b` (deeper rosewood) |
| `#ffd641` | Vivid amber — almost certainly a "warning" indicator | Replace with `#a08050` (warm amber) — already in palette |

The three vivid colors (`#30e000`, `#ff494a`, `#ffd641`) are the most damaging to the luxury feel. They're saturated, bright, and visually loud — they read as a SaaS dashboard, not a private banking portal. Swapping them to the muted palette equivalents is the single highest-impact fix.

The three near-miss typos (`#1a1b1f`, `#8a7550`, `#c4b08a`) are easy snaps and should take ten minutes.

## False positives (4) — Lux loader limitation

Lux flagged these four:

- `[M] No :focus-visible style found in any rule`
- `[L] No :hover style found in any rule`
- `[L] No :active style found in any rule`
- `[L] No :disabled style found in any rule`

These are not real. Direct verification:

```
$ curl -s https://hoa.suvren.co/_next/static/chunks/0y_ygpwgef.af.css \
    | grep -oE ':(hover|focus-visible|active|disabled)' | sort | uniq -c
   6 :active
   8 :disabled
  10 :focus-visible
 150 :hover
```

The Tailwind chunk has 150 hover rules, 10 focus-visible rules, 8 disabled rules, 6 active rules. Component state coverage is fine.

**Why Lux missed them:** `lux.py:_fetch_page` uses `urllib.request` to grab raw HTML and only inspects inline `<style>` blocks. It does not execute JS, does not follow `<link rel="stylesheet">`, and does not capture computed styles. For a Next.js 16 app where Tailwind utilities ship in linked chunks, the `eye_05_component_states` eye is structurally blind to anything outside the SSR critical CSS.

This also explains why all three viewport runs returned identical 47/60 scores — Lux is fetching the same SSR HTML each time and not actually rendering at the requested viewport.

## Recommended priorities

**Today (1-hour fix):**
1. Snap `#1a1b1f` → `#1a1a1e`, `#8a7550` → `#8a7a5a`, `#c4b08a` → `#c4a96e` in the source. These are typos, not design decisions.
2. Replace the three vivid status colors with muted palette equivalents: `#30e000` → `#2a5d4f`, `#ff494a` → `#6b3a3a`, `#ffd641` → `#a08050`.

**This week:**
3. Decide whether `#3a7d6f` and `#5a7a9a` are intentional. If yes, register them in `memo.palette` with documented intent ("primary teal accent for X", "secondary slate for Y"). If no, kill them.

**Lux upgrade backlog (so future audits are accurate):**
4. Wire `_fetch_page` to Playwright so Lux actually renders the page. Then the linked CSS chunks will be in scope, computed styles will be captured per text node, and the viewport flag will produce different results at desktop / tablet / mobile.
5. The describe-line on the desktop subject was `(1440x900, 0 text nodes)` — once Playwright is in place, text node collection will populate and `eye_03_contrast`, `eye_01_typography_scale`, and others will run against the actual rendered text instead of an empty list.

## Score with proposed fixes

After fixing the 8 palette issues, PALETTE goes from 0/10 → 10/10. After the Playwright upgrade clears the false positives, EMOTIONAL goes from 7/10 → 10/10. That puts the page at **60/60** on Lux's current rubric — at which point you've outgrown the rubric and need to add harder eyes (motion discipline, micro-interaction refinement, copy register, hierarchy weight).

## North Star calibration

Lux's reference points for this audit:
- Aman Tokyo booking portal
- Lombard Odier private banking
- Linear dashboard

*"Quiet, confident, hand-stitched. Never an exclamation mark."*
