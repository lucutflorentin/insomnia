import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import * as Sentry from '@sentry/nextjs';
import sharp from 'sharp';
import { BOOKING_CONFIG } from '@/lib/constants';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { inspectRequestForAttack } from '@/lib/security-events';

const REFERENCE_UPLOAD_LIMIT = { max: 10, windowSec: 60 }; // 10/min (stricter than admin)
const MAX_IMAGE_DIMENSION = 8000;
const REFERENCE_IMAGE_MAX_WIDTH = 1600;

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

/**
 * Discriminated error codes returned to the client so the UI can render a
 * meaningful message instead of a generic "Upload failed".
 */
type UploadErrorCode =
  | 'RATE_LIMITED'
  | 'NO_FILE'
  | 'INVALID_TYPE'
  | 'TOO_LARGE'
  | 'CORRUPT_FILE'
  | 'UNREADABLE_IMAGE'
  | 'DIMENSIONS_TOO_LARGE'
  | 'STORAGE_NOT_CONFIGURED'
  | 'STORAGE_ERROR'
  | 'PROCESSING_ERROR';

function errorResponse(
  code: UploadErrorCode,
  message: string,
  status: number,
  extraHeaders?: Record<string, string>,
) {
  return NextResponse.json(
    { success: false, error: message, code },
    { status, headers: extraHeaders },
  );
}

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some((sig) =>
    sig.every((byte, index) => buffer[index] === byte),
  );
}

// POST /api/upload/reference — Public: upload reference image for booking
export async function POST(request: NextRequest) {
  try {
    await inspectRequestForAttack(request, 'api/upload/reference');
    const ip = getClientIp(request);
    const rl = await checkRateLimit(
      `ref-upload:${ip}`,
      REFERENCE_UPLOAD_LIMIT,
      { request, source: 'api/upload/reference' },
    );
    if (!rl.allowed) {
      return errorResponse(
        'RATE_LIMITED',
        'Prea multe incarcari intr-un timp scurt. Asteapta cateva secunde.',
        429,
        { 'Retry-After': String(rl.retryAfterSec) },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('NO_FILE', 'Niciun fisier nu a fost trimis.', 400);
    }

    if (!(BOOKING_CONFIG.allowedFileTypes as readonly string[]).includes(file.type)) {
      return errorResponse(
        'INVALID_TYPE',
        'Tip de fisier neacceptat. Permise: JPEG, PNG, WebP.',
        400,
      );
    }

    if (file.size > BOOKING_CONFIG.maxFileSize) {
      return errorResponse(
        'TOO_LARGE',
        'Fisierul este prea mare. Maxim 5MB.',
        400,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!validateMagicBytes(buffer, file.type)) {
      return errorResponse(
        'CORRUPT_FILE',
        'Continutul fisierului nu corespunde tipului declarat.',
        400,
      );
    }

    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (metaErr) {
      Sentry.captureException(metaErr, {
        tags: { route: 'upload/reference', stage: 'metadata' },
      });
      return errorResponse(
        'UNREADABLE_IMAGE',
        'Imaginea pare corupta sau intr-un format pe care nu il putem citi.',
        400,
      );
    }
    if (!metadata.width || !metadata.height) {
      return errorResponse(
        'UNREADABLE_IMAGE',
        'Nu am putut citi dimensiunile imaginii.',
        400,
      );
    }

    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      return errorResponse(
        'DIMENSIONS_TOO_LARGE',
        `Dimensiunile imaginii sunt prea mari. Maxim ${MAX_IMAGE_DIMENSION}px.`,
        400,
      );
    }

    let processed: Buffer;
    try {
      processed = await sharp(buffer)
        .rotate()
        .resize({ width: REFERENCE_IMAGE_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 88 })
        .toBuffer();
    } catch (processErr) {
      Sentry.captureException(processErr, {
        tags: { route: 'upload/reference', stage: 'process' },
      });
      return errorResponse(
        'PROCESSING_ERROR',
        'Nu am putut procesa imaginea. Incearca o alta poza.',
        500,
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      const err = new Error(
        'BLOB_READ_WRITE_TOKEN is not configured on this environment',
      );
      Sentry.captureException(err, {
        tags: { route: 'upload/reference', stage: 'config' },
        level: 'error',
      });
      console.error('[upload/reference] STORAGE_NOT_CONFIGURED:', err.message);
      return errorResponse(
        'STORAGE_NOT_CONFIGURED',
        'Stocarea de imagini nu este configurata pentru acest mediu. Contacteaza administratorul.',
        503,
      );
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    let blob: { url: string };
    try {
      blob = await put(`references/${timestamp}-${random}.webp`, processed, {
        access: 'public',
        contentType: 'image/webp',
        addRandomSuffix: false,
      });
    } catch (storageErr) {
      Sentry.captureException(storageErr, {
        tags: { route: 'upload/reference', stage: 'storage' },
        extra: {
          fileSize: file.size,
          fileType: file.type,
          processedSize: processed.byteLength,
        },
      });
      console.error('[upload/reference] STORAGE_ERROR:', storageErr);
      return errorResponse(
        'STORAGE_ERROR',
        'Nu am putut salva fisierul in stocare. Incearca din nou peste cateva secunde.',
        502,
      );
    }

    return NextResponse.json(
      { success: true, data: { url: blob.url } },
      { status: 201 },
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: 'upload/reference', stage: 'unknown' },
    });
    console.error('[upload/reference] Unexpected error:', error);
    return errorResponse(
      'PROCESSING_ERROR',
      'Eroare neasteptata la incarcare. Incearca din nou.',
      500,
    );
  }
}
