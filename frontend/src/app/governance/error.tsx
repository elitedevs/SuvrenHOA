'use client';

export default function GovernanceError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-xl font-serif italic text-[var(--text-muted)] mb-4">Something went wrong</h2>
      <p className="text-sm text-[var(--text-disabled)] mb-6">The governance page encountered an error.</p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-lg border border-[rgba(176,155,113,0.3)] text-[var(--brass)] text-sm font-medium hover:bg-[rgba(176,155,113,0.05)] transition-all"
      >
        Try Again
      </button>
    </div>
  );
}
