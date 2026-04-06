'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, X, Bell, Filter } from 'lucide-react';
import { useIsBoard } from '@/hooks/useIsBoard';

type Carrier = 'USPS' | 'UPS' | 'FedEx' | 'Amazon' | 'DHL' | 'Other';
type PackageStatus = 'delivered' | 'held' | 'picked-up';

interface PackageEntry {
  id: string;
  tracking: string;
  carrier: Carrier;
  lot: string;
  recipient: string;
  date: string;
  status: PackageStatus;
  notified: boolean;
  notes?: string;
}

const CARRIER_COLORS: Record<Carrier, string> = {
  USPS: 'bg-[rgba(90,122,154,0.40)] text-[var(--steel)]',
  UPS: 'bg-amber-900/40 text-[#B09B71]',
  FedEx: 'bg-[rgba(90,122,154,0.25)] text-[#D4C4A0]',
  Amazon: 'bg-[rgba(176,155,113,0.25)] text-[#B09B71]',
  DHL: 'bg-[rgba(176,155,113,0.25)] text-[#B09B71]',
  Other: 'bg-[rgba(20,20,22,0.40)] text-[var(--text-body)]',
};

const STATUS_COLORS: Record<PackageStatus, string> = {
  delivered: 'bg-[rgba(42,93,79,0.40)] text-[#3A7D6F]',
  held: 'bg-amber-900/40 text-[#B09B71]',
  'picked-up': 'bg-[rgba(245,240,232,0.06)] text-[var(--text-muted)]',
};

const MOCK: PackageEntry[] = [
  { id: '1', tracking: '9400111899223456789012', carrier: 'USPS', lot: '12', recipient: 'J. Smith', date: '2026-03-26', status: 'delivered', notified: true },
  { id: '2', tracking: '1Z999AA10123456784', carrier: 'UPS', lot: '7', recipient: 'M. Johnson', date: '2026-03-26', status: 'held', notified: false },
  { id: '3', tracking: '274899689812', carrier: 'FedEx', lot: '23', recipient: 'A. Williams', date: '2026-03-25', status: 'picked-up', notified: true },
  { id: '4', tracking: 'TBA123456789000', carrier: 'Amazon', lot: '12', recipient: 'J. Smith', date: '2026-03-25', status: 'picked-up', notified: true },
];

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterLot, setFilterLot] = useState('');
  const [filterStatus, setFilterStatus] = useState<PackageStatus | 'all'>('all');
  const [myLot] = useState('12'); // simulated current user lot

  // Form state
  const [form, setForm] = useState({ tracking: '', carrier: 'USPS' as Carrier, lot: '', recipient: '', date: new Date().toISOString().split('T')[0], status: 'delivered' as PackageStatus, notes: '' });

  useEffect(() => {
    const stored = localStorage.getItem('hoa-packages');
    setPackages(stored ? JSON.parse(stored) : MOCK);
  }, []);

  const save = (updated: PackageEntry[]) => {
    setPackages(updated);
    localStorage.setItem('hoa-packages', JSON.stringify(updated));
  };

  const addPackage = () => {
    if (!form.tracking || !form.lot) return;
    const entry: PackageEntry = { ...form, id: Date.now().toString(), notified: true };
    save([entry, ...packages]);
    setShowForm(false);
    setForm({ tracking: '', carrier: 'USPS', lot: '', recipient: '', date: new Date().toISOString().split('T')[0], status: 'delivered', notes: '' });
  };

  const updateStatus = (id: string, status: PackageStatus) => {
    save(packages.map(p => p.id === id ? { ...p, status } : p));
  };

  const { isBoard } = useIsBoard();
  const visible = packages.filter(p => {
    const lotMatch = filterLot ? p.lot === filterLot : (isBoard ? true : p.lot === myLot);
    const statusMatch = filterStatus === 'all' || p.status === filterStatus;
    return lotMatch && statusMatch;
  });

  const pending = packages.filter(p => p.status !== 'picked-up').length;

  return (
    <div className="min-h-screen bg-[var(--obsidian)] p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-medium gradient-text text-[#D4C4A0] mb-2 flex items-center gap-3">
              <Package className="w-8 h-8 text-[#B09B71]" /> Package Delivery Log
            </h1>
            <p className="text-[rgba(245,240,232,0.45)]">Track deliveries for the community</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brass-deep)] text-[var(--surface-2)] font-medium hover:bg-[#B09B71] transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Package
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending Pickup', val: pending, color: 'text-[#B09B71]' },
            { label: 'Today\'s Deliveries', val: packages.filter(p => p.date === new Date().toISOString().split('T')[0]).length, color: 'text-[#B09B71]' },
            { label: 'Total Tracked', val: packages.length, color: 'text-[rgba(245,240,232,0.75)]' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.06)] rounded-xl p-4 text-center">
              <p className={`text-2xl font-medium ${color}`}>{val}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={filterLot}
              onChange={e => setFilterLot(e.target.value)}
              placeholder="Filter by lot#"
              className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.08)] rounded-lg px-3 py-1.5 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71] w-32"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'delivered', 'held', 'picked-up'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-[var(--brass-deep)] text-[var(--surface-2)]' : 'bg-[#1A1A1E] border border-[rgba(245,240,232,0.08)] text-[var(--text-body)] hover:text-[#D4C4A0]'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Packages list */}
        <div className="space-y-3">
          {visible.length === 0 && (
            <div className="text-center py-16 text-[rgba(245,240,232,0.25)]">No packages found</div>
          )}
          {visible.map(pkg => (
            <div key={pkg.id} className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.06)] rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CARRIER_COLORS[pkg.carrier]}`}>{pkg.carrier}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[pkg.status]}`}>{pkg.status}</span>
                  {!pkg.notified && <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(139,90,90,0.40)] text-[#8B5A5A] flex items-center gap-1"><Bell className="w-3 h-3" /> Notify</span>}
                </div>
                <p className="text-sm font-mono text-[#D4C4A0] truncate">{pkg.tracking}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Lot {pkg.lot} • {pkg.recipient} • {pkg.date}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {pkg.status !== 'picked-up' && (
                  <button
                    onClick={() => updateStatus(pkg.id, 'picked-up')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(42,93,79,0.30)] border border-[rgba(42,93,79,0.40)] text-[#3A7D6F] hover:bg-[rgba(42,93,79,0.50)] transition-colors"
                  >
                    Mark Picked Up
                  </button>
                )}
                {pkg.status === 'delivered' && (
                  <button
                    onClick={() => updateStatus(pkg.id, 'held')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#1A1A1E] border border-[rgba(245,240,232,0.10)] text-[var(--text-body)] hover:text-[#D4C4A0] transition-colors"
                  >
                    Mark Held
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add package modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.10)] rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-[#D4C4A0]">Log New Package</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Tracking Number *', key: 'tracking', type: 'text', placeholder: '9400111...' },
                { label: 'Recipient Name', key: 'recipient', type: 'text', placeholder: 'J. Smith' },
                { label: 'Lot Number *', key: 'lot', type: 'text', placeholder: '12' },
                { label: 'Date', key: 'date', type: 'date', placeholder: '' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-[#222228] border border-[rgba(245,240,232,0.12)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71]"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Carrier</label>
                <select value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value as Carrier })} className="w-full bg-[#222228] border border-[rgba(245,240,232,0.12)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71]">
                  {(['USPS', 'UPS', 'FedEx', 'Amazon', 'DHL', 'Other'] as Carrier[]).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as PackageStatus })} className="w-full bg-[#222228] border border-[rgba(245,240,232,0.12)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71]">
                  <option value="delivered">Delivered</option>
                  <option value="held">Held at Office</option>
                  <option value="picked-up">Picked Up</option>
                </select>
              </div>
              <button onClick={addPackage} disabled={!form.tracking || !form.lot} className="w-full py-2.5 rounded-xl bg-[var(--brass-deep)] text-[var(--surface-2)] font-medium disabled:opacity-40 hover:bg-[#B09B71] transition-colors">
                Log Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
