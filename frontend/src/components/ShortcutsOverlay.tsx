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
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[#B09B71]/30 bg-[#0d0d0d] shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-lg">⌨</span>
            <h2 className="text-base font-bold text-[#D4C4A0]">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[rgba(245,240,232,0.35)] hover:text-[rgba(245,240,232,0.65)] hover:bg-white/5 transition-colors text-sm"
          >
            
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-2">
          {KEYBOARD_SHORTCUTS.map(({ keys, description }) => (
            <div key={keys} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[rgba(245,240,232,0.50)]">{description}</span>
              <div className="flex items-center gap-1">
                {keys.split(' ').map((k, i) => (
                  <span key={i} className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md text-xs font-bold font-mono
                    ${i > 0 && keys.split(' ').length > 1 && i === keys.split(' ').length - 1
                      ? 'bg-[#B09B71]/15 border border-[#B09B71]/30 text-[#D4C4A0]'
                      : 'bg-gray-800/80 border border-gray-700 text-[rgba(245,240,232,0.65)]'
                    }`}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-white/5">
          <p className="text-[11px] text-[rgba(245,240,232,0.25)] text-center">
            Press <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-800 border border-gray-700 text-[10px] font-mono mx-0.5">?</kbd> to toggle this overlay
          </p>
        </div>
      </div>
    </div>
  );
}
