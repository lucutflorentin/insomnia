import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/reviews/[id] — Super Admin: moderate a review
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await verifySuperAdmin(request);

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

    const action = body.isApproved ? 'review.approve' : body.isVisible === false ? 'review.hide' : 'review.moderate';
    logAuditEvent({
      userId: Number(admin.sub),
      action,
      targetType: 'review',
      targetId: reviewId,
      details: data,
    });

    // Notify client when their review is approved
    if (body.isApproved === true && !existing.isApproved && existing.userId) {
      createNotification({
        userId: existing.userId,
        type: 'review_approved',
        title: 'Review-ul tau a fost aprobat',
        message: 'Review-ul tau a fost aprobat si este acum vizibil pe site.',
        link: '/account/reviews',
      });
    }

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
    const admin = await verifySuperAdmin(request);

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

    logAuditEvent({
      userId: Number(admin.sub),
      action: 'review.delete',
      targetType: 'review',
      targetId: reviewId,
    });

    return NextResponse.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
