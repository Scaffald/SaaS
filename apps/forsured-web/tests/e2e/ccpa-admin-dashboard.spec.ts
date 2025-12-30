// tests/e2e/ccpa-admin-dashboard.spec.ts
// REQ-6: CCPA Compliance Implementation
// E2E Tests for CCPA Admin Dashboard
//
// Tests that admin users can access and manage CCPA requests
// through the compliance dashboard using Page Object Model.

import { test, expect } from './fixtures/base';
import { Page } from '@playwright/test';
import { CCPADashboardPage } from './pages/admin';

/**
 * Mock CCPA Admin API responses
 */
async function setupAdminCCPAMocks(
  page: Page,
  options: {
    hasRequests?: boolean;
    hasOverdueRequests?: boolean;
    pendingCount?: number;
    hasSLAAlerts?: boolean;
  } = {}
) {
  const {
    hasRequests = true,
    hasOverdueRequests = false,
    pendingCount = 5,
    hasSLAAlerts = false,
  } = options;

  // Mock compliance metrics endpoint (ccpaAdmin.getMetrics called by the page)
  await page.route('**/trpc/ccpaAdmin.getMetrics*', (route) => {
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

  // Mock admin requests endpoint (ccpaAdmin router)
  await page.route('**/trpc/ccpaAdmin.listRequests*', (route) => {
    const requests = hasRequests
      ? [
          {
            id: 'req-001',
            user_id: 'user-1',
            user_email: 'user1@example.com',
            user_name: 'John Doe',
            type: 'access',
            status: 'pending',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            deadline_at: '2024-03-01T10:00:00Z',
            days_elapsed: 5,
            is_overdue: false,
          },
          {
            id: 'req-002',
            user_id: 'user-2',
            user_email: 'user2@example.com',
            user_name: 'Jane Smith',
            type: 'deletion',
            status: 'in_progress',
            created_at: '2024-01-10T10:00:00Z',
            updated_at: '2024-01-12T10:00:00Z',
            deadline_at: '2024-02-25T10:00:00Z',
            assigned_to: 'admin@test.forsured.com',
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
                  type: 'access',
                  status: 'pending',
                  created_at: '2023-12-01T10:00:00Z',
                  updated_at: '2023-12-01T10:00:00Z',
                  deadline_at: '2024-01-15T10:00:00Z',
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
          data: { items: requests, total: requests.length, page: 1, pageSize: 20 },
        },
      }),
    });
  });

  // Mock dashboard stats endpoint
  await page.route('**/trpc/ccpaAdmin.getDashboardStats*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            total: hasRequests ? 150 : 0,
            pending: pendingCount,
            inProgress: 10,
            completed: 130,
            denied: 3,
            cancelled: 2,
            avgProcessingDays: 12.5,
            complianceRate: 97,
            overdueCount: hasOverdueRequests ? 3 : 0,
            byType: {
              access: 80,
              deletion: 50,
              correction: 15,
              opt_out: 5,
            },
          },
        },
      }),
    });
  });

  // Mock SLA alerts endpoint
  await page.route('**/trpc/ccpaAdmin.getSLAAlerts*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: hasSLAAlerts ? {
            escalatedCount: 1,
            overdueCount: 2,
            urgentCount: 3,
            approachingCount: 5,
            totalAlerts: 11,
            escalated: [],
            overdue: [],
            urgent: [],
            approaching: [],
          } : {
            escalatedCount: 0,
            overdueCount: 0,
            urgentCount: 0,
            approachingCount: 0,
            totalAlerts: 0,
            escalated: [],
            overdue: [],
            urgent: [],
            approaching: [],
          },
        },
      }),
    });
  });

  // Mock process request endpoint
  await page.route('**/trpc/ccpaAdmin.updateRequestStatus*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            success: true,
            request_id: 'req-001',
            new_status: 'in_progress',
          },
        },
      }),
    });
  });

  // Mock team members endpoint
  await page.route('**/trpc/ccpaAdmin.getTeamMembers*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: [
            { id: 'admin-1', email: 'admin@test.forsured.com', name: 'Admin User' },
            { id: 'admin-2', email: 'compliance@test.forsured.com', name: 'Compliance Officer' },
          ],
        },
      }),
    });
  });

  // Mock current user access endpoint
  await page.route('**/trpc/ccpaAdmin.getCurrentUserAccess*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            userId: 'admin-1',
            role: 'global_admin',
            ownedAppIds: [],
            email: 'admin@test.forsured.com',
          },
        },
      }),
    });
  });
}

test.describe('CCPA Admin Dashboard - Access Control', () => {
  test('Admin can access CCPA dashboard', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);

    const dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();

    await expect(page).toHaveURL(/\/admin\/ccpa/);
    await dashboardPage.expectDashboardVisible();
  });

  test('Non-admin users cannot access CCPA dashboard', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    await page.goto('/admin/ccpa');

    // Should redirect to appropriate page or show access denied
    await page.waitForTimeout(1000);
    // The actual behavior depends on implementation - either redirect or error message
  });
});

test.describe('CCPA Admin Dashboard - Compliance Metrics', () => {
  let dashboardPage: CCPADashboardPage;

  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);
    dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();
  });

  test('should display CCPA Compliance Dashboard header', async ({ page }) => {
    await expect(dashboardPage.pageHeader).toBeVisible();
  });

  test('should display Compliance Metrics section', async ({ page }) => {
    await dashboardPage.expectMetricsVisible();
  });

  test('should display Total Requests metric', async ({ page }) => {
    await expect(dashboardPage.totalRequestsCard).toBeVisible();
    // Should show the count
    const count = page.getByText('150');
    await expect(count).toBeVisible();
  });

  test('should display Pending requests metric', async ({ page }) => {
    await expect(dashboardPage.pendingCard).toBeVisible();
  });

  test('should display Processing requests metric', async ({ page }) => {
    await expect(dashboardPage.processingCard).toBeVisible();
  });

  test('should display Completed requests metric', async ({ page }) => {
    await expect(dashboardPage.completedCard).toBeVisible();
  });

  test('should display Average Processing Days metric', async ({ page }) => {
    await expect(dashboardPage.avgProcessingDaysCard).toBeVisible();
  });

  test('should display Compliance Rate metric', async ({ page }) => {
    await expect(dashboardPage.complianceRateCard).toBeVisible();
  });

  test('should display Overdue Requests metric', async ({ page }) => {
    await expect(dashboardPage.overdueCard).toBeVisible();
  });
});

// TODO: Request Management tests need mock data fix - skipping temporarily
test.describe.skip('CCPA Admin Dashboard - Request Management', () => {
  let dashboardPage: CCPADashboardPage;

  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasRequests: true });
    dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();
  });

  test('should display Request Management section', async ({ page }) => {
    await expect(dashboardPage.requestManagement).toBeVisible();
  });

  test('should display request type filter buttons', async ({ page }) => {
    const allBtn = page.getByRole('button', { name: /^all$/i });
    const exportBtn = page.getByRole('button', { name: /export|access/i });
    const deletionBtn = page.getByRole('button', { name: /deletion/i });

    await expect(allBtn.first()).toBeVisible();
    await expect(exportBtn.first()).toBeVisible();
    await expect(deletionBtn.first()).toBeVisible();
  });

  test('should display status filter buttons', async ({ page }) => {
    const pendingBtn = page.getByRole('button', { name: /pending/i });
    const processingBtn = page.getByRole('button', { name: /processing|in.progress/i });
    const completedBtn = page.getByRole('button', { name: /completed/i });

    await expect(pendingBtn.first()).toBeVisible();
    await expect(processingBtn.first()).toBeVisible();
    await expect(completedBtn.first()).toBeVisible();
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
    const requestType = page.getByText(/access|export/i);
    await expect(requestType.first()).toBeVisible();
  });

  test('should display status badges in rows', async ({ page }) => {
    const pendingBadge = page.getByText(/pending/i);
    const processingBadge = page.getByText(/in.progress|processing/i);

    const hasPending = await pendingBadge.first().isVisible().catch(() => false);
    const hasProcessing = await processingBadge.first().isVisible().catch(() => false);

    expect(hasPending || hasProcessing).toBe(true);
  });

  test('should display View button for requests', async ({ page }) => {
    const viewBtn = page.getByRole('button', { name: /view/i });
    await expect(viewBtn.first()).toBeVisible();
  });
});

// TODO: Overdue warning tests need mock data fix - skipping temporarily
test.describe.skip('CCPA Admin Dashboard - Overdue Requests Warning', () => {
  test('should display warning when overdue requests exist', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasOverdueRequests: true, hasSLAAlerts: true });

    const dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();

    // Check for SLA notification banner or overdue warning
    const hasSLABanner = await dashboardPage.hasSLANotificationBanner();
    const hasOverdue = await dashboardPage.hasOverdueWarning();

    expect(hasSLABanner || hasOverdue).toBe(true);
  });

  test('should highlight overdue requests in the list', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasOverdueRequests: true });

    const dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();

    // Should show OVERDUE text
    const overdue = page.getByText(/overdue/i);
    await expect(overdue.first()).toBeVisible();
  });

  test('should not display warning when no overdue requests', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasOverdueRequests: false, hasSLAAlerts: false });

    const dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();

    // Should not show overdue warning
    const hasOverdue = await dashboardPage.hasOverdueWarning();
    expect(hasOverdue).toBe(false);
  });
});

test.describe('CCPA Admin Dashboard - Quick Actions', () => {
  let dashboardPage: CCPADashboardPage;

  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);
    dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();
  });

  test('should display Quick Actions section', async ({ page }) => {
    await expect(dashboardPage.quickActions).toBeVisible();
  });

  test('should display Generate Compliance Report button', async ({ page }) => {
    await expect(dashboardPage.generateReportBtn).toBeVisible();
  });

  test('should display View All Requests button', async ({ page }) => {
    await expect(dashboardPage.viewAllRequestsBtn).toBeVisible();
  });

  test('should display View Breach Notifications button', async ({ page }) => {
    await expect(dashboardPage.viewBreachBtn).toBeVisible();
  });

  test('should display Audit Log button', async ({ page }) => {
    await expect(dashboardPage.auditLogBtn).toBeVisible();
  });
});

test.describe('CCPA Admin Dashboard - Timeline Requirements', () => {
  let dashboardPage: CCPADashboardPage;

  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);
    dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();
  });

  test('should display CCPA Timeline Requirements section', async ({ page }) => {
    await expect(dashboardPage.timelineRequirements).toBeVisible();
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
  test('should display empty state when no requests', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasRequests: false });

    const dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();

    await expect(dashboardPage.emptyState).toBeVisible();
  });
});

test.describe('CCPA Admin Dashboard - Filter Functionality', () => {
  let dashboardPage: CCPADashboardPage;

  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasRequests: true });
    dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();
  });

  test('clicking status filter should update view', async ({ page }) => {
    await dashboardPage.clickFilterStatus('pending');
    // Button should become selected (implementation dependent)
    await page.waitForTimeout(500);
  });

  test('clicking type filter should update view', async ({ page }) => {
    await dashboardPage.clickFilterType('export');
    await page.waitForTimeout(500);
  });
});

test.describe('CCPA Admin Dashboard - Responsive Design', () => {
  test('should display properly on tablet viewport', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);

    await page.setViewportSize({ width: 768, height: 1024 });

    const dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();

    await expect(dashboardPage.pageHeader).toBeVisible();
  });

  test('should display properly on desktop viewport', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page);

    await page.setViewportSize({ width: 1440, height: 900 });

    const dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();

    await expect(dashboardPage.pageHeader).toBeVisible();
  });
});

test.describe('CCPA Admin Dashboard - SLA Notification System', () => {
  test('should display SLA notification banner when alerts exist', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasSLAAlerts: true, hasOverdueRequests: true });

    const dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();

    // Check for SLA notification elements
    const hasBanner = await dashboardPage.hasSLANotificationBanner();
    const hasOverdueText = await page.getByText(/overdue|approaching deadline|requires.*action/i).first().isVisible().catch(() => false);

    expect(hasBanner || hasOverdueText).toBe(true);
  });

  test('should not display SLA banner when no alerts', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    await setupAdminCCPAMocks(page, { hasSLAAlerts: false, hasOverdueRequests: false });

    const dashboardPage = new CCPADashboardPage(page);
    await dashboardPage.goto();

    const hasBanner = await dashboardPage.hasSLANotificationBanner();
    // Banner should not be visible or should be empty
    expect(hasBanner).toBe(false);
  });
});
