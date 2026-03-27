'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface ReimbursementRequest {
  id: string;
  submittedBy: string;
  amount: number;
  category: string;
  description: string;
  receiptRef: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  submittedAt: string;
  reviewedAt?: string;
  notes?: string;
}

const CATEGORIES = [
  { id: 'supplies', label: 'Office / Supplies', icon: '📦' },
  { id: 'landscaping', label: 'Landscaping Materials', icon: '🌿' },
  { id: 'maintenance', label: 'Maintenance Supplies', icon: '🔧' },
  { id: 'events', label: 'Community Events', icon: '🎉' },
  { id: 'printing', label: 'Printing / Postage', icon: '📮' },
  { id: 'emergency', label: 'Emergency Repairs', icon: '🚨' },
  { id: 'other', label: 'Other (Pre-Approved)', icon: '📋' },
];

const STATUS_STYLES = {
  pending: { label: 'Pending Review', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  approved: { label: 'Approved', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  paid: { label: 'Paid', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  rejected: { label: 'Rejected', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

const LS_KEY = 'suvren_reimbursements';

function loadRequests(): ReimbursementRequest[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function saveRequests(requests: ReimbursementRequest[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(requests));
}

const SAMPLE_REQUESTS: ReimbursementRequest[] = [
  { id: '1', submittedBy: '0x1234...abcd', amount: 4750, category: 'supplies', description: 'Office supplies for board meetings Q1: paper, printer ink, folders', receiptRef: 'RCPT-2026-001', status: 'paid', submittedAt: '2026-03-01T10:00:00Z', reviewedAt: '2026-03-05T14:00:00Z', notes: 'Approved — under $100 threshold' },
  { id: '2', submittedBy: '0x1234...abcd', amount: 12000, category: 'events', description: 'Spring Community BBQ supplies — plates, napkins, condiments', receiptRef: 'RCPT-2026-014', status: 'approved', submittedAt: '2026-03-20T09:30:00Z', reviewedAt: '2026-03-22T11:00:00Z' },
];

export default function ReimbursementPage() {
  const { isConnected, address } = useAccount();
  const [requests, setRequests] = useState<ReimbursementRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine');

  useEffect(() => {
    const stored = loadRequests();
    setRequests(stored.length > 0 ? stored : SAMPLE_REQUESTS);
  }, []);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to submit reimbursement requests</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const myRequests = requests.filter(r => r.submittedBy === address || r.submittedBy.startsWith(address?.slice(0, 8) || '___'));
  const displayRequests = activeTab === 'mine' ? myRequests : requests;

  const handleSubmit = (req: Omit<ReimbursementRequest, 'id' | 'submittedAt' | 'submittedBy' | 'status'>) => {
    const newReq: ReimbursementRequest = {
      ...req,
      id: crypto.randomUUID(),
      submittedBy: address || '0x0000',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    const updated = [newReq, ...requests];
    saveRequests(updated);
    setRequests(updated);
    setShowForm(false);
    setActiveTab('mine');
  };

  const totalMine = myRequests.reduce((sum, r) => sum + (r.status !== 'rejected' ? r.amount : 0), 0);
  const paidMine = myRequests.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
  const pendingMine = myRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">💰 Expense Reimbursement</h1>
          <p className="text-sm text-gray-400 mt-1">Submit and track expense reimbursement requests</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-medium transition-all shrink-0"
        >
          {showForm ? '← Back' : '+ New Request'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-gray-100">${(totalMine / 100).toFixed(2)}</div>
          <div className="text-[10px] text-gray-500">Total Submitted</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-green-400">${(paidMine / 100).toFixed(2)}</div>
          <div className="text-[10px] text-gray-500">Paid Out</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-yellow-400">${(pendingMine / 100).toFixed(2)}</div>
          <div className="text-[10px] text-gray-500">Pending</div>
        </div>
      </div>

      {showForm ? (
        <ReimbursementForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab('mine')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${activeTab === 'mine' ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
              My Requests ({myRequests.length})
            </button>
            <button onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${activeTab === 'all' ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
              All Requests ({requests.length})
            </button>
          </div>

          {/* Policy note */}
          <div className="p-3 rounded-xl bg-[#c9a96e]/5 border border-[#c9a96e]/15 mb-5">
            <p className="text-[11px] text-gray-400">
              <span className="text-[#c9a96e] font-medium">📋 Policy:</span>{' '}
              Reimbursements require pre-approval for expenses over $150. Keep original receipts for 3 years. Requests must be submitted within 60 days of purchase. For emergency expenses, notify the board within 24 hours.
            </p>
          </div>

          {displayRequests.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-4xl mb-3">📋</p>
              <h3 className="font-medium mb-1">No requests yet</h3>
              <p className="text-sm text-gray-400">Submit your first reimbursement request above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayRequests
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                .map(r => <RequestCard key={r.id} request={r} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RequestCard({ request: r }: { request: ReimbursementRequest }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES.find(c => c.id === r.category);
  const statusStyle = STATUS_STYLES[r.status];

  return (
    <div className="glass-card rounded-xl hover-lift overflow-hidden cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs text-gray-500">{r.receiptRef}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusStyle.color}`}>
                {statusStyle.label}
              </span>
              <span className="text-[10px] text-gray-500">{cat?.icon} {cat?.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-[#c9a96e]">${(r.amount / 100).toFixed(2)}</span>
              <p className="text-sm text-gray-300 truncate">{r.description}</p>
            </div>
            <p className="text-[10px] text-gray-600 mt-1">
              Submitted {new Date(r.submittedAt).toLocaleDateString()}
              {r.reviewedAt && ` · Reviewed ${new Date(r.reviewedAt).toLocaleDateString()}`}
            </p>
          </div>
          <span className={`text-gray-500 transition-transform text-sm ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <p className="text-sm text-gray-400 leading-relaxed">{r.description}</p>
            <p className="text-xs text-gray-500">Submitted by: {r.submittedBy.slice(0, 16)}...</p>
            {r.notes && (
              <p className="text-xs text-gray-400 italic border-l-2 border-[#c9a96e]/30 pl-3">{r.notes}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReimbursementForm({ onSubmit, onCancel }: {
  onSubmit: (r: Omit<ReimbursementRequest, 'id' | 'submittedAt' | 'submittedBy' | 'status'>) => void;
  onCancel: () => void;
}) {
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [receiptRef, setReceiptRef] = useState('');

  const handleSubmit = () => {
    const amount = Math.round(parseFloat(amountStr) * 100);
    if (!amount || !category || !description.trim() || !receiptRef.trim()) return;
    onSubmit({ amount, category, description, receiptRef });
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-5 max-w-2xl">
      <h2 className="text-lg font-semibold">New Reimbursement Request</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount ($) *</label>
          <input type="number" value={amountStr} onChange={e => setAmountStr(e.target.value)}
            placeholder="0.00" step="0.01" min="0"
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none">
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Receipt Reference # *</label>
        <input value={receiptRef} onChange={e => setReceiptRef(e.target.value)} placeholder="e.g., RCPT-2026-042 or store receipt number"
          className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Description *</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="What was purchased? Why was it needed? How does it benefit the community?"
          rows={4} className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none resize-none" />
      </div>

      {parseFloat(amountStr) > 150 && (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
          ⚠️ Expenses over $150 require prior board approval. If this was not pre-approved, your request may be rejected.
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={!amountStr || !category || !description.trim() || !receiptRef.trim()}
          className="flex-1 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-medium transition-all">
          Submit Request
        </button>
      </div>
    </div>
  );
}
