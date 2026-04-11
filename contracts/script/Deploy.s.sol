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
 *         Deploys all contracts in dependency order and configures roles.
 *
 * Usage:
 *   forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY — deployer wallet (needs ETH for gas)
 *   BOARD_MULTISIG — Safe multisig address for the board (3-of-5)
 *   USDC_ADDRESS — USDC contract (Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 *   MAX_LOTS — Number of lots in the community (e.g., 150)
 *   AAVE_POOL — Aave V3 Pool address (Base Sepolia: 0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b)
 *   AUSDC_ADDRESS — Aave aUSDC token (Base Sepolia: 0xf53B60F4006cab2b3C4688ce41fD5362427A2A66)
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address boardMultisig = vm.envAddress("BOARD_MULTISIG");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        address aavePool = vm.envAddress("AAVE_POOL");
        address aUsdcAddress = vm.envAddress("AUSDC_ADDRESS");
        uint256 maxLots = vm.envOr("MAX_LOTS", uint256(150));

        vm.startBroadcast(deployerKey);

        // ── 1. PropertyNFT ──────────────────────────────────────────────
        PropertyNFT propertyNFT = new PropertyNFT(
            maxLots,
            "Faircroft Property",
            "FAIR"
        );
        console.log("PropertyNFT:", address(propertyNFT));

        // ── 2. TimelockController ───────────────────────────────────────
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(0); // placeholder — updated after Governor
        executors[0] = address(0); // open execution (anyone can trigger after delay)

        address deployerAddr = vm.addr(deployerKey);
        TimelockController timelock = new TimelockController(
            2 days,     // minDelay
            proposers,
            executors,
            deployerAddr  // temporary admin (transferred later)
        );
        console.log("TimelockController:", address(timelock));

        // ── 3. FaircroftGovernor ────────────────────────────────────────
        FaircroftGovernor governor = new FaircroftGovernor(
            propertyNFT,
            timelock,
            boardMultisig   // proposal guardian
        );
        console.log("FaircroftGovernor:", address(governor));

        // ── 4. Grant Governor PROPOSER_ROLE on Timelock ─────────────────
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));

        // ── 5. Grant CANCELLER_ROLE on Timelock (board + governor) ──────
        timelock.grantRole(timelock.CANCELLER_ROLE(), boardMultisig);
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));

        // ── 6. DocumentRegistry ─────────────────────────────────────────
        DocumentRegistry docRegistry = new DocumentRegistry();
        docRegistry.grantRole(docRegistry.RECORDER_ROLE(), address(timelock));
        docRegistry.grantRole(docRegistry.RECORDER_ROLE(), boardMultisig);
        console.log("DocumentRegistry:", address(docRegistry));

        // ── 7. FaircroftTreasury ────────────────────────────────────────
        FaircroftTreasury treasury = new FaircroftTreasury(
            usdcAddress,
            200e6,    // $200/quarter dues
            500,      // 5% annual discount
            5000e6    // $5,000 emergency spending limit
        );
        treasury.grantRole(treasury.GOVERNOR_ROLE(), address(timelock));
        treasury.grantRole(treasury.TREASURER_ROLE(), boardMultisig);
        console.log("FaircroftTreasury:", address(treasury));

        // ── 8. Grant PropertyNFT roles ──────────────────────────────────
        propertyNFT.grantRole(propertyNFT.REGISTRAR_ROLE(), boardMultisig);
        propertyNFT.grantRole(propertyNFT.GOVERNOR_ROLE(), address(timelock));

        // ── 9. DuesLending ─────────────────────────────────────────────
        DuesLending duesLending = new DuesLending(
            usdcAddress,
            address(propertyNFT),
            address(treasury),
            address(timelock),   // governor role
            boardMultisig        // board role
        );
        console.log("DuesLending:", address(duesLending));

        // Grant LENDING_ROLE on PropertyNFT to DuesLending
        propertyNFT.grantRole(propertyNFT.LENDING_ROLE(), address(duesLending));

        // ── 10. TreasuryYield ───────────────────────────────────────────
        // Yield sidecar for Treasury idle reserve. Needs YIELD_MANAGER_ROLE
        // on Treasury to call releaseReserveForYield / creditYieldReturn.
        // Constructor grants DEFAULT_ADMIN_ROLE directly to the timelock,
        // so the deployer never holds admin — no renunciation required.
        TreasuryYield treasuryYield = new TreasuryYield(
            usdcAddress,
            aavePool,
            aUsdcAddress,
            address(treasury),
            address(timelock),   // governor — becomes admin
            boardMultisig        // treasurer
        );
        treasury.grantRole(treasury.YIELD_MANAGER_ROLE(), address(treasuryYield));
        console.log("TreasuryYield:     ", address(treasuryYield));

        // ── 11. VendorEscrow ────────────────────────────────────────────
        // Escrowed vendor payments gated by the board multisig. Needs
        // ESCROW_ROLE on Treasury to pull funds for work-order escrow.
        VendorEscrow vendorEscrow = new VendorEscrow(
            usdcAddress,
            address(treasury),
            boardMultisig,
            address(timelock)
        );
        treasury.grantRole(treasury.ESCROW_ROLE(), address(vendorEscrow));
        console.log("VendorEscrow:      ", address(vendorEscrow));

        // ── 12. Transfer admin of ALL contracts to Timelock ─────────────
        // After this, only governance can change roles.

        bytes32 adminRole = propertyNFT.DEFAULT_ADMIN_ROLE();

        // PropertyNFT
        propertyNFT.grantRole(adminRole, address(timelock));
        propertyNFT.renounceRole(adminRole, deployerAddr);

        // DocumentRegistry
        docRegistry.grantRole(adminRole, address(timelock));
        docRegistry.renounceRole(adminRole, deployerAddr);

        // Treasury
        treasury.grantRole(adminRole, address(timelock));
        treasury.renounceRole(adminRole, deployerAddr);

        // DuesLending
        duesLending.grantRole(adminRole, address(timelock));
        duesLending.renounceRole(adminRole, deployerAddr);

        // TreasuryYield: admin was granted directly to timelock in the
        // constructor, so nothing to transfer and nothing to renounce.

        // VendorEscrow: admin was granted to deployer (msg.sender), transfer
        // to timelock and renounce, matching the other contracts.
        vendorEscrow.grantRole(adminRole, address(timelock));
        vendorEscrow.renounceRole(adminRole, deployerAddr);

        // Timelock itself
        timelock.grantRole(adminRole, address(timelock));
        timelock.renounceRole(adminRole, deployerAddr);

        vm.stopBroadcast();

        // ── Summary ─────────────────────────────────────────────────────
        console.log("\n=== FaircroftDAO Deployment Complete ===");
        console.log("PropertyNFT:       ", address(propertyNFT));
        console.log("TimelockController:", address(timelock));
        console.log("FaircroftGovernor: ", address(governor));
        console.log("DocumentRegistry:  ", address(docRegistry));
        console.log("FaircroftTreasury: ", address(treasury));
        console.log("DuesLending:       ", address(duesLending));
        console.log("TreasuryYield:     ", address(treasuryYield));
        console.log("VendorEscrow:      ", address(vendorEscrow));
        console.log("Board Multisig:    ", boardMultisig);
        console.log("USDC:              ", usdcAddress);
        console.log("Aave Pool:         ", aavePool);
        console.log("aUSDC:             ", aUsdcAddress);
        console.log("Max Lots:          ", maxLots);
        console.log("\nAdmin transferred to Timelock. Deployer has NO remaining roles.");
        console.log("Board multisig has: REGISTRAR, RECORDER, TREASURER, CANCELLER, GUARDIAN, BOARD");
    }
}
