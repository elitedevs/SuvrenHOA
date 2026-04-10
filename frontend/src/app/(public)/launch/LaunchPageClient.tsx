'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Users,
  Building2, Vote, FileText, ExternalLink,
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
          {/* PH Badge placeholder */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[rgba(246,131,65,0.013)] border border-[rgba(246,131,65,0.3)] rounded-lg px-4 py-2 text-sm">
              <span className="text-[#F68341] font-bold text-base">🐱</span>
              <span className="text-[#F68341] font-semibold">Product Hunt</span>
              <span className="text-[#8A8070]">— launching soon</span>
            </div>
          </div>

          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-[#E8E4DC] mb-6 leading-tight">
            HOA Governance,<br />
            <span className="text-[#B09B71]">Finally Honest.</span>
          </h1>
          <p className="text-xl text-[#C4BAA8] leading-relaxed mb-12 max-w-2xl mx-auto">
            SuvrenHOA puts your community's votes, finances, and documents on the blockchain — permanently transparent, mathematically tamper-proof.
          </p>

          {/* Countdown */}
          {!launched ? (
            <div className="mb-12">
              <p className="text-xs font-semibold text-[#4A4A52] uppercase tracking-widest mb-6">Launching in</p>
              <div className="flex items-center justify-center gap-3 sm:gap-6">
                {[
                  { value: days, label: 'Days' },
                  { value: hours, label: 'Hours' },
                  { value: minutes, label: 'Minutes' },
                  { value: seconds, label: 'Seconds' },
                ].map((unit, i) => (
                  <div key={unit.label}>
                    <div className="bg-[rgb(21,21,24)] rounded-xl shadow-[0_2px_8px_0_rgba(0,0,0,0.20),0_1px_2px_0_rgba(0,0,0,0.30)] px-4 sm:px-6 py-3 sm:py-4 min-w-[64px] sm:min-w-[80px] text-center">
                      <div className="font-playfair text-3xl sm:text-4xl font-bold text-[#B09B71] tabular-nums">
                        {String(unit.value).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-[#4A4A52] mt-1 font-medium">{unit.label}</div>
                    </div>
                    {i < 3 && <span className="text-2xl text-[#2A2A2E] font-bold mx-0.5 sm:mx-1">:</span>}
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
                  className="flex-1 bg-[#141416] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] placeholder-[#4A4A52] focus:outline-none focus:border-[#B09B71] transition-colors text-sm"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-[#141416] border border-[#2A2A2E] rounded-lg px-4 py-2.5 text-[#E8E4DC] placeholder-[#4A4A52] focus:outline-none focus:border-[#B09B71] transition-colors"
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
            <p className="text-sm text-[#4A4A52] mt-4">
              <span className="text-[#8A8070] font-medium">{signupCount.toLocaleString()}</span> people already signed up
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-b border-[var(--divider)]">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="font-playfair text-3xl font-bold text-[#B09B71]">{s.value}</p>
              <p className="text-xs text-[#8A8070] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-16 px-4 border-b border-[var(--divider)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC] text-center mb-8">Built for Trust</h2>
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
          <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC] mb-4">Help Us Launch</h2>
          <p className="text-[#8A8070] mb-8">If you know someone dealing with HOA drama, share this. It helps more than you know.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-[rgba(29,161,242,0.1)] border border-[rgba(29,161,242,0.3)] text-[#1DA1F2] rounded-lg text-sm font-medium hover:bg-[rgba(29,161,242,0.2)] transition-colors"
            >
              <span className="text-sm font-bold">𝕏</span>
              Share on X
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-[rgba(10,102,194,0.1)] border border-[rgba(10,102,194,0.3)] text-[#0A66C2] rounded-lg text-sm font-medium hover:bg-[rgba(10,102,194,0.2)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Share on LinkedIn
            </a>
            {/* PH badge placeholder — replace with real embed when live */}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-[rgba(246,131,65,0.1)] border border-[rgba(246,131,65,0.3)] text-[#F68341] rounded-lg text-sm font-medium">
              <ExternalLink className="w-4 h-4" />
              PH badge coming
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-playfair text-2xl font-bold text-[#E8E4DC] mb-4">Don't Wait for Launch</h2>
          <p className="text-[#8A8070] mb-8">Apply for the Founding Community Program and lock in 20% off forever.</p>
          <Link
            href="/founding"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#B09B71] to-[#8A7A55] text-[#0C0C0E] font-bold px-8 py-4 rounded-xl hover:from-[#C4B080] hover:to-[#9A8A65] transition-all"
          >
            Apply for Founding Status <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-[#4A4A52] mt-3">50 spots · No credit card</p>
        </div>
      </section>
    </div>
  );
}
