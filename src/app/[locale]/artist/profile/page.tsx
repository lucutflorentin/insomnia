'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Camera, Loader2, Plus, UserCircle, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { GALLERY_UPLOAD_CONFIG, TATTOO_STYLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ArtistProfile {
  id: number;
  name: string;
  slug: string;
  bioRo: string | null;
  bioEn: string | null;
  specialtyRo: string | null;
  specialtyEn: string | null;
  profileImage: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  specialties: string[];
}

export default function ArtistProfilePage() {
  const t = useTranslations('artist.profile');
  const tStyles = useTranslations('artists.styles');
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customStyle, setCustomStyle] = useState('');

  const [form, setForm] = useState({
    bioRo: '',
    bioEn: '',
    specialtyRo: '',
    specialtyEn: '',
    instagramUrl: '',
    tiktokUrl: '',
    profileImage: '',
    specialties: [] as string[],
  });

  /**
   * Returns a human-readable label for a specialty value, falling back to
   * the raw value when there's no translation (i.e. for custom styles).
   */
  const renderSpecialtyLabel = (value: string): string => {
    try {
      const translated = tStyles(value as 'realism');
      // next-intl returns the key string when missing; fall back to the value.
      return translated && translated !== value ? translated : value;
    } catch {
      return value;
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setForm((prev) => {
      const exists = prev.specialties.some(
        (s) => s.toLowerCase() === specialty.toLowerCase(),
      );
      const next = exists
        ? prev.specialties.filter(
            (s) => s.toLowerCase() !== specialty.toLowerCase(),
          )
        : [...prev.specialties, specialty];
      return { ...prev, specialties: next.slice(0, 20) };
    });
  };

  const addCustomStyle = () => {
    const trimmed = customStyle.trim().slice(0, 50);
    if (!trimmed) return;
    if (
      form.specialties.some((s) => s.toLowerCase() === trimmed.toLowerCase())
    ) {
      setCustomStyle('');
      return;
    }
    setForm((prev) => ({
      ...prev,
      specialties: [...prev.specialties, trimmed].slice(0, 20),
    }));
    setCustomStyle('');
  };

  useEffect(() => {
    fetch('/api/artist/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const p = data.data;
          setProfile(p);
          setForm({
            bioRo: p.bioRo || '',
            bioEn: p.bioEn || '',
            specialtyRo: p.specialtyRo || '',
            specialtyEn: p.specialtyEn || '',
            instagramUrl: p.instagramUrl || '',
            tiktokUrl: p.tiktokUrl || '',
            profileImage: p.profileImage || '',
            specialties: Array.isArray(p.specialties) ? p.specialties : [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
    };
  }, [profileImagePreview]);

  const handleProfileImageSelect = (file: File | null) => {
    if (!file) {
      setProfileImageFile(null);
      setProfileImagePreview(null);
      return;
    }

    if (!(GALLERY_UPLOAD_CONFIG.allowedFileTypes as readonly string[]).includes(file.type)) {
      showToast(t('invalidImageType'), 'error');
      setProfileImageFile(null);
      setProfileImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > GALLERY_UPLOAD_CONFIG.maxFileSize) {
      showToast(t('imageTooLarge'), 'error');
      setProfileImageFile(null);
      setProfileImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let profileImage = form.profileImage;

      if (profileImageFile) {
        if (!(GALLERY_UPLOAD_CONFIG.allowedFileTypes as readonly string[]).includes(profileImageFile.type)) {
          showToast(t('invalidImageType'), 'error');
          setIsSaving(false);
          return;
        }
        if (profileImageFile.size > GALLERY_UPLOAD_CONFIG.maxFileSize) {
          showToast(t('imageTooLarge'), 'error');
          setIsSaving(false);
          return;
        }

        const uploadForm = new FormData();
        uploadForm.append('file', profileImageFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadForm,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          showToast(uploadData.error || t('imageUploadFailed'), 'error');
          setIsSaving(false);
          return;
        }
        profileImage = uploadData.data.imagePath;
      }

      const res = await fetch('/api/artist/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, profileImage }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setProfileImageFile(null);
        setProfileImagePreview(null);
        setForm((f) => ({
          ...f,
          profileImage: data.data.profileImage || '',
          specialties: Array.isArray(data.data.specialties)
            ? data.data.specialties
            : [],
        }));
        showToast(t('saved'), 'success');
      } else {
        showToast(data.error || t('error'), 'error');
      }
    } catch {
      showToast(t('error'), 'error');
    } finally {
      setIsSaving(false);
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
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-heading text-2xl text-text-primary">{t('title')}</h1>

      <div className="mb-6 rounded-sm border border-border bg-bg-secondary p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-accent/30 bg-bg-tertiary">
            {profileImagePreview ? (
              <div
                role="img"
                aria-label={profile?.name || t('profileImage')}
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url("${profileImagePreview}")` }}
              />
            ) : form.profileImage ? (
              <Image
                src={form.profileImage}
                alt={profile?.name || t('profileImage')}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserCircle className="h-12 w-12 text-text-muted" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg text-text-primary">{profile?.name}</p>
            <p className="text-sm text-text-muted">@{profile?.slug}</p>
            {profileImageFile && (
              <p className="mt-1 truncate text-xs text-accent">{profileImageFile.name}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
              >
                {isSaving && profileImageFile ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                {t('changePhoto')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleProfileImageSelect(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 rounded-sm border border-border bg-bg-secondary p-6">
        <div>
          <p className="mb-1 text-sm font-medium text-text-secondary">
            {t('stylesTitle')}
          </p>
          <p className="mb-3 text-xs text-text-muted">{t('stylesHint')}</p>

          {form.specialties.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {form.specialties.map((style) => (
                <span
                  key={style}
                  className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent"
                >
                  {renderSpecialtyLabel(style)}
                  <button
                    type="button"
                    onClick={() => toggleSpecialty(style)}
                    aria-label={t('stylesRemove', {
                      style: renderSpecialtyLabel(style),
                    })}
                    className="ml-0.5 rounded-full p-0.5 text-accent/80 transition-colors hover:bg-accent/20 hover:text-accent"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="mb-2 text-xs text-text-muted">
            {t('stylesPickFromList')}
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {TATTOO_STYLES.filter((s) => s !== 'other').map((style) => {
              const isSelected = form.specialties.some(
                (s) => s.toLowerCase() === style.toLowerCase(),
              );
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleSpecialty(style)}
                  aria-pressed={isSelected}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-all',
                    isSelected
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-bg-tertiary text-text-secondary hover:border-accent/40 hover:text-text-primary',
                  )}
                >
                  {renderSpecialtyLabel(style)}
                </button>
              );
            })}
          </div>

          <p className="mb-2 text-xs text-text-muted">{t('stylesAddCustom')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value.slice(0, 50))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomStyle();
                }
              }}
              placeholder={t('stylesCustomPlaceholder')}
              className="min-w-0 flex-1 rounded-sm border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
              maxLength={50}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addCustomStyle}
              disabled={!customStyle.trim()}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t('stylesAddBtn')}
            </Button>
          </div>
        </div>

        <Textarea
          label={t('specialtyRo')}
          value={form.specialtyRo}
          onChange={(e) => setForm((f) => ({ ...f, specialtyRo: e.target.value }))}
        />
        <Textarea
          label={t('specialtyEn')}
          value={form.specialtyEn}
          onChange={(e) => setForm((f) => ({ ...f, specialtyEn: e.target.value }))}
        />
        <Textarea
          label={t('bioRo')}
          value={form.bioRo}
          onChange={(e) => setForm((f) => ({ ...f, bioRo: e.target.value }))}
        />
        <Textarea
          label={t('bioEn')}
          value={form.bioEn}
          onChange={(e) => setForm((f) => ({ ...f, bioEn: e.target.value }))}
        />
        <Input
          label={t('instagram')}
          value={form.instagramUrl}
          onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
          placeholder="https://instagram.com/..."
        />
        <Input
          label={t('tiktok')}
          value={form.tiktokUrl}
          onChange={(e) => setForm((f) => ({ ...f, tiktokUrl: e.target.value }))}
          placeholder="https://tiktok.com/@..."
        />
        <div className="pt-2">
          <Button onClick={handleSave} isLoading={isSaving}>
            {isSaving ? t('saving') : t('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
