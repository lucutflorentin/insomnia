import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';

// GET /api/admin/export/bookings — Export bookings as CSV (SUPER_ADMIN only)
export async function GET(request: NextRequest) {
  try {
    await verifyRole(request, ['SUPER_ADMIN']);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (from || to) {
      where.consultationDate = {};
      if (from) (where.consultationDate as Record<string, unknown>).gte = new Date(from);
      if (to) (where.consultationDate as Record<string, unknown>).lte = new Date(to);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        artist: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // CSV header
    const headers = [
      'Cod Referinta',
      'Client',
      'Email',
      'Telefon',
      'Artist',
      'Data Consultatie',
      'Ora',
      'Zona Corp',
      'Dimensiune',
      'Stil',
      'Status',
      'Sursa',
      'Descriere',
      'Note Admin',
      'Data Creare',
    ];

    // CSV rows
    const rows = bookings.map((b) => [
      b.referenceCode,
      escapeCsvField(b.clientName),
      b.clientEmail,
      b.clientPhone || '',
      b.artist.name,
      b.consultationDate ? new Date(b.consultationDate).toLocaleDateString('ro-RO') : 'De stabilit',
      b.consultationTime || '',
      b.bodyArea || '',
      b.sizeCategory || '',
      b.stylePreference || '',
      b.status,
      b.source || '',
      escapeCsvField(b.description || ''),
      escapeCsvField(b.adminNotes || ''),
      new Date(b.createdAt).toLocaleDateString('ro-RO'),
    ]);

    // Build CSV content with BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const filename = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export bookings error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized or export failed' },
      { status: 401 },
    );
  }
}

function escapeCsvField(value: string): string {
  if (!value) return '';
  // If the value contains comma, newline, or quote, wrap in quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
