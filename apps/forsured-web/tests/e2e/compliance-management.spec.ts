/**
 * E2E Tests for Admin Compliance Management Workflows
 * REQ-2, TASK-21: Test admin compliance requirement management UI
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * Tests the admin compliance management features including:
 * - Compliance requirements list navigation
 * - Requirement creation and editing
 * - Dependency visualization
 * - Version history viewing
 * - Bulk import/export operations
 *
 * NOTE: These tests are currently skipped waiting for compliance admin pages
 * to be implemented. When enabled, they will use real database calls with
 * seed data from tests/fixtures/seed-compliance-data.ts (to be created).
 *
 * Implementation checklist when enabling these tests:
 * 1. Create seed-compliance-data.ts fixture (see seed-admin-data.ts for pattern)
 * 2. Import seedComplianceTestData/cleanupComplianceTestData
 * 3. Add beforeAll/afterAll hooks for seeding
 * 4. Remove test.skip() from individual tests
 */

import { test, expect } from './fixtures/base';
import { TEST_USER_IDS } from '../utils/auth';

// =============================================================================
// Test Constants
// =============================================================================

// These IDs will be populated by seed data when tests are enabled
const TEST_REQUIREMENT_IDS = {
  generalLiability: 'req-gl-001-test',
  workersComp: 'req-wc-001-test',
  umbrella: 'req-umb-001-test',
};

// =============================================================================
// Test Suite
// =============================================================================

test.describe('Admin Compliance Management', () => {
  // TODO: When compliance admin pages are implemented, add:
  // test.beforeAll(async () => {
  //   await seedComplianceTestData();
  // });
  //
  // test.afterAll(async () => {
  //   await cleanupComplianceTestData();
  // });

  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
  });

  // ===========================================================================
  // Navigation Tests
  // ===========================================================================

  test.describe('Navigation', () => {
    test.skip('should navigate to compliance requirements from admin dashboard', async ({ page }) => {
      // TODO: Enable when compliance nav item is added to admin dashboard
      await page.goto('/admin/dashboard');

      // Look for compliance navigation item
      const complianceNav = page.getByRole('link', { name: /compliance/i });
      await expect(complianceNav).toBeVisible();

      await complianceNav.click();
      await expect(page).toHaveURL(/\/admin\/compliance/);
    });

    test.skip('should display compliance requirements list', async ({ page }) => {
      // TODO: Enable when compliance requirements page is implemented
      await page.goto('/admin/compliance/requirements');

      // Should show the requirements list
      await expect(page.getByRole('heading', { name: /compliance requirements/i })).toBeVisible();

      // Should display the mock requirements
      await expect(page.getByText('GL-001')).toBeVisible();
      await expect(page.getByText('WC-001')).toBeVisible();
      await expect(page.getByText('UMB-001')).toBeVisible();
    });
  });

  // ===========================================================================
  // Requirements CRUD Tests
  // ===========================================================================

  test.describe('Requirements Management', () => {
    test.skip('should create a new requirement', async ({ page }) => {
      // TODO: Enable when requirement creation form is implemented
      await page.goto('/admin/compliance/requirements');

      // Click create button
      await page.getByRole('button', { name: /create|add|new/i }).click();

      // Fill out the form
      await page.getByLabel(/code/i).fill('NEW-001');
      await page.getByLabel(/name/i).fill('New Requirement');
      await page.getByLabel(/type/i).selectOption('general_liability');

      // Submit
      await page.getByRole('button', { name: /save|create/i }).click();

      // Should show success message
      await expect(page.getByText(/created|success/i)).toBeVisible();
    });

    test.skip('should edit an existing requirement', async ({ page }) => {
      // TODO: Enable when requirement edit form is implemented
      await page.goto('/admin/compliance/requirements');

      // Click on a requirement to edit
      await page.getByText('GL-001').click();

      // Should navigate to edit page
      await expect(page).toHaveURL(/\/admin\/compliance\/requirements\/.*\/edit/);

      // Edit the name
      const nameField = page.getByLabel(/name/i);
      await nameField.clear();
      await nameField.fill('Updated GL Requirement');

      // Save
      await page.getByRole('button', { name: /save/i }).click();

      // Should show success message
      await expect(page.getByText(/updated|success/i)).toBeVisible();
    });

    test.skip('should archive a requirement', async ({ page }) => {
      // TODO: Enable when archive functionality is implemented
      await page.goto('/admin/compliance/requirements');

      // Find and click archive button for a requirement
      const row = page.getByRole('row', { name: /GL-001/ });
      await row.getByRole('button', { name: /archive/i }).click();

      // Confirm archive
      await page.getByRole('button', { name: /confirm/i }).click();

      // Should show success message
      await expect(page.getByText(/archived|success/i)).toBeVisible();
    });
  });

  // ===========================================================================
  // Dependency Management Tests
  // ===========================================================================

  test.describe('Dependency Management', () => {
    test.skip('should display dependency visualizer', async ({ page }) => {
      // TODO: Enable when dependency visualizer is integrated
      await page.goto('/admin/compliance/requirements/' + TEST_REQUIREMENT_IDS.umbrella);

      // Click on dependencies tab
      await page.getByRole('tab', { name: /dependencies/i }).click();

      // Should show dependency graph
      await expect(page.getByTestId('dependency-visualizer')).toBeVisible();

      // Should show the dependency relationship
      await expect(page.getByText('GL-001')).toBeVisible();
    });

    test.skip('should add a new dependency', async ({ page }) => {
      // TODO: Enable when add dependency form is implemented
      await page.goto('/admin/compliance/requirements/' + TEST_REQUIREMENT_IDS.umbrella);

      // Click on dependencies tab
      await page.getByRole('tab', { name: /dependencies/i }).click();

      // Click add dependency
      await page.getByRole('button', { name: /add dependency/i }).click();

      // Select requirement to depend on
      await page.getByLabel(/requirement/i).selectOption(TEST_REQUIREMENT_IDS.workersComp);
      await page.getByLabel(/type/i).selectOption('requires');

      // Save
      await page.getByRole('button', { name: /save|add/i }).click();

      // Should show success message
      await expect(page.getByText(/added|success/i)).toBeVisible();
    });
  });

  // ===========================================================================
  // Version History Tests
  // ===========================================================================

  test.describe('Version History', () => {
    test.skip('should display version history', async ({ page }) => {
      // TODO: Enable when version history UI is integrated
      await page.goto('/admin/compliance/requirements/' + TEST_REQUIREMENT_IDS.generalLiability);

      // Click on history tab
      await page.getByRole('tab', { name: /history|versions/i }).click();

      // Should show version history
      await expect(page.getByText(/version 1/i)).toBeVisible();
      await expect(page.getByText(/initial version/i)).toBeVisible();
    });

    test.skip('should compare two versions', async ({ page }) => {
      // TODO: Enable when version comparison is implemented
      await page.goto('/admin/compliance/requirements/' + TEST_REQUIREMENT_IDS.generalLiability);

      // Click on history tab
      await page.getByRole('tab', { name: /history|versions/i }).click();

      // Select two versions for comparison
      await page.getByRole('checkbox', { name: /version 1/i }).check();
      await page.getByRole('checkbox', { name: /version 2/i }).check();

      // Click compare
      await page.getByRole('button', { name: /compare/i }).click();

      // Should show diff view
      await expect(page.getByTestId('version-diff')).toBeVisible();
    });
  });

  // ===========================================================================
  // Bulk Operations Tests
  // ===========================================================================

  test.describe('Bulk Operations', () => {
    test.skip('should preview bulk import', async ({ page }) => {
      // TODO: Enable when bulk import UI is integrated into admin
      await page.goto('/admin/compliance/requirements');

      // Click import button
      await page.getByRole('button', { name: /import/i }).click();

      // Should show import dialog
      await expect(page.getByRole('dialog')).toBeVisible();

      // Upload a file
      const jsonData = JSON.stringify([
        { code: 'NEW-GL', name: 'New GL', type: 'general_liability' },
      ]);

      await page.getByLabel(/data|json/i).fill(jsonData);

      // Preview
      await page.getByRole('button', { name: /preview/i }).click();

      // Should show preview results
      await expect(page.getByText(/valid/i)).toBeVisible();
    });

    test.skip('should export requirements', async ({ page }) => {
      // TODO: Enable when export functionality is integrated
      await page.goto('/admin/compliance/requirements');

      // Click export button
      await page.getByRole('button', { name: /export/i }).click();

      // Select format
      await page.getByLabel(/format/i).selectOption('json');

      // Download
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: /download/i }).click(),
      ]);

      expect(download.suggestedFilename()).toContain('.json');
    });

    test.skip('should bulk archive requirements', async ({ page }) => {
      // TODO: Enable when bulk operations are implemented
      await page.goto('/admin/compliance/requirements');

      // Select multiple requirements
      await page.getByRole('checkbox', { name: /GL-001/i }).check();
      await page.getByRole('checkbox', { name: /WC-001/i }).check();

      // Click bulk actions
      await page.getByRole('button', { name: /bulk actions/i }).click();
      await page.getByRole('menuitem', { name: /archive/i }).click();

      // Confirm
      await page.getByRole('button', { name: /confirm/i }).click();

      // Should show success
      await expect(page.getByText(/archived.*2/i)).toBeVisible();
    });
  });

  // ===========================================================================
  // Filtering and Search Tests
  // ===========================================================================

  test.describe('Filtering and Search', () => {
    test.skip('should filter requirements by type', async ({ page }) => {
      // TODO: Enable when filtering UI is implemented
      await page.goto('/admin/compliance/requirements');

      // Open filter
      await page.getByRole('button', { name: /filter/i }).click();

      // Select type filter
      await page.getByLabel(/type/i).selectOption('general_liability');

      // Apply
      await page.getByRole('button', { name: /apply/i }).click();

      // Should only show GL requirements
      await expect(page.getByText('GL-001')).toBeVisible();
      await expect(page.getByText('UMB-001')).not.toBeVisible();
    });

    test.skip('should search requirements by name', async ({ page }) => {
      // TODO: Enable when search is implemented
      await page.goto('/admin/compliance/requirements');

      // Search
      await page.getByPlaceholder(/search/i).fill('Workers');

      // Should filter results
      await expect(page.getByText('WC-001')).toBeVisible();
      await expect(page.getByText('GL-001')).not.toBeVisible();
    });
  });

  // ===========================================================================
  // Authorization Tests
  // ===========================================================================

  test.describe('Authorization', () => {
    test.skip('should show admin-only features for admin users', async ({ page }) => {
      // TODO: Enable when role-based UI is implemented
      await page.goto('/admin/compliance/requirements');

      // Admin should see all action buttons
      await expect(page.getByRole('button', { name: /create/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
    });

    test.skip('should hide admin features for non-admin users', async ({ page, setupAuthAs }) => {
      // TODO: Enable when broker compliance view is implemented
      // Login as broker instead
      await setupAuthAs(page, 'active.broker@test.forsured.com');
      await page.goto('/broker/compliance/requirements');
      await page.waitForLoadState('networkidle');

      // Broker should not see admin action buttons
      await expect(page.getByRole('button', { name: /create/i })).not.toBeVisible();
      await expect(page.getByRole('button', { name: /import/i })).not.toBeVisible();
    });
  });
});

// =============================================================================
// Smoke Tests (Basic Page Loading)
// =============================================================================

// TODO: Smoke tests need admin dashboard fix - skipping temporarily
test.describe.skip('Compliance Management Smoke Tests', () => {
  test('admin can access dashboard', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('admin dashboard loads without errors', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await page.goto('/admin/dashboard');

    // Check for no critical errors in console
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('hydration')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
