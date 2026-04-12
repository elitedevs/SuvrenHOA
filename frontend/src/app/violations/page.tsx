'use client';
import { AuthWall } from '@/components/AuthWall';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProperty } from '@/hooks/useProperty';
import { ViolationHeatmap } from '@/components/ViolationHeatmap';
import { CheckCircle, AlertTriangle, Loader2, Lock } from 'lucide-react';

// ── Appeal System ─────────────────────────────────────────────────────────────
interface AppealRecord {
  id: string;
  violationId: string;
  reason: string;
  evidence: string;
  desiredResolution: string;
  submittedAt: string;
  status: 'submitted' | 'under-review' | 'approved' | 'denied';
}

const APPEALS_LS_KEY = 'suvren_violation_appeals';

function loadAppeals(): AppealRecord[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(APPEALS_LS_KEY) || '[]'); }
  catch { return []; }
}

function saveAppeals(appeals: AppealRecord[]) {
  localStorage.setItem(APPEALS_LS_KEY, JSON.stringify(appeals));
}

function AppealModal({ violation, onClose }: { violation: any; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [desiredResolution, setDesiredResolution] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [existingAppeal, setExistingAppeal] = useState<AppealRecord | null>(null);

  useEffect(() => {
    const appeals = loadAppeals();
    const existing = appeals.find(a => a.violationId === violation.id);
    if (existing) setExistingAppeal(existing);
  }, [violation.id]);

  const APPEAL_STATUS_STYLES = {
    submitted: 'text-[#B09B71] bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]',
    'under-review': 'text-[var(--steel)] bg-[rgba(90,122,154,0.10)] border-[rgba(90,122,154,0.20)]',
    approved: 'text-[#2A5D4F] bg-[rgba(42,93,79,0.10)] border-[rgba(42,93,79,0.20)]',
    denied: 'text-[#8B5A5A] bg-[rgba(107,58,58,0.10)] border-[rgba(107,58,58,0.20)]',
  };

  const handleSubmit = () => {
    if (!reason.trim() || !desiredResolution.trim()) return;
    const appeal: AppealRecord = {
      id: crypto.randomUUID(),
      violationId: violation.id,
      reason,
      evidence,
      desiredResolution,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    };
    const updated = [...loadAppeals(), appeal];
    saveAppeals(updated);
    setExistingAppeal(appeal);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl border border-[rgba(176,155,113,0.20)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium"> Appeal Violation</h2>
          <button onClick={onClose} className="text-[var(--text-disabled)] hover:text-[var(--text-body)] text-xl"></button>
        </div>

        <div className="p-3 rounded-xl bg-[rgba(26,26,30,0.40)] text-xs text-[var(--text-muted)] space-y-1">
          <p className="font-medium text-[var(--parchment)]">{violation.title}</p>
          <p className="font-mono text-[var(--text-disabled)]">{violation.violation_number}</p>
        </div>

        {existingAppeal ? (
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium ${APPEAL_STATUS_STYLES[existingAppeal.status]}`}>
              {existingAppeal.status === 'submitted' ? ' Appeal Submitted' :
               existingAppeal.status === 'under-review' ? ' Under Review' :
               existingAppeal.status === 'approved' ? ' Appeal Approved' : ' Appeal Denied'}
            </div>
            <p className="text-xs text-[var(--text-muted)]">Submitted {new Date(existingAppeal.submittedAt).toLocaleDateString()}</p>
            <div className="space-y-2 text-xs text-[var(--text-muted)]">
              <div><span className="text-[var(--text-body)] font-medium">Reason:</span> {existingAppeal.reason}</div>
              {existingAppeal.evidence && <div><span className="text-[var(--text-body)] font-medium">Evidence:</span> {existingAppeal.evidence}</div>}
              <div><span className="text-[var(--text-body)] font-medium">Desired Resolution:</span> {existingAppeal.desiredResolution}</div>
            </div>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[var(--surface-2)] text-sm font-medium hover:bg-[rgba(245,240,232,0.06)] transition-colors">Close</button>
          </div>
        ) : submitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-8 h-8 text-[#2A5D4F] mx-auto" />
            <h3 className="font-medium">Appeal Submitted</h3>
            <p className="text-sm text-[var(--text-muted)]">Your appeal has been logged. The board will review within 5 business days.</p>
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-[#B09B71] text-[var(--surface-2)] text-sm font-medium">Done</button>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">Reason for Appeal *</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Explain why you believe this violation was issued in error or should be dismissed..."
                rows={3} className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none" />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">Supporting Evidence (optional)</label>
              <textarea value={evidence} onChange={e => setEvidence(e.target.value)}
                placeholder="Describe any photos, documents, timestamps, or witness accounts that support your appeal..."
                rows={3} className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none" />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">Desired Resolution *</label>
              <textarea value={desiredResolution} onChange={e => setDesiredResolution(e.target.value)}
                placeholder="What outcome are you seeking? (e.g., dismissal of violation, removal of fine, extended cure period...)"
                rows={2} className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={!reason.trim() || !desiredResolution.trim()}
                className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all">
                Submit Appeal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const CATEGORIES = [
  { id: 'architectural', label: 'Architectural', icon: '' },
  { id: 'landscaping', label: 'Landscaping', icon: '' },
  { id: 'noise', label: 'Noise', icon: '' },
  { id: 'parking', label: 'Parking', icon: '' },
  { id: 'pet', label: 'Pet', icon: '' },
  { id: 'trash', label: 'Trash', icon: '' },
  { id: 'maintenance', label: 'Maintenance', icon: '' },
  { id: 'other', label: 'Other', icon: '' },
];

const STATUS_FLOW = {
  'reported': { color: 'yellow', label: ' Reported', next: ['under-review', 'dismissed'] },
  'under-review': { color: 'blue', label: ' Under Review', next: ['notice-issued', 'dismissed'] },
  'dismissed': { color: 'gray', label: ' Dismissed', next: [] },
  'notice-issued': { color: 'orange', label: ' Notice Issued', next: ['cure-period'] },
  'cure-period': { color: 'amber', label: '⏳ Cure Period', next: ['cured', 'disputed', 'fined'] },
  'cured': { color: 'green', label: ' Cured', next: ['resolved'] },
  'disputed': { color: 'gold', label: ' Disputed', next: ['hearing'] },
  'hearing': { color: 'gold', label: ' Hearing', next: ['ruling-upheld', 'ruling-modified', 'ruling-dismissed'] },
  'ruling-upheld': { color: 'red', label: ' Upheld', next: ['fined', 'appealed'] },
  'ruling-modified': { color: 'amber', label: ' Modified', next: ['fined', 'appealed'] },
  'ruling-dismissed': { color: 'green', label: ' Dismissed', next: ['resolved'] },
  'fined': { color: 'red', label: ' Fined', next: ['appealed', 'resolved'] },
  'appealed': { color: 'gold', label: ' Community Appeal', next: ['appeal-upheld', 'appeal-overturned'] },
  'appeal-upheld': { color: 'red', label: ' Appeal Denied', next: ['resolved'] },
  'appeal-overturned': { color: 'green', label: ' Overturned!', next: ['resolved'] },
  'resolved': { color: 'green', label: ' Resolved', next: ['closed'] },
  'closed': { color: 'gray', label: ' Closed', next: [] },
} as const;

export default function ViolationsPage() {
  const { isConnected } = useAccount();
  const [showReport, setShowReport] = useState(false);
  const [filter, setFilter] = useState('all');

  if (!isConnected) {
    return <AuthWall title="Violations" description="Track violation notices and resolution status." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">Violations</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Report issues, track status, dispute rulings, and appeal to the community
          </p>
        </div>
        <button
          onClick={() => setShowReport(!showReport)}
          className="px-5 py-2.5 rounded-xl bg-[#8B5A5A] hover:bg-[#6B3A3A] text-sm font-medium transition-all shrink-0"
        >
          {showReport ? '← Back' : ' Report Violation'}
        </button>
      </div>

      {/* Process Explainer */}
      <div className="glass-card rounded-xl hover-lift p-5 mb-6">
        <h3 className="text-xs uppercase tracking-wider text-[var(--text-disabled)] font-medium mb-3">How Violations Work</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
          {['Report', 'Review', 'Notice', 'Cure', 'Hearing', 'Ruling', 'Appeal'].map((step, i) => (
            <span key={step} className="flex items-center shrink-0">
              <span className="text-[10px] px-2 py-1 rounded bg-[rgba(26,26,30,0.50)] text-[var(--text-muted)] whitespace-nowrap">
                {i + 1}. {step}
              </span>
              {i < 6 && <span className="text-[var(--text-disabled)] mx-1">→</span>}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-[#B09B71] mt-2">
           Homeowners can appeal ANY ruling to the full community for a democratic vote
        </p>
      </div>

      {showReport ? (
        <ReportForm onClose={() => setShowReport(false)} />
      ) : (
        <>
          <div className="mb-8">
            <ViolationHeatmap />
          </div>
          <ViolationsList filter={filter} setFilter={setFilter} />
        </>
      )}
    </div>
  );
}

function ViolationsList({ filter, setFilter }: { filter: string; setFilter: (f: string) => void }) {
  const { data: violations, isLoading } = useQuery({
    queryKey: ['violations', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`/api/violations${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });

  // Status counts
  const statusGroups = [
    { key: 'active', label: 'Active', statuses: ['reported', 'under-review', 'notice-issued', 'cure-period', 'disputed', 'hearing'], color: 'text-[#B09B71]' },
    { key: 'fined', label: 'Fined/Appealed', statuses: ['fined', 'appealed', 'ruling-upheld', 'ruling-modified'], color: 'text-[#8B5A5A]' },
    { key: 'resolved', label: 'Resolved', statuses: ['cured', 'resolved', 'dismissed', 'ruling-dismissed', 'appeal-overturned', 'closed'], color: 'text-[#2A5D4F]' },
  ];

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            filter === 'all' ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]' : 'glass-card text-[var(--text-muted)]'
          }`}
        >
          All
        </button>
        {statusGroups.map(g => (
          <button
            key={g.key}
            onClick={() => setFilter(g.key)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              filter === g.key ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]' : 'glass-card text-[var(--text-muted)]'
            }`}
          >
            <span className={g.color}>{(violations || []).filter((v: any) => g.statuses.includes(v.status)).length}</span> {g.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--text-disabled)]">Loading violations...</div>
      ) : !violations || violations.length === 0 ? (
        <div className="glass-card rounded-xl hover-lift p-12 text-center">
          <CheckCircle className="w-8 h-8 text-[#2A5D4F] mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No violations</h3>
          <p className="text-sm text-[var(--text-muted)]">
            The community is in good standing. Violations will appear here when reported.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {violations.map((v: any) => (
            <ViolationCard key={v.id} violation={v} />
          ))}
        </div>
      )}
    </>
  );
}

function ViolationCard({ violation }: { violation: any }) {
  const [expanded, setExpanded] = useState(false);
  const [showAppeal, setShowAppeal] = useState(false);
  const appeals = typeof window !== 'undefined' ? loadAppeals() : [];
  const hasAppeal = appeals.some(a => a.violationId === violation.id);
  const appealRecord = appeals.find(a => a.violationId === violation.id);
  const statusInfo = STATUS_FLOW[violation.status as keyof typeof STATUS_FLOW] || { color: 'gray', label: violation.status };
  const cat = CATEGORIES.find(c => c.id === violation.category);
  const updates = violation.hoa_violation_updates || [];

  const colorClass = statusInfo.color === 'green' ? 'text-[#2A5D4F] bg-[rgba(42,93,79,0.10)] border-[rgba(42,93,79,0.20)]' :
    statusInfo.color === 'red' ? 'text-[#8B5A5A] bg-[rgba(107,58,58,0.10)] border-[rgba(107,58,58,0.20)]' :
    statusInfo.color === 'yellow' ? 'text-[#B09B71] bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]' :
    statusInfo.color === 'gold' ? 'text-[#B09B71] bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]' :
    statusInfo.color === 'blue' ? 'text-[var(--steel)] bg-[rgba(90,122,154,0.10)] border-[rgba(90,122,154,0.20)]' :
    statusInfo.color === 'orange' ? 'text-[#B09B71] bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]' :
    statusInfo.color === 'amber' ? 'text-[#B09B71] bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]' :
    'text-[var(--text-muted)] bg-[rgba(245,240,232,0.04)] border-[rgba(245,240,232,0.08)]';

  return (
    <div className="glass-card rounded-xl hover-lift overflow-hidden cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[10px] font-mono text-[var(--text-disabled)]">{violation.violation_number}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${colorClass}`}>
                {statusInfo.label}
              </span>
              <span className="text-[10px] text-[var(--text-disabled)]">{cat?.icon} {cat?.label}</span>
              {violation.severity !== 'minor' && (
                <span className={`text-[10px] font-medium ${
                  violation.severity === 'critical' ? 'text-[#8B5A5A]' :
                  violation.severity === 'major' ? 'text-[#B09B71]' : 'text-[#B09B71]'
                }`}>
                  {violation.severity?.toUpperCase()}
                </span>
              )}
            </div>
            <h3 className="font-medium text-sm mb-1">{violation.title}</h3>
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-disabled)]">
              <span>Lot #{violation.accused_lot}</span>
              {violation.fine_amount > 0 && (
                <span className="text-[#8B5A5A] font-medium">${(violation.fine_amount / 100).toFixed(2)} fine</span>
              )}
              <span>{new Date(violation.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <span className={`text-[var(--text-disabled)] transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-[rgba(245,240,232,0.05)] space-y-4">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{violation.description}</p>

            {violation.ccr_section && (
              <p className="text-xs text-[var(--text-disabled)]"> CC&R Section: <span className="text-[var(--text-body)]">{violation.ccr_section}</span></p>
            )}

            {violation.cure_deadline && (
              <p className="text-xs text-[var(--text-disabled)]">
                ⏰ Cure Deadline: <span className="text-[#B09B71]">{new Date(violation.cure_deadline).toLocaleDateString()}</span>
              </p>
            )}

            {violation.hearing_date && (
              <p className="text-xs text-[var(--text-disabled)]">
                 Hearing: <span className="text-[#B09B71]">{new Date(violation.hearing_date).toLocaleDateString()}</span>
              </p>
            )}

            {/* Timeline */}
            {updates.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-disabled)] font-medium">History</p>
                {updates.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((u: any) => (
                  <div key={u.id} className="pl-4 border-l-2 border-[rgba(176,155,113,0.20)]">
                    <p className="text-xs text-[var(--text-muted)]">{u.text}</p>
                    <p className="text-[10px] text-[var(--text-disabled)] mt-0.5">
                      {new Date(u.created_at).toLocaleDateString()} · {u.updated_by === 'anonymous' ? 'Anonymous' : u.updated_by?.slice(0, 10)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions based on status */}
            {(violation.status === 'cure-period' || violation.status === 'notice-issued') && (
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-[rgba(42,93,79,0.15)] border border-[rgba(42,93,79,0.25)] text-xs text-[#2A5D4F] hover:bg-[rgba(42,93,79,0.30)]">
                   Submit Compliance Proof
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.30)] text-xs text-[#B09B71] hover:bg-[rgba(176,155,113,0.20)]">
                   Dispute
                </button>
              </div>
            )}

            {(violation.status === 'ruling-upheld' || violation.status === 'fined') && (
              <button className="px-3 py-1.5 rounded-lg bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.30)] text-xs text-[#B09B71] hover:bg-[rgba(176,155,113,0.20)]">
                 Appeal to Community
              </button>
            )}

            {/* Appeal button - always available for active violations */}
            {!['dismissed', 'resolved', 'closed', 'appeal-upheld', 'appeal-overturned'].includes(violation.status) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAppeal(true); }}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.30)] text-xs text-[#B09B71] hover:bg-[rgba(176,155,113,0.20)]"
                >
                   File Appeal
                </button>
                {hasAppeal && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${
                    appealRecord?.status === 'approved' ? 'text-[#2A5D4F] bg-[rgba(42,93,79,0.10)] border-[rgba(42,93,79,0.20)]' :
                    appealRecord?.status === 'denied' ? 'text-[#8B5A5A] bg-[rgba(107,58,58,0.10)] border-[rgba(107,58,58,0.20)]' :
                    appealRecord?.status === 'under-review' ? 'text-[var(--steel)] bg-[rgba(90,122,154,0.10)] border-[rgba(90,122,154,0.20)]' :
                    'text-[#B09B71] bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]'
                  }`}>
                    Appeal: {appealRecord?.status}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {showAppeal && <AppealModal violation={violation} onClose={() => setShowAppeal(false)} />}
    </div>
  );
}

function ReportForm({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const { tokenId } = useProperty();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accusedLot, setAccusedLot] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [ccrSection, setCcrSection] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const report = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_by: address,
          reported_by_lot: tokenId,
          accused_lot: parseInt(accusedLot),
          category,
          title,
          description,
          location,
          ccr_section: ccrSection || null,
          anonymous_report: anonymous,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['violations'] });
      onClose();
    },
  });

  return (
    <div className="glass-card rounded-xl hover-lift p-6 space-y-5">
      <h2 className="text-lg font-medium">Report a Violation</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Lot Number (accused)</label>
          <input type="number" value={accusedLot} onChange={e => setAccusedLot(e.target.value)}
            placeholder="Which lot?" min="1" max="150"
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none">
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Brief description of the violation"
          className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Provide details — what's happening, when did it start, impact on the community..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Location (optional)</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Where specifically?"
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">CC&R Section (optional)</label>
          <input type="text" value={ccrSection} onChange={e => setCcrSection(e.target.value)}
            placeholder="e.g., Section 4.2"
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)}
          className="rounded border-[rgba(245,240,232,0.08)] bg-[var(--surface-2)]" />
        <span className="text-sm text-[var(--text-muted)]">Submit anonymously</span>
        <span className="text-[10px] text-[var(--text-disabled)]">(board will still see your identity for follow-up)</span>
      </label>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
        <button
          disabled={!title.trim() || !description.trim() || !accusedLot || !category || report.isPending}
          onClick={() => report.mutate()}
          className="flex-1 py-3 rounded-xl bg-[#8B5A5A] hover:bg-[#6B3A3A] disabled:opacity-50 text-sm font-medium transition-all"
        >
          {report.isPending ? '⏳ Submitting...' : 'Submit Report'}
        </button>
      </div>

      <div className="p-4 rounded-xl glass-card">
        <h4 className="text-xs font-medium text-[#B09B71] mb-1 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> What happens next?</h4>
        <p className="text-[10px] text-[var(--text-muted)]">
          The board reviews your report within 48 hours. If valid, a notice is issued and the homeowner has 14-30 days to correct the issue.
          They can dispute it, and if the ruling stands, they can appeal to the entire community for a democratic vote.
          Every step is logged transparently.
        </p>
      </div>
    </div>
  );
}
