'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useProperty } from '@/hooks/useProperty';
import Link from 'next/link';
import { CheckCircle, Circle, X, ChevronDown, ChevronUp } from 'lucide-react';

interface ChecklistStep {
  id: string;
  label: string;
  href: string;
  description: string;
}

const STEPS: ChecklistStep[] = [
  { id: 'wallet', label: 'Connect Wallet', href: '/', description: 'Securely connect your wallet to access the HOA platform' },
  { id: 'property', label: 'Register Property', href: '/dashboard', description: 'Verify your lot ownership via the blockchain' },
  { id: 'profile', label: 'Set Up Profile', href: '/profile', description: 'Add your name, email, and contact info' },
  { id: 'pets', label: 'Register Pets', href: '/pets', description: 'Register your pets per HOA requirements' },
  { id: 'vehicles', label: 'Register Vehicles', href: '/vehicles', description: 'Register your vehicles for the community' },
  { id: 'messaging', label: 'Enable Messaging', href: '/messages', description: 'Opt in to community messaging' },
  { id: 'rules', label: 'Review Rules', href: '/rules', description: 'Read the CC&Rs and community rules' },
];

function storageKey(address: string) {
  return `suvren_onboarding_checklist_${address.toLowerCase()}`;
}

interface ChecklistData {
  completed: string[];
  dismissed: boolean;
}

function loadData(address: string): ChecklistData {
  if (typeof window === 'undefined') return { completed: [], dismissed: false };
  try {
    const raw = localStorage.getItem(storageKey(address));
    return raw ? JSON.parse(raw) : { completed: [], dismissed: false };
  } catch { return { completed: [], dismissed: false }; }
}

function saveData(address: string, data: ChecklistData) {
  localStorage.setItem(storageKey(address), JSON.stringify(data));
}

export function OnboardingChecklist() {
  const { address, isConnected } = useAccount();
  const { hasProperty } = useProperty();
  const [data, setData] = useState<ChecklistData>({ completed: [], dismissed: false });
  const [expanded, setExpanded] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!address) return;
    const stored = loadData(address);
    // Auto-mark wallet connected
    const completed = new Set(stored.completed);
    completed.add('wallet');
    if (hasProperty) completed.add('property');
    const next = { ...stored, completed: Array.from(completed) };
    setData(next);
    saveData(address, next);
    setLoaded(true);
  }, [address, hasProperty]);

  if (!isConnected || !loaded || data.dismissed) return null;

  const completedSet = new Set(data.completed);
  const completedCount = STEPS.filter(s => completedSet.has(s.id)).length;
  const pct = Math.round((completedCount / STEPS.length) * 100);
  const allDone = pct === 100;

  function toggleStep(id: string) {
    if (!address) return;
    const next = new Set(data.completed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const updated = { ...data, completed: Array.from(next) };
    setData(updated);
    saveData(address, updated);
  }

  function dismiss() {
    if (!address) return;
    const updated = { ...data, dismissed: true };
    setData(updated);
    saveData(address, updated);
  }

  return (
    <div className="glass-card rounded-xl border border-[#B09B71]/20 overflow-hidden mb-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(245,240,232,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#B09B71]/10 border border-[#B09B71]/20 flex items-center justify-center text-base">
            
          </div>
          <div>
            <p className="text-sm font-medium text-[#D4C4A0]">Getting Started</p>
            <p className="text-xs text-[var(--text-disabled)]">{completedCount} of {STEPS.length} steps completed</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allDone && (
            <button
              onClick={dismiss}
              className="text-xs text-[var(--text-disabled)] hover:text-[var(--text-body)] px-3 py-1 rounded-lg hover:bg-[rgba(245,240,232,0.05)] transition-colors"
            >
              Dismiss
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-[var(--text-disabled)] hover:text-[var(--text-body)] hover:bg-[rgba(245,240,232,0.05)] transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {!allDone && (
            <button onClick={dismiss} className="p-1.5 rounded-lg text-[var(--text-disabled)] hover:text-[var(--text-muted)] hover:bg-[rgba(245,240,232,0.05)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-3 pb-1">
        <div className="flex items-center justify-between text-xs text-[var(--text-disabled)] mb-1.5">
          <span>Onboarding Progress</span>
          <span className="text-[#B09B71] font-medium">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-[rgba(245,240,232,0.05)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--brass-deep)] to-[#D4C4A0] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      {expanded && (
        <div className="px-6 pb-5 pt-3 space-y-2">
          {STEPS.map((step) => {
            const done = completedSet.has(step.id);
            return (
              <div key={step.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${done ? 'bg-[#B09B71]/5' : 'hover:bg-[rgba(245,240,232,0.03)]'}`}>
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`shrink-0 transition-colors ${done ? 'text-[#B09B71]' : 'text-[var(--text-disabled)] hover:text-[var(--text-muted)]'}`}
                >
                  {done ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? 'text-[var(--text-muted)] line-through' : 'text-[var(--parchment)]'}`}>
                    {step.label}
                  </p>
                  {!done && (
                    <p className="text-xs text-[var(--text-disabled)] truncate">{step.description}</p>
                  )}
                </div>
                {!done && (
                  <Link
                    href={step.href}
                    className="shrink-0 text-xs text-[#B09B71] hover:text-[#D4C4A0] font-medium transition-colors"
                  >
                    Go →
                  </Link>
                )}
              </div>
            );
          })}

          {allDone && (
            <div className="mt-3 text-center py-3 rounded-xl bg-[#B09B71]/10 border border-[#B09B71]/20">
              <p className="text-sm font-medium text-[#D4C4A0]"> You're all set!</p>
              <p className="text-xs text-[var(--text-disabled)] mt-1">Welcome to Faircroft HOA</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
