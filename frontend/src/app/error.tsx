'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('ErrorBoundary');

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error('Page error caught', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <h2
          className="text-2xl mb-3 font-heading"
          style={{ fontFamily: 'var(--font-heading), Georgia, serif', color: 'rgba(245, 240, 232, 0.7)' }}
        >
          Something went wrong
        </h2>
        <p className="text-[14px] mb-8" style={{ color: 'var(--text-muted)' }}>
          An unexpected error occurred. You can try again or return to the dashboard.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre
            className="text-[12px] rounded-lg p-3 mb-6 text-left overflow-auto max-h-32"
            style={{
              color: '#8B5A5A',
              background: 'rgba(107, 58, 58, 0.06)',
              border: '1px solid rgba(107, 58, 58, 0.1)',
            }}
          >
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-md text-[13px] transition-all"
            style={{
              background: 'rgba(176, 155, 113, 0.12)',
              color: 'var(--accent-brass)',
              border: '1px solid rgba(176, 155, 113, 0.2)',
            }}
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-md text-[13px] transition-all"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
