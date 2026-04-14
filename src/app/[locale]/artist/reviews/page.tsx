'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Review {
  id: number;
  rating: number;
  reviewTextRo: string | null;
  reviewTextEn: string | null;
  isApproved: boolean;
  isVisible: boolean;
  createdAt: string;
  user: { name: string } | null;
}

export default function ArtistReviewsPage() {
  const t = useTranslations('artist.reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/artist/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Stats endpoint returns recentReviews, but we need all reviews
          // Fetch from the reviews API for the artist's slug
          setReviews(data.data.recentReviews || []);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    // Also fetch all reviews via the dedicated endpoint
    fetch('/api/artist/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setReviews(data.data || []);
      })
      .catch(() => {});
  }, []);

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

  // Star distribution
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-text-primary">{t('title')}</h1>

      {totalReviews === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
          <p className="text-text-muted">{t('noReviews')}</p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-sm border border-border bg-bg-secondary p-5 text-center">
              <p className="text-3xl font-bold text-accent">{averageRating}</p>
              <p className="text-sm text-text-muted">{t('averageRating')}</p>
              <div className="mt-1 text-accent">
                {'★'.repeat(Math.round(averageRating))}
                {'☆'.repeat(5 - Math.round(averageRating))}
              </div>
            </div>
            <div className="rounded-sm border border-border bg-bg-secondary p-5 text-center">
              <p className="text-3xl font-bold text-text-primary">{totalReviews}</p>
              <p className="text-sm text-text-muted">{t('totalReviews')}</p>
            </div>
            <div className="rounded-sm border border-border bg-bg-secondary p-5">
              <p className="mb-2 text-sm text-text-muted">{t('distribution')}</p>
              {distribution.map((d) => (
                <div key={d.stars} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-right text-text-muted">{d.stars}★</span>
                  <div className="flex-1 rounded-full bg-bg-tertiary h-2">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${totalReviews > 0 ? (d.count / totalReviews) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-6 text-text-muted">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews list */}
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-sm border border-border bg-bg-secondary p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </span>
                      <span className="text-sm text-text-muted">
                        {review.user?.name || 'Client'}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(review.createdAt).toLocaleDateString('ro-RO')}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      review.isApproved
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {review.isApproved ? t('status.approved') : t('status.pending')}
                  </span>
                </div>
                {(review.reviewTextRo || review.reviewTextEn) && (
                  <p className="mt-2 text-sm text-text-secondary">
                    {review.reviewTextRo || review.reviewTextEn}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
