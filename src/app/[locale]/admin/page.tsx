'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Inbox,
  CalendarDays,
  CheckCircle,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  ClipboardList,
  Image,
  Clock,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  newBookings: number;
  monthBookings: number;
  confirmedBookings: number;
  pendingReviews: number;
  conversionRate: number;
  avgRating: number;
  totalReviews: number;
  newClients: number;
  monthTrend: number;
}

interface DashboardData {
  stats: DashboardStats;
  charts: {
    monthlyTrend: { month: string; bookings: number }[];
    bookingsPerArtist: { name: string; bookings: number }[];
    styleDistribution: { name: string; value: number }[];
  };
  recentBookings: {
    id: number;
    referenceCode: string;
    clientName: string;
    artistName: string;
    status: string;
    createdAt: string;
  }[];
  recentReviews: {
    id: number;
    clientName: string;
    artistName: string;
    rating: number;
    text: string;
  }[];
}

const PIE_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#38BDF8', '#4ADE80'];

export default function AdminDashboardPage() {
  const t = useTranslations('admin.dashboard');
  const tBookings = useTranslations('admin.bookings');
  const locale = useLocale();
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json.data);
      }
    } catch {
      // Will show empty state
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dateStr = new Intl.DateTimeFormat(locale === 'ro' ? 'ro-RO' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-xl bg-bg-secondary" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-bg-secondary" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-bg-secondary" />
          <div className="h-64 animate-pulse rounded-xl bg-bg-secondary" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <BarChart3 className="h-12 w-12 mb-3 opacity-40" />
        <p>{t('noData')}</p>
      </div>
    );
  }

  const { stats, charts } = data;

  const statCards = [
    { label: t('newBookings'), value: stats.newBookings, icon: Inbox, color: 'text-blue-400 bg-blue-500/10' },
    { label: t('thisMonth'), value: stats.monthBookings, icon: CalendarDays, color: 'text-green-400 bg-green-500/10', trend: stats.monthTrend },
    { label: t('confirmed'), value: stats.confirmedBookings, icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10' },
    { label: t('pendingReviews'), value: stats.pendingReviews, icon: Star, color: 'text-yellow-400 bg-yellow-500/10' },
    { label: t('conversionRate'), value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'text-purple-400 bg-purple-500/10' },
    { label: t('avgRating'), value: stats.avgRating > 0 ? `${stats.avgRating}/5` : '—', icon: Star, color: 'text-orange-400 bg-orange-500/10' },
    { label: t('totalReviews'), value: stats.totalReviews, icon: BarChart3, color: 'text-cyan-400 bg-cyan-500/10' },
    { label: t('newClients'), value: stats.newClients, icon: Users, color: 'text-pink-400 bg-pink-500/10' },
  ];

  const quickActions = [
    { label: t('viewBookings'), desc: t('viewBookingsDesc'), href: '/admin/bookings' as const, icon: ClipboardList },
    { label: t('manageGallery'), desc: t('manageGalleryDesc'), href: '/admin/gallery' as const, icon: Image },
    { label: t('setAvailability'), desc: t('setAvailabilityDesc'), href: '/admin/availability' as const, icon: Clock },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">
            {t('welcome')}{user ? `, ${user.name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-text-muted capitalize">{dateStr}</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-bg-secondary p-5 transition-colors hover:border-border-light"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">{stat.label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
                {'trend' in stat && stat.trend !== undefined && stat.trend !== 0 && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${stat.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.trend > 0 ? '+' : ''}{stat.trend}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        {charts.monthlyTrend.length > 0 && (
          <div className="rounded-xl border border-border bg-bg-secondary p-6">
            <h2 className="mb-4 text-lg font-medium text-text-primary">{t('monthlyTrend')}</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={charts.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="month" tick={{ fill: '#A0A0A0', fontSize: 12 }} />
                <YAxis tick={{ fill: '#A0A0A0', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                  labelStyle={{ color: '#F5F5F5' }}
                  itemStyle={{ color: '#60A5FA' }}
                />
                <Line type="monotone" dataKey="bookings" stroke="#60A5FA" strokeWidth={2} dot={{ r: 4, fill: '#60A5FA' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bookings per Artist */}
        {charts.bookingsPerArtist.length > 0 && (
          <div className="rounded-xl border border-border bg-bg-secondary p-6">
            <h2 className="mb-4 text-lg font-medium text-text-primary">{t('bookingsPerArtist')}</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={charts.bookingsPerArtist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="name" tick={{ fill: '#A0A0A0', fontSize: 12 }} />
                <YAxis tick={{ fill: '#A0A0A0', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                  labelStyle={{ color: '#F5F5F5' }}
                  itemStyle={{ color: '#34D399' }}
                />
                <Bar dataKey="bookings" fill="#34D399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Style Distribution */}
        {charts.styleDistribution.length > 0 && (
          <div className="rounded-xl border border-border bg-bg-secondary p-6">
            <h2 className="mb-4 text-lg font-medium text-text-primary">{t('styleDistribution')}</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={charts.styleDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {charts.styleDistribution.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                  labelStyle={{ color: '#F5F5F5' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-text-primary">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-start gap-4 rounded-xl border border-border bg-bg-secondary p-4 transition-all hover:border-accent/30 hover:bg-bg-secondary/80"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="font-medium text-text-primary group-hover:text-accent transition-colors">
                    {action.label}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 mt-1 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Bookings + Reviews */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bookings - 2/3 width */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-bg-secondary">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-medium text-text-primary">{t('recentBookings')}</h2>
            <Link href="/admin/bookings" className="text-sm text-accent hover:underline flex items-center gap-1">
              {t('viewAll')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {data.recentBookings.length === 0 ? (
            <p className="p-6 text-center text-text-muted">{tBookings('noBookings')}</p>
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
                  {data.recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border/50 text-sm transition-colors hover:bg-white/[0.02]">
                      <td className="px-6 py-3 font-mono text-accent">{booking.referenceCode}</td>
                      <td className="px-6 py-3 text-text-primary">{booking.clientName}</td>
                      <td className="px-6 py-3 text-text-secondary">{booking.artistName}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={booking.status} label={tBookings(`status.${booking.status}`)} />
                      </td>
                      <td className="px-6 py-3 text-text-secondary">
                        {new Date(booking.createdAt).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US')}
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
            <Link href="/admin/reviews" className="text-sm text-accent hover:underline flex items-center gap-1">
              {t('viewAll')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {data.recentReviews.length === 0 ? (
            <p className="p-6 text-center text-sm text-text-muted">{t('noReviews')}</p>
          ) : (
            <div className="divide-y divide-border/50">
              {data.recentReviews.map((review) => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary">{review.clientName}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-text-muted/30'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">{review.artistName}</p>
                  {review.text && (
                    <p className="mt-2 line-clamp-2 text-xs text-text-secondary">
                      &ldquo;{review.text}&rdquo;
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
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || colors.new}`}>
      {label}
    </span>
  );
}
