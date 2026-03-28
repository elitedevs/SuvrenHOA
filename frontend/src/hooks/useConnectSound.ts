'use client';

import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';

/**
 * Plays a single, barely-audible chime when a wallet connects.
 * Web Audio API — no external files, under 1KB.
 * Silence is the default. Sound is the exception that marks a moment.
 */
export function useConnectSound() {
  const { isConnected } = useAccount();
  const wasConnected = useRef(false);

  useEffect(() => {
    if (isConnected && !wasConnected.current) {
      wasConnected.current = true;
      playChime();
    } else if (!isConnected) {
      wasConnected.current = false;
    }
  }, [isConnected]);
}

function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Soft sine tone — A5 (880Hz), barely audible
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);

    // Volume: 12% — whisper, not announcement
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Silently fail — sound is optional
  }
}
