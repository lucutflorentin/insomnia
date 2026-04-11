import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function getAdminUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('insomnia_token')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as number },
      select: { name: true, role: true },
    });
    return user;
  } catch {
    return null;
  }
}

export default async function AdminDashboardPage() {
  const t = await getTranslations('admin.dashboard');
  const tBookings = await getTranslations('admin.bookings');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [user, newCount, monthCount, confirmedCount, pendingReviewCount, recentBookings, recentReviews] =
    await Promise.all([
      getAdminUser(),
      prisma.booking.count({ where: { status: 'new' } }),
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.booking.count({ where: { status: 'confirmed' } }),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: { select: { name: true, slug: true } },
        },
      }),
      prisma.review.findMany({
        where: { isApproved: false },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: { select: { name: true } },
        },
      }),
    ]);

  const stats = [
    { label: t('newBookings'), value: newCount, icon: '📩', colorClass: 'text-blue-400 bg-blue-500/10' },
    { label: t('thisMonth'), value: monthCount, icon: '📅', colorClass: 'text-green-400 bg-green-500/10' },
    { label: t('confirmed'), value: confirmedCount, icon: '✅', colorClass: 'text-emerald-400 bg-emerald-500/10' },
    { label: t('pendingReviews'), value: pendingReviewCount, icon: '⭐', colorClass: 'text-yellow-400 bg-yellow-500/10' },
  ];

  const quickActions = [
    { label: t('viewBookings'), desc: t('viewBookingsDesc'), href: '/admin/bookings' as const, icon: '📋' },
    { label: t('manageGallery'), desc: t('manageGalleryDesc'), href: '/admin/gallery' as const, icon: '🖼' },
    { label: t('setAvailability'), desc: t('setAvailabilityDesc'), href: '/admin/availability' as const, icon: '🕐' },
  ];

  const dateFormatter = new Intl.DateTimeFormat('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="font-heading text-2xl text-text-primary">
          {t('welcome')}{user ? `, ${user.name}` : ''}! 👋
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {t('todayIs')} {dateFormatter.format(now)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-bg-secondary p-5 transition-colors hover:border-border/80"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">{stat.label}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${stat.colorClass}`}>
                {stat.icon}
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-text-primary">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-text-primary">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-start gap-4 rounded-xl border border-border bg-bg-secondary p-4 transition-all hover:border-accent/30 hover:bg-bg-secondary/80"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xl">
                {action.icon}
              </span>
              <div>
                <p className="font-medium text-text-primary group-hover:text-accent transition-colors">
                  {action.label}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Bookings + Reviews */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bookings - 2/3 width */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-bg-secondary">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-medium text-text-primary">{t('recentBookings')}</h2>
            <Link
              href="/admin/bookings"
              className="text-sm text-accent hover:underline"
            >
              {t('viewAll')} →
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
                      className="border-b border-border/50 text-sm transition-colors hover:bg-white/[0.02]"
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

        {/* Recent Reviews - 1/3 width */}
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-medium text-text-primary">{t('recentReviews')}</h2>
            <Link
              href="/admin/reviews"
              className="text-sm text-accent hover:underline"
            >
              {t('viewAll')} →
            </Link>
          </div>

          {recentReviews.length === 0 ? (
            <p className="p-6 text-center text-sm text-text-muted">
              {t('noReviews')}
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {recentReviews.map((review) => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary">{review.clientName}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-xs ${i < review.rating ? 'text-yellow-400' : 'text-text-muted/30'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {review.artist?.name}
                  </p>
                  {review.reviewTextRo && (
                    <p className="mt-2 line-clamp-2 text-xs text-text-secondary">
                      &ldquo;{review.reviewTextRo}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
