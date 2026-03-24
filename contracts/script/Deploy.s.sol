// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PropertyNFT.sol";
import "../src/DocumentRegistry.sol";
import "../src/FaircroftGovernor.sol";
import "../src/FaircroftTreasury.sol";
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
 *   USDC_ADDRESS — USDC contract (Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 *   MAX_LOTS — Number of lots in the community (e.g., 150)
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address boardMultisig = vm.envAddress("BOARD_MULTISIG");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
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

        // ── 9. Transfer admin of ALL contracts to Timelock ──────────────
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
        console.log("Board Multisig:    ", boardMultisig);
        console.log("USDC:              ", usdcAddress);
        console.log("Max Lots:          ", maxLots);
        console.log("\nAdmin transferred to Timelock. Deployer has NO remaining roles.");
        console.log("Board multisig has: REGISTRAR, RECORDER, TREASURER, CANCELLER, GUARDIAN");
    }
}
