'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check, X, ChevronRight, ArrowRight,
  Vote, DollarSign, FileText, Users,
  Shield, Headphones,
} from 'lucide-react';

/* ── Plan data ───────────────────────────────────────────────────────────── */

const PLANS = [
  {
    name: 'Starter',
    monthly: 49,
    annual: 39,
    units: 'Up to 50 units',
    popular: false,
    features: [
      'Tamper-proof voting',
      'Transparent treasury',
      'Permanent document storage',
      'Resident directory',
      'Maintenance tracking',
      'Community forum',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    monthly: 129,
    annual: 99,
    units: 'Up to 200 units',
    popular: true,
    features: [
      'Everything in Starter',
      'Community health score',
      'Advanced financial reporting',
      'Resident CSV import',
      'Priority support',
      'Custom branding',
    ],
  },
  {
    name: 'Enterprise',
    monthly: 249,
    annual: 199,
    units: 'Unlimited units',
    popular: false,
    features: [
      'Everything in Professional',
      'Unlimited units',
      'Dedicated onboarding',
      'Custom integrations',
      'SLA guarantee',
      'Phone support',
      'API access',
    ],
  },
];

/* ── Comparison table data ───────────────────────────────────────────────── */

type FeatureValue = boolean | string;

interface ComparisonRow {
  label: string;
  starter: FeatureValue;
  pro: FeatureValue;
  enterprise: FeatureValue;
}

interface ComparisonCategory {
  category: string;
  icon: typeof Vote;
  rows: ComparisonRow[];
}

const COMPARISON: ComparisonCategory[] = [
  {
    category: 'Governance',
    icon: Vote,
    rows: [
      { label: 'Tamper-proof voting', starter: true, pro: true, enterprise: true },
      { label: 'Proposal creation', starter: true, pro: true, enterprise: true },
      { label: 'Board elections', starter: true, pro: true, enterprise: true },
      { label: 'Proxy voting', starter: false, pro: true, enterprise: true },
      { label: 'Custom voting rules', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Treasury',
    icon: DollarSign,
    rows: [
      { label: 'Real-time visibility', starter: true, pro: true, enterprise: true },
      { label: 'Multi-sig approvals', starter: true, pro: true, enterprise: true },
      { label: 'Timelock protection', starter: true, pro: true, enterprise: true },
      { label: 'Advanced financial reporting', starter: false, pro: true, enterprise: true },
      { label: 'Custom approval workflows', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Documents',
    icon: FileText,
    rows: [
      { label: 'Permanent storage', starter: true, pro: true, enterprise: true },
      { label: 'Blockchain timestamps', starter: true, pro: true, enterprise: true },
      { label: 'Version history', starter: true, pro: true, enterprise: true },
      { label: 'Bulk upload', starter: false, pro: true, enterprise: true },
      { label: 'Custom document types', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Community',
    icon: Users,
    rows: [
      { label: 'Community forum', starter: true, pro: true, enterprise: true },
      { label: 'Resident directory', starter: true, pro: true, enterprise: true },
      { label: 'Maintenance tracking', starter: true, pro: true, enterprise: true },
      { label: 'Community health score', starter: false, pro: true, enterprise: true },
      { label: 'Resident CSV import', starter: false, pro: true, enterprise: true },
      { label: 'Custom branding', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Support',
    icon: Headphones,
    rows: [
      { label: 'Email support', starter: true, pro: true, enterprise: true },
      { label: 'Priority support', starter: false, pro: true, enterprise: true },
      { label: 'Phone support', starter: false, pro: false, enterprise: true },
      { label: 'Dedicated onboarding', starter: false, pro: false, enterprise: true },
      { label: 'SLA guarantee', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Security & Integrations',
    icon: Shield,
    rows: [
      { label: 'Blockchain-backed records', starter: true, pro: true, enterprise: true },
      { label: 'Full audit trail', starter: true, pro: true, enterprise: true },
      { label: 'Smart contract governance', starter: true, pro: true, enterprise: true },
      { label: 'Custom integrations', starter: false, pro: false, enterprise: true },
      { label: 'API access', starter: false, pro: false, enterprise: true },
    ],
  },
];

/* ── FAQ data ────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: 'What happens after the free trial?',
    a: 'After your 60-day free trial ends, you\'ll be asked to choose a plan and enter payment information. If you don\'t subscribe, your account will be placed in read-only mode — you\'ll still have access to all your records, but you won\'t be able to create new votes, proposals, or documents.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Absolutely. You can upgrade or downgrade at any time from your account settings. Upgrades take effect immediately, and downgrades apply at the end of your current billing period. You\'ll never lose access to your existing data.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'No. There are no setup fees, no hidden fees, and no onboarding charges for Starter or Professional plans. Enterprise customers receive complimentary dedicated onboarding as part of the plan.',
  },
  {
    q: 'Do you offer discounts for larger communities?',
    a: 'Yes. If your community has more than 500 units, contact us for custom pricing. We also offer volume discounts for management companies overseeing multiple communities.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) as well as ACH bank transfers for annual plans. All payments are processed securely through Stripe.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. There are no contracts and no cancellation fees. Cancel from your account settings at any time. Your subscription will remain active until the end of the current billing period.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your blockchain-backed records (votes, financial transactions, document hashes) remain permanently on-chain and accessible indefinitely — they can never be deleted. Your account data is retained for 90 days after cancellation, giving you time to export anything you need.',
  },
  {
    q: 'Do you offer a nonprofit discount?',
    a: 'Yes. We offer a 15% discount for registered nonprofit HOAs and community associations. Contact us with your nonprofit documentation and we\'ll apply the discount to your account.',
  },
];

/* ── Component ───────────────────────────────────────────────────────────── */

function CellValue({ value }: { value: FeatureValue }) {
  if (value === true)
    return <Check className="w-4 h-4 text-[#3A7D6F] mx-auto" />;
  if (value === false)
    return <X className="w-4 h-4 text-[rgba(245,240,232,0.15)] mx-auto" />;
  return <span className="text-[13px] text-[rgba(245,240,232,0.55)]">{value}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--parchment)]">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden page-enter">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(176,155,113,0.4) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mb-6 leading-[1.1]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <span className="gradient-text">Simple, honest pricing.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[rgba(245,240,232,0.55)] max-w-2xl mx-auto mb-4 leading-relaxed">
            All plans include a 60-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* ── BILLING TOGGLE ───────────────────────────────────────────────── */}
      <section className="page-enter page-enter-delay-1">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-center gap-4 pb-14">
          <span
            className="text-sm font-medium transition-colors"
            style={{ color: !annual ? 'var(--parchment)' : 'rgba(245,240,232,0.35)' }}
          >
            Monthly
          </span>

          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B09B71]"
            style={{
              background: annual ? '#B09B71' : 'rgba(245,240,232,0.1)',
              border: '1px solid rgba(245,240,232,0.08)',
            }}
            aria-label="Toggle annual billing"
          >
            <span
              className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full transition-transform duration-200"
              style={{
                background: annual ? '#0C0C0E' : 'rgba(245,240,232,0.6)',
                transform: annual ? 'translateX(28px)' : 'translateX(0)',
              }}
            />
          </button>

          <span
            className="text-sm font-medium transition-colors"
            style={{ color: annual ? 'var(--parchment)' : 'rgba(245,240,232,0.35)' }}
          >
            Annual
          </span>

          {annual && (
            <span
              className="ml-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{ background: 'rgba(42,93,79,0.15)', color: '#3A7D6F', border: '1px solid rgba(42,93,79,0.25)' }}
            >
              Save 20%
            </span>
          )}
        </div>
      </section>

      {/* ── PRICING CARDS ────────────────────────────────────────────────── */}
      <section className="page-enter page-enter-delay-2">
        <div className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map(({ name, monthly, annual: annualPrice, units, features, popular }) => {
              const price = annual ? annualPrice : monthly;

              return (
                <div
                  key={name}
                  className="rounded-xl p-6 flex flex-col relative hover-lift"
                  style={{
                    background: '#151518',
                    border: popular
                      ? '1px solid rgba(176,155,113,0.3)'
                      : '1px solid rgba(245,240,232,0.06)',
                    boxShadow: popular
                      ? '0 0 40px rgba(176,155,113,0.1), 0 0 80px rgba(176,155,113,0.05)'
                      : 'none',
                  }}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-medium bg-[#B09B71] text-[#0C0C0E]">
                      Most Popular
                    </span>
                  )}

                  <h3 className="text-lg font-medium text-[var(--parchment)] mb-1">{name}</h3>
                  <p className="text-[13px] text-[rgba(245,240,232,0.35)] mb-5">{units}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-medium text-[var(--parchment)]">${price}</span>
                    <span className="text-[rgba(245,240,232,0.35)]"> /mo</span>
                    {annual && (
                      <p className="text-[12px] text-[#B09B71] mt-1">
                        ${annualPrice * 12}/yr &middot; billed annually
                      </p>
                    )}
                    {!annual && (
                      <p className="text-[12px] text-[rgba(245,240,232,0.25)] mt-1">
                        or ${annualPrice}/mo billed annually
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] text-[rgba(245,240,232,0.55)]">
                        <Check className="w-4 h-4 text-[#3A7D6F] shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/checkout"
                    className="w-full py-3.5 rounded-lg text-center font-medium text-sm transition-all duration-200 hover:scale-[1.01] block"
                    style={{
                      background: popular
                        ? 'linear-gradient(135deg, #B09B71 0%, #8A7550 100%)'
                        : 'rgba(245,240,232,0.04)',
                      color: popular ? '#0C0C0E' : 'rgba(245,240,232,0.6)',
                      border: popular ? 'none' : '1px solid rgba(245,240,232,0.08)',
                      boxShadow: popular ? '0 0 24px rgba(176,155,113,0.25)' : 'none',
                    }}
                  >
                    Start Free Trial
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="text-center text-[13px] text-[rgba(245,240,232,0.3)] mt-6">
            All plans include a 60-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* ── FEATURE COMPARISON TABLE ─────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-20 page-enter page-enter-delay-3">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-medium gradient-text mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Compare every feature.
            </h2>
            <p className="text-[rgba(245,240,232,0.45)] max-w-xl mx-auto">
              See exactly what you get with each plan. No surprises, no hidden limits.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(245,240,232,0.08)]">
                  <th className="text-left py-4 pr-4 text-[13px] font-medium text-[rgba(245,240,232,0.35)] w-[40%]">
                    Feature
                  </th>
                  {['Starter', 'Professional', 'Enterprise'].map((plan) => (
                    <th
                      key={plan}
                      className="py-4 px-3 text-center text-[13px] font-medium w-[20%]"
                      style={{ color: plan === 'Professional' ? '#B09B71' : 'rgba(245,240,232,0.55)' }}
                    >
                      {plan}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(({ category, icon: Icon, rows }) => (
                  <>
                    <tr key={category}>
                      <td colSpan={4} className="pt-8 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center"
                            style={{ background: 'rgba(176,155,113,0.08)' }}
                          >
                            <Icon className="w-3.5 h-3.5 text-[#B09B71]" />
                          </div>
                          <span className="text-sm font-medium text-[var(--parchment)]">{category}</span>
                        </div>
                      </td>
                    </tr>
                    {rows.map(({ label, starter, pro, enterprise }) => (
                      <tr
                        key={label}
                        className="border-b border-[rgba(245,240,232,0.04)] hover:bg-[rgba(245,240,232,0.01)] transition-colors"
                      >
                        <td className="py-3 pr-4 text-[13px] text-[rgba(245,240,232,0.50)]">{label}</td>
                        <td className="py-3 px-3 text-center"><CellValue value={starter} /></td>
                        <td className="py-3 px-3 text-center"><CellValue value={pro} /></td>
                        <td className="py-3 px-3 text-center"><CellValue value={enterprise} /></td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards per category */}
          <div className="md:hidden space-y-6">
            {COMPARISON.map(({ category, icon: Icon, rows }) => (
              <div
                key={category}
                className="rounded-xl overflow-hidden"
                style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}
              >
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[rgba(245,240,232,0.06)]">
                  <Icon className="w-4 h-4 text-[#B09B71]" />
                  <span className="text-sm font-medium text-[var(--parchment)]">{category}</span>
                </div>
                <div className="divide-y divide-[rgba(245,240,232,0.04)]">
                  {rows.map(({ label, starter, pro, enterprise }) => (
                    <div key={label} className="px-5 py-3">
                      <p className="text-[13px] text-[rgba(245,240,232,0.50)] mb-2">{label}</p>
                      <div className="flex items-center gap-6 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <CellValue value={starter} />
                          <span className="text-[rgba(245,240,232,0.25)]">Starter</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CellValue value={pro} />
                          <span className="text-[rgba(245,240,232,0.25)]">Pro</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CellValue value={enterprise} />
                          <span className="text-[rgba(245,240,232,0.25)]">Ent</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-20 page-enter page-enter-delay-4" id="faq">
        <div className="max-w-3xl mx-auto px-6">
          <h2
            className="text-3xl sm:text-4xl font-medium gradient-text text-center mb-14"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Pricing questions, answered.
          </h2>

          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl overflow-hidden"
                style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                  <span className="font-medium text-[var(--parchment)] text-[15px]">{q}</span>
                  <ChevronRight className="w-4 h-4 text-[rgba(245,240,232,0.3)] transition-transform group-open:rotate-90 shrink-0 ml-4" />
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
        <div className="max-w-5xl mx-auto px-6">
          <div
            className="rounded-xl p-10 sm:p-14 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(176,155,113,0.10) 0%, rgba(42,93,79,0.08) 100%)',
              border: '1px solid rgba(176,155,113,0.2)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(176,155,113,0.12) 0%, transparent 60%)' }}
            />
            <div className="relative z-10">
              <h2
                className="text-3xl sm:text-4xl font-medium text-[var(--parchment)] mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Still have questions?
              </h2>
              <p className="text-[rgba(245,240,232,0.50)] max-w-lg mx-auto mb-8">
                Our team is happy to walk you through a demo, answer questions, or help you pick the right plan for your community.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-base transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #B09B71 0%, #8A7550 100%)',
                    color: '#0C0C0E',
                    boxShadow: '0 0 32px rgba(176,155,113,0.3)',
                  }}
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-4 rounded-xl font-medium text-base text-[rgba(245,240,232,0.6)] hover:text-[var(--parchment)] transition-colors"
                  style={{
                    background: 'rgba(245,240,232,0.04)',
                    border: '1px solid rgba(245,240,232,0.08)',
                  }}
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
