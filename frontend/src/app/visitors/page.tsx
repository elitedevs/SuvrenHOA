'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Plus, X, Clock, CheckCircle, History, Copy } from 'lucide-react';

interface Visitor {
  id: string;
  name: string;
  date: string;
  duration: string;
  vehicle: string;
  purpose: string;
  hostLot: string;
  passCode: string;
  active: boolean;
  createdAt: string;
}

function generatePass(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const MOCK_VISITORS: Visitor[] = [
  { id: '1', name: 'Mike Delivery Co.', date: '2026-03-26', duration: '2 hours', vehicle: 'White Van, FL-ABC-123', purpose: 'Furniture Delivery', hostLot: '12', passCode: 'FRCF7K', active: true, createdAt: '2026-03-26T09:00:00Z' },
  { id: '2', name: 'Sarah Chen', date: '2026-03-26', duration: 'All day', vehicle: 'Blue Honda Civic, FL-XYZ-789', purpose: 'Family visit', hostLot: '7', passCode: 'BQVP4R', active: true, createdAt: '2026-03-26T08:30:00Z' },
  { id: '3', name: 'Pool Maintenance', date: '2026-03-25', duration: '3 hours', vehicle: 'Green Truck, FL-MNT-456', purpose: 'Pool service', hostLot: 'Common', passCode: 'TM8XN2', active: false, createdAt: '2026-03-25T10:00:00Z' },
];

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', date: '', duration: '2 hours', vehicle: '', purpose: '', hostLot: '' });
  const [newPass, setNewPass] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('hoa-visitors');
    setVisitors(stored ? JSON.parse(stored) : MOCK_VISITORS);
  }, []);

  const save = (updated: Visitor[]) => {
    setVisitors(updated);
    localStorage.setItem('hoa-visitors', JSON.stringify(updated));
  };

  const addVisitor = () => {
    if (!form.name || !form.date || !form.hostLot) return;
    const passCode = generatePass();
    const v: Visitor = {
      ...form,
      id: Date.now().toString(),
      passCode,
      active: true,
      createdAt: new Date().toISOString(),
    };
    save([v, ...visitors]);
    setNewPass(passCode);
    setShowForm(false);
    setForm({ name: '', date: '', duration: '2 hours', vehicle: '', purpose: '', hostLot: '' });
  };

  const deactivate = (id: string) => {
    save(visitors.map(v => v.id === id ? { ...v, active: false } : v));
  };

  const copyPass = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const active = visitors.filter(v => v.active);
  const history = visitors.filter(v => !v.active);

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.005_60)] p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#e8d5a3] mb-2 flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-[#c9a96e]" /> Visitor Management
            </h1>
            <p className="text-[oklch(0.50_0.01_60)]">Register expected visitors and generate access passes</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b8942e] text-[#1a1a1a] font-semibold hover:bg-[#c9a96e] transition-colors">
            <Plus className="w-4 h-4" /> Register Visitor
          </button>
        </div>

        {/* New pass notification */}
        {newPass && (
          <div className="mb-6 p-5 rounded-xl border border-green-600/40 bg-green-950/20 flex items-center justify-between">
            <div>
              <p className="text-green-400 font-semibold text-sm mb-1"> Visitor Registered — Pass Code Generated</p>
              <p className="font-mono text-3xl text-[#e8d5a3] font-bold tracking-widest">{newPass}</p>
              <p className="text-xs text-[oklch(0.45_0.01_60)] mt-1">Share this code with your visitor for gate entry</p>
            </div>
            <button onClick={() => setNewPass(null)}><X className="w-4 h-4 text-[oklch(0.45_0.01_60)]" /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#c9a96e]">{active.length}</p>
            <p className="text-xs text-[oklch(0.45_0.01_60)] mt-1">Active Passes Today</p>
          </div>
          <div className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[oklch(0.65_0.01_60)]">{history.length}</p>
            <p className="text-xs text-[oklch(0.45_0.01_60)] mt-1">Past Visitors</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 p-1 bg-[oklch(0.10_0.005_60)] rounded-xl border border-[oklch(0.18_0.005_60)] w-fit">
          {([['active', 'Active Passes', Clock], ['history', 'Past Visitors', History]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-[#b8942e] text-[#1a1a1a]' : 'text-[oklch(0.55_0.01_60)] hover:text-[#e8d5a3]'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {(tab === 'active' ? active : history).map(v => (
            <div key={v.id} className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-[#e8d5a3]">{v.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${v.active ? 'bg-green-900/40 text-green-300' : 'bg-[oklch(0.15_0.005_60)] text-[oklch(0.40_0.01_60)]'}`}>
                      {v.active ? 'Active' : 'Expired'}
                    </span>
                  </div>
                  <p className="text-xs text-[oklch(0.45_0.01_60)]">{v.date} • {v.duration} • Lot {v.hostLot}</p>
                  <p className="text-xs text-[oklch(0.45_0.01_60)]">{v.vehicle}</p>
                  <p className="text-xs text-[oklch(0.55_0.01_60)] mt-1 italic">{v.purpose}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold tracking-widest text-[#c9a96e]">{v.passCode}</span>
                    <button onClick={() => copyPass(v.id, v.passCode)} className="p-1.5 rounded-lg text-[oklch(0.45_0.01_60)] hover:text-[#c9a96e] transition-colors">
                      {copiedId === v.id ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {v.active && (
                    <button onClick={() => deactivate(v.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-700/30 text-red-400 hover:bg-red-900/40 transition-colors">
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(tab === 'active' ? active : history).length === 0 && (
            <div className="text-center py-16 text-[oklch(0.40_0.01_60)]">No {tab === 'active' ? 'active passes' : 'past visitors'}</div>
          )}
        </div>
      </div>

      {/* Add visitor modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[oklch(0.12_0.005_60)] border border-[oklch(0.22_0.005_60)] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[#e8d5a3]">Register Visitor</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-[oklch(0.45_0.01_60)]" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Visitor Name *', key: 'name', type: 'text', placeholder: 'Jane Doe' },
                { label: 'Visit Date *', key: 'date', type: 'date', placeholder: '' },
                { label: 'Vehicle Info', key: 'vehicle', type: 'text', placeholder: 'Red Toyota Camry, FL-123-ABC' },
                { label: 'Purpose', key: 'purpose', type: 'text', placeholder: 'Family gathering' },
                { label: 'Your Lot # *', key: 'hostLot', type: 'text', placeholder: '12' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1">{label}</label>
                  <input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#e8d5a3] focus:outline-none focus:border-[#c9a96e]" />
                </div>
              ))}
              <div>
                <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1">Duration</label>
                <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#e8d5a3] focus:outline-none focus:border-[#c9a96e]">
                  {['1 hour', '2 hours', '4 hours', 'All day', '2 days', 'Weekend', '1 week'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <button onClick={addVisitor} disabled={!form.name || !form.date || !form.hostLot} className="w-full py-2.5 rounded-xl bg-[#b8942e] text-[#1a1a1a] font-semibold disabled:opacity-40 hover:bg-[#c9a96e] transition-colors">
                Generate Pass & Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
