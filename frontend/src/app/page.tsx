'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useProperty } from '@/hooks/useProperty';
import { useTreasury } from '@/hooks/useTreasury';
import { useGovernorSettings } from '@/hooks/useProposals';
import { useDocuments } from '@/hooks/useDocuments';

export default function Home() {
  const { isConnected } = useAccount();
  return isConnected ? <Dashboard /> : <Landing />;
}

function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0 bg-radial-glow" />

      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center min-h-[85vh] px-4 text-center">
        {/* Logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 blur-3xl opacity-30 bg-purple-600 rounded-full scale-150" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center glow-purple">
            <span className="text-4xl font-black text-white">S</span>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
          Welcome to{' '}
          <span className="gradient-text">SuvrenHOA</span>
        </h1>
        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mb-8 leading-relaxed">
          Transparent, immutable, democratic HOA governance on the blockchain.
          No management companies. No hidden spending. No altered records.
        </p>

        <div className="mb-12">
          <ConnectButton />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full mb-12">
          {[
            { value: '$0.35', label: 'Monthly Cost', sub: 'vs $15K-50K mgmt co' },
            { value: '$2.00', label: 'Doc Storage', sub: 'Lifetime, permanent' },
            { value: '7 days', label: 'Voting Period', sub: 'Fair + transparent' },
            { value: '0', label: 'Can Be Altered', sub: 'Documents or votes' },
          ].map(({ value, label, sub }) => (
            <div key={label} className="glass-card rounded-xl p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold gradient-text">{value}</p>
              <p className="text-xs text-gray-300 mt-1">{label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          {[
            {
              icon: '🏠',
              title: '1 Lot = 1 Vote',
              desc: 'Every property gets equal representation through a soulbound NFT. No proxy manipulation, no whale voting.',
              color: 'purple',
            },
            {
              icon: '💰',
              title: 'Transparent Treasury',
              desc: 'Every dollar in and out is recorded on-chain. Real-time balances, automatic 80/20 operating/reserve split.',
              color: 'green',
            },
            {
              icon: '📄',
              title: 'Permanent Records',
              desc: 'CC&Rs, minutes, and budgets stored on Arweave. Drag-drop any file to verify it hasn\'t been altered.',
              color: 'blue',
            },
          ].map(({ icon, title, desc, color }) => (
            <div key={title} className="glass-card rounded-xl p-6 text-left group">
              <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {icon}
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16 max-w-2xl w-full">
          <h2 className="text-xl font-bold mb-6 gradient-text">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Connect Wallet', desc: 'Sign in with Coinbase Smart Wallet — just your email, no crypto knowledge needed' },
              { step: '2', title: 'View Your Property', desc: 'See your lot, voting power, and dues status on your personal dashboard' },
              { step: '3', title: 'Participate', desc: 'Vote on proposals, pay dues in USDC, and verify community documents' },
              { step: '4', title: 'Full Transparency', desc: 'Every vote, every dollar, every document — permanently recorded and publicly verifiable' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400 shrink-0">
                  {step}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 glass-card rounded-xl p-6 max-w-lg w-full text-center glow-purple">
          <p className="text-sm text-gray-300 mb-3">
            No management company needed. No monthly fees. Just transparent governance.
          </p>
          <ConnectButton />
        </div>
      </div>
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

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {hasProperty ? (
              <>Welcome back, <span className="gradient-text">Lot #{tokenId}</span></>
            ) : (
              <>Welcome to <span className="gradient-text">SuvrenHOA</span></>
            )}
          </h1>
          {hasProperty && propertyInfo && (
            <p className="text-gray-400 text-sm mt-1">
              {propertyInfo.streetAddress} · {Number(propertyInfo.squareFootage).toLocaleString()} sq ft
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Voting Power</p>
            <p className="text-2xl font-bold text-purple-400">{votes}</p>
            <p className="text-[10px] text-gray-600">of {totalSupply} total</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Treasury</p>
            <p className="text-2xl font-bold gradient-text-green">${totalBalance}</p>
            <p className="text-[10px] text-gray-600">community funds</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Active Proposals</p>
            <p className="text-2xl font-bold text-blue-400">{activeProposalCount}</p>
            <p className="text-[10px] text-gray-600">open for voting</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Documents</p>
            <p className="text-2xl font-bold text-amber-400">{documentCount}</p>
            <p className="text-[10px] text-gray-600">on-chain records</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: '/dashboard', icon: '🏠', title: 'My Property', desc: 'Lot details, voting power, and dues status', color: 'purple' },
            { href: '/proposals', icon: '🗳️', title: 'Proposals', desc: 'Vote on active proposals or create a new one', color: 'blue' },
            { href: '/treasury', icon: '💰', title: 'Treasury', desc: `$${totalBalance} in community funds — fully transparent`, color: 'green' },
            { href: '/documents', icon: '📄', title: 'Documents', desc: `${documentCount} immutable records — verify any document`, color: 'amber' },
            { href: '/dues', icon: '💳', title: 'Pay Dues', desc: 'Quarterly or annual payments in USDC', color: 'cyan' },
            { href: '/admin', icon: '⚙️', title: 'Admin', desc: 'Board tools: mint properties, register documents', color: 'gray' },
          ].map(({ href, icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="glass-card rounded-xl p-5 group block"
            >
              <span className="text-2xl block mb-3 group-hover:scale-110 transition-transform inline-block">{icon}</span>
              <h3 className="font-semibold text-base mb-1 group-hover:text-purple-400 transition-colors">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Blockchain Trust Banner */}
        <div className="mt-8 glass-card rounded-xl p-5 glow-purple">
          <div className="flex items-start gap-3">
            <span className="text-xl">🔗</span>
            <div>
              <h3 className="font-medium text-sm text-purple-400">Powered by Base Blockchain</h3>
              <p className="text-xs text-gray-400 mt-1">
                Every vote, every dollar, every document is permanently recorded on the Base blockchain (Ethereum L2).
                This data cannot be altered, deleted, or hidden by anyone — not the board, not a management company, not anyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
