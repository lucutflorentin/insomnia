'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export default function AdminAvailabilityPage() {
  const t = useTranslations('admin.availability');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<number>(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // New override form
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideStart, setOverrideStart] = useState('10:00');
  const [overrideEnd, setOverrideEnd] = useState('18:00');
  const [overrideAvailable, setOverrideAvailable] = useState(true);

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
    const res = await fetch(`/api/availability/templates?artistId=${selectedArtist}`);
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.data || []);
    }
  }, [selectedArtist]);

  const fetchOverrides = useCallback(async () => {
    if (!selectedArtist) return;
    const [year, month] = currentMonth.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const res = await fetch(
      `/api/availability?artistId=${selectedArtist}&startDate=${startDate}&endDate=${endDate}`,
    );
    if (res.ok) {
      const data = await res.json();
      setOverrides(data.data || []);
    }
  }, [selectedArtist, currentMonth]);

  useEffect(() => {
    fetchTemplates();
    fetchOverrides();
  }, [fetchTemplates, fetchOverrides]);

  const updateTemplate = async (dayOfWeek: number, startTime: string, endTime: string, isActive: boolean) => {
    await fetch('/api/availability/templates', {
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
    fetchTemplates();
  };

  const addOverride = async () => {
    if (!overrideDate) return;
    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artistId: selectedArtist,
        date: overrideDate,
        startTime: overrideStart,
        endTime: overrideEnd,
        isAvailable: overrideAvailable,
      }),
    });
    setOverrideDate('');
    fetchOverrides();
  };

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-text-primary">{t('title')}</h1>

      {/* Artist selector */}
      <div className="mb-6 flex gap-3">
        {artists.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedArtist(a.id)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              selectedArtist === a.id
                ? 'bg-accent text-bg-primary'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly templates */}
        <div className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <h2 className="mb-4 text-lg text-text-primary">{t('template')}</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const tmpl = templates.find((t) => t.dayOfWeek === day);
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-text-secondary">{t(`days.${DAY_KEYS[day]}`)}</span>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tmpl?.isActive ?? false}
                      onChange={(e) =>
                        updateTemplate(
                          day,
                          tmpl?.startTime || '10:00',
                          tmpl?.endTime || '18:00',
                          e.target.checked,
                        )
                      }
                      className="accent-accent"
                    />
                  </label>
                  <input
                    type="time"
                    value={tmpl?.startTime || '10:00'}
                    onChange={(e) =>
                      updateTemplate(day, e.target.value, tmpl?.endTime || '18:00', tmpl?.isActive ?? false)
                    }
                    className="rounded border border-white/10 bg-bg-primary px-2 py-1 text-sm text-text-primary"
                  />
                  <span className="text-text-muted">-</span>
                  <input
                    type="time"
                    value={tmpl?.endTime || '18:00'}
                    onChange={(e) =>
                      updateTemplate(day, tmpl?.startTime || '10:00', e.target.value, tmpl?.isActive ?? false)
                    }
                    className="rounded border border-white/10 bg-bg-primary px-2 py-1 text-sm text-text-primary"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Date overrides */}
        <div className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg text-text-primary">{t('override')}</h2>
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="rounded border border-white/10 bg-bg-primary px-2 py-1 text-sm text-text-primary"
            />
          </div>

          {/* Add override form */}
          <div className="mb-4 flex flex-wrap gap-2 rounded-lg bg-white/5 p-3">
            <Input
              type="date"
              value={overrideDate}
              onChange={(e) => setOverrideDate(e.target.value)}
              className="!w-auto"
            />
            <input
              type="time"
              value={overrideStart}
              onChange={(e) => setOverrideStart(e.target.value)}
              className="rounded border border-white/10 bg-bg-primary px-2 py-1 text-sm text-text-primary"
            />
            <input
              type="time"
              value={overrideEnd}
              onChange={(e) => setOverrideEnd(e.target.value)}
              className="rounded border border-white/10 bg-bg-primary px-2 py-1 text-sm text-text-primary"
            />
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={overrideAvailable}
                onChange={(e) => setOverrideAvailable(e.target.checked)}
                className="accent-accent"
              />
              {t('available')}
            </label>
            <Button size="sm" onClick={addOverride}>+</Button>
          </div>

          {/* Override list */}
          {overrides.length === 0 ? (
            <p className="text-center text-sm text-text-muted">{t('noOverrides')}</p>
          ) : (
            <div className="space-y-2">
              {overrides.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="text-text-primary">
                    {new Date(o.date).toLocaleDateString('ro-RO')}
                  </span>
                  <span className="text-text-secondary">
                    {o.startTime} - {o.endTime}
                  </span>
                  <span
                    className={
                      o.isAvailable
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {o.isAvailable ? t('available') : t('unavailable')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
