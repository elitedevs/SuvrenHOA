// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/governance/utils/Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title PropertyNFT
 * @notice ERC-721 token representing property ownership in Faircroft HOA.
 *         Each lot gets exactly one NFT. The NFT carries voting power (1 NFT = 1 vote)
 *         and is transfer-restricted (soulbound except during verified property sales).
 * @dev Inherits ERC721Enumerable for totalSupply/tokenByIndex, Votes for governance,
 *      and AccessControl for role-based permissions.
 *      Uses TIMESTAMP-based clock mode (EIP-6372) — critical for L2 deployment.
 */
contract PropertyNFT is ERC721, ERC721Enumerable, Votes, AccessControl {
    // ── Roles ────────────────────────────────────────────────────────────────

    /// @notice Role for minting NFTs and approving transfers (board multisig)
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    /// @notice Role for governance operations (Governor contract via Timelock)
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    // ── Immutables ───────────────────────────────────────────────────────────

    /// @notice Maximum number of lots in the community (set at deploy, cannot change)
    uint256 public immutable maxLots;

    // ── Configuration ────────────────────────────────────────────────────────

    /// @notice Whether transfers require board approval (default: true)
    bool public transfersRequireApproval;

    /// @notice Whether new mints auto-delegate to self (default: true)
    bool public autoDelegateOnMint;

    // ── Property Data ────────────────────────────────────────────────────────

    struct PropertyInfo {
        uint64  lotNumber;         // 1-indexed lot number
        uint64  squareFootage;     // Optional metadata
        uint128 lastDuesTimestamp;  // Last dues payment timestamp (set by Treasury)
        string  streetAddress;      // "123 Faircroft Dr"
    }

    /// @notice Property data keyed by tokenId (tokenId == lotNumber)
    mapping(uint256 tokenId => PropertyInfo) public properties;

    // ── Transfer Control ─────────────────────────────────────────────────────

    /// @notice Pending transfer approvals: tokenId → approved buyer address
    mapping(uint256 tokenId => address approvedBuyer) public pendingTransfers;

    // ── Counters ─────────────────────────────────────────────────────────────

    /// @notice Total properties ever minted (never decremented)
    uint256 private _totalMinted;

    // ── Events ───────────────────────────────────────────────────────────────

    event PropertyMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint64 lotNumber,
        string streetAddress
    );

    event TransferApproved(
        uint256 indexed tokenId,
        address indexed currentOwner,
        address indexed approvedBuyer
    );

    event TransferApprovalRevoked(uint256 indexed tokenId);

    event DuesStatusUpdated(
        uint256 indexed tokenId,
        uint128 lastDuesTimestamp
    );

    event ConfigUpdated(string parameter, bool value);

    // ── Errors ───────────────────────────────────────────────────────────────

    error MaxLotsReached(uint256 maxLots);
    error LotAlreadyMinted(uint256 lotNumber);
    error TransferNotApproved(uint256 tokenId);
    error InvalidLotNumber(uint256 lotNumber);
    error ZeroAddress();
    error TokenDoesNotExist(uint256 tokenId);

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(
        uint256 _maxLots,
        string memory _name,   // "Faircroft Property"
        string memory _symbol  // "FAIR"
    ) ERC721(_name, _symbol) EIP712(_name, "1") {
        if (_maxLots == 0) revert InvalidLotNumber(0);

        maxLots = _maxLots;
        transfersRequireApproval = true;
        autoDelegateOnMint = true;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }

    // ── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Mint a property NFT for a verified homeowner
     * @dev Only callable by REGISTRAR_ROLE. Auto-delegates to owner if enabled.
     * @param to The property owner's wallet address
     * @param lotNumber The lot number (1-indexed, must be <= maxLots)
     * @param streetAddress Human-readable street address
     * @param sqft Square footage of the property
     * @return tokenId The minted token ID (== lotNumber)
     */
    function mintProperty(
        address to,
        uint64 lotNumber,
        string calldata streetAddress,
        uint64 sqft
    ) external onlyRole(REGISTRAR_ROLE) returns (uint256) {
        if (to == address(0)) revert ZeroAddress();
        if (lotNumber == 0 || lotNumber > maxLots) revert InvalidLotNumber(lotNumber);
        if (_ownerOf(lotNumber) != address(0)) revert LotAlreadyMinted(lotNumber);

        uint256 tokenId = lotNumber;
        _safeMint(to, tokenId);
        _totalMinted++;

        properties[tokenId] = PropertyInfo({
            lotNumber: lotNumber,
            streetAddress: streetAddress,
            squareFootage: sqft,
            lastDuesTimestamp: 0
        });

        // Auto-delegate to self so voting power is immediately active.
        // Without this, OZ ERC721Votes requires explicit delegate(self) before
        // voting power activates — terrible UX for non-crypto users.
        // Cost: ~25K extra gas (~$0.0005 on Base). Worth it.
        if (autoDelegateOnMint) {
            _delegate(to, to);
        }

        emit PropertyMinted(tokenId, to, lotNumber, streetAddress);
        return tokenId;
    }

    /**
     * @notice Board approves a property sale transfer
     * @dev Called when a property sale closes. The new owner must then call safeTransferFrom.
     * @param tokenId The lot being transferred
     * @param newOwner The verified buyer's wallet address
     */
    function approveTransfer(
        uint256 tokenId,
        address newOwner
    ) external onlyRole(REGISTRAR_ROLE) {
        if (newOwner == address(0)) revert ZeroAddress();
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);

        pendingTransfers[tokenId] = newOwner;
        emit TransferApproved(tokenId, ownerOf(tokenId), newOwner);
    }

    /**
     * @notice Revoke a pending transfer approval
     */
    function revokeTransferApproval(uint256 tokenId) external onlyRole(REGISTRAR_ROLE) {
        delete pendingTransfers[tokenId];
        emit TransferApprovalRevoked(tokenId);
    }

    /**
     * @notice Update the dues payment timestamp for a property
     * @dev Only callable by GOVERNOR_ROLE (Treasury via Timelock)
     */
    function updateDuesStatus(
        uint256 tokenId,
        uint128 timestamp
    ) external onlyRole(GOVERNOR_ROLE) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        properties[tokenId].lastDuesTimestamp = timestamp;
        emit DuesStatusUpdated(tokenId, timestamp);
    }

    /**
     * @notice Update contract configuration via governance
     */
    function setTransfersRequireApproval(bool value) external onlyRole(GOVERNOR_ROLE) {
        transfersRequireApproval = value;
        emit ConfigUpdated("transfersRequireApproval", value);
    }

    function setAutoDelegateOnMint(bool value) external onlyRole(GOVERNOR_ROLE) {
        autoDelegateOnMint = value;
        emit ConfigUpdated("autoDelegateOnMint", value);
    }

    // ── View Functions ───────────────────────────────────────────────────────

    /// @notice Get full property info for a token
    function getProperty(uint256 tokenId) external view returns (PropertyInfo memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return properties[tokenId];
    }

    /// @notice Check if a property transfer is pending
    function isTransferPending(uint256 tokenId) external view returns (bool, address) {
        address buyer = pendingTransfers[tokenId];
        return (buyer != address(0), buyer);
    }

    /// @notice Total properties currently minted (active)
    function totalMinted() external view returns (uint256) {
        return _totalMinted;
    }

    /// @notice Check if a specific lot has been minted
    function lotExists(uint64 lotNumber) external view returns (bool) {
        return _ownerOf(lotNumber) != address(0);
    }

    // ── EIP-6372: Timestamp-Based Clock ──────────────────────────────────────
    // CRITICAL: On L2s (Base/Optimism), block.number is unreliable.
    // We use block.timestamp for all voting power checkpoints.

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // ── Internal Overrides ───────────────────────────────────────────────────

    /**
     * @dev Override to enforce soulbound transfer restrictions.
     *      Allows minting (from == 0) freely. Blocks all other transfers
     *      unless approved by board. Burns are not supported.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);

        // Minting: no restriction
        if (from != address(0) && transfersRequireApproval) {
            // Burning: not supported
            if (to == address(0)) revert TransferNotApproved(tokenId);

            // Transfer: must be approved and to the correct buyer
            address approvedBuyer = pendingTransfers[tokenId];
            if (approvedBuyer == address(0) || approvedBuyer != to) {
                revert TransferNotApproved(tokenId);
            }

            // Clear the approval after use
            delete pendingTransfers[tokenId];
        }

        // Execute the actual transfer/mint (ERC721Enumerable._update)
        address previousOwner = super._update(to, tokenId, auth);

        // Track voting units for Votes checkpointing
        // This is what ERC721Votes does internally — we must call it manually
        // since we inherit Votes directly instead of ERC721Votes
        _transferVotingUnits(from, to, 1);

        // Auto-delegate new owner AFTER transfer completes (not on mint — handled in mintProperty)
        if (from != address(0) && to != address(0) && autoDelegateOnMint) {
            _delegate(to, to);
        }

        return previousOwner;
    }

    function _increaseBalance(
        address account,
        uint128 amount
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }

    /**
     * @dev Voting units = number of NFTs held by account (1 NFT = 1 vote)
     */
    function _getVotingUnits(address account) internal view virtual override returns (uint256) {
        return balanceOf(account);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
