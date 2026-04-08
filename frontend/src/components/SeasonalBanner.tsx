'use client';

import { useState, useEffect } from 'react';

interface SeasonInfo {
  emoji: string;
  message: string;
  gradient: string;
  textColor: string;
}

function getSeasonInfo(): SeasonInfo {
  const month = new Date().getMonth() + 1; // 1-12

  // Holiday overrides first
  const day = new Date().getDate();
  if (month === 12 && day >= 20) {
    return {
      emoji: '',
      message: 'Happy Holidays from Faircroft!',
      gradient: 'from-green-900/30 to-red-900/20',
      textColor: 'text-[#2A5D4F]',
    };
  }
  if (month === 10 && day >= 25) {
    return {
      emoji: '',
      message: 'Happy Halloween, Faircroft!',
      gradient: 'from-orange-900/30 to-[rgba(20,20,22,0.20)]',
      textColor: 'text-[#B09B71]',
    };
  }

  // Seasons
  if (month >= 3 && month <= 5) {
    return {
      emoji: '',
      message: 'Spring at Faircroft — enjoy the blooms!',
      gradient: 'from-pink-900/20 to-purple-900/10',
      textColor: 'text-pink-300',
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      emoji: '',
      message: 'Summer in Faircroft — pool hours extended!',
      gradient: 'from-yellow-900/20 to-amber-900/10',
      textColor: 'text-[#B09B71]',
    };
  }
  if (month >= 9 && month <= 11) {
    return {
      emoji: '',
      message: 'Fall at Faircroft — leaf collection begins soon.',
      gradient: 'from-amber-900/25 to-orange-900/15',
      textColor: 'text-[#B09B71]',
    };
  }
  // Winter (Dec 1-19, Jan, Feb)
  return {
    emoji: '',
    message: 'Winter at Faircroft — stay warm and safe.',
    gradient: 'from-blue-900/20 to-slate-900/10',
    textColor: 'text-[var(--steel)]',
  };
}

const DISMISS_KEY = 'suvren-seasonal-banner-dismissed';

function getDismissKey(): string {
  const now = new Date();
  return `${DISMISS_KEY}-${now.getFullYear()}-${now.getMonth()}`;
}

export function SeasonalBanner() {
  const [visible, setVisible] = useState(false);
  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const key = getDismissKey();
    const dismissed = localStorage.getItem(key);
    if (!dismissed) {
      setSeason(getSeasonInfo());
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const dismiss = () => {
    localStorage.setItem(getDismissKey(), '1');
    setVisible(false);
  };

  if (!visible || !season) return null;

  return (
    <div
      className={`relative bg-gradient-to-r ${season.gradient} border-b border-[rgba(245,240,232,0.05)] px-4 sm:px-6 overflow-hidden`}
      style={{
        height: scrolled ? '28px' : '40px',
        padding: scrolled ? '0 1rem' : '0.5rem 1rem',
        transition: 'height 0.3s ease, padding 0.3s ease',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center gap-3 h-full">
        <span className="text-lg shrink-0">{season.emoji}</span>
        <p className="flex-1" style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontStyle: 'italic',
          fontSize: '13px',
          letterSpacing: '0.02em',
          opacity: 0.7,
          color: 'var(--parchment)',
        }}>
          {season.message}
        </p>
        <button
          onClick={dismiss}
          className="text-[var(--text-disabled)] hover:text-[var(--text-body)] transition-colors text-sm shrink-0 ml-2 leading-none"
          aria-label="Dismiss"
        >
          
        </button>
      </div>
    </div>
  );
}
