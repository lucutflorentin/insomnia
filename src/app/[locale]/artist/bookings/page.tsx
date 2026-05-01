'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { parseDisplayReferenceImages } from '@/lib/booking';

interface Booking {
  id: number;
  referenceCode: string;
  clientId: number | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  bodyArea: string | null;
  sizeCategory: string;
  stylePreference: string | null;
  description: string | null;
  consultationDate: string | null;
  consultationTime: string | null;
  status: string;
  adminNotes: string | null;
  clientNotes: string | null;
  referenceImages: string[] | null;
  createdAt: string;
}

const STATUSES = ['new', 'contacted', 'confirmed', 'completed', 'cancelled', 'no_show'];

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-green-500/20 text-green-400',
  completed: 'bg-purple-500/20 text-purple-400',
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
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [loyaltyDialog, setLoyaltyDialog] = useState<null | { booking: Booking }>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(1);
  const [loyaltyDescription, setLoyaltyDescription] = useState('');
  const [loyaltyAwarding, setLoyaltyAwarding] = useState(false);
  const [awardedBookingIds, setAwardedBookingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/bookings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const normalized = (data.data || []).map((b: Booking) => ({
            ...b,
            referenceImages: parseDisplayReferenceImages(b.referenceImages),
          }));
          setBookings(normalized);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const selectedReferences = useMemo(
    () => parseDisplayReferenceImages(selected?.referenceImages),
    [selected],
  );

  const formatBookingDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('ro-RO') : t('unscheduled');

  const formatBookingSchedule = (date: string | null, time: string | null) =>
    date ? `${formatBookingDate(date)}${time ? ` — ${time}` : ''}` : t('unscheduled');

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
        const updatedBooking =
          selected?.id === bookingId
            ? { ...selected, status: newStatus }
            : null;
        if (updatedBooking) {
          setSelected(updatedBooking);
        }
        showToast(t('updateStatus') + ' ✓', 'success');

        // When the artist marks the session as completed and the client has
        // an account that hasn't already received loyalty for this booking,
        // surface the manual award dialog right after the status update.
        if (
          newStatus === 'completed' &&
          updatedBooking &&
          updatedBooking.clientId &&
          !awardedBookingIds.has(bookingId)
        ) {
          setLoyaltyPoints(1);
          setLoyaltyDescription('');
          setLoyaltyDialog({ booking: updatedBooking });
        }
      } else {
        showToast(data.error || 'Error', 'error');
      }
    } catch {
      showToast('Error', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAwardLoyalty = async () => {
    if (!loyaltyDialog) return;
    setLoyaltyAwarding(true);
    try {
      const res = await fetch('/api/artist/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: loyaltyDialog.booking.id,
          points: loyaltyPoints,
          description: loyaltyDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAwardedBookingIds((prev) => {
          const next = new Set(prev);
          next.add(loyaltyDialog.booking.id);
          return next;
        });
        showToast(t('loyaltyAwarded'), 'success');
        setLoyaltyDialog(null);
      } else if (data.error === 'ALREADY_AWARDED') {
        setAwardedBookingIds((prev) => {
          const next = new Set(prev);
          next.add(loyaltyDialog.booking.id);
          return next;
        });
        showToast(t('loyaltyAlreadyAwarded'), 'error');
        setLoyaltyDialog(null);
      } else if (data.error === 'GUEST_NO_ACCOUNT') {
        showToast(t('loyaltyGuestNoAccount'), 'error');
        setLoyaltyDialog(null);
      } else {
        showToast(data.message || data.error || t('loyaltyError'), 'error');
      }
    } catch {
      showToast(t('loyaltyError'), 'error');
    } finally {
      setLoyaltyAwarding(false);
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
                      {formatBookingSchedule(booking.consultationDate, booking.consultationTime)}
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
            <div className="overflow-hidden rounded-sm border border-border bg-bg-secondary p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 break-words font-heading text-lg text-text-primary">
                  {selected.clientName}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    selected.clientId
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-zinc-500/15 text-zinc-400'
                  }`}
                  title={
                    selected.clientId
                      ? t('clientTypeAccountTip')
                      : t('clientTypeGuestTip')
                  }
                >
                  {selected.clientId
                    ? t('clientTypeAccount')
                    : t('clientTypeGuest')}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('date')}</span>
                  <span>{formatBookingDate(selected.consultationDate)}</span>
                </div>
                {selected.consultationTime && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t('time')}</span>
                    <span>{selected.consultationTime}</span>
                  </div>
                )}
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

                {/* Reference images */}
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-xs text-text-muted">{t('references')}</p>
                  {selectedReferences.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {selectedReferences.map((url, index) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setLightboxIndex(index)}
                            className="group relative h-20 w-20 overflow-hidden rounded-sm border border-border bg-bg-tertiary transition-colors hover:border-accent/40"
                            aria-label={`${t('openReference')} ${index + 1}`}
                          >
                            <Image
                              src={url}
                              alt={`Reference ${index + 1}`}
                              fill
                              sizes="80px"
                              unoptimized
                              className="object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-text-muted">{t('referencesHint')}</p>
                    </>
                  ) : (
                    <p className="text-[11px] text-text-muted">{t('referencesEmpty')}</p>
                  )}
                </div>

                {/* Contact info */}
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-text-muted">{t('client')}</p>
                  <p className="mt-1 break-all">{selected.clientPhone}</p>
                  <p className="break-all text-text-muted">{selected.clientEmail}</p>
                  {(() => {
                    const waLink = buildWhatsAppLink(
                      selected.clientPhone,
                      t('whatsappPrefill', {
                        name: selected.clientName,
                        date: formatBookingDate(selected.consultationDate),
                        time: selected.consultationTime || t('unscheduled'),
                      }),
                    );
                    if (!waLink) return null;
                    return (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {t('whatsappCta')}
                      </a>
                    );
                  })()}
                </div>

                {/* Client-facing notes */}
                <div className="border-t border-border pt-3">
                  <p className="mb-1 flex items-center gap-1 text-xs text-text-muted">
                    <span>{t('clientNotes')}</span>
                    {!selected.clientId && (
                      <span
                        className="rounded-full bg-zinc-500/15 px-1.5 py-0.5 text-[10px] text-zinc-400"
                        title={t('clientNotesGuestWarning')}
                      >
                        {t('clientNotesGuestBadge')}
                      </span>
                    )}
                  </p>
                  <textarea
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder={t('clientNotesPlaceholder')}
                    className="w-full rounded-sm border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                  <p className="mt-0.5 text-xs text-text-muted">
                    {selected.clientId
                      ? t('clientNotesHint')
                      : t('clientNotesGuestWarning')}
                  </p>
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

                  {/* Manual loyalty trigger when booking is already completed */}
                  {selected.status === 'completed' && selected.clientId &&
                    !awardedBookingIds.has(selected.id) && (
                      <button
                        type="button"
                        onClick={() => {
                          setLoyaltyPoints(1);
                          setLoyaltyDescription('');
                          setLoyaltyDialog({ booking: selected });
                        }}
                        className="mt-3 inline-flex items-center gap-1 rounded-sm border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/15"
                      >
                        ⭐ {t('loyaltyAwardCta')}
                      </button>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={Math.max(0, lightboxIndex)}
        slides={selectedReferences.map((url, index) => ({
          src: url,
          alt: `Reference ${index + 1}`,
        }))}
      />

      {/* Manual loyalty award dialog */}
      {loyaltyDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="loyalty-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loyaltyAwarding) {
              setLoyaltyDialog(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-sm border border-border bg-bg-primary p-6 shadow-2xl">
            <h3
              id="loyalty-dialog-title"
              className="mb-2 font-heading text-xl text-text-primary"
            >
              {t('loyaltyDialogTitle')}
            </h3>
            <p className="mb-4 text-sm text-text-muted">
              {t('loyaltyDialogDescription', {
                client: loyaltyDialog.booking.clientName,
              })}
            </p>

            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-text-secondary">
                {t('loyaltyPoints')}
              </p>
              <div className="flex gap-2">
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLoyaltyPoints(p)}
                    aria-pressed={loyaltyPoints === p}
                    className={`flex-1 rounded-sm border px-3 py-2 text-sm transition-colors ${
                      loyaltyPoints === p
                        ? 'border-accent bg-accent/15 text-accent'
                        : 'border-border bg-bg-secondary text-text-secondary hover:border-accent/30'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor="loyalty-description"
                className="mb-1 block text-xs font-medium text-text-secondary"
              >
                {t('loyaltyDescription')}
              </label>
              <textarea
                id="loyalty-description"
                value={loyaltyDescription}
                onChange={(e) =>
                  setLoyaltyDescription(e.target.value.slice(0, 200))
                }
                rows={2}
                placeholder={t('loyaltyDescriptionPlaceholder')}
                className="w-full rounded-sm border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                maxLength={200}
              />
              <p className="mt-1 text-[11px] text-text-muted">
                {t('loyaltyDescriptionHint')}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLoyaltyDialog(null)}
                disabled={loyaltyAwarding}
                className="rounded-sm border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
              >
                {t('loyaltyCancel')}
              </button>
              <button
                type="button"
                onClick={handleAwardLoyalty}
                disabled={loyaltyAwarding}
                className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loyaltyAwarding
                  ? t('loyaltyAwarding')
                  : t('loyaltyConfirm', { points: loyaltyPoints })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
