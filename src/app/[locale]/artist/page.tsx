'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarDays, Users, Star, MessageSquare } from 'lucide-react';
import PushToggle from '@/components/ui/PushToggle';

interface Stats {
  monthBookings: number;
  totalBookings: number;
  totalReviews: number;
  averageRating: number;
  upcomingBookings: {
    id: number;
    clientName: string;
    consultationDate: string | null;
    consultationTime: string | null;
    status: string;
    sizeCategory: string;
    bodyArea: string | null;
  }[];
  recentReviews: {
    id: number;
    rating: number;
    reviewTextRo: string | null;
    reviewTextEn: string | null;
    isApproved: boolean;
    createdAt: string;
    user: { name: string } | null;
  }[];
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-green-500/20 text-green-400',
};

export default function ArtistDashboardPage() {
  const t = useTranslations('artist.dashboard');
  const tBookings = useTranslations('artist.bookings');
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/artist/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">
            {t('welcome', { name: user?.name || '' })}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
        </div>
        <PushToggle />
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { key: 'monthBookings', value: stats?.monthBookings ?? 0, icon: CalendarDays },
          { key: 'totalBookings', value: stats?.totalBookings ?? 0, icon: Users },
          { key: 'averageRating', value: stats?.averageRating ?? 0, icon: Star },
          { key: 'totalReviews', value: stats?.totalReviews ?? 0, icon: MessageSquare },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className="rounded-sm border border-border bg-bg-secondary p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {stat.key === 'averageRating' && stat.value > 0
                      ? `${stat.value}/5`
                      : stat.value}
                  </p>
                  <p className="text-xs text-text-muted">{t(`stats.${stat.key}`)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two columns: upcoming bookings + recent reviews */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Upcoming bookings */}
        <div className="rounded-sm border border-border bg-bg-secondary p-6">
          <h2 className="mb-4 font-heading text-lg text-text-primary">{t('upcoming')}</h2>
          {stats?.upcomingBookings.length === 0 ? (
            <p className="text-sm text-text-muted">{t('noUpcoming')}</p>
          ) : (
            <div className="space-y-3">
              {stats?.upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-sm bg-bg-tertiary p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {booking.clientName}
                    </p>
                    <p className="text-xs text-text-muted">
                      {booking.consultationDate
                        ? `${new Date(booking.consultationDate).toLocaleDateString('ro-RO')}${booking.consultationTime ? ` — ${booking.consultationTime}` : ''}`
                        : 'Programare in curs de stabilire'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[booking.status] || 'bg-gray-500/20 text-gray-400'}`}
                  >
                    {tBookings(`statusLabels.${booking.status}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent reviews */}
        <div className="rounded-sm border border-border bg-bg-secondary p-6">
          <h2 className="mb-4 font-heading text-lg text-text-primary">{t('recentReviews')}</h2>
          {stats?.recentReviews.length === 0 ? (
            <p className="text-sm text-text-muted">{t('noReviews')}</p>
          ) : (
            <div className="space-y-3">
              {stats?.recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-sm bg-bg-tertiary p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-accent">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {review.user?.name || 'Client'}
                    </span>
                  </div>
                  {(review.reviewTextRo || review.reviewTextEn) && (
                    <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                      {review.reviewTextRo || review.reviewTextEn}
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
