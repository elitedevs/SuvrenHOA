'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useMessages } from '@/hooks/useMessages';

const navItems = [
  { href: '/dashboard', label: 'My Property', icon: '🏠' },
  { href: '/health', label: 'Health', icon: '❤️' },
  { href: '/messages', label: 'Messages', icon: '💬' },
  { href: '/community', label: 'Community', icon: '🗣️' },
  { href: '/community/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/alerts', label: 'Alerts', icon: '🚨' },
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
  { href: '/checkout', label: 'Move Out', icon: '📦' },
];

function MessagesNavLink({
  href,
  label,
  icon,
  active,
  mobile,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  mobile?: boolean;
}) {
  const { totalUnread } = useMessages();

  return (
    <Link
      href={href}
      className={`relative px-3 py-2 rounded-lg ${mobile ? 'text-[12px]' : 'text-[13px]'} font-semibold ${mobile ? 'whitespace-nowrap' : ''} transition-all duration-200 flex items-center gap-1.5 min-h-[44px] ${
        active
          ? 'nav-active text-purple-300 bg-purple-500/10'
          : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <span className={`${mobile ? '' : 'text-[12px] opacity-80'}`}>{icon}</span>
      {label}
      {totalUnread > 0 && (
        <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
          {totalUnread > 9 ? '9+' : totalUnread}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { isConnected } = useAccount();

  const isTransparency =
    pathname === '/transparency' || pathname.startsWith('/transparency');

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
          <nav className="hidden md:flex items-center gap-1 mx-6" role="navigation" aria-label="Main navigation">
            {/* Transparency — always visible, public page */}
            <Link
              href="/transparency"
              className={`relative px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 flex items-center gap-1.5 min-h-[44px] ${
                isTransparency
                  ? 'nav-active text-purple-300 bg-purple-500/10'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
              }`}
              aria-current={isTransparency ? 'page' : undefined}
            >
              <span className="text-[12px] opacity-80">🔍</span>
              Transparency
            </Link>

            {/* Connected-only nav */}
            {isConnected &&
              navItems.map(({ href, label, icon }) => {
                const active =
                  pathname === href ||
                  (href !== '/' && href.length > 10 && pathname.startsWith(href)) ||
                  (href.length <= 10 && href !== '/' && pathname === href);

                if (href === '/messages') {
                  return (
                    <MessagesNavLink
                      key={href}
                      href={href}
                      label={label}
                      icon={icon}
                      active={active}
                    />
                  );
                }

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
      <div className="md:hidden border-t border-[rgba(255,255,255,0.04)] overflow-x-auto scrollbar-none">
        <nav
          className="flex items-center gap-1 px-3 py-2 min-w-max"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {/* Transparency always visible on mobile too */}
          <Link
            href="/transparency"
            className={`relative px-3 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 min-h-[44px] ${
              isTransparency
                ? 'nav-active text-purple-300 bg-purple-500/10'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            aria-current={isTransparency ? 'page' : undefined}
          >
            <span>🔍</span>
            Transparency
          </Link>

          {isConnected &&
            navItems.map(({ href, label, icon }) => {
              const active =
                pathname === href ||
                (href !== '/' && href.length > 10 && pathname.startsWith(href)) ||
                (href.length <= 10 && href !== '/' && pathname === href);

              if (href === '/messages') {
                return (
                  <MessagesNavLink
                    key={href}
                    href={href}
                    label={label}
                    icon={icon}
                    active={active}
                    mobile
                  />
                );
              }

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
    </header>
  );
}
