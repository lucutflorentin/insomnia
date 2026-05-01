import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { BOOKING_CONFIG } from '@/lib/constants';
import { formatLocalDateKey, getTimeSlots, parseLocalDate } from '@/lib/utils';

type AvailabilityDb = typeof prisma | Prisma.TransactionClient;

export type BookingSlotErrorCode =
  | 'DATE_OUT_OF_RANGE'
  | 'SLOT_UNAVAILABLE'
  | 'SLOT_TAKEN';

export class BookingSlotError extends Error {
  code: BookingSlotErrorCode;

  constructor(code: BookingSlotErrorCode) {
    super(code);
    this.code = code;
  }
}

export function getBookingDateWindow(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + BOOKING_CONFIG.advanceDays);
  return { today, maxDate };
}

export function isWithinBookingWindow(date: Date, now = new Date()): boolean {
  const { today, maxDate } = getBookingDateWindow(now);
  return date >= today && date <= maxDate;
}

export async function getAvailableSlotsForDate(
  db: AvailabilityDb,
  artistId: number,
  date: Date,
): Promise<string[]> {
  const override = await db.availability.findUnique({
    where: {
      unique_artist_date: {
        artistId,
        date,
      },
    },
  });

  if (override) {
    return override.isAvailable
      ? getTimeSlots(override.startTime, override.endTime, override.slotDurationMinutes)
      : [];
  }

  const template = await db.availabilityTemplate.findUnique({
    where: {
      unique_artist_day: {
        artistId,
        dayOfWeek: date.getDay(),
      },
    },
  });

  if (!template?.isActive) return [];
  return getTimeSlots(template.startTime, template.endTime, BOOKING_CONFIG.consultationDurationMinutes);
}

export async function assertBookingSlotAvailable(
  db: AvailabilityDb,
  artistId: number,
  consultationDate: string,
  consultationTime: string,
): Promise<Date> {
  const date = parseLocalDate(consultationDate);

  if (!isWithinBookingWindow(date)) {
    throw new BookingSlotError('DATE_OUT_OF_RANGE');
  }

  const availableSlots = await getAvailableSlotsForDate(db, artistId, date);
  if (!availableSlots.includes(consultationTime)) {
    throw new BookingSlotError('SLOT_UNAVAILABLE');
  }

  const existingBooking = await db.booking.findFirst({
    where: {
      artistId,
      consultationDate: date,
      consultationTime,
      status: { notIn: ['cancelled', 'no_show'] },
    },
  });

  if (existingBooking) {
    throw new BookingSlotError('SLOT_TAKEN');
  }

  return date;
}

export async function getArtistAvailabilityForRange(
  db: AvailabilityDb,
  artistId: number,
  startDate: Date,
  endDate: Date,
): Promise<Array<{ date: string; isAvailable: boolean; slots: string[] }>> {
  const { today, maxDate } = getBookingDateWindow();
  const effectiveStart = startDate < today ? today : startDate;
  const effectiveEnd = endDate > maxDate ? maxDate : endDate;

  if (effectiveStart > effectiveEnd) return [];

  const [overrides, templates, bookings] = await Promise.all([
    db.availability.findMany({
      where: {
        artistId,
        date: { gte: effectiveStart, lte: effectiveEnd },
      },
    }),
    db.availabilityTemplate.findMany({
      where: { artistId, isActive: true },
    }),
    db.booking.findMany({
      where: {
        artistId,
        consultationDate: { gte: effectiveStart, lte: effectiveEnd },
        status: { notIn: ['cancelled', 'no_show'] },
      },
      select: { consultationDate: true, consultationTime: true },
    }),
  ]);

  const bookedSlots = new Map<string, Set<string>>();
  for (const booking of bookings) {
    if (!booking.consultationDate || !booking.consultationTime) continue;
    const dateKey = formatLocalDateKey(booking.consultationDate);
    if (!bookedSlots.has(dateKey)) bookedSlots.set(dateKey, new Set());
    bookedSlots.get(dateKey)!.add(booking.consultationTime);
  }

  const overrideMap = new Map<string, (typeof overrides)[0]>();
  for (const override of overrides) {
    overrideMap.set(formatLocalDateKey(override.date), override);
  }

  const templateMap = new Map<number, (typeof templates)[0]>();
  for (const template of templates) {
    templateMap.set(template.dayOfWeek, template);
  }

  const days: Array<{ date: string; isAvailable: boolean; slots: string[] }> = [];
  const current = new Date(effectiveStart);

  while (current <= effectiveEnd) {
    const dateKey = formatLocalDateKey(current);
    const override = overrideMap.get(dateKey);
    const template = templateMap.get(current.getDay());

    let isAvailable = false;
    let slots: string[] = [];

    if (override) {
      isAvailable = override.isAvailable;
      if (isAvailable) {
        slots = getTimeSlots(
          override.startTime,
          override.endTime,
          override.slotDurationMinutes,
        );
      }
    } else if (template) {
      isAvailable = true;
      slots = getTimeSlots(
        template.startTime,
        template.endTime,
        BOOKING_CONFIG.consultationDurationMinutes,
      );
    }

    const booked = bookedSlots.get(dateKey);
    if (booked && slots.length > 0) {
      slots = slots.filter((slot) => !booked.has(slot));
    }
    if (slots.length === 0) isAvailable = false;

    days.push({ date: dateKey, isAvailable, slots });
    current.setDate(current.getDate() + 1);
  }

  return days;
}
