'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function useIsBoard() {
  const { address } = useAccount();
  const [isBoard, setIsBoard] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!address) {
      setIsBoard(false);
      setChecked(true);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`/api/board-check?wallet=${encodeURIComponent(address!)}`);
        if (!res.ok) throw new Error('Board check failed');
        const data = await res.json();
        if (!cancelled) {
          setIsBoard(data.isBoard === true);
          setChecked(true);
        }
      } catch {
        if (!cancelled) {
          setIsBoard(false);
          setChecked(true);
        }
      }
    }

    check();
    return () => { cancelled = true; };
  }, [address]);

  return { isBoard, checked };
}
