import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/reviews/artist/[slug] — Public: get reviews + average rating for an artist
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const artist = await prisma.artist.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 },
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        artistId: artist.id,
        isApproved: true,
        isVisible: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10,
          ) / 10
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        artist: {
          name: artist.name,
          slug: artist.slug,
          averageRating,
          reviewCount,
        },
        reviews,
      },
    });
  } catch (error) {
    console.error('Fetch artist reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
