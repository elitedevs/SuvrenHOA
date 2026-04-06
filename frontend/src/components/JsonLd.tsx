export function SaaSProductJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SuvrenHOA',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Blockchain-powered HOA governance platform with tamper-proof voting, transparent treasury management, and permanent document storage.',
    url: 'https://suvren.co',
    author: {
      '@type': 'Organization',
      name: 'Suvren LLC',
      url: 'https://suvren.co',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Raleigh',
        addressRegion: 'NC',
        addressCountry: 'US',
      },
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '49.00',
        priceCurrency: 'USD',
        priceValidUntil: '2027-12-31',
        description: 'Up to 50 units. Tamper-proof voting, transparent treasury, permanent document storage.',
      },
      {
        '@type': 'Offer',
        name: 'Professional',
        price: '129.00',
        priceCurrency: 'USD',
        priceValidUntil: '2027-12-31',
        description: 'Up to 200 units. Everything in Starter plus health score, advanced reporting, custom branding.',
      },
      {
        '@type': 'Offer',
        name: 'Enterprise',
        price: '249.00',
        priceCurrency: 'USD',
        priceValidUntil: '2027-12-31',
        description: 'Unlimited units. Everything in Professional plus API access, SLA guarantee, dedicated onboarding.',
      },
    ],
    aggregateRating: undefined,
    featureList: [
      'Tamper-proof voting',
      'Transparent treasury',
      'Permanent document storage',
      'Multi-signature approvals',
      'Timelock governance',
      'Community health score',
      'Resident directory',
      'Maintenance tracking',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Suvren LLC',
    url: 'https://suvren.co',
    logo: 'https://suvren.co/logo-full.svg',
    description: 'Blockchain-powered HOA governance platform.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Raleigh',
      addressRegion: 'NC',
      addressCountry: 'US',
    },
    sameAs: [
      'https://twitter.com/SuvrenHOA',
      'https://linkedin.com/company/suvren',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@suvren.co',
      contactType: 'customer support',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
