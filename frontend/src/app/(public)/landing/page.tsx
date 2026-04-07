import { createMetadata } from '@/lib/metadata';
import LandingPageClient from './LandingPageClient';

export const metadata = createMetadata({
  title: 'Blockchain-Powered HOA Governance',
  description: 'SuvrenHOA permanently records every vote, dollar, and document on blockchain. Tamper-proof voting, transparent treasury, and permanent records — starting at $49/mo.',
  path: '/landing',
});

export default function LandingPage() {
  return <LandingPageClient />;
}
