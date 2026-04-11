// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../../src/PropertyNFT.sol";

/**
 * @title PropertyNFTHandler
 * @notice Handler for PropertyNFT invariant fuzzing. Exercises minting, transfer
 *         approval workflow (soulbound path), loan-lock toggle, and actual
 *         safeTransferFrom execution. Holds REGISTRAR_ROLE and LENDING_ROLE.
 *         Intentionally does NOT hold SOULBOUND_ADMIN_ROLE — we want
 *         transfersRequireApproval to stay true throughout the run so we can
 *         assert the soulbound invariant always holds.
 *
 * Critical invariants exercised:
 *   - totalSupply() <= maxLots                                (cap enforcement)
 *   - Σ balanceOf(actor)_known == totalSupply()               (no orphans)
 *   - Loan-locked tokens never change ownership               (ghost-witnessed)
 *   - transfersRequireApproval == true                        (never toggled)
 */
contract PropertyNFTHandler is Test {
    PropertyNFT public immutable nft;
    address[] public actors;

    // Track locked token → owner at lock time so the invariant contract can
    // assert the owner is frozen while the lock is held.
    mapping(uint256 tokenId => address) public ownerWhenLocked;
    uint256[] public lockedTokens;
    mapping(uint256 tokenId => bool) public isTrackedLocked;

    // Ghost counters
    uint256 public callsMint;
    uint256 public callsApproveTransfer;
    uint256 public callsRevokeApproval;
    uint256 public callsExecuteTransfer;
    uint256 public callsSetLoanLock;
    uint256 public callsUnsetLoanLock;

    uint256 public ghost_mintedCount;
    uint256 public ghost_transferCount;

    constructor(PropertyNFT _nft, address[] memory _actors) {
        nft = _nft;
        for (uint256 i = 0; i < _actors.length; i++) actors.push(_actors[i]);
    }

    function _pickActor(uint256 seed) internal view returns (address) {
        if (actors.length == 0) return address(0);
        return actors[seed % actors.length];
    }

    function actorCount() external view returns (uint256) { return actors.length; }
    function lockedCount() external view returns (uint256) { return lockedTokens.length; }
    function lockedAt(uint256 i) external view returns (uint256) { return lockedTokens[i]; }

    // ── Mint a property to a random actor ────────────────────────────────────

    function mint(uint256 actorSeed, uint256 lotSeed) external {
        callsMint++;
        address to = _pickActor(actorSeed);
        if (to == address(0)) return;

        uint64 lotNumber = uint64(bound(lotSeed, 1, nft.maxLots()));
        if (nft.lotExists(lotNumber)) return;

        try nft.mintProperty(to, lotNumber, "fuzz lot", 2500) {
            ghost_mintedCount++;
        } catch {}
    }

    // ── Approve a transfer, then have the current owner execute it ───────────

    function approveTransfer(uint256 tokenSeed, uint256 buyerSeed) external {
        callsApproveTransfer++;
        uint64 lotNumber = uint64(bound(tokenSeed, 1, nft.maxLots()));
        if (!nft.lotExists(lotNumber)) return;
        if (nft.loanLocked(lotNumber)) return;

        address buyer = _pickActor(buyerSeed);
        if (buyer == address(0)) return;
        if (buyer == nft.ownerOf(lotNumber)) return;

        try nft.approveTransfer(lotNumber, buyer) {} catch {}
    }

    function revokeApproval(uint256 tokenSeed) external {
        callsRevokeApproval++;
        uint64 lotNumber = uint64(bound(tokenSeed, 1, nft.maxLots()));
        try nft.revokeTransferApproval(lotNumber) {} catch {}
    }

    /// @notice Execute a pending safeTransferFrom on behalf of the current owner.
    function executeTransfer(uint256 tokenSeed) external {
        callsExecuteTransfer++;
        uint64 lotNumber = uint64(bound(tokenSeed, 1, nft.maxLots()));
        if (!nft.lotExists(lotNumber)) return;
        if (nft.loanLocked(lotNumber)) return;

        (bool pending, address buyer) = nft.isTransferPending(lotNumber);
        if (!pending) return;

        address from = nft.ownerOf(lotNumber);
        if (from == buyer) return;

        vm.prank(from);
        try nft.safeTransferFrom(from, buyer, lotNumber) {
            ghost_transferCount++;
        } catch {}
    }

    // ── Toggle a loan lock ───────────────────────────────────────────────────

    function setLoanLock(uint256 tokenSeed) external {
        callsSetLoanLock++;
        uint64 lotNumber = uint64(bound(tokenSeed, 1, nft.maxLots()));
        if (!nft.lotExists(lotNumber)) return;
        if (nft.loanLocked(lotNumber)) return;

        try nft.setLoanLock(lotNumber, true) {
            ownerWhenLocked[lotNumber] = nft.ownerOf(lotNumber);
            if (!isTrackedLocked[lotNumber]) {
                isTrackedLocked[lotNumber] = true;
                lockedTokens.push(lotNumber);
            }
        } catch {}
    }

    function unsetLoanLock(uint256 tokenSeed) external {
        callsUnsetLoanLock++;
        uint64 lotNumber = uint64(bound(tokenSeed, 1, nft.maxLots()));
        if (!nft.lotExists(lotNumber)) return;
        if (!nft.loanLocked(lotNumber)) return;

        try nft.setLoanLock(lotNumber, false) {
            isTrackedLocked[lotNumber] = false;
            ownerWhenLocked[lotNumber] = address(0);
        } catch {}
    }

    // ── View helpers for invariant contract ──────────────────────────────────

    function sumKnownActorBalances() external view returns (uint256 total) {
        for (uint256 i = 0; i < actors.length; i++) {
            total += nft.balanceOf(actors[i]);
        }
    }
}
