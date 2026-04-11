import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';
import { availabilitySchema } from '@/lib/validations';

// GET /api/availability?artistId=X&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD — Admin
export async function GET(request: NextRequest) {
  try {
    await verifyAdminRequest(request);

    const { searchParams } = new URL(request.url);
    const artistId = parseInt(searchParams.get('artistId') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!artistId) {
      return NextResponse.json(
        { success: false, error: 'artistId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { artistId };
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const availability = await prisma.availability.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ success: true, data: availability });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// POST /api/availability — Admin: upsert availability for a specific date
export async function POST(request: NextRequest) {
  try {
    await verifyAdminRequest(request);

    const body = await request.json();
    const parsed = availabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const availability = await prisma.availability.upsert({
      where: {
        unique_artist_date: {
          artistId: parsed.data.artistId,
          date: new Date(parsed.data.date),
        },
      },
      update: {
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        slotDurationMinutes: parsed.data.slotDurationMinutes,
        isAvailable: parsed.data.isAvailable,
      },
      create: {
        artistId: parsed.data.artistId,
        date: new Date(parsed.data.date),
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        slotDurationMinutes: parsed.data.slotDurationMinutes,
        isAvailable: parsed.data.isAvailable,
      },
    });

    return NextResponse.json({ success: true, data: availability }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
