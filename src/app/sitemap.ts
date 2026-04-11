import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { ro: '/', en: '/en', priority: 1.0, changeFrequency: 'weekly' as const },
    { ro: '/booking', en: '/en/booking', priority: 0.9, changeFrequency: 'monthly' as const },
    { ro: '/spatiul-ink', en: '/en/ink-space', priority: 0.9, changeFrequency: 'weekly' as const },
    { ro: '/bun-de-stiut', en: '/en/good-to-know', priority: 0.7, changeFrequency: 'monthly' as const },
    { ro: '/aftercare', en: '/en/aftercare', priority: 0.7, changeFrequency: 'monthly' as const },
    { ro: '/despre-noi', en: '/en/about', priority: 0.6, changeFrequency: 'monthly' as const },
    { ro: '/contact', en: '/en/contact', priority: 0.6, changeFrequency: 'monthly' as const },
    { ro: '/confidentialitate', en: '/en/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { ro: '/termeni', en: '/en/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { ro: '/politica-cookies', en: '/en/cookies', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}${page.ro}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          'ro-RO': `${BASE_URL}${page.ro}`,
          'en-US': `${BASE_URL}${page.en}`,
        },
      },
    });

    entries.push({
      url: `${BASE_URL}${page.en}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          'ro-RO': `${BASE_URL}${page.ro}`,
          'en-US': `${BASE_URL}${page.en}`,
        },
      },
    });
  }

  // Dynamic artist pages
  try {
    const artists = await prisma.artist.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    for (const artist of artists) {
      entries.push({
        url: `${BASE_URL}/artisti/${artist.slug}`,
        lastModified: artist.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: {
            'ro-RO': `${BASE_URL}/artisti/${artist.slug}`,
            'en-US': `${BASE_URL}/en/artists/${artist.slug}`,
          },
        },
      });

      entries.push({
        url: `${BASE_URL}/en/artists/${artist.slug}`,
        lastModified: artist.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: {
            'ro-RO': `${BASE_URL}/artisti/${artist.slug}`,
            'en-US': `${BASE_URL}/en/artists/${artist.slug}`,
          },
        },
      });
    }
  } catch {
    // DB unavailable during build — skip dynamic pages
  }

  return entries;
}
