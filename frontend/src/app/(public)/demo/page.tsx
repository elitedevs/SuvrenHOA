import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import DemoPageClient from './DemoPageClient';

export function generateMetadata(): Metadata {
  return createMetadata({
    title: 'Interactive Demo',
    description: 'Explore SuvrenHOA without signing up. See the dashboard, tamper-proof voting, transparent treasury, permanent document storage, and resident tools in action.',
    path: '/demo',
  });
}

export default function DemoPage() {
  return <DemoPageClient />;
}
