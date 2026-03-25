'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';

const navItems = [
  { href: '/dashboard', label: 'My Property', icon: '🏠' },
  { href: '/community', label: 'Community', icon: '💬' },
  { href: '/announcements', label: 'News', icon: '📢' },
  { href: '/maintenance', label: 'Maintenance', icon: '🔧' },
  { href: '/violations', label: 'Violations', icon: '🚨' },
  { href: '/architectural', label: 'Arch Review', icon: '🏗️' },
  { href: '/proposals', label: 'Proposals', icon: '🗳️' },
  { href: '/treasury', label: 'Treasury', icon: '💰' },
  { href: '/documents', label: 'Docs', icon: '📄' },
  { href: '/surveys', label: 'Surveys', icon: '📊' },
  { href: '/reservations', label: 'Amenities', icon: '🏊' },
  { href: '/directory', label: 'Directory', icon: '👥' },
  { href: '/dues', label: 'Dues', icon: '💳' },
  { href: '/calendar', label: 'Calendar', icon: '📅' },
  { href: '/pets', label: 'Pets', icon: '🐕' },
  { href: '/vehicles', label: 'Vehicles', icon: '🚗' },
  { href: '/profile', label: 'Profile', icon: '👤' },
  { href: '/admin', label: 'Admin', icon: '⚙️' },
];

export function Header() {
  const pathname = usePathname();
  const { isConnected } = useAccount();

  return (
    <header className="glass border-b border-[rgba(139,92,246,0.08)] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0 group min-h-[44px]"
            aria-label="SuvrenHOA home"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center font-bold text-sm text-white group-hover:shadow-[0_0_16px_rgba(139,92,246,0.5)] transition-all duration-300 group-hover:scale-105">
              S
            </div>
            <span className="text-[15px] font-700 hidden sm:block tracking-tight">
              <span className="gradient-text font-bold">Suvren</span>
              <span className="text-gray-400 font-semibold">HOA</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {isConnected && (
            <nav className="hidden md:flex items-center gap-1 mx-6" role="navigation" aria-label="Main navigation">
              {navItems.map(({ href, label, icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 flex items-center gap-1.5 min-h-[44px] ${
                      active
                        ? 'nav-active text-purple-300 bg-purple-500/10'
                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="text-[12px] opacity-80">{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Theme + Wallet */}
          <div className="flex items-center gap-2 shrink-0">
            {isConnected && <NotificationBell />}
            <ThemeToggle />
            <ConnectButton
              label="Sign In"
              showBalance={false}
              chainStatus="icon"
              accountStatus="avatar"
            />
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isConnected && (
        <div className="md:hidden border-t border-[rgba(255,255,255,0.04)] overflow-x-auto scrollbar-none">
          <nav
            className="flex items-center gap-1 px-3 py-2 min-w-max"
            role="navigation"
            aria-label="Mobile navigation"
          >
            {navItems.map(({ href, label, icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-3 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 min-h-[44px] ${
                    active
                      ? 'nav-active text-purple-300 bg-purple-500/10'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
