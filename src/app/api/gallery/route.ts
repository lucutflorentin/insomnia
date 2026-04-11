import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';
import { galleryItemSchema } from '@/lib/validations';

// GET /api/gallery — Public: list visible gallery items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const style = searchParams.get('style');
    const featured = searchParams.get('featured');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '30')));

    const where: Record<string, unknown> = { isVisible: true };
    if (artistId) where.artistId = parseInt(artistId);
    if (style) where.style = style;
    if (featured === 'true') where.isFeatured = true;

    const [items, total] = await Promise.all([
      prisma.galleryItem.findMany({
        where,
        include: {
          artist: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.galleryItem.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST /api/gallery — Admin: create gallery item
export async function POST(request: NextRequest) {
  try {
    await verifyAdminRequest(request);

    const body = await request.json();
    const parsed = galleryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const item = await prisma.galleryItem.create({
      data: parsed.data,
      include: {
        artist: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
