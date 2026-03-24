// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/DocumentRegistry.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

contract DocumentRegistryTest is Test {
    DocumentRegistry public registry;

    address public deployer = address(this);
    address public board = address(0xB0A2D);
    address public unauthorized = address(0xDEAD);

    bytes32 constant HASH_1 = keccak256("Faircroft CC&Rs v1.0 - full document content");
    bytes32 constant HASH_2 = keccak256("Board meeting minutes 2026-03-15");
    bytes32 constant HASH_3 = keccak256("Annual budget 2026-2027");
    bytes32 constant HASH_4 = keccak256("Faircroft CC&Rs v2.0 - amended");

    function setUp() public {
        registry = new DocumentRegistry();
        registry.grantRole(registry.RECORDER_ROLE(), board);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Registration
    // ═══════════════════════════════════════════════════════════════════════

    function test_RegisterDocument() public {
        uint256 docId = registry.registerDocument(
            HASH_1,
            "abc123def456ghi789jkl012mno345pqr678stu90v",
            "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
            DocumentRegistry.DocType.CCR,
            "Faircroft CC&Rs",
            0
        );

        assertEq(docId, 0);
        assertEq(registry.getDocumentCount(), 1);
        assertTrue(registry.hashExists(HASH_1));
        assertEq(registry.hashToDocId(HASH_1), 0);
    }

    function test_RegisterDocumentFields() public {
        registry.registerDocument(
            HASH_1,
            "arweave-tx-id-here",
            "ipfs-cid-here",
            DocumentRegistry.DocType.CCR,
            "Faircroft CC&Rs",
            0
        );

        DocumentRegistry.Document memory doc = registry.getDocument(0);
        assertEq(doc.contentHash, HASH_1);
        assertEq(doc.timestamp, uint48(block.timestamp));
        assertEq(doc.supersedes, 0);
        assertEq(uint8(doc.docType), uint8(DocumentRegistry.DocType.CCR));
        assertEq(doc.uploadedBy, deployer);
        assertEq(keccak256(bytes(doc.arweaveTxId)), keccak256(bytes("arweave-tx-id-here")));
        assertEq(keccak256(bytes(doc.ipfsCid)), keccak256(bytes("ipfs-cid-here")));
        assertEq(keccak256(bytes(doc.title)), keccak256(bytes("Faircroft CC&Rs")));
    }

    function test_RegisterEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit DocumentRegistry.DocumentRegistered(
            0,
            HASH_1,
            DocumentRegistry.DocType.CCR,
            "Faircroft CC&Rs",
            "arweave-tx-id",
            deployer
        );
        registry.registerDocument(
            HASH_1,
            "arweave-tx-id",
            "",
            DocumentRegistry.DocType.CCR,
            "Faircroft CC&Rs",
            0
        );
    }

    function test_RegisterSequentialIds() public {
        uint256 id0 = registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.CCR, "Doc 1", 0);
        uint256 id1 = registry.registerDocument(HASH_2, "tx2", "", DocumentRegistry.DocType.Minutes, "Doc 2", 0);
        uint256 id2 = registry.registerDocument(HASH_3, "tx3", "", DocumentRegistry.DocType.Budget, "Doc 3", 0);

        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(registry.getDocumentCount(), 3);
    }

    function test_RegisterFromBoard() public {
        vm.prank(board);
        uint256 docId = registry.registerDocument(
            HASH_1, "tx1", "", DocumentRegistry.DocType.Minutes, "Meeting Minutes", 0
        );
        assertEq(docId, 0);

        DocumentRegistry.Document memory doc = registry.getDocument(0);
        assertEq(doc.uploadedBy, board);
    }

    function test_RevertRegisterDuplicateHash() public {
        registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.CCR, "Doc 1", 0);

        vm.expectRevert(abi.encodeWithSelector(
            DocumentRegistry.DocumentAlreadyRegistered.selector, HASH_1
        ));
        registry.registerDocument(HASH_1, "tx2", "", DocumentRegistry.DocType.CCR, "Doc 1 Copy", 0);
    }

    function test_RevertRegisterEmptyHash() public {
        vm.expectRevert(DocumentRegistry.EmptyContentHash.selector);
        registry.registerDocument(bytes32(0), "tx1", "", DocumentRegistry.DocType.CCR, "Doc 1", 0);
    }

    function test_RevertRegisterEmptyArweave() public {
        vm.expectRevert(DocumentRegistry.EmptyArweaveId.selector);
        registry.registerDocument(HASH_1, "", "", DocumentRegistry.DocType.CCR, "Doc 1", 0);
    }

    function test_RevertRegisterEmptyTitle() public {
        vm.expectRevert(DocumentRegistry.EmptyTitle.selector);
        registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.CCR, "", 0);
    }

    function test_RevertRegisterUnauthorized() public {
        bytes32 recorderRole = registry.RECORDER_ROLE();

        vm.startPrank(unauthorized);
        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            unauthorized,
            recorderRole
        ));
        registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.CCR, "Doc 1", 0);
        vm.stopPrank();
    }

    function test_RevertRegisterInvalidSupersedes() public {
        // No documents exist yet, so superseding docId 5 is invalid
        vm.expectRevert(abi.encodeWithSelector(
            DocumentRegistry.InvalidSupersedes.selector, 5
        ));
        registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.CCR, "Doc 1", 5);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Verification
    // ═══════════════════════════════════════════════════════════════════════

    function test_VerifyRegisteredDocument() public {
        registry.registerDocument(HASH_1, "tx1", "cid1", DocumentRegistry.DocType.CCR, "CC&Rs", 0);

        (bool exists, uint256 docId, DocumentRegistry.Document memory doc) = registry.verifyDocument(HASH_1);

        assertTrue(exists);
        assertEq(docId, 0);
        assertEq(doc.contentHash, HASH_1);
        assertEq(keccak256(bytes(doc.title)), keccak256(bytes("CC&Rs")));
    }

    function test_VerifyUnregisteredDocument() public {
        (bool exists, uint256 docId, ) = registry.verifyDocument(HASH_1);

        assertFalse(exists);
        assertEq(docId, 0);
    }

    function test_GetDocumentRevertsForInvalidId() public {
        vm.expectRevert(abi.encodeWithSelector(
            DocumentRegistry.InvalidDocId.selector, 0
        ));
        registry.getDocument(0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Version Chain
    // ═══════════════════════════════════════════════════════════════════════

    function test_SupersedesDocId1() public {
        // Register placeholder at docId 0 and real doc at docId 1
        registry.registerDocument(HASH_1, "tx0", "", DocumentRegistry.DocType.Other, "placeholder", 0);
        registry.registerDocument(HASH_2, "tx1", "", DocumentRegistry.DocType.CCR, "CC&Rs v1", 0);

        // Register v2 that supersedes docId 1 (CC&Rs v1)
        vm.expectEmit(true, true, false, false);
        emit DocumentRegistry.DocumentSuperseded(2, 1);

        bytes32 h3 = keccak256("CC&Rs v2 content");
        registry.registerDocument(h3, "tx2", "", DocumentRegistry.DocType.Amendment, "CC&Rs v2", 1);

        // Verify supersedes link
        DocumentRegistry.Document memory doc = registry.getDocument(2);
        assertEq(doc.supersedes, 1);
    }

    function test_VersionChainThreeDeep() public {
        // placeholder at 0, then v1→v2→v3
        registry.registerDocument(HASH_1, "tx0", "", DocumentRegistry.DocType.Other, "placeholder", 0);
        
        bytes32 h1 = keccak256("v1");
        registry.registerDocument(h1, "tx1", "", DocumentRegistry.DocType.CCR, "v1", 0); // docId 1

        bytes32 h2 = keccak256("v2");
        registry.registerDocument(h2, "tx2", "", DocumentRegistry.DocType.Amendment, "v2", 1); // docId 2, supersedes 1

        bytes32 h3 = keccak256("v3");
        registry.registerDocument(h3, "tx3", "", DocumentRegistry.DocType.Amendment, "v3", 2); // docId 3, supersedes 2

        assertEq(registry.getLatestVersion(1), 3);
    }

    function test_DocIdZeroCannotBeSuperseded() public {
        // supersedes=0 means "no supersession" — this is a known design tradeoff.
        // docId 0 can still be versioned via getLatestVersion forward scanning.
        registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.CCR, "v1", 0);
        
        bytes32 h2 = keccak256("v2");
        // This registers with supersedes=0 (no supersession link), but getLatestVersion
        // won't chain them. This is acceptable — use placeholder at docId 0 in production.
        registry.registerDocument(h2, "tx2", "", DocumentRegistry.DocType.Amendment, "v2", 0);

        assertEq(registry.getDocumentCount(), 2);
        // These are independent documents (no chain)
        assertEq(registry.getLatestVersion(0), 0);
        assertEq(registry.getLatestVersion(1), 1);
    }

    function test_SupersedesEmitsEvent() public {
        registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.CCR, "v1", 0);
        registry.registerDocument(HASH_2, "tx2", "", DocumentRegistry.DocType.Minutes, "other", 0);

        // docId 2 supersedes docId 1
        vm.expectEmit(true, true, false, false);
        emit DocumentRegistry.DocumentSuperseded(2, 1);

        bytes32 h3 = keccak256("v3 content");
        registry.registerDocument(h3, "tx3", "", DocumentRegistry.DocType.Amendment, "v2 of CCR", 1);
    }

    function test_GetLatestVersion() public {
        // Register 3 docs where each supersedes the previous (using docIds > 0)
        registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.Other, "placeholder", 0); // docId 0
        
        bytes32 h1 = keccak256("ccr v1");
        registry.registerDocument(h1, "tx2", "", DocumentRegistry.DocType.CCR, "CC&Rs v1", 0); // docId 1

        bytes32 h2 = keccak256("ccr v2");
        registry.registerDocument(h2, "tx3", "", DocumentRegistry.DocType.Amendment, "CC&Rs v2", 1); // docId 2, supersedes 1

        bytes32 h3 = keccak256("ccr v3");
        registry.registerDocument(h3, "tx4", "", DocumentRegistry.DocType.Amendment, "CC&Rs v3", 2); // docId 3, supersedes 2

        // getLatestVersion(1) should follow chain: 1 → 2 → 3
        assertEq(registry.getLatestVersion(1), 3);
        assertEq(registry.getLatestVersion(2), 3);
        assertEq(registry.getLatestVersion(3), 3);
    }

    function test_GetLatestVersionNoSuccessors() public {
        registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.CCR, "Standalone", 0);
        assertEq(registry.getLatestVersion(0), 0);
    }

    function test_GetLatestVersionRevertsInvalidId() public {
        vm.expectRevert(abi.encodeWithSelector(DocumentRegistry.InvalidDocId.selector, 99));
        registry.getLatestVersion(99);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Document Type Filtering
    // ═══════════════════════════════════════════════════════════════════════

    function test_GetDocumentsByType() public {
        registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.CCR, "CC&Rs", 0);
        registry.registerDocument(HASH_2, "tx2", "", DocumentRegistry.DocType.Minutes, "Minutes 1", 0);
        registry.registerDocument(HASH_3, "tx3", "", DocumentRegistry.DocType.Minutes, "Minutes 2", 0);

        uint256[] memory minutesDocs = registry.getDocumentsByType(DocumentRegistry.DocType.Minutes);
        assertEq(minutesDocs.length, 2);
        assertEq(minutesDocs[0], 1);
        assertEq(minutesDocs[1], 2);

        uint256[] memory ccrs = registry.getDocumentsByType(DocumentRegistry.DocType.CCR);
        assertEq(ccrs.length, 1);
        assertEq(ccrs[0], 0);

        uint256[] memory budgets = registry.getDocumentsByType(DocumentRegistry.DocType.Budget);
        assertEq(budgets.length, 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Access Control
    // ═══════════════════════════════════════════════════════════════════════

    function test_AdminCanGrantRecorderRole() public {
        registry.grantRole(registry.RECORDER_ROLE(), unauthorized);

        vm.prank(unauthorized);
        registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.CCR, "Doc", 0);
        assertEq(registry.getDocumentCount(), 1);
    }

    function test_AdminCanRevokeRecorderRole() public {
        registry.revokeRole(registry.RECORDER_ROLE(), board);

        bytes32 recorderRole = registry.RECORDER_ROLE();
        vm.startPrank(board);
        vm.expectRevert(abi.encodeWithSelector(
            IAccessControl.AccessControlUnauthorizedAccount.selector,
            board,
            recorderRole
        ));
        registry.registerDocument(HASH_1, "tx1", "", DocumentRegistry.DocType.CCR, "Doc", 0);
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Edge Cases
    // ═══════════════════════════════════════════════════════════════════════

    function test_EmptyIpfsCidAllowed() public {
        // IPFS CID is optional
        registry.registerDocument(HASH_1, "arweave-only", "", DocumentRegistry.DocType.CCR, "Doc", 0);
        DocumentRegistry.Document memory doc = registry.getDocument(0);
        assertEq(bytes(doc.ipfsCid).length, 0);
    }

    function test_AllDocTypes() public {
        bytes32[10] memory hashes;
        for (uint8 i = 0; i < 10; i++) {
            hashes[i] = keccak256(abi.encodePacked("doc type test", i));
            registry.registerDocument(
                hashes[i],
                string(abi.encodePacked("tx", vm.toString(uint256(i)))),
                "",
                DocumentRegistry.DocType(i),
                string(abi.encodePacked("Type ", vm.toString(uint256(i)))),
                0
            );
        }
        assertEq(registry.getDocumentCount(), 10);
    }

    function test_LargeDocumentCorpus() public {
        // Register 50 documents — gas benchmark
        for (uint256 i = 0; i < 50; i++) {
            bytes32 h = keccak256(abi.encodePacked("corpus doc", i));
            registry.registerDocument(
                h,
                string(abi.encodePacked("tx-", vm.toString(i))),
                "",
                DocumentRegistry.DocType(uint8(i % 10)),
                string(abi.encodePacked("Document #", vm.toString(i))),
                0
            );
        }
        assertEq(registry.getDocumentCount(), 50);
    }
}
