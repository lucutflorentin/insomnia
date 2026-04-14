'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface DaySchedule {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface DateOverride {
  id: number;
  date: string;
  isBlocked: boolean;
  customStart: string | null;
  customEnd: string | null;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((_, i) => ({
  dayOfWeek: i + 1,
  startTime: '10:00',
  endTime: '18:00',
  isActive: i < 5, // Mon-Fri active by default
}));

export default function ArtistAvailabilityPage() {
  const t = useTranslations('artist.availability');
  const { showToast } = useToast();
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/availability/schedule').then((r) => r.json()),
      fetch('/api/availability/overrides').then((r) => r.json()),
    ])
      .then(([scheduleData, overridesData]) => {
        if (scheduleData.success && scheduleData.data?.length > 0) {
          setSchedule(scheduleData.data);
        }
        if (overridesData.success) {
          setOverrides(overridesData.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleScheduleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/availability/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      });
      if (res.ok) {
        showToast('Saved!', 'success');
      }
    } catch {
      showToast('Error saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, isActive: !d.isActive } : d,
      ),
    );
  };

  const updateTime = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d,
      ),
    );
  };

  const toggleDateOverride = useCallback(
    async (dateStr: string) => {
      const existing = overrides.find((o) => o.date === dateStr);
      if (existing) {
        // Remove override
        try {
          await fetch(`/api/availability/overrides/${existing.id}`, { method: 'DELETE' });
          setOverrides((prev) => prev.filter((o) => o.id !== existing.id));
        } catch {}
      } else {
        // Add blocked override
        try {
          const res = await fetch('/api/availability/overrides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr, isBlocked: true }),
          });
          const data = await res.json();
          if (data.success) {
            setOverrides((prev) => [...prev, data.data]);
          }
        } catch {}
      }
    },
    [overrides],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
      <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Weekly schedule */}
        <div className="rounded-sm border border-border bg-bg-secondary p-6">
          <h2 className="mb-4 font-heading text-lg text-text-primary">Program saptamanal</h2>
          <div className="space-y-3">
            {schedule.map((day) => (
              <div key={day.dayOfWeek} className="flex items-center gap-3">
                <button
                  onClick={() => toggleDay(day.dayOfWeek)}
                  className={cn(
                    'w-24 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                    day.isActive
                      ? 'bg-accent/10 text-accent'
                      : 'bg-bg-tertiary text-text-muted',
                  )}
                >
                  {DAYS[day.dayOfWeek - 1]?.slice(0, 3).toUpperCase()}
                </button>
                {day.isActive ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => updateTime(day.dayOfWeek, 'startTime', e.target.value)}
                      className="rounded-sm border border-border bg-bg-tertiary px-2 py-1 text-sm text-text-primary"
                    />
                    <span className="text-text-muted">—</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => updateTime(day.dayOfWeek, 'endTime', e.target.value)}
                      className="rounded-sm border border-border bg-bg-tertiary px-2 py-1 text-sm text-text-primary"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-text-muted">Inchis</span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleScheduleSave}
            disabled={saving}
            className="mt-4 rounded-sm bg-accent px-4 py-2 text-sm font-medium text-bg-primary hover:bg-accent/80 disabled:opacity-60"
          >
            {saving ? '...' : 'Salveaza'}
          </button>
        </div>

        {/* Date overrides calendar */}
        <div className="rounded-sm border border-border bg-bg-secondary p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg text-text-primary">Zile blocate</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const [y, m] = currentMonth.split('-').map(Number);
                  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
                  setCurrentMonth(prev);
                }}
                className="px-2 py-1 text-text-secondary hover:text-text-primary"
              >
                &larr;
              </button>
              <span className="text-sm">
                {new Date(`${currentMonth}-01`).toLocaleDateString('ro-RO', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={() => {
                  const [y, m] = currentMonth.split('-').map(Number);
                  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
                  setCurrentMonth(next);
                }}
                className="px-2 py-1 text-text-secondary hover:text-text-primary"
              >
                &rarr;
              </button>
            </div>
          </div>
          <p className="mb-3 text-xs text-text-muted">Click pe o zi pentru a o bloca/debloca</p>
          <div className="grid grid-cols-7 gap-1">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <div key={i} className="py-1 text-center text-xs text-text-muted">{d}</div>
            ))}
            {(() => {
              const [y, m] = currentMonth.split('-').map(Number);
              const firstDay = new Date(y, m - 1, 1).getDay();
              const daysInMonth = new Date(y, m, 0).getDate();
              const offset = firstDay === 0 ? 6 : firstDay - 1;
              const cells = [];

              for (let i = 0; i < offset; i++) {
                cells.push(<div key={`empty-${i}`} />);
              }

              for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isBlocked = overrides.some((o) => o.date === dateStr && o.isBlocked);
                const isPast = dateStr < new Date().toISOString().split('T')[0];

                cells.push(
                  <button
                    key={day}
                    disabled={isPast}
                    onClick={() => toggleDateOverride(dateStr)}
                    className={cn(
                      'aspect-square rounded-sm text-sm transition-all',
                      isBlocked
                        ? 'bg-red-500/20 text-red-400 font-bold'
                        : isPast
                          ? 'bg-bg-tertiary text-text-muted/40 cursor-not-allowed'
                          : 'bg-bg-tertiary text-text-secondary hover:bg-accent/10',
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
      </div>
    </div>
  );
}
