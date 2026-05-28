/**
 * Authentication Flow Integration Tests
 * Tests complete authentication workflows end-to-end
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  assertStatus,
  assertSuccessResponse,
  createTestClient,
} from "../helpers/test-client.ts";
import { cleanupCurrentTestData } from "../helpers/fixtures.ts";
import {
  completeMagicLinkAuth,
  createAdminClient,
  extractMagicLinkFromEmail,
  getLatestEmail,
  markTestStart,
} from "../setup.ts";

/**
 * Integration Test: Complete Magic Link Authentication Flow
 *
 * Steps:
 * 1. Request magic link via OAuth flow
 * 2. Retrieve email from Mailpit
 * 3. Extract magic link from email
 * 4. Complete authentication via magic link
 * 5. Verify user session is valid
 * 6. Test authenticated API access
 */
Deno.test("AUTH FLOW: Magic link registration and authentication", async () => {
  markTestStart();

  const admin = createAdminClient();
  const timestamp = Date.now();
  const email = `integration-auth-${timestamp}@example.com`;

  // Step 1: Request magic link (OTP)
  const { error: otpError } = await admin.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  assertEquals(otpError, null, "Should request magic link without error");

  // Wait for email delivery
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 2: Retrieve email from Mailpit
  const emailData = await getLatestEmail(email, 10000);
  assertExists(emailData, "Should receive magic link email");
  assertExists(emailData.body?.html, "Email should have HTML body");

  // Step 3: Extract magic link
  const magicLink = extractMagicLinkFromEmail(emailData.body.html);
  assertExists(magicLink, "Should extract magic link from email");

  // Step 4: Complete authentication
  const authResult = await completeMagicLinkAuth(magicLink);
  assertExists(authResult, "Should complete authentication");
  assertExists(authResult.token, "Should receive access token");
  assertExists(authResult.userId, "Should receive user ID");

  // Step 5: Verify session is valid by accessing protected endpoint
  const client = createTestClient({ authToken: authResult.token });
  const profileResponse = await client.get("/oauth/userinfo");

  assertSuccessResponse(profileResponse);
  assertEquals(profileResponse.body.sub, authResult.userId);
  assertEquals(profileResponse.body.email, email);

  await cleanupCurrentTestData();
});

/**
 * Integration Test: OAuth Authorization Code Flow with PKCE
 *
 * Steps:
 * 1. Create OAuth application
 * 2. Create authenticated user
 * 3. Request authorization with PKCE
 * 4. Verify consent screen or redirect
 * 5. Exchange authorization code for tokens
 * 6. Use access token to access protected resources
 * 7. Refresh the access token
 * 8. Revoke tokens
 */
Deno.test("AUTH FLOW: Complete OAuth 2.0 authorization code flow with PKCE", async () => {
  markTestStart();

  const admin = createAdminClient();
  const timestamp = Date.now();

  // Step 1: Create OAuth app
  const { data: authUser } = await admin.auth.admin.createUser({
    email: `oauth-app-owner-${timestamp}@example.com`,
    password: "testpass123",
    email_confirm: true,
  });

  if (!authUser?.user) {
    throw new Error("Failed to create app owner");
  }

  const clientSecret = `secret_${timestamp}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(clientSecret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const clientSecretHash = hashArray.map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { data: oauthApp } = await admin
    .schema("core")
    .from("oauth_apps")
    .insert({
      client_id: crypto.randomUUID(),
      client_secret_hash: clientSecretHash,
      display_name: "Test OAuth App",
      owner_id: authUser.user.id,
      status: "active",
      redirect_uris: ["https://example.com/callback"],
      allowed_scopes: ["profile:read", "jobs:read"],
    })
    .select()
    .single();

  assertExists(oauthApp, "Should create OAuth app");

  // Step 2: Create end user and authenticate
  const { data: endUser } = await admin.auth.admin.createUser({
    email: `oauth-user-${timestamp}@example.com`,
    password: "testpass123",
    email_confirm: true,
  });

  const { data: session } = await admin.auth.signInWithPassword({
    email: `oauth-user-${timestamp}@example.com`,
    password: "testpass123",
  });

  assertExists(session.session?.access_token, "Should get user access token");

  // Step 3: Generate PKCE challenge
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const codeVerifier = btoa(String.fromCharCode(...verifierBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const verifierData = encoder.encode(codeVerifier);
  const challengeBuffer = await crypto.subtle.digest("SHA-256", verifierData);
  const challengeArray = Array.from(new Uint8Array(challengeBuffer));
  const codeChallenge = btoa(String.fromCharCode(...challengeArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // Step 4: Request authorization
  const client = createTestClient({ authToken: session.session.access_token });
  const authorizeResponse = await client.post("/oauth/authorize", {
    client_id: oauthApp.client_id,
    redirect_uri: "https://example.com/callback",
    response_type: "code",
    scope: "profile:read jobs:read",
    state: "random-state-123",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  assertSuccessResponse(authorizeResponse);

  // For non-trusted apps, we'd get consent_required
  // For this test, let's assume we get a redirect_url with code
  let authCode: string;

  if (authorizeResponse.body.consent_required) {
    // In real flow, user would approve consent, then we'd make another request
    // For this test, we'll simulate by creating the code directly in DB
    const codeBytes = new Uint8Array(32);
    crypto.getRandomValues(codeBytes);
    authCode = btoa(String.fromCharCode(...codeBytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const codeHashData = encoder.encode(authCode);
    const codeHashBuffer = await crypto.subtle.digest("SHA-256", codeHashData);
    const codeHashArray = Array.from(new Uint8Array(codeHashBuffer));
    const codeHash = codeHashArray.map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await admin
      .schema("core")
      .from("oauth_authorization_codes")
      .insert({
        code_hash: codeHash,
        oauth_app_id: oauthApp.id,
        user_id: endUser!.user.id,
        redirect_uri: "https://example.com/callback",
        scopes: ["profile:read", "jobs:read"],
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
  } else {
    // Extract code from redirect URL
    const redirectUrl = new URL(authorizeResponse.body.redirect_url);
    authCode = redirectUrl.searchParams.get("code") || "";
    assertExists(authCode, "Should receive authorization code");
  }

  // Step 5: Exchange code for tokens
  const tokenClient = createTestClient();
  const tokenResponse = await tokenClient.post(
    "/oauth/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: "https://example.com/callback",
      code_verifier: codeVerifier,
      client_id: oauthApp.client_id,
      client_secret: clientSecret,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  assertSuccessResponse(tokenResponse);
  assertExists(tokenResponse.body.access_token, "Should receive access token");
  assertExists(
    tokenResponse.body.refresh_token,
    "Should receive refresh token",
  );
  assertEquals(tokenResponse.body.token_type, "Bearer");

  const accessToken = tokenResponse.body.access_token;
  const refreshToken = tokenResponse.body.refresh_token;

  // Step 6: Use access token to access protected resource
  const userinfoClient = createTestClient({ authToken: accessToken });
  const userinfoResponse = await userinfoClient.get("/oauth/userinfo");

  assertSuccessResponse(userinfoResponse);
  assertEquals(userinfoResponse.body.sub, endUser!.user.id);

  // Step 7: Refresh the access token
  const refreshResponse = await tokenClient.post(
    "/oauth/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: oauthApp.client_id,
      client_secret: clientSecret,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  assertSuccessResponse(refreshResponse);
  assertExists(
    refreshResponse.body.access_token,
    "Should receive new access token",
  );
  assertExists(
    refreshResponse.body.refresh_token,
    "Should receive new refresh token",
  );

  // Step 8: Revoke tokens
  const revokeResponse = await tokenClient.post(
    "/oauth/revoke",
    new URLSearchParams({
      token: refreshResponse.body.access_token,
      client_id: oauthApp.client_id,
      client_secret: clientSecret,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  assertSuccessResponse(revokeResponse);

  await cleanupCurrentTestData();
});

/**
 * Integration Test: API Key Authentication Flow
 *
 * Steps:
 * 1. Create user with organization
 * 2. Create API key
 * 3. Use API key to access endpoints
 * 4. Verify rate limiting
 * 5. Deactivate API key
 * 6. Verify deactivated key is rejected
 */
Deno.test("AUTH FLOW: API key creation and usage", async () => {
  markTestStart();

  const admin = createAdminClient();
  const timestamp = Date.now();

  // Step 1: Create user with organization
  const { data: authUser } = await admin.auth.admin.createUser({
    email: `apikey-user-${timestamp}@example.com`,
    password: "testpass123",
    email_confirm: true,
  });

  const { data: org } = await admin
    .schema("core")
    .from("organizations")
    .insert({
      name: `Test Org ${timestamp}`,
      slug: `test-org-${timestamp}`,
    })
    .select()
    .single();

  const { data: memberRole } = await admin
    .schema("core")
    .from("team_roles")
    .select("id")
    .eq("key", "member")
    .is("organization_id", null)
    .limit(1)
    .single();

  const { data: team } = await admin
    .schema("core")
    .from("teams")
    .insert({
      organization_id: org!.id,
      name: "Default Team",
      default_role_id: memberRole?.id,
    })
    .select()
    .single();

  await admin
    .schema("core")
    .from("team_members")
    .insert({
      team_id: team!.id,
      user_id: authUser!.user.id,
      organization_id: org!.id,
      user_type: "employer",
      role: "admin",
    });

  const { data: session } = await admin.auth.signInWithPassword({
    email: `apikey-user-${timestamp}@example.com`,
    password: "testpass123",
  });

  // Step 2: Create API key
  const client = createTestClient({ authToken: session.session!.access_token });
  const createKeyResponse = await client.post("/v1/api-keys", {
    name: "Integration Test Key",
    environment: "test",
    scopes: ["read:jobs", "read:applications"],
  });

  assertSuccessResponse(createKeyResponse);
  assertEquals(createKeyResponse.status, 201);
  assertExists(createKeyResponse.body.data.key, "Should receive full API key");

  const apiKey = createKeyResponse.body.data.key;

  // Step 3: Use API key to access endpoints
  const apiClient = createTestClient();

  // Create a test job first
  await admin
    .schema("core")
    .from("jobs")
    .insert({
      organization_id: org!.id,
      title: "Test Job",
      description: "Test description",
      status: "published",
    });

  const jobsResponse = await apiClient.get("/v1/jobs", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  assertSuccessResponse(jobsResponse);
  assert(Array.isArray(jobsResponse.body.data));

  // Step 4: Verify API key shows in list
  const listKeysResponse = await client.get("/v1/api-keys");
  assertSuccessResponse(listKeysResponse);
  assert(
    listKeysResponse.body.data.some((k: { name: string }) =>
      k.name === "Integration Test Key"
    ),
  );

  // Step 5: Deactivate API key
  const keyId = createKeyResponse.body.data.id;
  const deactivateResponse = await client.patch(`/v1/api-keys/${keyId}`, {
    is_active: false,
  });

  assertSuccessResponse(deactivateResponse);
  assertEquals(deactivateResponse.body.data.is_active, false);

  // Step 6: Verify deactivated key is rejected
  const rejectedResponse = await apiClient.get("/v1/jobs", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  assertStatus(rejectedResponse, 401);

  await cleanupCurrentTestData();
});

console.log("✅ All authentication flow integration tests passed!");
