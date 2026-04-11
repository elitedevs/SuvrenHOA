// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../../src/FaircroftTreasury.sol";
import "../../helpers/MockUSDC.sol";

/**
 * @title FaircroftTreasuryHandler
 * @notice Handler for FaircroftTreasury invariant fuzzing. The handler holds
 *         every operational role (TREASURER, GOVERNOR, YIELD_MANAGER, LENDING,
 *         ESCROW) so it can exercise the full surface without per-call pranking.
 *         A bounded set of payer actors makes payDues calls from outside.
 *
 *         Critical invariant exercised: fund conservation
 *              usdc.balanceOf(treasury) == operatingBalance + reserveBalance
 */
contract FaircroftTreasuryHandler is Test {
    FaircroftTreasury public immutable treasury;
    MockUSDC public immutable usdc;
    address[] public payers;

    // Ghost counters
    uint256 public callsPayDues;
    uint256 public callsMakeExpenditure;
    uint256 public callsEmergencySpend;
    uint256 public callsTransferReserve;
    uint256 public callsReleaseYield;
    uint256 public callsCreditYield;
    uint256 public callsWithdrawForLoan;
    uint256 public callsDepositFromLoan;
    uint256 public callsPayDuesFor;
    uint256 public callsCreditRefund;
    uint256 public callsExpirePeriod;

    uint256 public ghost_maxExpenditureCount;

    constructor(FaircroftTreasury _treasury, MockUSDC _usdc, address[] memory _payers) {
        treasury = _treasury;
        usdc = _usdc;
        for (uint256 i = 0; i < _payers.length; i++) payers.push(_payers[i]);
    }

    function _pickPayer(uint256 seed) internal view returns (address) {
        if (payers.length == 0) return address(0);
        return payers[seed % payers.length];
    }

    // ── External dues payment (no role required) ─────────────────────────────

    function payDues(uint256 payerSeed, uint256 tokenId, uint256 quarters) external {
        callsPayDues++;
        address payer = _pickPayer(payerSeed);
        if (payer == address(0)) return;
        quarters = bound(quarters, 1, 4);
        tokenId  = bound(tokenId, 1, 20);

        uint256 amount;
        if (quarters == 4) {
            uint256 annual = treasury.quarterlyDuesAmount() * 4;
            amount = annual - (annual * treasury.annualDuesDiscount() / 10000);
        } else {
            amount = treasury.quarterlyDuesAmount() * quarters;
        }
        // Late fee may apply — pad by 20% to cover worst case
        amount = amount + amount / 5;

        if (usdc.balanceOf(payer) < amount) return;

        vm.startPrank(payer);
        usdc.approve(address(treasury), amount);
        try treasury.payDues(tokenId, quarters) {} catch {}
        vm.stopPrank();
    }

    // ── Expenditures (GOVERNOR_ROLE — handler holds it) ──────────────────────

    function makeExpenditure(uint256 vendorSeed, uint256 amountSeed) external {
        callsMakeExpenditure++;
        uint256 opBal = treasury.operatingBalance();
        if (opBal == 0) return;
        uint256 amount = bound(amountSeed, 1, opBal);
        address vendor = address(uint160(uint256(keccak256(abi.encode("v", vendorSeed)))));
        if (vendor == address(0)) vendor = address(0xBEEF);

        try treasury.makeExpenditure(
            vendor,
            uint128(amount),
            "fuzz-expenditure",
            "fuzz",
            0
        ) {
            if (treasury.getExpenditureCount() > ghost_maxExpenditureCount) {
                ghost_maxExpenditureCount = treasury.getExpenditureCount();
            }
        } catch {}
    }

    // ── Emergency spending (TREASURER_ROLE — handler holds it) ──────────────

    function emergencySpend(uint256 vendorSeed, uint256 amountSeed) external {
        callsEmergencySpend++;
        uint256 opBal = treasury.operatingBalance();
        if (opBal == 0) return;
        uint256 limit = treasury.emergencySpendingLimit();
        if (limit == 0) return;

        uint256 maxAmt = opBal < limit ? opBal : limit;
        uint256 amount = bound(amountSeed, 1, maxAmt);
        address vendor = address(uint160(uint256(keccak256(abi.encode("ev", vendorSeed)))));
        if (vendor == address(0)) vendor = address(0xFEED);

        try treasury.emergencySpend(vendor, uint128(amount), "emergency-fuzz") {} catch {}
    }

    // ── Transfer reserve (GOVERNOR_ROLE) ─────────────────────────────────────

    function transferReserve(uint256 amountSeed, bool toOperating) external {
        callsTransferReserve++;
        uint256 source = toOperating ? treasury.reserveBalance() : treasury.operatingBalance();
        if (source == 0) return;
        uint256 amount = bound(amountSeed, 1, source);
        try treasury.transferReserve(amount, toOperating) {} catch {}
    }

    // ── Yield manager (YIELD_MANAGER_ROLE — handler holds it) ───────────────

    function releaseReserveForYield(uint256 amountSeed) external {
        callsReleaseYield++;
        uint256 r = treasury.reserveBalance();
        if (r == 0) return;
        uint256 amount = bound(amountSeed, 1, r);
        try treasury.releaseReserveForYield(address(this), amount) {} catch {}
    }

    function creditYieldReturn(uint256 amountSeed) external {
        callsCreditYield++;
        uint256 bal = usdc.balanceOf(address(this));
        if (bal == 0) return;
        uint256 amount = bound(amountSeed, 1, bal);
        usdc.approve(address(treasury), amount);
        try treasury.creditYieldReturn(amount) {} catch {}
    }

    // ── Lending (LENDING_ROLE — handler holds it) ────────────────────────────

    function withdrawForLoan(uint256 amountSeed) external {
        callsWithdrawForLoan++;
        uint256 r = treasury.reserveBalance();
        if (r == 0) return;
        uint256 amount = bound(amountSeed, 1, r);
        try treasury.withdrawForLoan(amount) {} catch {}
    }

    function depositFromLoan(uint256 amountSeed) external {
        callsDepositFromLoan++;
        uint256 bal = usdc.balanceOf(address(this));
        if (bal == 0) return;
        uint256 amount = bound(amountSeed, 1, bal);
        usdc.approve(address(treasury), amount);
        try treasury.depositFromLoan(amount) {} catch {}
    }

    function payDuesFor(uint256 tokenId, uint256 quarters) external {
        callsPayDuesFor++;
        quarters = bound(quarters, 1, 4);
        tokenId  = bound(tokenId, 1, 20);
        uint256 amount = treasury.quarterlyDuesAmount() * quarters;
        if (usdc.balanceOf(address(this)) < amount) return;
        usdc.approve(address(treasury), amount);
        try treasury.payDuesFor(tokenId, quarters, address(this)) {} catch {}
    }

    // ── Escrow (ESCROW_ROLE) ─────────────────────────────────────────────────

    function creditRefundFromEscrow(uint256 amountSeed, bool isReserve) external {
        callsCreditRefund++;
        uint256 bal = usdc.balanceOf(address(this));
        if (bal == 0) return;
        uint256 amount = bound(amountSeed, 1, bal);
        usdc.approve(address(treasury), amount);
        try treasury.creditRefundFromEscrow(amount, isReserve) {} catch {}
    }

    // ── Time warp to exercise the emergency-period reset logic ──────────────

    function expireEmergencyPeriod() external {
        callsExpirePeriod++;
        vm.warp(block.timestamp + 31 days);
    }
}
