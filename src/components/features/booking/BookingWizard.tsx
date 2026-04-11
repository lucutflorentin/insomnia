'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import SlideUp from '@/components/animations/SlideUp';
import { cn } from '@/lib/utils';
import { BODY_AREAS, SIZE_CATEGORIES, BOOKING_SOURCES, TATTOO_STYLES } from '@/lib/constants';
import { trackEvent } from '@/components/seo/Analytics';
import { useToast } from '@/components/ui/Toast';

interface DayAvailability {
  date: string;
  isAvailable: boolean;
  slots: string[];
}

const TOTAL_STEPS = 5;

export default function BookingWizard() {
  const t = useTranslations('booking');
  const tAreas = useTranslations('booking.step2.bodyAreas');
  const tSizes = useTranslations('booking.step2.sizes');
  const tSources = useTranslations('booking.step4.sources');
  const searchParams = useSearchParams();
  const preselectedArtist = searchParams.get('artist');

  const { showToast } = useToast();
  const tStyles = useTranslations('artists.styles');
  const [artists, setArtists] = useState<{ slug: string; name: string; specialtyRo: string | null; specialtyEn: string | null; specialties: string[] }[]>([]);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');

  // Fetch artists from API
  useEffect(() => {
    fetch('/api/artists')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setArtists(data.data);
      })
      .catch((err) => console.error('Failed to load artists:', err));
  }, []);

  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [form, setForm] = useState({
    artist: preselectedArtist || '',
    bodyArea: '',
    size: '',
    style: '',
    description: '',
    date: '',
    time: '',
    name: '',
    phone: '',
    email: '',
    gdpr: false,
    source: '',
  });

  const updateForm = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // Fetch availability when artist is selected and we're on step 3
  const fetchAvailability = useCallback(async (artistSlug: string, month: string) => {
    if (!artistSlug || artistSlug === 'unsure') return;
    setLoadingAvailability(true);
    try {
      const res = await fetch(`/api/artists/${artistSlug}/availability?month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setAvailability(data.data || []);
      }
    } catch {
      // Fallback: allow all dates
    } finally {
      setLoadingAvailability(false);
    }
  }, []);

  useEffect(() => {
    if (step === 3 && form.artist && form.artist !== 'unsure') {
      fetchAvailability(form.artist, currentMonth);
    }
  }, [step, form.artist, currentMonth, fetchAvailability]);

  const selectedDay = availability.find((d) => d.date === form.date);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setReferenceCode(data.referenceCode || 'INS-2024-0001');
        setIsSuccess(true);
        trackEvent('Lead', { content_name: 'booking', value: form.artist });
      } else {
        showToast(data.error || t('error'), 'error');
      }
    } catch (err) {
      console.error('Booking submission failed:', err);
      showToast(t('error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <SlideUp>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <svg className="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-heading text-3xl font-bold">{t('success.title')}</h2>
          <p className="mt-3 text-text-secondary">{t('success.message')}</p>
          <div className="mt-6 inline-block rounded-sm border border-accent/20 bg-accent/5 px-6 py-3">
            <p className="text-xs text-text-muted">{t('success.reference')}</p>
            <p className="font-mono text-lg font-bold text-accent">{referenceCode}</p>
          </div>
          <div className="mt-8">
            <Link href="/">
              <Button variant="secondary">{t('success.backHome')}</Button>
            </Link>
          </div>
        </SlideUp>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Header */}
      <SlideUp>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-text-secondary">{t('subtitle')}</p>
        <div className="mt-4 h-px w-12 bg-accent" />
      </SlideUp>

      {/* Progress bar */}
      <div className="mt-8 mb-10">
        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span>{t('navigation.step', { current: step, total: TOTAL_STEPS })}</span>
        </div>
        <div className="h-1 w-full rounded-full bg-bg-secondary">
          <div
            className="h-1 rounded-full bg-accent transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Choose artist */}
      {step === 1 && (
        <SlideUp>
          <h2 className="mb-6 text-xl font-semibold">{t('step1.title')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {artists.map((artist) => (
              <button
                key={artist.slug}
                type="button"
                onClick={() => updateForm('artist', artist.slug)}
                className={cn(
                  'rounded-sm border p-6 text-left transition-all',
                  form.artist === artist.slug
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-bg-secondary hover:border-accent/30',
                )}
              >
                <div className="mb-2 h-12 w-12 rounded-full bg-bg-tertiary flex items-center justify-center">
                  <span className="font-heading text-xl text-accent/50">{artist.name[0]}</span>
                </div>
                <p className="font-semibold">{artist.name}</p>
                <p className="text-sm text-accent">{artist.specialtyRo || artist.specialtyEn}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => updateForm('artist', 'unsure')}
            className={cn(
              'mt-3 w-full rounded-sm border p-4 text-center text-sm transition-all',
              form.artist === 'unsure'
                ? 'border-accent bg-accent/5 text-accent'
                : 'border-border text-text-muted hover:border-accent/30',
            )}
          >
            {t('step1.notSure')}
          </button>
        </SlideUp>
      )}

      {/* Step 2: Describe tattoo */}
      {step === 2 && (
        <SlideUp>
          <h2 className="mb-6 text-xl font-semibold">{t('step2.title')}</h2>
          <div className="space-y-5">
            <Select
              label={t('step2.bodyArea')}
              options={BODY_AREAS.map((area) => ({ value: area, label: tAreas(area) }))}
              placeholder="—"
              value={form.bodyArea}
              onChange={(e) => updateForm('bodyArea', e.target.value)}
            />
            <Select
              label={t('step2.size')}
              options={SIZE_CATEGORIES.map((size) => ({ value: size, label: tSizes(size) }))}
              placeholder="—"
              value={form.size}
              onChange={(e) => updateForm('size', e.target.value)}
            />
            <Select
              label={t('step2.style')}
              options={TATTOO_STYLES.map((style) => ({ value: style, label: tStyles(style) }))}
              placeholder="—"
              value={form.style}
              onChange={(e) => updateForm('style', e.target.value)}
            />

            {/* Artist recommendation when user chose "unsure" */}
            {form.artist === 'unsure' && form.style && (() => {
              const match = artists.find((a) => a.specialties.includes(form.style));
              if (!match) return null;
              return (
                <div className="flex items-center gap-3 rounded-sm border border-accent/30 bg-accent/5 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20">
                    <span className="font-heading text-lg text-accent">{match.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary">
                      {t('step2.style')}: <span className="font-medium text-accent">{tStyles(form.style)}</span>
                    </p>
                    <p className="text-sm text-text-primary">
                      {t('step2.recommendation')} <button type="button" className="font-semibold text-accent hover:underline" onClick={() => updateForm('artist', match.slug)}>{match.name}</button>
                    </p>
                  </div>
                </div>
              );
            })()}

            <Textarea
              label={t('step2.description')}
              placeholder={t('step2.descriptionPlaceholder')}
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
            />
            <div>
              <p className="mb-2 text-sm font-medium text-text-secondary">
                {t('step2.references')}
              </p>
              <div className="rounded-sm border border-dashed border-border bg-bg-secondary p-8 text-center">
                <p className="text-sm text-text-muted">{t('step2.referencesHelp')}</p>
              </div>
            </div>
          </div>
        </SlideUp>
      )}

      {/* Step 3: Choose date */}
      {step === 3 && (
        <SlideUp>
          <h2 className="mb-6 text-xl font-semibold">{t('step3.title')}</h2>

          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const [y, m] = currentMonth.split('-').map(Number);
                const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
                setCurrentMonth(prev);
              }}
              className="rounded px-3 py-1 text-text-secondary hover:text-text-primary"
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
              }}
              className="rounded px-3 py-1 text-text-secondary hover:text-text-primary"
            >
              →
            </button>
          </div>

          {loadingAvailability ? (
            <div className="rounded-sm border border-border bg-bg-secondary p-8 text-center">
              <p className="text-text-muted">{t('step3.loading')}</p>
            </div>
          ) : (
            <>
              {/* Calendar grid */}
              <div className="rounded-sm border border-border bg-bg-secondary p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                    <div key={i} className="text-center text-xs text-text-muted py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const [y, m] = currentMonth.split('-').map(Number);
                    const firstDay = new Date(y, m - 1, 1).getDay();
                    const daysInMonth = new Date(y, m, 0).getDate();
                    const offset = firstDay === 0 ? 6 : firstDay - 1;
                    const cells = [];

                    // Empty cells before first day
                    for (let i = 0; i < offset; i++) {
                      cells.push(<div key={`empty-${i}`} />);
                    }

                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const avail = availability.find((a) => a.date === dateStr);
                      const isAvailable = avail?.isAvailable ?? false;
                      const isSelected = form.date === dateStr;
                      const today = new Date().toISOString().split('T')[0];
                      const isPast = dateStr < today;

                      cells.push(
                        <button
                          key={day}
                          type="button"
                          disabled={!isAvailable || isPast}
                          onClick={() => { updateForm('date', dateStr); updateForm('time', ''); }}
                          className={cn(
                            'aspect-square rounded-sm text-sm transition-all',
                            isSelected
                              ? 'bg-accent text-bg-primary font-bold'
                              : isAvailable && !isPast
                                ? 'bg-bg-secondary text-text-secondary hover:bg-accent/10'
                                : 'bg-bg-tertiary text-text-muted cursor-not-allowed opacity-40',
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

              {/* Time slots for selected date */}
              {selectedDay && selectedDay.slots.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-text-secondary">{t('step3.selectDate')}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDay.slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => updateForm('time', slot)}
                        className={cn(
                          'rounded-sm border px-4 py-2 text-sm transition-all',
                          form.time === slot
                            ? 'border-accent bg-accent/10 text-accent font-medium'
                            : 'border-border text-text-secondary hover:border-accent/30',
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </SlideUp>
      )}

      {/* Step 4: Contact info */}
      {step === 4 && (
        <SlideUp>
          <h2 className="mb-6 text-xl font-semibold">{t('step4.title')}</h2>
          <div className="space-y-4">
            <Input
              label={t('step4.name')}
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
            />
            <Input
              label={t('step4.phone')}
              type="tel"
              value={form.phone}
              onChange={(e) => updateForm('phone', e.target.value)}
            />
            <Input
              label={t('step4.email')}
              type="email"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
            />
            <Select
              label={t('step4.source')}
              options={BOOKING_SOURCES.filter((s) => s !== 'walk_in').map((s) => ({
                value: s,
                label: tSources(s),
              }))}
              placeholder="—"
              value={form.source}
              onChange={(e) => updateForm('source', e.target.value)}
            />
            <label className="flex items-start gap-3 cursor-pointer mt-4">
              <input
                type="checkbox"
                checked={form.gdpr}
                onChange={(e) => updateForm('gdpr', e.target.checked)}
                className="mt-1 h-4 w-4 accent-accent"
              />
              <span className="text-sm text-text-muted">{t('step4.gdpr')}</span>
            </label>
          </div>
        </SlideUp>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && (
        <SlideUp>
          <h2 className="mb-6 text-xl font-semibold">{t('step5.title')}</h2>
          <div className="rounded-sm border border-border bg-bg-secondary p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t('step5.artist')}</span>
              <span className="font-medium capitalize">{form.artist}</span>
            </div>
            {form.bodyArea && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t('step2.bodyArea')}</span>
                <span className="font-medium">{tAreas(form.bodyArea as 'arm')}</span>
              </div>
            )}
            {form.size && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t('step2.size')}</span>
                <span className="font-medium">{tSizes(form.size as 'small')}</span>
              </div>
            )}
            {form.date && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t('step5.date')}</span>
                <span className="font-medium">{form.date}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 mt-3">
              <p className="text-sm font-medium">{form.name}</p>
              <p className="text-sm text-text-muted">{form.phone} / {form.email}</p>
            </div>
            {form.description && (
              <p className="text-sm text-text-secondary mt-2">{form.description}</p>
            )}
          </div>
        </SlideUp>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? (
          <Button variant="ghost" onClick={prevStep}>
            {t('navigation.back')}
          </Button>
        ) : (
          <div />
        )}
        {step < TOTAL_STEPS ? (
          <Button onClick={nextStep} disabled={step === 1 && !form.artist}>
            {t('navigation.next')}
          </Button>
        ) : (
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {t('step5.submit')}
          </Button>
        )}
      </div>
    </div>
  );
}
