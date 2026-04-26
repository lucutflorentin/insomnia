'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface DayAvailability {
  date: string;
  isAvailable: boolean;
  slots: string[];
}

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: number;
    referenceCode: string;
    artist: { slug: string; name: string };
  };
  onSuccess: (newDate: string, newTime: string) => void;
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function RescheduleModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: RescheduleModalProps) {
  const t = useTranslations('account.bookings.reschedule');
  const { showToast } = useToast();
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchAvailability = useCallback(
    async (month: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/artists/${booking.artist.slug}/availability?month=${month}`,
        );
        if (res.ok) {
          const json = await res.json();
          setAvailability(json.data || []);
        }
      } catch {
        // Network error is surfaced to user via empty calendar
      } finally {
        setLoading(false);
      }
    },
    [booking.artist.slug],
  );

  useEffect(() => {
    if (!isOpen) return;
    fetchAvailability(currentMonth);
  }, [isOpen, currentMonth, fetchAvailability]);

  const selectedDay = availability.find((d) => d.date === date);

  const handleSubmit = async () => {
    if (!date || !time) {
      showToast(t('pickSlot'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/client/bookings/${booking.id}/reschedule`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newDate: date, newTime: time }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || t('error'), 'error');
        return;
      }
      showToast(t('success'), 'success');
      onSuccess(date, time);
      onClose();
    } catch {
      showToast(t('error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('title')}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {t('subtitle', { ref: booking.referenceCode, artist: booking.artist.name })}
        </p>
        <p className="text-xs text-text-muted">{t('notice')}</p>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              const [y, m] = currentMonth.split('-').map(Number);
              const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
              setCurrentMonth(prev);
              setDate('');
              setTime('');
            }}
            className="rounded px-3 py-1 text-text-secondary hover:text-text-primary"
            aria-label={t('prevMonth')}
          >
            ←
          </button>
          <span className="text-sm font-medium">
            {new Date(`${currentMonth}-01`).toLocaleDateString('ro-RO', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <button
            type="button"
            onClick={() => {
              const [y, m] = currentMonth.split('-').map(Number);
              const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
              setCurrentMonth(next);
              setDate('');
              setTime('');
            }}
            className="rounded px-3 py-1 text-text-secondary hover:text-text-primary"
            aria-label={t('nextMonth')}
          >
            →
          </button>
        </div>

        {loading ? (
          <div className="rounded-sm border border-border bg-bg-secondary p-8 text-center text-text-muted">
            {t('loading')}
          </div>
        ) : (
          <div className="rounded-sm border border-border bg-bg-secondary p-4">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="py-1 text-center text-xs text-text-muted">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const [y, m] = currentMonth.split('-').map(Number);
                const firstDay = new Date(y, m - 1, 1).getDay();
                const daysInMonth = new Date(y, m, 0).getDate();
                const offset = firstDay === 0 ? 6 : firstDay - 1;
                const cells = [];
                for (let i = 0; i < offset; i++) cells.push(<div key={`e-${i}`} />);
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const avail = availability.find((a) => a.date === dateStr);
                  const isAvailable = avail?.isAvailable ?? false;
                  const isSelected = date === dateStr;
                  const today = new Date().toISOString().slice(0, 10);
                  const isPast = dateStr < today;
                  cells.push(
                    <button
                      key={day}
                      type="button"
                      disabled={!isAvailable || isPast}
                      onClick={() => {
                        setDate(dateStr);
                        setTime('');
                      }}
                      className={cn(
                        'aspect-square rounded-sm text-sm transition-all',
                        isSelected
                          ? 'bg-accent font-bold text-bg-primary'
                          : isAvailable && !isPast
                            ? 'bg-bg-secondary text-text-secondary hover:bg-accent/10'
                            : 'cursor-not-allowed bg-bg-tertiary text-text-muted opacity-40',
                      )}
                    >
                      {day}
                    </button>,
                  );
                }
                return cells;
              })()}
            </div>
          </div>
        )}

        {selectedDay && selectedDay.slots.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-text-secondary">{t('pickTime')}</p>
            <div className="flex flex-wrap gap-2">
              {selectedDay.slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTime(s)}
                  className={cn(
                    'rounded-sm border px-4 py-2 text-sm transition-all',
                    time === s
                      ? 'border-accent bg-accent/10 font-medium text-accent'
                      : 'border-border text-text-secondary hover:border-accent/30',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} isLoading={submitting} disabled={!date || !time}>
            {t('confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
