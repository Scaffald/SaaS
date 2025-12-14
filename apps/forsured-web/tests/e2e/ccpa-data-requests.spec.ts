// tests/e2e/ccpa-data-requests.spec.ts
// REQ-3: CCPA Compliance Implementation
// E2E Tests for CCPA Data Request workflows
//
// Tests the full lifecycle of CCPA data requests including:
// - Data export requests (Right to Know)
// - Data deletion requests (Right to Delete)
// - Opt-out management (Right to Opt-Out)
// - Request status tracking

import { test, expect, Page } from '@playwright/test';
import { setupAuthAs, TEST_USER_IDS } from '../utils/auth';

/**
 * Mock CCPA API responses for testing
 */
async function setupCCPAMocks(page: Page, options: {
  hasRequests?: boolean;
  hasOptOuts?: boolean;
  hasConnectedApps?: boolean;
  hasGPCOptOut?: boolean;
} = {}) {
  const {
    hasRequests = false,
    hasOptOuts = false,
    hasConnectedApps = false,
    hasGPCOptOut = false,
  } = options;

  // Mock data summary endpoint
  await page.route('**/trpc/ccpa.getDataSummary*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            categories: [
              { category: 'identifiers', record_count: 5, data_types: ['name', 'email', 'phone'] },
              { category: 'financial', record_count: 3, data_types: ['insurance_policies'] },
              { category: 'professional', record_count: 2, data_types: ['documents', 'certifications'] },
              { category: 'usage', record_count: 10, data_types: ['tasks', 'login_history'] },
            ],
          },
        },
      }),
    });
  });

  // Mock request history endpoint
  await page.route('**/trpc/ccpa.getMyRequests*', (route) => {
    const requests = hasRequests
      ? [
          {
            id: 'req-1',
            type: 'export',
            status: 'completed',
            created_at: '2024-01-15T10:00:00Z',
            completed_at: '2024-01-16T10:00:00Z',
            download_url: '/downloads/export-req-1.zip',
          },
          {
            id: 'req-2',
            type: 'deletion',
            status: 'processing',
            created_at: '2024-01-20T10:00:00Z',
          },
        ]
      : [];

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: { requests },
        },
      }),
    });
  });

  // Mock connected apps endpoint
  await page.route('**/trpc/ccpa.getConnectedApps*', (route) => {
    const apps = hasConnectedApps
      ? [
          {
            id: 'app-1',
            app_id: 'acme-insurance',
            app_name: 'ACME Insurance Portal',
            connected_at: '2024-01-01T10:00:00Z',
            last_accessed_at: '2024-01-20T10:00:00Z',
            permissions: ['read:profile', 'read:documents'],
            data_categories: ['identifiers', 'financial'],
            can_revoke: true,
          },
        ]
      : [];

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: apps,
        },
      }),
    });
  });

  // Mock opt-out status endpoint
  await page.route('**/trpc/ccpa.getMyOptOuts*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            hasGPCOptOut,
            optOuts: hasOptOuts
              ? [
                  { category: 'sale', opted_out_at: '2024-01-10T10:00:00Z' },
                  { category: 'sharing', opted_out_at: '2024-01-10T10:00:00Z' },
                ]
              : [],
          },
        },
      }),
    });
  });

  // Mock submit data request endpoint
  await page.route('**/trpc/ccpa.submitRequest*', (route) => {
    const body = route.request().postDataJSON();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            id: 'new-req-' + Date.now(),
            type: body?.input?.type || 'export',
            status: 'pending',
            created_at: new Date().toISOString(),
            estimated_completion: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      }),
    });
  });

  // Mock opt-out endpoint
  await page.route('**/trpc/ccpa.setOptOut*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            success: true,
            opted_out_at: new Date().toISOString(),
          },
        },
      }),
    });
  });

  // Mock revoke app access endpoint
  await page.route('**/trpc/ccpa.revokeAppAccess*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            success: true,
            revoked_at: new Date().toISOString(),
          },
        },
      }),
    });
  });
}

test.describe('CCPA Data Export Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page);
  });

  test('should display data categories summary', async ({ page }) => {
    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show data categories
    const identifiers = page.getByText('Personal Identifiers');
    await expect(identifiers).toBeVisible();

    const financial = page.getByText('Financial Information');
    await expect(financial).toBeVisible();
  });

  test('should show record counts for each category', async ({ page }) => {
    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show record counts
    const recordCount = page.getByText(/\d+ records/);
    await expect(recordCount.first()).toBeVisible();
  });

  test('should be able to initiate data export request', async ({ page }) => {
    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Click Request My Data button
    const requestBtn = page.getByRole('button', { name: /request my data/i });
    await requestBtn.click();

    // Should show request form or confirmation
    // The actual behavior depends on implementation
    await page.waitForTimeout(500);
  });
});

test.describe('CCPA Data Deletion Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page);
  });

  test('should be able to initiate deletion request', async ({ page }) => {
    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Click Delete My Data button
    const deleteBtn = page.getByRole('button', { name: /delete my data/i });
    await deleteBtn.click();

    // Should show deletion form or confirmation
    await page.waitForTimeout(500);
  });

  test('Right to Delete description should be visible', async ({ page }) => {
    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Check for Right to Delete information
    const rightToDelete = page.getByText('Right to Delete');
    await expect(rightToDelete).toBeVisible();

    // Should mention retention exceptions
    const retentionText = page.getByText(/retention|legal|regulatory/i);
    await expect(retentionText.first()).toBeVisible();
  });
});

test.describe('CCPA Request History', () => {
  test('should show empty state when no requests exist', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page, { hasRequests: false });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show empty state
    const emptyState = page.getByText(/no privacy requests/i);
    await expect(emptyState).toBeVisible();
  });

  test('should show request history when requests exist', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page, { hasRequests: true });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show request entries
    const exportRequest = page.getByText('Data Export');
    await expect(exportRequest).toBeVisible();
  });

  test('should show request status badges', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page, { hasRequests: true });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show status badges
    const completedBadge = page.getByText(/completed/i);
    const hasCompleted = await completedBadge.isVisible().catch(() => false);

    const processingBadge = page.getByText(/processing/i);
    const hasProcessing = await processingBadge.isVisible().catch(() => false);

    // At least one status should be visible
    expect(hasCompleted || hasProcessing).toBe(true);
  });

  test('should show download button for completed exports', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page, { hasRequests: true });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should have download button for completed request
    const downloadBtn = page.getByRole('button', { name: /download/i });
    const hasDownload = await downloadBtn.isVisible().catch(() => false);

    // Download button should be present for completed exports
    expect(hasDownload).toBe(true);
  });
});

test.describe('CCPA Opt-Out Management', () => {
  test('should show Manage Opt-Outs button', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page);

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    const optOutBtn = page.getByRole('button', { name: /manage opt-outs/i });
    await expect(optOutBtn).toBeVisible();
  });

  test('should show GPC detection message when GPC is active', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page, { hasGPCOptOut: true });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show GPC message
    const gpcMessage = page.getByText(/global privacy control/i);
    await expect(gpcMessage).toBeVisible();
  });

  test('should show opt-out options in privacy rights section', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page);

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Check for Right to Opt-Out section
    const optOutRight = page.getByText('Right to Opt-Out');
    await expect(optOutRight).toBeVisible();
  });
});

test.describe('Connected Apps Management', () => {
  test('should show empty state when no apps connected', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page, { hasConnectedApps: false });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    const emptyState = page.getByText(/no connected applications/i);
    await expect(emptyState).toBeVisible();
  });

  test('should show connected apps when present', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page, { hasConnectedApps: true });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show app name
    const appName = page.getByText('ACME Insurance Portal');
    await expect(appName).toBeVisible();
  });

  test('should show permissions for connected apps', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page, { hasConnectedApps: true });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show permissions section
    const permissions = page.getByText('Permissions');
    await expect(permissions.first()).toBeVisible();
  });

  test('should show Revoke Access button for connected apps', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page, { hasConnectedApps: true });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show revoke button
    const revokeBtn = page.getByRole('button', { name: /revoke access/i });
    await expect(revokeBtn).toBeVisible();
  });

  test('should show View Details button for connected apps', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page, { hasConnectedApps: true });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show view details button
    const detailsBtn = page.getByRole('button', { name: /view details/i });
    await expect(detailsBtn).toBeVisible();
  });

  test('should show data categories accessed by app', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page, { hasConnectedApps: true });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show data categories section
    const categoriesLabel = page.getByText('Data Categories Accessed');
    await expect(categoriesLabel).toBeVisible();
  });
});

test.describe('CCPA Compliance - 45 Day Processing', () => {
  test('should display 45-day processing requirement', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page);

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should mention 45-day requirement
    const processingTime = page.getByText(/45 days/i);
    await expect(processingTime).toBeVisible();
  });

  test('should display 30-day download availability', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page);

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should mention 30-day download availability
    const downloadTime = page.getByText(/30 days/i);
    await expect(downloadTime).toBeVisible();
  });
});

test.describe('CCPA Data Request - Cross User Type', () => {
  test('Contractor should have same CCPA rights as GC', async ({ page }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
    await setupCCPAMocks(page);

    await page.goto('/subcontractor/settings/privacy');
    await page.waitForTimeout(1000);

    // Should see all the same rights
    const rightToKnow = page.getByText('Right to Know');
    await expect(rightToKnow).toBeVisible();

    const rightToDelete = page.getByText('Right to Delete');
    await expect(rightToDelete).toBeVisible();

    const rightToOptOut = page.getByText('Right to Opt-Out');
    await expect(rightToOptOut).toBeVisible();
  });

  test('Broker should have same CCPA rights as GC', async ({ page }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
    await setupCCPAMocks(page);

    await page.goto('/broker/settings/privacy');
    await page.waitForTimeout(1000);

    // Should see all the same rights
    const rightToKnow = page.getByText('Right to Know');
    await expect(rightToKnow).toBeVisible();

    const rightToDelete = page.getByText('Right to Delete');
    await expect(rightToDelete).toBeVisible();

    const rightToOptOut = page.getByText('Right to Opt-Out');
    await expect(rightToOptOut).toBeVisible();
  });
});

test.describe('CCPA - Non-Discrimination Right', () => {
  test('should display non-discrimination information', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await setupCCPAMocks(page);

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should show non-discrimination right
    const nonDiscrimination = page.getByText('Right to Non-Discrimination');
    await expect(nonDiscrimination).toBeVisible();

    // Should explain the right
    const explanation = page.getByText(/not to receive discriminatory treatment/i);
    await expect(explanation).toBeVisible();
  });
});
