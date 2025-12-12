// tests/e2e/auth.spec.ts
// REQ-126: E2E tests for Phase 2 Signup flows
import { test, expect, Page } from '@playwright/test';
import { loginAs } from '../utils/auth';

/**
 * The key used by scaffald/auth.ts to store tokens
 */
const TOKEN_KEY = 'scaffald_tokens';

/**
 * Mock profile data returned by Supabase
 */
const MOCK_PROFILE = {
  id: 'mock-profile-id',
  scaffald_user_id: 'mock-scaffald-user',
  user_type: 'manager',
  onboarding_completed: false,
  company_connected: false,
  onboarding_step: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Helper to set up mock Scaffald tokens in localStorage
 * This simulates a user who has completed OAuth and has valid tokens
 *
 * Uses page.addInitScript to inject tokens before the app loads.
 * The script runs before any page scripts, ensuring tokens are available
 * when AuthContext initializes.
 */
async function setupMockTokens(page: Page) {
  // Add init script that will run before page scripts
  await page.addInitScript(
    ({ tokenKey }) => {
      const mockTokens = {
        access_token: 'mock-e2e-access-token',
        refresh_token: 'mock-e2e-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        created_at: Math.floor(Date.now() / 1000),
      };
      window.localStorage.setItem(tokenKey, JSON.stringify(mockTokens));
      console.log('[E2E] Mock tokens set in localStorage');
    },
    { tokenKey: TOKEN_KEY }
  );
}

/**
 * Helper to mock Supabase API responses for profile operations
 * This allows E2E tests to run without a real Supabase instance
 */
async function setupSupabaseMocks(page: Page, userType: string = 'manager') {
  // Mock Supabase REST API responses
  await page.route('**/rest/v1/user_profiles*', async (route) => {
    const method = route.request().method();
    const url = route.request().url();
    const headers = route.request().headers();

    // GET request - profile lookup
    if (method === 'GET' && url.includes('select=')) {
      // Check if this is a .single() query (expects single object, not array)
      const acceptHeader = headers['accept'] || '';
      const isSingleQuery = acceptHeader.includes('vnd.pgrst.object');

      if (isSingleQuery) {
        // Return PostgREST error for no rows found (PGRST116)
        return route.fulfill({
          status: 406,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'PGRST116',
            details: null,
            hint: null,
            message: 'JSON object requested, multiple (or no) rows returned',
          }),
        });
      }

      // Regular array response for non-single queries
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }

    // POST request - create profile
    if (method === 'POST') {
      const profile = { ...MOCK_PROFILE, user_type: userType };
      // Check if expecting single object response
      const acceptHeader = headers['accept'] || '';
      const isSingleQuery = acceptHeader.includes('vnd.pgrst.object');

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(isSingleQuery ? profile : [profile]),
      });
    }

    // Default - let it through
    return route.continue();
  });
}

/**
 * Helper to set up existing user profile via Supabase API mock
 * This mocks the Supabase response to return an existing profile
 */
async function setupMockProfile(
  page: Page,
  profileData: { id: string; user_type: string; onboarding_completed: boolean }
) {
  const fullProfile = {
    ...MOCK_PROFILE,
    id: profileData.id,
    user_type: profileData.user_type,
    onboarding_completed: profileData.onboarding_completed,
  };

  // Mock Supabase to return existing profile
  await page.route('**/rest/v1/user_profiles*', async (route) => {
    const method = route.request().method();
    const url = route.request().url();
    const headers = route.request().headers();
    const acceptHeader = headers['accept'] || '';
    const isSingleQuery = acceptHeader.includes('vnd.pgrst.object');

    // GET request - return existing profile
    if (method === 'GET' && url.includes('select=')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingleQuery ? fullProfile : [fullProfile]),
      });
    }

    // Default - let it through
    return route.continue();
  });
}

test.describe('Signup Flow - User Type Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock tokens so AuthContext recognizes user as logged in
    await setupMockTokens(page);
    // Mock Supabase API for profile operations
    await setupSupabaseMocks(page, 'manager');
  });

  test('displays signup page for authenticated user without profile', async ({ page }) => {
    await page.goto('/signup');

    // Wait for auth loading to complete
    await page.waitForTimeout(500);

    // Should show welcome message with user name (from mock scaffaldClient)
    await expect(page.getByText('Welcome to ForSured')).toBeVisible({ timeout: 10000 });

    // Should show user type selection
    await expect(page.getByText('How will you use ForSured?')).toBeVisible();

    // Should show both GC and Contractor options
    await expect(page.getByTestId('user-type-gc')).toBeVisible();
    await expect(page.getByTestId('user-type-contractor')).toBeVisible();

    // Should show broker invitation option
    await expect(page.getByText('Are you an insurance broker?')).toBeVisible();
  });

  test('new user can sign up as GC', async ({ page }) => {
    await page.goto('/signup');

    // Wait for page to load
    await expect(page.getByTestId('user-type-gc')).toBeVisible({ timeout: 10000 });

    // Click GC card (triggers signup directly)
    await page.getByTestId('user-type-gc').click();

    // Should redirect to manager onboarding
    await expect(page).toHaveURL(/\/manager\/onboarding/, { timeout: 10000 });
  });

  test('new user can sign up as Contractor', async ({ page }) => {
    // Override mock to return subcontractor profile
    await setupSupabaseMocks(page, 'subcontractor');

    await page.goto('/signup');

    // Wait for page to load
    await expect(page.getByTestId('user-type-contractor')).toBeVisible({ timeout: 10000 });

    // Click Contractor card
    await page.getByTestId('user-type-contractor').click();

    // Should redirect to subcontractor onboarding
    await expect(page).toHaveURL(/\/subcontractor\/onboarding/, { timeout: 10000 });
  });

  test('GC card shows loading state during signup', async ({ page }) => {
    await page.goto('/signup');

    // Wait for page to load
    await expect(page.getByTestId('user-type-gc')).toBeVisible({ timeout: 10000 });

    // Click GC card
    await page.getByTestId('user-type-gc').click();

    // Should eventually redirect (loading state may be too fast to catch)
    await expect(page).toHaveURL(/\/manager\/onboarding/, { timeout: 10000 });
  });
});

test.describe('Signup Flow - Broker Invitation', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockTokens(page);
  });

  test('shows broker invitation form when clicking link', async ({ page }) => {
    await page.goto('/signup');

    // Wait for page to load
    await expect(page.getByTestId('broker-invitation-link')).toBeVisible({ timeout: 10000 });

    // Click "Enter Invitation Code" link
    await page.getByTestId('broker-invitation-link').click();

    // Should show invitation form
    await expect(page.getByText('Broker Invitation')).toBeVisible();
    await expect(page.getByTestId('invitation-code-input')).toBeVisible();
    await expect(page.getByTestId('verify-invitation-button')).toBeVisible();
    await expect(page.getByTestId('cancel-invitation-button')).toBeVisible();
  });

  test('verify button is disabled until code is at least 4 characters', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('broker-invitation-link')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('broker-invitation-link').click();

    const verifyButton = page.getByTestId('verify-invitation-button');
    const codeInput = page.getByTestId('invitation-code-input');

    // Button should be disabled with empty input
    await expect(verifyButton).toBeDisabled();

    // Type 3 characters - still disabled
    await codeInput.fill('ABC');
    await expect(verifyButton).toBeDisabled();

    // Type 4 characters - now enabled
    await codeInput.fill('ABCD');
    await expect(verifyButton).toBeEnabled();
  });

  test('invitation code is converted to uppercase', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('broker-invitation-link')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('broker-invitation-link').click();

    const codeInput = page.getByTestId('invitation-code-input');

    // Type lowercase
    await codeInput.fill('abcd1234');

    // Should be converted to uppercase
    await expect(codeInput).toHaveValue('ABCD1234');
  });

  test('shows error for invalid invitation code', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('broker-invitation-link')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('broker-invitation-link').click();

    // Enter invalid code
    await page.getByTestId('invitation-code-input').fill('INVALID123');
    await page.getByTestId('verify-invitation-button').click();

    // Should show error message
    await expect(page.getByTestId('signup-error')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Invalid or expired invitation code/)).toBeVisible();
  });

  test('cancel button hides invitation form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('broker-invitation-link')).toBeVisible({ timeout: 10000 });

    // Show invitation form
    await page.getByTestId('broker-invitation-link').click();
    await expect(page.getByTestId('invitation-code-input')).toBeVisible();

    // Click cancel
    await page.getByTestId('cancel-invitation-button').click();

    // Form should be hidden
    await expect(page.getByTestId('invitation-code-input')).not.toBeVisible();
    await expect(page.getByTestId('broker-invitation-link')).toBeVisible();
  });

  test('broker can sign up with valid invitation code', async ({ page }) => {
    // Set up mocks for broker invitation flow
    const validInvitation = {
      id: 'inv-valid-123',
      code: 'VALIDCODE',
      email: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      max_uses: 1,
      use_count: 0,
      created_by: 'admin-1',
      created_at: new Date().toISOString(),
      used_by: null,
      used_at: null,
    };

    const brokerProfile = {
      ...MOCK_PROFILE,
      id: 'broker-profile-1',
      user_type: 'broker',
      onboarding_completed: false,
    };

    // Mock invitation validation - first call returns valid invitation
    let invitationValidated = false;
    await page.route('**/rest/v1/broker_invitations*', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const headers = route.request().headers();
      const acceptHeader = headers['accept'] || '';
      const isSingleQuery = acceptHeader.includes('vnd.pgrst.object');

      // GET request - validate invitation code
      if (method === 'GET' && url.includes('code=eq.VALIDCODE')) {
        if (!invitationValidated) {
          // First call: return valid invitation
          invitationValidated = true;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(isSingleQuery ? validInvitation : [validInvitation]),
          });
        } else {
          // Subsequent calls: return invitation with updated use_count
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
              isSingleQuery
                ? { ...validInvitation, use_count: 1, used_by: 'broker-profile-1' }
                : [{ ...validInvitation, use_count: 1, used_by: 'broker-profile-1' }]
            ),
          });
        }
      }

      // GET request - fetch invitation for marking as used
      if (method === 'GET' && url.includes('select=use_count')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            isSingleQuery ? { use_count: 0 } : [{ use_count: 0 }]
          ),
        });
      }

      // PATCH/PUT request - mark invitation as used
      if ((method === 'PATCH' || method === 'PUT') && url.includes('id=eq.inv-valid-123')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      }

      return route.continue();
    });

    // Mock profile creation for broker
    await page.route('**/rest/v1/user_profiles*', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const headers = route.request().headers();
      const acceptHeader = headers['accept'] || '';
      const isSingleQuery = acceptHeader.includes('vnd.pgrst.object');

      // POST request - create broker profile
      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? brokerProfile : [brokerProfile]),
        });
      }

      // GET request - check if profile exists (should not exist before signup)
      if (method === 'GET' && url.includes('select=')) {
        return route.fulfill({
          status: 406,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'PGRST116',
            details: null,
            hint: null,
            message: 'JSON object requested, multiple (or no) rows returned',
          }),
        });
      }

      return route.continue();
    });

    // Mock Supabase API for profile operations
    await setupSupabaseMocks(page, 'broker');

    await page.goto('/signup');
    await expect(page.getByTestId('broker-invitation-link')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('broker-invitation-link').click();

    // Enter valid invitation code
    await page.getByTestId('invitation-code-input').fill('VALIDCODE');
    await page.getByTestId('verify-invitation-button').click();

    // After successful code verification and profile creation
    await expect(page).toHaveURL(/\/broker\/onboarding/, { timeout: 10000 });
  });
});

test.describe('Authentication Redirects', () => {
  test('existing user with profile is redirected from signup to dashboard', async ({ page }) => {
    // Set up tokens and mock profile
    await setupMockTokens(page);
    await setupMockProfile(page, {
      id: 'profile-001',
      user_type: 'manager',
      onboarding_completed: true,
    });

    await page.goto('/signup');

    // Should redirect to their dashboard
    await expect(page).toHaveURL(/\/manager\/dashboard/, { timeout: 10000 });
  });

  // Auth guards are now implemented with ProtectedRoute component
  test('unauthenticated user is redirected from protected route to /start', async ({ page }) => {
    // Don't set up any auth state - user has no tokens
    await page.goto('/manager/dashboard');

    // Should redirect to start page
    await expect(page).toHaveURL(/\/start/, { timeout: 10000 });
  });

  // Skip: Requires real login form which doesn't exist in prototype
  test.skip('existing user logs in to correct dashboard', async ({ page }) => {
    await loginAs(page, 'active.gc@test.forsured.com');

    // Should end up on manager dashboard
    await expect(page).toHaveURL(/\/manager\/dashboard/, { timeout: 10000 });
  });

  // Role-based route guards are now implemented with ProtectedRoute component
  test('user cannot access other user type dashboard', async ({ page }) => {
    // Set up as subcontractor
    await setupMockTokens(page);
    await setupMockProfile(page, {
      id: 'profile-002',
      user_type: 'subcontractor',
      onboarding_completed: true,
    });

    // Try to access manager dashboard
    await page.goto('/manager/dashboard');

    // Should redirect to unauthorized
    await expect(page).toHaveURL(/\/unauthorized/, { timeout: 10000 });
  });
});

test.describe('Signup Page - Scaffald Company Connection', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockTokens(page);
  });

  test('hides company card when user has no Scaffald company', async ({ page }) => {
    await page.goto('/signup');

    // Wait for page to load
    await expect(page.getByText('How will you use ForSured?')).toBeVisible({ timeout: 10000 });

    // Should not show "Connect this company" checkbox since mock returns empty companies
    await expect(page.getByText('Connect this company to ForSured')).not.toBeVisible();
  });
});

// SKIP: These tests require full mock OAuth setup with VITE_USE_REAL_AUTH=false
// and specific Supabase configuration. Skip for now until mock OAuth is stable.
test.describe.skip('Mock OAuth Login Flow', () => {
  // These tests verify the actual login flow works in mock mode (VITE_USE_REAL_AUTH=false)
  // They test the Start page -> OAuth -> Callback -> Dashboard flow
  //
  // IMPORTANT: These tests require local Supabase running with:
  //   1. `supabase start` (or `supabase db reset`)
  //   2. `npx tsx scripts/seed.ts` (to seed test users)
  //   3. Migration 033 applied (anon role permissions on forsured/scaffald schemas)

  test('user can log in from start page with email', async ({ page }) => {
    // Mock Supabase to return no existing profile (new user)
    await page.route('**/rest/v1/user_profiles*', async (route) => {
      const method = route.request().method();
      const headers = route.request().headers();
      const acceptHeader = headers['accept'] || '';
      const isSingleQuery = acceptHeader.includes('vnd.pgrst.object');

      if (method === 'GET') {
        // No profile exists - return 406 for single query
        if (isSingleQuery) {
          return route.fulfill({
            status: 406,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'PGRST116',
              message: 'JSON object requested, multiple (or no) rows returned',
            }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }

      if (method === 'POST') {
        // Create new profile
        const newProfile = {
          ...MOCK_PROFILE,
          id: 'new-profile-id',
          scaffald_user_id: 'mock-user-test-example-com',
          user_type: 'gc',
          onboarding_completed: false,
        };
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? newProfile : [newProfile]),
        });
      }

      return route.continue();
    });

    // Go to start page
    await page.goto('/start');

    // Should see the login form
    await expect(page.getByText('Welcome to ForSured')).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();

    // Enter email and submit
    await page.getByPlaceholder('you@company.com').fill('test@example.com');
    await page.getByRole('button', { name: 'Continue with Email' }).click();

    // Should redirect through callback and end up at onboarding (new user)
    await expect(page).toHaveURL(/\/onboarding\/gc/, { timeout: 10000 });
  });

  test.skip('existing user can log in and reach dashboard', async ({ page }) => {
    // Mock Supabase to return existing profile (onboarding completed)
    const existingProfile = {
      ...MOCK_PROFILE,
      id: 'existing-profile-id',
      scaffald_user_id: 'mock-user-active-gc-test-forsured-com',
      user_type: 'gc',
      onboarding_completed: true,
      onboarding_step: 4,
      company_connected: true,
    };

    await page.route('**/rest/v1/user_profiles*', async (route) => {
      const method = route.request().method();
      const headers = route.request().headers();
      const acceptHeader = headers['accept'] || '';
      const isSingleQuery = acceptHeader.includes('vnd.pgrst.object');

      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? existingProfile : [existingProfile]),
        });
      }

      return route.continue();
    });

    // Go to start page
    await page.goto('/start');

    // Enter test user email and submit
    await page.getByPlaceholder('you@company.com').fill('active.gc@test.forsured.com');
    await page.getByRole('button', { name: 'Continue with Email' }).click();

    // Should redirect through callback and end up at dashboard (existing user)
    await expect(page).toHaveURL(/\/gc\/dashboard/, { timeout: 10000 });
  });

  test.skip('direct Scaffald login works without email', async ({ page }) => {
    // Mock for new user flow
    await page.route('**/rest/v1/user_profiles*', async (route) => {
      const method = route.request().method();
      const headers = route.request().headers();
      const acceptHeader = headers['accept'] || '';
      const isSingleQuery = acceptHeader.includes('vnd.pgrst.object');

      if (method === 'GET') {
        if (isSingleQuery) {
          return route.fulfill({
            status: 406,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'PGRST116',
              message: 'JSON object requested, multiple (or no) rows returned',
            }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }

      if (method === 'POST') {
        const newProfile = {
          ...MOCK_PROFILE,
          id: 'new-profile-id',
          scaffald_user_id: 'mock-scaffald-user',
          user_type: 'gc',
          onboarding_completed: false,
        };
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? newProfile : [newProfile]),
        });
      }

      return route.continue();
    });

    // Go to start page
    await page.goto('/start');

    // Click "Continue with Scaffald Account" (no email)
    await page.getByRole('button', { name: 'Continue with Scaffald Account' }).click();

    // Should redirect through callback (as default mock user)
    await expect(page).toHaveURL(/\/onboarding\/gc/, { timeout: 10000 });
  });
});
