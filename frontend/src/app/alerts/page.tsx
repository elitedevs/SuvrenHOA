'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  Plus,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import type { Alert, AlertType } from '@/hooks/useAlerts';

// ─── Styling maps ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<AlertType, string> = {
  emergency: ' Emergency',
  urgent: ' Urgent',
  info: ' Info',
};

const TYPE_STYLE: Record<
  AlertType,
  { border: string; text: string; badge: string; glow: string; icon: React.ReactNode }
> = {
  emergency: {
    border: 'border-red-500/40',
    text: 'text-red-300',
    badge: 'bg-red-600/20 text-red-300 border border-red-500/30',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  urgent: {
    border: 'border-orange-500/40',
    text: 'text-orange-300',
    badge: 'bg-orange-600/20 text-orange-300 border border-orange-500/30',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.15)]',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  info: {
    border: 'border-blue-500/40',
    text: 'text-blue-300',
    badge: 'bg-blue-600/20 text-blue-300 border border-blue-500/30',
    glow: '',
    icon: <Info className="w-5 h-5" />,
  },
};

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ expiresAt }: { expiresAt: string | null }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!expiresAt) return;
    function calc() {
      const diff = new Date(expiresAt!).getTime() - Date.now();
      if (diff <= 0) { setText('Expired'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      if (h > 0) setText(`Expires in ${h}h ${m}m`);
      else if (m > 0) setText(`Expires in ${m}m ${s}s`);
      else setText(`Expires in ${s}s`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return <span className="text-gray-500 text-xs">No expiry</span>;
  return <span className="text-gray-400 text-xs font-mono">{text}</span>;
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  isBoardMember,
  onDelete,
}: {
  alert: Alert;
  isBoardMember: boolean;
  onDelete?: (id: string) => void;
}) {
  const s = TYPE_STYLE[alert.type];
  const createdDate = new Date(alert.createdAt);

  return (
    <div
      className={`glass-card rounded-2xl hover-lift p-5 border-l-4 ${s.border} ${s.glow}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className={s.text}>{s.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
                {alert.type.toUpperCase()}
              </span>
              <Countdown expiresAt={alert.expiresAt} />
            </div>
            <h3 className="font-bold text-base text-gray-100 mb-1">{alert.title}</h3>
            {alert.description && (
              <p className="text-sm text-gray-400 leading-relaxed">{alert.description}</p>
            )}
            <p className="text-[11px] text-gray-600 mt-2">
              {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString()} ·{' '}
              {alert.createdBy.slice(0, 6)}…{alert.createdBy.slice(-4)}
            </p>
          </div>
        </div>
        {isBoardMember && onDelete && (
          <button
            onClick={() => onDelete(alert.id)}
            className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded shrink-0"
            title="Delete alert"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Create Form ──────────────────────────────────────────────────────────────

const EXPIRE_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '4 hours', value: 4 },
  { label: '24 hours', value: 24 },
  { label: 'No expiry', value: null },
];

function CreateAlertForm({ onCreated }: { onCreated: () => void }) {
  const { createAlert } = useAlerts();
  const [type, setType] = useState<AlertType>('info');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresInHours, setExpiresInHours] = useState<number | null>(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      await createAlert({ type, title, description, expiresInHours });
      setTitle('');
      setDescription('');
      setType('info');
      setExpiresInHours(4);
      setOpen(false);
      onCreated();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl hover-lift overflow-hidden mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#c9a96e]" />
          <span className="font-bold text-gray-100">Create Emergency Alert</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 border-t border-white/[0.06]">
          <div className="pt-5 space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Alert Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(TYPE_LABELS) as [AlertType, string][]).map(([t, label]) => {
                  const s = TYPE_STYLE[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        type === t
                          ? `${s.badge} ${s.glow}`
                          : 'border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Gas leak at Building C — evacuate now"
                maxLength={120}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#c9a96e]/50 focus:ring-1 focus:ring-[#c9a96e]/30 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional additional details..."
                rows={3}
                maxLength={500}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#c9a96e]/50 focus:ring-1 focus:ring-[#c9a96e]/30 transition resize-none"
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Auto-Expire
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EXPIRE_OPTIONS.map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setExpiresInHours(value)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      expiresInHours === value
                        ? 'border-[#c9a96e]/50 bg-[#c9a96e]/10 text-[#e8d5a3]'
                        : 'border-white/10 text-gray-500 hover:border-white/20'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all duration-200"
            >
              {loading ? 'Broadcasting…' : `Broadcast ${TYPE_LABELS[type]}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { isConnected } = useAccount();
  const { isBoardMember, boardChecked, getActiveAlerts, getAlertHistory, deleteAlert } =
    useAlerts();

  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [historyAlerts, setHistoryAlerts] = useState<Alert[]>([]);

  const refresh = useCallback(() => {
    setActiveAlerts(getActiveAlerts());
    setHistoryAlerts(getAlertHistory());
  }, [getActiveAlerts, getAlertHistory]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [refresh]);

  function handleDelete(id: string) {
    deleteAlert(id);
    refresh();
  }

  // Sort active: emergency first
  const sortedActive = [...activeAlerts].sort((a, b) => {
    const order = { emergency: 0, urgent: 1, info: 2 };
    return order[a.type] - order[b.type];
  });

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 page-enter">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mb-2">
            Community
          </p>
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-7 h-7 text-[#c9a96e]" />
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text">
              Emergency Alerts
            </h1>
          </div>
          <p className="text-gray-400 text-base">
            Urgent community broadcasts — stay informed and safe.
          </p>
        </div>

        {/* Board: Create form */}
        {isConnected && boardChecked && isBoardMember && (
          <CreateAlertForm onCreated={refresh} />
        )}

        {/* Not connected nudge */}
        {!isConnected && (
          <div className="glass-card rounded-2xl hover-lift p-6 mb-8 flex flex-col items-center gap-4 text-center">
            <Info className="w-8 h-8 text-blue-400" />
            <div>
              <p className="font-semibold text-gray-200 mb-1">Connect to dismiss alerts</p>
              <p className="text-sm text-gray-500">You can view alerts without signing in.</p>
            </div>
            <ConnectButton label="Sign In" showBalance={false} />
          </div>
        )}

        {/* Active Alerts */}
        <section className="mb-10">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
            Active Alerts
            {sortedActive.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 text-xs font-bold border border-red-500/20">
                {sortedActive.length}
              </span>
            )}
          </h2>

          {sortedActive.length === 0 ? (
            <div className="glass-card rounded-2xl hover-lift p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <p className="font-semibold text-gray-300 mb-1">All clear</p>
              <p className="text-sm text-gray-500">No active alerts for your community.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedActive.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  isBoardMember={isBoardMember}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>

        {/* History */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Alert History
          </h2>

          {historyAlerts.length === 0 ? (
            <div className="glass-card rounded-2xl hover-lift p-6 text-center">
              <p className="text-sm text-gray-600">No past alerts yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyAlerts.map((alert) => (
                <div key={alert.id} className="opacity-60">
                  <AlertCard
                    alert={alert}
                    isBoardMember={isBoardMember}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
