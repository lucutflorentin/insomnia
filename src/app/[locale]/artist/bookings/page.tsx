'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/Toast';

interface Booking {
  id: number;
  referenceCode: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  bodyArea: string | null;
  sizeCategory: string;
  stylePreference: string | null;
  description: string | null;
  consultationDate: string | null;
  consultationTime: string | null;
  isQuickRequest?: boolean;
  status: string;
  adminNotes: string | null;
  clientNotes: string | null;
  createdAt: string;
}

const STATUSES = ['new', 'contacted', 'confirmed', 'completed', 'rejected', 'cancelled', 'no_show'];

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-green-500/20 text-green-400',
  completed: 'bg-purple-500/20 text-purple-400',
  rejected: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-red-500/20 text-red-400',
  no_show: 'bg-gray-500/20 text-gray-400',
};

export default function ArtistBookingsPage() {
  const t = useTranslations('artist.bookings');
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [clientNotes, setClientNotes] = useState('');
  const [filter, setFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetch('/api/bookings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBookings(data.data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'upcoming') {
      return ['new', 'contacted', 'confirmed'].includes(b.status);
    }
    if (filter === 'past') {
      return ['completed', 'cancelled', 'no_show'].includes(b.status);
    }
    return true;
  });

  const handleStatusUpdate = async (bookingId: number, newStatus: string, notes?: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminNotes: notes, clientNotes: clientNotes || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus, adminNotes: notes || b.adminNotes } : b)),
        );
        if (selected?.id === bookingId) {
          setSelected((prev) => prev ? { ...prev, status: newStatus } : null);
        }
        showToast(t('updateStatus') + ' ✓', 'success');
      } else {
        showToast(data.error || 'Error', 'error');
      }
    } catch {
      showToast('Error', 'error');
    } finally {
      setUpdatingStatus(false);
    }
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
      <h1 className="mb-6 font-heading text-2xl text-text-primary">{t('title')}</h1>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {(['all', 'upcoming', 'past'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-sm px-4 py-2 text-sm transition-colors ${
              filter === f
                ? 'bg-accent/10 text-accent'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
          <p className="text-text-muted">{t('noBookings')}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Booking list */}
          <div className="space-y-2">
            {filteredBookings.map((booking) => (
              <button
                key={booking.id}
                onClick={() => { setSelected(booking); setClientNotes(booking.clientNotes || ''); }}
                className={`w-full rounded-sm border p-4 text-left transition-colors ${
                  selected?.id === booking.id
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-bg-secondary hover:border-accent/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{booking.clientName}</p>
                    <p className="text-xs text-text-muted">
                      {booking.consultationDate
                        ? `${new Date(booking.consultationDate).toLocaleDateString('ro-RO')}${booking.consultationTime ? ` — ${booking.consultationTime}` : ''}`
                        : t('pendingDate')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[booking.status] || ''}`}
                  >
                    {t(`statusLabels.${booking.status}`)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="rounded-sm border border-border bg-bg-secondary p-6">
              <h3 className="mb-4 font-heading text-lg text-text-primary">
                {selected.clientName}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('date')}</span>
                  <span>
                    {selected.consultationDate
                      ? new Date(selected.consultationDate).toLocaleDateString('ro-RO')
                      : t('pendingDate')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('time')}</span>
                  <span>{selected.consultationTime}</span>
                </div>
                {selected.bodyArea && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t('area')}</span>
                    <span className="capitalize">{selected.bodyArea}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('size')}</span>
                  <span className="capitalize">{selected.sizeCategory}</span>
                </div>
                {selected.stylePreference && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t('style')}</span>
                    <span className="capitalize">{selected.stylePreference}</span>
                  </div>
                )}
                {selected.description && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-text-muted">{t('description')}</p>
                    <p className="mt-1 text-text-secondary">{selected.description}</p>
                  </div>
                )}

                {/* Contact info */}
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-text-muted">{t('client')}</p>
                  <p className="mt-1">{selected.clientPhone}</p>
                  <p className="text-text-muted">{selected.clientEmail}</p>
                </div>

                {/* Client-facing notes */}
                <div className="border-t border-border pt-3">
                  <p className="mb-1 text-xs text-text-muted">{t('clientNotes')}</p>
                  <textarea
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder={t('clientNotesPlaceholder')}
                    className="w-full rounded-sm border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                  <p className="mt-0.5 text-xs text-text-muted">{t('clientNotesHint')}</p>
                </div>

                {/* Status update */}
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-xs text-text-muted">{t('updateStatus')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        disabled={s === selected.status || updatingStatus}
                        onClick={() => handleStatusUpdate(selected.id, s, selected.adminNotes || undefined)}
                        className={`rounded-sm px-2.5 py-1 text-xs transition-colors ${
                          s === selected.status
                            ? statusColors[s]
                            : 'border border-border text-text-muted hover:border-accent/30 hover:text-text-primary disabled:opacity-40'
                        }`}
                      >
                        {t(`statusLabels.${s}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
