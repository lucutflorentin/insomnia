import { prisma } from '@/lib/prisma';
import { connection } from 'next/server';
import HomePageClient from '@/components/sections/HomePageClient';
import JsonLd, { getAggregateRatingSchema } from '@/components/seo/JsonLd';
import { normalizeStyleKey } from '@/lib/gallery-style';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function HomePage() {
  await connection();
  // Fetch artists with their featured works and ratings from DB
  const artistsRaw = await prisma.artist.findMany({
    where: { isActive: true },
    include: {
      reviews: {
        where: { isApproved: true, isVisible: true },
        select: { rating: true },
      },
      gallery: {
        where: { isFeatured: true, isVisible: true },
        select: { id: true, imagePath: true, thumbnailPath: true, titleRo: true, titleEn: true },
        orderBy: { sortOrder: 'asc' },
        take: 6,
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const artists = artistsRaw.map(({ reviews, gallery, ...artist }) => ({
    ...artist,
    specialties: (artist.specialties as string[]) || [],
    averageRating:
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10,
          ) / 10
        : 0,
    reviewCount: reviews.length,
    featuredWorks: gallery.map((item) => ({
      id: item.id,
      src: item.imagePath,
      titleRo: item.titleRo,
      titleEn: item.titleEn,
    })),
  }));

  const galleryRaw = await prisma.galleryItem.findMany({
    where: { isVisible: true },
    include: {
      artist: {
        select: { name: true, slug: true, isActive: true },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: 12,
  });

  const galleryItems = galleryRaw
    .filter((item) => item.artist.isActive)
    .map((item) => ({
      id: item.id,
      style: normalizeStyleKey(item.style) || 'tattoo',
      titleRo: item.titleRo,
      titleEn: item.titleEn,
      imagePath: item.imagePath,
      thumbnailPath: item.thumbnailPath || item.imagePath,
      artistName: item.artist.name,
      artistSlug: item.artist.slug,
    }));

  // Calculate aggregate rating across all artists
  const allReviews = artistsRaw.flatMap((a) => a.reviews);
  const totalReviewCount = allReviews.length;
  const avgRating = totalReviewCount > 0
    ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewCount) * 10) / 10
    : 0;
  const aggregateRatingSchema = getAggregateRatingSchema(avgRating, totalReviewCount);

  return (
    <>
      {aggregateRatingSchema && <JsonLd data={aggregateRatingSchema} />}
      <HomePageClient artists={artists} galleryItems={galleryItems} />
    </>
  );
}
