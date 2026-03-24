// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DocumentRegistry
 * @notice Append-only registry of HOA documents. Stores SHA-256 content hashes
 *         on-chain with references to Arweave transaction IDs and IPFS CIDs.
 *         Provides tamper-proof verification — anyone can download a document
 *         from Arweave, hash it, and compare to the on-chain record.
 * @dev Intentionally simple and immutable. Documents are append-only —
 *      once registered, they cannot be modified or deleted. This is the whole point.
 */
contract DocumentRegistry is AccessControl {
    // ── Roles ────────────────────────────────────────────────────────────────

    /// @notice Role for registering documents (board multisig + Timelock)
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    // ── Types ────────────────────────────────────────────────────────────────

    enum DocType {
        CCR,            // 0 — Covenants, Conditions & Restrictions
        Minutes,        // 1 — Meeting minutes
        Budget,         // 2 — Annual/quarterly budget
        Amendment,      // 3 — CC&R or bylaw amendment
        Resolution,     // 4 — Board resolution
        Financial,      // 5 — Financial report/audit
        Architectural,  // 6 — Architectural guidelines
        Notice,         // 7 — Community notices
        Election,       // 8 — Election results
        Other           // 9 — Catch-all
    }

    struct Document {
        bytes32 contentHash;    // SHA-256 hash of document bytes
        uint48  timestamp;      // When registered on-chain
        uint48  supersedes;     // docId this replaces (0 = none / original)
        DocType docType;
        address uploadedBy;
        string  arweaveTxId;    // Arweave transaction ID (43 chars)
        string  ipfsCid;        // IPFS CID v1 for fast retrieval
        string  title;          // Human-readable title
    }

    // ── Storage ──────────────────────────────────────────────────────────────

    /// @notice All registered documents. docId == array index.
    Document[] public documents;

    /// @notice Lookup docId by content hash
    mapping(bytes32 contentHash => uint256 docId) public hashToDocId;

    /// @notice Whether a content hash has been registered
    mapping(bytes32 contentHash => bool) public hashExists;

    // ── Events ───────────────────────────────────────────────────────────────

    event DocumentRegistered(
        uint256 indexed docId,
        bytes32 indexed contentHash,
        DocType indexed docType,
        string  title,
        string  arweaveTxId,
        address uploadedBy
    );

    event DocumentSuperseded(
        uint256 indexed newDocId,
        uint256 indexed oldDocId
    );

    // ── Errors ───────────────────────────────────────────────────────────────

    error DocumentAlreadyRegistered(bytes32 contentHash);
    error EmptyContentHash();
    error EmptyArweaveId();
    error EmptyTitle();
    error InvalidDocId(uint256 docId);
    error InvalidSupersedes(uint256 docId);

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RECORDER_ROLE, msg.sender);
    }

    // ── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Register a new document hash with storage references
     * @param contentHash SHA-256 hash of the raw document bytes
     * @param arweaveTxId Arweave transaction ID (permanent storage)
     * @param ipfsCid IPFS Content ID for fast retrieval (optional)
     * @param docType Category of document
     * @param title Human-readable document title
     * @param supersedes DocId this document replaces (0 if original/none)
     * @return docId The assigned document ID
     */
    /// @dev Packed input struct to avoid stack-too-deep
    struct RegisterParams {
        bytes32 contentHash;
        string  arweaveTxId;
        string  ipfsCid;
        DocType docType;
        string  title;
        uint256 supersedes;
    }

    function registerDocument(
        bytes32 contentHash,
        string calldata arweaveTxId,
        string calldata ipfsCid,
        DocType docType,
        string calldata title,
        uint256 supersedes
    ) external onlyRole(RECORDER_ROLE) returns (uint256) {
        return _register(RegisterParams({
            contentHash: contentHash,
            arweaveTxId: arweaveTxId,
            ipfsCid: ipfsCid,
            docType: docType,
            title: title,
            supersedes: supersedes
        }));
    }

    function _register(RegisterParams memory p) internal returns (uint256) {
        if (p.contentHash == bytes32(0)) revert EmptyContentHash();
        if (bytes(p.arweaveTxId).length == 0) revert EmptyArweaveId();
        if (bytes(p.title).length == 0) revert EmptyTitle();
        if (hashExists[p.contentHash]) revert DocumentAlreadyRegistered(p.contentHash);
        if (p.supersedes > 0 && p.supersedes >= documents.length) revert InvalidSupersedes(p.supersedes);

        uint256 docId = documents.length;
        documents.push(Document({
            contentHash: p.contentHash,
            timestamp: uint48(block.timestamp),
            supersedes: uint48(p.supersedes),
            docType: p.docType,
            uploadedBy: msg.sender,
            arweaveTxId: p.arweaveTxId,
            ipfsCid: p.ipfsCid,
            title: p.title
        }));

        hashExists[p.contentHash] = true;
        hashToDocId[p.contentHash] = docId;

        emit DocumentRegistered(docId, p.contentHash, p.docType, p.title, p.arweaveTxId, msg.sender);

        if (p.supersedes > 0) {
            emit DocumentSuperseded(docId, p.supersedes);
        }

        return docId;
    }

    // ── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Verify a document by its content hash
     * @param contentHash SHA-256 hash to look up
     * @return exists Whether the hash is registered
     * @return docId The document ID (only valid if exists == true)
     * @return doc The full document record
     */
    function verifyDocument(bytes32 contentHash) external view returns (
        bool exists,
        uint256 docId,
        Document memory doc
    ) {
        if (!hashExists[contentHash]) return (false, 0, doc);
        docId = hashToDocId[contentHash];
        return (true, docId, documents[docId]);
    }

    /**
     * @notice Get a document by its ID
     */
    function getDocument(uint256 docId) external view returns (Document memory) {
        if (docId >= documents.length) revert InvalidDocId(docId);
        return documents[docId];
    }

    /**
     * @notice Total number of registered documents
     */
    function getDocumentCount() external view returns (uint256) {
        return documents.length;
    }

    /**
     * @notice Get all document IDs of a specific type
     * @dev O(n) scan — fine for small document sets (<1000). Use indexer for large sets.
     */
    function getDocumentsByType(DocType docType) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < documents.length; i++) {
            if (documents[i].docType == docType) count++;
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < documents.length; i++) {
            if (documents[i].docType == docType) {
                result[idx++] = i;
            }
        }
        return result;
    }

    /**
     * @notice Get the latest version of a document chain
     * @dev Follows supersedes chain forward to find the newest version.
     *      O(n) scan — fine for small sets. Indexer handles this for frontend.
     */
    function getLatestVersion(uint256 docId) external view returns (uint256) {
        if (docId >= documents.length) revert InvalidDocId(docId);
        uint256 latest = docId;
        for (uint256 i = docId + 1; i < documents.length; i++) {
            // Skip docs with supersedes=0 (means "no supersession") unless we're tracking docId>0
            uint48 sup = documents[i].supersedes;
            if (sup > 0 && sup == uint48(latest)) {
                latest = i;
            }
        }
        return latest;
    }
}
