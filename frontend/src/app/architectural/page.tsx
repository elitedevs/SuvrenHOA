'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProperty } from '@/hooks/useProperty';
import { Building2 } from 'lucide-react';

const MOD_TYPES = [
  { id: 'paint', label: 'Exterior Paint', icon: '' },
  { id: 'fence', label: 'Fence', icon: '' },
  { id: 'deck', label: 'Deck/Patio', icon: '' },
  { id: 'landscaping', label: 'Landscaping', icon: '' },
  { id: 'roof', label: 'Roof', icon: '' },
  { id: 'siding', label: 'Siding', icon: '' },
  { id: 'addition', label: 'Addition', icon: '' },
  { id: 'shed', label: 'Shed/Storage', icon: '' },
  { id: 'solar', label: 'Solar Panels', icon: '' },
  { id: 'lighting', label: 'Exterior Lighting', icon: '' },
  { id: 'driveway', label: 'Driveway', icon: '' },
  { id: 'mailbox', label: 'Mailbox', icon: '' },
  { id: 'other', label: 'Other', icon: '' },
];

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  'submitted': { color: 'yellow', label: ' Submitted' },
  'under-review': { color: 'blue', label: ' Under Review' },
  'info-requested': { color: 'amber', label: ' Info Requested' },
  'approved': { color: 'green', label: ' Approved' },
  'approved-with-conditions': { color: 'green', label: ' Approved (Conditions)' },
  'denied': { color: 'red', label: ' Denied' },
  'in-progress': { color: 'blue', label: ' In Progress' },
  'completed': { color: 'emerald', label: ' Completed' },
  'inspected': { color: 'emerald', label: ' Inspected' },
};

export default function ArchitecturalPage() {
  const { isConnected } = useAccount();
  const [showSubmit, setShowSubmit] = useState(false);
  const [filter, setFilter] = useState('all');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to submit architectural requests</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium">Architectural Review</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Submit exterior modification requests for board approval
          </p>
        </div>
        <button
          onClick={() => setShowSubmit(!showSubmit)}
          className="px-5 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all shrink-0"
        >
          {showSubmit ? '← Back' : ' New Request'}
        </button>
      </div>

      {showSubmit ? (
        <SubmitForm onClose={() => setShowSubmit(false)} />
      ) : (
        <RequestList filter={filter} setFilter={setFilter} />
      )}
    </div>
  );
}

const PIPELINE_STAGES = [
  { key: 'submitted', label: 'Submitted', icon: '', color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]' },
  { key: 'under-review', label: 'Under Review', icon: '', color: 'text-[var(--steel)]', bg: 'bg-[rgba(90,122,154,0.10)] border-[rgba(90,122,154,0.20)]' },
  { key: 'info-requested', label: 'Info Needed', icon: '', color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]' },
  { key: 'approved', label: 'Approved', icon: '', color: 'text-[#3A7D6F]', bg: 'bg-[rgba(42,93,79,0.10)] border-[rgba(42,93,79,0.20)]' },
  { key: 'denied', label: 'Denied', icon: '', color: 'text-[#8B5A5A]', bg: 'bg-[rgba(107,58,58,0.10)] border-[rgba(107,58,58,0.20)]' },
];

function ReviewPipeline({ requests, setFilter }: { requests: any[]; setFilter: (f: string) => void }) {
  const counts: Record<string, number> = {};
  if (requests) {
    requests.forEach((r: any) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
  }
  return (
    <div className="glass-card rounded-xl p-4 mb-6">
      <p className="text-xs text-[var(--text-disabled)] font-medium uppercase tracking-wider mb-3">Review Pipeline</p>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-1 min-w-0">
            <button
              onClick={() => setFilter(stage.key)}
              className={`flex flex-col items-center px-3 py-2.5 rounded-xl border transition-all cursor-pointer hover:scale-105 shrink-0 ${stage.bg}`}
            >
              <span className="text-lg">{stage.icon}</span>
              <span className={`text-[10px] font-medium mt-1 ${stage.color}`}>{stage.label}</span>
              <span className={`text-lg font-medium ${stage.color}`}>{counts[stage.key] || 0}</span>
            </button>
            {i < PIPELINE_STAGES.length - 1 && (
              <span className="text-[var(--text-disabled)] text-sm shrink-0">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RequestList({ filter, setFilter }: { filter: string; setFilter: (f: string) => void }) {
  const { data: allRequests } = useQuery({
    queryKey: ['architectural', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/architectural');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['architectural', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`/api/architectural${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });

  const statuses = ['all', 'submitted', 'under-review', 'approved', 'denied', 'in-progress', 'completed'];

  return (
    <>
      <ReviewPipeline requests={allRequests || []} setFilter={setFilter} />
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              filter === s ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)]'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_STYLES[s]?.label || s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--text-disabled)]">Loading requests...</div>
      ) : !requests || requests.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Building2 className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No architectural requests</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Planning to paint, build a fence, add a deck, or install solar panels?
            Submit a request here for board approval before starting work.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r: any) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </>
  );
}

function RequestCard({ request }: { request: any }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_STYLES[request.status] || { color: 'gray', label: request.status };
  const modType = MOD_TYPES.find(m => m.id === request.modification_type);
  const comments = request.hoa_architectural_comments || [];

  const colorClass = status.color === 'green' ? 'text-[#3A7D6F] bg-[rgba(42,93,79,0.10)] border-[rgba(42,93,79,0.20)]' :
    status.color === 'red' ? 'text-[#8B5A5A] bg-[rgba(107,58,58,0.10)] border-[rgba(107,58,58,0.20)]' :
    status.color === 'blue' ? 'text-[var(--steel)] bg-[rgba(90,122,154,0.10)] border-[rgba(90,122,154,0.20)]' :
    status.color === 'yellow' ? 'text-[#B09B71] bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]' :
    status.color === 'amber' ? 'text-[#B09B71] bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]' :
    status.color === 'emerald' ? 'text-[#3A7D6F] bg-[rgba(42,93,79,0.10)] border-[rgba(42,93,79,0.20)]' :
    'text-[var(--text-muted)] bg-[rgba(245,240,232,0.04)] border-[rgba(245,240,232,0.08)]';

  return (
    <div className="glass-card rounded-xl overflow-hidden cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[10px] font-mono text-[var(--text-disabled)]">{request.request_number}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
                {status.label}
              </span>
              <span className="text-[10px] text-[var(--text-disabled)]">{modType?.icon} {modType?.label}</span>
            </div>
            <h3 className="font-medium text-sm mb-1">{request.title}</h3>
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-disabled)]">
              <span>Lot #{request.lot_number}</span>
              {request.estimated_cost && <span>Est: {request.estimated_cost}</span>}
              <span>{new Date(request.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <span className={`text-[var(--text-disabled)] transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-[rgba(245,240,232,0.05)] space-y-3">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{request.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {request.contractor_name && (
                <div><span className="text-[var(--text-disabled)]">Contractor:</span> <span className="text-[var(--text-body)]">{request.contractor_name}</span></div>
              )}
              {request.start_date && (
                <div><span className="text-[var(--text-disabled)]">Start:</span> <span className="text-[var(--text-body)]">{request.start_date}</span></div>
              )}
              {request.completion_date && (
                <div><span className="text-[var(--text-disabled)]">Completion:</span> <span className="text-[var(--text-body)]">{request.completion_date}</span></div>
              )}
            </div>

            {request.conditions && (
              <div className="p-3 rounded-lg bg-[#B09B71]/5 border border-amber-500/10">
                <p className="text-xs text-[#B09B71] font-medium mb-1">Conditions:</p>
                <p className="text-xs text-[var(--text-muted)]">{request.conditions}</p>
              </div>
            )}

            {request.reviewer_notes && (
              <div className="p-3 rounded-lg bg-[rgba(26,26,30,0.30)]">
                <p className="text-xs text-[var(--text-disabled)] font-medium mb-1">Board Notes:</p>
                <p className="text-xs text-[var(--text-muted)]">{request.reviewer_notes}</p>
              </div>
            )}

            {comments.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-disabled)] font-medium">Comments</p>
                {comments.map((c: any) => (
                  <div key={c.id} className="pl-3 border-l-2 border-[#B09B71]/20">
                    <p className="text-xs text-[var(--text-muted)]">{c.text}</p>
                    <p className="text-[10px] text-[var(--text-disabled)] mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SubmitForm({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const { tokenId } = useProperty();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [modType, setModType] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');

  const submit = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/architectural', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          lot_number: tokenId,
          title, description,
          modification_type: modType,
          estimated_cost: estimatedCost || null,
          contractor_name: contractorName || null,
          start_date: startDate || null,
          completion_date: completionDate || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['architectural'] });
      onClose();
    },
  });

  return (
    <div className="glass-card rounded-xl p-6 space-y-5">
      <h2 className="text-lg font-medium">Submit Modification Request</h2>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Modification Type</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {MOD_TYPES.map(m => (
            <button key={m.id} onClick={() => setModType(m.id)}
              className={`p-2.5 rounded-xl text-[11px] font-medium transition-all flex flex-col items-center gap-1 ${
                modType === m.id ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)]'
              }`}>
              <span className="text-lg">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">What are you planning?</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Install 6ft privacy fence along back property line"
          className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" />
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Details</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Materials, colors, dimensions, placement... the more detail the faster the review"
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none resize-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Estimated Cost</label>
          <input type="text" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)}
            placeholder="$5,000"
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Contractor</label>
          <input type="text" value={contractorName} onChange={e => setContractorName(e.target.value)}
            placeholder="Company name"
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Target Start</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
        <button
          disabled={!title.trim() || !description.trim() || !modType || submit.isPending}
          onClick={() => submit.mutate()}
          className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all"
        >
          {submit.isPending ? ' Submitting...' : 'Submit for Review'}
        </button>
      </div>

      <div className="p-4 rounded-xl glass-card">
        <h4 className="text-xs font-medium text-[#B09B71] mb-1"> Review Process</h4>
        <p className="text-[10px] text-[var(--text-muted)]">
          The Architectural Review Committee reviews requests within 14 days.
          You may be asked for additional information. Do not begin work until you receive approval.
          Approved requests may include conditions that must be followed.
        </p>
      </div>
    </div>
  );
}
