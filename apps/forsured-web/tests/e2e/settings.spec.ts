// tests/e2e/settings.spec.ts
// Phase 5: Settings Pages E2E Tests
// Tests that authenticated users can access settings pages
//
// NOTE: Uses 'active.*' test users who have completed onboarding.
// These tests verify the auth flow and page routing work correctly.

import { test, expect } from './fixtures/base';

test.describe('Settings Pages', () => {

  // GC Settings Tests
  test('GC can access profile settings', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/settings/profile');
    await expect(page).toHaveURL(/\/manager\/settings\/profile/);
  });

  test('GC can access company settings', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/settings/company');
    await expect(page).toHaveURL(/\/manager\/settings\/company/);
  });

  test('GC can access insurance settings', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/settings/insurance');
    await expect(page).toHaveURL(/\/manager\/settings\/insurance/);
  });

  // Contractor Settings Tests
  test('Contractor can access profile settings', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
    await page.goto('/subcontractor/settings/profile');
    await expect(page).toHaveURL(/\/subcontractor\/settings\/profile/);
  });

  test('Contractor can access company settings', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.contractor@test.forsured.com');
    await page.goto('/subcontractor/settings/company');
    await expect(page).toHaveURL(/\/subcontractor\/settings\/company/);
  });

  // Broker Settings Tests
  test('Broker can access profile settings', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
    await page.goto('/broker/settings/profile');
    await expect(page).toHaveURL(/\/broker\/settings\/profile/);
  });

  test('Broker can access agency settings', async ({ page, setupAuthAs }) => {
    await setupAuthAs(page, 'active.broker@test.forsured.com');
    await page.goto('/broker/settings/agency');
    await expect(page).toHaveURL(/\/broker\/settings\/agency/);
  });
});
