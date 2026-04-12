// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PropertyNFT.sol";
import "../src/DocumentRegistry.sol";
import "../src/FaircroftGovernor.sol";
import "../src/FaircroftTreasury.sol";
import "../src/DuesLending.sol";
import "../src/TreasuryYield.sol";
import "../src/VendorEscrow.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title Deploy
 * @notice Full FaircroftDAO deployment script.
 *         Deploys all 8 contracts in dependency order and configures roles.
 *
 * Usage:
 *   forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY — deployer wallet (needs ETH for gas)
 *   BOARD_MULTISIG — Safe multisig address for the board (3-of-5)
 *   USDC_ADDRESS — USDC contract (Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 *   AAVE_POOL — Aave V3 Pool address (Base Sepolia: 0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b)
 *   AUSDC_ADDRESS — Aave aUSDC token (Base Sepolia: 0xf53B60F4006cab2b3C4688ce41fD5362427A2A66)
 *   MAX_LOTS — Number of lots in the community (e.g., 150)
 *
 * @dev The function body is split into helpers (_deployCore, _deployFinance,
 *      _wireRoles, _renounceAdmins) to keep each helper's local slot count
 *      under the Solc stack limit. Do not collapse back into run().
 */
contract Deploy is Script {
    /// @notice All addresses produced by a single deployment run.
    struct Deployed {
        PropertyNFT propertyNFT;
        TimelockController timelock;
        FaircroftGovernor governor;
        DocumentRegistry docRegistry;
        FaircroftTreasury treasury;
        DuesLending duesLending;
        TreasuryYield treasuryYield;
        VendorEscrow vendorEscrow;
    }

    /// @notice Env-loaded configuration.
    struct Config {
        uint256 deployerKey;
        address deployerAddr;
        address boardMultisig;
        address usdc;
        address aavePool;
        address aUsdc;
        uint256 maxLots;
    }

    function run() external {
        Config memory cfg = _loadConfig();

        vm.startBroadcast(cfg.deployerKey);

        Deployed memory d;
        _deployCore(cfg, d);
        _deployFinance(cfg, d);
        _wireRoles(cfg, d);
        _renounceAdmins(cfg, d);

        vm.stopBroadcast();

        _logSummary(cfg, d);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    function _loadConfig() internal view returns (Config memory cfg) {
        cfg.deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        cfg.deployerAddr = vm.addr(cfg.deployerKey);
        cfg.boardMultisig = vm.envAddress("BOARD_MULTISIG");
        cfg.usdc = vm.envAddress("USDC_ADDRESS");
        cfg.aavePool = vm.envAddress("AAVE_POOL");
        cfg.aUsdc = vm.envAddress("AUSDC_ADDRESS");
        cfg.maxLots = vm.envOr("MAX_LOTS", uint256(150));
    }

    /**
     * @dev Deploys PropertyNFT + Timelock + Governor + DocumentRegistry.
     *      These are the identity / governance primitives that every other
     *      contract depends on.
     */
    function _deployCore(Config memory cfg, Deployed memory d) internal {
        // ── 1. PropertyNFT ──────────────────────────────────────────────
        d.propertyNFT = new PropertyNFT(
            cfg.maxLots,
            "Faircroft Property",
            "FAIR"
        );
        console.log("PropertyNFT:       ", address(d.propertyNFT));

        // ── 2. TimelockController ───────────────────────────────────────
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(0); // placeholder — updated after Governor
        executors[0] = address(0); // open execution (anyone after delay)

        d.timelock = new TimelockController(
            2 days,             // minDelay
            proposers,
            executors,
            cfg.deployerAddr    // temporary admin (transferred later)
        );
        console.log("TimelockController:", address(d.timelock));

        // ── 3. FaircroftGovernor ────────────────────────────────────────
        d.governor = new FaircroftGovernor(
            d.propertyNFT,
            d.timelock,
            cfg.boardMultisig   // proposal guardian
        );
        console.log("FaircroftGovernor: ", address(d.governor));

        // ── 4. DocumentRegistry ─────────────────────────────────────────
        d.docRegistry = new DocumentRegistry();
        console.log("DocumentRegistry:  ", address(d.docRegistry));
    }

    /**
     * @dev Deploys Treasury + DuesLending + TreasuryYield + VendorEscrow.
     *      These all depend on the Treasury being up and are the finance
     *      layer — dues, lending, yield, vendor escrow.
     */
    function _deployFinance(Config memory cfg, Deployed memory d) internal {
        // ── 5. FaircroftTreasury ────────────────────────────────────────
        d.treasury = new FaircroftTreasury(
            cfg.usdc,
            200e6,    // $200/quarter dues
            500,      // 5% annual discount
            5000e6    // $5,000 emergency spending limit
        );
        console.log("FaircroftTreasury: ", address(d.treasury));

        // ── 6. DuesLending ──────────────────────────────────────────────
        d.duesLending = new DuesLending(
            cfg.usdc,
            address(d.propertyNFT),
            address(d.treasury),
            address(d.timelock),   // governor role
            cfg.boardMultisig      // board role
        );
        console.log("DuesLending:       ", address(d.duesLending));

        // ── 7. TreasuryYield ────────────────────────────────────────────
        // Yield sidecar for Treasury idle reserve. Needs YIELD_MANAGER_ROLE
        // on Treasury to call releaseReserveForYield / creditYieldReturn.
        // Constructor grants DEFAULT_ADMIN_ROLE directly to the timelock,
        // so the deployer never holds admin — no renunciation required.
        d.treasuryYield = new TreasuryYield(
            cfg.usdc,
            cfg.aavePool,
            cfg.aUsdc,
            address(d.treasury),
            address(d.timelock),   // governor — becomes admin
            cfg.boardMultisig      // treasurer
        );
        console.log("TreasuryYield:     ", address(d.treasuryYield));

        // ── 8. VendorEscrow ─────────────────────────────────────────────
        // Escrowed vendor payments gated by the board multisig. Needs
        // ESCROW_ROLE on Treasury to pull funds for work-order escrow.
        d.vendorEscrow = new VendorEscrow(
            cfg.usdc,
            address(d.treasury),
            cfg.boardMultisig,
            address(d.timelock)
        );
        console.log("VendorEscrow:      ", address(d.vendorEscrow));
    }

    /**
     * @dev Wires up every functional role: timelock/governor, property roles,
     *      registry, treasury, lending, yield, escrow.
     */
    function _wireRoles(Config memory cfg, Deployed memory d) internal {
        // Governor → Timelock proposer + canceller
        d.timelock.grantRole(d.timelock.PROPOSER_ROLE(), address(d.governor));
        d.timelock.grantRole(d.timelock.CANCELLER_ROLE(), cfg.boardMultisig);
        d.timelock.grantRole(d.timelock.CANCELLER_ROLE(), address(d.governor));

        // DocumentRegistry recorders
        d.docRegistry.grantRole(d.docRegistry.RECORDER_ROLE(), address(d.timelock));
        d.docRegistry.grantRole(d.docRegistry.RECORDER_ROLE(), cfg.boardMultisig);

        // Treasury governance + treasurer
        d.treasury.grantRole(d.treasury.GOVERNOR_ROLE(), address(d.timelock));
        d.treasury.grantRole(d.treasury.TREASURER_ROLE(), cfg.boardMultisig);

        // PropertyNFT registrar + governor + lending
        d.propertyNFT.grantRole(d.propertyNFT.REGISTRAR_ROLE(), cfg.boardMultisig);
        d.propertyNFT.grantRole(d.propertyNFT.GOVERNOR_ROLE(), address(d.timelock));
        d.propertyNFT.grantRole(d.propertyNFT.LENDING_ROLE(), address(d.duesLending));

        // Treasury <- yield manager + escrow role
        d.treasury.grantRole(d.treasury.YIELD_MANAGER_ROLE(), address(d.treasuryYield));
        d.treasury.grantRole(d.treasury.ESCROW_ROLE(), address(d.vendorEscrow));
    }

    /**
     * @dev Moves DEFAULT_ADMIN_ROLE on every contract to the Timelock and
     *      renounces it from the deployer. TreasuryYield is skipped because
     *      its constructor granted admin directly to the timelock — the
     *      deployer never held it and calling renounce would revert.
     */
    function _renounceAdmins(Config memory cfg, Deployed memory d) internal {
        bytes32 adminRole = d.propertyNFT.DEFAULT_ADMIN_ROLE();

        // PropertyNFT
        d.propertyNFT.grantRole(adminRole, address(d.timelock));
        d.propertyNFT.renounceRole(adminRole, cfg.deployerAddr);

        // DocumentRegistry
        d.docRegistry.grantRole(adminRole, address(d.timelock));
        d.docRegistry.renounceRole(adminRole, cfg.deployerAddr);

        // Treasury
        d.treasury.grantRole(adminRole, address(d.timelock));
        d.treasury.renounceRole(adminRole, cfg.deployerAddr);

        // DuesLending: admin was granted directly to the timelock in the
        // constructor — the deployer never held it. Do not add to this loop.

        // TreasuryYield: same pattern as DuesLending — admin granted directly
        // to the timelock in the constructor. Do not add to this loop.

        // VendorEscrow
        d.vendorEscrow.grantRole(adminRole, address(d.timelock));
        d.vendorEscrow.renounceRole(adminRole, cfg.deployerAddr);

        // Timelock itself
        d.timelock.grantRole(adminRole, address(d.timelock));
        d.timelock.renounceRole(adminRole, cfg.deployerAddr);
    }

    function _logSummary(Config memory cfg, Deployed memory d) internal view {
        console.log("\n=== FaircroftDAO Deployment Complete ===");
        console.log("PropertyNFT:       ", address(d.propertyNFT));
        console.log("TimelockController:", address(d.timelock));
        console.log("FaircroftGovernor: ", address(d.governor));
        console.log("DocumentRegistry:  ", address(d.docRegistry));
        console.log("FaircroftTreasury: ", address(d.treasury));
        console.log("DuesLending:       ", address(d.duesLending));
        console.log("TreasuryYield:     ", address(d.treasuryYield));
        console.log("VendorEscrow:      ", address(d.vendorEscrow));
        console.log("Board Multisig:    ", cfg.boardMultisig);
        console.log("USDC:              ", cfg.usdc);
        console.log("Aave Pool:         ", cfg.aavePool);
        console.log("aUSDC:             ", cfg.aUsdc);
        console.log("Max Lots:          ", cfg.maxLots);
        console.log("\nAdmin transferred to Timelock. Deployer has NO remaining roles.");
        console.log("Board multisig has: REGISTRAR, RECORDER, TREASURER, CANCELLER, GUARDIAN, BOARD");
    }
}
