import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import ContactPageClient from './ContactPageClient';

export function generateMetadata(): Metadata {
  return createMetadata({
    title: 'Contact Us',
    description: 'Get in touch with the SuvrenHOA team. Questions about blockchain HOA governance, pricing, demos, or partnerships — we respond within 24 hours.',
    path: '/contact',
  });
}

export default function ContactPage() {
  return <ContactPageClient />;
}
