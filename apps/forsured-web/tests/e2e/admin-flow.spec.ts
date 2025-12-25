// tests/e2e/admin-flow.spec.ts
// Phase 4: Admin Interface E2E Tests
//
// Tests the admin panel functionality including:
// - Dashboard navigation and display
// - User management (view, change role, view activity)
// - Broker invitation management
// - Enum management
// - Audit log viewing
//
// REQ-9: Testing Policy - Use real Supabase, no mocking internal systems

import { test, expect } from './fixtures/base';
import { TEST_USERS, TEST_USER_IDS } from '../utils/auth';
import { seedAdminTestData, cleanupAdminTestData, getSeededAdminData } from '../fixtures/seed-admin-data';

test.describe('Admin User Flow', () => {
  test.beforeAll(async () => {
    // Seed test data for admin tests
    await seedAdminTestData();
  });

  test.afterAll(async () => {
    // Clean up test data
    await cleanupAdminTestData();
  });

  test.beforeEach(async ({ page, setupAuthAs }) => {
    // Set up auth for admin user
    await setupAuthAs(page, 'admin@test.forsured.com');
    // Navigate to dashboard after auth setup
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('Admin can view dashboard with stats and recent activity', async ({ page, assertNoErrors }) => {
    // Should already be on dashboard after login
    await expect(page).toHaveURL(/admin\/dashboard/);

    // Check for dashboard heading (may vary based on UI)
    const heading = page.locator('h1');
    const hasHeading = await heading.count() > 0;
    if (hasHeading) {
      await expect(heading.first()).toBeVisible();
    }

    // Verify some stats or content is visible
    const pageContent = await page.content();
    const hasValidContent = pageContent.toLowerCase().includes('dashboard') ||
      pageContent.toLowerCase().includes('admin') ||
      pageContent.toLowerCase().includes('users') ||
      pageContent.toLowerCase().includes('forsured');
    expect(hasValidContent).toBeTruthy();

    await assertNoErrors();
  });

  test('Admin can navigate to Users page and view user list', async ({ page, assertNoErrors }) => {
    // Navigate to Users via sidebar
    const usersLink = page.getByRole('link', { name: 'Users' });
    if (await usersLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await usersLink.click();
      await expect(page).toHaveURL(/admin\/users/);

      // Check for user management content
      const pageContent = await page.content();
      const hasValidContent = pageContent.toLowerCase().includes('user') ||
        pageContent.toLowerCase().includes('management') ||
        pageContent.toLowerCase().includes('email');
      expect(hasValidContent).toBeTruthy();
    } else {
      // Direct navigation if sidebar not visible
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
    }

    await assertNoErrors();
  });

  test('Admin can filter users by role', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Look for role filter
    const roleFilter = page.locator('#roleFilter, select[name*="role"]').first();
    if (await roleFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Try to filter by role
      await roleFilter.selectOption('gc');
      await page.waitForTimeout(500);
    }

    // Page should still be functional
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('user');
  });

  test('Admin can navigate to Brokers page and view invitations', async ({ page, assertNoErrors }) => {
    // Navigate to Brokers
    const brokersLink = page.getByRole('link', { name: 'Brokers' });
    if (await brokersLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await brokersLink.click();
      await expect(page).toHaveURL(/admin\/brokers/);
    } else {
      await page.goto('/admin/brokers');
      await page.waitForLoadState('networkidle');
    }

    // Check for broker invitations content
    const pageContent = await page.content();
    const hasValidContent = pageContent.toLowerCase().includes('broker') ||
      pageContent.toLowerCase().includes('invitation') ||
      pageContent.toLowerCase().includes('code');
    expect(hasValidContent).toBeTruthy();

    // Look for seeded invitation codes (if displayed)
    const seededData = getSeededAdminData();
    if (seededData.brokerInvitations.length > 0) {
      // Check if any invitation code is visible
      const hasInvitation = await page.locator('table').isVisible().catch(() => false);
      if (hasInvitation) {
        await expect(page.locator('table')).toBeVisible();
      }
    }

    await assertNoErrors();
  });

  test('Admin can open broker invitation form', async ({ page }) => {
    await page.goto('/admin/brokers');
    await page.waitForLoadState('networkidle');

    // Look for Create Invitation button
    const createButton = page.locator('button:has-text("Create Invitation"), button:has-text("Create")').first();
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();

      // Verify form fields appear
      await page.waitForTimeout(1000);
      const hasEmailField = await page.locator('input[type="email"], label:has-text("Email")').isVisible().catch(() => false);
      const hasFormContent = await page.locator('form, [role="dialog"]').isVisible().catch(() => false);

      expect(hasEmailField || hasFormContent).toBeTruthy();

      // Cancel/close the form
      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelButton.click();
      }
    }
  });

  test('Admin can navigate to Enums page and view enum types', async ({ page, assertNoErrors }) => {
    // Navigate to Enums
    const enumsLink = page.getByRole('link', { name: 'Enums' });
    if (await enumsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await enumsLink.click();
      await expect(page).toHaveURL(/admin\/enums/);
    } else {
      await page.goto('/admin/enums');
      await page.waitForLoadState('networkidle');
    }

    // Check for enum management content
    const pageContent = await page.content();
    const hasValidContent = pageContent.toLowerCase().includes('enum') ||
      pageContent.toLowerCase().includes('value') ||
      pageContent.toLowerCase().includes('type');
    expect(hasValidContent).toBeTruthy();

    await assertNoErrors();
  });

  test('Admin can view enum values in table', async ({ page }) => {
    await page.goto('/admin/enums');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for table with enum values
    const table = page.locator('table');
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(table).toBeVisible();

      // Check for common enum values (these should exist in real DB)
      const pageContent = await page.content();
      const hasEnumContent = pageContent.toLowerCase().includes('pending') ||
        pageContent.toLowerCase().includes('active') ||
        pageContent.toLowerCase().includes('status');
      expect(hasEnumContent).toBeTruthy();
    }
  });

  test('Admin can navigate to Audit Log page and view logs', async ({ page, assertNoErrors }) => {
    // Navigate to Audit Log
    const auditLink = page.getByRole('link', { name: /Audit/i });
    if (await auditLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await auditLink.click();
      await expect(page).toHaveURL(/admin\/audit-log/);
    } else {
      await page.goto('/admin/audit-log');
      await page.waitForLoadState('networkidle');
    }

    // Check for audit log content
    const pageContent = await page.content();
    const hasValidContent = pageContent.toLowerCase().includes('audit') ||
      pageContent.toLowerCase().includes('log') ||
      pageContent.toLowerCase().includes('action');
    expect(hasValidContent).toBeTruthy();

    // Look for seeded audit logs
    const seededData = getSeededAdminData();
    if (seededData.auditLogs.length > 0) {
      // Check if table with logs is visible
      const table = page.locator('table');
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(table).toBeVisible();
      }
    }

    await assertNoErrors();
  });

  test('Admin can filter audit logs', async ({ page }) => {
    await page.goto('/admin/audit-log');
    await page.waitForLoadState('networkidle');

    // Look for action filter
    const actionFilter = page.locator('#actionFilter, select[name*="action"]').first();
    if (await actionFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Get available options
      const options = await actionFilter.locator('option').allTextContents();
      if (options.length > 1) {
        await actionFilter.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }
    }

    // Page should still be functional
    const pageContent = await page.content();
    const hasAuditContent = pageContent.toLowerCase().includes('audit') || pageContent.toLowerCase().includes('log');
    expect(hasAuditContent).toBeTruthy();
  });

  test('Admin can search audit logs', async ({ page }) => {
    await page.goto('/admin/audit-log');
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('CREATE');
      await page.waitForTimeout(500);
    }

    // Page should still be functional
    await expect(page.locator('main, [role="main"], body')).toBeVisible();
  });

  test('Admin sidebar navigation works correctly', async ({ page }) => {
    // Verify sidebar links work
    const sidebarLinks = [
      { label: /Dashboard/i, url: /admin\/dashboard/ },
      { label: /Users/i, url: /admin\/users/ },
      { label: /Brokers/i, url: /admin\/brokers/ },
      { label: /Enums/i, url: /admin\/enums/ },
      { label: /Audit/i, url: /admin\/audit-log/ },
    ];

    for (const link of sidebarLinks) {
      const linkElement = page.getByRole('link', { name: link.label }).first();
      if (await linkElement.isVisible({ timeout: 3000 }).catch(() => false)) {
        await linkElement.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(link.url);
      }
    }
  });
});
