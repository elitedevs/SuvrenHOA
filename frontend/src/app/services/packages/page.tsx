'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, X, Bell, Filter } from 'lucide-react';

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
  USPS: 'bg-blue-900/40 text-blue-300',
  UPS: 'bg-amber-900/40 text-amber-300',
  FedEx: 'bg-purple-900/40 text-purple-300',
  Amazon: 'bg-orange-900/40 text-orange-300',
  DHL: 'bg-yellow-900/40 text-yellow-300',
  Other: 'bg-gray-900/40 text-gray-300',
};

const STATUS_COLORS: Record<PackageStatus, string> = {
  delivered: 'bg-green-900/40 text-green-300',
  held: 'bg-amber-900/40 text-amber-300',
  'picked-up': 'bg-[oklch(0.18_0.005_60)] text-[oklch(0.45_0.01_60)]',
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

  const isBoard = true; // TODO: connect to auth
  const visible = packages.filter(p => {
    const lotMatch = filterLot ? p.lot === filterLot : (isBoard ? true : p.lot === myLot);
    const statusMatch = filterStatus === 'all' || p.status === filterStatus;
    return lotMatch && statusMatch;
  });

  const pending = packages.filter(p => p.status !== 'picked-up').length;

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.005_60)] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#e8d5a3] mb-2 flex items-center gap-3">
              <Package className="w-8 h-8 text-[#c9a96e]" /> Package Delivery Log
            </h1>
            <p className="text-[oklch(0.50_0.01_60)]">Track deliveries for the community</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b8942e] text-[#1a1a1a] font-semibold hover:bg-[#c9a96e] transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Package
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending Pickup', val: pending, color: 'text-amber-400' },
            { label: 'Today\'s Deliveries', val: packages.filter(p => p.date === new Date().toISOString().split('T')[0]).length, color: 'text-[#c9a96e]' },
            { label: 'Total Tracked', val: packages.length, color: 'text-[oklch(0.65_0.01_60)]' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-[oklch(0.45_0.01_60)] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[oklch(0.45_0.01_60)]" />
            <input
              value={filterLot}
              onChange={e => setFilterLot(e.target.value)}
              placeholder="Filter by lot#"
              className="bg-[oklch(0.12_0.005_60)] border border-[oklch(0.20_0.005_60)] rounded-lg px-3 py-1.5 text-sm text-[#e8d5a3] focus:outline-none focus:border-[#c9a96e] w-32"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'delivered', 'held', 'picked-up'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-[#b8942e] text-[#1a1a1a]' : 'bg-[oklch(0.12_0.005_60)] border border-[oklch(0.20_0.005_60)] text-[oklch(0.55_0.01_60)] hover:text-[#e8d5a3]'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Packages list */}
        <div className="space-y-3">
          {visible.length === 0 && (
            <div className="text-center py-16 text-[oklch(0.40_0.01_60)]">No packages found</div>
          )}
          {visible.map(pkg => (
            <div key={pkg.id} className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CARRIER_COLORS[pkg.carrier]}`}>{pkg.carrier}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[pkg.status]}`}>{pkg.status}</span>
                  {!pkg.notified && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-300 flex items-center gap-1"><Bell className="w-3 h-3" /> Notify</span>}
                </div>
                <p className="text-sm font-mono text-[#e8d5a3] truncate">{pkg.tracking}</p>
                <p className="text-xs text-[oklch(0.45_0.01_60)] mt-0.5">Lot {pkg.lot} • {pkg.recipient} • {pkg.date}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {pkg.status !== 'picked-up' && (
                  <button
                    onClick={() => updateStatus(pkg.id, 'picked-up')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-900/30 border border-green-700/40 text-green-400 hover:bg-green-900/50 transition-colors"
                  >
                    Mark Picked Up
                  </button>
                )}
                {pkg.status === 'delivered' && (
                  <button
                    onClick={() => updateStatus(pkg.id, 'held')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[oklch(0.14_0.005_60)] border border-[oklch(0.22_0.005_60)] text-[oklch(0.55_0.01_60)] hover:text-[#e8d5a3] transition-colors"
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
          <div className="bg-[oklch(0.12_0.005_60)] border border-[oklch(0.22_0.005_60)] rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[#e8d5a3]">Log New Package</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-[oklch(0.45_0.01_60)]" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Tracking Number *', key: 'tracking', type: 'text', placeholder: '9400111...' },
                { label: 'Recipient Name', key: 'recipient', type: 'text', placeholder: 'J. Smith' },
                { label: 'Lot Number *', key: 'lot', type: 'text', placeholder: '12' },
                { label: 'Date', key: 'date', type: 'date', placeholder: '' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#e8d5a3] focus:outline-none focus:border-[#c9a96e]"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1">Carrier</label>
                <select value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value as Carrier })} className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#e8d5a3] focus:outline-none focus:border-[#c9a96e]">
                  {(['USPS', 'UPS', 'FedEx', 'Amazon', 'DHL', 'Other'] as Carrier[]).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as PackageStatus })} className="w-full bg-[oklch(0.16_0.005_60)] border border-[oklch(0.24_0.005_60)] rounded-lg px-3 py-2 text-sm text-[#e8d5a3] focus:outline-none focus:border-[#c9a96e]">
                  <option value="delivered">Delivered</option>
                  <option value="held">Held at Office</option>
                  <option value="picked-up">Picked Up</option>
                </select>
              </div>
              <button onClick={addPackage} disabled={!form.tracking || !form.lot} className="w-full py-2.5 rounded-xl bg-[#b8942e] text-[#1a1a1a] font-semibold disabled:opacity-40 hover:bg-[#c9a96e] transition-colors">
                Log Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
