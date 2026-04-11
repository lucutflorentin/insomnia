import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';
import { availabilityTemplateSchema } from '@/lib/validations';

// GET /api/availability/templates?artistId=X — Admin
export async function GET(request: NextRequest) {
  try {
    await verifyAdminRequest(request);

    const { searchParams } = new URL(request.url);
    const artistId = parseInt(searchParams.get('artistId') || '0');

    if (!artistId) {
      return NextResponse.json(
        { success: false, error: 'artistId is required' },
        { status: 400 },
      );
    }

    const templates = await prisma.availabilityTemplate.findMany({
      where: { artistId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// POST /api/availability/templates — Admin: upsert weekly template
export async function POST(request: NextRequest) {
  try {
    await verifyAdminRequest(request);

    const body = await request.json();
    const parsed = availabilityTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const template = await prisma.availabilityTemplate.upsert({
      where: {
        unique_artist_day: {
          artistId: parsed.data.artistId,
          dayOfWeek: parsed.data.dayOfWeek,
        },
      },
      update: {
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        isActive: parsed.data.isActive,
      },
      create: {
        artistId: parsed.data.artistId,
        dayOfWeek: parsed.data.dayOfWeek,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
