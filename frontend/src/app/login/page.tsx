'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/AuthContext';
import { LogIn, Mail, Lock, Sparkles, ChevronRight } from 'lucide-react';

type Mode = 'password' | 'magic-link' | 'forgot-password';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { signIn, signInWithMagicLink, resetPassword } = useSupabaseAuth();

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    } else {
      router.push(redirect);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: magicError } = await signInWithMagicLink(email);
    setLoading(false);

    if (magicError) {
      setError(magicError.message);
    } else {
      setMessage('Check your email for a magic sign-in link.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await resetPassword(email);
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage('Password reset link sent to your email.');
    }
  };

  const handleSubmit =
    mode === 'password'
      ? handlePasswordLogin
      : mode === 'magic-link'
        ? handleMagicLink
        : handleForgotPassword;

  const title =
    mode === 'password'
      ? 'Welcome Back'
      : mode === 'magic-link'
        ? 'Magic Link'
        : 'Reset Password';

  const subtitle =
    mode === 'password'
      ? 'Sign in to your community'
      : mode === 'magic-link'
        ? 'We\'ll email you a one-click sign-in link'
        : 'Enter your email to reset your password';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative glass-card rounded-2xl p-10 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img src="/logo-full.svg" alt="SuvrenHOA" className="h-10 w-auto mx-auto" />
          </Link>
          {/* V12 fix (Lux V11 audit): 32px still below the 36px luxury
              threshold. Raised to 48px (3rem) Playfair 400 to match the
              /launch and /founding hero scale. */}
          <h1
            className="font-serif mb-2 text-[var(--parchment)]"
            style={{
              fontSize: '3rem',
              fontWeight: 400,
              letterSpacing: '-0.015em',
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[rgba(107,58,58,0.12)] border border-[rgba(107,58,58,0.25)] text-sm text-[#D4A0A0]">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 rounded-lg bg-[rgba(42,93,79,0.12)] border border-[rgba(42,93,79,0.25)] text-sm text-[#7FBFAB]">
            {message}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
                />
              </div>
            </div>

            {/* Password — only for password mode */}
            {mode === 'password' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-widest text-[var(--text-disabled)]">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot-password'); setError(''); }}
                    className="text-xs text-[#B09B71] hover:text-[#D4C4A0] transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Your password"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4A96E] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                'Please wait...'
              ) : mode === 'password' ? (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              ) : mode === 'magic-link' ? (
                <>
                  <Sparkles className="w-4 h-4" /> Send Magic Link
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}

        {/* Mode switchers */}
        <div className="mt-6 space-y-3">
          {mode === 'password' && (
            <button
              onClick={() => { setMode('magic-link'); setError(''); setMessage(''); }}
              className="w-full py-2.5 rounded-lg border border-[var(--divider)] text-sm text-[var(--text-muted)] hover:border-[rgba(176,155,113,0.30)] hover:text-[var(--text-body)] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Sign in with Magic Link
            </button>
          )}

          {mode !== 'password' && (
            <button
              onClick={() => { setMode('password'); setError(''); setMessage(''); }}
              className="w-full py-2.5 rounded-lg border border-[var(--divider)] text-sm text-[var(--text-muted)] hover:border-[rgba(176,155,113,0.30)] hover:text-[var(--text-body)] transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Sign in with Password
            </button>
          )}

          <div className="text-center pt-2">
            <p className="text-sm text-[var(--text-muted)]">
              Don&apos;t have an invitation?{' '}
              <Link href="/waitlist" className="text-[#B09B71] hover:text-[#D4C4A0] transition-colors">
                Reserve Your Seat
              </Link>
            </p>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-10 pt-8 border-t border-[rgba(176,155,113,0.12)] space-y-2 text-center">
          <p className="font-serif italic text-[rgba(245,240,232,0.55)] text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
            End-to-end encrypted. Zero-knowledge. SOC 2 Type II in progress.
          </p>
          <p className="font-serif italic text-[rgba(245,240,232,0.40)] text-xs" style={{ fontFamily: 'var(--font-heading)' }}>
            We never sell your data. We never train on your data.
          </p>
          <p className="font-serif italic text-[rgba(245,240,232,0.40)] text-xs" style={{ fontFamily: 'var(--font-heading)' }}>
            Your HOA&apos;s records belong to your HOA.
          </p>
        </div>
      </div>
    </div>
  );
}
