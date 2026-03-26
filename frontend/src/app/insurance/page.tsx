'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Shield, Plus, Edit2, Trash2, AlertTriangle, CheckCircle, Clock,
  DollarSign, Calendar, Building2, X, ChevronDown, ChevronUp,
} from 'lucide-react';

interface Policy {
  id: string;
  name: string;
  provider: string;
  coverageAmount: number;
  premium: number;
  renewalDate: string;
  status: 'active' | 'expiring' | 'expired';
  policyNumber: string;
  notes: string;
}

const DEMO_POLICIES: Policy[] = [
  {
    id: '1',
    name: 'Community General Liability',
    provider: 'Nationwide Insurance',
    coverageAmount: 2000000,
    premium: 4800,
    renewalDate: '2026-06-30',
    status: 'active',
    policyNumber: 'NW-HOA-2024-0042',
    notes: 'Covers common areas, board member liability, and property damage',
  },
  {
    id: '2',
    name: 'Directors & Officers (D&O)',
    provider: 'Hartford Financial',
    coverageAmount: 1000000,
    premium: 2200,
    renewalDate: '2026-04-15',
    status: 'expiring',
    policyNumber: 'HF-DO-2024-7813',
    notes: 'Protects board members from personal liability in governance decisions',
  },
  {
    id: '3',
    name: 'Community Property Insurance',
    provider: 'State Farm',
    coverageAmount: 5000000,
    premium: 8400,
    renewalDate: '2026-12-01',
    status: 'active',
    policyNumber: 'SF-PROP-2025-3310',
    notes: 'Covers clubhouse, pool, fences, and shared infrastructure',
  },
  {
    id: '4',
    name: 'Workers Compensation',
    provider: 'Liberty Mutual',
    coverageAmount: 500000,
    premium: 1600,
    renewalDate: '2026-03-01',
    status: 'expired',
    policyNumber: 'LM-WC-2024-9901',
    notes: 'Renewal quote pending from Liberty Mutual',
  },
];

const STATUS_CONFIG = {
  active: { label: 'Active', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  expiring: { label: 'Expiring Soon', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  expired: { label: 'Expired', icon: X, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function PolicyCard({ policy, onEdit, onDelete }: { policy: Policy; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[policy.status];
  const Icon = cfg.icon;
  const days = daysUntil(policy.renewalDate);

  return (
    <div className={`glass-card rounded-xl border ${cfg.border} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${cfg.bg} border ${cfg.border} shrink-0`}>
              <Shield className={`w-5 h-5 ${cfg.color}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm">{policy.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{policy.provider} · {policy.policyNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-500 hover:text-[#c9a96e] hover:bg-[#c9a96e]/10 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Coverage</p>
            <p className="text-sm font-bold text-[#c9a96e]">{formatCurrency(policy.coverageAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Annual Premium</p>
            <p className="text-sm font-bold text-white">{formatCurrency(policy.premium)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Renewal</p>
            <p className="text-sm font-bold text-white">{new Date(policy.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </div>
          {days > 0 && days < 90 && (
            <div className={`text-xs font-medium ${days < 30 ? 'text-red-400' : 'text-yellow-400'}`}>
              Renews in {days} days
            </div>
          )}
          {days <= 0 && <div className="text-xs font-medium text-red-400">Expired {Math.abs(days)} days ago</div>}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-gray-400">{policy.notes}</p>
            {days > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Renewal countdown</span>
                  <span>{days} days remaining</span>
                </div>
                <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${days < 30 ? 'bg-red-500' : days < 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, (365 - days) / 365 * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PolicyModal({ policy, onSave, onClose }: { policy: Partial<Policy>; onSave: (p: Policy) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Policy>>({
    status: 'active',
    ...policy,
  });

  const set = (k: keyof Policy, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name || !form.provider || !form.renewalDate) return;
    onSave({
      id: form.id ?? Date.now().toString(),
      name: form.name ?? '',
      provider: form.provider ?? '',
      coverageAmount: Number(form.coverageAmount ?? 0),
      premium: Number(form.premium ?? 0),
      renewalDate: form.renewalDate ?? '',
      status: form.status ?? 'active',
      policyNumber: form.policyNumber ?? '',
      notes: form.notes ?? '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="glass-card rounded-2xl p-6 w-full max-w-lg border border-[#c9a96e]/20">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{form.id ? 'Edit Policy' : 'Add Policy'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Policy Name', key: 'name', placeholder: 'e.g. General Liability' },
            { label: 'Provider', key: 'provider', placeholder: 'e.g. Nationwide' },
            { label: 'Policy Number', key: 'policyNumber', placeholder: 'e.g. NW-HOA-2024-0042' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-gray-400 mb-1 block">{label}</label>
              <input
                value={(form as any)[key] ?? ''}
                onChange={(e) => set(key as keyof Policy, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Coverage Amount ($)</label>
              <input
                type="number"
                value={form.coverageAmount ?? ''}
                onChange={(e) => set('coverageAmount', e.target.value)}
                placeholder="2000000"
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Annual Premium ($)</label>
              <input
                type="number"
                value={form.premium ?? ''}
                onChange={(e) => set('premium', e.target.value)}
                placeholder="4800"
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Renewal Date</label>
              <input
                type="date"
                value={form.renewalDate ?? ''}
                onChange={(e) => set('renewalDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-white focus:border-[#c9a96e]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Status</label>
              <select
                value={form.status ?? 'active'}
                onChange={(e) => set('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-white focus:border-[#c9a96e]/50 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Coverage details, contact info, etc."
              className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-lg bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-semibold transition-colors">Save Policy</button>
        </div>
      </div>
    </div>
  );
}

export default function InsurancePage() {
  const { isConnected } = useAccount();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [editing, setEditing] = useState<Partial<Policy> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('hoa_insurance_policies');
    if (stored) {
      try { setPolicies(JSON.parse(stored)); } catch {}
    } else {
      setPolicies(DEMO_POLICIES);
    }
  }, []);

  const save = (p: Policy) => {
    const updated = editing?.id
      ? policies.map((x) => x.id === p.id ? p : x)
      : [...policies, p];
    setPolicies(updated);
    localStorage.setItem('hoa_insurance_policies', JSON.stringify(updated));
    setEditing(null);
  };

  const remove = (id: string) => {
    const updated = policies.filter((p) => p.id !== id);
    setPolicies(updated);
    localStorage.setItem('hoa_insurance_policies', JSON.stringify(updated));
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to view insurance policies</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const totalCoverage = policies.reduce((s, p) => s + p.coverageAmount, 0);
  const totalPremium = policies.reduce((s, p) => s + p.premium, 0);
  const expiring = policies.filter((p) => p.status === 'expiring' || p.status === 'expired');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Shield className="w-7 h-7 text-[#c9a96e]" />
            Insurance Tracker
          </h1>
          <p className="text-sm text-gray-400 mt-1">Community insurance policies and renewal schedule</p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Policy
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Coverage', value: formatCurrency(totalCoverage), icon: Shield, color: 'text-[#c9a96e]' },
          { label: 'Annual Premium', value: formatCurrency(totalPremium), icon: DollarSign, color: 'text-green-400' },
          { label: 'Active Policies', value: String(policies.filter((p) => p.status === 'active').length), icon: CheckCircle, color: 'text-blue-400' },
          { label: 'Need Attention', value: String(expiring.length), icon: AlertTriangle, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Policy list */}
      <div className="space-y-4">
        {policies.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center">
            <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No insurance policies added yet</p>
            <button onClick={() => setEditing({})} className="mt-3 text-sm text-[#c9a96e] hover:underline">Add your first policy</button>
          </div>
        )}
        {policies.map((policy) => (
          <PolicyCard
            key={policy.id}
            policy={policy}
            onEdit={() => setEditing(policy)}
            onDelete={() => remove(policy.id)}
          />
        ))}
      </div>

      {editing !== null && (
        <PolicyModal
          policy={editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
