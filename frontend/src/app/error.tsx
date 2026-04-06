'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry is initialised via instrumentation.ts and will auto-capture uncaught errors.
    // Log to console in dev only.
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      {/* Brass divider */}
      <div className="mb-8 flex items-center justify-center">
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(176,155,113,0.6), transparent)' }}
        />
        <span
          className="mx-4 text-xs tracking-[0.3em] uppercase"
          style={{ color: 'rgba(176,155,113,0.5)', fontFamily: 'var(--font-body)' }}
        >
          Error
        </span>
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(176,155,113,0.6), transparent)' }}
        />
      </div>

      <p
        className="text-2xl mb-2 leading-snug"
        style={{
          fontFamily: 'var(--font-heading)',
          fontStyle: 'italic',
          fontWeight: 400,
          color: 'var(--text-heading)',
        }}
      >
        Something went sideways.
      </p>
      <p
        className="text-sm mb-10 max-w-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        We&rsquo;ve been notified. Try again, or return to the dashboard.
        {error.digest && (
          <span className="block mt-1 text-xs" style={{ color: 'var(--text-disabled)' }}>
            Ref: {error.digest}
          </span>
        )}
      </p>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-lg text-sm font-medium border transition-all"
          style={{
            borderColor: 'rgba(176,155,113,0.3)',
            color: '#B09B71',
            background: 'transparent',
          }}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: '#B09B71',
            color: '#0C0C0E',
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
