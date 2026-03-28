import type { Metadata, Viewport } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '@/components/Sidebar';
import { AlertBanner } from '@/components/AlertBanner';
import { AIChatWidget } from '@/components/AIChatWidget';
import { GlobalFeatures } from '@/components/GlobalFeatures';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SeasonalBanner } from '@/components/SeasonalBanner';

const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: ['400', '500'], style: ['normal', 'italic'], variable: '--font-playfair', display: 'swap',
});

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-sans', display: 'swap',
});

export const metadata: Metadata = { title: 'SuvrenHOA', description: 'Transparent. Immutable. Democratic. Blockchain-powered HOA governance.', manifest: '/manifest.json', appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'SuvrenHOA', },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, themeColor: '#B09B71',
};

export default function RootLayout({ children }: { children: React.ReactNode }) { return ( <html lang="en" className="dark"> <body className={`${playfairDisplay.variable} ${dmSans.variable} font-sans antialiased bg-[var(--obsidian)] text-[var(--text-body)]`}> <Providers> <Sidebar /> <div className="lg:pl-[var(--sidebar-width,240px)] min-h-screen flex flex-col transition-all duration-200"> <AlertBanner /> <SeasonalBanner /> <main className="flex-1 p-4 sm:p-6 lg:p-8"> <Breadcrumb /> {children} </main> <footer className="border-t border-[var(--divider)] py-5 px-6 text-center"> <p className="text-[11px] text-[var(--text-disabled)] font-medium"> © 2026 EliteDevs. All rights reserved. SuvrenHOA™ is a trademark of EliteDevs. </p> <p className="text-[10px] text-[var(--text-disabled)] mt-1"> Powered by Base blockchain · Smart contracts audited · Documents stored on Arweave </p> </footer> </div> <AIChatWidget /> <GlobalFeatures /> </Providers> </body> </html> );
}
