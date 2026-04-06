'use client';

import Link from 'next/link';
import {
  Shield, DollarSign, Vote, FileText, Users, BarChart3,
  ChevronRight, ArrowRight, Check, Mail, Building2, Send,
  Lock, Eye, BanknoteIcon, Wrench,
} from 'lucide-react';
import { SaaSProductJsonLd, OrganizationJsonLd } from '@/components/JsonLd';

const FEATURES = [
  {
    icon: Vote,
    title: 'Tamper-Proof Voting',
    desc: 'Every vote is permanently recorded the moment it\'s cast. No one can change the results — not even us.',
  },
  {
    icon: DollarSign,
    title: 'Transparent Treasury',
    desc: 'See exactly where every dollar goes. Dues, expenses, reserves — all visible to every resident in real time.',
  },
  {
    icon: FileText,
    title: 'Permanent Documents',
    desc: 'Meeting minutes and CC&Rs that can never be lost or altered. Stored permanently, timestamped, always accessible.',
  },
  {
    icon: BarChart3,
    title: 'Community Health Score',
    desc: 'An automatic scorecard for your HOA — voter participation, financial health, document compliance — all in one number.',
  },
  {
    icon: Users,
    title: 'Resident Tools',
    desc: 'Directory, maintenance requests, community forum — everything in one place, connected to the same trusted system.',
  },
  {
    icon: Shield,
    title: 'Zero-Trust Security',
    desc: 'We can\'t move your money, change your votes, or alter your documents. The technology enforces it — not just a policy.',
  },
];

const STEPS = [
  { num: '01', icon: Mail, title: 'Sign Up', desc: 'Just your email. 30 seconds. No credit card.' },
  { num: '02', icon: Building2, title: 'Set Up Your Community', desc: 'Name, address, unit count. Import your docs.' },
  { num: '03', icon: Send, title: 'Invite Residents', desc: 'Email invites or QR code at your next meeting.' },
  { num: '04', icon: Shield, title: 'Govern Transparently', desc: 'Vote, manage finances, store documents — permanently.' },
];

const PRICING = [
  {
    name: 'Starter',
    price: 49,
    annual: 39,
    units: 'Up to 50 units',
    features: ['Tamper-proof voting', 'Transparent treasury', 'Permanent document storage', 'Resident directory', 'Maintenance tracking', 'Community forum', 'Email support'],
    popular: false,
  },
  {
    name: 'Professional',
    price: 129,
    annual: 99,
    units: 'Up to 200 units',
    features: ['Everything in Starter', 'Community health score', 'Advanced financial reporting', 'Resident CSV import', 'Priority support', 'Custom branding'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 249,
    annual: 199,
    units: 'Unlimited units',
    features: ['Everything in Professional', 'Unlimited units', 'Dedicated onboarding', 'Custom integrations', 'SLA guarantee', 'Phone support'],
    popular: false,
  },
];

const FAQS = [
  { q: 'Do I need cryptocurrency?', a: 'No. Sign up with your email and start using it like any other web application. We handle all the technical infrastructure behind the scenes.' },
  { q: 'Is this secure?', a: 'More secure than any traditional HOA software. Your records are stored across thousands of independent computers — there\'s no central point of failure, and records can\'t be altered.' },
  { q: 'What if I\'m not tech-savvy?', a: 'If you can use email and a web browser, you can use SuvrenHOA. We designed every screen for people who have zero interest in technology. Our average board member is in their 60s.' },
  { q: 'Can the board manipulate votes?', a: 'No. Once cast, votes are permanently recorded and cannot be changed — not by the board, not by us, not by anyone. Every election includes a verifiable audit trail.' },
  { q: 'What if SuvrenHOA goes out of business?', a: 'Your records are stored on a permanent network no single company controls. Even if we ceased to exist, every vote, document, and financial record would remain permanently accessible.' },
  { q: 'How much does it cost?', a: 'Plans start at $49/month. All plans include a 60-day free trial — no credit card required. Cancel anytime.' },
  { q: 'Can I migrate from current software?', a: 'Yes. We help migrate your documents, resident lists, and financial records. Most communities are fully set up within a week.' },
  { q: 'Is there a long-term contract?', a: 'No contracts, no lock-in, cancel anytime. Month-to-month billing, and you can export your data anytime.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--parchment)]">
      <SaaSProductJsonLd />
      <OrganizationJsonLd />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-15"
               style={{ background: 'radial-gradient(circle, rgba(176,155,113,0.4) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-[13px] font-medium"
               style={{ background: 'rgba(176,155,113,0.08)', border: '1px solid rgba(176,155,113,0.2)', color: '#B09B71' }}>
            <div className="w-2 h-2 rounded-full bg-[#3A7D6F] animate-pulse" />
            Now accepting founding communities
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mb-6 leading-[1.1]"
              style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="gradient-text">Finally, an HOA</span>
            <br />
            <span className="gradient-text">you can actually trust.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[rgba(245,240,232,0.55)] max-w-2xl mx-auto mb-10 leading-relaxed">
            SuvrenHOA permanently records every vote, every dollar, and every document — so nothing can go missing,
            and no one can say the results were rigged.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/signup"
                  className="px-8 py-4 rounded-xl font-medium text-base transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #B09B71 0%, #8A7550 100%)',
                    color: '#0C0C0E',
                    boxShadow: '0 0 32px rgba(176,155,113,0.3)',
                  }}>
              Start Free Trial — 60 Days Free
              <ArrowRight className="inline-block w-4 h-4 ml-2" />
            </Link>
            <button className="px-6 py-4 rounded-xl font-medium text-base text-[rgba(245,240,232,0.6)] hover:text-[var(--parchment)] transition-colors"
                    style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)' }}>
              ▶ Watch Demo
            </button>
          </div>

          <p className="text-[13px] text-[rgba(245,240,232,0.3)]">
            No credit card required · No tech expertise needed · Setup takes under 5 minutes
          </p>
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-[13px] uppercase tracking-widest text-[#B09B71] font-medium mb-12">
            Sound familiar?
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '💸', title: 'Missing Money', quote: '"Where did $480,000 in HOA dues actually go?"', desc: 'A 47-tab spreadsheet nobody can read, managed by someone who left the board three years ago.' },
              { emoji: '🗳️', title: 'Rigged Votes', quote: '"Board elections with no audit trail."', desc: 'Paper ballots counted behind closed doors. No independent verification. No way to prove the results.' },
              { emoji: '📄', title: 'Lost Documents', quote: '"Your CC&Rs from 2019? Gone."', desc: 'The board president\'s laptop died. The Google Drive got deleted. Nobody has a backup.' },
            ].map(({ emoji, title, quote, desc }) => (
              <div key={title} className="rounded-xl p-6 text-center"
                   style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
                <span className="text-3xl mb-4 block">{emoji}</span>
                <h3 className="text-lg font-medium text-[var(--parchment)] mb-2">{title}</h3>
                <p className="text-[14px] text-[#B09B71] italic mb-3">{quote}</p>
                <p className="text-[13px] text-[rgba(245,240,232,0.45)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-medium gradient-text mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Governance your community can believe in.
            </h2>
            <p className="text-[rgba(245,240,232,0.45)] max-w-xl mx-auto">
              A permanent, tamper-proof record of everything — without requiring anyone to become a tech expert.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl p-5 hover-lift"
                   style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                     style={{ background: 'rgba(176,155,113,0.08)' }}>
                  <Icon className="w-5 h-5 text-[#B09B71]" />
                </div>
                <h3 className="font-medium text-[var(--parchment)] mb-2">{title}</h3>
                <p className="text-[13px] text-[rgba(245,240,232,0.45)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-medium gradient-text mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Up and running in minutes.
            </h2>
            <p className="text-[rgba(245,240,232,0.45)]">Seriously.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                     style={{ background: 'rgba(176,155,113,0.08)', border: '1px solid rgba(176,155,113,0.15)' }}>
                  <Icon className="w-6 h-6 text-[#B09B71]" />
                </div>
                <p className="text-[11px] text-[#B09B71] font-medium tracking-wider mb-1">STEP {num}</p>
                <h3 className="font-medium text-[var(--parchment)] mb-1">{title}</h3>
                <p className="text-[12px] text-[rgba(245,240,232,0.40)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-xl p-10 text-center"
               style={{
                 background: 'linear-gradient(135deg, rgba(176,155,113,0.06) 0%, rgba(42,93,79,0.06) 100%)',
                 border: '1px solid rgba(176,155,113,0.15)',
               }}>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-6">
              <div>
                <p className="text-3xl font-medium text-[var(--parchment)]">370,000+</p>
                <p className="text-[12px] text-[rgba(245,240,232,0.40)]">HOAs in America</p>
              </div>
              <div>
                <p className="text-3xl font-medium text-[var(--parchment)]">$100B+</p>
                <p className="text-[12px] text-[rgba(245,240,232,0.40)]">Collected in dues yearly</p>
              </div>
              <div>
                <p className="text-3xl font-medium text-[#B09B71]">Zero</p>
                <p className="text-[12px] text-[rgba(245,240,232,0.40)]">Use tamper-proof governance</p>
              </div>
            </div>
            <p className="text-[rgba(245,240,232,0.55)] italic" style={{ fontFamily: 'var(--font-heading)' }}>
              Be the HOA your community can finally trust.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-20" id="pricing">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-medium gradient-text mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Simple, honest pricing.
            </h2>
            <p className="text-[rgba(245,240,232,0.45)]">
              All plans include a 60-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {PRICING.map(({ name, price, annual, units, features, popular }) => (
              <div key={name} className="rounded-xl p-6 flex flex-col relative"
                   style={{
                     background: '#151518',
                     border: popular ? '1px solid rgba(176,155,113,0.3)' : '1px solid rgba(245,240,232,0.06)',
                     boxShadow: popular ? '0 0 32px rgba(176,155,113,0.08)' : 'none',
                   }}>
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-medium bg-[#B09B71] text-[#0C0C0E]">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-medium text-[var(--parchment)] mb-1">{name}</h3>
                <p className="text-[12px] text-[rgba(245,240,232,0.35)] mb-4">{units}</p>
                <div className="mb-5">
                  <span className="text-3xl font-medium text-[var(--parchment)]">${price}</span>
                  <span className="text-[rgba(245,240,232,0.35)]"> /mo</span>
                  <p className="text-[11px] text-[#B09B71] mt-1">${annual}/mo billed annually</p>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-[rgba(245,240,232,0.55)]">
                      <Check className="w-4 h-4 text-[#3A7D6F] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup"
                      className="w-full py-3 rounded-lg text-center font-medium text-sm transition-all"
                      style={{
                        background: popular ? '#B09B71' : 'rgba(245,240,232,0.04)',
                        color: popular ? '#0C0C0E' : 'rgba(245,240,232,0.6)',
                        border: popular ? 'none' : '1px solid rgba(245,240,232,0.08)',
                      }}>
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-medium gradient-text mb-3"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Built to last. Built to trust.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: Lock, title: 'Proven Technology', desc: 'Built on the same distributed record-keeping technology used by major financial institutions. Every transaction recorded on an independent public ledger.' },
              { icon: FileText, title: 'Permanently Safe', desc: 'Documents stored for 200+ years on a permanent network. Even if you stop using SuvrenHOA, your records remain accessible. Forever.' },
              { icon: Eye, title: 'Open & Auditable', desc: 'The rules governing your treasury and voting are open for anyone to inspect. We\'re not asking you to trust us — the math doesn\'t lie.' },
              { icon: BanknoteIcon, title: 'We Never Touch Your Money', desc: 'SuvrenHOA can\'t move your community\'s funds — period. Transactions only execute when proper approvals are in place.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl p-6 flex items-start gap-4"
                   style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: 'rgba(42,93,79,0.1)' }}>
                  <Icon className="w-5 h-5 text-[#3A7D6F]" />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--parchment)] mb-1">{title}</h3>
                  <p className="text-[13px] text-[rgba(245,240,232,0.45)] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-20" id="faq">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-medium gradient-text text-center mb-14"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Questions? We've got answers.
          </h2>

          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group rounded-xl overflow-hidden"
                       style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}>
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                  <span className="font-medium text-[var(--parchment)] text-[15px]">{q}</span>
                  <ChevronRight className="w-4 h-4 text-[rgba(245,240,232,0.3)] transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-5 text-[14px] text-[rgba(245,240,232,0.50)] leading-relaxed">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-xl p-10 sm:p-14 text-center relative overflow-hidden"
               style={{
                 background: 'linear-gradient(135deg, rgba(176,155,113,0.10) 0%, rgba(42,93,79,0.08) 100%)',
                 border: '1px solid rgba(176,155,113,0.2)',
               }}>
            <div className="absolute inset-0 pointer-events-none"
                 style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(176,155,113,0.12) 0%, transparent 60%)' }} />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-medium text-[var(--parchment)] mb-4"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Ready for governance your<br />community can trust?
              </h2>
              <p className="text-[rgba(245,240,232,0.50)] max-w-lg mx-auto mb-8">
                Join the founding communities building the future of transparent HOA governance.
                60 days free. No credit card. No blockchain knowledge required.
              </p>
              <Link href="/signup"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-base transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, #B09B71 0%, #8A7550 100%)',
                      color: '#0C0C0E',
                      boxShadow: '0 0 32px rgba(176,155,113,0.3)',
                    }}>
                Start Your Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
