# Privacy Policy

**SuvrenHOA — Blockchain HOA Governance Platform**  
**Operated by EliteDevs** | North Carolina, USA  
**Effective Date:** April 4, 2026  
**Last Updated:** April 4, 2026

---

## Overview

SuvrenHOA is a blockchain-powered homeowner association governance platform. We built it on a core belief: **transparency is a feature, not a liability.** This means your community's governance records — votes, proposals, dues payments, and documents — are intentionally designed to be permanent, publicly verifiable, and tamper-proof.

This Privacy Policy explains what data we collect, how we use it, what we share, and — critically — what is and isn't possible to delete. We ask that you read it carefully, especially the sections on blockchain and Arweave data permanence, before using the platform.

**We do not collect:** emails, passwords, Social Security numbers, financial account numbers, or real estate deed records.

**We use wallet-based authentication only.** There is no username/password system.

---

## Table of Contents

1. [Information We Collect](#1-information-we-collect)
2. [How We Use Your Information](#2-how-we-use-your-information)
3. [Blockchain Data — Public and Permanent](#3-blockchain-data--public-and-permanent)
4. [Arweave Document Storage — Permanent by Design](#4-arweave-document-storage--permanent-by-design)
5. [Data Sharing and Third Parties](#5-data-sharing-and-third-parties)
6. [Data Retention and Deletion](#6-data-retention-and-deletion)
7. [Your Rights](#7-your-rights)
8. [Children's Privacy](#8-childrens-privacy)
9. [Security](#9-security)
10. [California Privacy Rights (CCPA)](#10-california-privacy-rights-ccpa)
11. [International Users](#11-international-users)
12. [Changes to This Policy](#12-changes-to-this-policy)
13. [Contact Us](#13-contact-us)

---

## 1. Information We Collect

We collect two categories of information: **on-chain data** (recorded on the Base blockchain) and **off-chain data** (stored in our database and platform systems).

### 1.1 On-Chain Data (Base Blockchain)

When you use SuvrenHOA, certain actions are recorded directly on the Base blockchain — an Ethereum Layer 2 network. This data is **public, permanent, and beyond our control to delete or modify.** This is by design.

| Data Type | What It Is |
|-----------|------------|
| **Wallet Address** | Your Ethereum wallet address (e.g., `0x...`), used as your identity on the platform |
| **Property NFT Token ID** | The unique identifier of your soulbound Property NFT, representing your HOA membership |
| **NFT Ownership Record** | The association between your wallet address and your property NFT |
| **Voting Records** | How you voted on each governance proposal (For, Against, or Abstain) |
| **Delegation Records** | Who you've delegated your voting power to (if anyone) |
| **Dues Payment Records** | Timestamps and amounts of dues payments made through the Treasury contract |
| **Proposal Records** | If you submitted a governance proposal, the on-chain record of that submission |
| **Document Registry Hashes** | Cryptographic hashes of community documents uploaded to Arweave |

### 1.2 Off-Chain Data (Platform Database)

We also collect certain data in our database infrastructure (Supabase, hosted in the United States):

| Data Type | What It Is | Required? |
|-----------|------------|-----------|
| **Wallet Address** | Stored off-chain as well, to link your account to platform features | Yes |
| **Community Forum Posts** | Posts and replies you make in community discussion forums | Only if you post |
| **Voluntary Profile Information** | Your name, lot number, and contact preferences, if you choose to provide them | Optional |
| **Platform Usage Analytics** | Minimal, anonymized data about how pages are used — no personal identifiers | Automatic |

### 1.3 What We Don't Collect

We do **not** collect or store:

- Email addresses or phone numbers (unless you voluntarily add one to your profile as a contact preference)
- Passwords of any kind
- Social Security numbers or government IDs
- Bank account or credit card information
- Real estate deeds or property title documents
- Your physical location beyond what you voluntarily disclose

---

## 2. How We Use Your Information

We use the information we collect to:

**Provide the platform:**
- Authenticate you via your wallet address
- Display your property NFT, voting history, and dues status
- Enable governance participation (proposal submission, voting, delegation)
- Process treasury functions (dues collection via USDC smart contracts)
- Serve community documents from the Document Registry

**Improve the platform:**
- Analyze anonymized usage patterns to improve features and UX
- Diagnose technical issues and maintain uptime

**Communicate community information:**
- If you provide contact preferences, notify you of governance proposals, voting windows, or community announcements through your chosen method

**Legal and compliance:**
- Comply with applicable laws and respond to valid legal requests
- Enforce our Terms of Service

We do **not** sell your personal information. We do not use your information for advertising or behavioral targeting.

---

## 3. Blockchain Data — Public and Permanent

> **⚠️ Important: Read this section carefully before using the platform.**

SuvrenHOA's core governance functions operate on the **Base blockchain**, a public Ethereum Layer 2 network. This means:

### 3.1 Your On-Chain Activity Is Public

Every transaction you make through SuvrenHOA — every vote, dues payment, proposal submission, and delegation change — is recorded as a public transaction on Base. **Anyone in the world** can view this data using a block explorer like [Basescan](https://basescan.org) by looking up your wallet address.

This is intentional. SuvrenHOA was built on the principle that HOA governance should be transparent and verifiable. Your community's voting records and treasury transactions are available for all homeowners to inspect and verify — that's what makes the system trustworthy.

### 3.2 Blockchain Data Cannot Be Deleted

Once data is recorded on the blockchain, **it cannot be removed, modified, or erased** — not by you, not by us, not by anyone. This is a fundamental property of blockchain technology, not a policy choice.

This includes:
- Your wallet address and its transaction history
- Your voting records
- Your dues payment history
- Your property NFT ownership record

**Before connecting your wallet and participating in on-chain governance, understand that your activity will be permanently and publicly associated with your wallet address.**

### 3.3 Pseudonymity, Not Anonymity

Your wallet address is pseudonymous — it doesn't inherently reveal your legal name or physical identity. However, if you voluntarily connect your real name or property lot number to your wallet through platform profile features, or if your wallet address is otherwise linked to your identity through external means, your on-chain activity could be traced back to you.

If privacy is important to you, consider the implications of which wallet address you use to participate.

---

## 4. Arweave Document Storage — Permanent by Design

> **⚠️ Important: Documents uploaded to Arweave cannot be deleted.**

SuvrenHOA uses **Arweave** — a decentralized, permanent storage network — to store community documents such as meeting minutes, budgets, CC&Rs, and official notices. Documents uploaded to Arweave are:

- **Permanently stored** on a decentralized network
- **Publicly accessible** via their unique Arweave transaction ID
- **Cryptographically verified** — their hash is recorded in the on-chain Document Registry

### 4.1 Why We Use Arweave

This is a feature, not a limitation. Traditional HOAs can lose, modify, or suppress records. With Arweave, every community document is permanently preserved and independently verifiable. Homeowners can trust that a document they saw in 2026 hasn't been altered by 2030.

### 4.2 Implications for Document Uploaders

If you have administrative rights and upload a document containing personal information (e.g., a meeting minutes document that names specific homeowners), that information will be permanently stored on Arweave.

**Only authorized administrators** (community managers with the appropriate on-chain role) have document upload permissions. Homeowners without admin roles cannot upload documents.

We recommend that administrators avoid including unnecessary personal information in documents uploaded to the platform, as those documents cannot be retracted.

---

## 5. Data Sharing and Third Parties

We share information with a limited set of third parties necessary to operate the platform. We do not sell data to any party.

### 5.1 Infrastructure Providers

| Provider | What They Access | Purpose |
|----------|-----------------|---------|
| **Supabase** | Off-chain database (forum posts, profiles) | Database hosting (US-based) |
| **RainbowKit** | Wallet connection interface | Enables multi-wallet support (MetaMask, WalletConnect, Coinbase Wallet, etc.) |
| **Alchemy / Infura** | Public blockchain data (RPC calls) | Blockchain node access — reads/writes transactions to Base |
| **Arweave** | Uploaded documents | Permanent document storage network |

### 5.2 Blockchain Networks

By design, any data written to the Base blockchain is shared with the entire Base network. This includes blockchain validators, node operators, and any member of the public.

### 5.3 Legal Disclosures

We may disclose information if required by law, court order, or government authority, or to protect the rights, property, or safety of EliteDevs, our users, or others. To the extent legally permitted, we will notify affected users before disclosing.

### 5.4 Business Transfers

If EliteDevs is acquired, merged, or undergoes a similar transaction, your data may be transferred as part of that transaction. We will notify users of any such change and your rights with respect to that data.

---

## 6. Data Retention and Deletion

We distinguish between data we control and data we do not.

### 6.1 Data We CAN Delete or Modify (Off-Chain)

| Data | Retention | Your Control |
|------|-----------|--------------|
| Voluntary profile information (name, lot number, contact prefs) | Until you delete it or your account is terminated | You can update or delete this in your profile settings |
| Community forum posts | Until you delete them or the community is terminated | You can delete your own posts |
| Platform analytics | Anonymized — retained up to 24 months then purged | Not linked to your identity |

### 6.2 Data We CANNOT Delete (On-Chain and Arweave)

| Data | Why It Cannot Be Deleted |
|------|--------------------------|
| Blockchain transactions (votes, payments, proposals) | Immutable by blockchain design — no entity can alter the Base chain |
| Property NFT records | On-chain smart contract state |
| Arweave documents | Permanent decentralized storage — no delete function exists |
| Document Registry hashes | On-chain, immutable |

**This is not a limitation unique to SuvrenHOA** — it is a property of all blockchain and Arweave-based systems. If you submit a deletion request for on-chain data, we will explain this limitation honestly and cannot fulfill that portion of the request.

### 6.3 Account Termination

If your account is closed (e.g., you sell your property and your NFT is transferred), your off-chain profile data will be deleted within 30 days. Your on-chain history will remain permanently on the blockchain.

---

## 7. Your Rights

### 7.1 Access

You can view all of your on-chain activity directly through any Base block explorer (e.g., [Basescan](https://basescan.org)) using your wallet address. Your off-chain profile data is visible in your platform account settings. You may request a summary of any off-chain data we hold about you by contacting us.

### 7.2 Correction

You can update your voluntary profile information (name, contact preferences, lot number) at any time in your account settings.

On-chain data (votes, payments, NFT ownership) cannot be corrected — the blockchain record is authoritative.

### 7.3 Deletion

You may request deletion of your off-chain profile data at any time. We will process deletion requests within 30 days.

On-chain data and Arweave documents cannot be deleted. See [Section 6.2](#62-data-we-cannot-delete-on-chain-and-arweave) for full details.

### 7.4 Portability

You may request an export of your off-chain profile data and forum posts in a machine-readable format. Your on-chain data is already publicly accessible and portable by nature.

### 7.5 Objection and Restriction

To the extent applicable law permits, you may object to certain processing of your off-chain data. Contact us to discuss your specific situation.

---

## 8. Children's Privacy

SuvrenHOA is intended for property owners and HOA members, which requires entering into a legal property ownership relationship. **The platform is not directed to children under 13 years old**, and we do not knowingly collect personal information from anyone under 13.

If you believe a child under 13 has used the platform, please contact us and we will take appropriate steps to remove their off-chain data and revoke any access.

---

## 9. Security

We take reasonable technical and organizational measures to protect your off-chain data:

- **Database security:** Supabase is hosted in the United States with industry-standard encryption at rest and in transit (TLS 1.3)
- **Wallet-based authentication:** No passwords means no password breaches. Authentication is cryptographic — only the holder of your wallet's private key can authenticate
- **Smart contract security:** Our governance contracts are built on OpenZeppelin's battle-tested contract libraries
- **Access controls:** Administrative functions on the platform are gated by on-chain roles — you cannot assume admin functions without the appropriate NFT role assignment
- **No sensitive PII stored:** We deliberately avoid collecting sensitive personal information to minimize breach risk

**Important:** The security of your wallet is your responsibility. Your private key is not shared with or accessible to SuvrenHOA. If your wallet is compromised, we cannot recover or protect your on-chain assets. Use a hardware wallet and seed phrase best practices.

No system is 100% secure. In the event of a data breach affecting your off-chain data, we will notify affected users as required by applicable law.

---

## 10. California Privacy Rights (CCPA)

This section applies to residents of California and supplements the rest of this Privacy Policy.

### 10.1 Categories of Personal Information Collected

Under the California Consumer Privacy Act (CCPA), we collect the following categories of personal information:

| CCPA Category | Examples from SuvrenHOA | Sold? |
|---------------|------------------------|-------|
| Identifiers | Wallet address, voluntary name | **No** |
| Internet or network activity | Platform usage analytics | **No** |
| Geolocation data | Not collected | N/A |
| Professional/employment information | Not collected | N/A |
| Financial information | On-chain USDC payment records (public blockchain) | **No** |

We do **not** sell personal information. We do not share personal information for cross-context behavioral advertising.

### 10.2 Your California Rights

California residents have the following rights under CCPA:

**Right to Know:** You have the right to know what personal information we collect, use, disclose, and sell. This Privacy Policy fulfills that disclosure.

**Right to Delete:** You have the right to request deletion of personal information we hold about you, subject to certain exceptions. As noted throughout this policy, we cannot delete on-chain or Arweave data — this is a recognized exception under CCPA for data maintained for legal, compliance, or technically infeasible deletion scenarios.

**Right to Opt-Out of Sale:** We do not sell personal information. No opt-out is necessary.

**Right to Non-Discrimination:** We will not discriminate against you for exercising your CCPA rights. Exercising your rights will not result in denial of services, different pricing, or reduced service quality.

**Right to Correct:** You have the right to correct inaccurate personal information we maintain about you in our off-chain database.

### 10.3 How to Submit a California Rights Request

To submit a request, contact us at the information in [Section 13](#13-contact-us). We will respond within **45 days** of receiving a verifiable request. We may request additional information to verify your identity before processing your request.

---

## 11. International Users

SuvrenHOA is operated by EliteDevs, a company based in North Carolina, United States. Our database infrastructure is hosted in the United States.

If you are accessing the platform from outside the United States — including from the European Economic Area (EEA), United Kingdom, Canada, or elsewhere — your data will be processed in the United States, which may have different data protection laws than your home country.

By using the platform, you consent to the transfer and processing of your information in the United States.

**For users in the EEA/UK:** We note that our platform is primarily designed for U.S.-based homeowner associations. If applicable data protection laws in your jurisdiction provide specific rights, please contact us to discuss. Where legally required, we will honor those rights to the extent technically feasible (noting that on-chain data cannot be deleted regardless of jurisdiction).

---

## 12. Changes to This Policy

We may update this Privacy Policy from time to time. When we make material changes, we will:

1. Update the **Last Updated** date at the top of this policy
2. Post the updated policy on the platform
3. If you have provided contact information and the changes materially affect your rights, attempt to notify you through your preferred contact method

**Governance note:** This Privacy Policy governs our off-chain data practices. The immutability and public nature of on-chain data is not a "policy" — it is a permanent technical property of blockchain architecture that cannot be changed by any policy update.

Your continued use of the platform after any changes to this policy constitutes acceptance of the updated terms. If you disagree with an updated policy, your remedy is to discontinue use of the platform.

---

## 13. Contact Us

For privacy-related questions, data requests, or concerns:

**EliteDevs**  
North Carolina, USA

**Privacy requests:** Submit via the platform's support system, or contact us directly.

For California CCPA requests, please indicate "CCPA Request" in your subject line. We respond to verifiable requests within 45 days.

For general privacy questions, we aim to respond within 10 business days.

---

## Appendix: Glossary

| Term | Definition |
|------|-----------|
| **Base** | An Ethereum Layer 2 blockchain network. Public, decentralized. |
| **Wallet address** | Your Ethereum public address (e.g., `0x...`). Acts as your platform identity. |
| **Soulbound NFT** | A non-transferable NFT representing your HOA property membership. Cannot be sold or transferred without explicit admin approval. |
| **Arweave** | A decentralized, permanent storage network. Files uploaded cannot be deleted. |
| **Supabase** | Our off-chain database provider, hosted in the United States. |
| **RainbowKit** | A wallet connection library supporting MetaMask, WalletConnect, Coinbase Wallet, and others. |
| **Alchemy / Infura** | Blockchain RPC node providers — they relay your transactions to the Base network. |
| **CCPA** | California Consumer Privacy Act — California's consumer data privacy law. |

---

*This Privacy Policy was last updated April 4, 2026. Questions? Contact EliteDevs through the platform's support system.*
