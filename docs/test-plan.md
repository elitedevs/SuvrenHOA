# SuvrenHOA — Test Plan & QA Report

> **Date:** 2026-03-25
> **Tester:** Jenny (AI) + Ryan (Manual)
> **App:** http://192.168.7.63:3300
> **Network:** Base Sepolia (Chain ID 84532)

---

## Test Categories

### 1. 🔌 Connection & Auth
| # | Test | Expected | Status | Notes |
|---|------|----------|--------|-------|
| 1.1 | Load landing page (not connected) | Landing page renders, no errors | ⬜ | |
| 1.2 | Click "Sign In" → MetaMask | RainbowKit modal opens, MetaMask option visible | ⬜ | |
| 1.3 | Connect with MetaMask | Wallet connects, redirects to Dashboard | ⬜ | |
| 1.4 | Disconnect wallet | Returns to Landing page | ⬜ | |
| 1.5 | Switch MetaMask to wrong network | App prompts to switch to Base Sepolia | ⬜ | |
| 1.6 | Connect with no property NFT | Dashboard shows "Welcome to SuvrenHOA" (no lot) | ⬜ | |
| 1.7 | Connect with property NFT | Dashboard shows "Welcome back, Lot #X" | ⬜ | |

### 2. 📊 Dashboard (Connected + Property)
| # | Test | Expected | Status | Notes |
|---|------|----------|--------|-------|
| 2.1 | Voting power displays | Shows correct vote count / total | ⬜ | |
| 2.2 | Treasury balance displays | Shows USDC amount from contract | ⬜ | |
| 2.3 | Active proposals count | Shows number from contract | ⬜ | |
| 2.4 | Document count | Shows count from contract | ⬜ | |
| 2.5 | Health Score widget | Shows score + grade + links to /health | ⬜ | |
| 2.6 | Activity Ticker | Shows recent events or empty state | ⬜ | |
| 2.7 | Dues Reminder | Shows dues status (current/overdue) | ⬜ | |
| 2.8 | Nav cards all clickable | All 6 nav cards link to correct pages | ⬜ | |
| 2.9 | Onboarding banner | Shows "Complete Setup" if not onboarded | ⬜ | |

### 3. 🔍 Public Pages (No Wallet)
| # | Test | Expected | Status | Notes |
|---|------|----------|--------|-------|
| 3.1 | /transparency loads | Stats, activity, trust section render | ⬜ | |
| 3.2 | /transparency stats are live | Numbers reflect on-chain data | ⬜ | |
| 3.3 | /map loads | Shows lot grid with 6 properties | ⬜ | |
| 3.4 | /map color coding | Green=current, Red=overdue | ⬜ | |
| 3.5 | /map click lot → detail panel | Slide-out shows property info | ⬜ | |
| 3.6 | /health loads | Score ring + breakdown renders | ⬜ | |
| 3.7 | /community/leaderboard loads | Tabs + empty/populated state | ⬜ | |

### 4. 🏛️ Governance
| # | Test | Expected | Status | Notes |
|---|------|----------|--------|-------|
| 4.1 | /proposals loads | Shows proposals list or empty state | ⬜ | |
| 4.2 | Create proposal form | Form renders with category/title/description | ⬜ | |
| 4.3 | /treasury loads | Shows balances (operating/reserve) | ⬜ | |
| 4.4 | /documents loads | Shows document list or empty state | ⬜ | |
| 4.5 | /violations loads | Shows violations or empty state | ⬜ | |

### 5. 💳 Dues & Payments
| # | Test | Expected | Status | Notes |
|---|------|----------|--------|-------|
| 5.1 | /dues loads | Shows dues status + payment options | ⬜ | |
| 5.2 | Dues reminder shows correct status | Matches on-chain isDuesCurrent | ⬜ | |
| 5.3 | Community dues status | Progress bar with paid/total | ⬜ | |
| 5.4 | Pay dues button | Opens MetaMask for USDC approval+payment | ⬜ | |

### 6. 👤 Property & Profile
| # | Test | Expected | Status | Notes |
|---|------|----------|--------|-------|
| 6.1 | /dashboard (property page) | Shows lot details, sqft, address | ⬜ | |
| 6.2 | /pets loads | Shows pet registry | ⬜ | |
| 6.3 | /pets → Register Pet | Form works, saves to Supabase | ⬜ | |
| 6.4 | /vehicles loads | Shows vehicle registry | ⬜ | |
| 6.5 | /vehicles → Register Vehicle | Form works, saves to Supabase | ⬜ | |
| 6.6 | /profile loads | Shows profile page | ⬜ | |
| 6.7 | /directory loads | Shows community directory | ⬜ | |

### 7. 🏘️ Community
| # | Test | Expected | Status | Notes |
|---|------|----------|--------|-------|
| 7.1 | /community (forum) loads | Shows posts or empty state | ⬜ | |
| 7.2 | /announcements loads | Shows announcements | ⬜ | |
| 7.3 | /calendar loads | Shows calendar | ⬜ | |
| 7.4 | /surveys loads | Shows surveys | ⬜ | |
| 7.5 | /reservations loads | Shows amenity reservations | ⬜ | |

### 8. 🚨 New Features (Phase 1-4)
| # | Test | Expected | Status | Notes |
|---|------|----------|--------|-------|
| 8.1 | /alerts loads | Shows alerts page, create form for board | ⬜ | |
| 8.2 | Create alert (board wallet) | Alert saves + shows in banner | ⬜ | |
| 8.3 | Alert banner on all pages | Global banner shows active alerts | ⬜ | |
| 8.4 | /messages loads | Messaging center renders | ⬜ | |
| 8.5 | Send a message | Message appears in conversation | ⬜ | |
| 8.6 | /onboarding wizard | 6-step flow works end to end | ⬜ | |
| 8.7 | Onboarding saves to Supabase | Pets/vehicles sync on completion | ⬜ | |
| 8.8 | /checkout wizard | 3-step checkout flow | ⬜ | |
| 8.9 | AI chat widget | Floating button → chat panel opens | ⬜ | |
| 8.10 | AI assistant answers | "What's in treasury?" returns data | ⬜ | |
| 8.11 | /assistant full page | Full-page chat works | ⬜ | |

### 9. 🧭 Navigation
| # | Test | Expected | Status | Notes |
|---|------|----------|--------|-------|
| 9.1 | Desktop dropdowns | Property/Governance/Community/Services hover-open | ⬜ | |
| 9.2 | All dropdown links work | Every link navigates correctly | ⬜ | |
| 9.3 | Mobile hamburger | Opens slide-out menu | ⬜ | |
| 9.4 | Mobile accordion sections | Expand/collapse groups | ⬜ | |
| 9.5 | Active page highlighting | Current page highlighted in nav | ⬜ | |
| 9.6 | Utility icons (Health/Alerts/Messages/AI) | All link correctly | ⬜ | |

### 10. 🎨 Design & UX
| # | Test | Expected | Status | Notes |
|---|------|----------|--------|-------|
| 10.1 | Cards hover-lift | All glass cards lift on hover | ⬜ | |
| 10.2 | Text glow on headings | Key headings have purple glow | ⬜ | |
| 10.3 | Floating orbs animate | Background orbs on landing/transparency | ⬜ | |
| 10.4 | No horizontal overflow | No page scrolls horizontally | ⬜ | |
| 10.5 | Mobile responsive | All pages usable on mobile width | ⬜ | |
| 10.6 | No console errors | Clean console (no 413s, no 404s) | ⬜ | |
| 10.7 | Purple scrollbar | Custom scrollbar visible | ⬜ | |

### 11. 🔧 Admin
| # | Test | Expected | Status | Notes |
|---|------|----------|--------|-------|
| 11.1 | /admin loads | Shows admin page | ⬜ | |
| 11.2 | Mint property form | Form renders, requires REGISTRAR_ROLE | ⬜ | |
| 11.3 | Register document form | Form renders | ⬜ | |

---

## Bug Tracking

| # | Severity | Page | Bug Description | Status |
|---|----------|------|-----------------|--------|
| B1 | | | | |

---

## How to Use This Plan
1. Jenny runs automated checks (API calls, page loads, console errors)
2. Ryan does manual walkthroughs (visual, UX, mobile)
3. Bugs get logged in the Bug Tracking table
4. Fix → retest → mark as ✅
