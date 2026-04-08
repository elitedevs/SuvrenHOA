'use client';
import { AuthWall } from '@/components/AuthWall';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useMaintenanceRequests, useCreateMaintenanceRequest } from '@/hooks/useMaintenance';
import { useProperty } from '@/hooks/useProperty';
import { Wrench } from 'lucide-react';


const STATUS_STYLES = {
  open: { color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)]', border: 'border-[rgba(176,155,113,0.20)]', label: ' Open' },
  'in-progress': { color: 'text-[var(--steel)]', bg: 'bg-[rgba(90,122,154,0.10)]', border: 'border-[rgba(90,122,154,0.20)]', label: ' In Progress' },
  scheduled: { color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)]', border: 'border-[rgba(176,155,113,0.20)]', label: ' Scheduled' },
  resolved: { color: 'text-[#2A5D4F]', bg: 'bg-[rgba(42,93,79,0.10)]', border: 'border-[rgba(42,93,79,0.20)]', label: ' Resolved' },
};

const PRIORITY_STYLES = {
  low: 'text-[var(--text-muted)]',
  medium: 'text-[#B09B71]',
  high: 'text-[#B09B71]',
  urgent: 'text-[#8B5A5A]',
};



export default function MaintenancePage() {
  const { isConnected } = useAccount();
  const [filter, setFilter] = useState<string>('all');
  const [showNewRequest, setShowNewRequest] = useState(false);

  const { data: apiRequests, isLoading } = useMaintenanceRequests(filter !== 'all' ? filter : null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  if (!isConnected) {
    return <AuthWall title="Maintenance" description="Submit and track maintenance requests for community infrastructure and shared spaces." />;
  }

  const allRequests = apiRequests || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">Maintenance</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Report issues, track repairs, and see resolution status
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="flex rounded-xl border border-[rgba(245,240,232,0.08)] overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2.5 text-xs font-medium transition-all ${viewMode === 'kanban' ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71]' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}
            >
               Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2.5 text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71]' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}
            >
              ≡ List
            </button>
          </div>
          <button
            onClick={() => setShowNewRequest(!showNewRequest)}
            className="px-5 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all hover:shadow-[0_0_16px_rgba(201,169,110,0.25)]"
          >
            {showNewRequest ? '← Back' : ' Report Issue'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_STYLES).map(([status, style]) => {
          const count = allRequests.filter((r: any) => r.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? 'all' : status)}
              className={`glass-card rounded-xl hover-lift p-4 text-center transition-all ${filter === status ? 'ring-1 ring-[rgba(176,155,113,0.30)]' : ''}`}
            >
              <p className={`text-2xl font-medium ${style.color}`}>{count}</p>
              <p className="text-[10px] text-[var(--text-disabled)]">{style.label}</p>
            </button>
          );
        })}
      </div>

      {showNewRequest ? (
        <NewRequestForm onClose={() => setShowNewRequest(false)} />
      ) : viewMode === 'kanban' ? (
        <KanbanBoard requests={allRequests} />
      ) : (
        <div className="space-y-4">
          {allRequests.map((request: any) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({ request }: { request: any }) {
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLES[request.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.open;
  const timeAgo = getTimeAgo(new Date(request.created_at));

  return (
    <div className="glass-card rounded-xl hover-lift overflow-hidden cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-mono text-[var(--text-disabled)]">{request.id}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${style.bg} ${style.color} ${style.border}`}>
                {style.label}
              </span>
              <span className={`text-[10px] font-medium ${PRIORITY_STYLES[request.priority as keyof typeof PRIORITY_STYLES] || 'text-[var(--text-muted)]'}`}>
                {request.priority.toUpperCase()}
              </span>
            </div>
            <h3 className="font-medium text-sm mb-1">{request.title}</h3>
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-disabled)]">
              <span> {request.location}</span>
              <span>Lot #{request.lot_number || 0}</span>
              <span>{timeAgo}</span>
            </div>
          </div>
          <span className={`text-[var(--text-disabled)] transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-[rgba(245,240,232,0.05)] space-y-4">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{request.description}</p>

            {request.assignedTo && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[var(--text-disabled)]">Assigned to:</span>
                <span className="font-medium">{request.assignedTo}</span>
                {request.estimatedCompletion && (
                  <>
                    <span className="text-[var(--text-disabled)]">ETA:</span>
                    <span className="font-medium text-[#B09B71]">{request.estimatedCompletion}</span>
                  </>
                )}
              </div>
            )}

            {request.hoa_maintenance_updates || [].length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-disabled)] font-medium">Updates</p>
                {(request.hoa_maintenance_updates || []).map((update: any, i: number) => (
                  <div key={i} className="pl-4 border-l-2 border-[rgba(176,155,113,0.20)]">
                    <p className="text-xs text-[var(--text-muted)]">{update.text}</p>
                    <p className="text-[10px] text-[var(--text-disabled)] mt-1">
                      {update.updated_by} · {new Date(update.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
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

function NewRequestForm({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const { tokenId } = useProperty();
  const createRequest = useCreateMaintenanceRequest();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');

  const categories = ['Irrigation', 'Lighting', 'Roads', 'Plumbing', 'Landscaping', 'Fencing', 'Clubhouse', 'Pool', 'Other'];

  return (
    <div className="glass-card rounded-xl hover-lift p-6 space-y-5">
      <h2 className="text-lg font-medium">Report an Issue</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm placeholder-[rgba(245,240,232,0.25)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Location</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Where is the issue? (e.g., Oak Lane near Lot 42)"
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm placeholder-[rgba(245,240,232,0.25)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none transition-all">
            <option value="">Select category</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-2">Priority</label>
          <div className="flex gap-2">
            {['low', 'medium', 'high', 'urgent'].map(p => (
              <button key={p} onClick={() => setPriority(p)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                  priority === p ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]' : 'glass-card text-[var(--text-muted)]'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Provide details — what's the issue, how long has it been happening, any safety concerns?"
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm placeholder-[rgba(245,240,232,0.25)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none transition-all resize-none" />
      </div>

      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">
          Cancel
        </button>
        <button 
          disabled={!title.trim() || !description.trim() || !location.trim() || createRequest.isPending}
          onClick={() => {
            if (!address) return;
            createRequest.mutate(
              { wallet_address: address, lot_number: tokenId, title, description, category, location, priority },
              { onSuccess: () => onClose() }
            );
          }}
          className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all">
          {createRequest.isPending ? ' Submitting...' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const KANBAN_COLUMNS = [
  { id: 'open', label: 'Submitted', emoji: '', style: STATUS_STYLES.open },
  { id: 'in-progress', label: 'In Progress', emoji: '', style: STATUS_STYLES['in-progress'] },
  { id: 'resolved', label: 'Completed', emoji: '', style: STATUS_STYLES.resolved },
];

function KanbanBoard({ requests }: { requests: any[] }) {
  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      items: requests.filter(r => r.status === col.id || (col.id === 'open' && !r.status)),
    }));
  }, [requests]);

  if (requests.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Wrench className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No maintenance requests</h3>
        <p className="text-sm text-[var(--text-muted)]">Submit a request to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {columns.map(col => (
        <div key={col.id} className="flex flex-col gap-3">
          {/* Column header */}
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${col.style.bg} border ${col.style.border}`}>
            <div className="flex items-center gap-2">
              <span>{col.emoji}</span>
              <span className={`text-xs font-medium ${col.style.color}`}>{col.label}</span>
            </div>
            <span className={`text-xs font-medium ${col.style.color} min-w-[20px] h-5 rounded-full flex items-center justify-center bg-black/20`}>
              {col.items.length}
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-2 min-h-[100px]">
            {col.items.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[rgba(245,240,232,0.06)] text-center">
                <p className="text-[11px] text-[var(--text-disabled)]">No items</p>
              </div>
            ) : (
              col.items.map((request: any) => (
                <KanbanCard key={request.id} request={request} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function KanbanCard({ request }: { request: any }) {
  const priority = PRIORITY_STYLES[request.priority as keyof typeof PRIORITY_STYLES] || 'text-[var(--text-muted)]';
  const timeAgo = getTimeAgo(new Date(request.created_at));

  return (
    <div className="glass-card rounded-xl p-4 hover-lift cursor-default">
      <h4 className="text-sm font-medium text-[var(--parchment)] mb-2 leading-snug">{request.title}</h4>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-medium uppercase ${priority}`}>
          {request.priority}
        </span>
        {request.location && (
          <span className="text-[10px] text-[var(--text-disabled)]"> {request.location}</span>
        )}
      </div>
      <p className="text-[10px] text-[var(--text-disabled)] mt-2">{timeAgo}</p>
    </div>
  );
}
