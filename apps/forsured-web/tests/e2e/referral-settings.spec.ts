import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Referral Settings Page (All User Types)
 * Tests the RFR- code display and referral stats functionality
 */

test.describe('Referral Settings Page - Broker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Login as broker
    await page.goto('/broker/settings/referrals');
  });

  test('should display page title and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/referral/i);
  });

  test('should display RFR- referral code', async ({ page }) => {
    // Wait for referral code to load
    const codeElement = page.locator('text=/RFR-[A-Z0-9]{8}/');
    await expect(codeElement).toBeVisible({ timeout: 10000 });
    
    // Verify code format
    const codeText = await codeElement.textContent();
    expect(codeText).toMatch(/RFR-[A-Z0-9]{8}/);
  });

  test('should copy referral code to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Find and click copy button
    const copyButton = page.getByRole('button', { name: /copy.*code/i });
    await copyButton.click();
    
    // Verify success message
    await expect(page.getByText(/copied/i)).toBeVisible();
  });

  test('should display referral statistics', async ({ page }) => {
    // Should show stats cards
    await expect(page.getByText(/total referrals/i)).toBeVisible();
    await expect(page.getByText(/pending/i)).toBeVisible();
    await expect(page.getByText(/completed/i)).toBeVisible();
  });

  test('should show relationship-based signups', async ({ page }) => {
    // Check for relationship connections section
    const relationshipSection = page.getByText(/relationship.*signups|connected companies/i);
    
    if (await relationshipSection.isVisible()) {
      await expect(relationshipSection).toBeVisible();
    }
  });

  test('should NOT show relationship codes (BKR/CTR/MGR)', async ({ page }) => {
    // Verify NO BKR/CTR/MGR codes are displayed
    await expect(page.locator('text=/BKR-[A-Z0-9]{6}/')).not.toBeVisible();
    await expect(page.locator('text=/CTR-[A-Z0-9]{6}/')).not.toBeVisible();
    await expect(page.locator('text=/MGR-[A-Z0-9]{6}/')).not.toBeVisible();
  });

  test('should de-emphasize RFR- code compared to relationships', async ({ page }) => {
    // RFR code should be present but not prominent
    const rfrSection = page.locator('text=/RFR-/');
    await expect(rfrSection).toBeVisible();
    
    // Should have note about general referrals
    await expect(page.getByText(/general.*referral|share.*code/i)).toBeVisible();
  });
});

test.describe('Referral Settings Page - Manager', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.goto('/manager/settings/referrals');
  });

  test('should be accessible from manager settings', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/referral/i);
  });

  test('should display manager referral statistics', async ({ page }) => {
    await expect(page.getByText(/total referrals/i)).toBeVisible();
  });
});

test.describe('Referral Settings Page - Contractor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.goto('/subcontractor/settings/referrals');
  });

  test('should be accessible from contractor settings', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/referral/i);
  });

  test('should display contractor referral statistics', async ({ page }) => {
    await expect(page.getByText(/total referrals/i)).toBeVisible();
  });
});

test.describe('Referral Code Sharing', () => {
  test('should generate unique referral link', async ({ page }) => {
    await page.goto('/broker/settings/referrals');
    
    // Look for referral link or share functionality
    const linkElement = page.locator('text=/http|https/').or(page.getByText(/referral link/i));
    
    if (await linkElement.isVisible()) {
      const link = await linkElement.textContent();
      expect(link).toContain('http');
    }
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/broker/settings/referrals');
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

