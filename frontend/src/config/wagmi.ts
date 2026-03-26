import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, base } from 'wagmi/chains';
import { http, fallback } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'SuvrenHOA',
  projectId: 'e1cad1c55aa4718ec1872d9e315bd23a',
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: fallback([
      http('https://base-sepolia-rpc.publicnode.com'),
      http('https://sepolia.base.org'),
    ]),
    [base.id]: fallback([
      http('https://base-rpc.publicnode.com'),
      http('https://mainnet.base.org'),
    ]),
  },
  ssr: true,
});
