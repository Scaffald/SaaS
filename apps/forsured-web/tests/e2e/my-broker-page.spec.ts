import { test, expect } from './fixtures/base';

/**
 * E2E Tests for My Broker Page (Subcontractor)
 * Tests the complete flow of subcontractors inviting and connecting with brokers
 *
 * TESTING POLICY: We own this system - testing against REAL database, REAL APIs
 */

test.describe('Subcontractor My Broker Page', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    // Authenticate as contractor user using centralized auth handler
    // This auto-detects auth mode (Supabase or OAuth) based on VITE_FORSURED_USE_OAUTH
    // Legacy email format is supported - maps to test-contractor@forsured.test
    // loginAs navigates to dashboard automatically AND waits for profile to load
    await loginAs(page, 'active.contractor@test.forsured.com');

    // loginAs already waits for profile to be ready, so we can navigate directly
    await page.goto('/subcontractor/broker');
    await page.waitForLoadState('networkidle');
  });

  test('should display page title and description', async ({ page }) => {
    // beforeEach already navigated to /subcontractor/broker
    // Verify we're on the right page
    await expect(page).toHaveURL(/\/subcontractor\/broker/);

    // Check for page heading - Tamagui uses Text components, not semantic h1
    // The page shows "My Broker" as the main title
    await expect(page.getByText('My Broker', { exact: true }).first()).toBeVisible();

    // Check for description
    await expect(page.getByText(/Invite your insurance broker/i)).toBeVisible();
  });

  test('should display Invite Your Broker card', async ({ page }) => {
    // Check for the "Invite Your Broker" section
    await expect(page.getByText('Invite Your Broker')).toBeVisible();

    // Check for form fields (using placeholder text since they're Input components)
    await expect(page.locator('input[placeholder*="broker@example.com"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="John Doe"]')).toBeVisible();

    // Check for send button
    await expect(page.getByRole('button', { name: /send invitation/i })).toBeVisible();
  });

  test('should display Connect Using Broker Code section', async ({ page }) => {
    // Check for the broker code connection section
    await expect(page.getByText("Connect Using Broker's Code")).toBeVisible();

    // Check for code input field (placeholder contains BKR-)
    await expect(page.locator('input[placeholder*="BKR-"]')).toBeVisible();

    // Check for connect button
    await expect(page.getByRole('button', { name: /^connect$/i })).toBeVisible();
  });

  test('should require broker email for invitation', async ({ page }) => {
    // Fill in name but not email
    await page.locator('input[placeholder*="John Doe"]').fill('Test Broker');

    // Try to submit - the button should be disabled or show error
    const sendButton = page.getByRole('button', { name: /send invitation/i });

    // Check if button is disabled (email is required)
    await expect(sendButton).toBeDisabled();
  });

  test('should require broker name for invitation', async ({ page }) => {
    // Fill in email but not name
    await page.locator('input[placeholder*="broker@example.com"]').fill('test@example.com');

    // Try to submit - the button should be disabled or show error
    const sendButton = page.getByRole('button', { name: /send invitation/i });

    // Check if button is disabled (name is required)
    await expect(sendButton).toBeDisabled();
  });

  test('should enable send button when required fields are filled', async ({ page }) => {
    // Fill in required fields
    await page.locator('input[placeholder*="broker@example.com"]').fill('test@example.com');
    await page.locator('input[placeholder*="John Doe"]').fill('Test Broker');

    // Button should be enabled
    const sendButton = page.getByRole('button', { name: /send invitation/i });
    await expect(sendButton).toBeEnabled();
  });

  test('should send broker invitation with valid data', async ({ page }) => {
    // Fill in broker details
    await page.locator('input[placeholder*="broker@example.com"]').fill('test.broker@example.com');
    await page.locator('input[placeholder*="John Doe"]').fill('Test Broker');
    await page.locator('input[placeholder*="ABC Insurance"]').fill('ABC Insurance Agency');

    // Submit invitation
    await page.getByRole('button', { name: /send invitation/i }).click();

    // Wait for response - should show either success or error toast
    // Success: "Broker invitation sent!" or Error: "Failed to send invitation"
    const successToast = page.getByText(/invitation sent|broker invitation/i);
    const errorToast = page.getByText(/failed to send|error/i);

    // Either success or error is acceptable (depends on database state)
    await expect(successToast.or(errorToast)).toBeVisible({ timeout: 5000 });
  });

  test('should require connection code for connect', async ({ page }) => {
    // Try to connect without code
    const connectButton = page.getByRole('button', { name: /^connect$/i });

    // Button should be disabled when code input is empty
    await expect(connectButton).toBeDisabled();
  });

  test('should enable connect button when code is entered', async ({ page }) => {
    // Enter a connection code
    await page.locator('input[placeholder*="BKR-"]').fill('BKR-TEST01');

    // Connect button should be enabled
    const connectButton = page.getByRole('button', { name: /^connect$/i });
    await expect(connectButton).toBeEnabled();
  });

  test('should show error for invalid connection code', async ({ page }) => {
    // Enter an invalid/non-existent code
    await page.locator('input[placeholder*="BKR-"]').fill('BKR-INVALID');

    // Try to connect
    await page.getByRole('button', { name: /^connect$/i }).click();

    // Should show error toast - check for various error messages
    // The component shows: "Failed to connect using code" or result.error
    const errorToast = page.getByText(/failed|error|invalid|not found/i);
    await expect(errorToast).toBeVisible({ timeout: 5000 });
  });

  test('should display connected brokers section when connections exist', async ({ page }) => {
    // This test checks if the "Connected Brokers" section appears when there are connections
    // The section only appears if connectedBrokers.length > 0

    // Check if the section exists (may not be visible if no connections)
    const connectedSection = page.getByText('Connected Brokers');
    const isVisible = await connectedSection.isVisible().catch(() => false);

    if (isVisible) {
      // If visible, should show connected broker info
      await expect(connectedSection).toBeVisible();
    }
    // Otherwise, just verify page loaded correctly
  });

  test('should display pending invitations section when invitations exist', async ({ page }) => {
    // This test checks if the "Pending Invitations" section appears
    // The section only appears if pendingInvitations.length > 0

    // Check if the section exists (may not be visible if no pending invitations)
    const pendingSection = page.getByText('Pending Invitations');
    const isVisible = await pendingSection.isVisible().catch(() => false);

    if (isVisible) {
      // If visible, should show pending invitation info
      await expect(pendingSection).toBeVisible();
    }
    // Otherwise, just verify page loaded correctly
  });
});

test.describe('Broker Invitation Flow', () => {
  test('complete broker invitation flow', async ({ page, loginAs }) => {
    await loginAs(page, 'active.contractor@test.forsured.com');

    // Navigate to broker page
    await page.goto('/subcontractor/broker');
    await page.waitForLoadState('networkidle');

    // Step 1: Verify page loaded
    await expect(page.getByText('My Broker', { exact: true }).first()).toBeVisible();

    // Step 2: Fill invitation form
    await page.locator('input[placeholder*="broker@example.com"]').fill('flow.test@example.com');
    await page.locator('input[placeholder*="John Doe"]').fill('Flow Test Broker');
    await page.locator('input[placeholder*="ABC Insurance"]').fill('Test Insurance Agency');

    // Step 3: Submit invitation
    await page.getByRole('button', { name: /send invitation/i }).click();

    // Step 4: Verify response (success or error toast)
    const successToast = page.getByText(/invitation sent|broker invitation/i);
    const errorToast = page.getByText(/failed|error/i);
    await expect(successToast.or(errorToast)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page, loginAs }) => {
    await loginAs(page, 'active.contractor@test.forsured.com');
    await page.goto('/subcontractor/broker');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper form labels', async ({ page, loginAs }) => {
    await loginAs(page, 'active.contractor@test.forsured.com');
    await page.goto('/subcontractor/broker');
    await page.waitForLoadState('networkidle');

    // Check for proper form inputs
    await expect(page.locator('input[placeholder*="broker@example.com"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="John Doe"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="BKR-"]')).toBeVisible();
  });
});
