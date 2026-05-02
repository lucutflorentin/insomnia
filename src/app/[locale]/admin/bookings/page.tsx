'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight, MessageCircle, X, Loader2 } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Button from '@/components/ui/Button';
import NextJsImage from '@/components/ui/NextJsImage';
import Textarea from '@/components/ui/Textarea';
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
  source: string;
  status: string;
  adminNotes: string | null;
  clientNotes: string | null;
  language: string;
  referenceImages: string[] | null;
  createdAt: string;
  artist: { id: number; name: string; slug: string };
}

const STATUSES = ['all', 'new', 'contacted', 'confirmed', 'completed', 'cancelled', 'no_show'];

export default function AdminBookingsPage() {
  const t = useTranslations('admin.bookings');
  const locale = useLocale();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [notes, setNotes] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const dateLocale = locale === 'ro' ? 'ro-RO' : 'en-US';

  const selectedReferences = useMemo(
    () => parseDisplayReferenceImages(selected?.referenceImages),
    [selected],
  );

  const formatBookingDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString(dateLocale) : t('details.unscheduled');

  const formatBookingSchedule = (date: string | null, time: string | null) =>
    date ? `${formatBookingDate(date)}${time ? ` — ${time}` : ''}` : t('details.unscheduled');

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        const normalized = (data.data || []).map((b: Booking) => ({
          ...b,
          referenceImages: parseDisplayReferenceImages(b.referenceImages),
        }));
        setBookings(normalized);
        setTotal(data.pagination.total);
      } else {
        showToast(t('loading'), 'error');
      }
    } catch {
      showToast(t('loading'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, showToast, t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (id: number, status: string) => {
    const actionKey = `${id}-${status}`;
    setUpdatingStatus(actionKey);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: notes || undefined, clientNotes: clientNotes || undefined }),
      });
      if (res.ok) {
        showToast(t(`status.${status}`), 'success');
        fetchBookings();
        if (selected?.id === id) {
          const data = await res.json();
          setSelected(data.data);
        }
      } else {
        showToast(t('loading'), 'error');
      }
    } catch {
      showToast(t('loading'), 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    contacted: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-green-500/20 text-green-400',
    completed: 'bg-accent/20 text-accent',
    cancelled: 'bg-red-500/20 text-red-400',
    no_show: 'bg-gray-500/20 text-gray-400',
  };

  const handleExportBookings = () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    window.open(`/api/admin/export/bookings?${params}`, '_blank');
  };

  const handleExportClients = () => {
    window.open('/api/admin/export/clients', '_blank');
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportBookings}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
            title={t('exportBookings')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {t('exportBookings')}
          </button>
          <button
            onClick={handleExportClients}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
            title={t('exportClients')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            {t('exportClients')}
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              statusFilter === s
                ? 'bg-accent text-bg-primary'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            {s === 'all' ? t('all') : t(`status.${s}`)}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className="flex-1 rounded-lg border border-white/10 bg-bg-secondary">
          {isLoading ? (
            <div className="p-8 text-center text-text-muted">{t('loading')}</div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-text-muted">{t('noBookings')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-text-muted">
                    <th className="px-4 py-3">{t('table.code')}</th>
                    <th className="px-4 py-3">{t('table.client')}</th>
                    <th className="px-4 py-3">{t('table.artist')}</th>
                    <th className="px-4 py-3">{t('table.date')}</th>
                    <th className="px-4 py-3">{t('table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => { setSelected(b); setNotes(b.adminNotes || ''); setClientNotes(b.clientNotes || ''); }}
                      className={`cursor-pointer border-b border-white/5 text-sm transition-colors hover:bg-white/5 ${
                        selected?.id === b.id ? 'bg-white/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-accent">
                        {b.referenceCode}
                      </td>
                      <td className="px-4 py-3 text-text-primary">{b.clientName}</td>
                      <td className="px-4 py-3 text-text-secondary">{b.artist.name}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatBookingSchedule(b.consultationDate, b.consultationTime)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[b.status] || ''}`}>
                          {t(`status.${b.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <span className="text-xs text-text-muted">
                {total} total
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded bg-white/5 px-3 py-1 text-sm text-text-secondary disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 py-1 text-sm text-text-secondary">{page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= total}
                  className="rounded bg-white/5 px-3 py-1 text-sm text-text-secondary disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-96 rounded-lg border border-white/10 bg-bg-secondary p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-mono text-lg text-accent">{selected.referenceCode}</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-text-muted">{t('details.client')}:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-text-primary">{selected.clientName}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      selected.clientId
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-zinc-500/15 text-zinc-400'
                    }`}
                    title={
                      selected.clientId
                        ? t('details.clientTypeAccountTip')
                        : t('details.clientTypeGuestTip')
                    }
                  >
                    {selected.clientId
                      ? t('details.clientTypeAccount')
                      : t('details.clientTypeGuest')}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-text-muted">{t('details.phone')}:</span>
                <p className="break-all text-text-primary">{selected.clientPhone}</p>
                {(() => {
                  const waLink = buildWhatsAppLink(
                    selected.clientPhone,
                    t('details.whatsappPrefill', {
                      name: selected.clientName,
                      date: formatBookingDate(selected.consultationDate),
                      time: selected.consultationTime || t('details.unscheduled'),
                    }),
                  );
                  if (!waLink) return null;
                  return (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 rounded-sm bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {t('details.whatsappCta')}
                    </a>
                  );
                })()}
              </div>
              <div>
                <span className="text-text-muted">{t('details.email')}:</span>
                <p className="break-all text-text-primary">{selected.clientEmail}</p>
              </div>
              <div>
                <span className="text-text-muted">{t('details.artist')}:</span>
                <p className="text-text-primary">{selected.artist.name}</p>
              </div>
              {selected.bodyArea && (
                <div>
                  <span className="text-text-muted">{t('details.bodyArea')}:</span>
                  <p className="text-text-primary">{selected.bodyArea}</p>
                </div>
              )}
              <div>
                <span className="text-text-muted">{t('details.size')}:</span>
                <p className="text-text-primary">{selected.sizeCategory}</p>
              </div>
              {selected.description && (
                <div>
                  <span className="text-text-muted">{t('details.description')}:</span>
                  <p className="text-text-primary">{selected.description}</p>
                </div>
              )}
              <div>
                <span className="text-text-muted">{t('details.consultationDate')}:</span>
                <p className="text-text-primary">
                  {formatBookingSchedule(selected.consultationDate, selected.consultationTime)}
                </p>
              </div>
              <div>
                <span className="text-text-muted">{t('details.source')}:</span>
                <p className="text-text-primary">{selected.source}</p>
              </div>
            </div>

            {/* Reference images */}
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2 text-xs text-text-muted">{t('references')}</p>
              {selectedReferences.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {selectedReferences.map((url, index) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        className="group relative h-20 w-20 overflow-hidden rounded-sm border border-white/10 bg-bg-tertiary transition-colors hover:border-accent/40"
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

            {/* Admin notes (internal, not visible to client) */}
            <div className="mt-4">
              <Textarea
                label={t('adminNotes')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Client-facing notes */}
            <div className="mt-3">
              <Textarea
                label={t('clientNotes')}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                rows={2}
              />
              <p className="mt-1 text-xs text-text-muted">{t('clientNotesHint')}</p>
            </div>

            {/* Status actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {selected.status === 'new' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => updateStatus(selected.id, 'contacted')}
                    disabled={updatingStatus !== null}
                  >
                    {updatingStatus === `${selected.id}-contacted` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('actions.contact')
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateStatus(selected.id, 'confirmed')}
                    disabled={updatingStatus !== null}
                  >
                    {updatingStatus === `${selected.id}-confirmed` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('actions.confirm')
                    )}
                  </Button>
                </>
              )}
              {selected.status === 'contacted' && (
                <Button
                  size="sm"
                  onClick={() => updateStatus(selected.id, 'confirmed')}
                  disabled={updatingStatus !== null}
                >
                  {updatingStatus === `${selected.id}-confirmed` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('actions.confirm')
                  )}
                </Button>
              )}
              {selected.status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => updateStatus(selected.id, 'completed')}
                  disabled={updatingStatus !== null}
                >
                  {updatingStatus === `${selected.id}-completed` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('actions.complete')
                  )}
                </Button>
              )}
              {['new', 'contacted', 'confirmed'].includes(selected.status) && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => updateStatus(selected.id, 'cancelled')}
                  disabled={updatingStatus !== null}
                >
                  {updatingStatus === `${selected.id}-cancelled` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('actions.reject')
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={Math.max(0, lightboxIndex)}
        slides={selectedReferences.map((url, index) => ({
          src: url,
          alt: `Reference ${index + 1}`,
        }))}
        render={{ slide: NextJsImage }}
      />
    </div>
  );
}
