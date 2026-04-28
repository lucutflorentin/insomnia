import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { BOOKING_CONFIG } from '@/lib/constants';
import { verifyRole } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const UPLOAD_LIMIT = { max: 20, windowSec: 60 };
const MAX_IMAGE_DIMENSION = 8000;

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

// POST /api/upload — Upload image with processing (SUPER_ADMIN or ARTIST only)
export async function POST(request: NextRequest) {
  try {
    await verifyRole(request, ['SUPER_ADMIN', 'ARTIST']);

    // Rate limit
    const ip = getClientIp(request);
    const rl = checkRateLimit(`upload:${ip}`, UPLOAD_LIMIT);
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
    if (!(BOOKING_CONFIG.allowedFileTypes as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > BOOKING_CONFIG.maxFileSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum 5MB.' },
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

    // Process main image (max 1200px wide) in memory
    const mainBuffer = await sharp(buffer)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // Generate thumbnail (400px wide) in memory
    const thumbBuffer = await sharp(buffer)
      .resize(400, null, { withoutEnlargement: true })
      .webp({ quality: 75 })
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
    return NextResponse.json(
      { success: false, error: 'Upload failed. Please try again.' },
      { status: 500 },
    );
  }
}
