'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/AuthContext';
import { UserPlus, Mail, Lock, User, ChevronRight, Building2, Shield, Users } from 'lucide-react';

const ROLES = [
  { value: 'board_member', label: 'Board Member', desc: 'Create & manage your HOA', icon: Shield },
  { value: 'property_manager', label: 'Property Manager', desc: 'Manage multiple communities', icon: Building2 },
  { value: 'resident', label: 'Resident', desc: 'Join your community', icon: Users },
] as const;

type Role = typeof ROLES[number]['value'];

// Map an invitation.role (per-community role from the invitations table)
// to the closest profiles.role (system-wide user type). We keep this
// conservative: an invited admin gets 'board_member' privileges so their
// dashboard surfaces the right features the moment they log in.
function inviteRoleToProfileRole(inviteRole: string | undefined): Role {
  switch ((inviteRole ?? '').toLowerCase()) {
    case 'admin':
      return 'board_member';
    case 'manager':
      return 'property_manager';
    case 'member':
    default:
      return 'resident';
  }
}

export interface SignupPageClientProps {
  /**
   * Set when the visitor arrived via a validated invitation token.
   * The token is passed through to the signUp metadata so the backend
   * trigger (or the downstream /invite/accept call) can consume it.
   */
  inviteToken?: string;
  /**
   * Email locked by the gate. When provided, the email input is shown
   * as read-only and cannot be changed — the gate has already confirmed
   * the user is allowed to sign up *as this address*.
   */
  lockedEmail?: string;
  /**
   * Invitation-only: the invite's per-community role (admin/manager/member).
   * Used to derive a sensible profiles.role default; the real community
   * role is applied when the invitation is accepted post-confirmation.
   */
  lockedRole?: string;
  /** Founding-program-only: contact_name from the founding application. */
  prefillName?: string;
  /** The community the visitor was invited into (or is founding). Shown in the header. */
  communityName?: string;
  /** Set when the visitor arrived via ?founding=true with an approved application. */
  foundingFlow?: boolean;
}

export default function SignupPageClient({
  inviteToken,
  lockedEmail,
  lockedRole,
  prefillName,
  communityName,
  foundingFlow,
}: SignupPageClientProps = {}) {
  const { signUp } = useSupabaseAuth();

  // A locked email means the gate has committed us to an identity; the
  // role is derived from the invitation (default 'resident'). For the
  // founding-flow path we default to 'board_member' because a founding
  // approval means the person is standing up a new community.
  const defaultRole: Role = inviteToken
    ? inviteRoleToProfileRole(lockedRole)
    : foundingFlow
      ? 'board_member'
      : 'board_member';

  const [email, setEmail] = useState(lockedEmail ?? '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(prefillName ?? '');
  const [role, setRole] = useState<Role>(defaultRole);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Invitation flows fix the role — the picker stays hidden.
  const hideRolePicker = !!inviteToken || !!foundingFlow;
  const lockEmail = !!lockedEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    // We always forward the invite_token (if any) into raw_user_meta_data.
    // The /invite/accept flow reads it to consume the invitation after
    // email confirmation, and the handle_new_user trigger sees it too.
    const { error: signUpError } = await signUp(email, password, {
      full_name: fullName,
      role,
      invite_token: inviteToken ?? null,
      founding_flow: foundingFlow ? true : undefined,
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
          {/* V11 fix: bumped to 32px to match the rest of the serif scale */}
          <h1
            className="font-serif mb-3 text-[var(--parchment)]"
            style={{
              fontSize: '2rem',
              fontWeight: 400,
              letterSpacing: '-0.015em',
              lineHeight: 1.15,
            }}
          >
            Check Your Email
          </h1>
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
          {/* V11 fix: bumped to 32px to match the rest of the serif scale */}
          <h1
            className="font-serif mb-2 text-[var(--parchment)]"
            style={{
              fontSize: '2rem',
              fontWeight: 400,
              letterSpacing: '-0.015em',
              lineHeight: 1.15,
            }}
          >
            Create Your Account
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {inviteToken
              ? communityName
                ? `You've been invited to ${communityName}`
                : "You've been invited to join a community"
              : foundingFlow
                ? communityName
                  ? `Welcome, founding community: ${communityName}`
                  : 'Welcome to the Founding Community Program'
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
            <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">
              Email
              {lockEmail && (
                <span className="ml-2 normal-case tracking-normal text-[10px] text-[rgba(176,155,113,0.75)]">
                  locked by invitation
                </span>
              )}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                readOnly={lockEmail}
                aria-readonly={lockEmail}
                className={`w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] transition-colors text-sm ${
                  lockEmail ? 'opacity-80 cursor-not-allowed' : ''
                }`}
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

          {/* Role Selector — hidden when invitation or founding flow fixes the role */}
          {!hideRolePicker && (
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
