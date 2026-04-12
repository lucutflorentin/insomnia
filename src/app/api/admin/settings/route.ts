import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';
import nodemailer from 'nodemailer';

// GET /api/admin/settings — Fetch all settings (SUPER_ADMIN only)
export async function GET(request: NextRequest) {
  try {
    await verifyRole(request, ['SUPER_ADMIN']);

    const settings = await prisma.setting.findMany();

    // Convert array to object for easier consumption
    const data: Record<string, string | null> = {};
    for (const s of settings) {
      data[s.settingKey] = s.settingValue;
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// PUT /api/admin/settings — Update settings (SUPER_ADMIN only)
export async function PUT(request: NextRequest) {
  try {
    await verifyRole(request, ['SUPER_ADMIN']);

    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid data' },
        { status: 400 },
      );
    }

    // Upsert each key-value pair
    const entries = Object.entries(body) as [string, string][];

    // Validate keys — only allow known setting keys
    const allowedKeys = [
      'studio_phone',
      'studio_email',
      'studio_address',
      'google_maps_url',
      'social_instagram',
      'social_instagram_madalina',
      'social_instagram_florentin',
      'social_tiktok',
      'social_facebook',
      'booking_advance_days',
      'booking_consultation_minutes',
      'booking_max_reference_images',
      'meta_title',
      'meta_description',
      'email_on_new_booking',
      'email_on_new_review',
    ];

    const invalidKeys = entries
      .map(([key]) => key)
      .filter((key) => !allowedKeys.includes(key));

    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid settings: ${invalidKeys.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate value lengths
    for (const [key, value] of entries) {
      if (typeof value !== 'string' || value.length > 2000) {
        return NextResponse.json(
          { success: false, error: `Invalid value for ${key}` },
          { status: 400 },
        );
      }
    }

    // Upsert all settings in a transaction
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { settingKey: key },
          create: { settingKey: key, settingValue: value },
          update: { settingValue: value },
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully.',
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 },
    );
  }
}

// POST /api/admin/settings — Test SMTP connection (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    await verifyRole(request, ['SUPER_ADMIN']);

    const { action } = await request.json();

    if (action === 'test-smtp') {
      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT) || 465;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!host || !user || !pass) {
        return NextResponse.json({
          success: false,
          error: 'SMTP credentials not configured in environment variables.',
        });
      }

      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: true,
          auth: { user, pass },
        });

        await transporter.verify();

        // Send a test email to the admin
        await transporter.sendMail({
          from: `"Insomnia Tattoo" <${user}>`,
          to: user,
          subject: 'Test SMTP — Insomnia Tattoo Admin',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>SMTP Test Successful</h2>
              <p>If you see this email, your SMTP configuration is working correctly.</p>
              <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
            </div>
          `,
        });

        return NextResponse.json({
          success: true,
          message: `SMTP test successful. Test email sent to ${user}.`,
        });
      } catch (smtpError) {
        const errMsg = smtpError instanceof Error ? smtpError.message : 'Unknown SMTP error';
        return NextResponse.json({
          success: false,
          error: `SMTP test failed: ${errMsg}`,
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
