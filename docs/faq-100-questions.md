# SuvrenHOA — 100 Frequently Asked Questions

> **Last updated:** March 2026  
> SuvrenHOA is blockchain-powered HOA governance built on Base (an Ethereum Layer 2 network). It uses soulbound NFTs to represent property ownership, a 4-tier voting system, a smart contract treasury, permanent document storage on Arweave, and USDC for dues payments — all while staying compliant with NCGS Chapter 47F (North Carolina's Planned Community Act). Transaction fees are typically less than $0.01.

---

## 🔐 Trust & Security

**1. Who controls the smart contracts?**

No single person does — that's the whole point. The smart contracts that run SuvrenHOA are deployed on the Base blockchain, and once deployed, they execute exactly as written without anyone being able to override them secretly. The board can interact with them only within the rules baked into the code, like submitting proposals or executing approved treasury payments. Any change to the rules requires a homeowner vote, not a board decision. Think of it like bylaws that enforce themselves.

**2. If I lose wallet access, do I lose everything?**

Losing your wallet is serious, but it's not the end of the world — we built recovery into the system. Your property NFT is tied to your wallet address, but the HOA can verify your identity and work with you through an on-chain recovery process if you lose access. The most important thing you can do right now is back up your seed phrase (the 12 or 24 words MetaMask gave you when you set up your wallet) somewhere safe and offline — a piece of paper in a fireproof box works great. Never store it in a photo, text message, or email. If you're ever worried, contact the board before disaster strikes so we can document your ownership separately.

**3. What if someone hacks the contracts?**

Blockchain smart contracts can't be "hacked" the same way a website or database can — there's no server to break into. The code lives on thousands of computers simultaneously. That said, bugs in the contract code are a real risk, which is why audits matter (see Q4). If a critical vulnerability were discovered, the multi-sig governance structure (see Q6) would allow the board to pause certain functions while the community votes on a fix. No system is 100% bulletproof, but blockchain contracts are among the most scrutinized and transparent codebases out there.

**4. Are contracts audited?**

Yes. Before going live on mainnet, all SuvrenHOA smart contracts are audited by an independent third-party security firm. Audit reports are publicly available and stored permanently on Arweave (our document storage system) so anyone can verify them. The audit checks for common vulnerabilities like re-entrancy attacks, integer overflows, and unauthorized access patterns. We also ran extensive testing on Base Sepolia (the testnet) before touching real funds. Security isn't a checkbox for us — it's ongoing.

**5. Can the board mint fake NFTs?**

No. The smart contract is programmed so that only one property NFT can exist per lot, and it can only be minted when linked to a verified property record. The board doesn't have a magic "create NFT" button they can press anytime — the minting process requires specific inputs that are checked on-chain. Every NFT creation is visible to everyone on the blockchain, so any attempt to create unauthorized ones would be immediately obvious and publicly recorded forever.

**6. What stops the board from draining the treasury?**

Math and code, not just trust. The treasury is controlled by a multi-signature wallet, meaning multiple board members must approve any transaction — no single person can move funds alone. Beyond that, the smart contract enforces spending limits: routine payments within the approved budget can go through with standard approval, but anything above a threshold requires a full homeowner vote. Every transaction is recorded on the public blockchain, so every dollar in and out is visible to every resident. There's no back door.

**7. Is my wallet address public on the blockchain?**

Yes, wallet addresses are public on the blockchain — but your address doesn't automatically reveal your name or where you live. It's more like a pseudonym: "0x1a2b3c..." is visible, but connecting that to "Jane Smith at 123 Maple Lane" requires additional information. Within SuvrenHOA, your property NFT does link your address to your lot number, so neighbors who know how to read the blockchain could make that connection. We keep personal details like your full name and mailing address off-chain in a private HOA database that's not publicly accessible.

**8. Can neighbors see my votes?**

It depends on the vote type. Blockchain votes are by default pseudonymous — your wallet address is recorded, but not your name. Most homeowners won't take the time to connect wallet addresses to property owners. For highly sensitive votes, the system can be configured to use commit-reveal schemes where votes are sealed during the voting period and only revealed after it closes, preventing any last-minute bandwagon effect. The board can see aggregated results in real-time, but individual vote attribution requires deliberate effort to trace.

**9. What if a hacker gets my private key?**

If someone gets your private key or seed phrase, they have full access to your wallet — full stop. This is the biggest individual security risk in any crypto system. You should treat your seed phrase like cash: don't share it, don't type it into websites, don't store it digitally. If you suspect your wallet is compromised, contact the HOA immediately so we can flag your property NFT and initiate the recovery/transfer process before the attacker can do anything irreversible. Going forward, consider using a hardware wallet (like a Ledger) which keeps your private key offline even when you're interacting with the internet.

**10. Is there insurance for stolen funds?**

HOA treasury funds held in USDC in the smart contract are not FDIC insured (that's for bank accounts). However, we carry a separate crime/fidelity bond and directors & officers (D&O) insurance that covers certain losses, including theft by board members. Smart contract exploits are a newer category and coverage varies by policy — we'll always publish our current insurance coverage in the HOA documents on Arweave so you know exactly what's protected. We're also evaluating on-chain insurance protocols (like Nexus Mutual) as the technology matures.

---

## 💰 Cost & Value

**11. The dues are $0.35/month — what about gas fees?**

Gas fees on Base (our blockchain network) are extremely low — typically less than $0.01 per transaction. So when you pay your monthly dues, you're paying $0.35 to the HOA treasury plus a fraction of a cent in gas to process the transaction. Compare that to traditional HOA management companies that charge $15–$50 per month per home in management fees, plus wire fees, check processing fees, and so on. The $0.35 is the actual community operating cost — not a management company's margin.

**12. Who pays the gas fees?**

For routine transactions like voting and viewing documents, the HOA subsidizes gas through a fee relay system — you don't pay anything extra. For dues payments, the gas fee comes out of your USDC balance and is so small (sub-penny) that it's essentially invisible. We built it this way intentionally because we didn't want the blockchain to feel like a toll booth. The total gas cost for all community transactions for a full year is less than what a traditional management company would charge in a single month.

**13. What if gas fees spike?**

Base is an Ethereum Layer 2 network, which means it's specifically designed to keep fees low — usually under a cent even during high-demand periods. During extreme Ethereum mainnet congestion, Base fees can tick up slightly, but we're talking pennies at most, not the $50+ gas fees you sometimes see on Ethereum mainnet. The smart contracts are also optimized to minimize gas consumption. If fees ever became a real burden, the community could vote to temporarily subsidize all transactions from the treasury.

**14. Why should I trust crypto when Bitcoin crashes all the time?**

SuvrenHOA doesn't use Bitcoin — we use USDC, which is a stablecoin. USDC is always worth exactly $1.00 because it's backed 1:1 by US dollars held in regulated financial institutions and audited monthly by major accounting firms. Your dues are $0.35 in USDC, which means $0.35, not "whatever crypto is doing today." The blockchain is just the infrastructure — like saying "why trust email when Twitter goes down?" They're different things. USDC stability is one of the core reasons we chose it over volatile crypto assets.

**15. What if Base (the blockchain) shuts down?**

Base is maintained by Coinbase, one of the largest and most regulated crypto companies in the US, with billions in funding and a public company with regulatory obligations. It's also built on Ethereum, the world's most established smart contract platform, so even in a worst case scenario, the data and contracts could be migrated. More importantly, SuvrenHOA's documents are stored on Arweave (separately from Base), and all financial records are also maintained in traditional off-chain backups. If Base ever shut down, the community would have ample time and resources to migrate to another system.

**16. How does the cost compare to hiring a management company?**

A traditional HOA management company in the Raleigh area typically charges $15–$50 per home per month, plus additional fees for things like annual audits, meeting management, and document preparation. For a 50-home community, that's $9,000–$30,000 per year just in management fees. SuvrenHOA's infrastructure costs are a tiny fraction of that — most of the dues go directly to community operating expenses, not administrative overhead. The technology does the administration automatically.

**17. How much would it cost to switch back to traditional management?**

Switching back is always an option — the community can vote to do so. The off-boarding cost would primarily be data migration (exporting records from Arweave and the blockchain into traditional formats) and whatever onboarding fee the new management company charges. There's no penalty or exit fee built into SuvrenHOA's contracts. The documents stored on Arweave are permanent and accessible forever, so you'd never lose historical records even after switching. We believe in making it easy to leave because we're confident you won't want to.

**18. Do I need to buy cryptocurrency to participate?**

For most things — voting, viewing documents, submitting requests — no, you don't need to hold any crypto. To pay dues, you'll need USDC (a dollar-pegged stablecoin), which you can get by converting regular dollars through a simple on-ramp within the app. We've integrated user-friendly options so you can fund your account with a bank transfer or debit card without having to visit a crypto exchange. Think of it like loading a prepaid card — you put dollars in and it converts automatically.

**19. What's the actual total cost of ownership (TCO)?**

For a 50-home community over 5 years: traditional management runs approximately $45,000–$150,000 in management fees alone. SuvrenHOA's infrastructure, including initial setup, ongoing hosting, and all transaction fees, runs significantly less — the bulk of your dues actually fund community projects and reserves, not administrative overhead. We publish a full cost breakdown annually in the HOA documents so you can see exactly where every dollar goes. The savings compound over time as the community grows and the fixed infrastructure costs stay flat.

**20. Why not just use a spreadsheet and Google Drive?**

Spreadsheets and Google Drive are controlled by whoever has the login credentials — meaning records can be edited, deleted, or lost without any trail. A fired board member could delete three years of financial records in seconds. With SuvrenHOA, every document and transaction is permanently and publicly recorded on the blockchain and Arweave in a way that nobody — not even the board — can retroactively alter. It's also not just storage: the voting, dues collection, and governance all happen automatically through the contracts, eliminating the human error and politics that plague traditionally managed HOAs.

---

## 🖥️ Usability

**21. My 70-year-old neighbor can barely use email — how is this supposed to work?**

Fair concern, and we thought about this a lot. The SuvrenHOA app is designed to look and feel like a normal website — you log in, you see your property info, you can pay dues and vote with a few clicks. The blockchain stuff happens in the background. For residents who genuinely can't or don't want to engage with the tech, we have a paper-based accommodation process where a designated HOA representative can assist them. Nobody gets disenfranchised because of a technology gap — that would defeat the whole purpose.

**22. What's a wallet?**

A wallet is basically your account on the blockchain — it's software (like the MetaMask browser extension) that holds a cryptographic key unique to you. That key proves you're you without needing a username or password that a company stores. Think of it as a digital identity badge that you control completely, rather than one that lives on Facebook's servers. You use it to sign transactions — like a digital signature on a check — and it never leaves your device. The wallet doesn't actually "hold" your money the way a physical wallet does; your assets live on the blockchain and your wallet is just the key to access them.

**23. What does "Base Sepolia" mean?**

Base Sepolia is the test version of the Base blockchain — "Sepolia" is the name of the test network (testnet), and "Base" is the main network we run on. It's like a sandbox where developers can test things with fake money before using real money on the actual network. If you're seeing "Base Sepolia" in the app, it means you might be on the wrong network — you should be on "Base Mainnet" for real transactions. It's an easy fix: MetaMask will prompt you to switch networks and it takes one click.

**24. MetaMask asked me to switch networks and I panicked — what should I do?**

Don't worry — that's actually normal and expected! When you first connect to SuvrenHOA, MetaMask will ask permission to switch your browser to the Base network. This is safe to approve. MetaMask is designed to ask permission before changing networks so you're never switched without consent. Just click "Switch Network" when prompted. If you're ever unsure whether a prompt is legitimate, you can close it, go directly to the SuvrenHOA website by typing the URL yourself, and reconnect from there.

**25. My MetaMask shows 0 ETH — do I need to buy Ethereum?**

For most interactions on SuvrenHOA, no — you don't need ETH. Gas fees on Base are so low that the HOA covers them through a fee relay for things like voting. For paying dues, you need USDC (not ETH), which you can acquire through the in-app on-ramp using a bank account or debit card. Some small amount of ETH (literally fractions of a cent's worth) might technically be needed for certain transactions, but we've designed the system so this is handled for you. If you hit an error, contact the board before assuming you need to buy anything.

**26. I registered my pet but nothing happened — is it broken?**

Pet registrations are recorded on-chain, which means they're confirmed when the transaction is processed on the blockchain — usually within a few seconds. If you submitted the registration and got a transaction confirmation, it worked — even if the app UI didn't refresh dramatically. Try refreshing the page or checking the "My Registrations" section. If you didn't get a transaction confirmation popup, the submission may not have gone through — try again. If issues persist, reach out to the board with your wallet address and we'll look up the transaction directly.

**27. No documents are registered yet — where are the CC&Rs?**

We're in the process of migrating all existing HOA documents to Arweave (our permanent storage system). During this transition period, all governing documents (CC&Rs, bylaws, rules) are available through the traditional method — contact the board or check the existing shared folder link. Once documents are uploaded to Arweave, they'll appear in the Documents section of the app with a permanent, verifiable link. We're prioritizing the most frequently referenced documents first and will announce each upload in the community forum.

**28. I'm getting an "insufficient gas" error when paying dues — help!**

This usually means your wallet doesn't have enough ETH to cover the tiny gas fee for the transaction. On Base, this is literally fractions of a penny — so if your ETH balance is zero, even that fraction matters. The easiest fix: use the in-app "top up gas" feature, which will add a tiny amount of ETH to your wallet (we're talking $0.10 worth) to cover fees. Alternatively, the board can switch you to the gasless payment route where dues are processed without requiring you to hold ETH. Just reach out and we'll get it sorted.

**29. My "Health Score" shows an F — what does that mean?**

The Health Score is a dashboard indicator that shows how complete and up-to-date your property profile is. An F usually means several things are missing — wallet not connected, dues not paid, no emergency contact on file, pet/vehicle not registered, etc. Click on the Health Score to see a checklist of exactly what's missing. It's not a judgment — it's just a nudge to make sure your record is complete so you don't miss anything important. Work through the checklist items one by one and it'll climb to an A quickly.

**30. The app shows Lot #2 but that's not my address — is there a bug?**

Lot numbers and street addresses are two different things — the blockchain uses lot numbers (from your property deed) as the unique identifier, while your mailing address is stored separately. The app should show both, but if there's a mismatch or your address is wrong, it's likely a data entry issue during onboarding. Send the board your correct mailing address and lot number (check your deed or property tax records if you're not sure) and we'll update the off-chain record. The lot number is the authoritative identifier on-chain, so that one takes priority.

---

## 🗳️ Governance

**31. What's a "soulbound" NFT?**

A soulbound NFT is a digital token that can't be sold, transferred, or given away — it's permanently attached to ("bound to the soul of") a specific wallet address. Your property NFT in SuvrenHOA is soulbound to you as the current property owner, which means nobody can buy your voting rights or transfer them without a formal ownership change process. Regular NFTs can be freely traded (think digital art), but soulbound ones are designed specifically for things that represent identity or status — like HOA membership — where transferability would be a problem.

**32. What happens to my property NFT when I sell my house?**

When you sell, the soulbound NFT is burned (destroyed) from your wallet and a new one is minted to the new owner's wallet. This happens as part of the ownership transfer process coordinated between the HOA, the title company, and the new owner. You won't lose your NFT mid-sale — it's tied to the closing process just like recording the deed. The new owner gets their own NFT linked to their wallet, and your old one is gone permanently. The blockchain records this transfer publicly and permanently for full transparency.

**33. Can I delegate my vote to someone else?**

Yes, delegation is built into the governance system. If you trust another homeowner (or want an advocate to vote on your behalf during an extended absence), you can delegate your voting rights to their wallet address through the app. You can revoke delegation at any time and take your votes back. Delegation doesn't mean they get to do anything else with your property or account — just vote on proposals during the delegation period. This is especially useful for snowbirds or homeowners who travel frequently.

**34. What's a quorum and why does it matter?**

A quorum is the minimum number of voters required for a vote to be officially valid. In SuvrenHOA, quorum requirements vary by vote type (see Q38 on the 4 tiers) — a routine spending vote might need 10% of homeowners, while an amendment to the CC&Rs might need 67%. If a vote doesn't reach quorum, it fails even if everyone who voted said yes — this prevents a tiny minority from making big decisions when most homeowners weren't paying attention. The app shows live quorum progress during active votes so you can see how close you are.

**35. Is there a way to fast-track emergency proposals?**

Yes. There's an emergency governance tier for situations requiring immediate action — like a burst pipe flooding common areas or a security threat. Emergency proposals have a shortened voting window (24–48 hours instead of the standard 7 days) and lower quorum requirements, but they're limited in scope: only the board can initiate them, they require multi-sig board approval to even submit, and they can only authorize spending within pre-defined emergency categories. Non-emergency proposals can't be disguised as emergencies — the contract enforces the categories.

**36. What if someone submits a malicious or harmful proposal?**

Proposals on SuvrenHOA require a submission deposit (a small amount of USDC) which is returned if the proposal reaches quorum, but forfeited if it's flagged as malicious and rejected by the board before going to a vote. The board has a limited window to review and reject proposals that clearly violate governing documents or applicable law before they go live. If a malicious proposal somehow makes it to a vote and passes, any homeowner can challenge the outcome in court (see Q47). The system has multiple layers: smart contract rules, board review, and legal remedies.

**37. How do I submit a proposal?**

Go to the Governance section of the app, click "New Proposal," and fill out the form — you'll describe what you want, why it matters, and which spending category or rule change is involved. Depending on the proposal type, you may need to put up a small deposit. Once submitted, the board has a review window before it goes live for community voting. You'll get notifications as your proposal progresses. First-time proposers: we recommend chatting with the board informally before submitting, especially for anything that involves budget changes — it smooths the process considerably.

**38. What are the 4 voting tiers?**

The four tiers are based on significance and impact: **Tier 1** covers routine operational decisions (spending within approved budgets, minor rule clarifications) — board can approve with simple majority. **Tier 2** covers moderate community matters (new spending categories, minor bylaw tweaks) — requires a homeowner vote with standard quorum. **Tier 3** covers major decisions (significant budget changes, major rule amendments) — requires a supermajority of homeowners. **Tier 4** covers foundational changes (amending the CC&Rs, dissolving the HOA) — requires the highest quorum and supermajority thresholds mandated by NCGS Chapter 47F. Each tier has different voting windows and quorum requirements encoded directly into the smart contracts.

**39. Can the board override a vote outcome?**

No — that's one of the core guarantees of the system. Once a vote closes and the quorum is met, the smart contract executes the outcome automatically. The board can't say "we don't like this result, we're overriding it." They can submit a counter-proposal to reverse a decision, which then goes through the normal voting process. The only exception is emergency safety situations where the board can pause a specific action (not reverse a vote) pending legal review — and even that requires multi-sig board approval and is recorded publicly.

**40. What if the blockchain goes down during an active vote?**

Base (our blockchain network) has extremely high uptime — it runs on thousands of nodes globally. But if there were ever an extended outage during a vote, the voting period is automatically extended. Votes aren't counted until the contract confirms them on-chain, so there's no risk of a partial count. If an outage lasted long enough to make the vote meaningless, the board could use the emergency governance tier to extend the voting period and notify homeowners. We also recommend homeowners vote early rather than waiting until the deadline for exactly this reason.

---

## ⚖️ Legal

**41. Is any of this legally binding in North Carolina?**

Yes, with the right structure. North Carolina's Planned Community Act (NCGS Chapter 47F) governs HOAs and allows for electronic voting, electronic records, and electronic transactions when properly authorized in the community's governing documents. SuvrenHOA's CC&Rs and bylaws explicitly incorporate blockchain-based governance as a valid mechanism. Smart contract outcomes are treated as the functional equivalent of recorded votes, and USDC transactions as valid payment. We've worked with NC-licensed HOA attorneys to make sure we're compliant.

**42. Can our HOA be sued because of the blockchain system?**

Any HOA can be sued — that's just the reality of governing a community. But SuvrenHOA's structure actually reduces liability compared to traditional HOAs because everything is transparent, auditable, and rule-based. The board can't be accused of secretly redirecting funds or manipulating votes because the blockchain prevents that. D&O (Directors & Officers) insurance covers the board members for decisions made in good faith. If anything, the auditability of blockchain governance makes it *harder* for plaintiffs to allege impropriety.

**43. How do you ensure NCGS Chapter 47F compliance?**

Chapter 47F governs everything from meeting requirements to voting procedures to financial reporting for planned communities in NC. SuvrenHOA's smart contracts are designed around those requirements — voting periods, quorum thresholds, required notices, and financial transparency all align with or exceed what Chapter 47F mandates. We also maintain off-chain records and can produce paper-based equivalents of everything if legally required. Our HOA attorney reviews any major governance changes before they're implemented to ensure ongoing compliance.

**44. What if a court orders a vote outcome to be changed?**

Court orders are real-world legal instruments and the HOA board is obligated to comply with them — that hasn't changed. If a court ordered a reversal, the board would initiate an on-chain corrective action (a new vote, a contract parameter change, etc.) following the emergency governance process. The blockchain records would still show the original vote and the court-ordered correction, creating a permanent, transparent audit trail. The system doesn't put the HOA above the law — it makes the HOA's actions transparent and accountable to the law.

**45. Who's liable if a smart contract malfunctions and causes a financial loss?**

This is an evolving area of law. The HOA carries insurance that covers certain technology-related losses, and the service agreement with EliteDevs (our development partner) includes warranties and liability provisions for contract defects. In practice, the audit process and extensive testing are designed to prevent malfunctions before they happen. If a bug caused a financial loss despite reasonable precautions, the HOA would work with insurance, legal counsel, and the development team to make homeowners whole. We're transparent about this risk — no technology is perfect — but we've taken substantial steps to minimize it.

**46. Do we still need to hold in-person meetings?**

Under NCGS Chapter 47F, certain meetings (particularly the annual meeting) may still be required, though NC law allows electronic meetings when authorized in governing documents. SuvrenHOA holds a hybrid annual meeting — available in-person and via video call — and all governance actions between meetings happen on-chain. The blockchain voting is treated as equivalent to a membership vote, so you don't need to come to a meeting to vote on proposals. Meeting minutes are recorded, approved, and stored permanently on Arweave.

**47. Can a homeowner challenge a vote outcome in court?**

Absolutely — blockchain or not, any HOA member can challenge a governance decision in court if they believe it violated the governing documents or applicable law. The blockchain actually makes this *easier* because the vote record is permanent, public, and tamper-proof — there's no "he said/she said" about what the vote count was. A challenger would have a clear, irrefutable record to bring to court. Courts in NC have authority to order remedies, and the HOA board is bound to comply (see Q44).

**48. Is a multi-sig wallet legally valid for holding HOA funds?**

Yes. A multi-signature smart contract wallet functions like a jointly-controlled account where multiple authorized signers must approve transactions — which is essentially what traditional HOA bank accounts with dual-signature requirements do, just in code. NC law recognizes electronic signatures and electronic funds transfers as legally valid. The HOA's governing documents formally designate the multi-sig wallet as the official treasury mechanism, which gives it the same legal standing as a traditional bank account under the HOA's authority.

**49. What about GDPR or CCPA privacy compliance?**

CCPA (California Consumer Privacy Act) applies to California residents, and GDPR applies to EU residents — neither directly governs a North Carolina HOA's dealings with NC residents. That said, we follow the spirit of these regulations: we collect only the data we need, we store personal information off-chain (not on the public blockchain), homeowners can request their data and correct inaccuracies, and we never sell personal information. Your wallet address being on a public blockchain is inherent to how the technology works, but we don't publish personally identifying information alongside it.

**50. Who owns the intellectual property — the code, the contracts, the platform?**

The smart contracts deployed on Base are open-source and their bytecode is publicly visible on the blockchain — that's the nature of public blockchains. The SuvrenHOA platform code developed by EliteDevs is owned by the HOA under the terms of the development agreement, meaning the community owns its governance infrastructure. Arweave-stored documents are owned by the HOA and its members as always. Individual homeowners own their own data. No third party has a proprietary lock on the community's operations.

---

## 📄 Documents

**51. What if we need to delete something that was permanently stored?**

You can't delete it from Arweave — that's what "permanent" means, and it's a feature, not a bug. If something was uploaded in error (wrong version, wrong document), you upload the correct version and mark the old one as superseded. The old version stays in the archive, but the new one becomes the official current document. This creates a complete, auditable document history — which is actually a legal advantage. The only scenario where this is genuinely problematic is if personal information was exposed (see Q52).

**52. What if someone accidentally uploads a document with personal information in it?**

If personally identifying information (like Social Security numbers or financial account details) is uploaded to Arweave by mistake, it can't be deleted from Arweave itself. However, we can immediately remove the link from the SuvrenHOA app so it's no longer accessible through the platform, notify affected individuals, and document the incident. The risk is managed by having strict upload permissions (see Q60) and a pre-upload review step for sensitive documents. This is a serious enough risk that we train whoever has upload access on document hygiene before granting them permissions.

**53. How do I verify that a document is authentic?**

Every document stored on Arweave gets a unique transaction ID — a long string of letters and numbers that's essentially a cryptographic fingerprint. You can take that ID and look it up directly on Arweave's network (arweave.net) to confirm the document exists and hasn't been altered. The SuvrenHOA app also displays verification badges for each document. If someone sends you a document claiming to be the official CC&Rs, you can check its Arweave transaction ID against the one listed in the app to confirm it's the real thing.

**54. Can documents be updated or revised?**

Yes — the old version stays on Arweave permanently, and the new version is uploaded as a separate document with its own Arweave transaction ID. The app maintains a version history so you can see all past versions of a document and when they changed. Official current versions are clearly marked. This versioning approach means you always have the complete amendment history of the governing documents, which is genuinely useful for legal disputes or understanding why a rule exists.

**55. Where are the documents physically stored?**

Documents are stored on the Arweave network, which is a decentralized storage protocol. Unlike cloud storage (Google Drive, Dropbox), there's no single data center. Files are distributed across hundreds of nodes operated by independent storage providers around the world who are paid in Arweave tokens to store data permanently. The files themselves live on physical hard drives across this global network. You can access any document through any Arweave gateway without going through the SuvrenHOA app.

**56. What if Arweave goes out of business?**

Arweave's economics are designed for permanence — uploaders pay a one-time fee based on current storage costs that funds a perpetual endowment for ongoing storage. Even if the Arweave company ceased to exist, the protocol is open-source and the network of storage nodes would continue operating as long as it's economically viable (which the endowment model ensures). Additionally, we maintain traditional backups of all HOA documents in separate cloud storage and on local drives. If Arweave ever failed, we wouldn't lose a single document.

**57. How long is "permanent"?**

Arweave's model is designed to store data for a minimum of 200 years — that's not marketing, it's the math behind their endowment model. The one-time upload fee is calculated to cover storage costs for 200 years even accounting for inflation. In practical terms, HOA documents need to be accessible for decades (for property disputes, historical records, etc.), and Arweave far exceeds that requirement. No digital storage system can guarantee literal forever, but 200 years is more than sufficient for any realistic HOA document retention need.

**58. Can I download my documents?**

Yes, any document stored on Arweave is publicly accessible and downloadable by anyone — no login required. From the SuvrenHOA app, you can click any document to view it in your browser or download it. You can also use the Arweave transaction ID to download it directly from the Arweave network through any gateway. We encourage homeowners to keep their own copies of important documents (CC&Rs, bylaws, meeting minutes) so they always have access regardless of the app's status.

**59. Are the documents encrypted?**

Most HOA governing documents (CC&Rs, bylaws, budgets, meeting minutes) are stored unencrypted because they're meant to be public — transparency is the point. Documents containing personal information (like individual homeowner payment records) are stored off-chain in a private, encrypted database rather than on Arweave. If we ever need to store a semi-private document on Arweave (accessible to residents but not the general public), we use encryption where only wallets with verified membership can decrypt it. We think about privacy case-by-case rather than applying one blanket approach.

**60. Who can upload documents to Arweave?**

Currently, upload permissions are restricted to authorized board members and designated HOA administrators. This prevents random documents (or malicious content) from being linked to the HOA's official document registry. Upload requests from committees or homeowners go through the board. We're considering a proposal-based upload system where committees could upload their own reports after board approval. Every upload is logged on-chain so there's always a record of who uploaded what and when.

---

## 💵 Treasury

**61. How do I know the treasury balance is real?**

The treasury balance is visible in real-time on the public blockchain — you don't have to take anyone's word for it. Go to the Treasury section of the app and you'll see a live balance pulled directly from the blockchain. You can also take the treasury wallet address and look it up independently on Base's block explorer (like basescan.org) to see the exact balance and complete transaction history. No reports to wait for, no auditor to hire — it's just publicly visible at all times.

**62. Can I see every transaction that's ever happened?**

Yes — every single one, going back to the treasury's creation. Block explorers like basescan.org let you view the complete, permanent history of every deposit and withdrawal from the treasury wallet. The SuvrenHOA app presents this in a more readable format with categories and descriptions, but the raw blockchain data is always there as the ground truth. This is a fundamentally different level of financial transparency than any traditional HOA offers.

**63. What prevents the board from creating secret wallets?**

The board can't secretly route HOA funds through unauthorized wallets because all dues payments go directly to the on-chain treasury smart contract — not to a board member's personal wallet. The smart contract only releases funds through the approved, auditable spending functions. A board member could, theoretically, create a separate personal wallet — but they can't access the HOA treasury funds through it. Any spending from the treasury goes through the multi-sig process and is recorded publicly. If money is missing, you'd see it immediately.

**64. How does the auto-split work for dues?**

When you pay your monthly dues, the smart contract automatically routes the funds into predefined categories: a percentage to operating expenses, a percentage to the reserve fund, a percentage to a maintenance fund, and so on. The split ratios are set by community vote and encoded in the contract — no human has to manually move money around and no one can redirect funds to a different bucket without a governance vote changing the contract parameters. You can see the current split ratios and real-time balances for each category in the Treasury section of the app.

**65. What if there's an emergency payment that wasn't in the budget?**

Emergency spending is handled through the Tier 1 emergency governance path (see Q35). The board can authorize emergency expenditures up to a predefined limit without a full homeowner vote — think burst pipe, emergency tree removal, that kind of thing. Above that limit, even emergencies go to a fast-tracked homeowner vote. Every emergency expenditure is logged publicly and the board must provide documentation justifying the emergency classification. This balances the need for quick action with accountability.

**66. Can residents request a financial audit?**

Yes — any homeowner can request a formal audit at any time, and the community can vote to hire an independent auditor. But here's the thing: the blockchain is already a real-time public audit. Every transaction is permanently recorded and independently verifiable. A formal audit by a CPA is still valuable for attesting to accounting practices and categorization, and we do one annually — but you don't have to wait for an audit to know the treasury balance. It's always there, live, on-chain.

**67. Are the funds FDIC insured?**

USDC held in a blockchain smart contract is not FDIC insured — FDIC insurance is for bank deposits, not on-chain assets. This is a genuine difference from traditional HOA bank accounts. USDC is backed 1:1 by US dollars held in regulated bank accounts by Circle (the company that issues USDC), and those underlying dollars are themselves in FDIC-insured banks — but the FDIC insurance doesn't extend to you as a USDC holder directly. We mitigate this risk with on-chain insurance coverage and by maintaining the HOA's crime/fidelity bond.

**68. What happens to the treasury if the HOA dissolves?**

HOA dissolution is governed by NCGS Chapter 47F and the community's CC&Rs, which specify how assets are distributed. In SuvrenHOA, dissolution would require a Tier 4 vote (the highest threshold) and would trigger a smart contract function that distributes remaining USDC to registered property NFT holders according to their proportional share. The distribution is automatic and transparent — no one can redirect the funds during wind-down. The process mirrors traditional HOA dissolution law while making the actual fund distribution faster and tamper-proof.

**69. Can the HOA earn interest on treasury funds?**

We're exploring on-chain yield options — there are DeFi protocols that allow USDC to earn interest (similar to a savings account but on-chain). This requires a community vote to authorize, as it introduces additional smart contract risk. Currently, the treasury holds USDC in a non-yielding smart contract for maximum safety during our initial operating period. Once the system is proven and the community is comfortable, we'll put a proposal forward to earn modest yield on reserve funds. Even conservative on-chain yields can meaningfully offset operating costs at scale.

**70. Why USDC instead of regular dollars?**

Two reasons: automation and transparency. Smart contracts can't natively interact with traditional bank accounts — they work with on-chain assets. USDC is the best bridge because it's always worth exactly $1 (no volatility), it's regulated and audited, and it can flow through smart contracts automatically without human intermediaries. Using USDC means dues collection, auto-splitting, and payments to vendors all happen programmatically — no one has to manually move money, there's no float, and there's no opportunity for it to go missing. Traditional dollars would require a bank account that a human controls.

---

## 🔧 Technical

**71. What if a bug is discovered in the contract after it's deployed?**

Deployed smart contracts can't be edited directly — that's by design (immutability = trustworthiness). But we've built in upgrade pathways using a proxy contract pattern, where the logic can be updated while the data and address stay the same, subject to a governance vote. For critical security bugs that can't wait for a vote, the board multi-sig can trigger a pause function to halt vulnerable operations while an emergency community vote is called. All of this is disclosed in the technical documentation — we don't pretend bugs can't happen.

**72. Can the contracts be upgraded?**

Yes, through the proxy upgrade pattern mentioned above. However, upgrades require a Tier 3 governance vote (supermajority of homeowners) for routine improvements, or an emergency fast-track vote for critical security issues. The upgrade mechanism itself is transparent — all proposed code changes are published on-chain before any vote, so homeowners (or anyone they ask to review it) can see exactly what would change. No silent upgrades, ever.

**73. What's the difference between Base Sepolia and Base Mainnet?**

Base Mainnet is the live production network where real USDC and real governance actions happen. Base Sepolia is the test network (testnet) that uses fake tokens with no real value — developers use it to test new features before deploying to mainnet. If you're interacting with the real SuvrenHOA system, you should be on Base Mainnet. If MetaMask says Sepolia, you're in test mode and your actions won't affect anything real. The app will warn you if you're on the wrong network.

**74. Why are you testing on real data?**

We're not — all testing happens on Base Sepolia with synthetic data. Real homeowner data and real funds never touch the testnet. When new features are developed, they go through: local development testing, Sepolia testnet with dummy data, security audit, and then mainnet deployment with a governance vote. The appearance of "real data in testing" would be a bug and should be reported immediately to the board.

**75. What's the disaster recovery plan?**

Multiple layers: First, blockchain data is inherently distributed — there's no single server to lose. Second, all documents are on Arweave with traditional backups. Third, the app's front-end code is version-controlled and can be redeployed in hours. Fourth, all homeowner off-chain data (names, contact info, etc.) is backed up daily to encrypted off-site storage. In the absolute worst case scenario where everything needed to be rebuilt, the authoritative record on the blockchain would still exist and we could reconstruct the system from that.

**76. What if EliteDevs (the development company) disappears?**

The smart contracts, once deployed, run on the blockchain independently — EliteDevs going dark wouldn't affect their operation. The HOA owns the front-end application code under the development agreement. The community can hire any competent blockchain developer to maintain or improve the system, or even switch to self-hosted open-source governance tools. We specifically chose to avoid vendor lock-in: no proprietary databases, no secret sauce. Everything is documented and the code is readable on the blockchain.

**77. Is there an uptime guarantee?**

The blockchain itself (Base) has no single point of failure and is effectively always on — Coinbase and the Base network have historically maintained 99.9%+ uptime. The SuvrenHOA web app front-end has standard cloud hosting with uptime monitoring and automatic failover. We target 99.5% uptime for the app interface, and any planned maintenance is announced at least 48 hours in advance in the community forum. If the app is down, critical actions (like dues payment deadlines) are automatically extended.

**78. Can this system scale to 5,000 homes?**

Yes. The smart contracts are designed for thousands of participants — Base processes thousands of transactions per second at low cost. The voting and treasury mechanisms have no fundamental scaling limits. The front-end app is built on scalable cloud infrastructure. In fact, the per-home cost of the blockchain infrastructure actually *decreases* as the community grows, because fixed costs are spread across more homes. We've load-tested the system with simulated large communities during development.

**79. What external APIs or services does the system depend on?**

The core governance (voting, treasury, ownership) runs on-chain and has no external API dependencies — it works as long as Base works. The front-end app integrates with: MetaMask and WalletConnect for wallet connections, Circle's USDC APIs for the on-ramp (converting dollars to USDC), Arweave gateways for document access, and standard cloud services for the web hosting. We've implemented fallbacks for each integration so that a single API failure doesn't take down the whole system.

**80. Is there a mobile app?**

The SuvrenHOA web app is fully mobile-responsive — it works in your phone's browser without needing to install anything. For voting and dues payments, mobile MetaMask or Coinbase Wallet work seamlessly with the web app. A dedicated native mobile app (iOS and Android) is on the roadmap and will be put to a community vote for prioritization. Until then, the browser experience on mobile is solid for all the features most homeowners use regularly.

---

## 🏘️ Community

**81. What if a neighbor sends harassing messages through the platform?**

Harassment is taken seriously and there are consequences. Any resident can report a message to the board with one click — the report includes a permanent, uneditable record of exactly what was sent (blockchain messages can't be retroactively deleted). The board reviews reports and can suspend messaging privileges for the offending account. Severe cases are referred to law enforcement with the immutable message record as evidence. The platform also has block functionality (see Q83) so you can stop receiving messages from someone while a complaint is being investigated.

**82. Can board members read private messages?**

No. Direct messages between residents are end-to-end encrypted — only the sender and recipient can read them. The board can see reports filed against specific messages (which the reporting resident shares) but cannot browse private conversations. Community forum posts are visible to all residents and board members, but those aren't private by design. We believe board members shouldn't have access to private resident communications — that's a creepy overreach that traditional HOA management doesn't have either.

**83. How do I block someone?**

Go to the resident's profile and click the block button. Blocking prevents them from sending you direct messages and hides their forum posts from your view. It doesn't prevent them from participating in governance votes or viewing community documents. Blocks are private — the blocked person isn't notified. You can manage your block list in account settings and unblock someone at any time. If someone is being persistently disruptive to the whole community (not just you), filing a formal conduct report is the appropriate next step.

**84. Is the community forum moderated?**

Yes, by the board and designated community moderators. Moderation guidelines cover obvious things: no harassment, no spam, no personal attacks, no illegal content. Moderators can remove posts that violate the rules, but — importantly — the removal is logged on-chain (the post itself is removed from view but the record that it existed and was removed is permanent). This prevents moderators from secretly scrubbing inconvenient criticism. Appeals to moderation decisions go to the full board.

**85. What about inappropriate content — who decides what's inappropriate?**

The community's conduct guidelines define inappropriate content, and those guidelines are themselves a governed document that residents can vote to change. The board doesn't have unilateral authority to define "inappropriate" however they like — it's bound by the approved conduct guidelines. Borderline cases are reviewed by at least two board members before action is taken. Residents can appeal any moderation decision. We're going for consistent enforcement of agreed-upon rules, not censorship of dissent.

**86. Can I opt out of receiving community messages?**

Yes. In your notification settings, you can configure which types of messages you receive: direct messages, forum notifications, governance alerts, and announcements. You can turn off forum notifications and non-urgent messages while keeping governance and dues alerts on. We strongly recommend keeping governance notifications on so you don't miss important votes. You can never fully opt out of official HOA notices (like board decisions, meeting announcements, etc.) because those are legally required communications under NCGS Chapter 47F.

**87. Who can see my pet and vehicle registrations?**

Pet and vehicle registrations are visible to all residents and board members — this is intentional. If there's a loose dog or an unidentified vehicle parked in a reserved spot, neighbors and the board need to be able to look up registration information. Your name is tied to your lot number (which is semi-public within the community), but the registration data isn't published on the public internet — it's only accessible to logged-in, verified residents. We don't share this information with third parties.

**88. Can I make an anonymous safety report?**

Yes. The safety reporting system allows you to submit concerns anonymously — your wallet address is not disclosed to the board when you choose the anonymous option. However, anonymous reports carry less weight than identified ones, and we can't follow up with you for more information. For non-emergency safety concerns, anonymous reporting is available. For emergencies, please call 911 first, then file a report. Tip: even "anonymous" on a blockchain isn't perfectly anonymous to a determined investigator — if you have a sensitive matter, consider a phone call to the board instead.

**89. Is my voting history public?**

Your voting record is on the public blockchain, associated with your wallet address. How identifiable that is depends on whether someone can connect your wallet address to your identity (see Q7). The vote results — how the community voted overall — are always public. For sensitive personal votes, we use a commit-reveal scheme where your vote is sealed until after the voting period closes, so no one can see how you voted and potentially pressure you during the vote window. After reveal, the record is permanent.

**90. Could someone figure out my wallet address from my community activity?**

Potentially, with effort. Your wallet address is linked to your property NFT, and your property is linked to your lot number, which is semi-public within the community. A determined resident could look up your lot number and trace it to your wallet address. This is a known trade-off of blockchain-based systems. We keep sensitive personal information (full name, email, contact details) off-chain in a private database to limit exposure. If privacy is a major concern for you, using a dedicated wallet only for SuvrenHOA (separate from any personal crypto holdings) is good practice.

---

## 🔑 Practical

**91. What if I forget to vote on a proposal?**

You miss the vote — but that's okay, it's your right to abstain. Proposals are designed to succeed or fail based on active participation, so abstentions count as... nothing. They neither help nor hurt a proposal. The system is designed so that quorum requirements protect against low-turnout decisions on major issues — if not enough people vote, the proposal doesn't pass regardless of the yes/no split. Set up governance notifications (see Q92) so you at least know when proposals are live.

**92. Will I get notifications about new proposals?**

Yes — you can opt in to notifications through the app for email, SMS, or push notifications (if using the mobile browser experience) whenever a new proposal is submitted or when a vote is nearing its deadline. We also post weekly governance summaries in the community forum. The board sends out announcement messages for significant proposals. The more engaged residents are with notifications, the better the community's quorum numbers tend to be — so we actively encourage everyone to turn them on.

**93. Can I use this on my phone?**

Yes. The SuvrenHOA web app works on any modern smartphone browser — Chrome and Safari on iOS work well. For transactions (paying dues, voting), you'll need a mobile-compatible wallet app. MetaMask has a mobile app with a built-in browser, and Coinbase Wallet also works seamlessly. If you open the SuvrenHOA site inside the MetaMask mobile browser, everything connects automatically. It's not as slick as a native app yet, but all the core functionality is there.

**94. What if the website is down when my dues are due?**

Dues deadlines are automatically extended during any documented system outage — the smart contract tracks deadlines and the board can push them back through an emergency governance action. You can also pay dues directly through the blockchain without using the SuvrenHOA website — if you have MetaMask and know the contract address, you can interact with it directly. And if all else fails, contact the board and document your attempt to pay — that documentation protects you from late fees.

**95. Can I pay dues with a credit card?**

Not directly — the system uses USDC, which requires converting dollars first. However, the in-app on-ramp lets you buy USDC with a debit card or bank transfer in a few minutes, and then immediately pay your dues. Some on-ramp providers do support credit cards (though they often add a small fee). Think of it like buying a gift card with your credit card and then using the gift card — an extra step, but not prohibitively complicated. We're working on integrating a smoother credit card to USDC to dues flow in a future update.

**96. Is there a grace period for late dues?**

Yes — the smart contract implements a 15-day grace period after the monthly due date before any late fee is assessed. Late fees are calculated automatically and added to the following month's payment. After 60 days of delinquency, the board's standard collections process kicks in per the CC&Rs. The blockchain timing is based on block timestamps, which are accurate to within a few seconds — no disputes about what time you paid. If you're going through financial hardship, contact the board before the due date; there's a hardship accommodation process.

**97. What if the information on my property NFT is wrong?**

Contact the board with the correct information and documentation (property deed, title, etc.). Off-chain information (your name, address, contact info) can be updated easily by board administrators. On-chain information (lot number, property classification) requires a board-initiated NFT update, which is logged publicly. If the wrong property NFT was issued entirely, that requires a burn-and-reissue process. Always check your property record during onboarding and flag any errors early — it's much easier to correct before any governance actions reference the incorrect data.

**98. How do I transfer the property NFT to a spouse or trust?**

Transfers for legitimate purposes (adding a spouse, moving to a living trust, estate planning) go through a board-assisted transfer process: you submit documentation proving the transfer (trust documents, marriage certificate, etc.), the board verifies and initiates the on-chain transfer, and the NFT moves from the current wallet to the new one. This isn't something you can do unilaterally — transfers require board involvement to prevent unauthorized sales or transfers. There's no fee for legitimate ownership-related transfers.

**99. What if there's a power outage — can I still access records?**

If your power is out, you're not accessing anything from home regardless of the system. But HOA records being on Arweave and the blockchain means they're accessible from anywhere in the world with internet access — a phone with cellular data, a library, a neighbor's house. The records aren't stored on a local server that goes down with your power. For critical documents you might need during emergencies (insurance info, emergency contacts, contractor lists), we recommend downloading local copies and keeping them somewhere accessible even without power.

**100. This all sounds great — why isn't every HOA doing this?**

Honestly, a few reasons: blockchain technology is still relatively new and most HOA management companies have zero incentive to recommend it (they'd be automating themselves out of a job), there's a learning curve that scares off decision-makers, and early implementations in other communities weren't as user-friendly as SuvrenHOA aims to be. The regulatory clarity for blockchain governance is also still catching up, though NC is actually ahead of many states. Early adopters always face friction — but communities that get this right early will have a massive advantage in transparency, efficiency, and resident trust. You're part of that first wave, and that's worth something.

---

*Have a question not answered here? Post it in the community forum or contact the board through the app. If it's a good one, it'll end up in the next version of this document.*

*SuvrenHOA is governed by Raleigh, NC homeowners under NCGS Chapter 47F on Base (Ethereum L2). Built by EliteDevs.*
