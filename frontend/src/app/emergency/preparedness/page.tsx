'use client';

import { useState, useEffect } from 'react';
import { Shield, Phone, MapPin, AlertTriangle, Heart, CheckSquare, Bell } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  checked: boolean;
}

const KIT_CHECKLIST: Omit<ChecklistItem, 'checked'>[] = [
  // Water & Food
  { id: 'water1', label: 'Water (1 gallon/person/day, 3-day supply)', category: 'Water & Food' },
  { id: 'food1', label: 'Non-perishable food (3-day supply)', category: 'Water & Food' },
  { id: 'canopener', label: 'Manual can opener', category: 'Water & Food' },
  // Medical
  { id: 'firstaid', label: 'First aid kit', category: 'Medical' },
  { id: 'medications', label: '7-day supply of medications', category: 'Medical' },
  { id: 'gloves', label: 'Latex-free gloves', category: 'Medical' },
  // Documents
  { id: 'docs1', label: 'Copies of important documents (ID, insurance)', category: 'Documents' },
  { id: 'cash', label: 'Cash in small bills ($100+ recommended)', category: 'Documents' },
  { id: 'contacts', label: 'Written emergency contact list', category: 'Documents' },
  // Tools & Safety
  { id: 'flashlight', label: 'Flashlight + extra batteries', category: 'Tools & Safety' },
  { id: 'radio', label: 'Battery-powered or hand-crank radio', category: 'Tools & Safety' },
  { id: 'whistle', label: 'Whistle (signal for help)', category: 'Tools & Safety' },
  { id: 'wrench', label: 'Wrench or pliers (turn off utilities)', category: 'Tools & Safety' },
  { id: 'mask', label: 'N95 masks (dust/smoke)', category: 'Tools & Safety' },
  // Comfort
  { id: 'blankets', label: 'Emergency blankets or sleeping bags', category: 'Comfort' },
  { id: 'clothes', label: 'Change of clothes + sturdy shoes', category: 'Comfort' },
  { id: 'sanitation', label: 'Sanitation supplies (toilet paper, wipes)', category: 'Comfort' },
  { id: 'phone', label: 'Phone charger + portable battery pack', category: 'Comfort' },
];

const EMERGENCY_CONTACTS = [
  { name: 'HOA Emergency Line', number: '555-HOA-HELP', available: '24/7', icon: '' },
  { name: 'Board President', number: '555-234-5678', available: 'Emergencies only', icon: '' },
  { name: 'Security Patrol', number: '555-345-6789', available: '24/7', icon: '' },
  { name: 'County Emergency Mgmt', number: '555-456-7890', available: 'Business hours', icon: '' },
];

const EVACUATION_ROUTES = [
  {
    id: 'route1',
    name: 'Primary Route — North Exit',
    description: 'Exit via Faircroft Drive North → turn right on Oak Avenue → proceed to Community Center (2.1 miles). This is the preferred route for most emergencies.',
    landmark: 'Community Center at 123 Oak Avenue',
    emoji: '',
  },
  {
    id: 'route2',
    name: 'Secondary Route — South Exit',
    description: 'Exit via Elm Street South → merge onto Highway 45 → proceed to Westside High School (3.4 miles). Use when North Exit is blocked.',
    landmark: 'Westside High School at 456 Highway 45',
    emoji: '',
  },
  {
    id: 'route3',
    name: 'Emergency Route — West Gate',
    description: 'Access via maintenance gate on Cedar Lane (board has key code). Connects to County Road 12. Use only when all primary routes are blocked.',
    landmark: 'Cedar Lane maintenance gate (code: posted on all emergency boards)',
    emoji: '',
  },
];

const FIRST_AID_TIPS = [
  { title: 'Call 911', icon: '', tip: 'Always call 911 first in life-threatening emergencies. Do not delay.' },
  { title: 'CPR', icon: '', tip: '30 chest compressions, 2 breaths. Push hard, push fast (100-120/min). Use AED if available.' },
  { title: 'Bleeding', icon: '', tip: 'Apply firm pressure with clean cloth. Elevate if possible. Do not remove cloth — add more on top.' },
  { title: 'Burns', icon: '', tip: 'Cool with running water for 20 minutes. Do NOT use ice or butter. Cover loosely with plastic wrap.' },
  { title: 'Choking', icon: '', tip: '5 back blows + 5 abdominal thrusts (Heimlich). Call 911 if unconscious.' },
  { title: 'Stroke (FAST)', icon: '', tip: 'Face drooping, Arm weakness, Speech difficulty, Time to call 911. Note when symptoms started.' },
];

const STORAGE_KEY = 'hoa_emergency_checklist';
const ALERT_KEY = 'hoa_weather_alerts';

export default function PreparednessPage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'routes' | 'contacts' | 'firstaid'>('checklist');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setChecklist(JSON.parse(saved));
      } else {
        const initial = KIT_CHECKLIST.map(item => ({ ...item, checked: false }));
        setChecklist(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
      setWeatherAlerts(localStorage.getItem(ALERT_KEY) !== 'false');
    } catch {
      setChecklist(KIT_CHECKLIST.map(item => ({ ...item, checked: false })));
    }
  }, []);

  const toggleItem = (id: string) => {
    const updated = checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    setChecklist(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleWeatherAlerts = () => {
    const newVal = !weatherAlerts;
    setWeatherAlerts(newVal);
    localStorage.setItem(ALERT_KEY, String(newVal));
  };

  const resetChecklist = () => {
    const reset = checklist.map(item => ({ ...item, checked: false }));
    setChecklist(reset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
  };

  const checkedCount = checklist.filter(i => i.checked).length;
  const totalCount = checklist.length;
  const readinessPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const grouped = KIT_CHECKLIST.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item.id);
    return acc;
  }, {} as Record<string, string[]>);

  const TABS = [
    { id: 'checklist' as const, label: 'Kit Checklist', icon: '' },
    { id: 'routes' as const, label: 'Evacuation', icon: '' },
    { id: 'contacts' as const, label: 'Contacts', icon: '' },
    { id: 'firstaid' as const, label: 'First Aid', icon: '' },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Emergency Preparedness</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Stay ready. Stay safe. </p>
      </div>

      {/* Readiness Score */}
      <div className="glass rounded-xl p-6 border border-[rgba(245,240,232,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-medium text-[var(--parchment)]">Your Preparedness Score</h2>
            <p className="text-xs text-[var(--text-disabled)]">{checkedCount} of {totalCount} kit items ready</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-medium ${readinessPct >= 80 ? 'text-[#2A5D4F]' : readinessPct >= 50 ? 'text-[#B09B71]' : 'text-[#8B5A5A]'}`}>
              {readinessPct}%
            </div>
            <div className="text-xs text-[var(--text-disabled)]">
              {readinessPct >= 80 ? ' Well Prepared' : readinessPct >= 50 ? ' Partially Ready' : ' Needs Attention'}
            </div>
          </div>
        </div>
        <div className="h-3 rounded-full bg-[rgba(245,240,232,0.06)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${readinessPct}%`,
              background: readinessPct >= 80 ? '#2A5D4F' : readinessPct >= 50 ? '#B09B71' : '#8B5A5A',
            }}
          />
        </div>
      </div>

      {/* Weather Alerts Toggle */}
      <div className="glass rounded-xl p-4 border border-[rgba(245,240,232,0.04)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-[#B09B71]" />
          <div>
            <div className="text-sm font-medium text-[var(--parchment)]">Weather Alerts</div>
            <div className="text-xs text-[var(--text-disabled)]">Receive HOA weather notifications</div>
          </div>
        </div>
        <button
          onClick={toggleWeatherAlerts}
          className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${weatherAlerts ? 'bg-[#B09B71]' : 'bg-[rgba(245,240,232,0.10)]'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${weatherAlerts ? 'left-6' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[rgba(176,155,113,0.15)] text-[#D4C4A0] border border-[rgba(176,155,113,0.25)]'
                : 'glass text-[var(--text-muted)] border border-[rgba(245,240,232,0.04)] hover:text-[var(--parchment)]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'checklist' && (
        <div className="glass rounded-xl p-6 border border-[rgba(245,240,232,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-medium text-[var(--parchment)]"> Emergency Kit Checklist</h2>
            <button onClick={resetChecklist} className="text-xs text-[var(--text-disabled)] hover:text-[var(--text-body)] cursor-pointer">Reset</button>
          </div>
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, ids]) => {
              const items = checklist.filter(i => ids.includes(i.id));
              const catChecked = items.filter(i => i.checked).length;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-[#B09B71] uppercase tracking-widest">{category}</h3>
                    <span className="text-xs text-[var(--text-disabled)]">{catChecked}/{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                          item.checked
                            ? 'bg-[rgba(176,155,113,0.06)] border-[rgba(176,155,113,0.15)] opacity-70'
                            : 'bg-[rgba(245,240,232,0.02)] border-[rgba(245,240,232,0.04)] hover:bg-[rgba(245,240,232,0.04)]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          item.checked ? 'bg-[#B09B71] border-[#B09B71]' : 'border-[rgba(245,240,232,0.10)]'
                        }`}>
                          {item.checked && <span className="text-[var(--surface-2)] text-[11px] font-medium"></span>}
                        </div>
                        <span className={`text-sm ${item.checked ? 'line-through text-[var(--text-disabled)]' : 'text-[var(--text-body)]'}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'routes' && (
        <div className="space-y-4">
          {EVACUATION_ROUTES.map(route => (
            <div key={route.id} className="glass rounded-xl p-5 border border-[rgba(245,240,232,0.04)]">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{route.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-[var(--parchment)] mb-1">{route.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-3">{route.description}</p>
                  <div className="flex items-center gap-2 text-xs text-[#B09B71]">
                    <MapPin className="w-3 h-3" />
                    <span>{route.landmark}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="p-4 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.20)]">
            <p className="text-xs text-[#B09B71]">
               <strong>Important:</strong> Know your route before an emergency. Walk or drive all routes at least once. Keep your gas tank at least half full.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="glass rounded-xl p-6 border border-[rgba(245,240,232,0.04)]">
          <h2 className="text-base font-medium text-[var(--parchment)] mb-4"> Emergency Contacts</h2>
          <div className="space-y-3 mb-6">
            {EMERGENCY_CONTACTS.map((c, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(245,240,232,0.03)] border border-[rgba(245,240,232,0.04)]">
                <span className="text-2xl">{c.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--parchment)]">{c.name}</div>
                  <div className="text-xs text-[var(--text-disabled)] mt-0.5">{c.available}</div>
                </div>
                <a
                  href={`tel:${c.number.replace(/-/g, '')}`}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(176,155,113,0.15)] text-[#B09B71] text-sm font-medium border border-[rgba(176,155,113,0.20)] hover:bg-[rgba(176,155,113,0.25)] transition-all"
                >
                  {c.number}
                </a>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-[rgba(139,90,90,0.10)] border border-[rgba(139,90,90,0.20)]">
            <p className="text-xs text-[#8B5A5A] font-medium"> In immediate danger: Call 911 first, always.</p>
          </div>
        </div>
      )}

      {activeTab === 'firstaid' && (
        <div className="glass rounded-xl p-6 border border-[rgba(245,240,232,0.04)]">
          <h2 className="text-base font-medium text-[var(--parchment)] mb-4"> First Aid Quick Reference</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIRST_AID_TIPS.map((tip, i) => (
              <div key={i} className="p-4 rounded-xl bg-[rgba(245,240,232,0.02)] border border-[rgba(245,240,232,0.04)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{tip.icon}</span>
                  <span className="text-sm font-medium text-[var(--parchment)]">{tip.title}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{tip.tip}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-[var(--steel)]/10 border border-[rgba(90,122,154,0.20)]">
            <p className="text-xs text-[var(--steel)]">
               <strong>Tip:</strong> Consider taking a certified CPR/First Aid course. Check with your HOA about community training events.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
