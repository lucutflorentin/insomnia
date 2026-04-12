import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';
import { del } from '@vercel/blob';

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
        ...(body.artistId ? { artistId: parseInt(body.artistId) } : {}),
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

    // Delete files from Vercel Blob (if they are blob URLs)
    try {
      const urlsToDelete: string[] = [];
      if (item.imagePath && item.imagePath.includes('blob.vercel-storage.com')) {
        urlsToDelete.push(item.imagePath);
      }
      if (item.thumbnailPath && item.thumbnailPath.includes('blob.vercel-storage.com')) {
        urlsToDelete.push(item.thumbnailPath);
      }
      if (urlsToDelete.length > 0) {
        await del(urlsToDelete);
      }
    } catch {
      // Files may not exist in blob, continue with DB deletion
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
