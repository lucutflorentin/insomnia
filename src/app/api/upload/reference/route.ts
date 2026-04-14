import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { BOOKING_CONFIG } from '@/lib/constants';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const REFERENCE_UPLOAD_LIMIT = { max: 10, windowSec: 60 }; // 10/min (stricter than admin)
const MAX_IMAGE_DIMENSION = 8000;

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

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
    const ip = getClientIp(request);
    const rl = checkRateLimit(`ref-upload:${ip}`, REFERENCE_UPLOAD_LIMIT);
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

    if (!(BOOKING_CONFIG.allowedFileTypes as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 },
      );
    }

    if (file.size > BOOKING_CONFIG.maxFileSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum 5MB.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { success: false, error: 'File content does not match declared type.' },
        { status: 400 },
      );
    }

    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { success: false, error: 'Could not read image dimensions.' },
        { status: 400 },
      );
    }

    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      return NextResponse.json(
        { success: false, error: `Image dimensions too large. Max ${MAX_IMAGE_DIMENSION}px.` },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    // Resize to max 800px (smaller than gallery) and convert to WebP
    const processed = await sharp(buffer)
      .resize(800, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const blob = await put(`references/${timestamp}-${random}.webp`, processed, {
      access: 'public',
      contentType: 'image/webp',
    });

    return NextResponse.json(
      { success: true, data: { url: blob.url } },
      { status: 201 },
    );
  } catch (error) {
    console.error('Reference upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed. Please try again.' },
      { status: 500 },
    );
  }
}
