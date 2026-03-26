import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { AlertBanner } from '@/components/AlertBanner';
import { AIChatWidget } from '@/components/AIChatWidget';
import { GlobalFeatures } from '@/components/GlobalFeatures';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SeasonalBanner } from '@/components/SeasonalBanner';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SuvrenHOA',
  description: 'Transparent. Immutable. Democratic. Blockchain-powered HOA governance.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SuvrenHOA',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#c9a96e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${plusJakartaSans.variable} font-sans antialiased bg-[oklch(0.10_0.005_60)] text-gray-100`}>
        <Providers>
          <Sidebar />
          <div className="lg:pl-60 min-h-screen flex flex-col transition-all duration-200">
            <AlertBanner />
            <SeasonalBanner />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              <Breadcrumb />
              {children}
            </main>
            <footer className="border-t border-[oklch(0.18_0.005_60)] py-5 px-6 text-center">
              <p className="text-[11px] text-[oklch(0.38_0.01_60)] font-medium">
                © 2026 EliteDevs. All rights reserved. SuvrenHOA™ is a trademark of EliteDevs.
              </p>
              <p className="text-[10px] text-[oklch(0.30_0.01_60)] mt-1">
                Powered by Base blockchain · Smart contracts audited · Documents stored on Arweave
              </p>
            </footer>
          </div>
          <AIChatWidget />
          <GlobalFeatures />
        </Providers>
      </body>
    </html>
  );
}
