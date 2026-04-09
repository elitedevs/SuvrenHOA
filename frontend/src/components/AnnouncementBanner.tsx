'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';

export interface AnnouncementBannerProps {
  id: string;
  message: string;
  ctaText?: string;
  ctaHref?: string;
  ctaExternal?: boolean;
  dismissable?: boolean;
  variant?: 'gold' | 'info' | 'launch';
}

// Default announcement — edit this or pass props from a server component
const DEFAULT_ANNOUNCEMENT: AnnouncementBannerProps = {
  id: 'founding-launch-2026',
  message: 'The Founding Community Program is open — 50 spots, 20% lifetime discount.',
  ctaText: 'Apply Now',
  ctaHref: '/founding',
  ctaExternal: false,
  dismissable: true,
  variant: 'gold',
};

export function AnnouncementBanner({
  id = DEFAULT_ANNOUNCEMENT.id,
  message = DEFAULT_ANNOUNCEMENT.message,
  ctaText = DEFAULT_ANNOUNCEMENT.ctaText,
  ctaHref = DEFAULT_ANNOUNCEMENT.ctaHref,
  ctaExternal = false,
  dismissable = true,
  variant = 'gold',
}: Partial<AnnouncementBannerProps> = {}) {
  const [dismissed, setDismissed] = useState(true); // default hidden on SSR

  useEffect(() => {
    try {
      const key = `announcement-dismissed-${id}`;
      setDismissed(localStorage.getItem(key) === '1');
    } catch {
      setDismissed(false);
    }
  }, [id]);

  function dismiss() {
    try {
      localStorage.setItem(`announcement-dismissed-${id}`, '1');
    } catch { /* ignore */ }
    setDismissed(true);
  }

  if (dismissed) return null;

  // V8: use inline styles for gradient/border so we avoid Tailwind v4's [#hex]/n
  // color-mix() compile path (which computes to lab() and fails palette audits).
  const variantClass: Record<string, string> = {
    gold: 'text-[#C4BAA8]',
    info: 'bg-[#1A2A3A] text-blue-200',
    launch: 'text-[#E8D4C0]',
  };
  const variantStyle: Record<string, React.CSSProperties> = {
    gold: {
      backgroundImage: 'linear-gradient(to right, rgba(176,155,113,0.15), rgba(138,122,85,0.10))',
      borderBottom: '1px solid rgba(176,155,113,0.20)',
    },
    info: {
      borderBottom: '1px solid rgba(59,130,246,0.20)',
    },
    launch: {
      backgroundImage: 'linear-gradient(to right, rgba(246,131,65,0.15), rgba(176,155,113,0.10))',
      borderBottom: '1px solid rgba(246,131,65,0.20)',
    },
  };

  const ctaStyles = {
    gold: 'text-[#B09B71] hover:text-[#C4B080]',
    info: 'text-blue-400 hover:text-blue-300',
    launch: 'text-[#F68341] hover:text-[#F09040]',
  };

  return (
    <div
      className={`relative flex items-center justify-center gap-3 px-4 py-2.5 text-sm ${variantClass[variant]}`}
      style={variantStyle[variant]}
    >
      <p className="text-center leading-snug">{message}</p>
      {ctaHref && ctaText && (
        ctaExternal ? (
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap flex-shrink-0 ${ctaStyles[variant]}`}
          >
            {ctaText}
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        ) : (
          <Link
            href={ctaHref}
            className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap flex-shrink-0 ${ctaStyles[variant]}`}
          >
            {ctaText}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )
      )}
      {dismissable && (
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-[#4A4A52] hover:text-[#8A8070] transition-colors rounded"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
