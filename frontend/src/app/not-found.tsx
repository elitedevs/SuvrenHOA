import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <h2
          className="text-2xl mb-3 font-heading"
          style={{ fontFamily: 'var(--font-heading), Georgia, serif', color: 'rgba(245, 240, 232, 0.7)' }}
        >
          Page Not Found
        </h2>
        <p className="text-[14px] mb-8" style={{ color: 'var(--text-muted)' }}>
          This page doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-md text-[13px] transition-all"
          style={{
            background: 'rgba(176, 155, 113, 0.12)',
            color: 'var(--accent-brass)',
            border: '1px solid rgba(176, 155, 113, 0.2)',
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
