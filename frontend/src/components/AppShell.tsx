'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { AlertBanner } from '@/components/AlertBanner';
import { AIChatWidget } from '@/components/AIChatWidget';
import { GlobalFeatures } from '@/components/GlobalFeatures';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SeasonalBanner } from '@/components/SeasonalBanner';

// V11 fix: MARKETING_PREFIXES are pages that live under the (public) route
// group and render with the marketing header/footer (no sidebar/chat). Legal
// pages (privacy/terms) live here too — they're public-facing and deserve
// the marketing chrome, not a chromeless orphan look.
//
// CHROMELESS_PREFIXES are truly chromeless routes: auth flows and invite
// acceptance, where neither marketing nor app shell belongs. V10 audit found
// the chat widget + sidebar + SeasonalBanner leaking onto /login, /signup,
// /privacy, /terms, and the global 404 page — this two-list split is the fix.
const MARKETING_PREFIXES = [
  '/about',
  '/pricing',
  '/security',
  '/contact',
  '/blog',
  '/docs',
  '/demo',
  '/landing',
  '/founding',
  '/launch',
  '/press',
  '/privacy',
  '/terms',
];

const CHROMELESS_PREFIXES = [
  '/login',
  '/signup',
  '/invite',
];

// Known authenticated app prefixes — mirrors the middleware protectedPrefixes
// list. Any pathname that matches none of MARKETING, CHROMELESS, or this list
// is an unknown path that will resolve to not-found.tsx, and should render
// chromeless (otherwise the global 404 renders inside the sidebar + chat
// shell, which was the V10 layout-leak bug).
const KNOWN_APP_PREFIXES = [
  '/dashboard',
  '/activity',
  '/admin',
  '/alerts',
  '/amenities',
  '/announcements',
  '/architectural',
  '/assistant',
  '/calendar',
  '/checkout',
  '/community',
  '/compare',
  '/complaints',
  '/contractors',
  '/contracts',
  '/create-community',
  '/directory',
  '/documents',
  '/dues',
  '/emergency',
  '/energy',
  '/gallery',
  '/governance',
  '/health',
  '/inspections',
  '/insurance',
  '/loans',
  '/lost-found',
  '/maintenance',
  '/map',
  '/marketplace',
  '/messages',
  '/newsletter',
  '/onboarding',
  '/parking',
  '/pets',
  '/profile',
  '/proposals',
  '/reports',
  '/reservations',
  '/rules',
  '/safety',
  '/seasonal-decor',
  '/services',
  '/settings',
  '/surveys',
  '/transfer',
  '/transparency',
  '/treasury',
  '/utilities',
  '/vehicles',
  '/verify',
  '/violations',
  '/visitors',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketing =
    pathname === '/' || MARKETING_PREFIXES.some((p) => pathname.startsWith(p));
  const isChromeless = CHROMELESS_PREFIXES.some((p) => pathname.startsWith(p));
  const isKnownApp = KNOWN_APP_PREFIXES.some((p) => pathname.startsWith(p));
  // Unknown pathnames resolve to not-found.tsx → render chromeless so the
  // styled 404 page doesn't inherit the sidebar/banner/chat widget shell.
  const isUnknown = !isMarketing && !isChromeless && !isKnownApp;

  if (isMarketing || isChromeless || isUnknown) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="lg:pl-[var(--sidebar-width,240px)] min-h-screen flex flex-col transition-all duration-200">
        <AlertBanner />
        <SeasonalBanner />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Breadcrumb />
          {children}
        </main>
        <footer className="border-t border-[var(--divider)] py-5 px-6 text-center">
          <p className="text-[11px] text-[var(--text-disabled)] font-medium">
            &copy; 2026 Suvren LLC. All rights reserved. SuvrenHOA&trade; is a trademark of Suvren LLC.
          </p>
          <p className="text-[10px] text-[var(--text-disabled)] mt-1">
            Powered by Base blockchain &middot; Smart contracts audited &middot; Documents stored on Arweave
          </p>
        </footer>
      </div>
      <AIChatWidget />
      <GlobalFeatures />
    </>
  );
}
