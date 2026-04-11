# Filing Day Runbook — Patent + Trademark

**Purpose:** Close Council Item 3 by filing the provisional patent and the
SuvrenHOA trademark in a single sit-down session. Everything you need to know
is on this page. If you need background, see [`USPTO-FILING-GUIDE.md`](./USPTO-FILING-GUIDE.md)
(reference only — this runbook supersedes it for the day-of-filing workflow).

**Status as of 2026-04-11:**
- Patent package v9: **AUDIT-CLEAN** per ARGUS 2026-04-09T181448Z (0 critical / 0 high / 0 medium / 0 low; 1 info line just counting claims)
- Claims: **36** (v5 reorganized 24 → 36 per MPEP 608.01(n); System 1-21, Method 22-26, CRM 27-36)
- Trademark: **SuvrenHOA only**, Class 42 (SaaS). `Suvren` standalone is deferred — known conflict with Captodiame Hydrochloride pharma tradename, not worth the fight.
- Total estimated cost: **$65** (patent micro-entity) **+ $350** (TEAS Plus SuvrenHOA Class 42) = **$415**
- Total estimated chair time: **~90 min** (patent ~45, TM ~45)

---

## Pre-flight (do this BEFORE sitting down)

- [ ] Coffee, not beer. This is financial + legal paperwork; don't screw it up.
- [ ] Credit card ready (payable to USPTO).
- [ ] USPTO.gov account exists and email is verified. If not: https://patentcenter.uspto.gov → Register.
- [ ] You confirm all three micro-entity gates (gross income <$251,190 in 2025, <4 prior inventor apps, no assignment to large entity). These are all YES for you today.
- [ ] The v9 filing package is on your local machine, not just the share drive:
      `cp -r /Volumes/References/Code/suvren/patent-filing-package/v9/ ~/Desktop/patent-filing-v9/`
- [ ] Save this page open in one tab. Don't close it until both filings are confirmed.

---

## TRACK A — Provisional Patent (USPTO Patent Center)

**Time budget:** 45 min
**Fee:** $65 (micro-entity provisional per 37 CFR 1.16(d))
**Source of truth:** `Code/projects/suvrenhoa/business-docs/patent-filing-package/v9/`

### Documents to upload (in this order, from v9/)

| # | File | Patent Center category | Description |
|---|------|----|----|
| 1 | `SuvrenHOA-Provisional-Patent.pdf` | **Specification** | 29-page spec, 36 claims (System 1-21, Method 22-26, CRM 27-36) |
| 2 | `SuvrenHOA-Patent-Drawings.pdf` | **Drawings** | 20 pages, 9 figures (FIG. 1–FIG. 9) |
| 3 | `SuvrenHOA-Code-Appendix.pdf` | **Exhibit/Appendix** | 45 pages, Appendix A-1 through A-6 (Solidity source) |

> ⚠️ USPTO-Filing-Guide.pdf inside v9/ is **reference material only** — do NOT upload it. It's there for your reference, not for submission.

### Day-of values (copy/paste ready)

| Field | Value |
|---|---|
| Inventor — First Name | `Ryan` |
| Inventor — Last Name | `Shanahan` |
| Inventor — City | `Raleigh` |
| Inventor — State | `NC` |
| Inventor — Country | `US` |
| Inventor — Citizenship | `US` |
| Applicant Type | `Inventor` (pro se) |
| Entity Size | `Micro Entity` |
| Title of Invention | `Blockchain-Based Homeowners Association Governance System` |
| Docket Number (optional) | `SUVREN-PROV-001` |

### Sequential steps

1. **Log in:** https://patentcenter.uspto.gov → Sign in with USPTO.gov credentials.
2. **New Submission → Patent → Provisional Application → Start.**
3. **Inventor Information:** enter the "Day-of values" table above. Sole inventor.
4. **Applicant Information:** select `Inventor`, name matches inventor, Raleigh NC USA, pro se micro entity.
5. **Add Document → Specification →** upload `SuvrenHOA-Provisional-Patent.pdf`, description: `Specification`.
6. **Add Document → Drawings →** upload `SuvrenHOA-Patent-Drawings.pdf`, description: `Drawings`.
7. **Add Document → Exhibit/Appendix →** upload `SuvrenHOA-Code-Appendix.pdf`, description: `Appendix A — Smart Contract Source Code`.
8. **Fees section → Micro Entity** → check the certification box. ⚠️ If unsure on any of the three gates, file as **Small Entity** ($130) instead. Don't lie on the cert — false micro-entity certification is fraud.
9. **Review → Pay $65 → Submit.**
10. **IMMEDIATELY download the filing receipt PDF.** If the page closes before you click download, you will regret this.

### Within 60 seconds of submit — record these four things

| Field | Value |
|---|---|
| Application Number | `63/_______________` |
| Filing Date (priority date) | `____/____/____` |
| EFS-Web Confirmation Number | `________________` |
| Non-provisional deadline | `____/____/____` (filing date + 12 months) |

Save the receipt to **two places minimum**:
- `~/Desktop/patent-filing-v9/RECEIPT.pdf`
- `faircroft-dao/docs/legal/patent-receipt-2026.pdf` (then commit)

---

## TRACK B — SuvrenHOA Trademark (USPTO TEAS Plus)

**Time budget:** 45 min
**Fee:** $350 (TEAS Plus, 1 class, per-class per 2025 fee schedule)
**Do not file:** `Suvren` (standalone) — pharma tradename conflict, not worth the fight.
**Do file:** `SuvrenHOA` (the product name), Class 42 only.

### Day-of values (copy/paste ready)

| Field | Value |
|---|---|
| Form | **TEAS Plus** |
| Mark Type | **Standard Character Mark** (no logo, just the wordmark) |
| Literal Element | `SUVRENHOA` |
| Filing Basis | **Section 1(b) — Intent to Use** |
| Owner Type | `Individual` |
| Owner Name | `Ryan Shanahan` |
| Owner Citizenship | `United States` |
| Owner Address | (your Raleigh NC mailing address — use a PO box if you don't want your home address in the USPTO public record) |
| International Class | **042** — Computer and scientific services |
| Description of Services | `Software as a service (SaaS) services featuring software for homeowners association governance, member voting, treasury management, document registration, and property ownership management on a blockchain platform` |
| First Use in Commerce Date | (leave blank — 1(b) is intent-to-use) |
| Specimen | (not required for 1(b) — required later at Statement of Use) |

### Why Class 42 specifically

USPTO ID Manual entry **042-2063**: *"Software as a service (SaaS) services featuring software for…"*. This is the pre-approved free-text ID format TEAS Plus requires — picking it off the Acceptable ID Manual is what keeps you in TEAS Plus ($350) instead of TEAS Standard ($500).

If the Trademark Office examiner rejects the description as too narrow, you have fallback room at **042-5008** (*"Providing temporary use of on-line non-downloadable software for…"*) — but try the SaaS form first; it's the right characterization.

### Sequential steps

1. **Log in:** https://teas.uspto.gov/ccr/ → Sign in with USPTO.gov credentials (same account as patent side).
2. **Apply for a Trademark → TEAS Plus → Begin New Application.**
3. **Mark Information:** Standard Character Mark → literal element `SUVRENHOA` (all caps is standard).
4. **Owner Information:** enter the table above. Individual, US, Raleigh NC.
5. **Goods & Services:**
   - Click **Add Class** → International Class 042.
   - Use the **ID Manual** button to find and pick `042-2063` (SaaS). Don't free-type.
   - Paste the description of services from the table above.
6. **Filing Basis:** Section 1(b) — Intent to Use. ⚠️ Do NOT pick 1(a) — you don't have a specimen of use yet (site is pre-launch).
7. **Signature:** Direct signature by applicant. Name `Ryan Shanahan`, sign with `/Ryan Shanahan/` in the signature field (the slash format is USPTO's e-signature convention).
8. **Correspondence Email:** use the email you actually check. USPTO office actions come through this inbox.
9. **Pay $350 → Submit.**
10. **Save the confirmation email + serial number.** You'll get a `Serial Number: 97/XXX,XXX` confirmation.

### Within 60 seconds of submit — record these three things

| Field | Value |
|---|---|
| TM Serial Number | `97/_______________` |
| TM Filing Date | `____/____/____` |
| TM Correspondence Email | `________________` |

---

## Post-filing housekeeping (same day, 10 min)

- [ ] Update `docs/legal/` with both receipt PDFs (redact card info if visible).
- [ ] Commit: `git add docs/legal/patent-receipt-2026.pdf docs/legal/tm-receipt-2026.pdf && git commit -m "legal: file provisional patent + SuvrenHOA TM [Item 3 closed]"`
- [ ] Update `docs/roadmap-overview.md` Phase A exit criteria — Item 3 is CLOSED.
- [ ] Add a mempalace drawer: `wing=suvren-hoa, room=legal-ip`, body = the two tables from this runbook filled in.
- [ ] Set **two calendar reminders**:
  - **12 months from patent filing date** — "Non-provisional deadline — hire patent attorney or lose priority date"
  - **6 months from TM filing date** — "Check USPTO TSDR for first office action on SUVRENHOA trademark"
- [ ] Schedule **8-month reminder** — "Start engaging patent attorney for non-provisional conversion. Budget $5k-$15k. Look for blockchain/fintech IP specialists."

---

## After 12 months — the patent-attorney conversation

This is the only part of the patent track you CANNOT do yourself. At 12 months you need a non-provisional application with professional claim drafting, prior-art search, and response-to-examiner strategy. Budget:

| Item | Low | High |
|---|---:|---:|
| Non-provisional drafting + filing | $5,000 | $12,000 |
| USPTO filing fees (micro entity, base+search+exam) | $455 | $455 |
| Excess claims fees (over 20 total / 3 independent) | $0 | $500 |
| Drawing review + redraw (if needed) | $0 | $1,500 |
| **Total** | **~$5,500** | **~$14,500** |

Start the attorney search at **month 6**, not month 11. Good IP attorneys have multi-month queues.

Filter for: **blockchain/fintech/distributed-systems IP experience**. A general IP attorney will cost you the same and do a worse job on claim scope for a Solidity system.

Candidate attorney sources (shortlist — these are starting points, not endorsements):
- USPTO Patent Trial and Appeal Board registered practitioners list (filter by state)
- Blockchain Association member firm list (if you're willing to pay big-firm rates)
- IPWatchdog / Patent Center community recommendations
- AIPLA member directory

Ask every candidate these 4 questions on the intro call:
1. How many blockchain-related patent applications have you taken through to issued patents?
2. What's your fixed-fee structure for a non-provisional conversion with an existing provisional?
3. What's your office-action response budget (per response, not per matter)?
4. Do you do the claim drafting yourself, or does it go to a junior associate?

---

## Fallback — if you hit a blocker during filing

| Blocker | What to do |
|---|---|
| Patent Center throws a document validation error | Don't retry-spam. Download the error detail PDF USPTO gives you. It's almost always a font-embedding issue or a margin issue on the drawings. Re-run the v9 PDF generator before re-upload, don't hand-edit. |
| Micro-entity certification page throws an error | File as Small Entity ($130) instead. +$65 cost is not worth arguing with the form. |
| TEAS Plus rejects the goods & services description | Click the ID Manual button (top right of the services field), search `SaaS homeowners`, pick the closest pre-approved entry, and use THAT literal text. TEAS Plus only accepts exact-match pre-approved IDs. |
| TM examiner flags a potential conflict on `SuvrenHOA` | This is an Office Action, not a rejection — you'll get 3 months to respond. See the 6-month calendar reminder above. |
| Credit card declines | Patent Center accepts USPTO Deposit Account credit; you can fund a Deposit Account from your bank in 10 min if cards fail. TM side accepts Visa/MC/Amex/Discover directly. |
| You run out of time and have to stop mid-session | Patent Center **saves drafts** for 30 days. TEAS Plus **does not save drafts reliably** — finish the TM in one sitting or you'll re-enter everything. Start with patent if you're short on time. |

---

## Why we're filing now (the decision, in case you need to justify it later)

1. **Priority date is the whole point.** Filing a provisional buys you 12 months of protected priority for $65. The spec doesn't need to be perfect — it needs to exist and be dated.
2. **ARGUS ran clean on v9.** There are no critical, high, medium, or low findings on any of the four PDFs in the v9 package. The patent is as polished as it's going to get without a patent attorney in the loop.
3. **Atlas flagged the delay.** In the 2026-04-10 council baseline, Item 3 (patent + TM) was one of four real action items. Deferring it past mainnet launch is a single-point-of-failure risk for the whole project — if someone else files similar blockchain-HOA IP while you're shipping contracts, your priority date is worthless.
4. **The trademark is cheap and fast.** TEAS Plus is $350 for one class. Intent-to-use means you don't need a specimen yet. There's no reason to wait.
5. **`Suvren` standalone is deferred on purpose.** The pharmaceutical Captodiame tradename makes `Suvren` contested in Classes 5/10/44. `SuvrenHOA` in Class 42 is a clean field. Fight the battle you can win.

---

*Runbook written 2026-04-11. Supersedes USPTO-FILING-GUIDE.md for day-of execution. Reference material in that file (fee schedules, 37 CFR citations, non-provisional basics) remains accurate.*
