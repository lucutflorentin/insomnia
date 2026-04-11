'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

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

const statusLabels: Record<string, string> = {
  pending: 'In asteptare',
  approved: 'Aprobata',
  hidden: 'Ascunsa',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  hidden: 'bg-gray-500/20 text-gray-400',
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const json = await res.json();
        const list = json.success ? json.data : json;
        setReviews(Array.isArray(list) ? list : []);
      }
    } catch {
      // Handle silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (reviewId: number, action: 'approve' | 'hide' | 'delete') => {
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/admin/reviews/${reviewId}`, {
          method: 'DELETE',
        });
        if (res.ok) fetchReviews();
      } else {
        const body = action === 'approve'
          ? { isApproved: true, isVisible: true }
          : { isVisible: false };
        const res = await fetch(`/api/admin/reviews/${reviewId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) fetchReviews();
      }
    } catch {
      // Handle silently
    }
  };

  const getStatus = (r: Review) =>
    r.isApproved ? 'approved' : !r.isVisible ? 'hidden' : 'pending';

  const filteredReviews = activeFilter === 'all'
    ? reviews
    : reviews.filter((r) => getStatus(r) === activeFilter);

  const filterTabs = [
    { key: 'all', label: 'Toate', count: reviews.length },
    { key: 'pending', label: 'In asteptare', count: reviews.filter((r) => getStatus(r) === 'pending').length },
    { key: 'approved', label: 'Aprobate', count: reviews.filter((r) => getStatus(r) === 'approved').length },
    { key: 'hidden', label: 'Ascunse', count: reviews.filter((r) => getStatus(r) === 'hidden').length },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg
            key={i}
            className={`h-4 w-4 ${i < rating ? 'text-warning' : 'text-text-muted'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
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
      <h1 className="mb-6 font-heading text-2xl text-text-primary">Recenzii</h1>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-1 rounded-sm border border-border bg-bg-primary p-1">
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

      {/* Reviews Table */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
          <p className="text-text-muted">Nu exista recenzii in aceasta categorie.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border bg-bg-secondary">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Artist</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Recenzie</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actiuni</th>
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
                    {new Date(review.createdAt).toLocaleDateString('ro-RO')}
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
                          {statusLabels[s] || s}
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
                          onClick={() => handleAction(review.id, 'approve')}
                        >
                          Aproba
                        </Button>
                      )}
                      {getStatus(review) !== 'hidden' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction(review.id, 'hide')}
                        >
                          Ascunde
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleAction(review.id, 'delete')}
                      >
                        Sterge
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
