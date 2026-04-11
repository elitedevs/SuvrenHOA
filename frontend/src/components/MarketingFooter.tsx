import Link from 'next/link';
import { EmailCapture } from '@/components/EmailCapture';

const PRODUCT_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/security', label: 'Security' },
  { href: '/demo', label: 'Demo' },
  { href: '/docs', label: 'Documentation' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
];

const SOCIAL_LINKS = [
  { href: 'https://twitter.com/SuvrenHOA', label: 'Twitter/X' },
  { href: 'https://linkedin.com/company/suvren', label: 'LinkedIn' },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-[rgba(245,240,232,0.06)]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Newsletter row */}
        <div className="mb-12 pb-10 border-b border-[rgba(245,240,232,0.06)] max-w-sm">
          <p className="text-[11px] uppercase tracking-widest text-[#B09B71] font-medium mb-1">Product Hunt Launch — Oct 19th</p>
          <p className="text-[13px] text-[rgba(245,240,232,0.4)] leading-relaxed">Get notified when we go live and lock in founding member pricing.</p>
          <EmailCapture variant="inline" source="launch_page" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            {/*
              Lane 3 editorial pivot (2026-04-10): the old footer brand lockup
              used a rounded-lg square cartouche with a bold "S" glyph on a
              brass linear-gradient. Read as a SaaS app icon, not a crest —
              the nav already uses the shield logo so mismatched brand marks
              in the same viewport was an anti-luxe tell. Swapped in the same
              /logo-icon.svg shield that MarketingHeader uses so header and
              footer speak with one voice.
            */}
            <div className="flex items-center gap-2 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.svg" alt="SuvrenHOA" className="h-8 w-8 object-contain" />
              <span className="text-lg font-medium text-[var(--parchment)] tracking-tight"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                SuvrenHOA
              </span>
            </div>
            <p className="text-[13px] text-[rgba(245,240,232,0.4)] leading-relaxed max-w-[220px]">
              Governance your community can trust. Transparent, immutable, democratic.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-[#B09B71] font-medium mb-4">Product</h4>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[13px] text-[rgba(245,240,232,0.4)] hover:text-[var(--parchment)] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-[#B09B71] font-medium mb-4">Company</h4>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[13px] text-[rgba(245,240,232,0.4)] hover:text-[var(--parchment)] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Social */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-[#B09B71] font-medium mb-4">Legal</h4>
            <ul className="space-y-2.5 mb-6">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[13px] text-[rgba(245,240,232,0.4)] hover:text-[var(--parchment)] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-[11px] uppercase tracking-widest text-[#B09B71] font-medium mb-4">Social</h4>
            <ul className="space-y-2.5">
              {SOCIAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a href={href} target="_blank" rel="noopener noreferrer"
                     className="text-[13px] text-[rgba(245,240,232,0.4)] hover:text-[var(--parchment)] transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[rgba(245,240,232,0.06)] py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[rgba(245,240,232,0.25)]">
            &copy; 2026 Suvren LLC &middot; Raleigh, NC &middot; Patent Pending
          </p>
          <p className="text-[10px] text-[rgba(245,240,232,0.15)]">
            Powered by Base blockchain &middot; Smart contracts audited &middot; Documents stored on Arweave
          </p>
        </div>
      </div>
    </footer>
  );
}
