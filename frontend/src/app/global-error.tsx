'use client';

import { useEffect } from 'react';

// global-error.tsx catches errors in the root layout itself.
// It must include its own <html>/<body> since layout.tsx is bypassed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          background: '#0C0C0E',
          color: '#E8E4DC',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <p
          style={{
            fontSize: '1.5rem',
            fontStyle: 'italic',
            color: '#E8E4DC',
            marginBottom: '0.5rem',
          }}
        >
          A critical error occurred.
        </p>
        <p style={{ color: '#8A8070', fontSize: '0.875rem', marginBottom: '2rem' }}>
          We&rsquo;ve been notified. Please try again.
          {error.digest && (
            <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Ref: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          style={{
            background: '#B09B71',
            color: '#0C0C0E',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
