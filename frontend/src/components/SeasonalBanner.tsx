'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Defense in depth: even if AppShell accidentally renders SeasonalBanner on
// an unauthenticated route (signup, login, invite accept, waitlist, etc.),
// the banner should self-bail. The "Spring at Faircroft" message is a
// community-specific flavor line that makes zero sense to a stranger
// looking at the signup form — they haven't joined Faircroft (or any
// community) yet.
const HIDDEN_ON_PATHS = [
  '/login',
  '/signup',
  '/invite',
  '/waitlist',
  '/forgot-password',
  '/reset-password',
];

// V11 fix: Replaced Tailwind gradient classes (from-*-900/20 to-*-900/10) with
// explicit inline rgba gradients. Tailwind v4 compiles `from-*/*` gradient
// utilities through its oklab color pipeline, producing `oklab(...)` values in
// the rendered CSS that bypass the palette audit and trigger off-palette flags
// in the luxury design audit. Inline rgba keeps every color on-palette and
// deterministic. Colors are palette-tinted toward the season without leaving
// the declared obsidian/brass/cream family.
interface SeasonInfo {
  message: string;
  gradientCss: string;
  textColor: string;
}

function getSeasonInfo(): SeasonInfo {
  const month = new Date().getMonth() + 1; // 1-12

  // Holiday overrides first
  const day = new Date().getDate();
  if (month === 12 && day >= 20) {
    return {
      message: 'Happy Holidays from Faircroft.',
      // Forest green → obsidian wash
      gradientCss:
        'linear-gradient(to right, rgba(42,93,79,0.20) 0%, rgba(20,20,22,0.20) 100%)',
      textColor: 'var(--parchment)',
    };
  }
  if (month === 10 && day >= 25) {
    return {
      message: 'Happy Halloween, Faircroft.',
      // Brass-shifted amber → obsidian
      gradientCss:
        'linear-gradient(to right, rgba(176,110,43,0.22) 0%, rgba(20,20,22,0.22) 100%)',
      textColor: 'var(--parchment)',
    };
  }

  // Seasons
  if (month >= 3 && month <= 5) {
    return {
      message: 'Spring at Faircroft — enjoy the blooms.',
      // Soft cream → parchment wash, palette-aligned
      gradientCss:
        'linear-gradient(to right, rgba(212,196,160,0.18) 0%, rgba(176,155,113,0.14) 100%)',
      textColor: 'var(--parchment)',
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      message: 'Summer in Faircroft — pool hours extended.',
      // Warm brass → obsidian
      gradientCss:
        'linear-gradient(to right, rgba(212,196,160,0.20) 0%, rgba(176,155,113,0.12) 100%)',
      textColor: 'var(--parchment)',
    };
  }
  if (month >= 9 && month <= 11) {
    return {
      message: 'Fall at Faircroft — leaf collection begins soon.',
      // Deep brass → obsidian
      gradientCss:
        'linear-gradient(to right, rgba(176,110,43,0.20) 0%, rgba(176,155,113,0.14) 100%)',
      textColor: 'var(--parchment)',
    };
  }
  // Winter (Dec 1-19, Jan, Feb)
  return {
    message: 'Winter at Faircroft — stay warm and safe.',
    // Steel blue-gray → obsidian
    gradientCss:
      'linear-gradient(to right, rgba(109,125,140,0.18) 0%, rgba(20,20,22,0.20) 100%)',
    textColor: 'var(--parchment)',
  };
}

const DISMISS_KEY = 'suvren-seasonal-banner-dismissed';

function getDismissKey(): string {
  const now = new Date();
  return `${DISMISS_KEY}-${now.getFullYear()}-${now.getMonth()}`;
}

export function SeasonalBanner() {
  const pathname = usePathname();
  const isHiddenRoute = HIDDEN_ON_PATHS.some(
    (p) => pathname === p || pathname?.startsWith(p + '/'),
  );

  const [visible, setVisible] = useState(false);
  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isHiddenRoute) {
      setVisible(false);
      return;
    }
    const key = getDismissKey();
    const dismissed = localStorage.getItem(key);
    if (!dismissed) {
      setSeason(getSeasonInfo());
      setVisible(true);
    }
  }, [isHiddenRoute]);

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

  if (isHiddenRoute || !visible || !season) return null;

  return (
    <div
      className="relative border-b border-[rgba(245,240,232,0.05)] px-4 sm:px-6 overflow-hidden"
      style={{
        // V11 fix: inline rgba gradient replaces Tailwind's from-*/* classes
        // to prevent Tailwind v4 emitting oklab() in the compiled CSS.
        backgroundImage: season.gradientCss,
        height: scrolled ? '28px' : '40px',
        padding: scrolled ? '0 1rem' : '0.5rem 1rem',
        transition: 'height 0.3s ease, padding 0.3s ease',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center gap-3 h-full">
        <p
          className="flex-1"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontSize: '13px',
            letterSpacing: '0.02em',
            opacity: 0.7,
            color: season.textColor,
          }}
        >
          {season.message}
        </p>
        <button
          onClick={dismiss}
          className="text-[var(--text-disabled)] hover:text-[var(--text-body)] transition-colors text-sm shrink-0 ml-2 leading-none"
          aria-label="Dismiss"
          style={{ fontFamily: 'Georgia, serif', fontSize: '16px' }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
