'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMessages } from '@/hooks/useMessages';
import {
  Home, Building2, Vote, Landmark, Users, FileText,
  Wrench, Settings, ChevronLeft, ChevronRight,
  ChevronDown, Menu, X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

type NavChild = {
  href: string;
  label: string;
};

type NavSection = {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: NavChild[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/dashboard',
    label: 'Property',
    icon: Building2,
    children: [
      { href: '/dashboard', label: 'My Lots' },
      { href: '/pets', label: 'Pets' },
      { href: '/vehicles', label: 'Vehicles' },
      { href: '/transfer', label: 'Transfer' },
      { href: '/inspections', label: 'Inspections' },
    ],
  },
  {
    href: '/proposals',
    label: 'Governance',
    icon: Vote,
    children: [
      { href: '/proposals', label: 'Proposals' },
      { href: '/governance/stats', label: 'Gov Stats' },
      { href: '/governance/elections', label: 'Elections' },
      { href: '/governance/voting-power', label: 'Voting Power' },
    ],
  },
  {
    href: '/treasury',
    label: 'Treasury',
    icon: Landmark,
    children: [
      { href: '/treasury', label: 'Overview' },
      { href: '/treasury/budget', label: 'Budget' },
      { href: '/treasury/vendors', label: 'Vendors' },
      { href: '/treasury/reimbursement', label: 'Reimbursement' },
    ],
  },
  {
    href: '/community',
    label: 'Community',
    icon: Users,
    children: [
      { href: '/community/forum', label: 'Forum' },
      { href: '/community/cookbook', label: 'Cookbook' },
      { href: '/community/fitness', label: 'Fitness' },
      { href: '/community/garden', label: 'Garden' },
      { href: '/community/rideshare', label: 'Rideshare' },
      { href: '/community/bookclub', label: 'Book Club' },
      { href: '/community/skills', label: 'Skills' },
      { href: '/community/awards', label: 'Awards' },
      { href: '/gallery', label: 'Gallery' },
      { href: '/marketplace', label: 'Marketplace' },
    ],
  },
  {
    href: '/documents',
    label: 'Documents',
    icon: FileText,
    children: [
      { href: '/documents', label: 'All Docs' },
      { href: '/documents/minutes', label: 'Minutes' },
      { href: '/documents/compare', label: 'Compare' },
    ],
  },
  {
    href: '/services',
    label: 'Services',
    icon: Wrench,
    children: [
      { href: '/maintenance', label: 'Maintenance' },
      { href: '/amenities', label: 'Amenities' },
      { href: '/parking', label: 'Parking' },
      { href: '/services/packages', label: 'Packages' },
      { href: '/services/wifi', label: 'WiFi' },
      { href: '/services/irrigation', label: 'Irrigation' },
      { href: '/services/carpool', label: 'Carpool' },
      { href: '/services/trash', label: 'Trash' },
      { href: '/contractors', label: 'Contractors' },
    ],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { href: '/profile', label: 'Profile' },
      { href: '/settings/notifications', label: 'Notifications' },
      { href: '/admin', label: 'Admin' },
    ],
  },
];

function NavItem({
  section,
  collapsed,
  pathname,
  onToggle,
  expanded,
}: {
  section: NavSection;
  collapsed: boolean;
  pathname: string;
  onToggle: (label: string) => void;
  expanded: boolean;
}) {
  const Icon = section.icon;
  const hasChildren = section.children && section.children.length > 0;
  const isActive =
    section.href === '/'
      ? pathname === '/'
      : pathname === section.href || pathname.startsWith(section.href + '/');
  const isChildActive = hasChildren
    ? section.children!.some(
        (c) => pathname === c.href || pathname.startsWith(c.href + '/')
      )
    : false;
  const highlighted = isActive || isChildActive;

  if (hasChildren && !collapsed) {
    return (
      <div>
        <button
          onClick={() => onToggle(section.label)}
          className="w-full flex items-center gap-3 px-3 py-2 text-[13px] transition-colors duration-150 relative"
          style={{
            color: highlighted ? '#F5F0E8' : 'rgba(245,240,232,0.40)',
          }}
        >
          {highlighted && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full"
              style={{ background: '#B09B71' }}
            />
          )}
          <Icon
            size={18}
            className="shrink-0"
            style={{ opacity: highlighted ? 0.7 : 0.4 }}
          />
          <span className="flex-1 text-left">{section.label}</span>
          <ChevronDown
            size={14}
            style={{
              opacity: 0.3,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </button>

        <div
          style={{
            overflow: 'hidden',
            maxHeight: expanded
              ? `${section.children!.length * 32 + 8}px`
              : '0px',
            transition: 'max-height 200ms ease, opacity 200ms ease',
            opacity: expanded ? 1 : 0,
          }}
        >
          <div className="pl-9 pr-2 pb-1 space-y-0.5">
            {section.children!.map((child) => {
              const childActive =
                pathname === child.href ||
                pathname.startsWith(child.href + '/');
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block py-1.5 px-2 text-[12px] rounded transition-colors duration-150 relative"
                  style={{
                    color: childActive
                      ? '#F5F0E8'
                      : 'rgba(245,240,232,0.35)',
                  }}
                >
                  {childActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full"
                      style={{ background: '#B09B71' }}
                    />
                  )}
                  <span className="pl-1">{child.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={section.href}
      className="flex items-center gap-3 px-3 py-2 text-[13px] transition-colors duration-150 relative"
      style={{
        color: highlighted ? '#F5F0E8' : 'rgba(245,240,232,0.40)',
      }}
      title={collapsed ? section.label : undefined}
    >
      {highlighted && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full"
          style={{ background: '#B09B71' }}
        />
      )}
      <Icon
        size={18}
        className="shrink-0"
        style={{ opacity: highlighted ? 0.7 : 0.4 }}
      />
      {!collapsed && <span className="truncate">{section.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { totalUnread } = useMessages();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set<string>()
  );

  useEffect(() => {
    setMobileOpen(false);
    const active = NAV_SECTIONS.find((s) =>
      s.children?.some(
        (c) => pathname === c.href || pathname.startsWith(c.href + '/')
      )
    );
    if (active) {
      setExpandedSections((prev) => new Set([...prev, active.label]));
    }
  }, [pathname]);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  if (!isConnected) return null;

  const sidebarContent = (
    <div
      className="flex flex-col h-full transition-all duration-200"
      style={{ width: collapsed ? '64px' : '240px' }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-4 h-14"
        style={{ borderBottom: '1px solid rgba(245,240,232,0.06)' }}
      >
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo-full.png"
              alt="SuvrenHOA"
              className="h-8 w-auto max-w-[140px] object-contain"
            />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md transition-colors hidden lg:flex"
          style={{ color: 'rgba(245,240,232,0.30)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_SECTIONS.map((section) => (
          <NavItem
            key={section.label}
            section={section}
            collapsed={collapsed}
            pathname={pathname}
            onToggle={toggleSection}
            expanded={expandedSections.has(section.label)}
          />
        ))}
      </nav>

      {/* Theme + Wallet */}
      <div
        className="p-3 space-y-2"
        style={{ borderTop: '1px solid rgba(245,240,232,0.06)' }}
      >
        {!collapsed && (
          <div className="flex items-center justify-between px-1 py-1">
            <span
              className="text-[11px] font-medium"
              style={{ color: 'rgba(245,240,232,0.25)' }}
            >
              Theme
            </span>
            <ThemeToggle />
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-1">
            <ThemeToggle />
          </div>
        )}
        <div className={collapsed ? 'scale-75' : ''}>
          <ConnectButton
            label="Connect"
            showBalance={false}
            chainStatus="none"
            accountStatus={collapsed ? 'avatar' : 'address'}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40"
        style={{
          background: '#0C0C0E',
          borderRight: '1px solid rgba(245,240,232,0.05)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg"
        style={{
          background: '#141416',
          color: 'rgba(245,240,232,0.50)',
        }}
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 bottom-0 shadow-2xl"
            style={{
              background: '#0C0C0E',
              borderRight: '1px solid rgba(245,240,232,0.05)',
            }}
          >
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg"
                style={{ color: 'rgba(245,240,232,0.35)' }}
              >
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
