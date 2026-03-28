'use client';

import { useEffect } from 'react';

export function SeasonalTheme() {
  useEffect(() => {
    const month = new Date().getMonth() + 1;
    let season = 'spring';
    if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    else if (month <= 2 || month === 12) season = 'winter';
    document.documentElement.setAttribute('data-season', season);
  }, []);
  return null;
}
