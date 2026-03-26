'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  /** If true, format with commas */
  format?: boolean;
}

function parseValue(v: number | string): number {
  if (typeof v === 'number') return v;
  // Strip non-numeric except dot
  const cleaned = v.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

function formatNum(n: number, decimals: number, format: boolean): string {
  if (decimals > 0) {
    const s = n.toFixed(decimals);
    if (format) {
      const [int, dec] = s.split('.');
      return int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
    }
    return s;
  }
  const int = Math.floor(n).toString();
  if (format) return int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return int;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  format = false,
}: AnimatedNumberProps) {
  const target = parseValue(value);
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const startValRef = useRef(0);

  useEffect(() => {
    startValRef.current = displayed;
    startRef.current = null;

    function animate(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startValRef.current + (target - startValRef.current) * ease;
      setDisplayed(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return (
    <span className={className}>
      {prefix}{formatNum(displayed, decimals, format)}{suffix}
    </span>
  );
}
