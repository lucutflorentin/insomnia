import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await verifyRole(request, ['SUPER_ADMIN']);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      newCount,
      monthCount,
      lastMonthCount,
      confirmedCount,
      pendingReviewCount,
      newClientsThisMonth,
      allApprovedReviews,
      recentBookings,
      recentReviews,
      bookingsPerArtist,
      styleCounts,
      activeArtists,
      visibleGalleryItems,
      galleryMissingMetadata,
      featuredGalleryItems,
      inactiveUsers,
    ] = await Promise.all([
      // New bookings
      prisma.booking.count({ where: { status: 'new' } }),

      // This month bookings
      prisma.booking.count({
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
      }),

      // Last month bookings (for trend)
      prisma.booking.count({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),

      // Confirmed bookings in the same period as monthCount, so conversion
      // cannot be inflated by historical confirmed bookings.
      prisma.booking.count({
        where: {
          status: 'confirmed',
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // Pending reviews
      prisma.review.count({ where: { isApproved: false } }),

      // New clients this month
      prisma.user.count({
        where: {
          role: 'CLIENT',
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // All approved reviews for avg rating
      prisma.review.findMany({
        where: { isApproved: true },
        select: { rating: true },
      }),

      // Recent bookings
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { artist: { select: { name: true, slug: true } } },
      }),

      // Recent unapproved reviews
      prisma.review.findMany({
        where: { isApproved: false },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { artist: { select: { name: true } } },
      }),

      // Bookings per artist (for bar chart)
      prisma.booking.groupBy({
        by: ['artistId'],
        _count: { id: true },
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
      }),

      // Style distribution (for pie chart)
      prisma.booking.groupBy({
        by: ['stylePreference'],
        _count: { id: true },
        where: { stylePreference: { not: null } },
      }),
      prisma.artist.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          bioRo: true,
          bioEn: true,
          specialtyRo: true,
          specialtyEn: true,
          profileImage: true,
          instagramUrl: true,
          tiktokUrl: true,
          gallery: {
            select: {
              isVisible: true,
              isFeatured: true,
              titleRo: true,
              titleEn: true,
              style: true,
              bodyArea: true,
            },
          },
        },
      }),
      prisma.galleryItem.count({ where: { isVisible: true } }),
      prisma.galleryItem.count({
        where: {
          OR: [
            { style: null },
            { bodyArea: null },
            { AND: [{ titleRo: null }, { titleEn: null }] },
          ],
        },
      }),
      prisma.galleryItem.count({ where: { isFeatured: true, isVisible: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    // Monthly trend (last 6 months) — separate query for clean types
    const monthlyTrend = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const mStart = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const mEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0, 23, 59, 59);
        return prisma.booking.count({
          where: { createdAt: { gte: mStart, lte: mEnd } },
        });
      }),
    );

    // Calculate averages
    const avgRating = allApprovedReviews.length > 0
      ? allApprovedReviews.reduce((sum, r) => sum + r.rating, 0) / allApprovedReviews.length
      : 0;

    const conversionRate = (monthCount > 0)
      ? Math.round((confirmedCount / monthCount) * 100)
      : 0;

    const monthTrend = lastMonthCount > 0
      ? Math.round(((monthCount - lastMonthCount) / lastMonthCount) * 100)
      : monthCount > 0 ? 100 : 0;

    // Resolve artist names for bar chart
    const artistIds = bookingsPerArtist.map((b) => b.artistId);
    const artists = await prisma.artist.findMany({
      where: { id: { in: artistIds } },
      select: { id: true, name: true },
    });
    const artistMap = new Map(artists.map((a) => [a.id, a.name]));

    // Build monthly trend data
    const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = monthlyTrend.map((count, i) => {
      const monthIdx = (now.getMonth() - 5 + i + 12) % 12;
      return { month: monthNames[monthIdx], bookings: count };
    });
    const storageConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
    const smtpConfigured = Boolean(
      process.env.SMTP_HOST?.trim() &&
        process.env.SMTP_USER?.trim() &&
        process.env.SMTP_PASS?.trim(),
    );
    const sentryConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
    const cronConfigured = Boolean(process.env.CRON_SECRET?.trim());
    const artistsNeedingAttention = activeArtists
      .map((artist) => {
        const visibleWorks = artist.gallery.filter((item) => item.isVisible).length;
        const featuredWorks = artist.gallery.filter((item) => item.isVisible && item.isFeatured).length;
        const missingProfile =
          !artist.profileImage ||
          !artist.bioRo ||
          !artist.bioEn ||
          !artist.specialtyRo ||
          !artist.specialtyEn ||
          (!artist.instagramUrl && !artist.tiktokUrl);
        const missingPortfolio = visibleWorks < 12 || featuredWorks < 4;

        return {
          id: artist.id,
          name: artist.name,
          visibleWorks,
          featuredWorks,
          missingProfile,
          missingPortfolio,
        };
      })
      .filter((artist) => artist.missingProfile || artist.missingPortfolio);
    const healthChecks = [
      { key: 'storage', ok: storageConfigured },
      { key: 'email', ok: smtpConfigured },
      { key: 'sentry', ok: sentryConfigured },
      { key: 'cron', ok: cronConfigured },
      { key: 'gallery', ok: visibleGalleryItems >= activeArtists.length * 12 && activeArtists.length > 0 },
      { key: 'metadata', ok: galleryMissingMetadata === 0 },
    ];
    const healthScore = Math.round(
      (healthChecks.filter((check) => check.ok).length / healthChecks.length) * 100,
    );

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          newBookings: newCount,
          monthBookings: monthCount,
          confirmedBookings: confirmedCount,
          pendingReviews: pendingReviewCount,
          conversionRate,
          avgRating: Math.round(avgRating * 10) / 10,
          totalReviews: allApprovedReviews.length,
          newClients: newClientsThisMonth,
          monthTrend,
        },
        charts: {
          monthlyTrend: trendData,
          bookingsPerArtist: bookingsPerArtist.map((b) => ({
            name: artistMap.get(b.artistId) || 'Unknown',
            bookings: b._count.id,
          })),
          styleDistribution: styleCounts
            .filter((s) => s.stylePreference)
            .map((s) => ({
              name: s.stylePreference!,
              value: s._count.id,
            })),
        },
        recentBookings: recentBookings.map((b) => ({
          id: b.id,
          referenceCode: b.referenceCode,
          clientName: b.clientName,
          artistName: b.artist.name,
          status: b.status,
          createdAt: b.createdAt.toISOString(),
        })),
        recentReviews: recentReviews.map((r) => ({
          id: r.id,
          clientName: r.clientName,
          artistName: r.artist?.name || '',
          rating: r.rating,
          text: r.reviewTextRo || r.reviewTextEn || '',
        })),
        health: {
          score: healthScore,
          checks: healthChecks,
          visibleGalleryItems,
          featuredGalleryItems,
          galleryMissingMetadata,
          inactiveUsers,
          artistsNeedingAttention,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
