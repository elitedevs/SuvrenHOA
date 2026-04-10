import Link from 'next/link';
import { Shield, Lock, Eye, Database, Mail, Clock } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Privacy Policy',
  description:
    'How SuvrenHOA collects, uses, stores, and protects the information of homeowners, board members, and community residents.',
  path: '/privacy',
});

// V11 fix: /privacy returned 404 during the V10 audit. This page gives the
// route a real landing surface with the marketing chrome (via (public) layout)
// and matches the luxury register of /about and /security — serif H1,
// tight tracking, thin brass rules, generous vertical rhythm.

const LAST_UPDATED = 'April 9, 2026';
const EFFECTIVE = 'April 9, 2026';

const PRINCIPLES = [
  {
    icon: Shield,
    title: 'Minimum viable data',
    desc: 'We collect only what the platform needs to function — wallet address, property token, email if you choose to provide one. Nothing more, ever.',
  },
  {
    icon: Lock,
    title: 'No surveillance tracking',
    desc: 'SuvrenHOA does not run ad-tech trackers, session replay, or third-party behavioral analytics. Your movements through the app are not for sale.',
  },
  {
    icon: Eye,
    title: 'On-chain transparency by design',
    desc: 'Governance actions — votes, payments, proposals — are recorded on Base for auditability. That is a feature of the system, not a privacy cost.',
  },
  {
    icon: Database,
    title: 'Documents stored permanently',
    desc: 'HOA documents are stored on Arweave for long-term accessibility. Anything you upload is intentional and community-visible.',
  },
];

const SECTIONS = [
  {
    title: 'Information we collect',
    body: [
      'Wallet address. When you connect a wallet to SuvrenHOA, we read your public address from your wallet provider. We never receive, store, or have access to your private keys or seed phrase.',
      'Property ownership data. If your wallet holds a SuvrenHOA PropertyNFT, the token ID and associated on-chain metadata are visible to the platform and to your community. This is how voting rights and dues status are computed.',
      'Optional profile information. You may choose to associate an email address, display name, or mailing address with your account for notifications and communications. Providing this information is optional.',
      'Operational logs. Like any modern web application, our infrastructure records minimal technical data (timestamps, IP addresses, user-agent strings) for a short period to protect the service from abuse and diagnose errors.',
    ],
  },
  {
    title: 'How we use information',
    body: [
      'To operate the platform — verify property ownership, display dues status, route messages to the correct community, and render your personalized dashboard.',
      'To communicate with you — send transactional emails about dues, votes, and governance actions you have opted into. We do not send marketing email to residents without explicit consent.',
      'To secure the service — detect abuse, prevent fraud, and maintain the integrity of governance actions.',
      'To improve the product — in aggregate, de-identified form only. We do not build individual behavioral profiles.',
    ],
  },
  {
    title: 'Information we do not collect',
    body: [
      'We do not collect private keys, seed phrases, or wallet passwords. Ever. SuvrenHOA cannot access your funds.',
      'We do not collect biometric data, precise geolocation, or device fingerprints for advertising purposes.',
      'We do not knowingly collect information from children under the age of 16. If you believe a minor has provided information to us, please contact privacy@suvren.hoa and we will remove it.',
    ],
  },
  {
    title: 'How we share information',
    body: [
      'With your community. Your property token, voting history on public proposals, and dues status are visible to other members of your HOA. This is the governance model you opt into when a property joins a SuvrenHOA community.',
      'On the blockchain. Governance actions are written to the Base network by design. Once recorded, they are public and permanent — this is how the system earns trust.',
      'With service providers. We use a small number of infrastructure providers (hosting, email delivery, error monitoring) under contracts that require them to protect your information and use it only for the service they provide to us.',
      'For legal reasons. We may disclose information when required to comply with a valid legal process, protect our rights, or prevent harm.',
      'We do not sell your information. We do not rent your information. We do not trade your information for services from third parties.',
    ],
  },
  {
    title: 'Your choices and rights',
    body: [
      'Access and correction. You may request a copy of the personal information we hold about you and ask us to correct anything that is inaccurate.',
      'Deletion. You may request deletion of your off-chain profile data at any time. Note that on-chain governance records (votes, payments, proposals) cannot be deleted — this is a property of the blockchain, not a choice we make.',
      'Communications. You may unsubscribe from non-essential emails via the link in any message. Critical governance notifications cannot be disabled while you are an active community member.',
      'Depending on your jurisdiction, you may have additional rights under GDPR, CCPA, or similar laws. Contact privacy@suvren.hoa to exercise them.',
    ],
  },
  {
    title: 'Data retention',
    body: [
      'We retain off-chain account information for as long as your account is active, and for a reasonable period afterward to comply with legal obligations and resolve disputes.',
      'On-chain records, by nature, are permanent. Do not publish anything to a blockchain-backed surface that you would not be comfortable having recorded indefinitely.',
      'Operational logs are retained for up to 90 days.',
    ],
  },
  {
    title: 'Security',
    body: [
      'We employ industry-standard encryption in transit (TLS 1.3) and at rest, strict access controls on operational systems, and audited smart contracts for on-chain logic.',
      'No system is perfectly secure. If you believe your account has been compromised, contact security@suvren.hoa immediately.',
    ],
  },
  {
    title: 'International users',
    body: [
      'SuvrenHOA is operated from the United States. If you access the platform from outside the U.S., your information will be transferred to and processed in the U.S., which may have different data protection laws than your jurisdiction.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'We may update this policy from time to time. Material changes will be announced via in-app notification and email. Continued use of the platform after a change constitutes acceptance of the updated policy.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen text-[var(--parchment)]">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-10">
          <div
            className="w-16 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(176,155,113,0.6), transparent)',
            }}
          />
          <span
            className="text-[11px] tracking-[0.3em] uppercase"
            style={{ color: 'rgba(176,155,113,0.6)' }}
          >
            Legal
          </span>
          <div
            className="w-16 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(176,155,113,0.6), transparent)',
            }}
          />
        </div>

        <h1
          className="mb-6"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 400,
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'var(--text-heading)',
          }}
        >
          Privacy Policy
        </h1>

        <p
          className="italic mb-8"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.125rem',
            lineHeight: 1.6,
            color: 'rgba(245,240,232,0.7)',
            letterSpacing: '0.005em',
          }}
        >
          Your community&rsquo;s records belong to your community. This page
          explains, in plain language, what we collect, what we don&rsquo;t, and
          how we treat the information you entrust to us.
        </p>

        <div
          className="flex flex-wrap gap-x-8 gap-y-2 text-[12px]"
          style={{ color: 'var(--text-disabled)' }}
        >
          <span className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Last updated {LAST_UPDATED}
          </span>
          <span>Effective {EFFECTIVE}</span>
        </div>
      </section>

      {/* Principles */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRINCIPLES.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="p-7"
                style={{
                  background: 'rgb(21,21,24)',
                  borderRadius: '8px',
                }}
              >
                <div
                  className="mb-4 inline-flex items-center justify-center w-10 h-10"
                  style={{
                    background: 'rgba(176,155,113,0.12)',
                    borderRadius: '6px',
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: 'rgb(176,155,113)' }}
                  />
                </div>
                <h3
                  className="mb-2 text-lg"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 500,
                    color: 'var(--text-heading)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {p.title}
                </h3>
                <p
                  className="text-sm"
                  style={{
                    color: 'rgba(245,240,232,0.7)',
                    lineHeight: 1.65,
                  }}
                >
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Thin brass rule */}
      <div className="max-w-3xl mx-auto px-6">
        <div
          className="h-px w-full"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(176,155,113,0.35), transparent)',
          }}
        />
      </div>

      {/* Sections */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="space-y-14">
          {SECTIONS.map((section, idx) => (
            <div key={section.title} className="legal-section">
              <div
                className="mb-6 flex items-baseline gap-4"
                style={{ color: 'rgba(176,155,113,0.5)' }}
              >
                <span
                  className="text-[11px] tracking-[0.25em] uppercase"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: 'rgba(176,155,113,0.15)' }}
                />
              </div>
              <h2
                className="mb-5"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 400,
                  fontSize: '1.75rem',
                  lineHeight: 1.2,
                  letterSpacing: '-0.015em',
                  color: 'var(--text-heading)',
                }}
              >
                {section.title}
              </h2>
              <div className="space-y-4 legal-body">
                {section.body.map((para, i) => (
                  <p
                    key={i}
                    className="text-[15px]"
                    style={{
                      color: 'rgba(245,240,232,0.72)',
                      lineHeight: 1.75,
                    }}
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact card */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div
          className="p-10 text-center"
          style={{
            background: 'rgb(21,21,24)',
            borderRadius: '8px',
          }}
        >
          <Mail
            className="w-6 h-6 mx-auto mb-5"
            style={{ color: 'rgb(176,155,113)' }}
          />
          <h2
            className="mb-3"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 400,
              fontSize: '1.5rem',
              color: 'var(--text-heading)',
              letterSpacing: '-0.01em',
            }}
          >
            Questions about your privacy?
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: 'rgba(245,240,232,0.65)', lineHeight: 1.6 }}
          >
            Reach out and a member of our team will respond within two business
            days.
          </p>
          <a
            href="mailto:privacy@suvren.hoa"
            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium transition-all"
            style={{
              background: 'rgb(176,155,113)',
              color: 'rgb(12,12,14)',
              borderRadius: '8px',
              letterSpacing: '0.01em',
            }}
          >
            privacy@suvren.hoa
          </a>
          <div
            className="mt-8 pt-6 text-[11px] tracking-[0.1em]"
            style={{
              color: 'var(--text-disabled)',
              borderTop: '1px solid rgba(245,240,232,0.05)',
            }}
          >
            Also see our{' '}
            <Link
              href="/terms"
              className="underline underline-offset-4"
              style={{ color: 'rgba(176,155,113,0.85)' }}
            >
              Terms of Service
            </Link>
            {' · '}
            <Link
              href="/security"
              className="underline underline-offset-4"
              style={{ color: 'rgba(176,155,113,0.85)' }}
            >
              Security practices
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
