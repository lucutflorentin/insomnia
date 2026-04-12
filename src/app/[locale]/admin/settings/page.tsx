'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Settings, Globe, Bell, Search as SearchIcon, Save, SendHorizontal } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface SettingsData {
  studio_phone: string;
  studio_email: string;
  studio_address: string;
  google_maps_url: string;
  social_instagram: string;
  social_instagram_madalina: string;
  social_instagram_florentin: string;
  social_tiktok: string;
  social_facebook: string;
  booking_advance_days: string;
  booking_consultation_minutes: string;
  booking_max_reference_images: string;
  meta_title: string;
  meta_description: string;
  email_on_new_booking: string;
  email_on_new_review: string;
}

const defaultSettings: SettingsData = {
  studio_phone: '',
  studio_email: '',
  studio_address: '',
  google_maps_url: '',
  social_instagram: '',
  social_instagram_madalina: '',
  social_instagram_florentin: '',
  social_tiktok: '',
  social_facebook: '',
  booking_advance_days: '30',
  booking_consultation_minutes: '60',
  booking_max_reference_images: '3',
  meta_title: '',
  meta_description: '',
  email_on_new_booking: 'true',
  email_on_new_review: 'true',
};

function isValidEmail(email: string): boolean {
  if (!email) return true; // empty is ok
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
  if (!url) return true; // empty is ok
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default function AdminSettingsPage() {
  const t = useTranslations('admin.settings');
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof SettingsData, string>>>({});

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSettings((prev) => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(json.data).filter(([, v]) => v !== null),
            ),
          }));
        }
      }
    } catch {
      // Settings may not exist yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: keyof SettingsData, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // Clear the specific validation error when user edits
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleToggle = (key: 'email_on_new_booking' | 'email_on_new_review') => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true',
    }));
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof SettingsData, string>> = {};

    if (settings.studio_email && !isValidEmail(settings.studio_email)) {
      errors.studio_email = t('validationEmail');
    }

    const urlFields: (keyof SettingsData)[] = [
      'google_maps_url',
      'social_instagram',
      'social_instagram_madalina',
      'social_instagram_florentin',
      'social_tiktok',
      'social_facebook',
    ];

    for (const field of urlFields) {
      if (settings[field] && !isValidUrl(settings[field])) {
        errors[field] = t('validationUrl');
      }
    }

    if (settings.meta_description && settings.meta_description.length > 160) {
      errors.meta_description = t('validationMetaDescLength');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      showToast(t('validationFailed'), 'error');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        showToast(t('saved'), 'success');
      } else {
        showToast(data.error || t('saveError'), 'error');
      }
    } catch {
      showToast(t('saveError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTesting(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-smtp' }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(data.error || t('smtpError'), 'error');
      }
    } catch {
      showToast(t('smtpError'), 'error');
    } finally {
      setIsTesting(false);
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <Settings className="h-6 w-6 text-accent" />
        <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
      </div>

      <div className="space-y-8">
        {/* Studio Info */}
        <section className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">{t('studioInfo')}</h2>
          <div className="space-y-4">
            <Input
              label={t('phone')}
              value={settings.studio_phone}
              onChange={(e) => handleChange('studio_phone', e.target.value)}
              placeholder="+40 7XX XXX XXX"
            />
            <Input
              label={t('email')}
              type="email"
              value={settings.studio_email}
              onChange={(e) => handleChange('studio_email', e.target.value)}
              placeholder="contact@insomniatattoo.ro"
              error={validationErrors.studio_email}
            />
            <Input
              label={t('address')}
              value={settings.studio_address}
              onChange={(e) => handleChange('studio_address', e.target.value)}
              placeholder="Mamaia Nord, Constanta, Romania"
            />
            <Input
              label={t('googleMaps')}
              value={settings.google_maps_url}
              onChange={(e) => handleChange('google_maps_url', e.target.value)}
              placeholder="https://maps.google.com/..."
              error={validationErrors.google_maps_url}
            />
          </div>
        </section>

        {/* Social Media */}
        <section className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">{t('socialMedia')}</h2>
          <div className="space-y-4">
            <Input
              label={t('instagram')}
              value={settings.social_instagram}
              onChange={(e) => handleChange('social_instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              error={validationErrors.social_instagram}
            />
            <Input
              label={t('instagramMadalina')}
              value={settings.social_instagram_madalina}
              onChange={(e) => handleChange('social_instagram_madalina', e.target.value)}
              placeholder="https://instagram.com/..."
              error={validationErrors.social_instagram_madalina}
            />
            <Input
              label={t('instagramFlorentin')}
              value={settings.social_instagram_florentin}
              onChange={(e) => handleChange('social_instagram_florentin', e.target.value)}
              placeholder="https://instagram.com/..."
              error={validationErrors.social_instagram_florentin}
            />
            <Input
              label="TikTok"
              value={settings.social_tiktok}
              onChange={(e) => handleChange('social_tiktok', e.target.value)}
              placeholder="https://tiktok.com/@..."
              error={validationErrors.social_tiktok}
            />
            <Input
              label="Facebook"
              value={settings.social_facebook}
              onChange={(e) => handleChange('social_facebook', e.target.value)}
              placeholder="https://facebook.com/..."
              error={validationErrors.social_facebook}
            />
          </div>
        </section>

        {/* Booking Config */}
        <section className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">{t('bookingConfig')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label={t('advanceDays')}
              type="number"
              value={settings.booking_advance_days}
              onChange={(e) => handleChange('booking_advance_days', e.target.value)}
              min={1}
              max={365}
            />
            <Input
              label={t('consultationMinutes')}
              type="number"
              value={settings.booking_consultation_minutes}
              onChange={(e) => handleChange('booking_consultation_minutes', e.target.value)}
              min={15}
              max={480}
            />
            <Input
              label={t('maxReferenceImages')}
              type="number"
              value={settings.booking_max_reference_images}
              onChange={(e) => handleChange('booking_max_reference_images', e.target.value)}
              min={0}
              max={10}
            />
          </div>
        </section>

        {/* SEO Section */}
        <section className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <div className="mb-4 flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">{t('seo')}</h2>
          </div>
          <p className="mb-4 text-sm text-text-muted">{t('seoDescription')}</p>
          <div className="space-y-4">
            <Input
              label={t('metaTitle')}
              value={settings.meta_title}
              onChange={(e) => handleChange('meta_title', e.target.value)}
              placeholder={t('metaTitlePlaceholder')}
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                {t('metaDescription')}
              </label>
              <textarea
                value={settings.meta_description}
                onChange={(e) => handleChange('meta_description', e.target.value)}
                placeholder={t('metaDescriptionPlaceholder')}
                rows={3}
                maxLength={160}
                className={`w-full rounded-sm border bg-bg-secondary px-4 py-3 text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:ring-1 ${
                  validationErrors.meta_description
                    ? 'border-error focus:border-error focus:ring-error/50'
                    : 'border-border focus:border-accent focus:ring-accent/50'
                }`}
              />
              <div className="mt-1 flex justify-between">
                {validationErrors.meta_description ? (
                  <p className="text-sm text-error">{validationErrors.meta_description}</p>
                ) : (
                  <span />
                )}
                <span className={`text-xs ${settings.meta_description.length > 155 ? 'text-warning' : 'text-text-muted'}`}>
                  {settings.meta_description.length}/160
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">{t('notifications')}</h2>
          </div>
          <p className="mb-4 text-sm text-text-muted">{t('notificationsDescription')}</p>
          <div className="space-y-4">
            {/* email_on_new_booking toggle */}
            <div className="flex items-center justify-between rounded-sm border border-border p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">{t('emailOnNewBooking')}</p>
                <p className="text-xs text-text-muted">{t('emailOnNewBookingDesc')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.email_on_new_booking === 'true'}
                onClick={() => handleToggle('email_on_new_booking')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  settings.email_on_new_booking === 'true' ? 'bg-accent' : 'bg-border'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                    settings.email_on_new_booking === 'true' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* email_on_new_review toggle */}
            <div className="flex items-center justify-between rounded-sm border border-border p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">{t('emailOnNewReview')}</p>
                <p className="text-xs text-text-muted">{t('emailOnNewReviewDesc')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.email_on_new_review === 'true'}
                onClick={() => handleToggle('email_on_new_review')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  settings.email_on_new_review === 'true' ? 'bg-accent' : 'bg-border'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                    settings.email_on_new_review === 'true' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* SMTP Test */}
        <section className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <div className="mb-4 flex items-center gap-2">
            <SendHorizontal className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">{t('smtpTest')}</h2>
          </div>
          <p className="mb-4 text-sm text-text-muted">{t('smtpDescription')}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestSmtp}
            disabled={isTesting}
          >
            {isTesting ? t('smtpTesting') : t('smtpSendTest')}
          </Button>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? t('saving') : t('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
