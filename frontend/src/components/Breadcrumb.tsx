'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABEL_MAP: Record<string, string> = {
  '': 'Home',
  dashboard: 'My Lots',
  proposals: 'Proposals',
  treasury: 'Treasury',
  documents: 'Documents',
  violations: 'Violations',
  community: 'Community',
  leaderboard: 'Leaderboard',
  announcements: 'Announcements',
  calendar: 'Calendar',
  meetings: 'Meetings',
  directory: 'Directory',
  dues: 'Pay Dues',
  maintenance: 'Maintenance',
  reservations: 'Amenities',
  architectural: 'Arch Review',
  surveys: 'Surveys',
  transparency: 'Transparency',
  map: 'Map',
  health: 'Health Score',
  messages: 'Messages',
  alerts: 'Alerts',
  assistant: 'AI Assistant',
  admin: 'Admin',
  profile: 'Profile',
  pets: 'Pets',
  vehicles: 'Vehicles',
  governance: 'Governance',
  'voting-power': 'Voting Power',
  activity: 'Activity Log',
  onboarding: 'Onboarding',
  checkout: 'Checkout',
  verify: 'Verify',
};

function getLabel(segment: string): string {
  // Numeric or address-like → keep as-is (e.g. proposal #3, token ID)
  if (/^\d+$/.test(segment)) return `#${segment}`;
  if (segment.startsWith('0x')) return `${segment.slice(0, 6)}…${segment.slice(-4)}`;
  return LABEL_MAP[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

export function Breadcrumb() {
  const pathname = usePathname();

  // Don't show on root
  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);

  const crumbs = [
    { label: 'Home', href: '/' },
    ...segments.map((seg, i) => ({
      label: getLabel(seg),
      href: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ];

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 flex-wrap">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-gray-700 select-none">›</span>
            )}
            {isLast ? (
              <span className="text-[#c9a96e] font-semibold">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-gray-300 transition-colors duration-150 font-medium"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
