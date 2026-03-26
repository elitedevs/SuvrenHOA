'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ShortcutDefinition {
  keys: string;
  description: string;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  onShowHelp?: () => void;
  onHideHelp?: () => void;
}

export function useKeyboardShortcuts({ onShowHelp, onHideHelp }: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState(false);
  const gPressed = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useCallback((path: string) => {
    router.push(path);
    gPressed.current = false;
  }, [router]);

  const toggleOverlay = useCallback(() => {
    setShowOverlay(prev => {
      const next = !prev;
      if (next) onShowHelp?.();
      else onHideHelp?.();
      return next;
    });
  }, [onShowHelp, onHideHelp]);

  const hideOverlay = useCallback(() => {
    setShowOverlay(false);
    onHideHelp?.();
  }, [onHideHelp]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if focused on input/textarea/select/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) return;

      const key = e.key.toLowerCase();

      // Escape — close overlay
      if (e.key === 'Escape') {
        if (showOverlay) {
          hideOverlay();
          return;
        }
        // Dispatch custom close event for other modals
        document.dispatchEvent(new CustomEvent('suvren:close-modal'));
        return;
      }

      // ? — toggle help overlay
      if (e.key === '?') {
        e.preventDefault();
        toggleOverlay();
        return;
      }

      // Cmd+K or Ctrl+K — command palette
      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('suvren:open-search'));
        return;
      }

      // g-sequence shortcuts
      if (key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gPressed.current = true;
        if (gTimer.current) clearTimeout(gTimer.current);
        gTimer.current = setTimeout(() => {
          gPressed.current = false;
        }, 1000);
        return;
      }

      if (gPressed.current) {
        gPressed.current = false;
        if (gTimer.current) clearTimeout(gTimer.current);

        switch (key) {
          case 'd': navigate('/dashboard'); break;
          case 'p': navigate('/proposals'); break;
          case 't': navigate('/treasury'); break;
          case 'm': navigate('/messages'); break;
          case 'a': navigate('/alerts'); break;
          case 'h': navigate('/'); break;
          default: break;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showOverlay, navigate, toggleOverlay, hideOverlay]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (gTimer.current) clearTimeout(gTimer.current);
    };
  }, []);

  return { showOverlay, hideOverlay, toggleOverlay };
}

export const KEYBOARD_SHORTCUTS = [
  { keys: 'g d', description: 'Go to Dashboard' },
  { keys: 'g p', description: 'Go to Proposals' },
  { keys: 'g t', description: 'Go to Treasury' },
  { keys: 'g m', description: 'Go to Messages' },
  { keys: 'g a', description: 'Go to Alerts' },
  { keys: 'g h', description: 'Go to Home' },
  { keys: '?', description: 'Show / Hide this help' },
  { keys: 'Esc', description: 'Close modals & overlays' },
  { keys: '⌘ K', description: 'Open Command Palette' },
];
