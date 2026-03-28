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
      <body style={{ backgroundColor: '#0C0C0E', color: '#F5F0E8', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 400, marginBottom: '8px', fontFamily: 'Georgia, serif' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(245,240,232,0.35)', marginBottom: '32px', lineHeight: 1.65 }}>
              A critical error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                borderRadius: '6px',
                backgroundColor: 'rgba(176, 155, 113, 0.12)',
                color: '#B09B71',
                fontSize: '13px',
                fontWeight: 400,
                border: '1px solid rgba(176, 155, 113, 0.2)',
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
