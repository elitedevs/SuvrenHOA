import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, ExternalLink, Mail, Copy, Palette, Type } from 'lucide-react';
import { PRESS_KIT } from '@/lib/press-kit';

export const metadata: Metadata = {
  title: 'Press Kit — SuvrenHOA',
  description: 'Press kit, brand assets, and media contact for SuvrenHOA.',
};

export default function PressPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-16 px-4 border-b border-[var(--divider)]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-[#B09B71] uppercase tracking-widest mb-3">Press Room</p>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[#E8E4DC] mb-4">
            SuvrenHOA Media Kit
          </h1>
          <p className="text-lg text-[#C4BAA8] max-w-2xl">
            {PRESS_KIT.company.tagline} — Everything you need to cover SuvrenHOA.
          </p>
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <a
              href={`mailto:${PRESS_KIT.contact.press}`}
              className="flex items-center gap-2 bg-[#B09B71] text-[#0C0C0E] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#C4B080] transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              Contact Press
            </a>
            <a
              href={PRESS_KIT.urls.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-[#2A2A2E] text-[#C4BAA8] px-5 py-2.5 rounded-lg hover:border-[#B09B71]/40 hover:text-[#E8E4DC] transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Website
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* About */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC] mb-6">About SuvrenHOA</h2>
          <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6 space-y-4">
            <p className="text-[#C4BAA8] leading-relaxed">{PRESS_KIT.company.description}</p>
            <p className="text-[#8A8070] text-sm leading-relaxed">{PRESS_KIT.company.longDescription}</p>
          </div>
        </section>

        {/* Boilerplate */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC]">Boilerplate</h2>
            <span className="text-xs text-[#4A4A52]">Copy for articles</span>
          </div>
          <div className="relative bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
            <p className="text-[#C4BAA8] leading-relaxed italic pr-8">{PRESS_KIT.boilerplate}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-[#4A4A52]">
              <Copy className="w-3.5 h-3.5" />
              <span>Select text above to copy</span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC] mb-6">Key Facts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PRESS_KIT.stats.map(stat => (
              <div key={stat.label} className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-5">
                <p className="font-playfair text-2xl font-bold text-[#B09B71] mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-[#C4BAA8]">{stat.label}</p>
                <p className="text-xs text-[#4A4A52] mt-0.5">{stat.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC] mb-6">Product Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRESS_KIT.features.map(feature => (
              <div key={feature.name} className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-5">
                <h3 className="font-semibold text-[#E8E4DC] mb-2">{feature.name}</h3>
                <p className="text-sm text-[#8A8070] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Brand */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC] mb-6">Brand Guidelines</h2>
          <div className="space-y-6">
            {/* Colors */}
            <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-[#B09B71]" />
                <h3 className="font-semibold text-[#E8E4DC]">Color Palette</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESS_KIT.brandColors.map(color => (
                  <div key={color.name} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div>
                      <p className="text-sm font-medium text-[#C4BAA8]">{color.name}</p>
                      <p className="text-xs text-[#4A4A52] font-mono">{color.hex}</p>
                      <p className="text-xs text-[#4A4A52]">{color.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Type className="w-4 h-4 text-[#B09B71]" />
                <h3 className="font-semibold text-[#E8E4DC]">Typography</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#4A4A52] mb-1 uppercase tracking-wider">Headings</p>
                  <p className="font-playfair text-xl text-[#E8E4DC]">{PRESS_KIT.typography.headings}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4A4A52] mb-1 uppercase tracking-wider">Body</p>
                  <p className="text-base text-[#E8E4DC]">{PRESS_KIT.typography.body}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand assets */}
        <section>
          <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC] mb-6">Brand Assets</h2>
          <div className="bg-[#141416] border border-[#2A2A2E] rounded-xl divide-y divide-[#2A2A2E]">
            {PRESS_KIT.assets.map(asset => (
              <div key={asset.name} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-[#C4BAA8]">{asset.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-[#4A4A52]">
                  <Download className="w-3.5 h-3.5" />
                  {asset.file.split('/').pop()}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#4A4A52] mt-3">
            Full asset pack available upon request — email{' '}
            <a href={`mailto:${PRESS_KIT.contact.press}`} className="text-[#B09B71] hover:underline">
              {PRESS_KIT.contact.press}
            </a>
          </p>
        </section>

        {/* Contact */}
        <section className="bg-[#141416] border border-[#2A2A2E] rounded-xl p-6">
          <h2 className="font-playfair text-xl font-bold text-[#E8E4DC] mb-4">Media Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Press Inquiries', email: PRESS_KIT.contact.press },
              { label: 'General', email: PRESS_KIT.contact.general },
              { label: 'Founders / Investors', email: PRESS_KIT.contact.founders },
            ].map(c => (
              <div key={c.label}>
                <p className="text-xs text-[#4A4A52] mb-1">{c.label}</p>
                <a
                  href={`mailto:${c.email}`}
                  className="text-sm text-[#B09B71] hover:text-[#C4B080] transition-colors"
                >
                  {c.email}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Links */}
        <section className="pb-4">
          <h2 className="font-playfair text-xl font-bold text-[#E8E4DC] mb-4">Links</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(PRESS_KIT.urls).map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 border border-[#2A2A2E] rounded-lg text-sm text-[#8A8070] hover:text-[#C4BAA8] hover:border-[#3A3A3E] transition-colors capitalize"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {key}
              </a>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
