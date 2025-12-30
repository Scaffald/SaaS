// tests/e2e/gc-flow.spec.ts
import { test, expect } from './fixtures/base';

test.describe('GC User Flow', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
  });

  test('GC can view dashboard', async ({ page, assertNoErrors }) => {
    await page.goto('/manager/dashboard');
    // Dashboard should load with either projects or empty state
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await assertNoErrors();
  });

  test('GC can access projects page', async ({ page, assertNoErrors }) => {
    await page.goto('/manager/projects');
    await expect(page).toHaveURL(/\/manager\/projects/);
    await assertNoErrors();
  });

  test('GC can access subcontractors page', async ({ page, assertNoErrors }) => {
    await page.goto('/manager/subcontractors');
    await expect(page).toHaveURL(/\/manager\/subcontractors/);
    await assertNoErrors();
  });
});

test.describe('GC Page Structure', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
  });

  test('Dashboard shows project management UI or empty state', async ({ page, assertNoErrors }) => {
    await page.goto('/manager/dashboard');
    // Dashboard should display with proper structure
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    // Either projects are shown or empty state with create CTA
    const hasContent = await page.locator('text=/subcontractor|project|compliance/i').count();
    expect(hasContent).toBeGreaterThan(0);
    await assertNoErrors();
  });

  test('Projects page shows project list or empty state', async ({ page, assertNoErrors }) => {
    await page.goto('/manager/projects');
    // Projects page loads - check for main h1 heading
    await expect(page.locator('h1').first()).toBeVisible();
    await assertNoErrors();
  });
});
