'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/AuthContext';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type InviteInfo = {
  id: string;
  community_id: string;
  community_name: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
};

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { user, loading: authLoading } = useSupabaseAuth();
  const [supabase] = useState(() => createSupabaseBrowser());

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'accepting' | 'accepted' | 'error'>('loading');
  const [error, setError] = useState('');

  // Fetch invite info
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No invitation token provided.');
      return;
    }

    (async () => {
      const { data, error: fetchError } = await supabase.rpc('get_invitation_by_token', {
        invite_token: token,
      });

      if (fetchError || !data || data.length === 0) {
        setStatus('error');
        setError('Invitation not found or has expired.');
        return;
      }

      const inv = data[0] as InviteInfo;

      if (inv.status !== 'pending') {
        setStatus('error');
        setError(`This invitation has already been ${inv.status}.`);
        return;
      }

      if (new Date(inv.expires_at) < new Date()) {
        setStatus('error');
        setError('This invitation has expired.');
        return;
      }

      setInvite(inv);
      setStatus('ready');
    })();
  }, [token, supabase]);

  const handleAccept = async () => {
    if (!token) return;
    setStatus('accepting');

    const { data, error: acceptError } = await supabase.rpc('accept_invitation', {
      invite_token: token,
    });

    if (acceptError) {
      setStatus('error');
      setError(acceptError.message);
      return;
    }

    const result = data as { error?: string; success?: boolean };
    if (result.error) {
      setStatus('error');
      setError(result.error);
      return;
    }

    setStatus('accepted');
    setTimeout(() => router.push('/dashboard'), 2000);
  };

  // Not logged in — redirect to signup with token
  if (!authLoading && !user && token && status !== 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.25)] flex items-center justify-center mx-auto mb-6">
            <Users className="w-7 h-7 text-[#B09B71]" />
          </div>
          <h1 className="text-2xl font-serif font-medium text-[var(--parchment)] mb-3">
            You&apos;ve Been Invited
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Create an account or sign in to accept this invitation.
          </p>
          <div className="space-y-3">
            <Link
              href={`/signup?token=${token}${invite?.email ? `&email=${encodeURIComponent(invite.email)}` : ''}`}
              className="block w-full py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4A96E] transition-colors text-center"
            >
              Create Account
            </Link>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`}
              className="block w-full py-3 rounded-lg border border-[var(--divider)] text-[var(--text-muted)] text-sm hover:border-[rgba(176,155,113,0.30)] transition-colors text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-[#B09B71] mx-auto mb-4 animate-spin" />
            <p className="text-[var(--text-muted)]">Loading invitation...</p>
          </>
        )}

        {status === 'ready' && invite && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[rgba(42,93,79,0.12)] border border-[rgba(42,93,79,0.25)] flex items-center justify-center mx-auto mb-6">
              <Users className="w-7 h-7 text-[#2A5D4F]" />
            </div>
            <h1 className="text-2xl font-serif font-medium text-[var(--parchment)] mb-3">
              Join {invite.community_name}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mb-2">
              You&apos;ve been invited as a <span className="text-[var(--text-body)] font-medium">{invite.role}</span>.
            </p>
            <p className="text-xs text-[var(--text-disabled)] mb-8">
              Invitation sent to {invite.email}
            </p>
            <button
              onClick={handleAccept}
              className="w-full py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4A96E] transition-colors"
            >
              Accept Invitation
            </button>
          </>
        )}

        {status === 'accepting' && (
          <>
            <Loader2 className="w-10 h-10 text-[#B09B71] mx-auto mb-4 animate-spin" />
            <p className="text-[var(--text-muted)]">Joining community...</p>
          </>
        )}

        {status === 'accepted' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[rgba(42,93,79,0.12)] border border-[rgba(42,93,79,0.25)] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-7 h-7 text-[#2A5D4F]" />
            </div>
            <h1 className="text-2xl font-serif font-medium text-[var(--parchment)] mb-3">Welcome!</h1>
            <p className="text-sm text-[var(--text-muted)]">
              You&apos;ve joined {invite?.community_name}. Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[rgba(107,58,58,0.12)] border border-[rgba(107,58,58,0.25)] flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-7 h-7 text-[#8B5A5A]" />
            </div>
            <h1 className="text-2xl font-serif font-medium text-[var(--parchment)] mb-3">Invitation Error</h1>
            <p className="text-sm text-[#D4A0A0] mb-6">{error}</p>
            <Link
              href="/"
              className="text-sm text-[#B09B71] hover:text-[#D4C4A0] transition-colors"
            >
              Return Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
