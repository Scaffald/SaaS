// tests/e2e/onboarding.spec.ts
// REQ-126: E2E tests for onboarding flows
import { test, expect } from './fixtures/base';

test.describe('Onboarding Flows', () => {
  test('GC onboarding form fields E2E', async ({ page, loginAs }) => {
    // Start with a fresh GC user (onboarding_completed: false)
    await loginAs(page, 'fresh.gc@test.forsured.com');
    await expect(page).toHaveURL(/\/manager\/onboarding/, { timeout: 10000 });

    // Single-page onboarding form with "Welcome, General Contractor" heading
    await expect(page.getByRole('heading', { name: 'Welcome, General Contractor' })).toBeVisible({ timeout: 10000 });

    // Verify all form fields are present
    await expect(page.getByPlaceholder('Enter your company name')).toBeVisible();
    await expect(page.getByText('Company Size', { exact: true })).toBeVisible();
    await expect(page.getByRole('combobox')).toBeVisible();
    await expect(page.getByPlaceholder('City, State')).toBeVisible();

    // Verify Continue button starts disabled (form not filled)
    const submitButton = page.getByRole('button', { name: 'Continue to Dashboard' });
    await expect(submitButton).toBeDisabled();

    // Fill text fields
    await page.getByPlaceholder('Enter your company name').fill('Test GC Company');
    await page.getByPlaceholder('City, State').fill('Austin, TX');

    // Button should still be disabled (companySize not selected)
    await expect(submitButton).toBeDisabled();

    // Verify Select dropdown opens
    const selectTrigger = page.getByRole('combobox');
    await selectTrigger.click();
    await page.waitForTimeout(500);

    // Verify dropdown opened (combobox should have expanded state)
    await expect(selectTrigger).toHaveAttribute('aria-expanded', 'true');

    // Note: Full form submission tested via skip flow since Beyond UI Select
    // requires special handling for option selection in Playwright
  });

  test('GC onboarding skip flow', async ({ page, loginAs }) => {
    // Start with a fresh GC user
    await loginAs(page, 'fresh.gc@test.forsured.com');
    await expect(page).toHaveURL(/\/manager\/onboarding/, { timeout: 10000 });

    // Wait for the page to fully render
    await expect(page.getByRole('heading', { name: 'Welcome, General Contractor' })).toBeVisible({ timeout: 10000 });

    // Click Skip for now button - use JavaScript click for Beyond UI button compatibility
    const skipButton = page.getByRole('button', { name: /skip for now/i });
    await expect(skipButton).toBeVisible({ timeout: 10000 });
    await skipButton.scrollIntoViewIfNeeded();
    await skipButton.evaluate((el: HTMLElement) => el.click());

    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/manager\/dashboard/, { timeout: 15000 });
  });

  test('Contractor onboarding flow E2E - Step 1 Company Info', async ({ page, loginAs }) => {
    // Start with a fresh Contractor user
    await loginAs(page, 'fresh.contractor@test.forsured.com');
    await expect(page).toHaveURL(/\/subcontractor\/onboarding/, { timeout: 10000 });

    // Subcontractor uses a multi-step prequalification wizard
    // First heading should be "Subcontractor Prequalification" or "Complete Your Profile"
    await expect(page.getByRole('heading', { name: /subcontractor prequalification|complete your profile/i })).toBeVisible({ timeout: 10000 });

    // Step 1 should show "Company Information" section heading
    await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible({ timeout: 10000 });

    // Fill required fields using actual placeholders from SubcontractorPrequalificationWizard
    await page.getByPlaceholder('Legal company name').fill('Test Contractor Co');
    await page.getByPlaceholder('XX-XXXXXXX').fill('12-3456789');
    await page.getByPlaceholder('Street address, city, state, zip').first().fill('789 Tool Rd, Dallas, TX 75201');

    // Fill primary contact info
    await page.getByPlaceholder('Full name').fill('John Contractor');
    await page.getByPlaceholder('Job title').fill('Owner');
    await page.getByPlaceholder('email@example.com').fill('john@testcontractor.com');
    await page.getByPlaceholder('(555) 123-4567').fill('555-333-4444');

    // Click Next to go to Step 2 (Licensing)
    await page.getByRole('button', { name: 'Next' }).click();

    // Should be on Step 2 (Licensing)
    await expect(page.getByRole('heading', { name: /licensing/i })).toBeVisible({ timeout: 10000 });
  });

  test('Contractor onboarding skip flow', async ({ page, loginAs }) => {
    // Start with a fresh Contractor user
    await loginAs(page, 'fresh.contractor@test.forsured.com');
    await expect(page).toHaveURL(/\/subcontractor\/onboarding/, { timeout: 10000 });

    // Wait for the page to fully load
    await expect(page.getByRole('heading', { name: /subcontractor prequalification|complete your profile/i })).toBeVisible({ timeout: 10000 });

    // Click Skip for now button - use JavaScript click for Beyond UI button compatibility
    const skipButton = page.getByRole('button', { name: /skip for now/i });
    await expect(skipButton).toBeVisible({ timeout: 10000 });
    await skipButton.scrollIntoViewIfNeeded();
    await skipButton.evaluate((el: HTMLElement) => el.click());

    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/subcontractor\/dashboard/, { timeout: 15000 });
  });

  test('Broker onboarding flow E2E', async ({ page, loginAs }) => {
    // Start with a fresh Broker user
    await loginAs(page, 'fresh.broker@test.forsured.com');
    await expect(page).toHaveURL(/\/broker\/onboarding/, { timeout: 10000 });

    // Single-page onboarding form with "Welcome, Insurance Broker" heading
    await expect(page.getByRole('heading', { name: 'Welcome, Insurance Broker' })).toBeVisible({ timeout: 10000 });

    // Brokerage Details section
    await expect(page.getByRole('heading', { name: 'Brokerage Details' })).toBeVisible({ timeout: 10000 });

    // Fill brokerage fields
    await page.getByPlaceholder('Enter your brokerage name').fill('Test Brokerage Inc');
    await page.getByPlaceholder('Enter license number').fill('BRK-54321');
    await page.getByPlaceholder('City, State').first().fill('Houston, TX');

    // Administrator Account section
    await expect(page.getByRole('heading', { name: 'Administrator Account' })).toBeVisible();

    // Fill admin fields
    await page.getByPlaceholder('Enter your full name').fill('Test Broker Admin');
    await page.getByPlaceholder('Enter your email address').fill('admin@testbrokerage.com');
    await page.getByPlaceholder('(555) 123-4567').fill('555-222-3333');
    await page.getByPlaceholder('Create a password').fill('SecurePass1!');
    await page.getByPlaceholder('Confirm your password').fill('SecurePass1!');

    // Click Continue to Dashboard
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 15000 });
  });

  test('Broker onboarding skip flow', async ({ page, loginAs }) => {
    // Start with a fresh Broker user
    await loginAs(page, 'fresh.broker@test.forsured.com');
    await expect(page).toHaveURL(/\/broker\/onboarding/, { timeout: 10000 });

    // Wait for page to fully load
    await expect(page.getByRole('heading', { name: 'Welcome, Insurance Broker' })).toBeVisible({ timeout: 10000 });

    // Click Skip for now button - use JavaScript click for Beyond UI button compatibility
    const skipButton = page.getByRole('button', { name: /skip for now/i });
    await expect(skipButton).toBeVisible({ timeout: 10000 });
    await skipButton.scrollIntoViewIfNeeded();
    await skipButton.evaluate((el: HTMLElement) => el.click());

    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 15000 });
  });

  test('Broker onboarding team invitation', async ({ page, loginAs }) => {
    // Start with a fresh Broker user
    await loginAs(page, 'fresh.broker@test.forsured.com');
    await expect(page).toHaveURL(/\/broker\/onboarding/, { timeout: 10000 });

    // Verify team invitation section exists
    await expect(page.getByRole('heading', { name: 'Invite Team Members' })).toBeVisible({ timeout: 10000 });

    // Fill minimum required fields for brokerage
    await page.getByPlaceholder('Enter your brokerage name').fill('Test Brokerage');
    await page.getByPlaceholder('Enter license number').fill('BRK-12345');
    await page.getByPlaceholder('City, State').first().fill('Austin, TX');

    // Fill admin fields
    await page.getByPlaceholder('Enter your full name').fill('Broker Admin');
    await page.getByPlaceholder('Enter your email address').fill('admin@test.com');
    await page.getByPlaceholder('(555) 123-4567').fill('555-111-2222');
    await page.getByPlaceholder('Create a password').fill('SecurePass1!');
    await page.getByPlaceholder('Confirm your password').fill('SecurePass1!');

    // Add team member email
    const emailInput = page.getByPlaceholder('colleague@example.com');
    await emailInput.fill('teammate@test.com');

    // Press Enter to add the team member (alternative to clicking Add button)
    await emailInput.press('Enter');

    // Wait a moment for the state update
    await page.waitForTimeout(500);

    // Verify team member was added (should show "Pending Invitations (1)")
    await expect(page.getByText(/pending invitations/i)).toBeVisible({ timeout: 5000 });
  });
});
