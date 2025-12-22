// tests/utils/auth.ts
// Test user authentication utilities for E2E tests
//
// REQ-9: Testing Policy - Always use real Supabase, no mocking internal services
// Tests should use real Supabase database with seeded test users.
// Use test login buttons on /start page for authentication.

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
 * Create a mock JWT token with proper 3-part format (header.payload.signature)
 * This is needed because Supabase's JWT parsing expects the standard format.
 */
function createMockJWT(userId: string, email: string): string {
  // Header: { "alg": "HS256", "typ": "JWT" }
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

  // Payload with user info and claims
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    sub: userId,
    email: email,
    aud: 'authenticated',
    role: 'authenticated',
    iat: now,
    exp: now + 3600,
    iss: 'https://mock-supabase.test/auth/v1',
  }));

  // Signature (mock - not cryptographically valid but structurally correct)
  const signature = btoa(`mock-signature-${userId}`);

  return `${header}.${payload}.${signature}`;
}

/**
 * Set up mock Supabase session in localStorage
 * This is required for TRPC authentication to work in tests.
 * TRPC client gets auth headers from supabase.auth.getSession().
 */
async function setupSupabaseSession(
  page: Page,
  user: (typeof TEST_USERS)[string]
) {
  await page.addInitScript(
    ({ userId, userEmail }) => {
      // Helper to create mock JWT with proper 3-part format
      function createMockJWT(id: string, email: string): string {
        // Use a simpler base64 that works in browser
        const toBase64 = (obj: unknown) => btoa(JSON.stringify(obj));

        const header = toBase64({ alg: 'HS256', typ: 'JWT' });
        const now = Math.floor(Date.now() / 1000);
        const payload = toBase64({
          sub: id,
          email: email,
          aud: 'authenticated',
          role: 'authenticated',
          iat: now,
          exp: now + 3600,
          iss: 'https://mock-supabase.test/auth/v1',
        });
        const signature = toBase64({ sig: `mock-${id}` });

        return `${header}.${payload}.${signature}`;
      }

      // Create proper JWT tokens
      const accessToken = createMockJWT(userId, userEmail);
      const refreshToken = createMockJWT(userId + '-refresh', userEmail);

      // Create a mock Supabase session that matches the test user
      // This session will be used by TRPC client to add Authorization headers
      const mockSession = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: userId,
          email: userEmail,
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      // Store in Supabase auth storage
      const supabaseAuthKey = 'sb-auth-token';
      window.localStorage.setItem(
        supabaseAuthKey,
        JSON.stringify({
          access_token: mockSession.access_token,
          refresh_token: mockSession.refresh_token,
          expires_at: mockSession.expires_at,
          expires_in: mockSession.expires_in,
          token_type: mockSession.token_type,
          user: mockSession.user,
        })
      );

      console.log('[E2E] Supabase session created for:', userEmail);
    },
    {
      userId: user.id,
      userEmail: user.email,
    }
  );
}

/**
 * Set up E2E test user in localStorage
 * The mock Scaffald client will use this to return the correct user ID.
 *
 * Includes organization_id and companies array for settings pages.
 * Also sets mock_forsured_profile for AuthContext to use.
 */
async function setupTestUser(
  page: Page,
  user: (typeof TEST_USERS)[string]
) {
  const organizationId = `org-${user.id}`;
  const companyId = `company-${user.id}`;

  await page.addInitScript(
    ({ testUserKey, testUser, mockProfile }) => {
      window.localStorage.setItem(testUserKey, JSON.stringify(testUser));
      // Set mock_forsured_profile for AuthContext to use
      // AuthContext checks this FIRST before fetching from API
      window.localStorage.setItem('mock_forsured_profile', JSON.stringify(mockProfile));
      console.log('[E2E] Test user set:', testUser.email);
      console.log('[E2E] Mock profile set:', mockProfile.user_type);
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
      // Mock ForSured profile that AuthContext will use
      mockProfile: {
        id: `profile-${user.id}`,
        scaffald_user_id: user.id,
        user_type: user.user_type,
        onboarding_completed: user.onboarding_completed,
        onboarding_step: user.onboarding_step,
        company_connected: user.company_connected,
        onboarding_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

  // Set up TRPC route for getUserLexicon endpoint
  // TRPC uses batched requests, so we need to handle the batch format
  await page.route('**/api/trpc/userSetTypes.getUserLexicon*', async (route) => {
    const method = route.request().method();
    console.log(`[E2E Mock] ${method} TRPC userSetTypes.getUserLexicon`);

    // Return empty lexicon for test users (they'll use DEFAULT_LEXICON)
    const mockResponse = {
      result: {
        data: {
          lexicon: {},
          userSetType: null,
        },
      },
    };

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse),
    });
  });

  // Mock approvals endpoint - returns empty array for test users
  await page.route('**/rest/v1/approvals*', async (route) => {
    const method = route.request().method();
    console.log(`[E2E Mock] ${method} approvals endpoint`);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock help_articles endpoint with mock help content
  await page.route('**/rest/v1/help_articles*', async (route) => {
    const method = route.request().method();
    const url = route.request().url();
    console.log(`[E2E Mock] ${method} help_articles endpoint`);

    // Return mock help article for GC getting-started
    const mockHelpArticle = {
      id: 'gc-getting-started',
      slug: 'getting-started',
      title: 'Getting Started as a General Contractor',
      content: `# Getting Started as a General Contractor

Welcome to ForSured! This guide will help you set up your account and start managing subcontractor compliance.

## Step 1: Complete Your Company Profile
After signing up, complete your company profile.

## Step 2: Create Your First Project
Click "New Project" from your dashboard.

## Need Help?
Contact support for assistance.`,
      user_types: ['gc', 'manager'],
      category: 'getting-started',
      sort_order: 1,
      video_url: null,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (method === 'GET') {
      // Check if it's a single row request (has eq.slug filter)
      const isSingleRequest = url.includes('eq.slug');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingleRequest ? mockHelpArticle : [mockHelpArticle]),
      });
    }

    return route.continue();
  });

  // Mock common dashboard data endpoints - return empty arrays
  // These are needed for GC/Manager dashboard and other pages
  const emptyArrayEndpoints = [
    'tasks',
    'projects',
    'subcontractors',
    'compliance_scores',
    'documents',
    'notifications',
    'invitations',
    'companies',
  ];

  for (const endpoint of emptyArrayEndpoints) {
    await page.route(`**/rest/v1/${endpoint}*`, async (route) => {
      const method = route.request().method();
      console.log(`[E2E Mock] ${method} ${endpoint} endpoint`);

      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }

      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: `mock-${endpoint}-id` }),
        });
      }

      if (method === 'PATCH' || method === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      }

      if (method === 'DELETE') {
        return route.fulfill({
          status: 204,
          contentType: 'application/json',
          body: '',
        });
      }

      return route.continue();
    });
  }
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

  // Set up mock Supabase session (required for TRPC auth)
  await setupSupabaseSession(page, user);

  // Set up E2E test user for mock Scaffald client
  await setupTestUser(page, user);

  // REQ-9: Testing Policy - Always use real Supabase, no mocking internal services
  // Removed setupMockProfile - tests should use real Supabase database

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
