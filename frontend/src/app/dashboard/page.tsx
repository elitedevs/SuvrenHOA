'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useProperty } from '@/hooks/useProperty';
import { useDuesStatus } from '@/hooks/useTreasury';
import Link from 'next/link';

export default function DashboardPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to view your property</p>
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
  } = useProperty();

  const { isCurrent, quartersOwed, amountOwed } = useDuesStatus(tokenId);

  if (!hasProperty) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">My Property</h1>
        <div className="p-8 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
          <p className="text-4xl mb-4">🏠</p>
          <h3 className="text-lg font-medium mb-2">No Property Found</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Your wallet doesn&apos;t hold a Faircroft Property NFT.
            If you&apos;re a homeowner, contact the board to have your property minted.
          </p>
          <p className="text-xs text-gray-500 mt-4 font-mono">{address}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Property</h1>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
          Lot #{tokenId}
        </span>
      </div>

      {/* Property Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
          <h3 className="text-sm text-gray-400 mb-1">Address</h3>
          <p className="text-lg font-medium">
            {propertyInfo?.streetAddress || 'Loading...'}
          </p>
          {propertyInfo?.squareFootage && (
            <p className="text-xs text-gray-500 mt-1">
              {Number(propertyInfo.squareFootage).toLocaleString()} sq ft
            </p>
          )}
        </div>

        <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
          <h3 className="text-sm text-gray-400 mb-1">Voting Power</h3>
          <p className="text-3xl font-bold text-purple-400">{votes}</p>
          <p className="text-xs text-gray-500 mt-1">
            of {totalSupply} total votes in community
          </p>
        </div>

        <div className={`p-6 rounded-xl border ${
          isCurrent === undefined ? 'border-gray-800 bg-gray-900/50' :
          isCurrent ? 'border-green-900/50 bg-green-950/20' : 'border-red-900/50 bg-red-950/20'
        }`}>
          <h3 className="text-sm text-gray-400 mb-1">Dues Status</h3>
          {isCurrent === undefined ? (
            <p className="text-lg font-medium text-gray-500">Loading...</p>
          ) : isCurrent ? (
            <>
              <p className="text-lg font-medium text-green-400">✓ Current</p>
              <p className="text-xs text-gray-500 mt-1">Your dues are paid up</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-red-400">Past Due</p>
              <p className="text-xs text-gray-500 mt-1">
                {quartersOwed} quarter{quartersOwed !== 1 ? 's' : ''} owed — ${amountOwed}
              </p>
              <Link
                href="/dues"
                className="inline-block mt-2 text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                Pay Now
              </Link>
            </>
          )}
        </div>

        <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
          <h3 className="text-sm text-gray-400 mb-1">Delegation</h3>
          {delegatee === address ? (
            <p className="text-sm text-gray-300">Self-delegated (voting directly)</p>
          ) : (
            <p className="text-sm text-gray-300">
              Delegated to{' '}
              <span className="font-mono text-xs">
                {delegatee?.slice(0, 6)}...{delegatee?.slice(-4)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/proposals', icon: '📋', label: 'Proposals' },
          { href: '/treasury', icon: '💰', label: 'Treasury' },
          { href: '/documents', icon: '📄', label: 'Documents' },
          { href: '/dues', icon: '💳', label: 'Pay Dues' },
        ].map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-purple-500/30 transition-all text-center"
          >
            <span className="text-2xl">{icon}</span>
            <p className="text-sm mt-1">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
