'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface VendorPayment {
  id: string;
  vendor: string;
  service: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid' | 'overdue';
  invoiceRef: string;
  notes?: string;
}

const STORAGE_KEY = 'faircroft_vendor_payments_v1';

const SAMPLE: VendorPayment[] = [
  { id: 'VP-001', vendor: 'GreenScape Pro', service: 'Landscaping - March', amount: 3200, date: '2026-03-31', status: 'pending', invoiceRef: 'GSP-2026-031' },
  { id: 'VP-002', vendor: 'AquaPure Pool Services', service: 'Pool maintenance - Q1', amount: 1800, date: '2026-03-15', status: 'paid', invoiceRef: 'AP-2026-Q1', notes: 'Paid via ACH' },
  { id: 'VP-003', vendor: 'SecureWatch HOA', service: 'Security monitoring - Feb', amount: 650, date: '2026-02-28', status: 'overdue', invoiceRef: 'SW-2026-002' },
  { id: 'VP-004', vendor: 'Elite Asphalt & Paving', service: 'Parking lot repair', amount: 12500, date: '2026-03-20', status: 'paid', invoiceRef: 'EAP-2026-017' },
  { id: 'VP-005', vendor: 'Sunrise Pest Control', service: 'Quarterly treatment', amount: 425, date: '2026-04-05', status: 'pending', invoiceRef: 'SPC-2026-Q2' },
];

export default function VendorPaymentsPage() {
  const { isConnected } = useAccount();
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [showForm, setShowForm] = useState(false);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'vendor'>('date');
  const [form, setForm] = useState({ vendor: '', service: '', amount: '', date: '', invoiceRef: '', notes: '' });
  const [isBoard] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setPayments(raw ? JSON.parse(raw) : SAMPLE);
  }, []);

  const save = (next: VendorPayment[]) => {
    setPayments(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const add = () => {
    if (!form.vendor || !form.service || !form.amount || !form.date || !form.invoiceRef) return;
    const p: VendorPayment = {
      id: `VP-${String(payments.length + 1).padStart(3, '0')}`,
      vendor: form.vendor,
      service: form.service,
      amount: parseFloat(form.amount),
      date: form.date,
      status: 'pending',
      invoiceRef: form.invoiceRef,
      notes: form.notes || undefined,
    };
    save([p, ...payments]);
    setForm({ vendor: '', service: '', amount: '', date: '', invoiceRef: '', notes: '' });
    setShowForm(false);
  };

  const updateStatus = (id: string, status: VendorPayment['status']) => {
    save(payments.map(p => p.id === id ? { ...p, status } : p));
  };

  const filtered = payments
    .filter(p => filter === 'all' || p.status === filter)
    .sort((a, b) => {
      if (sortField === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortField === 'amount') return b.amount - a.amount;
      return a.vendor.localeCompare(b.vendor);
    });

  const total = filtered.reduce((s, p) => s + p.amount, 0);
  const totals = {
    pending: payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    paid: payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0),
  };

  const statusColor = (s: string) => {
    if (s === 'paid') return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (s === 'overdue') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  };

  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-gray-400 mb-4">Board access required</p>
      <ConnectButton label="Sign In" />
    </div>
  );

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Vendor Payments</h1>
          <p className="text-sm text-gray-400 mt-1">Track contractor and vendor invoices</p>
        </div>
        {isBoard && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-medium transition-all shrink-0">
            {showForm ? '← Back' : '+ Add Payment'}
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', amount: totals.pending, color: 'text-yellow-400' },
          { label: 'Paid', amount: totals.paid, color: 'text-green-400' },
          { label: 'Overdue', amount: totals.overdue, color: 'text-red-400' },
        ].map(({ label, amount, color }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>${amount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-6 space-y-4 mb-6">
          <h2 className="text-lg font-semibold">Add Vendor Payment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Vendor Name</label>
              <input value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})}
                placeholder="Company name" className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Service / Description</label>
              <input value={form.service} onChange={e => setForm({...form, service: e.target.value})}
                placeholder="Landscaping - March 2026" className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Amount ($)</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Due Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Invoice Reference</label>
              <input value={form.invoiceRef} onChange={e => setForm({...form, invoiceRef: e.target.value})}
                placeholder="INV-2026-001" className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Optional" className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors">Cancel</button>
            <button onClick={add} disabled={!form.vendor || !form.service || !form.amount || !form.date || !form.invoiceRef}
              className="flex-1 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-medium transition-all">
              Add Payment
            </button>
          </div>
        </div>
      )}

      {/* Filters + Sort */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {(['all', 'pending', 'paid', 'overdue'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
            {f}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <span className="text-xs text-gray-500 self-center">Sort:</span>
          {(['date', 'amount', 'vendor'] as const).map(s => (
            <button key={s} onClick={() => setSortField(s)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${sortField === s ? 'text-[#c9a96e]' : 'text-gray-500'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Service</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Invoice</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                {isBoard && <th className="px-4 py-3 text-xs font-medium text-gray-500">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.vendor}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px] truncate">{p.service}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{p.invoiceRef}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#c9a96e]">${p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor(p.status)}`}>
                      {p.status === 'paid' ? '✅ Paid' : p.status === 'overdue' ? '⚠️ Overdue' : '⏳ Pending'}
                    </span>
                  </td>
                  {isBoard && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {p.status !== 'paid' && (
                          <button onClick={() => updateStatus(p.id, 'paid')}
                            className="px-2 py-1 rounded text-[10px] border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">
                            Mark Paid
                          </button>
                        )}
                        {p.status === 'pending' && (
                          <button onClick={() => updateStatus(p.id, 'overdue')}
                            className="px-2 py-1 rounded text-[10px] border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                            Overdue
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-800 bg-gray-900/30">
                <td colSpan={3} className="px-4 py-3 text-xs font-medium text-gray-400">Total ({filtered.length} items)</td>
                <td className="px-4 py-3 text-right font-bold text-[#c9a96e]">${total.toLocaleString()}</td>
                <td colSpan={isBoard ? 3 : 2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
