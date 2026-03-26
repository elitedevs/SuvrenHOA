# SuvrenHOA Visual Design Audit Report

**URL:** https://hoa.suvren.co
**Date:** March 26, 2026
**Auditor:** Claude (Cowork)
**Network:** Base Sepolia (wallet connected: 0xE3...75f2)

---

## 🔴 Critical (Broken / Unusable)

### 1. `/complaints/noise` — Page completely unreachable
- **Issue:** Sidebar link is a plain `<a>` tag instead of a React Router `<Link>`. Clicking it triggers a full page reload. The server cannot serve SPA routes directly, so the page returns a load error and never recovers.
- **Fix:** Convert the sidebar nav link for `/complaints/noise` to a React Router `<Link>` component (or use `navigate()` from `react-router-dom`). Ensure the server has a catch-all fallback that serves `index.html` for all client-side routes.

### 2. `/activity` — Page completely unreachable
- **Issue:** Identical to `/complaints/noise` — the sidebar link triggers a full page reload and the SPA cannot recover. The route is unreachable.
- **Fix:** Same fix — convert to React Router `<Link>`. Audit ALL sidebar nav items to ensure none use plain `<a>` tags for internal routes.

### 3. `/map` — RPC error displayed to users
- **Issue:** The map page shows a raw error dump: "Failed to load map data" with full contract call details (RPC URL, contract address, function signature) exposed in the UI. This leaks internal infrastructure details.
- **Fix:** Catch the RPC error gracefully. Show a user-friendly "Map data unavailable" message with a retry button. Never expose raw contract call data, RPC URLs, or ABI details to end users.

### 4. `/documents` — Document list never loads
- **Issue:** The document list shows skeleton loader placeholders indefinitely (5+ seconds observed). The actual document data never populates. The page appears broken to users.
- **Fix:** Debug the data-fetching logic for the documents list. Add a timeout that transitions from skeleton loaders to an empty state or error message after 3-5 seconds. Ensure the API/contract call is actually returning data.

### 5. SPA routing — Direct URL navigation fails globally
- **Issue:** Navigating directly to any route (e.g., typing a URL or refreshing the page) causes a server error. The SPA only works when navigating via the client-side router from the root.
- **Fix:** Configure the hosting server (Vercel/Netlify/nginx) to serve `index.html` as a fallback for all routes. This is a standard SPA deployment requirement.

---

## 🟡 Warning (Visual / UX Issues)

### 6. `/onboarding` — Shows Profile page content instead of onboarding flow
- **Issue:** Navigating to `/onboarding` renders the Profile page content. The breadcrumb says "Onboarding" but the actual component rendered is the Profile page. The onboarding flow is either missing or incorrectly routed.
- **Fix:** Create a dedicated onboarding component or fix the route mapping so `/onboarding` renders the correct onboarding wizard/flow.

### 7. `/admin/dashboard` — Breadcrumb shows "My Lots" instead of "Board Dashboard"
- **Issue:** The breadcrumb navigation on the Board Dashboard page incorrectly reads "Home > My Lots" instead of "Home > Admin > Board Dashboard."
- **Fix:** Update the breadcrumb configuration for the `/admin/dashboard` route to reflect the correct hierarchy.

### 8. `/contracts` — FaircroftGovernor shows "TOTAL PROPOSALS: —"
- **Issue:** The contracts page shows a dash (—) instead of a number for total proposals on the FaircroftGovernor contract card. Likely a failed or pending data fetch.
- **Fix:** Ensure the proposal count query resolves correctly. Show "0" if the count is zero, and show a loading spinner or "..." while fetching. Never show a raw dash for numeric data.

### 9. `/lost-found` — Breadcrumb shows "Lost found" instead of "Lost & Found"
- **Issue:** The breadcrumb displays "Lost found" (lowercase, no ampersand) instead of "Lost & Found."
- **Fix:** Update the route metadata/breadcrumb config to use "Lost & Found" as the display name.

### 10. `/settings/notifications` — Toggle ON state has poor visual contrast
- **Issue:** The notification toggle switches use a subtle gold/tan color when ON that is very hard to distinguish from the OFF (grey) state at a glance. The header reads "8 OF 8 ENABLED" but the toggles visually appear off.
- **Fix:** Increase the contrast of the ON state — use a brighter gold (#c9a96e at full opacity) with a more visible knob position change, or add a checkmark icon inside the toggle when enabled.

### 11. `/utilities` — Over-budget items lack warning indicators
- **Issue:** Gas ($1,255 / $1,200) and Internet ($408 / $400) are over budget but the progress bars don't change color or show any visual warning. Users could miss the overspend.
- **Fix:** When a utility exceeds its budget, change the progress bar color to red/orange and add a warning icon or "Over Budget" badge next to the amount.

### 12. `/community/leaderboard` — Grammar: "1 months"
- **Issue:** The leaderboard time filter displays "1 months" instead of "1 month."
- **Fix:** Add singular/plural logic: if count === 1, use "month" (no 's').

### 13. `/pets` — Grammar: "Fishs (0)"
- **Issue:** The pet category filter shows "Fishs" instead of "Fish" (fish is its own plural).
- **Fix:** Use "Fish" as the plural form. Consider a lookup table for irregular plurals.

### 14. `/reservations` — Breadcrumb says "Amenities" instead of "Reservations"
- **Issue:** The URL is `/reservations` and the page title is "Amenities & Reservations" but the breadcrumb only shows "Amenities."
- **Fix:** Update the breadcrumb to show "Amenities & Reservations" or match the route name.

### 15. Sidebar navigation — Some links use plain `<a>` tags
- **Issue:** At least `/complaints/noise` and `/activity` use regular HTML anchor tags in the sidebar instead of React Router Links, causing full page reloads that break the SPA. There may be others.
- **Fix:** Audit every sidebar navigation link. ALL internal routes must use React Router's `<Link>` or `<NavLink>` components. No internal route should ever use a plain `<a>` tag.

### 16. `/utilities` — Progress bars use non-theme colors
- **Issue:** The utility budget progress bars use blue, yellow, orange, purple, and green colors instead of the gold (#c9a96e) design system. While this may be intentional for data visualization differentiation, it breaks the otherwise consistent dark+gold theme.
- **Fix:** Consider using gold shades/gradients for the progress bars, or at minimum ensure the colors are from a defined data-viz palette that complements the gold theme.

---

## 🔵 Polish (Nice-to-Have)

### 17. `/architectural/gallery` — Placeholder images instead of real photos
- **Issue:** The gallery shows green checkmarks and red X icons as image placeholders with approval badges. The design works structurally, but placeholder content looks unfinished.
- **Fix:** Add sample architectural photos (stock images of houses, fences, landscaping) as default content to make the gallery feel complete. Or add a proper empty state message.

### 18. `/pets` — Inconsistent pet card data
- **Issue:** Some pet cards (Rex, Mango, Bella) are missing color, age, and vaccination info while "Test Dog" has all fields populated. The inconsistency makes some cards look emptier.
- **Fix:** Either require all fields or gracefully hide empty fields so cards don't show blank spaces. Consider a "Complete your pet's profile" prompt for incomplete entries.

### 19. `/architectural` — Breadcrumb shows "Arch Review" instead of full name
- **Issue:** Breadcrumb truncates "Architectural Review" to "Arch Review."
- **Fix:** Use the full "Architectural Review" text in the breadcrumb, or if space is a concern, use "Architecture" as the shortened form.

### 20. `/calendar` — Calendar is empty
- **Issue:** The calendar page loads correctly but shows no events. While technically not a bug (could be no data), an empty calendar looks like a broken page.
- **Fix:** Add sample/demo events or show a friendly empty state: "No upcoming events. Check back soon or create one!"

### 21. General — Skeleton loaders should have timeouts
- **Issue:** Multiple pages use skeleton loaders for data fetching, but some (like `/documents`) never resolve. There's no timeout or fallback.
- **Fix:** Implement a global timeout (3-5 seconds) on all skeleton loader states. After timeout, show either the data, an empty state, or an error message with retry. Never leave skeletons spinning indefinitely.

---

## ✅ Looks Good

The following pages passed the visual audit — correct dark+gold theme, proper breadcrumbs, clean layouts, good spacing, and no broken elements:

- `/` / `/dashboard` — Stat cards, lot info, clean layout
- `/treasury` — Financial overview, clean KPIs
- `/treasury/budget` — Budget planner, well-structured
- `/treasury/vendors` — Vendor list, clean table
- `/documents/minutes` — Meeting minutes, great layout
- `/violations` — Heatmap visualization, solid design
- `/dues` — Payment tracking, clean cards
- `/directory` — Resident directory, good grid layout
- `/community` — Community hub, clean navigation
- `/community/forum` — Forum threads, well-structured
- `/community/leaderboard` — Leaderboard (aside from "1 months" grammar)
- `/community/cookbook` — Recipe cards, good design
- `/community/fitness` — Fitness tracking, clean layout
- `/announcements` — Announcement cards, nice badges
- `/calendar` — Calendar widget works (just empty)
- `/messages` — Messaging UI, clean layout
- `/alerts` — Alert notifications, proper categorization
- `/health` — Health score dashboard, good visualizations
- `/transparency` — Transparency metrics, excellent data display
- `/profile` — User profile, clean form layout
- `/maintenance` — Kanban board, great interactive layout
- `/amenities` — Amenities list, good cards
- `/contractors` — Contractor directory, excellent layout
- `/architectural` — Review submissions, good workflow
- `/architectural/gallery` — Gallery grid (placeholders noted above)
- `/surveys` — Survey list, clean design
- `/pets` — Pet registry (data inconsistency noted above)
- `/vehicles` — Vehicle registry, clean grid of 50 spots
- `/admin` — Admin panel, proper access control
- `/contracts` — Smart contract dashboard, good layout
- `/marketplace` — Community marketplace, clean listing
- `/gallery` — Photo gallery, good dark theme, filter chips work
- `/parking` — Parking grid, color-coded status indicators
- `/safety` — Safety reports, status cards and filters
- `/rules` — Community rules, expandable sections
- `/reports/annual` — Annual report, financial charts with gold bars
- `/newsletter` — Newsletter archive, clean cards
- `/lost-found` — Item cards with emoji icons (breadcrumb noted above)
- `/utilities` — Utility tracking (over-budget warning noted above)
- `/emergency` — Emergency contacts, 911 banner, well-organized
- `/emergency/preparedness` — Preparedness checklist, tabbed sections
- `/services/trash` — Trash schedule calendar, "Today!" highlight
- `/settings/notifications` — Toggle settings (contrast noted above)
- `/governance/stats` — Governance KPIs, bar charts, voter leaderboard

---

## ⚠️ Not Tested (Chrome Extension Disconnected)

The following items could not be tested due to the browser session ending:

**Pages:**
- `/governance/voting-power`
- `/verify/1` (public property verify page)
- `/proposals/[detail]` (clicking into a specific proposal)
- `/treasury/reimbursement`

**Interactive Features:**
- Cmd+K command palette
- `?` keyboard shortcut overlay
- Dark/light mode toggle
- Welcome tour (after clearing `suvren-tour-completed` from localStorage)
- Seasonal banner appearance and dismissal

**Mobile Responsiveness:**
- 375px width testing was not performed on any page

---

## Summary Statistics

| Category | Count |
|----------|-------|
| 🔴 Critical | 5 issues |
| 🟡 Warning | 11 issues |
| 🔵 Polish | 5 issues |
| ✅ Passed | 45 pages |
| ⚠️ Not Tested | 4 pages + interactive features + mobile |

### Top Priority Fixes

1. **Fix SPA server config** — Add catch-all route to serve `index.html` for all paths (fixes direct URL nav + page refresh)
2. **Audit all sidebar links** — Convert every plain `<a>` tag to React Router `<Link>` (fixes `/complaints/noise`, `/activity`, and any others)
3. **Fix `/map` RPC error** — Catch errors gracefully, never expose contract/RPC details to UI
4. **Fix `/documents` loading** — Debug the data fetch, add skeleton timeout with fallback
5. **Fix `/onboarding` routing** — Ensure it renders the actual onboarding flow, not the Profile page
