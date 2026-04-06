'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface NoiseComplaint {
  id: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  description: string;
  severity: number;
  anonymous: boolean;
  submittedBy?: string;
  submittedAt: string;
  status: 'received' | 'investigating' | 'resolved';
  boardNote?: string;
}

const STORAGE_KEY = 'faircroft_noise_complaints_v1';

const SAMPLE: NoiseComplaint[] = [
  {
    id: 'NC-001',
    date: '2026-03-24',
    time: '23:30',
    duration: '2 hours',
    location: 'Lot 12 / Building C',
    description: 'Loud party with music audible from multiple lots away.',
    severity: 4,
    anonymous: false,
    submittedBy: 'Lot 18',
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'investigating',
    boardNote: 'Reached out to Lot 12 resident.',
  },
];

export default function NoiseComplaintPage() {
  const { isConnected, address } = useAccount();
  const [complaints, setComplaints] = useState<NoiseComplaint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: '', time: '', duration: '', location: '', description: '',
    severity: 3, anonymous: false,
  });
  const [isBoard] = useState(true); // demo

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setComplaints(raw ? JSON.parse(raw) : SAMPLE);
  }, []);

  const save = (next: NoiseComplaint[]) => {
    setComplaints(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const submit = () => {
    if (!form.date || !form.location || !form.description) return;
    const c: NoiseComplaint = {
      id: `NC-${String(complaints.length + 1).padStart(3, '0')}`,
      ...form,
      submittedAt: new Date().toISOString(),
      submittedBy: form.anonymous ? undefined : `Lot ${Math.floor(Math.random() * 50 + 1)}`,
      status: 'received',
    };
    save([c, ...complaints]);
    setForm({ date: '', time: '', duration: '', location: '', description: '', severity: 3, anonymous: false });
    setShowForm(false);
  };

  const updateStatus = (id: string, status: NoiseComplaint['status'], note?: string) => {
    save(complaints.map(c => c.id === id ? { ...c, status, boardNote: note || c.boardNote } : c));
  };


  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-[var(--text-muted)] mb-4">Sign in to file a noise complaint</p>
      <ConnectButton label="Sign In" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">Noise Complaints</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Submit and track noise disturbance reports</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all shrink-0">
          {showForm ? '← Back' : ' Report Noise'}
        </button>
      </div>

      {showForm ? (
        <div className="glass-card rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-medium">File a Noise Complaint</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Date of Incident</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Time</label>
              <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Duration</label>
              <input type="text" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})}
                placeholder="e.g. 2 hours" className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Location of Noise</label>
            <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
              placeholder="Lot number, building, address..." className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Describe the noise — type, volume, impact..." rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-2">Severity: {form.severity}/5</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm({...form, severity: n})}
                  className={`w-10 h-10 rounded-xl text-sm font-medium border transition-all ${
                    form.severity >= n ? 'bg-[rgba(176,155,113,0.20)] text-[#B09B71] border-[rgba(176,155,113,0.40)]' : 'glass-card text-[var(--text-disabled)] border-[rgba(245,240,232,0.08)]'
                  }`}>{n}</button>
              ))}
              <span className="self-center text-xs text-[var(--text-disabled)] ml-2">
                {form.severity <= 2 ? 'Minor' : form.severity <= 3 ? 'Moderate' : form.severity <= 4 ? 'Significant' : 'Extreme'}
              </span>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.anonymous} onChange={e => setForm({...form, anonymous: e.target.checked})}
              className="rounded border-[rgba(245,240,232,0.08)] bg-[var(--surface-2)]" />
            <span className="text-sm text-[var(--text-muted)]">Submit anonymously (your lot number won't be shared)</span>
          </label>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
            <button onClick={submit} disabled={!form.date || !form.location || !form.description}
              className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all">
              Submit Complaint
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-4xl mb-3"></p>
              <p className="text-lg font-medium mb-1">No complaints filed</p>
              <p className="text-sm text-[var(--text-muted)]">All quiet in the community!</p>
            </div>
          ) : complaints.map(c => (
            <ComplaintCard key={c.id} complaint={c} isBoard={isBoard} onUpdateStatus={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function statusColor(s: string) {
  if (s === 'received') return 'bg-[rgba(176,155,113,0.10)] text-[#B09B71] border-[rgba(176,155,113,0.20)]';
  if (s === 'investigating') return 'bg-[rgba(90,122,154,0.10)] text-[var(--steel)] border-[rgba(90,122,154,0.20)]';
  return 'bg-[rgba(42,93,79,0.10)] text-[#3A7D6F] border-[rgba(42,93,79,0.20)]';
}

function ComplaintCard({ complaint: c, isBoard, onUpdateStatus }: {
  complaint: NoiseComplaint;
  isBoard: boolean;
  onUpdateStatus: (id: string, status: NoiseComplaint['status'], note?: string) => void;
}) {
  const [editNote, setEditNote] = useState('');
  const [editing, setEditing] = useState(false);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-[var(--text-disabled)]">{c.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(c.status)}`}>
              {c.status === 'received' ? ' Received' : c.status === 'investigating' ? ' Investigating' : ' Resolved'}
            </span>
            <span className="text-xs text-[var(--text-disabled)]">Severity: {''.repeat(c.severity)}{''.repeat(5-c.severity)}</span>
          </div>
          <p className="text-sm font-medium">{c.location}</p>
          <p className="text-xs text-[var(--text-disabled)]">{c.date} {c.time} · {c.duration} · {c.anonymous ? 'Anonymous' : c.submittedBy}</p>
        </div>
        {isBoard && (
          <div className="flex gap-2">
            {c.status !== 'investigating' && (
              <button onClick={() => onUpdateStatus(c.id, 'investigating')}
                className="px-3 py-1.5 rounded-lg text-xs border border-[rgba(90,122,154,0.25)] text-[var(--steel)] hover:bg-[rgba(90,122,154,0.10)] transition-colors">
                Investigate
              </button>
            )}
            {c.status !== 'resolved' && (
              <button onClick={() => onUpdateStatus(c.id, 'resolved')}
                className="px-3 py-1.5 rounded-lg text-xs border border-[rgba(42,93,79,0.25)] text-[#3A7D6F] hover:bg-[rgba(42,93,79,0.10)] transition-colors">
                Resolve
              </button>
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-3">{c.description}</p>
      {c.boardNote && (
        <div className="p-3 rounded-lg bg-[var(--steel)]/5 border border-[rgba(90,122,154,0.10)]">
          <p className="text-xs text-[var(--steel)] font-medium mb-0.5">Board Note:</p>
          <p className="text-xs text-[var(--text-muted)]">{c.boardNote}</p>
        </div>
      )}
      {isBoard && !editing && (
        <button onClick={() => { setEditNote(c.boardNote || ''); setEditing(true); }}
          className="text-xs text-[#B09B71] hover:underline mt-2">
          {c.boardNote ? 'Edit note' : '+ Add board note'}
        </button>
      )}
      {isBoard && editing && (
        <div className="mt-2 flex gap-2">
          <input value={editNote} onChange={e => setEditNote(e.target.value)}
            placeholder="Add a note..." className="flex-1 px-3 py-2 rounded-lg bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-xs focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
          <button onClick={() => { onUpdateStatus(c.id, c.status, editNote); setEditing(false); }}
            className="px-3 py-2 rounded-lg bg-[#B09B71] text-[var(--surface-2)] text-xs font-medium">Save</button>
          <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg border border-[rgba(245,240,232,0.08)] text-xs">Cancel</button>
        </div>
      )}
    </div>
  );
}
