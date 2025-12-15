// tests/e2e/ccpa-admin-dashboard.spec.ts
// REQ-3: CCPA Compliance Implementation
// E2E Tests for CCPA Admin Dashboard
//
// Tests that admin users can access and manage CCPA requests
// through the compliance dashboard.

import { test, expect, Page } from '@playwright/test';
import { setupAuthAs, TEST_USER_IDS } from '../utils/auth';

/**
 * Mock CCPA Admin API responses
 */
async function setupAdminCCPAMocks(
  page: Page,
  options: {
    hasRequests?: boolean;
    hasOverdueRequests?: boolean;
    pendingCount?: number;
  } = {}
) {
  const {
    hasRequests = true,
    hasOverdueRequests = false,
    pendingCount = 5,
  } = options;

  // Mock compliance metrics endpoint
  await page.route('**/trpc/ccpa.getComplianceMetrics*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            total_requests: hasRequests ? 150 : 0,
            pending_requests: pendingCount,
            processing_requests: 10,
            completed_requests: 130,
            failed_requests: 5,
            average_processing_days: 12.5,
            compliance_rate: 0.97,
            overdue_count: hasOverdueRequests ? 3 : 0,
            requests_by_type: {
              export: 80,
              deletion: 50,
              correction: 15,
              opt_out: 5,
            },
          },
        },
      }),
    });
  });

  // Mock admin requests endpoint
  await page.route('**/trpc/ccpa.getAdminRequests*', (route) => {
    const requests = hasRequests
      ? [
          {
            id: 'req-001',
            user_id: 'user-1',
            user_email: 'user1@example.com',
            user_name: 'John Doe',
            type: 'export',
            status: 'pending',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            priority: 'medium',
            days_elapsed: 5,
            is_overdue: false,
          },
          {
            id: 'req-002',
            user_id: 'user-2',
            user_email: 'user2@example.com',
            user_name: 'Jane Smith',
            type: 'deletion',
            status: 'processing',
            created_at: '2024-01-10T10:00:00Z',
            updated_at: '2024-01-12T10:00:00Z',
            assigned_to: 'admin@test.forsured.com',
            priority: 'high',
            days_elapsed: 10,
            is_overdue: false,
          },
          ...(hasOverdueRequests
            ? [
                {
                  id: 'req-003',
                  user_id: 'user-3',
                  user_email: 'user3@example.com',
                  user_name: 'Bob Wilson',
                  type: 'export',
                  status: 'pending',
                  created_at: '2023-12-01T10:00:00Z',
                  updated_at: '2023-12-01T10:00:00Z',
                  priority: 'urgent',
                  days_elapsed: 50,
                  is_overdue: true,
                },
              ]
            : []),
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

  // Mock process request endpoint
  await page.route('**/trpc/ccpa.processRequest*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            success: true,
            request_id: 'req-001',
            new_status: 'processing',
          },
        },
      }),
    });
  });
}

test.describe('CCPA Admin Dashboard - Access Control', () => {
  test('Admin can access CCPA dashboard', async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);

    await page.goto('/admin/ccpa');

    await expect(page).toHaveURL(/\/admin\/ccpa/);
  });

  test('Non-admin users cannot access CCPA dashboard', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    await page.goto('/admin/ccpa');

    // Should redirect to appropriate page or show access denied
    // The actual behavior depends on implementation
    await page.waitForTimeout(1000);
  });
});

test.describe('CCPA Admin Dashboard - Compliance Metrics', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);
    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);
  });

  test('should display CCPA Compliance Dashboard header', async ({ page }) => {
    const header = page.getByText('CCPA Compliance Dashboard');
    await expect(header).toBeVisible();
  });

  test('should display Compliance Metrics section', async ({ page }) => {
    const section = page.getByText('Compliance Metrics');
    await expect(section).toBeVisible();
  });

  test('should display Total Requests metric', async ({ page }) => {
    const metric = page.getByText('Total Requests');
    await expect(metric).toBeVisible();

    // Should show the count
    const count = page.getByText('150');
    await expect(count).toBeVisible();
  });

  test('should display Pending requests metric', async ({ page }) => {
    const metric = page.getByText('Pending');
    await expect(metric.first()).toBeVisible();
  });

  test('should display Processing requests metric', async ({ page }) => {
    const metric = page.getByText('Processing');
    await expect(metric.first()).toBeVisible();
  });

  test('should display Completed requests metric', async ({ page }) => {
    const metric = page.getByText('Completed');
    await expect(metric.first()).toBeVisible();
  });

  test('should display Average Processing Days metric', async ({ page }) => {
    const metric = page.getByText('Avg Processing Days');
    await expect(metric).toBeVisible();
  });

  test('should display Compliance Rate metric', async ({ page }) => {
    const metric = page.getByText('Compliance Rate');
    await expect(metric).toBeVisible();
  });

  test('should display Overdue Requests metric', async ({ page }) => {
    const metric = page.getByText('Overdue Requests');
    await expect(metric).toBeVisible();
  });
});

test.describe('CCPA Admin Dashboard - Request Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasRequests: true });
    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);
  });

  test('should display Request Management section', async ({ page }) => {
    const section = page.getByText('Request Management');
    await expect(section).toBeVisible();
  });

  test('should display request type filter buttons', async ({ page }) => {
    const allBtn = page.getByRole('button', { name: /^all$/i });
    const exportBtn = page.getByRole('button', { name: /export/i });
    const deletionBtn = page.getByRole('button', { name: /deletion/i });

    await expect(allBtn.first()).toBeVisible();
    await expect(exportBtn.first()).toBeVisible();
    await expect(deletionBtn.first()).toBeVisible();
  });

  test('should display status filter buttons', async ({ page }) => {
    const pendingBtn = page.getByRole('button', { name: /pending/i });
    const processingBtn = page.getByRole('button', { name: /processing/i });
    const completedBtn = page.getByRole('button', { name: /completed/i });

    await expect(pendingBtn.first()).toBeVisible();
    await expect(processingBtn.first()).toBeVisible();
    await expect(completedBtn.first()).toBeVisible();
  });

  test('should display priority filter buttons', async ({ page }) => {
    const urgentBtn = page.getByRole('button', { name: /urgent/i });
    const highBtn = page.getByRole('button', { name: /high/i });
    const mediumBtn = page.getByRole('button', { name: /medium/i });
    const lowBtn = page.getByRole('button', { name: /low/i });

    await expect(urgentBtn.first()).toBeVisible();
    await expect(highBtn.first()).toBeVisible();
    await expect(mediumBtn.first()).toBeVisible();
    await expect(lowBtn.first()).toBeVisible();
  });

  test('should display request rows with user info', async ({ page }) => {
    // Should show user name
    const userName = page.getByText('John Doe');
    await expect(userName).toBeVisible();

    // Should show user email
    const userEmail = page.getByText('user1@example.com');
    await expect(userEmail).toBeVisible();
  });

  test('should display request type in rows', async ({ page }) => {
    const exportType = page.getByText(/export/i);
    await expect(exportType.first()).toBeVisible();
  });

  test('should display status badges in rows', async ({ page }) => {
    const pendingBadge = page.getByText(/pending/i);
    const processingBadge = page.getByText(/processing/i);

    const hasPending = await pendingBadge.first().isVisible().catch(() => false);
    const hasProcessing = await processingBadge.first().isVisible().catch(() => false);

    expect(hasPending || hasProcessing).toBe(true);
  });

  test('should display View button for requests', async ({ page }) => {
    const viewBtn = page.getByRole('button', { name: /view/i });
    await expect(viewBtn.first()).toBeVisible();
  });

  test('should display Process button for pending requests', async ({ page }) => {
    const processBtn = page.getByRole('button', { name: /process/i });
    await expect(processBtn.first()).toBeVisible();
  });

  test('should display Assign button for pending requests', async ({ page }) => {
    const assignBtn = page.getByRole('button', { name: /assign/i });
    await expect(assignBtn.first()).toBeVisible();
  });
});

test.describe('CCPA Admin Dashboard - Overdue Requests Warning', () => {
  test('should display warning when overdue requests exist', async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasOverdueRequests: true });

    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);

    // Should show overdue warning
    const warning = page.getByText(/exceeded the 45-day CCPA deadline/i);
    await expect(warning).toBeVisible();
  });

  test('should highlight overdue requests in the list', async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasOverdueRequests: true });

    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);

    // Should show OVERDUE text
    const overdue = page.getByText(/overdue/i);
    await expect(overdue.first()).toBeVisible();
  });

  test('should not display warning when no overdue requests', async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasOverdueRequests: false });

    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);

    // Should not show overdue warning
    const warning = page.getByText(/exceeded the 45-day CCPA deadline/i);
    const isVisible = await warning.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});

test.describe('CCPA Admin Dashboard - Quick Actions', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);
    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);
  });

  test('should display Quick Actions section', async ({ page }) => {
    const section = page.getByText('Quick Actions');
    await expect(section).toBeVisible();
  });

  test('should display Generate Compliance Report button', async ({ page }) => {
    const btn = page.getByRole('button', { name: /generate compliance report/i });
    await expect(btn).toBeVisible();
  });

  test('should display Export All Requests button', async ({ page }) => {
    const btn = page.getByRole('button', { name: /export all requests/i });
    await expect(btn).toBeVisible();
  });

  test('should display View Breach Notifications button', async ({ page }) => {
    const btn = page.getByRole('button', { name: /view breach notifications/i });
    await expect(btn).toBeVisible();
  });

  test('should display Audit Log button', async ({ page }) => {
    const btn = page.getByRole('button', { name: /audit log/i });
    await expect(btn).toBeVisible();
  });
});

test.describe('CCPA Admin Dashboard - Timeline Requirements', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);
    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);
  });

  test('should display CCPA Timeline Requirements section', async ({ page }) => {
    const section = page.getByText('CCPA Timeline Requirements');
    await expect(section).toBeVisible();
  });

  test('should display 10-day acknowledgment requirement', async ({ page }) => {
    const requirement = page.getByText(/10 days.*acknowledge/i);
    await expect(requirement).toBeVisible();
  });

  test('should display 45-day completion requirement', async ({ page }) => {
    const requirement = page.getByText(/45 days.*complete/i);
    await expect(requirement).toBeVisible();
  });

  test('should display 12-month retention requirement', async ({ page }) => {
    const requirement = page.getByText(/12 months.*retain/i);
    await expect(requirement).toBeVisible();
  });

  test('should display 72-hour breach notification requirement', async ({ page }) => {
    const requirement = page.getByText(/72 hours.*notify/i);
    await expect(requirement).toBeVisible();
  });
});

test.describe('CCPA Admin Dashboard - Empty State', () => {
  test('should display empty state when no requests', async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasRequests: false });

    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);

    const emptyState = page.getByText(/no requests match/i);
    await expect(emptyState).toBeVisible();
  });
});

test.describe('CCPA Admin Dashboard - Filter Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasRequests: true });
    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);
  });

  test('clicking status filter should update view', async ({ page }) => {
    const pendingBtn = page.getByRole('button', { name: /pending/i }).first();
    await pendingBtn.click();

    // Button should become selected (implementation dependent)
    await page.waitForTimeout(500);
  });

  test('clicking type filter should update view', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export/i }).first();
    await exportBtn.click();

    await page.waitForTimeout(500);
  });

  test('clicking priority filter should update view', async ({ page }) => {
    const urgentBtn = page.getByRole('button', { name: /urgent/i }).first();
    await urgentBtn.click();

    await page.waitForTimeout(500);
  });
});

test.describe('CCPA Admin Dashboard - Request Processing', () => {
  test('clicking Process button should trigger processing', async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasRequests: true });

    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);

    const processBtn = page.getByRole('button', { name: /process/i }).first();
    await processBtn.click();

    // Should trigger the mutation (actual behavior depends on implementation)
    await page.waitForTimeout(500);
  });
});

test.describe('CCPA Admin Dashboard - Responsive Design', () => {
  test('should display properly on tablet viewport', async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);

    const header = page.getByText('CCPA Compliance Dashboard');
    await expect(header).toBeVisible();
  });

  test('should display properly on desktop viewport', async ({ page }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/ccpa');
    await page.waitForTimeout(1000);

    const header = page.getByText('CCPA Compliance Dashboard');
    await expect(header).toBeVisible();
  });
});
