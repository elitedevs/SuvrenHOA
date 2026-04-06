/**
 * Social / sharing config for SuvrenHOA.
 * Update handles and URLs as accounts are created.
 */

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/SuvrenHOA',
  linkedin: 'https://linkedin.com/company/suvren',
  discord: 'https://discord.gg/suvren', // Update with real invite
  github: 'https://github.com/suvren',
  productHunt: 'https://producthunt.com/posts/suvren-hoa', // Update at launch
} as const;

export const SOCIAL_HANDLES = {
  twitter: '@SuvrenHOA',
} as const;

export const SHARE_DEFAULTS = {
  siteUrl: 'https://suvren.com',
  appUrl: 'https://app.suvren.com',
  defaultTitle: 'SuvrenHOA — Blockchain-Powered HOA Governance',
  defaultDescription:
    'Transparent treasury, tamper-proof voting, permanent documents. The HOA platform built on Base blockchain.',
  ogImage: 'https://suvren.com/og-image.png',
} as const;

export function buildShareUrl(path: string): string {
  return `${SHARE_DEFAULTS.siteUrl}${path}`;
}

export function buildTwitterShareUrl(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function buildLinkedinShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}
