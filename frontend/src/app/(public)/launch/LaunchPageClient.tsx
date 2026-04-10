'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Users,
  Building2, Vote, FileText, ExternalLink, Share2,
} from 'lucide-react';
import { LAUNCH_DATE } from '@/lib/launch';

const STATS = [
  { value: '80+', label: 'App screens' },
  { value: '7', label: 'Smart contracts' },
  { value: '122', label: 'Passing tests' },
  { value: '50', label: 'Founding spots' },
];

const FEATURES_HIGHLIGHT = [
  { icon: Vote, text: 'Tamper-proof on-chain voting' },
  { icon: Building2, text: 'Blockchain property registry' },
  { icon: FileText, text: 'Permanent document storage (Arweave)' },
  { icon: Users, text: 'Full resident portal' },
];

function useCountdown(target: Date) {
  const [remaining, setRemaining] = useState(Math.max(0, target.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, target.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, launched: remaining === 0 };
}

type SignupState = 'idle' | 'submitting' | 'success' | 'error';

export default function LaunchPageClient() {
  const { days, hours, minutes, seconds, launched } = useCountdown(LAUNCH_DATE);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [signupState, setSignupState] = useState<SignupState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [signupCount, setSignupCount] = useState<number | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/launch/signup')
      .then(r => r.json())
      .then(d => setSignupCount(d.count))
      .catch(() => null);
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupState('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/launch/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined, source: 'launch_page' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong.');
        setSignupState('error');
        return;
      }
      setSignupState('success');
      setSignupCount(c => (c ?? 0) + 1);
    } catch {
      setErrorMsg('Network error. Please try again.');
      setSignupState('error');
    }
  }

  const shareText = encodeURIComponent('SuvrenHOA is launching soon — blockchain-powered HOA governance. Transparent treasury, tamper-proof voting, permanent documents.');
  const shareUrl = encodeURIComponent('https://suvren.com/launch');

  return (
    <div className="min-h-screen">
      {/* Hero + countdown */}
      <section className="py-20 px-4 text-center border-b border-[var(--divider)]">
        <div className="max-w-4xl mx-auto">
          {/* Launch eyebrow — neutral parchment, no third-party brand color.
              V13 Lux fix: removed 🐱 emoji (Rule 2) and #F68341 orange (palette leak).
              The Product Hunt association will be re-added as a proper SVG badge
              when the PH listing goes live. */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-3 rounded-full border border-[rgba(176,155,113,0.24)] bg-[rgba(176,155,113,0.06)] px-4 py-1.5 text-xs font-medium tracking-[0.14em] uppercase text-[rgba(245,240,232,0.72)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B09B71] animate-pulse" aria-hidden="true" />
              Launching Soon
            </span>
          </div>

          {/* V12 fix (Lux V11 audit): explicit whitespace between the two
              lines so textContent reads "HOA Governance, Finally Honest."
              for a11y/SEO, and the brass span carries text-5xl/md:text-7xl
              so Tailwind's color-only arbitrary value can't collapse the
              computed font-size on the child.
              V13 fix: removed font-bold — Playfair at 400 is the hierarchy
              rule, Rule 3 in the Lux sin ledger. */}
          <h1 className="font-playfair text-5xl md:text-7xl font-normal text-[#E8E4DC] mb-6 leading-tight">
            <span>HOA Governance,</span>{' '}
            <br />
            <span className="text-[#B09B71] text-5xl md:text-7xl">Finally Honest.</span>
          </h1>
          <p className="text-xl text-[#C4BAA8] leading-relaxed mb-12 max-w-2xl mx-auto">
            SuvrenHOA puts your community's votes, finances, and documents on the blockchain — permanently transparent, mathematically tamper-proof.
          </p>

          {/* Countdown
              V13 Lux fix: (1) font-bold → font-normal on Playfair digit cells
              (Rule 3 — never bold a serif heading); (2) hardcoded #4A4A52 label
              color replaced with parchment @ 40% to match the /about eyebrow
              tokens; (3) colon separators deleted entirely — luxury countdowns
              on Aesop, Aman, and Bottega don't use them, and the previous
              rgb(42,42,46) colons were invisible anyway; (4) single container
              aria-label reads the remaining time so screen readers don't
              announce four separate digit groups. */}
          {!launched ? (
            <div className="mb-12">
              <p className="text-[11px] text-[rgba(245,240,232,0.40)] uppercase tracking-[0.12em] mb-6">Launching in</p>
              <div
                className="flex items-center justify-center gap-3 sm:gap-5"
                role="timer"
                aria-label={`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds until launch`}
              >
                {[
                  { value: days, label: 'Days' },
                  { value: hours, label: 'Hours' },
                  { value: minutes, label: 'Minutes' },
                  { value: seconds, label: 'Seconds' },
                ].map((unit) => (
                  <div
                    key={unit.label}
                    className="bg-[rgb(21,21,24)] rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.20),0_1px_2px_0_rgba(0,0,0,0.30)] px-4 sm:px-6 py-3 sm:py-4 min-w-[64px] sm:min-w-[80px] text-center"
                    aria-hidden="true"
                  >
                    <div className="font-playfair text-3xl sm:text-4xl font-normal text-[#B09B71] tabular-nums">
                      {String(unit.value).padStart(2, '0')}
                    </div>
                    <div className="text-[11px] text-[rgba(245,240,232,0.40)] mt-1 uppercase tracking-[0.12em]">{unit.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-6 py-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-lg">We've launched!</span>
              </div>
            </div>
          )}

          {/* Email signup */}
          {signupState === 'success' ? (
            <div className="max-w-md mx-auto bg-[#141416] border border-[rgba(176,155,113,0.3)] rounded-xl px-6 py-5 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#B09B71] mx-auto mb-3" />
              <p className="text-[#E8E4DC] font-semibold mb-1">You're on the list.</p>
              <p className="text-sm text-[#8A8070]">We'll email you the moment we launch. No spam, ever.</p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  ref={emailRef}
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1 bg-[#141416] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] placeholder-[rgba(245,240,232,0.40)] focus:outline-none focus:border-[#B09B71] transition-colors text-sm"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-[#141416] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] placeholder-[rgba(245,240,232,0.40)] focus:outline-none focus:border-[#B09B71] transition-colors"
                />
                <button
                  type="submit"
                  disabled={signupState === 'submitting'}
                  className="bg-[#B09B71] text-[#0C0C0E] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#C4B080] transition-colors disabled:opacity-60 flex-shrink-0 flex items-center gap-2"
                >
                  {signupState === 'submitting' ? (
                    <div className="w-4 h-4 border-2 border-[rgba(12,12,14,0.3)] border-t-[#0C0C0E] rounded-full animate-spin" />
                  ) : (
                    <>Notify Me <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
              {signupState === 'error' && (
                <p className="text-red-400 text-xs mt-2">{errorMsg}</p>
              )}
            </form>
          )}

          {signupCount !== null && signupCount > 0 && (
            <p className="text-sm text-[rgba(245,240,232,0.40)] mt-4">
              <span className="text-[#8A8070] font-medium">{signupCount.toLocaleString()}</span> people already signed up
            </p>
          )}
        </div>
      </section>

      {/* Stats — V13 Lux fix: font-bold removed from Playfair per Rule 3. */}
      <section className="py-12 px-4 border-b border-[var(--divider)]">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="font-playfair text-3xl font-normal text-[#B09B71]">{s.value}</p>
              <p className="text-xs text-[#8A8070] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-16 px-4 border-b border-[var(--divider)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-playfair text-3xl font-normal text-[#E8E4DC] text-center mb-8">Built for Trust</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES_HIGHLIGHT.map(f => (
              <div key={f.text} className="flex items-center gap-3 bg-[rgb(21,21,24)] rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.20),0_1px_2px_0_rgba(0,0,0,0.30)] px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-[rgba(176,155,113,0.1)] flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-[#B09B71]" />
                </div>
                <p className="text-sm text-[#C4BAA8] font-medium">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Share + PH */}
      <section className="py-16 px-4 border-b border-[var(--divider)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-playfair text-3xl font-normal text-[#E8E4DC] mb-4">Help Us Launch</h2>
          <p className="text-[#8A8070] mb-8">If you know someone dealing with HOA drama, share this. It helps more than you know.</p>
          {/* V13 Lux fix: unified share buttons on a single parchment/brass surface
              — removed #1DA1F2 Twitter blue, #0A66C2 LinkedIn blue, and #F68341 PH
              orange (all off-palette). The 𝕏 mathematical glyph was replaced with
              a proper Lucide Share2 icon. The "PH badge coming" placeholder was
              deleted — it will be re-added as a real PH embed when the listing
              goes live, not as TODO copy in production. */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-[rgba(176,155,113,0.06)] border border-[rgba(176,155,113,0.24)] text-[rgba(245,240,232,0.72)] rounded-lg text-sm font-medium hover:bg-[rgba(176,155,113,0.12)] hover:text-[#F5F0E8] transition-colors"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              Share on X
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-[rgba(176,155,113,0.06)] border border-[rgba(176,155,113,0.24)] text-[rgba(245,240,232,0.72)] rounded-lg text-sm font-medium hover:bg-[rgba(176,155,113,0.12)] hover:text-[#F5F0E8] transition-colors"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Share on LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-playfair text-3xl font-normal text-[#E8E4DC] mb-4">Don't Wait for Launch</h2>
          <p className="text-[#8A8070] mb-8">Apply for the Founding Community Program and lock in 20% off forever.</p>
          <Link
            href="/founding"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#B09B71] to-[#8A7A55] text-[#0C0C0E] font-bold px-8 py-4 rounded-xl hover:from-[#C4B080] hover:to-[#9A8A65] transition-all"
          >
            Apply for Founding Status <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-[rgba(245,240,232,0.40)] mt-3">50 spots · No credit card</p>
        </div>
      </section>
    </div>
  );
}
