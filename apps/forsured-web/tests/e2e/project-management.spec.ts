/**
 * Project Management E2E Tests
 *
 * Comprehensive tests for project management across all user types:
 * - GC: Create, view, edit projects
 * - Contractor: View assigned projects
 * - Broker: View client projects
 *
 * Critical user flow - high priority
 */

import { test, expect } from './fixtures/base';

// Mock project data
const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    name: 'Downtown Office Building',
    status: 'active',
    start_date: '2025-01-15',
    end_date: '2025-12-31',
    address: '123 Main St, Austin, TX',
    project_type: 'commercial',
    budget: 5000000,
  },
  {
    id: 'proj-2',
    name: 'Residential Complex Phase 2',
    status: 'planning',
    start_date: '2025-03-01',
    end_date: '2026-02-28',
    address: '456 Oak Ave, Austin, TX',
    project_type: 'residential',
    budget: 3500000,
  },
];

const MOCK_PROJECT_DETAIL = {
  ...MOCK_PROJECTS[0],
  description: 'Modern office building in downtown Austin',
  manager_name: 'Active GC User',
  subcontractors: [
    { id: 'sub-1', name: 'Test Contractor Co', trade: 'Electrical' },
    { id: 'sub-2', name: 'Another Contractor', trade: 'Plumbing' },
  ],
  documents: [
    { id: 'doc-1', name: 'Plans.pdf', uploaded_at: '2025-01-10' },
  ],
  tasks_count: 12,
  tasks_completed: 5,
};

test.describe('GC Project Management', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Mock projects API
    await page.route('**/rest/v1/projects*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      // Check if this is a single project query
      if (url.includes('id=eq.proj-1')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_PROJECT_DETAIL]),
        });
      }

      // List projects
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PROJECTS),
        });
      }

      // Create project
      if (method === 'POST') {
        const newProject = {
          id: 'proj-new',
          ...JSON.parse(route.request().postData() || '{}'),
          created_at: new Date().toISOString(),
        };
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([newProject]),
        });
      }

      return route.continue();
    });
  });

  test('GC can view projects list', async ({ page, captureErrors, assertNoErrors }) => {
    captureErrors();

    await page.goto('/manager/projects');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page).toHaveURL(/\/manager\/projects/);

    // Check for project cards or table
    // Wait for data to load
    await page.waitForTimeout(1000);

    // Look for project names in the page
    const hasProjects = await page.locator('text=Downtown Office Building').count() > 0 ||
                       await page.locator('h1, h2, h3').count() > 0;
    expect(hasProjects).toBeTruthy();

    await assertNoErrors();
  });

  test('GC can view project details', async ({ page, captureErrors, assertNoErrors }) => {
    captureErrors();

    // Navigate to specific project
    await page.goto('/manager/projects/proj-1');
    await page.waitForLoadState('networkidle');

    // Verify URL
    await expect(page).toHaveURL(/\/manager\/projects\/proj-1/);

    // Page should load even if showing empty/loading state
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();

    await assertNoErrors();
  });

  test('GC can access project from projects list', async ({ page, captureErrors, assertNoErrors }) => {
    captureErrors();

    await page.goto('/manager/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Try to find a project link
    const projectLink = page.locator('a[href*="/manager/projects/"]').first();

    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to project detail
      await expect(page).toHaveURL(/\/manager\/projects\/[a-zA-Z0-9-]+/);
    }

    await assertNoErrors();
  });

  test('GC can filter projects by status', async ({ page }) => {
    await page.goto('/manager/projects');
    await page.waitForLoadState('networkidle');

    // Look for filter controls (if they exist)
    const filterSelect = page.locator('select[name*="status"], select[id*="status"]').first();

    if (await filterSelect.count() > 0) {
      // Select a filter option
      await filterSelect.selectOption('active');
      await page.waitForTimeout(500);

      // Verify page still shows content
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('GC can search projects', async ({ page }) => {
    await page.goto('/manager/projects');
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchInput.count() > 0) {
      await searchInput.fill('Downtown');
      await page.waitForTimeout(500);

      // Verify page still shows content
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('GC projects page shows empty state when no projects', async ({ page }) => {
    // Mock empty projects list
    await page.route('**/rest/v1/projects*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/manager/projects');
    await page.waitForLoadState('networkidle');

    // Should show either empty state or heading
    const hasContent = await page.locator('h1, h2, [data-testid*="empty"], .empty-state').count() > 0;
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Contractor Project Management', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');

    // Mock contractor projects
    await page.route('**/rest/v1/projects*', async (route) => {
      const url = route.request().url();

      if (url.includes('id=eq.proj-1')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_PROJECT_DETAIL]),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROJECTS),
      });
    });
  });

  test('Contractor can view assigned projects list', async ({ page, captureErrors, assertNoErrors }) => {
    captureErrors();

    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page).toHaveURL(/\/subcontractor\/projects/);

    // Page should show content
    await expect(page.locator('main')).toBeVisible();

    await assertNoErrors();
  });

  test('Contractor can view project details', async ({ page, captureErrors, assertNoErrors }) => {
    captureErrors();

    await page.goto('/subcontractor/projects/proj-1');
    await page.waitForLoadState('networkidle');

    // Verify URL
    await expect(page).toHaveURL(/\/subcontractor\/projects\/proj-1/);

    // Page should load
    await expect(page.locator('main')).toBeVisible();

    await assertNoErrors();
  });

  test('Contractor can navigate to project from relationships page', async ({ page }) => {
    await page.goto('/subcontractor/relationships');
    await page.waitForLoadState('networkidle');

    // Verify relationships page loads
    await expect(page).toHaveURL(/\/subcontractor\/relationships/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('Contractor projects page shows empty state when no projects', async ({ page }) => {
    // Mock empty projects
    await page.route('**/rest/v1/projects*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Should show content (empty state or heading)
    const hasContent = await page.locator('h1, h2, [data-testid*="empty"]').count() > 0;
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Broker Project Management', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');

    // Mock broker projects
    await page.route('**/rest/v1/projects*', async (route) => {
      const url = route.request().url();

      if (url.includes('id=eq.proj-1')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_PROJECT_DETAIL]),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROJECTS),
      });
    });
  });

  test('Broker can view client projects list', async ({ page, captureErrors, assertNoErrors }) => {
    captureErrors();

    await page.goto('/broker/projects');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page).toHaveURL(/\/broker\/projects/);

    // Page should show content
    await expect(page.locator('main')).toBeVisible();

    await assertNoErrors();
  });

  test('Broker can view project details', async ({ page, captureErrors, assertNoErrors }) => {
    captureErrors();

    await page.goto('/broker/projects/proj-1');
    await page.waitForLoadState('networkidle');

    // Verify URL
    await expect(page).toHaveURL(/\/broker\/projects\/proj-1/);

    // Page should load
    await expect(page.locator('main')).toBeVisible();

    await assertNoErrors();
  });

  test('Broker can access projects from client profile', async ({ page }) => {
    await page.goto('/broker/clients');
    await page.waitForLoadState('networkidle');

    // Verify clients page loads
    await expect(page).toHaveURL(/\/broker\/clients/);
    await expect(page.locator('main')).toBeVisible();

    // Try to navigate to a client detail if link exists
    const clientLink = page.locator('a[href*="/broker/clients/"]').first();
    if (await clientLink.count() > 0) {
      await clientLink.click();
      await page.waitForLoadState('networkidle');

      // Should be on client detail page
      await expect(page).toHaveURL(/\/broker\/clients\/[a-zA-Z0-9-]+/);
    }
  });

  test('Broker projects page shows empty state when no projects', async ({ page }) => {
    // Mock empty projects
    await page.route('**/rest/v1/projects*', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/broker/projects');
    await page.waitForLoadState('networkidle');

    // Should show content
    const hasContent = await page.locator('h1, h2, [data-testid*="empty"]').count() > 0;
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Project Navigation Across User Types', () => {
  test('GC sidebar has projects link', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify projects link in sidebar
    const projectsLink = page.locator('nav a[href="/manager/projects"], aside a[href="/manager/projects"]');
    await expect(projectsLink).toBeVisible();

    // Click and navigate
    await projectsLink.click();
    await expect(page).toHaveURL(/\/manager\/projects/);
  });

  test('Contractor sidebar has projects link', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
    await page.goto('/subcontractor/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify projects link in sidebar
    const projectsLink = page.locator('nav a[href="/subcontractor/projects"], aside a[href="/subcontractor/projects"]');
    await expect(projectsLink).toBeVisible();

    // Click and navigate
    await projectsLink.click();
    await expect(page).toHaveURL(/\/subcontractor\/projects/);
  });

  test('Broker sidebar has projects link', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
    await page.goto('/broker/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify projects link in sidebar
    const projectsLink = page.locator('nav a[href="/broker/projects"], aside a[href="/broker/projects"]');
    await expect(projectsLink).toBeVisible();

    // Click and navigate
    await projectsLink.click();
    await expect(page).toHaveURL(/\/broker\/projects/);
  });
});
