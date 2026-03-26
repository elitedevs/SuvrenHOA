'use client';

import { useEffect, useState } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import type { Alert, AlertType } from '@/hooks/useAlerts';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

// ─── Styling maps ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  AlertType,
  {
    icon: React.ReactNode;
    bg: string;
    border: string;
    text: string;
    badge: string;
    glow: string;
    pulse: boolean;
  }
> = {
  emergency: {
    icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
    bg: 'bg-red-950/80',
    border: 'border-red-500/60',
    text: 'text-[rgba(245,240,232,0.80)]',
    badge: 'bg-red-600 text-white',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    pulse: true,
  },
  urgent: {
    icon: <AlertCircle className="w-4 h-4 shrink-0" />,
    bg: 'bg-orange-950/80',
    border: 'border-orange-500/60',
    text: 'text-orange-100',
    badge: 'bg-orange-500 text-white',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.25)]',
    pulse: false,
  },
  info: {
    icon: <Info className="w-4 h-4 shrink-0" />,
    bg: 'bg-blue-950/80',
    border: 'border-blue-500/60',
    text: 'text-[rgba(245,240,232,0.80)]',
    badge: 'bg-blue-600 text-white',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    pulse: false,
  },
};

// ─── Countdown util ───────────────────────────────────────────────────────────

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    function calc() {
      const diff = new Date(expiresAt!).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Expired');
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      if (h > 0) setRemaining(`${h}h ${m}m remaining`);
      else if (m > 0) setRemaining(`${m}m ${s}s remaining`);
      else setRemaining(`${s}s remaining`);
    }

    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

// ─── Single banner item ───────────────────────────────────────────────────────

function AlertItem({ alert, onDismiss }: { alert: Alert; onDismiss: (id: string) => void }) {
  const cfg = TYPE_CONFIG[alert.type];
  const countdown = useCountdown(alert.expiresAt);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => onDismiss(alert.id), 300);
  }

  return (
    <div
      className={`
        transition-all duration-300 ease-out overflow-hidden
        ${visible ? 'max-h-32 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'}
      `}
    >
      <div
        className={`
          mx-0 px-4 py-3 backdrop-blur-sm border-b
          ${cfg.bg} ${cfg.border} ${cfg.glow}
          ${cfg.pulse ? 'animate-pulse-border' : ''}
        `}
      >
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-3">
          <div className={`flex items-start gap-2.5 ${cfg.text} min-w-0`}>
            <span className={`mt-0.5 p-1 rounded ${cfg.badge} shrink-0`}>
              {cfg.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{alert.title}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${cfg.badge}`}>
                  {alert.type}
                </span>
              </div>
              {alert.description && (
                <p className="text-[13px] opacity-80 mt-0.5 leading-snug">{alert.description}</p>
              )}
              {countdown && (
                <p className="text-[11px] opacity-60 mt-1 font-mono">{countdown}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className={`${cfg.text} opacity-60 hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-white/10`}
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AlertBanner() {
  const { getActiveAlerts, dismissAlert } = useAlerts();
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);

  // Refresh active alerts every 10s (handles expiry)
  useEffect(() => {
    function refresh() {
      setActiveAlerts(getActiveAlerts());
    }
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [getActiveAlerts]);

  if (activeAlerts.length === 0) return null;

  // Sort: emergency first, then urgent, then info
  const sorted = [...activeAlerts].sort((a, b) => {
    const order = { emergency: 0, urgent: 1, info: 2 };
    return order[a.type] - order[b.type];
  });

  return (
    <div className="w-full" role="alert" aria-live="assertive">
      {sorted.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onDismiss={(id) => {
            dismissAlert(id);
            setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
          }}
        />
      ))}
    </div>
  );
}
