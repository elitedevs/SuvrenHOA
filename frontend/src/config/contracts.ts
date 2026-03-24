/**
 * Contract addresses — updated after each deployment.
 * Base Sepolia (testnet) addresses populated after first deploy.
 */

export const CONTRACTS = {
  // Base Sepolia (testnet)
  baseSepolia: {
    propertyNFT: '0x22d9b55a9a4610cff54075d7b971b9ecb5f37f3b' as `0x${string}`,
    governor: '0x54a93c3096668164321583f462ea45cc3efc3664' as `0x${string}`,
    timelock: '0xff52cd0da27935bc7dd1de188718f1a240605ddb' as `0x${string}`,
    treasury: '0xc998e258c4fe0915cb61a1b0a8a3e429069145d8' as `0x${string}`,
    documentRegistry: '0xda72d7b243d80333f60a4096f04d55e6ea5db514' as `0x${string}`,
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
