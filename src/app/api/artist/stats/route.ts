import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';

// GET /api/artist/stats — Artist: get personal dashboard stats
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyRole(request, ['ARTIST']);
    const artistId = payload.artistId;

    if (!artistId) {
      return NextResponse.json(
        { success: false, error: 'No artist profile linked' },
        { status: 403 },
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      monthBookings,
      totalBookings,
      reviews,
      upcomingBookings,
      recentReviews,
      galleryItems,
      artistProfile,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          artistId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.booking.count({ where: { artistId } }),
      prisma.review.findMany({
        where: { artistId },
        select: { rating: true },
      }),
      prisma.booking.findMany({
        where: {
          artistId,
          status: { in: ['new', 'contacted', 'confirmed'] },
          consultationDate: { gte: now },
        },
        orderBy: { consultationDate: 'asc' },
        take: 5,
        select: {
          id: true,
          clientName: true,
          consultationDate: true,
          consultationTime: true,
          status: true,
          sizeCategory: true,
          bodyArea: true,
        },
      }),
      prisma.review.findMany({
        where: { artistId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          rating: true,
          reviewTextRo: true,
          reviewTextEn: true,
          isApproved: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      prisma.galleryItem.findMany({
        where: { artistId },
        select: {
          id: true,
          titleRo: true,
          titleEn: true,
          style: true,
          bodyArea: true,
          isFeatured: true,
          isVisible: true,
        },
      }),
      prisma.artist.findUnique({
        where: { id: artistId },
        select: {
          slug: true,
          bioRo: true,
          bioEn: true,
          specialtyRo: true,
          specialtyEn: true,
          profileImage: true,
          instagramUrl: true,
          tiktokUrl: true,
        },
      }),
    ]);

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : 0;
    const visibleWorks = galleryItems.filter((item) => item.isVisible).length;
    const featuredWorks = galleryItems.filter((item) => item.isFeatured).length;
    const worksMissingMetadata = galleryItems.filter(
      (item) => !item.titleRo && !item.titleEn && (!item.style || !item.bodyArea),
    ).length;
    const checklist = [
      {
        key: 'profileImage',
        done: Boolean(artistProfile?.profileImage),
        href: '/artist/profile',
      },
      {
        key: 'bio',
        done: Boolean(artistProfile?.bioRo && artistProfile?.bioEn),
        href: '/artist/profile',
      },
      {
        key: 'specialty',
        done: Boolean(artistProfile?.specialtyRo && artistProfile?.specialtyEn),
        href: '/artist/profile',
      },
      {
        key: 'social',
        done: Boolean(artistProfile?.instagramUrl || artistProfile?.tiktokUrl),
        href: '/artist/profile',
      },
      {
        key: 'visibleWorks',
        done: visibleWorks >= 12,
        href: '/artist/gallery',
      },
      {
        key: 'featuredWorks',
        done: featuredWorks >= 4,
        href: '/artist/gallery',
      },
      {
        key: 'metadata',
        done: worksMissingMetadata === 0 && galleryItems.length > 0,
        href: '/artist/gallery',
      },
    ];
    const completedChecklistItems = checklist.filter((item) => item.done).length;
    const readinessScore = Math.round((completedChecklistItems / checklist.length) * 100);

    return NextResponse.json({
      success: true,
      data: {
        monthBookings,
        totalBookings,
        totalReviews,
        averageRating,
        upcomingBookings,
        recentReviews,
        portfolio: {
          slug: artistProfile?.slug,
          readinessScore,
          visibleWorks,
          featuredWorks,
          totalWorks: galleryItems.length,
          worksMissingMetadata,
          checklist,
        },
      },
    });
  } catch (error) {
    console.error('Artist stats error:', error);
    const message =
      error instanceof Error && error.message === 'Insufficient permissions'
        ? 'Unauthorized'
        : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
