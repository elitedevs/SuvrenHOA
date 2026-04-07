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

    // ── Constants ─────────────────────────────────────────────────────────────

    /// @notice SC-08: sentinel value meaning "this document does not supersede any other."
    ///         uint48(0) is ambiguous — docId 0 is a valid existing document, so storing
    ///         supersedes=0 could mean either "no supersession" or "supersedes doc 0".
    ///         We use type(uint48).max as the explicit no-supersession marker instead.
    uint48 public constant SUPERSEDES_NONE = type(uint48).max;

    /// @notice SC-15: Expected IPFS CIDv1 prefix (base32 lowercase, "bafy...").
    ///         Callers may pass an empty string to skip IPFS storage.
    bytes public constant IPFS_CID_PREFIX = bytes("bafy");

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
        /// @dev SUPERSEDES_NONE (type(uint48).max) = no supersession.
        ///      Any other value = docId this document replaces.
        uint48  supersedes;
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

    /// @notice SC-07: O(1) latest-version lookup.
    ///         _nextVersion[docId] = the docId that supersedes this one.
    ///         0 means "no next version" (docId 0 is the first doc; it can never
    ///         be the superseding doc of an earlier doc, so 0 is safe as sentinel).
    mapping(uint256 docId => uint256 nextDocId) private _nextVersion;

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
    error InvalidIpfsCid(string ipfsCid);

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
     * @param ipfsCid IPFS Content ID for fast retrieval (optional; if non-empty must start with "bafy")
     * @param docType Category of document
     * @param title Human-readable document title
     * @param supersedes DocId this document replaces (pass 0 to indicate no supersession,
     *                   stored internally as SUPERSEDES_NONE = type(uint48).max)
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

        // SC-15: validate IPFS CID format if provided
        if (bytes(p.ipfsCid).length > 0) {
            bytes memory cid = bytes(p.ipfsCid);
            if (cid.length < 4 ||
                cid[0] != IPFS_CID_PREFIX[0] ||
                cid[1] != IPFS_CID_PREFIX[1] ||
                cid[2] != IPFS_CID_PREFIX[2] ||
                cid[3] != IPFS_CID_PREFIX[3]
            ) {
                revert InvalidIpfsCid(p.ipfsCid);
            }
        }

        // SC-08: validate supersedes. p.supersedes==0 means "no supersession".
        // Any non-zero value must reference an existing document.
        bool hasSupersedes = (p.supersedes != 0);
        if (hasSupersedes && p.supersedes >= documents.length) revert InvalidSupersedes(p.supersedes);

        uint256 docId = documents.length;
        documents.push(Document({
            contentHash: p.contentHash,
            timestamp: uint48(block.timestamp),
            // SC-08: use SUPERSEDES_NONE sentinel for "no supersession" to disambiguate
            // from docId 0 (a valid document).
            supersedes: hasSupersedes ? uint48(p.supersedes) : SUPERSEDES_NONE,
            docType: p.docType,
            uploadedBy: msg.sender,
            arweaveTxId: p.arweaveTxId,
            ipfsCid: p.ipfsCid,
            title: p.title
        }));

        hashExists[p.contentHash] = true;
        hashToDocId[p.contentHash] = docId;

        // SC-07: record the forward link for O(1) latest-version lookup
        if (hasSupersedes) {
            _nextVersion[p.supersedes] = docId;
        }

        emit DocumentRegistered(docId, p.contentHash, p.docType, p.title, p.arweaveTxId, msg.sender);

        if (hasSupersedes) {
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
     * @notice Get a page of document IDs of a specific type.
     * @dev SC-07: pagination prevents unbounded gas cost for large document sets.
     *      Pass offset=0, limit=50 for the first page. Iterate by advancing offset.
     * @param docType The document category to filter by
     * @param offset  Zero-based index into the type-filtered result set to start from
     * @param limit   Maximum number of IDs to return (capped at 100)
     * @return ids Matching document IDs
     * @return total Total number of documents of this type (for client-side pagination)
     */
    function getDocumentsByType(
        DocType docType,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory ids, uint256 total) {
        if (limit > 100) limit = 100;

        // First pass: count matching docs
        uint256 count = 0;
        for (uint256 i = 0; i < documents.length; i++) {
            if (documents[i].docType == docType) count++;
        }
        total = count;

        if (count == 0 || offset >= count) {
            return (new uint256[](0), total);
        }

        // Second pass: collect the requested page
        uint256 remaining = count - offset;
        uint256 pageSize = remaining < limit ? remaining : limit;
        ids = new uint256[](pageSize);

        uint256 matched = 0;
        uint256 filled = 0;
        for (uint256 i = 0; i < documents.length && filled < pageSize; i++) {
            if (documents[i].docType == docType) {
                if (matched >= offset) {
                    ids[filled++] = i;
                }
                matched++;
            }
        }
    }

    /**
     * @notice Get the latest version of a document chain.
     * @dev SC-07: O(chain length) using the _nextVersion forward-link map,
     *      compared to O(n all documents) in the previous scan-based implementation.
     *      Chain length is bounded by the number of times a document has been
     *      superseded — typically 1-3 revisions in practice.
     * @param docId Starting document ID
     * @return latest The docId of the most recent version in this chain
     */
    function getLatestVersion(uint256 docId) external view returns (uint256) {
        if (docId >= documents.length) revert InvalidDocId(docId);
        uint256 latest = docId;
        uint256 next = _nextVersion[latest];
        // Follow the chain. _nextVersion[x] == 0 means no further version
        // (0 is safe as sentinel because docId 0, being the first document,
        // cannot be the superseding version of any later document).
        while (next != 0) {
            latest = next;
            next = _nextVersion[latest];
        }
        return latest;
    }

    /**
     * @notice Check whether a document supersedes another (SC-08 helper).
     * @param docId The document to inspect
     * @return hasSupersedesFlag true if this document supersedes a prior one
     * @return supersededDocId The docId it replaces (valid only when hasSupersedesFlag == true)
     */
    function getSupersedes(uint256 docId) external view returns (
        bool hasSupersedesFlag,
        uint256 supersededDocId
    ) {
        if (docId >= documents.length) revert InvalidDocId(docId);
        uint48 sup = documents[docId].supersedes;
        if (sup == SUPERSEDES_NONE) return (false, 0);
        return (true, uint256(sup));
    }
}
