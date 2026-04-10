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
  // Canonical OBSIDIAN palette — source of truth is
  // /docs/lux-agent-profile.md (PALETTE LIBRARY).
  // Secondary/muted text uses parchment at reduced alpha rather than
  // separate solid hexes, which is the house pattern across the entire app
  // (Header, Sidebar, CommandPalette, NotificationCenter, etc.).
  brandColors: [
    { name: 'Obsidian',     hex: '#0C0C0E', usage: 'Primary background' },
    { name: 'Surface',      hex: '#141416', usage: 'Card / elevated surface' },
    { name: 'Card Surface', hex: '#151518', usage: 'Sidebar / nested card surface' },
    { name: 'Brass',        hex: '#B09B71', usage: 'Primary accent, CTAs, headings' },
    { name: 'Brass Hover',  hex: '#D4C4A0', usage: 'Brass hover / highlight' },
    { name: 'Parchment',    hex: '#F5F0E8', usage: 'Primary text' },
    { name: 'Verdigris',    hex: '#2A5D4F', usage: 'Positive / approved' },
    { name: 'Rosewood',     hex: '#6B3A3A', usage: 'Negative / rejected' },
    { name: 'Amber',        hex: '#A08050', usage: 'Warning / pending' },
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
