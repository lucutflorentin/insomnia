import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/artists — Public: list active artists with ratings
export async function GET() {
  try {
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
