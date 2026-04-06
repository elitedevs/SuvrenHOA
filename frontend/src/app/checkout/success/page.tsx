'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { TRIAL_DURATION_DAYS } from '@/lib/plan-limits';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="max-w-lg mx-auto text-center py-20 animate-fadeInUp">
      <div className="w-16 h-16 rounded-full bg-[var(--glow-green)] flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-[var(--verdigris)]" />
      </div>

      <h1 className="font-serif text-3xl text-[var(--text-heading)] mb-3">
        Welcome to SuvrenHOA
      </h1>

      <p className="text-[var(--text-body)] mb-2">
        Your {TRIAL_DURATION_DAYS}-day free trial has started. No credit card on file — we&apos;ll
        remind you before it ends.
      </p>

      <p className="text-sm text-[var(--text-muted)] mb-8">
        Session: {sessionId ? sessionId.slice(0, 16) + '...' : 'N/A'}
      </p>

      <div className="bg-[var(--surface-1)] rounded-lg p-6 mb-8 text-left">
        <h2 className="font-serif text-lg text-[var(--text-heading)] mb-4">
          Get Started
        </h2>
        <ul className="space-y-3 text-sm text-[var(--text-body)]">
          <li className="flex items-start gap-3">
            <span className="text-[var(--aged-brass)] font-semibold">1.</span>
            Invite your board members and residents
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[var(--aged-brass)] font-semibold">2.</span>
            Set up your community profile and governance rules
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[var(--aged-brass)] font-semibold">3.</span>
            Create your first proposal or treasury request
          </li>
        </ul>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="bg-[var(--aged-brass)] text-[var(--obsidian)] px-8 py-3 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Go to Dashboard
      </button>

      <p className="text-xs text-[var(--text-disabled)] mt-4">
        Redirecting in {countdown}s...
      </p>
    </div>
  );
}
