'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface EmailCaptureProps {
  /** 'card' renders a standalone glass card; 'inline' renders a compact row for tight spaces like the footer */
  variant?: 'card' | 'inline';
  source?: string;
  heading?: string;
  subtext?: string;
}

export function EmailCapture({
  variant = 'card',
  source = 'launch_page',
  heading = 'Get notified at launch',
  subtext = "We're launching on Product Hunt Oct 19th. Join the list for early access and founding member pricing.",
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    if (variant === 'inline') {
      return (
        <div className="flex items-center gap-2 mt-4">
          <CheckCircle className="w-4 h-4 text-[#2A5D4F] shrink-0" />
          <p className="text-[13px] text-[rgba(245,240,232,0.4)]">You&apos;re on the list — see you Oct 19th.</p>
        </div>
      );
    }
    return (
      <div className="glass-card rounded-2xl p-10 text-center">
        <div className="w-12 h-12 rounded-xl bg-[rgba(42,93,79,0.12)] border border-[rgba(42,93,79,0.25)] flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-[#2A5D4F]" />
        </div>
        <h2 className="text-xl font-medium text-[var(--parchment)] mb-2">You&apos;re on the list</h2>
        <p className="text-sm text-[var(--text-muted)]">We&apos;ll reach out before the Oct 19th launch.</p>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="mt-3">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
            placeholder="your@email.com"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[rgba(245,240,232,0.04)] border border-[rgba(176,155,113,0.20)] text-[var(--parchment)] placeholder:text-[rgba(245,240,232,0.20)] text-[13px] focus:outline-none focus:border-[rgba(176,155,113,0.50)] transition-colors"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            aria-label="Subscribe"
            className="px-3 py-2 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium hover:bg-[#C4A96E] transition-colors disabled:opacity-50 shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {errorMsg && <p className="mt-1.5 text-xs text-[#9B5A5A]">{errorMsg}</p>}
      </form>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-10 text-center">
      <h2 className="text-xl font-medium gradient-text mb-2">{heading}</h2>
      <p className="text-[var(--text-muted)] text-sm mb-6 max-w-sm mx-auto leading-relaxed">{subtext}</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
          placeholder="your@email.com"
          className="flex-1 px-4 py-3 rounded-lg bg-[rgba(245,240,232,0.04)] border border-[rgba(176,155,113,0.20)] text-[var(--parchment)] placeholder:text-[rgba(245,240,232,0.20)] text-sm focus:outline-none focus:border-[rgba(176,155,113,0.50)] transition-colors"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-semibold text-sm hover:bg-[#C4A96E] transition-colors disabled:opacity-50 flex items-center gap-2 justify-center shrink-0"
        >
          {status === 'loading' ? 'Saving…' : 'Notify Me'}
          {status !== 'loading' && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
      {errorMsg && <p className="mt-3 text-sm text-[#9B5A5A]">{errorMsg}</p>}
    </div>
  );
}
