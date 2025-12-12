// tests/e2e/contractor-flow.spec.ts
import { test, expect } from '@playwright/test';
import { setupAuthAs } from '../utils/auth';

test.describe('Contractor User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
  });

  test('Contractor can view dashboard', async ({ page }) => {
    await page.goto('/subcontractor/dashboard');
    // Dashboard should load with either tasks or empty state
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('Contractor can access documents page', async ({ page }) => {
    await page.goto('/subcontractor/documents');
    await expect(page).toHaveURL(/\/subcontractor\/documents/);
  });

  test('Contractor can access tasks page', async ({ page }) => {
    await page.goto('/subcontractor/tasks');
    await expect(page).toHaveURL(/\/subcontractor\/tasks/);
  });
});

test.describe('Contractor Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
  });

  test('Documents page shows document management UI', async ({ page }) => {
    await page.goto('/subcontractor/documents');
    // Verify page structure loads correctly
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible();
    // Upload button should be present
    await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();
  });

  test('Tasks page shows tasks UI or empty state', async ({ page }) => {
    await page.goto('/subcontractor/tasks');
    // Verify tasks page loads - check for main h1 heading
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
