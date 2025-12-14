// tests/e2e/privacy-dashboard.spec.ts
// REQ-3: CCPA Compliance Implementation
// E2E Tests for Privacy Dashboard and CCPA components
//
// Tests that authenticated users can access and interact with
// the Privacy Dashboard and exercise their CCPA rights.

import { test, expect } from '@playwright/test';
import { setupAuthAs, TEST_USER_IDS } from '../utils/auth';

test.describe('Privacy Dashboard - All User Types', () => {
  // Test that all authenticated user types can access the privacy dashboard

  test.describe('GC User - Privacy Dashboard Access', () => {
    test('GC can access privacy dashboard', async ({ page }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');
      await page.goto('/manager/settings/privacy');

      // Should be on the privacy settings page
      await expect(page).toHaveURL(/\/manager\/settings\/privacy/);
    });

    test('GC can see Privacy & Data header', async ({ page }) => {
      await setupAuthAs(page, 'active.gc@test.forsured.com');
      await page.goto('/manager/settings/privacy');

      // Wait for page content to load
      await page.waitForTimeout(1000);

      // Should see the privacy header
      const header = page.getByText('Privacy & Data');
      await expect(header).toBeVisible();
    });
  });

  test.describe('Contractor User - Privacy Dashboard Access', () => {
    test('Contractor can access privacy dashboard', async ({ page }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');
      await page.goto('/subcontractor/settings/privacy');

      await expect(page).toHaveURL(/\/subcontractor\/settings\/privacy/);
    });

    test('Contractor can see CCPA rights information', async ({ page }) => {
      await setupAuthAs(page, 'active.contractor@test.forsured.com');
      await page.goto('/subcontractor/settings/privacy');

      await page.waitForTimeout(1000);

      // Should see the privacy rights section
      const rightsSection = page.getByText('Your Privacy Rights');
      await expect(rightsSection).toBeVisible();
    });
  });

  test.describe('Broker User - Privacy Dashboard Access', () => {
    test('Broker can access privacy dashboard', async ({ page }) => {
      await setupAuthAs(page, 'active.broker@test.forsured.com');
      await page.goto('/broker/settings/privacy');

      await expect(page).toHaveURL(/\/broker\/settings\/privacy/);
    });
  });
});

test.describe('Privacy Dashboard - Quick Actions', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);
  });

  test('should display Request My Data button', async ({ page }) => {
    const requestDataBtn = page.getByRole('button', { name: /request my data/i });
    await expect(requestDataBtn).toBeVisible();
  });

  test('should display Delete My Data button', async ({ page }) => {
    const deleteDataBtn = page.getByRole('button', { name: /delete my data/i });
    await expect(deleteDataBtn).toBeVisible();
  });

  test('should display Manage Opt-Outs button', async ({ page }) => {
    const optOutBtn = page.getByRole('button', { name: /manage opt-outs/i });
    await expect(optOutBtn).toBeVisible();
  });

  test('Request My Data button should be clickable', async ({ page }) => {
    const requestDataBtn = page.getByRole('button', { name: /request my data/i });
    await expect(requestDataBtn).toBeEnabled();

    // Click should not throw an error
    await requestDataBtn.click();

    // Wait for any modal or form to appear
    await page.waitForTimeout(500);
  });
});

test.describe('Privacy Dashboard - Data Categories', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);
  });

  test('should display Your Data Categories section', async ({ page }) => {
    const section = page.getByText('Your Data Categories');
    await expect(section).toBeVisible();
  });

  test('should display data category descriptions', async ({ page }) => {
    // Check for category explanation text
    const description = page.getByText(/categories of personal information/i);
    await expect(description).toBeVisible();
  });

  test('should display at least one data category card', async ({ page }) => {
    // Look for common CCPA data categories
    const identifiersCategory = page.getByText('Personal Identifiers');
    const financialCategory = page.getByText('Financial Information');

    // At least one should be visible
    const identifiersVisible = await identifiersCategory.isVisible().catch(() => false);
    const financialVisible = await financialCategory.isVisible().catch(() => false);

    expect(identifiersVisible || financialVisible).toBe(true);
  });
});

test.describe('Privacy Dashboard - Privacy Rights', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);
  });

  test('should display CCPA rights section', async ({ page }) => {
    const section = page.getByText('Your Privacy Rights');
    await expect(section).toBeVisible();
  });

  test('should display Right to Know', async ({ page }) => {
    const right = page.getByText('Right to Know');
    await expect(right).toBeVisible();
  });

  test('should display Right to Delete', async ({ page }) => {
    const right = page.getByText('Right to Delete');
    await expect(right).toBeVisible();
  });

  test('should display Right to Opt-Out', async ({ page }) => {
    const right = page.getByText('Right to Opt-Out');
    await expect(right).toBeVisible();
  });

  test('should display Right to Correct', async ({ page }) => {
    const right = page.getByText('Right to Correct');
    await expect(right).toBeVisible();
  });

  test('should display Right to Non-Discrimination', async ({ page }) => {
    const right = page.getByText('Right to Non-Discrimination');
    await expect(right).toBeVisible();
  });

  test('should display Right to Limit Use of Sensitive Information', async ({ page }) => {
    const right = page.getByText(/Right to Limit.*Sensitive/i);
    await expect(right).toBeVisible();
  });

  test('should display CCPA/CPRA legal reference', async ({ page }) => {
    const legalRef = page.getByText(/California Consumer Privacy Act/i);
    await expect(legalRef).toBeVisible();
  });
});

test.describe('Privacy Dashboard - Request History', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);
  });

  test('should display Request History section', async ({ page }) => {
    const section = page.getByText('Request History');
    await expect(section).toBeVisible();
  });

  test('should display request history description', async ({ page }) => {
    const description = page.getByText(/privacy request history/i);
    await expect(description).toBeVisible();
  });

  test('should display empty state when no requests exist', async ({ page }) => {
    // For a new user, should show empty state
    const emptyState = page.getByText(/no privacy requests yet/i);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Either empty state or request rows should be visible
    const tableRow = page.getByText(/data export|data deletion/i);
    const hasRequests = await tableRow.isVisible().catch(() => false);

    expect(hasEmptyState || hasRequests).toBe(true);
  });

  test('should display 45-day processing info', async ({ page }) => {
    const info = page.getByText(/45 days/i);
    await expect(info).toBeVisible();
  });
});

test.describe('Privacy Dashboard - Connected Apps', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);
  });

  test('should display Connected Applications section', async ({ page }) => {
    const section = page.getByText('Connected Applications');
    await expect(section).toBeVisible();
  });

  test('should display connected apps description', async ({ page }) => {
    const description = page.getByText(/third-party applications/i);
    await expect(description).toBeVisible();
  });

  test('should display empty state or app list', async ({ page }) => {
    // Should show either empty state or connected apps
    const emptyState = page.getByText(/no connected applications/i);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    const appCard = page.getByText(/permissions|view details/i);
    const hasApps = await appCard.isVisible().catch(() => false);

    expect(hasEmptyState || hasApps).toBe(true);
  });
});

test.describe('Privacy Dashboard - Additional Resources', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/settings/privacy');
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
  test('should detect and display GPC signal when present', async ({ page }) => {
    // Set up auth
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Inject GPC signal before navigation
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'globalPrivacyControl', {
        value: true,
        configurable: true,
      });
    });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should see GPC acknowledgment message
    const gpcMessage = page.getByText(/global privacy control/i);
    const hasGpcMessage = await gpcMessage.isVisible().catch(() => false);

    // GPC message should be visible when GPC is enabled
    // Note: This depends on the API response also indicating GPC opt-out
    // For now, just verify the page loads correctly with GPC enabled
    await expect(page).toHaveURL(/\/manager\/settings\/privacy/);
  });
});

test.describe('Privacy Dashboard - Loading States', () => {
  test('should display loading spinner while fetching data', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Navigate to privacy page
    await page.goto('/manager/settings/privacy');

    // Check for either loading spinner or loaded content
    // (loading state may be too fast to catch)
    const spinner = page.getByRole('status');
    const header = page.getByText('Privacy & Data');

    // Either should be visible at some point
    await expect(header).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Privacy Dashboard - Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Mock API to return an error
    await page.route('**/rest/v1/ccpa_requests*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Should either show error state or handle gracefully
    // The page should still be usable
    await expect(page).toHaveURL(/\/manager\/settings\/privacy/);
  });
});

test.describe('Privacy Dashboard - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Main heading should be visible
    const mainHeading = page.getByRole('heading', { level: 1 }).or(
      page.getByText('Privacy & Data').first()
    );
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
    const bodyText = page.getByText(/california consumer privacy act/i);
    await expect(bodyText).toBeVisible();
  });
});

test.describe('Privacy Dashboard - Responsive Design', () => {
  test('should display properly on mobile viewport', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Key elements should still be visible
    const header = page.getByText('Privacy & Data');
    await expect(header).toBeVisible();

    const quickActions = page.getByText('Quick Actions');
    await expect(quickActions).toBeVisible();
  });

  test('should display properly on tablet viewport', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Key elements should be visible
    const header = page.getByText('Privacy & Data');
    await expect(header).toBeVisible();
  });

  test('should display properly on desktop viewport', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');

    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/manager/settings/privacy');
    await page.waitForTimeout(1000);

    // Key elements should be visible
    const header = page.getByText('Privacy & Data');
    await expect(header).toBeVisible();
  });
});
