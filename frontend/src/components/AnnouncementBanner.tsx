'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ArrowRight } from 'lucide-react';

// Hide the global "Founding Community Program is open" announcement on
// unauthenticated auth-flow pages. Someone trying to log in or accept an
// invitation shouldn't be pitched a separate founding-program CTA on top
// of the one they're already in the middle of.
const HIDDEN_ON_PATHS = [
  '/login',
  '/signup',
  '/invite',
  '/waitlist',
  '/forgot-password',
  '/reset-password',
];

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
  const pathname = usePathname();
  const isHiddenRoute = HIDDEN_ON_PATHS.some(
    (p) => pathname === p || pathname?.startsWith(p + '/'),
  );

  const [dismissed, setDismissed] = useState(true); // default hidden on SSR

  useEffect(() => {
    try {
      const key = `announcement-dismissed-${id}`;
      setDismissed(localStorage.getItem(key) === '1');
    } catch {
      setDismissed(false);
    }
  }, [id]);

  if (isHiddenRoute) return null;

  function dismiss() {
    try {
      localStorage.setItem(`announcement-dismissed-${id}`, '1');
    } catch { /* ignore */ }
    setDismissed(true);
  }

  if (dismissed) return null;

  // V8: use inline styles for gradient/border so we avoid Tailwind v4's [#hex]/n
  // color-mix() compile path (which computes to lab() and fails palette audits).
  // V14.2 Lux sweep: all three variants now use canonical OBSIDIAN tokens.
  // Differentiation comes from gradient direction and border weight, not from
  // off-palette third-party colors (no Tailwind blue, no PH orange, no warm grays).
  const variantClass: Record<string, string> = {
    gold:   'text-[rgba(245,240,232,0.75)]',
    info:   'text-[rgba(245,240,232,0.75)]',
    launch: 'text-[rgba(245,240,232,0.85)]',
  };
  const variantStyle: Record<string, React.CSSProperties> = {
    gold: {
      backgroundImage: 'linear-gradient(to right, rgba(176,155,113,0.15), rgba(176,155,113,0.06))',
      borderBottom: '1px solid rgba(176,155,113,0.20)',
    },
    info: {
      backgroundImage: 'linear-gradient(to right, rgba(176,155,113,0.08), rgba(176,155,113,0.04))',
      borderBottom: '1px solid rgba(176,155,113,0.16)',
    },
    launch: {
      backgroundImage: 'linear-gradient(to right, rgba(176,155,113,0.20), rgba(176,155,113,0.10))',
      borderBottom: '1px solid rgba(176,155,113,0.28)',
    },
  };

  const ctaStyles = {
    gold:   'text-[#B09B71] hover:text-[#D4C4A0]',
    info:   'text-[#B09B71] hover:text-[#D4C4A0]',
    launch: 'text-[#D4C4A0] hover:text-[#F5F0E8]',
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
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-[rgba(245,240,232,0.35)] hover:text-[rgba(245,240,232,0.65)] transition-colors rounded"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
