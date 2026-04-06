import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/governance/', '/treasury/', '/settings/', '/create-community/', '/invite/'],
      },
    ],
    sitemap: 'https://suvren.co/sitemap.xml',
  };
}
