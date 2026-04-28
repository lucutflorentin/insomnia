import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest } from '@/lib/auth';

// GET /api/client/favorites — Get current user's favorites
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        galleryItem: {
          select: {
            imagePath: true,
            thumbnailPath: true,
            titleRo: true,
            titleEn: true,
            style: true,
            bodyArea: true,
            artist: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: favorites.map((f) => {
        return {
          id: f.id,
          galleryItemId: f.galleryItemId,
          createdAt: f.createdAt,
          ...f.galleryItem,
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// POST /api/client/favorites — Add a favorite
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    const body = await request.json();
    const galleryItemId = Number(body.galleryItemId);

    if (!galleryItemId || isNaN(galleryItemId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid gallery item ID' },
        { status: 400 },
      );
    }

    // Verify gallery item exists
    const item = await prisma.galleryItem.findUnique({
      where: { id: galleryItemId },
    });
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Gallery item not found' },
        { status: 404 },
      );
    }

    const favorite = await prisma.favorite.upsert({
      where: { unique_user_gallery_favorite: { userId, galleryItemId } },
      update: {},
      create: { userId, galleryItemId },
    });

    return NextResponse.json({ success: true, data: favorite }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// DELETE /api/client/favorites — Remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    const { searchParams } = new URL(request.url);
    const galleryItemId = Number(searchParams.get('galleryItemId'));

    if (!galleryItemId || isNaN(galleryItemId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid gallery item ID' },
        { status: 400 },
      );
    }

    await prisma.favorite.deleteMany({
      where: { userId, galleryItemId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
