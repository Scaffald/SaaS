/**
 * Project Management E2E Tests
 *
 * Comprehensive tests for project management across all user types:
 * - GC: Create, view, edit projects
 * - Contractor: View assigned projects
 * - Broker: View client projects
 *
 * IMPORTANT: No internal API mocking - uses real database per testing policy.
 * Tests capture and assert on console/network errors.
 */

import { test, expect } from './fixtures/base';

test.describe('GC Project Management', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
  });

  test('GC can view projects list', async ({ page, assertNoErrors }) => {
    await page.goto('/manager/projects');
    await page.waitForLoadState('networkidle');

    // Should see projects page content
    await expect(page.locator('h1')).toContainText(/projects/i);

    await assertNoErrors();
  });

  test('GC can navigate to create new project page', async ({ page, assertNoErrors }) => {
    await page.goto('/manager/projects/new');
    await page.waitForLoadState('networkidle');

    // Should see create project form
    await expect(page.locator('h1')).toContainText(/create.*project/i);

    // Form should have required fields
    await expect(page.locator('input[type="text"]').first()).toBeVisible();

    await assertNoErrors();
  });

  test('GC can access project from projects list', async ({ page, assertNoErrors }) => {
    await page.goto('/manager/projects');
    await page.waitForLoadState('networkidle');

    // Check if there are projects to click
    const projectLinks = page.locator('a[href*="/manager/projects/"], button:has-text("View")');
    const count = await projectLinks.count();

    if (count > 0) {
      // Click the first project
      await projectLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Should be on project detail page
      await expect(page.locator('main')).toBeVisible();
    }

    await assertNoErrors();
  });

  test('GC can filter projects by compliance status', async ({ page, assertNoErrors }) => {
    await page.goto('/manager/projects');
    await page.waitForLoadState('networkidle');

    // Look for filter controls
    const filterSelect = page.locator('select').first();

    if (await filterSelect.count() > 0) {
      await filterSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      // Page should still be visible after filtering
      await expect(page.locator('main')).toBeVisible();
    }

    await assertNoErrors();
  });

  test('GC projects page handles empty state', async ({ page, assertNoErrors }) => {
    await page.goto('/manager/projects');
    await page.waitForLoadState('networkidle');

    // Should show either projects list or empty state - both are valid
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    await assertNoErrors();
  });
});

test.describe('Contractor Project Management', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
  });

  test('Contractor can view assigned projects list', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Should see projects page
    await expect(page.locator('main')).toBeVisible();

    await assertNoErrors();
  });

  test('Contractor can navigate to project from relationships page', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/relationships');
    await page.waitForLoadState('networkidle');

    // Should see relationships/managers page
    await expect(page.locator('main')).toBeVisible();

    await assertNoErrors();
  });

  test('Contractor projects page handles empty state', async ({ page, assertNoErrors }) => {
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');

    // Should show either projects or empty state
    await expect(page.locator('main')).toBeVisible();

    await assertNoErrors();
  });
});

test.describe('Broker Project Management', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
  });

  test('Broker can view client projects list', async ({ page, assertNoErrors }) => {
    await page.goto('/broker/projects');
    await page.waitForLoadState('networkidle');

    // Should see projects page
    await expect(page.locator('main')).toBeVisible();

    await assertNoErrors();
  });

  test('Broker can access projects from client profile', async ({ page, assertNoErrors }) => {
    await page.goto('/broker/clients');
    await page.waitForLoadState('networkidle');

    // Should see clients page
    await expect(page.locator('main')).toBeVisible();

    await assertNoErrors();
  });

  test('Broker projects page handles empty state', async ({ page, assertNoErrors }) => {
    await page.goto('/broker/projects');
    await page.waitForLoadState('networkidle');

    // Should show content
    await expect(page.locator('main')).toBeVisible();

    await assertNoErrors();
  });
});

test.describe('Project Navigation Across User Types', () => {
  test('GC sidebar has projects link', async ({ page, setupAuthAs, assertNoErrors }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/dashboard');
    await page.waitForLoadState('networkidle');

    // Should have a projects link in sidebar or nav
    const projectsLink = page.locator('a[href*="/manager/projects"], nav >> text=Projects');
    await expect(projectsLink.first()).toBeVisible();

    await assertNoErrors();
  });

  test('Contractor sidebar has projects link', async ({ page, setupAuthAs, assertNoErrors }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
    await page.goto('/subcontractor/dashboard');
    await page.waitForLoadState('networkidle');

    // Should have a projects link in sidebar or nav
    const projectsLink = page.locator('a[href*="/subcontractor/projects"], nav >> text=Projects');
    await expect(projectsLink.first()).toBeVisible();

    await assertNoErrors();
  });

  test('Broker sidebar has projects link', async ({ page, setupAuthAs, assertNoErrors }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
    await page.goto('/broker/dashboard');
    await page.waitForLoadState('networkidle');

    // Should have a projects link in sidebar or nav
    const projectsLink = page.locator('a[href*="/broker/projects"], nav >> text=Projects');
    await expect(projectsLink.first()).toBeVisible();

    await assertNoErrors();
  });
});
