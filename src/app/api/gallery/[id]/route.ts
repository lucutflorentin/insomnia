import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/gallery/[id] — Admin: update gallery item
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await verifyAdminRequest(request);

    const { id } = await params;
    const body = await request.json();

    const item = await prisma.galleryItem.update({
      where: { id: parseInt(id) },
      data: {
        titleRo: body.titleRo,
        titleEn: body.titleEn,
        style: body.style,
        bodyArea: body.bodyArea,
        isFeatured: body.isFeatured,
        isVisible: body.isVisible,
        sortOrder: body.sortOrder,
      },
      include: {
        artist: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized or item not found' },
      { status: 401 },
    );
  }
}

// DELETE /api/gallery/[id] — Admin: delete gallery item and files
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await verifyAdminRequest(request);

    const { id } = await params;
    const item = await prisma.galleryItem.findUnique({
      where: { id: parseInt(id) },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 },
      );
    }

    // Delete physical files
    const publicDir = path.resolve('./public');
    try {
      await unlink(path.join(publicDir, item.imagePath));
      if (item.thumbnailPath) {
        await unlink(path.join(publicDir, item.thumbnailPath));
      }
    } catch {
      // Files may not exist, continue with DB deletion
    }

    await prisma.galleryItem.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
