'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Shield,
  TrendingUp,
  Building2,
  FileText,
  Vote,
  DollarSign,
  Activity,
  ExternalLink,
  CheckCircle2,
  Zap,
  Lock,
  Globe,
  Home,
  ChevronRight,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { usePublicStats } from '@/hooks/usePublicData';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { getContracts } from '@/config/contracts';

const CHAIN_ID = 84532;
const BASESCAN_BASE = 'https://sepolia.basescan.org';

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1200,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    function animate(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.floor(display).toLocaleString('en-US');

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  prefix,
  suffix,
  decimals,
  subtext,
  color = 'purple',
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  subtext?: string;
  color?: 'purple' | 'green' | 'blue' | 'amber';
  loading?: boolean;
}) {
  const colorMap = {
    purple: { icon: 'text-purple-400', glow: 'var(--glow-purple)', bg: 'rgba(139,92,246,0.08)' },
    green:  { icon: 'text-green-400',  glow: 'var(--glow-green)',  bg: 'rgba(34,197,94,0.08)' },
    blue:   { icon: 'text-blue-400',   glow: 'var(--glow-blue)',   bg: 'rgba(59,130,246,0.08)' },
    amber:  { icon: 'text-amber-400',  glow: 'var(--glow-amber)',  bg: 'rgba(245,158,11,0.08)' },
  };
  const c = colorMap[color];

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: c.bg, boxShadow: `0 0 16px ${c.glow}` }}
        >
          <Icon className={`w-4.5 h-4.5 ${c.icon}`} />
        </div>
      </div>

      {loading ? (
        <div className="h-8 w-24 rounded-lg animate-pulse bg-white/[0.06]" />
      ) : (
        <div className="text-3xl font-bold tracking-tight text-white">
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
          />
        </div>
      )}

      {subtext && (
        <p className="text-[12px] text-gray-500 font-medium">{subtext}</p>
      )}
    </div>
  );
}

// ── Relative time ─────────────────────────────────────────────────────────────
function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + ' min ago';
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + ' hr ago';
  return Math.floor(diff / 86_400_000) + ' days ago';
}



// ── Main component ────────────────────────────────────────────────────────────
export function TransparencyDashboard() {
  const stats = usePublicStats();
  const { events, isLoading: eventsLoading } = useActivityFeed();
  const contracts = getContracts(CHAIN_ID);
  const [now, setNow] = useState(Date.now());

  // Keep relative timestamps fresh
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[rgba(255,255,255,0.04)]">
        {/* Background glow orbs */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden
        >
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-20"
            style={{
              background:
                'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute top-16 right-0 w-[400px] h-[400px] rounded-full opacity-10"
            style={{
              background:
                'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-[13px] font-semibold"
               style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(167,139,250,1)' }}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live on Base Sepolia
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            <span className="gradient-text">Full Transparency.</span>
            <br />
            <span className="text-white">Zero Trust Required.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Every dollar, every vote, every document —{' '}
            <span className="text-gray-200 font-semibold">publicly verifiable on the blockchain.</span>
            {' '}No sign-in. No middleman. Just math.
          </p>

          {/* Live stats strip */}
          {!stats.loading && (
            <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-6 py-3 rounded-2xl mx-auto"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-gray-400">{stats.totalProperties} properties</span>
              </div>
              <div className="w-px h-4 bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400">${stats.totalTreasuryStr} USDC treasury</span>
              </div>
              <div className="w-px h-4 bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">{stats.activeProposals} active proposals</span>
              </div>
              <div className="w-px h-4 bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-gray-400">{stats.documentsOnChain} docs on-chain</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">

        {/* ── Stats grid ─────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Live On-Chain Stats</h2>
              <p className="text-[13px] text-gray-500 mt-1">
                Reads directly from smart contracts — no backend, no caching
              </p>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-gray-500">
              {stats.loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              )}
              {stats.loading ? 'Loading…' : 'Auto-refreshes every 30s'}
            </div>
          </div>

          {stats.error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-amber-300"
                 style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              ⚠ {stats.error} — showing cached values
            </div>
          )}

          {/* Treasury row */}
          <div className="mb-3">
            <p className="text-[11px] uppercase tracking-widest text-gray-600 font-semibold mb-3 flex items-center gap-2">
              <span className="inline-block w-3 h-px bg-purple-500/50" />
              Treasury
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={DollarSign}
                label="Total Treasury"
                value={stats.totalTreasuryNum}
                prefix="$"
                suffix=" USDC"
                decimals={2}
                subtext="Operating + Reserve combined"
                color="purple"
                loading={stats.loading}
              />
              <StatCard
                icon={TrendingUp}
                label="Operating Fund"
                value={stats.operatingFundNum}
                prefix="$"
                suffix=" USDC"
                decimals={2}
                subtext="Available for day-to-day expenses"
                color="blue"
                loading={stats.loading}
              />
              <StatCard
                icon={Lock}
                label="Reserve Fund"
                value={stats.reserveFundNum}
                prefix="$"
                suffix=" USDC"
                decimals={2}
                subtext="Emergency & capital reserves"
                color="green"
                loading={stats.loading}
              />
              <StatCard
                icon={Activity}
                label="Total Expenditures"
                value={stats.totalExpenditures}
                subtext="All approved spending records"
                color="amber"
                loading={stats.loading}
              />
            </div>
          </div>

          {/* Community row */}
          <div className="mt-6">
            <p className="text-[11px] uppercase tracking-widest text-gray-600 font-semibold mb-3 flex items-center gap-2">
              <span className="inline-block w-3 h-px bg-blue-500/50" />
              Community
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={Building2}
                label="Total Properties"
                value={stats.totalProperties}
                subtext="Property NFTs minted on-chain"
                color="purple"
                loading={stats.loading}
              />
              <StatCard
                icon={Vote}
                label="Active Proposals"
                value={stats.activeProposals}
                subtext="Open governance votes"
                color="blue"
                loading={stats.loading}
              />
              <StatCard
                icon={FileText}
                label="Documents On-Chain"
                value={stats.documentsOnChain}
                subtext="Archived to Arweave permanently"
                color="amber"
                loading={stats.loading}
              />
              <StatCard
                icon={CheckCircle2}
                label="Dues Collection"
                value={stats.duesCollectionRate}
                suffix="%"
                subtext="Properties currently paid up"
                color="green"
                loading={stats.loading}
              />
            </div>
          </div>
        </section>

        {/* ── Two-column: activity + trust ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Activity Feed */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                Recent Activity
              </h2>
              <span className="text-[12px] text-gray-500">Last 8 hours on-chain</span>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              {eventsLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.05] animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-white/[0.05] animate-pulse" />
                        <div className="h-3 w-1/3 rounded bg-white/[0.04] animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="p-10 text-center">
                  <Activity className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No activity in the last 8 hours</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Transactions will appear here as they happen on-chain
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {events.slice(0, 10).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-lg"
                          style={{ background: 'rgba(139,92,246,0.08)' }}
                        >
                          {event.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-gray-200 font-medium leading-snug">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] text-gray-500">
                              {relativeTime(event.timestamp * 1000)}
                            </span>
                            {event.txHash && (
                              <a
                                href={BASESCAN_BASE + '/tx/' + event.txHash}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-purple-400/70 hover:text-purple-300 flex items-center gap-1 transition-colors"
                              >
                                View tx
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Trust column */}
          <div className="space-y-5">

            {/* Trust indicators */}
            <section>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-green-400" />
                Why Trust This?
              </h2>

              <div className="space-y-3">
                {[
                  {
                    icon: Globe,
                    title: 'Arweave Permanent Storage',
                    desc: 'All documents are stored on Arweave — permanent, immutable, censorship-resistant.',
                    color: 'text-amber-400',
                    bg: 'rgba(245,158,11,0.1)',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Verified Smart Contracts',
                    desc: 'All contracts are open-source and verified on BaseScan. Read the code yourself.',
                    color: 'text-green-400',
                    bg: 'rgba(34,197,94,0.1)',
                  },
                  {
                    icon: Lock,
                    title: 'Multi-Sig Treasury',
                    desc: 'No single party controls the treasury. All spending requires governance approval.',
                    color: 'text-blue-400',
                    bg: 'rgba(59,130,246,0.1)',
                  },
                  {
                    icon: Shield,
                    title: 'On-Chain Voting Records',
                    desc: 'Every vote is a blockchain transaction. Results cannot be changed after the fact.',
                    color: 'text-purple-400',
                    bg: 'rgba(139,92,246,0.1)',
                  },
                ].map((item) => {
                  const TrustIcon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="glass-card rounded-xl p-4 flex items-start gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: item.bg }}
                      >
                        <TrustIcon className={'w-4 h-4 ' + item.color} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-200">{item.title}</p>
                        <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Contract addresses */}
            <section>
              <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Verify the Contracts
              </h2>

              <div className="glass-card rounded-xl overflow-hidden">
                {[
                  { label: 'PropertyNFT', addr: contracts.propertyNFT },
                  { label: 'Treasury', addr: contracts.treasury },
                  { label: 'Governor', addr: contracts.governor },
                  { label: 'Documents', addr: contracts.documentRegistry },
                ].map((c, i, arr) => (
                  <a
                    key={c.label}
                    href={BASESCAN_BASE + '/address/' + c.addr}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      'flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors group' +
                      (i < arr.length - 1 ? ' border-b border-[rgba(255,255,255,0.04)]' : '')
                    }
                  >
                    <div>
                      <p className="text-[12px] font-semibold text-gray-300">{c.label}</p>
                      <p className="text-[11px] text-gray-600 font-mono truncate max-w-[160px]">
                        {c.addr}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-purple-400 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section>
          <div
            className="rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.08) 100%)',
              border: '1px solid rgba(139,92,246,0.2)',
            }}
          >
            {/* Glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 60%)',
              }}
            />

            <div className="relative z-10">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 mx-auto"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                <Shield className="w-7 h-7 text-purple-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Ready to Participate?
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto mb-7 text-base">
                Connect your wallet to vote on proposals, pay dues, manage your property,
                and submit architectural review requests — all on-chain, all transparent.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.59 0.22 296) 0%, oklch(0.52 0.23 293) 100%)',
                    boxShadow: '0 0 24px rgba(139,92,246,0.3)',
                    color: 'white',
                  }}
                >
                  Connect Wallet for Full Access
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={BASESCAN_BASE + '/address/' + contracts.governor}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-gray-300 hover:text-white transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  View on BaseScan
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
