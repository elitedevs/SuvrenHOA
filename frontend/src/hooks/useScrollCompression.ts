'use client';

import { useState, useEffect } from 'react';

export function useScrollCompression(threshold = 80) {
  const [compressed, setCompressed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setCompressed(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return compressed;
}
