import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTimeSlots } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/artists/[slug]/availability?month=YYYY-MM
// Returns available days and time slots for the given month
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    const artist = await prisma.artist.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 },
      );
    }

    // Determine date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, m] = month.split('-').map(Number);
      startDate = new Date(year, m - 1, 1);
      endDate = new Date(year, m, 0); // last day of month
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Don't show past dates
    if (startDate < now) {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Fetch availability overrides for date range
    const overrides = await prisma.availability.findMany({
      where: {
        artistId: artist.id,
        date: { gte: startDate, lte: endDate },
      },
    });

    // Fetch weekly templates
    const templates = await prisma.availabilityTemplate.findMany({
      where: { artistId: artist.id, isActive: true },
    });

    // Fetch existing bookings for the period
    const bookings = await prisma.booking.findMany({
      where: {
        artistId: artist.id,
        consultationDate: { gte: startDate, lte: endDate },
        status: { notIn: ['cancelled', 'no_show'] },
      },
      select: { consultationDate: true, consultationTime: true },
    });

    // Build a map of booked slots: "YYYY-MM-DD" -> Set of times
    const bookedSlots = new Map<string, Set<string>>();
    for (const b of bookings) {
      const dateKey = b.consultationDate.toISOString().split('T')[0];
      if (!bookedSlots.has(dateKey)) bookedSlots.set(dateKey, new Set());
      bookedSlots.get(dateKey)!.add(b.consultationTime);
    }

    // Build override map: "YYYY-MM-DD" -> override
    const overrideMap = new Map<string, typeof overrides[0]>();
    for (const o of overrides) {
      overrideMap.set(o.date.toISOString().split('T')[0], o);
    }

    // Template map: dayOfWeek -> template
    const templateMap = new Map<number, typeof templates[0]>();
    for (const t of templates) {
      templateMap.set(t.dayOfWeek, t);
    }

    // Generate availability for each day
    const days: Array<{
      date: string;
      isAvailable: boolean;
      slots: string[];
    }> = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay(); // 0=Sun, 1=Mon, ...

      const override = overrideMap.get(dateKey);
      const template = templateMap.get(dayOfWeek);

      let isAvailable = false;
      let slots: string[] = [];

      if (override) {
        // Date-specific override takes priority
        isAvailable = override.isAvailable;
        if (isAvailable) {
          slots = getTimeSlots(
            override.startTime,
            override.endTime,
            override.slotDurationMinutes,
          );
        }
      } else if (template) {
        // Fall back to weekly template
        isAvailable = true;
        slots = getTimeSlots(template.startTime, template.endTime, 60);
      }

      // Remove already-booked slots
      const booked = bookedSlots.get(dateKey);
      if (booked && slots.length > 0) {
        slots = slots.filter((s) => !booked.has(s));
        if (slots.length === 0) isAvailable = false;
      }

      days.push({ date: dateKey, isAvailable, slots });
      current.setDate(current.getDate() + 1);
    }

    return NextResponse.json({ success: true, data: days });
  } catch (error) {
    console.error('Availability fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
