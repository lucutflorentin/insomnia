'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  Ban,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  addDays,
} from 'date-fns';
import { enUS, ro } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Artist {
  id: number;
  name: string;
  slug: string;
}

interface Template {
  id: number;
  artistId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Override {
  id: number;
  artistId: number;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface BookingCount {
  date: string;
  count: number;
}

const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

const WEEK_DAY_SHORT_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateISO(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

type DayStatus = 'available' | 'unavailable' | 'none';

function getDayStatus(
  date: Date,
  templates: Template[],
  overrides: Override[],
): { status: DayStatus; override?: Override; template?: Template } {
  const dateStr = formatDateISO(date);
  const override = overrides.find(
    (o) => o.date.slice(0, 10) === dateStr,
  );
  if (override) {
    return {
      status: override.isAvailable ? 'available' : 'unavailable',
      override,
    };
  }
  const dayOfWeek = getDay(date);
  const template = templates.find((t) => t.dayOfWeek === dayOfWeek);
  if (template?.isActive) {
    return { status: 'available', template };
  }
  return { status: 'none' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminAvailabilityPage() {
  const t = useTranslations('admin.availability');
  const locale = useLocale();
  const { showToast } = useToast();
  const dateFnsLocale = locale === 'ro' ? ro : enUS;

  // --- State ---------------------------------------------------------------
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<number>(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [bookingCounts, setBookingCounts] = useState<BookingCount[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  // Calendar day editor modal
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [editStart, setEditStart] = useState('10:00');
  const [editEnd, setEditEnd] = useState('18:00');
  const [editAvailable, setEditAvailable] = useState(true);

  // Collapsible template section
  const [templateOpen, setTemplateOpen] = useState(false);

  // --- Data fetching -------------------------------------------------------
  useEffect(() => {
    fetch('/api/artists')
      .then((r) => r.json())
      .then((d) => {
        setArtists(d.data || []);
        if (d.data?.[0]) setSelectedArtist(d.data[0].id);
      });
  }, []);

  const fetchTemplates = useCallback(async () => {
    if (!selectedArtist) return;
    const res = await fetch(
      `/api/availability/templates?artistId=${selectedArtist}`,
    );
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.data || []);
    }
  }, [selectedArtist]);

  const fetchOverrides = useCallback(async () => {
    if (!selectedArtist) return;
    const start = formatDateISO(startOfMonth(currentMonth));
    const end = formatDateISO(endOfMonth(currentMonth));

    const res = await fetch(
      `/api/availability?artistId=${selectedArtist}&startDate=${start}&endDate=${end}`,
    );
    if (res.ok) {
      const data = await res.json();
      setOverrides(data.data || []);
    }
  }, [selectedArtist, currentMonth]);

  const fetchBookingCounts = useCallback(async () => {
    if (!selectedArtist) return;
    const start = formatDateISO(startOfMonth(currentMonth));
    const end = formatDateISO(endOfMonth(currentMonth));

    try {
      const res = await fetch(
        `/api/bookings?artistId=${selectedArtist}&startDate=${start}&endDate=${end}&limit=50`,
      );
      if (res.ok) {
        const data = await res.json();
        const bookings = data.data || [];
        const counts: Record<string, number> = {};
        for (const b of bookings) {
          if (b.consultationDate) {
            const d = b.consultationDate.slice(0, 10);
            counts[d] = (counts[d] || 0) + 1;
          }
        }
        setBookingCounts(
          Object.entries(counts).map(([date, count]) => ({ date, count })),
        );
      }
    } catch {
      // Silently fail; booking counts are supplemental
    }
  }, [selectedArtist, currentMonth]);

  useEffect(() => {
    fetchTemplates();
    fetchOverrides();
    fetchBookingCounts();
  }, [fetchTemplates, fetchOverrides, fetchBookingCounts]);

  // --- Artist status indicator ---------------------------------------------
  const artistWeekStatus = useMemo<'green' | 'red' | 'yellow'>(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    let availCount = 0;
    for (const day of days) {
      const { status } = getDayStatus(day, templates, overrides);
      if (status === 'available') availCount++;
    }
    if (availCount === 0) return 'red';
    if (availCount === 7) return 'green';
    return 'yellow';
  }, [templates, overrides]);

  // --- Calendar computation ------------------------------------------------
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // --- Handlers ------------------------------------------------------------
  const updateTemplate = async (
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    isActive: boolean,
  ) => {
    if (isActive && startTime >= endTime) {
      showToast(t('startBeforeEnd'), 'error');
      return;
    }

    setIsSavingTemplate(true);
    try {
      const res = await fetch('/api/availability/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: selectedArtist,
          dayOfWeek,
          startTime,
          endTime,
          isActive,
        }),
      });
      if (res.ok) {
        showToast(t('saved'), 'success');
        fetchTemplates();
      } else {
        showToast(t('saveFailed'), 'error');
      }
    } catch {
      showToast(t('connectionError'), 'error');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const saveOverride = async () => {
    if (!editingDate) return;
    if (editAvailable && editStart >= editEnd) {
      showToast(t('startBeforeEnd'), 'error');
      return;
    }

    setIsSavingOverride(true);
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: selectedArtist,
          date: formatDateISO(editingDate),
          startTime: editStart,
          endTime: editEnd,
          isAvailable: editAvailable,
        }),
      });
      if (res.ok) {
        showToast(t('saved'), 'success');
        setEditingDate(null);
        fetchOverrides();
      } else {
        showToast(t('saveFailed'), 'error');
      }
    } catch {
      showToast(t('connectionError'), 'error');
    } finally {
      setIsSavingOverride(false);
    }
  };

  const deleteOverride = async (overrideId: number) => {
    try {
      const res = await fetch(`/api/availability?id=${overrideId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(t('deleted'), 'success');
        fetchOverrides();
      } else {
        showToast(t('deleteFailed'), 'error');
      }
    } catch {
      showToast(t('connectionError'), 'error');
    }
  };

  const blockEntireWeek = async () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const confirmMsg = t('blockWeekConfirm', {
      date: format(weekStart, 'MMM d', { locale: dateFnsLocale }),
    });
    if (!confirm(confirmMsg)) return;

    setIsSavingOverride(true);
    try {
      await Promise.all(
        days.map((day) =>
          fetch('/api/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              artistId: selectedArtist,
              date: formatDateISO(day),
              startTime: '00:00',
              endTime: '00:00',
              isAvailable: false,
            }),
          }),
        ),
      );
      showToast(t('weekBlocked'), 'success');
      fetchOverrides();
    } catch {
      showToast(t('connectionError'), 'error');
    } finally {
      setIsSavingOverride(false);
    }
  };

  const openDayEditor = (date: Date) => {
    const { override, template } = getDayStatus(date, templates, overrides);
    if (override) {
      setEditStart(override.startTime);
      setEditEnd(override.endTime);
      setEditAvailable(override.isAvailable);
    } else if (template?.isActive) {
      setEditStart(template.startTime);
      setEditEnd(template.endTime);
      setEditAvailable(true);
    } else {
      setEditStart('10:00');
      setEditEnd('18:00');
      setEditAvailable(true);
    }
    setEditingDate(date);
  };

  const getBookingCount = (date: Date): number => {
    const dateStr = formatDateISO(date);
    return bookingCounts.find((b) => b.date === dateStr)?.count ?? 0;
  };

  const selectedArtistName = artists.find((a) => a.id === selectedArtist)?.name || '';

  // --- Month overrides list (only those with actual overrides) -------------
  const monthOverrides = overrides.filter((o) => {
    const d = new Date(o.date);
    return isSameMonth(d, currentMonth);
  });

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-accent" />
          <h1 className="font-heading text-2xl text-text-primary">
            {t('title')}
          </h1>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="danger"
            onClick={blockEntireWeek}
            disabled={!selectedArtist || isSavingOverride}
          >
            <Ban className="mr-1.5 h-4 w-4" />
            {t('blockWeek')}
          </Button>
        </div>
      </div>

      {/* Artist selector pills + status dot */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {artists.map((a) => {
          const isSelected = selectedArtist === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setSelectedArtist(a.id)}
              className={`relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-accent text-bg-primary shadow-lg shadow-accent/20'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10'
              }`}
            >
              {a.name}
              {isSelected && (
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    artistWeekStatus === 'green'
                      ? 'bg-green-400'
                      : artistWeekStatus === 'yellow'
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                  }`}
                  title={
                    artistWeekStatus === 'green'
                      ? t('hasAvailability')
                      : artistWeekStatus === 'yellow'
                        ? t('partialAvailability')
                        : t('noAvailability')
                  }
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/*  CALENDAR                                                         */}
      {/* ================================================================= */}
      <div className="mb-6 rounded-xl border border-white/10 bg-bg-secondary">
        {/* Month navigation */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold capitalize text-text-primary">
            {format(currentMonth, 'LLLL yyyy', { locale: dateFnsLocale })}
          </h2>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-white/5 px-2 py-2">
          {WEEK_DAY_SHORT_KEYS.map((key) => (
            <div
              key={key}
              className="text-center text-xs font-medium uppercase tracking-wider text-text-muted"
            >
              {t(`weekDaysShort.${key}`)}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-white/5 p-px">
          {calendarDays.map((day) => {
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const { status, override } = getDayStatus(
              day,
              templates,
              overrides,
            );
            const bCount = getBookingCount(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => inMonth && openDayEditor(day)}
                disabled={!inMonth}
                className={`
                  group relative flex min-h-[80px] flex-col items-start p-2 text-left transition-all
                  sm:min-h-[90px] sm:p-3
                  ${inMonth ? 'bg-bg-secondary hover:bg-white/5' : 'bg-bg-primary/50'}
                  ${today ? 'ring-1 ring-inset ring-accent/40' : ''}
                  ${!inMonth ? 'cursor-default opacity-40' : 'cursor-pointer'}
                `}
              >
                {/* Day number + status dot */}
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      today
                        ? 'flex h-6 w-6 items-center justify-center rounded-full bg-accent text-bg-primary'
                        : inMonth
                          ? 'text-text-primary'
                          : 'text-text-muted'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {inMonth && status !== 'none' && (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        status === 'available' ? 'bg-green-400' : 'bg-red-400'
                      }`}
                    />
                  )}
                </div>

                {/* Time range */}
                {inMonth && status === 'available' && (
                  <span className="mt-1 hidden text-[10px] leading-tight text-green-400/80 sm:block">
                    {override
                      ? `${override.startTime}-${override.endTime}`
                      : (() => {
                          const tmpl = templates.find(
                            (tp) => tp.dayOfWeek === getDay(day) && tp.isActive,
                          );
                          return tmpl
                            ? `${tmpl.startTime}-${tmpl.endTime}`
                            : '';
                        })()}
                  </span>
                )}

                {inMonth && status === 'unavailable' && (
                  <span className="mt-1 hidden text-[10px] leading-tight text-red-400/70 sm:block">
                    {t('unavailable')}
                  </span>
                )}

                {/* Booking count */}
                {inMonth && bCount > 0 && (
                  <span className="mt-auto inline-flex items-center gap-0.5 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                    {bCount} {t('bookings')}
                  </span>
                )}

                {/* Override indicator */}
                {inMonth && override && (
                  <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-yellow-400" title={t('override')} />
                )}
              </button>
            );
          })}
        </div>

        {/* Today button */}
        <div className="flex justify-center border-t border-white/5 py-2">
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="rounded px-3 py-1 text-xs text-accent transition-colors hover:bg-accent/10"
          >
            {t('today')}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/*  DAY EDITOR MODAL (inline overlay)                                */}
      {/* ================================================================= */}
      {editingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-bg-secondary p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                <Clock className="h-5 w-5 text-accent" />
                {t('editDay')}
              </h3>
              <button
                onClick={() => setEditingDate(null)}
                className="rounded-lg p-1 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-text-secondary">
              {format(editingDate, 'EEEE, MMMM d, yyyy', {
                locale: dateFnsLocale,
              })}
            </p>

            {/* Available toggle */}
            <label className="mb-4 flex items-center gap-3">
              <span className="text-sm text-text-secondary">
                {t('available')}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={editAvailable}
                onClick={() => setEditAvailable((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  editAvailable ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    editAvailable ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  editAvailable ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {editAvailable ? t('available') : t('unavailable')}
              </span>
            </label>

            {/* Time inputs (shown only when available) */}
            {editAvailable && (
              <div className="mb-4 flex items-center gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-text-muted">
                    Start
                  </label>
                  <input
                    type="time"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
                <span className="mt-5 text-text-muted">-</span>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-text-muted">
                    End
                  </label>
                  <input
                    type="time"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={saveOverride}
                isLoading={isSavingOverride}
                className="flex-1"
              >
                {t('save')}
              </Button>
              {/* If there is an existing override for this day, show delete */}
              {(() => {
                const existingOverride = overrides.find(
                  (o) =>
                    o.date.slice(0, 10) === formatDateISO(editingDate),
                );
                if (existingOverride) {
                  return (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        deleteOverride(existingOverride.id);
                        setEditingDate(null);
                      }}
                    >
                      {t('delete')}
                    </Button>
                  );
                }
                return null;
              })()}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingDate(null)}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/*  WEEKLY TEMPLATE (collapsible)                                    */}
      {/* ================================================================= */}
      <div className="mb-6 overflow-hidden rounded-xl border border-white/10 bg-bg-secondary">
        <button
          onClick={() => setTemplateOpen((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-white/5"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            <span className="font-semibold text-text-primary">
              {t('template')}
            </span>
            {selectedArtistName && (
              <span className="text-sm text-text-muted">
                - {selectedArtistName}
              </span>
            )}
          </div>
          {templateOpen ? (
            <ChevronUp className="h-5 w-5 text-text-muted" />
          ) : (
            <ChevronDown className="h-5 w-5 text-text-muted" />
          )}
        </button>

        {templateOpen && (
          <div className="border-t border-white/5 px-6 py-4">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const tmpl = templates.find((tp) => tp.dayOfWeek === day);
                const active = tmpl?.isActive ?? false;
                return (
                  <div
                    key={day}
                    className={`flex flex-wrap items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      active ? 'bg-green-500/5' : 'bg-white/[0.02]'
                    }`}
                  >
                    <span className="w-28 text-sm font-medium text-text-secondary">
                      {t(`days.${DAY_KEYS[day]}`)}
                    </span>

                    {/* Toggle */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={active}
                      disabled={isSavingTemplate}
                      onClick={() =>
                        updateTemplate(
                          day,
                          tmpl?.startTime || '10:00',
                          tmpl?.endTime || '18:00',
                          !active,
                        )
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                        active ? 'bg-green-500' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Time inputs */}
                    <input
                      type="time"
                      value={tmpl?.startTime || '10:00'}
                      disabled={isSavingTemplate || !active}
                      onChange={(e) =>
                        updateTemplate(
                          day,
                          e.target.value,
                          tmpl?.endTime || '18:00',
                          active,
                        )
                      }
                      className="rounded-lg border border-white/10 bg-bg-primary px-2 py-1 text-sm text-text-primary transition-opacity disabled:opacity-30"
                    />
                    <span className="text-text-muted">-</span>
                    <input
                      type="time"
                      value={tmpl?.endTime || '18:00'}
                      disabled={isSavingTemplate || !active}
                      onChange={(e) =>
                        updateTemplate(
                          day,
                          tmpl?.startTime || '10:00',
                          e.target.value,
                          active,
                        )
                      }
                      className="rounded-lg border border-white/10 bg-bg-primary px-2 py-1 text-sm text-text-primary transition-opacity disabled:opacity-30"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/*  OVERRIDES LIST                                                   */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-white/10 bg-bg-secondary">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h3 className="font-semibold text-text-primary">{t('overrides')}</h3>
          <span className="text-xs text-text-muted">
            {format(currentMonth, 'LLLL yyyy', { locale: dateFnsLocale })}
          </span>
        </div>

        {monthOverrides.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-text-muted">
            {t('noOverrides')}
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {monthOverrides.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      o.isAvailable ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  <span className="text-sm font-medium text-text-primary">
                    {format(new Date(o.date), 'EEE, MMM d', {
                      locale: dateFnsLocale,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-text-secondary">
                    {o.isAvailable
                      ? `${o.startTime} - ${o.endTime}`
                      : t('unavailable')}
                  </span>
                  <button
                    onClick={() => deleteOverride(o.id)}
                    className="rounded p-1 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title={t('delete')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
