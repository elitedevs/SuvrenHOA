'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

/**
 * /waitlist — invite-only holding page.
 *
 * The product is gated until Ryan's stabilization pass is complete. Retail
 * CTAs ("Reserve Your Seat") land here instead of /signup so no one slips
 * through before we're ready. Invite holders are routed directly to
 * /signup?token=... and bypass this page entirely.
 *
 * Posts to the existing /api/launch/signup endpoint which writes to the
 * launch_signups table in Supabase. No new schema.
 */

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function WaitlistPageClient() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('submitting');
    setErrorMsg('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Please enter a valid email address.');
      setState('error');
      return;
    }

    try {
      const res = await fetch('/api/launch/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          name: name.trim() || undefined,
          source: 'launch_page',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setState('error');
        return;
      }
      setState('success');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative max-w-xl w-full text-center">
        {/* Overline */}
        <p
          className="text-[11px] uppercase tracking-[0.22em] text-[rgba(176,155,113,0.65)] mb-6"
          style={{ fontWeight: 500 }}
        >
          By Invitation
        </p>

        {/* Serif headline — matches the /about, /security scale */}
        <h1
          className="font-serif text-[var(--parchment)] mb-6"
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Reserve Your Seat
        </h1>

        <p
          className="text-[15px] leading-relaxed text-[rgba(245,240,232,0.55)] max-w-lg mx-auto mb-10"
        >
          SuvrenHOA is opening its doors slowly, by invitation, to a small
          cohort of founding communities. Leave your details and we will reach
          out when the next seat opens.
        </p>

        {state === 'success' ? (
          <div
            className="glass-card rounded-2xl p-10 text-center"
            style={{ border: '1px solid rgba(176,155,113,0.18)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'rgba(176,155,113,0.10)',
                border: '1px solid rgba(176,155,113,0.28)',
              }}
            >
              <Check className="w-5 h-5 text-[#B09B71]" strokeWidth={1.75} />
            </div>
            <h2
              className="font-serif text-[var(--parchment)] mb-3"
              style={{
                fontSize: '1.5rem',
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}
            >
              Your seat is held
            </h2>
            <p className="text-sm text-[rgba(245,240,232,0.55)] leading-relaxed max-w-sm mx-auto">
              We will be in touch when the next cohort opens. In the meantime,
              expect silence — that is intentional.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
            <div className="text-left">
              <label
                htmlFor="waitlist-name"
                className="block text-[11px] uppercase tracking-[0.18em] text-[rgba(245,240,232,0.35)] mb-2"
              >
                Name <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="waitlist-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={state === 'submitting'}
                className="w-full px-4 py-3 rounded-lg text-sm text-[var(--parchment)] placeholder:text-[rgba(245,240,232,0.20)] focus:outline-none transition-colors"
                style={{
                  background: 'rgba(245,240,232,0.03)',
                  border: '1px solid rgba(176,155,113,0.18)',
                }}
              />
            </div>

            <div className="text-left">
              <label
                htmlFor="waitlist-email"
                className="block text-[11px] uppercase tracking-[0.18em] text-[rgba(245,240,232,0.35)] mb-2"
              >
                Email
              </label>
              <input
                id="waitlist-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                autoComplete="email"
                disabled={state === 'submitting'}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg text-sm text-[var(--parchment)] placeholder:text-[rgba(245,240,232,0.20)] focus:outline-none transition-colors"
                style={{
                  background: 'rgba(245,240,232,0.03)',
                  border: '1px solid rgba(176,155,113,0.18)',
                }}
              />
            </div>

            {errorMsg && (
              <p className="text-left text-xs text-[#C98B8B]">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={state === 'submitting'}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #B09B71 0%, #8A7A5A 100%)',
                color: '#0C0C0E',
                boxShadow: '0 0 24px rgba(176,155,113,0.25)',
              }}
            >
              {state === 'submitting' ? 'Holding Your Seat…' : 'Reserve Your Seat'}
              {state !== 'submitting' && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-[11px] text-[rgba(245,240,232,0.32)] pt-2">
              Already have an invitation?{' '}
              <Link
                href="/login"
                className="text-[rgba(176,155,113,0.75)] hover:text-[#D4C4A0] transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
