'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Artist {
  id: number;
  name: string;
  email: string;
  slug: string;
  bio?: string;
  bioEn?: string;
  specialty?: string;
  specialtyEn?: string;
  instagram?: string;
  tiktok?: string;
  profileImage?: string;
  isActive: boolean;
  _count?: { bookings: number };
}

const specialtyOptions = [
  { value: 'realism', label: 'Realism' },
  { value: 'graphic', label: 'Graphic' },
  { value: 'linework', label: 'Linework' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'blackwork', label: 'Blackwork' },
  { value: 'color', label: 'Color' },
  { value: 'portraits', label: 'Portraits' },
];

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default function AdminArtistsPage() {
  const t = useTranslations('admin.artists');
  const { showToast } = useToast();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmArtistId, setConfirmArtistId] = useState<number | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formBioRo, setFormBioRo] = useState('');
  const [formBioEn, setFormBioEn] = useState('');
  const [formSpecialtyRo, setFormSpecialtyRo] = useState('');
  const [formSpecialtyEn, setFormSpecialtyEn] = useState('');
  const [formSpecialties, setFormSpecialties] = useState<string[]>([]);
  const [formInstagram, setFormInstagram] = useState('');
  const [formTiktok, setFormTiktok] = useState('');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchArtists = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/artists');
      if (res.ok) {
        const json = await res.json();
        const list = json.success ? json.data : json;
        setArtists(Array.isArray(list) ? list : []);
      }
    } catch {
      showToast('Failed to load artists.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword(generatePassword());
    setFormBioRo('');
    setFormBioEn('');
    setFormSpecialtyRo('');
    setFormSpecialtyEn('');
    setFormSpecialties([]);
    setFormInstagram('');
    setFormTiktok('');
    setFormImage(null);
    setFormError('');
    setEditingArtist(null);
    setGeneratedCredentials(null);
  };

  const openCreateModal = () => {
    resetForm();
    setFormPassword(generatePassword());
    setIsModalOpen(true);
  };

  const openEditModal = (artist: Artist) => {
    setEditingArtist(artist);
    setFormName(artist.name);
    setFormEmail(artist.email);
    setFormPassword('');
    setFormBioRo(artist.bio || '');
    setFormBioEn(artist.bioEn || '');
    setFormSpecialtyRo(artist.specialty || '');
    setFormSpecialtyEn(artist.specialtyEn || '');
    setFormSpecialties([]);
    setFormInstagram(artist.instagram || '');
    setFormTiktok(artist.tiktok || '');
    setFormImage(null);
    setFormError('');
    setGeneratedCredentials(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);

    try {
      // If an image file was selected, upload it first
      let profileImagePath: string | undefined;
      if (formImage) {
        const uploadForm = new FormData();
        uploadForm.append('file', formImage);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadForm,
        });
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          setFormError(uploadErr.error || 'Image upload failed.');
          setIsSaving(false);
          return;
        }
        const uploadData = await uploadRes.json();
        profileImagePath = uploadData.data?.imagePath;
      }

      const body: Record<string, unknown> = {
        name: formName,
        email: formEmail,
        bioRo: formBioRo,
        bioEn: formBioEn,
        specialtyRo: formSpecialtyRo,
        specialtyEn: formSpecialtyEn,
        specialties: formSpecialties,
        instagramUrl: formInstagram || null,
        tiktokUrl: formTiktok || null,
      };
      if (formPassword) body.password = formPassword;
      if (profileImagePath) body.profileImage = profileImagePath;

      const url = editingArtist
        ? `/api/admin/artists/${editingArtist.id}`
        : '/api/admin/artists';
      const method = editingArtist ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (!editingArtist) {
          setGeneratedCredentials({ email: formEmail, password: formPassword });
          showToast('Artist created successfully.', 'success');
        } else {
          setIsModalOpen(false);
          showToast('Artist updated successfully.', 'success');
        }
        fetchArtists();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Save failed.');
      }
    } catch {
      setFormError('Connection error.');
    } finally {
      setIsSaving(false);
    }
  };

  const requestDeactivate = (artistId: number) => {
    setConfirmArtistId(artistId);
    setConfirmOpen(true);
  };

  const handleDeactivate = async () => {
    if (confirmArtistId === null) return;
    setIsDeactivating(true);
    try {
      const res = await fetch(`/api/admin/artists/${confirmArtistId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Artist deactivated.', 'success');
        fetchArtists();
      } else {
        showToast('Failed to deactivate artist.', 'error');
      }
    } catch {
      showToast('Connection error.', 'error');
    } finally {
      setIsDeactivating(false);
      setConfirmOpen(false);
      setConfirmArtistId(null);
    }
  };

  const handleActivate = async (artistId: number) => {
    setActivatingId(artistId);
    try {
      const res = await fetch(`/api/admin/artists/${artistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) {
        showToast('Artist activated.', 'success');
        fetchArtists();
      } else {
        showToast('Failed to activate artist.', 'error');
      }
    } catch {
      showToast('Connection error.', 'error');
    } finally {
      setActivatingId(null);
    }
  };

  const toggleSpecialty = (value: string) => {
    setFormSpecialties((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
        <Button onClick={openCreateModal}>{t('addArtist')}</Button>
      </div>

      {/* Artists Grid */}
      {artists.length === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
          <p className="text-text-muted">{t('noArtists')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="rounded-sm border border-border bg-bg-secondary p-5 transition-colors hover:border-border-light"
            >
              <div className="mb-4 flex items-center gap-4">
                {artist.profileImage ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-full">
                    <Image
                      src={artist.profileImage}
                      alt={artist.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-lg font-bold text-accent">
                    {artist.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-text-primary">{artist.name}</h3>
                  <p className="truncate text-xs text-text-muted">{artist.specialty || 'No specialty'}</p>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    artist.isActive
                      ? 'bg-success/10 text-success'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {artist.isActive ? t('active') : t('inactive')}
                </span>
                <span className="text-xs text-text-muted">
                  {artist._count?.bookings || 0} bookings
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(artist)}
                >
                  {t('editArtist')}
                </Button>
                {artist.isActive ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => requestDeactivate(artist.id)}
                  >
                    {t('deactivate')}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleActivate(artist.id)}
                    isLoading={activatingId === artist.id}
                  >
                    {t('activate')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title={t('deactivate')}
        message="Are you sure you want to deactivate this artist? They will no longer appear on the site."
        confirmLabel={t('deactivate')}
        cancelLabel={t('cancel')}
        variant="danger"
        isLoading={isDeactivating}
        onConfirm={handleDeactivate}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmArtistId(null);
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingArtist ? t('editArtist') : t('addArtist')}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {generatedCredentials ? (
          <div className="space-y-4">
            <div className="rounded-sm border border-success/30 bg-success/10 p-4">
              <p className="mb-2 text-sm font-semibold text-success">Artist created successfully!</p>
              <p className="text-sm text-text-secondary">Save these credentials:</p>
            </div>
            <div className="space-y-3 rounded-sm bg-bg-primary p-4">
              <div>
                <p className="text-xs text-text-muted">{t('email')}</p>
                <p className="font-mono text-sm text-text-primary">{generatedCredentials.email}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">{t('generatedPassword')}</p>
                <p className="font-mono text-sm text-accent">{generatedCredentials.password}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="w-full"
            >
              {t('cancel')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('name')}
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
              <Input
                label={t('email')}
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>

            {!editingArtist && (
              <div>
                <Input
                  label={t('password')}
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-text-muted">
                  Auto-generated password. You can change it.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Textarea
                label={t('bioRo')}
                value={formBioRo}
                onChange={(e) => setFormBioRo(e.target.value)}
                className="min-h-[80px]"
              />
              <Textarea
                label={t('bioEn')}
                value={formBioEn}
                onChange={(e) => setFormBioEn(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('specialtyRo')}
                type="text"
                value={formSpecialtyRo}
                onChange={(e) => setFormSpecialtyRo(e.target.value)}
              />
              <Input
                label={t('specialtyEn')}
                type="text"
                value={formSpecialtyEn}
                onChange={(e) => setFormSpecialtyEn(e.target.value)}
              />
            </div>

            {/* Specialties checkboxes */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                {t('specialties')}
              </label>
              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      formSpecialties.includes(opt.value)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-bg-primary text-text-muted hover:border-border-light'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formSpecialties.includes(opt.value)}
                      onChange={() => toggleSpecialty(opt.value)}
                      className="hidden"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('instagram')}
                type="url"
                value={formInstagram}
                onChange={(e) => setFormInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
              />
              <Input
                label={t('tiktok')}
                type="url"
                value={formTiktok}
                onChange={(e) => setFormTiktok(e.target.value)}
                placeholder="https://tiktok.com/@..."
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                {t('profileImage')}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormImage(e.target.files?.[0] || null)}
                className="w-full rounded-sm border border-border bg-bg-primary px-4 py-3 text-sm text-text-primary file:mr-4 file:rounded-sm file:border-0 file:bg-accent/10 file:px-4 file:py-1 file:text-sm file:text-accent"
              />
            </div>

            {formError && (
              <div className="rounded-sm border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {formError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" isLoading={isSaving} className="flex-1">
                {editingArtist ? t('save') : t('addArtist')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
