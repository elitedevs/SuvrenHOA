import { createMetadata } from '@/lib/metadata';
import LaunchPageClient from './LaunchPageClient';

export const metadata = createMetadata({
  title: 'Launch — Coming Soon',
  description: 'SuvrenHOA is launching soon on Product Hunt. Get notified the moment we go live. Blockchain-powered HOA governance with tamper-proof voting and transparent treasury.',
  path: '/launch',
});

export default function LaunchPage() {
  return <LaunchPageClient />;
}
