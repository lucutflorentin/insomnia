import { test, expect } from '@playwright/test';

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

test.describe('GDPR guest erasure API', () => {
  test('request rejects invalid email before DB', async ({ request }) => {
    const res = await request.post('/api/gdpr/guest-erasure/request', {
      data: { email: 'not-an-email', language: 'ro' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid email');
  });

  test('request rejects empty email', async ({ request }) => {
    const res = await request.post('/api/gdpr/guest-erasure/request', {
      data: { email: '   ', language: 'ro' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email required');
  });

  test('request rejects invalid JSON', async ({ request }) => {
    const res = await request.post('/api/gdpr/guest-erasure/request', {
      headers: { 'Content-Type': 'application/json' },
      data: Buffer.from('{'),
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON');
  });

  test('confirm rejects token shorter than 32 chars', async ({ request }) => {
    const res = await request.post('/api/gdpr/guest-erasure/confirm', {
      data: { token: 'x'.repeat(31) },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid token');
  });

  test('confirm rejects unknown token (requires DATABASE_URL)', async ({ request }) => {
    test.skip(!hasDatabaseUrl, 'Set DATABASE_URL to exercise Prisma-backed confirm path');
    const token = 'c'.repeat(64);
    const res = await request.post('/api/gdpr/guest-erasure/confirm', {
      data: { token },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid or expired link');
  });

  test('request accepts valid email shape (requires DATABASE_URL)', async ({ request }) => {
    test.skip(!hasDatabaseUrl, 'Set DATABASE_URL to exercise Prisma-backed request path');
    const unique = `e2e-${Date.now()}@example.com`;
    const res = await request.post('/api/gdpr/guest-erasure/request', {
      data: { email: unique, language: 'en' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.message).toBe('string');
  });
});

test.describe('GDPR guest-data page', () => {
  test('confirm API reachable from browser (same-origin fetch)', async ({ page }) => {
    test.skip(!hasDatabaseUrl, 'Requires DATABASE_URL for Prisma on confirm');
    await page.goto('/en/guest-data');
    const token = 'f'.repeat(64);
    const result = await page.evaluate(async (t) => {
      const r = await fetch('/api/gdpr/guest-erasure/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
      });
      const j = await r.json().catch(() => ({}));
      return { status: r.status, error: (j as { error?: string }).error };
    }, token);
    expect(result.status).toBe(400);
    expect(result.error).toBe('Invalid or expired link');
  });
});
