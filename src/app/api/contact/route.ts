import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validations';
import { sendContactFormEmail } from '@/lib/email';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const CONTACT_LIMIT = { max: 5, windowSec: 15 * 60 }; // 5 messages / 15 min

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`contact:${ip}`, CONTACT_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, email, phone, message } = parsed.data;

    // Fire-and-forget email to admin
    sendContactFormEmail({ name, email, phone, message }).catch((err) =>
      console.error('Failed to send contact form email:', err),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
