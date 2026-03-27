'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ backgroundColor: '#0f0f12', color: '#f5f0e8', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '24px', padding: '24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(245,240,232,0.5)', marginBottom: '24px', lineHeight: 1.6 }}>
              A critical error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                backgroundColor: '#c9a96e',
                color: '#1a1a1a',
                fontSize: '14px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
