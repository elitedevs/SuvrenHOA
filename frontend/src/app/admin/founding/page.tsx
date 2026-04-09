'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  CheckCircle2, XCircle, Clock, Users, ChevronDown,
  RefreshCw, Filter, Mail,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AppStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted';

interface FoundingApplication {
  id: string;
  community_name: string;
  property_count: number;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  role: string;
  pain_points: string[];
  referral_source?: string;
  additional_notes?: string;
  status: AppStatus;
  created_at: string;
  reviewed_at?: string;
}

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', icon: Clock },
  approved: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', icon: XCircle },
  waitlisted: { label: 'Waitlisted', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30', icon: Clock },
};

export default function AdminFoundingPage() {
  const [applications, setApplications] = useState<FoundingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppStatus | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from('founding_applications')
      .select('*')
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (!error && data) setApplications(data as FoundingApplication[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  async function updateStatus(id: string, status: AppStatus) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/founding/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setApplications(prev =>
          prev.map(a => a.id === id ? { ...a, status } : a)
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    waitlisted: applications.filter(a => a.status === 'waitlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-[#E8E4DC]">Founding Applications</h1>
          <p className="text-sm text-[#8A8070] mt-1">{counts.all} total · {counts.pending} pending review</p>
        </div>
        <button
          onClick={loadApplications}
          className="flex items-center gap-2 px-4 py-2 border border-[#2A2A2E] rounded-lg text-[#8A8070] hover:text-[#C4BAA8] hover:border-[#3A3A3E] transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['pending', 'approved', 'waitlisted', 'rejected'] as const).map(s => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <div key={s} className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${cfg.color}`} />
                <span className="text-xs text-[#8A8070] capitalize">{s}</span>
              </div>
              <p className="text-2xl font-bold text-[#E8E4DC]">{counts[s]}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-[#141416] border border-[#2A2A2E] rounded-lg p-1 w-fit">
        <Filter className="w-3.5 h-3.5 text-[#4A4A52] ml-2" />
        {(['all', 'pending', 'approved', 'waitlisted', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm capitalize transition-all ${
              filter === f
                ? 'bg-[#B09B71] text-[#0C0C0E] font-semibold'
                : 'text-[#8A8070] hover:text-[#C4BAA8]'
            }`}
          >
            {f} {f !== 'all' && <span className="ml-1 opacity-60">({counts[f as keyof typeof counts]})</span>}
          </button>
        ))}
      </div>

      {/* Application list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[rgba(176,155,113,0.3)] border-t-[#B09B71] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#4A4A52]">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No applications {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const cfg = STATUS_CONFIG[app.status];
            const StatusIcon = cfg.icon;
            const isExpanded = expanded === app.id;

            return (
              <div key={app.id} className="bg-[#141416] border border-[#2A2A2E] rounded-xl overflow-hidden">
                {/* Summary row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : app.id)}
                    className="flex-1 flex items-center gap-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#E8E4DC] truncate">{app.community_name}</p>
                      <p className="text-sm text-[#8A8070] truncate">{app.contact_name} · {app.contact_email}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-sm text-[#8A8070] flex-shrink-0">
                      <span>{app.property_count} units</span>
                      <span>·</span>
                      <span>{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#4A4A52] flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-[#2A2A2E] px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-[#4A4A52] mb-0.5">Role</p>
                        <p className="text-[#C4BAA8] capitalize">{app.role.replace('_', ' ')}</p>
                      </div>
                      {app.contact_phone && (
                        <div>
                          <p className="text-[#4A4A52] mb-0.5">Phone</p>
                          <p className="text-[#C4BAA8]">{app.contact_phone}</p>
                        </div>
                      )}
                      {app.referral_source && (
                        <div>
                          <p className="text-[#4A4A52] mb-0.5">Referral</p>
                          <p className="text-[#C4BAA8]">{app.referral_source}</p>
                        </div>
                      )}
                    </div>

                    {app.pain_points.length > 0 && (
                      <div>
                        <p className="text-[#4A4A52] text-xs mb-2">Pain Points</p>
                        <div className="flex flex-wrap gap-1.5">
                          {app.pain_points.map(p => (
                            <span key={p} className="text-xs px-2.5 py-1 bg-[#1E1E22] border border-[#2A2A2E] rounded-full text-[#8A8070]">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {app.additional_notes && (
                      <div>
                        <p className="text-[#4A4A52] text-xs mb-1">Notes</p>
                        <p className="text-sm text-[#C4BAA8] leading-relaxed">{app.additional_notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {app.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => updateStatus(app.id, 'approved')}
                          disabled={updating === app.id}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'waitlisted')}
                          disabled={updating === app.id}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                        >
                          <Clock className="w-4 h-4" />
                          Waitlist
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'rejected')}
                          disabled={updating === app.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <a
                          href={`mailto:${app.contact_email}`}
                          className="ml-auto flex items-center gap-2 px-3 py-2 border border-[#2A2A2E] text-[#8A8070] rounded-lg text-sm hover:text-[#C4BAA8] hover:border-[#3A3A3E] transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </a>
                      </div>
                    )}

                    {app.status !== 'pending' && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => updateStatus(app.id, 'pending')}
                          disabled={updating === app.id}
                          className="flex items-center gap-2 px-3 py-1.5 border border-[#2A2A2E] text-[#8A8070] rounded-lg text-xs hover:text-[#C4BAA8] hover:border-[#3A3A3E] transition-colors"
                        >
                          <Clock className="w-3 h-3" />
                          Reset to Pending
                        </button>
                      </div>
                    )}

                    {updating === app.id && (
                      <div className="flex items-center gap-2 text-sm text-[#8A8070]">
                        <div className="w-4 h-4 border-2 border-[rgba(176,155,113,0.3)] border-t-[#B09B71] rounded-full animate-spin" />
                        Updating…
                      </div>
                    )}
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
