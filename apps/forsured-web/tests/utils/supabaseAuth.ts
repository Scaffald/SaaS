// tests/utils/supabaseAuth.ts
// Supabase password authentication for E2E tests
//
// IMPORTANT: Do not import this file directly in tests.
// Use the central auth handler in auth.ts instead, which auto-detects
// the authentication mode based on VITE_FORSURED_USE_OAUTH.
//
// This module handles authentication when VITE_FORSURED_USE_OAUTH=false (magic link mode).
// It uses real Supabase signInWithPassword with seeded test users.
//
// Testing policy: use real Supabase, no mocking internal services

import { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration for local dev
// IMPORTANT: Must use 'localhost' not '127.0.0.1' to match the app's storage key
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://localhost:54321";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// Storage key for Supabase auth - matches the HARDCODED key in src/lib/supabase.ts
// The app uses a fixed key 'sb-auth-token', not a URL-derived key
const STORAGE_KEY = "sb-auth-token";

/**
 * Test credentials - must match seeded test users from Start.tsx TEST_CREDENTIALS
 * These users are created in the local Supabase instance.
 * Password for all test users: ForsuredTest123!
 */
const TEST_PASSWORD = "ForsuredTest123!";

/**
 * Actual seeded test user emails (from Start.tsx TEST_CREDENTIALS)
 * Format: test-{role}@forsured.test
 */
const SEEDED_USERS = {
  gc: "test-gc@forsured.test",
  contractor: "test-contractor@forsured.test",
  broker: "test-broker@forsured.test",
  admin: "test-admin@forsured.test",
} as const;

/**
 * Test user IDs - these are the IDs assigned by Supabase auth
 * Note: These are generated at runtime when users are created
 */
export const TEST_USER_IDS = {
  // IDs are determined by the seeded auth.users entries
  // We use placeholder IDs here as the actual IDs come from Supabase
  GC_ACTIVE: "10000000-0000-0000-0000-000000000001",
  CONTRACTOR_ACTIVE: "20000000-0000-0000-0000-000000000002",
  BROKER_ACTIVE: "30000000-0000-0000-0000-000000000003",
  ADMIN: "40000000-0000-0000-0000-000000000004",
} as const;

/**
 * Test user profiles - maps legacy email format to actual seeded users
 *
 * The test fixture calls setupAuthAs with legacy emails like 'active.gc@test.forsured.com'
 * We map these to the actual seeded users: 'test-gc@forsured.test'
 */
export const TEST_USERS: Record<
  string,
  {
    id: string;
    email: string;
    password: string;
    name: string;
    user_type: "gc" | "contractor" | "broker" | "admin";
    onboarding_completed: boolean;
    onboarding_step: number;
    company_connected: boolean;
  }
> = {
  // GC Users - all GC aliases map to test-gc@forsured.test
  "fresh.gc@test.forsured.com": {
    id: TEST_USER_IDS.GC_ACTIVE,
    email: SEEDED_USERS.gc,
    password: TEST_PASSWORD,
    name: "Test GC User",
    user_type: "gc",
    onboarding_completed: true, // Seeded user is fully onboarded
    onboarding_step: 4,
    company_connected: true,
  },
  "onboarding.gc@test.forsured.com": {
    id: TEST_USER_IDS.GC_ACTIVE,
    email: SEEDED_USERS.gc,
    password: TEST_PASSWORD,
    name: "Test GC User",
    user_type: "gc",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  "active.gc@test.forsured.com": {
    id: TEST_USER_IDS.GC_ACTIVE,
    email: SEEDED_USERS.gc,
    password: TEST_PASSWORD,
    name: "Test GC User",
    user_type: "gc",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  "multiproject.gc@test.forsured.com": {
    id: TEST_USER_IDS.GC_ACTIVE,
    email: SEEDED_USERS.gc,
    password: TEST_PASSWORD,
    name: "Test GC User",
    user_type: "gc",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  "test-gc@forsured.test": {
    id: TEST_USER_IDS.GC_ACTIVE,
    email: SEEDED_USERS.gc,
    password: TEST_PASSWORD,
    name: "Test GC User",
    user_type: "gc",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  // Contractor Users - all contractor aliases map to test-contractor@forsured.test
  "fresh.contractor@test.forsured.com": {
    id: TEST_USER_IDS.CONTRACTOR_ACTIVE,
    email: SEEDED_USERS.contractor,
    password: TEST_PASSWORD,
    name: "Test Contractor User",
    user_type: "contractor",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  "active.contractor@test.forsured.com": {
    id: TEST_USER_IDS.CONTRACTOR_ACTIVE,
    email: SEEDED_USERS.contractor,
    password: TEST_PASSWORD,
    name: "Test Contractor User",
    user_type: "contractor",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  "noncompliant.contractor@test.forsured.com": {
    id: TEST_USER_IDS.CONTRACTOR_ACTIVE,
    email: SEEDED_USERS.contractor,
    password: TEST_PASSWORD,
    name: "Test Contractor User",
    user_type: "contractor",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  "test-contractor@forsured.test": {
    id: TEST_USER_IDS.CONTRACTOR_ACTIVE,
    email: SEEDED_USERS.contractor,
    password: TEST_PASSWORD,
    name: "Test Contractor User",
    user_type: "contractor",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  // Broker Users - all broker aliases map to test-broker@forsured.test
  "fresh.broker@test.forsured.com": {
    id: TEST_USER_IDS.BROKER_ACTIVE,
    email: SEEDED_USERS.broker,
    password: TEST_PASSWORD,
    name: "Test Broker User",
    user_type: "broker",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  "active.broker@test.forsured.com": {
    id: TEST_USER_IDS.BROKER_ACTIVE,
    email: SEEDED_USERS.broker,
    password: TEST_PASSWORD,
    name: "Test Broker User",
    user_type: "broker",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  "test-broker@forsured.test": {
    id: TEST_USER_IDS.BROKER_ACTIVE,
    email: SEEDED_USERS.broker,
    password: TEST_PASSWORD,
    name: "Test Broker User",
    user_type: "broker",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  // Admin Users
  "admin@test.forsured.com": {
    id: TEST_USER_IDS.ADMIN,
    email: SEEDED_USERS.admin,
    password: TEST_PASSWORD,
    name: "Test Admin User",
    user_type: "admin",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
  "test-admin@forsured.test": {
    id: TEST_USER_IDS.ADMIN,
    email: SEEDED_USERS.admin,
    password: TEST_PASSWORD,
    name: "Test Admin User",
    user_type: "admin",
    onboarding_completed: true,
    onboarding_step: 4,
    company_connected: true,
  },
};

/**
 * Sign in via Supabase password auth and return the RAW session
 * We store the raw session exactly as Supabase returns it to ensure compatibility
 */
async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ session: unknown; userEmail: string }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Failed to sign in as ${email}: ${error.message}`);
  }

  if (!data.session) {
    throw new Error(`No session returned for ${email}`);
  }

  // Return the raw session object to inject into localStorage
  // This ensures the format matches what Supabase expects
  return {
    session: data.session,
    userEmail: data.session.user.email || email,
  };
}

/**
 * Inject Supabase session into page localStorage
 * First navigates to base URL to trigger init script, then waits for auth to be established
 */
async function injectSession(
  page: Page,
  sessionData: { session: unknown; userEmail: string },
): Promise<void> {
  const { session, userEmail } = sessionData;

  // Register init script that will run on every page load
  await page.addInitScript(
    ({ storageKey, sessionJson, email }) => {
      try {
        // Supabase v2 stores the raw session in localStorage
        // We pass the JSON string to avoid any serialization issues
        window.localStorage.setItem(storageKey, sessionJson);

        console.log("[E2E Auth] Injected Supabase session for", email);
      } catch (error) {
        console.error("[E2E Auth] Failed to inject session:", error);
      }
    },
    {
      storageKey: STORAGE_KEY,
      sessionJson: JSON.stringify(session),
      email: userEmail,
    },
  );

  // Navigate to base URL to trigger init script and establish session
  await page.goto("/", { waitUntil: "networkidle" });

  // Wait for session to be processed by Supabase client and AuthContext
  // The AuthContext fix ensures isLoading=true while profile loads
  await page.waitForTimeout(1500);
}

/**
 * Map user_type to URL path segment
 */
function mapUserTypeToPath(
  userType: "gc" | "contractor" | "broker" | "admin",
): string {
  const paths: Record<string, string> = {
    gc: "manager",
    contractor: "subcontractor",
    broker: "broker",
    admin: "admin",
  };
  return paths[userType];
}

/**
 * Wait for profile to be loaded in React state
 *
 * The AuthContext loads profile asynchronously after auth state changes.
 * This function waits for dashboard content to render, which only happens when profile is loaded.
 *
 * This ensures ProtectedRoute won't redirect to '/' due to missing profile.
 */
async function waitForProfileReady(
  page: Page,
  userType: string,
  timeout = 15000,
): Promise<void> {
  console.log(`[E2E Auth] Waiting for profile to be ready (${userType})...`);

  try {
    // Wait for dashboard content - UI uses Text components, not semantic headings
    // We wait for the sidebar navigation OR dashboard text to be visible
    // These only render when ProtectedRoute allows access (profile loaded)
    await page.waitForFunction(
      () => {
        // Check for sidebar navigation (all dashboard layouts have this)
        const hasSidebar = document.querySelector(
          '[data-testid="sidebar"], nav',
        );
        if (hasSidebar) return true;

        // Check for dashboard text content
        const bodyText = document.body.textContent || "";
        if (
          bodyText.includes("Dashboard") &&
          !bodyText.includes("Welcome to ForSured")
        ) {
          return true;
        }

        // Check for common dashboard elements
        const hasProjects = bodyText.includes("Projects") ||
          bodyText.includes("Tasks");
        const hasNavLinks =
          document.querySelectorAll(
            'a[href*="/dashboard"], a[href*="/projects"]',
          ).length > 0;
        return hasProjects || hasNavLinks;
      },
      { timeout },
    );

    console.log("[E2E Auth] Profile ready - dashboard content visible");
  } catch (error) {
    console.warn("[E2E Auth] Timeout waiting for profile - continuing anyway");
  }
}

/**
 * Log in as a test user using real Supabase authentication
 *
 * @param page - Playwright page object
 * @param email - Test user email (legacy or new format, must be in TEST_USERS)
 * @param options - Optional settings
 */
export async function loginAs(
  page: Page,
  email: string,
  options: { navigate?: boolean } = { navigate: true },
): Promise<void> {
  const user = TEST_USERS[email];

  if (!user) {
    throw new Error(
      `Unknown test user: ${email}. Available users: ${
        Object.keys(TEST_USERS).join(", ")
      }`,
    );
  }

  // Sign in via real Supabase auth
  const session = await signInWithPassword(user.email, user.password);

  // Inject session into page
  await injectSession(page, session);

  // Navigate to appropriate page if requested
  if (options.navigate !== false) {
    const pathSegment = mapUserTypeToPath(user.user_type);

    if (user.user_type === "admin") {
      await page.goto("/admin/dashboard");
    } else if (!user.onboarding_completed) {
      await page.goto(`/${pathSegment}/onboarding`);
    } else {
      await page.goto(`/${pathSegment}/dashboard`);
    }

    // Wait for network to settle
    await page.waitForLoadState("networkidle");

    // CRITICAL: Wait for profile to be loaded in React state
    // This prevents ProtectedRoute from redirecting to '/' on subsequent navigation
    await waitForProfileReady(page, user.user_type);
  }
}

/**
 * Log in as a test user without navigation
 * Useful when you need to set up auth before navigating to a specific page.
 */
export async function setupAuthAs(page: Page, email: string): Promise<void> {
  return loginAs(page, email, { navigate: false });
}

/**
 * Get the profile for a test user
 */
export function getTestUserProfile(email: string) {
  return TEST_USERS[email];
}
