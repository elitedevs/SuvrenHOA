import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import FoundingPageClient from './FoundingPageClient';

export function generateMetadata(): Metadata {
  return createMetadata({
    title: 'Founding Community Program',
    description: 'Join SuvrenHOA as a Founding Community. Lock in 20% lifetime discount, priority support, and early access. Only 50 spots — be among the first HOAs on blockchain.',
    path: '/founding',
  });
}

export default function FoundingPage() {
  return <FoundingPageClient />;
}
