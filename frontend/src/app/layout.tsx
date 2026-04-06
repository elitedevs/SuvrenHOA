import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '@/components/Sidebar';
import { AlertBanner } from '@/components/AlertBanner';
import { AIChatWidget } from '@/components/AIChatWidget';
import { GlobalFeatures } from '@/components/GlobalFeatures';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SeasonalBanner } from '@/components/SeasonalBanner';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';

const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-playfair', display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  variable: '--font-inter',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'SuvrenHOA — Blockchain-Powered HOA Governance',
    template: '%s — SuvrenHOA',
  },
  description: 'Transparent treasury, tamper-proof voting, permanent documents. The first HOA platform built on blockchain technology.',
  keywords: ['HOA', 'homeowners association', 'blockchain', 'governance', 'transparent', 'Base', 'property management'],
  authors: [{ name: 'Suvren LLC' }],
  creator: 'Suvren LLC',
  publisher: 'Suvren LLC',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://suvren.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'SuvrenHOA',
    title: 'SuvrenHOA — Blockchain-Powered HOA Governance',
    description: 'Transparent treasury, tamper-proof voting, permanent documents. The first HOA platform built on Base blockchain.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'SuvrenHOA' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@SuvrenHOA',
    creator: '@SuvrenHOA',
    title: 'SuvrenHOA — Blockchain-Powered HOA Governance',
    description: 'Transparent treasury, tamper-proof voting, permanent documents.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'SuvrenHOA' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#B09B71',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${playfairDisplay.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-[var(--obsidian)] text-[var(--text-body)]">
        <Providers>
          <AnnouncementBanner />
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
                © 2026 Suvren LLC. All rights reserved. SuvrenHOA™ is a trademark of Suvren LLC.
              </p>
              <p className="text-[10px] text-[var(--text-disabled)] mt-1">
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
