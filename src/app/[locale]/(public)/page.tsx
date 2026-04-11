import { prisma } from '@/lib/prisma';
import HomePageClient from '@/components/sections/HomePageClient';
import JsonLd, { getAggregateRatingSchema } from '@/components/seo/JsonLd';

export default async function HomePage() {
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
      src: item.thumbnailPath || item.imagePath,
      titleRo: item.titleRo,
      titleEn: item.titleEn,
    })),
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
      <HomePageClient artists={artists} />
    </>
  );
}
