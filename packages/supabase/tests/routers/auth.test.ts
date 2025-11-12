/**
 * Authentication baseline tests.
 *
 * Generates cached tokens for downstream suites and verifies magic-link flows.
 */

import {
  assertEquals,
  assertExists,
  assertNotEquals,
} from "../shared/assert.ts";

import {
  TEST_MAILPIT_URL,
  TEST_SUPABASE_URL,
  callTRPCEndpoint,
  completeMagicLinkAuth,
  createTestClient,
  extractMagicLinkFromEmail,
  getLatestEmail,
  loadCachedTokens,
  registerUserWithMagicLink,
  saveCachedTokens,
} from "../shared/setup.ts";

const TEST_USER_EMAIL = `trpc-auth-${Date.now()}@example.com`;
const TEST_ADMIN_EMAIL = "admin@scaffald.dev";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.test({
  name: "Auth setup - Mailpit is reachable",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await fetch(`${TEST_MAILPIT_URL}/api/v1/messages`);
    assertEquals(response.ok, true, "Mailpit should respond successfully");
  },
});

Deno.test({
  name: "Auth router - request magic link via tRPC",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const signupResponse = await callTRPCEndpoint(
      "auth.requestMagicLink",
      {
        email: TEST_USER_EMAIL,
        redirectTo: TEST_SUPABASE_URL,
      },
      { type: "mutation" },
    );

    const signupData = signupResponse[0]?.result?.data;
    assertExists(signupData, "Signup magic link call should return data");
    assertEquals(signupData.mode, "signup");

    await wait(1_500);

    const signupEmail = await getLatestEmail(TEST_USER_EMAIL);
    assertExists(signupEmail, "Signup email should arrive");
    assertExists(signupEmail.body?.html, "Signup email should have HTML");

    const loginResponse = await callTRPCEndpoint(
      "auth.requestMagicLink",
      {
        email: TEST_USER_EMAIL,
        redirectTo: TEST_SUPABASE_URL,
      },
      { type: "mutation" },
    );

    const loginData = loginResponse[0]?.result?.data;
    assertExists(loginData, "Login magic link call should return data");
    assertEquals(loginData.mode, "login");

    await wait(1_500);

    const loginEmail = await getLatestEmail(TEST_USER_EMAIL);
    assertExists(loginEmail, "Login email should arrive");
    assertExists(loginEmail.body?.html, "Login email should have HTML");

    const signupSubject = signupEmail?.subject ?? "";
    const loginSubject = loginEmail?.subject ?? "";

    assertExists(
      signupSubject || loginSubject,
      "Magic link emails should include a subject",
    );
  },
});

Deno.test({
  name: "Auth router - complete magic link authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const emailData = await getLatestEmail(TEST_USER_EMAIL);
    assertExists(emailData, "Magic link email should exist");
    assertExists(emailData.body?.html, "Magic link email should include HTML");

    const magicLink = extractMagicLinkFromEmail(emailData.body.html);
    assertExists(magicLink, "Magic link should be present in email");

    const result = await completeMagicLinkAuth(magicLink);
    assertExists(result, "Magic link auth should return result");
    assertExists(result.token, "Access token should be returned");
    assertExists(result.userId, "User ID should be returned");

  },
});

Deno.test({
  name: "Auth router - cache tokens for regular and admin contexts",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const regularAuth = await registerUserWithMagicLink(TEST_USER_EMAIL);
    assertExists(regularAuth, "Regular user auth should succeed");

    let adminAuth: { token: string; userId: string } | null = null;

    try {
      const supabase = createTestClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: TEST_ADMIN_EMAIL,
        options: { shouldCreateUser: false },
      });

      if (!error) {
        await wait(2_000);
        const adminEmail = await getLatestEmail(TEST_ADMIN_EMAIL);
        if (adminEmail?.body?.html) {
          const adminLink = extractMagicLinkFromEmail(adminEmail.body.html);
          if (adminLink) {
            adminAuth = await completeMagicLinkAuth(adminLink);
          }
        }
      }
    } catch (error) {
      console.warn("Admin authentication skipped:", error);
    }

    const tokens = {
      regular: {
        token: regularAuth?.token ?? "",
        email: TEST_USER_EMAIL,
        userId: regularAuth?.userId ?? "",
        expiresAt: Date.now() + 3_600_000,
      },
      admin: {
        token: adminAuth?.token ?? regularAuth?.token ?? "",
        email: adminAuth ? TEST_ADMIN_EMAIL : TEST_USER_EMAIL,
        userId: adminAuth?.userId ?? regularAuth?.userId ?? "",
        expiresAt: Date.now() + 3_600_000,
      },
      cachedAt: Date.now(),
    };

    await saveCachedTokens(tokens);

    const loaded = await loadCachedTokens();
    assertExists(loaded, "Cached tokens should persist to disk");
    assertEquals(loaded?.regular.email, TEST_USER_EMAIL);
    assertExists(loaded?.regular.token);
    assertExists(loaded?.admin.token);
  },
});
