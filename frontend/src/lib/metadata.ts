import type { Metadata } from 'next';

const BASE_URL = 'https://hoa.suvren.co';

export function createMetadata({
  title,
  description,
  path = '',
  ogImage,
}: {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
}): Metadata {
  const ogTitle = title === 'SuvrenHOA' ? title : `${title} — SuvrenHOA`;
  const url = `${BASE_URL}${path}`;
  const image = ogImage || `${BASE_URL}/og-default.png`;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: 'SuvrenHOA',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [image],
      creator: '@SuvrenHOA',
    },
    alternates: {
      canonical: url,
    },
  };
}

export function createArticleMetadata({
  title,
  description,
  path,
  publishedTime,
  author = 'Ryan Shanahan',
}: {
  title: string;
  description: string;
  path: string;
  publishedTime: string;
  author?: string;
}): Metadata {
  const base = createMetadata({ title, description, path });
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      publishedTime,
      authors: [author],
    },
  };
}
