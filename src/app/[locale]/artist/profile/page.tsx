'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

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

  const [form, setForm] = useState({
    bioRo: '',
    bioEn: '',
    specialtyRo: '',
    specialtyEn: '',
    instagramUrl: '',
    tiktokUrl: '',
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
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/artist/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
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

      {/* Profile image preview */}
      {profile?.profileImage && (
        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-accent/30">
            <Image
              src={profile.profileImage}
              alt={profile.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-heading text-lg text-text-primary">{profile.name}</p>
            <p className="text-sm text-text-muted">@{profile.slug}</p>
          </div>
        </div>
      )}

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
