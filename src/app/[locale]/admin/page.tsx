import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/navigation';

export default async function AdminDashboardPage() {
  const t = await getTranslations('admin.dashboard');
  const tBookings = await getTranslations('admin.bookings');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [newCount, monthCount, confirmedCount, recentBookings] =
    await Promise.all([
      prisma.booking.count({ where: { status: 'new' } }),
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.booking.count({ where: { status: 'confirmed' } }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: { select: { name: true, slug: true } },
        },
      }),
    ]);

  const stats = [
    { label: t('newBookings'), value: newCount, colorClass: 'text-accent' },
    { label: t('thisMonth'), value: monthCount, colorClass: 'text-success' },
    { label: t('confirmed'), value: confirmedCount, colorClass: 'text-warning' },
  ];

  return (
    <div>
      <h1 className="mb-8 font-heading text-2xl text-text-primary">
        {t('title')}
      </h1>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-bg-secondary p-6"
          >
            <p className="text-sm text-text-secondary">{stat.label}</p>
            <p className={`mt-2 text-3xl font-bold ${stat.colorClass}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="rounded-lg border border-border bg-bg-secondary">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg text-text-primary">{t('recentBookings')}</h2>
          <Link
            href="/admin/bookings"
            className="text-sm text-accent hover:underline"
          >
            {tBookings('title')} →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="p-6 text-center text-text-muted">
            {tBookings('noBookings')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted">
                  <th className="px-6 py-3">{t('code')}</th>
                  <th className="px-6 py-3">{t('client')}</th>
                  <th className="px-6 py-3">{t('artist')}</th>
                  <th className="px-6 py-3">{t('status')}</th>
                  <th className="px-6 py-3">{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-border/50 text-sm"
                  >
                    <td className="px-6 py-3 font-mono text-accent">
                      {booking.referenceCode}
                    </td>
                    <td className="px-6 py-3 text-text-primary">
                      {booking.clientName}
                    </td>
                    <td className="px-6 py-3 text-text-secondary">
                      {booking.artist.name}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={booking.status} label={tBookings(`status.${booking.status}`)} />
                    </td>
                    <td className="px-6 py-3 text-text-secondary">
                      {new Date(booking.createdAt).toLocaleDateString('ro-RO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    contacted: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-green-500/20 text-green-400',
    completed: 'bg-accent/20 text-accent',
    cancelled: 'bg-red-500/20 text-red-400',
    no_show: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || colors.new}`}
    >
      {label}
    </span>
  );
}
