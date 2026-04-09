'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  CheckCircle2, Circle, Users, Mail, Activity,
  RefreshCw, AlertCircle, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'infrastructure' | 'content' | 'marketing' | 'legal' | 'product';
  done: boolean;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  // Infrastructure
  { id: 'ci-cd', label: 'CI/CD pipeline active', description: 'GitHub Actions build + deploy on push to main', category: 'infrastructure', done: true },
  { id: 'sentry', label: 'Sentry error monitoring', description: 'Frontend and backend errors tracked', category: 'infrastructure', done: true },
  { id: 'rls', label: 'RLS policies hardened', description: 'All Supabase tables behind row-level security', category: 'infrastructure', done: true },
  { id: 'health', label: 'Health endpoint live', description: '/api/health returns 200 with build info', category: 'infrastructure', done: true },
  { id: 'contracts', label: 'Contracts deployed (mainnet)', description: 'All 7 contracts deployed on Base mainnet', category: 'infrastructure', done: false },
  { id: 'domain', label: 'Custom domain configured', description: 'app.suvren.com pointing to production', category: 'infrastructure', done: false },
  { id: 'ssl', label: 'SSL certificates valid', description: 'HTTPS enforced on all endpoints', category: 'infrastructure', done: false },

  // Product
  { id: 'onboarding', label: 'Onboarding flow tested', description: 'Sign up → create community → invite resident end-to-end', category: 'product', done: false },
  { id: 'stripe', label: 'Stripe billing connected', description: 'Starter, Professional, Enterprise plans active', category: 'product', done: false },
  { id: 'email-verify', label: 'Email verification working', description: 'Supabase sends verification emails via Resend', category: 'product', done: false },
  { id: 'founding-program', label: 'Founding program live', description: '/founding page accepting applications', category: 'product', done: true },

  // Marketing
  { id: 'launch-page', label: 'Launch page live', description: '/launch with countdown and email signup', category: 'marketing', done: true },
  { id: 'ph-page', label: 'Product Hunt page ready', description: 'PH listing drafted and scheduled', category: 'marketing', done: false },
  { id: 'press-kit', label: 'Press kit published', description: '/press with brand assets and boilerplate', category: 'marketing', done: true },
  { id: 'social-accounts', label: 'Social accounts created', description: 'Twitter/X and LinkedIn active', category: 'marketing', done: false },
  { id: 'og-image', label: 'OG image designed', description: '1200×630 image for social sharing', category: 'marketing', done: false },

  // Content
  { id: 'tos', label: 'Terms of Service published', description: '/legal/terms live and accessible', category: 'content', done: false },
  { id: 'privacy', label: 'Privacy Policy published', description: '/legal/privacy live and accessible', category: 'content', done: false },
  { id: 'sitemap', label: 'Sitemap generated', description: 'sitemap.xml + robots.txt configured', category: 'content', done: true },

  // Legal
  { id: 'entity', label: 'LLC formed', description: 'Suvren LLC registered', category: 'legal', done: true },
  { id: 'patent', label: 'Patent filed', description: 'Provisional patent application filed', category: 'legal', done: true },
];

const CATEGORY_LABELS: Record<ChecklistItem['category'], string> = {
  infrastructure: 'Infrastructure',
  product: 'Product',
  marketing: 'Marketing',
  content: 'Content',
  legal: 'Legal',
};

const CATEGORY_COLORS: Record<ChecklistItem['category'], string> = {
  infrastructure: 'text-blue-400',
  product: 'text-emerald-400',
  marketing: 'text-[#F68341]',
  content: 'text-purple-400',
  legal: 'text-amber-400',
};

interface LaunchStats {
  foundingPending: number;
  foundingApproved: number;
  foundingTotal: number;
  signupCount: number;
}

export default function AdminLaunchPage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    if (typeof window === 'undefined') return INITIAL_CHECKLIST;
    try {
      const saved = localStorage.getItem('launch-checklist');
      if (saved) {
        const savedItems: Record<string, boolean> = JSON.parse(saved);
        return INITIAL_CHECKLIST.map(item => ({
          ...item,
          done: savedItems[item.id] ?? item.done,
        }));
      }
    } catch { /* ignore */ }
    return INITIAL_CHECKLIST;
  });

  const [stats, setStats] = useState<LaunchStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    const [signupRes, foundingRes] = await Promise.allSettled([
      fetch('/api/launch/signup').then(r => r.json()),
      supabase.from('founding_applications').select('status'),
    ]);

    const signupCount = signupRes.status === 'fulfilled' ? (signupRes.value.count ?? 0) : 0;
    const foundingData = foundingRes.status === 'fulfilled' ? foundingRes.value.data ?? [] : [];

    setStats({
      signupCount,
      foundingTotal: foundingData.length,
      foundingPending: foundingData.filter((a: { status: string }) => a.status === 'pending').length,
      foundingApproved: foundingData.filter((a: { status: string }) => a.status === 'approved').length,
    });
    setLoadingStats(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  function toggleItem(id: string) {
    setChecklist(prev => {
      const next = prev.map(item => item.id === id ? { ...item, done: !item.done } : item);
      const savedState: Record<string, boolean> = {};
      next.forEach(item => { savedState[item.id] = item.done; });
      try { localStorage.setItem('launch-checklist', JSON.stringify(savedState)); } catch { /* ignore */ }
      return next;
    });
  }

  const doneCount = checklist.filter(i => i.done).length;
  const totalCount = checklist.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  const categories = (Object.keys(CATEGORY_LABELS) as ChecklistItem['category'][]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-[#E8E4DC]">Launch Dashboard</h1>
          <p className="text-sm text-[#8A8070] mt-1">{doneCount} of {totalCount} items complete · {pct}% ready</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 border border-[#2A2A2E] rounded-lg text-[#8A8070] hover:text-[#C4BAA8] transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#C4BAA8]">Launch Readiness</span>
          <span className="text-sm font-bold text-[#B09B71]">{pct}%</span>
        </div>
        <div className="h-2.5 bg-[#1E1E22] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#B09B71] to-[#8A7A55] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && (
          <div className="flex items-center gap-2 mt-3 text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>All items complete. Ready to launch!</span>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-[#B09B71]" />
            <span className="text-xs text-[#8A8070]">Launch signups</span>
          </div>
          <p className="text-2xl font-bold text-[#E8E4DC]">
            {loadingStats ? '—' : stats?.signupCount ?? 0}
          </p>
        </div>
        <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-[#8A8070]">Founding (pending)</span>
          </div>
          <p className="text-2xl font-bold text-[#E8E4DC]">
            {loadingStats ? '—' : stats?.foundingPending ?? 0}
          </p>
        </div>
        <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-[#8A8070]">Founding (approved)</span>
          </div>
          <p className="text-2xl font-bold text-[#E8E4DC]">
            {loadingStats ? '—' : stats?.foundingApproved ?? 0}
          </p>
        </div>
        <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-[#B09B71]" />
            <span className="text-xs text-[#8A8070]">Total applications</span>
          </div>
          <p className="text-2xl font-bold text-[#E8E4DC]">
            {loadingStats ? '—' : stats?.foundingTotal ?? 0}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/founding"
          className="flex items-center gap-2 px-4 py-2 bg-[#141416] border border-[#2A2A2E] rounded-lg text-sm text-[#C4BAA8] hover:border-[rgba(176,155,113,0.4)] transition-colors"
        >
          <Users className="w-4 h-4 text-[#B09B71]" />
          Review Founding Apps
          <ChevronRight className="w-3.5 h-3.5 text-[#4A4A52]" />
        </Link>
        <Link
          href="/launch"
          className="flex items-center gap-2 px-4 py-2 bg-[#141416] border border-[#2A2A2E] rounded-lg text-sm text-[#C4BAA8] hover:border-[rgba(176,155,113,0.4)] transition-colors"
        >
          <Activity className="w-4 h-4 text-[#B09B71]" />
          View Launch Page
          <ChevronRight className="w-3.5 h-3.5 text-[#4A4A52]" />
        </Link>
        <Link
          href="/press"
          className="flex items-center gap-2 px-4 py-2 bg-[#141416] border border-[#2A2A2E] rounded-lg text-sm text-[#C4BAA8] hover:border-[rgba(176,155,113,0.4)] transition-colors"
        >
          <AlertCircle className="w-4 h-4 text-[#B09B71]" />
          Press Kit
          <ChevronRight className="w-3.5 h-3.5 text-[#4A4A52]" />
        </Link>
      </div>

      {/* Checklist by category */}
      <div className="space-y-4">
        {categories.map(category => {
          const items = checklist.filter(i => i.category === category);
          const catDone = items.filter(i => i.done).length;
          return (
            <div key={category} className="bg-[#141416] border border-[#2A2A2E] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2A2A2E]">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${CATEGORY_COLORS[category]}`}>
                    {CATEGORY_LABELS[category]}
                  </span>
                </div>
                <span className="text-xs text-[#4A4A52]">{catDone} / {items.length}</span>
              </div>
              <div className="divide-y divide-[#1E1E22]">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-[#1A1A1E] transition-colors group"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {item.done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#3A3A3E] group-hover:text-[#5A5A62] transition-colors" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${item.done ? 'text-[#8A8070] line-through' : 'text-[#C4BAA8]'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-[#4A4A52] mt-0.5">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#4A4A52] text-center pb-4">
        Checklist state saved locally in your browser.
      </p>
    </div>
  );
}
