'use client';

import { useState, useEffect } from 'react';

interface NotifPref {
  id: string;
  label: string;
  description: string;
  icon: string;
  urgent?: boolean;
}

const PREFS: NotifPref[] = [
  {
    id: 'emergency_alerts',
    label: 'Emergency Alerts',
    description: 'Critical community alerts, safety notices, and urgent HOA communications',
    icon: '',
    urgent: true,
  },
  {
    id: 'proposal_updates',
    label: 'Proposal Updates',
    description: 'New proposals, voting opened/closed, and results',
    icon: '',
  },
  {
    id: 'dues_reminders',
    label: 'Dues Reminders',
    description: 'Payment reminders, overdue notices, and confirmation receipts',
    icon: '',
  },
  {
    id: 'community_messages',
    label: 'Community Messages',
    description: 'Direct messages and mentions from neighbors',
    icon: '',
  },
  {
    id: 'maintenance_updates',
    label: 'Maintenance Updates',
    description: 'Status changes on your maintenance requests',
    icon: '',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    description: 'HOA board announcements and community news',
    icon: '',
  },
  {
    id: 'violation_notices',
    label: 'Violation Notices',
    description: 'Violation reports filed against your property',
    icon: '',
  },
  {
    id: 'meeting_reminders',
    label: 'Meeting Reminders',
    description: 'Board meeting and community event reminders',
    icon: '',
  },
];

const STORAGE_KEY = 'notification_prefs_v1';

function loadPrefs(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // defaults: all on except...
  return Object.fromEntries(PREFS.map(p => [p.id, true]));
}

function savePrefs(prefs: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function NotificationPrefsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
    setLoaded(true);
  }, []);

  const toggle = (id: string) => {
    setPrefs(prev => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const handleSave = () => {
    savePrefs(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const enabledCount = Object.values(prefs).filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 page-enter">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Settings</p>
        <h1 className="text-3xl font-normal tracking-tight"> Notifications</h1>
        <p className="text-base text-gray-400 mt-2">Choose which updates you want to receive</p>
      </div>

      <div className="glass-card rounded-lg p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            {enabledCount} of {PREFS.length} enabled
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPrefs(Object.fromEntries(PREFS.map(p => [p.id, true])))}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 hover:border-[#c9a96e]/30 hover:text-[#c9a96e] transition-all"
            >
              All on
            </button>
            <button
              onClick={() => {
                const urgentOnly = Object.fromEntries(PREFS.map(p => [p.id, !!p.urgent]));
                setPrefs(urgentOnly);
              }}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 hover:border-[#c9a96e]/30 hover:text-[#c9a96e] transition-all"
            >
              Urgent only
            </button>
          </div>
        </div>

        {!loaded ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-16 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {PREFS.map(pref => (
              <div
                key={pref.id}
                className={`flex items-center gap-4 rounded-md p-4 transition-all ${
                  prefs[pref.id]
                    ? 'bg-[#c9a96e]/5 border border-[#c9a96e]/15'
                    : 'bg-gray-800/30 border border-gray-700/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center text-xl shrink-0 ${
                  prefs[pref.id] ? 'bg-[#c9a96e]/15' : 'bg-gray-700/30'
                }`}>
                  
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${prefs[pref.id] ? 'text-gray-100' : 'text-gray-400'}`}>
                      {pref.label}
                    </p>
                    {pref.urgent && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-bold">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">{pref.description}</p>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => toggle(pref.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    prefs[pref.id] ? 'bg-[#c9a96e]' : 'bg-gray-600'
                  }`}
                  aria-label={`Toggle ${pref.label}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      prefs[pref.id] ? 'translate-x-6' : 'translate-x-1'
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
        className="w-full py-3.5 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-bold transition-all shadow-[0_0_20px_rgba(201,169,110,0.2)]"
      >
        {saved ? ' Preferences Saved!' : 'Save Preferences'}
      </button>

      <p className="text-[11px] text-gray-600 text-center mt-4">
        Preferences are stored locally on your device. Email notifications require a verified email in your profile.
      </p>
    </div>
  );
}
