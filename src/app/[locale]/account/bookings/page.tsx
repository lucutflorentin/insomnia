'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';

interface Booking {
  id: number;
  referenceCode: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  bodyArea: string | null;
  sizeCategory: string;
  stylePreference: string | null;
  description: string | null;
  consultationDate: string;
  consultationTime: string;
  status: string;
  hasReview: boolean;
  createdAt: string;
  artist: { id: number; name: string; slug: string };
}

export default function BookingsPage() {
  const t = useTranslations('account.bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/client/bookings');
        if (res.ok) {
          const json = await res.json();
          const list = json.success ? json.data : [];
          setBookings(Array.isArray(list) ? list : []);
        }
      } catch {
        // Handle silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const canCancel = (booking: Booking): boolean => {
    if (!['new', 'contacted'].includes(booking.status)) return false;
    const consultDate = new Date(booking.consultationDate);
    const hoursUntil = (consultDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 24;
  };

  const handleCancel = async (booking: Booking) => {
    if (!confirm(t('cancelConfirm'))) return;

    setCancellingId(booking.id);
    setCancelError('');

    try {
      const res = await fetch(`/api/client/bookings/${booking.id}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        setCancelError(data.error || t('cancelError'));
        return;
      }

      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, status: 'cancelled' } : b,
        ),
      );
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking({ ...selectedBooking, status: 'cancelled' });
      }
    } catch {
      setCancelError(t('cancelError'));
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    contacted: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-green-500/20 text-green-400',
    completed: 'bg-accent/20 text-accent',
    cancelled: 'bg-red-500/20 text-red-400',
    no_show: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-text-primary">{t('title')}</h1>

      {bookings.length === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-text-muted">{t('noBookings')}</p>
          <Link
            href="/booking"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            {t('bookNow')}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Bookings List */}
          <div className="flex-1 space-y-3">
            {bookings.map((booking) => (
              <button
                key={booking.id}
                onClick={() => { setSelectedBooking(booking); setCancelError(''); }}
                className={`w-full rounded-sm border p-4 text-left transition-colors ${
                  selectedBooking?.id === booking.id
                    ? 'border-accent/50 bg-bg-secondary'
                    : 'border-border bg-bg-secondary hover:border-border-light'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-accent">{booking.referenceCode}</p>
                    <p className="mt-1 text-sm text-text-primary">
                      {booking.artist?.name || t('artist')}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {new Date(booking.consultationDate).toLocaleDateString('ro-RO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[booking.status] || statusColors.new
                      }`}
                    >
                      {t(`status.${booking.status}`)}
                    </span>
                    {booking.status === 'completed' && !booking.hasReview && (
                      <span className="text-xs text-accent">{t('leaveReview')}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Booking Detail Panel */}
          {selectedBooking && (
            <div className="w-full rounded-sm border border-border bg-bg-secondary p-6 lg:w-96">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg text-text-primary">{t('details')}</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-text-muted transition-colors hover:text-text-primary lg:hidden"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-text-muted">{t('referenceCode')}</p>
                  <p className="font-mono text-sm text-accent">{selectedBooking.referenceCode}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">{t('artist')}</p>
                  <p className="text-sm text-text-primary">{selectedBooking.artist?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">{t('date')}</p>
                  <p className="text-sm text-text-primary">
                    {new Date(selectedBooking.consultationDate).toLocaleDateString('ro-RO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {selectedBooking.consultationTime &&
                      ` - ${selectedBooking.consultationTime}`}
                  </p>
                </div>
                {selectedBooking.bodyArea && (
                  <div>
                    <p className="text-xs text-text-muted">{t('placement')}</p>
                    <p className="text-sm text-text-primary">{selectedBooking.bodyArea}</p>
                  </div>
                )}
                {selectedBooking.sizeCategory && (
                  <div>
                    <p className="text-xs text-text-muted">{t('size')}</p>
                    <p className="text-sm text-text-primary">{selectedBooking.sizeCategory}</p>
                  </div>
                )}
                {selectedBooking.description && (
                  <div>
                    <p className="text-xs text-text-muted">{t('description')}</p>
                    <p className="text-sm text-text-secondary">{selectedBooking.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-text-muted">Status</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[selectedBooking.status] || statusColors.new
                    }`}
                  >
                    {t(`status.${selectedBooking.status}`)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-text-muted">{t('submittedAt')}</p>
                  <p className="text-sm text-text-secondary">
                    {new Date(selectedBooking.createdAt).toLocaleDateString('ro-RO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Cancel button */}
                {canCancel(selectedBooking) && (
                  <div className="pt-2">
                    {cancelError && (
                      <p className="mb-2 text-sm text-red-400">{cancelError}</p>
                    )}
                    <Button
                      variant="danger"
                      className="w-full"
                      size="sm"
                      disabled={cancellingId === selectedBooking.id}
                      onClick={() => handleCancel(selectedBooking)}
                    >
                      {cancellingId === selectedBooking.id
                        ? t('cancelling')
                        : t('cancelBooking')}
                    </Button>
                    <p className="mt-2 text-xs text-text-muted">{t('cancelNote')}</p>
                  </div>
                )}

                {selectedBooking.status === 'completed' && !selectedBooking.hasReview && (
                  <div className="pt-2">
                    <Button variant="secondary" className="w-full" size="sm">
                      {t('leaveReview')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
