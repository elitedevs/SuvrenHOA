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
  User, ChevronLeft, ChevronRight, Menu, X, LogOut,
  Waves, Wrench, Shield, BookMarked, Receipt, FileBarChart2, ClipboardList,
  ParkingCircle, Volume2, Image, Newspaper, Zap, Search, DollarSign,
  ShoppingBag, Code2, LayoutDashboard, ArrowRightLeft, Calculator,
  Sprout, Package, UserCheck, GitCompare, CarFront, Battery,
  BarChart2, TrendingUp,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: Home },
    ],
  },
  {
    label: 'Property',
    items: [
      { href: '/dashboard', label: 'My Lots', icon: Building2 },
      { href: '/pets', label: 'Pets', icon: PawPrint },
      { href: '/vehicles', label: 'Vehicles', icon: Car },
    ],
  },
  {
    label: 'Governance',
    items: [
      { href: '/proposals', label: 'Proposals', icon: Vote },
      { href: '/governance/stats', label: 'Gov Stats', icon: BarChart3 },
      { href: '/treasury', label: 'Treasury', icon: Landmark },
      { href: '/documents', label: 'Documents', icon: FileText },
      { href: '/violations', label: 'Violations', icon: AlertTriangle },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/community', label: 'Community', icon: Users },
      { href: '/community/forum', label: 'Forum', icon: MessageCircle },
      { href: '/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/community/leaderboard', label: 'Leaderboard', icon: Trophy },
      { href: '/community/cookbook', label: 'Cookbook', icon: BookOpen },
      { href: '/community/fitness', label: 'Fitness', icon: Heart },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
      { href: '/directory', label: 'Directory', icon: BookOpen },
      { href: '/emergency', label: 'Emergency', icon: AlertTriangle },
      { href: '/emergency/preparedness', label: 'Preparedness', icon: Shield },
    ],
  },
  {
    label: 'Services',
    items: [
      { href: '/dues', label: 'Pay Dues', icon: CreditCard },
      { href: '/maintenance', label: 'Maintenance', icon: Hammer },
      { href: '/amenities', label: 'Amenity Booking', icon: Waves },
      { href: '/reservations', label: 'Reservations', icon: CalendarCheck },
      { href: '/contractors', label: 'Contractors', icon: Wrench },
      { href: '/architectural', label: 'Arch Review', icon: PenTool },
      { href: '/surveys', label: 'Surveys', icon: BarChart3 },
      { href: '/treasury/reimbursement', label: 'Reimbursement', icon: Receipt },
    ],
  },
  {
    label: 'Community+',
    items: [
      { href: '/safety', label: 'Safety Watch', icon: Shield },
      { href: '/rules', label: 'Rules & FAQ', icon: BookMarked },
      { href: '/reports/annual', label: 'Annual Report', icon: FileBarChart2 },
      { href: '/newsletter', label: 'Newsletter', icon: Newspaper },
      { href: '/gallery', label: 'Photo Gallery', icon: Image },
      { href: '/lost-found', label: 'Lost & Found', icon: Search },
      { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
      { href: '/architectural/gallery', label: 'Arch Gallery', icon: PenTool },
    ],
  },
  {
    label: 'Services+',
    items: [
      { href: '/parking', label: 'Parking', icon: ParkingCircle },
      { href: '/complaints/noise', label: 'Noise Complaints', icon: Volume2 },
      { href: '/utilities', label: 'Utilities', icon: Zap },
      { href: '/surveys/builder', label: 'Survey Builder', icon: ClipboardList },
      { href: '/treasury/vendors', label: 'Vendor Payments', icon: DollarSign },
      { href: '/services/trash', label: 'Trash Schedule', icon: Wrench },
      { href: '/documents/minutes', label: 'Meeting Minutes', icon: FileText },
    ],
  },
  {
    label: 'Blockchain',
    items: [
      { href: '/contracts', label: 'Contract Explorer', icon: Code2 },
      { href: '/transparency', label: 'Transparency', icon: Eye },
      { href: '/map', label: 'Map', icon: Map },
      { href: '/health', label: 'Health Score', icon: Heart },
      { href: '/activity', label: 'Activity Log', icon: BarChart3 },
      { href: '/governance/elections', label: 'Elections', icon: Vote },
      { href: '/reports/impact', label: 'Impact Report', icon: TrendingUp },
    ],
  },
  {
    label: 'Property Transfer',
    items: [
      { href: '/transfer', label: 'Transfer Wizard', icon: ArrowRightLeft },
      { href: '/compare', label: 'HOA Comparison', icon: Calculator },
      { href: '/documents/compare', label: 'Doc Compare', icon: GitCompare },
    ],
  },
  {
    label: 'Community+',
    items: [
      { href: '/community/garden', label: 'Garden Plots', icon: Sprout },
      { href: '/community/rideshare', label: 'Rideshare Board', icon: CarFront },
      { href: '/visitors', label: 'Visitor Passes', icon: UserCheck },
      { href: '/services/packages', label: 'Package Log', icon: Package },
      { href: '/energy', label: 'Energy Dashboard', icon: Battery },
    ],
  },
];

const UTILITY_ITEMS = [
  { href: '/messages', label: 'Messages', icon: MessageCircle, badge: 'messages' as const },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/assistant', label: 'AI Assistant', icon: Bot },
  { href: '/admin', label: 'Admin', icon: Settings },
  { href: '/admin/dashboard', label: 'Board Dashboard', icon: LayoutDashboard },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
];

function NavItem({
  href, label, icon: Icon, active, collapsed, badge,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean; collapsed: boolean; badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 relative ${
        active
          ? 'bg-[oklch(0.18_0.01_60)] text-[oklch(0.75_0.12_85)] border-l-[3px] border-[oklch(0.75_0.12_85)] -ml-px'
          : 'text-[oklch(0.55_0.01_60)] hover:text-[oklch(0.80_0.01_60)] hover:bg-[oklch(0.14_0.005_60)]'
      }`}
      title={collapsed ? label : undefined}
    >
      <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-[oklch(0.75_0.12_85)]' : 'text-[oklch(0.45_0.01_60)] group-hover:text-[oklch(0.65_0.01_60)]'}`} />
      {!collapsed && <span className="truncate">{label}</span>}
      {badge !== undefined && badge > 0 && (
        <span className={`${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} min-w-[18px] h-[18px] px-1 rounded-full bg-[#c9a96e] text-[#1a1a1a] text-[10px] font-bold flex items-center justify-center`}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { totalUnread } = useMessages();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (!isConnected) return null;

  const sidebarContent = (
    <div className={`flex flex-col h-full ${collapsed ? 'w-16' : 'w-60'} transition-all duration-200`}>
      {/* Logo area */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[oklch(0.18_0.005_60)]">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-full.png" alt="SuvrenHOA" className="h-8 w-auto max-w-[140px] object-contain" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-[oklch(0.45_0.01_60)] hover:text-[oklch(0.70_0.01_60)] hover:bg-[oklch(0.14_0.005_60)] transition-colors hidden lg:flex"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.38_0.01_60)]">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={active}
                    collapsed={collapsed}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Utility items */}
      <div className="border-t border-[oklch(0.18_0.005_60)] py-3 px-3 space-y-0.5">
        {UTILITY_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href);
          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              collapsed={collapsed}
              badge={item.badge === 'messages' ? totalUnread : undefined}
            />
          );
        })}
      </div>

      {/* Theme toggle + Wallet */}
      <div className="border-t border-[oklch(0.18_0.005_60)] p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-[11px] text-[oklch(0.38_0.01_60)] font-medium">Theme</span>
            <ThemeToggle />
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-1">
            <ThemeToggle />
          </div>
        )}
        <div className={collapsed ? 'scale-75' : ''}>
          <ConnectButton label="Connect" showBalance={false} chainStatus="none" accountStatus={collapsed ? 'avatar' : 'address'} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 bg-[oklch(0.08_0.005_60)] border-r border-[oklch(0.18_0.005_60)]">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-[oklch(0.12_0.005_60)] border border-[oklch(0.20_0.005_60)] text-[oklch(0.65_0.01_60)]"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 bg-[oklch(0.08_0.005_60)] border-r border-[oklch(0.18_0.005_60)] shadow-2xl">
            <div className="absolute top-3 right-3">
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-[oklch(0.50_0.01_60)] hover:text-[oklch(0.80_0.01_60)]">
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
