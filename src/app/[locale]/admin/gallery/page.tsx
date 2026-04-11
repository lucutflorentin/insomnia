'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { TATTOO_STYLES } from '@/lib/constants';

interface GalleryItem {
  id: number;
  artistId: number;
  imagePath: string;
  thumbnailPath: string | null;
  titleRo: string | null;
  titleEn: string | null;
  style: string | null;
  bodyArea: string | null;
  isFeatured: boolean;
  isVisible: boolean;
  sortOrder: number;
  artist: { id: number; name: string; slug: string };
}

interface Artist {
  id: number;
  name: string;
  slug: string;
}

export default function AdminGalleryPage() {
  const t = useTranslations('admin.gallery');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editItem, setEditItem] = useState<GalleryItem | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/gallery?limit=50');
    if (res.ok) {
      const data = await res.json();
      setItems(data.data);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetch('/api/artists')
      .then((r) => r.json())
      .then((d) => setArtists(d.data || []));
  }, [fetchItems]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });

      if (!uploadRes.ok) {
        alert(t('uploadFailed'));
        return;
      }

      const uploadData = await uploadRes.json();

      // Create gallery item (default to first artist)
      const artistId = artists[0]?.id;
      if (!artistId) return;

      await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          imagePath: uploadData.data.imagePath,
          thumbnailPath: uploadData.data.thumbnailPath,
        }),
      });

      fetchItems();
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const toggleFeatured = async (item: GalleryItem) => {
    await fetch(`/api/gallery/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFeatured: !item.isFeatured }),
    });
    fetchItems();
  };

  const toggleVisible = async (item: GalleryItem) => {
    await fetch(`/api/gallery/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !item.isVisible }),
    });
    fetchItems();
  };

  const deleteItem = async (item: GalleryItem) => {
    if (!confirm(t('confirmDelete'))) return;
    await fetch(`/api/gallery/${item.id}`, { method: 'DELETE' });
    fetchItems();
  };

  const saveEdit = async () => {
    if (!editItem) return;
    await fetch(`/api/gallery/${editItem.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titleRo: editItem.titleRo,
        titleEn: editItem.titleEn,
        style: editItem.style,
        sortOrder: editItem.sortOrder,
      }),
    });
    setEditItem(null);
    fetchItems();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
          />
          <span className={`inline-flex items-center justify-center rounded-sm bg-accent px-6 py-3 text-base font-semibold text-bg-primary transition-all duration-300 hover:bg-accent-hover ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            {isUploading ? t('uploading') : t('upload')}
          </span>
        </label>
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`group relative overflow-hidden rounded-lg border bg-bg-secondary ${
              item.isVisible ? 'border-white/10' : 'border-red-500/30 opacity-60'
            }`}
          >
            {/* Image */}
            <div className="aspect-square">
              <img
                src={item.thumbnailPath || item.imagePath}
                alt={item.titleRo || ''}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Badges */}
            <div className="absolute left-2 top-2 flex gap-1">
              {item.isFeatured && (
                <span className="rounded bg-accent/90 px-1.5 py-0.5 text-[10px] font-bold text-bg-primary">
                  {t('featured').toUpperCase()}
                </span>
              )}
              <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                {item.artist.name}
              </span>
            </div>

            {/* Hover overlay with actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/70 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => setEditItem(item)}
                className="rounded bg-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/30"
              >
                {t('edit')}
              </button>
              <button
                onClick={() => toggleFeatured(item)}
                className="rounded bg-accent/30 px-3 py-1.5 text-xs text-accent hover:bg-accent/50"
              >
                {item.isFeatured ? '★' : '☆'}
              </button>
              <button
                onClick={() => toggleVisible(item)}
                className="rounded bg-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/30"
              >
                {item.isVisible ? '👁' : '👁‍🗨'}
              </button>
              <button
                onClick={() => deleteItem(item)}
                className="rounded bg-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/50"
              >
                {t('delete')}
              </button>
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="truncate text-xs text-text-secondary">
                {item.titleRo || item.style || `#${item.id}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-lg bg-bg-secondary p-6">
            <h3 className="mb-4 text-lg text-text-primary">{t('edit')}</h3>
            <div className="space-y-4">
              <Input
                label={t('titleRo')}
                value={editItem.titleRo || ''}
                onChange={(e) => setEditItem({ ...editItem, titleRo: e.target.value })}
              />
              <Input
                label={t('titleEn')}
                value={editItem.titleEn || ''}
                onChange={(e) => setEditItem({ ...editItem, titleEn: e.target.value })}
              />
              <Select
                label={t('style')}
                value={editItem.style || ''}
                onChange={(e) => setEditItem({ ...editItem, style: e.target.value })}
                options={[
                  { value: '', label: '—' },
                  ...TATTOO_STYLES.map((s) => ({ value: s, label: s })),
                ]}
              />
              <Input
                label={t('sortOrder')}
                type="number"
                value={String(editItem.sortOrder)}
                onChange={(e) => setEditItem({ ...editItem, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditItem(null)}>
                {t('cancel')}
              </Button>
              <Button onClick={saveEdit}>{t('save')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
