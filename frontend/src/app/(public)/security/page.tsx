import Link from 'next/link';
import {
  Shield, Lock, Vote, FileText, Link2, Eye, Server,
  ArrowRight, ChevronRight, Layers, Clock, Users,
  Fingerprint, Code2, Network, HardDrive, CheckCircle2,
} from 'lucide-react';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Security',
  description: 'Your HOA\'s finances are secured by the same technology that protects billions of dollars. Learn how SuvrenHOA keeps your records immutable and your treasury safe.',
  path: '/security',
});

const FEATURES = [
  {
    icon: Lock,
    title: 'Immutable Records',
    subtitle: 'Once a record is created, it cannot be changed — by anyone.',
    desc: 'Every vote, payment, and document is stored across thousands of independent computers simultaneously. To alter a single record, you\'d need to simultaneously change it on every computer in the network — a mathematical impossibility. This is the same technology banks and governments rely on to protect their most sensitive data.',
  },
  {
    icon: Vote,
    title: 'Transparent Voting',
    subtitle: 'Every vote is permanently recorded the moment it\'s cast.',
    desc: 'Each property in your community is represented by a unique digital deed (PropertyNFT) that grants voting rights. Only verified property owners can vote, each property gets exactly one vote, and every ballot is recorded permanently. No one — not the board, not us — can change the outcome after the fact.',
  },
  {
    icon: Shield,
    title: 'Protected Treasury',
    subtitle: 'The smart contract enforces the rules — not people.',
    desc: 'Moving community funds requires multiple authorized signatures, and every transaction has a mandatory waiting period before it executes. This means no single person can move money unilaterally, and the community always has time to review pending transactions. The rules are enforced by code, not trust.',
  },
  {
    icon: HardDrive,
    title: 'Permanent Documents',
    subtitle: 'Stored for 200+ years. Can\'t be deleted, lost, or altered.',
    desc: 'Your CC&Rs, meeting minutes, and financial records are stored on Arweave — a permanent storage network designed to preserve data for centuries. Even if SuvrenHOA ceased to exist tomorrow, every document your community has ever uploaded would remain accessible and verifiable. Forever.',
  },
];

const BLOCKCHAIN_STEPS = [
  {
    num: '01',
    icon: FileText,
    title: 'Transaction Created',
    desc: 'A homeowner casts a vote, the board approves a payment, or a document is uploaded to the community.',
  },
  {
    num: '02',
    icon: Network,
    title: 'Network Verification',
    desc: 'Thousands of independent computers around the world verify the transaction is legitimate and follows the rules.',
  },
  {
    num: '03',
    icon: Link2,
    title: 'Permanently Linked',
    desc: 'The verified record is cryptographically linked to every previous record, forming an unbreakable chain of history.',
  },
  {
    num: '04',
    icon: Layers,
    title: 'Tamper-Proof',
    desc: 'Changing one record would require changing every subsequent record on every computer in the network — a mathematical impossibility.',
  },
];

const CONTRACTS = [
  {
    icon: Fingerprint,
    name: 'PropertyNFT',
    role: 'Digital Property Deed',
    desc: 'Each property is represented as a unique, non-transferable digital deed. This deed grants governance rights — one property, one vote. Ownership is verified on-chain, eliminating disputes about who can participate.',
  },
  {
    icon: Vote,
    name: 'Governor Contract',
    role: 'Proposal & Voting Engine',
    desc: 'Manages the full lifecycle of community proposals — from submission through voting to execution. Enforces quorum requirements, voting periods, and tallying with zero human intervention.',
  },
  {
    icon: Shield,
    name: 'Treasury',
    role: 'Multi-Signature Wallet',
    desc: 'Community funds are held in a multi-signature wallet requiring multiple authorized signers. No single board member can move funds unilaterally. Every transaction is publicly visible.',
  },
  {
    icon: Clock,
    name: 'TimelockController',
    role: 'Mandatory Waiting Periods',
    desc: 'Enforces a delay between when a transaction is approved and when it executes. This gives the community time to review and, if necessary, challenge any pending action before it takes effect.',
  },
];

const GUARANTEES = [
  { icon: Server, title: 'No single point of failure', desc: 'Data exists across thousands of computers worldwide.' },
  { icon: Lock, title: 'No admin backdoor', desc: 'Not even SuvrenHOA can alter your records.' },
  { icon: Shield, title: 'No social engineering', desc: 'No phone call or email can trick the system into moving funds.' },
  { icon: Eye, title: 'Independent audit trail', desc: 'Every action is permanently logged and publicly verifiable.' },
  { icon: Code2, title: 'Open-source contracts', desc: 'Our smart contracts are public — anyone can inspect the code.' },
  { icon: Network, title: 'Ethereum-grade security', desc: 'Built on Base L2, inheriting Ethereum\'s battle-tested security.' },
];

const FAQS = [
  {
    q: 'What if SuvrenHOA goes out of business?',
    a: 'Your records live on the blockchain and Arweave — networks that no single company controls. Even if SuvrenHOA ceased to exist, every vote, document, and financial record would remain permanently accessible. Your data doesn\'t depend on us.',
  },
  {
    q: 'What if someone hacks the blockchain?',
    a: 'The Ethereum network (which Base is built on) has secured hundreds of billions of dollars for nearly a decade without a single successful hack of the protocol itself. To compromise your records, an attacker would need to simultaneously control more than half of all computers in the network — a feat that would cost billions of dollars and has never been accomplished.',
  },
  {
    q: 'What if I lose my password?',
    a: 'SuvrenHOA uses familiar email-based authentication — you can always reset your password. Your community\'s records are stored on the blockchain independently of your personal account, so they\'re never at risk. We also support passkey authentication for passwordless, phishing-proof login.',
  },
  {
    q: 'What if the board doesn\'t want transparency?',
    a: 'That\'s precisely why the system is designed this way. Transparency isn\'t optional — it\'s built into the architecture. Every financial transaction, every vote, every document is permanently recorded whether the board likes it or not. The technology enforces accountability; it doesn\'t rely on good intentions.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--parchment)] page-enter">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(42,93,79,0.5) 0%, rgba(176,155,113,0.2) 40%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-36 text-center">
          {/* V15 Lux fix (circle discipline): parchment-ruled eyebrow in
              verdigris, replacing the rounded-full announcement pill. */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span aria-hidden="true" className="h-px w-16 bg-[rgba(42,93,79,0.35)]" />
            <span className="text-[10px] tracking-[0.28em] uppercase text-[rgba(42,93,79,1)] font-medium flex items-center gap-3">
              <Shield className="w-3 h-3" aria-hidden="true" />
              Security Architecture
            </span>
            <span aria-hidden="true" className="h-px w-16 bg-[rgba(42,93,79,0.35)]" />
          </div>

          {/* V12 fix (Lux V11 audit): explicit whitespace between line spans
              so textContent reads as a proper sentence. Prior JSX had each
              span touching the next <br /> with no space, producing
              "securedby the same technology thatprotects billions" for
              screen readers and SEO. */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mb-6 leading-[1.1]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <span className="gradient-text">Your HOA&apos;s finances are secured</span>{' '}
            <br />
            <span className="gradient-text">by the same technology that</span>{' '}
            <br />
            <span className="gradient-text">protects billions.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[rgba(245,240,232,0.55)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Blockchain is a shared, permanent record book that thousands of independent computers maintain simultaneously —
            making it virtually impossible for anyone to alter, delete, or fabricate your community&apos;s records.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/waitlist"
              className="px-8 py-4 rounded-xl font-medium text-base transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #B09B71 0%, #8A7A5A 100%)',
                color: '#0C0C0E',
                boxShadow: '0 0 32px rgba(176,155,113,0.3)',
              }}
            >
              Reserve Your Seat
              <ArrowRight className="inline-block w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/demo"
              className="px-6 py-4 rounded-xl font-medium text-base text-[rgba(245,240,232,0.6)] hover:text-[var(--parchment)] transition-colors"
              style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)' }}
            >
              Request a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHAT MAKES US DIFFERENT ──────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[13px] uppercase tracking-widest text-[#B09B71] font-medium mb-4">
              Enterprise-grade protection
            </p>
            <h2
              className="text-3xl sm:text-4xl font-medium gradient-text mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              What makes us different
            </h2>
            <p className="text-[rgba(245,240,232,0.45)] max-w-xl mx-auto">
              Not incremental improvements to broken systems — a fundamentally different architecture.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, subtitle, desc }) => (
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
                  className="text-xl font-medium text-[var(--parchment)] mb-1"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {title}
                </h3>
                <p className="text-[14px] text-[#B09B71] mb-3">{subtitle}</p>
                <p className="text-[13px] text-[rgba(245,240,232,0.45)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW BLOCKCHAIN WORKS ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[13px] uppercase tracking-widest text-[#B09B71] font-medium mb-4">
              The technology behind it
            </p>
            <h2
              className="text-3xl sm:text-4xl font-medium gradient-text mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              How blockchain works
            </h2>
            <p className="text-[rgba(245,240,232,0.45)] max-w-xl mx-auto">
              Four steps that make your records permanent and tamper-proof.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {BLOCKCHAIN_STEPS.map(({ num, icon: Icon, title, desc }, i) => (
              <div key={num} className="relative flex gap-6">
                {/* Vertical connector line */}
                {i < BLOCKCHAIN_STEPS.length - 1 && (
                  <div
                    className="absolute left-6 top-[4.5rem] w-px h-[calc(100%-3rem)]"
                    style={{ background: 'linear-gradient(to bottom, rgba(176,155,113,0.25), rgba(176,155,113,0.05))' }}
                  />
                )}

                <div className="shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10"
                    style={{ background: '#151518', border: '1px solid rgba(176,155,113,0.2)' }}
                  >
                    <Icon className="w-5 h-5 text-[#B09B71]" />
                  </div>
                </div>

                <div className="pb-10">
                  <p className="text-[11px] text-[#2A5D4F] font-medium tracking-wider mb-1">STEP {num}</p>
                  <h3 className="text-lg font-medium text-[var(--parchment)] mb-2">{title}</h3>
                  <p className="text-[13px] text-[rgba(245,240,232,0.45)] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SMART CONTRACT ARCHITECTURE ──────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[13px] uppercase tracking-widest text-[#B09B71] font-medium mb-4">
              On-chain architecture
            </p>
            <h2
              className="text-3xl sm:text-4xl font-medium gradient-text mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Smart contract architecture
            </h2>
            <p className="text-[rgba(245,240,232,0.45)] max-w-xl mx-auto">
              Four interconnected contracts that enforce your community&apos;s rules automatically.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {CONTRACTS.map(({ icon: Icon, name, role, desc }, i) => (
              <div key={name}>
                <div
                  className="rounded-xl p-6 hover-lift"
                  style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(42,93,79,0.1)', border: '1px solid rgba(42,93,79,0.15)' }}
                    >
                      <Icon className="w-5 h-5 text-[#2A5D4F]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-[var(--parchment)]">{name}</h3>
                        {/* V15 Lux fix (circle discipline): hairline keyline
                            role tag, no rounded-full. */}
                        <span
                          className="text-[10px] tracking-[0.14em] uppercase px-2 py-0.5 border"
                          style={{ borderColor: 'rgba(176,155,113,0.24)', color: '#B09B71' }}
                        >
                          {role}
                        </span>
                      </div>
                      <p className="text-[13px] text-[rgba(245,240,232,0.45)] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>

                {/* Connector */}
                {i < CONTRACTS.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4" style={{ background: 'rgba(176,155,113,0.2)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY GUARANTEES ──────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-medium gradient-text mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Security guarantees
            </h2>
            <p className="text-[rgba(245,240,232,0.45)] max-w-xl mx-auto">
              Promises enforced by mathematics, not policies.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GUARANTEES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-5 hover-lift"
                style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(42,93,79,0.1)' }}
                  >
                    <Icon className="w-4 h-4 text-[#2A5D4F]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--parchment)] text-[15px] mb-1">{title}</h3>
                    <p className="text-[12px] text-[rgba(245,240,232,0.45)] leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT IF FAQ ──────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(245,240,232,0.06)] py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-medium gradient-text mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              What if...
            </h2>
            <p className="text-[rgba(245,240,232,0.45)]">
              The questions every thoughtful board member should ask.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl overflow-hidden"
                style={{ background: '#151518', border: '1px solid rgba(245,240,232,0.06)' }}
              >
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none">
                  <span className="font-medium text-[var(--parchment)] text-[15px] pr-4">{q}</span>
                  <ChevronRight className="w-4 h-4 text-[rgba(245,240,232,0.3)] transition-transform group-open:rotate-90 shrink-0" />
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
              background: 'linear-gradient(135deg, rgba(42,93,79,0.10) 0%, rgba(176,155,113,0.08) 100%)',
              border: '1px solid rgba(176,155,113,0.2)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(42,93,79,0.15) 0%, transparent 60%)' }}
            />
            <div className="relative z-10">
              <CheckCircle2 className="w-10 h-10 text-[#2A5D4F] mx-auto mb-5" />
              <h2
                className="text-3xl sm:text-4xl font-medium text-[var(--parchment)] mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Ready for governance<br />you can verify?
              </h2>
              <p className="text-[rgba(245,240,232,0.50)] max-w-lg mx-auto mb-8">
                Every vote recorded. Every dollar tracked. Every document preserved.
                Governance backed by mathematics, not promises.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/waitlist"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-base transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #B09B71 0%, #8A7A5A 100%)',
                    color: '#0C0C0E',
                    boxShadow: '0 0 32px rgba(176,155,113,0.3)',
                  }}
                >
                  Reserve Your Seat
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-medium text-base text-[rgba(245,240,232,0.6)] hover:text-[var(--parchment)] transition-colors"
                  style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)' }}
                >
                  Request a Demo
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
