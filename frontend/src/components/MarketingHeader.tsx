'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // V12: scroll-aware backdrop — deepens after first 16px of scroll.
  // Uses passive listener so it never blocks paint, and a small threshold
  // so the change happens almost immediately (feels responsive, not laggy).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: scrolled ? 'rgba(8,8,10,0.92)' : 'rgba(12,12,14,0.78)',
        backdropFilter: scrolled
          ? 'blur(28px) saturate(1.5)'
          : 'blur(18px) saturate(1.3)',
        WebkitBackdropFilter: scrolled
          ? 'blur(28px) saturate(1.5)'
          : 'blur(18px) saturate(1.3)',
        borderBottom: scrolled
          ? '1px solid rgba(176,155,113,0.14)'
          : '1px solid rgba(245,240,232,0.06)',
        boxShadow: scrolled
          ? '0 8px 32px rgba(0,0,0,0.32), 0 1px 0 rgba(245,240,232,0.02) inset'
          : '0 1px 0 rgba(245,240,232,0.02) inset',
        transition:
          'background 280ms cubic-bezier(0.23, 1, 0.32, 1), backdrop-filter 280ms cubic-bezier(0.23, 1, 0.32, 1), border-color 280ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 280ms cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      <div
        className="max-w-6xl mx-auto px-6 flex items-center justify-between"
        style={{
          height: scrolled ? '60px' : '68px',
          transition: 'height 280ms cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/logo-icon.svg"
            alt="SuvrenHOA"
            className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span
            className="text-lg font-medium text-[var(--parchment)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            SuvrenHOA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 text-[13px] font-medium transition-colors rounded-lg ${
                  active
                    ? 'nav-active text-[var(--parchment)]'
                    : 'text-[rgba(245,240,232,0.5)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)]'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-[13px] font-medium text-[rgba(245,240,232,0.5)] hover:text-[var(--parchment)] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/founding"
            className="px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #B09B71 0%, #8A7A5A 100%)',
              color: '#0C0C0E',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.12) inset, 0 8px 24px rgba(176,155,113,0.18)',
            }}
          >
            Reserve Your Seat
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-[rgba(245,240,232,0.5)]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-[rgba(245,240,232,0.06)] px-6 py-4 space-y-1"
          style={{ background: 'rgba(12,12,14,0.95)' }}
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 text-[14px] font-medium rounded-lg transition-colors ${
                  active
                    ? 'text-[var(--parchment)] bg-[rgba(176,155,113,0.08)]'
                    : 'text-[rgba(245,240,232,0.6)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.04)]'
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="pt-3 mt-3 border-t border-[rgba(245,240,232,0.06)] flex flex-col gap-2">
            <Link
              href="/login"
              className="px-3 py-2.5 text-[14px] font-medium text-[rgba(245,240,232,0.6)]"
            >
              Sign In
            </Link>
            <Link
              href="/founding"
              className="px-5 py-2.5 rounded-lg text-[13px] font-medium text-center"
              style={{
                background: 'linear-gradient(135deg, #B09B71 0%, #8A7A5A 100%)',
                color: '#0C0C0E',
              }}
            >
              Reserve Your Seat
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
