export interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  type?: 'website' | 'article';
}

export function getJsonLdWebApplication(tool: {
  name: string;
  description: string;
  slug: string;
}) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.description,
    url: `https://safetools.dev/tools/${tool.slug}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    browserRequirements: 'Requires a modern web browser',
  });
}
