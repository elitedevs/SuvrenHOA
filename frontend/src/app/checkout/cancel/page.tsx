'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto text-center py-20 animate-fadeInUp">
      <h1 className="font-serif text-3xl text-[var(--text-heading)] mb-3">
        No worries
      </h1>

      <p className="text-[var(--text-body)] mb-8">
        You haven&apos;t been charged. Your community is still available — come back
        anytime to start your free trial.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => router.push('/checkout' + (history.length > 1 ? window.location.search : ''))}
          className="bg-[var(--aged-brass)] text-[var(--obsidian)] px-6 py-3 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          View Plans Again
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
