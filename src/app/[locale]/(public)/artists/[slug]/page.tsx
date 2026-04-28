import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_CONFIG } from '@/lib/constants';
import ArtistProfileContent from './ArtistProfileContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const artist = await prisma.artist.findFirst({
    where: { slug, isActive: true },
  });

  if (!artist) return { title: 'Artist' };

  const specialty = (locale === 'ro' ? artist.specialtyRo : artist.specialtyEn) || artist.specialtyRo || '';
  const bio = (locale === 'ro' ? artist.bioRo : artist.bioEn) || artist.bioRo || '';
  const title = `${artist.name} — ${specialty} | Insomnia Tattoo`;
  const description = bio.substring(0, 160) || `${artist.name}, artist tatuaj specializat in ${specialty} la Insomnia Tattoo Mamaia Nord.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale === 'ro' ? 'artisti' : 'en/artists'}/${slug}`,
      languages: {
        'ro-RO': `/artisti/${slug}`,
        'en-US': `/en/artists/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      images: artist.profileImage ? [{ url: artist.profileImage }] : [],
    },
  };
}

export async function generateStaticParams() {
  try {
    const artists = await prisma.artist.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return artists.map((artist) => ({ slug: artist.slug }));
  } catch {
    return [];
  }
}

function getPersonSchema(artist: {
  name: string;
  slug: string;
  bioRo: string | null;
  profileImage: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
}, avgRating: number, reviewCount: number) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.name,
    jobTitle: 'Tattoo Artist',
    description: artist.bioRo || `Tattoo artist at ${SITE_CONFIG.name}`,
    url: `${SITE_CONFIG.url}/artisti/${artist.slug}`,
    worksFor: {
      '@type': 'TattooParlor',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    sameAs: [
      artist.instagramUrl,
      artist.tiktokUrl,
    ].filter(Boolean),
  };

  if (artist.profileImage) {
    schema.image = artist.profileImage.startsWith('http')
      ? artist.profileImage
      : `${SITE_CONFIG.url}${artist.profileImage}`;
  }

  if (reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      reviewCount,
    };
  }

  return schema;
}

export default async function ArtistPage({ params }: Props) {
  await connection();
  const { locale, slug } = await params;

  const artist = await prisma.artist.findFirst({
    where: { slug, isActive: true },
    include: {
      reviews: {
        where: { isApproved: true, isVisible: true },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
        },
      },
      gallery: {
        where: { isVisible: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      },
    },
  });

  if (!artist) notFound();

  const { reviews, gallery, ...artistData } = artist;
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const serializedArtist = {
    ...artistData,
    specialties: (artistData.specialties as string[]) || [],
    createdAt: artistData.createdAt.toISOString(),
    updatedAt: artistData.updatedAt.toISOString(),
  };

  const serializedReviews = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    clientName: r.user?.name || r.clientName,
    reviewText: (locale === 'ro' ? r.reviewTextRo : r.reviewTextEn) || r.reviewTextRo || r.reviewTextEn || '',
    createdAt: r.createdAt.toISOString(),
  }));

  const serializedGallery = gallery.map((g) => ({
    id: g.id,
    imagePath: g.imagePath,
    thumbnailPath: g.thumbnailPath,
    title: (locale === 'ro' ? g.titleRo : g.titleEn) || g.titleRo || g.titleEn || '',
    style: g.style || '',
  }));

  const personSchema = getPersonSchema(artistData, avgRating, reviews.length);

  return (
    <>
      <JsonLd data={personSchema} />
      <ArtistProfileContent
        artist={serializedArtist}
        reviews={serializedReviews}
        gallery={serializedGallery}
        avgRating={avgRating}
        reviewCount={reviews.length}
        locale={locale}
      />
    </>
  );
}
