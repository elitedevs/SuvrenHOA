'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

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
        <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] mb-1">Settings</p>
        <h1 className="text-3xl font-normal tracking-tight flex items-center gap-2"><Bell className="w-7 h-7 text-[#B09B71]" /> Notifications</h1>
        <p className="text-base text-[rgba(245,240,232,0.50)] mt-2">Choose which updates you want to receive</p>
      </div>

      <div className="glass-card rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)]">
            {enabledCount} of {PREFS.length} enabled
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPrefs(Object.fromEntries(PREFS.map(p => [p.id, true])))}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-[rgba(245,240,232,0.50)] hover:border-[#B09B71]/30 hover:text-[#B09B71] transition-all"
            >
              All on
            </button>
            <button
              onClick={() => {
                const urgentOnly = Object.fromEntries(PREFS.map(p => [p.id, !!p.urgent]));
                setPrefs(urgentOnly);
              }}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-[rgba(245,240,232,0.50)] hover:border-[#B09B71]/30 hover:text-[#B09B71] transition-all"
            >
              Urgent only
            </button>
          </div>
        </div>

        {!loaded ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {PREFS.map(pref => (
              <div
                key={pref.id}
                className={`flex items-center gap-4 rounded-xl p-4 transition-all ${
                  prefs[pref.id]
                    ? 'bg-[#B09B71]/5 border border-[#B09B71]/15'
                    : 'bg-gray-800/30 border border-gray-700/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  prefs[pref.id] ? 'bg-[#B09B71]/15' : 'bg-gray-700/30'
                }`}>
                  {pref.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${prefs[pref.id] ? 'text-[rgba(245,240,232,0.90)]' : 'text-[rgba(245,240,232,0.50)]'}`}>
                      {pref.label}
                    </p>
                    {pref.urgent && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(107,58,58,0.12)] text-[#8B5A5A] border border-[rgba(107,58,58,0.20)] font-bold">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[rgba(245,240,232,0.35)] leading-tight">{pref.description}</p>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => toggle(pref.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 shrink-0 ${
                    prefs[pref.id]
                      ? 'bg-[#B09B71] shadow-[0_0_8px_rgba(201,169,110,0.5)]'
                      : 'bg-gray-700'
                  }`}
                  aria-label={`Toggle ${pref.label}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full shadow transition-transform duration-200 ${
                      prefs[pref.id]
                        ? 'translate-x-6 bg-white'
                        : 'translate-x-1 bg-gray-400'
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
        className="w-full py-3.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#1a1a1a] text-sm font-bold transition-all shadow-[0_0_20px_rgba(201,169,110,0.2)]"
      >
        {saved ? ' Preferences Saved!' : 'Save Preferences'}
      </button>

      <p className="text-[11px] text-[rgba(245,240,232,0.25)] text-center mt-4">
        Preferences are stored locally on your device. Email notifications require a verified email in your profile.
      </p>
    </div>
  );
}
