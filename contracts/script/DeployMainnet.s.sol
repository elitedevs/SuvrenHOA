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
 * @title DeployMainnet
 * @notice Production deployment script for Base Mainnet.
 *         Identical to Deploy.s.sol with mainnet-tuned parameters:
 *         — Real USDC address (Base mainnet)
 *         — No test-minting
 *         — Conservative initial dues / emergency limits
 *         — Minimum timelock delay of 2 days (48 hours)
 *
 * Usage:
 *   forge script script/DeployMainnet.s.sol \
 *     --rpc-url base_mainnet \
 *     --broadcast \
 *     --verify \
 *     --slow           # recommended: one tx per block for safety
 *
 * Required env vars (see contracts/.env.example):
 *   DEPLOYER_PRIVATE_KEY
 *   BOARD_MULTISIG
 *   MAX_LOTS
 *   COMMUNITY_NAME
 *   COMMUNITY_SYMBOL
 *
 * USDC on Base mainnet is hard-coded: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 */
contract DeployMainnet is Script {
    // Base mainnet USDC (canonical; do not override via env)
    address constant USDC_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external {
        uint256 deployerKey   = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address boardMultisig = vm.envAddress("BOARD_MULTISIG");
        uint256 maxLots       = vm.envOr("MAX_LOTS", uint256(150));
        string memory commName   = vm.envOr("COMMUNITY_NAME",   "Faircroft Property");
        string memory commSymbol = vm.envOr("COMMUNITY_SYMBOL", "FAIR");

        address deployerAddr = vm.addr(deployerKey);

        // ── Preflight checks ───────────────────────────────────────────────
        require(boardMultisig != address(0), "BOARD_MULTISIG not set");
        require(boardMultisig != deployerAddr, "Board multisig must differ from deployer");
        require(maxLots > 0 && maxLots <= 10_000, "MAX_LOTS out of range");

        vm.startBroadcast(deployerKey);

        // ── 1. PropertyNFT ─────────────────────────────────────────────────
        PropertyNFT propertyNFT = new PropertyNFT(
            maxLots,
            commName,
            commSymbol
        );
        console.log("PropertyNFT:", address(propertyNFT));

        // ── 2. TimelockController ──────────────────────────────────────────
        // 2-day delay; board multisig is canceller from day 1
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(0); // placeholder until Governor is deployed
        executors[0] = address(0); // open execution (anyone after delay)

        TimelockController timelock = new TimelockController(
            2 days,
            proposers,
            executors,
            deployerAddr  // temporary admin; renounced below
        );
        console.log("TimelockController:", address(timelock));

        // ── 3. FaircroftGovernor ───────────────────────────────────────────
        FaircroftGovernor governor = new FaircroftGovernor(
            propertyNFT,
            timelock,
            boardMultisig
        );
        console.log("FaircroftGovernor:", address(governor));

        // ── 4. Wire Governor → Timelock ────────────────────────────────────
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.CANCELLER_ROLE(), boardMultisig);
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));

        // ── 5. DocumentRegistry ────────────────────────────────────────────
        DocumentRegistry docRegistry = new DocumentRegistry();
        docRegistry.grantRole(docRegistry.RECORDER_ROLE(), address(timelock));
        docRegistry.grantRole(docRegistry.RECORDER_ROLE(), boardMultisig);
        console.log("DocumentRegistry:", address(docRegistry));

        // ── 6. FaircroftTreasury ───────────────────────────────────────────
        // Mainnet: $200/quarter dues, 5% early-pay discount, $5k emergency limit
        FaircroftTreasury treasury = new FaircroftTreasury(
            USDC_MAINNET,
            200e6,    // $200 quarterly dues (6 decimals USDC)
            500,      // 5.00% annual discount
            5_000e6   // $5,000 emergency spending cap
        );
        treasury.grantRole(treasury.GOVERNOR_ROLE(), address(timelock));
        treasury.grantRole(treasury.TREASURER_ROLE(), boardMultisig);
        console.log("FaircroftTreasury:", address(treasury));

        // ── 7. PropertyNFT roles ───────────────────────────────────────────
        propertyNFT.grantRole(propertyNFT.REGISTRAR_ROLE(), boardMultisig);
        propertyNFT.grantRole(propertyNFT.GOVERNOR_ROLE(), address(timelock));

        // ── 8. DuesLending ─────────────────────────────────────────────────
        DuesLending duesLending = new DuesLending(
            USDC_MAINNET,
            address(propertyNFT),
            address(treasury),
            address(timelock),
            boardMultisig
        );
        propertyNFT.grantRole(propertyNFT.LENDING_ROLE(), address(duesLending));
        console.log("DuesLending:", address(duesLending));

        // ── 9. TreasuryYield ───────────────────────────────────────────────
        TreasuryYield treasuryYield = new TreasuryYield(
            USDC_MAINNET,
            address(treasury)
        );
        treasury.grantRole(treasury.GOVERNOR_ROLE(), address(treasuryYield));
        console.log("TreasuryYield:", address(treasuryYield));

        // ── 10. VendorEscrow ───────────────────────────────────────────────
        VendorEscrow vendorEscrow = new VendorEscrow(
            USDC_MAINNET,
            address(treasury),
            boardMultisig
        );
        console.log("VendorEscrow:", address(vendorEscrow));

        // ── 11. Transfer all admin roles to Timelock ───────────────────────
        bytes32 adminRole = propertyNFT.DEFAULT_ADMIN_ROLE();

        propertyNFT.grantRole(adminRole, address(timelock));
        propertyNFT.renounceRole(adminRole, deployerAddr);

        docRegistry.grantRole(adminRole, address(timelock));
        docRegistry.renounceRole(adminRole, deployerAddr);

        treasury.grantRole(adminRole, address(timelock));
        treasury.renounceRole(adminRole, deployerAddr);

        duesLending.grantRole(adminRole, address(timelock));
        duesLending.renounceRole(adminRole, deployerAddr);

        timelock.grantRole(adminRole, address(timelock));
        timelock.renounceRole(adminRole, deployerAddr);

        vm.stopBroadcast();

        // ── Summary ────────────────────────────────────────────────────────
        console.log("\n=== SuvrenHOA Mainnet Deployment Complete ===");
        console.log("Chain:             Base Mainnet (8453)");
        console.log("USDC:             ", USDC_MAINNET);
        console.log("PropertyNFT:      ", address(propertyNFT));
        console.log("TimelockController:", address(timelock));
        console.log("FaircroftGovernor:", address(governor));
        console.log("DocumentRegistry: ", address(docRegistry));
        console.log("FaircroftTreasury:", address(treasury));
        console.log("DuesLending:      ", address(duesLending));
        console.log("TreasuryYield:    ", address(treasuryYield));
        console.log("VendorEscrow:     ", address(vendorEscrow));
        console.log("Board Multisig:   ", boardMultisig);
        console.log("Max Lots:         ", maxLots);
        console.log("\nAdmin renounced. Only Timelock + Multisig can make changes.");
        console.log("Next: verify on BaseScan, update frontend/src/config/contracts.ts");
    }
}
