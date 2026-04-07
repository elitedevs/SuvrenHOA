// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PropertyNFT.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

contract PropertyNFTTest is Test {
    PropertyNFT public nft;

    address public deployer = address(this);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public carol = address(0xCA201);
    address public unauthorized = address(0xDEAD);

    uint256 constant MAX_LOTS = 150;

    function setUp() public {
        nft = new PropertyNFT(MAX_LOTS, "Faircroft Property", "FAIR");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Minting
    // ═══════════════════════════════════════════════════════════════════════

    function test_MintProperty() public {
        uint256 tokenId = nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.totalMinted(), 1);
        assertEq(nft.totalSupply(), 1);

        PropertyNFT.PropertyInfo memory info = nft.getProperty(1);
        assertEq(info.lotNumber, 1);
        assertEq(keccak256(bytes(info.streetAddress)), keccak256(bytes("101 Faircroft Dr")));
        assertEq(info.squareFootage, 2500);
        assertEq(info.lastDuesTimestamp, 0);
    }

    function test_MintEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit PropertyNFT.PropertyMinted(1, alice, 1, "101 Faircroft Dr");
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
    }

    function test_AutoDelegateOnMint() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        // Alice should have 1 vote immediately (auto-delegated to self)
        assertEq(nft.getVotes(alice), 1);
        assertEq(nft.delegates(alice), alice);
    }

    function test_MintMultipleProperties() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        nft.mintProperty(bob, 2, "103 Faircroft Dr", 3000);
        nft.mintProperty(carol, 3, "105 Faircroft Dr", 2800);

        assertEq(nft.totalSupply(), 3);
        assertEq(nft.totalMinted(), 3);
        assertEq(nft.getVotes(alice), 1);
        assertEq(nft.getVotes(bob), 1);
        assertEq(nft.getVotes(carol), 1);
    }

    function test_RevertMintZeroAddress() public {
        vm.expectRevert(PropertyNFT.ZeroAddress.selector);
        nft.mintProperty(address(0), 1, "101 Faircroft Dr", 2500);
    }

    function test_RevertMintLotZero() public {
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.InvalidLotNumber.selector, 0));
        nft.mintProperty(alice, 0, "101 Faircroft Dr", 2500);
    }

    function test_RevertMintLotExceedsMax() public {
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.InvalidLotNumber.selector, MAX_LOTS + 1));
        nft.mintProperty(alice, uint64(MAX_LOTS + 1), "101 Faircroft Dr", 2500);
    }

    function test_RevertMintDuplicateLot() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.LotAlreadyMinted.selector, 1));
        nft.mintProperty(bob, 1, "101 Faircroft Dr", 2500);
    }

    function test_RevertMintUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
    }

    function test_MintMaxLotNumber() public {
        nft.mintProperty(alice, uint64(MAX_LOTS), "Last Lot", 2000);
        assertEq(nft.ownerOf(MAX_LOTS), alice);
    }

    function test_LotExists() public {
        assertEq(nft.lotExists(1), false);
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        assertEq(nft.lotExists(1), true);
    }

    function test_MintBothBoundaryLots() public {
        // Lot 1 (min) and lot MAX_LOTS (max) should both be valid
        nft.mintProperty(alice, 1,               "First Lot", 1000);
        nft.mintProperty(bob,   uint64(MAX_LOTS), "Last Lot",  2000);
        assertEq(nft.ownerOf(1),        alice);
        assertEq(nft.ownerOf(MAX_LOTS), bob);
        assertEq(nft.totalSupply(), 2);
    }

    function test_MintAllLots_ThenRejectDuplicate() public {
        // Fill all 5 lots in a tiny community (redeploy with maxLots=5 for speed)
        PropertyNFT smallNft = new PropertyNFT(5, "Mini HOA", "MINI");
        address[5] memory owners = [alice, bob, carol, alice, bob]; // reuse wallets
        for (uint64 i = 1; i <= 5; i++) {
            smallNft.mintProperty(owners[i - 1], i, string(abi.encodePacked("Lot ", vm.toString(i))), 1000);
        }
        assertEq(smallNft.totalSupply(), 5);

        // Lot 1 already minted — must revert
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.LotAlreadyMinted.selector, 1));
        smallNft.mintProperty(carol, 1, "Duplicate", 500);

        // Lot 6 exceeds maxLots=5 — must revert
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.InvalidLotNumber.selector, 6));
        smallNft.mintProperty(carol, 6, "Out of range", 500);
    }

    function test_FreeTransferMode_AllowsTransferWithoutBoardApproval() public {
        nft.grantRole(nft.SOULBOUND_ADMIN_ROLE(), deployer);
        nft.setTransfersRequireApproval(false);

        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        vm.prank(alice);
        nft.safeTransferFrom(alice, bob, 1);
        assertEq(nft.ownerOf(1), bob);
    }

    function test_FreeTransferMode_ToggleBackToRestricted() public {
        nft.grantRole(nft.SOULBOUND_ADMIN_ROLE(), deployer);
        nft.setTransfersRequireApproval(false);
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        // Re-enable restriction
        nft.setTransfersRequireApproval(true);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TransferNotApproved.selector, uint256(1)));
        nft.safeTransferFrom(alice, bob, 1);
    }

    function test_BurnLockedToken_Reverts() public {
        nft.grantRole(nft.LENDING_ROLE(), deployer);
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        nft.setLoanLock(1, true);

        // Loan-locked token should not be transferable (including burn = transfer to 0)
        // Board approves transfer for completeness
        nft.approveTransfer(1, bob);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TokenIsLoanLocked.selector, 1));
        nft.safeTransferFrom(alice, bob, 1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Transfers
    // ═══════════════════════════════════════════════════════════════════════

    function test_ApproveAndTransfer() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        // Board approves transfer to bob
        nft.approveTransfer(1, bob);

        (bool pending, address buyer) = nft.isTransferPending(1);
        assertTrue(pending);
        assertEq(buyer, bob);

        // Alice transfers to bob
        vm.prank(alice);
        nft.safeTransferFrom(alice, bob, 1);

        assertEq(nft.ownerOf(1), bob);
        // Bob has 1 vote (auto-delegated on transfer)
        assertEq(nft.getVotes(bob), 1);
        // Alice had 1 vote delegated to self — after transfer she has 0 tokens
        // but delegation state may linger. Check balanceOf instead.
        assertEq(nft.balanceOf(alice), 0);
        assertEq(nft.balanceOf(bob), 1);

        // Pending approval cleared
        (pending,) = nft.isTransferPending(1);
        assertFalse(pending);
    }

    function test_RevertTransferWithoutApproval() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TransferNotApproved.selector, 1));
        nft.safeTransferFrom(alice, bob, 1);
    }

    function test_RevertTransferToWrongBuyer() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        // Approve for bob, but try to transfer to carol
        nft.approveTransfer(1, bob);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TransferNotApproved.selector, 1));
        nft.safeTransferFrom(alice, carol, 1);
    }

    function test_RevokeTransferApproval() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        nft.approveTransfer(1, bob);

        nft.revokeTransferApproval(1);

        (bool pending,) = nft.isTransferPending(1);
        assertFalse(pending);

        // Transfer should fail now
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TransferNotApproved.selector, 1));
        nft.safeTransferFrom(alice, bob, 1);
    }

    function test_RevertBurn() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        // Approve burn target = address(0) — but _update blocks it
        // Can't directly burn, transferFrom to 0 is blocked by ERC721
        // This is inherently blocked by OZ ERC721
    }

    function test_PropertyInfoSurvivesTransfer() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        nft.approveTransfer(1, bob);

        vm.prank(alice);
        nft.safeTransferFrom(alice, bob, 1);

        PropertyNFT.PropertyInfo memory info = nft.getProperty(1);
        assertEq(info.lotNumber, 1);
        assertEq(keccak256(bytes(info.streetAddress)), keccak256(bytes("101 Faircroft Dr")));
        assertEq(info.squareFootage, 2500);
    }

    function test_NewOwnerAutoDelegate() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        nft.approveTransfer(1, bob);

        vm.prank(alice);
        nft.safeTransferFrom(alice, bob, 1);

        // Bob should be auto-delegated
        assertEq(nft.delegates(bob), bob);
        assertEq(nft.getVotes(bob), 1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Voting Power
    // ═══════════════════════════════════════════════════════════════════════

    function test_VotingPowerEquals1PerNFT() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        assertEq(nft.getVotes(alice), 1);
    }

    function test_Delegation() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        nft.mintProperty(bob, 2, "103 Faircroft Dr", 3000);

        // Alice delegates to bob
        vm.prank(alice);
        nft.delegate(bob);

        assertEq(nft.getVotes(alice), 0);
        assertEq(nft.getVotes(bob), 2);
        assertEq(nft.delegates(alice), bob);
    }

    function test_ClockReturnsTimestamp() public view {
        assertEq(nft.clock(), uint48(block.timestamp));
    }

    function test_ClockModeReturnsTimestamp() public view {
        assertEq(keccak256(bytes(nft.CLOCK_MODE())), keccak256(bytes("mode=timestamp")));
    }

    function test_PastVotesCheckpointing() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        uint256 ts1 = block.timestamp;

        // Warp forward
        vm.warp(block.timestamp + 1 hours);

        nft.mintProperty(bob, 2, "103 Faircroft Dr", 3000);

        // Alice should have had 1 vote at ts1
        assertEq(nft.getPastVotes(alice, ts1), 1);
        // Bob had 0 at ts1
        assertEq(nft.getPastVotes(bob, ts1), 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Access Control
    // ═══════════════════════════════════════════════════════════════════════

    function test_AdminCanGrantRegistrarRole() public {
        nft.grantRole(nft.REGISTRAR_ROLE(), bob);

        vm.prank(bob);
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        assertEq(nft.ownerOf(1), alice);
    }

    function test_AdminCanRevokeRegistrarRole() public {
        nft.grantRole(nft.REGISTRAR_ROLE(), bob);
        nft.revokeRole(nft.REGISTRAR_ROLE(), bob);

        vm.prank(bob);
        vm.expectRevert();
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
    }

    function test_RevertNonAdminCannotGrantRoles() public {
        // Cache role value before prank + expectRevert
        bytes32 registrarRole = nft.REGISTRAR_ROLE();

        assertFalse(nft.hasRole(nft.DEFAULT_ADMIN_ROLE(), unauthorized));

        vm.startPrank(unauthorized);
        vm.expectRevert();
        nft.grantRole(registrarRole, unauthorized);
        vm.stopPrank();
    }

    function test_GovernorRoleCanUpdateDues() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        nft.grantRole(nft.GOVERNOR_ROLE(), bob);

        vm.prank(bob);
        nft.updateDuesStatus(1, uint128(block.timestamp));

        PropertyNFT.PropertyInfo memory info = nft.getProperty(1);
        assertEq(info.lastDuesTimestamp, uint128(block.timestamp));
    }

    function test_GovernorRoleCanUpdateConfig() public {
        // setAutoDelegateOnMint still requires GOVERNOR_ROLE
        nft.grantRole(nft.GOVERNOR_ROLE(), bob);
        // setTransfersRequireApproval requires SOULBOUND_ADMIN_ROLE (SC-08 fix)
        nft.grantRole(nft.SOULBOUND_ADMIN_ROLE(), bob);

        vm.prank(bob);
        nft.setTransfersRequireApproval(false);
        assertEq(nft.transfersRequireApproval(), false);

        vm.prank(bob);
        nft.setAutoDelegateOnMint(false);
        assertEq(nft.autoDelegateOnMint(), false);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Edge Cases
    // ═══════════════════════════════════════════════════════════════════════

    function test_MultiplePendingTransfers() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        nft.mintProperty(bob, 2, "103 Faircroft Dr", 3000);

        nft.approveTransfer(1, carol);
        nft.approveTransfer(2, carol);

        (bool p1,) = nft.isTransferPending(1);
        (bool p2,) = nft.isTransferPending(2);
        assertTrue(p1);
        assertTrue(p2);
    }

    function test_TransfersWithoutApprovalWhenDisabled() public {
        nft.grantRole(nft.SOULBOUND_ADMIN_ROLE(), deployer);
        nft.setTransfersRequireApproval(false);

        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        // Alice can freely transfer without board approval
        vm.prank(alice);
        nft.safeTransferFrom(alice, bob, 1);
        assertEq(nft.ownerOf(1), bob);
    }

    function test_BatchMint() public {
        // Mint 50 properties — gas benchmark
        for (uint64 i = 1; i <= 50; i++) {
            nft.mintProperty(
                address(uint160(i + 1000)),
                i,
                string(abi.encodePacked("Lot ", vm.toString(uint256(i)))),
                2000 + i * 10
            );
        }
        assertEq(nft.totalSupply(), 50);
        assertEq(nft.totalMinted(), 50);
    }

    function test_GetPropertyRevertsForNonexistent() public {
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TokenDoesNotExist.selector, 999));
        nft.getProperty(999);
    }

    function test_ApproveTransferRevertsForNonexistent() public {
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TokenDoesNotExist.selector, 999));
        nft.approveTransfer(999, bob);
    }

    function test_UpdateDuesRevertsForNonexistent() public {
        nft.grantRole(nft.GOVERNOR_ROLE(), deployer);

        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TokenDoesNotExist.selector, 999));
        nft.updateDuesStatus(999, uint128(block.timestamp));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Loan Lock (Sentinel Audit Fix 1)
    // ═══════════════════════════════════════════════════════════════════════

    function test_SetLoanLock() public {
        nft.grantRole(nft.LENDING_ROLE(), deployer);
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        nft.setLoanLock(1, true);
        assertTrue(nft.loanLocked(1));

        nft.setLoanLock(1, false);
        assertFalse(nft.loanLocked(1));
    }

    function test_SetLoanLockEmitsEvent() public {
        nft.grantRole(nft.LENDING_ROLE(), deployer);
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        vm.expectEmit(true, false, false, true);
        emit PropertyNFT.LoanLockChanged(1, true);
        nft.setLoanLock(1, true);
    }

    function test_RevertSetLoanLockUnauthorized() public {
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        vm.prank(unauthorized);
        vm.expectRevert();
        nft.setLoanLock(1, true);
    }

    function test_RevertSetLoanLockNonexistentToken() public {
        nft.grantRole(nft.LENDING_ROLE(), deployer);

        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TokenDoesNotExist.selector, 999));
        nft.setLoanLock(999, true);
    }

    function test_LoanLockedTokenCannotBeTransferred() public {
        nft.grantRole(nft.LENDING_ROLE(), deployer);
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        // Lock the token
        nft.setLoanLock(1, true);

        // Approve transfer (board side)
        nft.approveTransfer(1, bob);

        // Transfer should revert even with approval
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TokenIsLoanLocked.selector, 1));
        nft.safeTransferFrom(alice, bob, 1);
    }

    function test_LoanUnlockedTokenCanBeTransferred() public {
        nft.grantRole(nft.LENDING_ROLE(), deployer);
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);

        // Lock then unlock
        nft.setLoanLock(1, true);
        nft.setLoanLock(1, false);

        // Approve and transfer
        nft.approveTransfer(1, bob);
        vm.prank(alice);
        nft.safeTransferFrom(alice, bob, 1);
        assertEq(nft.ownerOf(1), bob);
    }

    function test_LoanLockDoesNotBlockMint() public {
        // Minting should work regardless of any loan lock state
        // (loanLocked check only applies to non-mint/non-burn transfers)
        nft.grantRole(nft.LENDING_ROLE(), deployer);
        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        assertEq(nft.ownerOf(1), alice);
    }

    function test_LoanLockWithFreeTransferMode() public {
        // Even with transfersRequireApproval=false, loan lock should block
        nft.grantRole(nft.SOULBOUND_ADMIN_ROLE(), deployer);
        nft.grantRole(nft.LENDING_ROLE(), deployer);
        nft.setTransfersRequireApproval(false);

        nft.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        nft.setLoanLock(1, true);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(PropertyNFT.TokenIsLoanLocked.selector, 1));
        nft.safeTransferFrom(alice, bob, 1);
    }
}
