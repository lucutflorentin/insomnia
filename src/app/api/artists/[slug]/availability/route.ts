import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getArtistAvailabilityForRange } from '@/lib/availability';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/artists/[slug]/availability?month=YYYY-MM
// Returns available days and time slots for the given month
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    const artist = await prisma.artist.findUnique({
      where: { slug },
      select: { id: true, isActive: true, user: { select: { isActive: true } } },
    });

    if (!artist || !artist.isActive || !artist.user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 },
      );
    }

    // Determine date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, m] = month.split('-').map(Number);
      startDate = new Date(year, m - 1, 1);
      endDate = new Date(year, m, 0); // last day of month
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const days = await getArtistAvailabilityForRange(prisma, artist.id, startDate, endDate);

    return NextResponse.json({ success: true, data: days });
  } catch (error) {
    console.error('Availability fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
