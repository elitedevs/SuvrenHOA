'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';

interface NotifPref {
  id: string;
  label: string;
  description: string;
  urgent?: boolean;
}

const PREFS: NotifPref[] = [
  {
    id: 'emergency_alerts',
    label: 'Emergency Alerts',
    description: 'Critical community alerts, safety notices, and urgent HOA communications',
    urgent: true,
  },
  {
    id: 'proposal_updates',
    label: 'Proposal Updates',
    description: 'New proposals, voting opened/closed, and results',
  },
  {
    id: 'dues_reminders',
    label: 'Dues Reminders',
    description: 'Payment reminders, overdue notices, and confirmation receipts',
  },
  {
    id: 'community_messages',
    label: 'Community Messages',
    description: 'Direct messages and mentions from neighbors',
  },
  {
    id: 'maintenance_updates',
    label: 'Maintenance Updates',
    description: 'Status changes on your maintenance requests',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    description: 'HOA board announcements and community news',
  },
  {
    id: 'violation_notices',
    label: 'Violation Notices',
    description: 'Violation reports filed against your property',
  },
  {
    id: 'meeting_reminders',
    label: 'Meeting Reminders',
    description: 'Board meeting and community event reminders',
  },
];

const STORAGE_KEY = 'notification_prefs_v1';

function loadPrefs(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) { /* Silent fallback to defaults */ }
  // defaults: all on except...
  return Object.fromEntries(PREFS.map(p => [p.id, true]));
}

function savePrefs(prefs: Record<string, boolean>): string | null {
  if (typeof window === 'undefined') return null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    return null;
  } catch {
    return 'Unable to save preferences — storage may be full or restricted.';
  }
}

export default function NotificationPrefsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [hasUnsaved, setHasUnsaved] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
    setLoaded(true);
  }, []);

  const toggle = (id: string) => {
    setPrefs(prev => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
    setHasUnsaved(true);
    setSaveError('');
  };

  const handleSave = () => {
    const err = savePrefs(prefs);
    if (err) {
      setSaveError(err);
      return;
    }
    setSaved(true);
    setHasUnsaved(false);
    setSaveError('');
    setTimeout(() => setSaved(false), 2500);
  };

  const enabledCount = Object.values(prefs).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 page-enter">
      {saveError && (
        <div className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-xl bg-[rgba(107,58,58,0.15)] border border-[rgba(139,90,90,0.30)] text-[#8B5A5A] text-sm">
          <span>{saveError}</span>
          <button onClick={() => setSaveError('')} className="shrink-0 hover:opacity-70 transition-opacity" aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Settings</p>
        <h1 className="text-3xl sm:text-4xl font-medium gradient-text flex items-center gap-2"><Bell className="w-7 h-7 text-[#B09B71]" /> Notifications</h1>
        <p className="text-base text-[var(--text-muted)] mt-2">Choose which updates you want to receive</p>
      </div>

      <div className="glass-card rounded-lg p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)]">
            {enabledCount} of {PREFS.length} enabled
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setPrefs(Object.fromEntries(PREFS.map(p => [p.id, true]))); setSaved(false); setHasUnsaved(true); setSaveError(''); }}
              className="text-xs px-2.5 py-1 rounded-lg border border-[rgba(245,240,232,0.08)] text-[var(--text-muted)] hover:border-[rgba(176,155,113,0.30)] hover:text-[#B09B71] transition-all"
            >
              All on
            </button>
            <button
              onClick={() => {
                const urgentOnly = Object.fromEntries(PREFS.map(p => [p.id, !!p.urgent]));
                setPrefs(urgentOnly);
                setSaved(false);
                setHasUnsaved(true);
                setSaveError('');
              }}
              className="text-xs px-2.5 py-1 rounded-lg border border-[rgba(245,240,232,0.08)] text-[var(--text-muted)] hover:border-[rgba(176,155,113,0.30)] hover:text-[#B09B71] transition-all"
            >
              Urgent only
            </button>
          </div>
        </div>

        {!loaded ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {PREFS.map(pref => (
              <div
                key={pref.id}
                className={`flex items-center gap-4 rounded-lg p-4 transition-all ${
                  prefs[pref.id]
                    ? 'bg-[rgba(176,155,113,0.05)] border border-[rgba(176,155,113,0.15)]'
                    : 'bg-[rgba(26,26,30,0.30)] border border-[rgba(245,240,232,0.06)]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${prefs[pref.id] ? 'text-[var(--parchment)]' : 'text-[var(--text-muted)]'}`}>
                      {pref.label}
                    </p>
                    {pref.urgent && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-[rgba(107,58,58,0.12)] text-[#8B5A5A] border border-[rgba(107,58,58,0.20)] font-medium">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-disabled)] leading-tight">{pref.description}</p>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => toggle(pref.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 shrink-0 ${
                    prefs[pref.id]
                      ? 'bg-[#B09B71] shadow-[0_0_8px_rgba(201,169,110,0.5)]'
                      : 'bg-[var(--surface-3)]'
                  }`}
                  aria-label={`Toggle ${pref.label}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full shadow transition-transform duration-200 ${
                      prefs[pref.id]
                        ? 'translate-x-6 bg-white'
                        : 'translate-x-1 bg-[var(--text-muted)]'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all shadow-[0_0_20px_rgba(201,169,110,0.2)]"
      >
        {saved ? <><Check className="w-4 h-4 inline mr-1" /> Preferences Saved</> : hasUnsaved ? 'Save Preferences *' : 'Save Preferences'}
      </button>

      <p className="text-[11px] text-[var(--text-disabled)] text-center mt-4">
        Preferences are stored locally on your device. Email notifications require a verified email in your profile.
      </p>
    </div>
  );
}
