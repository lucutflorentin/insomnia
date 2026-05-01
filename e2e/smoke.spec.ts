import { test, expect } from '@playwright/test';

test.describe('public smoke', () => {
  test('home responds', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('guest-data page loads', async ({ page }) => {
    await page.goto('/guest-data');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('EN guest-data loads', async ({ page }) => {
    await page.goto('/en/guest-data');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
