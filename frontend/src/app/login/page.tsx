'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/AuthContext';
import { LogIn, Lock, Mail, Fingerprint, CheckCircle2 } from 'lucide-react';
import {
  isPasskeySupported,
  authenticateWithPasskey,
  registerPasskey,
  userHasPasskeys,
} from '@/lib/passkey-auth';

type PasskeyStatus = 'unknown' | 'checking' | 'has-passkeys' | 'no-passkeys';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const authError = searchParams.get('error');
  const { signIn, signInWithOAuth, resetPassword } = useSupabaseAuth();

  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(authError === 'auth_callback_failed' ? 'Authentication failed. Please try again.' : '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Passkey state
  const passkeyEnabled = typeof window !== 'undefined' && isPasskeySupported();
  const [passkeyStatus, setPasskeyStatus] = useState<PasskeyStatus>('unknown');

  // Check if email has existing passkeys (debounced)
  const checkEmail = useCallback(async (emailValue: string) => {
    if (!emailValue || !emailValue.includes('@') || !emailValue.includes('.')) {
      setPasskeyStatus('unknown');
      return;
    }
    setPasskeyStatus('checking');
    try {
      const hasKeys = await userHasPasskeys(emailValue);
      setPasskeyStatus(hasKeys ? 'has-passkeys' : 'no-passkeys');
    } catch {
      setPasskeyStatus('unknown');
    }
  }, []);

  useEffect(() => {
    if (!passkeyEnabled) return;
    const timer = setTimeout(() => {
      if (email) checkEmail(email);
      else setPasskeyStatus('unknown');
    }, 600);
    return () => clearTimeout(timer);
  }, [email, checkEmail, passkeyEnabled]);

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('');
    setLoading(true);
    const { error: oauthError } = await signInWithOAuth(provider);
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
    // If no error, the browser redirects to the OAuth provider
  };

  const handlePasskeySignIn = async () => {
    setError('');
    setLoading(true);
    const result = await authenticateWithPasskey(email || undefined);
    setLoading(false);
    if (result.success) {
      router.push(redirect);
    } else {
      setError(result.error || 'Passkey authentication failed');
    }
  };

  const handlePasskeyRegister = async () => {
    if (!email) return;
    setError('');
    setLoading(true);
    const result = await registerPasskey(email);
    setLoading(false);
    if (result.success) {
      setMessage('Passkey registered. You can now sign in with your passkey.');
      setPasskeyStatus('has-passkeys');
    } else {
      setError(result.error || 'Passkey registration failed');
    }
  };

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
          <h1
            className="font-serif mb-2 text-[var(--parchment)]"
            style={{
              fontSize: '3rem',
              fontWeight: 400,
              letterSpacing: '-0.015em',
              lineHeight: 1.15,
            }}
          >
            Welcome Back
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Sign in to your community</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[rgba(107,58,58,0.12)] border border-[rgba(107,58,58,0.25)] text-sm text-[#D4A0A0]">
            {error}
          </div>
        )}

        {/* Success message */}
        {message && (
          <div className="mb-6 p-3 rounded-lg bg-[rgba(42,93,79,0.12)] border border-[rgba(42,93,79,0.25)] text-sm text-[#F5F0E8]">
            {message}
          </div>
        )}

        {!message && (
          <div className="space-y-4">
            {/* ── OAuth Buttons ── */}
            <button
              onClick={() => handleOAuth('google')}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[rgba(255,255,255,0.95)] text-[#1a1a1a] font-medium text-sm hover:bg-white disabled:opacity-50 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuth('github')}
              disabled={loading}
              className="w-full py-3 rounded-lg border border-[var(--divider)] text-[var(--text-body)] font-medium text-sm hover:border-[rgba(176,155,113,0.30)] hover:text-[var(--parchment)] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Continue with GitHub
            </button>

            {/* ── Passkey ── */}
            {passkeyEnabled && (
              <>
                <div className="relative my-2 flex items-center gap-3">
                  <div className="flex-1 border-t border-[rgba(176,155,113,0.12)]" />
                  <span className="text-xs text-[var(--text-disabled)] uppercase tracking-widest">or</span>
                  <div className="flex-1 border-t border-[rgba(176,155,113,0.12)]" />
                </div>

                {/* Email for passkey detection */}
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email webauthn"
                      placeholder="Email (optional for passkey)"
                      className="w-full pl-10 pr-10 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
                    />
                    {passkeyStatus === 'checking' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--text-disabled)] border-t-transparent rounded-full animate-spin" />
                    )}
                    {passkeyStatus === 'has-passkeys' && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B09B71]" />
                    )}
                  </div>
                  {passkeyStatus === 'has-passkeys' && (
                    <p className="text-xs text-[#B09B71] mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Passkey found for this email
                    </p>
                  )}
                  {passkeyStatus === 'no-passkeys' && email && (
                    <p className="text-xs text-[var(--text-disabled)] mt-1.5">
                      No passkey yet &mdash; click &ldquo;Create Passkey&rdquo; below to register one
                    </p>
                  )}
                </div>

                {/* Sign in with Passkey */}
                <button
                  onClick={handlePasskeySignIn}
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4A96E] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-4 h-4" />
                  Sign in with Passkey
                </button>

                {/* Create Passkey */}
                {passkeyStatus === 'no-passkeys' && email && (
                  <button
                    onClick={handlePasskeyRegister}
                    disabled={loading || !email}
                    className="w-full py-2.5 rounded-lg border border-[rgba(176,155,113,0.25)] text-sm text-[#B09B71] hover:border-[rgba(176,155,113,0.50)] hover:bg-[rgba(176,155,113,0.05)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Fingerprint className="w-4 h-4" />
                    Create Passkey
                  </button>
                )}

                <p className="text-xs text-center text-[var(--text-disabled)]">
                  Uses your device biometrics (Face ID, Touch ID, Windows Hello)
                </p>
              </>
            )}

            {/* ── Existing email/password toggle ── */}
            <div className="pt-2">
              {!showEmailLogin && !showForgotPassword && (
                <button
                  onClick={() => { setShowEmailLogin(true); setError(''); }}
                  className="w-full py-2.5 rounded-lg border border-[var(--divider)] text-sm text-[var(--text-muted)] hover:border-[rgba(176,155,113,0.30)] hover:text-[var(--text-body)] transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Sign in with Password
                </button>
              )}

              {showEmailLogin && !showForgotPassword && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="relative flex items-center gap-3 mb-2">
                    <div className="flex-1 border-t border-[rgba(176,155,113,0.12)]" />
                    <span className="text-xs text-[var(--text-disabled)] uppercase tracking-widest">email sign-in</span>
                    <div className="flex-1 border-t border-[rgba(176,155,113,0.12)]" />
                  </div>

                  {!passkeyEnabled && (
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
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs uppercase tracking-widest text-[var(--text-disabled)]">Password</label>
                      <button
                        type="button"
                        onClick={() => { setShowForgotPassword(true); setError(''); }}
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4A96E] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? 'Please wait...' : (<><LogIn className="w-4 h-4" /> Sign In</>)}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowEmailLogin(false); setError(''); }}
                    className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors"
                  >
                    Back to other sign-in options
                  </button>
                </form>
              )}

              {showForgotPassword && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="relative flex items-center gap-3 mb-2">
                    <div className="flex-1 border-t border-[rgba(176,155,113,0.12)]" />
                    <span className="text-xs text-[var(--text-disabled)] uppercase tracking-widest">reset password</span>
                    <div className="flex-1 border-t border-[rgba(176,155,113,0.12)]" />
                  </div>

                  {!passkeyEnabled && (
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
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4A96E] disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Please wait...' : 'Send Reset Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setShowEmailLogin(true); setError(''); }}
                    className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors"
                  >
                    Back to sign in
                  </button>
                </form>
              )}
            </div>

            {/* Reserve Your Seat */}
            <div className="text-center pt-2">
              <p className="text-sm text-[var(--text-muted)]">
                Don&apos;t have an invitation?{' '}
                <Link href="/waitlist" className="text-[#B09B71] hover:text-[#D4C4A0] transition-colors">
                  Reserve Your Seat
                </Link>
              </p>
            </div>
          </div>
        )}

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
