'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ChevronDown, ChevronUp, Plus, X, Calendar, Users, CheckSquare, ArrowRight } from 'lucide-react';

interface ActionItem {
  task: string;
  assignee: string;
  dueDate?: string;
  done: boolean;
}

interface MinutesEntry {
  id: string;
  date: string;
  title: string;
  attendeesCount: number;
  keyDecisions: string[];
  actionItems: ActionItem[];
  notes?: string;
  quorum: boolean;
}

const STORAGE_KEY = 'hoa_meeting_minutes';

const SAMPLE_MINUTES: MinutesEntry[] = [
  {
    id: 'm1',
    date: '2026-03-20',
    title: 'March Board Meeting',
    attendeesCount: 24,
    quorum: true,
    keyDecisions: [
      'Approved $12,000 budget for park renovation project',
      'Voted to enforce stricter parking rules on Elm Street',
      'Approved new contractor (GreenLawn Inc.) for landscaping',
      'Tabled discussion on gate access system upgrade to April',
    ],
    actionItems: [
      { task: 'Get 3 quotes for gate access system', assignee: 'Board President', dueDate: '2026-04-01', done: false },
      { task: 'Send park renovation RFP to 5 contractors', assignee: 'Treasurer', dueDate: '2026-03-31', done: true },
      { task: 'Draft updated parking policy document', assignee: 'Secretary', dueDate: '2026-04-05', done: false },
    ],
    notes: 'Meeting held at Community Center, Room A. Recording available on request.',
  },
  {
    id: 'm2',
    date: '2026-02-18',
    title: 'February Board Meeting',
    attendeesCount: 19,
    quorum: true,
    keyDecisions: [
      'Approved Q1 2026 financial statements',
      'Voted to increase dues by 3% starting July 2026',
      'Approved architectural review guidelines update',
    ],
    actionItems: [
      { task: 'Notify all residents of dues increase', assignee: 'Secretary', dueDate: '2026-03-01', done: true },
      { task: 'Post updated arch review guidelines to website', assignee: 'Board President', dueDate: '2026-02-28', done: true },
    ],
    notes: 'Online meeting via Zoom. 19 of 45 residents attended.',
  },
  {
    id: 'm3',
    date: '2026-01-15',
    title: 'January Organizational Meeting',
    attendeesCount: 32,
    quorum: true,
    keyDecisions: [
      'Elected new Board President: Sarah Thompson (Lot 12)',
      'Re-elected Treasurer: Michael Chen (Lot 7)',
      'Approved 2026 Annual Budget: $185,000',
      'Set meeting schedule for 2026 (3rd Wednesday monthly)',
    ],
    actionItems: [
      { task: 'File annual corporate report', assignee: 'Secretary', dueDate: '2026-02-01', done: true },
      { task: 'Update bank signatories', assignee: 'Treasurer', dueDate: '2026-01-31', done: true },
      { task: 'Schedule vendor review meetings', assignee: 'Board President', dueDate: '2026-02-15', done: true },
    ],
    notes: 'Annual organizational meeting. Strong turnout. All votes passed with 2/3 majority.',
  },
];

function ActionItemRow({ item, onChange }: { item: ActionItem; onChange: (updated: ActionItem) => void }) {
  return (
    <div className={`flex items-start gap-3 py-2 ${item.done ? 'opacity-60' : ''}`}>
      <button
        onClick={() => onChange({ ...item, done: !item.done })}
        className={`mt-0.5 shrink-0 w-4 h-4 rounded border cursor-pointer transition-all ${
          item.done ? 'bg-[#B09B71] border-[#B09B71]' : 'border-[rgba(245,240,232,0.10)] hover:border-[#B09B71]'
        }`}
      >
        {item.done && <span className="text-[var(--surface-2)] text-[10px] font-medium flex items-center justify-center h-full"></span>}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${item.done ? 'line-through text-[var(--text-disabled)]' : 'text-[var(--text-body)]'}`}>{item.task}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-[#B09B71]">→ {item.assignee}</span>
          {item.dueDate && (
            <span className="text-[11px] text-[var(--text-disabled)]">Due {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function MinutesCard({ entry, isBoard, onUpdate }: { entry: MinutesEntry; isBoard: boolean; onUpdate: (updated: MinutesEntry) => void }) {
  const [expanded, setExpanded] = useState(false);

  const updateActionItem = (idx: number, updated: ActionItem) => {
    const newItems = [...entry.actionItems];
    newItems[idx] = updated;
    onUpdate({ ...entry, actionItems: newItems });
  };

  const completedActions = entry.actionItems.filter(a => a.done).length;

  return (
    <div className="relative flex gap-4">
      {/* Timeline dot */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-4 h-4 rounded-full bg-[#B09B71] border-2 border-[var(--divider)] z-10 mt-1" />
        <div className="w-px flex-1 bg-[rgba(245,240,232,0.06)] mt-1" />
      </div>

      {/* Card */}
      <div className="flex-1 glass rounded-xl border border-[rgba(245,240,232,0.04)] mb-4 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-start gap-3 p-5 text-left cursor-pointer hover:bg-[rgba(245,240,232,0.02)] transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-medium text-[var(--parchment)]">{entry.title}</span>
              {entry.quorum && (
                <span className="text-[10px] font-medium bg-[rgba(42,93,79,0.15)] text-[#3A7D6F] border border-[rgba(42,93,79,0.25)] px-2 py-0.5 rounded-full">Quorum </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-disabled)]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {entry.attendeesCount} attendees
              </span>
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                {completedActions}/{entry.actionItems.length} actions done
              </span>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-disabled)] shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-[var(--text-disabled)] shrink-0 mt-1" />}
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-5 border-t border-[rgba(245,240,232,0.04)]">
            {/* Key Decisions */}
            <div>
              <h3 className="text-xs font-medium text-[#B09B71] uppercase tracking-widest mb-3 pt-4">Key Decisions</h3>
              <ul className="space-y-2">
                {entry.keyDecisions.map((decision, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-body)]">
                    <ArrowRight className="w-4 h-4 text-[#B09B71] shrink-0 mt-0.5" />
                    {decision}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div>
              <h3 className="text-xs font-medium text-[#B09B71] uppercase tracking-widest mb-2">Action Items</h3>
              <div className="divide-y divide-white/[0.04]">
                {entry.actionItems.map((item, i) => (
                  <ActionItemRow key={i} item={item} onChange={(updated) => updateActionItem(i, updated)} />
                ))}
              </div>
            </div>

            {/* Notes */}
            {entry.notes && (
              <div className="p-3 rounded-xl bg-[rgba(245,240,232,0.02)] border border-[rgba(245,240,232,0.04)]">
                <p className="text-xs text-[var(--text-disabled)] italic">{entry.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AddMinutesModal({ onAdd, onClose }: { onAdd: (entry: MinutesEntry) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    attendeesCount: '',
    quorum: true,
    keyDecisions: '',
    actionItems: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) return;

    const entry: MinutesEntry = {
      id: `m_${Date.now()}`,
      date: form.date,
      title: form.title,
      attendeesCount: parseInt(form.attendeesCount) || 0,
      quorum: form.quorum,
      keyDecisions: form.keyDecisions.split('\n').filter(d => d.trim()),
      actionItems: form.actionItems.split('\n').filter(a => a.trim()).map(a => {
        const [task, assignee] = a.split('|');
        return { task: task.trim(), assignee: (assignee || 'Board').trim(), done: false };
      }),
      notes: form.notes,
    };
    onAdd(entry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="glass w-full max-w-lg rounded-xl border border-[rgba(245,240,232,0.08)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(245,240,232,0.06)]">
          <h2 className="text-base font-medium text-[var(--parchment)]">Add Meeting Minutes</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(245,240,232,0.06)] text-[var(--text-muted)] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[#B09B71]/50" required />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Attendees</label>
              <input type="number" placeholder="0" value={form.attendeesCount} onChange={e => setForm({...form, attendeesCount: e.target.value})}
                className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[#B09B71]/50" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Meeting Title</label>
            <input type="text" placeholder="April Board Meeting" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[#B09B71]/50" required />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Key Decisions (one per line)</label>
            <textarea rows={4} placeholder="Approved budget for..." value={form.keyDecisions} onChange={e => setForm({...form, keyDecisions: e.target.value})}
              className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[#B09B71]/50 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Action Items (task|assignee, one per line)</label>
            <textarea rows={3} placeholder="Send RFP|Treasurer" value={form.actionItems} onChange={e => setForm({...form, actionItems: e.target.value})}
              className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[#B09B71]/50 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Notes (optional)</label>
            <textarea rows={2} placeholder="Additional context..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[#B09B71]/50 resize-none" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="quorum" checked={form.quorum} onChange={e => setForm({...form, quorum: e.target.checked})}
              className="accent-[#B09B71]" />
            <label htmlFor="quorum" className="text-sm text-[var(--text-body)] cursor-pointer">Quorum achieved</label>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm text-[var(--text-muted)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)] transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all cursor-pointer">
              Add Minutes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MeetingMinutesPage() {
  const { isConnected } = useAccount();
  const [minutes, setMinutes] = useState<MinutesEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const isBoard = isConnected; // treat connected users as board for demo

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setMinutes(raw ? JSON.parse(raw) : SAMPLE_MINUTES);
    } catch {
      setMinutes(SAMPLE_MINUTES);
    }
  }, []);

  const save = (data: MinutesEntry[]) => {
    setMinutes(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const addMinutes = (entry: MinutesEntry) => {
    save([entry, ...minutes]);
    setShowAdd(false);
  };

  const updateEntry = (updated: MinutesEntry) => {
    save(minutes.map(m => m.id === updated.id ? updated : m));
  };

  const sorted = [...minutes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-medium text-[#D4C4A0]">Meeting Minutes</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Board meeting records and decisions</p>
        </div>
        {isBoard && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Minutes
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total Meetings', value: sorted.length, icon: '' },
          { label: 'Action Items', value: sorted.reduce((acc, m) => acc + m.actionItems.length, 0), icon: '' },
          { label: 'Completed', value: sorted.reduce((acc, m) => acc + m.actionItems.filter(a => a.done).length, 0), icon: '' },
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-xl p-4 text-center border border-[rgba(245,240,232,0.04)]">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="text-xl font-medium text-[#B09B71]">{stat.value}</div>
            <div className="text-[10px] text-[var(--text-disabled)] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div>
        {sorted.map(entry => (
          <MinutesCard key={entry.id} entry={entry} isBoard={isBoard} onUpdate={updateEntry} />
        ))}
      </div>

      {showAdd && <AddMinutesModal onAdd={addMinutes} onClose={() => setShowAdd(false)} />}
    </main>
  );
}
