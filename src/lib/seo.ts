export const SITE_URL = 'https://safetools.dev';

export interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogImageAlt?: string;
  type?: 'website' | 'article';
}

export function getJsonLdWebApplication(tool: {
  name: string;
  description: string;
  slug: string;
}) {
  return JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      description: tool.description,
      url: `${SITE_URL}/tools/${tool.slug}`,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      browserRequirements: 'Requires a modern web browser',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: tool.name,
          item: `${SITE_URL}/tools/${tool.slug}`,
        },
      ],
    },
  ]);
}

export function getJsonLdWebSite() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SafeTools.dev',
    url: SITE_URL,
    description: 'Free online developer tools where your data never leaves your browser.',
  });
}

export function getJsonLdBreadcrumb(tool: { name: string; slug: string }) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: tool.name,
        item: `${SITE_URL}/tools/${tool.slug}`,
      },
    ],
  });
}
