'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useProperty } from '@/hooks/useProperty';
import { useDuesStatus } from '@/hooks/useTreasury';
import { useMessages } from '@/hooks/useMessages';
import { useOnboarding } from '@/hooks/useOnboarding';
import { PropertySelector } from '@/components/PropertySelector';
import { QRModal } from '@/components/QRCode';
import Link from 'next/link';

// ── Property Insights (inline component) ──
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
    <div className="glass-card rounded-lg p-6 mb-6 page-enter page-enter-delay-3">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4">Property Insights</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Estimated Value</p>
          <p className="text-2xl font-normal text-[#c9a96e]">${CURRENT_EST.toLocaleString()}</p>
          <p className="text-[11px] text-green-400 font-semibold mt-0.5">+{YOY_CHANGE}% YoY ↑</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Neighborhood Avg</p>
          <p className="text-xl font-bold text-gray-200">${NEIGH_AVG.toLocaleString()}</p>
          <p className="text-[11px] text-[#c9a96e] font-semibold mt-0.5">
            +${(CURRENT_EST - NEIGH_AVG).toLocaleString()} above avg
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-2">12-Month Trend</p>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <defs>
              <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9a96e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#c9a96e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points={pts}
              fill="none"
              stroke="#c9a96e"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <p className="text-[10px] text-gray-600 mt-3">Estimates are illustrative. Consult an appraiser for a formal valuation.</p>
    </div>
  );
}

export default function DashboardPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl mb-2"></div>
        <p className="text-gray-400 text-base font-medium">Sign in to view your property</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return <PropertyDashboard />;
}

function PropertyDashboard() {
  const {
    address,
    hasProperty,
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

  const { isCurrent, quartersOwed, amountOwed } = useDuesStatus(tokenId);
  const { totalUnread } = useMessages();
  const { isCompleted } = useOnboarding();
  const [showQR, setShowQR] = useState(false);

  if (!hasProperty) {
    return (
      <div className="max-w-[960px] mx-auto px-6 py-12 page-enter">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">My Property</p>
            <h1 className="text-3xl font-normal">Property Not Found</h1>
          </div>
        </div>

        {/* Empty state */}
        <div className="glass-card rounded-lg p-12 text-center border-l-2 border-l-amber-500/40">
          <div className="w-20 h-20 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-4xl mx-auto mb-6">
            
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-100">No Property NFT Detected</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
            Your wallet doesn&apos;t hold a Faircroft Property NFT.
            If you&apos;re a homeowner, contact the board to have your property minted.
          </p>
          <div className="inline-block px-4 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/60">
            <p className="text-xs text-gray-500 font-mono">{address}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-6 py-10 page-enter">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">My Property</p>
          <h1 className="text-3xl font-normal tracking-tight">
            Property Profile
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/20">
            <span className="text-sm font-bold text-[#e8d5a3]">
              Lot #{tokenId}
              {hasMultipleProperties && (
                <span className="ml-1 text-xs text-[#c9a96e]/60">
                  ({properties.length} properties)
                </span>
              )}
            </span>
          </div>
          {tokenId !== undefined && (
            <button
              onClick={() => setShowQR(true)}
              className="px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/60 hover:border-[#c9a96e]/30 text-xs font-medium text-gray-400 hover:text-[#e8d5a3] transition-all"
              title="Share Property QR Code"
            >
               Share
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

      {/* Property Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

        {/* Address Card */}
        <div className="glass-card rounded-lg p-7 border-l-2 border-l-[#c9a96e]/50 page-enter page-enter-delay-1">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Property Address</p>
          <p className="text-2xl font-bold text-gray-100 leading-snug mb-2">
            {propertyInfo?.streetAddress || (
              <span className="skeleton inline-block w-40 h-6 rounded-lg" />
            )}
          </p>
          {propertyInfo?.squareFootage && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-500"></span>
              <p className="text-sm text-gray-500 font-medium">
                {Number(propertyInfo.squareFootage).toLocaleString()} sq ft
              </p>
            </div>
          )}
        </div>

        {/* Voting Power — BIG number */}
        <div className="glass-card rounded-lg p-7 border-l-2 border-l-blue-500/50 page-enter page-enter-delay-1">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Voting Power</p>
          <div className="flex items-end gap-3 mb-2">
            <p className="text-6xl font-black text-[#c9a96e] leading-none">{votes}</p>
            <p className="text-sm text-gray-500 font-medium mb-2">vote{Number(votes) !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="progress-bar-track flex-1">
              <div
                className="progress-bar-fill bg-gradient-to-r from-[#c9a96e] to-[#e8d5a3]"
                style={{ width: totalSupply > 0 ? `${(Number(votes) / Number(totalSupply)) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-[11px] text-gray-600 font-medium">of {totalSupply}</span>
          </div>
        </div>

        {/* Dues Status */}
        <div className={`rounded-lg p-7 border-l-2 page-enter page-enter-delay-2 ${
          isCurrent === undefined
            ? 'glass-card border-l-gray-500/40'
            : isCurrent
            ? 'glass-card-success border-l-green-500/50'
            : 'glass-card-danger border-l-red-500/50'
        }`}>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Dues Status</p>

          {isCurrent === undefined ? (
            <div className="space-y-2">
              <div className="skeleton h-7 w-24 rounded-lg" />
              <div className="skeleton h-4 w-36 rounded" />
            </div>
          ) : isCurrent ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <span className="text-xs text-green-400"></span>
                </div>
                <p className="text-xl font-bold text-green-400">Current</p>
              </div>
              <p className="text-sm text-gray-500">Your dues are fully paid up.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <span className="text-xs text-red-400">!</span>
                </div>
                <p className="text-xl font-bold text-red-400">Past Due</p>
              </div>
              <p className="text-sm text-gray-400 mb-1">
                {quartersOwed} quarter{quartersOwed !== 1 ? 's' : ''} owed
              </p>
              <p className="text-lg font-bold text-red-300">${amountOwed}</p>
              <Link
                href="/dues"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-sm font-semibold text-red-300 transition-all duration-200 min-h-[44px]"
              >
                 Pay Now
              </Link>
            </div>
          )}
        </div>

        {/* Delegation */}
        <div className="glass-card rounded-lg p-7 border-l-2 border-l-amber-500/50 page-enter page-enter-delay-2">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Vote Delegation</p>

          {delegatee === address ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-xs">
                  
                </div>
                <p className="text-base font-semibold text-gray-200">Self-delegated</p>
              </div>
              <p className="text-sm text-gray-500">You vote directly on all proposals.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-xs">
                  
                </div>
                <p className="text-base font-semibold text-gray-200">Delegated</p>
              </div>
              <p className="text-sm text-gray-500 mb-1">Votes delegated to:</p>
              <p className="text-sm font-mono text-gray-300 bg-gray-800/50 px-3 py-1.5 rounded-lg inline-block">
                {delegatee?.slice(0, 6)}...{delegatee?.slice(-4)}
              </p>
            </div>
          )}
        </div>
      </div>


      {/* Property Insights */}
      <PropertyInsights />

      {/* Onboarding Banner */}
      {hasProperty && !isCompleted && (
        <a href="/onboarding" className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/30 hover:bg-[#c9a96e]/15 transition-all duration-200 mb-4 cursor-pointer no-underline group">
          <div className="flex items-center gap-3">
            <span className="text-xl"></span>
            <div>
              <p className="text-sm font-semibold text-[#e8d5a3] group-hover:text-[#e8d5a3]">
                Complete Your Setup
              </p>
              <p className="text-xs text-gray-500">Finish your move-in onboarding — takes 2 minutes</p>
            </div>
          </div>
          <span className="text-gray-500 text-sm group-hover:text-[#c9a96e] transition-colors">→</span>
        </a>
      )}

      {/* Unread Messages Banner */}
      {totalUnread > 0 && (
        <a href="/messages" className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/25 hover:bg-[#c9a96e]/10 transition-all duration-200 mb-4 cursor-pointer no-underline">
          <div className="flex items-center gap-3">
            <span className="text-xl"></span>
            <div>
              <p className="text-sm font-semibold text-[#e8d5a3]">
                {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500">Tap to open Messages</p>
            </div>
          </div>
          <span className="text-gray-500 text-sm">→</span>
        </a>
      )}

      {/* Quick Actions */}
      <div className="page-enter page-enter-delay-3">
        <h2 className="text-lg font-bold mb-4 text-gray-200">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/messages', icon: '', label: 'Messages', color: 'gold' },
            { href: '/proposals', icon: '', label: 'Proposals', color: 'blue' },
            { href: '/treasury', icon: '', label: 'Treasury', color: 'green' },
            { href: '/documents', icon: '', label: 'Documents', color: 'amber' },
            { href: '/dues', icon: '', label: 'Pay Dues', color: 'gold' },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="glass-card rounded-xl p-4 text-center group min-h-[80px] flex flex-col items-center justify-center gap-2 hover:border-[#c9a96e]/25 relative"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{icon}</span>
              <p className="text-sm font-semibold text-gray-300 group-hover:text-[#e8d5a3] transition-colors duration-200">{label}</p>
              {href === '/messages' && totalUnread > 0 && (
                <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#c9a96e] text-white text-[10px] font-bold flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
