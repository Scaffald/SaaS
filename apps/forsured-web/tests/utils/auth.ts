// tests/utils/auth.ts
// Test user authentication utilities for E2E tests
//
// Supports two modes:
// 1. Mock mode (default): Uses mock tokens and API interception
// 2. Real database mode: Uses real Supabase profiles with mock Scaffald auth
//
// Set REAL_DB_TESTS=true in playwright.config.ts to use real database mode.

import { Page } from '@playwright/test';

const TOKEN_KEY = 'scaffald_tokens';
const TEST_USER_KEY = 'e2e_test_user';

// Use real database for profiles (vs mocked API responses)
const USE_REAL_DATABASE = process.env.REAL_DB_TESTS === 'true';

/**
 * Test user IDs - matches scripts/seed/users.ts
 */
export const TEST_USER_IDS = {
  // GC Users
  FRESH_GC: '10000000-0000-0000-0000-000000000001',
  ONBOARDING_GC: '10000000-0000-0000-0000-000000000002',
  ACTIVE_GC: '10000000-0000-0000-0000-000000000003',
  MULTIPROJECT_GC: '10000000-0000-0000-0000-000000000004',
  // Contractor Users
  FRESH_CONTRACTOR: '20000000-0000-0000-0000-000000000001',
  ACTIVE_CONTRACTOR: '20000000-0000-0000-0000-000000000002',
  NONCOMPLIANT_CONTRACTOR: '20000000-0000-0000-0000-000000000003',
  // Broker Users
  FRESH_BROKER: '30000000-0000-0000-0000-000000000001',
  ACTIVE_BROKER: '30000000-0000-0000-0000-000000000002',
  // Admin Users
  ADMIN: '40000000-0000-0000-0000-000000000001',
} as const;

/**
 * Test user profiles - maps email to user data
 * These match the seed data in scripts/seed/users.ts
 */
export const TEST_USERS: Record<
  string,
  {
    id: string;
    email: string;
    name: string;
    user_type: 'gc' | 'contractor' | 'broker' | 'admin';
    onboarding_completed: boolean;
    onboarding_step: number;
    company_connected: boolean;
  }
> = {
  // GC Users
  'fresh.gc@test.forsured.com': {
    id: TEST_USER_IDS.FRESH_GC,
    email: 'fresh.gc@test.forsured.com',
    name: 'Fresh GC User',
    user_type: 'gc',
    onboarding_completed: false,
    onboarding_step: 1,
    company_connected: false,
  },
  'onboarding.gc@test.forsured.com': {
    id: TEST_USER_IDS.ONBOARDING_GC,
    email: 'onboarding.gc@test.forsured.com',
    name: 'Onboarding GC User',
    user_type: 'gc',
    onboarding_completed: false,
    onboarding_step: 2,
    company_connected: false,
  },
  'active.gc@test.forsured.com': {
    id: TEST_USER_IDS.ACTIVE_GC,
    email: 'active.gc@test.forsured.com',
    name: 'Active GC User',
    user_type: 'gc',
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  'multiproject.gc@test.forsured.com': {
    id: TEST_USER_IDS.MULTIPROJECT_GC,
    email: 'multiproject.gc@test.forsured.com',
    name: 'Multi-Project GC User',
    user_type: 'gc',
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  // Contractor Users
  'fresh.contractor@test.forsured.com': {
    id: TEST_USER_IDS.FRESH_CONTRACTOR,
    email: 'fresh.contractor@test.forsured.com',
    name: 'Fresh Contractor User',
    user_type: 'contractor',
    onboarding_completed: false,
    onboarding_step: 1,
    company_connected: false,
  },
  'active.contractor@test.forsured.com': {
    id: TEST_USER_IDS.ACTIVE_CONTRACTOR,
    email: 'active.contractor@test.forsured.com',
    name: 'Active Contractor User',
    user_type: 'contractor',
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  'noncompliant.contractor@test.forsured.com': {
    id: TEST_USER_IDS.NONCOMPLIANT_CONTRACTOR,
    email: 'noncompliant.contractor@test.forsured.com',
    name: 'Non-Compliant Contractor User',
    user_type: 'contractor',
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  // Broker Users
  'fresh.broker@test.forsured.com': {
    id: TEST_USER_IDS.FRESH_BROKER,
    email: 'fresh.broker@test.forsured.com',
    name: 'Fresh Broker User',
    user_type: 'broker',
    onboarding_completed: false,
    onboarding_step: 1,
    company_connected: false,
  },
  'active.broker@test.forsured.com': {
    id: TEST_USER_IDS.ACTIVE_BROKER,
    email: 'active.broker@test.forsured.com',
    name: 'Active Broker User',
    user_type: 'broker',
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  // Admin User
  'admin@test.forsured.com': {
    id: TEST_USER_IDS.ADMIN,
    email: 'admin@test.forsured.com',
    name: 'Admin User',
    user_type: 'admin',
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
};

/**
 * Set up mock Scaffald tokens in localStorage
 * This simulates a user who has completed OAuth and has valid tokens.
 */
async function setupMockTokens(page: Page) {
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
    },
    { tokenKey: TOKEN_KEY }
  );
}

/**
 * Set up E2E test user in localStorage
 * The mock Scaffald client will use this to return the correct user ID.
 *
 * Includes organization_id and companies array for settings pages.
 */
async function setupTestUser(
  page: Page,
  user: (typeof TEST_USERS)[string]
) {
  const organizationId = `org-${user.id}`;
  const companyId = `company-${user.id}`;

  await page.addInitScript(
    ({ testUserKey, testUser }) => {
      window.localStorage.setItem(testUserKey, JSON.stringify(testUser));
      console.log('[E2E] Test user set:', testUser.email);
    },
    {
      testUserKey: TEST_USER_KEY,
      testUser: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: null,
        // Include organization and company data for settings pages
        organization_id: organizationId,
        companies: user.company_connected
          ? [
              {
                company_id: companyId,
                name: `${user.name}'s Company`,
                role: user.user_type === 'gc' ? 'owner' : 'member',
              },
            ]
          : [],
      },
    }
  );
}

/**
 * Set up mock Supabase API responses for forsured schema (mock mode only)
 * This intercepts calls to user_profiles and settings tables.
 *
 * PostgREST schema selection uses Accept-Profile header:
 * - Accept-Profile: forsured (for forsured schema tables)
 * - Accept-Profile: scaffald (for scaffald schema tables)
 */
async function setupMockProfile(
  page: Page,
  profile: (typeof TEST_USERS)[string]
) {
  const fullProfile = {
    id: `profile-${profile.id}`,
    scaffald_user_id: profile.id,
    user_type: mapUserTypeToDb(profile.user_type),
    onboarding_completed: profile.onboarding_completed,
    onboarding_step: profile.onboarding_step,
    company_connected: profile.company_connected,
    onboarding_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Default mock settings
  const userSettings = {
    id: `usettings-${profile.id}`,
    user_id: fullProfile.id,
    notification_preferences: {
      emailOnNewProject: true,
      emailOnComplianceIssue: true,
      emailDigestFrequency: 'weekly',
    },
    ui_preferences: {
      phone: '',
      theme: 'light',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const gcSettings = {
    id: `gcsettings-${profile.id}`,
    organization_id: `org-${profile.id}`,
    default_insurance_requirements: {},
    require_additional_insured: false,
    require_waiver_of_subrogation: false,
    auto_send_reminders: true,
    reminder_days_before: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const contractorSettings = {
    id: `contractorsettings-${profile.id}`,
    organization_id: `org-${profile.id}`,
    auto_share_documents: false,
    insurance_agent_info: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const brokerSettings = {
    id: `brokersettings-${profile.id}`,
    broker_id: fullProfile.id,
    agency_info: {},
    auto_assign_clients: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  /**
   * Check if request is for forsured schema
   */
  function isForsuredSchema(headers: Record<string, string>): boolean {
    // PostgREST uses Accept-Profile header for schema selection
    const acceptProfile = headers['accept-profile'] || '';
    return acceptProfile === 'forsured' || acceptProfile === '';
  }

  /**
   * Generic handler for table requests
   */
  function createTableHandler(tableName: string, mockData: Record<string, unknown>) {
    return async (route: import('@playwright/test').Route) => {
      const method = route.request().method();
      const headers = route.request().headers();

      // Only handle forsured schema requests
      if (!isForsuredSchema(headers)) {
        return route.continue();
      }

      const acceptHeader = headers['accept'] || '';
      const isSingleQuery = acceptHeader.includes('vnd.pgrst.object');

      console.log(`[E2E Mock] ${method} ${tableName} (forsured schema)`);

      // GET request
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? mockData : [mockData]),
        });
      }

      // PATCH/PUT request
      if (method === 'PATCH' || method === 'PUT') {
        const body = route.request().postData();
        let updates = {};
        if (body) {
          try {
            updates = JSON.parse(body);
          } catch {
            // Ignore parse errors
          }
        }
        const updatedData = {
          ...mockData,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? updatedData : [updatedData]),
        });
      }

      // POST request
      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(isSingleQuery ? mockData : [mockData]),
        });
      }

      // Default - let it through
      return route.continue();
    };
  }

  // Set up routes for all forsured schema tables
  await page.route('**/rest/v1/user_profiles*', createTableHandler('user_profiles', fullProfile));
  await page.route('**/rest/v1/user_settings*', createTableHandler('user_settings', userSettings));
  await page.route('**/rest/v1/gc_settings*', createTableHandler('gc_settings', gcSettings));
  await page.route('**/rest/v1/contractor_settings*', createTableHandler('contractor_settings', contractorSettings));
  await page.route('**/rest/v1/broker_settings*', createTableHandler('broker_settings', brokerSettings));
}

/**
 * Map user_type from test format to database format
 */
function mapUserTypeToDb(
  userType: 'gc' | 'contractor' | 'broker' | 'admin'
): string {
  // Database uses 'gc' and 'contractor', not 'manager' and 'subcontractor'
  return userType;
}

/**
 * Map user_type to URL path segment
 */
function mapUserTypeToPath(
  userType: 'gc' | 'contractor' | 'broker' | 'admin'
): string {
  const paths: Record<string, string> = {
    gc: 'manager',
    contractor: 'subcontractor',
    broker: 'broker',
    admin: 'admin',
  };
  return paths[userType];
}

/**
 * Log in as a test user
 *
 * @param page - Playwright page object
 * @param email - Test user email (must be in TEST_USERS)
 * @param options - Optional settings
 */
export async function loginAs(
  page: Page,
  email: string,
  options: { navigate?: boolean } = { navigate: true }
) {
  const user = TEST_USERS[email];

  if (!user) {
    throw new Error(
      `Unknown test user: ${email}. Available users: ${Object.keys(TEST_USERS).join(', ')}`
    );
  }

  // Set up mock Scaffald tokens
  await setupMockTokens(page);

  // Set up E2E test user for mock Scaffald client
  await setupTestUser(page, user);

  // In mock mode, also set up mock Supabase responses
  if (!USE_REAL_DATABASE) {
    await setupMockProfile(page, user);
  }

  // Navigate to appropriate page if requested
  if (options.navigate !== false) {
    const pathSegment = mapUserTypeToPath(user.user_type);

    if (user.user_type === 'admin') {
      await page.goto('/admin/dashboard');
    } else if (!user.onboarding_completed) {
      await page.goto(`/${pathSegment}/onboarding`);
    } else {
      await page.goto(`/${pathSegment}/dashboard`);
    }
  }
}

/**
 * Log in as a test user without navigation
 * Useful when you need to set up auth before navigating to a specific page.
 */
export async function setupAuthAs(page: Page, email: string) {
  return loginAs(page, email, { navigate: false });
}

/**
 * Get the profile for a test user
 */
export function getTestUserProfile(email: string) {
  return TEST_USERS[email];
}

/**
 * Check if tests are using real database mode
 */
export function isUsingRealDatabase() {
  return USE_REAL_DATABASE;
}
