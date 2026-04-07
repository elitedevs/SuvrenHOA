import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import PricingPageClient from './PricingPageClient';

export function generateMetadata(): Metadata {
  return createMetadata({
    title: 'Pricing',
    description: 'SuvrenHOA plans start at $49/mo. Blockchain-powered HOA governance with tamper-proof voting and transparent treasury. 60-day free trial, no credit card required.',
    path: '/pricing',
  });
}

export default function PricingPage() {
  return <PricingPageClient />;
}
