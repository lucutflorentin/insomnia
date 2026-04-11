import { SITE_CONFIG, SOCIAL_LINKS } from '@/lib/constants';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function getLocalBusinessSchema() {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    email: SITE_CONFIG.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Mamaia Nord',
      addressLocality: 'Constanta',
      addressRegion: 'Constanta',
      postalCode: '905700',
      addressCountry: 'RO',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 44.2396,
      longitude: 28.6325,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '16:00',
      },
    ],
    sameAs: [
      SOCIAL_LINKS.instagram,
      SOCIAL_LINKS.tiktok,
      SOCIAL_LINKS.facebook,
    ],
    image: `${SITE_CONFIG.url}/og-image.svg`,
    priceRange: '$$',
  };

  if (SITE_CONFIG.phone) {
    schema.telephone = SITE_CONFIG.phone;
  }

  return schema;
}

export function getAggregateRatingSchema(ratingValue: number, reviewCount: number) {
  if (reviewCount === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      reviewCount: reviewCount,
    },
  };
}

export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

export function getFaqSchema(
  items: Array<{ question: string; answer: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
