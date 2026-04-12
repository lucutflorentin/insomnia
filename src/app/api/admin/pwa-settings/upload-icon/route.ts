import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { verifyRole } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

const UPLOAD_LIMIT = { max: 10, windowSec: 60 };
const ALLOWED_SIZES = [192, 512] as const;

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

export async function POST(request: NextRequest) {
  try {
    await verifyRole(request, ['SUPER_ADMIN']);

    const ip = getClientIp(request);
    const rl = checkRateLimit(`pwa-icon-upload:${ip}`, UPLOAD_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many uploads. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sizeStr = formData.get('size') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 },
      );
    }

    const size = Number(sizeStr);
    if (!ALLOWED_SIZES.includes(size as 192 | 512)) {
      return NextResponse.json(
        { success: false, error: 'Size must be 192 or 512' },
        { status: 400 },
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
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

    // Process image to exact size as PNG in memory
    const processedBuffer = await sharp(buffer)
      .resize(size, size, { fit: 'cover' })
      .png({ quality: 90 })
      .toBuffer();

    // Upload to Vercel Blob
    const blob = await put(`icons/icon-${size}.png`, processedBuffer, {
      access: 'public',
      contentType: 'image/png',
    });

    const iconPath = blob.url;
    const settingKey = `pwa_icon_${size}`;

    await prisma.setting.upsert({
      where: { settingKey },
      create: { settingKey, settingValue: iconPath },
      update: { settingValue: iconPath },
    });

    return NextResponse.json({
      success: true,
      data: { iconPath, size },
    }, { status: 201 });
  } catch (error) {
    console.error('PWA icon upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed. Please try again.' },
      { status: 500 },
    );
  }
}
