/**
 * Press kit data for SuvrenHOA.
 * Used by /press page and downloadable kit generation.
 */

export const PRESS_KIT = {
  company: {
    name: 'Suvren LLC',
    product: 'SuvrenHOA',
    founded: '2026',
    location: 'United States',
    tagline: 'Transparent. Immutable. Democratic.',
    description:
      'SuvrenHOA is the first homeowners association platform built on blockchain technology. We give HOA boards and residents permanent, tamper-proof records of votes, finances, and community documents — enforced by code, not trust.',
    longDescription:
      'Homeowners associations govern over 75 million Americans, yet most operate with spreadsheets, PDFs, and a trust that boards won\'t alter records. SuvrenHOA changes that. By recording every vote, every transaction, and every document on the Base blockchain, we make manipulation mathematically impossible. Our platform combines the transparency of Web3 with the usability of modern SaaS — no wallet required to get started.',
  },
  contact: {
    press: 'press@suvren.com',
    general: 'hello@suvren.com',
    founders: 'founders@suvren.com',
  },
  urls: {
    website: 'https://suvren.com',
    app: 'https://app.suvren.com',
    docs: 'https://docs.suvren.com',
    twitter: 'https://twitter.com/SuvrenHOA',
    linkedin: 'https://linkedin.com/company/suvren',
  },
  stats: [
    { label: 'Smart contracts deployed', value: '7', note: 'Base Sepolia testnet' },
    { label: 'Test coverage', value: '122 tests', note: '100% passing' },
    { label: 'App screens', value: '80+', note: 'Full resident portal' },
    { label: 'Founding spots', value: '50', note: 'Limited program' },
    { label: 'HOAs governed in US', value: '375,000+', note: 'Market size' },
    { label: 'Americans in HOAs', value: '75M+', note: 'Addressable market' },
  ],
  features: [
    {
      name: 'On-Chain Voting',
      description: 'Every vote is recorded to the Base blockchain the moment it is cast. Results cannot be altered by anyone — including Suvren.',
    },
    {
      name: 'Transparent Treasury',
      description: 'All dues, expenses, and reserves are visible to every resident in real time. Blockchain-verified, not just reported.',
    },
    {
      name: 'Permanent Documents',
      description: 'Meeting minutes, CC&Rs, and governing documents are stored on Arweave — permanent, timestamped, censorship-resistant.',
    },
    {
      name: 'Property NFTs',
      description: 'Each property is represented by a soulbound ERC-721 token. Ownership is verifiable on-chain, no manual roster needed.',
    },
    {
      name: 'Community Health Score',
      description: 'An automatic scorecard combining voter participation, financial health, and document compliance into a single number.',
    },
    {
      name: 'Smart Wallet Auth',
      description: 'Powered by Coinbase Smart Wallet (ERC-4337). No seed phrases. Passkey-based auth with gas sponsorship.',
    },
  ],
  brandColors: [
    { name: 'Obsidian', hex: '#0C0C0E', usage: 'Primary background' },
    { name: 'Brass', hex: '#B09B71', usage: 'Primary accent, CTAs, headings' },
    { name: 'Parchment', hex: '#E8E4DC', usage: 'Primary text' },
    { name: 'Warm Gray', hex: '#C4BAA8', usage: 'Secondary text' },
    { name: 'Muted', hex: '#8A8070', usage: 'Captions, labels' },
    { name: 'Deep Muted', hex: '#4A4A52', usage: 'Disabled, meta text' },
  ],
  typography: {
    headings: 'Playfair Display (Google Fonts)',
    body: 'Inter (Google Fonts)',
  },
  boilerplate:
    'SuvrenHOA, a product of Suvren LLC, is the first blockchain-powered HOA governance platform. Built on Base, SuvrenHOA makes HOA votes, finances, and documents permanently transparent and tamper-proof. Founded in 2026, Suvren LLC is headquartered in the United States.',
  assets: [
    { name: 'Logo (SVG, dark bg)', file: '/brand/logo-dark.svg' },
    { name: 'Logo (SVG, light bg)', file: '/brand/logo-light.svg' },
    { name: 'Logo (PNG, 2x)', file: '/brand/logo@2x.png' },
    { name: 'Wordmark (SVG)', file: '/brand/wordmark.svg' },
    { name: 'OG Image', file: '/og-image.png' },
    { name: 'Color palette (ASE)', file: '/brand/suvren-palette.ase' },
  ],
} as const;

export type PressKit = typeof PRESS_KIT;
