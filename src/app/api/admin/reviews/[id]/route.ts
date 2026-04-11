import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/reviews/[id] — Super Admin: moderate a review
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await verifySuperAdmin(request);

    const { id } = await params;
    const reviewId = parseInt(id);

    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 },
      );
    }

    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (typeof body.isApproved === 'boolean') data.isApproved = body.isApproved;
    if (typeof body.isVisible === 'boolean') data.isVisible = body.isVisible;

    const review = await prisma.review.update({
      where: { id: reviewId },
      data,
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('Moderate review error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// DELETE /api/admin/reviews/[id] — Super Admin: permanently delete a review
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await verifySuperAdmin(request);

    const { id } = await params;
    const reviewId = parseInt(id);

    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 },
      );
    }

    await prisma.review.delete({ where: { id: reviewId } });

    return NextResponse.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
