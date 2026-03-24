/**
 * Contract addresses — updated after each deployment.
 * Base Sepolia (testnet) addresses populated after first deploy.
 */

export const CONTRACTS = {
  // Base Sepolia (testnet)
  baseSepolia: {
    propertyNFT: '0x' as `0x${string}`,
    governor: '0x' as `0x${string}`,
    timelock: '0x' as `0x${string}`,
    treasury: '0x' as `0x${string}`,
    documentRegistry: '0x' as `0x${string}`,
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`, // Base Sepolia USDC
  },
  // Base Mainnet (production) — populated after mainnet deploy
  base: {
    propertyNFT: '0x' as `0x${string}`,
    governor: '0x' as `0x${string}`,
    timelock: '0x' as `0x${string}`,
    treasury: '0x' as `0x${string}`,
    documentRegistry: '0x' as `0x${string}`,
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
