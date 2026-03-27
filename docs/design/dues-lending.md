# SuvrenHOA Dues Lending — Design Proposal

**Date:** March 27, 2026  
**Status:** Draft  
**Author:** Jenny  

---

## Overview

Allow HOA members to take a short-term loan from the community treasury to cover their dues when they can't pay in full. The loan is repaid in installments with a modest interest rate, and the borrower's property NFT (soulbound) serves as the trust anchor — they can't sell or transfer without settling the loan first.

This is NOT traditional DeFi lending. It's a **community-internal micro-loan program** — the HOA treasury acts as the lender, and the terms are governed by the DAO.

---

## Why This Makes Sense

1. **Late fees hurt both parties.** A homeowner who can't pay gets hit with escalating fees. The HOA gets bad blood and delayed revenue. A payment plan is better for everyone.
2. **The treasury is the lender.** No external protocol needed. The reserve fund can allocate a portion for community loans.
3. **Soulbound NFTs = built-in accountability.** The borrower can't walk away — their property NFT is locked from transfer until the loan is settled.
4. **On-chain transparency.** Every loan, payment, and default is recorded permanently.

---

## Architecture

### New Contract: `DuesLending.sol`

**Core Concept:** Property owners can request a loan to cover 1-4 quarters of dues. The contract pays the treasury directly (so dues stay current), and the borrower repays in installments.

### Loan Parameters (DAO-configurable)

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `maxLoanQuarters` | 4 | 1-4 | Max quarters coverable by a single loan |
| `interestRateBps` | 500 | 0-2000 | Annual interest rate (5% default) |
| `maxInstallments` | 12 | 2-24 | Max monthly installments |
| `minInstallments` | 2 | 1-6 | Min monthly installments |
| `installmentPeriod` | 30 days | 14-90 days | Time between payments |
| `gracePeriodDays` | 7 | 0-30 | Grace period after due date before default |
| `maxLoanPoolBps` | 1500 | 0-5000 | Max % of reserve fund available for loans (15%) |
| `maxActiveLoansPerProperty` | 1 | 1-3 | Only one active loan at a time |
| `originationFeeBps` | 100 | 0-500 | One-time origination fee (1%) |

### Loan Lifecycle

```
REQUEST → ACTIVE → REPAYING → SETTLED
                 ↘ DEFAULT → GOVERNANCE REVIEW
```

1. **Request:** Borrower calls `requestLoan(tokenId, quarters, installments)` 
   - Must own the property NFT
   - Must not have an existing active loan
   - Loan pool must have sufficient funds
   - Calculates total: principal + interest + origination fee
   - Generates amortization schedule

2. **Activation:** Loan becomes active immediately
   - Contract calls `treasury.payDues(tokenId, quarters)` — dues are current
   - USDC moves from reserve fund → treasury operating/reserve split
   - PropertyNFT transfer lock is set (can't sell until loan settled)
   - First installment due in `installmentPeriod` days

3. **Repayment:** Borrower makes payments via `makePayment(loanId, amount)`
   - Can pay any amount ≥ minimum installment
   - Can overpay or pay off early (no prepayment penalty)
   - Each payment reduces principal, then interest
   - Emits `LoanPayment` event

4. **Settlement:** When fully repaid
   - Transfer lock removed from PropertyNFT
   - Loan marked as settled
   - Interest earned flows back to reserve fund
   - Emits `LoanSettled` event

5. **Default:** If payment missed past grace period
   - Loan marked as defaulting
   - Late fee applied to remaining balance
   - After 3 missed payments → `LoanDefault` event
   - Governance can vote on remediation (payment plan restructure, lien, etc.)
   - Transfer lock remains — property cannot be sold until resolved
   - **No automated liquidation** — this is a community, not a hedge fund

### Key Design Decisions

**Why not use Aave/Compound/Morpho?**
- Over-engineering. We don't need variable interest rates, liquidity pools, or flash loans.
- The treasury IS the lender. No need for a lending pool.
- Soulbound NFTs can't be liquidated in the traditional sense.
- Community loans need human governance for defaults, not automated liquidation.

**Why the reserve fund, not operating?**
- Operating covers day-to-day expenses. Reserve is for rainy days.
- Loans are an investment — the reserve earns interest.
- DAO controls max allocation (default 15% of reserve).

**Why lock the NFT transfer?**
- Prevents selling the property to avoid the loan.
- Standard practice in traditional HOA liens.
- Only the specific token is locked, not all tokens the owner holds.

---

## Smart Contract Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDuesLending {
    struct Loan {
        uint256 tokenId;           // Property NFT
        address borrower;          // Original borrower
        uint128 principal;         // Original loan amount (USDC)
        uint128 totalOwed;         // Principal + interest + fees
        uint128 totalPaid;         // Amount repaid so far
        uint128 installmentAmount; // Amount per installment
        uint48  startDate;         // Loan start timestamp
        uint48  nextDueDate;       // Next payment due
        uint8   installmentsTotal; // Total scheduled installments
        uint8   installmentsPaid;  // Installments completed
        uint8   missedPayments;    // Consecutive missed payments
        LoanStatus status;
    }

    enum LoanStatus { Active, Settled, Defaulting, Restructured }

    // ── Core Functions ──
    function requestLoan(uint256 tokenId, uint256 quarters, uint8 installments) external;
    function makePayment(uint256 loanId, uint256 amount) external;
    function payOffLoan(uint256 loanId) external;
    
    // ── Views ──
    function getLoan(uint256 loanId) external view returns (Loan memory);
    function getActiveLoan(uint256 tokenId) external view returns (uint256 loanId, Loan memory);
    function getPaymentSchedule(uint256 loanId) external view returns (uint128[] memory amounts, uint48[] memory dueDates);
    function getLoanPoolAvailable() external view returns (uint256);
    function canBorrow(uint256 tokenId) external view returns (bool eligible, string memory reason);
    
    // ── Governance ──
    function restructureLoan(uint256 loanId, uint8 newInstallments) external; // GOVERNOR_ROLE
    function writeOffLoan(uint256 loanId) external; // GOVERNOR_ROLE
    function setInterestRate(uint256 newBps) external; // GOVERNOR_ROLE
    function setMaxLoanPool(uint256 newBps) external; // GOVERNOR_ROLE
    
    // ── Events ──
    event LoanRequested(uint256 indexed loanId, uint256 indexed tokenId, address borrower, uint128 principal, uint8 installments);
    event LoanPayment(uint256 indexed loanId, address payer, uint128 amount, uint128 remaining);
    event LoanSettled(uint256 indexed loanId, uint128 totalPaid, uint128 interestEarned);
    event LoanDefaulting(uint256 indexed loanId, uint8 missedPayments);
    event LoanRestructured(uint256 indexed loanId, uint8 newInstallments);
    event LoanWrittenOff(uint256 indexed loanId, uint128 outstandingAmount);
}
```

---

## Frontend Integration

### New Page: `/loans`

**For borrowers:**
- "Need help with dues?" card on dashboard (only shown when dues are approaching or past due)
- Loan calculator: pick quarters + installments → see monthly amount, total cost, interest
- Active loan dashboard: payment schedule, next due date, pay button, progress bar
- Payment history

**For all members (transparency):**
- Community lending stats: total loans issued, active loans, default rate, interest earned
- Anonymized — no names, just aggregate data

**For governance:**
- Defaulting loans list (board only)
- Restructure/write-off actions via governance proposal

### Dashboard Integration

On the main dashboard, if a member is behind on dues:
```
┌────────────────────────────────────────────┐
│  Payment Reminder                          │
│  1 quarter outstanding · $200.00           │
│                                            │
│  [Settle Balance]  [Payment Plan →]        │
│                                            │
│  Split into 2-12 monthly payments          │
│  Starting from $18/mo at 5% APR            │
└────────────────────────────────────────────┘
```

---

## Integration Points

### PropertyNFT Changes
- Add `loanLock` mapping: `tokenId → bool`
- Modify `_update()` to check loan lock before allowing transfers
- Add `setLoanLock(tokenId, locked)` callable only by DuesLending contract

### FaircroftTreasury Changes
- Add `LENDING_ROLE` for the DuesLending contract
- Allow DuesLending to call `payDues()` on behalf of a borrower
- Add `withdrawFromReserve(amount)` for loan disbursement
- Add `depositToReserve(amount)` for repayment returns

### Governor Changes
- None — lending parameters are controlled via the same governance flow

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mass defaults during recession | Medium | High | Cap loan pool at 15% of reserve; governance can lower |
| Borrower abandons property | Low | Medium | Transfer lock = they can't sell. Lien survives. |
| Treasury shortfall from over-lending | Low | High | Hard cap on loan pool percentage |
| Smart contract bug | Low | Critical | Full test suite, audit before mainnet |
| Interest rate too high/low | Medium | Low | DAO can adjust via governance vote |

---

## Implementation Plan

### Phase 1: Smart Contract (Week 1)
- [ ] `DuesLending.sol` — core contract
- [ ] PropertyNFT loan lock integration
- [ ] Treasury role/function additions
- [ ] Full test suite (unit + integration)
- [ ] Deploy to Base Sepolia

### Phase 2: Frontend (Week 2)
- [ ] `/loans` page — calculator, application flow, active loan dashboard
- [ ] Dashboard "Payment Plan" CTA
- [ ] Loan payment flow (connect wallet → approve USDC → pay)
- [ ] Governance loan management (board view)

### Phase 3: Polish (Week 3)
- [ ] Email/notification reminders for upcoming payments
- [ ] Auto-pay option (USDC approval for recurring)
- [ ] Analytics dashboard for board
- [ ] Documentation for members

---

## Example Scenario

**Don at 456 Faircroft Dr owes $200 for Q2 2026.**

1. Don opens the dashboard, sees "Payment Reminder — 1 quarter outstanding"
2. Clicks "Payment Plan" → sees options:
   - 2 installments: $102.08/mo (total $204.17)
   - 4 installments: $51.28/mo (total $205.11)
   - 6 installments: $34.30/mo (total $205.82)
3. Picks 4 installments → confirms transaction
4. DuesLending pays his Q2 dues immediately — he's current
5. Over the next 4 months, Don pays ~$51 each month
6. Treasury earns $5.11 in interest on reserve funds
7. Everyone's happy — Don stayed current, HOA got paid, reserve grew

---

*"A luxury community doesn't send threatening letters. It offers a concierge solution."*
