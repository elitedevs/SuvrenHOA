'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function Home() {
  const { isConnected } = useAccount();

  return isConnected ? <Dashboard /> : <Landing />;
}

function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-6">
        <span className="text-3xl font-bold text-purple-400">F</span>
      </div>
      <h1 className="text-4xl font-bold mb-3">
        Welcome to <span className="text-purple-400">SuvrenHOA</span>
      </h1>
      <p className="text-gray-400 text-lg max-w-xl mb-8">
        Transparent, immutable, democratic HOA governance on the blockchain.
        Connect your wallet to view your property, vote on proposals, and pay dues.
      </p>
      <ConnectButton />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-2xl">
        {[
          { icon: '🏠', title: '1 Lot = 1 Vote', desc: 'Every property gets equal representation' },
          { icon: '💰', title: 'Transparent Treasury', desc: 'Every dollar tracked on-chain in real-time' },
          { icon: '📄', title: 'Permanent Records', desc: 'Documents stored immutably on Arweave' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
            <div className="text-2xl mb-2">{icon}</div>
            <h3 className="font-medium mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const navItems = [
    { href: '/dashboard', label: 'My Property', icon: '🏠' },
    { href: '/proposals', label: 'Proposals', icon: '📋' },
    { href: '/treasury', label: 'Treasury', icon: '💰' },
    { href: '/documents', label: 'Documents', icon: '📄' },
    { href: '/dues', label: 'Pay Dues', icon: '💳' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-purple-500/40 hover:bg-gray-900 transition-all group"
          >
            <div className="text-3xl mb-3">{icon}</div>
            <h3 className="text-lg font-medium group-hover:text-purple-400 transition-colors">{label}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {label === 'My Property' && 'View your lot details, voting power, and dues status'}
              {label === 'Proposals' && 'Vote on active proposals or submit a new one'}
              {label === 'Treasury' && 'See how community funds are being spent'}
              {label === 'Documents' && 'Browse CC&Rs, minutes, and verify authenticity'}
              {label === 'Pay Dues' && 'Pay quarterly or annual dues in USDC'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
