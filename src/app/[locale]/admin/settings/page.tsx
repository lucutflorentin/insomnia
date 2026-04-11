'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
};

export default function AdminSettingsPage() {
  const t = useTranslations('admin.settings');
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');

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
    setSaveMessage('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        setSaveMessage(t('saved'));
      } else {
        setSaveMessage(data.error || t('saveError'));
      }
    } catch {
      setSaveMessage(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTesting(true);
    setTestMessage('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-smtp' }),
      });

      const data = await res.json();
      setTestMessage(data.success ? data.message : data.error);
    } catch {
      setTestMessage(t('smtpError'));
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
      <h1 className="mb-8 font-heading text-2xl text-text-primary">{t('title')}</h1>

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
            />
            <Input
              label={t('instagramMadalina')}
              value={settings.social_instagram_madalina}
              onChange={(e) => handleChange('social_instagram_madalina', e.target.value)}
              placeholder="https://instagram.com/..."
            />
            <Input
              label={t('instagramFlorentin')}
              value={settings.social_instagram_florentin}
              onChange={(e) => handleChange('social_instagram_florentin', e.target.value)}
              placeholder="https://instagram.com/..."
            />
            <Input
              label="TikTok"
              value={settings.social_tiktok}
              onChange={(e) => handleChange('social_tiktok', e.target.value)}
              placeholder="https://tiktok.com/@..."
            />
            <Input
              label="Facebook"
              value={settings.social_facebook}
              onChange={(e) => handleChange('social_facebook', e.target.value)}
              placeholder="https://facebook.com/..."
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

        {/* SMTP Test */}
        <section className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">{t('smtpTest')}</h2>
          <p className="mb-4 text-sm text-text-muted">{t('smtpDescription')}</p>
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestSmtp}
              disabled={isTesting}
            >
              {isTesting ? t('smtpTesting') : t('smtpSendTest')}
            </Button>
            {testMessage && (
              <p className={`text-sm ${testMessage.includes('successful') || testMessage.includes('succes') ? 'text-green-400' : 'text-red-400'}`}>
                {testMessage}
              </p>
            )}
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('saving') : t('save')}
          </Button>
          {saveMessage && (
            <p className={`text-sm ${saveMessage === t('saved') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
