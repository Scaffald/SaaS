/**
 * Navigation E2E Tests
 *
 * Tests that the app's navigation structure works correctly
 */

import { test, expect } from '@playwright/test';

test.describe('App Navigation', () => {
  test('loads the home page successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Check that we have some content
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();

    // Verify title or heading exists
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test.skip('can navigate to office section', async ({ page }) => {
    // This is a template - customize based on your app structure

    // await page.goto('/');
    // await page.waitForLoadState('networkidle');

    // Click office/admin navigation
    // await page.getByRole('link', { name: /office|admin/i }).click();

    // Verify we're on the office page
    // await page.waitForURL('/office', { timeout: 5000 });
    // const heading = page.getByRole('heading', { name: /office|admin/i });
    // await expect(heading).toBeVisible();
  });

  test.skip('displays 404 for unknown routes', async ({ page }) => {
    // Navigate to a route that doesn't exist
    await page.goto('/this-route-does-not-exist');
    await page.waitForLoadState('networkidle');

    // Check for 404 message or redirect
    // This depends on your app's error handling
    const notFoundText = page.getByText(/not found|404/i);
    await expect(notFoundText).toBeVisible();
  });
});
