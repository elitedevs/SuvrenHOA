import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      {/* Brass thin-stroke accent */}
      <div className="mb-8 flex items-center justify-center">
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(176,155,113,0.6), transparent)' }}
        />
        <span
          className="mx-4 text-xs tracking-[0.3em] uppercase"
          style={{ color: 'rgba(176,155,113,0.5)', fontFamily: 'var(--font-body)' }}
        >
          404
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
        We&rsquo;re still building this room.
      </p>
      <p
        className="text-sm mb-10"
        style={{ color: 'var(--text-muted)' }}
      >
        Head back to the lobby?
      </p>

      <Link
        href="/dashboard"
        className="btn-primary px-8 py-3 rounded-lg text-sm font-medium transition-all"
        style={{
          background: '#B09B71',
          color: '#0C0C0E',
        }}
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
