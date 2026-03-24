'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Connect your wallet to view your property</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">My Property</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
          <h3 className="text-sm text-gray-400 mb-1">Wallet</h3>
          <p className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
        </div>
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
          <h3 className="text-sm text-gray-400 mb-1">Voting Power</h3>
          <p className="text-2xl font-bold text-purple-400">—</p>
          <p className="text-xs text-gray-500">Loading from PropertyNFT...</p>
        </div>
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
          <h3 className="text-sm text-gray-400 mb-1">Dues Status</h3>
          <p className="text-lg font-medium text-yellow-400">—</p>
          <p className="text-xs text-gray-500">Loading from Treasury...</p>
        </div>
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
          <h3 className="text-sm text-gray-400 mb-1">Lot Info</h3>
          <p className="text-lg font-medium">—</p>
          <p className="text-xs text-gray-500">Loading property details...</p>
        </div>
      </div>
    </div>
  );
}
