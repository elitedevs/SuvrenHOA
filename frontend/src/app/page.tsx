'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useProperty } from '@/hooks/useProperty';
import { useTreasury } from '@/hooks/useTreasury';
import { useGovernorSettings } from '@/hooks/useProposals';
import { useDocuments } from '@/hooks/useDocuments';
import { ActivityTicker } from '@/components/ActivityTicker';
import { HealthScoreWidget } from '@/components/HealthScoreWidget';
import { DuesReminder } from '@/components/DuesReminder';
import { useAlerts } from '@/hooks/useAlerts';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';
import { WeatherWidget } from '@/components/WeatherWidget';
import { useProfile } from '@/hooks/useProfile';
import { useSupabaseAuth } from '@/context/AuthContext';
import {
  Home as HomeIcon, Vote, FileText, Settings,
  MessageSquare, Zap, Link2,
  AlertTriangle, ChevronRight,
} from 'lucide-react';
import { ResidentSpotlight } from '@/components/ResidentSpotlight';

export default function Home() {
  const { user, loading } = useSupabaseAuth();
  const { isConnected } = useAccount();

  // While loading auth state, show nothing to avoid flash
  if (loading) return null;

  // Authenticated users (via Supabase email auth OR wallet) see dashboard
  // Middleware redirects auth users to /dashboard, but handle client-side too
  if (user || isConnected) return <Dashboard />;

  return <Landing />;
}

function Landing() {
  return (
    <div className="relative overflow-hidden page-enter">
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute inset-0 bg-radial-glow-strong" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[rgba(176,155,113,0.05)] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-20 right-[20%] w-[400px] h-[400px] bg-[rgba(176,155,113,0.03)] blur-[150px] rounded-full bg-orb pointer-events-none" />
      <div className="absolute bottom-20 left-[10%] w-[300px] h-[300px] bg-[#B09B71]/[0.04] blur-[100px] rounded-full bg-orb-slow pointer-events-none" />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[88vh] px-6 text-center">
        {/* Logo mark */}
        <div className="relative mb-10 card-enter card-enter-delay-1">
          <div className="absolute inset-0 blur-2xl opacity-25 bg-[rgba(176,155,113,0.80)] rounded-full scale-[2]" />
          <img src="/logo-full.svg" alt="SuvrenHOA" className="relative h-14 w-auto" />
        </div>

        {/* Headline — 2x+ type jumps */}
        <div className="card-enter card-enter-delay-1">
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:text-6xl lg:text-7xl mb-5 leading-[1.05] text-glow">
            Welcome to{' '}
            <span className="gradient-text text-glow">SuvrenHOA</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xl sm:text-2xl max-w-4xl mx-auto mb-10 leading-relaxed font-medium">
            Transparent, immutable, democratic HOA governance on the blockchain.
            <br className="hidden sm:block" />
            <span className="text-[var(--text-disabled)] text-lg font-normal mt-2 block">No management companies. No hidden spending. No altered records.</span>
          </p>
        </div>

        <div className="mb-16 card-enter card-enter-delay-2 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4B08A] transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--parchment)] transition-colors"
          >
            Already have an account? <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full mb-16 card-enter card-enter-delay-2">
          {[
            { value: '$0.35', label: 'Monthly Cost', sub: 'vs $15K–50K mgmt co', numVal: 0.35, prefix: '$', decimals: 2 },
            { value: '$2.00', label: 'Doc Storage', sub: 'Lifetime, permanent', numVal: 2.00, prefix: '$', decimals: 2 },
            { value: '7 days', label: 'Voting Period', sub: 'Fair + transparent', numVal: 7, prefix: '', suffix: ' days', decimals: 0 },
            { value: '0', label: 'Can Be Altered', sub: 'Documents or votes', numVal: 0, prefix: '', decimals: 0 },
          ].map(({ label, sub, numVal, prefix, suffix, decimals }) => (
            <div key={label} className="glass-card rounded-xl p-6 text-center">
              <p className="text-2xl sm:text-3xl font-normal gradient-text mb-1">
                <AnimatedNumber
                  value={numVal}
                  prefix={prefix}
                  suffix={suffix}
                  decimals={decimals}
                  duration={900}
                />
              </p>
              <p className="text-xs font-medium text-[var(--text-body)] uppercase tracking-wide">{label}</p>
              <p className="text-[11px] text-[var(--text-disabled)] mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl w-full card-enter card-enter-delay-3">
          {[
            {
              icon: '',
              title: '1 Lot = 1 Vote',
              desc: 'Every property gets equal representation through a soulbound NFT. No proxy manipulation, no whale voting.',
              accent: 'gold',
              borderColor: 'border-l-[rgba(176,155,113,0.50)]',
            },
            {
              icon: '',
              title: 'Transparent Treasury',
              desc: 'Every dollar in and out is recorded on-chain. Real-time balances, automatic 80/20 operating/reserve split.',
              accent: 'green',
              borderColor: '',
            },
            {
              icon: '',
              title: 'Permanent Records',
              desc: "CC&Rs, minutes, and budgets stored on Arweave. Drag-drop any file to verify it hasn't been altered.",
              accent: 'blue',
              borderColor: '',
            },
          ].map(({ icon, title, desc, accent, borderColor }) => (
            <div
              key={title}
              className={`glass-card rounded-xl p-8 text-left group border-l-2 ${borderColor}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-200 ${
                accent === 'gold' ? 'bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.20)]' :
                accent === 'green' ? 'bg-[rgba(42,93,79,0.10)] border border-[rgba(42,93,79,0.20)]' :
                'bg-[rgba(90,122,154,0.10)] border border-[rgba(90,122,154,0.20)]'
              }`}>
                {icon}
              </div>
              <h3 className="font-medium text-base mb-3 text-[var(--parchment)]">{title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-20 max-w-2xl w-full card-enter card-enter-delay-4">
          <h2 className="text-2xl font-medium mb-8 gradient-text text-center">How It Works</h2>
          <div className="space-y-0">
            {[
              { step: '1', title: 'Sign In', desc: 'Use your email or Coinbase account — no crypto knowledge needed, no apps to install' },
              { step: '2', title: 'View Your Property', desc: 'See your lot, voting power, and dues status on your personal dashboard' },
              { step: '3', title: 'Participate', desc: 'Vote on proposals, pay dues in USDC, and verify community documents' },
              { step: '4', title: 'Full Transparency', desc: 'Every vote, every dollar, every document — permanently recorded and publicly verifiable' },
            ].map(({ step, title, desc }, i, arr) => (
              <div key={step} className="relative flex gap-5 items-start pb-8 last:pb-0">
                {/* Timeline line */}
                {i < arr.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gradient-to-b from-[rgba(176,155,113,0.25)] to-transparent" />
                )}
                <div className="w-8 h-8 rounded-full bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.40)] flex items-center justify-center text-sm font-medium text-[#B09B71] shrink-0 relative z-10">
                  {step}
                </div>
                <div className="pt-0.5">
                  <h4 className="font-medium text-sm text-[var(--parchment)] mb-1">{title}</h4>
                  <p className="text-sm text-[var(--text-disabled)] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 glass-card rounded-xl p-8 max-w-lg w-full text-center card-enter card-enter-delay-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.25)] flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-5 h-5 text-[#B09B71]" />
          </div>
          <p className="text-base font-medium text-[var(--parchment)] mb-2">
            No management company needed.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            No monthly fees. Just transparent governance on the blockchain.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-medium text-sm hover:bg-[#C4B08A] transition-colors"
          >
            Get Started
          </Link>
        </div>

        <div className="h-16" /> {/* Bottom breathing room */}
      </section>
    </div>
  );
}

function Dashboard() {
  const { hasProperty, votes, totalSupply, tokenId, propertyInfo } = useProperty();
  const { getActiveAlerts } = useAlerts();
  const activeAlertCount = getActiveAlerts().length;
  const { totalBalance, operatingBalance, reserveBalance } = useTreasury();
  const { activeProposalCount } = useGovernorSettings();
  const { documentCount } = useDocuments();
  const { profile } = useProfile();
  const displayName = profile?.display_name || (tokenId !== undefined ? `Lot #${tokenId}` : null);

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 page-enter">
        {/* Welcome header */}
        <div className="mb-10">
          <p className="text-sm text-[var(--text-disabled)] font-medium uppercase tracking-widest mb-2">Dashboard</p>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">
            {hasProperty ? (
              <>
                Welcome Back,{' '}
                <span className="gradient-text text-glow">{displayName}</span>
              </>
            ) : (
              <>
                Welcome to{' '}
                <span className="gradient-text">SuvrenHOA</span>
              </>
            )}
          </h1>
          {hasProperty && propertyInfo && (
            <p className="text-[var(--text-muted)] text-base mt-2 font-medium">
              {propertyInfo.streetAddress}
              <span className="text-[var(--text-disabled)] mx-2">·</span>
              <span className="text-[var(--text-disabled)]">{Number(propertyInfo.squareFootage).toLocaleString()} sq ft</span>
            </p>
          )}
        </div>

        {/* Primary Stats — 3 above-fold highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 card-enter card-enter-delay-1">
          <div className="glass-card rounded-xl p-6">
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-3">Voting Power</p>
            <AnimatedNumber
              value={Number(votes)}
              className="text-4xl font-normal text-[#B09B71] number-reveal leading-none mb-1 block"
              duration={800}
            />
            <p className="text-[11px] text-[var(--text-disabled)] font-medium">of {totalSupply} total votes</p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-3">Treasury</p>
            <AnimatedNumber
              value={parseFloat(String(totalBalance).replace(/,/g, '')) || 0}
              prefix="$"
              format
              className="text-4xl font-normal gradient-text-green leading-none mb-1 block"
              duration={1000}
            />
            <p className="text-[11px] text-[var(--text-disabled)] font-medium">community USDC</p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-3">Active Proposals</p>
            <AnimatedNumber
              value={activeProposalCount}
              className="text-4xl font-normal text-[#B09B71] leading-none mb-1 block"
              duration={600}
            />
            <p className="text-[11px] text-[var(--text-disabled)] font-medium">open for voting</p>
          </div>
        </div>

        {/* Smart Dues Reminder — only shows when connected and has a property */}
        {hasProperty && (
          <div className="mb-6 card-enter card-enter-delay-2">
            <DuesReminder compact />
          </div>
        )}

        {/* Below-fold: Secondary content */}
        {/* HOA Health + Documents stat — moved below fold */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 card-enter card-enter-delay-3">
          <HealthScoreWidget />
          <div className="glass-card rounded-xl p-6">
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-3">Documents</p>
            <AnimatedNumber
              value={documentCount}
              className="text-4xl font-normal text-[#B09B71] number-reveal leading-none mb-1 block"
              duration={700}
            />
            <p className="text-[11px] text-[var(--text-disabled)] font-medium">on-chain records</p>
          </div>
        </div>

        {/* Onboarding checklist — below fold */}
        <div className="mb-6 card-enter card-enter-delay-3">
          <OnboardingChecklist />
        </div>

        {/* Resident Spotlight — below fold */}
        <div className="mb-8 card-enter card-enter-delay-3">
          <ResidentSpotlight />
        </div>

        {/* Alerts Quick Link */}
        {activeAlertCount > 0 && (
          <div className="mt-6 card-enter card-enter-delay-2">
            <Link href="/alerts" className="glass-card rounded-xl p-5 group block shadow-[0_0_20px_rgba(107,58,58,0.15)] hover:shadow-[0_0_30px_rgba(107,58,58,0.25)] transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-[#8B5A5A] group-hover:scale-110 transition-transform duration-200" />
                  <div>
                    <h3 className="font-medium text-base text-[#8B5A5A] group-hover:text-[rgba(107,58,58,0.80)] transition-colors">Active Community Alerts</h3>
                    <p className="text-sm text-[var(--text-muted)]">There {activeAlertCount === 1 ? "is" : "are"} {activeAlertCount} active alert{activeAlertCount !== 1 ? "s" : ""} requiring attention</p>
                  </div>
                </div>
                <span className="min-w-[28px] h-7 px-2 rounded-full bg-[#8B5A5A] text-[var(--text-heading)] text-sm font-medium flex items-center justify-center animate-pulse">
                  {activeAlertCount}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Blockchain Trust Banner */}
        <div className="mt-10 glass-card rounded-xl p-7 card-enter card-enter-delay-3">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.25)] flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5 text-[#B09B71]" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-[#D4C4A0] mb-1">Powered by Base Blockchain</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Every vote, every dollar, every document is permanently recorded on the Base blockchain (Ethereum L2).
                This data cannot be altered, deleted, or hidden by anyone — not the board, not a management company, not anyone.
              </p>
            </div>
          </div>
        </div>

        {/* Live Activity Ticker */}
        <div className="mt-10 card-enter card-enter-delay-4">
          <ActivityTicker />
        </div>
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: '/dashboard', icon: <HomeIcon className="w-5 h-5 text-[#B09B71]" />, label: 'My Property', desc: 'Lots, pets, vehicles', color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)] hover:bg-[rgba(176,155,113,0.18)] border-[rgba(176,155,113,0.20)] hover:border-[rgba(176,155,113,0.40)]' },
  { href: '/proposals', icon: <Vote className="w-5 h-5 text-[#B09B71]" />, label: 'Governance', desc: 'Proposals & treasury', color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)] hover:bg-[rgba(176,155,113,0.18)] border-[rgba(176,155,113,0.20)] hover:border-[rgba(176,155,113,0.40)]' },
  { href: '/community', icon: <MessageSquare className="w-5 h-5 text-[#2A5D4F]" />, label: 'Community', desc: 'Forum & documents', color: 'text-[#2A5D4F]', bg: 'bg-[rgba(42,93,79,0.10)] hover:bg-[rgba(42,93,79,0.15)] border-[rgba(42,93,79,0.20)] hover:border-[rgba(42,93,79,0.30)]' },
];

function QuickActions() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-[var(--parchment)] flex items-center gap-2"><Zap className="w-4 h-4 text-[#B09B71]" /> Quick Actions</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {QUICK_ACTIONS.map(({ href, icon, label, desc, color, bg }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 group ${bg}`}
          >
            <span className="group-hover:scale-110 transition-transform duration-200 inline-block shrink-0">{icon}</span>
            <div className="min-w-0">
              <p className={`text-xs font-normal ${color} leading-tight`}>{label}</p>
              <p className="text-[10px] text-[var(--text-disabled)] mt-0.5 truncate">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
