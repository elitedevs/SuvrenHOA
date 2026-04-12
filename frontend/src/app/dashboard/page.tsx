'use client';
import { AuthWall } from '@/components/AuthWall';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useProperty } from '@/hooks/useProperty';
import { useDuesStatus } from '@/hooks/useTreasury';
import { useMessages } from '@/hooks/useMessages';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useProfile } from '@/hooks/useProfile';
import { PropertySelector } from '@/components/PropertySelector';
import { QRModal } from '@/components/QRCode';
import { PropertyImprovements } from '@/components/PropertyImprovements';
import Link from 'next/link';
import {
  Home, MessageSquare, ClipboardList, DollarSign, FileText, CreditCard,
  Smartphone, TrendingUp, Check, AlertCircle, ChevronRight, X,
} from 'lucide-react';

// Skeleton shimmer for property loading
function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 page-enter animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-3 w-24 bg-[rgba(245,240,232,0.06)] rounded mb-2" />
          <div className="h-8 w-48 bg-[rgba(245,240,232,0.08)] rounded" />
        </div>
        <div className="h-9 w-24 bg-[rgba(245,240,232,0.06)] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="glass-card rounded-xl p-7">
          <div className="h-3 w-28 bg-[rgba(245,240,232,0.06)] rounded mb-3" />
          <div className="h-7 w-40 bg-[rgba(245,240,232,0.08)] rounded mb-4" />
          <div className="h-3 w-20 bg-[rgba(245,240,232,0.06)] rounded" />
        </div>
        <div className="glass-card rounded-xl p-7">
          <div className="h-3 w-24 bg-[rgba(245,240,232,0.06)] rounded mb-3" />
          <div className="h-14 w-20 bg-[rgba(245,240,232,0.08)] rounded mb-4" />
          <div className="h-2 w-full bg-[rgba(245,240,232,0.06)] rounded-full" />
        </div>
      </div>
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="h-3 w-32 bg-[rgba(245,240,232,0.06)] rounded mb-4" />
        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[rgba(245,240,232,0.06)] rounded" />)}
        </div>
      </div>
    </div>
  );
}

// Property Insights (inline component) 
const SPARKLINE = [100, 105, 102, 108, 112, 110, 117, 119, 123, 128, 132, 138];
const NEIGH_AVG = 425000;
const CURRENT_EST = 447000;
const YOY_CHANGE = 5.2;

function PropertyInsights() {
  const maxV = Math.max(...SPARKLINE);
  const minV = Math.min(...SPARKLINE);
  const range = maxV - minV || 1;
  const width = 200;
  const height = 40;
  const pts = SPARKLINE.map((v, i) => {
    const x = (i / (SPARKLINE.length - 1)) * width;
    const y = height - ((v - minV) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="glass-card rounded-xl p-6 mb-6 card-enter card-enter-delay-3">
      <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-4">Property Insights</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <p className="text-[10px] text-[var(--text-disabled)] mb-1">Estimated Value</p>
          <p className="text-2xl font-normal text-[#B09B71] number-reveal">${CURRENT_EST.toLocaleString()}</p>
          <p className="text-[11px] text-[#2A5D4F] mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />+{YOY_CHANGE}% YoY
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-disabled)] mb-1">Neighborhood Avg</p>
          <p className="text-xl font-normal text-[var(--text-body)]">${NEIGH_AVG.toLocaleString()}</p>
          <p className="text-[11px] text-[#B09B71] mt-0.5">
            +${(CURRENT_EST - NEIGH_AVG).toLocaleString()} above avg
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-disabled)] mb-2">12-Month Trend</p>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <defs>
              <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B09B71" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#B09B71" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points={pts}
              fill="none"
              stroke="#B09B71"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <p className="text-[10px] text-[var(--text-disabled)] mt-3">Estimates are illustrative. Consult an appraiser for a formal valuation.</p>
    </div>
  );
}

export default function DashboardPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <AuthWall title="My Property" description="View your lots, manage pets and vehicles, track inspections — all tied to your on-chain property NFT." />;
  }

  return <PropertyDashboard />;
}

function PropertyDashboard() {
  const {
    address,
    hasProperty,
    isLoading,
    error: propertyError,
    votes,
    delegatee,
    totalSupply,
    tokenId,
    propertyInfo,
    properties,
    selectedPropertyIndex,
    setSelectedPropertyIndex,
    hasMultipleProperties,
  } = useProperty();

  const { isCurrent, quartersOwed, amountOwed, error: duesError } = useDuesStatus(tokenId);
  const { totalUnread } = useMessages();
  const { isCompleted } = useOnboarding();
  const { profile } = useProfile();
  const [showQR, setShowQR] = useState(false);
  const [dismissedError, setDismissedError] = useState(false);

  const pageError = propertyError || duesError || null;

  // Show skeleton while blockchain data loads
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!hasProperty) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 page-enter">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">My Property</p>
            <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Property Not Found</h1>
          </div>
        </div>

        <div className="glass-card rounded-xl p-12 text-center">
          <div className="w-20 h-20 rounded-xl bg-[rgba(176,155,113,0.08)] flex items-center justify-center mx-auto mb-6">
            <Home className="w-8 h-8 text-[#B09B71] opacity-60" />
          </div>
          <h3 className="text-xl font-normal mb-3">No properties found. Complete onboarding to get started.</h3>
          <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto leading-relaxed mb-6">
            Your wallet doesn&apos;t hold a Faircroft Property NFT.
            If you&apos;re a homeowner, contact the board to have your property minted.
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="inline-block px-4 py-2.5 rounded-xl bg-[rgba(245,240,232,0.04)]">
              <p className="text-xs text-[var(--text-disabled)] font-mono">{address}</p>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[rgba(176,155,113,0.12)] hover:bg-[rgba(176,155,113,0.20)] text-sm text-[#B09B71] transition-all duration-200"
            >
              Start Onboarding <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 page-enter">
      {/* Error banner */}
      {pageError && !dismissedError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" /> {pageError}</span>
          <button onClick={() => setDismissedError(true)} className="text-red-400/60 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">My Property</p>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text">
            Property Profile
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[rgba(176,155,113,0.08)]">
            <span className="text-sm text-[#B09B71]">
              Lot #{tokenId}
              {hasMultipleProperties && (
                <span className="ml-1 text-xs text-[rgba(176,155,113,0.50)]">
                  ({properties.length} properties)
                </span>
              )}
            </span>
          </div>
          {tokenId !== undefined && (
            <button
              onClick={() => setShowQR(true)}
              className="px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] hover:bg-[rgba(176,155,113,0.08)] text-xs text-[var(--text-muted)] hover:text-[#B09B71] transition-all flex items-center gap-1.5"
              title="Share Property QR Code"
            >
              <Smartphone className="w-3.5 h-3.5" /> Share
            </button>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && <QRModal tokenId={tokenId} onClose={() => setShowQR(false)} />}

      {/* Property Selector — only shows when wallet owns multiple lots */}
      <PropertySelector
        properties={properties}
        selectedIndex={selectedPropertyIndex}
        onSelect={setSelectedPropertyIndex}
      />

      {/* Top block: Address + Dues Status — ONE combined section above fold */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

        {/* Address + Dues combined */}
        <div className="glass-card rounded-xl p-7 card-enter card-enter-delay-1">
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-3">Property Address</p>
          <p className="text-2xl font-normal leading-snug mb-4">
            {propertyInfo?.streetAddress || (
              <span className="skeleton inline-block w-40 h-6 rounded-lg" />
            )}
          </p>
          {propertyInfo?.squareFootage && (
            <p className="text-sm text-[var(--text-disabled)]">
              {Number(propertyInfo.squareFootage).toLocaleString()} sq ft
            </p>
          )}

          {/* Dues inline */}
          <div className="mt-5 pt-5 border-t border-[var(--divider)]">
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">Dues Status</p>
            {isCurrent === undefined ? (
              <div className="skeleton h-5 w-24 rounded" />
            ) : isCurrent ? (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#2A5D4F]" />
                <span className="text-sm text-[var(--text-body)]">Fully paid</span>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-[#8B5A5A] opacity-70" />
                  <span className="text-sm text-[var(--text-body)]">Payment Reminder — {quartersOwed} quarter{quartersOwed !== 1 ? 's' : ''} outstanding</span>
                </div>
                <p className="text-base font-normal text-[#8B5A5A] mb-3">${amountOwed}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href="/dues"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[rgba(107,58,58,0.12)] hover:bg-[rgba(107,58,58,0.20)] text-sm text-[#8B5A5A] transition-all duration-200"
                  >
                    Settle Balance <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/loans"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all duration-200"
                    style={{
                      background: 'rgba(176, 155, 113, 0.07)',
                      color: 'rgba(176, 155, 113, 0.70)',
                      border: '1px solid rgba(176, 155, 113, 0.15)',
                    }}
                  >
                    Payment Plan <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Voting Power */}
        <div className="glass-card rounded-xl p-7 card-enter card-enter-delay-2">
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-3">Voting Power</p>
          <div className="flex items-end gap-3 mb-4">
            <p className="text-6xl font-normal text-[#B09B71] leading-none number-reveal">{votes}</p>
            <p className="text-sm text-[var(--text-disabled)] mb-2">vote{Number(votes) !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="progress-bar-track flex-1">
              <div
                className="progress-bar-fill bg-gradient-to-r from-[#8A7A5A] to-[#B09B71]"
                style={{ width: totalSupply > 0 ? `${(Number(votes) / Number(totalSupply)) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-[11px] text-[var(--text-disabled)]">of {totalSupply}</span>
          </div>

          {/* Delegation inline */}
          <div className="mt-5 pt-5 border-t border-[var(--divider)]">
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">Delegation</p>
            {delegatee === address ? (
              <p className="text-sm text-[var(--text-muted)]">Voting directly — self-delegated</p>
            ) : (
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-1">Delegated to:</p>
                <p className="text-sm font-mono text-[var(--text-disabled)] bg-[rgba(245,240,232,0.04)] px-3 py-1.5 rounded-lg inline-block">
                  {delegatee?.slice(0, 6)}...{delegatee?.slice(-4)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Insights */}
      <PropertyInsights />

      {/* Banners */}
      {hasProperty && !isCompleted && (
        <a href="/onboarding" className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-[rgba(176,155,113,0.06)] hover:bg-[rgba(176,155,113,0.10)] transition-all duration-200 mb-4 cursor-pointer no-underline group card-enter card-enter-delay-3">
          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-[#B09B71] opacity-60" />
            <div>
              <p className="text-sm text-[var(--parchment)] group-hover:text-[var(--parchment)]">
                Complete Your Setup
              </p>
              <p className="text-xs text-[var(--text-disabled)]">Finish your move-in onboarding — takes 2 minutes</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-disabled)] group-hover:text-[#B09B71] transition-colors" />
        </a>
      )}

      {totalUnread > 0 && (
        <a href="/messages" className="flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(176,155,113,0.06)] hover:bg-[rgba(176,155,113,0.10)] transition-all duration-200 mb-4 cursor-pointer no-underline card-enter card-enter-delay-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-[#B09B71] opacity-60" />
            <div>
              <p className="text-sm text-[var(--parchment)]">
                {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-[var(--text-disabled)]">Tap to open Messages</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-disabled)]" />
        </a>
      )}

      {/* Quick Actions — below fold */}
      <div className="card-enter card-enter-delay-4">
        <h2 className="text-lg font-normal mb-4 text-[var(--text-body)]">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/messages', icon: <MessageSquare className="w-5 h-5 text-[#B09B71] opacity-70" />, label: 'Messages' },
            { href: '/proposals', icon: <ClipboardList className="w-5 h-5 text-[#B09B71] opacity-70" />, label: 'Proposals' },
            { href: '/treasury', icon: <DollarSign className="w-5 h-5 text-[#B09B71] opacity-70" />, label: 'Treasury' },
            { href: '/documents', icon: <FileText className="w-5 h-5 text-[#B09B71] opacity-70" />, label: 'Documents' },
            { href: '/dues', icon: <CreditCard className="w-5 h-5 text-[#B09B71] opacity-70" />, label: 'Dues' },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="glass-card rounded-xl p-4 text-center group min-h-[80px] flex flex-col items-center justify-center gap-2 relative transition-all duration-200"
            >
              <span className="group-hover:scale-105 transition-transform duration-200">{icon}</span>
              <p className="text-sm text-[var(--text-muted)] group-hover:text-[var(--parchment)] transition-colors duration-200">{label}</p>
              {href === '/messages' && totalUnread > 0 && (
                <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B09B71] text-[#0C0C0E] text-[10px] font-medium flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Property Improvements */}
      <div className="mt-6 card-enter card-enter-delay-4">
        <PropertyImprovements />
      </div>
    </div>
  );
}
