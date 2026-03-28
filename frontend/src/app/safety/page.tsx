'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ShieldCheck } from 'lucide-react';

interface SafetyEntry {
  id: string;
  type: string;
  location: string;
  description: string;
  date: string;
  status: 'reported' | 'acknowledged' | 'resolved';
  reportedBy: string;
  anonymous: boolean;
  createdAt: string;
}

const REPORT_TYPES = [
  { id: 'suspicious', label: 'Suspicious Activity', icon: '', color: 'red' },
  { id: 'streetlight', label: 'Broken Streetlight', icon: '', color: 'amber' },
  { id: 'pothole', label: 'Pothole / Road Damage', icon: '', color: 'orange' },
  { id: 'vandalism', label: 'Vandalism', icon: '', color: 'red' },
  { id: 'trespassing', label: 'Trespassing', icon: '', color: 'red' },
  { id: 'hazard', label: 'Safety Hazard', icon: '', color: 'yellow' },
  { id: 'noise', label: 'Noise Disturbance', icon: '', color: 'blue' },
  { id: 'other', label: 'Other Concern', icon: '', color: 'gray' },
];

const STATUS_STYLES = {
  reported: { label: 'Reported', color: 'text-[#B09B71] bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]' },
  acknowledged: { label: 'Acknowledged', color: 'text-[var(--steel)] bg-[rgba(90,122,154,0.10)] border-[rgba(90,122,154,0.20)]' },
  resolved: { label: 'Resolved', color: 'text-[#3A7D6F] bg-[rgba(42,93,79,0.10)] border-[rgba(42,93,79,0.20)]' },
};

const LS_KEY = 'suvren_safety_log';

function loadEntries(): SafetyEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function saveEntries(entries: SafetyEntry[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

const SAMPLE_ENTRIES: SafetyEntry[] = [
  { id: '1', type: 'streetlight', location: 'Maple Ave & Oak Street', description: 'Streetlight at the intersection has been out for 3 days.', date: '2026-03-24', status: 'acknowledged', reportedBy: '0x1234...', anonymous: false, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: '2', type: 'pothole', location: 'Faircroft Blvd near entrance', description: 'Large pothole near the main entrance, about 12 inches wide.', date: '2026-03-22', status: 'reported', reportedBy: '0xabcd...', anonymous: true, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
];

export default function SafetyPage() {
  const { isConnected, address } = useAccount();
  const [entries, setEntries] = useState<SafetyEntry[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const stored = loadEntries();
    setEntries(stored.length > 0 ? stored : SAMPLE_ENTRIES);
  }, []);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to view or report safety concerns</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const filtered = entries.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    return true;
  });

  const handleReport = (entry: Omit<SafetyEntry, 'id' | 'createdAt' | 'reportedBy'>) => {
    const newEntry: SafetyEntry = {
      ...entry,
      id: crypto.randomUUID(),
      reportedBy: address || '0x0000',
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    saveEntries(updated);
    setEntries(updated);
    setShowReport(false);
  };

  const updateStatus = (id: string, status: SafetyEntry['status']) => {
    const updated = entries.map(e => e.id === id ? { ...e, status } : e);
    saveEntries(updated);
    setEntries(updated);
  };

  const counts = {
    reported: entries.filter(e => e.status === 'reported').length,
    acknowledged: entries.filter(e => e.status === 'acknowledged').length,
    resolved: entries.filter(e => e.status === 'resolved').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-[#B09B71]" /> Neighborhood Watch</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Report and track community safety observations</p>
        </div>
        <button
          onClick={() => setShowReport(!showReport)}
          className="px-5 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all shrink-0"
        >
          {showReport ? '← Back to Log' : '+ Report Concern'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Reported', count: counts.reported, color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.05)] border-[rgba(176,155,113,0.20)]' },
          { label: 'Acknowledged', count: counts.acknowledged, color: 'text-[var(--steel)]', bg: 'bg-[var(--steel)]/5 border-[rgba(90,122,154,0.20)]' },
          { label: 'Resolved', count: counts.resolved, color: 'text-[#3A7D6F]', bg: 'bg-[#3A7D6F]/5 border-[rgba(42,93,79,0.20)]' },
        ].map(s => (
          <div key={s.label} className={`glass-card rounded-xl p-3 text-center border ${s.bg}`}>
            <div className={`text-2xl font-medium ${s.color}`}>{s.count}</div>
            <div className="text-[10px] text-[var(--text-disabled)]">{s.label}</div>
          </div>
        ))}
      </div>

      {showReport ? (
        <ReportForm onSubmit={handleReport} onCancel={() => setShowReport(false)} address={address} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex gap-2">
              {(['all', 'reported', 'acknowledged', 'resolved'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                    statusFilter === s ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)]'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-xs text-[var(--text-muted)] focus:outline-none">
              <option value="all">All Types</option>
              {REPORT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-4xl mb-3"></p>
              <h3 className="font-medium mb-1">No reports</h3>
              <p className="text-sm text-[var(--text-muted)]">Safety observations will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(entry => (
                  <SafetyCard key={entry.id} entry={entry} onUpdateStatus={updateStatus} />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SafetyCard({ entry, onUpdateStatus }: { entry: SafetyEntry; onUpdateStatus: (id: string, s: SafetyEntry['status']) => void }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = REPORT_TYPES.find(t => t.id === entry.type) || REPORT_TYPES[REPORT_TYPES.length - 1];
  const statusStyle = STATUS_STYLES[entry.status];
  const timeAgo = getTimeAgo(new Date(entry.createdAt));

  return (
    <div className="glass-card rounded-xl hover-lift overflow-hidden">
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-base">{typeInfo.icon}</span>
              <span className="font-medium text-sm">{typeInfo.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusStyle.color}`}>
                {statusStyle.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-disabled)]">
              <span> {entry.location}</span>
              <span> {timeAgo}</span>
              {entry.anonymous && <span className="text-[var(--text-disabled)]">Anonymous</span>}
            </div>
          </div>
          <span className={`text-[var(--text-disabled)] transition-transform text-sm ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-[rgba(245,240,232,0.05)] space-y-3">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{entry.description}</p>
            <p className="text-[11px] text-[var(--text-disabled)]">Reported: {entry.date}</p>

            {entry.status !== 'resolved' && (
              <div className="flex gap-2 pt-1">
                {entry.status === 'reported' && (
                  <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(entry.id, 'acknowledged'); }}
                    className="px-3 py-1.5 rounded-lg bg-[rgba(90,122,154,0.10)] border border-[rgba(90,122,154,0.20)] text-xs text-[var(--steel)] hover:bg-[rgba(90,122,154,0.15)]">
                     Acknowledge
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(entry.id, 'resolved'); }}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(42,93,79,0.10)] border border-[rgba(42,93,79,0.20)] text-xs text-[#3A7D6F] hover:bg-[rgba(42,93,79,0.15)]">
                   Mark Resolved
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportForm({ onSubmit, onCancel, address }: {
  onSubmit: (e: Omit<SafetyEntry, 'id' | 'createdAt' | 'reportedBy'>) => void;
  onCancel: () => void;
  address?: string;
}) {
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [anonymous, setAnonymous] = useState(false);

  const handleSubmit = () => {
    if (!type || !location.trim() || !description.trim()) return;
    onSubmit({ type, location, description, date, status: 'reported', anonymous });
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-5 max-w-2xl">
      <h2 className="text-lg font-medium">Report a Safety Concern</h2>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Type of Concern</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REPORT_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className={`p-3 rounded-xl text-center transition-all ${
                type === t.id ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)] hover:text-[var(--parchment)]'
              }`}>
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-[10px] font-medium leading-tight">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Location *</label>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Corner of Maple Ave and Oak St"
          className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" />
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Description *</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Describe what you observed — when, what you saw, any relevant details..."
          rows={4} className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none resize-none" />
      </div>

      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-2">Date Observed</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="rounded border-[rgba(245,240,232,0.08)] bg-[var(--surface-2)]" />
        <span className="text-sm text-[var(--text-muted)]">Report anonymously</span>
      </label>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={!type || !location.trim() || !description.trim()}
          className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all">
          Submit Report
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
