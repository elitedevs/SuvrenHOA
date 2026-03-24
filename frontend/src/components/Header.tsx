'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const navItems = [
  { href: '/dashboard', label: 'My Property' },
  { href: '/proposals', label: 'Proposals' },
  { href: '/treasury', label: 'Treasury' },
  { href: '/documents', label: 'Documents' },
  { href: '/dues', label: 'Pay Dues' },
];

export function Header() {
  const pathname = usePathname();
  const { isConnected } = useAccount();

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-sm">
              S
            </div>
            <span className="text-lg font-semibold hidden sm:block">SuvrenHOA</span>
          </Link>

          {/* Nav (only when connected) */}
          {isConnected && (
            <nav className="hidden md:flex items-center gap-1 mx-4">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === href
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  {label}
                </Link>
              ))}
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

      {/* Mobile nav */}
      {isConnected && (
        <div className="md:hidden border-t border-gray-800 overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  pathname === href
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
