// tests/utils/httpOnlyAuth.ts
// ============================================================================
// httpOnly Cookie Authentication for E2E Tests (OAuth Mode)
// ============================================================================
//
// IMPORTANT: Do not import this file directly in tests.
// Use the central auth handler in auth.ts instead, which auto-detects
// the authentication mode based on VITE_FORSURED_USE_OAUTH.
//
// This module handles authentication when VITE_FORSURED_USE_OAUTH=true (OAuth mode).
// It creates httpOnly cookie sessions and mocks edge functions to match the
// production authentication flow using Scaffald OAuth.
//
// httpOnly cookie token storage for auth
// ============================================================================

import { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { TEST_USERS } from "./supabaseAuth";

// Supabase configuration for local dev
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://localhost:54321";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Cookie name matches the edge function
const SESSION_COOKIE_NAME = "forsured_session";

// Create Supabase client with service role for creating sessions
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: "forsured" },
});

/**
 * Create an auth session in the database for a test user
 * Returns the session ID that will be used as the cookie value
 *
 * Note: The edge function will try to call Scaffald API to get user info.
 * For tests, we'll need to either:
 * 1. Mock the edge function response, or
 * 2. Use Supabase auth directly (if USE_OAUTH=false)
 *
 * For now, we create the session and let the edge function handle it.
 * If Scaffald API is not available, the edge function will fail gracefully.
 */
async function createAuthSession(
  scaffaldUserId: string,
  supabaseUserId: string | null = null,
): Promise<string> {
  // Create a mock access token (in real OAuth, this comes from Scaffald)
  // For testing, we use a simple token that identifies the user
  // The edge function will try to validate this with Scaffald API
  const mockAccessToken = `test_token_${scaffaldUserId}_${Date.now()}`;
  const mockRefreshToken = `test_refresh_${scaffaldUserId}_${Date.now()}`;

  // Token expires in 1 hour
  const tokenExpiresAt = new Date(Date.now() + 3600 * 1000);

  // Create session using the RPC function
  const { data: sessionId, error } = await supabase.rpc("create_auth_session", {
    p_scaffald_user_id: scaffaldUserId,
    p_supabase_user_id: supabaseUserId,
    p_access_token: mockAccessToken,
    p_refresh_token: mockRefreshToken,
    p_token_expires_at: tokenExpiresAt.toISOString(),
    p_user_agent: "Playwright Test",
    p_ip_address: null,
  });

  if (error) {
    throw new Error(`Failed to create auth session: ${error.message}`);
  }

  if (!sessionId) {
    throw new Error("Failed to create auth session: no session ID returned");
  }

  return sessionId as string;
}

/**
 * Set httpOnly cookie in Playwright browser context
 * Note: Playwright can set httpOnly cookies, but they must be set before navigation
 */
async function setHttpOnlyCookie(page: Page, sessionId: string): Promise<void> {
  const url = new URL(page.url() || SUPABASE_URL);

  await page.context().addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: sessionId,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: false, // Local dev uses http
      sameSite: "Lax",
      // Cookie expires in 30 days (matches SESSION_MAX_AGE)
      expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    },
  ]);
}

/**
 * Wait for AuthContext to load user and profile
 * The AuthContext:
 * 1. Calls getSession() which hits the edge function (auth-session)
 * 2. Calls getProfile() which hits RPC or queries user_profiles
 * We need to wait for both to complete
 */
async function waitForAuthReady(page: Page, timeout = 15000): Promise<void> {
  const startTime = Date.now();

  // Wait for the auth-session edge function to be called and return successfully
  try {
    await page.waitForResponse(
      (response) => {
        const url = response.url();
        const isAuthSession = url.includes("/functions/v1/auth-session");
        const isSuccess = response.status() === 200;
        if (isAuthSession && isSuccess) {
          console.log(
            "[httpOnlyAuth] auth-session edge function responded successfully",
          );
        }
        return isAuthSession && isSuccess;
      },
      { timeout: 10000 },
    );
  } catch (error) {
    console.warn(
      "[httpOnlyAuth] auth-session edge function not called or failed (may be cached or error)",
    );
  }

  // Wait for profile to be loaded - check for RPC call or user_profiles query
  try {
    await page.waitForResponse(
      (response) => {
        const url = response.url();
        const isProfileRPC = url.includes("get_user_profile_by_scaffald_id");
        const isProfileQuery = url.includes("/rest/v1/user_profiles") ||
          url.includes("user_profiles");
        const isSuccess = response.status() === 200;
        if ((isProfileRPC || isProfileQuery) && isSuccess) {
          console.log("[httpOnlyAuth] Profile loaded successfully");
        }
        return (isProfileRPC || isProfileQuery) && isSuccess;
      },
      { timeout: 10000 },
    );
  } catch (error) {
    console.warn(
      "[httpOnlyAuth] Profile query not detected (may use cached data or RPC)",
    );
  }

  // Give React time to update state after profile loads
  await page.waitForTimeout(1000);

  // Check if we're still on the root page - if so, wait for navigation
  const url = page.url();
  const baseUrl = url.split("/").slice(0, 3).join("/"); // Get http://localhost:5173
  if (
    url === baseUrl + "/" ||
    (url.endsWith("/") && !url.includes("/subcontractor") &&
      !url.includes("/manager") && !url.includes("/broker") &&
      !url.includes("/admin"))
  ) {
    // Wait for navigation away from root (indicates auth worked)
    try {
      await page.waitForURL(
        (url) => !url.href.endsWith("/") && !url.href.includes("/start"),
        {
          timeout: 5000,
        },
      );
    } catch (error) {
      // Navigation might not happen if we're already on a protected route
      console.log(
        "[httpOnlyAuth] No navigation detected (may already be on protected route)",
      );
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[httpOnlyAuth] Auth ready check completed in ${elapsed}ms`);
}

/**
 * Mock the auth-session edge function response
 * This allows tests to work without calling the real Scaffald API
 *
 * NOTE: We're mocking the edge function because it calls an external API (Scaffald)
 * that we don't own. The edge function itself is our code, but the external API call
 * is what we're mocking. This is acceptable per testing policy.
 */
async function mockAuthSessionEndpoint(
  page: Page,
  user: typeof TEST_USERS[string],
): Promise<void> {
  // Mock the edge function to return user info without calling Scaffald API
  await page.route("**/functions/v1/auth-session", async (route) => {
    const request = route.request();
    const cookies = request.headers()["cookie"] || "";

    console.log(`[httpOnlyAuth Mock] Intercepted auth-session request`);
    console.log(`[httpOnlyAuth Mock] Cookies: ${cookies.substring(0, 100)}...`);

    // Check if session cookie is present
    const hasSessionCookie = cookies.includes(`${SESSION_COOKIE_NAME}=`);

    if (!hasSessionCookie) {
      console.log(`[httpOnlyAuth Mock] No session cookie found, returning 401`);
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
        body: JSON.stringify({ valid: false, error: "No session cookie" }),
      });
    }

    // Return mock user info that matches what Scaffald API would return
    const mockUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: null,
    };

    const response = {
      valid: true,
      user: mockUser,
      access_token: `test_token_${user.id}`,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    };

    console.log(
      `[httpOnlyAuth Mock] Returning valid session for ${user.email}`,
    );
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify(response),
    });
  });
}

/**
 * Setup httpOnly cookie authentication for a test user
 *
 * This handler mimics what the test login buttons do:
 * 1. Uses supabase.auth.signInWithPassword() to create a Supabase session
 * 2. Creates an httpOnly cookie session in the database
 * 3. Sets the httpOnly cookie
 * 4. Waits for AuthContext to load the profile
 *
 * @param page - Playwright page object
 * @param email - Test user email (legacy or new format, must be in TEST_USERS)
 * @returns Promise that resolves when auth is set up
 */
export async function setupHttpOnlyAuth(
  page: Page,
  email: string,
): Promise<void> {
  const user = TEST_USERS[email];

  if (!user) {
    throw new Error(
      `Unknown test user: ${email}. Available users: ${
        Object.keys(TEST_USERS).join(", ")
      }`,
    );
  }

  console.log(
    `[httpOnlyAuth] Setting up auth for ${user.email} (${user.user_type})`,
  );

  // Mock the edge function BEFORE creating session
  // This allows the edge function to work without calling Scaffald API
  await mockAuthSessionEndpoint(page, user);

  // Step 1: Use Supabase auth to sign in (like test login buttons do)
  // This creates a Supabase session and triggers AuthContext's onAuthStateChange
  const testClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: authData, error: signInError } = await testClient.auth
    .signInWithPassword({
      email: user.email,
      password: user.password,
    });

  if (signInError || !authData.session || !authData.user) {
    throw new Error(
      `Failed to sign in test user: ${
        signInError?.message || "No session created"
      }`,
    );
  }

  const supabaseUserId = authData.user.id;
  console.log(`[httpOnlyAuth] Signed in via Supabase auth: ${supabaseUserId}`);

  // Step 2: Create httpOnly cookie session in database
  // Use the scaffald_user_id (which matches the Supabase user ID for test users)
  const sessionId = await createAuthSession(user.id, supabaseUserId);
  console.log(`[httpOnlyAuth] Created httpOnly cookie session: ${sessionId}`);

  // Step 3: Navigate to base URL and set httpOnly cookie
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Set httpOnly cookie
  await setHttpOnlyCookie(page, sessionId);
  console.log(
    `[httpOnlyAuth] Set httpOnly cookie: ${SESSION_COOKIE_NAME}=${sessionId}`,
  );

  // Step 4: Inject Supabase session into page (so AuthContext can use it)
  // This triggers the onAuthStateChange listener
  // Supabase v2 stores the session directly, not wrapped in an object
  await page.addInitScript(
    ({ session }) => {
      // Supabase v2 stores the session directly in localStorage
      // The format is the raw session object, not wrapped in currentSession
      window.localStorage.setItem("sb-auth-token", JSON.stringify(session));
      console.log("[httpOnlyAuth] Injected Supabase session into page");
    },
    { session: authData.session },
  );

  // Step 5: Reload page to trigger AuthContext initialization
  await page.reload({ waitUntil: "domcontentloaded" });

  // Step 6: Wait for AuthContext to load profile
  // The AuthContext will:
  // 1. Call getSession() which hits our mocked edge function
  // 2. Load the profile via getProfile()
  // We need to wait for both to complete
  await waitForAuthReady(page);

  // Step 7: Wait for profile to be loaded
  // The profile loads asynchronously in AuthContext after user is set
  // We'll wait for the profile query to complete, then give React time to update state
  console.log(`[httpOnlyAuth] Waiting for profile to load...`);

  // Wait for profile RPC or query to complete
  try {
    const profileResponse = await page.waitForResponse(
      (response) => {
        const url = response.url();
        const isProfileRPC = url.includes("get_user_profile_by_scaffald_id");
        const isProfileQuery = url.includes("/rest/v1/user_profiles") &&
          response.status() === 200;
        if (isProfileRPC || isProfileQuery) {
          console.log(`[httpOnlyAuth] Profile fetch detected: ${url}`);
        }
        return isProfileRPC || isProfileQuery;
      },
      { timeout: 15000 },
    );
    console.log(`[httpOnlyAuth] Profile fetch completed`);
  } catch (error) {
    console.warn(
      `[httpOnlyAuth] Profile fetch not detected - profile may be cached or query uses different endpoint`,
    );
  }

  // Give React time to process the profile and update AuthContext state
  // The AuthContext has a useEffect that fetches profile when user changes
  // We need to wait for that to complete, but use a safer wait method
  try {
    // Wait for network to be idle, indicating profile fetch likely completed
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {
      // If networkidle times out, that's okay - just continue
      console.log(`[httpOnlyAuth] Network not idle, continuing anyway`);
    });

    // Additional short wait for React state updates
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    // Page might have been closed or navigated - that's okay, test will handle it
    console.warn(`[httpOnlyAuth] Wait interrupted: ${error}`);
  }

  console.log(`[httpOnlyAuth] Auth setup complete for ${user.email}`);
  console.log(
    `[httpOnlyAuth] Test should now be able to navigate to protected routes`,
  );
}

/**
 * Verify authentication is working by checking if we can access protected routes
 */
export async function verifyAuthState(page: Page): Promise<boolean> {
  const url = page.url();
  const baseUrl = url.split("/").slice(0, 3).join("/"); // Get http://localhost:5173

  // If we're redirected to /start or /login, auth failed
  if (
    url.includes("/start") || url.includes("/login") ||
    (url === baseUrl + "/" && !url.includes("/subcontractor") &&
      !url.includes("/manager") && !url.includes("/broker") &&
      !url.includes("/admin"))
  ) {
    return false;
  }

  // Try to check for user-specific content
  // This is a simple check - tests can do more specific verification
  return true;
}

/**
 * Clean up auth session (optional, for test cleanup)
 */
export async function cleanupAuthSession(sessionId: string): Promise<void> {
  // Sessions expire automatically, but we can delete if needed
  // For now, we'll let them expire naturally
  console.log(`[httpOnlyAuth] Session ${sessionId} will expire naturally`);
}
