<!-- Source of truth restored from v7 PDF on 2026-04-09. Previous MD was stale by 12 claims. -->

# SuvrenHOA Provisional Patent Application

## FIELD OF THE INVENTION

The present invention relates to decentralized governance systems, and more particularly to
blockchain-based homeowners association (HOA) management platforms utilizing soulbound
non-fungible tokens (NFTs), tiered category-specific quorum voting mechanisms, automated
treasury fund allocation with multiple spending pathways, immutable decentralized document
registries, community micro-lending programs, and composite health scoring algorithms
deployed on Layer 2 blockchain networks.

## BACKGROUND OF THE INVENTION

Traditional homeowners associations suffer from seven major systemic problems that limit
their effectiveness:
1. Opacity and Centralized Control. Governance decisions are made behind closed doors by
board members with limited community oversight. Voting records, financial disclosures, and
decision rationales are often unavailable or buried in paper archives. HOA members have no
verifiable way to confirm that their votes were counted.
2. Inflexible Voting Mechanisms. Most HOAs use simple majority voting for all decisions,
treating a routine maintenance vote the same as a constitutional change. This fails to capture
the differential urgency and risk profiles of different decision classes.
3. Inefficient Treasury Management. HOA funds are often commingled across operational
and reserve accounts, making it difficult to audit spending or enforce spending limits. There
are no mechanisms for automated, transparent fund segregation or for community-based yield
optimization.
4. Document Management Fragmentation. Critical documents (CC&Rs, meeting minutes,
budgets, resolutions) are scattered across paper files, email attachments, and multiple digital
repositories. Verification of document authenticity and determination of supersession chains
are manual and error-prone.
5. Lack of Financial Flexibility for Dues Payments. HOA members facing temporary
financial hardship have no option other than paying full dues in advance or accruing liens and
penalties. There is no community-based lending mechanism to bridge short-term payment
gaps.
6. Inability to Assess Community Health Longitudinally. HOAs lack quantitative metrics to
measure governance health, financial stability, and member satisfaction over time.
Decision-making is reactive rather than data-driven.
7. Poor Integration of Modern Technology. Most HOAs rely on legacy software that does
not leverage blockchain, cryptographic verification, or decentralized networks. This leaves
HOAs vulnerable to data loss, vendor lock-in, and inability to prove historical accuracy.
Prior art in blockchain governance (e.g., Compound, Aave) addresses voting and treasury
management, but does not solve the HOA-specific problems of property identity verification,
soulbound ownership transfers, tiered governance categories, immutable document
registration, dues-based lending, or composite health scoring integrated with on-chain treasury
5

data.

## SUMMARY OF THE INVENTION

The SuvrenHOA platform is a comprehensive blockchain-based governance system designed
specifically for homeowners associations. It consists of seven integrated inventive subsystems:
1. Soulbound Property NFT System (PropertyNFT Contract). Each property is represented
by a soulbound (non-transferable except through board-approved sales) ERC-721 token
(tokenId = lotNumber). The token carries one voting power unit, ensuring one-lot-one-vote
governance. Property metadata (lot number, street address, square footage, dues payment
history) is stored on-chain. Transfer restrictions use a two-step approval mechanism: board
approves a transfer, then the new owner executes the transfer transaction.
2. Tiered Governance with Category-Specific Quorums (FaircroftGovernor Contract).
Proposals are classified into four categories: Routine (15% quorum, simple majority, 2-day
timelock), Financial (33% quorum, simple majority, 4-day timelock), Governance (51%
quorum, simple majority, 4-day timelock), and Constitutional (67% quorum, 2/3
supermajority, 7-day timelock). Quorum percentages, pass thresholds, and timelock delays are
independently configurable per category. Rate limiting prevents proposal spam (max 10 active
proposals at any time).
3. Automated Treasury Management with Configurable Fund Segregation
(FaircroftTreasury Contract). The Treasury maintains two internal ledgers: operating
balance (80% by default, configurable via governance) and reserve balance. Dues are collected
with automatic late fees (10% by default) and grace periods (30 days by default). Annual
discount (5% by default) applies when members pay all four quarterly dues at once. Two
expenditure paths exist: governance-gated (via Timelock) for planned spending, and
emergency spending (TREASURER_ROLE only, per-period limit) for urgent costs.
4. Immutable Document Registry with Dual Storage (DocumentRegistry Contract).
Documents are registered with SHA-256 content hashes and stored on Arweave (permanent
storage) and IPFS (decentralized access). Documents are categorized into 10 types (CC&Rs,
Minutes, Budget, Amendment, Resolution, Financial, Architectural, Notice, Election, Other).
Supersession chains are tracked, allowing the registry to identify the latest version of any
document.
5. Community Micro-Loan Program (DuesLending Contract). The Treasury reserve funds
a community lending program for members facing temporary payment hardship. Loans are
originated by the board, carry 5% annual interest (configurable), and are repaid in 2-12
monthly installments. Loans pay dues directly to the Treasury on behalf of borrowers. During
active loans, property tokens are locked to prevent transfer. Defaults are handled through
governance, never through automated liquidation.
7

6. Treasury Yield Management Integration (TreasuryYield Contract). A
YIELD_MANAGER_ROLE can deploy reserve funds to external yield-bearing protocols
(e.g., Aave V3) and return yield to the Treasury. This allows the community to earn passive
income on idle reserves while maintaining governance control. Risk tolerance levels
(Conservative 30%, Moderate 50%, Aggressive 80%) cap the maximum percentage of reserves
that may be deployed, and are configurable via governance vote.
7. Composite Community Health Scoring Algorithm (HealthScorer Module). A
computational module (implemented as an on-chain view function or off-chain data pipeline)
calculates a composite health score from five weighted metrics: (a) Financial Health (40%):
reserve-to-annual-dues ratio; (b) Governance Health (25%): proposal participation rate; (c)
Compliance Health (20%): dues delinquency rate; (d) Member Retention (10%): membership
churn rate; (e) Treasury Efficiency (5%): expenditure-to-budget variance. The health score
trends over time provide early warning signals for financial stress or governance breakdown.
Together, these seven subsystems enable HOA communities to transparently manage property
ownership, make tiered governance decisions with category-appropriate quorum thresholds,
allocate treasury funds flexibly, maintain immutable historical documents, provide financial
relief through community lending, optimize idle capital through yield management, and assess
community health longitudinally through quantitative scoring.
8

## BRIEF DESCRIPTION OF THE DRAWINGS

FIG. 1 is a system architecture overview diagram showing the seven core smart contract
modules deployed on Base Layer 2: PropertyNFT, FaircroftGovernor, FaircroftTreasury,
DocumentRegistry, DuesLending, TreasuryYield, and HealthScorer, with external
dependencies on Arweave, IPFS, and optional yield protocols.
FIG. 2 is a PropertyNFT Lifecycle State Diagram showing the lifecycle of a property token
from minting through active ownership, pending transfer, transfer approval, loan lock, and
eventual transfer completion.
FIG. 3 is a Governance Proposal State Machine diagram for the FaircroftGovernor contract,
illustrating the four proposal categories (Routine, Financial, Governance, Constitutional) with
their respective quorum thresholds, voting periods, and timelock delays.
FIG. 4 is a Treasury Fund Flow Diagram showing the two-ledger structure (operating and
reserve) with automatic dues splitting at configurable basis-point ratios, late fee application,
annual discount mechanics, and two expenditure paths (governance-gated and emergency).
FIG. 5 is a Document Registration and Verification Workflow diagram illustrating the
hash-based on-chain storage with SHA-256 hashes, full documents on both Arweave
(permanent) and IPFS (decentralized access), and the supersession tracking mechanism for
document versioning.
FIG. 6 is a Community Health Score Computation Diagram showing the calculation of the
composite health score from five weighted metrics: Financial Health (40%), Governance
Health (25%), Compliance Health (20%), Member Retention (10%), and Treasury Efficiency
(5%), with interpretation bands.
FIG. 7 is a Frontend Application Architecture diagram showing the Next.js App Router-based
user interface for property management, governance participation, treasury access, document
registry browsing, and health score monitoring.
FIG. 8 is a DuesLending Loan Lifecycle State Machine diagram showing loan origination,
payment-to-treasury routing, property token locking, repayment milestones, and default
handling through governance.
FIG. 9 is a TreasuryYield Deployment and Yield Cycle diagram showing deployment of
reserve funds to external yield-bearing protocols, risk tolerance level configuration, yield
harvesting, and crediting of returns to the reserve ledger.
9

## DETAILED DESCRIPTION OF THE INVENTION

I. SYSTEM OVERVIEW AND BLOCKCHAIN DEPLOYMENT CONTEXT
The SuvrenHOA system is a comprehensive blockchain-based homeowners association
management platform designed to operate on the Base Layer 2 network, an
Ethereum-compatible optimistic rollup that provides high throughput and low transaction costs
while maintaining security through Ethereum's mainnet. The platform comprises seven core
smart contract modules written in Solidity ^0.8.24 that collectively implement the governance,
treasury, property ownership, document management, lending, yield, and scoring subsystems
described herein.
A critical technical consideration for Layer 2 deployment is the unreliability of block.number
for timing purposes. Unlike Ethereum mainnet, where block height increments predictably at
12-second intervals, optimistic rollups like Base batch transactions and commit them to
Ethereum at irregular intervals, making block.number unsuitable as a time reference. The
system therefore implements EIP-6372 (Governor clock abstraction), which uses
block.timestamp (the on-chain timestamp) as the authoritative timing clock for governance
voting checkpoints, proposal deadlines, and timelock expirations. This ensures precise,
deterministic timing semantics on Layer 2 networks.
All basis-point calculations (percentages, thresholds, ratios) are performed using integer
arithmetic in units of 1/100th of one percent (10,000 basis points = 100%), enabling exact
results on blockchain virtual machines without floating-point operations. This is critical for
security and auditability, as it eliminates rounding errors and enables deterministic
reproducibility across different client implementations.
10

II. SOULBOUND PROPERTY NFT SYSTEM (PROPERTYNFT CONTRACT)
A. Overview and Role-Based Access Control
The PropertyNFT contract is an ERC-721 non-fungible token (NFT) contract that represents
property ownership within the HOA community. Each property is minted as a unique token
with tokenId equal to the property's lot number, ensuring a 1:1 mapping between properties
and tokens. Each token grants exactly one unit of voting power in governance proposals.
The contract implements role-based access control (RBAC) following the OpenZeppelin
AccessControl pattern. Key roles include: (1) REGISTRAR_ROLE, which can mint new
property tokens and approve transfers from sellers to buyers; (2) GOVERNOR_ROLE, which
can update governance parameters (such as whether soulbound restrictions are enabled); and
(3) DEFAULT_ADMIN_ROLE, which can grant or revoke roles.
In an alternative embodiment, the PropertyNFT contract defines additional specialized roles: a
LENDING_ROLE held by the DuesLending contract for lock/unlock operations during active
loans, and a SOULBOUND_ADMIN_ROLE (not granted by default; requires a Constitutional
governance proposal to grant) for enabling or disabling the soulbound transfer restriction. In
the preferred embodiment described herein, loan-lock operations are performed by the
DuesLending contract via direct setLoanLock() function calls authorized at the contract level,
and transfer-restriction configuration is managed through the GOVERNOR_ROLE via
setTransfersRequireApproval().
B. Soulbound Transfer Mechanism
A defining feature of the PropertyNFT contract is the soulbound transfer restriction, which
prevents property tokens from being transferred except through a board-approved process.
This addresses the legal requirement that property sales require HOA approval (as commonly
found in HOA CC&Rs) and ensures the HOA has an opportunity to enforce architectural
guidelines, perform due diligence, or levy transfer fees on new owners.
The transfer mechanism operates as a two-step process: (1) Seller initiates a transfer request,
specifying the recipient address and agreed-upon transfer price; (2) The REGISTRAR_ROLE
(typically a board-controlled address or automated oracle) reviews the request and, if
approved, calls approvePendingTransfer() to authorize the transfer; (3) The recipient then calls
completePendingTransfer() to finalize the transfer and receive the token.
Internally, the contract maintains a pendingTransfers mapping that stores pending transfer
requests as structs containing the current owner, new owner, expiration timestamp, and any
associated metadata. This approach maintains compatibility with the standard ERC-721
transfer interface while enforcing the soulbound restriction at the contract level.
11

C. Property Metadata and On-Chain Data Storage
Each property token is associated with on-chain metadata stored as a PropertyInfo struct in a
propertyData mapping (mapping(uint256 => PropertyInfo) propertyData), keyed by tokenId.
The PropertyInfo struct includes the following fields: (1) lotNumber: the unique identifier
matching the tokenId; (2) streetAddress: the property's physical address; (3) squareFootage:
the size of the property; (4) duesAmount: the monthly or quarterly dues owed by this property;
(5) paymentHistory: a chronological array of on-chain payment records. As used herein, the
terms "PropertyInfo struct" and "propertyData mapping entry" are interchangeable, the former
referring to the data type and the latter to the storage location.
The on-chain metadata enables the governance system to make property-aware decisions (e.g.,
tiering dues amounts by property size or location) and provides a complete, verifiable history
of property ownership and payment compliance that is immutable once recorded on the
blockchain.
D. Voting Power Delegation and ERC-5805 Compliance
The PropertyNFT contract implements the ERC-5805 standard (Extended Voting Delegation)
to enable voting power management. Each token holder has voting power equal to 1
(representing one property), and voting power can be delegated to another address via the
delegate() function. This enables scenarios where a property owner may authorize a family
member, property manager, or a designated representative to vote on their behalf.
A critical UX improvement in the preferred embodiment is automatic delegation: when a
property token is minted, voting power is automatically delegated to the property owner (via
_delegateTokens(owner, 1)), and when a token is transferred to a new owner, voting power is
automatically delegated to that new owner if the new owner has not previously configured a
custom delegation. This eliminates the requirement for non-crypto-native users to manually
call a delegate() function before their voting power becomes active in governance proposals.
12

III. TIERED GOVERNANCE WITH CATEGORY-SPECIFIC QUORUMS
(FAIRCROFTGOVERNOR CONTRACT)
A. Governance Categories and Quorum Thresholds
The FaircroftGovernor contract implements a multi-category governance system that classifies
proposals into four tiers based on their impact and urgency. Each category has independent
quorum percentages, pass thresholds, voting delays, and timelock periods, enabling
appropriate governance weight calibration.
Category 1: Routine Proposals. Examples include minor maintenance approvals, community
event scheduling, and operational decisions of limited financial or constitutional impact.
Quorum requirement: 15% of total voting power (i.e., 15% of minted properties must vote).
Voting threshold: simple majority (>50% of votes cast must be affirmative). Voting period: 2
days. Timelock delay: 2 days. Rate limit: maximum 10 active proposals at any time.
Category 2: Financial Proposals. Examples include annual budget approvals, expenditures
exceeding a threshold (e.g., $10,000), reserve fund allocation, and treasurer appointment.
Quorum requirement: 33% of total voting power. Voting threshold: simple majority. Voting
period: 3 days. Timelock delay: 4 days.
Category 3: Governance Proposals. Examples include architectural guideline amendments,
enforcement policy changes, and rule modifications that do not alter the CC&Rs. Quorum
requirement: 51% of total voting power. Voting threshold: simple majority. Voting period: 3
days. Timelock delay: 4 days.
Category 4: Constitutional Proposals. Examples include amendments to CC&Rs, changes to
governance structure, dissolution of the HOA, and changes to the voting system itself. Quorum
requirement: 67% of total voting power. Voting threshold: 2/3 supermajority (≥66.67% of
votes cast must be affirmative). Voting period: 5 days. Timelock delay: 7 days.
B. Voting Mechanics and Checkpoint-Based Voting Power Calculation
When a proposal is created, a voting checkpoint is recorded at block.timestamp (per
EIP-6372). All voting power calculations use the checkpoint timestamp to determine each
voter's delegation state at the moment the proposal was created. This prevents double-voting
and ensures voting power cannot be transferred after a proposal begins voting.
Voting is conducted via the castVote() function, which accepts three possible votes per
address: For (support = 1), Against (support = 0), and Abstain (support = 2). Votes are
weighted by the voter's delegated voting power at the checkpoint timestamp. A voter cannot
13

vote multiple times.
C. Proposal Execution and Timelock Integration
Once a proposal passes voting (quorum met and threshold exceeded), it enters a timelock
period before execution is permitted. The timelock is implemented via integration with a
TimelockController contract (following OpenZeppelin's governance patterns), which queues
the proposal transactions and enforces a delay before execution is possible.
Only after the timelock delay expires can anyone call execute() on the proposal to trigger the
queued transactions. This delay provides a period for community members to exit (by selling
their property) if they strongly disagree with the proposal outcome, and provides time for
emergency mechanisms (such as a Guardian role holding a multisig) to cancel erroneous
proposals.
D. Proposal Guardian and Emergency Cancellation
In one embodiment, the FaircroftGovernor contract implements a Guardian mechanism via a
GovernorProposalGuardian interface. A designated multisig address (e.g., 2-of-3 board
members) can unilaterally cancel governance proposals after vote passage but before timelock
execution. This provides an emergency kill-switch for proposals discovered to be erroneous or
malicious, and prevents a coordinated attack in which a temporary quorum coalition passes a
destructive proposal.
The Guardian role is intentionally limited: it can only cancel proposals after they have passed
voting (i.e., it cannot suppress unpopular proposals before voting occurs), and it operates only
during the timelock delay period. This design balances safety with democratic principles.
E. Rate Limiting and Proposal Spam Prevention
To prevent proposal spam and denial-of-service attacks, the system enforces a rate limit: no
more than 10 proposals may be in an active state (voting or queued for execution) at any time.
Attempts to create a proposal when this limit is reached are rejected. This ensures governance
resources remain focused and prevents voter fatigue.
14

IV. AUTOMATED TREASURY MANAGEMENT (FAIRCROFTTREASURY
CONTRACT)
A. Two-Ledger Accounting Structure
The FaircroftTreasury contract maintains two internal ledgers representing distinct fund
categories: (1) Operating Balance: funds allocated for regular operational expenses
(maintenance, management, utilities); (2) Reserve Balance: funds designated for long-term
capital projects, emergency repairs, and community lending programs.
The default allocation is 80% to operating balance and 20% to reserve balance, configurable
via governance vote. This structure provides transparency, enables different fiscal policies for
different fund categories, and prevents commingling that complicates auditing.
B. Dues Collection, Late Fees, Grace Periods, and Annual Discount
Dues collection is automated via the collectDues() function, which processes payments from
property owners. Each property has a configurable duesAmount (stored in PropertyNFT
metadata) that may be paid on a monthly or quarterly basis.
The system implements automatic late fee assessment: payments received after the due date
incur a late fee equal to 10% of the dues amount (configurable via governance). Additionally, a
grace period of 30 days (configurable) is provided before late fees are assessed, allowing
members reasonable time to catch up on payments.
An important feature is annual payment incentives: members who pay all four quarterly dues at
once (or all 12 monthly dues at once) receive an automatic 5% discount (configurable) off the
total dues amount. This incentivizes full-year commitments and improves cash flow
predictability for the HOA.
C. Automated Fund Splitting with Basis-Point Ratios
When dues are collected, the Treasury immediately splits the payment between operating and
reserve ledgers using the configurable basis-point ratio (default: 8000 basis points to operating,
2000 basis points to reserve, totaling 10000 basis points = 100%). This automatic split occurs
atomically in a single transaction, reducing transaction count and gas costs compared to
multi-transaction approaches.
For example, when $1,000 in dues is collected with the default 80/20 split: $800 is credited to
operating balance and $200 to reserve balance. The split ratio is configurable via governance
vote, enabling the community to dynamically adjust fund allocation policies.
15

D. Expenditure Pathways: Governance-Gated vs. Emergency Spending
The Treasury implements two distinct expenditure pathways with different control
mechanisms:
Governance-Gated Expenditures. Planned expenses (maintenance projects, vendor
contracts, capital improvements) require approval via a governance proposal that has passed
voting and executed through the Timelock contract. This ensures community oversight and
prevents unilateral executive spending.
Emergency Expenditures. The TREASURER_ROLE (typically a board-appointed treasurer
or automated oracle) has authority to spend funds for urgent, unforeseen costs (emergency
repairs, temporary contractors) without awaiting governance approval. However, this authority
is limited by per-period spending caps enforced by an emergencySpendingLimit parameter
(configurable via governance) and a rolling period window. For example, if the emergency
spending limit is set to $5,000 per calendar month, the treasurer can approve up to $5,000 in
emergency spending in any given month, but exceeding that requires a governance vote.
The spending period automatically resets when expired (e.g., at the end of each month),
tracked by emergencyPeriodStart and emergencyPeriodDuration parameters. This design
balances operational flexibility with democratic accountability.
16

V. IMMUTABLE DOCUMENT REGISTRY WITH DUAL STORAGE
(DOCUMENTREGISTRY CONTRACT)
A. Hash-Based On-Chain Storage with Off-Chain Content
The DocumentRegistry contract maintains an immutable registry of HOA documents (CC&Rs,
meeting minutes, budgets, resolutions, architectural guidelines) without storing the full
document content on-chain. Instead, each document is registered with a SHA-256 content
hash, which requires only 32 bytes of storage per document.
The actual document content is stored off-chain in a dual-storage architecture: (1) Arweave: a
permanent, immutable storage network where documents are stored indefinitely; (2) IPFS: a
decentralized peer-to-peer file system where documents are pinned for rapid, decentralized
access. Both storage mechanisms provide cryptographic proof that the retrieved content
matches the on-chain hash, ensuring authenticity.
B. Document Categories and Metadata
Each document is categorized into one of 10 types: (1) CC&Rs (Covenants, Conditions, and
Restrictions); (2) Minutes (meeting minutes); (3) Budget (annual or quarterly budgets); (4)
Amendment (amendments to governing documents); (5) Resolution (board or member
resolutions); (6) Financial (financial statements, audit reports); (7) Architectural (architectural
guidelines, design standards); (8) Notice (legal notices, correspondence); (9) Election (election
materials, voting records); (10) Other (documents not fitting other categories).
Document metadata stored on-chain includes: (1) contentHash: SHA-256 hash of the
document; (2) documentType: category from the list above; (3) timestamp: the block
timestamp at which the document was registered; (4) registrant: the address that registered the
document; (5) arweaveId: the permanent Arweave transaction ID; (6) ipfsHash: the IPFS
content identifier; (7) supersedes: the hash of the previous version (if this is an updated
version).
C. Supersession Chains and Version History
To manage document versioning, the contract tracks supersession chains: when registering a
new version of a document, the registrant specifies the hash of the previous version in the
supersedes field. This creates a linked list of document versions, enabling the registry to
identify the currently active version via a getLatestVersion() function that traverses the
supersession chain.
17

Example: CC&R v1.0 (hash A1) is registered. When amended, CC&R v2.0 (hash A2,
supersedes A1) is registered. When further amended, CC&R v3.0 (hash A3, supersedes A2) is
registered. Calling getLatestVersion(A1) traverses the chain and returns A3, identifying the
current governing CC&Rs.
D. Access Control and Registration Authority
Documents may be registered by addresses holding a REGISTRAR_ROLE (typically board
members or an automated document oracle). In alternative embodiments, governance
proposals may authorize registration of documents, creating a fully democratic document
management process where important documents require community voting before they
become part of the official registry.
18

VI. COMMUNITY MICRO-LOAN PROGRAM (DUESLENDING CONTRACT)
A. Loan Origination and Underwriting
The DuesLending contract enables HOA members facing temporary financial hardship to
borrow from the Treasury reserve to cover dues payments. This addresses a key problem in
traditional HOAs where members unable to pay full dues immediately face liens, penalties,
and potential foreclosure, even if their financial situation is temporary.
Loans are originated by addresses holding a LOAN_ORIGINATOR_ROLE (typically board
members or an approved lending committee). The originator creates a loan by specifying: (1)
borrowerAddress: the property owner requesting the loan; (2) principal: the loan amount (in
stablecoin or native currency); (3) termMonths: the repayment period (2-12 months); (4)
interestRateBps: the annual interest rate in basis points (default 5%, = 500 bps). Once
originated, the loan is funded from the Treasury reserve and begins accruing interest
immediately.
B. Payment-to-Treasury Routing and Automatic Dues Crediting
A critical feature is that loan payments are routed directly to the Treasury on behalf of the
borrower, not to the borrower for manual payment. When a borrower makes a monthly loan
payment, the payment amount is automatically credited to the borrower's dues account in the
Treasury. This prevents default-through-negligence and ensures that borrowed funds reliably
translate to dues payments.
Example: A member borrows $3,000 to cover 3 months of $1,000 monthly dues. In month 1,
the borrower pays $1,100 (principal + interest). The Treasury credits $1,000 to the member's
dues account (satisfying month 1 dues) and $100 to the reserve balance (as interest). The
process repeats for months 2 and 3.
C. Property Token Locking During Active Loans
While a loan is active (not fully repaid), the borrower's property token is locked, preventing
transfer. This protects the HOA's collateral interest: the HOA cannot pursue dues collection
against a new owner after the property is sold, so the original owner must remain in place to
complete repayment.
Loan-lock operations are performed by the DuesLending contract via direct setLoanLock()
function calls authorized at the contract level. When a loan is originated,
setLoanLock(propertyTokenId, true) is called on the PropertyNFT contract, locking the token.
When the loan is fully repaid, setLoanLock(propertyTokenId, false) is called to unlock the
19

token, enabling transfer.
D. Default Handling Through Governance
If a borrower fails to make scheduled payments, the loan is considered in default. However, the
system does not implement automated liquidation (e.g., automatic foreclosure or asset seizure).
Instead, default handling is managed entirely through governance. A Governance proposal is
created to determine the appropriate remedy (payment plan restructuring, loan forgiveness,
etc.), ensuring community oversight and preventing harsh unilateral penalties.
E. Lending Exposure Limits
The DuesLending contract limits total lending exposure via a maxLoanPoolBps parameter that
caps outstanding loan principal as a percentage of the Treasury's reserve balance. For example,
if maxLoanPoolBps is set to 5000 (50%) and the reserve balance is $100,000, total outstanding
loan principal cannot exceed $50,000. This prevents over-allocation of community reserves to
lending operations and maintains reserves for capital projects and emergencies.
20

VII. TREASURY YIELD MANAGEMENT INTEGRATION (TREASURYYIELD
CONTRACT)
A. Deployment to External Yield Protocols
Reserve funds held by the Treasury may sit idle if not actively needed for operations or
lending. The TreasuryYield contract provides a mechanism to deploy idle reserves to external
yield-bearing protocols (e.g., Aave V3 lending markets) to earn passive income while
maintaining governance control over risk exposure.
A YIELD_MANAGER_ROLE (held by an automated oracle or trusted operator) can initiate
deployments to approved yield protocols. Each deployment specifies: (1) protocol: the target
protocol address (e.g., Aave V3 LendingPool); (2) amount: the reserve amount to deploy; (3)
parameters: protocol-specific parameters (e.g., aToken to receive on Aave).
B. Risk Tolerance Levels and Governance-Controlled Caps
Deployments are subject to governance-controlled risk tolerance levels that cap the maximum
percentage of reserves that may be deployed at any time. Three risk levels are defined:
Conservative (30%): Maximum 30% of reserve balance may be deployed. Suitable for
risk-averse communities or those with limited operational history.
Moderate (50%): Maximum 50% of reserve balance may be deployed. Suitable for mature
communities with established governance.
Aggressive (80%): Maximum 80% of reserve balance may be deployed. Suitable for
communities with strong financial positions and high yield-seeking strategies.
Risk tolerance levels are configurable via governance vote, enabling the community to
dynamically adjust yield strategy as circumstances change.
C. Yield Harvesting and Return Crediting
When yield accrues on deployed reserves, the YIELD_MANAGER_ROLE can harvest the
yield by calling harvestYield() on the deployed protocol (or the protocol's harvesting
mechanism) and receive the accrued interest or rewards. These returns are credited back to the
Treasury reserve balance via a creditYieldReturn() function, increasing the total reserve pool
for future use.
21

Example: The Treasury deploys $50,000 to Aave at 50% risk tolerance. Over 3 months, $500
in interest accrues. The yield manager harvests this interest and credits it to the reserve,
increasing the reserve from $100,000 to $100,500 (assuming no other reserve changes).
D. Governance Oversight and Withdrawal Mechanisms
Although the YIELD_MANAGER_ROLE has operational authority to deploy and manage
yield, governance retains oversight authority. A governance proposal can vote to (1) withdraw
deployed reserves from a protocol; (2) change the active protocol or strategy; (3) lower the risk
tolerance level to reduce yield-taking; or (4) establish new yield allocation policies.
22

VIII. COMPOSITE COMMUNITY HEALTH SCORING (HEALTHSCORER
MODULE)
A. Five-Metric Scoring Framework
Traditional HOAs lack quantitative metrics to measure governance health, financial stability,
and member satisfaction over time. The HealthScorer smart contract computes a composite
health score from five weighted metrics:
Financial Health (40% weighting): Measured by the reserve-to-annual-dues ratio. The ratio
is calculated as (reserveBalance / annualDuesRequired), where annualDuesRequired is the
total dues owed by all properties over 12 months. A reserve equal to 1 year of dues is
considered healthy. The score is capped at 10,000 basis points (100%) to prevent
overweighting of over-capitalized reserves.
Governance Health (25% weighting): Measured by proposal participation rate. The
participation rate is (total votes cast / (total voting power * number of proposals)) over a
rolling 12-month period. Communities where members actively vote are deemed healthier than
those with low participation.
Compliance Health (20% weighting): Measured by dues delinquency rate. The delinquency
rate is (number of delinquent properties / total properties). A delinquency rate above a
threshold (e.g., 5%) signals financial stress or governance breakdown.
Member Retention (10% weighting): Measured by membership churn rate. The churn rate is
(properties sold / total properties) over a rolling 12-month period. High churn can signal
dissatisfaction or deteriorating community conditions.
Treasury Efficiency (5% weighting): Measured by expenditure-to-budget variance. The
variance is (actual expenditures - budgeted expenditures) / budgeted expenditures. A variance
near 0% indicates efficient resource utilization; significant variance (positive or negative)
signals planning or execution problems.
B. Score Computation and Interpretation Bands
The composite health score is computed by multiplying each metric score (0-10,000 basis
points) by its weighting percentage and summing the results:
HealthScore = (financialHealth * 4000 + governanceHealth * 2500 +
complianceHealth * 2000 + retentionHealth * 1000 + efficiencyHealth * 500) /
10000
23

The resulting score ranges from 0-10,000 basis points, representing 0%-100.00%. Four
interpretation bands provide qualitative guidance:
Excellent (9000-10000): The community is financially healthy, members are engaged in
governance, compliance is strong, retention is high, and budget execution is precise. No
immediate concerns.
Good (7500-8900): The community is in good standing with minor areas for improvement.
Monitoring is recommended.
Fair (6000-7400): The community faces moderate challenges (e.g., declining participation,
rising delinquency). Proactive governance action is recommended.
Poor (below 6000): The community faces significant challenges (e.g., reserve depletion, high
delinquency, governance breakdown). Urgent corrective action is needed.
C. Implementation as On-Chain View Function or Off-Chain Pipeline
In one embodiment, the HealthScorer is implemented as a Solidity view contract that reads
on-chain state from the Treasury and PropertyNFT contracts:
function getHealthScore() external view returns (uint256) {
    // Financial Health (40% weight)
    uint256 annualDuesRequired = propertyNFT.totalMinted() * averageDuesAmount *
12;
    uint256 financialHealth = annualDuesRequired > 0
        ? (treasury.reserveBalance() * 10000) / annualDuesRequired
        : 10000;
    if (financialHealth > 10000) financialHealth = 10000;
    
    // Governance Health (25% weight)
    uint256 totalProposals = governor.proposalCount();
    uint256 totalVotesCast = governor.totalVotesCast();
    uint256 totalMembers = propertyNFT.totalMinted();
    uint256 governanceHealth = (totalProposals > 0 && totalMembers > 0)
        ? (totalVotesCast * 10000) / (totalMembers * totalProposals)
        : 0;
    if (governanceHealth > 10000) governanceHealth = 10000;
    
    // Compliance Health (20% weight)
    uint256 delinquent = treasury.countDelinquentMembers();
    uint256 complianceHealth = totalMembers > 0
        ? ((totalMembers - delinquent) * 10000) / totalMembers
        : 0;
    
    // Member Retention (10% weight)
    uint256 propertiesSold = propertyNFT.transferCountLast12Months();
    uint256 retentionHealth = totalMembers > 0
        ? ((totalMembers - propertiesSold) * 10000) / totalMembers
        : 10000;
    if (retentionHealth > 10000) retentionHealth = 10000;
24

    
    // Treasury Efficiency (5% weight)
    uint256 budgeted = treasury.annualBudget();
    uint256 actual = treasury.annualExpenditures();
    uint256 variance = budgeted > 0
        ? (abs(actual - budgeted) * 10000) / budgeted
        : 0;
    uint256 efficiencyHealth = variance < 10000 ? 10000 - variance : 0;
    
    // Weighted composite
    uint256 score = (financialHealth * 4000 + governanceHealth * 2500 +
        complianceHealth * 2000 + retentionHealth * 1000 + efficiencyHealth *
500) / 10000;
    return score;
}
Alternatively, in an off-chain embodiment, the HealthScorer is implemented as a data
aggregation pipeline (using Chainlink Functions, Gelato, or similar oracle infrastructure) that
reads on-chain state, computes metrics off-chain, and publishes the health score to the
blockchain via an oracle contract. The off-chain approach enables more complex computations
(e.g., rolling averages over historical data) without incurring high on-chain gas costs.
D. Longitudinal Trending and Early Warning Signals
The true power of the health score emerges from longitudinal trending. By computing and
recording the health score monthly (or quarterly), the community gains visibility into whether
health is improving or deteriorating. A sharp drop in health score (e.g., from Excellent to Good
in a single period) signals an emerging problem that warrants investigation.
Example: A community's health score has been Excellent (9500) for 12 months. In month 13,
it drops to 8200 (Good). Investigating this drop, the board discovers that delinquency has risen
from 2% to 8%, suggesting members are facing economic hardship. The board can proactively
offer dues restructuring or activate the community lending program before the situation
escalates.
25

CLAIMS
What is claimed is:
1. A homeowners association governance and treasury management system, comprising: a
Layer 2 optimistic rollup network executing a plurality of interoperating smart contracts as
recited herein; a PropertyNFT smart contract implementing ERC-721 soulbound property
tokens with one voting power unit per property and two-step governance-approved transfer
mechanisms via a pendingTransfers mapping; a FaircroftGovernor smart contract
implementing four proposal categories (Routine, Financial, Governance, Constitutional) with
independently configurable basis-point quorum percentages and basis-point voting thresholds,
and including a GovernorProposalGuardian interface that can cancel a passed proposal during
a timelock window prior to execution; a FaircroftTreasury smart contract maintaining two
internal ledgers (operating and reserve) with automatic dues splitting at configurable
basis-point ratios, late fee assessment, grace periods, and two expenditure pathways
comprising a governance-gated path and an emergency path with per-period spending limits; a
DocumentRegistry smart contract storing SHA-256 document hashes on-chain with full
content on both Arweave and IPFS, document-type categorization, and supersession-chain
tracking that links each new document to the prior version it replaces; a DuesLending smart
contract originating community micro-loans with direct payment routing to the
FaircroftTreasury smart contract and locking the borrower's property token via a
setLoanLock() call to the PropertyNFT smart contract during an active loan term; a
TreasuryYield smart contract enabling reserve-balance deployment to an external Aave V3
yield protocol with governance-controlled risk tolerance levels comprising a Conservative
level, a Moderate level, and an Aggressive level corresponding to maximum deployment caps
in basis points; and a HealthScorer smart contract computing a composite community health
score from five weighted metrics comprising Financial weighted at 40%, Governance
weighted at 25%, Compliance weighted at 20%, Retention weighted at 10%, and Efficiency
weighted at 5%, the score being persisted on-chain and queryable via a view function.
2. The system of claim 1, wherein the PropertyNFT smart contract further comprises: a
REGISTRAR_ROLE that can mint property tokens and approve transfers from sellers to
buyers; a GOVERNOR_ROLE that can update governance parameters; and wherein loan-lock
operations during active loans are performed by the DuesLending smart contract via direct
setLoanLock() function calls authorized at the contract level.
3. The system of claim 1, wherein the FaircroftGovernor contract implements voting
checkpoints using EIP-6372 timestamp-based clocks to accommodate Layer 2 networks where
block.number is unreliable, and wherein voting power at the checkpoint timestamp determines
each voter's weight in governance proposals.
26

4. The system of claim 1, wherein the FaircroftGovernor contract enforces rate limiting of
maximum 10 active proposals at any time to prevent proposal spam and denial-of-service
attacks.
5. The system of claim 1, wherein the FaircroftTreasury contract implements automatic late fee
assessment of 10% (configurable) applied after a grace period of 30 days (configurable) when
dues payments are received after the due date.
6. The system of claim 1, wherein the FaircroftTreasury contract implements annual payment
incentives providing a 5% discount (configurable) when members pay all four quarterly dues
at once, incentivizing full-year commitments and improving cash flow predictability.
7. The system of claim 1, wherein the FaircroftTreasury contract implements emergency
spending authority for a TREASURER_ROLE within per-period limits enforced by an
emergencySpendingLimit parameter and a rolling period window that automatically resets
when expired.
8. The system of claim 1, wherein the DocumentRegistry contract maintains supersession
chains enabling version tracking of documents such that getLatestVersion() traverses a
supersession chain to identify the currently active version.
9. The system of claim 1, wherein the DocumentRegistry contract categorizes documents into
10 types: CC&Rs (Covenants, Conditions, and Restrictions), Minutes, Budget, Amendment,
Resolution, Financial, Architectural, Notice, Election, and Other.
10. The system of claim 1, wherein the DuesLending contract originates loans specifying
principal amount, repayment term in months (2-12), and annual interest rate in basis points,
and wherein the contract automatically credits loan payments to the Treasury dues account on
behalf of the borrower.
11. The system of claim 1, wherein the DuesLending contract limits total lending exposure via
a maxLoanPoolBps parameter capping outstanding principal as a percentage of the Treasury
reserve balance.
12. The system of claim 1, wherein default handling on loans in the DuesLending contract is
managed entirely through governance proposals rather than automated liquidation, ensuring
community oversight of remedy determination.
13. The system of claim 1, wherein the TreasuryYield contract implements three risk tolerance
levels (Conservative 30%, Moderate 50%, Aggressive 80%) that cap the maximum percentage
of reserves deployable to external yield protocols.
27

14. The system of claim 1, wherein yield harvested from deployed reserves in the
TreasuryYield contract is credited back to the reserve balance, increasing the total pool for
future use.
15. The system of claim 1, wherein the HealthScorer smart contract computes Financial Health
as the reserve-to-annual-dues ratio, capped at 10,000 basis points.
16. The system of claim 1, wherein the HealthScorer smart contract computes Governance
Health as the proposal participation rate measured over a rolling 12-month period.
17. The system of claim 1, wherein the HealthScorer smart contract computes Compliance
Health as the inverse of the dues delinquency rate.
18. The system of claim 1, wherein the TreasuryYield smart contract deploys reserve funds to
external yield-bearing protocols, wherein governance-controlled risk tolerance levels
(Conservative capping deployment at 30% of reserves, Moderate at 50%, Aggressive at 80%)
define maximum deployment percentages of reserve funds, and wherein yield earned is
credited back to the reserve balance via a creditYieldReturn() function.
19. The system of claim 1, wherein the FaircroftGovernor smart contract implements a
Guardian mechanism via a GovernorProposalGuardian interface, granting a designated
multisig address the ability to unilaterally cancel governance proposals after vote passage but
before timelock execution, providing an emergency kill-switch for proposals discovered to be
erroneous or malicious.
20. The system of claim 1, wherein the DuesLending smart contract limits total lending
exposure via a maxLoanPoolBps parameter that caps outstanding loan principal as a
percentage of the FaircroftTreasury reserve balance, preventing over-allocation of community
reserves to lending operations.
21. The system of claim 1, wherein the PropertyNFT smart contract further defines a
LENDING_ROLE held by the DuesLending smart contract for lock/unlock operations during
active loans, and a SOULBOUND_ADMIN_ROLE for enabling or disabling soulbound
transfer restrictions, providing finer-grained role-based access control separation between
lending operations, soulbound administration, and general registration functions.
28

22. A computer-implemented method, comprising: executing, on a Layer 2 optimistic rollup
network, a set of smart contracts to perform the operations recited herein; minting property
tokens via a PropertyNFT smart contract, with each token representing one property and one
voting power unit, and recording the resulting balances in a soulbound ERC-721 ledger;
classifying governance proposals into four categories with independent basis-point quorum
thresholds and category-specific voting delays via a FaircroftGovernor smart contract;
collecting member dues and automatically splitting the received funds between operating and
reserve ledgers of a FaircroftTreasury smart contract at configurable basis-point ratios;
applying late fees after a grace period and offering annual discounts for pre-paid annual dues;
registering governing documents with SHA-256 content hashes stored on-chain via a
DocumentRegistry smart contract and storing full content on both Arweave and IPFS;
originating community micro-loans via a DuesLending smart contract with repayment routed
directly to the FaircroftTreasury and the borrower's property token locked via a setLoanLock()
call to the PropertyNFT smart contract during an active loan term; deploying a portion of
reserve-ledger funds to an external Aave V3 yield protocol via a TreasuryYield smart contract
subject to a governance-selected risk tolerance level; and computing, by a HealthScorer smart
contract, a composite community health score from five weighted metrics comprising
Financial, Governance, Compliance, Retention, and Efficiency.
23. The method of claim 22, further comprising tracking document version history via a
supersedes field in each Document struct, wherein registering a new version of a document
creates a linked list of document versions, and wherein a getLatestVersion() function traverses
the supersession chain to identify the currently active version.
24. The method of claim 22, further comprising automatically delegating voting power to the
property owner upon minting via an autoDelegateOnMint configuration, and automatically
delegating voting power to new recipients upon transfer if the recipient has not previously
configured a custom delegation, thereby eliminating the requirement for non-crypto-native
users to manually call a delegate() function.
25. The method of claim 22, further comprising managing emergency expenditures via a
TREASURER_ROLE within per-period spending limits enforced by an
emergencySpendingLimit parameter and a rolling period window tracked by
emergencyPeriodStart and emergencyPeriodDuration, wherein the spending period
automatically resets when expired.
26. The method of claim 22, further comprising deploying a portion of the reserve ledger
balance to an external yield-bearing protocol pursuant to a governance-configured risk
tolerance level that caps the deployable portion at one of three values selected from a
Conservative cap of 30%, a Moderate cap of 50%, and an Aggressive cap of 80%, harvesting
accrued yield from the external protocol, and crediting harvested yield back to the reserve
ledger balance.
29

27. A non-transitory computer-readable medium storing instructions that, when executed by a
processor, cause the processor to: deploy, on a Layer 2 optimistic rollup network, a
PropertyNFT smart contract implementing soulbound ERC-721 tokens with role-based access
control for minting and two-step governance-approved transfer via a pendingTransfers
mapping; deploy a FaircroftGovernor smart contract implementing four proposal categories
with independent basis-point quorum and voting threshold parameters and a
GovernorProposalGuardian interface that can cancel a passed proposal during a timelock
window; deploy a FaircroftTreasury smart contract maintaining two ledgers (operating and
reserve) with automatic basis-point dues splitting, late fee assessment, grace periods, and an
emergency expenditure path with per-period spending limits; deploy a DocumentRegistry
smart contract storing SHA-256 document hashes on-chain with full content stored on both
Arweave and IPFS and supersession-chain tracking; deploy a DuesLending smart contract
originating community micro-loans with automatic Treasury payment routing and property
token locking via a setLoanLock() call to the PropertyNFT smart contract during an active loan
term; deploy a TreasuryYield smart contract enabling reserve-balance deployment to an
external Aave V3 yield protocol with governance-controlled risk tolerance levels comprising
Conservative, Moderate, and Aggressive; and deploy a HealthScorer smart contract computing
a composite community health score from five weighted metrics comprising Financial
weighted at 40%, Governance weighted at 25%, Compliance weighted at 20%, Retention
weighted at 10%, and Efficiency weighted at 5%.
28. The medium of claim 27, wherein the instructions further cause the processor to implement
voting checkpoints using EIP-6372 timestamp-based clocks to accommodate Layer 2 networks
where block.number is unreliable.
29. The medium of claim 27, wherein the instructions further cause the processor to implement
automatic late fee assessment of 10% (configurable) applied after a grace period of 30 days
(configurable) on overdue dues payments.
30. The medium of claim 27, wherein the instructions further cause the processor to implement
annual payment incentives providing a 5% discount (configurable) for members paying all
quarterly dues at once.
31. The medium of claim 27, wherein the instructions further cause the processor to implement
emergency spending authority for a TREASURER_ROLE within per-period limits enforced
by an emergencySpendingLimit parameter and a rolling period window tracked by
emergencyPeriodStart and emergencyPeriodDuration.
32. The medium of claim 27, wherein the instructions further cause the processor to maintain
supersession chains for documents, enabling identification of the currently active version via
traversal of a supersession chain.
30

33. The medium of claim 27, wherein the instructions further cause the processor to lock
property tokens during active loans and unlock them upon full repayment, preventing transfer
of properties encumbered by community lending.
34. The medium of claim 27, wherein the instructions further cause the processor to compute a
composite health score from five weighted metrics (Financial 40%, Governance 25%,
Compliance 20%, Retention 10%, Efficiency 5%), providing longitudinal visibility into
community health trends.
35. The medium of claim 27, wherein the instructions further cause the processor to: deploy
reserve funds to an external yield protocol with governance-controlled risk tolerance levels
that cap maximum deployment as a percentage of total reserves, harvest accrued yield, and
credit returns to the reserve balance.
36. The medium of claim 27, wherein the instructions further cause the processor to designate
a guardian address capable of unilaterally canceling queued governance proposals before
timelock execution, providing a safety mechanism against erroneous or malicious proposals
that have passed the voting process.
31

ABSTRACT
SuvrenHOA is a blockchain-based homeowners association governance platform combining
seven integrated subsystems: soulbound property NFTs (PropertyNFT), tiered
category-specific quorum voting (FaircroftGovernor), automated treasury management with
configurable fund segregation (FaircroftTreasury), immutable document registry with
Arweave/IPFS storage (DocumentRegistry), community micro-loan program for dues relief
(DuesLending), treasury yield management integration (TreasuryYield), and composite
community health scoring (HealthScorer). Deployed on Layer 2 (Base) using Solidity ^0.8.24,
EIP-6372 timestamp-based clocks for L2 compatibility, and role-based AccessControl for
governance. The system enables transparent, efficient HOA governance with member
participation, flexible treasury management, and financial relief mechanisms.
32

PROVISIONAL PATENT APPLICATION FILING NOTICE
This is a provisional patent application filed under 35 U.S.C. Section 111(b). This application
establishes an effective filing date but is not examined. Within 12 months, a non-provisional
application must be filed to establish final patent rights. The claims in a subsequent
non-provisional application may be broader or narrower than those presented herein.
INVENTOR DECLARATION
The undersigned sole inventor declares that he has reviewed the foregoing specification and
authorizes the filing of this provisional patent application. To the best of his knowledge and
belief, this application accurately describes the invention claimed and the manner and process
of making and using it. The inventor further declares that he believes himself to be the original
inventor of the subject matter claimed and that he has not previously assigned, granted,
conveyed, or licensed any rights in this invention to any other party.
BEST MODE STATEMENT
The Detailed Description of Preferred Embodiments above sets forth the best mode
contemplated by the inventor for carrying out the invention as of the filing date. Where
alternative embodiments are described, they are presented as functional equivalents and not as
preferred over the embodiments expressly identified as preferred. The inventor reserves the
right to amend the claims in any subsequent non-provisional application to recite either the
preferred embodiment or any disclosed alternative.
DOCKET NUMBER: SUVREN-HOA-001-PROV
INVENTOR AND APPLICANT: Ryan Shanahan, Raleigh, North Carolina (pro se)
SIGNED: ____________________________ DATE: ______________
33

## What is claimed is:

1. A homeowners association governance and treasury management system, comprising: a
Layer 2 optimistic rollup network executing a plurality of interoperating smart contracts as
recited herein; a PropertyNFT smart contract implementing ERC-721 soulbound property
tokens with one (1) integer unit of voting power per property and two-step governance-approved transfer
mechanisms via a pendingTransfers mapping; a FaircroftGovernor smart contract
implementing four proposal categories (Routine, Financial, Governance, Constitutional) with
independently configurable basis-point quorum percentages and basis-point voting thresholds,
and including a GovernorProposalGuardian interface that can cancel a passed proposal during
a timelock window prior to execution; a FaircroftTreasury smart contract maintaining two
internal ledgers (operating and reserve) with automatic dues splitting at configurable
basis-point ratios, late fee assessment, grace periods, and two expenditure pathways
comprising a governance-gated path and an emergency path with per-period spending limits; a
DocumentRegistry smart contract storing SHA-256 document hashes on-chain with full
content on both Arweave and IPFS, document-type categorization, and supersession-chain
tracking that links each new document to the prior version it replaces; a DuesLending smart
contract originating community micro-loans with direct payment routing to the
FaircroftTreasury smart contract and locking the borrower's property token via a
setLoanLock() call to the PropertyNFT smart contract during an active loan term; a
TreasuryYield smart contract enabling reserve-balance deployment to an external Aave V3
yield protocol with governance-controlled risk tolerance levels comprising a Conservative
level, a Moderate level, and an Aggressive level corresponding to maximum deployment caps
in basis points; and a HealthScorer smart contract computing a composite community health
score from five weighted metrics comprising Financial weighted at 40%, Governance
weighted at 25%, Compliance weighted at 20%, Retention weighted at 10%, and Efficiency
weighted at 5%, the score being persisted on-chain and queryable via a view function.

2. The system of claim 1, wherein the PropertyNFT smart contract further comprises: a
REGISTRAR_ROLE that can mint property tokens and approve transfers from sellers to
buyers; a GOVERNOR_ROLE that can update governance parameters; and wherein loan-lock
operations during active loans are performed by the DuesLending smart contract via direct
setLoanLock() function calls authorized at the contract level.

3. The system of claim 1, wherein the FaircroftGovernor contract implements voting
checkpoints using EIP-6372 timestamp-based clocks to accommodate Layer 2 networks where
block.number is unreliable, and wherein voting power at the checkpoint timestamp determines
each voter's weight in governance proposals.
26

4. The system of claim 1, wherein the FaircroftGovernor contract enforces rate limiting of
maximum 10 active proposals at any time to prevent proposal spam and denial-of-service
attacks.

5. The system of claim 1, wherein the FaircroftTreasury contract implements automatic late fee
assessment of 10% (configurable) applied after a grace period of 30 days (configurable) when
dues payments are received after the due date.

6. The system of claim 1, wherein the FaircroftTreasury contract implements annual payment
incentives providing a 5% discount (configurable) when members pay all four quarterly dues
at once, incentivizing full-year commitments and improving cash flow predictability.

7. The system of claim 1, wherein the FaircroftTreasury contract implements emergency
spending authority for a TREASURER_ROLE within per-period limits enforced by an
emergencySpendingLimit parameter and a rolling period window that automatically resets
when expired.

8. The system of claim 1, wherein the DocumentRegistry contract maintains supersession
chains enabling version tracking of documents such that getLatestVersion() traverses a
supersession chain to identify the currently active version.

9. The system of claim 1, wherein the DocumentRegistry contract categorizes documents into
10 types: CC&Rs (Covenants, Conditions, and Restrictions), Minutes, Budget, Amendment,
Resolution, Financial, Architectural, Notice, Election, and Other.

10. The system of claim 1, wherein the DuesLending contract originates loans specifying
principal amount, repayment term in months (2-12), and annual interest rate in basis points,
and wherein the contract automatically credits loan payments to the Treasury dues account on
behalf of the borrower.

11. The system of claim 1, wherein the DuesLending contract limits total lending exposure via
a maxLoanPoolBps parameter capping outstanding principal as a percentage of the Treasury
reserve balance.

12. The system of claim 1, wherein default handling on loans in the DuesLending contract is
managed entirely through governance proposals rather than automated liquidation, ensuring
community oversight of remedy determination.

13. The system of claim 1, wherein the TreasuryYield contract implements three risk tolerance
levels (Conservative 30%, Moderate 50%, Aggressive 80%) that cap the maximum percentage
of reserves deployable to external yield protocols.
27

14. The system of claim 1, wherein yield harvested from deployed reserves in the
TreasuryYield contract is credited back to the reserve balance, increasing the total pool for
future use.

15. The system of claim 1, wherein the HealthScorer smart contract computes Financial Health
as the reserve-to-annual-dues ratio, capped at 10,000 basis points.

16. The system of claim 1, wherein the HealthScorer smart contract computes Governance
Health as the proposal participation rate measured over a rolling 12-month period.

17. The system of claim 1, wherein the HealthScorer smart contract computes Compliance
Health as the inverse of the dues delinquency rate.

18. The system of claim 1, wherein the TreasuryYield smart contract deploys reserve funds to
external yield-bearing protocols, wherein governance-controlled risk tolerance levels
(Conservative capping deployment at 30% of reserves, Moderate at 50%, Aggressive at 80%)
define maximum deployment percentages of reserve funds, and wherein yield earned is
credited back to the reserve balance via a creditYieldReturn() function.

19. The system of claim 1, wherein the FaircroftGovernor smart contract implements a
Guardian interface via a GovernorProposalGuardian Solidity interface, granting a designated
multisig address the ability to unilaterally cancel governance proposals after vote passage but
before timelock execution, providing an emergency kill-switch for proposals discovered to be
erroneous or malicious.

20. The system of claim 1, wherein the DuesLending smart contract limits total lending
exposure via a maxLoanPoolBps parameter that caps outstanding loan principal as a
percentage of the FaircroftTreasury reserve balance, preventing over-allocation of community
reserves to lending operations.

21. The system of claim 1, wherein the PropertyNFT smart contract further defines a
LENDING_ROLE held by the DuesLending smart contract for lock/unlock operations during
active loans, and a SOULBOUND_ADMIN_ROLE for enabling or disabling soulbound
transfer restrictions, providing finer-grained role-based access control separation between
lending operations, soulbound administration, and general registration functions.
28

22. A computer-implemented method, comprising: executing, on a Layer 2 optimistic rollup
network, a set of smart contracts to perform the operations recited herein; minting property
tokens via a PropertyNFT smart contract, with each token representing one property and one
voting power unit, and recording the resulting balances in a soulbound ERC-721 ledger;
classifying governance proposals into four categories with independent basis-point quorum
thresholds and category-specific voting delays via a FaircroftGovernor smart contract;
collecting member dues and automatically splitting the received funds between operating and
reserve ledgers of a FaircroftTreasury smart contract at configurable basis-point ratios;
applying late fees after a grace period and offering annual discounts for pre-paid annual dues;
registering governing documents with SHA-256 content hashes stored on-chain via a
DocumentRegistry smart contract and storing full content on both Arweave and IPFS;
originating community micro-loans via a DuesLending smart contract with repayment routed
directly to the FaircroftTreasury and the borrower's property token locked via a setLoanLock()
call to the PropertyNFT smart contract during an active loan term; deploying a portion of
reserve-ledger funds to an external Aave V3 yield protocol via a TreasuryYield smart contract
subject to a governance-selected risk tolerance level; and computing, by a HealthScorer smart
contract, a composite community health score from five weighted metrics comprising
Financial, Governance, Compliance, Retention, and Efficiency.

23. The method of claim 22, further comprising tracking document version history via a
supersedes field in each Document struct, wherein registering a new version of a document
creates a linked list of document versions, and wherein a getLatestVersion() function traverses
the supersession chain to identify the currently active version.

24. The method of claim 22, further comprising automatically delegating voting power to the
property owner upon minting via an autoDelegateOnMint configuration, and automatically
delegating voting power to new recipients upon transfer if the recipient has not previously
configured a custom delegation, thereby eliminating the requirement for non-crypto-native
users to manually call a delegate() function.

25. The method of claim 22, further comprising managing emergency expenditures via a
TREASURER_ROLE within per-period spending limits enforced by an
emergencySpendingLimit parameter and a rolling period window tracked by
emergencyPeriodStart and emergencyPeriodDuration, wherein the spending period
automatically resets when expired.

26. The method of claim 22, further comprising deploying a portion of the reserve ledger
balance to an external yield-bearing protocol pursuant to a governance-configured risk
tolerance level that caps the deployable portion at one of three values selected from a
Conservative cap of 30%, a Moderate cap of 50%, and an Aggressive cap of 80%, harvesting
accrued yield from the external protocol, and crediting harvested yield back to the reserve
ledger balance.
29

27. A non-transitory computer-readable medium storing instructions that, when executed by a
processor, cause the processor to: deploy, on a Layer 2 optimistic rollup network, a
PropertyNFT smart contract implementing soulbound ERC-721 tokens with role-based access
control for minting and two-step governance-approved transfer via a pendingTransfers
mapping; deploy a FaircroftGovernor smart contract implementing four proposal categories
with independent basis-point quorum and voting threshold parameters and a
GovernorProposalGuardian interface that can cancel a passed proposal during a timelock
window; deploy a FaircroftTreasury smart contract maintaining two ledgers (operating and
reserve) with automatic basis-point dues splitting, late fee assessment, grace periods, and an
emergency expenditure path with per-period spending limits; deploy a DocumentRegistry
smart contract storing SHA-256 document hashes on-chain with full content stored on both
Arweave and IPFS and supersession-chain tracking; deploy a DuesLending smart contract
originating community micro-loans with automatic Treasury payment routing and property
token locking via a setLoanLock() call to the PropertyNFT smart contract during an active loan
term; deploy a TreasuryYield smart contract enabling reserve-balance deployment to an
external Aave V3 yield protocol with governance-controlled risk tolerance levels comprising
Conservative, Moderate, and Aggressive; and deploy a HealthScorer smart contract computing
a composite community health score from five weighted metrics comprising Financial
weighted at 40%, Governance weighted at 25%, Compliance weighted at 20%, Retention
weighted at 10%, and Efficiency weighted at 5%.

28. The medium of claim 27, wherein the instructions further cause the processor to implement
voting checkpoints using EIP-6372 timestamp-based clocks to accommodate Layer 2 networks
where block.number is unreliable.

29. The medium of claim 27, wherein the instructions further cause the processor to implement
automatic late fee assessment of 10% (configurable) applied after a grace period of 30 days
(configurable) on overdue dues payments.

30. The medium of claim 27, wherein the instructions further cause the processor to implement
annual payment incentives providing a 5% discount (configurable) for members paying all
quarterly dues at once.

31. The medium of claim 27, wherein the instructions further cause the processor to implement
emergency spending authority for a TREASURER_ROLE within per-period limits enforced
by an emergencySpendingLimit parameter and a rolling period window tracked by
emergencyPeriodStart and emergencyPeriodDuration.

32. The medium of claim 27, wherein the instructions further cause the processor to maintain
supersession chains for documents, enabling identification of the currently active version via
traversal of a supersession chain.
30

33. The medium of claim 27, wherein the instructions further cause the processor to lock
property tokens during active loans and unlock them upon full repayment, preventing transfer
of properties encumbered by community lending.

34. The medium of claim 27, wherein the instructions further cause the processor to compute a
composite health score from five weighted metrics (Financial 40%, Governance 25%,
Compliance 20%, Retention 10%, Efficiency 5%), providing longitudinal visibility into
community health trends.

35. The medium of claim 27, wherein the instructions further cause the processor to: deploy
reserve funds to an external yield protocol with governance-controlled risk tolerance levels
that cap maximum deployment as a percentage of total reserves, harvest accrued yield, and
credit returns to the reserve balance.

36. The medium of claim 27, wherein the instructions further cause the processor to designate
a guardian address capable of unilaterally canceling queued governance proposals before
timelock execution, providing a safety check implemented by the GovernorProposalGuardian interface against erroneous or malicious proposals
that have passed the voting process.
31
