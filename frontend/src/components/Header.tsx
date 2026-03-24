'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const navItems = [
  { href: '/dashboard', label: 'My Property', icon: '🏠' },
  { href: '/proposals', label: 'Proposals', icon: '🗳️' },
  { href: '/treasury', label: 'Treasury', icon: '💰' },
  { href: '/documents', label: 'Documents', icon: '📄' },
  { href: '/dues', label: 'Pay Dues', icon: '💳' },
  { href: '/admin', label: 'Admin', icon: '⚙️' },
];

export function Header() {
  const pathname = usePathname();
  const { isConnected } = useAccount();

  return (
    <header className="glass border-b border-purple-500/5 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center font-bold text-xs text-white group-hover:shadow-[0_0_12px_rgba(139,92,246,0.4)] transition-shadow">
              S
            </div>
            <span className="text-base font-semibold hidden sm:block">
              <span className="gradient-text">Suvren</span>
              <span className="text-gray-400">HOA</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {isConnected && (
            <nav className="hidden md:flex items-center gap-0.5 mx-4">
              {navItems.map(({ href, label, icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-purple-600/15 text-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.1)]'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-[11px]">{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Wallet */}
          <div className="shrink-0">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="avatar"
            />
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isConnected && (
        <div className="md:hidden border-t border-white/[0.03] overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-0.5 px-3 py-1.5 min-w-max">
            {navItems.map(({ href, label, icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                    active
                      ? 'bg-purple-600/15 text-purple-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
