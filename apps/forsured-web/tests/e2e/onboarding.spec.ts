// tests/e2e/onboarding.spec.ts
// REQ-126: E2E tests for onboarding flows
import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth';

test.describe('Onboarding Flows', () => {
  test('GC onboarding flow E2E', async ({ page }) => {
    // Start with a fresh GC user (onboarding_completed: false)
    await loginAs(page, 'fresh.gc@test.forsured.com');
    await expect(page).toHaveURL(/\/manager\/onboarding/, { timeout: 10000 });

    // Single-page onboarding form
    await expect(page.getByRole('heading', { name: 'Welcome, General Contractor' })).toBeVisible({ timeout: 10000 });

    // Fill out the form
    await page.getByPlaceholder('Enter your company name').fill('Test GC Company');
    await page.getByRole('combobox').selectOption('11-50');
    await page.getByPlaceholder('City, State').fill('Austin, TX');

    // Submit
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

    // Should redirect to manager dashboard
    await expect(page).toHaveURL(/\/manager\/dashboard/, { timeout: 10000 });
  });

  test('GC onboarding skip flow', async ({ page }) => {
    // Start with a fresh GC user
    await loginAs(page, 'fresh.gc@test.forsured.com');
    await expect(page).toHaveURL(/\/manager\/onboarding/, { timeout: 10000 });

    // Click skip button
    await page.getByRole('button', { name: 'Skip for now' }).click();

    // Should redirect to manager dashboard
    await expect(page).toHaveURL(/\/manager\/dashboard/, { timeout: 10000 });
  });

  test('Contractor onboarding flow E2E - Step 1 Company Info', async ({ page }) => {
    // Start with a fresh Contractor user
    await loginAs(page, 'fresh.contractor@test.forsured.com');
    await expect(page).toHaveURL(/\/subcontractor\/onboarding/, { timeout: 10000 });

    // Step 1: Company Information (7-step wizard)
    await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible({ timeout: 10000 });

    // Fill required fields
    await page.getByPlaceholder('Legal company name').fill('Test Contractor Co');
    await page.getByPlaceholder('XX-XXXXXXX').fill('12-3456789');
    await page.getByPlaceholder('Street address, city, state, zip').first().fill('789 Tool Rd, Dallas, TX 75201');
    await page.getByRole('combobox').selectOption('llc');
    await page.getByPlaceholder('0').first().fill('5');
    await page.getByPlaceholder('Full name').fill('John Contractor');
    await page.getByPlaceholder('Job title').fill('Owner');
    await page.getByPlaceholder('email@example.com').fill('john@testcontractor.com');
    await page.getByPlaceholder('(555) 123-4567').fill('555-333-4444');

    // Click Next to go to Step 2
    await page.getByRole('button', { name: 'Next' }).click();

    // Should be on Step 2: Licensing
    await expect(page.getByRole('heading', { name: 'Licensing and Registration' })).toBeVisible({ timeout: 10000 });
  });

  test('Contractor onboarding skip flow', async ({ page }) => {
    // Start with a fresh Contractor user
    await loginAs(page, 'fresh.contractor@test.forsured.com');
    await expect(page).toHaveURL(/\/subcontractor\/onboarding/, { timeout: 10000 });

    // Click skip button
    await page.getByRole('button', { name: 'Skip for now' }).click();

    // Should redirect to subcontractor dashboard
    await expect(page).toHaveURL(/\/subcontractor\/dashboard/, { timeout: 10000 });
  });

  test('Broker onboarding flow E2E', async ({ page }) => {
    // Start with a fresh Broker user
    await loginAs(page, 'fresh.broker@test.forsured.com');
    await expect(page).toHaveURL(/\/broker\/onboarding/, { timeout: 10000 });

    // Single-page onboarding form with sections
    await expect(page.getByRole('heading', { name: 'Welcome, Insurance Broker' })).toBeVisible({ timeout: 10000 });

    // Brokerage Details section
    await expect(page.getByRole('heading', { name: 'Brokerage Details' })).toBeVisible();
    await page.getByPlaceholder('Enter your brokerage name').fill('Test Brokerage Inc.');
    await page.getByPlaceholder('Enter license number').fill('BRK-54321');
    await page.locator('input[placeholder="City, State"]').fill('Houston, TX');

    // Administrator Account section
    await expect(page.getByRole('heading', { name: 'Administrator Account' })).toBeVisible();
    await page.getByPlaceholder('Enter your full name').fill('Test Broker Admin');
    await page.getByPlaceholder('Enter your email address').fill('admin@testbrokerage.com');
    await page.getByPlaceholder('(555) 123-4567').fill('555-777-8888');
    await page.getByPlaceholder('Create a password').fill('SecurePass123!');
    await page.getByPlaceholder('Confirm your password').fill('SecurePass123!');

    // Submit (team invitations optional)
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

    // Should redirect to broker dashboard
    await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });
  });

  test('Broker onboarding skip flow', async ({ page }) => {
    // Start with a fresh Broker user
    await loginAs(page, 'fresh.broker@test.forsured.com');
    await expect(page).toHaveURL(/\/broker\/onboarding/, { timeout: 10000 });

    // Click skip button
    await page.getByRole('button', { name: 'Skip for now' }).click();

    // Should redirect to broker dashboard
    await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });
  });

  test('Broker onboarding with team invitations', async ({ page }) => {
    // Start with a fresh Broker user
    await loginAs(page, 'fresh.broker@test.forsured.com');
    await expect(page).toHaveURL(/\/broker\/onboarding/, { timeout: 10000 });

    // Fill required fields
    await page.getByPlaceholder('Enter your brokerage name').fill('Test Brokerage Inc.');
    await page.getByPlaceholder('Enter license number').fill('BRK-54321');
    await page.locator('input[placeholder="City, State"]').fill('Houston, TX');
    await page.getByPlaceholder('Enter your full name').fill('Test Broker Admin');
    await page.getByPlaceholder('Enter your email address').fill('admin@testbrokerage.com');
    await page.getByPlaceholder('(555) 123-4567').fill('555-777-8888');
    await page.getByPlaceholder('Create a password').fill('SecurePass123!');
    await page.getByPlaceholder('Confirm your password').fill('SecurePass123!');

    // Add team member invitation
    await expect(page.getByRole('heading', { name: 'Invite Team Members' })).toBeVisible();
    await page.getByPlaceholder('colleague@example.com').fill('team@testbrokerage.com');
    await page.getByRole('button', { name: 'Add team member' }).click();

    // Verify team member was added
    await expect(page.getByText('Pending Invitations (1)')).toBeVisible();
    await expect(page.getByText('team@testbrokerage.com')).toBeVisible();

    // Submit
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

    // Should redirect to broker dashboard
    await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });
  });
});
