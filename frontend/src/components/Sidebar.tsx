'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMessages } from '@/hooks/useMessages';
import { useSmartWallet } from '@/hooks/useSmartWallet';
import { useSupabaseAuth } from '@/context/AuthContext';
import {
  Home, Building2, Vote, Landmark, Users, FileText,
  Wrench, Settings, ChevronLeft, ChevronRight,
  ChevronDown, Menu, X, MessageCircle,
  BookOpen, Megaphone, Eye, Fingerprint, Wallet,
  Send, LogOut,
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
  utility?: boolean; // utility items get reduced opacity + smaller font
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
      { href: '/violations', label: 'Violations' },
      { href: '/architectural', label: 'Arch Review' },
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
      { href: '/loans', label: 'Payment Plans' },
      { href: '/contracts', label: 'Contracts' },
    ],
  },
  {
    href: '/community',
    label: 'Community',
    icon: Users,
    children: [
      { href: '/community/forum', label: 'Forum' },
      { href: '/community/leaderboard', label: 'Leaderboard' },
      { href: '/community/cookbook', label: 'Cookbook' },
      { href: '/community/fitness', label: 'Fitness' },
      { href: '/community/garden', label: 'Garden' },
      { href: '/community/rideshare', label: 'Rideshare' },
      { href: '/community/bookclub', label: 'Book Club' },
      { href: '/community/skills', label: 'Skills' },
      { href: '/community/awards', label: 'Awards' },
      { href: '/gallery', label: 'Gallery' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/lost-found', label: 'Lost & Found' },
    ],
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: MessageCircle,
    utility: true,
  },
  {
    href: '/directory',
    label: 'Directory',
    icon: BookOpen,
    utility: true,
  },
  {
    href: '/announcements',
    label: 'Announcements',
    icon: Megaphone,
    children: [
      { href: '/announcements', label: 'Announcements' },
      { href: '/newsletter', label: 'Newsletter' },
      { href: '/alerts', label: 'Alerts' },
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
      { href: '/rules', label: 'Rules' },
    ],
  },
  {
    href: '/maintenance',
    label: 'Services',
    icon: Wrench,
    children: [
      { href: '/maintenance', label: 'Maintenance' },
      { href: '/reservations', label: 'Reservations' },
      { href: '/amenities', label: 'Amenities' },
      { href: '/parking', label: 'Parking' },
      { href: '/services/packages', label: 'Packages' },
      { href: '/services/wifi', label: 'WiFi' },
      { href: '/services/irrigation', label: 'Irrigation' },
      { href: '/services/carpool', label: 'Carpool' },
      { href: '/services/trash', label: 'Trash' },
      { href: '/contractors', label: 'Contractors' },
      { href: '/utilities', label: 'Utilities' },
    ],
  },
  {
    href: '/transparency',
    label: 'Info & Safety',
    icon: Eye,
    children: [
      { href: '/transparency', label: 'Transparency' },
      { href: '/health', label: 'Health Score' },
      { href: '/map', label: 'Map' },
      { href: '/safety', label: 'Safety' },
      { href: '/emergency', label: 'Emergency' },
      { href: '/activity', label: 'Activity Log' },
      { href: '/surveys', label: 'Surveys' },
      { href: '/surveys/builder', label: 'Survey Builder' },
      { href: '/reports/annual', label: 'Annual Report' },
      { href: '/complaints/noise', label: 'Noise Complaint' },
    ],
  },
  {
    href: '/invite',
    label: 'Invitations',
    icon: Send,
    utility: true,
    children: [
      { href: '/invite', label: 'Send Invites' },
      { href: '/invite/manage', label: 'Manage' },
    ],
  },
  {
    href: '/profile',
    label: 'Settings',
    icon: Settings,
    children: [
      { href: '/profile', label: 'Profile' },
      { href: '/settings/wallet', label: 'Wallet' },
      { href: '/settings/notifications', label: 'Notifications' },
      { href: '/admin', label: 'Admin' },
      { href: '/admin/properties', label: 'Properties' },
      { href: '/onboarding', label: 'Onboarding' },
      { href: '/checkout', label: 'Move Out' },
    ],
  },
];

// Section groupings — hairline dividers appear between these clusters
// [0]=Home  [1-3]=Property/Governance/Treasury  [4-9]=Community/Messages/Directory/Announcements/Documents/Services  [10-11]=Info/Settings
const DIVIDER_BEFORE = new Set([1, 4, 10]);

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
  const isUtility = section.utility === true;

  // Utility items: reduced opacity + smaller font
  const baseOpacity = isUtility ? 0.50 : 0.85;
  const fontSize = isUtility ? '13px' : '15px';

  // Shared hover handlers
  const hoverOn = (el: HTMLElement) => {
    if (!highlighted) el.style.background = 'rgba(245,240,232,0.03)';
  };
  const hoverOff = (el: HTMLElement) => {
    if (!highlighted) el.style.background = 'transparent';
  };

  const parentStyle: React.CSSProperties = {
    color: highlighted ? 'rgba(245,240,232,0.90)' : `rgba(245,240,232,${baseOpacity})`,
    background: highlighted ? 'rgba(176,155,113,0.06)' : 'transparent',
    transition: 'background 150ms ease-out, color 150ms ease-out',
    fontSize,
  };

  if (hasChildren && !collapsed) {
    return (
      <div>
        <button
          onClick={() => onToggle(section.label)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg relative"
          style={parentStyle}
          onMouseEnter={(e) => hoverOn(e.currentTarget)}
          onMouseLeave={(e) => hoverOff(e.currentTarget)}
        >
          {/* Left accent — 3px brass, visible only when highlighted */}
          {highlighted && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
              style={{ width: '3px', height: '20px', background: 'rgba(176,155,113,0.70)' }}
            />
          )}
          <Icon
            size={20}
            strokeWidth={1.25}
            className="shrink-0"
            style={{ opacity: highlighted ? 0.80 : isUtility ? 0.40 : 0.45, transition: 'opacity 150ms ease-out' }}
          />
          <span className="flex-1 text-left font-normal">{section.label}</span>
          <ChevronDown
            size={13}
            strokeWidth={1.25}
            style={{
              opacity: 0.25,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease-out',
            }}
          />
        </button>

        {/* Accordion children */}
        <div
          style={{
            overflow: 'hidden',
            maxHeight: expanded ? `${section.children!.length * 36 + 12}px` : '0px',
            transition: 'max-height 200ms ease-out, opacity 180ms ease-out',
            opacity: expanded ? 1 : 0,
          }}
        >
          <div className="relative pb-1" style={{ paddingLeft: '36px', paddingRight: '8px', marginTop: '1px' }}>
            {/* Whisper connector line */}
            <span
              className="absolute"
              style={{
                left: '21px',
                top: '6px',
                bottom: '6px',
                width: '1px',
                background: 'rgba(245,240,232,0.06)',
                pointerEvents: 'none',
              }}
            />

            <div className="space-y-0.5">
              {section.children!.map((child) => {
                // Exact match for children that share parent href (e.g. /treasury)
                // Prefix match only for children with unique paths
                const isSharedHref = child.href === section.href;
                const childActive = isSharedHref
                  ? pathname === child.href
                  : pathname === child.href || pathname.startsWith(child.href + '/');
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="block py-1.5 px-2 rounded-md relative"
                    style={{
                      fontSize: '13px',
                      paddingLeft: '36px',
                      color: childActive ? 'rgba(245,240,232,0.88)' : 'rgba(245,240,232,0.50)',
                      background: childActive ? 'rgba(176,155,113,0.04)' : 'transparent',
                      transition: 'background 150ms ease-out, color 150ms ease-out, opacity 150ms ease-out',
                    }}
                    onMouseEnter={(e) => {
                      if (!childActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(245,240,232,0.03)';
                        (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(245,240,232,0.75)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!childActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                        (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(245,240,232,0.50)';
                      }
                    }}
                  >
                    {childActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
                        style={{ width: '2px', height: '12px', background: 'rgba(176,155,113,0.60)' }}
                      />
                    )}
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Leaf item (no children, or collapsed)
  return (
    <Link
      href={section.href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg relative"
      style={parentStyle}
      onMouseEnter={(e) => hoverOn(e.currentTarget as HTMLAnchorElement)}
      onMouseLeave={(e) => hoverOff(e.currentTarget as HTMLAnchorElement)}
      title={collapsed ? section.label : undefined}
    >
      {highlighted && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
          style={{ width: '3px', height: '20px', background: 'rgba(176,155,113,0.70)' }}
        />
      )}
      <Icon
        size={20}
        strokeWidth={1.25}
        className="shrink-0"
        style={{ opacity: highlighted ? 0.80 : isUtility ? 0.40 : 0.45, transition: 'opacity 150ms ease-out' }}
      />
      {!collapsed && <span className="truncate font-normal">{section.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { walletType, isSmartWallet } = useSmartWallet();
  const { user, signOut: supabaseSignOut } = useSupabaseAuth();
  const { totalUnread: _totalUnread } = useMessages(); // reserved for future badge
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
      // Accordion: only one section open at a time
      if (prev.has(label)) return new Set<string>();
      return new Set<string>([label]);
    });
  };

  // Sync sidebar width to CSS custom property so layout.tsx can react
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '64px' : '240px'
    );
  }, [collapsed]);

  // Hide sidebar on public routes (login, signup, landing, invite accept)
  const publicRoutes = ['/', '/login', '/signup', '/invite/accept'];
  const isPublicRoute = publicRoutes.includes(pathname);
  if ((!isConnected && !user) || isPublicRoute) return null;

  const sidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{
        width: collapsed ? '64px' : '240px',
        transition: 'width 200ms ease-out',
      }}
    >
      {/* ── Logo header ── */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: '80px',
          borderBottom: '1px solid rgba(245,240,232,0.05)',
        }}
      >
        {collapsed ? (
          <Link href="/" className="flex items-center justify-center mx-auto">
            <img src="/logo-icon.svg" alt="SuvrenHOA" className="h-8 w-8 object-contain" />
          </Link>
        ) : (
          <Link href="/" className="flex items-center">
            <img
              src="/logo-full.svg"
              alt="SuvrenHOA"
              className="h-10 w-auto max-w-[180px] object-contain"
            />
          </Link>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hidden lg:flex shrink-0"
          style={{
            color: 'rgba(245,240,232,0.40)',
            transition: 'color 150ms ease-out',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(245,240,232,0.65)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(245,240,232,0.40)'; }}
        >
          {collapsed ? <ChevronRight size={15} strokeWidth={1.25} /> : <ChevronLeft size={15} strokeWidth={1.25} />}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {NAV_SECTIONS.map((section, index) => {
          const prevSection = index > 0 ? NAV_SECTIONS[index - 1] : null;
          const isFirstUtility = section.utility && !prevSection?.utility;
          return (
            <div key={section.label}>
              {/* Hairline divider between section clusters */}
              {DIVIDER_BEFORE.has(index) && (
                <div
                  style={{
                    height: '1px',
                    background: 'rgba(245,240,232,0.04)',
                    margin: '8px 4px',
                  }}
                />
              )}
              {/* mt-6 spacer before first utility item */}
              {isFirstUtility && !DIVIDER_BEFORE.has(index) && (
                <div style={{ height: '24px' }} />
              )}
              <NavItem
                section={section}
                collapsed={collapsed}
                pathname={pathname}
                onToggle={toggleSection}
                expanded={expandedSections.has(section.label)}
              />
            </div>
          );
        })}
      </nav>

      {/* ── Bottom: theme + wallet ── */}
      <div
        className="shrink-0 px-3 py-3 space-y-2.5"
        style={{ borderTop: '1px solid rgba(245,240,232,0.05)' }}
      >
        {/* Theme toggle — icon only */}
        <div className={collapsed ? 'flex justify-center' : 'flex justify-end px-1'}>
          <ThemeToggle />
        </div>

        {/* Wallet — glass-surface treatment */}
        <div
          className="rounded-lg"
          style={{
            background: 'rgba(245,240,232,0.02)',
            border: '1px solid rgba(245,240,232,0.06)',
            padding: collapsed ? '6px 4px' : '8px 10px',
          }}
        >
          {/* Smart wallet badge when connected */}
          {isConnected && !collapsed && (
            <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
              {isSmartWallet ? (
                <>
                  <Fingerprint size={12} style={{ color: '#2A5D4F', opacity: 0.8 }} />
                  <span className="text-[10px]" style={{ color: 'rgba(42,93,79,0.8)' }}>
                    Smart Wallet
                  </span>
                </>
              ) : walletType === 'eoa' ? (
                <>
                  <Wallet size={12} style={{ color: '#B09B71', opacity: 0.6 }} />
                  <span className="text-[10px]" style={{ color: 'rgba(176,155,113,0.6)' }}>
                    External Wallet
                  </span>
                </>
              ) : null}
            </div>
          )}
          <div
            className={`wallet-wrapper ${collapsed ? 'flex justify-center scale-75' : ''}`}
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(245, 240, 232, 0.6)',
            }}
          >
            <ConnectButton
              label={collapsed ? 'Connect' : 'Create Free Wallet'}
              showBalance={false}
              chainStatus="none"
              accountStatus={collapsed ? 'avatar' : 'address'}
            />
          </div>
        </div>

        {/* Sign out — visible when authenticated via Supabase */}
        {user && (
          <button
            onClick={supabaseSignOut}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
            style={{ color: 'rgba(245,240,232,0.35)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(245,240,232,0.60)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(245,240,232,0.35)'; }}
            title="Sign Out"
          >
            <LogOut size={16} strokeWidth={1.25} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40"
        style={{
          background: 'var(--surface-1, #151518)',
          boxShadow: '1px 0 8px rgba(0,0,0,0.3)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg"
        style={{ background: 'var(--surface-1, #151518)', color: 'var(--text-muted, rgba(245,240,232,0.45))' }}
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 shadow-2xl"
            style={{
              background: 'var(--surface-1, #151518)',
            }}
          >
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg"
                style={{ color: 'rgba(245,240,232,0.30)' }}
              >
                <X size={18} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
