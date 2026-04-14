'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface UploadedImage {
  url: string;
  uploading?: boolean;
}

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function ImageUpload({
  images,
  onChange,
  maxFiles = 3,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const t = useTranslations('booking.step2.upload');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadedImage[]>([]);
  const [error, setError] = useState('');

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError('');
      const fileArray = Array.from(files);
      const remaining = maxFiles - images.length - uploadingFiles.filter((f) => f.uploading).length;

      if (remaining <= 0) {
        setError(t('maxReached', { max: maxFiles }));
        return;
      }

      const toUpload = fileArray.slice(0, remaining);

      // Add placeholders
      const placeholders: UploadedImage[] = toUpload.map(() => ({
        url: '',
        uploading: true,
      }));
      setUploadingFiles((prev) => [...prev, ...placeholders]);

      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];

        // Client-side validation
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(t('tooLarge', { max: maxSizeMB }));
          setUploadingFiles((prev) => prev.filter((f) => f.uploading));
          continue;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setError(t('invalidType'));
          setUploadingFiles((prev) => prev.filter((f) => f.uploading));
          continue;
        }

        try {
          const formData = new FormData();
          formData.append('file', file);

          const res = await fetch('/api/upload/reference', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();

          if (res.ok && data.success) {
            onChange([...images, data.data.url]);
          } else {
            setError(data.error || t('uploadError'));
          }
        } catch {
          setError(t('uploadError'));
        }
      }

      setUploadingFiles([]);
    },
    [images, maxFiles, maxSizeMB, onChange, uploadingFiles, t],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const isUploading = uploadingFiles.some((f) => f.uploading);

  return (
    <div>
      {/* Uploaded previews */}
      {images.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {images.map((url, index) => (
            <div
              key={url}
              className="group relative h-20 w-20 overflow-hidden rounded-sm border border-border bg-bg-secondary"
            >
              <img
                src={url}
                alt={`Reference ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
          {/* Uploading placeholders */}
          {uploadingFiles
            .filter((f) => f.uploading)
            .map((_, index) => (
              <div
                key={`uploading-${index}`}
                className="flex h-20 w-20 items-center justify-center rounded-sm border border-border bg-bg-secondary"
              >
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < maxFiles && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'cursor-pointer rounded-sm border border-dashed border-border bg-bg-secondary p-6 text-center transition-colors hover:border-accent/30',
            isUploading && 'pointer-events-none opacity-60',
          )}
        >
          <svg
            className="mx-auto mb-2 h-8 w-8 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <p className="text-sm text-text-muted">
            {isUploading ? t('uploading') : t('dragDrop')}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {t('hint', { max: maxFiles, size: maxSizeMB })}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
