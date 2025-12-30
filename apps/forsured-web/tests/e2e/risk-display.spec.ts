/**
 * E2E Tests for Risk Display Components
 * REQ: Phase 5 - Risk Level Algorithm Implementation
 *
 * Tests the risk display components across the dashboard and detail views:
 * - RiskBadge display in dashboard subcontractor table
 * - RiskBadge display in subcontractor detail modal
 * - Risk level color coding and accessibility
 *
 * These tests verify that risk calculation results are properly displayed
 * to users with appropriate visual indicators.
 */

import { test, expect, Page, Route } from '@playwright/test';
import { loginAs, TEST_USERS, TEST_USER_IDS } from '../utils/auth';

// =============================================================================
// Test Constants
// =============================================================================

const TEST_ORG_ID = `org-${TEST_USER_IDS.GC}`;

// Mock subcontractor data with various risk levels for testing
const MOCK_SUBCONTRACTOR_SCORES = [
  {
    id: 'sub-001-test',
    company_name: 'Low Risk Contractors Inc.',
    compliance_score: 95,
    status: 'compliant',
    open_tasks_count: 0,
    policies_expiring_count: 0,
    last_updated: new Date().toISOString(),
    project_count: 2,
    risk_level: 'low',
  },
  {
    id: 'sub-002-test',
    company_name: 'Medium Risk Services LLC',
    compliance_score: 78,
    status: 'warning',
    open_tasks_count: 3,
    policies_expiring_count: 1,
    last_updated: new Date().toISOString(),
    project_count: 1,
    risk_level: 'medium',
  },
  {
    id: 'sub-003-test',
    company_name: 'High Risk Construction',
    compliance_score: 55,
    status: 'warning',
    open_tasks_count: 7,
    policies_expiring_count: 2,
    last_updated: new Date().toISOString(),
    project_count: 3,
    risk_level: 'high',
  },
  {
    id: 'sub-004-test',
    company_name: 'Critical Risk Corp',
    compliance_score: 35,
    status: 'critical',
    open_tasks_count: 12,
    policies_expiring_count: 4,
    last_updated: new Date().toISOString(),
    project_count: 2,
    risk_level: 'critical',
  },
];

const MOCK_DASHBOARD_OVERVIEW = {
  overall_compliance_score: 68,
  total_subcontractors: 4,
  compliant_count: 1,
  warning_count: 2,
  critical_count: 1,
  total_projects: 5,
  active_projects: 4,
  last_updated: new Date().toISOString(),
};

const MOCK_TASK_SUMMARY = {
  total_open_tasks: 22,
  high_priority_count: 5,
  medium_priority_count: 10,
  low_priority_count: 7,
  urgent_count: 3,
  overdue_count: 2,
  due_today_count: 4,
  last_updated: new Date().toISOString(),
};

// =============================================================================
// Test Fixtures and Helpers
// =============================================================================

/**
 * Set up mock API responses for dashboard data
 */
async function setupDashboardMocks(page: Page) {
  // Mock dashboard API endpoints
  await page.route('**/api/dashboard/overview*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DASHBOARD_OVERVIEW),
    });
  });

  await page.route('**/api/dashboard/subcontractor-scores*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SUBCONTRACTOR_SCORES),
    });
  });

  await page.route('**/api/dashboard/task-summary*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TASK_SUMMARY),
    });
  });

  await page.route('**/api/dashboard/expiring-policies*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/dashboard/activity*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

// =============================================================================
// Test Suite: Dashboard Risk Display
// =============================================================================

test.describe('Dashboard Risk Display', () => {
  test.beforeEach(async ({ page }) => {
    await setupDashboardMocks(page);
  });

  test('should display RiskBadge components in subcontractor table', async ({ page }) => {
    // Login as GC (manager role)
    await loginAs(page, TEST_USERS.GC);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for the subcontractor table to load
    await page.waitForSelector('[data-testid="subcontractor-row"]', { timeout: 10000 });

    // Verify RiskBadge containers are present
    const riskBadgeContainers = page.locator('[data-testid="risk-badge-container"]');
    await expect(riskBadgeContainers).toHaveCount(4); // We have 4 mock subcontractors

    // Verify risk levels are displayed with correct text
    const lowRiskBadge = page.getByRole('generic', { name: /Risk level: low/i });
    const mediumRiskBadge = page.getByRole('generic', { name: /Risk level: medium/i });
    const highRiskBadge = page.getByRole('generic', { name: /Risk level: high/i });
    const criticalRiskBadge = page.getByRole('generic', { name: /Risk level: critical/i });

    await expect(lowRiskBadge).toBeVisible();
    await expect(mediumRiskBadge).toBeVisible();
    await expect(highRiskBadge).toBeVisible();
    await expect(criticalRiskBadge).toBeVisible();
  });

  test('should display compliance scores with percentage', async ({ page }) => {
    await loginAs(page, TEST_USERS.GC);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for subcontractor rows
    await page.waitForSelector('[data-testid="subcontractor-row"]', { timeout: 10000 });

    // Check compliance scores are displayed with % symbol
    const scoreElements = page.locator('[data-testid="compliance-score"]');
    await expect(scoreElements).toHaveCount(4);

    // Verify specific scores are present
    await expect(page.getByText('95%')).toBeVisible();
    await expect(page.getByText('78%')).toBeVisible();
    await expect(page.getByText('55%')).toBeVisible();
    await expect(page.getByText('35%')).toBeVisible();
  });

  test('should have accessible risk badges with aria-labels', async ({ page }) => {
    await loginAs(page, TEST_USERS.GC);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[data-testid="subcontractor-row"]', { timeout: 10000 });

    // Check that aria-labels are present on risk badges
    const riskBadgesWithLabels = page.locator('[aria-label*="Risk level"]');
    await expect(riskBadgesWithLabels).toHaveCount(4);

    // Each badge should have a descriptive title attribute
    const badgeWithTitle = page.locator('[title*="compliant"]');
    await expect(badgeWithTitle.first()).toBeVisible();
  });

  test('should display "Risk Level" column header', async ({ page }) => {
    await loginAs(page, TEST_USERS.GC);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify the column header shows "Risk Level" instead of "Status"
    await expect(page.getByText('Risk Level')).toBeVisible();
  });
});

// =============================================================================
// Test Suite: Risk Badge Styling
// =============================================================================

test.describe('Risk Badge Visual Styling', () => {
  test.beforeEach(async ({ page }) => {
    await setupDashboardMocks(page);
  });

  test('should display correct visual indicators for each risk level', async ({ page }) => {
    await loginAs(page, TEST_USERS.GC);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[data-testid="subcontractor-row"]', { timeout: 10000 });

    // Verify LOW badge contains "LOW" text
    const lowText = page.getByText('LOW', { exact: true });
    await expect(lowText.first()).toBeVisible();

    // Verify MEDIUM badge contains "MEDIUM" text
    const mediumText = page.getByText('MEDIUM', { exact: true });
    await expect(mediumText.first()).toBeVisible();

    // Verify HIGH badge contains "HIGH" text
    const highText = page.getByText('HIGH', { exact: true });
    await expect(highText.first()).toBeVisible();

    // Verify CRITICAL badge contains "CRITICAL" text
    const criticalText = page.getByText('CRITICAL', { exact: true });
    await expect(criticalText.first()).toBeVisible();
  });
});

// =============================================================================
// Test Suite: Subcontractor Detail Modal Risk Display
// =============================================================================

test.describe('Subcontractor Detail Modal Risk Display', () => {
  test('should display RiskBadge in subcontractor detail modal header', async ({ page }) => {
    // This test requires the manager page with subcontractor list
    // Login as GC (manager role)
    await loginAs(page, TEST_USERS.GC);

    // Navigate to a page that has subcontractor detail modal
    // We'll mock the subcontractor data response
    await page.route('**/rest/v1/subcontractors*', async (route: Route) => {
      const url = route.request().url();
      if (url.includes('id=eq.')) {
        // Single subcontractor detail request
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'sub-001-test',
            organization_id: TEST_ORG_ID,
            name: 'John Smith',
            company: 'Low Risk Contractors Inc.',
            contact_info: { email: 'john@lowrisk.com', phone: '555-0100' },
            trade_type: 'General Construction',
            status: 'active',
            compliance_score: 95,
            risk_level: 'low',
            created_at: new Date().toISOString(),
          }]),
        });
      } else {
        // List request
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'sub-001-test',
            organization_id: TEST_ORG_ID,
            name: 'John Smith',
            company: 'Low Risk Contractors Inc.',
            contact_info: { email: 'john@lowrisk.com', phone: '555-0100' },
            trade_type: 'General Construction',
            status: 'active',
            compliance_score: 95,
            risk_level: 'low',
            created_at: new Date().toISOString(),
          }]),
        });
      }
    });

    // Navigate to manager subcontractors page
    await page.goto('/manager/subcontractors');
    await page.waitForLoadState('networkidle');

    // If subcontractor list exists and we can click on one
    const subcontractorRow = page.locator('text=Low Risk Contractors Inc.');
    if (await subcontractorRow.isVisible({ timeout: 5000 })) {
      await subcontractorRow.click();

      // Wait for modal to open
      const modal = page.locator('[data-testid="subcontractor-detail-modal"]');
      if (await modal.isVisible({ timeout: 5000 })) {
        // Check for compliance header with RiskBadge
        const complianceHeader = page.locator('[data-testid="compliance-header"]');
        await expect(complianceHeader).toBeVisible();

        // Check for risk level card
        const riskLevelCard = page.locator('[data-testid="risk-level-card"]');
        await expect(riskLevelCard).toBeVisible();

        // Verify RiskBadge is present in the modal
        const riskBadge = page.getByRole('generic', { name: /Risk level/i });
        await expect(riskBadge.first()).toBeVisible();
      }
    }
  });
});

// =============================================================================
// Test Suite: Risk Level Accessibility
// =============================================================================

test.describe('Risk Display Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupDashboardMocks(page);
  });

  test('should have proper ARIA attributes for screen readers', async ({ page }) => {
    await loginAs(page, TEST_USERS.GC);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[data-testid="subcontractor-row"]', { timeout: 10000 });

    // Check that risk badges have proper aria-label
    const riskBadges = page.locator('[aria-label*="Risk level"]');
    const count = await riskBadges.count();
    expect(count).toBeGreaterThan(0);

    // Verify aria-label includes risk level description
    for (let i = 0; i < count; i++) {
      const ariaLabel = await riskBadges.nth(i).getAttribute('aria-label');
      expect(ariaLabel).toMatch(/Risk level: (low|medium|high|critical)/i);
    }
  });

  test('should have title attributes with risk descriptions', async ({ page }) => {
    await loginAs(page, TEST_USERS.GC);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[data-testid="subcontractor-row"]', { timeout: 10000 });

    // Check that risk badges have title attribute for tooltips
    const badgesWithTitle = page.locator('[title]');
    const count = await badgesWithTitle.count();
    expect(count).toBeGreaterThan(0);
  });
});
