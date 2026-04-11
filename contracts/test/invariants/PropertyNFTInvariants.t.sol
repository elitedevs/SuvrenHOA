// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";
import "../../src/PropertyNFT.sol";
import "./handlers/PropertyNFTHandler.sol";

/**
 * @title PropertyNFTInvariants
 * @notice StdInvariant suite for PropertyNFT. The key properties exercised are
 *         the supply cap (maxLots), the conservation of token ownership across
 *         the known actor set, and the SC-08 soulbound/loan-lock guarantee:
 *         a loan-locked token cannot change hands.
 *
 * Invariants:
 *   INV_A — totalSupply() <= maxLots                               (SC-09 cap regression guard)
 *   INV_B — Σ balanceOf(actor) for known actors == totalSupply()   (no orphans)
 *   INV_C — loan-locked tokens never change owner                  (SC-08 / loan-lock)
 *   INV_D — transfersRequireApproval stays true                    (soulbound intact)
 */
contract PropertyNFTInvariants is StdInvariant, Test {
    PropertyNFT public nft;
    PropertyNFTHandler public handler;

    uint256 public constant MAX_LOTS = 20;

    address public alice = address(0xA11CE);
    address public bob   = address(0xB0B);
    address public carol = address(0xCA201);
    address public dave  = address(0xDA7E);
    address public eve   = address(0xE7E);

    function setUp() public {
        nft = new PropertyNFT(MAX_LOTS, "Faircroft Property", "FAIR");

        address[] memory actors = new address[](5);
        actors[0] = alice; actors[1] = bob; actors[2] = carol; actors[3] = dave; actors[4] = eve;

        handler = new PropertyNFTHandler(nft, actors);

        // Grant the handler the roles it needs to exercise the surface.
        // Intentionally NOT granting SOULBOUND_ADMIN_ROLE — we want
        // transfersRequireApproval to stay true so INV_D always holds.
        nft.grantRole(nft.REGISTRAR_ROLE(), address(handler));
        nft.grantRole(nft.LENDING_ROLE(),   address(handler));

        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = PropertyNFTHandler.mint.selector;
        selectors[1] = PropertyNFTHandler.approveTransfer.selector;
        selectors[2] = PropertyNFTHandler.revokeApproval.selector;
        selectors[3] = PropertyNFTHandler.executeTransfer.selector;
        selectors[4] = PropertyNFTHandler.setLoanLock.selector;
        selectors[5] = PropertyNFTHandler.unsetLoanLock.selector;
        selectors[6] = PropertyNFTHandler.mint.selector; // bias mint for coverage
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  INVARIANTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice INV_A — totalSupply never exceeds the immutable cap.
    function invariant_A_supplyCapHolds() public view {
        assertLe(nft.totalSupply(), nft.maxLots(), "INV_A: totalSupply exceeded maxLots");
    }

    /// @notice INV_B — Every minted token is owned by one of the known actors.
    ///         (The handler only ever mints/transfers to actors, so no token
    ///         should end up at an unknown address.)
    function invariant_B_balanceConservation() public view {
        assertEq(
            handler.sumKnownActorBalances(),
            nft.totalSupply(),
            "INV_B: balance sum drifted from totalSupply"
        );
    }

    /// @notice INV_C — loan-locked tokens never change owner. The handler
    ///         records ownerWhenLocked[tokenId] at lock time; while the lock
    ///         is held, ownerOf must match that frozen value.
    function invariant_C_loanLockFreezesOwner() public view {
        uint256 n = handler.lockedCount();
        for (uint256 i = 0; i < n; i++) {
            uint256 tokenId = handler.lockedAt(i);
            if (!handler.isTrackedLocked(tokenId)) continue;
            if (!nft.loanLocked(tokenId)) continue; // lock cleared
            address frozen = handler.ownerWhenLocked(tokenId);
            address current = nft.ownerOf(tokenId);
            assertEq(current, frozen, "INV_C: loan-locked token changed owner");
        }
    }

    /// @notice INV_D — transfersRequireApproval never flips to false. This is
    ///         enforced by not granting SOULBOUND_ADMIN_ROLE to the handler;
    ///         we still assert it in case of future escape-hatch bugs.
    function invariant_D_soulboundIntact() public view {
        assertTrue(
            nft.transfersRequireApproval(),
            "INV_D: soulbound flag flipped unexpectedly"
        );
    }

    /// @notice Fuzz distribution sanity — non-asserting visibility checkpoint.
    function invariant_callTrace() public view { /* no-op */ }
}
