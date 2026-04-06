'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/context/AuthContext';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';
import { Send, RefreshCw, XCircle, Clock, CheckCircle, AlertCircle, Plus, Mail } from 'lucide-react';

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  community_id: string;
};

type Community = { id: string; name: string };

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  pending: { bg: 'bg-[rgba(176,155,113,0.08)]', text: 'text-[#B09B71]', icon: Clock },
  accepted: { bg: 'bg-[rgba(42,93,79,0.08)]', text: 'text-[#2A5D4F]', icon: CheckCircle },
  expired: { bg: 'bg-[rgba(107,58,58,0.08)]', text: 'text-[#8B5A5A]', icon: AlertCircle },
  revoked: { bg: 'bg-[rgba(245,240,232,0.04)]', text: 'text-[var(--text-disabled)]', icon: XCircle },
};

export default function ManageInvitesPage() {
  const { user } = useSupabaseAuth();
  const [supabase] = useState(() => createSupabaseBrowser());

  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchInvitations = useCallback(async () => {
    if (!selectedCommunity) return;
    setLoading(true);
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('community_id', selectedCommunity)
      .order('created_at', { ascending: false });
    setInvitations((data as Invitation[]) || []);
    setLoading(false);
  }, [selectedCommunity, supabase]);

  // Load communities
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('community_members')
        .select('community_id, communities(id, name)')
        .eq('profile_id', user.id)
        .eq('role', 'admin');
      if (data) {
        const comms = data
          .map((d: Record<string, unknown>) => d.communities as Community | null)
          .filter(Boolean) as Community[];
        setCommunities(comms);
        if (comms.length === 1) setSelectedCommunity(comms[0].id);
      }
    })();
  }, [user, supabase]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleResend = async (inv: Invitation) => {
    setActionLoading(inv.id);
    // Reset expiry by updating the invitation
    await supabase
      .from('invitations')
      .update({
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', inv.id);
    await fetchInvitations();
    setActionLoading(null);
  };

  const handleRevoke = async (inv: Invitation) => {
    setActionLoading(inv.id);
    await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', inv.id);
    await fetchInvitations();
    setActionLoading(null);
  };

  const filtered = invitations.filter((inv) => filter === 'all' || inv.status === filter);

  const counts = {
    all: invitations.length,
    pending: invitations.filter((i) => i.status === 'pending').length,
    accepted: invitations.filter((i) => i.status === 'accepted').length,
    expired: invitations.filter((i) => i.status === 'expired').length,
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-[var(--text-disabled)] font-medium uppercase tracking-widest mb-2">Community</p>
          <h1 className="text-3xl font-serif font-medium gradient-text">Manage Invitations</h1>
        </div>
        <Link
          href="/invite"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4B08A] transition-colors"
        >
          <Plus className="w-4 h-4" /> Invite
        </Link>
      </div>

      {/* Community selector */}
      {communities.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] text-sm"
          >
            <option value="">Select community...</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['all', 'pending', 'accepted', 'expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.35)] text-[var(--parchment)]'
                : 'border border-[var(--divider)] text-[var(--text-muted)] hover:border-[rgba(245,240,232,0.12)]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-[var(--text-disabled)]">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Invitations list */}
      {loading ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <RefreshCw className="w-6 h-6 text-[var(--text-disabled)] mx-auto mb-3 animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Loading invitations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Mail className="w-10 h-10 text-[var(--text-disabled)] mx-auto mb-4" />
          <p className="text-[var(--text-muted)] mb-2">No invitations found.</p>
          <Link
            href="/invite"
            className="text-sm text-[#B09B71] hover:text-[#D4C4A0] transition-colors"
          >
            Send your first invite
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv) => {
            const style = STATUS_STYLES[inv.status] || STATUS_STYLES.pending;
            const StatusIcon = style.icon;
            const isExpired = new Date(inv.expires_at) < new Date() && inv.status === 'pending';

            return (
              <div
                key={inv.id}
                className="glass-card rounded-xl p-4 flex items-center gap-4"
              >
                <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                  <StatusIcon className={`w-4 h-4 ${style.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-body)] truncate">{inv.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-disabled)] capitalize">{inv.role}</span>
                    <span className="text-[var(--text-disabled)]">&middot;</span>
                    <span className="text-xs text-[var(--text-disabled)]">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </span>
                    {isExpired && (
                      <span className="text-xs text-[#8B5A5A] font-medium">Expired</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {(inv.status === 'pending' || isExpired) && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleResend(inv)}
                      disabled={actionLoading === inv.id}
                      className="p-2 rounded-lg border border-[var(--divider)] text-[var(--text-muted)] hover:border-[rgba(176,155,113,0.30)] hover:text-[#B09B71] transition-all"
                      title="Resend"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRevoke(inv)}
                      disabled={actionLoading === inv.id}
                      className="p-2 rounded-lg border border-[var(--divider)] text-[var(--text-muted)] hover:border-[rgba(107,58,58,0.30)] hover:text-[#8B5A5A] transition-all"
                      title="Revoke"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
