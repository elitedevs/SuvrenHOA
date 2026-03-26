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
import {
  Home as HomeIcon, Vote, DollarSign, FileText, CreditCard, Settings,
  Wrench, MessageSquare, ClipboardList, Zap, Link2,
  AlertTriangle,
} from 'lucide-react';
import { ResidentSpotlight } from '@/components/ResidentSpotlight';

export default function Home() {
  const { isConnected } = useAccount();
  return isConnected ? <Dashboard /> : <Landing />;
}

function Landing() {
  return (
    <div className="relative overflow-hidden page-enter">
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute inset-0 bg-radial-glow-strong" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#B09B71]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-20 right-[20%] w-[400px] h-[400px] bg-cyan-500/[0.03] blur-[150px] rounded-full bg-orb pointer-events-none" />
      <div className="absolute bottom-20 left-[10%] w-[300px] h-[300px] bg-[#B09B71]/[0.04] blur-[100px] rounded-full bg-orb-slow pointer-events-none" />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[88vh] px-6 text-center">
        {/* Logo mark */}
        <div className="relative mb-10 card-enter card-enter-delay-1">
          <div className="absolute inset-0 blur-2xl opacity-25 bg-[#B09B71]/80 rounded-full scale-[2]" />
          <img src="/logo-full.svg" alt="SuvrenHOA" className="relative h-14 w-auto" />
        </div>

        {/* Headline — 2x+ type jumps */}
        <div className="card-enter card-enter-delay-1">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-normal mb-5 tracking-tight leading-[1.05] text-glow">
            Welcome to{' '}
            <span className="gradient-text text-glow">SuvrenHOA</span>
          </h1>
          <p className="text-[rgba(245,240,232,0.50)] text-xl sm:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Transparent, immutable, democratic HOA governance on the blockchain.
            <br className="hidden sm:block" />
            <span className="text-[rgba(245,240,232,0.35)] text-lg font-normal mt-2 block">No management companies. No hidden spending. No altered records.</span>
          </p>
        </div>

        <div className="mb-16 card-enter card-enter-delay-2">
          <ConnectButton label="Sign In to Get Started" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full mb-16 card-enter card-enter-delay-2">
          {[
            { value: '$0.35', label: 'Monthly Cost', sub: 'vs $15K–50K mgmt co', numVal: 0.35, prefix: '$', decimals: 2 },
            { value: '$2.00', label: 'Doc Storage', sub: 'Lifetime, permanent', numVal: 2.00, prefix: '$', decimals: 2 },
            { value: '7 days', label: 'Voting Period', sub: 'Fair + transparent', numVal: 7, prefix: '', suffix: ' days', decimals: 0 },
            { value: '0', label: 'Can Be Altered', sub: 'Documents or votes', numVal: 0, prefix: '', decimals: 0 },
          ].map(({ label, sub, numVal, prefix, suffix, decimals }) => (
            <div key={label} className="glass-card rounded-2xl p-6 text-center">
              <p className="text-2xl sm:text-3xl font-normal gradient-text mb-1">
                <AnimatedNumber
                  value={numVal}
                  prefix={prefix}
                  suffix={suffix}
                  decimals={decimals}
                  duration={900}
                />
              </p>
              <p className="text-xs font-semibold text-[rgba(245,240,232,0.65)] uppercase tracking-wide">{label}</p>
              <p className="text-[11px] text-[rgba(245,240,232,0.35)] mt-1">{sub}</p>
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
              borderColor: 'border-l-[#B09B71]/50',
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
              className={`glass-card rounded-2xl p-8 text-left group border-l-2 ${borderColor}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-200 ${
                accent === 'gold' ? 'bg-[#B09B71]/10 border border-[#B09B71]/20' :
                accent === 'green' ? 'bg-[rgba(42,93,79,0.10)] border border-[rgba(42,93,79,0.20)]' :
                'bg-[rgba(90,122,154,0.10)] border border-[rgba(90,122,154,0.20)]'
              }`}>
                {icon}
              </div>
              <h3 className="font-bold text-base mb-3 text-[rgba(245,240,232,0.90)]">{title}</h3>
              <p className="text-sm text-[rgba(245,240,232,0.50)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-20 max-w-2xl w-full card-enter card-enter-delay-4">
          <h2 className="text-2xl font-bold mb-8 gradient-text text-center">How It Works</h2>
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
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gradient-to-b from-[#B09B71]/25 to-transparent" />
                )}
                <div className="w-8 h-8 rounded-full bg-[#B09B71]/15 border border-[#B09B71]/40 flex items-center justify-center text-sm font-bold text-[#B09B71] shrink-0 relative z-10">
                  {step}
                </div>
                <div className="pt-0.5">
                  <h4 className="font-semibold text-sm text-[rgba(245,240,232,0.80)] mb-1">{title}</h4>
                  <p className="text-sm text-[rgba(245,240,232,0.35)] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 glass-card rounded-2xl p-8 max-w-lg w-full text-center card-enter card-enter-delay-4">
          <div className="w-10 h-10 rounded-xl bg-[#B09B71]/10 border border-[#B09B71]/25 flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-5 h-5 text-[#B09B71]" />
          </div>
          <p className="text-base font-semibold text-[rgba(245,240,232,0.80)] mb-2">
            No management company needed.
          </p>
          <p className="text-sm text-[rgba(245,240,232,0.50)] mb-6">
            No monthly fees. Just transparent governance on the blockchain.
          </p>
          <ConnectButton label="Get Started" />
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
          <p className="text-sm text-[rgba(245,240,232,0.35)] font-medium uppercase tracking-widest mb-2">Dashboard</p>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
            {hasProperty ? (
              <>
                Welcome back,{' '}
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
            <p className="text-[rgba(245,240,232,0.50)] text-base mt-2 font-medium">
              {propertyInfo.streetAddress}
              <span className="text-[rgba(245,240,232,0.25)] mx-2">·</span>
              <span className="text-[rgba(245,240,232,0.35)]">{Number(propertyInfo.squareFootage).toLocaleString()} sq ft</span>
            </p>
          )}
        </div>

        {/* Primary Stats — pops more with varied card colors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 card-enter card-enter-delay-1">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] mb-3">Voting Power</p>
            <AnimatedNumber
              value={Number(votes)}
              className="text-4xl font-normal text-[#B09B71] number-reveal leading-none mb-1 block"
              duration={800}
            />
            <p className="text-[11px] text-[rgba(245,240,232,0.25)] font-medium">of {totalSupply} total votes</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] mb-3">Treasury</p>
            <AnimatedNumber
              value={parseFloat(String(totalBalance).replace(/,/g, '')) || 0}
              prefix="$"
              format
              className="text-4xl font-normal gradient-text-green leading-none mb-1 block"
              duration={1000}
            />
            <p className="text-[11px] text-[rgba(245,240,232,0.25)] font-medium">community USDC</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] mb-3">Active Proposals</p>
            <AnimatedNumber
              value={activeProposalCount}
              className="text-4xl font-normal text-[#5A7A9A] leading-none mb-1 block"
              duration={600}
            />
            <p className="text-[11px] text-[rgba(245,240,232,0.25)] font-medium">open for voting</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] mb-3">Documents</p>
            <AnimatedNumber
              value={documentCount}
              className="text-4xl font-normal text-[#B09B71] number-reveal leading-none mb-1 block"
              duration={700}
            />
            <p className="text-[11px] text-[rgba(245,240,232,0.25)] font-medium">on-chain records</p>
          </div>

          {/* HOA Health Score Widget */}
          <HealthScoreWidget />

          {/* Weather Widget */}
          <WeatherWidget />
        </div>

        {/* Onboarding checklist for new residents */}
        <div className="card-enter card-enter-delay-2">
          <OnboardingChecklist />
        </div>

        {/* Smart Dues Reminder — only shows when connected and has a property */}
        {hasProperty && (
          <div className="mb-8 card-enter card-enter-delay-2">
            <DuesReminder compact />
          </div>
        )}

        {/* Resident Spotlight */}
        <div className="mb-8 card-enter card-enter-delay-2">
          <ResidentSpotlight />
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 card-enter card-enter-delay-2">
          {[
            {
              href: '/dashboard',
              icon: <HomeIcon className="w-6 h-6 text-[#B09B71]" />,
              title: 'My Property',
              desc: 'Lot details, voting power, and dues status',
              borderColor: 'border-l-[#B09B71]/50',
            },
            {
              href: '/proposals',
              icon: <Vote className="w-6 h-6 text-[#5A7A9A]" />,
              title: 'Proposals',
              desc: 'Vote on active proposals or create a new one',
              borderColor: '',
            },
            {
              href: '/treasury',
              icon: <DollarSign className="w-6 h-6 text-[#3A7D6F]" />,
              title: 'Treasury',
              desc: `$${totalBalance} in community funds — fully transparent`,
              borderColor: '',
            },
            {
              href: '/documents',
              icon: <FileText className="w-6 h-6 text-[#B09B71]" />,
              title: 'Documents',
              desc: `${documentCount} immutable records — verify any document`,
              borderColor: '',
            },
            {
              href: '/dues',
              icon: <CreditCard className="w-6 h-6 text-cyan-400" />,
              title: 'Pay Dues',
              desc: 'Quarterly or annual payments in USDC',
              borderColor: 'border-l-cyan-500/50',
            },
            {
              href: '/admin',
              icon: <Settings className="w-6 h-6 text-[rgba(245,240,232,0.50)]" />,
              title: 'Admin',
              desc: 'Board tools: mint properties, register documents',
              borderColor: 'border-l-gray-500/50',
            },
          ].map(({ href, icon, title, desc, borderColor }) => (
            <Link
              key={href}
              href={href}
              className={`glass-card rounded-2xl p-7 group block border-l-2 hover-lift ${borderColor}`}
            >
              <span className="block mb-4 group-hover:scale-110 transition-transform duration-200 inline-block">{icon}</span>
              <h3 className="font-bold text-base mb-2 group-hover:text-[#D4C4A0] transition-colors duration-200 text-[rgba(245,240,232,0.90)]">
                {title}
              </h3>
              <p className="text-sm text-[rgba(245,240,232,0.35)] leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Alerts Quick Link */}
        {activeAlertCount > 0 && (
          <div className="mt-6 card-enter card-enter-delay-2">
            <Link href="/alerts" className="glass-card rounded-2xl p-5 group block shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.25)] transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-[#8B5A5A] group-hover:scale-110 transition-transform duration-200" />
                  <div>
                    <h3 className="font-bold text-base text-[#8B5A5A] group-hover:text-[rgba(107,58,58,0.80)] transition-colors">Active Community Alerts</h3>
                    <p className="text-sm text-[rgba(245,240,232,0.50)]">There {activeAlertCount === 1 ? "is" : "are"} {activeAlertCount} active alert{activeAlertCount !== 1 ? "s" : ""} requiring attention</p>
                  </div>
                </div>
                <span className="min-w-[28px] h-7 px-2 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center animate-pulse">
                  {activeAlertCount}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Blockchain Trust Banner */}
        <div className="mt-10 glass-card rounded-2xl p-7 card-enter card-enter-delay-3">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#B09B71]/10 border border-[#B09B71]/25 flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5 text-[#B09B71]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#D4C4A0] mb-1">Powered by Base Blockchain</h3>
              <p className="text-sm text-[rgba(245,240,232,0.50)] leading-relaxed">
                Every vote, every dollar, every document is permanently recorded on the Base blockchain (Ethereum L2).
                This data cannot be altered, deleted, or hidden by anyone — not the board, not a management company, not anyone.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10 card-enter card-enter-delay-3">
          <QuickActions />
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
  { href: '/dues', icon: <CreditCard className="w-5 h-5 text-[#B09B71]" />, label: 'Pay Dues', desc: 'USDC payment', color: 'text-[#B09B71]', bg: 'bg-[#B09B71]/10 hover:bg-[#B09B71]/20 border-[#B09B71]/20 hover:border-[#B09B71]/40' },
  { href: '/maintenance', icon: <Wrench className="w-5 h-5 text-[#5A7A9A]" />, label: 'Submit Request', desc: 'Maintenance', color: 'text-[#5A7A9A]', bg: 'bg-[rgba(90,122,154,0.10)] hover:bg-[rgba(90,122,154,0.15)] border-[rgba(90,122,154,0.20)] hover:border-[rgba(90,122,154,0.30)]' },
  { href: '/documents', icon: <FileText className="w-5 h-5 text-[#B09B71]" />, label: 'Documents', desc: 'View records', color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)] hover:bg-[rgba(176,155,113,0.15)] border-[rgba(176,155,113,0.20)] hover:border-[rgba(176,155,113,0.30)]' },
  { href: '/messages', icon: <MessageSquare className="w-5 h-5 text-[#3A7D6F]" />, label: 'Message Neighbor', desc: 'Community chat', color: 'text-[#3A7D6F]', bg: 'bg-[rgba(42,93,79,0.10)] hover:bg-[rgba(42,93,79,0.15)] border-[rgba(42,93,79,0.20)] hover:border-[rgba(42,93,79,0.30)]' },
  { href: '/proposals', icon: <Vote className="w-5 h-5 text-[#B09B71]" />, label: 'Vote on Proposal', desc: 'Governance', color: 'text-[#B09B71]', bg: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 hover:border-purple-500/40' },
  { href: '/activity', icon: <ClipboardList className="w-5 h-5 text-cyan-400" />, label: 'Activity Log', desc: 'On-chain events', color: 'text-cyan-400', bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 hover:border-cyan-500/40' },
];

function QuickActions() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[rgba(245,240,232,0.80)] flex items-center gap-2"><Zap className="w-4 h-4 text-[#B09B71]" /> Quick Actions</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map(({ href, icon, label, desc, color, bg }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 group ${bg}`}
          >
            <span className="group-hover:scale-110 transition-transform duration-200 inline-block shrink-0">{icon}</span>
            <div className="min-w-0">
              <p className={`text-xs font-bold ${color} leading-tight`}>{label}</p>
              <p className="text-[10px] text-[rgba(245,240,232,0.35)] mt-0.5 truncate">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
