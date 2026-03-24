import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'FaircroftDAO',
  projectId: 'faircroft-dao-dev', // WalletConnect project ID (get from cloud.walletconnect.com)
  chains: [baseSepolia, base],
  ssr: true,
});
