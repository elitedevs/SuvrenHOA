import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, base } from 'wagmi/chains';
import { http } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'SuvrenHOA',
  projectId: 'e1cad1c55aa4718ec1872d9e315bd23a',
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http('https://base-sepolia-rpc.publicnode.com'),
    [base.id]: http('https://base-rpc.publicnode.com'),
  },
  ssr: true,
});
