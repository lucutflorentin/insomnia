'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import ReviewFormModal from '@/components/features/reviews/ReviewFormModal';
import RescheduleModal from '@/components/features/booking/RescheduleModal';

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
  clientNotes: string | null;
  consultationDate: string | null;
  consultationTime: string | null;
  isQuickRequest?: boolean;
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
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);

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
    // Quick-form requests with no date can be cancelled anytime.
    if (!booking.consultationDate) return true;
    const consultDate = new Date(booking.consultationDate);
    const hoursUntil = (consultDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 24;
  };

  const canReschedule = (booking: Booking): boolean => {
    if (!['new', 'contacted', 'confirmed'].includes(booking.status)) return false;
    if (!booking.consultationDate) return true; // Quick form: any future slot OK
    const consultDate = new Date(booking.consultationDate);
    const hoursUntil = (consultDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 48;
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
                      {booking.consultationDate
                        ? new Date(booking.consultationDate).toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : t('pendingDate')}
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
                    {selectedBooking.consultationDate
                      ? new Date(selectedBooking.consultationDate).toLocaleDateString('ro-RO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : t('pendingDate')}
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
                {selectedBooking.clientNotes && (
                  <div className="rounded-sm border border-accent/20 bg-accent/5 p-3">
                    <p className="mb-1 text-xs font-medium text-accent">{t('studioNotes')}</p>
                    <p className="text-sm text-text-secondary">{selectedBooking.clientNotes}</p>
                  </div>
                )}
                {/* Status timeline */}
                <div>
                  <p className="mb-2 text-xs text-text-muted">Status</p>
                  <div className="flex items-center gap-0">
                    {(['new', 'contacted', 'confirmed', 'completed'] as const).map((step, i) => {
                      const steps = ['new', 'contacted', 'confirmed', 'completed'];
                      const currentIdx = steps.indexOf(selectedBooking.status);
                      const isCancelled = selectedBooking.status === 'cancelled' || selectedBooking.status === 'no_show';
                      const isReached = !isCancelled && currentIdx >= i;
                      const isCurrent = !isCancelled && currentIdx === i;
                      return (
                        <div key={step} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                                isCurrent
                                  ? 'bg-accent text-bg-primary'
                                  : isReached
                                    ? 'bg-accent/30 text-accent'
                                    : 'bg-bg-tertiary text-text-muted'
                              }`}
                            >
                              {isReached ? '✓' : i + 1}
                            </div>
                            <span className={`mt-1 text-[10px] ${isCurrent ? 'font-medium text-accent' : 'text-text-muted'}`}>
                              {t(`status.${step}`)}
                            </span>
                          </div>
                          {i < 3 && (
                            <div className={`mx-1 h-0.5 w-4 ${isReached && i < currentIdx ? 'bg-accent/30' : 'bg-bg-tertiary'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {(selectedBooking.status === 'cancelled' || selectedBooking.status === 'no_show') && (
                    <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[selectedBooking.status]}`}>
                      {t(`status.${selectedBooking.status}`)}
                    </span>
                  )}
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

                {/* Reschedule button */}
                {canReschedule(selectedBooking) && (
                  <div className="pt-2">
                    <Button
                      variant="secondary"
                      className="w-full"
                      size="sm"
                      onClick={() => setRescheduleBooking(selectedBooking)}
                    >
                      {t('reschedule.cta')}
                    </Button>
                    <p className="mt-2 text-xs text-text-muted">{t('reschedule.notice')}</p>
                  </div>
                )}

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
                    <Button
                      variant="secondary"
                      className="w-full"
                      size="sm"
                      onClick={() => setReviewBookingId(selectedBooking.id)}
                    >
                      {t('leaveReview')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <RescheduleModal
          isOpen={rescheduleBooking !== null}
          onClose={() => setRescheduleBooking(null)}
          booking={{
            id: rescheduleBooking.id,
            referenceCode: rescheduleBooking.referenceCode,
            artist: { slug: rescheduleBooking.artist.slug, name: rescheduleBooking.artist.name },
          }}
          onSuccess={(newDate, newTime) => {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === rescheduleBooking.id
                  ? { ...b, consultationDate: newDate, consultationTime: newTime, isQuickRequest: false }
                  : b,
              ),
            );
            if (selectedBooking?.id === rescheduleBooking.id) {
              setSelectedBooking({
                ...selectedBooking,
                consultationDate: newDate,
                consultationTime: newTime,
                isQuickRequest: false,
              });
            }
          }}
        />
      )}

      {/* Review Form Modal */}
      {reviewBookingId && selectedBooking && (
        <ReviewFormModal
          isOpen={reviewBookingId !== null}
          onClose={() => setReviewBookingId(null)}
          bookingId={reviewBookingId}
          artistName={selectedBooking.artist?.name || ''}
          onSuccess={() => {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === reviewBookingId ? { ...b, hasReview: true } : b,
              ),
            );
            if (selectedBooking?.id === reviewBookingId) {
              setSelectedBooking({ ...selectedBooking, hasReview: true });
            }
            setReviewBookingId(null);
          }}
        />
      )}
    </div>
  );
}
