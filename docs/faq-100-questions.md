# SuvrenHOA — 100 Frequently Asked Questions

> **A friendly guide for skeptical homeowners.** These answers are written for real people, not developers. If something is still unclear after reading, bring it up at the next community meeting — that's exactly why we have them.

---

## 🔒 Trust & Security (Questions 1–10)

---

**1. Who controls the smart contracts? Can the board change the rules without my consent?**

That's one of the most important questions to ask — and the answer is designed to protect you. The governance rules are written directly into the smart contracts, and changing them requires a community vote that meets quorum. The board cannot unilaterally rewrite the rules; major changes go through the same proposal and voting process that every homeowner participates in. Think of the smart contracts like a Constitution that can only be amended by the community itself, not by a handful of board members in a closed meeting.

---

**2. If I lose access to my wallet, do I lose my voting rights and property record?**

Your concern is completely valid — wallet recovery is one of the trickiest parts of any blockchain system. The good news: we have a wallet recovery process tied to your verified property ownership. If you lose access, the board can initiate a reassignment process that links a new wallet to your property record. Your property NFT (the digital proof of ownership) doesn't disappear; it gets reconnected to your new wallet after identity verification, similar to how a bank reissues a lost debit card.

---

**3. What happens if someone hacks the smart contracts?**

Smart contract security is taken seriously, which is why the contracts are designed with multiple safeguards: multi-signature treasury controls, time-locked large transactions, and community governance over any major changes. If a vulnerability were discovered, the multi-sig signers can pause treasury operations while a fix is developed. We'd be honest with you — no system is 100% unhackable, but the architecture is designed so that even a partial compromise can't silently drain everything without triggering alarms and requiring multiple party approvals.

---

**4. Are the contracts audited by a third party?**

Currently, SuvrenHOA is deployed on Base Sepolia (the test network), so we're in the pre-production phase. Before mainnet launch, a third-party smart contract audit is planned — this is a non-negotiable step before real funds are managed on-chain. The audit reports will be made publicly available to the community so any homeowner can review the findings. We'll post those documents directly in the platform's document registry when they're complete.

---

**5. Can the board mint fake property NFTs and stuff ballot boxes?**

Great question, and the answer is no — by design. Each property NFT is tied to a unique lot in the community, and the minting process requires both a verified property record and multi-signature approval. You can't create a property NFT for 100 Fake Lane because there is no 100 Fake Lane in the registry. The total supply of property tokens is capped at the number of actual lots in Faircroft, and that list is publicly verifiable on-chain by anyone.

---

**6. What stops a board member from draining the treasury?**

The treasury is protected by a multi-signature requirement — meaning multiple authorized signers must approve any transaction above a threshold. No single board member has unilateral access to move funds. On top of that, large expenditures are subject to a time-lock (a waiting period before execution), giving the community a window to notice and challenge suspicious transactions. Every single transaction is also permanently recorded on-chain and visible to any homeowner at any time — there's no hiding it.

---

**7. Is my home address publicly visible on the blockchain?**

Your lot number and property NFT are on the blockchain, but your full street address is not stored on-chain by default. The platform maps lot numbers to addresses internally, and that mapping is kept in the platform's database rather than published publicly on the blockchain. Anyone looking at the raw blockchain data would see "Lot #7" not "123 Main Street, Raleigh, NC." Full address details are only accessible to authenticated community members and board administrators.

---

**8. Can my neighbors see how I voted?**

No — votes are recorded on-chain in a way that preserves your privacy. What's publicly visible is the final tally (how many votes for, how many against), not who voted which way. Your wallet address is associated with your vote in the contract, but since your wallet address isn't publicly connected to your name or address (see Q7), your individual vote stays private to all practical purposes. Think of it like a paper ballot — counted publicly, cast privately.

---

**9. What if a hacker gets my private key — can they vote on my behalf?**

Unfortunately, yes — this is the core risk of any crypto wallet, and we don't want to sugarcoat it. If someone has your private key, they control your wallet. This is exactly why we strongly recommend using a hardware wallet (like a Ledger) for your property NFT, enabling two-factor authentication on any associated accounts, and never sharing your seed phrase with anyone. We also recommend reporting any suspected compromise to the board immediately so the property NFT can be flagged and a reassignment process initiated before any damage is done.

---

**10. Is there insurance if funds are stolen from the treasury?**

Traditional FDIC insurance doesn't apply to crypto wallets — that's a real limitation we want to be upfront about. The treasury's protections are structural (multi-sig, time-locks, on-chain transparency) rather than insurance-based. As the platform matures, we'll explore whether crypto-native insurance products (like those offered by Nexus Mutual or similar DeFi protocols) make sense for the community. This is an active area of development in the broader blockchain space, and we'll keep the community informed as options become available.

---

## 💰 Cost & Value (Questions 11–20)

---

**11. You say $0.35/month — what about gas fees when I actually DO something?**

The $0.35/month figure reflects the infrastructure and storage costs, but you're right that on-chain actions (like submitting a vote or uploading a document) also have gas fees. On Base L2, those fees are typically less than $0.01 per transaction — often fractions of a cent. So even if you vote on 10 proposals in a month, you're probably spending a nickel total in gas. We're also exploring gas sponsorship models (called "meta-transactions") where the community treasury subsidizes those tiny fees entirely so residents never see them.

---

**12. Who pays the gas for proposals, voting, document uploads?**

Right now, the person initiating the action pays the (very small) gas fee from their wallet. For voting, that's you. For board-initiated proposals and official document uploads, that's the board's operational wallet, funded from the community budget. As we roll out gas sponsorship, the goal is that everyday residents will never need to hold ETH — the community treasury will cover routine transaction fees on your behalf, and you'll interact with the system just like a regular website.

---

**13. What if ETH gas prices spike — does my $0.35 become $50?**

This is a fair concern for Ethereum mainnet, but Base L2 specifically exists to solve this problem. Base uses Ethereum for security but processes transactions on a separate layer that's dramatically cheaper and more stable. Even during the biggest Ethereum gas spikes in history, Base transactions remained under a few cents. The architecture is specifically designed so that gas volatility on the main Ethereum network doesn't blow up your HOA fees.

---

**14. Why would I trust crypto for my HOA when Bitcoin crashes 50% randomly?**

This is probably the most common misconception worth addressing directly: SuvrenHOA doesn't use Bitcoin, and your dues aren't invested in volatile crypto. Dues are paid and held in USDC, which is a stablecoin pegged 1:1 to the US dollar. $100 in USDC is worth $100 today, tomorrow, and next year — it doesn't fluctuate with the crypto market. The blockchain is just the infrastructure for governance and record-keeping, not an investment vehicle.

---

**15. We're on Base — what if Base shuts down or gets hacked?**

Base is built and maintained by Coinbase, one of the largest and most regulated crypto companies in the US, and it's secured by the Ethereum network underneath it. A complete shutdown is extremely unlikely — but even in a worst-case scenario, all your data (votes, documents, property records) is permanent on Arweave and the Ethereum base layer. We'd have a full data export and migration path to another system. We don't have all our eggs in one basket, and your community records aren't locked away where only Base can see them.

---

**16. How much did it cost to BUILD this system vs just hiring a management company?**

That's a fair comparison to make, and the honest answer is that upfront development costs are higher than simply hiring a property manager. However, traditional HOA management companies typically charge 10–15% of collected dues annually, every year, forever. SuvrenHOA's model aims to reduce that recurring cost significantly by automating the tedious parts (dues collection, document storage, vote tallying) while keeping humans in the loop for judgment calls. The break-even point for most communities is within 2–3 years.

---

**17. If we hate it, how much does it cost to switch back to traditional?**

All your data is exportable — votes, documents, financial history, property records. Nothing is locked in a proprietary format that only SuvrenHOA can read. If the community voted to return to traditional management, you'd have a complete, auditable record to hand to a new management company. The switching cost is primarily the time to set up a new system, not a data ransom. We'd never want to keep a community on-platform against their will.

---

**18. Do I need to buy crypto to use this?**

For basic participation — viewing proposals, reading documents, checking community updates — no, you don't need to hold any crypto. To vote or pay dues, you'll need a small amount of USDC (for dues) and potentially a tiny amount of ETH for gas fees (fractions of a cent). As we roll out gas sponsorship, even that ETH requirement goes away. Our goal is that for 90% of residents, this feels like using a regular website, not managing a crypto portfolio.

---

**19. What's the actual TCO including hosting, maintenance, and developer costs?**

Fair question, and we try to be transparent about it. There are three cost buckets: infrastructure (~$50–100/month for servers and Arweave storage at community scale), smart contract gas (pennies per transaction on Base), and developer/maintenance costs for ongoing improvements. Compare that to a traditional management company at $200–500/month for a small community, plus manual bookkeeping, legal storage of paper documents, and zero transparency into how decisions are made. We believe the math favors SuvrenHOA within the first year.

---

**20. Why not just use a spreadsheet and shared Google Drive?**

We get it — if it ain't broke. But consider what Google Docs and spreadsheets can't give you: tamper-proof vote records (a spreadsheet can be edited silently), permanent document storage that doesn't disappear if someone cancels a Google account, automatic dues collection that doesn't require a treasurer to chase people down, and a governance system where everyone can verify the rules haven't been changed behind their backs. SuvrenHOA is for communities that want to eliminate "trust me, I updated the spreadsheet" from their governance.

---

## 🖥️ Usability (Questions 21–30)

---

**21. My 70-year-old neighbor can barely use email — how will she vote?**

This is probably our most important usability challenge, and we take it seriously. The platform is designed with a simple web interface that works like any other website — no crypto knowledge required for basic voting. We're also building a proxy voting feature so tech-savvy neighbors or family members can assist. In the meantime, the board can facilitate assisted voting sessions where residents vote together in a community space, just like traditional in-person meetings. No one gets left behind.

---

**22. What's a "wallet"? Why do I need one for my HOA?**

Think of a wallet as your HOA membership card, but digital. It's a secure account that holds your property token (proof you own your home) and lets you sign votes, like putting your signature on a paper ballot. Unlike a bank account, no company controls it — you control it. Apps like MetaMask (for computers) or Coinbase Wallet (very user-friendly on phones) make it as simple as creating any other app account. We have step-by-step setup guides available in the Help section.

---

**23. What does "Base Sepolia" mean? Why isn't this just a website?**

It IS a website — you access SuvrenHOA through your regular browser like any other site. "Base Sepolia" just refers to which blockchain network your actions are recorded on. Think of it like this: when you use online banking, you don't think about which data center your bank uses — you just use the website. Base Sepolia is our current test network (like a practice environment), and we'll be moving to Base mainnet (the live, real version) for full production launch. The "Sepolia" part just means "we're still testing" — it's not something you need to manage.

---

**24. I clicked "Connect Wallet" and MetaMask asked me to switch networks — I panicked and closed it**

That's completely understandable! MetaMask is just asking to connect to the Base Sepolia network instead of Ethereum mainnet — it's a normal prompt, not a security risk. You can safely click "Switch Network" (or "Approve") and it won't spend any money or change anything about your existing accounts. Think of it like your phone asking to connect to a different Wi-Fi network. Next time you see that prompt, you can confidently click approve, and you'll land right in the platform. Check our Help guide for screenshots of exactly what to expect.

---

**25. Why does it say my balance is "0 ETH"? Do I need money to participate?**

A zero ETH balance is totally normal for new users and doesn't prevent you from viewing the platform or participating in most activities. ETH is only needed for tiny transaction fees (gas) when you vote or submit documents — we're talking fractions of a cent on Base. If you do need some, the board maintains a small "gas faucet" for community members — just reach out and we can send you a tiny amount to get started. Eventually, gas sponsorship will make even that unnecessary.

---

**26. I registered my pet but nothing happened — is it on the blockchain?**

Pet and vehicle registrations are currently stored in the platform's database rather than on the blockchain itself — that's intentional, since putting every piece of routine community data on-chain would be expensive and unnecessary. Your registration is saved and visible to authorized board members and community managers. If you don't see a confirmation screen or email after registering, try refreshing the page or checking your profile. If the record still doesn't appear, that's worth reporting to the board as a bug.

---

**27. The page says "No documents registered yet" — where are our CC&Rs?**

That message just means official documents haven't been uploaded to the on-chain document registry yet — it's not saying your CC&Rs don't exist! Your community's governing documents are still valid and enforceable wherever they currently live (usually with the county recorder or your HOA attorney). Uploading them to SuvrenHOA's permanent Arweave storage is on the board's task list. Once uploaded, they'll appear there permanently and be verifiable by any homeowner.

---

**28. I tried to pay dues but got an error about "insufficient gas"**

This error means your wallet doesn't have enough ETH to cover the (very small) transaction fee — not that you can't afford your dues. Even $1–2 worth of ETH is enough gas for hundreds of transactions on Base. You can get a tiny amount of ETH from a crypto exchange like Coinbase, or ask the board about our community gas faucet. The actual dues payment in USDC is a separate thing from the gas fee — you need a sliver of ETH just to "stamp the envelope," so to speak.

---

**29. Why does the Health Score say "F"? Is our community failing?**

Don't panic — the Health Score is calculated from platform adoption metrics like connected wallets, uploaded documents, and completed votes. An "F" right now just means we're early in the onboarding process and the system hasn't been fully populated yet. As more residents connect their wallets, the board uploads official documents, and the first votes are completed, that score will climb quickly. Think of it like a new gym member's fitness score — it starts low because you haven't done anything in the app yet, not because you're unhealthy.

---

**30. I see "Lot #2" but my actual address is 456 Faircroft Drive — where's my address?**

The platform currently uses lot numbers as the primary identifier because they're the official legal reference in property records and the county database. Your street address is associated with your lot number in the system — it's just displayed by lot for consistency. We're working on adding a "display as address" option so residents see their familiar street address rather than the lot number. In the meantime, the board can confirm which lot number corresponds to which address in the community map.

---

## 🗳️ Governance (Questions 31–40)

---

**31. What's a "soulbound NFT" and why can't I sell my property token?**

A "soulbound" token is just a digital token that's tied to you and can't be transferred to someone else. Your property NFT works like a membership card — it proves you're a Faircroft homeowner, and it wouldn't make sense for you to sell that proof of membership separately from your actual house. When you sell your home, the property NFT gets retired and a new one is issued to the buyer. It can't be sold on OpenSea or traded like a speculative asset — it's purely a governance credential, not an investment.

---

**32. What happens to my NFT when I sell my house?**

When your home sale closes, the property transfer process includes an NFT handoff as part of onboarding the new owner. Your old NFT is burned (permanently deactivated), and a new one is minted for the buyer. Neither you nor the buyer needs to be a crypto expert — the title company or HOA administrator initiates the process, similar to how they'd handle the transfer of any membership documentation. The blockchain record of ownership stays accurate automatically.

---

**33. Can I delegate my vote if I'm on vacation?**

Yes — vote delegation is a supported feature. You can assign your voting power to a trusted neighbor, family member, or even a board member for a specific proposal or a defined time period. This is actually more flexible than most traditional HOA systems, where missing a meeting means your voice simply isn't heard. Delegation is revocable at any time, so if you come back from vacation and want to vote yourself, you can pull back the delegation before the proposal closes.

---

**34. What's a quorum? What if not enough people vote?**

A quorum is the minimum percentage of homeowners who need to participate for a vote to be valid — it prevents a tiny minority from making decisions on behalf of everyone. SuvrenHOA's quorum requirements are set to match NC HOA law (NCGS Chapter 47F). If quorum isn't met, the proposal doesn't pass by default and can be re-submitted with more outreach and time. The platform sends reminders as voting deadlines approach to help maximize participation.

---

**35. Can proposals be emergency-fast-tracked?**

Yes, for genuine emergencies (roof collapse, urgent repairs, legal deadlines), the board can submit a proposal with a shortened voting window. Emergency proposals still require quorum and a majority vote — they just have accelerated timelines. The emergency designation is logged on-chain, so the community can see exactly when and why an accelerated process was used, preventing abuse of the emergency label. Routine matters can't be laundered as emergencies just to avoid scrutiny.

---

**36. What if someone submits a malicious proposal?**

Any homeowner can flag a proposal as potentially harmful, and the board has the ability to remove proposals that violate community rules or applicable law before they go to a vote. More importantly, even if a malicious proposal somehow passed, it still couldn't automatically execute anything illegal — the smart contracts are programmed to reject actions that violate their own governance rules. Think of it as having both a democratic check (voting it down) and a constitutional check (contracts that refuse illegal instructions).

---

**37. How do I propose something? The "Create Proposal" button is confusing**

The Create Proposal flow walks you through it step by step: you give your proposal a title, write a description of what you want to change or do, set a voting window, and submit. If it involves treasury spending, you'll add the amount and destination. After submission, it goes into a brief review period before opening for community voting. If you're unsure about any step, reach out to the board or a neighbor with more platform experience — we want more homeowners proposing things, not fewer.

---

**38. What are the 4 voting tiers? Why does my neighbor have more power?**

The four tiers reflect property size and community engagement, not wealth or status. A homeowner with a larger lot has a proportionally larger stake in decisions about landscaping, drainage, and shared spaces — similar to how some HOAs weight votes by square footage. Engagement tiers reward homeowners who participate consistently in community governance. The tiers are transparent and visible in your profile — you can see exactly which tier you're in and what it would take to move up. No tier has veto power; it's weighted, not winner-take-all.

---

**39. Can the board override a community vote?**

No — and this is one of the core promises of the platform. Once a proposal passes (or fails) through a legitimate community vote that meets quorum, the outcome is recorded on-chain and the board cannot reverse it unilaterally. The board's role is to implement what the community decides, not override it. If the board disagrees with a vote outcome, they can submit a counter-proposal through the same process everyone else uses. No backroom reversals.

---

**40. What happens to votes if the blockchain goes down during voting?**

"The blockchain going down" in the way a website crashes is extremely unlikely for Base — it's a globally distributed network with no single point of failure. However, if the SuvrenHOA website itself were temporarily unavailable, votes already cast are permanently recorded on-chain and can't be lost. Any votes not yet submitted would need to be cast once the site is back up. For critical votes near their deadline, the board can extend the voting window if a documented outage affected participation.

---

## ⚖️ Legal (Questions 41–50)

---

**41. Is a blockchain vote legally binding in North Carolina?**

North Carolina's Uniform Electronic Transactions Act (NCGS Chapter 66, Article 40) recognizes electronic records and signatures as legally valid, which provides a strong foundation for blockchain-based governance. SuvrenHOA is designed to meet the voting requirements of NCGS Chapter 47F (the NC Planned Community Act), including proper notice, quorum, and record-keeping. We're working with legal counsel to ensure full compliance, and we'd always recommend the HOA maintain its relationship with an HOA attorney for any legally sensitive decisions.

---

**42. Can we be sued for using blockchain governance?**

Any HOA governance method carries theoretical legal risk — traditional paper-ballot HOAs get sued too. The key is following proper procedures, maintaining accurate records, and complying with NC HOA statutes, all of which SuvrenHOA is designed to facilitate. In some ways, blockchain governance reduces legal risk by creating an immutable, timestamped record of every vote and decision that can't be retroactively altered. "The records were changed" is a common HOA lawsuit claim that becomes much harder to make when records are on-chain.

---

**43. Does this comply with NC HOA statutes (NCGS Chapter 47F)?**

SuvrenHOA is designed with NCGS Chapter 47F compliance as a foundational requirement. This includes proper notice periods for votes, quorum requirements, record-keeping obligations, and homeowner rights to inspect records. The platform automates compliance with these requirements rather than relying on a treasurer or secretary to remember them. That said, we recommend the community maintain a relationship with an HOA attorney who can review specific decisions and flag any edge cases where manual compliance steps are needed.

---

**44. What if a court orders us to change a vote outcome?**

Courts have authority over HOAs regardless of what governance technology they use. If a court ordered a vote to be invalidated or a decision reversed, the board would comply — a smart contract doesn't prevent legal compliance. The multi-sig controllers can execute whatever actions a court order requires, including reversals, refunds, or record corrections. Blockchain governance doesn't put the HOA above the law; it just makes the record-keeping more transparent and tamper-resistant.

---

**45. Who's liable if the smart contracts malfunction?**

This is an evolving area of law, and we want to be honest that clear legal precedent doesn't exist for every scenario. The HOA, as the operating entity, retains ultimate legal responsibility for community governance regardless of the technology used. EliteDevs, as the platform developer, carries responsibility for software defects under the terms of the development agreement. The platform carries errors & omissions coverage, and the smart contracts are designed with safeguards to minimize malfunction risk. Before mainnet launch, a full legal review of liability allocation will be completed.

---

**46. Are we still required to hold in-person annual meetings?**

Yes — NC HOA law requires annual meetings, and SuvrenHOA doesn't replace that requirement. What it does is make those meetings more productive. Instead of spending an hour counting paper ballots, the annual meeting becomes a time for community discussion about the results of governance that's already happened on-chain, planning for the coming year, and addressing questions that didn't fit neatly into a proposal format. The platform supplements in-person governance; it doesn't eliminate the human connection that community is built on.

---

**47. Can a homeowner challenge a blockchain vote in court?**

Absolutely — any homeowner retains all their legal rights regardless of the platform. If a homeowner believes a vote was improper (insufficient notice, fraudulent participation, procedural violation), they can challenge it in court just as they would with any HOA vote. The blockchain record actually benefits honest challenges because every vote, timestamp, and notice is permanently documented and can be subpoenaed and verified. If the process was followed correctly, the on-chain record is your best defense. If it wasn't, that record helps the challenger too.

---

**48. Is our treasury classification as a multi-sig legal for HOA funds?**

NC HOA law requires fiduciary management of community funds but doesn't prescribe the specific banking or custody mechanism in detail. Multi-signature wallets are a custody structure, like requiring two signatories on a check — a practice that's widely accepted in traditional HOA governance. We're working with legal counsel to ensure the multi-sig structure satisfies fiduciary requirements and recommend the community also maintain a traditional bank account for any situations where on-chain funds are legally required to be held in FDIC-insured accounts.

---

**49. What about data privacy — GDPR, CCPA?**

Most Faircroft homeowners are in North Carolina, so CCPA (California) doesn't directly apply, but SuvrenHOA is designed with strong privacy principles regardless. Personal data like your name, address, and contact information is stored in the platform's private database, not on the public blockchain. What's on-chain is minimal: lot numbers, vote tallies, and document hashes (fingerprints that verify authenticity without revealing content). Residents can request a full export or deletion of their off-chain personal data at any time.

---

**50. Who owns the intellectual property — EliteDevs or the HOA?**

The HOA's data — your votes, your documents, your community records — belongs to the HOA. EliteDevs owns the platform software and infrastructure. This distinction matters: if EliteDevs ever ceased to exist, your community data would still be yours and accessible on the blockchain and Arweave. The development agreement explicitly addresses data ownership and portability rights. We'd never design a system where your community's governance history was held hostage by a vendor relationship.

---

## 📄 Documents & Records (Questions 51–60)

---

**51. You say documents are "permanent on Arweave" — what if we NEED to delete something?**

Permanence on Arweave means a document can't be erased from history — which is actually the point for official governance records. However, "can't delete" doesn't mean "stuck with bad info." You can supersede a document by uploading a corrected or updated version and marking the old one as deprecated in the DocumentRegistry. The old version still exists in the archive (good for legal transparency), but the current, authoritative version is clearly flagged as the one in force. Think of it like how laws get amended — the old text stays in the record, the new text governs.

---

**52. What if someone uploads a document with personal info by mistake?**

This is a real risk to manage carefully. Documents on Arweave cannot be deleted, so prevention is essential. The platform requires board-level approval before any document is officially registered on-chain, giving an administrator a chance to review the content first. If a document with sensitive personal information were mistakenly registered, the next step would be: marking it deprecated, uploading a redacted version as the authoritative document, and notifying affected parties. It's not a perfect solution, but it's why we require review before registration.

---

**53. How do I verify a document is authentic?**

Every document registered on-chain has a cryptographic hash — a unique digital fingerprint. If you have the document (downloaded from the platform) and want to verify it hasn't been tampered with, you can compare its hash against the one stored in the DocumentRegistry smart contract. It's like a wax seal on an envelope: if the fingerprints match, the document is genuine. This verification process will be built into the platform's UI so you won't need to be technical to use it — a simple "Verify" button will do the check automatically.

---

**54. Can documents be updated or do we have to upload a new version every time?**

New version every time — but that's by design, not a limitation. Every change to an official document creates a permanent, timestamped record of what changed and when. This is actually better than editing a PDF on Google Drive, where changes can be made silently without anyone knowing. The DocumentRegistry keeps a version history so you can see the current document, the previous version, and when each was adopted. For routine updates (like meeting minutes), uploading a new version is quick and keeps the record clean.

---

**55. Where are the documents physically stored? What country?**

Arweave is a decentralized storage network, which means your documents aren't stored in any single data center or country — they're replicated across thousands of nodes around the world. This is actually more resilient than storing them on a US server that could be seized, flooded, or shut down. The data itself is encrypted in transit and the content is publicly retrievable by anyone with the document hash, which is why you should never upload documents containing sensitive personal information (see Q52).

---

**56. What if Arweave goes out of business?**

Arweave's business model is specifically designed to make this scenario unlikely: storage fees are paid upfront in a way that's designed to fund storage for 200+ years through an endowment model. But even if Arweave somehow ceased to operate, the data is replicated widely enough across independent nodes that it would persist beyond the company. Additionally, SuvrenHOA maintains off-chain backups of all registered documents. Losing documents because Arweave "went out of business" is one of the lower risks in the system — far lower than a management company losing paper records in a flood.

---

**57. How long is "permanent" really?**

Arweave's design targets 200+ years of storage through its endowment model. For context, your HOA's CC&Rs are probably 20–30 years old. We're talking about storage that outlasts your house, your grandchildren, and probably the HOA itself. "Permanent" in the crypto context means "as long as the network exists and the economic incentive to store it holds," which is substantially more durable than a filing cabinet, a hard drive, or a cloud account that someone could forget to renew. It's the most durable document storage option available to an HOA today.

---

**58. Can I download documents or only view them online?**

You can download documents — that's a core feature, not an afterthought. Since documents are stored on Arweave, they have a public URL you can access directly, and the platform provides a download button on every registered document. You can save local copies of your CC&Rs, bylaws, meeting minutes, and financial reports. We'd actually encourage it — having a local copy is good practice, and it means you're never dependent on the platform being online to access your governing documents.

---

**59. Are uploaded documents encrypted?**

Community governance documents like CC&Rs, bylaws, and meeting minutes are stored unencrypted on Arweave — this is intentional, because community governance should be transparent and publicly verifiable. Documents containing sensitive information (like a financial audit with individual payment details) should be uploaded in redacted form, or stored in the platform's private database rather than the public document registry. The board has guidance on what's appropriate for public vs. private storage, and we're building clearer UI distinctions between the two.

---

**60. Who can upload documents? Just the board?**

Currently, official document registration to the on-chain DocumentRegistry is restricted to board members and authorized administrators — this maintains the integrity of the official record. However, community members can submit documents for board consideration through the platform, and the board can then register them officially. For future versions, we're exploring a proposal-based document submission process where the community could vote to officially register important documents submitted by any homeowner.

---

## 🏦 Treasury (Questions 61–70)

---

**61. How do I know the treasury balance is real and not faked?**

The treasury is a smart contract on the public Base blockchain — you can verify the balance yourself at any time using a free blockchain explorer like Basescan. No one, including the board, can display a fake balance on the platform because the balance comes directly from the blockchain, not from a database the platform controls. It's like being able to walk into a bank vault and count the money yourself, except you can do it from your phone in 30 seconds.

---

**62. Can I see every single transaction? Where?**

Yes — every transaction in and out of the FaircroftTreasury contract is permanently recorded on the blockchain and publicly viewable. The SuvrenHOA dashboard displays transaction history in a readable format, and for the technically curious, the raw transaction history is available on Basescan by searching the treasury contract address. Every dues payment, vendor payment, and budget transfer has a timestamp, amount, destination, and authorization record. No more "trust me, the books are clean."

---

**63. What prevents the board from creating secret wallets?**

Nothing prevents anyone from creating a new crypto wallet — that's a feature of blockchain, not a bug. What matters is that the *official* FaircroftTreasury smart contract is the designated custodian of HOA funds, and dues payments route there automatically. Any board member using personal or shadow wallets for HOA funds would be violating their fiduciary duty and potentially committing fraud, just as they would with a traditional bank account. The transparent treasury makes it much easier to audit whether all dues collected match treasury inflows, which is an additional safeguard.

---

**64. How does the auto-split work? Can percentages be changed?**

When dues come in, the smart contract automatically allocates them to pre-set budget categories (like maintenance, reserves, and operations) without requiring a manual transfer. The percentage splits are set by community governance — meaning a proposal and vote are required to change them. No board member can quietly reshuffle the budget ratios; any change requires community approval and is permanently recorded. You can see the current split ratios on the Treasury page at any time.

---

**65. What if we need to make an emergency payment not in the budget?**

Emergency expenditures outside the approved budget can be authorized through an emergency proposal (see Q35) with an accelerated voting window. For genuine life-safety emergencies (like a broken fire suppression system), the multi-sig controllers can approve an emergency payment immediately and then seek ratification from the community retroactively within a defined window. This mirrors how most HOAs handle true emergencies — act first, document and seek approval as quickly as possible.

---

**66. Can residents request a financial audit?**

Yes — and under NC HOA law, residents already have this right. SuvrenHOA makes it easier to exercise that right because the transaction history is publicly available on-chain without requiring a formal records request. For a full CPA-level audit, residents can petition the board through a formal proposal, and if it passes, the board is required to commission one. The on-chain transparency means an auditor's job is significantly easier — the records are complete, timestamped, and tamper-proof.

---

**67. Is the treasury insured by FDIC or equivalent?**

No — FDIC insurance applies to USD held in FDIC-member bank accounts, not to USDC in a smart contract. This is a real difference from traditional HOA treasury management, and we're honest about it. The structural protections (multi-sig, time-locks, transparent on-chain records) are designed to compensate for the lack of deposit insurance, but they're not the same thing. We recommend the HOA maintain a traditional operating account for funds that benefit from FDIC protection, using the on-chain treasury for governance-controlled funds.

---

**68. What happens to the treasury if we dissolve the HOA?**

HOA dissolution is governed by NC law and the community's governing documents, regardless of where the funds are held. The dissolution process would include a community vote on how to distribute treasury funds — the same governance process used for any major financial decision. The smart contract can execute distributions according to whatever plan the community votes to approve. Dissolution of the HOA doesn't mean the funds are stuck or lost; the multi-sig controllers can execute whatever legally required distribution the process demands.

---

**69. Can we earn interest or yield on treasury funds?**

This is possible — USDC held in certain DeFi protocols can earn modest, relatively stable yields (think 3–5% APY from lending protocols). Whether to do so is a governance decision the community would need to vote on, because yield-generating strategies carry some additional risk compared to just holding USDC. For now, the treasury is designed to be conservative (hold USDC, don't speculate). If the community wants to explore yield generation, it can be proposed, debated, and voted on through normal governance channels.

---

**70. Why USDC and not regular dollars?**

USDC is a stablecoin pegged to the US dollar — $1 USDC = $1 USD, always. Using USDC lets the platform automate dues collection, budget splits, and vendor payments through smart contracts without the delay and cost of traditional bank transfers. It's not "crypto" in the scary speculative sense; it's more like a digital dollar that can be programmed. When you pay dues in USDC, there's no exchange rate risk, no volatility, no "my dues payment lost 30% of its value overnight." It's just dollars, with automation superpowers.

---

## 🔧 Technical (Questions 71–80)

---

**71. What if there's a bug in the smart contract after deployment?**

Smart contract bugs are a real risk, which is why the contracts are being audited before mainnet launch and why the testnet phase exists — to find bugs before real money is involved. If a bug were discovered post-launch, the multi-sig controllers can pause affected functions (like treasury disbursements) while a fix is developed. The platform also maintains an emergency pause function for exactly this scenario. No software is bug-free, but the layered safeguards mean a bug doesn't have to become a catastrophe.

---

**72. Can contracts be upgraded?**

The core governance contracts use an upgradeable proxy pattern, which means the logic can be updated without losing the stored data (votes, records, balances). Any upgrade requires multi-sig approval and, for significant changes, a community governance vote. This is different from most traditional software where a vendor can silently push updates — SuvrenHOA upgrades require documented authorization and community visibility. The upgrade process itself is logged on-chain so there's a permanent record of every version change.

---

**73. What's the difference between Base Sepolia and Base mainnet?**

Think of it like a training simulation vs. the real game. Base Sepolia is a test network where everything works exactly like the real thing, but the money is fake (test tokens that have no real value). It's where we build, test, and make mistakes safely before going live. Base mainnet is the real network where real USDC and real governance decisions live. SuvrenHOA is currently on Sepolia while we complete testing and audits. Mainnet launch is the milestone where it becomes fully "real."

---

**74. Is this a testnet? Why are we testing on real community data?**

Yes, currently on Base Sepolia testnet — and that's actually the right approach. Using real community data (with test money, not real money) lets us find friction points in the user experience before the stakes are high. No real funds are at risk during the testnet phase. Think of it like a fire drill: you're using the real building, the real evacuation routes, the real people — but there's no actual fire. The community data helps surface real-world usability issues that a purely synthetic test wouldn't catch.

---

**75. What's our disaster recovery plan?**

The architecture is inherently distributed, which means there's no single server to recover from. Smart contract data lives on the blockchain (globally replicated), documents live on Arweave (globally replicated), and the website is hosted with standard cloud infrastructure. The disaster recovery plan covers: website frontend outage (redeploy from backup in <1 hour), blockchain disruption (data is preserved; front-end reconnects when network stabilizes), and full scenario planning for rare worst-case events. Full DR documentation is maintained and will be available in the document registry.

---

**76. Who maintains the website? What if EliteDevs disappears?**

EliteDevs currently maintains the platform, but SuvrenHOA is designed to survive EliteDevs. The smart contracts are autonomous — they keep running on the blockchain whether EliteDevs exists or not. The frontend code is version-controlled and the community has rights to the codebase. If EliteDevs ceased to exist, another developer could redeploy the frontend and reconnect it to the same contracts. Your governance history, property records, and treasury are not locked inside EliteDevs' servers.

---

**77. What's the uptime guarantee?**

The smart contracts (the core of the system) have the uptime of the Base network, which targets 99.9%+ availability. The website frontend is hosted on standard cloud infrastructure with similar SLA targets. In practice, if the SuvrenHOA website were down, homeowners could still interact directly with the smart contracts via other tools (like Etherscan or MetaMask's built-in interface) for critical actions like voting. We'll publish a formal SLA and incident notification process before mainnet launch.

---

**78. Can this handle 500 homes? 5,000?**

Absolutely — the architecture is designed to scale well beyond Faircroft's current size. Base L2 can process hundreds of transactions per second at low cost, and the platform's infrastructure is cloud-hosted with horizontal scaling capability. A community of 5,000 homes voting simultaneously would be well within design parameters. The Arweave storage is also limitless in practical terms. If SuvrenHOA expands to serve multiple HOAs, each community gets its own isolated set of contracts and data — they don't share governance.

---

**79. What APIs does this depend on? What if they go down?**

The platform depends on: a Base RPC provider (for blockchain reads/writes), an Arweave gateway (for document access), and standard web hosting. For each dependency, we maintain fallback providers — if the primary Base RPC goes down, the platform switches to a backup. Arweave content is replicated widely enough that gateway outages are transparent to users. The critical blockchain data itself (votes, treasury, property records) doesn't disappear when an API goes down; it's just temporarily inaccessible until the connection is restored.

---

**80. Is there a mobile app?**

The platform is currently a responsive web application, which means it works well on mobile browsers (Chrome, Safari, Brave on iOS and Android) without requiring an app download. Mobile wallet apps like MetaMask Mobile and Coinbase Wallet can connect seamlessly to the web app. A dedicated native mobile app is on the roadmap for a future version, but the web experience on phones is designed to be fully functional in the meantime. You won't need to go to a desktop computer to vote or check the treasury.

---

## 🏘️ Community (Questions 81–90)

---

**81. What if my neighbor sends me harassing messages through the platform?**

Harassment through community platforms is a real issue that HOAs have always had to manage. SuvrenHOA has message reporting and blocking features, and the board has moderation tools to remove abusive users' communication privileges. Reports of harassment are logged and can be used in the formal HOA enforcement process just like any other documented code violation. The platform doesn't give harassers any special protection — it actually creates a clearer paper trail for addressing the behavior than informal verbal altercations would.

---

**82. Can the board see my private messages?**

Direct messages between community members are private and not accessible to the board through normal platform functions. Board administrators have limited access to flagged/reported messages for moderation purposes only — not routine surveillance. The community messaging system is designed for neighbor-to-neighbor communication, not board oversight of private conversations. If you have concerns about communication privacy, you're always free to communicate with neighbors through channels outside the platform.

---

**83. How do I block someone?**

You can block any community member from contacting you through the platform directly from their profile or from any message they've sent you. A blocked user can't send you direct messages, but can still participate in community-wide discussions (which you'd still see). Blocking is private — the blocked person isn't notified. The block list is managed in your account settings and can be modified at any time.

---

**84. Is the community forum moderated?**

Yes — board members and designated community moderators can remove posts that violate community guidelines. The moderation policy mirrors the community's existing rules of conduct, the same standards that apply to behavior at in-person meetings. We're working on a community-drafted set of forum guidelines that will be adopted through a governance vote. Moderation actions are logged (though not necessarily public) to prevent arbitrary or retaliatory removals.

---

**85. What if someone posts inappropriate content?**

Report it using the flag/report button on any post — it goes directly to board moderators for review. Clearly inappropriate content (explicit material, threats, doxxing) will be removed quickly. For borderline cases, the moderation team reviews against community guidelines before acting. Repeat offenders can have their forum access restricted or removed by the board through the standard enforcement process. The goal is a forum where neighbors can discuss community matters frankly without it becoming a free-for-all.

---

**86. Can I opt out of the messaging system?**

Yes — you can set your messaging preferences to decline direct messages from anyone other than board administrators. You can also set notifications to off entirely if you prefer not to receive platform alerts. The governance functions (voting, proposals, document access) remain fully available regardless of your messaging preferences. You don't have to participate in the social layer to be a full participant in community governance.

---

**87. Who sees my pet and vehicle registrations?**

Pet and vehicle registrations are visible to board members and community administrators — they're operational information used for parking enforcement, gate access, and neighborhood safety. Other residents don't have access to your registration details. Your information is used for community management purposes only and isn't shared outside the HOA. NC HOA law actually requires communities to maintain resident vehicle records for certain enforcement purposes, and the platform handles that requirement while keeping the data appropriately restricted.

---

**88. Can I be anonymous in the neighborhood watch reports?**

You can submit neighborhood watch reports with a "request anonymity" flag, which masks your identity from other residents viewing the report. Board members can see the submitter for follow-up purposes, but the identity isn't shared publicly. This is similar to how anonymous tips work with local police — you can report without your name being attached, but the system maintains some traceability for legitimate follow-up. Full anonymous submissions where even the board doesn't know who submitted are available for safety-critical reports.

---

**89. Is my voting history public?**

Your vote on any specific proposal is associated with your wallet address on-chain, but since your wallet address isn't publicly linked to your name (unless you've chosen to publish that link somewhere), your individual votes are practically private. The only people who could connect your wallet to your votes are those who already know your wallet address. Aggregate voting data (total votes for/against) is always public — that's the point of transparent governance. Individual ballot privacy is maintained as a default.

---

**90. Can someone figure out which wallet is mine?**

It requires effort and isn't available through the platform UI. On a technical level, if someone knew your wallet address (which you might share when setting up your account), they could see your on-chain activity. The platform doesn't publish a directory linking wallet addresses to names or addresses. We'd recommend using a fresh wallet specifically for your HOA activities rather than a wallet you use for other crypto transactions, which further separates your identity. This is standard privacy hygiene for any blockchain application.

---

## 📅 Practical / Day-to-Day (Questions 91–100)

---

**91. What happens if I forget to vote on a proposal?**

Life happens — and the platform is designed for that reality. If a proposal closes without your vote, the outcome stands based on those who did participate (as long as quorum was met). Your non-participation doesn't count as a "no" — proposals require active votes to pass or fail. The platform sends reminder notifications as proposal deadlines approach to give you the best chance of participating. For ongoing issues you care about, you can set up alerts so important proposals never sneak by.

---

**92. How do I get notified about new proposals?**

Notification settings are in your account profile — you can opt into email alerts, in-app notifications, and (in future versions) SMS or push notifications for new proposals, upcoming vote deadlines, and treasury activity. The platform also sends mandatory notice for any proposal that meets a significance threshold (as required by NC HOA law), ensuring you always get formal notice for major decisions. You'll never find out after the fact that a significant vote happened without you being notified.

---

**93. Can I use this on my phone?**

Yes — the platform is fully functional on mobile browsers. On iOS, Safari or Chrome work well with MetaMask Mobile or Coinbase Wallet for signing transactions. On Android, Chrome with MetaMask Mobile is the most common setup. The interface automatically adjusts for smaller screens, and all core functions (voting, viewing proposals, checking treasury, reading documents) are accessible on mobile. The experience isn't identical to desktop but it's fully functional for everything you'd need to do day-to-day.

---

**94. What if the website is down when dues are due?**

The website being temporarily down doesn't invalidate your payment obligation, but you also shouldn't be penalized for a platform outage. We're building in a grace period that automatically extends if a documented platform outage occurs near a dues deadline. Additionally, the board will always maintain an alternative payment method (traditional bank transfer or check) as a backup for exactly these situations. Platform outages are announced via email and through community channels so you know to use the backup method.

---

**95. Can I pay dues with a credit card?**

Currently, dues are paid in USDC (digital dollars) through your crypto wallet. A credit card on-ramp is on the roadmap — services like Coinbase Pay allow you to buy USDC directly with a credit or debit card without needing a full crypto exchange account. In a future version, we aim to make the dues payment experience feel as simple as any online bill payment, with credit card support built in. Until then, the board can assist new residents with setting up USDC funding.

---

**96. Is there a grace period for late dues payments?**

Yes — the grace period policy is set by the community's governing documents and matches whatever period your CC&Rs specify (typically 15–30 days). The smart contract enforces this automatically: dues become "late" after the deadline, but the late fee applies only after the grace period expires. Everything is transparent and automated — no one gets a surprise late fee because a treasurer forgot to update a spreadsheet. Grace period parameters are visible in the governance settings and can only be changed by community vote.

---

**97. What if my property NFT has wrong info (wrong sqft, wrong address)?**

Contact the board or submit a correction request through the platform. Property NFT metadata corrections require board-level authorization and a verified property record (like your deed) to update. The correction is logged on-chain with a timestamp showing what was changed and when — there's a transparent audit trail for every modification. We'd rather have accurate records and a correction history than silently wrong data. Corrections can typically be processed within a few business days.

---

**98. Can I transfer my property to my spouse or trust?**

Yes — property transfers to spouses or trusts are a supported use case. This is a structured process: you'd submit a transfer request with the relevant legal documentation (deed transfer, trust documents), the board verifies the legal transfer, and the property NFT is burned and reissued to the new wallet address associated with the spouse or trust. This mirrors how you'd notify a traditional HOA of a deed change. We've specifically designed the process to accommodate estate planning scenarios, which are common in established neighborhoods.

---

**99. What happens during a power outage — can I still access my records?**

Your blockchain records don't go anywhere during a power outage — they're on a globally distributed network, not your local power grid. Once power is restored and you have internet access, all your governance records, documents, and transaction history are right where you left them. For people on battery backup or using mobile data, the platform remains accessible during local outages. The only thing a local power outage affects is your ability to access the internet — the data itself is as safe as the internet is.

---

**100. If this is so great, why isn't every HOA using it?**

That's a fair challenge, and the honest answer is: we're early. Blockchain-based HOA governance is genuinely new technology, and most of the 370,000 HOAs in the United States are still using 1990s-era paper and email processes. SuvrenHOA is part of a small wave of communities willing to try something better while the technology matures. The barriers are real — learning curve, regulatory uncertainty, and the inertia of "we've always done it this way." But the same was true of online banking in 2000, and now it's unremarkable. Faircroft has the opportunity to be ahead of that curve, not chasing it.

---

*Last updated: March 2026 | SuvrenHOA Platform — Faircroft Community, Raleigh, NC*

*Questions not covered here? Submit a community question through the platform or bring it to the next board meeting.*
