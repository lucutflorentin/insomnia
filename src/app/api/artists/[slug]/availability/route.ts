import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTimeSlots } from '@/lib/utils';
import { logSafe } from '@/lib/log';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// GET /api/artists/[slug]/availability?month=YYYY-MM
// Returns available days and time slots for the given month.
// A slot is removed from the open list if any active booking overlaps with the
// interval [bookingStart, bookingStart + slotDuration + buffer).
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

    // Fetch existing bookings for the period — only those that hold a real slot
    // (quick-form requests with no scheduled time don't reserve any slot).
    const bookings = await prisma.booking.findMany({
      where: {
        artistId: artist.id,
        consultationDate: { gte: startDate, lte: endDate, not: null },
        consultationTime: { not: null },
        status: { notIn: ['cancelled', 'no_show', 'rejected'] },
      },
      select: { consultationDate: true, consultationTime: true },
    });

    // Map booked starts per day. Compare in UTC to stay timezone-agnostic
    // regardless of where Node runs (Vercel = UTC).
    const bookedStartsByDate = new Map<string, number[]>();
    for (const b of bookings) {
      if (!b.consultationDate || !b.consultationTime) continue;
      const dateKey = b.consultationDate.toISOString().slice(0, 10);
      const arr = bookedStartsByDate.get(dateKey) || [];
      arr.push(timeToMinutes(b.consultationTime));
      bookedStartsByDate.set(dateKey, arr);
    }

    // Build override map: "YYYY-MM-DD" -> override
    const overrideMap = new Map<string, typeof overrides[0]>();
    for (const o of overrides) {
      overrideMap.set(o.date.toISOString().slice(0, 10), o);
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
      const dateKey = current.toISOString().slice(0, 10);
      const dayOfWeek = current.getDay(); // 0=Sun, 1=Mon, ...

      const override = overrideMap.get(dateKey);
      const template = templateMap.get(dayOfWeek);

      let isAvailable = false;
      let slots: string[] = [];
      let slotDuration = 60;
      let buffer = 0;

      if (override) {
        // Date-specific override takes priority
        isAvailable = override.isAvailable;
        slotDuration = override.slotDurationMinutes || 60;
        buffer = override.bufferMinutes || 0;
        if (isAvailable) {
          slots = getTimeSlots(override.startTime, override.endTime, slotDuration);
        }
      } else if (template) {
        // Fall back to weekly template — honour its own slot duration + buffer
        isAvailable = true;
        slotDuration = template.slotDurationMinutes || 60;
        buffer = template.bufferMinutes || 0;
        slots = getTimeSlots(template.startTime, template.endTime, slotDuration);
      }

      // Remove slots that overlap with any existing booking + buffer.
      const bookedStarts = bookedStartsByDate.get(dateKey) || [];
      if (bookedStarts.length && slots.length) {
        const blocked = bookedStarts.flatMap((start) => {
          const end = start + slotDuration + buffer;
          return [start, end] as const;
        });
        slots = slots.filter((s) => {
          const candidateStart = timeToMinutes(s);
          const candidateEnd = candidateStart + slotDuration;
          for (let i = 0; i < blocked.length; i += 2) {
            const occStart = blocked[i];
            const occEnd = blocked[i + 1];
            // Overlap if candidate window intersects the occupied window
            if (candidateStart < occEnd && candidateEnd > occStart) {
              return false;
            }
          }
          return true;
        });
        if (slots.length === 0) isAvailable = false;
      }

      days.push({ date: dateKey, isAvailable, slots });
      current.setDate(current.getDate() + 1);
    }

    return NextResponse.json({ success: true, data: days });
  } catch (error) {
    logSafe('availability.fetch', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
