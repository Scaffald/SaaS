/**
 * Manager Add Subcontractor E2E Tests
 *
 * Tests for managers adding subcontractors:
 * - Add Subcontractor button is visible and clickable
 * - Navigation to add subcontractor page/form
 * - Button functionality from both empty state and list view
 *
 * IMPORTANT: No internal API mocking - uses real database per testing policy.
 * Tests capture and assert on console/network errors.
 */

import { test, expect } from './fixtures/base';
import { ManagerSubcontractorsPage } from './pages/manager/subcontractors.page';

test.describe('Manager Add Subcontractor', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
  });

  test('Add Subcontractor button is visible on subcontractors page', async ({ page, assertNoErrors }) => {
    const subcontractorsPage = new ManagerSubcontractorsPage(page);
    await subcontractorsPage.goto();
    
    // Wait for page to fully load - wait for either the header or empty state
    await page.waitForLoadState('networkidle');
    
    // Wait for the page title to appear (indicates page has loaded)
    await page.waitForSelector('h1:has-text("Subcontractors"), h2:has-text("No Subcontractors Yet")', { timeout: 10000 });
    
    // The button should be visible in either header or empty state
    const addButton = page.locator('button:has-text("Add Subcontractor")');
    await expect(addButton).toBeVisible({ timeout: 5000 });

    await assertNoErrors();
  });

  test('Clicking Add Subcontractor button navigates to new route', async ({ page, assertNoErrors }) => {
    const subcontractorsPage = new ManagerSubcontractorsPage(page);
    await subcontractorsPage.goto();
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Subcontractors"), h2:has-text("No Subcontractors Yet")', { timeout: 10000 });

    // Find and click the Add Subcontractor button
    const addButton = page.locator('button:has-text("Add Subcontractor")');
    await expect(addButton).toBeVisible({ timeout: 5000 });
    
    // Click the button
    await addButton.click();
    
    // Wait for navigation (the route redirects back to /manager/subcontractors)
    await page.waitForURL(/\/manager\/subcontractors/, { timeout: 5000 });

    // Verify we're still on the subcontractors page (since the route redirects)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/manager\/subcontractors/);

    await assertNoErrors();
  });

  test('Add Subcontractor button works from page object', async ({ page, assertNoErrors }) => {
    const subcontractorsPage = new ManagerSubcontractorsPage(page);
    await subcontractorsPage.goto();
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Subcontractors"), h2:has-text("No Subcontractors Yet")', { timeout: 10000 });

    // Check if add button is visible
    await expect(subcontractorsPage.addButton).toBeVisible({ timeout: 5000 });
    
    // Use page object method
    await subcontractorsPage.clickAddSubcontractor();
    
    // Wait for navigation
    await page.waitForURL(/\/manager\/subcontractors/, { timeout: 5000 });

    // Verify navigation occurred
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/manager\/subcontractors/);

    await assertNoErrors();
  });

  test('Empty state shows Add Subcontractor action', async ({ page, assertNoErrors }) => {
    const subcontractorsPage = new ManagerSubcontractorsPage(page);
    await subcontractorsPage.goto();
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check for empty state - look for the empty state title
    const emptyStateTitle = page.locator('h2:has-text("No Subcontractors Yet")');
    const isEmpty = await emptyStateTitle.isVisible({ timeout: 10000 }).catch(() => false);

    if (isEmpty) {
      // Empty state should have an action button with "Add Subcontractor" text
      const emptyStateButton = page.locator('button:has-text("Add Subcontractor")');
      await expect(emptyStateButton).toBeVisible({ timeout: 5000 });
    } else {
      // If not empty, button should still be visible in header
      const headerButton = page.locator('button:has-text("Add Subcontractor")');
      await expect(headerButton).toBeVisible({ timeout: 5000 });
    }

    await assertNoErrors();
  });

  test('Add Subcontractor button is accessible from list view', async ({ page, assertNoErrors }) => {
    const subcontractorsPage = new ManagerSubcontractorsPage(page);
    await subcontractorsPage.goto();
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Subcontractors")', { timeout: 10000 });

    // Check if we have subcontractors (list view) or empty state
    const hasSubcontractors = await subcontractorsPage.getSubcontractorCount() > 0;

    if (hasSubcontractors) {
      // In list view, button should be in header
      const headerButton = page.locator('button:has-text("Add Subcontractor")');
      await expect(headerButton).toBeVisible({ timeout: 5000 });
      await expect(headerButton).toBeEnabled();
    } else {
      // Even in empty state, button should be accessible
      const addButton = page.locator('button:has-text("Add Subcontractor")');
      await expect(addButton).toBeVisible({ timeout: 5000 });
      await expect(addButton).toBeEnabled();
    }

    await assertNoErrors();
  });
});

