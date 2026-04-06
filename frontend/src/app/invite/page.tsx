'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/context/AuthContext';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';
import { Send, Upload, Mail, Users, ChevronRight, CheckCircle, AlertCircle, Settings } from 'lucide-react';

type Community = { id: string; name: string };

export default function InvitePage() {
  const { user } = useSupabaseAuth();
  const [supabase] = useState(() => createSupabaseBrowser());

  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // Single invite
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  // Bulk invite
  const [csvEmails, setCsvEmails] = useState('');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ email: string; success: boolean; error?: string }[]>([]);

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

  const sendInvite = async (inviteEmail: string, inviteRole: string) => {
    const { error } = await supabase.from('invitations').insert({
      community_id: selectedCommunity,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      invited_by: user!.id,
    });
    return error;
  };

  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);

    const error = await sendInvite(email, role);
    setResults([{ email, success: !error, error: error?.message }]);
    if (!error) setEmail('');
    setLoading(false);
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);

    const emails = csvEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes('@'));

    const batchResults: typeof results = [];
    for (const inviteEmail of emails) {
      const error = await sendInvite(inviteEmail, 'member');
      batchResults.push({ email: inviteEmail, success: !error, error: error?.message });
    }

    setResults(batchResults);
    if (batchResults.every((r) => r.success)) setCsvEmails('');
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 page-enter">
      <div className="mb-8">
        <p className="text-sm text-[var(--text-disabled)] font-medium uppercase tracking-widest mb-2">Community</p>
        <h1 className="text-3xl font-serif font-medium gradient-text mb-2">Invite Members</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Send invitations to residents, board members, or property managers.
        </p>
      </div>

      {/* Community selector */}
      {communities.length > 1 && (
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">Community</label>
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

      {communities.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center">
          <Users className="w-10 h-10 text-[var(--text-disabled)] mx-auto mb-4" />
          <p className="text-[var(--text-muted)] mb-4">You need to create a community first.</p>
          <Link
            href="/create-community"
            className="inline-flex items-center gap-2 text-sm text-[#B09B71] hover:text-[#D4C4A0] transition-colors"
          >
            Create Community <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {selectedCommunity && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('single')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                mode === 'single'
                  ? 'bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.35)] text-[var(--parchment)]'
                  : 'border border-[var(--divider)] text-[var(--text-muted)] hover:border-[rgba(245,240,232,0.12)]'
              }`}
            >
              <Mail className="w-4 h-4" /> Single Invite
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                mode === 'bulk'
                  ? 'bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.35)] text-[var(--parchment)]'
                  : 'border border-[var(--divider)] text-[var(--text-muted)] hover:border-[rgba(245,240,232,0.12)]'
              }`}
            >
              <Upload className="w-4 h-4" /> Bulk CSV
            </button>
          </div>

          {/* Single invite form */}
          {mode === 'single' && (
            <form onSubmit={handleSingleInvite} className="glass-card rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="resident@example.com"
                  className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] text-sm"
                >
                  <option value="member">Resident</option>
                  <option value="manager">Property Manager</option>
                  <option value="admin">Board Member</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4B08A] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : <><Send className="w-4 h-4" /> Send Invitation</>}
              </button>
            </form>
          )}

          {/* Bulk invite form */}
          {mode === 'bulk' && (
            <form onSubmit={handleBulkInvite} className="glass-card rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--text-disabled)] mb-2">
                  Email Addresses (one per line, or comma-separated)
                </label>
                <textarea
                  value={csvEmails}
                  onChange={(e) => setCsvEmails(e.target.value)}
                  required
                  rows={6}
                  placeholder={"jane@example.com\njohn@example.com\nresident@example.com"}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-body)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[rgba(176,155,113,0.40)] text-sm font-mono resize-none"
                />
              </div>
              <p className="text-xs text-[var(--text-disabled)]">
                All bulk invites will be sent as Resident role. Change roles in{' '}
                <Link href="/invite/manage" className="text-[#B09B71]">Manage Invites</Link>.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4B08A] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : <><Upload className="w-4 h-4" /> Send All Invitations</>}
              </button>
            </form>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-6 space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                    r.success
                      ? 'bg-[rgba(42,93,79,0.08)] border border-[rgba(42,93,79,0.20)]'
                      : 'bg-[rgba(107,58,58,0.08)] border border-[rgba(107,58,58,0.20)]'
                  }`}
                >
                  {r.success ? (
                    <CheckCircle className="w-4 h-4 text-[#2A5D4F] shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#8B5A5A] shrink-0" />
                  )}
                  <span className="text-[var(--text-body)]">{r.email}</span>
                  {r.error && <span className="text-[var(--text-muted)] ml-auto">{r.error}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Quick link to manage */}
          <div className="mt-6 text-center">
            <Link
              href="/invite/manage"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[#B09B71] transition-colors"
            >
              <Settings className="w-4 h-4" /> Manage Invitations
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
