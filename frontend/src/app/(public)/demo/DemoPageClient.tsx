'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard, Vote, DollarSign, FileText, Users,
  ArrowRight, Mail, Building2, Send, Shield,
  TrendingUp, TrendingDown, CheckCircle2, Clock,
  Download, MessageSquare, UserCheck,
} from 'lucide-react';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'voting', label: 'Voting', icon: Vote },
  { key: 'treasury', label: 'Treasury', icon: DollarSign },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'community', label: 'Community', icon: Users },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const STEPS = [
  { num: '01', icon: Mail, title: 'Sign Up', desc: 'Just your email. 30 seconds. No credit card.' },
  { num: '02', icon: Building2, title: 'Set Up Community', desc: 'Name, address, unit count. Import your docs.' },
  { num: '03', icon: Send, title: 'Invite Residents', desc: 'Email invites or QR code at your next meeting.' },
  { num: '04', icon: Shield, title: 'Govern Transparently', desc: 'Vote, manage finances, store documents — permanently.' },
];

/* ── Mock visuals for each tab ──────────────────────────────────────────── */

function DashboardMock() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Health Score', value: '87', color: '#2A5D4F' },
          { label: 'Residents', value: '142', color: '#B09B71' },
          { label: 'Open Proposals', value: '3', color: '#B09B71' },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3 text-center"
               style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)' }}>
            <p className="text-xl font-medium" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-[rgba(245,240,232,0.35)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg p-4" style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)' }}>
        <p className="text-[11px] text-[rgba(245,240,232,0.35)] mb-3 uppercase tracking-wide">Treasury Balance</p>
        <p className="text-2xl font-medium text-[var(--parchment)]">$284,750<span className="text-[14px] text-[rgba(245,240,232,0.35)]">.00</span></p>
        <div className="flex items-center gap-1 mt-1 text-[11px] text-[#2A5D4F]">
          <TrendingUp className="w-3 h-3" /> +$12,400 this month
        </div>
      </div>
      <div className="rounded-lg p-4" style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)' }}>
        <p className="text-[11px] text-[rgba(245,240,232,0.35)] mb-3 uppercase tracking-wide">Recent Activity</p>
        <div className="space-y-2">
          {[
            { text: 'Pool Resurfacing proposal passed', time: '2h ago', icon: CheckCircle2, color: '#2A5D4F' },
            { text: 'Q1 financial report filed', time: '1d ago', icon: FileText, color: '#B09B71' },
            { text: 'New resident joined: Unit 204', time: '2d ago', icon: UserCheck, color: '#B09B71' },
          ].map(a => (
            <div key={a.text} className="flex items-center gap-2 text-[12px]">
              <a.icon className="w-3.5 h-3.5 shrink-0" style={{ color: a.color }} />
              <span className="text-[rgba(245,240,232,0.55)] flex-1">{a.text}</span>
              <span className="text-[rgba(245,240,232,0.25)]">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VotingMock() {
  const total = 89 + 34 + 19;
  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4" style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          {/* V15 Lux fix (circle discipline): hairline keyline status tag. */}
          <span className="px-2 py-0.5 text-[9px] font-medium tracking-[0.18em] uppercase border" style={{ borderColor: 'rgba(42,93,79,0.45)', color: '#2A5D4F' }}>Active</span>
          <span className="text-[11px] text-[rgba(245,240,232,0.30)] flex items-center gap-1"><Clock className="w-3 h-3" /> 2 days left</span>
        </div>
        <h4 className="font-medium text-[var(--parchment)] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Pool Resurfacing Project — $45,000
        </h4>
        <p className="text-[12px] text-[rgba(245,240,232,0.40)] mb-4">
          Approve allocation of reserve funds for community pool resurfacing, scheduled for September 2026.
        </p>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-[#2A5D4F]">For — {89} votes</span>
              <span className="text-[rgba(245,240,232,0.35)]">{Math.round(89/total*100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(245,240,232,0.06)]">
              <div className="h-full rounded-full bg-[#2A5D4F]" style={{ width: `${89/total*100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-red-400/70">Against — {34} votes</span>
              <span className="text-[rgba(245,240,232,0.35)]">{Math.round(34/total*100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(245,240,232,0.06)]">
              <div className="h-full rounded-full bg-red-400/50" style={{ width: `${34/total*100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-[rgba(245,240,232,0.40)]">Abstain — {19} votes</span>
              <span className="text-[rgba(245,240,232,0.35)]">{Math.round(19/total*100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(245,240,232,0.06)]">
              <div className="h-full rounded-full bg-[rgba(245,240,232,0.15)]" style={{ width: `${19/total*100}%` }} />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-[rgba(245,240,232,0.25)] mt-3">Quorum: 67% (currently at 78%) — Every vote permanently recorded on-chain</p>
      </div>
      <div className="rounded-lg p-3" style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)' }}>
        <div className="flex items-center gap-2 text-[12px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2A5D4F]" />
          <span className="text-[rgba(245,240,232,0.50)]">Landscaping Contract Renewal</span>
          <span className="ml-auto text-[10px] text-[#2A5D4F]">Passed 92-18</span>
        </div>
      </div>
      <div className="rounded-lg p-3" style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)' }}>
        <div className="flex items-center gap-2 text-[12px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2A5D4F]" />
          <span className="text-[rgba(245,240,232,0.50)]">2026 Annual Budget Approval</span>
          <span className="ml-auto text-[10px] text-[#2A5D4F]">Passed 104-8</span>
        </div>
      </div>
    </div>
  );
}

function TreasuryMock() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4" style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)' }}>
        <p className="text-[11px] text-[rgba(245,240,232,0.35)] mb-1 uppercase tracking-wide">Total Balance</p>
        <p className="text-2xl font-medium text-[var(--parchment)]">$284,750<span className="text-[14px] text-[rgba(245,240,232,0.35)]">.00</span></p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg p-3" style={{ background: 'rgba(42,93,79,0.08)' }}>
            <p className="text-[10px] text-[rgba(245,240,232,0.35)]">Operating</p>
            <p className="text-sm font-medium text-[var(--parchment)]">$127,200</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(176,155,113,0.06)' }}>
            <p className="text-[10px] text-[rgba(245,240,232,0.35)]">Reserves</p>
            <p className="text-sm font-medium text-[var(--parchment)]">$157,550</p>
          </div>
        </div>
      </div>
      <div className="rounded-lg p-4" style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)' }}>
        <p className="text-[11px] text-[rgba(245,240,232,0.35)] mb-3 uppercase tracking-wide">Recent Transactions</p>
        <div className="space-y-2.5">
          {[
            { desc: 'Dues — Unit 112', amount: '+$425.00', positive: true },
            { desc: 'Landscaping — GreenWorks LLC', amount: '-$2,800.00', positive: false },
            { desc: 'Dues — Unit 305', amount: '+$425.00', positive: true },
            { desc: 'Pool Chemicals — PoolCo', amount: '-$340.00', positive: false },
            { desc: 'Dues — Unit 118', amount: '+$425.00', positive: true },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between text-[12px]">
              <span className="text-[rgba(245,240,232,0.50)]">{t.desc}</span>
              <span className={t.positive ? 'text-[#2A5D4F]' : 'text-[rgba(245,240,232,0.50)]'}>{t.amount}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[rgba(245,240,232,0.20)] mt-3">All transactions immutably recorded on-chain</p>
      </div>
    </div>
  );
}

function DocumentsMock() {
  return (
    <div className="space-y-3">
      {[
        { name: 'CC&Rs — Amended 2026', date: 'Mar 15, 2026', type: 'Governance', hash: '0x7a3f...e2b1' },
        { name: 'Q1 2026 Financial Report', date: 'Apr 1, 2026', type: 'Financial', hash: '0x9c2d...f8a4' },
        { name: 'Board Meeting Minutes — March', date: 'Mar 28, 2026', type: 'Minutes', hash: '0x4b1e...c7d3' },
        { name: 'Insurance Policy Renewal', date: 'Feb 10, 2026', type: 'Insurance', hash: '0x8f5a...d6e2' },
        { name: 'Landscaping Contract 2026', date: 'Jan 15, 2026', type: 'Contract', hash: '0x2c9b...a4f1' },
      ].map((doc) => (
        <div key={doc.name} className="rounded-lg p-3.5 flex items-center gap-3"
             style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)' }}>
          <FileText className="w-4 h-4 text-[#B09B71] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[var(--parchment)] truncate">{doc.name}</p>
            <p className="text-[10px] text-[rgba(245,240,232,0.30)]">{doc.date} &middot; {doc.type} &middot; {doc.hash}</p>
          </div>
          <Download className="w-3.5 h-3.5 text-[rgba(245,240,232,0.25)]" />
        </div>
      ))}
      <p className="text-[10px] text-[rgba(245,240,232,0.20)] mt-2">Stored permanently on Arweave — guaranteed 200+ year preservation</p>
    </div>
  );
}

function CommunityMock() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4" style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)' }}>
        <p className="text-[11px] text-[rgba(245,240,232,0.35)] mb-3 uppercase tracking-wide">Resident Directory</p>
        <div className="space-y-2">
          {[
            { name: 'Sarah Chen', unit: '112', role: 'Board President' },
            { name: 'Marcus Williams', unit: '204', role: 'Treasurer' },
            { name: 'Elena Rodriguez', unit: '305', role: 'Secretary' },
            { name: 'David Kim', unit: '118', role: 'Resident' },
          ].map(r => (
            <div key={r.name} className="flex items-center gap-3 text-[12px]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                   style={{ background: 'rgba(176,155,113,0.12)', color: '#B09B71' }}>
                {r.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <span className="text-[rgba(245,240,232,0.60)]">{r.name}</span>
                <span className="text-[rgba(245,240,232,0.25)]"> &middot; Unit {r.unit}</span>
              </div>
              <span className="text-[10px] text-[#B09B71]">{r.role}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg p-4" style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.06)' }}>
        <p className="text-[11px] text-[rgba(245,240,232,0.35)] mb-3 uppercase tracking-wide flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> Community Forum
        </p>
        <div className="space-y-2.5">
          {[
            { title: 'Noise complaint process?', author: 'D. Kim', replies: 4, time: '3h ago' },
            { title: 'Guest parking policy reminder', author: 'S. Chen', replies: 12, time: '1d ago' },
            { title: 'Pool hours for summer 2026', author: 'E. Rodriguez', replies: 8, time: '2d ago' },
          ].map(t => (
            <div key={t.title} className="flex items-start gap-2 text-[12px]">
              <MessageSquare className="w-3 h-3 text-[rgba(245,240,232,0.20)] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[rgba(245,240,232,0.55)]">{t.title}</p>
                <p className="text-[10px] text-[rgba(245,240,232,0.25)]">{t.author} &middot; {t.replies} replies &middot; {t.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TAB_CONTENT: Record<TabKey, { title: string; desc: string; component: () => React.JSX.Element }> = {
  dashboard: {
    title: 'Community Dashboard',
    desc: 'A single view of everything happening in your community. Health score, treasury balance, active proposals, and recent activity — all updated in real time with tamper-proof data.',
    component: DashboardMock,
  },
  voting: {
    title: 'Transparent Voting',
    desc: 'Every proposal is clear, every vote is permanent, and every result is independently verifiable. No more paper ballots counted behind closed doors.',
    component: VotingMock,
  },
  treasury: {
    title: 'Treasury Visibility',
    desc: 'Every dollar in, every dollar out — visible to every resident. Smart contracts enforce spending rules, and large transactions require multi-signature approval.',
    component: TreasuryMock,
  },
  documents: {
    title: 'Permanent Documents',
    desc: 'CC&Rs, meeting minutes, financial reports — stored permanently with cryptographic proof of authenticity. Documents can never be lost, altered, or quietly replaced.',
    component: DocumentsMock,
  },
  community: {
    title: 'Resident Tools',
    desc: 'Directory, forum, maintenance requests — everything your community needs in one place, connected to the same trusted record-keeping system.',
    component: CommunityMock,
  },
};

export default function DemoPageClient() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const active = TAB_CONTENT[activeTab];
  const ActiveComponent = active.component;

  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--parchment)]">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-16 page-enter">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="gradient-text">See SuvrenHOA in Action</span>
          </h1>
          <p className="text-lg text-[rgba(245,240,232,0.45)] max-w-2xl mx-auto">
            No signup required. Walk through the key features of the platform.
          </p>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ──────────────────────────────────────────────── */}
      <section className="pb-20 page-enter page-enter-delay-1">
        <div className="max-w-5xl mx-auto px-6">
          {/* Tab navigation */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key}
                      onClick={() => setActiveTab(key)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all"
                      style={activeTab === key ? {
                        background: 'rgba(176,155,113,0.15)',
                        color: '#B09B71',
                        border: '1px solid rgba(176,155,113,0.25)',
                      } : {
                        background: 'rgba(245,240,232,0.03)',
                        color: 'rgba(245,240,232,0.45)',
                        border: '1px solid rgba(245,240,232,0.06)',
                      }}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="rounded-xl overflow-hidden"
               style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
            <div className="grid md:grid-cols-5 gap-0">
              {/* Description panel */}
              <div className="md:col-span-3 p-8 flex flex-col justify-center"
                   style={{ borderRight: '1px solid rgba(245,240,232,0.04)' }}>
                <h3 className="text-2xl font-medium text-[var(--parchment)] mb-3"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                  {active.title}
                </h3>
                <p className="text-[14px] text-[rgba(245,240,232,0.50)] leading-relaxed">
                  {active.desc}
                </p>
              </div>
              {/* Visual panel */}
              <div className="md:col-span-2 p-6" style={{ background: 'rgba(245,240,232,0.01)' }}>
                <ActiveComponent />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-20 page-enter page-enter-delay-2">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-medium gradient-text mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}>
              How It Works
            </h2>
            <p className="text-[rgba(245,240,232,0.45)]">Up and running in minutes.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                     style={{ background: 'rgba(176,155,113,0.08)', border: '1px solid rgba(176,155,113,0.15)' }}>
                  <Icon className="w-6 h-6 text-[#B09B71]" />
                </div>
                <p className="text-[11px] text-[#B09B71] font-medium tracking-wider mb-1">STEP {num}</p>
                <h3 className="font-medium text-[var(--parchment)] mb-1">{title}</h3>
                <p className="text-[12px] text-[rgba(245,240,232,0.40)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="pb-24 page-enter page-enter-delay-3">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-xl p-10 sm:p-14 text-center relative overflow-hidden"
               style={{
                 background: 'linear-gradient(135deg, rgba(176,155,113,0.10) 0%, rgba(42,93,79,0.08) 100%)',
                 border: '1px solid rgba(176,155,113,0.2)',
               }}>
            <div className="absolute inset-0 pointer-events-none"
                 style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(176,155,113,0.12) 0%, transparent 60%)' }} />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-medium text-[var(--parchment)] mb-4"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Ready to try it yourself?
              </h2>
              <p className="text-[rgba(245,240,232,0.50)] max-w-lg mx-auto mb-8">
                Invitation only. We&apos;re opening doors slowly to a small cohort of founding communities.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/waitlist"
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-base transition-all duration-200 hover:scale-[1.02]"
                      style={{
                        background: 'linear-gradient(135deg, #B09B71 0%, #8A7A5A 100%)',
                        color: '#0C0C0E',
                        boxShadow: '0 0 32px rgba(176,155,113,0.3)',
                      }}>
                  Reserve Your Seat
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/pricing"
                      className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-medium text-base text-[rgba(245,240,232,0.6)] hover:text-[var(--parchment)] transition-colors"
                      style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)' }}>
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
