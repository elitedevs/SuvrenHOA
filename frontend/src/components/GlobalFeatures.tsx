'use client';

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ShortcutsOverlay } from '@/components/ShortcutsOverlay';
import { CommandPalette } from '@/components/CommandPalette';
import { WelcomeTour } from '@/components/WelcomeTour';
import { useAccount } from 'wagmi';

/**
 * GlobalFeatures — a single 'use client' component that wires up all global
 * features: keyboard shortcuts, command palette, shortcuts overlay, welcome tour.
 * Imported once in layout.tsx.
 */
export function GlobalFeatures() {
  const { isConnected } = useAccount();
  const { showOverlay, hideOverlay } = useKeyboardShortcuts();

  return (
    <>
      {/* Keyboard Shortcut Overlay */}
      {showOverlay && <ShortcutsOverlay onClose={hideOverlay} />}

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Welcome Tour */}
      <WelcomeTour isConnected={isConnected} />
    </>
  );
}
