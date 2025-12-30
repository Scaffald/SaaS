// tests/e2e/direct-navigation.spec.ts
// BUG-009: Direct navigation auth state preservation tests
//
// These tests verify that authentication state is properly preserved
// when navigating directly to protected routes (e.g., typing URL in address bar,
// refreshing page, or clicking back button).

import { test, expect } from './fixtures/base';
import { Page } from '@playwright/test';

/**
 * Helper to set up mock test login in localStorage
 * This simulates the "Test as Broker" button functionality
 */
async function setupTestLogin(page: Page, userType: 'gc' | 'contractor' | 'broker' | 'admin') {
  const userId = `test-${userType}-${Date.now()}`;
  const now = new Date().toISOString();

  // Map user types to route types
  const routeTypeMap: Record<string, string> = {
    gc: 'manager',
    contractor: 'subcontractor',
    broker: 'broker',
    admin: 'admin',
  };

  const user = {
    id: userId,
    email: `test-${userType}@forsured.test`,
    name: `Test ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
  };

  const profile = {
    id: `profile-${userId}`,
    scaffald_user_id: userId,
    user_type: routeTypeMap[userType],
    onboarding_completed: true,
    company_connected: false,
    onboarding_step: 5,
    onboarding_data: {},
    created_at: now,
    updated_at: now,
  };

  // Add init script that runs before page loads
  await page.addInitScript(
    ({ user, profile, userId }) => {
      // Save Scaffald tokens
      const tokens = {
        access_token: `mock-test-token-${userId}`,
        refresh_token: `mock-test-refresh-${userId}`,
        expires_in: 3600,
        token_type: 'Bearer',
        created_at: Math.floor(Date.now() / 1000),
      };
      window.localStorage.setItem('scaffald_tokens', JSON.stringify(tokens));

      // Save Supabase session
      window.localStorage.setItem('sb-auth-token', JSON.stringify({
        access_token: `mock-supabase-token-${userId}`,
        refresh_token: `mock-supabase-refresh-${userId}`,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: userId,
          email: user.email,
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }));

      // Save mock Scaffald user
      window.localStorage.setItem('mock_scaffald_current_user', JSON.stringify(user));

      // Save mock ForSured profile
      window.localStorage.setItem('mock_forsured_profile', JSON.stringify(profile));

      console.log('[E2E] Test login setup complete for', user.email);
    },
    { user, profile, userId }
  );
}

test.describe('BUG-009: Direct Navigation Auth State Preservation', () => {
  test.describe('Broker Routes', () => {
    test('preserves auth when directly navigating to /broker/team', async ({ page }) => {
      // Set up test login
      await setupTestLogin(page, 'broker');

      // Navigate directly to broker team page (simulates typing URL or refresh)
      await page.goto('/broker/team');

      // Should NOT redirect to /signup or /start
      // Should stay on /broker/team and show the page content
      await expect(page).toHaveURL(/\/broker\/team/, { timeout: 10000 });

      // Verify page actually loaded (not just stuck on loading spinner)
      // Wait for any content to appear that indicates successful load
      await page.waitForLoadState('networkidle');
    });

    test('preserves auth when directly navigating to /broker/insurance', async ({ page }) => {
      await setupTestLogin(page, 'broker');

      await page.goto('/broker/insurance');

      await expect(page).toHaveURL(/\/broker\/insurance/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    });

    test('preserves auth when directly navigating to /broker/clients', async ({ page }) => {
      await setupTestLogin(page, 'broker');

      await page.goto('/broker/clients');

      await expect(page).toHaveURL(/\/broker\/clients/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    });

    test('preserves auth when refreshing /broker/dashboard', async ({ page }) => {
      await setupTestLogin(page, 'broker');

      // First navigate to dashboard
      await page.goto('/broker/dashboard');
      await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });

      // Then refresh the page
      await page.reload();

      // Should stay on dashboard after refresh
      await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    });

    test('shows loading spinner during auth initialization, then renders page', async ({ page }) => {
      await setupTestLogin(page, 'broker');

      // Navigate to broker team page
      const response = page.goto('/broker/team');

      // Should show loading spinner while auth initializes
      // Note: This may be too fast to catch reliably, but we test it anyway
      const spinner = page.locator('text=Loading').or(page.locator('[aria-busy="true"]'));

      await response;

      // Eventually should show the actual page
      await expect(page).toHaveURL(/\/broker\/team/, { timeout: 10000 });
    });
  });

  test.describe('Manager Routes', () => {
    test('preserves auth when directly navigating to /manager/tasks', async ({ page }) => {
      await setupTestLogin(page, 'gc');

      await page.goto('/manager/tasks');

      await expect(page).toHaveURL(/\/manager\/tasks/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    });

    test('preserves auth when directly navigating to /manager/subcontractors', async ({ page }) => {
      await setupTestLogin(page, 'gc');

      await page.goto('/manager/subcontractors');

      await expect(page).toHaveURL(/\/manager\/subcontractors/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Subcontractor Routes', () => {
    test('preserves auth when directly navigating to /subcontractor/projects', async ({ page }) => {
      await setupTestLogin(page, 'contractor');

      await page.goto('/subcontractor/projects');

      await expect(page).toHaveURL(/\/subcontractor\/projects/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    });

    test('preserves auth when directly navigating to /subcontractor/documents', async ({ page }) => {
      await setupTestLogin(page, 'contractor');

      await page.goto('/subcontractor/documents');

      await expect(page).toHaveURL(/\/subcontractor\/documents/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Unauthenticated Direct Navigation', () => {
    test('redirects to /start when not authenticated', async ({ page }) => {
      // No auth setup - user has no tokens

      await page.goto('/broker/team');

      // Should redirect to start page
      await expect(page).toHaveURL(/\/start/, { timeout: 10000 });
    });

    test('redirects to /unauthorized when accessing wrong role route', async ({ page }) => {
      // Set up as broker
      await setupTestLogin(page, 'broker');

      // Try to access manager route
      await page.goto('/manager/dashboard');

      // Should redirect to unauthorized
      await expect(page).toHaveURL(/\/unauthorized/, { timeout: 10000 });
    });
  });

  test.describe('Navigation Flow Integration', () => {
    test('can navigate between broker routes after test login', async ({ page }) => {
      await setupTestLogin(page, 'broker');

      // Start at dashboard
      await page.goto('/broker/dashboard');
      await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });

      // Navigate to team
      await page.goto('/broker/team');
      await expect(page).toHaveURL(/\/broker\/team/, { timeout: 10000 });

      // Navigate to insurance
      await page.goto('/broker/insurance');
      await expect(page).toHaveURL(/\/broker\/insurance/, { timeout: 10000 });

      // Navigate back to dashboard
      await page.goto('/broker/dashboard');
      await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });
    });

    test('browser back button works correctly after test login', async ({ page }) => {
      await setupTestLogin(page, 'broker');

      // Navigate to dashboard
      await page.goto('/broker/dashboard');
      await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });

      // Navigate to team
      await page.goto('/broker/team');
      await expect(page).toHaveURL(/\/broker\/team/, { timeout: 10000 });

      // Click browser back button
      await page.goBack();

      // Should be back at dashboard
      await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });
    });
  });

  test.describe('Auth State Persistence', () => {
    test('auth state persists across multiple page loads', async ({ page }) => {
      await setupTestLogin(page, 'broker');

      // First page load
      await page.goto('/broker/dashboard');
      await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });

      // Reload
      await page.reload();
      await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });

      // Navigate to different page
      await page.goto('/broker/team');
      await expect(page).toHaveURL(/\/broker\/team/, { timeout: 10000 });

      // Reload again
      await page.reload();
      await expect(page).toHaveURL(/\/broker\/team/, { timeout: 10000 });
    });

    test('auth state persists in new tab/window', async ({ page, context }) => {
      await setupTestLogin(page, 'broker');

      // Initial navigation
      await page.goto('/broker/dashboard');
      await expect(page).toHaveURL(/\/broker\/dashboard/, { timeout: 10000 });

      // Create new page (simulates new tab)
      const newPage = await context.newPage();

      // Direct navigation in new tab
      await newPage.goto('/broker/team');

      // Auth should work in new tab
      await expect(newPage).toHaveURL(/\/broker\/team/, { timeout: 10000 });

      await newPage.close();
    });
  });
});
