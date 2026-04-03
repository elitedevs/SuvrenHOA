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
    if (s === 'paid') return 'bg-[rgba(42,93,79,0.10)] text-[#3A7D6F] border-[rgba(42,93,79,0.20)]';
    if (s === 'overdue') return 'bg-[rgba(107,58,58,0.10)] text-[#8B5A5A] border-[rgba(107,58,58,0.20)]';
    return 'bg-[rgba(176,155,113,0.10)] text-[#B09B71] border-[rgba(176,155,113,0.20)]';
  };

  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-[var(--text-muted)] mb-4">Board access required</p>
      <ConnectButton label="Sign In" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">Vendor Payments</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Track contractor and vendor invoices</p>
        </div>
        {isBoard && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all shrink-0">
            {showForm ? '← Back' : '+ Add Payment'}
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', amount: totals.pending, color: 'text-[#B09B71]' },
          { label: 'Paid', amount: totals.paid, color: 'text-[#3A7D6F]' },
          { label: 'Overdue', amount: totals.overdue, color: 'text-[#8B5A5A]' },
        ].map(({ label, amount, color }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
            <p className={`text-lg font-medium ${color}`}>${amount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-6 space-y-4 mb-6">
          <h2 className="text-lg font-medium">Add Vendor Payment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Vendor Name</label>
              <input value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})}
                placeholder="Company name" className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Service / Description</label>
              <input value={form.service} onChange={e => setForm({...form, service: e.target.value})}
                placeholder="Landscaping - March 2026" className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Amount ($)</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Due Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Invoice Reference</label>
              <input value={form.invoiceRef} onChange={e => setForm({...form, invoiceRef: e.target.value})}
                placeholder="INV-2026-001" className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Optional" className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[rgba(176,155,113,0.50)] focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
            <button onClick={add} disabled={!form.vendor || !form.service || !form.amount || !form.date || !form.invoiceRef}
              className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all">
              Add Payment
            </button>
          </div>
        </div>
      )}

      {/* Filters + Sort */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {(['all', 'pending', 'paid', 'overdue'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]' : 'glass-card text-[var(--text-muted)]'}`}>
            {f}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <span className="text-xs text-[var(--text-disabled)] self-center">Sort:</span>
          {(['date', 'amount', 'vendor'] as const).map(s => (
            <button key={s} onClick={() => setSortField(s)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${sortField === s ? 'text-[#B09B71]' : 'text-[var(--text-disabled)]'}`}>
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
              <tr className="border-b border-[rgba(245,240,232,0.06)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-disabled)]">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-disabled)]">Service</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-disabled)]">Invoice</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--text-disabled)]">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-disabled)]">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-disabled)]">Status</th>
                {isBoard && <th className="px-4 py-3 text-xs font-medium text-[var(--text-disabled)]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-[rgba(245,240,232,0.04)] hover:bg-[rgba(245,240,232,0.04)] transition-colors">
                  <td className="px-4 py-3 font-medium">{p.vendor}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs max-w-[160px] truncate">{p.service}</td>
                  <td className="px-4 py-3 text-[var(--text-disabled)] text-xs font-mono">{p.invoiceRef}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#B09B71]">${p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{p.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor(p.status)}`}>
                      {p.status === 'paid' ? 'Paid' : p.status === 'overdue' ? 'Overdue' : 'Pending'}
                    </span>
                  </td>
                  {isBoard && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {p.status !== 'paid' && (
                          <button onClick={() => updateStatus(p.id, 'paid')}
                            className="px-2 py-1 rounded text-[10px] border border-[rgba(42,93,79,0.25)] text-[#3A7D6F] hover:bg-[rgba(42,93,79,0.10)] transition-colors">
                            Mark Paid
                          </button>
                        )}
                        {p.status === 'pending' && (
                          <button onClick={() => updateStatus(p.id, 'overdue')}
                            className="px-2 py-1 rounded text-[10px] border border-[rgba(107,58,58,0.25)] text-[#8B5A5A] hover:bg-[rgba(107,58,58,0.10)] transition-colors">
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
              <tr className="border-t border-[rgba(245,240,232,0.06)] bg-[rgba(20,20,22,0.30)]">
                <td colSpan={3} className="px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Total ({filtered.length} items)</td>
                <td className="px-4 py-3 text-right font-medium text-[#B09B71]">${total.toLocaleString()}</td>
                <td colSpan={isBoard ? 3 : 2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
