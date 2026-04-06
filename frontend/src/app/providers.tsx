'use client';

import { useState } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'viem/chains';
import { config } from '@/config/wagmi';

import '@rainbow-me/rainbowkit/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={baseSepolia}
          projectId={process.env.NEXT_PUBLIC_COINBASE_PROJECT_ID}
        >
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#B09B71',
              accentColorForeground: '#0C0C0E',
              borderRadius: 'medium',
            })}
          >
            {children}
          </RainbowKitProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
