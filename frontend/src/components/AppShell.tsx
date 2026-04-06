'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { AlertBanner } from '@/components/AlertBanner';
import { AIChatWidget } from '@/components/AIChatWidget';
import { GlobalFeatures } from '@/components/GlobalFeatures';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SeasonalBanner } from '@/components/SeasonalBanner';

const MARKETING_PREFIXES = ['/about', '/pricing', '/security', '/contact', '/blog', '/docs', '/demo', '/landing'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketing = MARKETING_PREFIXES.some(p => pathname.startsWith(p));

  if (isMarketing) {
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
