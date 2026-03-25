import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

/**
 * Shared public client for wallet-less chain reads.
 * Used by usePublicData, useActivityFeed, and any public-facing pages.
 */
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

export const CHAIN_ID = 84532;
