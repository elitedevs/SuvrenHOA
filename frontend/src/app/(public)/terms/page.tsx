import Link from 'next/link';
import { Scale, Gavel, AlertTriangle, Ban, Coins, FileSignature, Clock } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Terms of Service',
  description:
    'The terms under which SuvrenHOA provides its blockchain-powered HOA governance platform to communities, boards, and homeowners.',
  path: '/terms',
});

// V11 fix: /terms returned 404 during the V10 audit. Parity page with
// /privacy — same luxury register, marketing chrome, clear plain-language
// commitments. Designed to be read, not clicked past.

const LAST_UPDATED = 'April 9, 2026';
const EFFECTIVE = 'April 9, 2026';

const COMMITMENTS = [
  {
    icon: Scale,
    title: 'Governance tools, not governance authority',
    desc: 'SuvrenHOA provides software. The people who run your community are your community. We build the rails; you and your neighbors drive.',
  },
  {
    icon: FileSignature,
    title: 'You own your records',
    desc: 'Your community\'s documents, votes, and treasury history belong to your community. You can export them at any time, and on-chain records are yours forever.',
  },
  {
    icon: Ban,
    title: 'No hidden fees',
    desc: 'Our pricing is published. If it ever changes, you will be notified in advance and given the option to stop using the service without penalty.',
  },
  {
    icon: Coins,
    title: 'We do not touch your funds',
    desc: 'Community treasuries are governed by audited smart contracts. SuvrenHOA has no ability to move, freeze, or seize funds held in your community\'s treasury.',
  },
];

const SECTIONS = [
  {
    title: 'Acceptance of these terms',
    body: [
      'By creating an account, connecting a wallet, or otherwise using SuvrenHOA ("the Service"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, do not use the Service.',
      'If you are using the Service on behalf of a homeowners association, cooperative, condominium board, or similar organization, you represent that you have authority to bind that organization to these terms.',
    ],
  },
  {
    title: 'The Service',
    body: [
      'SuvrenHOA is a software platform that helps community associations manage governance, voting, treasury, documents, and member communications using blockchain technology for transparency and permanence.',
      'We provide the platform. We do not manage your community, enforce your rules, or make governance decisions on your behalf. Those responsibilities remain with your elected board and your members, subject to your community\'s governing documents and applicable law.',
      'Certain features of the Service interact with public blockchains — specifically Base, an Ethereum Layer 2 network. Transactions on these networks are permanent, public, and subject to network fees outside of our control.',
    ],
  },
  {
    title: 'Your account',
    body: [
      'You access SuvrenHOA by connecting a self-custodied wallet. You are responsible for the security of your wallet and private keys. We cannot recover lost keys, reverse transactions, or restore access to a wallet you no longer control.',
      'You agree to provide accurate information when prompted and to keep that information current. You are responsible for all activity that occurs under your account.',
      'If your wallet holds a PropertyNFT minted for your community, that token represents governance rights and responsibilities. Transferring the token transfers those rights.',
    ],
  },
  {
    title: 'Acceptable use',
    body: [
      'You may not use the Service to engage in fraud, harassment, or any activity that violates applicable law.',
      'You may not interfere with, disrupt, or attempt to gain unauthorized access to the Service, other users\' accounts, or the underlying infrastructure.',
      'You may not use the Service to transmit malware, conduct spam campaigns, or abuse community communication channels.',
      'You may not attempt to reverse-engineer, circumvent, or tamper with the smart contracts, authentication systems, or auditing mechanisms of the Service.',
      'Board members, community administrators, and users with elevated permissions agree to exercise those permissions in good faith and in accordance with their fiduciary duties and their community\'s governing documents.',
    ],
  },
  {
    title: 'Fees and payments',
    body: [
      'SuvrenHOA charges a subscription fee for access to the platform, published on our Pricing page. Fees are billed in advance and are non-refundable except as required by law.',
      'Community dues paid through the Service are paid in USDC on the Base network directly to your community\'s treasury smart contract. SuvrenHOA does not take custody of these funds and does not take a cut.',
      'Blockchain network fees (gas) are paid by the transacting party and are not controlled by SuvrenHOA.',
    ],
  },
  {
    title: 'On-chain permanence',
    body: [
      'Certain actions you take on SuvrenHOA — casting a vote, paying dues, uploading documents to permanent storage — are recorded on public blockchains or permanent storage networks.',
      'Once recorded, these actions cannot be deleted or modified. This is the feature that makes the Service trustworthy; it is also a responsibility you accept when you use the Service. Do not publish anything to an on-chain surface that you would not be comfortable having recorded indefinitely.',
    ],
  },
  {
    title: 'Intellectual property',
    body: [
      'SuvrenHOA, the SuvrenHOA name and logo, the platform software, and the underlying methodology are owned by Suvren LLC and protected by patent, trademark, and copyright law. We grant you a limited, non-exclusive, non-transferable license to use the Service as intended.',
      'You retain ownership of content you submit to the Service (documents, messages, proposals). By submitting content, you grant us a license to store, display, and transmit that content as necessary to provide the Service to you and your community.',
    ],
  },
  {
    title: 'Disclaimers',
    body: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
      'SuvrenHOA is not a law firm, accounting firm, or financial advisor. Nothing on the platform constitutes legal, tax, or investment advice. Consult qualified professionals for advice specific to your community.',
      'Blockchain networks and smart contracts, while audited, are an emerging technology and may contain unforeseen vulnerabilities. We strive to minimize risk through rigorous auditing, but we cannot eliminate it entirely.',
    ],
  },
  {
    title: 'Limitation of liability',
    body: [
      'TO THE MAXIMUM EXTENT PERMITTED BY LAW, SUVREN LLC, ITS OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.',
      'Our total liability for any claim arising out of or related to the Service is limited to the amount you paid to SuvrenHOA in the twelve (12) months preceding the event giving rise to the claim.',
    ],
  },
  {
    title: 'Indemnification',
    body: [
      'You agree to indemnify and hold harmless Suvren LLC from any claims, losses, or damages arising from your use of the Service, your violation of these terms, or your violation of any rights of another party.',
    ],
  },
  {
    title: 'Termination',
    body: [
      'You may stop using the Service at any time. Note that on-chain records created during your use will remain on the blockchain.',
      'We may suspend or terminate your access to the Service if you violate these terms, if required by law, or if continued provision of the Service to you would cause harm to other users or communities.',
    ],
  },
  {
    title: 'Governing law and disputes',
    body: [
      'These terms are governed by the laws of the State of North Carolina, United States, without regard to its conflict of laws principles.',
      'Any dispute arising out of or relating to these terms or the Service shall be resolved through binding arbitration in Wake County, North Carolina, under the rules of the American Arbitration Association, except that either party may seek injunctive relief in a court of competent jurisdiction to protect intellectual property rights.',
    ],
  },
  {
    title: 'Changes to these terms',
    body: [
      'We may update these terms from time to time. Material changes will be announced via in-app notification and email at least thirty (30) days before taking effect. Continued use of the Service after the effective date constitutes acceptance of the updated terms.',
    ],
  },
];

export default function TermsOfServicePage() {
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
          Terms of Service
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
          The rules of the road for using SuvrenHOA. Written in plain language
          because your community deserves to know what they&rsquo;re agreeing
          to.
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

      {/* Commitments */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {COMMITMENTS.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
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
                  {c.title}
                </h3>
                <p
                  className="text-sm"
                  style={{
                    color: 'rgba(245,240,232,0.7)',
                    lineHeight: 1.65,
                  }}
                >
                  {c.desc}
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
          <Gavel
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
            Questions about these terms?
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: 'rgba(245,240,232,0.65)', lineHeight: 1.6 }}
          >
            Our team is happy to walk you or your board through anything on
            this page.
          </p>
          <a
            href="mailto:legal@suvren.hoa"
            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium transition-all"
            style={{
              background: 'rgb(176,155,113)',
              color: 'rgb(12,12,14)',
              borderRadius: '8px',
              letterSpacing: '0.01em',
            }}
          >
            legal@suvren.hoa
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
              href="/privacy"
              className="underline underline-offset-4"
              style={{ color: 'rgba(176,155,113,0.85)' }}
            >
              Privacy Policy
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
