'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Award, Users, Percent, Headphones, Star, Map,
  CheckCircle2, ChevronRight, ArrowRight, Shield,
} from 'lucide-react';

const TOTAL_SPOTS = 50;
const TAKEN_SPOTS = 12; // Update as applications come in

const BENEFITS = [
  {
    icon: Percent,
    title: '20% Lifetime Discount',
    desc: 'Lock in 20% off your plan forever — even as prices increase for new customers.',
  },
  {
    icon: Headphones,
    title: 'Priority Support',
    desc: 'Real humans respond within 4 hours. Your community is never second in line.',
  },
  {
    icon: Award,
    title: 'Founding Badge',
    desc: 'Your community carries the Founding Member badge permanently. A mark of early trust.',
  },
  {
    icon: Star,
    title: 'Early Access',
    desc: 'Every new feature goes to Founding Communities first — often weeks before general release.',
  },
  {
    icon: Map,
    title: 'Roadmap Input',
    desc: "Shape what we build next. Monthly calls with our team, direct line to product decisions.",
  },
  {
    icon: Shield,
    title: 'White-Glove Setup',
    desc: 'We onboard your community personally — migrate documents, invite residents, set up governance.',
  },
];

const PAIN_POINT_OPTIONS = [
  'Lack of financial transparency',
  'Disputed or altered meeting minutes',
  'Low resident participation in voting',
  'Lost or inaccessible community documents',
  'Board accountability issues',
  'Slow maintenance request resolution',
  'Difficult resident communication',
  'Manual dues collection',
  'No centralized community directory',
  'Other',
];

const ROLE_OPTIONS = [
  { value: 'board_president', label: 'Board President' },
  { value: 'board_member', label: 'Board Member' },
  { value: 'property_manager', label: 'Property Manager' },
  { value: 'resident', label: 'Resident / Homeowner' },
  { value: 'other', label: 'Other' },
];

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function FoundingPageClient() {
  const [form, setForm] = useState({
    community_name: '',
    property_count: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    role: '',
    pain_points: [] as string[],
    referral_source: '',
    additional_notes: '',
  });
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const spotsRemaining = TOTAL_SPOTS - TAKEN_SPOTS;
  const pctFilled = Math.round((TAKEN_SPOTS / TOTAL_SPOTS) * 100);

  function togglePainPoint(point: string) {
    setForm(f => ({
      ...f,
      pain_points: f.pain_points.includes(point)
        ? f.pain_points.filter(p => p !== point)
        : [...f.pain_points, point],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/founding/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          property_count: parseInt(form.property_count) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setState('error');
        return;
      }
      setState('success');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[rgba(176,155,113,0.1)] border border-[rgba(176,155,113,0.3)] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#B09B71]" />
          </div>
          <h1 className="font-playfair text-3xl font-bold text-[#E8E4DC] mb-4">Application Received</h1>
          <p className="text-[#C4BAA8] text-lg leading-relaxed mb-6">
            Thank you for applying. We review every application personally and will reach out within 2–3 business days.
          </p>
          <p className="text-[#8A8070] text-sm mb-8">Check your inbox — we sent a confirmation to your email.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#B09B71] hover:text-[#C4B080] font-medium transition-colors"
          >
            Back to home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 px-4 text-center border-b border-[var(--divider)]">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[rgba(176,155,113,0.1)] border border-[rgba(176,155,113,0.3)] rounded-full px-4 py-1.5 mb-6">
            <Award className="w-4 h-4 text-[#B09B71]" />
            <span className="text-[#B09B71] text-sm font-medium">Limited — {spotsRemaining} spots remaining</span>
          </div>
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-[#E8E4DC] mb-6 leading-tight">
            Be Among the First
          </h1>
          <p className="text-xl text-[#C4BAA8] leading-relaxed mb-8 max-w-2xl mx-auto">
            The SuvrenHOA Founding Community Program is open to{' '}
            <span className="text-[#B09B71] font-semibold">{TOTAL_SPOTS} communities</span> who want to be part of something historic — the first HOAs to govern with blockchain transparency.
          </p>

          {/* Spots meter */}
          <div className="max-w-sm mx-auto mb-4">
            <div className="flex justify-between text-sm text-[#8A8070] mb-2">
              <span>{TAKEN_SPOTS} of {TOTAL_SPOTS} spots claimed</span>
              <span>{spotsRemaining} remaining</span>
            </div>
            <div className="h-2 bg-[#1E1E22] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#B09B71] to-[#8A7A55] rounded-full transition-all duration-500"
                style={{ width: `${pctFilled}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-[#4A4A52]">Spots are filled on a first-approved basis</p>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-[#E8E4DC] text-center mb-12">Founding Community Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="bg-[rgb(21,21,24)] rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.20),0_1px_2px_0_rgba(0,0,0,0.30)] hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.40),0_1px_2px_0_rgba(0,0,0,0.30)] hover:-translate-y-px p-6 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-[rgba(176,155,113,0.1)] flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-[#B09B71]" />
                </div>
                <h3 className="font-semibold text-[#E8E4DC] mb-2">{b.title}</h3>
                <p className="text-sm text-[#8A8070] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section className="py-16 px-4 border-t border-[var(--divider)]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl font-bold text-[#E8E4DC] mb-4">Apply Now</h2>
            <p className="text-[#8A8070]">Tell us about your community. We review every application personally.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community info */}
            <fieldset className="bg-[rgb(21,21,24)] rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.20),0_1px_2px_0_rgba(0,0,0,0.30)] p-6 space-y-4">
              <legend className="text-xs font-semibold text-[#B09B71] uppercase tracking-widest px-1">Community</legend>

              <div>
                <label className="block text-sm font-medium text-[#C4BAA8] mb-1.5">Community Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Oakwood Heights HOA"
                  value={form.community_name}
                  onChange={e => setForm(f => ({ ...f, community_name: e.target.value }))}
                  className="w-full bg-[#0C0C0E] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] placeholder-[#4A4A52] focus:outline-none focus:border-[#B09B71] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#C4BAA8] mb-1.5">Number of Properties *</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="e.g. 120"
                  value={form.property_count}
                  onChange={e => setForm(f => ({ ...f, property_count: e.target.value }))}
                  className="w-full bg-[#0C0C0E] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] placeholder-[#4A4A52] focus:outline-none focus:border-[#B09B71] transition-colors"
                />
              </div>
            </fieldset>

            {/* Contact info */}
            <fieldset className="bg-[rgb(21,21,24)] rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.20),0_1px_2px_0_rgba(0,0,0,0.30)] p-6 space-y-4">
              <legend className="text-xs font-semibold text-[#B09B71] uppercase tracking-widest px-1">Your Information</legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#C4BAA8] mb-1.5">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Smith"
                    value={form.contact_name}
                    onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                    className="w-full bg-[#0C0C0E] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] placeholder-[#4A4A52] focus:outline-none focus:border-[#B09B71] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#C4BAA8] mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@hoaexample.com"
                    value={form.contact_email}
                    onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                    className="w-full bg-[#0C0C0E] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] placeholder-[#4A4A52] focus:outline-none focus:border-[#B09B71] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#C4BAA8] mb-1.5">Phone <span className="text-[#4A4A52]">(optional)</span></label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.contact_phone}
                    onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                    className="w-full bg-[#0C0C0E] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] placeholder-[#4A4A52] focus:outline-none focus:border-[#B09B71] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#C4BAA8] mb-1.5">Your Role *</label>
                  <select
                    required
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full bg-[#0C0C0E] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] focus:outline-none focus:border-[#B09B71] transition-colors"
                  >
                    <option value="" disabled>Select role</option>
                    {ROLE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Pain points */}
            <fieldset className="bg-[rgb(21,21,24)] rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.20),0_1px_2px_0_rgba(0,0,0,0.30)] p-6">
              <legend className="text-xs font-semibold text-[#B09B71] uppercase tracking-widest px-1 mb-4">What challenges does your community face? <span className="text-[#4A4A52] normal-case">(select all that apply)</span></legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PAIN_POINT_OPTIONS.map(point => {
                  const selected = form.pain_points.includes(point);
                  return (
                    <button
                      key={point}
                      type="button"
                      onClick={() => togglePainPoint(point)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left text-sm transition-all ${
                        selected
                          ? 'border-[rgba(176,155,113,0.6)] bg-[rgba(176,155,113,0.1)] text-[#E8E4DC]'
                          : 'border-[#2A2A2E] text-[#8A8070] hover:border-[#3A3A3E] hover:text-[#C4BAA8]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                        selected ? 'border-[#B09B71] bg-[#B09B71]' : 'border-[#3A3A3E]'
                      }`}>
                        {selected && <CheckCircle2 className="w-3 h-3 text-[#0C0C0E]" />}
                      </div>
                      {point}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Additional */}
            <fieldset className="bg-[rgb(21,21,24)] rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.20),0_1px_2px_0_rgba(0,0,0,0.30)] p-6 space-y-4">
              <legend className="text-xs font-semibold text-[#B09B71] uppercase tracking-widest px-1">A Bit More</legend>

              <div>
                <label className="block text-sm font-medium text-[#C4BAA8] mb-1.5">How did you hear about us? <span className="text-[#4A4A52]">(optional)</span></label>
                <input
                  type="text"
                  placeholder="Twitter, Google, a neighbor, etc."
                  value={form.referral_source}
                  onChange={e => setForm(f => ({ ...f, referral_source: e.target.value }))}
                  className="w-full bg-[#0C0C0E] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] placeholder-[#4A4A52] focus:outline-none focus:border-[#B09B71] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#C4BAA8] mb-1.5">Anything else we should know? <span className="text-[#4A4A52]">(optional)</span></label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your community's situation, timeline, or specific needs..."
                  value={form.additional_notes}
                  onChange={e => setForm(f => ({ ...f, additional_notes: e.target.value }))}
                  className="w-full bg-[#0C0C0E] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] placeholder-[#4A4A52] focus:outline-none focus:border-[#B09B71] transition-colors resize-none"
                />
              </div>
            </fieldset>

            {state === 'error' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={state === 'submitting'}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#B09B71] to-[#8A7A55] text-[#0C0C0E] font-bold text-base py-4 rounded-xl hover:from-[#C4B080] hover:to-[#9A8A65] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {state === 'submitting' ? (
                <>
                  <div className="w-4 h-4 border-2 border-[rgba(12,12,14,0.3)] border-t-[#0C0C0E] rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  Apply for Founding Status
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#4A4A52]">
              No credit card required. We review within 2–3 business days.
            </p>
          </form>

          {/* Social proof */}
          <div className="mt-12 pt-8 border-t border-[var(--divider)]">
            <div className="flex items-center gap-3 justify-center">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[rgba(176,155,113,0.2)] border border-[rgba(176,155,113,0.3)] flex items-center justify-center text-xs text-[#B09B71] font-semibold">
                    {['O', 'M', 'P', 'G', 'L'][i]}
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#8A8070]">
                <span className="text-[#C4BAA8] font-medium">{TAKEN_SPOTS} communities</span> already applied
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-[var(--divider)]">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC] mb-8 text-center">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'How many founding spots are available?',
                a: `Exactly ${TOTAL_SPOTS}. Once they're gone, they're gone. The founding program is a one-time offering.`,
              },
              {
                q: 'When does the discount start?',
                a: "From day one of your subscription. The 20% is applied automatically and stays on your account forever.",
              },
              {
                q: 'Is there a commitment required?',
                a: "No long-term contract. You can cancel anytime. The founding discount applies to whatever plan you're on.",
              },
              {
                q: "How will I know if I'm approved?",
                a: "We'll email you within 2–3 business days with either an approval (including your setup link) or a waitlist notice.",
              },
            ].map(faq => (
              <details key={faq.q} className="bg-[rgb(21,21,24)] rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.20),0_1px_2px_0_rgba(0,0,0,0.30)] group">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-[#E8E4DC] font-medium select-none list-none">
                  {faq.q}
                  <ChevronRight className="w-4 h-4 text-[#8A8070] group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <p className="px-6 pb-4 text-[#8A8070] text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 px-4 border-t border-[var(--divider)] text-center">
        <p className="text-[#8A8070] text-sm">
          Not ready to apply?{' '}
          <Link href="/launch" className="text-[#B09B71] hover:text-[#C4B080] transition-colors">
            Sign up for launch updates →
          </Link>
        </p>
      </section>
    </div>
  );
}
