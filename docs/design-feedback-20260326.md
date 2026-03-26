# Design Feedback — March 26, 2026

## From Ryan's Visual Review

### 🔴 Critical
1. **Logo size is ridiculous** — too big or too small in sidebar, needs proper sizing
2. **White text on sand/gold background lacks luxury feel** — needs better contrast, maybe dark text on gold
3. **Icons look out of place** — emoji icons cheapen the design, need proper Lucide icons in matching gold tones
4. **Icons must match color tones** — inconsistent icon colors throw the eye off and cheapen everything
5. **Static/mock data everywhere** — needs to be hooked to DB/API, not hardcoded

### 🟡 Design Polish
6. **Sidebar community section** — nest sub-items for cleaner look (cookbook, fitness, garden etc under Community)
7. **Report Violation button** — red shade should complement the gold theme, not clash
8. **Badge icons (Early Adopter etc)** — good concept, colors should complement theme with subtle shading
9. **Heat map** — looks gorgeous but needs real data, not static
10. **Marketplace escrow** — need proper buyer/seller protection mechanism

### 🔵 UX Questions
11. **How do you assign board members?** — needs a clear admin flow
12. **Dashboard display name** — should show profile name, not just lot number

### Design Principles (from feedback)
- ALL icons must be in gold/champagne tones or complementary shades
- No bright emoji — everything Lucide in consistent sizes
- Colors should feel cohesive — nothing should "throw the eye off"
- If something looks like it doesn't belong, it doesn't belong
- Static data is a crutch — everything should be wired to real data

## Planning Queue (from Ryan)

### Smart Contract Work
- [ ] Marketplace escrow contract — buyer/seller protection, dispute arbitration via board vote
- [ ] Board member management — admin UI for granting/revoking BOARD_ROLE on-chain
- [ ] Property transfer flow — actual NFT transfer execution (not just UI wizard)

### Data Migration (localStorage → Supabase)
- [ ] Priority 1: Forum posts, marketplace listings, maintenance requests
- [ ] Priority 2: Violations, announcements, surveys, meeting minutes
- [ ] Priority 3: Pet playdates, recipes, fitness challenges, garden plots
- [ ] Remove ALL static/mock data from pages — empty states until real data exists

### Design System
- [ ] Logo sizing — proper responsive sizing in sidebar + landing
- [ ] Dark text on gold backgrounds (fix contrast)
- [ ] Violation/report buttons — warm red (#a85454) not harsh red
- [ ] Sidebar nesting — collapsible community sub-sections
- [ ] Badge color refinement — complementary shades, not clashing
- [ ] Consistent Lucide icons everywhere in gold tones

### Feature Enhancements
- [ ] Apple Health / fitness tracker sync research
- [ ] 100 skeptic questions → FAQ answers for /rules page
