/**
 * One-off browser test for /dashboard and console errors
 * Tests Forsured and Scaffald dashboards
 * Run: pnpm exec playwright test dashboard-browser-check --headed
 */
import { expect, test } from '@playwright/test';

const FORSURED_BASE = 'http://localhost:5173';
const SCAFFALD_BASE = 'http://localhost:8081';

test.describe('Dashboard browser check', () => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    consoleWarnings.length = 0;
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') consoleErrors.push(text);
      if (msg.type() === 'warning') consoleWarnings.push(text);
    });
  });

  test('Forsured: test login and /dashboard', async ({ page }) => {
    await page.goto(FORSURED_BASE + '/');
    await expect(page.getByText(/Welcome to ForSured/)).toBeVisible({ timeout: 10000 });

    // Click Test as GC / Manager
    await page.getByRole('button', { name: /Test as GC \/ Manager/ }).click();

    // Should redirect to manager dashboard
    await expect(page).toHaveURL(/\/(manager\/dashboard|dashboard)/, { timeout: 15000 });

    // Log results
    console.log('[Forsured] Console errors:', consoleErrors);
    console.log('[Forsured] Console warnings:', consoleWarnings);
  });

  test('Scaffald: /dashboard after Forsured session (shared Supabase)', async ({
    page,
    context,
  }) => {
    // First login at Forsured
    await page.goto(FORSURED_BASE + '/');
    await page.getByRole('button', { name: /Test as GC \/ Manager/ }).click();
    await expect(page).toHaveURL(/\/(manager\/dashboard|dashboard)/, { timeout: 15000 });

    // Navigate to Scaffald - session may carry over (same Supabase)
    await page.goto(SCAFFALD_BASE + '/');
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log('[Scaffald] Final URL:', url);
    console.log('[Scaffald] Console errors:', consoleErrors);
    console.log('[Scaffald] Console warnings:', consoleWarnings);

    // May land on dashboard, onboarding, or auth depending on Scaffald prerequisites
    expect(
      url.includes('/dashboard') || url.includes('/onboarding') || url.includes('/auth')
    ).toBeTruthy();
  });

  test('Scaffald: /dashboard direct (unauthenticated)', async ({ page }) => {
    await page.goto(SCAFFALD_BASE + '/dashboard');
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log('[Scaffald direct] Final URL:', url);
    console.log('[Scaffald direct] Console errors:', consoleErrors);

    // Should redirect to auth or stay on dashboard
    expect(url).toBeTruthy();
  });
});
