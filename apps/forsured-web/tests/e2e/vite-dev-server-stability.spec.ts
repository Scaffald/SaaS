/**
 * BUG-001 and BUG-003: Vite Dev Server Stability Tests
 *
 * Tests for:
 * - BUG-001: Intermittent Vite dev server crash on admin login
 * - BUG-003: Complete dev server crash after extended navigation
 *
 * These tests verify that:
 * 1. Admin login works consistently without esbuild service crashes
 * 2. Extended navigation through admin pages doesn't crash the dev server
 * 3. Error boundaries catch component errors gracefully
 * 4. WebSocket connections remain stable during navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Vite Dev Server Stability', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Navigate to start page
    await page.goto('/start');
    await page.waitForLoadState('networkidle');
  });

  test('BUG-001: Admin login should work consistently without crashes', async ({ page }) => {
    // Test admin login 5 times to verify no intermittent crashes
    for (let i = 0; i < 5; i++) {
      console.log(`Admin login attempt ${i + 1}/5`);

      // Click "Test as Admin" button
      const testAsAdminButton = page.locator('button:has-text("Test as Admin")');
      await expect(testAsAdminButton).toBeVisible();
      await testAsAdminButton.click();

      // Wait for navigation to admin dashboard
      await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });

      // Verify AdminLayout loaded successfully
      await expect(page.locator('text=Admin Panel')).toBeVisible({ timeout: 5000 });

      // Verify no 500 errors or esbuild service errors
      const errorMessages = await page.locator('text=/500 Internal Server Error|service is no longer running|Failed to fetch dynamically imported module/i').count();
      expect(errorMessages).toBe(0);

      // Navigate back to start for next iteration
      await page.goto('/start');
      await page.waitForLoadState('networkidle');
    }
  });

  test('BUG-003: Extended navigation through admin pages should not crash server', async ({ page }) => {
    // Login as admin
    const testAsAdminButton = page.locator('button:has-text("Test as Admin")');
    await expect(testAsAdminButton).toBeVisible();
    await testAsAdminButton.click();

    // Wait for admin dashboard
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
    await expect(page.locator('text=Admin Panel')).toBeVisible();

    // Navigate through ALL admin pages multiple times
    const adminPages = [
      { path: '/admin/dashboard', label: 'Dashboard' },
      { path: '/admin/users', label: 'Users' },
      { path: '/admin/brokers', label: 'Brokers' },
      { path: '/admin/user-set-types', label: 'Industry Verticals' },
      { path: '/admin/lexicon', label: 'Lexicon Editor' },
      { path: '/admin/enums', label: 'Enums' },
      { path: '/admin/audit-log', label: 'Audit Log' },
      { path: '/admin/settings', label: 'Settings' },
    ];

    // Navigate through pages 3 times to simulate extended navigation
    for (let iteration = 0; iteration < 3; iteration++) {
      console.log(`Navigation iteration ${iteration + 1}/3`);

      for (const adminPage of adminPages) {
        console.log(`  Navigating to ${adminPage.label}`);

        // Click on the navigation link
        const navLink = page.locator(`a[href="${adminPage.path}"]`);
        await expect(navLink).toBeVisible();
        await navLink.click();

        // Wait for page to load
        await page.waitForURL(adminPage.path, { timeout: 10000 });

        // Verify no WebSocket connection errors
        const wsErrors = await page.locator('text=/WebSocket connection failed|server connection lost|ERR_CONNECTION_REFUSED/i').count();
        expect(wsErrors).toBe(0);

        // Verify AdminLayout is still visible
        await expect(page.locator('text=Admin Panel')).toBeVisible();

        // Small delay to simulate realistic navigation
        await page.waitForTimeout(500);
      }
    }
  });

  test('Error boundary should catch component errors gracefully', async ({ page }) => {
    // Login as admin
    const testAsAdminButton = page.locator('button:has-text("Test as Admin")');
    await expect(testAsAdminButton).toBeVisible();
    await testAsAdminButton.click();

    // Wait for admin dashboard
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
    await expect(page.locator('text=Admin Panel')).toBeVisible();

    // Verify error boundary is in place (no errors should show initially)
    const errorBoundaryMessage = page.locator('text=Something went wrong');
    await expect(errorBoundaryMessage).not.toBeVisible();
  });

  test('WebSocket connection should remain stable during rapid navigation', async ({ page }) => {
    // Login as admin
    const testAsAdminButton = page.locator('button:has-text("Test as Admin")');
    await expect(testAsAdminButton).toBeVisible();
    await testAsAdminButton.click();

    // Wait for admin dashboard
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });

    // Rapidly navigate between pages to stress-test WebSocket
    const rapidNavigationPages = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/brokers',
      '/admin/settings',
    ];

    for (let i = 0; i < 10; i++) {
      const targetPage = rapidNavigationPages[i % rapidNavigationPages.length];
      await page.goto(targetPage);
      await page.waitForLoadState('domcontentloaded');

      // Verify no connection errors
      const wsErrors = await page.locator('text=/WebSocket connection failed|server connection lost/i').count();
      expect(wsErrors).toBe(0);
    }
  });

  test('AdminLayout should load eagerly without lazy loading delays', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    // Login as admin
    const testAsAdminButton = page.locator('button:has-text("Test as Admin")');
    await testAsAdminButton.click();

    // Wait for admin dashboard
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });

    // AdminLayout should load quickly (no lazy loading chunk delays)
    await expect(page.locator('text=Admin Panel')).toBeVisible({ timeout: 3000 });

    // Verify no AdminLayout chunk requests (since it's eagerly loaded)
    const adminLayoutChunkRequests = requests.filter(url => url.includes('AdminLayout') && url.includes('.js'));
    // AdminLayout should be in main bundle, not a separate chunk
    expect(adminLayoutChunkRequests.length).toBe(0);
  });
});
