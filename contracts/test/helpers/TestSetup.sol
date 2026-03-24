// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/PropertyNFT.sol";
import "../../src/DocumentRegistry.sol";
import "../../src/FaircroftGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title TestSetup
 * @notice Common deployment helper for integration tests.
 *         Deploys the full system matching production deployment order.
 */
abstract contract TestSetup is Test {
    PropertyNFT public propertyNFT;
    DocumentRegistry public docRegistry;
    FaircroftGovernor public governor;
    TimelockController public timelock;

    address public deployer;
    address public boardMultisig = address(0xB0A2D);

    // Homeowners
    address public alice = address(0xA11CE);
    address public bob   = address(0xB0B);
    address public carol = address(0xCA201);
    address public dave  = address(0xDA7E);
    address public eve   = address(0xE7E);

    uint256 constant MAX_LOTS = 150;

    function _deploySystem() internal {
        deployer = address(this);

        // 1. PropertyNFT
        propertyNFT = new PropertyNFT(MAX_LOTS, "Faircroft Property", "FAIR");

        // 2. TimelockController (2-day min delay)
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(0); // placeholder — updated after Governor
        executors[0] = address(0); // open execution
        timelock = new TimelockController(2 days, proposers, executors, deployer);

        // 3. Governor
        governor = new FaircroftGovernor(propertyNFT, timelock, boardMultisig);

        // 4. Grant Governor PROPOSER_ROLE on Timelock
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));

        // 5. Grant CANCELLER_ROLE on Timelock to both board and governor
        timelock.grantRole(timelock.CANCELLER_ROLE(), boardMultisig);
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));

        // 6. DocumentRegistry
        docRegistry = new DocumentRegistry();
        docRegistry.grantRole(docRegistry.RECORDER_ROLE(), address(timelock));
        docRegistry.grantRole(docRegistry.RECORDER_ROLE(), boardMultisig);

        // 7. Grant PropertyNFT roles
        propertyNFT.grantRole(propertyNFT.REGISTRAR_ROLE(), boardMultisig);
        propertyNFT.grantRole(propertyNFT.GOVERNOR_ROLE(), address(timelock));
    }

    /// @dev Mint properties to homeowners and warp time so votes are checkpointed
    function _mintProperties() internal {
        propertyNFT.mintProperty(alice, 1, "101 Faircroft Dr", 2500);
        propertyNFT.mintProperty(bob,   2, "103 Faircroft Dr", 3000);
        propertyNFT.mintProperty(carol, 3, "105 Faircroft Dr", 2800);
        propertyNFT.mintProperty(dave,  4, "107 Faircroft Dr", 2600);
        propertyNFT.mintProperty(eve,   5, "109 Faircroft Dr", 2400);

        // Warp 1 second so checkpoints are in the past (required for Governor snapshot)
        vm.warp(block.timestamp + 1);
    }

    /// @dev Create a simple proposal (no-op view call to docRegistry)
    function _createProposal(
        string memory description,
        FaircroftGovernor.ProposalCategory category
    ) internal returns (uint256) {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(docRegistry);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(DocumentRegistry.getDocumentCount.selector);

        vm.prank(alice); // Alice has 1 NFT, meets proposalThreshold
        return governor.proposeWithCategory(
            targets, values, calldatas, description, category, ""
        );
    }

    /// @dev Fast-forward past voting delay
    function _skipVotingDelay() internal {
        vm.warp(block.timestamp + governor.votingDelay() + 1);
    }

    /// @dev Fast-forward past voting period
    function _skipVotingPeriod() internal {
        vm.warp(block.timestamp + governor.votingPeriod() + 1);
    }

    /// @dev Fast-forward past timelock delay
    function _skipTimelockDelay() internal {
        vm.warp(block.timestamp + timelock.getMinDelay() + 1);
    }
}
