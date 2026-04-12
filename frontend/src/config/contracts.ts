/**
 * Contract addresses — updated after each deployment.
 *
 * Base Sepolia deployed 2026-04-12 via Deploy.s.sol (broadcast in
 * contracts/broadcast/Deploy.s.sol/84532/run-latest.json).
 */

export const CONTRACTS = {
  // Base Sepolia (testnet) — deployed 2026-04-12
  baseSepolia: {
    propertyNFT: '0xa18Da7DFa375AD59b3463f129A3051518164A704' as `0x${string}`,
    governor: '0xF45E7aecaEEb05BDEb87d2B56ab96f8CEFEF568A' as `0x${string}`,
    timelock: '0xC482228964db3e9dB94704313f23Dc5e7d250C5F' as `0x${string}`,
    treasury: '0xeBc431a5a8a1F25e9C2CDc51aEB7634e27c56979' as `0x${string}`,
    documentRegistry: '0x8DeC096C974C5A1ac7E5AD89E1B4ea07fdB54bcD' as `0x${string}`,
    duesLending: '0x07c6FA64b2F38973a18a437617d2C387600B707e' as `0x${string}`,
    treasuryYield: '0xceBE93f38F2eeFD04512d7E06A30C105BED6FDfa' as `0x${string}`,
    vendorEscrow: '0xE6A50D5174deBa4f0abF05eDd0Fd45DAc2923C21' as `0x${string}`,
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`, // Base Sepolia USDC
  },
  // Base Mainnet (production) — populated after mainnet deploy
  base: {
    propertyNFT: '0x' as `0x${string}`,
    governor: '0x' as `0x${string}`,
    timelock: '0x' as `0x${string}`,
    treasury: '0x' as `0x${string}`,
    documentRegistry: '0x' as `0x${string}`,
    duesLending: '0x' as `0x${string}`,
    treasuryYield: '0x' as `0x${string}`,
    vendorEscrow: '0x' as `0x${string}`,
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, // Base Mainnet USDC
  },
} as const;

export function getContracts(chainId: number) {
  switch (chainId) {
    case 84532: return CONTRACTS.baseSepolia;
    case 8453: return CONTRACTS.base;
    default: return CONTRACTS.baseSepolia;
  }
}
