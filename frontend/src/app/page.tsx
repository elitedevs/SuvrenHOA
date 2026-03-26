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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#c9a96e]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-20 right-[20%] w-[400px] h-[400px] bg-cyan-500/[0.03] blur-[150px] rounded-full bg-orb pointer-events-none" />
      <div className="absolute bottom-20 left-[10%] w-[300px] h-[300px] bg-[#c9a96e]/[0.04] blur-[100px] rounded-full bg-orb-slow pointer-events-none" />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[88vh] px-6 text-center">
        {/* Logo mark */}
        <div className="relative mb-10 page-enter page-enter-delay-1">
          <div className="absolute inset-0 blur-2xl opacity-25 bg-[#c9a96e]/80 rounded-full scale-[2]" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#c9a96e] via-[#b8942e] to-[#8a6820] flex items-center justify-center glow-gold pulse-glow shadow-2xl">
            <span className="text-5xl font-black text-white">S</span>
          </div>
        </div>

        {/* Headline — 2x+ type jumps */}
        <div className="page-enter page-enter-delay-1">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-5 tracking-tight leading-[1.05] text-glow">
            Welcome to{' '}
            <span className="gradient-text text-glow">SuvrenHOA</span>
          </h1>
          <p className="text-gray-400 text-xl sm:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Transparent, immutable, democratic HOA governance on the blockchain.
            <br className="hidden sm:block" />
            <span className="text-gray-500 text-lg font-normal mt-2 block">No management companies. No hidden spending. No altered records.</span>
          </p>
        </div>

        <div className="mb-16 page-enter page-enter-delay-2">
          <ConnectButton label="Sign In to Get Started" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full mb-16 page-enter page-enter-delay-2">
          {[
            { value: '$0.35', label: 'Monthly Cost', sub: 'vs $15K–50K mgmt co', numVal: 0.35, prefix: '$', decimals: 2 },
            { value: '$2.00', label: 'Doc Storage', sub: 'Lifetime, permanent', numVal: 2.00, prefix: '$', decimals: 2 },
            { value: '7 days', label: 'Voting Period', sub: 'Fair + transparent', numVal: 7, prefix: '', suffix: ' days', decimals: 0 },
            { value: '0', label: 'Can Be Altered', sub: 'Documents or votes', numVal: 0, prefix: '', decimals: 0 },
          ].map(({ label, sub, numVal, prefix, suffix, decimals }) => (
            <div key={label} className="glass-card rounded-2xl p-6 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold gradient-text mb-1">
                <AnimatedNumber
                  value={numVal}
                  prefix={prefix}
                  suffix={suffix}
                  decimals={decimals}
                  duration={900}
                />
              </p>
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{label}</p>
              <p className="text-[11px] text-gray-500 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl w-full page-enter page-enter-delay-3">
          {[
            {
              icon: '🏠',
              title: '1 Lot = 1 Vote',
              desc: 'Every property gets equal representation through a soulbound NFT. No proxy manipulation, no whale voting.',
              accent: 'gold',
              borderColor: 'border-l-[#c9a96e]/50',
            },
            {
              icon: '💰',
              title: 'Transparent Treasury',
              desc: 'Every dollar in and out is recorded on-chain. Real-time balances, automatic 80/20 operating/reserve split.',
              accent: 'green',
              borderColor: 'border-l-green-500/50',
            },
            {
              icon: '📄',
              title: 'Permanent Records',
              desc: "CC&Rs, minutes, and budgets stored on Arweave. Drag-drop any file to verify it hasn't been altered.",
              accent: 'blue',
              borderColor: 'border-l-blue-500/50',
            },
          ].map(({ icon, title, desc, accent, borderColor }) => (
            <div
              key={title}
              className={`glass-card rounded-2xl p-8 text-left group border-l-2 ${borderColor}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-200 ${
                accent === 'gold' ? 'bg-[#c9a96e]/10 border border-[#c9a96e]/20' :
                accent === 'green' ? 'bg-green-500/10 border border-green-500/20' :
                'bg-blue-500/10 border border-blue-500/20'
              }`}>
                {icon}
              </div>
              <h3 className="font-bold text-base mb-3 text-gray-100">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-20 max-w-2xl w-full page-enter page-enter-delay-4">
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
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gradient-to-b from-[#c9a96e]/25 to-transparent" />
                )}
                <div className="w-8 h-8 rounded-full bg-[#c9a96e]/15 border border-[#c9a96e]/40 flex items-center justify-center text-sm font-bold text-[#c9a96e] shrink-0 relative z-10">
                  {step}
                </div>
                <div className="pt-0.5">
                  <h4 className="font-semibold text-sm text-gray-200 mb-1">{title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 glass-card rounded-2xl p-8 max-w-lg w-full text-center glow-gold page-enter page-enter-delay-4">
          <div className="w-10 h-10 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/25 flex items-center justify-center text-xl mx-auto mb-4">
            🔗
          </div>
          <p className="text-base font-semibold text-gray-200 mb-2">
            No management company needed.
          </p>
          <p className="text-sm text-gray-400 mb-6">
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

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 page-enter">
        {/* Welcome header */}
        <div className="mb-10">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mb-2">Dashboard</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {hasProperty ? (
              <>
                Welcome back,{' '}
                <span className="gradient-text text-glow">Lot #{tokenId}</span>
              </>
            ) : (
              <>
                Welcome to{' '}
                <span className="gradient-text">SuvrenHOA</span>
              </>
            )}
          </h1>
          {hasProperty && propertyInfo && (
            <p className="text-gray-400 text-base mt-2 font-medium">
              {propertyInfo.streetAddress}
              <span className="text-gray-600 mx-2">·</span>
              <span className="text-gray-500">{Number(propertyInfo.squareFootage).toLocaleString()} sq ft</span>
            </p>
          )}
        </div>

        {/* Primary Stats — pops more with varied card colors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 page-enter page-enter-delay-1">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Voting Power</p>
            <AnimatedNumber
              value={Number(votes)}
              className="text-4xl font-extrabold text-[#c9a96e] leading-none mb-1 block"
              duration={800}
            />
            <p className="text-[11px] text-gray-600 font-medium">of {totalSupply} total votes</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Treasury</p>
            <AnimatedNumber
              value={parseFloat(String(totalBalance).replace(/,/g, '')) || 0}
              prefix="$"
              format
              className="text-4xl font-extrabold gradient-text-green leading-none mb-1 block"
              duration={1000}
            />
            <p className="text-[11px] text-gray-600 font-medium">community USDC</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Active Proposals</p>
            <AnimatedNumber
              value={activeProposalCount}
              className="text-4xl font-extrabold text-blue-400 leading-none mb-1 block"
              duration={600}
            />
            <p className="text-[11px] text-gray-600 font-medium">open for voting</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Documents</p>
            <AnimatedNumber
              value={documentCount}
              className="text-4xl font-extrabold text-amber-400 leading-none mb-1 block"
              duration={700}
            />
            <p className="text-[11px] text-gray-600 font-medium">on-chain records</p>
          </div>

          {/* HOA Health Score Widget */}
          <HealthScoreWidget />
        </div>

        {/* Smart Dues Reminder — only shows when connected and has a property */}
        {hasProperty && (
          <div className="mb-8 page-enter page-enter-delay-2">
            <DuesReminder compact />
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 page-enter page-enter-delay-2">
          {[
            {
              href: '/dashboard',
              icon: '🏠',
              title: 'My Property',
              desc: 'Lot details, voting power, and dues status',
              accent: 'gold',
              borderColor: 'border-l-[#c9a96e]/50',
            },
            {
              href: '/proposals',
              icon: '🗳️',
              title: 'Proposals',
              desc: 'Vote on active proposals or create a new one',
              accent: 'blue',
              borderColor: 'border-l-blue-500/50',
            },
            {
              href: '/treasury',
              icon: '💰',
              title: 'Treasury',
              desc: `$${totalBalance} in community funds — fully transparent`,
              accent: 'green',
              borderColor: 'border-l-green-500/50',
            },
            {
              href: '/documents',
              icon: '📄',
              title: 'Documents',
              desc: `${documentCount} immutable records — verify any document`,
              accent: 'amber',
              borderColor: 'border-l-amber-500/50',
            },
            {
              href: '/dues',
              icon: '💳',
              title: 'Pay Dues',
              desc: 'Quarterly or annual payments in USDC',
              accent: 'cyan',
              borderColor: 'border-l-cyan-500/50',
            },
            {
              href: '/admin',
              icon: '⚙️',
              title: 'Admin',
              desc: 'Board tools: mint properties, register documents',
              accent: 'gray',
              borderColor: 'border-l-gray-500/50',
            },
          ].map(({ href, icon, title, desc, borderColor }) => (
            <Link
              key={href}
              href={href}
              className={`glass-card rounded-2xl p-7 group block border-l-2 hover-lift ${borderColor}`}
            >
              <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform duration-200 inline-block">{icon}</span>
              <h3 className="font-bold text-base mb-2 group-hover:text-[#e8d5a3] transition-colors duration-200 text-gray-100">
                {title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Alerts Quick Link */}
        {activeAlertCount > 0 && (
          <div className="mt-6 page-enter page-enter-delay-2">
            <Link href="/alerts" className="glass-card rounded-2xl p-5 group block border-l-2 border-l-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.25)] transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-200 inline-block">🚨</span>
                  <div>
                    <h3 className="font-bold text-base text-red-300 group-hover:text-red-200 transition-colors">Active Community Alerts</h3>
                    <p className="text-sm text-gray-400">There {activeAlertCount === 1 ? "is" : "are"} {activeAlertCount} active alert{activeAlertCount !== 1 ? "s" : ""} requiring attention</p>
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
        <div className="mt-10 glass-card rounded-2xl p-7 glow-gold border-l-2 border-l-[#c9a96e]/50 page-enter page-enter-delay-3">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/25 flex items-center justify-center text-xl shrink-0">
              🔗
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#e8d5a3] mb-1">Powered by Base Blockchain</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Every vote, every dollar, every document is permanently recorded on the Base blockchain (Ethereum L2).
                This data cannot be altered, deleted, or hidden by anyone — not the board, not a management company, not anyone.
              </p>
            </div>
          </div>
        </div>

        {/* Live Activity Ticker */}
        <div className="mt-10 page-enter page-enter-delay-4">
          <ActivityTicker />
        </div>
      </div>
    </div>
  );
}
