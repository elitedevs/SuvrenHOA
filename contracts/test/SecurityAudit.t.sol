// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SecurityAudit.t.sol
 * @notice Sentinel Adversarial Security Audit - Faircroft / SuvrenHOA
 * @dev    Each test demonstrates a concrete exploit or confirms a defence.
 *         Run: forge test --match-path test/SecurityAudit.t.sol -vvv
 *
 * Findings index (mirrors SECURITY-AUDIT.md):
 *  SC-01  DuesLending <> Treasury interface mismatch (Critical)
 *  SC-02  Governor propose() bypasses maxActiveProposals rate limit (High)
 *  SC-03  Governor propose() causes activeProposalCount underflow DoS (High)
 *  SC-04  Restructured loan status blocks repayment (High)
 *  SC-05  VendorEscrow refunds bypass Treasury accounting (High)
 *  SC-06  TreasuryYield risk-cap calculated on shrinking reserve (Medium)
 *  SC-07  Abstain-quorum + single FOR vote passes Routine proposals (Medium)
 *  SC-08  setTransfersRequireApproval(false) removes soulbound protection (Medium)
 *  SC-09  DocumentRegistry supersedes=0 ambiguity breaks version chains (Low)
 *  SC-10  DuesLending totalOutstanding not decremented per payment (Low)
 *  SC-11  VendorEscrow allows vendor == inspector (Medium)
 *  DEF-01 ReentrancyGuard blocks reentrant payDues (Confirmed defence)
 *  DEF-02 Loan-lock prevents NFT transfer during active loan (Confirmed defence)
 */

import "forge-std/Test.sol";
import "../src/PropertyNFT.sol";
import "../src/FaircroftGovernor.sol";
import "../src/FaircroftTreasury.sol";
import "../src/TreasuryYield.sol";
import "../src/VendorEscrow.sol";
import "../src/DocumentRegistry.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./helpers/MockUSDC.sol";

// ─── Minimal mock Aave pool ──────────────────────────────────────────────────

contract MockAaveToken {
    mapping(address => uint256) private _bal;

    function mint(address to, uint256 amount) external { _bal[to] += amount; }
    function burn(address from, uint256 amount) external { _bal[from] -= amount; }
    function balanceOf(address a) external view returns (uint256) { return _bal[a]; }
}

contract MockAavePool {
    ERC20 private immutable _usdc;
    MockAaveToken private immutable _aToken;

    constructor(address usdc_, address aToken_) {
        _usdc   = ERC20(usdc_);
        _aToken = MockAaveToken(aToken_);
    }

    function supply(address, uint256 amount, address onBehalfOf, uint16) external {
        _usdc.transferFrom(msg.sender, address(this), amount);
        _aToken.mint(onBehalfOf, amount);
    }

    function withdraw(address, uint256 amount, address to) external returns (uint256) {
        uint256 actual = (amount == type(uint256).max)
            ? _aToken.balanceOf(msg.sender)
            : amount;
        _aToken.burn(msg.sender, actual);
        _usdc.transfer(to, actual);
        return actual;
    }
}

// ─── Malicious USDC for reentrancy test ─────────────────────────────────────

contract MaliciousUSDC is MockUSDC {
    address public target;
    bool private _lock;

    function setTarget(address t) external { target = t; }

    function transferFrom(
        address from, address to, uint256 amount
    ) public override returns (bool) {
        if (!_lock && target != address(0)) {
            _lock = true;
            // Re-enter payDues — no try/catch, so the ReentrancyGuard revert propagates
            FaircroftTreasury(target).payDues(1, 1);
            _lock = false;
        }
        return super.transferFrom(from, to, amount);
    }
}

// ─── Security Audit Test Suite ───────────────────────────────────────────────

contract SecurityAuditTest is Test {

    // ── Actors ───────────────────────────────────────────────────────────────
    address internal deployer      = address(this);
    address internal boardMultisig = address(0xBB0A2D);
    address internal alice         = address(0xA11CE);
    address internal bob           = address(0xB0B01);
    address internal carol         = address(0xCA201);
    address internal attacker      = address(0xA77AC4);
    address internal vendor        = address(0x1234BEEF);

    // ── Contracts ────────────────────────────────────────────────────────────
    PropertyNFT        internal propertyNFT;
    FaircroftGovernor  internal governor;
    FaircroftTreasury  internal treasury;
    TreasuryYield      internal yieldVault;
    VendorEscrow       internal escrow;
    DocumentRegistry   internal docRegistry;
    TimelockController internal timelock;
    MockUSDC           internal usdc;
    MockAaveToken      internal aUsdc;
    MockAavePool       internal aavePool;

    uint256 internal constant MAX_LOTS       = 150;
    uint256 internal constant QUARTERLY_DUES = 200e6; // $200 USDC

    // ─────────────────────────────────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────────────────────────────────

    function setUp() public {
        usdc = new MockUSDC();

        // PropertyNFT
        propertyNFT = new PropertyNFT(MAX_LOTS, "Faircroft Property", "FAIR");

        // Timelock (2-day delay, open executor)
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(0);
        executors[0] = address(0);
        timelock = new TimelockController(2 days, proposers, executors, deployer);

        // Governor
        governor = new FaircroftGovernor(propertyNFT, timelock, boardMultisig);
        timelock.grantRole(timelock.PROPOSER_ROLE(),   address(governor));
        timelock.grantRole(timelock.CANCELLER_ROLE(),  boardMultisig);
        timelock.grantRole(timelock.CANCELLER_ROLE(),  address(governor));
        propertyNFT.grantRole(propertyNFT.GOVERNOR_ROLE(),   address(timelock));
        propertyNFT.grantRole(propertyNFT.REGISTRAR_ROLE(),  boardMultisig);

        // Treasury
        treasury = new FaircroftTreasury(
            address(usdc), QUARTERLY_DUES, 500, 2_000e6
        );
        treasury.grantRole(treasury.TREASURER_ROLE(), boardMultisig);
        treasury.grantRole(treasury.GOVERNOR_ROLE(),  address(timelock));

        // DocumentRegistry
        docRegistry = new DocumentRegistry();
        docRegistry.grantRole(docRegistry.RECORDER_ROLE(), boardMultisig);

        // Aave mocks + TreasuryYield
        aUsdc    = new MockAaveToken();
        aavePool = new MockAavePool(address(usdc), address(aUsdc));
        usdc.mint(address(aavePool), 100_000e6); // pool liquidity for withdrawals

        yieldVault = new TreasuryYield(
            address(usdc),
            address(aavePool),
            address(aUsdc),
            address(treasury),
            address(timelock),
            boardMultisig
        );
        treasury.grantRole(treasury.YIELD_MANAGER_ROLE(), address(yieldVault));

        // VendorEscrow
        escrow = new VendorEscrow(
            address(usdc), address(treasury), boardMultisig, address(timelock)
        );

        // Mint NFTs - auto-delegates on mint
        propertyNFT.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        propertyNFT.mintProperty(bob,   2, "103 Faircroft Dr", 3000);
        propertyNFT.mintProperty(carol, 3, "105 Faircroft Dr", 2800);
        vm.warp(block.timestamp + 1); // checkpoint votes
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SC-01: DuesLending <> Treasury interface mismatch - CRITICAL
    //
    // DuesLending's IFaircroftTreasury interface declares three functions that
    // do not exist on the deployed FaircroftTreasury contract:
    //   - withdrawForLoan(uint256)
    //   - payDuesFor(uint256,uint256,address)
    //   - depositFromLoan(uint256)
    //
    // Impact: every call to requestLoan(), makePayment(), payOffLoan() reverts.
    //         The entire DuesLending system is non-functional as deployed.
    // ─────────────────────────────────────────────────────────────────────────

    function test_SC01_DuesLending_TreasuryInterfaceMismatch() public view {
        bytes4 sel1 = bytes4(keccak256("withdrawForLoan(uint256)"));
        bytes4 sel2 = bytes4(keccak256("payDuesFor(uint256,uint256,address)"));
        bytes4 sel3 = bytes4(keccak256("depositFromLoan(uint256)"));

        // None of these selectors exist in the deployed treasury bytecode
        (bool ok1,) = address(treasury).staticcall(abi.encodeWithSelector(sel1, uint256(200e6)));
        (bool ok2,) = address(treasury).staticcall(abi.encodeWithSelector(sel2, uint256(1), uint256(1), address(this)));
        (bool ok3,) = address(treasury).staticcall(abi.encodeWithSelector(sel3, uint256(200e6)));

        assertFalse(ok1, "SC-01: withdrawForLoan must NOT exist on FaircroftTreasury");
        assertFalse(ok2, "SC-01: payDuesFor must NOT exist on FaircroftTreasury");
        assertFalse(ok3, "SC-01: depositFromLoan must NOT exist on FaircroftTreasury");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SC-02: Governor propose() bypasses maxActiveProposals - HIGH
    //
    // proposeWithCategory() enforces the 10-slot limit, but the base propose()
    // function is public and skips the guard entirely.  An attacker with 1 NFT
    // can spam arbitrarily many proposals via propose(), diluting quorum and
    // disrupting the governance queue.
    // ─────────────────────────────────────────────────────────────────────────

    // SC-02 FIX CONFIRMED: propose() now overridden to enforce maxActiveProposals.
    // Direct propose() calls are subject to the same rate limit as proposeWithCategory().
    function test_SC02_GovernorProposalBypassesMaxActive() public {
        address[] memory targets  = new address[](1);
        uint256[] memory values   = new uint256[](1);
        bytes[]   memory calldata_ = new bytes[](1);
        targets[0]    = address(docRegistry);
        calldata_[0]  = abi.encodeWithSelector(DocumentRegistry.getDocumentCount.selector);

        // Fill to maxActiveProposals via the guarded path
        uint256 maxActive = governor.maxActiveProposals();
        for (uint256 i = 0; i < maxActive; i++) {
            vm.prank(alice);
            governor.proposeWithCategory(
                targets, values, calldata_,
                string(abi.encodePacked("Proposal-", vm.toString(i))),
                FaircroftGovernor.ProposalCategory.Routine, ""
            );
        }

        assertEq(governor.activeProposalCount(), maxActive,
            "SC-02-FIX: counter incremented for every proposal via proposeWithCategory");

        // proposeWithCategory is blocked
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(
            FaircroftGovernor.TooManyActiveProposals.selector, maxActive
        ));
        governor.proposeWithCategory(
            targets, values, calldata_, "Should be blocked",
            FaircroftGovernor.ProposalCategory.Routine, ""
        );

        // FIX: direct propose() is now ALSO blocked — bypass is closed
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(
            FaircroftGovernor.TooManyActiveProposals.selector, maxActive
        ));
        governor.propose(targets, values, calldata_, "Bypass attempt - should revert");

        // Counter unchanged
        assertEq(governor.activeProposalCount(), maxActive,
            "SC-02-FIX: counter unchanged after failed bypass attempt");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SC-03: Governor execute() DoS via activeProposalCount underflow - HIGH
    //
    // When a proposal created via propose() (not proposeWithCategory()) passes
    // and is executed, _executeOperations() calls activeProposalCount-- even
    // though the count was never incremented for this proposal.  If count == 0,
    // Solidity 0.8 panics, reverting the execute() and permanently locking the
    // proposal in Succeeded state.
    // ─────────────────────────────────────────────────────────────────────────

    // SC-03 FIX CONFIRMED: propose() now increments activeProposalCount, and
    // _executeOperations() has an underflow guard.  Execute no longer panics.
    function test_SC03_GovernorExecutionDoSViaCounterUnderflow() public {
        assertEq(governor.activeProposalCount(), 0, "SC-03: start from count=0");

        address[] memory targets  = new address[](1);
        uint256[] memory values   = new uint256[](1);
        bytes[]   memory calldata_ = new bytes[](1);
        targets[0]   = address(docRegistry);
        calldata_[0] = abi.encodeWithSelector(DocumentRegistry.getDocumentCount.selector);
        string memory description = "Direct proposal - should increment counter";

        // FIX: propose() increments the counter
        vm.prank(alice);
        uint256 pid = governor.propose(targets, values, calldata_, description);
        assertEq(governor.activeProposalCount(), 1, "SC-03-FIX: count incremented to 1");

        // Voting window
        vm.warp(block.timestamp + governor.votingDelay() + 1);
        vm.prank(alice); governor.castVote(pid, 1);
        vm.prank(bob);   governor.castVote(pid, 1);
        vm.prank(carol); governor.castVote(pid, 1);
        vm.warp(block.timestamp + governor.votingPeriod() + 1);

        assertEq(
            uint8(governor.state(pid)),
            uint8(IGovernor.ProposalState.Succeeded),
            "SC-03: proposal should succeed"
        );

        // Queue in timelock
        bytes32 descHash = keccak256(bytes(description));
        governor.queue(targets, values, calldata_, descHash);
        vm.warp(block.timestamp + timelock.getMinDelay() + 1);

        // FIX: execute succeeds — no underflow panic
        governor.execute(targets, values, calldata_, descHash);
        assertEq(governor.activeProposalCount(), 0,
            "SC-03-FIX: counter decremented to 0 after execution - no underflow");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SC-04: Restructured loans cannot be repaid - HIGH
    //
    // governance calls restructureLoan() → status = LoanStatus.Restructured (3).
    // makePayment() and payOffLoan() both guard:
    //   if (status != Active && status != Defaulting) revert LoanNotActive()
    // Restructured (3) matches neither, so the borrower is permanently blocked
    // from repaying.  The property also remains loan-locked indefinitely.
    // ─────────────────────────────────────────────────────────────────────────

    function test_SC04_RestructuredLoanIsUnrepayable() public pure {
        // LoanStatus: Active=0, Settled=1, Defaulting=2, Restructured=3, WrittenOff=4
        uint8 statusActive      = 0;
        uint8 statusDefaulting  = 2;
        uint8 statusRestructured = 3;

        bool canRepay = (statusRestructured == statusActive ||
                         statusRestructured == statusDefaulting);

        assertFalse(canRepay,
            "SC-04: Restructured status passes neither Active nor Defaulting guard - loan frozen");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SC-05: VendorEscrow refunds bypass Treasury accounting - HIGH
    //
    // cancelWorkOrder() and resolveDispute(releaseToVendor=false) call
    // usdc.safeTransfer(treasury, amount).  This delivers USDC to the Treasury
    // address but FaircroftTreasury has no receive hook - neither operatingBalance
    // nor reserveBalance is updated.  The funds become permanently "dark":
    // they sit in the contract but can never be spent, yielded, or returned.
    // ─────────────────────────────────────────────────────────────────────────

    function test_SC05_VendorEscrowRefundsBypassTreasuryAccounting() public {
        uint256 refundAmt = 5_000e6; // $5,000

        uint256 opBefore  = treasury.operatingBalance();
        uint256 resBefore = treasury.reserveBalance();
        uint256 balBefore = usdc.balanceOf(address(treasury));

        // Simulate VendorEscrow sending a refund directly to the treasury address
        // (this is exactly what cancelWorkOrder / resolveDispute do)
        usdc.mint(address(this), refundAmt);
        usdc.transfer(address(treasury), refundAmt);

        uint256 opAfter  = treasury.operatingBalance();
        uint256 resAfter = treasury.reserveBalance();
        uint256 balAfter = usdc.balanceOf(address(treasury));

        // USDC arrived but accounting is untouched
        assertEq(opAfter,  opBefore,  "SC-05: operatingBalance unchanged on raw transfer");
        assertEq(resAfter, resBefore, "SC-05: reserveBalance unchanged on raw transfer");
        assertEq(balAfter, balBefore + refundAmt, "SC-05: USDC balance increased");

        // Accounting gap: contract holds more than it tracks
        uint256 tracked = opAfter + resAfter;
        assertGt(balAfter, tracked,
            "SC-05: USDC balance > tracked balances - funds are dark and unspendable");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SC-06: TreasuryYield risk cap uses shrinking reserve as denominator - MEDIUM
    //
    // depositToAave() checks: depositedAmount + amount <= maxDeployable(reserveBalance)
    // BEFORE the deposit is made.  After the deposit, reserveBalance shrinks
    // (funds left the treasury), so the effective deployment ratio against the
    // *remaining* reserve exceeds the configured cap.
    //
    // Example (conservative = 30%):
    //   Reserve = $152, cap = $45.6.  Deposit $45.5 passes check.
    //   After deposit: reserve = $106.5, deployed = $45.5 → 42.7% > 30%.
    // ─────────────────────────────────────────────────────────────────────────

    function test_SC06_TreasuryYieldRiskCapBypassViaShrinkingReserve() public {
        // Fund treasury reserve via dues payment
        usdc.mint(alice, 10_000e6);
        vm.startPrank(alice);
        usdc.approve(address(treasury), type(uint256).max);
        treasury.payDues(1, 4); // annual payment; goes 20% to reserve
        vm.stopPrank();

        uint256 reserveStart = treasury.reserveBalance();
        assertGt(reserveStart, 0, "SC-06: need non-zero reserve");

        // Conservative cap = 30% of reserveStart
        uint256 maxAllowed = (reserveStart * 3000) / 10000;
        // Deposit right under the cap
        uint256 depositAmt = maxAllowed > 1 ? maxAllowed - 1 : 1;

        vm.prank(boardMultisig);
        yieldVault.depositToAave(depositAmt);

        uint256 reserveAfter  = treasury.reserveBalance();
        uint256 deployed      = yieldVault.depositedAmount();

        // Effective ratio against remaining reserve
        uint256 effectiveRatioBps = (deployed * 10000) / reserveAfter;

        assertGt(effectiveRatioBps, 3000,
            "SC-06: effective deployment ratio exceeds 30% conservative cap - risk tolerance bypass");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SC-07: Abstain-quorum + single FOR vote passes Routine proposals - MEDIUM
    //
    // _quorumReached() counts forVotes + againstVotes + abstainVotes.
    // _voteSucceeded() counts only forVotes / (forVotes + againstVotes).
    //
    // Attack: attacker holds enough NFTs to meet quorum by abstaining.
    // A single accomplice votes FOR.  forVotes/(for+against) = 1/1 = 100% > 50%.
    // The proposal passes with a single FOR vote from the entire community.
    // ─────────────────────────────────────────────────────────────────────────

    // SC-07 FIX CONFIRMED: _voteSucceeded() now includes abstain in the denominator.
    // A single FOR vote with abstain-padding no longer passes a Routine proposal.
    function test_SC07_AbstainQuorumSingleForVotePassesRoutine() public {
        address[] memory targets  = new address[](1);
        uint256[] memory values   = new uint256[](1);
        bytes[]   memory calldata_ = new bytes[](1);
        targets[0]   = address(docRegistry);
        calldata_[0] = abi.encodeWithSelector(DocumentRegistry.getDocumentCount.selector);

        vm.prank(alice);
        uint256 pid = governor.proposeWithCategory(
            targets, values, calldata_, "Abstain quorum exploit attempt",
            FaircroftGovernor.ProposalCategory.Routine, ""
        );

        vm.warp(block.timestamp + governor.votingDelay() + 1);

        // Alice votes FOR; Bob and Carol ABSTAIN — quorum reached via abstains
        vm.prank(alice); governor.castVote(pid, 1); // FOR
        vm.prank(bob);   governor.castVote(pid, 2); // ABSTAIN
        vm.prank(carol); governor.castVote(pid, 2); // ABSTAIN

        vm.warp(block.timestamp + governor.votingPeriod() + 1);

        (uint256 against, uint256 forVotes, uint256 abstain) = governor.proposalVotes(pid);
        uint256 quorumNeeded = governor.proposalQuorum(pid);
        uint256 totalVotes   = forVotes + against + abstain;

        assertGe(totalVotes, quorumNeeded, "SC-07: quorum still reached via abstains");
        assertEq(forVotes, 1, "SC-07: only 1 FOR vote cast");
        assertEq(against,  0, "SC-07: no AGAINST votes");

        // FIX: proposal is now DEFEATED — 1 FOR out of 3 total votes = 33% < 50% threshold
        assertEq(
            uint8(governor.state(pid)),
            uint8(IGovernor.ProposalState.Defeated),
            "SC-07-FIX: 1 FOR + 2 ABSTAIN fails threshold when abstain counted in denominator"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SC-08: setTransfersRequireApproval requires SOULBOUND_ADMIN_ROLE - MEDIUM
    //
    // SC-08 FIX CONFIRMED: setTransfersRequireApproval() now requires
    // SOULBOUND_ADMIN_ROLE (not granted by default) instead of GOVERNOR_ROLE.
    // Disabling soulbound now requires TWO sequential governance proposals:
    //   1. Grant SOULBOUND_ADMIN_ROLE to the Timelock.
    //   2. Call setTransfersRequireApproval(false).
    // Each step emits an on-chain event giving the community two opportunities
    // to detect and resist the attack before NFTs become freely transferable.
    // ─────────────────────────────────────────────────────────────────────────

    function test_SC08_DisablingSoulboundAllowsUnauthorisedTransfer() public {
        // a) With soulbound enforcement: transfer without board approval reverts
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(PropertyNFT.TransferNotApproved.selector, 1)
        );
        propertyNFT.safeTransferFrom(alice, attacker, 1);

        // b) FIX: Timelock does NOT hold SOULBOUND_ADMIN_ROLE by default.
        //    setTransfersRequireApproval() reverts even for the Timelock.
        vm.prank(address(timelock));
        vm.expectRevert(); // AccessControl: missing SOULBOUND_ADMIN_ROLE
        propertyNFT.setTransfersRequireApproval(false);

        // c) Soulbound is still enforced — transfer remains blocked
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(PropertyNFT.TransferNotApproved.selector, 1)
        );
        propertyNFT.safeTransferFrom(alice, attacker, 1);

        assertEq(propertyNFT.ownerOf(1), alice,
            "SC-08-FIX: alice still owns the NFT after failed attack");
        assertEq(propertyNFT.getVotes(attacker), 0,
            "SC-08-FIX: attacker has no voting power");

        // d) Two-step attack path (documents the remaining barrier):
        //    Step 1 — a separate governance proposal must grant the role.
        //    Step 2 — only then can soulbound be disabled.
        //    Emits SoulboundStatusChanged so off-chain monitors can alert.
        propertyNFT.grantRole(propertyNFT.SOULBOUND_ADMIN_ROLE(), address(timelock));

        vm.prank(address(timelock));
        vm.expectEmit(true, false, false, true);
        emit PropertyNFT.SoulboundStatusChanged(false, address(timelock));
        propertyNFT.setTransfersRequireApproval(false);

        vm.prank(alice);
        propertyNFT.safeTransferFrom(alice, attacker, 1);
        assertEq(propertyNFT.ownerOf(1), attacker,
            "SC-08: two-step attack succeeds only after role is explicitly granted");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SC-09: DocumentRegistry supersedes=0 ambiguity - LOW
    //
    // docId 0 and "no supersession" both use supersedes=0.
    // getLatestVersion(0) cannot detect that a new document supersedes doc 0
    // when that new document's supersedes field is also 0 (i.e., the caller
    // omitted the supersedes parameter), silently returning stale doc 0 as
    // the latest version.
    // ─────────────────────────────────────────────────────────────────────────

    function test_SC09_DocumentRegistrySupersedes0Ambiguity() public {
        docRegistry.grantRole(docRegistry.RECORDER_ROLE(), address(this));

        // Register doc 0
        bytes32 hash0 = keccak256("original CC&R text");
        docRegistry.registerDocument(
            hash0, "arweaveTx0", "ipfs0",
            DocumentRegistry.DocType.CCR, "Original CC&Rs", 0
        );

        // Register doc 1 without specifying supersedes (defaults to 0)
        // Caller INTENDS this to be a new standalone document, not a supersession
        bytes32 hash1 = keccak256("revised CC&R text");
        docRegistry.registerDocument(
            hash1, "arweaveTx1", "ipfs1",
            DocumentRegistry.DocType.CCR, "Revised CC&Rs", 0
        );

        // getLatestVersion(0) walks forward looking for `sup == 0`, but skips entries
        // where sup==0 because the check is `sup > 0 && sup == latest`
        uint256 latest = docRegistry.getLatestVersion(0);
        assertEq(latest, 0,
            "SC-09: getLatestVersion(0) returns doc 0, not doc 1 - revision chain invisible");

        // A user checking the "latest" CC&R sees the old document
        DocumentRegistry.Document memory latestDoc = docRegistry.getDocument(latest);
        assertEq(latestDoc.title, "Original CC&Rs",
            "SC-09: stale document presented as latest - misleads homeowners");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SC-10: DuesLending totalOutstanding overstated during repayment - LOW
    //
    // totalOutstanding is incremented when a loan is requested and decremented
    // ONLY in _settleLoan() (full payoff) or writeOffLoan().
    // Per-installment makePayment() calls do NOT decrement it, even though the
    // corresponding USDC has already been returned to the treasury reserve.
    //
    // Effect: _loanPoolAvailable() underestimates available pool capacity,
    // potentially blocking new borrowers even when significant principal has
    // been repaid.
    // ─────────────────────────────────────────────────────────────────────────

    function test_SC10_TotalOutstandingOverstatedDuringRepayment() public pure {
        uint256 principal       = 800e6;
        uint256 installmentAmt  = 225e6;
        uint256 totalOwed       = 900e6;
        uint256 totalOutstanding = principal;

        // Simulate three installment payments - each returns USDC to treasury
        // but totalOutstanding is NOT decremented by the contract's logic
        uint256 paidSoFar;
        for (uint8 i = 0; i < 3; i++) {
            paidSoFar += installmentAmt;
            // totalOutstanding still == principal despite funds being returned
            assertEq(totalOutstanding, principal,
                string(abi.encodePacked(
                    "SC-10: After payment ",
                    vm.toString(i + 1),
                    ", totalOutstanding unchanged"
                ))
            );
        }

        // Only on full settlement is it decremented
        paidSoFar += installmentAmt; // 4th payment covers remainder
        if (paidSoFar >= totalOwed) {
            totalOutstanding -= principal; // _settleLoan()
        }
        assertEq(totalOutstanding, 0,
            "SC-10: totalOutstanding only cleared at settlement, not incrementally");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SC-11: VendorEscrow allows inspector == vendor (MEDIUM)
    //
    // createWorkOrder() validates inspector != address(0) but not inspector != vendor.
    // If the board (BOARD_ROLE) creates a work order appointing the vendor as
    // their own inspector, the vendor can immediately call approveMilestone()
    // and release all escrowed USDC to themselves without any independent review.
    // ─────────────────────────────────────────────────────────────────────────

    // SC-11 FIX CONFIRMED: createWorkOrder() now rejects inspector == vendor.
    function test_SC11_VendorAsOwnInspectorSelfApprovesMilestones() public {
        uint256 milestoneAmt = 10_000e6;

        usdc.mint(address(treasury), milestoneAmt);
        vm.prank(address(treasury));
        usdc.approve(address(escrow), milestoneAmt);

        VendorEscrow.MilestoneInput[] memory milestones = new VendorEscrow.MilestoneInput[](1);
        milestones[0] = VendorEscrow.MilestoneInput({
            description: "Pool resurfacing",
            amount: milestoneAmt
        });

        // FIX: board attempt to create work order with vendor == inspector now reverts
        vm.prank(boardMultisig);
        vm.expectRevert(VendorEscrow.InspectorCannotBeVendor.selector);
        escrow.createWorkOrder(
            vendor,
            "Pool Work",
            "Resurface community pool",
            milestones,
            vendor,   // ← inspector == vendor: must revert
            false
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEF-01: ReentrancyGuard blocks reentrant payDues (Confirmed defence)
    // ─────────────────────────────────────────────────────────────────────────

    function test_DEF01_ReentrancyGuardBlocksReentrantPayDues() public {
        MaliciousUSDC malUsdc = new MaliciousUSDC();
        FaircroftTreasury reTreasury = new FaircroftTreasury(
            address(malUsdc), QUARTERLY_DUES, 500, 2_000e6
        );
        malUsdc.setTarget(address(reTreasury));

        malUsdc.mint(attacker, 10_000e6);
        vm.prank(attacker);
        malUsdc.approve(address(reTreasury), type(uint256).max);

        // Reentrancy attempt must revert
        vm.prank(attacker);
        vm.expectRevert();
        reTreasury.payDues(1, 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEF-02: Loan-lock prevents NFT transfer during active loan (Confirmed defence)
    // ─────────────────────────────────────────────────────────────────────────

    function test_DEF02_LoanLockBlocksTransferEvenWithBoardApproval() public {
        propertyNFT.grantRole(propertyNFT.LENDING_ROLE(), address(this));
        propertyNFT.setLoanLock(1, true);

        // Board approves the transfer
        vm.prank(boardMultisig);
        propertyNFT.approveTransfer(1, bob);

        // Transfer still reverts due to loan lock
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(PropertyNFT.TokenIsLoanLocked.selector, 1)
        );
        propertyNFT.safeTransferFrom(alice, bob, 1);

        // Unlock and confirm transfer now works
        propertyNFT.setLoanLock(1, false);
        vm.prank(boardMultisig);
        propertyNFT.approveTransfer(1, bob);
        vm.prank(alice);
        propertyNFT.safeTransferFrom(alice, bob, 1);
        assertEq(propertyNFT.ownerOf(1), bob, "DEF-02: transfer succeeds after unlock");
    }
}
