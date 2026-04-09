import Link from 'next/link';
import {
  Shield, DollarSign, Vote, FileText, ArrowRight,
  Lock, Eye, Users, Fingerprint, Database, Scale,
  Heart, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'About',
  description: 'SuvrenHOA brings blockchain-powered transparency to HOA governance. Learn our story, mission, and the team behind the platform.',
  path: '/about',
});

const PILLARS = [
  {
    icon: Database,
    title: 'Immutable Records',
    desc: 'Every action, transaction, and decision is permanently recorded on-chain. Once written, records cannot be altered, deleted, or tampered with by anyone — including us.',
  },
  {
    icon: DollarSign,
    title: 'Transparent Treasury',
    desc: 'Every dollar in, every dollar out — visible to every resident in real time. Smart contracts enforce spending rules so funds can never be moved without proper authorization.',
  },
  {
    icon: Vote,
    title: 'Verifiable Voting',
    desc: 'Cryptographically sealed ballots with mathematically provable results. No one can stuff a ballot box, discard votes, or miscount results. The math does the counting.',
  },
  {
    icon: FileText,
    title: 'Permanent Documents',
    desc: 'CC&Rs, meeting minutes, financial statements — stored on a permanent network for 200+ years. No more lost files, deleted drives, or documents that conveniently disappear.',
  },
];

const VALUES = [
  {
    icon: Eye,
    title: 'Radical Transparency',
    desc: 'Every financial transaction, every vote, every governance action is visible to every community member. Not because we chose to share it — because the architecture makes hiding it impossible.',
  },
  {
    icon: Fingerprint,
    title: 'Mathematical Truth',
    desc: 'We replaced trust with cryptographic proof. Election results aren\'t certified by a committee — they\'re verified by mathematics. Treasury balances aren\'t reported by a treasurer — they\'re calculated by immutable code.',
  },
  {
    icon: Heart,
    title: 'Community First',
    desc: 'Technology serves people, not the other way around. Every feature we build starts with the question: does this make life better for residents? If the answer isn\'t an obvious yes, we don\'t build it.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero Trust Architecture',
    desc: 'We designed SuvrenHOA so you never have to trust us — or anyone else. The system enforces the rules. We can\'t move your money, change your votes, or alter your documents. That\'s not a policy. It\'s physics.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--parchment)]">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(176,155,113,0.45) 0%, rgba(42,93,79,0.2) 40%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-28 md:py-40 text-center page-enter">
          <p
            className="text-[13px] uppercase tracking-[0.2em] text-[#B09B71] font-medium mb-8"
          >
            Our Mission
          </p>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-8 leading-[1.08] gradient-text"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Governance Your Community Can Trust
          </h1>
          <p className="text-lg sm:text-xl text-[rgba(245,240,232,0.55)] max-w-2xl mx-auto leading-relaxed page-enter-delay-1">
            SuvrenHOA is building the infrastructure for accountable community governance.
            We use blockchain technology to make fraud impossible, transparency automatic,
            and trust unnecessary.
          </p>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 page-enter">
            <div className="inline-flex items-center gap-2 mb-6">
              <AlertTriangle className="w-4 h-4 text-[#6B3A3A]" />
              <span className="text-[13px] uppercase tracking-[0.15em] text-[#6B3A3A] font-medium">
                The Problem
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-medium gradient-text mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              The HOA Trust Crisis
            </h2>
            <p className="text-[rgba(245,240,232,0.45)] max-w-2xl mx-auto text-lg leading-relaxed">
              Hundreds of billions of dollars flow through HOAs every year with virtually
              zero independent oversight and no tamper-proof record-keeping.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 page-enter-delay-1">
            {[
              {
                stat: '$100B+',
                label: 'Collected in HOA dues annually',
                detail: 'More than the GDP of most countries — managed with spreadsheets and filing cabinets.',
              },
              {
                stat: '$100M+',
                label: 'Embezzled from HOA funds',
                detail: 'Documented fraud cases represent only a fraction of the real number. Most go undetected.',
              },
              {
                stat: '370K+',
                label: 'HOAs with zero tamper-proof governance',
                detail: 'Not a single HOA in America uses verifiable, immutable record-keeping. Until now.',
              },
            ].map(({ stat, label, detail }) => (
              <div
                key={stat}
                className="rounded-xl p-8 text-center"
                style={{
                  background: 'rgba(245,240,232,0.02)',
                  border: '1px solid rgba(245,240,232,0.06)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <p className="text-4xl sm:text-5xl font-medium text-[#B09B71] mb-3">{stat}</p>
                <p className="text-[15px] font-medium text-[var(--parchment)] mb-3">{label}</p>
                <p className="text-[13px] text-[rgba(245,240,232,0.40)] leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE SOLUTION ─────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 page-enter">
            <div className="inline-flex items-center gap-2 mb-6">
              <Shield className="w-4 h-4 text-[#2A5D4F]" />
              <span className="text-[13px] uppercase tracking-[0.15em] text-[#2A5D4F] font-medium">
                The Solution
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-medium gradient-text mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Trust the System, Not the People
            </h2>
            <p className="text-[rgba(245,240,232,0.45)] max-w-2xl mx-auto text-lg leading-relaxed">
              SuvrenHOA replaces blind trust with cryptographic proof.
              Four pillars. One unbreakable foundation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 page-enter-delay-1">
            {PILLARS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-7 hover-lift"
                style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(176,155,113,0.08)', border: '1px solid rgba(176,155,113,0.12)' }}
                >
                  <Icon className="w-6 h-6 text-[#B09B71]" />
                </div>
                <h3
                  className="text-lg font-medium text-[var(--parchment)] mb-3"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {title}
                </h3>
                <p className="text-[14px] text-[rgba(245,240,232,0.45)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR STORY ────────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-3xl mx-auto page-enter">
            <p className="text-[13px] uppercase tracking-[0.15em] text-[#B09B71] font-medium mb-6">
              Our Story
            </p>
            <h2
              className="text-3xl sm:text-4xl font-medium gradient-text mb-10"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Born from Frustration.<br />Built with Purpose.
            </h2>

            <div className="space-y-6 text-[rgba(245,240,232,0.55)] text-[16px] leading-[1.8] page-enter-delay-1">
              <p>
                SuvrenHOA was born from frustration. After watching HOA boards in his own
                community operate with zero accountability — missing financial records,
                unverifiable elections, documents that appeared and disappeared at the
                board&apos;s convenience — founder Ryan Shanahan decided to build what should
                have existed all along.
              </p>
              <p>
                The breaking point came during a contentious board election. Ballots were
                collected behind closed doors, counted by the incumbents themselves, and the
                results announced with no audit trail. When residents asked questions, they
                were told to trust the process. There was no process to trust.
              </p>
              <p>
                As a veteran developer with over three decades of experience, Ryan recognized
                that the technology to solve this problem already existed. Blockchain
                networks could provide the immutable record-keeping that HOA governance
                desperately needed. Smart contracts could enforce financial transparency
                automatically. Cryptographic voting could make election fraud mathematically
                impossible.
              </p>
              <p>
                The challenge was making it accessible. Most HOA board members and residents
                have zero interest in cryptocurrency or distributed systems — and they
                shouldn&apos;t need to. So SuvrenHOA was designed from day one to be invisible
                infrastructure. All the power of blockchain governance, wrapped in an
                interface as simple as checking your email.
              </p>
            </div>

            {/* Pull-quote */}
            <figure className="mt-16 mb-4 relative page-enter-delay-2">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[rgba(176,155,113,0.45)] to-transparent" aria-hidden="true" />
              <blockquote
                className="pl-10 pr-4 italic text-[22px] sm:text-[26px] leading-[1.55] text-[rgba(245,240,232,0.78)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Fraud isn&apos;t prevented by policy — it&apos;s prevented by physics.
                Transparency isn&apos;t a promise — it&apos;s an architectural guarantee.
                Trust isn&apos;t required — because the math speaks for itself.
              </blockquote>
              <figcaption className="pl-10 mt-5 text-[11px] uppercase tracking-[0.2em] text-[rgba(176,155,113,0.60)] font-medium not-italic">
                — Ryan Shanahan, Founder
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 page-enter">
            <h2
              className="text-3xl sm:text-4xl font-medium gradient-text mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              The Team
            </h2>
            <p className="text-[rgba(245,240,232,0.45)] max-w-xl mx-auto">
              Built from the ground up by someone who lives the problem every day.
            </p>
          </div>

          <div className="max-w-md mx-auto page-enter-delay-1">
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}
            >
              {/* Avatar */}
              <div
                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-medium"
                style={{
                  background: 'linear-gradient(135deg, #B09B71 0%, #8A7A5A 100%)',
                  color: '#0C0C0E',
                  boxShadow: '0 0 40px rgba(176,155,113,0.2)',
                }}
              >
                RS
              </div>
              <h3
                className="text-xl font-medium text-[var(--parchment)] mb-1"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Ryan Shanahan
              </h3>
              <p className="text-[14px] text-[#B09B71] font-medium mb-4">Founder &amp; CEO</p>
              <p className="text-[14px] text-[rgba(245,240,232,0.45)] leading-relaxed">
                30+ year veteran developer based in Raleigh, NC. Built SuvrenHOA from the
                ground up — architecture, smart contracts, frontend, infrastructure — because
                no one else was going to fix HOA governance. So he did.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 page-enter">
            <h2
              className="text-3xl sm:text-4xl font-medium gradient-text mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              What We Believe
            </h2>
            <p className="text-[rgba(245,240,232,0.45)] max-w-xl mx-auto">
              The principles that guide every line of code and every product decision.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 page-enter-delay-2">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-7 flex items-start gap-5"
                style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(42,93,79,0.1)', border: '1px solid rgba(42,93,79,0.15)' }}
                >
                  <Icon className="w-5 h-5 text-[#2A5D4F]" />
                </div>
                <div>
                  <h3
                    className="font-medium text-[var(--parchment)] mb-2"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {title}
                  </h3>
                  <p className="text-[13px] text-[rgba(245,240,232,0.45)] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div
            className="rounded-xl p-12 sm:p-16 text-center relative overflow-hidden page-enter-delay-3"
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
                className="text-3xl sm:text-4xl font-medium text-[var(--parchment)] mb-5"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Ready to bring real transparency<br />to your HOA?
              </h2>
              <p className="text-[rgba(245,240,232,0.50)] max-w-lg mx-auto mb-10 leading-relaxed">
                Join the founding communities building the future of accountable
                governance. 60 days free. No credit card. No blockchain knowledge required.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-base transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #B09B71 0%, #8A7A5A 100%)',
                  color: '#0C0C0E',
                  boxShadow: '0 0 32px rgba(176,155,113,0.3)',
                }}
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
