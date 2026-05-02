import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { GALLERY_UPLOAD_CONFIG } from '@/lib/constants';
import { verifyRole } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { inspectRequestForAttack } from '@/lib/security-events';

const UPLOAD_LIMIT = { max: 20, windowSec: 60 };
const MAX_IMAGE_DIMENSION = 8000;
const MAX_UPLOAD_MB = Math.round(GALLERY_UPLOAD_CONFIG.maxFileSize / 1024 / 1024);
const MAIN_IMAGE_MAX_WIDTH = 2400;
const THUMBNAIL_MAX_WIDTH = 900;

// Magic bytes signatures for allowed image types
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  return signatures.some((sig) =>
    sig.every((byte, index) => buffer[index] === byte),
  );
}

function uploadErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes('authentication') ||
    normalizedMessage.includes('access token') ||
    normalizedMessage.includes('permissions')
  ) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN.trim() === '') {
    return NextResponse.json(
      {
        success: false,
        error: 'Image storage is not configured. Please set BLOB_READ_WRITE_TOKEN.',
        code: 'STORAGE_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  if (normalizedMessage.includes('blob')) {
    return NextResponse.json(
      {
        success: false,
        error: 'Image storage rejected the upload. Please check Vercel Blob configuration.',
        code: 'STORAGE_UPLOAD_FAILED',
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { success: false, error: 'Upload failed. Please try again.', code: 'UPLOAD_FAILED' },
    { status: 500 },
  );
}

// POST /api/upload — Upload image with processing (SUPER_ADMIN or ARTIST only)
export async function POST(request: NextRequest) {
  try {
    await inspectRequestForAttack(request, 'api/upload');
    await verifyRole(request, ['SUPER_ADMIN', 'ARTIST']);

    if (!process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN.trim() === '') {
      return uploadErrorResponse(new Error('BLOB_READ_WRITE_TOKEN is missing'));
    }

    // Rate limit
    const ip = getClientIp(request);
    const rl = await checkRateLimit(
      `upload:${ip}`,
      UPLOAD_LIMIT,
      { request, source: 'api/upload' },
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many uploads. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 },
      );
    }

    // Validate MIME type
    if (!(GALLERY_UPLOAD_CONFIG.allowedFileTypes as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > GALLERY_UPLOAD_CONFIG.maxFileSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum ${MAX_UPLOAD_MB}MB.` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate magic bytes (actual file content vs declared MIME type)
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { success: false, error: 'File content does not match declared type.' },
        { status: 400 },
      );
    }

    // Validate image dimensions using sharp metadata
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { success: false, error: 'Could not read image dimensions.' },
        { status: 400 },
      );
    }

    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      return NextResponse.json(
        {
          success: false,
          error: `Image too large. Maximum ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}px.`,
        },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    // Process the display image at a high enough resolution for retina screens and zoom.
    const mainBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: MAIN_IMAGE_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 92 })
      .toBuffer();

    // Generate a sharper thumbnail for masonry grids on modern phone screens.
    const thumbBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: THUMBNAIL_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();

    // Upload to Vercel Blob
    const [mainBlob, thumbBlob] = await Promise.all([
      put(`gallery/${timestamp}-${random}.webp`, mainBuffer, {
        access: 'public',
        contentType: 'image/webp',
      }),
      put(`gallery/thumbnails/${timestamp}-${random}-thumb.webp`, thumbBuffer, {
        access: 'public',
        contentType: 'image/webp',
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          imagePath: mainBlob.url,
          thumbnailPath: thumbBlob.url,
          url: mainBlob.url,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Upload error:', error);
    return uploadErrorResponse(error);
  }
}
