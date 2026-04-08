'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useMessages } from '@/hooks/useMessages';
import {
  Home, Building2, Scale, Users, Wrench, Map, Eye,
  Heart, Bell, MessageCircle, Bot, Menu, X, ChevronDown,
  PawPrint, Car, User, Settings, PackageOpen,
  Vote, Landmark, FileText, AlertTriangle,
  Megaphone, Trophy, BookOpen, Calendar,
  CreditCard, Hammer, CalendarCheck, PenTool, BarChart3,
} from 'lucide-react';

// ── Navigation Structure ──────────────────────────────────────────────────────
const navGroups = [
  {
    label: 'Property',
    icon: Building2,
    items: [
      { href: '/dashboard', label: 'My Property', icon: Home },
      { href: '/pets', label: 'Pets', icon: PawPrint },
      { href: '/vehicles', label: 'Vehicles', icon: Car },
      { href: '/profile', label: 'Profile', icon: User },
    ],
  },
  {
    label: 'Governance',
    icon: Scale,
    items: [
      { href: '/proposals', label: 'Proposals', icon: Vote },
      { href: '/treasury', label: 'Treasury', icon: Landmark },
      { href: '/documents', label: 'Documents', icon: FileText },
      { href: '/violations', label: 'Violations', icon: AlertTriangle },
    ],
  },
  {
    label: 'Community',
    icon: Users,
    items: [
      { href: '/community', label: 'Forum', icon: Users },
      { href: '/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/community/leaderboard', label: 'Leaderboard', icon: Trophy },
      { href: '/directory', label: 'Directory', icon: BookOpen },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    label: 'Services',
    icon: Wrench,
    items: [
      { href: '/dues', label: 'Pay Dues', icon: CreditCard },
      { href: '/maintenance', label: 'Maintenance', icon: Hammer },
      { href: '/reservations', label: 'Amenities', icon: CalendarCheck },
      { href: '/architectural', label: 'Arch Review', icon: PenTool },
      { href: '/surveys', label: 'Surveys', icon: BarChart3 },
    ],
  },
];

// ── Dropdown Component ────────────────────────────────────────────────────────
function NavDropdown({
  label,
  icon: Icon,
  items,
  pathname,
}: {
  label: string;
  icon: React.ElementType;
  items: { href: string; label: string; icon: React.ElementType }[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const hasActive = items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  const handleEnter = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timeout.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    return () => { if (timeout.current) clearTimeout(timeout.current); };
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
          hasActive
            ? 'text-[#D4C4A0] bg-[rgba(176,155,113,0.10)]'
            : 'text-[var(--text-muted)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)]'
        }`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <Icon className="w-4 h-4" />
        {label}
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 py-2 rounded-xl border border-[rgba(245,240,232,0.06)] bg-[rgba(15,15,20,0.95)] backdrop-blur-xl shadow-2xl shadow-black/20 z-50 animate-fade-in">
          {items.map((item) => {
            const ItemIcon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors duration-150 ${
                  active
                    ? 'text-[#D4C4A0] bg-[rgba(176,155,113,0.10)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)]'
                }`}
              >
                <ItemIcon className="w-4 h-4 opacity-70" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Mobile Nav ────────────────────────────────────────────────────────────────
function MobileNav({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[100] bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute right-0 top-0 bottom-0 w-[280px] bg-[rgba(15,15,20,0.98)] backdrop-blur-xl border-l border-[rgba(245,240,232,0.06)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(245,240,232,0.06)]">
          <span className="text-[15px] font-medium gradient-text">SuvrenHOA</span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(245,240,232,0.06)] text-[var(--text-muted)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Public links */}
        <div className="p-3 border-b border-[rgba(245,240,232,0.06)]">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-disabled)] font-medium px-3 mb-2">Public</p>
          {[
            { href: '/transparency', label: 'Transparency', icon: Eye },
            { href: '/map', label: 'Map', icon: Map },
            { href: '/health', label: 'Health Score', icon: Heart },
          ].map((item) => {
            const ItemIcon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  active ? 'text-[#D4C4A0] bg-[rgba(176,155,113,0.10)]' : 'text-[var(--text-muted)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)]'
                }`}
              >
                <ItemIcon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Grouped sections */}
        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          const isExpanded = expanded === group.label;
          return (
            <div key={group.label} className="border-b border-[rgba(245,240,232,0.06)]">
              <button
                onClick={() => setExpanded(isExpanded ? null : group.label)}
                className="flex items-center justify-between w-full px-6 py-3 text-[13px] font-medium text-[var(--text-body)] hover:text-[var(--text-heading)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <GroupIcon className="w-4 h-4 text-[rgba(176,155,113,0.70)]" />
                  {group.label}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isExpanded && (
                <div className="pb-2 px-3">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-6 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                          active ? 'text-[#D4C4A0] bg-[rgba(176,155,113,0.10)]' : 'text-[var(--text-disabled)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)]'
                        }`}
                      >
                        <ItemIcon className="w-3.5 h-3.5 opacity-60" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Utility links */}
        <div className="p-3">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-disabled)] font-medium px-3 mb-2">Account</p>
          {[
            { href: '/admin', label: 'Admin', icon: Settings },
            { href: '/onboarding', label: 'Setup Wizard', icon: PackageOpen },
            { href: '/checkout', label: 'Move Out', icon: PackageOpen },
          ].map((item) => {
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[var(--text-disabled)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)] transition-colors"
              >
                <ItemIcon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Header ───────────────────────────────────────────────────────────────
export function Header() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { totalUnread } = useMessages();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="glass border-b border-[rgba(201,169,110,0.08)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <img
                src="/logo-icon.svg"
                alt="SuvrenHOA"
                className="h-8 w-8 object-contain transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_12px_rgba(201,169,110,0.4)]"
              />
              <span className="text-[15px] font-medium hidden sm:block tracking-tight">
                <span className="gradient-text">Suvren</span>
                <span className="text-[var(--text-disabled)]">HOA</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5 mx-4">
              {/* Public links */}
              <Link
                href="/transparency"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  pathname.startsWith('/transparency') ? 'text-[#D4C4A0] bg-[rgba(176,155,113,0.10)]' : 'text-[var(--text-muted)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)]'
                }`}
              >
                <Eye className="w-4 h-4" />
                Transparency
              </Link>
              <Link
                href="/map"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  pathname.startsWith('/map') ? 'text-[#D4C4A0] bg-[rgba(176,155,113,0.10)]' : 'text-[var(--text-muted)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)]'
                }`}
              >
                <Map className="w-4 h-4" />
                Map
              </Link>

              {/* Dropdowns (connected only) */}
              {isConnected && navGroups.map((group) => (
                <NavDropdown
                  key={group.label}
                  label={group.label}
                  icon={group.icon}
                  items={group.items}
                  pathname={pathname}
                />
              ))}
            </nav>

            {/* Right side utilities */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isConnected && (
                <>
                  <Link
                    href="/health"
                    className={`p-2 rounded-lg transition-colors ${pathname === '/health' ? 'text-[#3A7D6F] bg-[rgba(42,93,79,0.10)]' : 'text-[var(--text-disabled)] hover:text-[var(--text-body)] hover:bg-[rgba(245,240,232,0.04)]'}`}
                    title="Health Score"
                  >
                    <Heart className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/alerts"
                    className={`p-2 rounded-lg transition-colors ${pathname === '/alerts' ? 'text-[#8B5A5A] bg-[rgba(107,58,58,0.10)]' : 'text-[var(--text-disabled)] hover:text-[var(--text-body)] hover:bg-[rgba(245,240,232,0.04)]'}`}
                    title="Alerts"
                  >
                    <Bell className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/messages"
                    className={`relative p-2 rounded-lg transition-colors ${pathname === '/messages' ? 'text-[#B09B71] bg-[rgba(176,155,113,0.10)]' : 'text-[var(--text-disabled)] hover:text-[var(--text-body)] hover:bg-[rgba(245,240,232,0.04)]'}`}
                    title="Messages"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {totalUnread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#B09B71] text-[var(--text-heading)] text-[9px] font-medium flex items-center justify-center">
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/assistant"
                    className={`p-2 rounded-lg transition-colors ${pathname === '/assistant' ? 'text-[var(--steel)] bg-[rgba(90,122,154,0.10)]' : 'text-[var(--text-disabled)] hover:text-[var(--text-body)] hover:bg-[rgba(245,240,232,0.04)]'}`}
                    title="AI Assistant"
                  >
                    <Bot className="w-4 h-4" />
                  </Link>
                </>
              )}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <ConnectButton label="Sign In" showBalance={false} chainStatus="icon" accountStatus="avatar" />
              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)] transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && <MobileNav pathname={pathname} onClose={() => setMobileOpen(false)} />}
    </>
  );
}
