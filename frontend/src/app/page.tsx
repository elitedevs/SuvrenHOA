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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[88vh] px-6 text-center">
        {/* Logo mark */}
        <div className="relative mb-10 page-enter page-enter-delay-1">
          <div className="absolute inset-0 blur-2xl opacity-25 bg-purple-500 rounded-full scale-[2]" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-400 via-purple-500 to-purple-800 flex items-center justify-center glow-purple pulse-glow shadow-2xl">
            <span className="text-5xl font-black text-white">S</span>
          </div>
        </div>

        {/* Headline — 2x+ type jumps */}
        <div className="page-enter page-enter-delay-1">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-5 tracking-tight leading-[1.05]">
            Welcome to{' '}
            <span className="gradient-text">SuvrenHOA</span>
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
            { value: '$0.35', label: 'Monthly Cost', sub: 'vs $15K–50K mgmt co' },
            { value: '$2.00', label: 'Doc Storage', sub: 'Lifetime, permanent' },
            { value: '7 days', label: 'Voting Period', sub: 'Fair + transparent' },
            { value: '0', label: 'Can Be Altered', sub: 'Documents or votes' },
          ].map(({ value, label, sub }) => (
            <div key={label} className="glass-card rounded-2xl p-6 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold gradient-text mb-1">{value}</p>
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
              accent: 'purple',
              borderColor: 'border-l-purple-500/50',
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
                accent === 'purple' ? 'bg-purple-500/10 border border-purple-500/20' :
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
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gradient-to-b from-purple-500/30 to-transparent" />
                )}
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-sm font-bold text-purple-400 shrink-0 relative z-10">
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
        <div className="mt-20 glass-card rounded-2xl p-8 max-w-lg w-full text-center glow-purple page-enter page-enter-delay-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-xl mx-auto mb-4">
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
                <span className="gradient-text">Lot #{tokenId}</span>
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
            <p className="text-4xl font-extrabold text-purple-400 leading-none mb-1">{votes}</p>
            <p className="text-[11px] text-gray-600 font-medium">of {totalSupply} total votes</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Treasury</p>
            <p className="text-4xl font-extrabold gradient-text-green leading-none mb-1">${totalBalance}</p>
            <p className="text-[11px] text-gray-600 font-medium">community USDC</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Active Proposals</p>
            <p className="text-4xl font-extrabold text-blue-400 leading-none mb-1">{activeProposalCount}</p>
            <p className="text-[11px] text-gray-600 font-medium">open for voting</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Documents</p>
            <p className="text-4xl font-extrabold text-amber-400 leading-none mb-1">{documentCount}</p>
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
              accent: 'purple',
              borderColor: 'border-l-purple-500/50',
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
              className={`glass-card rounded-2xl p-7 group block border-l-2 ${borderColor}`}
            >
              <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform duration-200 inline-block">{icon}</span>
              <h3 className="font-bold text-base mb-2 group-hover:text-purple-300 transition-colors duration-200 text-gray-100">
                {title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Blockchain Trust Banner */}
        <div className="mt-10 glass-card rounded-2xl p-7 glow-purple border-l-2 border-l-purple-500/50 page-enter page-enter-delay-3">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-xl shrink-0">
              🔗
            </div>
            <div>
              <h3 className="font-bold text-sm text-purple-300 mb-1">Powered by Base Blockchain</h3>
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
