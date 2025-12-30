import { test, expect } from '../fixtures/base';
import { AdminEnumsPage } from '../pages/admin';

// TODO: These tests require mock data for enum values endpoint
// The page loads but stays in "Loading values..." state without API mocks
test.describe.skip('Admin Enums - Accessibility (BUG-007)', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'admin@test.forsured.com');
    const enumsPage = new AdminEnumsPage(page);
    await enumsPage.goto();
    await enumsPage.expectEnumsVisible();
  });

  test('action buttons should have accessible labels', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Get first enum row actions (assuming there's at least one active enum)
    const firstRow = page.locator('tbody tr').first();

    // Check Edit button has aria-label
    const editButton = firstRow.locator('button:has(svg)').first();
    const editAriaLabel = await editButton.getAttribute('aria-label');
    expect(editAriaLabel).toBeTruthy();
    expect(editAriaLabel).toContain('Edit');
  });

  test('edit button should have tooltip on hover', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    const editButton = firstRow.locator('button:has(svg)').first();

    // Hover over the edit button
    await editButton.hover();

    // Wait a bit for tooltip to appear (200ms default delay)
    await page.waitForTimeout(300);

    // Check if tooltip is visible
    const tooltip = page.locator('text="Edit enum value"');
    await expect(tooltip).toBeVisible({ timeout: 1000 });
  });

  test('delete button should have accessible label', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();

    // Find delete button (second button with svg, trash icon)
    const deleteButton = firstRow.locator('button:has(svg)').nth(1);
    const deleteAriaLabel = await deleteButton.getAttribute('aria-label');
    expect(deleteAriaLabel).toBeTruthy();
    expect(deleteAriaLabel).toContain('Delete');
  });

  test('delete button should have tooltip on hover', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    const deleteButton = firstRow.locator('button:has(svg)').nth(1);

    await deleteButton.hover();
    await page.waitForTimeout(300);

    const tooltip = page.locator('text="Delete enum value"');
    await expect(tooltip).toBeVisible({ timeout: 1000 });
  });

  test('move up button should have accessible label', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();

    // Find move up button (third button with svg, arrow up icon)
    const moveUpButton = firstRow.locator('button:has(svg)').nth(2);
    const moveUpAriaLabel = await moveUpButton.getAttribute('aria-label');
    expect(moveUpAriaLabel).toBeTruthy();
    expect(moveUpAriaLabel).toContain('Move');
    expect(moveUpAriaLabel).toContain('up');
  });

  test('move up button should have tooltip on hover', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    const moveUpButton = firstRow.locator('button:has(svg)').nth(2);

    await moveUpButton.hover();
    await page.waitForTimeout(300);

    const tooltip = page.locator('text="Move up"');
    await expect(tooltip).toBeVisible({ timeout: 1000 });
  });

  test('move down button should have accessible label', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();

    // Find move down button (fourth button with svg, arrow down icon)
    const moveDownButton = firstRow.locator('button:has(svg)').nth(3);
    const moveDownAriaLabel = await moveDownButton.getAttribute('aria-label');
    expect(moveDownAriaLabel).toBeTruthy();
    expect(moveDownAriaLabel).toContain('Move');
    expect(moveDownAriaLabel).toContain('down');
  });

  test('move down button should have tooltip on hover', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    const moveDownButton = firstRow.locator('button:has(svg)').nth(3);

    await moveDownButton.hover();
    await page.waitForTimeout(300);

    const tooltip = page.locator('text="Move down"');
    await expect(tooltip).toBeVisible({ timeout: 1000 });
  });

  test('restore button should have accessible label for inactive enums', async ({ page }) => {
    // Enable "Show inactive" checkbox
    await page.locator('input[type="checkbox"]').check();

    // Wait for table to update
    await page.waitForTimeout(500);

    // Find an inactive row (has opacity 0.6)
    const inactiveRow = page.locator('tbody tr').filter({
      has: page.locator('text="Inactive"')
    }).first();

    if (await inactiveRow.count() > 0) {
      const restoreButton = inactiveRow.locator('button:has(svg)').first();
      const restoreAriaLabel = await restoreButton.getAttribute('aria-label');
      expect(restoreAriaLabel).toBeTruthy();
      expect(restoreAriaLabel).toContain('Restore');
    }
  });

  test('all action buttons should be keyboard accessible', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    // Tab to first action button
    await page.keyboard.press('Tab');

    // Check if button can receive focus
    const firstRow = page.locator('tbody tr').first();
    const editButton = firstRow.locator('button:has(svg)').first();

    // The button should be focusable
    await editButton.focus();
    const isFocused = await editButton.evaluate(el => el === document.activeElement);
    expect(isFocused).toBeTruthy();
  });

  test('refresh button should have accessible label', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Refresh")');
    const ariaLabel = await refreshButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('Refresh');
  });

  test('close modal button should have accessible label', async ({ page }) => {
    // Open add modal
    await page.locator('button:has-text("Add Value")').click();

    // Wait for modal to appear
    await page.waitForSelector('text="Add Enum Value"');

    // Find close button (X icon button)
    const closeButton = page.locator('button').filter({
      has: page.locator('svg')
    }).filter({
      hasNot: page.locator('text')
    }).last();

    const ariaLabel = await closeButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('Close');
  });

  test('screen reader can identify all action buttons', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 });

    // Get accessibility tree snapshot
    const snapshot = await page.accessibility.snapshot();

    // Function to find nodes by role and name
    function findButtonsByRole(node: any): any[] {
      const buttons: any[] = [];
      if (node.role === 'button' && node.name) {
        buttons.push(node);
      }
      if (node.children) {
        for (const child of node.children) {
          buttons.push(...findButtonsByRole(child));
        }
      }
      return buttons;
    }

    const buttons = findButtonsByRole(snapshot);

    // Check that we have buttons with accessibility names
    expect(buttons.length).toBeGreaterThan(0);

    // Verify some buttons have meaningful names
    const buttonNames = buttons.map(b => b.name?.toLowerCase() || '');
    const hasEditButton = buttonNames.some(name => name.includes('edit'));
    const hasDeleteButton = buttonNames.some(name => name.includes('delete'));

    expect(hasEditButton || hasDeleteButton).toBeTruthy();
  });
});
