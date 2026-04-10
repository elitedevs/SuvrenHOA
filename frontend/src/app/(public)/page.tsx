'use client';

import Link from 'next/link';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { EmailCapture } from '@/components/EmailCapture';
import {
  Vote, DollarSign, FileText, Shield, BarChart3, Users,
  Link2, ChevronRight, ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Vote,
    title: '1 Lot = 1 Vote',
    desc: 'Every property gets equal representation through a soulbound NFT. No proxy manipulation, no whale voting.',
    accent: 'gold',
  },
  {
    icon: DollarSign,
    title: 'Transparent Treasury',
    desc: 'Every dollar in and out is recorded on-chain. Real-time balances, automatic 80/20 operating/reserve split.',
    accent: 'green',
  },
  {
    icon: FileText,
    title: 'Permanent Records',
    desc: "CC&Rs, minutes, and budgets stored on Arweave. Drag-drop any file to verify it hasn't been altered.",
    accent: 'blue',
  },
  {
    icon: Shield,
    title: 'Zero-Trust Security',
    desc: "We can't move your money, change your votes, or alter your documents. The technology enforces it — not just a policy.",
    accent: 'gold',
  },
  {
    icon: BarChart3,
    title: 'Community Health Score',
    desc: 'An automatic scorecard — voter participation, financial health, document compliance — all in one transparent number.',
    accent: 'green',
  },
  {
    icon: Users,
    title: 'Resident Tools',
    desc: 'Directory, maintenance requests, community forum — everything connected to the same trusted, tamper-proof system.',
    accent: 'blue',
  },
];

const STEPS = [
  { step: '1', title: 'Reserve Your Seat', desc: 'Submit your community for a founding spot. We review every applicant by hand.' },
  { step: '2', title: 'Onboard Your Community', desc: 'Name, address, unit count. Import your existing documents.' },
  { step: '3', title: 'Invite Residents', desc: 'Email invites or a QR code at your next board meeting.' },
  { step: '4', title: 'Govern Transparently', desc: 'Every vote, every dollar, every document — permanently on-chain.' },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden page-enter">
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute inset-0 bg-radial-glow-strong" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[rgba(176,155,113,0.05)] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-20 right-[20%] w-[400px] h-[400px] bg-[rgba(176,155,113,0.03)] blur-[150px] rounded-full bg-orb pointer-events-none" />
      <div className="absolute bottom-20 left-[10%] w-[300px] h-[300px] blur-[100px] rounded-full bg-orb-slow pointer-events-none" style={{ background: "rgba(176,155,113,0.04)" }} />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[88vh] px-6 text-center">

        {/* V12: hero ambient — pure CSS, breathes warmth across the hero */}
        <div className="hero-ambient" aria-hidden="true" />
        <div className="hero-ambient-2" aria-hidden="true" />

        {/* Launch badge */}
        <div className="relative z-10 mb-8 card-enter card-enter-delay-1">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(176,155,113,0.30)] bg-[rgba(176,155,113,0.08)] text-[#B09B71] text-xs font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B09B71] animate-pulse" />
            By invitation only — founding communities now under review
          </span>
        </div>

        {/* Logo */}
        <div className="relative z-10 mb-8 card-enter card-enter-delay-1">
          <div className="absolute inset-0 blur-2xl opacity-25 bg-[rgba(176,155,113,0.80)] rounded-full scale-[2]" />
          <img src="/logo-full.svg" alt="SuvrenHOA" className="relative h-14 w-auto" />
        </div>

        {/* Headline */}
        <div className="relative z-10 card-enter card-enter-delay-1">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-medium gradient-text mb-5 leading-[1.05] text-glow">
            Finally, an HOA you can{' '}
            <span className="gradient-text text-glow">actually trust</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xl sm:text-2xl max-w-3xl mx-auto mb-4 leading-relaxed font-medium">
            Blockchain-powered governance for HOAs — transparent voting, immutable records, and a treasury no board member can touch alone.
          </p>
          <p className="text-[var(--text-disabled)] text-base max-w-2xl mx-auto mb-10">
            No management companies. No hidden spending. No altered records. Just math.
          </p>
        </div>

        {/* CTAs */}
        <div className="relative z-10 mb-16 card-enter card-enter-delay-2 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/founding"
            className="px-8 py-3.5 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-semibold text-sm hover:bg-[#C4A96E] transition-colors flex items-center gap-2"
            style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 8px 28px rgba(176,155,113,0.22)' }}
          >
            Reserve Your Seat
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/about"
            className="px-8 py-3.5 rounded-lg border border-[rgba(176,155,113,0.30)] text-[#B09B71] font-medium text-sm hover:bg-[rgba(176,155,113,0.08)] transition-colors"
          >
            Read the Manifesto
          </Link>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full mb-16 card-enter card-enter-delay-2">
          {[
            { label: 'Monthly Cost', sub: 'vs $15K–50K mgmt co', numVal: 0.35, prefix: '$', decimals: 2 },
            { label: 'Doc Storage', sub: 'Lifetime, permanent', numVal: 2.00, prefix: '$', decimals: 2 },
            { label: 'Voting Period', sub: 'Fair + transparent', numVal: 7, prefix: '', suffix: ' days', decimals: 0 },
            { label: 'Can Be Altered', sub: 'Documents or votes', numVal: 0, prefix: '', decimals: 0 },
          ].map(({ label, sub, numVal, prefix, suffix, decimals }) => (
            <div key={label} className="glass-card rounded-xl p-6 text-center">
              <p className="text-2xl sm:text-3xl font-normal gradient-text mb-1">
                <AnimatedNumber
                  value={numVal}
                  prefix={prefix}
                  suffix={suffix}
                  decimals={decimals}
                  duration={900}
                />
              </p>
              <p className="text-xs font-medium text-[var(--text-body)] uppercase tracking-wide">{label}</p>
              <p className="text-[11px] text-[var(--text-disabled)] mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="relative px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-medium gradient-text text-center mb-12">
          Everything your HOA needs — nothing it doesn&apos;t
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, accent }) => (
            <div
              key={title}
              className="glass-card rounded-xl p-7 text-left group border-l-2 border-l-transparent hover:border-l-[rgba(176,155,113,0.40)] transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200 ${
                accent === 'gold' ? 'bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.20)]' :
                accent === 'green' ? 'bg-[rgba(42,93,79,0.10)] border border-[rgba(42,93,79,0.20)]' :
                'bg-[rgba(90,122,154,0.10)] border border-[rgba(90,122,154,0.20)]'
              }`}>
                <Icon className={`w-5 h-5 ${
                  accent === 'gold' ? 'text-[#B09B71]' :
                  accent === 'green' ? 'text-[#2A5D4F]' :
                  'text-[#2C2C2E]'
                }`} />
              </div>
              <h3 className="font-medium text-base mb-2 text-[var(--parchment)]">{title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section className="relative px-6 pb-24 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-medium gradient-text text-center mb-12">How It Works</h2>
        <div className="space-y-0">
          {STEPS.map(({ step, title, desc }, i) => (
            <div key={step} className="relative flex gap-5 items-start pb-8 last:pb-0">
              {i < STEPS.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gradient-to-b from-[rgba(176,155,113,0.25)] to-transparent" />
              )}
              <div className="w-8 h-8 rounded-full bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.40)] flex items-center justify-center text-sm font-medium text-[#B09B71] shrink-0 relative z-10">
                {step}
              </div>
              <div className="pt-0.5">
                <h4 className="font-medium text-sm text-[var(--parchment)] mb-1">{title}</h4>
                <p className="text-sm text-[var(--text-disabled)] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="relative px-6 pb-24 max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.25)] flex items-center justify-center mx-auto mb-6">
            <Link2 className="w-6 h-6 text-[#B09B71]" />
          </div>
          <h2 className="text-2xl font-medium gradient-text mb-3">
            Ready to bring real transparency to your HOA?
          </h2>
          <p className="text-[var(--text-muted)] text-base mb-8 max-w-md mx-auto leading-relaxed">
            We&rsquo;re onboarding founding communities by invitation. Reserve your seat,
            and we&rsquo;ll be in touch when your spot opens.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/founding"
              className="px-8 py-3.5 rounded-lg bg-[#B09B71] text-[#0C0C0E] font-semibold text-sm hover:bg-[#C4A96E] transition-colors flex items-center gap-2"
              style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 8px 28px rgba(176,155,113,0.22)' }}
            >
              Reserve Your Seat
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--parchment)] transition-colors"
            >
              Learn how it works <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────── */}
      <section className="relative px-6 pb-20 max-w-2xl mx-auto">
        <EmailCapture source="launch_page" />
      </section>

      <div className="h-8" />
    </div>
  );
}
