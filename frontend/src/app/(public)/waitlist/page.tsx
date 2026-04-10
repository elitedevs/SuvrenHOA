import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import WaitlistPageClient from './WaitlistPageClient';

export function generateMetadata(): Metadata {
  return createMetadata({
    title: 'Reserve Your Seat',
    description:
      'SuvrenHOA is invitation only. Reserve your seat and we will reach out when the next cohort opens.',
    path: '/waitlist',
  });
}

export default function WaitlistPage() {
  return <WaitlistPageClient />;
}
