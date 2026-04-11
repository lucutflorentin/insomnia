import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';

// GET /api/admin/reviews — Super Admin: list all reviews (including unapproved)
export async function GET(request: NextRequest) {
  try {
    await verifySuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const isApproved = searchParams.get('isApproved');
    const artistId = searchParams.get('artistId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: Record<string, unknown> = {};
    if (isApproved !== null) where.isApproved = isApproved === 'true';
    if (artistId) where.artistId = parseInt(artistId);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          artist: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin fetch reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
