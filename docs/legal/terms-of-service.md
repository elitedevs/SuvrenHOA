# SuvrenHOA Terms of Service

**Effective Date:** April 4, 2026  
**Last Updated:** April 4, 2026  
**Version:** 1.0

---

> **Plain English Summary:** SuvrenHOA is a blockchain-powered HOA governance platform. By using it, you agree to these terms. Because we use blockchain technology, some things work differently than traditional software — transactions are permanent, your wallet is your password, and certain records can't be deleted. Read the sections on wallet security and blockchain irreversibility carefully.

---

## 1. Acceptance of Terms

By connecting a cryptocurrency wallet to SuvrenHOA (the "Platform") or using any feature of the Platform, you ("User," "you") agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you don't agree, don't use the Platform.

These Terms form a legally binding agreement between you and **EliteDevs LLC** ("EliteDevs," "we," "us," "our"), the company operating SuvrenHOA. If you're accessing the Platform on behalf of an HOA community or organization, you represent that you have authority to bind that organization to these Terms.

**By accessing the Platform, you confirm that you:**
- Are at least 18 years old
- Have the legal right to use any wallet you connect
- Are not prohibited from using the Platform under applicable law
- Understand that blockchain transactions carry unique risks described in these Terms

---

## 2. Description of Service

SuvrenHOA is a software-as-a-service (SaaS) platform that provides blockchain-based governance infrastructure for homeowner associations (HOAs). The Platform enables HOA communities to:

- **Manage membership** through soulbound Property NFTs linked to residential lots
- **Conduct governance** via on-chain proposals and voting (four-tier system: Routine, Financial, Governance, and Constitutional)
- **Manage treasury** through automated USDC dues collection with smart contract-enforced fund allocation
- **Store and verify documents** through an immutable registry backed by Arweave permanent storage
- **Track community health** through algorithmic scoring of governance participation, dues collection, and treasury health
- **Communicate** through community posts, announcements, and profile pages

The Platform is built on **Base**, an Ethereum Layer 2 network. Core governance and treasury operations are executed by smart contracts deployed on-chain. EliteDevs provides the frontend interface and off-chain services (database, notifications, community features) but does not control the smart contracts once deployed.

### 2.1 Who Uses SuvrenHOA

The Platform serves two types of users:

- **Board Members:** HOA board members who administer communities, manage proposals, and oversee governance
- **Residents:** Homeowners who participate in voting, pay dues, access documents, and engage in community features

Access to features depends on your role within a given community and the governance decisions of that community.

### 2.2 Current Status

SuvrenHOA is currently deployed on **Base Sepolia testnet** and transitioning to **Base mainnet**. Some features may be in beta. We'll notify communities before mainnet deployment and any significant changes.

---

## 3. Wallet-Based Authentication

### 3.1 Your Wallet Is Your Account

SuvrenHOA does not use usernames or passwords. **Your cryptocurrency wallet (MetaMask, WalletConnect, or any RainbowKit-compatible wallet) is your only authentication method.** Your wallet address serves as your account identifier.

### 3.2 You Are Responsible for Your Wallet

**This is important. Read carefully.**

- **You are solely responsible** for securing your wallet, private keys, seed phrases, and any hardware wallets
- EliteDevs **cannot** recover your account, reset your access, or reverse transactions if you lose access to your wallet
- If your wallet is compromised, stolen, or lost, we **cannot** help you regain access to your account or undo any transactions made from that wallet
- **Never share your private keys or seed phrase with anyone — including anyone claiming to be from SuvrenHOA.** We will never ask for them.

### 3.3 Unauthorized Access

If you believe your wallet has been compromised, immediately:
1. Transfer your assets to a new secure wallet if possible
2. Contact your HOA board to update your Property NFT assignment
3. Notify us at support@suvren.co

We may be able to assist your HOA community in governance procedures to address compromised wallets, but we cannot unilaterally act on your behalf on-chain.

### 3.4 Wallet Connection

By connecting your wallet, you authorize the Platform to:
- Read your wallet address and on-chain balances
- Request transaction signatures for operations you initiate (voting, dues payments, document submissions)
- Display your on-chain activity within the Platform

We will **never** initiate transactions without your explicit signature approval.

---

## 4. Blockchain Transactions Are Irreversible

**Once submitted to the blockchain, transactions cannot be undone.** This includes:

- Votes cast on governance proposals
- USDC dues payments to the treasury
- Document registrations on-chain
- Property NFT assignments and transfers

EliteDevs **cannot** reverse, modify, or cancel any transaction that has been confirmed on Base. Before signing any transaction in your wallet, carefully review what you're approving. If you sign a transaction by mistake, we cannot help you undo it.

### 4.1 Gas Fees

Blockchain transactions require small fees ("gas fees") paid in ETH on Base. Gas fees are paid to the Base network, not to EliteDevs, and are non-refundable regardless of the transaction outcome. SuvrenHOA's design on Base L2 keeps gas fees very low (typically fractions of a cent), but you are responsible for having sufficient ETH in your wallet to cover them.

### 4.2 Network Risks

Blockchain networks can experience congestion, outages, or forks outside our control. We are not responsible for delays, failed transactions, or losses caused by network conditions.

---

## 5. Property NFTs

### 5.1 What Property NFTs Are

Each residential lot in a SuvrenHOA community is represented by a **Property NFT** — a unique digital token on Base that serves as both your proof of HOA membership and your governance voting credential. Your Property NFT represents:

- Membership in your HOA community
- One vote in governance proposals (one lot = one vote)
- Association with your specific lot number and property metadata

### 5.2 Soulbound: Non-Transferable

Property NFTs are **soulbound** — they are intentionally non-transferable under normal circumstances. You cannot sell, gift, or transfer your Property NFT to another wallet without explicit governance approval.

**This is by design.** Soulbound tokens prevent:
- Accumulation of voting power by a single actor
- Sale of governance rights separate from actual property ownership
- Manipulation of community governance through token trading

### 5.3 When Transfers Are Allowed

Property NFT transfers are permitted only when:
- Authorized by your HOA community's governance (typically when a property changes ownership)
- Approved by a wallet holding the `TRANSFER_APPROVER_ROLE` in the smart contract (typically your HOA board administrator)

If you sell your home, your HOA board will initiate the NFT transfer process through governance. You **cannot** transfer the NFT yourself.

### 5.4 Property Metadata

On-chain property metadata (lot number, address, etc.) is recorded in the smart contract and is publicly visible on the blockchain. Updates to metadata require board authorization and are permanently recorded.

### 5.5 NFTs Are Not Financial Instruments

Your Property NFT is a governance and membership credential, not an investment or financial instrument. It has no monetary value independent of your HOA membership and should not be treated as such.

---

## 6. Voting and Governance

### 6.1 On-Chain Voting

All governance votes are recorded permanently on the Base blockchain. **Your vote, once cast, is final and immutable.** You cannot change or retract a vote after it is submitted.

### 6.2 Voting Power

Each Property NFT represents one vote. You can delegate your voting power to another wallet address (a neighbor, delegate, or yourself). Delegation is:
- Recorded on-chain
- Revocable at any time
- Non-custodial (your delegate cannot transfer your NFT)

### 6.3 Proposal Tiers

SuvrenHOA uses a four-tier proposal system with different requirements based on the significance of the decision:

| Tier | Type | Examples |
|------|------|---------|
| 1 | Routine | Vendor approvals, minor repairs, scheduling |
| 2 | Financial | Budget approvals, dues changes, reserve expenditures |
| 3 | Governance | Rule changes, committee creation, policy updates |
| 4 | Constitutional | CC&R amendments, contract upgrades, foundational changes |

Each tier has specific quorum and approval thresholds enforced by the smart contract. See the Governance Whitepaper for full details.

### 6.4 Governance Results Are Final

Proposals that pass through the on-chain governance process are executed by smart contracts. EliteDevs **cannot** override, block, or reverse governance decisions once they have been executed on-chain. The smart contract is the authority — not EliteDevs, and not any individual board member.

### 6.5 Timelock

All passed proposals are subject to a timelock delay before execution (configurable by your community's governance). This delay gives community members time to review passed proposals before they take effect.

### 6.6 Your Responsibility

You are responsible for:
- Reviewing proposals before voting
- Understanding the implications of your vote
- Participating in your community's governance process

EliteDevs does not provide legal, financial, or governance advice. Consult appropriate professionals for guidance on specific HOA matters.

---

## 7. Treasury and Dues Payments

### 7.1 How the Treasury Works

SuvrenHOA's treasury is managed by the `FaircroftTreasury` smart contract. Dues are paid in **USDC** (a regulated USD stablecoin) directly to the contract. The contract automatically allocates incoming payments:

- **80%** to the Operating Fund (day-to-day expenses)
- **20%** to the Reserve Fund (capital improvements and major repairs)

This split happens automatically at the smart contract level — no human intermediary touches your payment.

### 7.2 Multi-Sig Protection

Treasury expenditures above community-defined thresholds require multi-signature authorization from board members, in addition to governance approval. This prevents any single person from accessing funds unilaterally.

### 7.3 USDC and Stablecoin Risk

SuvrenHOA uses USDC issued by Circle. While USDC is designed to maintain a 1:1 peg with the US Dollar, EliteDevs makes no guarantees regarding the stability, availability, or regulatory status of USDC or any other stablecoin. You accept any risks associated with stablecoin usage.

### 7.4 Dues Payments Are Final

Once a dues payment is confirmed on-chain, it **cannot be reversed or refunded** by EliteDevs. Disputes about payment amounts, credits, or adjustments must be resolved through your HOA's governance process.

### 7.5 Payment Responsibilities

- You are responsible for paying dues on time per your community's schedule
- Late fees and penalties are determined by your community's governance, not by EliteDevs
- EliteDevs does not collect, hold, or have access to HOA treasury funds at any time

---

## 8. Document Storage

### 8.1 Arweave Permanent Storage

HOA documents (CC&Rs, bylaws, meeting minutes, financial reports, etc.) submitted to SuvrenHOA are stored on **Arweave**, a decentralized permanent storage network. Once uploaded to Arweave, documents **cannot be deleted, modified, or removed** — by anyone, including EliteDevs.

### 8.2 Think Before You Submit

**Before submitting any document:**
- Verify it is accurate and final
- Confirm it does not contain sensitive personal information that shouldn't be permanently public
- Understand that it will be publicly accessible and permanent

EliteDevs is not responsible for documents submitted by community administrators or users.

### 8.3 On-Chain Document Registry

A cryptographic hash of each document is registered in the `DocumentRegistry` smart contract on Base, creating a tamper-evident record. Anyone can verify that a document matches the registered version by comparing hashes. This record is also permanent and cannot be removed from the blockchain.

### 8.4 Document Responsibility

The HOA community (specifically, authorized administrators) is responsible for ensuring that submitted documents are accurate, legally compliant, and appropriate for permanent public storage. EliteDevs does not review, validate, or endorse the content of submitted documents.

---

## 9. User Content

### 9.1 Community Posts and Profiles

SuvrenHOA includes community features such as discussion posts, announcements, and profile pages (name, lot number, display preferences). This content ("User Content") is stored in EliteDevs' off-chain database (Supabase) and is subject to our control.

### 9.2 Your License to Us

By posting content on SuvrenHOA, you grant EliteDevs a non-exclusive, royalty-free license to store, display, and distribute that content to other members of your community through the Platform. We do not claim ownership of your content.

### 9.3 Content Standards

You agree not to post content that:
- Is defamatory, harassing, or threatening toward other community members
- Violates any applicable law
- Infringes on the intellectual property rights of others
- Contains malware, spam, or malicious code
- Impersonates another person

### 9.4 Content Removal

Unlike blockchain records, off-chain community posts and profile information **can** be removed or modified. You may edit or delete your own posts. EliteDevs reserves the right to remove content that violates these Terms or that we reasonably believe is harmful.

### 9.5 No Off-Chain Content Responsibility

EliteDevs does not monitor all community content and is not responsible for content posted by other users. If you encounter content that violates these Terms, please report it to support@suvren.co.

---

## 10. Subscription and Payment Terms

### 10.1 Community Subscription Model

SuvrenHOA operates on a community-level subscription — **the HOA community** (typically managed by the board) pays a monthly subscription fee to EliteDevs for access to the Platform. Individual homeowners do not pay subscription fees to EliteDevs.

Individual homeowners pay HOA dues to their community's smart contract treasury — those payments go to the HOA, not to EliteDevs.

### 10.2 Subscription Fees

Subscription fees are based on the pricing plan selected by the community administrator at the time of account setup. Current pricing is available at our website or upon request. EliteDevs reserves the right to change pricing with **30 days' notice** to community administrators.

### 10.3 Billing

Subscriptions are billed monthly (or annually if selected). Payment is due in advance. We use third-party payment processors for subscription billing. By providing payment information, you authorize us to charge the applicable fees.

### 10.4 Refunds

Subscription fees are generally non-refundable. If you believe you were charged in error, contact us within 30 days at billing@suvren.co.

### 10.5 Suspension for Non-Payment

If a community's subscription lapses, EliteDevs may suspend access to the frontend platform and off-chain features. **Smart contracts on Base will continue to function independently** — governance, treasury, and document registry operations are not dependent on an active EliteDevs subscription.

### 10.6 Taxes

You are responsible for any taxes applicable to your use of the Platform.

---

## 11. Intellectual Property

### 11.1 Our Intellectual Property

EliteDevs owns the Platform's frontend application, user interface, design, branding, and off-chain software. "SuvrenHOA," the SuvrenHOA logo, and related marks are trademarks of EliteDevs. You may not use them without written permission.

A provisional patent application has been filed covering aspects of SuvrenHOA's blockchain HOA governance system, including the soulbound Property NFT system, tiered governance model, automated treasury allocation, immutable document registry, and community health scoring algorithm.

### 11.2 Open Source Components

SuvrenHOA uses open-source software components including OpenZeppelin smart contract libraries (MIT License), wagmi, viem, and RainbowKit. These components remain subject to their respective licenses.

### 11.3 Smart Contracts

The smart contracts deployed on Base are not proprietary software once deployed — they exist as public code on the blockchain. However, EliteDevs retains intellectual property rights in the smart contract source code, design, and documentation.

### 11.4 Your Content

You retain ownership of content you post to the Platform. You grant us only the limited license described in Section 9.

---

## 12. Limitation of Liability

**READ THIS SECTION CAREFULLY. IT LIMITS WHAT YOU CAN RECOVER FROM US.**

### 12.1 No Warranties

THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. ELITEDEVS DOES NOT WARRANT THAT THE PLATFORM WILL BE ERROR-FREE, UNINTERRUPTED, OR SECURE. WE MAKE NO WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY INFORMATION ON THE PLATFORM.

### 12.2 Blockchain Risks

ELITEDEVS IS NOT RESPONSIBLE FOR:
- Losses due to blockchain network failures, forks, or outages
- Smart contract bugs or vulnerabilities (though we take reasonable steps to prevent them)
- Losses from compromised wallets or lost private keys
- Regulatory actions affecting blockchain technology or stablecoins
- USDC depegging or stablecoin failures
- The actions of other users or HOA community members

### 12.3 Cap on Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, ELITEDEVS' TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID TO ELITEDEVS IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) $100.

### 12.4 Exclusion of Damages

ELITEDEVS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST DATA, OR LOSS OF GOODWILL, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

### 12.5 Jurisdictional Limits

Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability for consequential damages. In such jurisdictions, our liability is limited to the fullest extent permitted by law.

---

## 13. Dispute Resolution

### 13.1 Informal Resolution First

Before filing any formal legal claim, you agree to contact us at legal@suvren.co and give us 30 days to attempt to resolve the dispute informally. Most issues can be resolved this way.

### 13.2 Binding Arbitration

If informal resolution fails, **disputes between you and EliteDevs will be resolved by binding arbitration** — not in court (with limited exceptions below). Arbitration is less formal than a lawsuit, uses a neutral arbitrator instead of a judge, and is typically faster and less expensive.

Arbitration will be conducted by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. Arbitration may be conducted remotely. The arbitrator's decision is binding and final.

### 13.3 Exceptions to Arbitration

Either party may pursue claims in small claims court. Either party may seek emergency injunctive relief from a court to prevent irreparable harm while arbitration is pending.

### 13.4 No Class Actions

**YOU WAIVE YOUR RIGHT TO PARTICIPATE IN CLASS ACTIONS.** All disputes must be brought individually. You may not bring claims as a class representative or class member.

### 13.5 Governing Law

These Terms are governed by the laws of the State of Delaware (or the state where EliteDevs LLC is formed), without regard to conflict of law principles.

### 13.6 HOA Governance Disputes

Disputes about HOA governance decisions (proposal outcomes, treasury expenditures, etc.) are not disputes with EliteDevs — they are community governance matters. Such disputes should be addressed through your community's governance process or applicable HOA law. EliteDevs is not a party to internal HOA governance disputes.

---

## 14. Privacy

Your privacy matters to us. Our **Privacy Policy** (available at suvren.co/privacy) describes how we collect, use, and protect your information.

**Key privacy points specific to blockchain technology:**
- Your wallet address and all on-chain transactions are publicly visible on Base
- Documents registered on-chain and stored on Arweave are permanently public
- Voting records on the blockchain are public and permanent
- We cannot delete blockchain data on your behalf

Off-chain data (community posts, profile information, notification settings) is handled per our Privacy Policy and can be modified or deleted as described therein.

---

## 15. Modifications to These Terms

EliteDevs may update these Terms from time to time. When we make material changes, we will:
- Post the updated Terms at suvren.co/terms
- Update the "Last Updated" date at the top of this document
- Notify community administrators via email or in-platform notification at least **14 days** before changes take effect

If you continue to use the Platform after changes take effect, you accept the updated Terms. If you don't agree with changes, you may discontinue use of the Platform.

For changes required by law or to address security issues, we may implement them immediately with shorter notice.

---

## 16. Termination

### 16.1 You Can Leave Anytime

You may stop using the Platform at any time. Community administrators can cancel their subscription by contacting billing@suvren.co. Cancellation takes effect at the end of the current billing period.

### 16.2 We May Terminate for Cause

EliteDevs may suspend or terminate your access to the Platform if:
- You violate these Terms
- Your use of the Platform poses a security risk
- You engage in fraudulent or illegal activity
- Payment obligations are not met (for community subscriptions)

We will give reasonable notice before termination except in cases of serious violations or emergencies.

### 16.3 Effect of Termination

When access is terminated:
- You lose access to the SuvrenHOA frontend and off-chain features
- **Smart contracts on Base continue to function independently** — on-chain governance, treasury, and document registry are not controlled by EliteDevs and remain operational
- Blockchain records (votes, transactions, documents) are permanent and unaffected by termination
- Off-chain community data (posts, profiles) may be retained per our Privacy Policy or deleted upon request

### 16.4 Survival

Sections that should logically survive termination do — including Sections 4 (Blockchain Irreversibility), 11 (IP), 12 (Limitation of Liability), 13 (Dispute Resolution), and 14 (Privacy).

---

## 17. General Provisions

### 17.1 Entire Agreement

These Terms, together with our Privacy Policy, constitute the entire agreement between you and EliteDevs regarding the Platform and supersede any prior agreements.

### 17.2 Severability

If any provision of these Terms is found unenforceable, the remaining provisions continue in full force.

### 17.3 No Waiver

Our failure to enforce any provision doesn't waive our right to enforce it later.

### 17.4 Assignment

EliteDevs may assign these Terms in connection with a merger, acquisition, or sale of assets. You may not assign your rights under these Terms without our written consent.

### 17.5 Force Majeure

We're not liable for failures or delays caused by circumstances outside our reasonable control — including blockchain network failures, natural disasters, or regulatory actions.

---

## 18. Contact Information

**EliteDevs LLC**  
Operating SuvrenHOA

- **General Support:** support@suvren.co  
- **Billing:** billing@suvren.co  
- **Legal:** legal@suvren.co  
- **Website:** suvren.co  

For urgent security issues, please email legal@suvren.co with "SECURITY" in the subject line.

---

*SuvrenHOA — Transparent Governance for Modern Communities*

*These Terms of Service were last updated on April 4, 2026. By using SuvrenHOA, you acknowledge that you have read, understood, and agree to be bound by these Terms.*
