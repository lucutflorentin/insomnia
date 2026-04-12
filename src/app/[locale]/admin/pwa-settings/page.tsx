'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Smartphone } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface PWASettings {
  pwa_name: string;
  pwa_short_name: string;
  pwa_description: string;
  pwa_theme_color: string;
  pwa_background_color: string;
  pwa_display: string;
  pwa_start_url: string;
  pwa_icon_192: string;
  pwa_icon_512: string;
}

const defaultSettings: PWASettings = {
  pwa_name: 'Insomnia Tattoo',
  pwa_short_name: 'Insomnia',
  pwa_description: 'Studio premium de tatuaje in Mamaia Nord, Constanta',
  pwa_theme_color: '#0A0A0A',
  pwa_background_color: '#0A0A0A',
  pwa_display: 'standalone',
  pwa_start_url: '/',
  pwa_icon_192: '',
  pwa_icon_512: '',
};

export default function AdminPWASettingsPage() {
  const t = useTranslations('admin.pwaSettings');
  const [settings, setSettings] = useState<PWASettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadingSize, setUploadingSize] = useState<number | null>(null);
  const [showManifestPreview, setShowManifestPreview] = useState(false);
  const fileInput192Ref = useRef<HTMLInputElement>(null);
  const fileInput512Ref = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pwa-settings');
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

  const handleChange = (key: keyof PWASettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveMessage('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const res = await fetch('/api/admin/pwa-settings', {
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

  const handleIconUpload = async (size: 192 | 512) => {
    const input = size === 192 ? fileInput192Ref.current : fileInput512Ref.current;
    if (!input?.files?.[0]) return;

    setUploadingSize(size);
    const formData = new FormData();
    formData.append('file', input.files[0]);
    formData.append('size', String(size));

    try {
      const res = await fetch('/api/admin/pwa-settings/upload-icon', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        const key = `pwa_icon_${size}` as keyof PWASettings;
        setSettings((prev) => ({ ...prev, [key]: data.data.iconPath }));
        setSaveMessage(t('iconUploaded'));
      } else {
        setSaveMessage(data.error || t('uploadError'));
      }
    } catch {
      setSaveMessage(t('uploadError'));
    } finally {
      setUploadingSize(null);
      input.value = '';
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
        {/* App Info */}
        <section className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">{t('appInfo')}</h2>
          <div className="space-y-4">
            <Input
              label={t('appName')}
              value={settings.pwa_name}
              onChange={(e) => handleChange('pwa_name', e.target.value)}
              placeholder="Insomnia Tattoo"
            />
            <Input
              label={t('shortName')}
              value={settings.pwa_short_name}
              onChange={(e) => handleChange('pwa_short_name', e.target.value)}
              placeholder="Insomnia"
            />
            <Input
              label={t('description')}
              value={settings.pwa_description}
              onChange={(e) => handleChange('pwa_description', e.target.value)}
              placeholder="Studio premium de tatuaje..."
            />
          </div>
        </section>

        {/* Display */}
        <section className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">{t('display')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                {t('displayMode')}
              </label>
              <select
                value={settings.pwa_display}
                onChange={(e) => handleChange('pwa_display', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
              >
                <option value="standalone">Standalone</option>
                <option value="fullscreen">Fullscreen</option>
                <option value="minimal-ui">Minimal UI</option>
                <option value="browser">Browser</option>
              </select>
            </div>
            <Input
              label={t('startUrl')}
              value={settings.pwa_start_url}
              onChange={(e) => handleChange('pwa_start_url', e.target.value)}
              placeholder="/"
            />
          </div>
        </section>

        {/* Colors */}
        <section className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">{t('colors')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                {t('themeColor')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.pwa_theme_color}
                  onChange={(e) => handleChange('pwa_theme_color', e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent"
                />
                <Input
                  value={settings.pwa_theme_color}
                  onChange={(e) => handleChange('pwa_theme_color', e.target.value)}
                  placeholder="#0A0A0A"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                {t('backgroundColor')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.pwa_background_color}
                  onChange={(e) => handleChange('pwa_background_color', e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent"
                />
                <Input
                  value={settings.pwa_background_color}
                  onChange={(e) => handleChange('pwa_background_color', e.target.value)}
                  placeholder="#0A0A0A"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Icons */}
        <section className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">{t('icons')}</h2>
          <p className="mb-4 text-sm text-text-muted">{t('iconsDescription')}</p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* 192x192 */}
            <div className="flex flex-col items-center gap-3 rounded-lg border border-white/5 bg-bg-primary p-4">
              <p className="text-sm font-medium text-text-secondary">192 x 192 px</p>
              {settings.pwa_icon_192 ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-white/10">
                  <Image
                    src={settings.pwa_icon_192}
                    alt="Icon 192"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-white/20 text-text-muted">
                  <Smartphone className="h-8 w-8 text-text-muted" />
                </div>
              )}
              <input
                ref={fileInput192Ref}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={() => handleIconUpload(192)}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInput192Ref.current?.click()}
                disabled={uploadingSize === 192}
              >
                {uploadingSize === 192 ? t('uploading') : t('uploadIcon')}
              </Button>
            </div>

            {/* 512x512 */}
            <div className="flex flex-col items-center gap-3 rounded-lg border border-white/5 bg-bg-primary p-4">
              <p className="text-sm font-medium text-text-secondary">512 x 512 px</p>
              {settings.pwa_icon_512 ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-white/10">
                  <Image
                    src={settings.pwa_icon_512}
                    alt="Icon 512"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-white/20 text-text-muted">
                  <Smartphone className="h-8 w-8 text-text-muted" />
                </div>
              )}
              <input
                ref={fileInput512Ref}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={() => handleIconUpload(512)}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInput512Ref.current?.click()}
                disabled={uploadingSize === 512}
              >
                {uploadingSize === 512 ? t('uploading') : t('uploadIcon')}
              </Button>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('saving') : t('save')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowManifestPreview(true)}
          >
            {t('previewManifest')}
          </Button>
          {saveMessage && (
            <p className={`text-sm ${saveMessage === t('saved') || saveMessage === t('iconUploaded') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMessage}
            </p>
          )}
        </div>
      </div>

      {/* Manifest Preview Modal */}
      <Modal
        isOpen={showManifestPreview}
        onClose={() => setShowManifestPreview(false)}
        title={t('previewManifest')}
      >
        <pre className="max-h-96 overflow-auto rounded-lg bg-bg-primary p-4 text-sm text-text-secondary font-mono">
          {JSON.stringify(
            {
              name: settings.pwa_name,
              short_name: settings.pwa_short_name,
              description: settings.pwa_description,
              start_url: settings.pwa_start_url,
              display: settings.pwa_display,
              background_color: settings.pwa_background_color,
              theme_color: settings.pwa_theme_color,
              orientation: 'portrait-primary',
              icons: [
                settings.pwa_icon_192 && {
                  src: settings.pwa_icon_192,
                  sizes: '192x192',
                  type: 'image/png',
                },
                settings.pwa_icon_512 && {
                  src: settings.pwa_icon_512,
                  sizes: '512x512',
                  type: 'image/png',
                },
              ].filter(Boolean),
              categories: ['lifestyle', 'business'],
            },
            null,
            2,
          )}
        </pre>
      </Modal>
    </div>
  );
}
