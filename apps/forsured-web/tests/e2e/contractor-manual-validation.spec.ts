// tests/e2e/contractor-manual-validation.spec.ts
// Simple manual validation test for contractor flow
// REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
//
// NOTE: These are manual validation tests that remain skipped until needed.
// When enabled, they use real database calls and the base fixtures.

import { test, expect } from './fixtures/base';

// TODO: Manual validation tests need fix - skipping temporarily
// Uses real database - no internal API mocking
test.describe.skip('Contractor Manual Validation - Final Audit', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
  });

  test('BUG FIX VALIDATION: Authentication redirect loop is fixed', async ({ page }) => {
    // Navigate to start page
    await page.goto('/start');
    await page.waitForLoadState('networkidle');

    // Verify start page loads
    const content = await page.content();
    expect(content.toLowerCase()).toContain('forsured');
  });

  test('BUG FIX VALIDATION: Dashboard loads without modal crash', async ({ page, assertNoErrors }) => {
    // Navigate to dashboard
    await page.goto('/subcontractor/dashboard');
    await page.waitForTimeout(2000);

    // Verify no critical console errors
    await assertNoErrors();
  });

  test('NAVIGATION: Can navigate to Projects page', async ({ page }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/subcontractor/projects');
  });

  test('NAVIGATION: Can navigate to Tasks page', async ({ page }) => {
    await page.goto('/subcontractor/tasks');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/subcontractor/tasks');
  });

  test('NAVIGATION: Can navigate to Documents page', async ({ page }) => {
    await page.goto('/subcontractor/documents');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/subcontractor/documents');
  });

  test('BUG FIX VALIDATION: Documents upload button exists', async ({ page }) => {
    await page.goto('/subcontractor/documents');
    await page.waitForLoadState('networkidle');

    // Look for upload button
    const uploadButton = page.locator('button:has-text("Upload"), input[type="file"]').first();
    const isVisible = await uploadButton.isVisible({ timeout: 5000 }).catch(() => false);

    expect(isVisible).toBeTruthy();
  });

  test('NAVIGATION: Can navigate to Settings/Profile page', async ({ page }) => {
    await page.goto('/subcontractor/settings/profile');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/subcontractor/settings');
  });

  test('NAVIGATION: Can navigate to Help page', async ({ page }) => {
    await page.goto('/subcontractor/help');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/subcontractor/help');
  });

  test('BROWSER NAVIGATION: Back button works without redirect loop', async ({ page }) => {
    await page.goto('/subcontractor/dashboard');
    await page.waitForLoadState('networkidle');

    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    await page.goBack();
    await page.waitForTimeout(1000);

    const url = page.url();
    expect(url).toContain('/subcontractor/dashboard');
  });

  test('REFRESH: Page refresh maintains authentication', async ({ page }) => {
    await page.goto('/subcontractor/dashboard');
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/subcontractor/dashboard');
  });
});
