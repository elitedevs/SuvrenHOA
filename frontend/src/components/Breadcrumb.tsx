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
  reservations: 'Reservations',
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
  'lost-found': 'Lost & Found',
  activity: 'Activity Log',
  onboarding: 'Onboarding',
  checkout: 'Move Out',
  verify: 'Verify',
  builder: 'Survey Builder',
  'seasonal-decor': 'Seasonal Decor',
  bookclub: 'Book Club',
  rules: 'Rules',
  safety: 'Safety',
  emergency: 'Emergency',
  newsletter: 'Newsletter',
  contractors: 'Contractors',
  utilities: 'Utilities',
  contracts: 'Contracts',
  gallery: 'Gallery',
  marketplace: 'Marketplace',
  parking: 'Parking',
  reports: 'Reports',
  complaints: 'Complaints',
  noise: 'Noise Complaint',
  annual: 'Annual Report',
  amenities: 'Amenities',
  services: 'Services',
  packages: 'Packages',
  wifi: 'WiFi',
  irrigation: 'Irrigation',
  carpool: 'Carpool',
  trash: 'Trash',
  elections: 'Elections',
  stats: 'Gov Stats',
  loans: 'Payment Plans',
  transfer: 'Transfer',
  inspections: 'Inspections',
  budget: 'Budget',
  vendors: 'Vendors',
  reimbursement: 'Reimbursement',
  compare: 'Compare Docs',
  minutes: 'Minutes',
  forum: 'Forum',
  rideshare: 'Rideshare',
  garden: 'Garden',
  fitness: 'Fitness',
  cookbook: 'Cookbook',
  skills: 'Skills',
  awards: 'Awards',
  notifications: 'Notifications',
};

// Full-path overrides for segments that mean different things by context
const PATH_LABEL_MAP: Record<string, string> = {
  '/admin/dashboard': 'Board Dashboard',
  '/surveys/builder': 'Survey Builder',
};

// Paths that are parent segments with no real page — render as plain text, not a link
const NON_NAVIGABLE_PATHS = new Set([
  '/governance',
  '/services',
  '/reports',
  '/complaints',
  '/settings',
]);

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
    ...segments.map((seg, i) => {
      const href = '/' + segments.slice(0, i + 1).join('/');
      // Check full-path override first, then segment label
      const label = PATH_LABEL_MAP[href] ?? getLabel(seg);
      return { label, href };
    }),
  ];

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-disabled)] mb-6 flex-wrap">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-[var(--text-disabled)] select-none">›</span>
            )}
            {isLast || NON_NAVIGABLE_PATHS.has(crumb.href) ? (
              <span className={isLast ? 'text-[#B09B71] font-medium' : 'font-medium'}>
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-[var(--text-body)] transition-colors duration-150 font-medium"
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
