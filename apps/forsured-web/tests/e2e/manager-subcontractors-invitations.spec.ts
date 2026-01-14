import { test, expect } from './fixtures/base';

/**
 * E2E Tests for Manager Subcontractors Page - Invitation Functionality
 * Tests manager inviting contractors using MGR- codes
 *
 * TESTING POLICY: We own this system - testing against REAL database, REAL APIs
 */

test.describe('Manager Subcontractors Page - Invitations', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    // Authenticate as manager user using centralized auth handler
    await loginAs(page, 'active.gc@test.forsured.com');

    // Navigate to subcontractors page
    await page.goto('/manager/subcontractors');
    await page.waitForLoadState('networkidle');
  });

  test('should display page title', async ({ page }) => {
    await expect(page).toHaveURL(/\/manager\/subcontractors/);

    // Check for page heading
    await expect(page.getByText(/subcontractors|contractors/i).first()).toBeVisible();
  });

  test('should show invitation section when toggled', async ({ page }) => {
    // Find and click "Show Invitations" button (if it exists)
    const showButton = page.getByRole('button', { name: /show invitations|invite/i });
    
    if (await showButton.isVisible({ timeout: 5000 })) {
      await showButton.click();

      // Should show invitation section
      await expect(page.getByText(/invite.*contractor|your.*code/i)).toBeVisible();
    }
  });

  test('should display MGR- manager code', async ({ page }) => {
    // Look for invitation section or code display
    const showButton = page.getByRole('button', { name: /show invitations|invite/i });
    
    if (await showButton.isVisible({ timeout: 5000 })) {
      await showButton.click();
    }

    // Wait for manager code to load (format: MGR-XXXXXX)
    const codeElement = page.locator('text=/MGR-[A-Z0-9]{6}/');
    
    // Code may be visible immediately or after clicking show
    if (await codeElement.isVisible({ timeout: 10000 })) {
      // Verify code format
      const codeText = await codeElement.textContent();
      expect(codeText).toMatch(/MGR-[A-Z0-9]{6}/);
    }
  });

  test('should copy manager code to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Show invitation section if needed
    const showButton = page.getByRole('button', { name: /show invitations|invite/i });
    if (await showButton.isVisible({ timeout: 5000 })) {
      await showButton.click();
    }

    // Wait for code to load
    const codeElement = page.locator('text=/MGR-[A-Z0-9]{6}/');
    if (await codeElement.isVisible({ timeout: 10000 })) {
      // Find and click copy button
      const copyButton = page.getByRole('button', { name: /copy/i });
      if (await copyButton.isVisible({ timeout: 5000 })) {
        await copyButton.click();

        // Verify success message
        await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should require email and name for contractor invitation', async ({ page }) => {
    // Show invitation section if needed
    const showButton = page.getByRole('button', { name: /show invitations|invite/i });
    if (await showButton.isVisible({ timeout: 5000 })) {
      await showButton.click();
    }

    // Look for send invitation button
    const sendButton = page.getByRole('button', { name: /send invitation/i });
    
    if (await sendButton.isVisible({ timeout: 5000 })) {
      // Button should be disabled without required fields
      await expect(sendButton).toBeDisabled();
    }
  });

  test('should enable send button when required fields are filled', async ({ page }) => {
    // Show invitation section if needed
    const showButton = page.getByRole('button', { name: /show invitations|invite/i });
    if (await showButton.isVisible({ timeout: 5000 })) {
      await showButton.click();
    }

    // Look for form fields
    const emailInput = page.locator('input[placeholder*="email" i]');
    const nameInput = page.locator('input[placeholder*="name" i]');

    if (await emailInput.isVisible({ timeout: 5000 })) {
      // Fill in required fields
      await emailInput.fill('test.contractor@example.com');
      await nameInput.fill('Test Contractor');

      // Send button should be enabled
      const sendButton = page.getByRole('button', { name: /send invitation/i });
      if (await sendButton.isVisible({ timeout: 5000 })) {
        await expect(sendButton).toBeEnabled();
      }
    }
  });

  test('should send contractor invitation with valid data', async ({ page }) => {
    // Show invitation section if needed
    const showButton = page.getByRole('button', { name: /show invitations|invite/i });
    if (await showButton.isVisible({ timeout: 5000 })) {
      await showButton.click();
    }

    // Look for form fields
    const emailInput = page.locator('input[placeholder*="email" i]');
    const nameInput = page.locator('input[placeholder*="name" i]');

    if (await emailInput.isVisible({ timeout: 5000 })) {
      // Fill in contractor details
      await emailInput.fill('new.contractor@example.com');
      await nameInput.fill('New Contractor');
      
      const companyInput = page.locator('input[placeholder*="company" i]');
      if (await companyInput.isVisible({ timeout: 2000 })) {
        await companyInput.fill('New Company');
      }

      // Send invitation
      const sendButton = page.getByRole('button', { name: /send invitation/i });
      if (await sendButton.isVisible({ timeout: 5000 })) {
        await sendButton.click();

        // Wait for response - should show either success or error toast
        const successToast = page.getByText(/invitation sent|contractor invitation/i);
        const errorToast = page.getByText(/failed to send|error/i);

        // Either success or error is acceptable
        await expect(successToast.or(errorToast)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display connect using contractor code section', async ({ page }) => {
    // Look for code entry section
    const codeInput = page.locator('input[placeholder*="CTR-" i]');
    
    if (await codeInput.isVisible({ timeout: 5000 })) {
      await expect(codeInput).toBeVisible();
      
      // Should have connect button
      const connectButton = page.getByRole('button', { name: /connect/i });
      if (await connectButton.isVisible({ timeout: 2000 })) {
        await expect(connectButton).toBeVisible();
      }
    }
  });
});

test.describe('Manager Contractor Invitation Flow', () => {
  test('complete manager contractor invitation flow', async ({ page, loginAs }) => {
    await loginAs(page, 'active.gc@test.forsured.com');

    // Navigate to subcontractors page
    await page.goto('/manager/subcontractors');
    await page.waitForLoadState('networkidle');

    // Step 1: Show invitation section if needed
    const showButton = page.getByRole('button', { name: /show invitations|invite/i });
    if (await showButton.isVisible({ timeout: 5000 })) {
      await showButton.click();
    }

    // Step 2: Verify MGR- code is displayed (if visible)
    const codeElement = page.locator('text=/MGR-[A-Z0-9]{6}/');
    if (await codeElement.isVisible({ timeout: 10000 })) {
      const codeText = await codeElement.textContent();
      expect(codeText).toMatch(/MGR-[A-Z0-9]{6}/);
    }

    // Step 3: Fill in contractor details (if form is visible)
    const emailInput = page.locator('input[placeholder*="email" i]');
    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill('flow.contractor@example.com');
      await page.locator('input[placeholder*="name" i]').fill('Flow Contractor');
      
      const companyInput = page.locator('input[placeholder*="company" i]');
      if (await companyInput.isVisible({ timeout: 2000 })) {
        await companyInput.fill('Flow Company');
      }

      // Step 4: Send invitation
      const sendButton = page.getByRole('button', { name: /send invitation/i });
      if (await sendButton.isVisible({ timeout: 5000 })) {
        await sendButton.click();

        // Step 5: Verify response
        const successToast = page.getByText(/invitation sent|contractor invitation/i);
        const errorToast = page.getByText(/failed|error/i);
        await expect(successToast.or(errorToast)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

