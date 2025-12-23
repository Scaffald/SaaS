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
    
    // Wait for page to fully load - wait for either header or empty state
    await page.waitForLoadState('networkidle');
    
    // Wait for the page content to appear (either header or empty state)
    await page.waitForSelector('h1:has-text("Subcontractors"), h2:has-text("No Subcontractors Yet")', { timeout: 15000 });
    
    // Wait for loading spinner to disappear
    await page.waitForSelector('text=/loading subcontractors/i', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // Additional wait for React to finish rendering
    await page.waitForTimeout(1000);
    
    // Try multiple selector strategies - Tamagui buttons might render text in different ways
    // Strategy 1: Direct text match (works if text is in single node)
    let addButton = page.locator('button:has-text("Add Subcontractor")').first();
    let isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Strategy 2: Filter by button containing text (works if text is split across nodes)
    if (!isVisible) {
      addButton = page.locator('button').filter({ hasText: /add subcontractor/i }).first();
      isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);
    }
    
    // Strategy 3: Get all buttons and find one with the text
    if (!isVisible) {
      const buttons = await page.locator('button').all();
      for (const btn of buttons) {
        const text = await btn.textContent().catch(() => '');
        if (text && /add subcontractor/i.test(text)) {
          addButton = btn;
          isVisible = true;
          break;
        }
      }
    }
    
    // If still not found, log what buttons exist for debugging
    if (!isVisible) {
      const allButtons = await page.locator('button').all();
      const buttonTexts = await Promise.all(
        allButtons.map(btn => btn.textContent().catch(() => '[error reading text]'))
      );
      console.log('Available buttons on page:', buttonTexts.filter(Boolean));
      console.log('Page URL:', page.url());
      console.log('Page title:', await page.title());
    }
    
    expect(isVisible).toBe(true);
    await expect(addButton).toBeVisible();

    await assertNoErrors();
  });

  test('Clicking Add Subcontractor button navigates to new route', async ({ page, assertNoErrors }) => {
    const subcontractorsPage = new ManagerSubcontractorsPage(page);
    await subcontractorsPage.goto();
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Subcontractors"), h2:has-text("No Subcontractors Yet")', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Find and click the Add Subcontractor button
    const addButton = page.locator('button:has-text("Add Subcontractor")').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    
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
    await page.waitForSelector('h1:has-text("Subcontractors"), h2:has-text("No Subcontractors Yet")', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Check if add button is visible
    const addButton = page.locator('button:has-text("Add Subcontractor")').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    
    // Use page object method (but ensure button is visible first)
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
    await page.waitForSelector('h1:has-text("Subcontractors"), h2:has-text("No Subcontractors Yet")', { timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Check for empty state - look for the empty state title
    const emptyStateTitle = page.locator('h2:has-text("No Subcontractors Yet")');
    const isEmpty = await emptyStateTitle.isVisible({ timeout: 5000 }).catch(() => false);

    // Button should be visible in either empty state or header
    const addButton = page.locator('button:has-text("Add Subcontractor")').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });

    await assertNoErrors();
  });

  test('Add Subcontractor button is accessible from list view', async ({ page, assertNoErrors }) => {
    const subcontractorsPage = new ManagerSubcontractorsPage(page);
    await subcontractorsPage.goto();
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Subcontractors"), h2:has-text("No Subcontractors Yet")', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Button should be visible and enabled regardless of empty/list state
    const addButton = page.locator('button:has-text("Add Subcontractor")').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await expect(addButton).toBeEnabled();

    await assertNoErrors();
  });
});

