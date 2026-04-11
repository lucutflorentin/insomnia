import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';

// GET /api/admin/export/clients — Export clients as CSV (SUPER_ADMIN only)
export async function GET(request: NextRequest) {
  try {
    await verifyRole(request, ['SUPER_ADMIN']);

    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        bookings: {
          select: { id: true, status: true },
        },
        loyaltyTransactions: {
          where: { type: 'earn' },
          select: { points: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // CSV header
    const headers = [
      'ID',
      'Nume',
      'Email',
      'Telefon',
      'Total Bookings',
      'Bookings Completate',
      'Bookings Anulate',
      'Puncte Fidelitate',
      'Data Inregistrare',
    ];

    // CSV rows
    const rows = clients.map((c) => {
      const totalBookings = c.bookings.length;
      const completedBookings = c.bookings.filter((b) => b.status === 'completed').length;
      const cancelledBookings = c.bookings.filter((b) => b.status === 'cancelled').length;
      const loyaltyPoints = c.loyaltyTransactions.reduce((sum, t) => sum + t.points, 0);

      return [
        String(c.id),
        escapeCsvField(c.name),
        c.email,
        c.phone || '',
        String(totalBookings),
        String(completedBookings),
        String(cancelledBookings),
        String(loyaltyPoints),
        new Date(c.createdAt).toLocaleDateString('ro-RO'),
      ];
    });

    // Build CSV content with BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const filename = `clients-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export clients error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized or export failed' },
      { status: 401 },
    );
  }
}

function escapeCsvField(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
