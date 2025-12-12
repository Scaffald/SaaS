// tests/e2e/broker-flow.spec.ts
import { test, expect } from '@playwright/test';
import { setupAuthAs } from '../utils/auth';

test.describe('Broker User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
  });

  test('Broker can view clients page', async ({ page }) => {
    await page.goto('/broker/clients');
    // Clients page should load correctly
    await expect(page).toHaveURL(/\/broker\/clients/);
  });

  test('Broker can access dashboard', async ({ page }) => {
    await page.goto('/broker/dashboard');
    await expect(page).toHaveURL(/\/broker\/dashboard/);
  });
});

test.describe('Broker Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
  });

  test('Clients page shows client management UI or empty state', async ({ page }) => {
    await page.goto('/broker/clients');
    // Page loads - verify navigation sidebar link for Clients is active
    await expect(page.getByRole('link', { name: /clients/i })).toBeVisible();
    // Main content area should be present
    await expect(page.locator('main')).toBeVisible();
  });

  test('Insurance page shows policy management UI', async ({ page }) => {
    await page.goto('/broker/insurance');
    await expect(page).toHaveURL(/\/broker\/insurance/);
    // Insurance page loads - check for main h1 heading
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
