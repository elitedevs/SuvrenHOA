'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useProperty } from '@/hooks/useProperty';
import { useTreasury, useDuesStatus } from '@/hooks/useTreasury';
import { useGovernorSettings } from '@/hooks/useProposals';
import { useDocuments } from '@/hooks/useDocuments';
import { ActivityTicker } from '@/components/ActivityTicker';
import { HealthScoreWidget } from '@/components/HealthScoreWidget';
import { DuesReminder } from '@/components/DuesReminder';
import { useAlerts } from '@/hooks/useAlerts';

export default function Home() {
  const { isConnected } = useAccount();
  return isConnected ? <Dashboard /> : <Landing />;
}

function Landing() {
  return (
    <div className="relative overflow-hidden page-enter">
      <div className="absolute inset-0 bg-radial-glow-strong" />

      <section className="relative flex flex-col items-center justify-center min-h-[88vh] px-6 text-center">
        {/* Logo mark */}
        <div className="relative mb-10 page-enter page-enter-delay-1">
          <div className="relative w-20 h-20 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-surface)', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
            <span className="text-4xl font-heading" style={{ color: 'var(--accent-brass)', fontFamily: 'var(--font-heading), Georgia, serif' }}>S</span>
          </div>
        </div>

        {/* Headline */}
        <div className="page-enter page-enter-delay-1">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-5" style={{ fontWeight: 400 }}>
            Welcome to <span style={{ color: 'var(--accent-brass)' }}>SuvrenHOA</span>
          </h1>
          <p className="max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Transparent, immutable, democratic HOA governance.
            No management companies. No hidden spending. No altered records.
          </p>
        </div>

        <div className="mb-16 page-enter page-enter-delay-2">
          <ConnectButton label="Sign In to Get Started" />
        </div>

        {/* Stats — text, not cards */}
        <div className="max-w-lg w-full mb-16 page-enter page-enter-delay-2">
          <div className="flex justify-center gap-12 text-center">
            {[
              { value: '$0.35/mo', label: 'Operating cost' },
              { value: '7 days', label: 'Voting period' },
              { value: '0', label: 'Records altered' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-heading" style={{ fontFamily: 'var(--font-heading), Georgia, serif', color: 'var(--accent-brass)' }}>{value}</p>
                <p className="text-[11px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features — minimal, no emoji */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-[960px] w-full page-enter page-enter-delay-3">
          {[
            {
              title: '1 Lot = 1 Vote',
              desc: 'Every property gets equal representation through a soulbound NFT. No proxy manipulation.',
            },
            {
              title: 'Transparent Treasury',
              desc: 'Every dollar recorded permanently. Real-time balances with automatic 80/20 operating and reserve split.',
            },
            {
              title: 'Permanent Records',
              desc: 'CC&Rs, minutes, and budgets stored permanently. Verify any document hasn\'t been altered.',
            },
          ].map(({ title, desc }) => (
            <div key={title} className="glass-card rounded-lg p-8 text-left">
              <h3 className="text-lg mb-3" style={{ fontFamily: 'var(--font-heading), Georgia, serif', color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-20 max-w-lg w-full page-enter page-enter-delay-4">
          <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'var(--font-heading), Georgia, serif' }}>How It Works</h2>
          <div className="space-y-0">
            {[
              { step: '1', title: 'Sign In', desc: 'Use your email or Coinbase account — no crypto knowledge needed' },
              { step: '2', title: 'View Your Property', desc: 'See your lot, voting power, and dues status' },
              { step: '3', title: 'Participate', desc: 'Vote on proposals, pay dues, verify documents' },
              { step: '4', title: 'Full Transparency', desc: 'Every vote, every dollar — permanently recorded' },
            ].map(({ step, title, desc }, i, arr) => (
              <div key={step} className="relative flex gap-5 items-start pb-8 last:pb-0">
                {i < arr.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, var(--accent-brass), transparent)', opacity: 0.2 }} />
                )}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 relative z-10"
                  style={{ background: 'rgba(176,155,113,0.1)', border: '1px solid rgba(176,155,113,0.25)', color: 'var(--accent-brass)' }}>
                  {step}
                </div>
                <div className="pt-0.5">
                  <h4 className="text-[14px] mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h4>
                  <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 glass-card rounded-lg p-8 max-w-md w-full text-center page-enter page-enter-delay-4">
          <p className="text-[15px] mb-2" style={{ color: 'var(--text-primary)' }}>
            No management company needed.
          </p>
          <p className="text-[13px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            Transparent governance, permanently recorded.
          </p>
          <ConnectButton label="Get Started" />
        </div>

        <div className="h-16" />
      </section>
    </div>
  );
}

function Dashboard() {
  const { hasProperty, votes, totalSupply, tokenId, propertyInfo } = useProperty();
  const { isCurrent, quartersOwed } = useDuesStatus(tokenId);
  const { getActiveAlerts } = useAlerts();
  const activeAlertCount = getActiveAlerts().length;
  const { totalBalance, operatingBalance, reserveBalance } = useTreasury();
  const { activeProposalCount } = useGovernorSettings();
  const { documentCount } = useDocuments();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative max-w-[960px] mx-auto py-8 sm:py-12 page-enter">
        {/* Greeting — prose style, first name only feel */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl tracking-tight" style={{ fontWeight: 400 }}>
            {hasProperty ? (
              <>
                {greeting}, <span style={{ color: 'var(--accent-brass)' }}>Lot #{tokenId}</span>
              </>
            ) : (
              <>
                {greeting}, <span style={{ color: 'var(--accent-brass)' }}>welcome</span>
              </>
            )}
          </h1>
          {/* Prose summary — one sentence replaces multiple stat cards */}
          {hasProperty && propertyInfo && (
            <p className="text-[15px] mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {propertyInfo.streetAddress}
              {propertyInfo.squareFootage ? ` — ${Number(propertyInfo.squareFootage).toLocaleString()} sq ft` : ''}.
              {votes !== undefined && totalSupply !== undefined && (
                <> You hold {Number(votes)} of {totalSupply} votes.</>
              )}
              {quartersOwed > 0 ? (
                <span style={{ color: '#6B3A3A' }}> {quartersOwed} quarter{quartersOwed > 1 ? 's' : ''} past due.</span>
              ) : isCurrent ? (
                <span style={{ color: '#2A5D4F' }}> Dues current.</span>
              ) : null}
            </p>
          )}
        </div>

        {/* Data as prose — concierge narrates, dashboards display */}
        <p className="text-[15px] mb-8 leading-relaxed page-enter page-enter-delay-1" style={{ color: 'var(--text-secondary)' }}>
          {votes !== undefined && totalSupply !== undefined && (
            <>You hold {Number(votes)} of {Number(totalSupply)} votes. </>
          )}
          The treasury has ${totalBalance || '0'} allocated.
          {activeProposalCount !== undefined && activeProposalCount > 0
            ? ` ${activeProposalCount} proposal${activeProposalCount > 1 ? 's are' : ' is'} open for voting.`
            : ' No proposals are open.'
          }
        </p>

        {/* Dues reminder — concierge style */}
        {hasProperty && (
          <div className="mb-8 page-enter page-enter-delay-2">
            <DuesReminder compact />
          </div>
        )}

        {/* Community pulse — minimal navigation cards, no emoji */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 page-enter page-enter-delay-2">
          {[
            { href: '/dashboard', title: 'My Property', desc: 'Lot details, voting power, and dues status' },
            { href: '/proposals', title: 'Proposals', desc: 'Vote on active proposals or create a new one' },
            { href: '/treasury', title: 'Treasury', desc: `$${totalBalance || '0'} in community funds` },
            { href: '/documents', title: 'Documents', desc: `${documentCount || 0} community records` },
            { href: '/dues', title: 'Pay Dues', desc: 'Quarterly or annual payments in USDC' },
            { href: '/community', title: 'Community', desc: 'Forum, events, directory, and more' },
          ].map(({ href, title, desc }) => (
            <Link key={href} href={href} className="glass-card rounded-lg p-6 group block hover-lift">
              <h3 className="text-[18px] mb-2 group-hover:opacity-80 transition-opacity" style={{ fontFamily: 'var(--font-heading), Georgia, serif', color: 'var(--text-primary)' }}>
                {title}
              </h3>
              <p className="text-[13px]" style={{ color: 'rgba(245, 240, 232, 0.45)' }}>{desc}</p>
            </Link>
          ))}
        </div>

        {/* Alerts — subtle, no red screaming */}
        {activeAlertCount > 0 && (
          <div className="mt-6 page-enter page-enter-delay-2">
            <Link href="/alerts" className="glass-card rounded-lg p-5 group block" style={{ borderLeft: '2px solid #6B3A3A' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px]" style={{ color: '#8B5A5A' }}>Active Community Alerts</h3>
                  <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    {activeAlertCount} alert{activeAlertCount !== 1 ? 's' : ''} requiring attention
                  </p>
                </div>
                <span className="text-[13px] px-2 py-1 rounded" style={{ background: 'rgba(107,58,58,0.15)', color: '#8B5A5A' }}>
                  {activeAlertCount}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Live Activity — below the fold */}
        <div className="mt-10 page-enter page-enter-delay-3">
          <ActivityTicker />
        </div>
      </div>
    </div>
  );
}
