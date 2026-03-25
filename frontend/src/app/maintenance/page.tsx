'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMaintenanceRequests, useCreateMaintenanceRequest } from '@/hooks/useMaintenance';
import { useProperty } from '@/hooks/useProperty';


const STATUS_STYLES = {
  open: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: '🟡 Open' },
  'in-progress': { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: '🔵 In Progress' },
  scheduled: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: '📅 Scheduled' },
  resolved: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: '✅ Resolved' },
};

const PRIORITY_STYLES = {
  low: 'text-gray-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};



export default function MaintenancePage() {
  const { isConnected } = useAccount();
  const [filter, setFilter] = useState<string>('all');
  const [showNewRequest, setShowNewRequest] = useState(false);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to submit maintenance requests</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const { data: apiRequests, isLoading } = useMaintenanceRequests(filter !== 'all' ? filter : null);
  const filtered = apiRequests || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Maintenance</h1>
          <p className="text-sm text-gray-400 mt-1">
            Report issues, track repairs, and see resolution status
          </p>
        </div>
        <button
          onClick={() => setShowNewRequest(!showNewRequest)}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm font-medium transition-all hover:shadow-[0_0_16px_rgba(139,92,246,0.3)] shrink-0"
        >
          {showNewRequest ? '← Back' : '🔧 Report Issue'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_STYLES).map(([status, style]) => {
          const count = (apiRequests || []).filter((r: any) => r.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? 'all' : status)}
              className={`glass-card rounded-xl p-4 text-center transition-all ${filter === status ? 'ring-1 ring-purple-500/30' : ''}`}
            >
              <p className={`text-2xl font-bold ${style.color}`}>{count}</p>
              <p className="text-[10px] text-gray-500">{style.label}</p>
            </button>
          );
        })}
      </div>

      {showNewRequest ? (
        <NewRequestForm onClose={() => setShowNewRequest(false)} />
      ) : (
        <div className="space-y-4">
          {filtered.map(request => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({ request }: { request: any }) {
  const [expanded, setExpanded] = useState(false);
  const style = (STATUS_STYLES as any)[request.status] || STATUS_STYLES.open;
  const timeAgo = getTimeAgo(new Date(request.created_at));

  return (
    <div className="glass-card rounded-xl overflow-hidden cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-mono text-gray-500">{request.id}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${style.bg} ${style.color} ${style.border}`}>
                {style.label}
              </span>
              <span className={`text-[10px] font-medium ${(PRIORITY_STYLES as any)[request.priority] || 'text-gray-400'}`}>
                {request.priority.toUpperCase()}
              </span>
            </div>
            <h3 className="font-semibold text-sm mb-1">{request.title}</h3>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>📍 {request.location}</span>
              <span>Lot #{request.lot_number || 0}</span>
              <span>{timeAgo}</span>
            </div>
          </div>
          <span className={`text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
            <p className="text-sm text-gray-400 leading-relaxed">{request.description}</p>

            {request.assignedTo && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">Assigned to:</span>
                <span className="font-medium">{request.assignedTo}</span>
                {request.estimatedCompletion && (
                  <>
                    <span className="text-gray-500">ETA:</span>
                    <span className="font-medium text-purple-400">{request.estimatedCompletion}</span>
                  </>
                )}
              </div>
            )}

            {request.hoa_maintenance_updates || [].length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Updates</p>
                {(request.hoa_maintenance_updates || []).map((update: any, i: number) => (
                  <div key={i} className="pl-4 border-l-2 border-purple-500/20">
                    <p className="text-xs text-gray-400">{update.text}</p>
                    <p className="text-[10px] text-gray-600 mt-1">
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
    <div className="glass-card rounded-xl p-6 space-y-5">
      <h2 className="text-lg font-semibold">Report an Issue</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Location</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Where is the issue? (e.g., Oak Lane near Lot 42)"
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-purple-500/50 focus:outline-none transition-all">
            <option value="">Select category</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Priority</label>
          <div className="flex gap-2">
            {['low', 'medium', 'high', 'urgent'].map(p => (
              <button key={p} onClick={() => setPriority(p)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                  priority === p ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'glass-card text-gray-400'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Provide details — what's the issue, how long has it been happening, any safety concerns?"
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all resize-none" />
      </div>

      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors">
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
          className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-all">
          {createRequest.isPending ? '⏳ Submitting...' : 'Submit Request'}
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
