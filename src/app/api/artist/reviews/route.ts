import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';

// GET /api/artist/reviews — Artist: get all own reviews
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

    const reviews = await prisma.review.findMany({
      where: { artistId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Artist reviews fetch error:', error);
    const message =
      error instanceof Error && error.message === 'Insufficient permissions'
        ? 'Unauthorized'
        : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
