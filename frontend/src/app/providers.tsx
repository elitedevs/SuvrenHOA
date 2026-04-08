'use client';

import { useState } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/config/wagmi';
import { AuthProviderWithBoundary } from '@/context/AuthContext';

import '@rainbow-me/rainbowkit/styles.css';

// Lux palette override for RainbowKit. darkTheme() only exposes accentColor /
// accentColorForeground / borderRadius — anything else (modal surface, status
// pips, error/standby colors) needs to be patched on top of the returned theme
// object. V7 Lux audit flagged the default RainbowKit greens/reds/yellows as
// off-palette; this snaps them to verdigris / rosewood / warm amber.
const luxRainbowTheme = (() => {
  const base = darkTheme({
    accentColor: '#B09B71',
    accentColorForeground: '#0C0C0E',
    borderRadius: 'medium',
  });
  return {
    ...base,
    colors: {
      ...base.colors,
      modalBackground: '#1A1A1E',
      modalBackdrop: 'rgba(12, 12, 14, 0.72)',
      modalBorder: 'rgba(176, 155, 113, 0.25)',
      modalText: '#F5F0E8',
      modalTextDim: 'rgba(245, 240, 232, 0.6)',
      modalTextSecondary: '#B09B71',
      connectionIndicator: '#2A5D4F',
      error: '#6B3A3A',
      connectButtonBackground: '#1A1A1E',
      connectButtonBackgroundError: '#6B3A3A',
      connectButtonInnerBackground: '#141416',
      connectButtonText: '#F5F0E8',
      connectButtonTextError: '#F5F0E8',
      standby: '#A08050',
      downloadTopCardBackground: '#1A1A1E',
      downloadBottomCardBackground: '#141416',
      generalBorder: 'rgba(245, 240, 232, 0.08)',
      generalBorderDim: 'rgba(245, 240, 232, 0.04)',
      menuItemBackground: '#1A1A1E',
      profileAction: '#141416',
      profileActionHover: '#1A1A1E',
      profileForeground: '#1A1A1E',
      selectedOptionBorder: 'rgba(176, 155, 113, 0.4)',
      closeButtonBackground: '#141416',
      closeButton: '#B09B71',
      actionButtonBorder: 'rgba(176, 155, 113, 0.25)',
      actionButtonBorderMobile: 'rgba(176, 155, 113, 0.25)',
      actionButtonSecondaryBackground: '#141416',
    },
  };
})();

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={luxRainbowTheme}>
            <AuthProviderWithBoundary>
              {children}
            </AuthProviderWithBoundary>
          </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
