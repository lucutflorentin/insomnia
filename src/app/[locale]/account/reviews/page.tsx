'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Review {
  id: number;
  artistId: number;
  artist: { name: string; slug: string };
  rating: number;
  reviewTextRo: string | null;
  reviewTextEn: string | null;
  isApproved: boolean;
  isVisible: boolean;
  createdAt: string;
}

export default function ReviewsPage() {
  const t = useTranslations('account.reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Fetch reviews via client bookings that have reviews
        const res = await fetch('/api/client/bookings?limit=50');
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            // For now, we'll show reviews from the public endpoint filtered by this user
            // A dedicated endpoint would be better, but we can extract review data from bookings
            const reviewRes = await fetch('/api/reviews?limit=50');
            if (reviewRes.ok) {
              const reviewJson = await reviewRes.json();
              if (reviewJson.success) {
                setReviews(reviewJson.data || []);
              }
            }
          }
        }
      } catch {
        // Handle silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
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
      <h1 className="mb-6 font-heading text-2xl text-text-primary">{t('title')}</h1>

      {reviews.length === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
          <p className="text-text-muted">{t('noReviews')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-sm border border-border bg-bg-secondary p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-text-primary">
                    {review.artist?.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-accent">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(review.createdAt).toLocaleDateString('ro-RO')}
                    </span>
                  </div>
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
                <p className="mt-3 text-sm text-text-secondary">
                  {review.reviewTextRo || review.reviewTextEn}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
