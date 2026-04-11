# Base Sepolia Deploy Transcript — Template

**Purpose:** Archive of one full deployment of the FaircroftDAO contract
set to Base Sepolia (chain id 84532). Copy this file to
`sepolia-deploy-transcript-YYYYMMDD.md` before a run and fill it in as
you go. One file per deployment attempt; keep failed attempts too.

This closes Phase A exit criterion:
*"All 5 contracts verified on Base Sepolia with deploy transcripts
archived."* The 5 refers to the contracts covered by Foundry
invariant tests (PropertyNFT, FaircroftTreasury, DuesLending,
TreasuryYield, VendorEscrow); the deploy script actually puts 8 on
chain because Governor/Timelock/DocumentRegistry are needed for roles.

---

## Pre-deploy checklist

- [ ] Working tree matches the commit you want to deploy. `git rev-parse HEAD` recorded below.
- [ ] `forge build` clean locally. No warnings on the 8 contracts.
- [ ] `forge test` green on the full suite — **0 failed, 26 invariants passing.**
- [ ] Deployer wallet funded with **≥ 0.05 Base Sepolia ETH** (faucet: https://www.alchemy.com/faucets/base-sepolia).
- [ ] Alchemy (or equivalent) Base Sepolia RPC key set in `.env` as `ALCHEMY_API_KEY`.
- [ ] BaseScan API key set as `BASESCAN_API_KEY` for contract verification.
- [ ] `.env` values confirmed for every env var listed below.

---

## Environment

Fill these in BEFORE running `forge script`.

| Var | Value | Source |
|---|---|---|
| `DEPLOYER_PRIVATE_KEY` | `0x______________________________________________________________` | your hot wallet — never commit |
| Deployer address | `0x________________________________________` | `cast wallet address $DEPLOYER_PRIVATE_KEY` |
| Deployer ETH balance (pre) | `_______ ETH` | `cast balance <addr> --rpc-url base_sepolia` |
| `BOARD_MULTISIG` | `0x________________________________________` | Safe multisig address (create one if none) |
| `USDC_ADDRESS` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Circle Base Sepolia USDC (verified) |
| `AAVE_POOL` | `0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b` | Aave V3 Pool on Base Sepolia |
| `AUSDC_ADDRESS` | `0xf53B60F4006cab2b3C4688ce41fD5362427A2A66` | Aave aUSDC on Base Sepolia |
| `MAX_LOTS` | `150` | or whatever number the HOA uses |

> ⚠️ Verify the Aave addresses are still current at
> https://aave.com/docs/resources/addresses before each run — Aave
> testnet deployments occasionally get redeployed. If the pool
> reverts on the first `deposit`, that's the most likely cause.

---

## Deploy command

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy \
    --rpc-url base_sepolia \
    --broadcast \
    --verify \
    --etherscan-api-key $BASESCAN_API_KEY \
    -vvv
```

- `-vvv` surfaces `console.log` output so you can copy the addresses out of the terminal.
- `--verify` submits source to BaseScan automatically — if it fails mid-run you can retry with `forge verify-contract` per-address later; the deploy itself is still good.

---

## Results

### Commit & chain

| Field | Value |
|---|---|
| Commit SHA | `________________________________________` |
| Branch | `main` (or local tag) |
| Chain | Base Sepolia |
| Chain ID | `84532` |
| Block at deploy start | `_______________` |
| Block at deploy end | `_______________` |
| Timestamp (UTC) | `______________________` |
| Deployer address | `0x________________________________________` |
| Deployer ETH balance (post) | `_______ ETH` |
| Gas spent (approx) | `_______ ETH` |

### Contract addresses (all 8)

| # | Contract | Address | BaseScan verified? |
|---|---|---|---|
| 1 | `PropertyNFT` | `0x________________________________________` | ☐ |
| 2 | `TimelockController` | `0x________________________________________` | ☐ |
| 3 | `FaircroftGovernor` | `0x________________________________________` | ☐ |
| 4 | `DocumentRegistry` | `0x________________________________________` | ☐ |
| 5 | `FaircroftTreasury` | `0x________________________________________` | ☐ |
| 6 | `DuesLending` | `0x________________________________________` | ☐ |
| 7 | `TreasuryYield` | `0x________________________________________` | ☐ |
| 8 | `VendorEscrow` | `0x________________________________________` | ☐ |

### Broadcast artifacts

- [ ] `contracts/broadcast/Deploy.s.sol/84532/run-latest.json` committed to this folder as `broadcast-<date>.json`
- [ ] BaseScan links pasted below for each contract

```
PropertyNFT:        https://sepolia.basescan.org/address/____
TimelockController: https://sepolia.basescan.org/address/____
FaircroftGovernor:  https://sepolia.basescan.org/address/____
DocumentRegistry:   https://sepolia.basescan.org/address/____
FaircroftTreasury:  https://sepolia.basescan.org/address/____
DuesLending:        https://sepolia.basescan.org/address/____
TreasuryYield:      https://sepolia.basescan.org/address/____
VendorEscrow:       https://sepolia.basescan.org/address/____
```

---

## Post-deploy verification (sanity smoke test)

Run these from `cast` against the deployed addresses. Paste the output in
the code block next to each check.

1. **PropertyNFT admin is the timelock, not the deployer.**
   ```bash
   cast call <propertyNFT> "hasRole(bytes32,address)(bool)" \
       $(cast keccak "") <timelock>
   # Expected: true

   cast call <propertyNFT> "hasRole(bytes32,address)(bool)" \
       $(cast keccak "") <deployerAddr>
   # Expected: false
   ```
   Output:
   ```
   ```

2. **Treasury has the yield + escrow + lending roles wired correctly.**
   ```bash
   cast call <treasury> "hasRole(bytes32,address)(bool)" \
       $(cast keccak "YIELD_MANAGER_ROLE") <treasuryYield>
   # Expected: true

   cast call <treasury> "hasRole(bytes32,address)(bool)" \
       $(cast keccak "ESCROW_ROLE") <vendorEscrow>
   # Expected: true
   ```
   Output:
   ```
   ```

3. **DuesLending holds LENDING_ROLE on PropertyNFT.**
   ```bash
   cast call <propertyNFT> "hasRole(bytes32,address)(bool)" \
       $(cast keccak "LENDING_ROLE") <duesLending>
   # Expected: true
   ```
   Output:
   ```
   ```

4. **Governor is wired as timelock proposer.**
   ```bash
   cast call <timelock> "hasRole(bytes32,address)(bool)" \
       $(cast keccak "PROPOSER_ROLE") <governor>
   # Expected: true
   ```
   Output:
   ```
   ```

5. **Quarterly dues setting is what we expect.**
   ```bash
   cast call <treasury> "quarterlyDues()(uint256)"
   # Expected: 200000000   (=200e6, $200 USDC)
   ```
   Output:
   ```
   ```

If any of the five fail, DO NOT proceed to Phase B. Investigate, file a
finding, re-run the deploy.

---

## What went wrong

Document every surprise, revert, failed verification, and workaround
here. Phase A closes on a SUCCESSFUL transcript, but the failures are
the most useful part of this file for future-you.

- [ ] No issues.
- [ ] Issue: `______________________________` — fix: `______________________________`
- [ ] Issue: `______________________________` — fix: `______________________________`

---

## Sign-off

- [ ] All 8 addresses verified on BaseScan (source code visible).
- [ ] All 5 sanity-check cast calls returned expected values.
- [ ] `broadcast-<date>.json` committed alongside this transcript.
- [ ] Phase A exit criterion 5 marked green in `docs/roadmap-overview.md`.
- [ ] Phase B (`DEPLOY_V2`) unblocked — start next phase gate.

Signed: `______________________` (deployer handle)
Date: `____-__-__`
