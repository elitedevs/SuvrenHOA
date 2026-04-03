'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('suvren-hoa-theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    const el = document.documentElement;
    // Only add/remove theme classes — preserve font variable classes
    el.classList.remove('dark', 'light');
    el.classList.add(t);
  };

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('suvren-hoa-theme', next);
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:bg-[rgba(245,240,232,0.05)] transition-colors"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '' : ''}
    </button>
  );
}
