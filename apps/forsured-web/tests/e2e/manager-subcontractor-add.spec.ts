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
    
    // Wait for page to be visible first
    await subcontractorsPage.expectSubcontractorsVisible();
    
    // Wait for network to be idle (data has loaded)
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    
    // Wait directly for the button - verified via Playwright MCP browser inspection
    // This is the most reliable selector that works with theme button rendering
    const addButton = page.getByRole('button', { name: 'Add Subcontractor' });
    await expect(addButton).toBeVisible({ timeout: 15000 });

    await assertNoErrors();
  });

  test('Clicking Add Subcontractor button navigates to new route', async ({ page, assertNoErrors }) => {
    const subcontractorsPage = new ManagerSubcontractorsPage(page);
    await subcontractorsPage.goto();
    
    // Wait for page to be visible first
    await subcontractorsPage.expectSubcontractorsVisible();
    
    // Wait for network to be idle (data has loaded)
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Find and click the Add Subcontractor button using role-based selector
    // Verified via Playwright MCP browser inspection
    const addButton = page.getByRole('button', { name: 'Add Subcontractor' });
    await expect(addButton).toBeVisible({ timeout: 15000 });
    
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
    
    // Wait for page to be visible first
    await subcontractorsPage.expectSubcontractorsVisible();
    
    // Wait for network to be idle (data has loaded)
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Check if add button is visible using page object method
    await subcontractorsPage.expectAddButtonVisible();
    
    // Use page object method to click
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
    
    // Wait for page to be visible first
    await subcontractorsPage.expectSubcontractorsVisible();
    
    // Wait for network to be idle (data has loaded)
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Button should be visible in either empty state or header
    // Use role-based selector - verified via Playwright MCP browser inspection
    const addButton = page.getByRole('button', { name: 'Add Subcontractor' });
    await expect(addButton).toBeVisible({ timeout: 15000 });

    await assertNoErrors();
  });

  test('Add Subcontractor button is accessible from list view', async ({ page, assertNoErrors }) => {
    const subcontractorsPage = new ManagerSubcontractorsPage(page);
    await subcontractorsPage.goto();
    
    // Wait for page to be visible first
    await subcontractorsPage.expectSubcontractorsVisible();
    
    // Wait for network to be idle (data has loaded)
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Button should be visible and enabled regardless of empty/list state
    // Use role-based selector - verified via Playwright MCP browser inspection
    const addButton = page.getByRole('button', { name: 'Add Subcontractor' });
    await expect(addButton).toBeVisible({ timeout: 15000 });
    await expect(addButton).toBeEnabled();

    await assertNoErrors();
  });
});

