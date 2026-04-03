'use client';

import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

interface ShortcutsOverlayProps {
  onClose: () => void;
}

export function ShortcutsOverlay({ onClose }: ShortcutsOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-sm rounded-xl border border-[rgba(176,155,113,0.30)] bg-[var(--obsidian)] shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-lg">⌨</span>
            <h2 className="text-base font-medium text-[#D4C4A0]">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-disabled)] hover:text-[var(--text-body)] hover:bg-[rgba(245,240,232,0.05)] transition-colors text-sm"
          >
            
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-2">
          {KEYBOARD_SHORTCUTS.map(({ keys, description }) => (
            <div key={keys} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[var(--text-muted)]">{description}</span>
              <div className="flex items-center gap-1">
                {keys.split(' ').map((k, i) => (
                  <span key={i} className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md text-xs font-medium font-mono
                    ${i > 0 && keys.split(' ').length > 1 && i === keys.split(' ').length - 1
                      ? 'bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.30)] text-[#D4C4A0]'
                      : 'bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-[var(--text-body)]'
                    }`}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-[rgba(245,240,232,0.05)]">
          <p className="text-[11px] text-[var(--text-disabled)] text-center">
            Press <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-[var(--surface-2)] border border-[rgba(245,240,232,0.08)] text-[10px] font-mono mx-0.5">?</kbd> to toggle this overlay
          </p>
        </div>
      </div>
    </div>
  );
}
