'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  Upload,
  Loader2,
  Pencil,
  CheckSquare,
  Square,
  X,
  ImageIcon,
} from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { TATTOO_STYLES, BODY_AREAS } from '@/lib/constants';

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
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data state
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [activeArtistFilter, setActiveArtistFilter] = useState<string>('all');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadArtistId, setUploadArtistId] = useState<number | null>(null);

  // Edit state
  const [editItem, setEditItem] = useState<GalleryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Action loading state
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  // ── Data fetching ──

  const fetchItems = useCallback(async () => {
    try {
      const url =
        activeArtistFilter === 'all'
          ? '/api/gallery?limit=50'
          : `/api/gallery?limit=50&artist=${activeArtistFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.data);
      } else {
        showToast(t('fetchError'), 'error');
      }
    } catch {
      showToast(t('fetchError'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeArtistFilter, showToast, t]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetch('/api/artists')
      .then((r) => r.json())
      .then((d) => setArtists(d.data || []))
      .catch(() => showToast(t('fetchError'), 'error'));
  }, [showToast, t]);

  // Clear selection and auto-select upload artist when filter changes
  useEffect(() => {
    setSelectedIds(new Set());
    if (activeArtistFilter !== 'all') {
      const artist = artists.find((a) => a.slug === activeArtistFilter);
      if (artist) setUploadArtistId(artist.id);
    } else if (artists.length > 0 && !uploadArtistId) {
      setUploadArtistId(artists[0].id);
    }
  }, [activeArtistFilter, artists, uploadArtistId]);

  // ── Filtered items ──

  const filteredItems = useMemo(() => {
    return items;
  }, [items]);

  // Lightbox slides
  const lightboxSlides = useMemo(() => {
    return filteredItems.map((item) => ({
      src: item.imagePath,
      alt: item.titleRo || item.titleEn || `#${item.id}`,
    }));
  }, [filteredItems]);

  // ── Selection helpers ──

  const isAllSelected =
    filteredItems.length > 0 && selectedIds.size === filteredItems.length;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  // ── Upload (multiple files) ──

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const artistId = uploadArtistId || artists[0]?.id;
    if (!artistId) {
      showToast(t('noArtists'), 'error');
      return;
    }

    setIsUploading(true);
    const totalFiles = files.length;
    setUploadProgress({ current: 0, total: totalFiles });
    let successCount = 0;

    for (let i = 0; i < totalFiles; i++) {
      setUploadProgress({ current: i + 1, total: totalFiles });
      try {
        const formData = new FormData();
        formData.append('file', files[i]);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });

        if (!uploadRes.ok) {
          showToast(t('uploadFailed'), 'error');
          continue;
        }

        const uploadData = await uploadRes.json();

        const createRes = await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artistId,
            imagePath: uploadData.data.imagePath,
            thumbnailPath: uploadData.data.thumbnailPath,
          }),
        });

        if (createRes.ok) {
          successCount++;
        } else {
          showToast(t('uploadFailed'), 'error');
        }
      } catch {
        showToast(t('uploadFailed'), 'error');
      }
    }

    if (successCount > 0) {
      showToast(
        totalFiles === 1
          ? t('upload')
          : t('uploadComplete', { count: successCount }),
        'success',
      );
      fetchItems();
    }

    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    e.target.value = '';
  };

  // ── Single item actions ──

  const toggleFeatured = async (item: GalleryItem) => {
    const actionKey = `featured-${item.id}`;
    setLoadingAction(actionKey);
    try {
      const res = await fetch(`/api/gallery/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !item.isFeatured }),
      });
      if (res.ok) {
        showToast(t('featured'), 'success');
        fetchItems();
      } else {
        showToast(t('featureFailed'), 'error');
      }
    } catch {
      showToast(t('featureFailed'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const toggleVisible = async (item: GalleryItem) => {
    const actionKey = `visible-${item.id}`;
    setLoadingAction(actionKey);
    try {
      const res = await fetch(`/api/gallery/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !item.isVisible }),
      });
      if (res.ok) {
        showToast(t('visible'), 'success');
        fetchItems();
      } else {
        showToast(t('visibilityFailed'), 'error');
      }
    } catch {
      showToast(t('visibilityFailed'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gallery/${deleteTarget}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(t('deleteSuccess'), 'success');
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget);
          return next;
        });
        fetchItems();
      } else {
        showToast(t('deleteFailed'), 'error');
      }
    } catch {
      showToast(t('deleteFailed'), 'error');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Bulk actions ──

  const bulkToggleFeatured = async () => {
    setLoadingAction('bulk-featured');
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      const item = items.find((i) => i.id === id);
      if (!item) continue;
      try {
        await fetch(`/api/gallery/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFeatured: !item.isFeatured }),
        });
      } catch {
        // continue with remaining
      }
    }
    showToast(t('featured'), 'success');
    setLoadingAction(null);
    fetchItems();
  };

  const bulkToggleVisible = async () => {
    setLoadingAction('bulk-visible');
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      const item = items.find((i) => i.id === id);
      if (!item) continue;
      try {
        await fetch(`/api/gallery/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVisible: !item.isVisible }),
        });
      } catch {
        // continue with remaining
      }
    }
    showToast(t('visible'), 'success');
    setLoadingAction(null);
    fetchItems();
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    const ids = Array.from(selectedIds);
    let successCount = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
        if (res.ok) successCount++;
      } catch {
        // continue with remaining
      }
    }
    const failCount = ids.length - successCount;
    if (failCount > 0 && successCount > 0) {
      showToast(t('bulkDeletePartial', { success: successCount, failed: failCount }), 'error');
    } else if (successCount > 0) {
      showToast(t('bulkDeleteSuccess', { count: successCount }), 'success');
    } else {
      showToast(t('deleteFailed'), 'error');
    }
    setSelectedIds(new Set());
    setIsDeleting(false);
    setBulkDeleteOpen(false);
    fetchItems();
  };

  // ── Edit / Save ──

  const saveEdit = async () => {
    if (!editItem) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/gallery/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleRo: editItem.titleRo,
          titleEn: editItem.titleEn,
          style: editItem.style,
          bodyArea: editItem.bodyArea,
          sortOrder: editItem.sortOrder,
          artistId: editItem.artistId,
        }),
      });
      if (res.ok) {
        showToast(t('save'), 'success');
        setEditItem(null);
        fetchItems();
      } else {
        showToast(t('saveFailed'), 'error');
      }
    } catch {
      showToast(t('saveFailed'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ──

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
        <div className="flex items-center gap-3">
          {artists.length > 1 && (
            <select
              value={String(uploadArtistId || artists[0]?.id || '')}
              onChange={(e) => setUploadArtistId(parseInt(e.target.value))}
              className="rounded-sm border border-white/10 bg-bg-secondary px-3 py-3 text-sm text-text-primary outline-none focus:border-accent"
            >
              {artists.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={isUploading}
          />
          <span
            className={`inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-base font-semibold text-bg-primary transition-all duration-300 hover:bg-accent-hover ${
              isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading
              ? uploadProgress.total > 1
                ? t('uploadProgress', {
                    current: uploadProgress.current,
                    total: uploadProgress.total,
                  })
                : t('uploading')
              : t('upload')}
          </span>
        </label>
        </div>
      </div>

      {/* Artist filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveArtistFilter('all')}
          className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
            activeArtistFilter === 'all'
              ? 'bg-accent text-bg-primary'
              : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
          }`}
        >
          {t('all')}
        </button>
        {artists.map((artist) => (
          <button
            key={artist.slug}
            onClick={() => setActiveArtistFilter(artist.slug)}
            className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
              activeArtistFilter === artist.slug
                ? 'bg-accent text-bg-primary'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {artist.name}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-sm border border-accent/30 bg-accent/5 px-4 py-3">
          <span className="text-sm font-medium text-accent">
            {t('selected', { count: selectedIds.size })}
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={bulkToggleFeatured}
            disabled={loadingAction === 'bulk-featured'}
          >
            {loadingAction === 'bulk-featured' ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Star className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t('bulkFeature')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={bulkToggleVisible}
            disabled={loadingAction === 'bulk-visible'}
          >
            {loadingAction === 'bulk-visible' ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t('bulkVisible')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {t('bulkDelete')}
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-text-muted transition-colors hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Select All toggle */}
      {filteredItems.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-accent" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {t('selectAll')}
          </button>
          <span className="text-xs text-text-muted">
            ({filteredItems.length})
          </span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20">
          <ImageIcon className="mb-4 h-12 w-12 text-text-muted" />
          <p className="text-text-secondary">{t('noImages')}</p>
        </div>
      )}

      {/* Gallery grid */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item, index) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`group relative overflow-hidden rounded-lg border bg-bg-secondary transition-all ${
                  isSelected
                    ? 'border-accent ring-1 ring-accent/40'
                    : item.isVisible
                      ? 'border-white/10'
                      : 'border-red-500/30 opacity-70'
                }`}
              >
                {/* Selection checkbox */}
                <button
                  onClick={() => toggleSelect(item.id)}
                  className={`absolute left-2 top-2 z-20 rounded transition-all ${
                    isSelected
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-accent drop-shadow-lg" />
                  ) : (
                    <Square className="h-5 w-5 text-white drop-shadow-lg" />
                  )}
                </button>

                {/* Status icons (top-right) */}
                <div className="absolute right-2 top-2 z-10 flex gap-1">
                  {item.isFeatured && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/90 shadow-sm">
                      <Star className="h-3 w-3 fill-white text-white" />
                    </span>
                  )}
                  {!item.isVisible && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 shadow-sm">
                      <EyeOff className="h-3 w-3 text-white" />
                    </span>
                  )}
                </div>

                {/* Image (click to open lightbox) */}
                <div className="aspect-square cursor-pointer" onClick={() => setLightboxIndex(index)}>
                  <img
                    src={item.thumbnailPath || item.imagePath}
                    alt={item.titleRo || ''}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Hover overlay with actions */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="pointer-events-auto absolute bottom-12 left-0 right-0 flex items-center justify-center gap-2 px-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditItem(item);
                      }}
                      className="rounded-sm bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                      title={t('edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFeatured(item);
                      }}
                      disabled={loadingAction === `featured-${item.id}`}
                      className="rounded-sm bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30 disabled:opacity-50"
                      title={t('featured')}
                    >
                      {loadingAction === `featured-${item.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Star
                          className={`h-4 w-4 ${
                            item.isFeatured
                              ? 'fill-yellow-400 text-yellow-400'
                              : ''
                          }`}
                        />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisible(item);
                      }}
                      disabled={loadingAction === `visible-${item.id}`}
                      className="rounded-sm bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30 disabled:opacity-50"
                      title={t('visible')}
                    >
                      {loadingAction === `visible-${item.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : item.isVisible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item.id);
                      }}
                      className="rounded-sm bg-red-500/30 p-2 text-red-400 backdrop-blur-sm transition-colors hover:bg-red-500/50"
                      title={t('delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Info bar below image */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.titleRo || item.titleEn || item.style || `#${item.id}`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                    {item.artist.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={lightboxSlides}
      />

      {/* Edit modal */}
      <Modal
        isOpen={editItem !== null}
        onClose={() => setEditItem(null)}
        title={t('editImage')}
      >
        {editItem && (
          <div className="space-y-4">
            {/* Image preview in edit */}
            <div className="overflow-hidden rounded-sm">
              <img
                src={editItem.thumbnailPath || editItem.imagePath}
                alt={editItem.titleRo || ''}
                className="h-40 w-full object-cover"
              />
            </div>

            <Select
              label={t('artist')}
              value={String(editItem.artistId)}
              onChange={(e) =>
                setEditItem({ ...editItem, artistId: parseInt(e.target.value) })
              }
              options={artists.map((a) => ({
                value: String(a.id),
                label: a.name,
              }))}
            />

            <Input
              label={t('titleRo')}
              value={editItem.titleRo || ''}
              onChange={(e) =>
                setEditItem({ ...editItem, titleRo: e.target.value })
              }
            />
            <Input
              label={t('titleEn')}
              value={editItem.titleEn || ''}
              onChange={(e) =>
                setEditItem({ ...editItem, titleEn: e.target.value })
              }
            />
            <Select
              label={t('style')}
              value={editItem.style || ''}
              onChange={(e) =>
                setEditItem({ ...editItem, style: e.target.value })
              }
              options={[
                { value: '', label: '\u2014' },
                ...TATTOO_STYLES.map((s) => ({ value: s, label: s })),
              ]}
            />
            <Select
              label={t('bodyArea')}
              value={editItem.bodyArea || ''}
              onChange={(e) =>
                setEditItem({ ...editItem, bodyArea: e.target.value })
              }
              options={[
                { value: '', label: '\u2014' },
                ...BODY_AREAS.map((area) => ({ value: area, label: area })),
              ]}
            />
            <Input
              label={t('sortOrder')}
              type="number"
              value={String(editItem.sortOrder)}
              onChange={(e) =>
                setEditItem({
                  ...editItem,
                  sortOrder: parseInt(e.target.value) || 0,
                })
              }
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setEditItem(null)}
                disabled={isSaving}
              >
                {t('cancel')}
              </Button>
              <Button onClick={saveEdit} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('save')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Single delete confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={t('delete')}
        message={t('confirmDelete')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        title={t('bulkDelete')}
        message={t('confirmBulkDelete', { count: selectedIds.size })}
        confirmLabel={t('bulkDelete')}
        cancelLabel={t('cancel')}
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
