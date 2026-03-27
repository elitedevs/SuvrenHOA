'use client';

import { useState, useEffect } from 'react';

interface SeasonInfo {
  message: string;
}

function getSeasonInfo(): SeasonInfo {
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();

  // Holiday overrides
  if (month === 12 && day >= 20) {
    return { message: 'Happy Holidays from Faircroft' };
  }
  if (month === 10 && day >= 25) {
    return { message: 'Happy Halloween, Faircroft' };
  }

  // Seasons
  if (month >= 3 && month <= 5) {
    return { message: 'Spring at Faircroft — enjoy the blooms' };
  }
  if (month >= 6 && month <= 8) {
    return { message: 'Summer in Faircroft — pool hours extended' };
  }
  if (month >= 9 && month <= 11) {
    return { message: 'Fall at Faircroft — leaf collection begins soon' };
  }
  return { message: 'Winter at Faircroft — stay warm and safe' };
}

const DISMISS_KEY = 'suvren-seasonal-banner-dismissed';

function getDismissKey(): string {
  const now = new Date();
  return `${DISMISS_KEY}-${now.getFullYear()}-${now.getMonth()}`;
}

export function SeasonalBanner() {
  const [visible, setVisible] = useState(false);
  const [season, setSeason] = useState<SeasonInfo | null>(null);

  useEffect(() => {
    const key = getDismissKey();
    const dismissed = localStorage.getItem(key);
    if (!dismissed) {
      setSeason(getSeasonInfo());
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(getDismissKey(), '1');
    setVisible(false);
  };

  if (!visible || !season) return null;

  return (
    <div className="px-4 sm:px-6 py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="max-w-[960px] mx-auto flex items-center justify-between">
        <p
          className="seasonal-banner-text font-heading"
          style={{
            fontFamily: 'var(--font-heading), Georgia, serif',
            fontStyle: 'italic',
            fontSize: '13px',
            letterSpacing: '0.02em',
            color: 'var(--text-secondary)',
          }}
        >
          {season.message}
        </p>
        <button
          onClick={dismiss}
          className="text-sm shrink-0 ml-4 leading-none"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Dismiss"
        >
          
        </button>
      </div>
    </div>
  );
}
