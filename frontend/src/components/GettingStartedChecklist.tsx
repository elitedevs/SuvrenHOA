'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useProperty } from '@/hooks/useProperty';
import { useSupabaseAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, X,
  User, Key, BookOpen, Vote, Landmark,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  optional?: boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'profile',
    label: 'Complete your profile',
    description: 'Add your name, lot number, and contact info',
    href: '/profile',
    icon: User,
  },
  {
    id: 'wallet',
    label: 'Connect your governance key',
    description: 'Link a wallet to vote and pay dues',
    href: '/settings/wallet',
    icon: Key,
    optional: true,
  },
  {
    id: 'rules',
    label: 'Read the community rules',
    description: 'Review the CC&Rs and community guidelines',
    href: '/rules',
    icon: BookOpen,
  },
  {
    id: 'vote',
    label: 'Cast your first vote',
    description: 'Participate in community governance',
    href: '/proposals',
    icon: Vote,
  },
  {
    id: 'treasury',
    label: 'View the treasury',
    description: 'See how community funds are managed',
    href: '/treasury',
    icon: Landmark,
  },
];

function storageKey(userId: string) {
  return `suvren_getting_started_${userId}`;
}

interface ChecklistState {
  completed: string[];
  dismissed: boolean;
}

function loadState(userId: string): ChecklistState {
  if (typeof window === 'undefined') return { completed: [], dismissed: false };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : { completed: [], dismissed: false };
  } catch {
    return { completed: [], dismissed: false };
  }
}

function saveState(userId: string, state: ChecklistState) {
  localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

interface GettingStartedChecklistProps {
  welcomeMessage?: string;
}

export function GettingStartedChecklist({ welcomeMessage }: GettingStartedChecklistProps) {
  const { user, profile: authProfile } = useSupabaseAuth();
  const { isConnected } = useAccount();
  const { hasProperty } = useProperty();
  const [state, setState] = useState<ChecklistState>({ completed: [], dismissed: false });
  const [expanded, setExpanded] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const userId = user?.id || authProfile?.id;

  useEffect(() => {
    if (!userId) return;
    const stored = loadState(userId);

    // Auto-detect completed items
    const completed = new Set(stored.completed);
    if (authProfile?.full_name) completed.add('profile');
    if (isConnected || authProfile?.wallet_address) completed.add('wallet');

    const next = { ...stored, completed: Array.from(completed) };
    setState(next);
    saveState(userId, next);
    setLoaded(true);
  }, [userId, authProfile, isConnected]);

  if (!userId || !loaded || state.dismissed) return null;

  const completedSet = new Set(state.completed);
  const completedCount = CHECKLIST_ITEMS.filter(i => completedSet.has(i.id)).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const pct = Math.round((completedCount / totalCount) * 100);
  const allDone = pct === 100;

  function toggleItem(id: string) {
    if (!userId) return;
    const next = new Set(state.completed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const updated = { ...state, completed: Array.from(next) };
    setState(updated);
    saveState(userId, updated);
  }

  function dismiss() {
    if (!userId) return;
    const updated = { ...state, dismissed: true };
    setState(updated);
    saveState(userId, updated);
  }

  return (
    <div className="glass-card rounded-xl border border-[rgba(176,155,113,0.15)] overflow-hidden mb-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(245,240,232,0.06)] bg-[rgba(176,155,113,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.20)] flex items-center justify-center">
            <span className="text-base">&#x2728;</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#D4C4A0]">Getting Started</h3>
            <p className="text-xs text-[var(--text-disabled)]">
              {completedCount} of {totalCount} completed
            </p>
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
            <button
              onClick={dismiss}
              className="p-1.5 rounded-lg text-[var(--text-disabled)] hover:text-[var(--text-muted)] hover:bg-[rgba(245,240,232,0.05)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-3 pb-1">
        <div className="flex items-center justify-between text-xs text-[var(--text-disabled)] mb-1.5">
          <span>Your Progress</span>
          <span className="text-[#B09B71] font-medium">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-[rgba(245,240,232,0.05)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8A7550] to-[#D4C4A0] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Welcome message */}
      {welcomeMessage && expanded && (
        <div className="mx-6 mt-3 px-4 py-3 rounded-xl bg-[rgba(176,155,113,0.06)] border border-[rgba(176,155,113,0.10)]">
          <p className="text-sm text-[var(--text-body)] italic leading-relaxed">{welcomeMessage}</p>
        </div>
      )}

      {/* Checklist items */}
      {expanded && (
        <div className="px-6 pb-5 pt-3 space-y-1.5">
          {CHECKLIST_ITEMS.map((item) => {
            const done = completedSet.has(item.id);
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  done ? 'bg-[rgba(42,93,79,0.06)]' : 'hover:bg-[rgba(245,240,232,0.03)]'
                }`}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`shrink-0 transition-colors ${
                    done
                      ? 'text-[#3A7D6F]'
                      : 'text-[var(--text-disabled)] hover:text-[var(--text-muted)]'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-medium ${
                        done
                          ? 'text-[var(--text-muted)] line-through'
                          : 'text-[var(--parchment)]'
                      }`}
                    >
                      {item.label}
                    </p>
                    {item.optional && !done && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(245,240,232,0.05)] text-[var(--text-disabled)]">
                        optional
                      </span>
                    )}
                  </div>
                  {!done && (
                    <p className="text-xs text-[var(--text-disabled)] truncate">
                      {item.description}
                    </p>
                  )}
                </div>
                {!done && (
                  <Link
                    href={item.href}
                    className="shrink-0 flex items-center gap-1 text-xs text-[#B09B71] hover:text-[#D4C4A0] font-medium transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>Go</span>
                  </Link>
                )}
              </div>
            );
          })}

          {allDone && (
            <div className="mt-3 text-center py-4 rounded-xl bg-[rgba(42,93,79,0.10)] border border-[rgba(42,93,79,0.20)]">
              <p className="text-sm font-medium text-[#3A7D6F]">You&apos;re all set!</p>
              <p className="text-xs text-[var(--text-disabled)] mt-1">
                Welcome to the community. You&apos;re ready to participate in governance.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
