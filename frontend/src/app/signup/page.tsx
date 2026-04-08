'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/AuthContext';
import { UserPlus, Mail, Lock, User, ChevronRight, Building2, Shield, Users } from 'lucide-react';

const ROLES = [
  { value: 'board_member', label: 'Board Member', desc: 'Create & manage your HOA', icon: Shield },
  { value: 'property_manager', label: 'Property Manager', desc: 'Manage multiple communities', icon: Building2 },
  { value: 'resident', label: 'Resident', desc: 'Join your community', icon: Users },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token');
  const inviteEmail = searchParams.get('email');
  const { signUp } = useSupabaseAuth();

  const [email, setEmail] = useState(inviteEmail || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>(inviteToken ? 'resident' : 'board_member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(email, password, {
      full_name: fullName,
      role,
      invite_token: inviteToken,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(42,93,79,0.12)] border border-[rgba(42,93,79,0.25)] flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-[#2A5D4F]" />
          </div>
          <h1 className="text-2xl font-serif font-medium text-[var(--parchment)] mb-3">Check Your Email</h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
            We sent a verification link to <span className="text-[var(--text-body)]">{email}</span>.
            Click the link to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#B09B71] hover:text-[#D4C4A0] transition-colors"
          >
            Go to Sign In <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative glass-card rounded-2xl p-10 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.25)] flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-7 h-7 text-[#B09B71]" />
          </div>
          <h1 className="text-2xl font-serif font-medium text-[var(--parchment)] mb-2">Create Your Account</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {inviteToken
              ? "You've been invited to join a community"
              : 'Start managing your HOA on the blockchain'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[rgba(107,58,58,0.12)] border border-[rgba(107,58,58,0.25)] text-sm text-[#D4A0A0]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
              />
            </div>
          </div>

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
                readOnly={!!inviteEmail}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm"
              />
            </div>
          </div>

          {/* Role Selector — hidden when invite has a role */}
          {!inviteToken && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-3">I Am A</label>
              <div className="grid grid-cols-1 gap-2">
                {ROLES.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-150 ${
                      role === value
                        ? 'bg-[rgba(176,155,113,0.08)] border-[rgba(176,155,113,0.35)]'
                        : 'bg-transparent border-[var(--divider)] hover:border-[rgba(245,240,232,0.12)]'
                    }`}
                  >
                    <Icon
                      className="w-5 h-5 shrink-0"
                      style={{ color: role === value ? '#B09B71' : 'rgba(245,240,232,0.25)' }}
                    />
                    <div>
                      <p className={`text-sm font-medium ${role === value ? 'text-[var(--parchment)]' : 'text-[var(--text-body)]'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-[var(--text-disabled)]">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4A96E] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#B09B71] hover:text-[#D4C4A0] transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
