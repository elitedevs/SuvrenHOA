import Link from 'next/link';
import {
  Zap, Users, Home, ChevronRight, ArrowRight,
  UserPlus, Settings, Vote, DollarSign, FileText,
  Eye, Wrench, MessageSquare, Wallet, BookOpen,
  BarChart3, Shield, HelpCircle, Code,
} from 'lucide-react';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Documentation',
  description: 'Learn how to set up and use SuvrenHOA for your community. Guides for board members, residents, and property managers.',
  path: '/docs',
});

const QUICK_START = [
  {
    icon: Zap,
    title: 'Getting Started',
    desc: '5-minute setup guide to get your community up and running.',
    href: '#getting-started',
  },
  {
    icon: Users,
    title: 'For Board Members',
    desc: 'Managing your community, proposals, treasury, and documents.',
    href: '#board-members',
  },
  {
    icon: Home,
    title: 'For Residents',
    desc: 'Participating in governance, voting, and community tools.',
    href: '#residents',
  },
];

const SECTIONS = [
  {
    id: 'getting-started',
    icon: Zap,
    title: 'Getting Started',
    desc: 'Everything you need to launch your community on SuvrenHOA.',
    articles: [
      { icon: UserPlus, label: 'Create an account' },
      { icon: Settings, label: 'Set up your community' },
      { icon: Users, label: 'Invite residents' },
      { icon: Vote, label: 'First vote walkthrough' },
      { icon: Wallet, label: 'Connect a wallet (optional)' },
    ],
  },
  {
    id: 'board-members',
    icon: Users,
    title: 'Board Member Guide',
    desc: 'Tools and workflows for community leadership.',
    articles: [
      { icon: Settings, label: 'Community settings' },
      { icon: UserPlus, label: 'Invite management' },
      { icon: Vote, label: 'Creating proposals' },
      { icon: DollarSign, label: 'Treasury management' },
      { icon: FileText, label: 'Document management' },
    ],
  },
  {
    id: 'residents',
    icon: Home,
    title: 'Resident Guide',
    desc: 'How to participate and stay informed.',
    articles: [
      { icon: UserPlus, label: 'Joining a community' },
      { icon: Vote, label: 'Casting votes' },
      { icon: Eye, label: 'Viewing the treasury' },
      { icon: Wrench, label: 'Submitting maintenance requests' },
      { icon: MessageSquare, label: 'Community forum' },
    ],
  },
];

const FAQS = [
  { q: 'Do I need a crypto wallet to use SuvrenHOA?', a: 'No. You can sign up with just an email and use the platform without ever interacting with blockchain technology directly. Wallet connection is optional and only needed for advanced features.' },
  { q: 'How do I invite residents to my community?', a: 'Go to your community settings, click "Invite Residents," and either send email invitations or generate a QR code to share at your next board meeting.' },
  { q: 'Can I export my data?', a: 'Yes. You can export financial records, voting history, and documents at any time in standard formats (CSV, PDF). Your on-chain records remain permanently accessible regardless.' },
  { q: 'What happens if I lose my login credentials?', a: 'Standard password reset via email. If you connected a wallet, you can also recover your account through wallet authentication.' },
  { q: 'Is there a mobile app?', a: 'SuvrenHOA is a responsive web application that works on all devices. A dedicated mobile app is on our roadmap for later this year.' },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--parchment)]">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-16 page-enter">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="gradient-text">Documentation</span>
          </h1>
          <p className="text-lg text-[rgba(245,240,232,0.45)] max-w-2xl mx-auto">
            Everything you need to get started with SuvrenHOA.
          </p>
        </div>
      </section>

      {/* ── QUICK START ───────────────────────────────────────────────────── */}
      <section className="pb-16 page-enter page-enter-delay-1">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-5">
            {QUICK_START.map(({ icon: Icon, title, desc, href }) => (
              <a key={title} href={href}
                 className="group rounded-xl p-6 hover-lift transition-all flex items-start gap-4"
                 style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: 'rgba(176,155,113,0.08)' }}>
                  <Icon className="w-5 h-5 text-[#B09B71]" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--parchment)] mb-1 group-hover:text-[#B09B71] transition-colors">
                    {title}
                  </h3>
                  <p className="text-[13px] text-[rgba(245,240,232,0.45)] leading-relaxed">{desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCUMENTATION SECTIONS ────────────────────────────────────────── */}
      <section className="pb-16 page-enter page-enter-delay-2">
        <div className="max-w-5xl mx-auto px-6 space-y-6">
          {SECTIONS.map(({ id, icon: Icon, title, desc, articles }) => (
            <div key={id} id={id} className="rounded-xl p-6"
                 style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: 'rgba(42,93,79,0.1)' }}>
                  <Icon className="w-5 h-5 text-[#2A5D4F]" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-[var(--parchment)]"
                      style={{ fontFamily: 'var(--font-heading)' }}>
                    {title}
                  </h2>
                  <p className="text-[13px] text-[rgba(245,240,232,0.40)]">{desc}</p>
                </div>
              </div>
              <div className="space-y-1 ml-14">
                {articles.map(({ icon: AIcon, label }) => (
                  <a key={label} href="#"
                     className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-[rgba(245,240,232,0.55)] hover:text-[var(--parchment)] hover:bg-[rgba(245,240,232,0.03)] transition-colors group">
                    <AIcon className="w-4 h-4 text-[rgba(245,240,232,0.25)] group-hover:text-[#B09B71] transition-colors" />
                    {label}
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-[rgba(245,240,232,0.15)] group-hover:text-[rgba(245,240,232,0.30)]" />
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* FAQ */}
          <div className="rounded-xl p-6" id="faq"
               style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: 'rgba(42,93,79,0.1)' }}>
                <HelpCircle className="w-5 h-5 text-[#2A5D4F]" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-[var(--parchment)]"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                  Frequently Asked Questions
                </h2>
                <p className="text-[13px] text-[rgba(245,240,232,0.40)]">Common questions about the platform.</p>
              </div>
            </div>
            <div className="space-y-2 ml-14">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-lg overflow-hidden"
                         style={{ background: 'rgba(245,240,232,0.02)' }}>
                  <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none">
                    <span className="text-[14px] font-medium text-[var(--parchment)]">{q}</span>
                    <ChevronRight className="w-4 h-4 text-[rgba(245,240,232,0.25)] transition-transform group-open:rotate-90 shrink-0 ml-4" />
                  </summary>
                  <div className="px-4 pb-4 text-[13px] text-[rgba(245,240,232,0.50)] leading-relaxed">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* API — Coming Soon */}
          <div className="rounded-xl p-6"
               style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: 'rgba(42,93,79,0.1)' }}>
                <Code className="w-5 h-5 text-[#2A5D4F]" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-medium text-[var(--parchment)]"
                      style={{ fontFamily: 'var(--font-heading)' }}>
                    API Reference
                  </h2>
                  {/* V15 Lux fix (circle discipline): square keyline tag,
                      no rounded-full on the public surface. */}
                  <span className="px-2.5 py-0.5 text-[10px] font-medium tracking-[0.18em] uppercase border"
                        style={{ borderColor: 'rgba(42,93,79,0.45)', color: '#2A5D4F' }}>
                    Coming Soon
                  </span>
                </div>
                <p className="text-[13px] text-[rgba(245,240,232,0.40)] leading-relaxed max-w-lg">
                  REST API for integrating SuvrenHOA with your existing tools and workflows.
                  Programmatic access to voting, treasury, documents, and community management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="pb-24 page-enter page-enter-delay-3">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-xl p-8 text-center"
               style={{
                 background: 'linear-gradient(135deg, rgba(176,155,113,0.08) 0%, rgba(42,93,79,0.06) 100%)',
                 border: '1px solid rgba(176,155,113,0.15)',
               }}>
            <h3 className="text-xl font-medium text-[var(--parchment)] mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Can&apos;t find what you&apos;re looking for?
            </h3>
            <p className="text-[13px] text-[rgba(245,240,232,0.45)] mb-5">
              Our team is here to help. Reach out and we&apos;ll get you an answer.
            </p>
            <Link href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #B09B71 0%, #8A7A5A 100%)',
                    color: '#0C0C0E',
                    boxShadow: '0 0 24px rgba(176,155,113,0.25)',
                  }}>
              Contact Support
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
