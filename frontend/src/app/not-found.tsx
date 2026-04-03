import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-serif italic text-[var(--text-muted)] mb-2">404</h1>
      <p className="text-sm text-[var(--text-disabled)] mb-8">This page doesn&apos;t exist yet.</p>
      <Link
        href="/dashboard"
        className="px-6 py-3 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[#0C0C0E] text-sm font-medium transition-all"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
