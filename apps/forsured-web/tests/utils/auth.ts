// tests/utils/auth.ts
// ============================================================================
// CENTRAL AUTH HANDLER FOR E2E TESTS
// ============================================================================
//
// This is the single entry point for test authentication. It auto-detects the
// authentication mode based on VITE_FORSURED_USE_OAUTH environment variable:
//
// - VITE_FORSURED_USE_OAUTH=false (default): Uses Supabase password auth
//   → Delegates to supabaseAuth.ts
//   → Uses signInWithPassword + localStorage session injection
//   → Matches the "Test Login" buttons on Start.tsx
//
// - VITE_FORSURED_USE_OAUTH=true: Uses httpOnly cookie auth (OAuth mode)
//   → Delegates to httpOnlyAuth.ts
//   → Creates httpOnly cookie sessions + mocks edge functions
//   → Matches production OAuth flow with Scaffald
//
// USAGE:
//   import { setupAuthAs, loginAs, TEST_USERS } from '../utils/auth';
//
//   test('example', async ({ page }) => {
//     await setupAuthAs(page, 'test-gc@forsured.test');
//     await page.goto('/manager/dashboard');
//   });
//
// REQ-9: Testing Policy - Always use real Supabase, no mocking internal services
// ============================================================================

import { Page } from '@playwright/test';

// Import from implementation modules
import {
  loginAs as supabaseLoginAs,
  setupAuthAs as supabaseSetupAuthAs,
  getTestUserProfile as supabaseGetTestUserProfile,
  TEST_USERS as SUPABASE_TEST_USERS,
} from './supabaseAuth';

import { setupHttpOnlyAuth } from './httpOnlyAuth';

// Re-export shared constants (same for both modes)
export { TEST_USERS, TEST_USER_IDS } from './supabaseAuth';

/**
 * Wait for profile to be loaded in React state
 *
 * Use this after setupAuthAs + navigation if you need to ensure profile is ready.
 * loginAs already calls this internally.
 *
 * @param page - Playwright page object
 * @param userType - The user type ('gc', 'contractor', 'broker', 'admin')
 * @param timeout - Max time to wait in ms (default 15000)
 */
export async function waitForProfileReady(page: Page, userType: string, timeout = 15000): Promise<void> {
  console.log(`[Auth] Waiting for profile to be ready (${userType})...`);

  try {
    // Wait for dashboard content - UI uses Text components, not semantic headings
    // We wait for the sidebar navigation OR dashboard text to be visible
    // These only render when ProtectedRoute allows access (profile loaded)
    await page.waitForFunction(
      () => {
        // Check for sidebar navigation (all dashboard layouts have this)
        const hasSidebar = document.querySelector('[data-testid="sidebar"], nav');
        if (hasSidebar) return true;

        // Check for dashboard text content
        const bodyText = document.body.textContent || '';
        if (bodyText.includes('Dashboard') && !bodyText.includes('Welcome to ForSured')) {
          return true;
        }

        // Check for common dashboard elements
        const hasProjects = bodyText.includes('Projects') || bodyText.includes('Tasks');
        const hasNavLinks = document.querySelectorAll('a[href*="/dashboard"], a[href*="/projects"]').length > 0;
        return hasProjects || hasNavLinks;
      },
      { timeout }
    );

    console.log('[Auth] Profile ready - dashboard content visible');
  } catch (error) {
    console.warn('[Auth] Timeout waiting for profile - continuing anyway');
  }
}

/**
 * Detect authentication mode from environment variable
 * In Playwright tests, we read from process.env (Node.js context)
 */
function useOAuthMode(): boolean {
  return process.env.VITE_FORSURED_USE_OAUTH === 'true';
}

/**
 * Log in as a test user using the appropriate auth method
 *
 * Automatically detects auth mode from VITE_FORSURED_USE_OAUTH:
 * - false: Uses Supabase password auth (supabaseAuth.ts)
 * - true: Uses httpOnly cookie auth (httpOnlyAuth.ts)
 *
 * @param page - Playwright page object
 * @param email - Test user email (legacy or new format, must be in TEST_USERS)
 * @param options - Optional settings (navigate: boolean)
 */
export async function loginAs(
  page: Page,
  email: string,
  options: { navigate?: boolean } = { navigate: true }
): Promise<void> {
  if (useOAuthMode()) {
    console.log('[Auth] Using OAuth mode (httpOnly cookies)');
    // httpOnlyAuth doesn't have navigation option, so we handle it here
    await setupHttpOnlyAuth(page, email);

    if (options.navigate !== false) {
      const user = SUPABASE_TEST_USERS[email];
      if (!user) {
        throw new Error(`Unknown test user: ${email}`);
      }

      const pathMap: Record<string, string> = {
        gc: 'manager',
        contractor: 'subcontractor',
        broker: 'broker',
        admin: 'admin',
      };
      const pathSegment = pathMap[user.user_type];

      if (user.user_type === 'admin') {
        await page.goto('/admin/dashboard');
      } else if (!user.onboarding_completed) {
        await page.goto(`/${pathSegment}/onboarding`);
      } else {
        await page.goto(`/${pathSegment}/dashboard`);
      }

      await page.waitForLoadState('networkidle');

      // CRITICAL: Wait for profile to be loaded in React state
      await waitForProfileReady(page, user.user_type);
    }
  } else {
    console.log('[Auth] Using Supabase password auth mode');
    await supabaseLoginAs(page, email, options);
  }
}

/**
 * Log in as a test user without navigation
 * Useful when you need to set up auth before navigating to a specific page.
 *
 * Automatically detects auth mode from VITE_FORSURED_USE_OAUTH.
 *
 * @param page - Playwright page object
 * @param email - Test user email (legacy or new format, must be in TEST_USERS)
 */
export async function setupAuthAs(page: Page, email: string): Promise<void> {
  if (useOAuthMode()) {
    console.log('[Auth] Using OAuth mode (httpOnly cookies)');
    await setupHttpOnlyAuth(page, email);
  } else {
    console.log('[Auth] Using Supabase password auth mode');
    await supabaseSetupAuthAs(page, email);
  }
}

/**
 * Get the profile for a test user
 *
 * @param email - Test user email
 * @returns Test user profile or undefined if not found
 */
export function getTestUserProfile(email: string) {
  return supabaseGetTestUserProfile(email);
}

/**
 * Check which auth mode is active
 * Useful for debugging and conditional test logic
 */
export function getAuthMode(): 'oauth' | 'supabase' {
  return useOAuthMode() ? 'oauth' : 'supabase';
}
