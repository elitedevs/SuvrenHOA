import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, base } from 'wagmi/chains';
import { http } from 'wagmi';
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';

export const config = getDefaultConfig({
  appName: 'SuvrenHOA',
  projectId: 'e1cad1c55aa4718ec1872d9e315bd23a',
  chains: [baseSepolia, base],
  ssr: true,
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        injectedWallet,
        walletConnectWallet,
      ],
    },
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
});
