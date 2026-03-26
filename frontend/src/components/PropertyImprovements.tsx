'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Hammer, TrendingUp, Share2 } from 'lucide-react';

type ImprovementCategory = 'Kitchen' | 'Bath' | 'Exterior' | 'Landscape' | 'Other';

interface Improvement {
  id: string;
  project: string;
  date: string;
  cost: number;
  category: ImprovementCategory;
  beforeDesc: string;
  afterDesc: string;
  createdAt: string;
}

const STORAGE_KEY = 'hoa_improvements';

const CATEGORY_ICONS: Record<ImprovementCategory, string> = {
  Kitchen: '🍳',
  Bath: '🛁',
  Exterior: '🏠',
  Landscape: '🌿',
  Other: '🔧',
};

const SAMPLE_IMPROVEMENTS: Improvement[] = [
  {
    id: 'i1',
    project: 'Kitchen Renovation',
    date: '2025-11-15',
    cost: 18500,
    category: 'Kitchen',
    beforeDesc: 'Original 1990s cabinetry, laminate counters, old appliances',
    afterDesc: 'Custom shaker cabinets, quartz counters, stainless steel appliances',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'i2',
    project: 'Master Bath Remodel',
    date: '2025-08-20',
    cost: 9800,
    category: 'Bath',
    beforeDesc: 'Dated tile, single vanity, old fixtures',
    afterDesc: 'Walk-in shower, double vanity, heated tile floors',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'i3',
    project: 'Driveway Repaving',
    date: '2025-06-10',
    cost: 4200,
    category: 'Exterior',
    beforeDesc: 'Cracked 20-year-old asphalt',
    afterDesc: 'Fresh concrete with decorative border',
    createdAt: new Date(Date.now() - 150 * 86400000).toISOString(),
  },
];

function AddImprovementModal({ onAdd, onClose }: { onAdd: (i: Improvement) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    project: '',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    category: 'Kitchen' as ImprovementCategory,
    beforeDesc: '',
    afterDesc: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project) return;
    onAdd({
      id: `i_${Date.now()}`,
      project: form.project,
      date: form.date,
      cost: parseFloat(form.cost) || 0,
      category: form.category,
      beforeDesc: form.beforeDesc,
      afterDesc: form.afterDesc,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="glass w-full max-w-md rounded-2xl border border-white/[0.08] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-base font-bold text-gray-100">Log Improvement</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-400 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1 block">Project Name *</label>
            <input value={form.project} onChange={e => setForm({...form, project: e.target.value})} placeholder="Kitchen Renovation" required
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-200 focus:outline-none focus:border-[#c9a96e]/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-200 focus:outline-none focus:border-[#c9a96e]/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Cost ($)</label>
              <input type="number" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} placeholder="5000"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-200 focus:outline-none focus:border-[#c9a96e]/50" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1 block">Category</label>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.entries(CATEGORY_ICONS) as [ImprovementCategory, string][]).map(([cat, icon]) => (
                <button key={cat} type="button" onClick={() => setForm({...form, category: cat})}
                  className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
                    form.category === cat ? 'bg-[#c9a96e]/15 border border-[#c9a96e]/30' : 'bg-white/[0.02] border border-white/[0.04]'
                  }`}>
                  <div className="text-lg">{icon}</div>
                  <div className={`text-[9px] mt-0.5 ${form.category === cat ? 'text-[#c9a96e]' : 'text-gray-600'}`}>{cat}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1 block">Before Description</label>
            <textarea rows={2} value={form.beforeDesc} onChange={e => setForm({...form, beforeDesc: e.target.value})} placeholder="Original condition..."
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-200 focus:outline-none focus:border-[#c9a96e]/50 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1 block">After Description</label>
            <textarea rows={2} value={form.afterDesc} onChange={e => setForm({...form, afterDesc: e.target.value})} placeholder="Improvements made..."
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-200 focus:outline-none focus:border-[#c9a96e]/50 resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-gray-400 cursor-pointer">Cancel</button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-semibold cursor-pointer">Add Project</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PropertyImprovements() {
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setImprovements(raw ? JSON.parse(raw) : SAMPLE_IMPROVEMENTS);
    } catch {
      setImprovements(SAMPLE_IMPROVEMENTS);
    }
  }, []);

  const save = (data: Improvement[]) => {
    setImprovements(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const addImprovement = (item: Improvement) => {
    save([item, ...improvements]);
    setShowAdd(false);
  };

  const totalInvested = improvements.reduce((acc, i) => acc + i.cost, 0);
  const sorted = [...improvements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleShare = () => {
    const summary = improvements.map(i =>
      `• ${i.project} (${new Date(i.date).getFullYear()}): $${i.cost.toLocaleString()}`
    ).join('\n');
    const text = `🏠 Home Improvement Log\nTotal Invested: $${totalInvested.toLocaleString()}\n\n${summary}\n\n#SuvrenHOA`;
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/[0.04]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c9a96e]/15 flex items-center justify-center">
            <Hammer className="w-5 h-5 text-[#c9a96e]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-100">Property Improvements</h3>
            <p className="text-xs text-gray-500">Track your home investments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-[#c9a96e] cursor-pointer" title="Share log">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c9a96e]/15 text-[#c9a96e] text-xs font-semibold border border-[#c9a96e]/25 hover:bg-[#c9a96e]/25 transition-all cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Total Invested */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#c9a96e]/[0.06] border border-[#c9a96e]/15 mb-4">
        <TrendingUp className="w-5 h-5 text-[#c9a96e]" />
        <div>
          <div className="text-xs text-gray-500">Total Invested</div>
          <div className="text-xl font-bold text-[#c9a96e]">${totalInvested.toLocaleString()}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-gray-500">{improvements.length} projects</div>
          <div className="text-xs text-green-400">Est. +{((totalInvested * 0.7 / 447000) * 100).toFixed(1)}% value</div>
        </div>
      </div>

      {/* Improvements List */}
      <div className="space-y-2">
        {sorted.slice(0, 5).map(item => (
          <div key={item.id} className="rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              className="w-full flex items-center gap-3 p-3 text-left cursor-pointer hover:bg-white/[0.02]"
            >
              <span className="text-lg">{CATEGORY_ICONS[item.category]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-200 truncate">{item.project}</div>
                <div className="text-[11px] text-gray-500">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} · {item.category}
                </div>
              </div>
              <span className="text-sm font-bold text-[#c9a96e] shrink-0">${item.cost.toLocaleString()}</span>
            </button>
            {expanded === item.id && (
              <div className="px-4 pb-4 space-y-2 border-t border-white/[0.04]">
                {item.beforeDesc && (
                  <div className="pt-3">
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Before</span>
                    <p className="text-xs text-gray-400 mt-0.5">{item.beforeDesc}</p>
                  </div>
                )}
                {item.afterDesc && (
                  <div>
                    <span className="text-[10px] font-bold text-[#c9a96e] uppercase">After</span>
                    <p className="text-xs text-gray-400 mt-0.5">{item.afterDesc}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {improvements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-2xl mb-2">🔧</p>
            <p className="text-xs">No improvements logged yet</p>
          </div>
        )}
      </div>

      {showAdd && <AddImprovementModal onAdd={addImprovement} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
