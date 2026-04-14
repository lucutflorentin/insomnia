'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/Toast';
import { Upload, Trash2, Eye, EyeOff } from 'lucide-react';

interface GalleryItem {
  id: number;
  imageUrl: string;
  captionRo: string | null;
  captionEn: string | null;
  isVisible: boolean;
  sortOrder: number;
}

export default function ArtistGalleryPage() {
  const t = useTranslations('artist.gallery');
  const { showToast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          // Create gallery item with the uploaded URL
          const createRes = await fetch('/api/gallery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: data.data.url }),
          });
          const createData = await createRes.json();
          if (createData.success) {
            setItems((prev) => [createData.data, ...prev]);
          }
        } else {
          showToast(data.error || 'Upload failed', 'error');
        }
      } catch {
        showToast('Upload failed', 'error');
      }
    }
    setUploading(false);
  };

  const handleToggleVisibility = async (item: GalleryItem) => {
    try {
      const res = await fetch(`/api/gallery/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !item.isVisible }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isVisible: !i.isVisible } : i)),
        );
      }
    } catch {
      showToast('Error', 'error');
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      const res = await fetch(`/api/gallery/${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        showToast('Deleted', 'success');
      }
    } catch {
      showToast('Error', 'error');
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent/80 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {uploading ? '...' : t('upload')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleUpload(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
          <p className="text-text-muted">{t('noImages')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-sm border border-border bg-bg-secondary"
            >
              <div className="aspect-square">
                <img
                  src={item.imageUrl}
                  alt={item.captionRo || item.captionEn || ''}
                  className={`h-full w-full object-cover transition-opacity ${!item.isVisible ? 'opacity-40' : ''}`}
                />
              </div>
              {/* Overlay actions */}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex w-full items-center justify-between p-3">
                  <button
                    onClick={() => handleToggleVisibility(item)}
                    className="rounded-sm bg-black/40 p-1.5 text-white hover:bg-black/60"
                    title={item.isVisible ? t('hidden') : t('visible')}
                  >
                    {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="rounded-sm bg-red-500/40 p-1.5 text-white hover:bg-red-500/60"
                    title={t('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {!item.isVisible && (
                <div className="absolute left-2 top-2 rounded-sm bg-black/60 px-2 py-0.5 text-xs text-white">
                  {t('hidden')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
