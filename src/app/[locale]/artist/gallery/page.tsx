'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import {
  Check,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Search,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import NextJsImage from '@/components/ui/NextJsImage';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { BODY_AREAS, GALLERY_UPLOAD_CONFIG, TATTOO_STYLES } from '@/lib/constants';
import { normalizeStyleKey } from '@/lib/gallery-style';

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
}

const MAX_UPLOAD_MB = Math.round(GALLERY_UPLOAD_CONFIG.maxFileSize / 1024 / 1024);

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return { success: false, error: response.statusText };
  }
}

export default function ArtistGalleryPage() {
  const t = useTranslations('artist.gallery');
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [editItem, setEditItem] = useState<GalleryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gallery?limit=50');
      const data = await readJsonResponse(res);
      if (res.ok && data.success) {
        setItems(data.data || []);
      } else {
        showToast(data.error || t('fetchError'), 'error');
      }
    } catch {
      showToast(t('fetchError'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const stats = useMemo(
    () => ({
      total: items.length,
      visible: items.filter((item) => item.isVisible).length,
      featured: items.filter((item) => item.isFeatured).length,
      tagged: items.filter((item) => item.style || item.bodyArea || item.titleRo || item.titleEn)
        .length,
    }),
    [items],
  );

  const styleOptions = useMemo(
    () => TATTOO_STYLES.map((style) => ({ value: style, label: style })),
    [],
  );

  const bodyAreaOptions = useMemo(
    () => BODY_AREAS.map((area) => ({ value: area, label: area })),
    [],
  );

  const displayedItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter === 'visible' && !item.isVisible) return false;
      if (statusFilter === 'hidden' && item.isVisible) return false;
      if (statusFilter === 'featured' && !item.isFeatured) return false;
      if (
        statusFilter === 'missing' &&
        (item.titleRo || item.titleEn) &&
        item.style &&
        item.bodyArea
      ) {
        return false;
      }
      if (styleFilter && normalizeStyleKey(item.style) !== styleFilter) return false;
      if (!normalizedSearch) return true;

      return [item.titleRo, item.titleEn, item.style, item.bodyArea]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });
  }, [items, searchTerm, statusFilter, styleFilter]);

  const lightboxSlides = useMemo(
    () =>
      displayedItems.map((item) => ({
        src: item.imagePath,
        alt: item.titleRo || item.titleEn || t('untitled'),
      })),
    [displayedItems, t],
  );

  const isAllSelected =
    displayedItems.length > 0 && displayedItems.every((item) => selectedIds.has(item.id));

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
      return;
    }
    setSelectedIds(new Set(displayedItems.map((item) => item.id)));
  };

  const validateFile = (file: File) => {
    if (!(GALLERY_UPLOAD_CONFIG.allowedFileTypes as readonly string[]).includes(file.type)) {
      showToast(t('invalidType'), 'error');
      return false;
    }
    if (file.size > GALLERY_UPLOAD_CONFIG.maxFileSize) {
      showToast(t('fileTooLarge', { size: MAX_UPLOAD_MB }), 'error');
      return false;
    }
    return true;
  };

  const handleUpload = async (files: FileList) => {
    const selectedFiles = Array.from(files).filter(validateFile);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });
    let successCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadProgress({ current: i + 1, total: selectedFiles.length });

      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await readJsonResponse(uploadRes);

        if (!uploadRes.ok || !uploadData.success) {
          showToast(uploadData.error || t('uploadFailed'), 'error');
          continue;
        }

        const createRes = await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imagePath: uploadData.data.imagePath,
            thumbnailPath: uploadData.data.thumbnailPath,
          }),
        });
        const createData = await readJsonResponse(createRes);

      if (createRes.ok && createData.success) {
          successCount++;
          setItems((prev) => [createData.data, ...prev]);
        } else {
          showToast(createData.error || t('uploadFailed'), 'error');
        }
      } catch {
        showToast(t('uploadFailed'), 'error');
      }
    }

    if (successCount > 0) {
      showToast(t('uploadComplete', { count: successCount }), 'success');
    }

    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });
  };

  const updateItem = async (item: GalleryItem, patch: Partial<GalleryItem>) => {
    const res = await fetch(`/api/gallery/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await readJsonResponse(res);
    if (!res.ok || !data.success) {
      throw new Error(data.error || t('saveFailed'));
    }
    setItems((prev) => prev.map((current) => (current.id === item.id ? data.data : current)));
    return data.data as GalleryItem;
  };

  const toggleVisibility = async (item: GalleryItem) => {
    const actionKey = `visible-${item.id}`;
    setLoadingAction(actionKey);
    try {
      await updateItem(item, { isVisible: !item.isVisible });
      showToast(t('visibleSaved'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('visibilityFailed'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const toggleFeatured = async (item: GalleryItem) => {
    const actionKey = `featured-${item.id}`;
    setLoadingAction(actionKey);
    try {
      await updateItem(item, { isFeatured: !item.isFeatured });
      showToast(t('featuredSaved'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('featureFailed'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const bulkUpdate = async (patchFactory: (item: GalleryItem) => Partial<GalleryItem>) => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;

    setLoadingAction('bulk');
    let successCount = 0;
    try {
      for (const item of selectedItems) {
        try {
          await updateItem(item, patchFactory(item));
          successCount++;
        } catch {
          // Continue with remaining selected images.
        }
      }
      if (successCount > 0) {
        showToast(t('bulkUpdated', { count: successCount }), 'success');
      } else {
        showToast(t('saveFailed'), 'error');
      }
    } finally {
      setSelectedIds(new Set());
      setLoadingAction(null);
    }
  };

  const bulkDelete = async () => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;

    setLoadingAction('bulk');
    let successCount = 0;
    const deletedIds = new Set<number>();
    try {
      for (const item of selectedItems) {
        try {
          const res = await fetch(`/api/gallery/${item.id}`, { method: 'DELETE' });
          const data = await readJsonResponse(res);
          if (res.ok && data.success) {
            successCount++;
            deletedIds.add(item.id);
          }
        } catch {
          // Continue with remaining selected images.
        }
      }
      setItems((prev) => prev.filter((item) => !deletedIds.has(item.id)));
      showToast(t('bulkDeleted', { count: successCount }), successCount > 0 ? 'success' : 'error');
    } finally {
      setSelectedIds(new Set());
      setLoadingAction(null);
    }
  };

  const saveEdit = async () => {
    if (!editItem) return;

    setIsSaving(true);
    try {
      await updateItem(editItem, {
        titleRo: editItem.titleRo || null,
        titleEn: editItem.titleEn || null,
        style: editItem.style || null,
        bodyArea: editItem.bodyArea || null,
        sortOrder: Number(editItem.sortOrder) || 0,
      });
      setEditItem(null);
      showToast(t('saved'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('saveFailed'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gallery/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await readJsonResponse(res);
      if (res.ok && data.success) {
        setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        showToast(t('deleteSuccess'), 'success');
      } else {
        showToast(data.error || t('deleteFailed'), 'error');
      }
    } catch {
      showToast(t('deleteFailed'), 'error');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
        </div>
        <Button onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isUploading
            ? t('uploadProgress', {
                current: uploadProgress.current,
                total: uploadProgress.total,
              })
            : t('upload')}
        </Button>
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

      <div className="rounded-sm border border-border bg-bg-secondary p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent/10 text-accent">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{t('uploadGuideTitle')}</p>
              <p className="mt-1 text-sm text-text-muted">
                {t('uploadGuide', { size: MAX_UPLOAD_MB })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center sm:min-w-[360px]">
            <div>
              <p className="text-lg font-semibold text-text-primary">{stats.total}</p>
              <p className="text-xs text-text-muted">{t('total')}</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{stats.visible}</p>
              <p className="text-xs text-text-muted">{t('visible')}</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{stats.featured}</p>
              <p className="text-xs text-text-muted">{t('featured')}</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{stats.tagged}</p>
              <p className="text-xs text-text-muted">{t('tagged')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-sm border border-border bg-bg-secondary p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search')}
              className="w-full rounded-sm border border-border bg-bg-primary py-3 pl-10 pr-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-sm border border-border bg-bg-primary px-3 py-3 text-sm text-text-primary outline-none focus:border-accent"
          >
            <option value="all">{t('filters.all')}</option>
            <option value="visible">{t('filters.visible')}</option>
            <option value="hidden">{t('filters.hidden')}</option>
            <option value="featured">{t('filters.featured')}</option>
            <option value="missing">{t('filters.missing')}</option>
          </select>
          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value)}
            className="rounded-sm border border-border bg-bg-primary px-3 py-3 text-sm text-text-primary outline-none focus:border-accent"
          >
            <option value="">{t('filters.allStyles')}</option>
            {TATTOO_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>

        {displayedItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="rounded-sm bg-bg-primary px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {isAllSelected ? t('clearSelection') : t('selectFiltered')}
            </button>
            {selectedIds.size > 0 && (
              <>
                <span className="text-xs text-text-muted">
                  {t('selected', { count: selectedIds.size })}
                </span>
                <button
                  type="button"
                  onClick={() => bulkUpdate(() => ({ isVisible: true }))}
                  disabled={loadingAction === 'bulk'}
                  className="rounded-sm bg-bg-primary px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-accent disabled:opacity-50"
                >
                  {t('bulkShow')}
                </button>
                <button
                  type="button"
                  onClick={() => bulkUpdate(() => ({ isVisible: false }))}
                  disabled={loadingAction === 'bulk'}
                  className="rounded-sm bg-bg-primary px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-accent disabled:opacity-50"
                >
                  {t('bulkHide')}
                </button>
                <button
                  type="button"
                  onClick={() => bulkUpdate((item) => ({ isFeatured: !item.isFeatured }))}
                  disabled={loadingAction === 'bulk'}
                  className="rounded-sm bg-bg-primary px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-accent disabled:opacity-50"
                >
                  {t('bulkFeature')}
                </button>
                <button
                  type="button"
                  onClick={bulkDelete}
                  disabled={loadingAction === 'bulk'}
                  className="rounded-sm bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  {t('bulkDelete')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
          <ImageIcon className="mx-auto mb-4 h-10 w-10 text-text-muted" />
          <p className="text-text-muted">{t('noImages')}</p>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-10 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-muted">{t('noFilteredImages')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {displayedItems.map((item, index) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-sm border border-border bg-bg-secondary"
            >
              <div
                className="relative aspect-square cursor-zoom-in"
                onClick={() => setLightboxIndex(index)}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSelect(item.id);
                  }}
                  className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-sm border transition-colors ${
                    selectedIds.has(item.id)
                      ? 'border-accent bg-accent text-bg-primary'
                      : 'border-white/30 bg-black/40 text-white hover:border-accent'
                  }`}
                  title={t('select')}
                >
                  {selectedIds.has(item.id) && <Check className="h-4 w-4" />}
                </button>
                <Image
                  src={item.thumbnailPath || item.imagePath}
                  alt={item.titleRo || item.titleEn || t('untitled')}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className={`object-cover ${!item.isVisible ? 'opacity-45' : ''}`}
                />
                <div className="absolute left-2 top-2 flex gap-2">
                  {item.isFeatured && (
                    <span className="rounded-sm bg-accent px-2 py-1 text-xs font-medium text-bg-primary">
                      {t('featured')}
                    </span>
                  )}
                  {!item.isVisible && (
                    <span className="rounded-sm bg-black/70 px-2 py-1 text-xs font-medium text-white">
                      {t('hidden')}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 p-3">
                <div>
                  <h2 className="truncate text-sm font-medium text-text-primary">
                    {item.titleRo || item.titleEn || t('untitled')}
                  </h2>
                  <p className="mt-1 truncate text-xs text-text-muted">
                    {[item.style, item.bodyArea].filter(Boolean).join(' / ') || t('needsMetadata')}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(item)}
                    disabled={loadingAction === `featured-${item.id}`}
                    className="flex h-9 items-center justify-center rounded-sm bg-bg-primary text-text-secondary transition-colors hover:text-accent disabled:opacity-50"
                    title={t('toggleFeatured')}
                  >
                    {loadingAction === `featured-${item.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(item)}
                    disabled={loadingAction === `visible-${item.id}`}
                    className="flex h-9 items-center justify-center rounded-sm bg-bg-primary text-text-secondary transition-colors hover:text-accent disabled:opacity-50"
                    title={item.isVisible ? t('hide') : t('show')}
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
                    type="button"
                    onClick={() => setEditItem(item)}
                    className="flex h-9 items-center justify-center rounded-sm bg-bg-primary text-text-secondary transition-colors hover:text-accent"
                    title={t('edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="flex h-9 items-center justify-center rounded-sm bg-bg-primary text-text-secondary transition-colors hover:text-error"
                    title={t('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={lightboxSlides}
        render={{ slide: NextJsImage }}
      />

      <Modal
        isOpen={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        title={t('editImage')}
        className="max-w-2xl"
      >
        {editItem && (
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-sm border border-border">
              <Image
                src={editItem.thumbnailPath || editItem.imagePath}
                alt={editItem.titleRo || editItem.titleEn || t('untitled')}
                fill
                sizes="(min-width: 768px) 640px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                placeholder={t('none')}
                options={styleOptions}
                onChange={(e) => setEditItem({ ...editItem, style: e.target.value || null })}
              />
              <Select
                label={t('bodyArea')}
                value={editItem.bodyArea || ''}
                placeholder={t('none')}
                options={bodyAreaOptions}
                onChange={(e) => setEditItem({ ...editItem, bodyArea: e.target.value || null })}
              />
              <Input
                label={t('sortOrder')}
                type="number"
                value={editItem.sortOrder}
                onChange={(e) =>
                  setEditItem({ ...editItem, sortOrder: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditItem(null)} disabled={isSaving}>
                {t('cancel')}
              </Button>
              <Button onClick={saveEdit} isLoading={isSaving}>
                {t('save')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('delete')}
        message={t('confirmDelete')}
        confirmLabel={t('delete')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
