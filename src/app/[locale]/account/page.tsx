'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Calendar, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Booking {
  id: number | string;
  referenceCode: string;
  artist?: { name: string; slug: string };
  artistName?: string;
  consultationDate: string | null;
  consultationTime: string | null;
  preferredDate?: string;
  status: string;
}

interface LoyaltyData {
  points: number;
  totalSessions: number;
}

interface User {
  name: string;
}

const STATUS_FLOW = ['new', 'contacted', 'confirmed', 'completed'] as const;

function formatCountdown(target: Date, now: Date): { value: string; label: string } | null {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return null;
  const minutes = Math.floor(diffMs / 60000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;
  if (days > 0) return { value: `${days}z ${hours}h`, label: 'pana la consultatie' };
  if (hours > 0) return { value: `${hours}h ${mins}m`, label: 'pana la consultatie' };
  return { value: `${mins}m`, label: 'pana la consultatie' };
}

export default function AccountDashboard() {
  const t = useTranslations('account.dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyData>({ points: 0, totalSessions: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, bookingsRes, loyaltyRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/client/bookings'),
          fetch('/api/client/loyalty'),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success) setUser(userData.data);
        }

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          const list = bookingsData.success ? bookingsData.data : [];
          setBookings(Array.isArray(list) ? list.slice(0, 3) : []);
        }

        if (loyaltyRes.ok) {
          const loyaltyData = await loyaltyRes.json();
          if (loyaltyData.success) {
            setLoyalty({
              points: loyaltyData.data.balance?.balance || 0,
              totalSessions: loyaltyData.data.balance?.totalEarned || 0,
            });
          }
        }
      } catch {
        // Silently handle errors — layout handles auth redirects
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const upcomingCount = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'new' || b.status === 'contacted'
  ).length;

  // Live "next consultation" countdown (re-renders every 60s).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nextBooking = useMemo(() => {
    const open = bookings
      .filter(
        (b) =>
          b.consultationDate &&
          ['new', 'contacted', 'confirmed'].includes(b.status),
      )
      .map((b) => ({
        ...b,
        sortKey: new Date(`${b.consultationDate}T${b.consultationTime || '00:00'}:00`).getTime(),
      }))
      .filter((b) => b.sortKey > Date.now() - 60_000)
      .sort((a, b) => a.sortKey - b.sortKey);
    return open[0] || null;
  }, [bookings]);

  const countdown = useMemo(() => {
    if (!nextBooking?.consultationDate) return null;
    const target = new Date(
      `${nextBooking.consultationDate}T${nextBooking.consultationTime || '00:00'}:00`,
    );
    return formatCountdown(target, now);
  }, [nextBooking, now]);

  const pointsInRON = loyalty.points * 50;
  const stampsFilled = Math.min(loyalty.totalSessions % 10, 10);

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    contacted: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-green-500/20 text-green-400',
    completed: 'bg-accent/20 text-accent',
    rejected: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-text-primary lg:text-3xl">
          {t('welcome', { name: user?.name?.split(' ')[0] || 'Client' })}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {t('subtitle')}
        </p>
      </div>

      {/* Next consultation hero card with live countdown */}
      {nextBooking && (
        <div className="mb-8 overflow-hidden rounded-sm border border-accent/30 bg-gradient-to-br from-accent/10 via-bg-secondary to-bg-secondary p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                Următoarea consultație
              </p>
              <p className="mt-2 font-heading text-2xl text-text-primary">
                {nextBooking.artist?.name || nextBooking.artistName || '—'}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {nextBooking.consultationDate &&
                  new Date(nextBooking.consultationDate).toLocaleDateString('ro-RO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                {nextBooking.consultationTime && ` · ${nextBooking.consultationTime}`}
              </p>
            </div>
            {countdown && (
              <div className="text-right">
                <p
                  className="font-heading text-3xl font-bold text-accent"
                  aria-live="polite"
                  aria-label={`${countdown.value} ${countdown.label}`}
                >
                  {countdown.value}
                </p>
                <p className="text-xs text-text-muted">{countdown.label}</p>
              </div>
            )}
          </div>

          {/* Status timeline */}
          <div className="mt-5 flex items-center gap-1">
            {STATUS_FLOW.map((step, i) => {
              const currentIdx = STATUS_FLOW.indexOf(nextBooking.status as (typeof STATUS_FLOW)[number]);
              const isCurrent = currentIdx === i;
              const isReached = currentIdx >= i;
              return (
                <div key={step} className="flex flex-1 items-center gap-1">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                      isCurrent
                        ? 'bg-accent text-bg-primary'
                        : isReached
                          ? 'bg-accent/30 text-accent'
                          : 'bg-bg-tertiary text-text-muted'
                    }`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isReached && !isCurrent ? '✓' : i + 1}
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 ${
                        isReached && i < currentIdx ? 'bg-accent/30' : 'bg-bg-tertiary'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/account/bookings">
              <Button size="sm" variant="secondary">
                Detalii & reprogramare
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-border bg-bg-secondary p-5">
          <p className="text-sm text-text-secondary">{t('upcomingBookings')}</p>
          <p className="mt-2 text-3xl font-bold text-accent">{upcomingCount}</p>
        </div>
        <div className="rounded-sm border border-border bg-bg-secondary p-5">
          <p className="text-sm text-text-secondary">{t('loyaltyPoints')}</p>
          <p className="mt-2 text-3xl font-bold text-success">{loyalty.points}</p>
        </div>
        <div className="rounded-sm border border-border bg-bg-secondary p-5">
          <p className="text-sm text-text-secondary">{t('equivalentRon')}</p>
          <p className="mt-2 text-3xl font-bold text-warning">{t('ronValue', { value: pointsInRON })}</p>
        </div>
      </div>

      {/* Loyalty Card Preview */}
      <div className="mb-8 rounded-sm border border-border bg-bg-secondary p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg text-text-primary">{t('loyaltyCard')}</h2>
          <Link href="/account/loyalty" className="text-sm text-accent hover:underline">
            {t('viewDetails')}
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${
                i < stampsFilled
                  ? 'border-accent bg-accent/20 text-accent'
                  : 'border-border bg-bg-primary text-text-muted'
              }`}
            >
              {i === 9 ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              ) : i < stampsFilled ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs">{i + 1}</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-text-muted">
          {t('stampsProgress', { filled: stampsFilled })}
        </p>
      </div>

      {/* Quick CTA */}
      <div className="mb-8">
        <Link href="/booking">
          <Button size="lg" className="w-full sm:w-auto">
            {t('bookSession')}
          </Button>
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="rounded-sm border border-border bg-bg-secondary">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-lg text-text-primary">{t('recentBookings')}</h2>
          <Link href="/account/bookings" className="text-sm text-accent hover:underline">
            {t('viewAll')}
          </Link>
        </div>

        {bookings.length === 0 ? (
          <p className="p-6 text-center text-text-muted">
            {t('noBookings')}
          </p>
        ) : (
          <div className="divide-y divide-border/50">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-mono text-sm text-accent">{booking.referenceCode}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {booking.artist?.name || booking.artistName || '—'} &middot;{' '}
                    {booking.consultationDate
                      ? new Date(booking.consultationDate).toLocaleDateString('ro-RO')
                      : 'de stabilit'}
                  </p>
                </div>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusColors[booking.status] || statusColors.new
                  }`}
                >
                  {t(`status.${booking.status}` as 'status.new')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
