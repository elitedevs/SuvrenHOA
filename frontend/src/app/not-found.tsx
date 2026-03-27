import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
      <div className="glass-card rounded-2xl p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center text-3xl mx-auto mb-5">
          🏠
        </div>
        <h2 className="text-xl font-semibold text-gray-100 mb-2">Page Not Found</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          This page doesn&apos;t exist or may have moved. Head back to the dashboard.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-bold transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
