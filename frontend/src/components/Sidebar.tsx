'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMessages } from '@/hooks/useMessages';
import {
  Home, Building2, PawPrint, Car, Vote, Landmark, FileText,
  AlertTriangle, Users, Megaphone, Trophy, Calendar, BookOpen,
  CreditCard, Hammer, CalendarCheck, PenTool, BarChart3,
  Eye, Map, Heart, MessageCircle, Bell, Bot, Settings,
  User, ChevronDown, ChevronLeft, ChevronRight, Menu, X,
  Waves, Wrench, Shield, BookMarked, Receipt, FileBarChart2, ClipboardList,
  ParkingCircle, Volume2, Image, Newspaper, Zap, Search, DollarSign,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

/* ── 8 Primary Sections with expandable children ──────────────────────────── */
const NAV_SECTIONS = [
  {
    key: 'home',
    label: 'Home',
    icon: Home,
    href: '/',
  },
  {
    key: 'property',
    label: 'Property',
    icon: Building2,
    children: [
      { href: '/dashboard', label: 'My Lots' },
      { href: '/pets', label: 'Pets' },
      { href: '/vehicles', label: 'Vehicles' },
    ],
  },
  {
    key: 'governance',
    label: 'Governance',
    icon: Vote,
    children: [
      { href: '/proposals', label: 'Proposals' },
      { href: '/governance/stats', label: 'Statistics' },
      { href: '/governance/voting-power', label: 'Voting Power' },
      { href: '/violations', label: 'Violations' },
    ],
  },
  {
    key: 'treasury',
    label: 'Treasury',
    icon: Landmark,
    children: [
      { href: '/treasury', label: 'Overview' },
      { href: '/treasury/vendors', label: 'Vendors' },
      { href: '/treasury/reimbursement', label: 'Reimbursement' },
      { href: '/dues', label: 'Pay Dues' },
    ],
  },
  {
    key: 'community',
    label: 'Community',
    icon: Users,
    children: [
      { href: '/community', label: 'Hub' },
      { href: '/community/forum', label: 'Forum' },
      { href: '/announcements', label: 'Announcements' },
      { href: '/community/leaderboard', label: 'Leaderboard' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/directory', label: 'Directory' },
      { href: '/emergency', label: 'Emergency' },
      { href: '/gallery', label: 'Gallery' },
      { href: '/lost-found', label: 'Lost & Found' },
      { href: '/newsletter', label: 'Newsletter' },
    ],
  },
  {
    key: 'documents',
    label: 'Documents',
    icon: FileText,
    children: [
      { href: '/documents', label: 'Records' },
      { href: '/transparency', label: 'Transparency' },
      { href: '/reports/annual', label: 'Annual Report' },
      { href: '/contracts', label: 'Smart Contracts' },
    ],
  },
  {
    key: 'services',
    label: 'Services',
    icon: Wrench,
    children: [
      { href: '/maintenance', label: 'Maintenance' },
      { href: '/amenities', label: 'Amenities' },
      { href: '/reservations', label: 'Reservations' },
      { href: '/contractors', label: 'Contractors' },
      { href: '/architectural', label: 'Architectural Review' },
      { href: '/surveys', label: 'Surveys' },
      { href: '/parking', label: 'Parking' },
      { href: '/utilities', label: 'Utilities' },
      { href: '/safety', label: 'Safety' },
      { href: '/rules', label: 'Rules & FAQ' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { href: '/profile', label: 'Profile' },
      { href: '/settings/notifications', label: 'Notifications' },
      { href: '/admin', label: 'Admin' },
    ],
  },
];

const UTILITY_ITEMS = [
  { href: '/messages', label: 'Messages', icon: MessageCircle, badge: 'messages' as const },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/assistant', label: 'AI Assistant', icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { totalUnread } = useMessages();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  // Auto-expand section containing the active route
  useEffect(() => {
    setMobileOpen(false);
    for (const section of NAV_SECTIONS) {
      if ('children' in section && section.children) {
        const match = section.children.some(c => pathname === c.href || (c.href !== '/' && pathname.startsWith(c.href)));
        if (match && !expanded.includes(section.key)) {
          setExpanded(prev => [...prev, section.key]);
        }
      }
    }
  }, [pathname]);

  if (!isConnected) return null;

  const toggleSection = (key: string) => {
    setExpanded(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full ${collapsed ? 'w-16' : 'w-60'} transition-all duration-200`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 mb-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
              <span className="text-[11px] font-heading" style={{ fontFamily: 'var(--font-heading), Georgia, serif', color: 'var(--accent-brass)' }}>S</span>
            </div>
            <span
              className="text-[14px] tracking-tight"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(196, 176, 138, 0.95), rgba(176, 155, 113, 0.75))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              SuvrenHOA
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md transition-colors hidden lg:flex"
          style={{ color: 'var(--text-muted)' }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {NAV_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isExpanded = expanded.includes(section.key);

            // Direct link (Home)
            if ('href' in section && section.href) {
              const active = pathname === section.href;
              return (
                <Link
                  key={section.key}
                  href={section.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] transition-all duration-200"
                  style={{
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderLeft: active ? '2px solid var(--accent-brass)' : '2px solid transparent',
                  }}
                  title={collapsed ? section.label : undefined}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" style={{ opacity: active ? 0.6 : 0.35 }} />
                  {!collapsed && <span>{section.label}</span>}
                </Link>
              );
            }

            // Expandable section
            const hasActiveChild = 'children' in section && section.children?.some(
              c => pathname === c.href || (c.href !== '/' && pathname.startsWith(c.href))
            );

            return (
              <div key={section.key}>
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] transition-all duration-200"
                  style={{
                    color: hasActiveChild ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderLeft: hasActiveChild ? '2px solid var(--accent-brass)' : '2px solid transparent',
                  }}
                  title={collapsed ? section.label : undefined}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" style={{ opacity: hasActiveChild ? 0.6 : 0.35 }} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{section.label}</span>
                      <ChevronDown
                        className="w-3.5 h-3.5 transition-transform duration-200"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          opacity: 0.3,
                        }}
                      />
                    </>
                  )}
                </button>

                {/* Children — smooth expand */}
                {!collapsed && isExpanded && 'children' in section && (
                  <div className="ml-5 pl-3 mt-0.5 space-y-0.5" style={{ borderLeft: '1px solid var(--border-subtle)' }}>
                    {section.children?.map((child) => {
                      const active = pathname === child.href || (child.href !== '/' && pathname.startsWith(child.href));
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-3 py-1.5 rounded-md text-[12px] transition-all duration-200"
                          style={{
                            color: active ? 'rgba(245, 240, 232, 0.75)' : 'rgba(245, 240, 232, 0.40)',
                          }}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Utility items — separated by whitespace (not a line) */}
        <div className="mt-8 space-y-0.5">
          {UTILITY_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href);
            const badge = item.badge === 'messages' ? totalUnread : undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-all duration-200 relative"
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderLeft: active ? '2px solid var(--accent-brass)' : '2px solid transparent',
                }}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" style={{ opacity: active ? 0.6 : 0.35 }} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {badge !== undefined && badge > 0 && (
                  <span
                    className={`${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center`}
                    style={{ background: 'var(--accent-brass)', color: 'var(--bg-primary)', fontWeight: 600 }}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom: Theme + Wallet + Brand whisper */}
      <div className="p-3 pt-8 space-y-2">
        <div className={`flex ${collapsed ? 'justify-center' : 'items-center justify-between px-1'} py-1`}>
          {!collapsed && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Theme</span>}
          <ThemeToggle />
        </div>
        <div className={collapsed ? 'scale-75' : ''}>
          <ConnectButton label="Connect" showBalance={false} chainStatus="none" accountStatus={collapsed ? 'avatar' : 'address'} />
        </div>
        {!collapsed && (
          <p
            className="text-center pt-2"
            style={{
              fontFamily: 'var(--font-heading), Georgia, serif',
              fontStyle: 'italic',
              fontSize: '10px',
              color: 'var(--text-muted)',
              opacity: 0.5,
            }}
          >
            Faircroft — Est. 2025
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40"
        style={{ background: '#151518', boxShadow: '1px 0 8px rgba(0, 0, 0, 0.3)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 shadow-2xl"
            style={{ background: '#151518', boxShadow: '1px 0 8px rgba(0, 0, 0, 0.3)' }}
          >
            <div className="absolute top-3 right-3">
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
