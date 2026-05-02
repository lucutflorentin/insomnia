import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp, PUBLIC_READ_LIMIT } from '@/lib/rate-limit';

// GET /api/artists — Public: list active artists with ratings
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimit(
      `artists-read:${ip}`,
      PUBLIC_READ_LIMIT,
      { request, source: 'api/artists:list' },
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }
    const artists = await prisma.artist.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        bioRo: true,
        bioEn: true,
        specialtyRo: true,
        specialtyEn: true,
        specialties: true,
        profileImage: true,
        instagramUrl: true,
        tiktokUrl: true,
        sortOrder: true,
        reviews: {
          where: { isApproved: true, isVisible: true },
          select: { rating: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Compute average ratings
    const data = artists.map(({ reviews, ...artist }) => ({
      ...artist,
      averageRating:
        reviews.length > 0
          ? Math.round(
              (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) *
                10,
            ) / 10
          : 0,
      reviewCount: reviews.length,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Artists fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
