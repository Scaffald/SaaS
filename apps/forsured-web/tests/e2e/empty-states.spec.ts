// tests/e2e/empty-states.spec.ts
// Phase 5: Empty States E2E Tests
// Tests that authenticated users can access pages that show empty states
//
// NOTE: Uses 'active.*' test users who have completed onboarding.
// These tests verify the auth flow and page routing work correctly.

import { test, expect } from '@playwright/test';
import { setupAuthAs } from '../utils/auth';

test.describe('Empty States', () => {

  // GC Empty States - using active.gc user (onboarding completed)
  test('GC can access dashboard', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/dashboard');
    await expect(page).toHaveURL(/\/manager\/dashboard/);
  });

  test('GC can access projects page', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/projects');
    await expect(page).toHaveURL(/\/manager\/projects/);
  });

  test('GC can access subcontractors page', async ({ page }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/subcontractors');
    await expect(page).toHaveURL(/\/manager\/subcontractors/);
  });

  // Contractor Empty States - using active.contractor user (onboarding completed)
  test('Contractor can access dashboard', async ({ page }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
    await page.goto('/subcontractor/dashboard');
    await expect(page).toHaveURL(/\/subcontractor\/dashboard/);
  });

  test('Contractor can access tasks page', async ({ page }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
    await page.goto('/subcontractor/tasks');
    await expect(page).toHaveURL(/\/subcontractor\/tasks/);
  });

  test('Contractor can access documents page', async ({ page }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
    await page.goto('/subcontractor/documents');
    await expect(page).toHaveURL(/\/subcontractor\/documents/);
  });

  // Broker Empty States - using active.broker user (onboarding completed)
  test('Broker can access dashboard', async ({ page }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
    await page.goto('/broker/dashboard');
    await expect(page).toHaveURL(/\/broker\/dashboard/);
  });

  test('Broker can access clients page', async ({ page }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
    await page.goto('/broker/clients');
    await expect(page).toHaveURL(/\/broker\/clients/);
  });
});
