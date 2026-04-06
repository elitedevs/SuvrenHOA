import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AppShell } from '@/components/AppShell';

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

export const metadata: Metadata = { title: 'SuvrenHOA', description: 'Transparent. Immutable. Democratic. Blockchain-powered HOA governance.', manifest: '/manifest.json', appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'SuvrenHOA', },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#B09B71',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${playfairDisplay.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-[var(--obsidian)] text-[var(--text-body)]">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
