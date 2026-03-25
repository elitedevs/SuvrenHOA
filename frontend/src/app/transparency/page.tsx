import type { Metadata } from 'next';
import { TransparencyDashboard } from './TransparencyDashboard';

export const metadata: Metadata = {
  title: 'Transparency Dashboard — SuvrenHOA',
  description:
    'Every dollar, every vote, every document — publicly verifiable on the blockchain. No wallet required.',
};

export default function TransparencyPage() {
  return <TransparencyDashboard />;
}
