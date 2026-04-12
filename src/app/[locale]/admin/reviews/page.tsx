'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Star, Loader2, BarChart3, ArrowUpDown, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Review {
  id: number;
  clientName: string;
  artist: { id: number; name: string; slug: string } | null;
  user: { id: number; name: string; email: string } | null;
  rating: number;
  reviewTextRo: string | null;
  reviewTextEn: string | null;
  isApproved: boolean;
  isVisible: boolean;
  createdAt: string;
}

type SortField = 'date' | 'rating';
type SortDir = 'asc' | 'desc';

export default function AdminReviewsPage() {
  const t = useTranslations('admin.reviews');
  const locale = useLocale();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New: sort and artist filter state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [artistFilter, setArtistFilter] = useState<string>('all');

  const dateLocale = locale === 'ro' ? 'ro-RO' : 'en-US';

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    hidden: 'bg-gray-500/20 text-gray-400',
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const json = await res.json();
        const list = json.success ? json.data : json;
        setReviews(Array.isArray(list) ? list : []);
      } else {
        showToast(t('fetchError'), 'error');
      }
    } catch {
      showToast(t('fetchError'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (reviewId: number) => {
    const actionKey = `approve-${reviewId}`;
    setActionLoading(actionKey);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true, isVisible: true }),
      });
      if (res.ok) {
        showToast(t('approveSuccess'), 'success');
        fetchReviews();
      } else {
        showToast(t('actionError'), 'error');
      }
    } catch {
      showToast(t('actionError'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleHide = async (reviewId: number) => {
    const actionKey = `hide-${reviewId}`;
    setActionLoading(actionKey);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: false }),
      });
      if (res.ok) {
        showToast(t('hideSuccess'), 'success');
        fetchReviews();
      } else {
        showToast(t('actionError'), 'error');
      }
    } catch {
      showToast(t('actionError'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${deleteTarget}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(t('deleteSuccess'), 'success');
        fetchReviews();
      } else {
        showToast(t('actionError'), 'error');
      }
    } catch {
      showToast(t('actionError'), 'error');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const getStatus = (r: Review) =>
    r.isApproved ? 'approved' : !r.isVisible ? 'hidden' : 'pending';

  // Stats computed from all reviews
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return { avgRating: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
    }
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = sum / total;
    // distribution[0] = 1-star count, distribution[4] = 5-star count
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating - 1]++;
      }
    });
    return { avgRating, total, distribution };
  }, [reviews]);

  // Unique artists for filter dropdown
  const artistOptions = useMemo(() => {
    const artistMap = new Map<string, string>();
    reviews.forEach((r) => {
      if (r.artist) {
        artistMap.set(String(r.artist.id), r.artist.name);
      }
    });
    return [
      { value: 'all', label: t('allArtists') },
      ...Array.from(artistMap.entries()).map(([id, name]) => ({
        value: id,
        label: name,
      })),
    ];
  }, [reviews, t]);

  // Filtered, artist-filtered, and sorted reviews
  const filteredReviews = useMemo(() => {
    let result = reviews;

    // Status filter
    if (activeFilter !== 'all') {
      result = result.filter((r) => getStatus(r) === activeFilter);
    }

    // Artist filter
    if (artistFilter !== 'all') {
      result = result.filter((r) => r.artist && String(r.artist.id) === artistFilter);
    }

    // Sort
    return [...result].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'date') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
      if (sortField === 'rating') {
        return (a.rating - b.rating) * dir;
      }
      return 0;
    });
  }, [reviews, activeFilter, artistFilter, sortField, sortDir]);

  const filterTabs = [
    { key: 'all', label: t('all'), count: reviews.length },
    { key: 'pending', label: t('pending'), count: reviews.filter((r) => getStatus(r) === 'pending').length },
    { key: 'approved', label: t('approved'), count: reviews.filter((r) => getStatus(r) === 'approved').length },
    { key: 'hidden', label: t('hidden'), count: reviews.filter((r) => getStatus(r) === 'hidden').length },
  ];

  const renderStars = (rating: number, size: string = 'h-4 w-4') => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`${size} ${i < rating ? 'fill-warning text-warning' : 'text-text-muted'}`}
          />
        ))}
      </div>
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'date' ? 'desc' : 'desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-text-muted" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 inline h-3.5 w-3.5 text-accent" />
    ) : (
      <ChevronDown className="ml-1 inline h-3.5 w-3.5 text-accent" />
    );
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
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-accent" />
        <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
      </div>

      {/* Statistics Bar */}
      {reviews.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Average Rating */}
          <div className="rounded-sm border border-border bg-bg-secondary p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{t('avgRating')}</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-accent">{stats.avgRating.toFixed(1)}</span>
              {renderStars(Math.round(stats.avgRating), 'h-5 w-5')}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {stats.total} {t('totalReviews')}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="rounded-sm border border-border bg-bg-secondary p-4 col-span-1 md:col-span-2">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3">{t('ratingDistribution')}</p>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star - 1];
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-right text-text-secondary">{star}</span>
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    <div className="flex-1 h-2 rounded-full bg-bg-primary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-warning transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-text-muted">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-1 rounded-sm border border-border bg-bg-primary p-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex-1 rounded-sm px-4 py-2 text-sm transition-colors ${
              activeFilter === tab.key
                ? 'bg-bg-secondary text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Artist Filter + Sort controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <Select
            options={artistOptions}
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
            className="!py-2 text-sm min-w-[160px]"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => handleSort('date')}
            className={`flex items-center gap-1 rounded-sm border px-3 py-2 text-xs transition-colors ${
              sortField === 'date'
                ? 'border-accent/30 bg-accent/5 text-accent'
                : 'border-border text-text-muted hover:text-text-secondary'
            }`}
          >
            {t('date')} <SortIcon field="date" />
          </button>
          <button
            onClick={() => handleSort('rating')}
            className={`flex items-center gap-1 rounded-sm border px-3 py-2 text-xs transition-colors ${
              sortField === 'rating'
                ? 'border-accent/30 bg-accent/5 text-accent'
                : 'border-border text-text-muted hover:text-text-secondary'
            }`}
          >
            {t('rating')} <SortIcon field="rating" />
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
          <p className="text-text-muted">{t('noReviews')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border bg-bg-secondary">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted">
                <th className="px-4 py-3">{t('client')}</th>
                <th className="px-4 py-3">{t('artist')}</th>
                <th className="px-4 py-3">{t('rating')}</th>
                <th className="px-4 py-3">{t('review')}</th>
                <th className="px-4 py-3">{t('date')}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr
                  key={review.id}
                  className="border-b border-border/50 text-sm"
                >
                  <td className="px-4 py-3 text-text-primary">{review.user?.name || review.clientName}</td>
                  <td className="px-4 py-3 text-text-secondary">{review.artist?.name || '-'}</td>
                  <td className="px-4 py-3">{renderStars(review.rating)}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-text-secondary">
                    {review.reviewTextRo || review.reviewTextEn || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                    {new Date(review.createdAt).toLocaleDateString(dateLocale)}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const s = getStatus(review);
                      return (
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusColors[s] || statusColors.pending
                          }`}
                        >
                          {t(s)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {getStatus(review) !== 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprove(review.id)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === `approve-${review.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t('approve')
                          )}
                        </Button>
                      )}
                      {getStatus(review) !== 'hidden' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHide(review.id)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === `hide-${review.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t('hide')
                          )}
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(review.id)}
                        disabled={actionLoading !== null}
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={t('delete')}
        message={t('confirmDelete')}
        confirmLabel={t('delete')}
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
