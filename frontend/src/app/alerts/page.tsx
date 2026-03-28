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
    border: 'border-[rgba(107,58,58,0.30)]',
    text: 'text-[#8B5A5A]',
    badge: 'bg-[rgba(107,58,58,0.15)] text-[#8B5A5A] border border-[rgba(107,58,58,0.25)]',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  urgent: {
    border: 'border-[rgba(176,155,113,0.40)]',
    text: 'text-[#B09B71]',
    badge: 'bg-[rgba(176,155,113,0.20)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.15)]',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  info: {
    border: 'border-[rgba(90,122,154,0.30)]',
    text: 'text-[var(--steel)]',
    badge: 'bg-[rgba(90,122,154,0.15)] text-[var(--steel)] border border-[rgba(90,122,154,0.25)]',
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

  if (!expiresAt) return <span className="text-[var(--text-disabled)] text-xs">No expiry</span>;
  return <span className="text-[var(--text-muted)] text-xs font-mono">{text}</span>;
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
      className={`glass-card rounded-xl hover-lift p-5 border-l-4 ${s.border} ${s.glow}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className={s.text}>{s.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.badge}`}>
                {alert.type.toUpperCase()}
              </span>
              <Countdown expiresAt={alert.expiresAt} />
            </div>
            <h3 className="font-medium text-base text-[var(--parchment)] mb-1">{alert.title}</h3>
            {alert.description && (
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{alert.description}</p>
            )}
            <p className="text-[11px] text-[var(--text-disabled)] mt-2">
              {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString()} ·{' '}
              {alert.createdBy.slice(0, 6)}…{alert.createdBy.slice(-4)}
            </p>
          </div>
        </div>
        {isBoardMember && onDelete && (
          <button
            onClick={() => onDelete(alert.id)}
            className="text-[var(--text-disabled)] hover:text-[#8B5A5A] transition-colors p-1 rounded shrink-0"
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
    <div className="glass-card rounded-xl hover-lift overflow-hidden mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[rgba(245,240,232,0.02)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#B09B71]" />
          <span className="font-medium text-[var(--parchment)]">Create Emergency Alert</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[var(--text-disabled)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--text-disabled)]" />
        )}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 border-t border-[rgba(245,240,232,0.06)]">
          <div className="pt-5 space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
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
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                        type === t
                          ? `${s.badge} ${s.glow}`
                          : 'border-[rgba(245,240,232,0.10)] text-[var(--text-disabled)] hover:border-[rgba(245,240,232,0.20)]'
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
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Gas leak at Building C — evacuate now"
                maxLength={120}
                className="w-full bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.10)] rounded-xl px-4 py-3 text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.20)] focus:outline-none focus:border-[#B09B71]/50 focus:ring-1 focus:ring-[#B09B71]/30 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional additional details..."
                rows={3}
                maxLength={500}
                className="w-full bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.10)] rounded-xl px-4 py-3 text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.20)] focus:outline-none focus:border-[#B09B71]/50 focus:ring-1 focus:ring-[#B09B71]/30 transition resize-none"
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Auto-Expire
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EXPIRE_OPTIONS.map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setExpiresInHours(value)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                      expiresInHours === value
                        ? 'border-[#B09B71]/50 bg-[#B09B71]/10 text-[#D4C4A0]'
                        : 'border-[rgba(245,240,232,0.10)] text-[var(--text-disabled)] hover:border-[rgba(245,240,232,0.20)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-[#8B5A5A] bg-[rgba(107,58,58,0.10)] border border-[rgba(107,58,58,0.20)] rounded-xl px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full py-3 rounded-xl font-medium text-sm bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-heading)] transition-all duration-200"
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
          <p className="text-sm text-[var(--text-disabled)] font-medium uppercase tracking-widest mb-2">
            Community
          </p>
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-7 h-7 text-[#B09B71]" />
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight gradient-text">
              Emergency Alerts
            </h1>
          </div>
          <p className="text-[var(--text-muted)] text-base">
            Urgent community broadcasts — stay informed and safe.
          </p>
        </div>

        {/* Board: Create form */}
        {isConnected && boardChecked && isBoardMember && (
          <CreateAlertForm onCreated={refresh} />
        )}

        {/* Not connected nudge */}
        {!isConnected && (
          <div className="glass-card rounded-xl hover-lift p-6 mb-8 flex flex-col items-center gap-4 text-center">
            <Info className="w-8 h-8 text-[var(--steel)]" />
            <div>
              <p className="font-medium text-[var(--parchment)] mb-1">Connect to dismiss alerts</p>
              <p className="text-sm text-[var(--text-disabled)]">You can view alerts without signing in.</p>
            </div>
            <ConnectButton label="Sign In" showBalance={false} />
          </div>
        )}

        {/* Active Alerts */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5A5A] inline-block animate-pulse" />
            Active Alerts
            {sortedActive.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-[rgba(107,58,58,0.15)] text-[#8B5A5A] text-xs font-medium border border-[rgba(107,58,58,0.20)]">
                {sortedActive.length}
              </span>
            )}
          </h2>

          {sortedActive.length === 0 ? (
            <div className="glass-card rounded-xl hover-lift p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-[rgba(42,93,79,0.10)] border border-[rgba(42,93,79,0.20)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-[#3A7D6F]" />
              </div>
              <p className="font-medium text-[var(--text-body)] mb-1">All clear</p>
              <p className="text-sm text-[var(--text-disabled)]">No active alerts for your community.</p>
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
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Alert History
          </h2>

          {historyAlerts.length === 0 ? (
            <div className="glass-card rounded-xl hover-lift p-6 text-center">
              <p className="text-sm text-[var(--text-disabled)]">No past alerts yet.</p>
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
