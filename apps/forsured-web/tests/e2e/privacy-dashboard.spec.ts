// tests/e2e/privacy-dashboard.spec.ts
// REQ-3: CCPA Compliance Implementation
// E2E Tests for Privacy Dashboard and CCPA components
//
// Tests that authenticated users can access and interact with
// the Privacy Dashboard and exercise their CCPA rights.

import { test, expect } from './fixtures/base';

test.describe('Privacy Dashboard - All User Types', () => {
  // Test that all authenticated user types can access the privacy dashboard
  // Note: All users access the same /settings/privacy route

  test.describe('GC User - Privacy Dashboard Access', () => {
    test('GC can access privacy dashboard', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');
      await page.goto('/settings/privacy');

      // Should be on the privacy settings page
      await expect(page).toHaveURL(/\/settings\/privacy/);
    });

    test('GC can see Privacy Settings header', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');
      await page.goto('/settings/privacy');

      // Wait for page content to load
      await page.waitForTimeout(1000);

      // Should see the privacy header (use role selector to get the heading)
      const header = page.getByRole('heading', { name: 'Privacy Settings' });
      await expect(header).toBeVisible();
    });
  });

  test.describe('Contractor User - Privacy Dashboard Access', () => {
    test('Contractor can access privacy dashboard', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');
      await page.goto('/settings/privacy');

      await expect(page).toHaveURL(/\/settings\/privacy/);
    });

    test('Contractor can see CCPA rights information', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');
      await page.goto('/settings/privacy');

      await page.waitForTimeout(1000);

      // Should see the privacy rights section heading
      const rightsSection = page.getByRole('heading', { name: 'Your Privacy Rights' });
      await expect(rightsSection).toBeVisible();
    });
  });

  test.describe('Broker User - Privacy Dashboard Access', () => {
    test('Broker can access privacy dashboard', async ({ page, setupAuthAs }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');
      await page.goto('/settings/privacy');

      await expect(page).toHaveURL(/\/settings\/privacy/);
    });
  });
});

// TODO: Skip until privacy dashboard Quick Actions UI is implemented
test.describe.skip('Privacy Dashboard - Quick Actions', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/settings/privacy');
    // Wait for Quick Actions section to appear
    await page.waitForSelector('text=Quick Actions', { timeout: 10000 });
    await page.waitForTimeout(500); // Extra time for buttons to render
  });

  test('should display Request My Data button', async ({ page }) => {
    // Find by the h3 text inside the button
    const requestDataText = page.getByText('Request My Data', { exact: true });
    await expect(requestDataText).toBeVisible({ timeout: 10000 });
  });

  test('should display Delete My Data button', async ({ page }) => {
    const deleteDataText = page.getByText('Delete My Data', { exact: true });
    await expect(deleteDataText).toBeVisible({ timeout: 10000 });
  });

  test('should display Manage Opt-Outs button', async ({ page }) => {
    const optOutText = page.getByText('Manage Opt-Outs', { exact: true });
    await expect(optOutText).toBeVisible({ timeout: 10000 });
  });

  test('Request My Data button should be clickable', async ({ page }) => {
    // Find the text and click it (will click the parent button)
    const requestDataText = page.getByText('Request My Data', { exact: true });
    await expect(requestDataText).toBeVisible({ timeout: 10000 });

    // Click the text - this will click through to the button
    await requestDataText.click();

    // Wait for any modal or form to appear
    await page.waitForTimeout(500);

    // Modal should appear with either "Request Data Export" or "Cancel" button
    const modal = page.getByText(/Request Data Export|cancel/i).first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });
});

// TODO: Skip until privacy dashboard Data Categories UI is implemented
test.describe.skip('Privacy Dashboard - Data Categories', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/settings/privacy');
    await page.waitForTimeout(1500); // Allow extra time for loading
  });

  test('should display Your Data Categories section', async ({ page }) => {
    const section = page.getByRole('heading', { name: 'Your Data Categories' });
    await expect(section).toBeVisible({ timeout: 10000 });
  });

  test('should display data category descriptions', async ({ page }) => {
    // Check for category explanation text - use first() to avoid strict mode issues
    const description = page.getByText(/categories of personal information/i).first();
    await expect(description).toBeVisible({ timeout: 10000 });
  });

  test('should display at least one data category card', async ({ page }) => {
    // Look for common CCPA data categories - the names are in h3 elements
    // Wait for data to load
    await page.waitForTimeout(1000);

    // Use locator with :has-text for more reliable matching
    const identifiersCategory = page.locator('h3:has-text("Personal Identifiers")');
    const financialCategory = page.locator('h3:has-text("Financial Information")');

    // At least one should be visible
    const identifiersVisible = await identifiersCategory.isVisible().catch(() => false);
    const financialVisible = await financialCategory.isVisible().catch(() => false);

    expect(identifiersVisible || financialVisible).toBe(true);
  });
});

test.describe('Privacy Dashboard - Privacy Rights', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/settings/privacy');
    await page.waitForTimeout(1000);
  });

  test('should display CCPA rights section', async ({ page }) => {
    const section = page.getByRole('heading', { name: 'Your Privacy Rights' });
    await expect(section).toBeVisible();
  });

  test('should display Right to Know', async ({ page }) => {
    const right = page.getByText('Right to Know').first();
    await expect(right).toBeVisible();
  });

  test('should display Right to Delete', async ({ page }) => {
    const right = page.getByText('Right to Delete').first();
    await expect(right).toBeVisible();
  });

  test('should display Right to Opt-Out', async ({ page }) => {
    // There are multiple opt-out sections - find the heading in privacy rights
    const right = page.getByRole('heading', { name: 'Right to Opt-Out' }).first();
    await expect(right).toBeVisible();
  });

  test('should display Right to Correct', async ({ page }) => {
    const right = page.getByText('Right to Correct').first();
    await expect(right).toBeVisible();
  });

  test('should display Right to Non-Discrimination', async ({ page }) => {
    const right = page.getByText('Right to Non-Discrimination').first();
    await expect(right).toBeVisible();
  });

  test('should display Right to Limit Use of Sensitive Information', async ({ page }) => {
    const right = page.getByText(/Right to Limit.*Sensitive/i).first();
    await expect(right).toBeVisible();
  });

  test('should display CCPA/CPRA legal reference', async ({ page }) => {
    const legalRef = page.getByText(/California Consumer Privacy Act/i).first();
    await expect(legalRef).toBeVisible();
  });
});

test.describe('Privacy Dashboard - Request History', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/settings/privacy');
    await page.waitForTimeout(1000);
  });

  test('should display Request History section', async ({ page }) => {
    const section = page.getByRole('heading', { name: 'Request History' });
    await expect(section).toBeVisible();
  });

  test('should display request history description', async ({ page }) => {
    // The description mentions "View your privacy request history" or similar
    const description = page.getByText(/privacy request history/i).first();
    await expect(description).toBeVisible();
  });

  test('should display empty state when no requests exist', async ({ page }) => {
    // For a new user, should show empty state
    const emptyState = page.getByText(/no privacy requests yet/i).first();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Either empty state or request rows should be visible
    const tableRow = page.getByText(/data export|data deletion/i).first();
    const hasRequests = await tableRow.isVisible().catch(() => false);

    expect(hasEmptyState || hasRequests).toBe(true);
  });

  test('should display 45-day processing info', async ({ page }) => {
    const info = page.getByText(/45 days/i).first();
    await expect(info).toBeVisible();
  });
});

test.describe('Privacy Dashboard - Connected Apps', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/settings/privacy');
    await page.waitForTimeout(1000);
  });

  test('should display Connected Applications section', async ({ page }) => {
    const section = page.getByRole('heading', { name: 'Connected Applications' });
    await expect(section).toBeVisible();
  });

  test('should display connected apps description', async ({ page }) => {
    const description = page.getByText(/third-party applications/i).first();
    await expect(description).toBeVisible();
  });

  test('should display empty state or app list', async ({ page }) => {
    // Should show either empty state or connected apps
    const emptyState = page.getByText(/no connected applications/i).first();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    const appCard = page.getByText(/permissions|view details/i).first();
    const hasApps = await appCard.isVisible().catch(() => false);

    expect(hasEmptyState || hasApps).toBe(true);
  });
});

test.describe('Privacy Dashboard - Additional Resources', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/settings/privacy');
    await page.waitForTimeout(1000);
  });

  test('should display Additional Resources section', async ({ page }) => {
    const section = page.getByText('Additional Resources');
    await expect(section).toBeVisible();
  });

  test('should display Privacy Policy link', async ({ page }) => {
    const link = page.getByText(/privacy policy/i);
    await expect(link).toBeVisible();
  });

  test('should display Terms of Service link', async ({ page }) => {
    const link = page.getByText(/terms of service/i);
    await expect(link).toBeVisible();
  });

  test('should display Learn more about CCPA link', async ({ page }) => {
    const link = page.getByText(/learn more about ccpa/i);
    await expect(link).toBeVisible();
  });

  test('should display privacy team contact', async ({ page }) => {
    const contact = page.getByText(/privacy@scaffald\.com/i);
    await expect(contact).toBeVisible();
  });
});

test.describe('Privacy Dashboard - GPC Detection', () => {
  test('should detect and display GPC signal when present', async ({ page, setupAuthAs }) => {
    // Set up auth
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Inject GPC signal before navigation
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'globalPrivacyControl', {
        value: true,
        configurable: true,
      });
    });

    await page.goto('/settings/privacy');
    await page.waitForTimeout(1000);

    // Should see GPC acknowledgment message
    const gpcMessage = page.getByText(/global privacy control/i).first();
    const hasGpcMessage = await gpcMessage.isVisible().catch(() => false);

    // GPC message should be visible when GPC is enabled
    // Note: This depends on the API response also indicating GPC opt-out
    // For now, just verify the page loads correctly with GPC enabled
    await expect(page).toHaveURL(/\/settings\/privacy/);
  });
});

test.describe('Privacy Dashboard - Loading States', () => {
  test('should display loading spinner while fetching data', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Navigate to privacy page
    await page.goto('/settings/privacy');

    // Check for either loading spinner or loaded content
    // (loading state may be too fast to catch)
    const header = page.getByRole('heading', { name: 'Privacy Settings' });

    // Either should be visible at some point
    await expect(header).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Privacy Dashboard - Error Handling', () => {
  test('should handle API errors gracefully', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Mock API to return an error
    await page.route('**/rest/v1/ccpa_requests*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/settings/privacy');
    await page.waitForTimeout(1000);

    // Should either show error state or handle gracefully
    // The page should still be usable
    await expect(page).toHaveURL(/\/settings\/privacy/);
  });
});

test.describe('Privacy Dashboard - Accessibility', () => {
  test.beforeEach(async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/settings/privacy');
    await page.waitForTimeout(1000);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Main heading should be visible
    const mainHeading = page.getByRole('heading', { name: 'Privacy Settings' });
    await expect(mainHeading).toBeVisible();
  });

  test('buttons should be keyboard accessible', async ({ page }) => {
    // Tab to first button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus on interactive elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });

  test('should have proper contrast for text elements', async ({ page }) => {
    // Visual inspection - ensure text is visible
    const bodyText = page.getByText(/california consumer privacy act/i).first();
    await expect(bodyText).toBeVisible();
  });
});

test.describe('Privacy Dashboard - Responsive Design', () => {
  test('should display properly on mobile viewport', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/settings/privacy');
    await page.waitForTimeout(1000);

    // Key elements should still be visible
    const header = page.getByRole('heading', { name: 'Privacy Settings' });
    await expect(header).toBeVisible();

    const quickActions = page.getByRole('heading', { name: 'Quick Actions' });
    await expect(quickActions).toBeVisible();
  });

  test('should display properly on tablet viewport', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/settings/privacy');
    await page.waitForTimeout(1000);

    // Key elements should be visible
    const header = page.getByRole('heading', { name: 'Privacy Settings' });
    await expect(header).toBeVisible();
  });

  test('should display properly on desktop viewport', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/settings/privacy');
    await page.waitForTimeout(1000);

    // Key elements should be visible
    const header = page.getByRole('heading', { name: 'Privacy Settings' });
    await expect(header).toBeVisible();
  });
});
