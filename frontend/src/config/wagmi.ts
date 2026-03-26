import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, base } from 'wagmi/chains';
import { http, fallback } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'SuvrenHOA',
  projectId: 'e1cad1c55aa4718ec1872d9e315bd23a',
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: fallback([
      http('https://sepolia.base.org', {
        batch: { batchSize: 50, wait: 50 },
        retryCount: 3,
        retryDelay: 1000,
      }),
      http('https://base-sepolia-rpc.publicnode.com', {
        batch: { batchSize: 50, wait: 50 },
        retryCount: 3,
        retryDelay: 1000,
      }),
    ]),
    [base.id]: fallback([
      http('https://mainnet.base.org', {
        batch: { batchSize: 50, wait: 50 },
      }),
      http('https://base-rpc.publicnode.com', {
        batch: { batchSize: 50, wait: 50 },
      }),
    ]),
  },
  ssr: true,
});
