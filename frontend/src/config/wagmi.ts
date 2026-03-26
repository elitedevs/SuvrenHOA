import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { http } from 'wagmi';
import { type Chain } from 'wagmi/chains';

// Override Base Sepolia with our own RPC to avoid 429s on the default sepolia.base.org
const baseSepolia: Chain = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://base-sepolia-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};

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
