'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/security', label: 'Security' },
  { href: '/blog', label: 'Blog' },
  { href: '/docs', label: 'Docs' },
  { href: '/contact', label: 'Contact' },
];

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(245,240,232,0.06)]"
            style={{ background: 'rgba(12,12,14,0.85)', backdropFilter: 'blur(20px) saturate(1.4)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #B09B71 0%, #8A7550 100%)' }}>
            <span className="text-sm font-bold text-[#0C0C0E]">S</span>
          </div>
          <span className="text-lg font-medium text-[var(--parchment)] tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}>
            SuvrenHOA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
                  className="px-3 py-2 text-[13px] font-medium text-[rgba(245,240,232,0.5)] hover:text-[var(--parchment)] transition-colors rounded-lg hover:bg-[rgba(245,240,232,0.04)]">
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login"
                className="px-4 py-2 text-[13px] font-medium text-[rgba(245,240,232,0.5)] hover:text-[var(--parchment)] transition-colors">
            Sign In
          </Link>
          <Link href="/signup"
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #B09B71 0%, #8A7550 100%)',
                  color: '#0C0C0E',
                }}>
            Start Free Trial
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-[rgba(245,240,232,0.5)]"
                onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[rgba(245,240,232,0.06)] px-6 py-4 space-y-1"
             style={{ background: 'rgba(12,12,14,0.95)' }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-[14px] font-medium text-[rgba(245,240,232,0.6)] hover:text-[var(--parchment)] rounded-lg hover:bg-[rgba(245,240,232,0.04)] transition-colors">
              {label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-[rgba(245,240,232,0.06)] flex flex-col gap-2">
            <Link href="/login"
                  className="px-3 py-2.5 text-[14px] font-medium text-[rgba(245,240,232,0.6)]">
              Sign In
            </Link>
            <Link href="/signup"
                  className="px-5 py-2.5 rounded-lg text-[13px] font-medium text-center"
                  style={{ background: 'linear-gradient(135deg, #B09B71 0%, #8A7550 100%)', color: '#0C0C0E' }}>
              Start Free Trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
