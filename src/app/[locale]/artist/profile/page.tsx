'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Camera, Loader2, UserCircle } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { GALLERY_UPLOAD_CONFIG } from '@/lib/constants';

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
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    bioRo: '',
    bioEn: '',
    specialtyRo: '',
    specialtyEn: '',
    instagramUrl: '',
    tiktokUrl: '',
    profileImage: '',
  });

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
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

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
        setForm((f) => ({ ...f, profileImage: data.data.profileImage || '' }));
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
            {form.profileImage ? (
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
                onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 rounded-sm border border-border bg-bg-secondary p-6">
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
