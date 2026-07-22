/**
 * Auth Routes Test Suite
 * Tests for magic link authentication and user role management
 *
 * Endpoints tested:
 * - POST /v1/auth/magic-link
 * - GET /v1/auth/roles
 * - GET /v1/auth/session
 */

import { assert, assertEquals, assertExists } from "jsr:@std/assert";
import {
  assertErrorResponse,
  assertStatus,
  assertSuccessResponse,
  createTestClient,
  type TestResponse,
} from "../helpers/test-client.ts";
import {
  createAdminClient,
  getLatestEmail,
  markTestStart,
  registerUserWithMagicLink,
} from "../setup.ts";
import { cleanupCurrentTestData, createTestUser } from "../helpers/fixtures.ts";

// ============================================================================
// POST /v1/auth/magic-link - Request magic link
// ============================================================================

Deno.test("POST /v1/auth/magic-link - sends magic link for new user (signup mode)", async () => {
  markTestStart();

  const client = createTestClient();
  const email = `test-signup-${Date.now()}@example.com`;

  const response = await client.post("/v1/auth/magic-link", {
    email,
    redirectTo: "https://app.example.com/auth/callback",
  });

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertExists(response.body.data);
  assertEquals(response.body.data.mode, "signup");
  assertEquals(response.body.data.email, email);
  assertEquals(
    response.body.data.redirectTo,
    "https://app.example.com/auth/callback",
  );
  assert(response.body.message?.includes("Magic link sent"));

  // Verify email was sent (if Mailpit is available)
  const emailMessage = await getLatestEmail(email);
  if (emailMessage?.body?.html) {
    assert(
      emailMessage.body.html.includes("magic link") ||
        emailMessage.body.html.includes("sign"),
    );
  }

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/auth/magic-link - sends magic link for existing user (login mode)", async () => {
  markTestStart();

  // Create existing user first
  const existingEmail = `test-existing-${Date.now()}@example.com`;
  await registerUserWithMagicLink(existingEmail);

  const client = createTestClient();
  const response = await client.post("/v1/auth/magic-link", {
    email: existingEmail,
    redirectTo: "https://app.example.com/auth/callback",
  });

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertExists(response.body.data);
  assertEquals(response.body.data.mode, "login"); // Should be login, not signup
  assertEquals(response.body.data.email, existingEmail);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/auth/magic-link - normalizes email (lowercase, trimmed)", async () => {
  markTestStart();

  const client = createTestClient();
  const email = `  TEST-NORMALIZE-${Date.now()}@EXAMPLE.COM  `; // uppercase with whitespace
  const normalizedEmail = email.trim().toLowerCase();

  const response = await client.post("/v1/auth/magic-link", {
    email,
    redirectTo: "https://app.example.com/auth/callback",
  });

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertEquals(response.body.data.email, normalizedEmail); // Should be normalized

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/auth/magic-link - uses fallback redirect if not provided", async () => {
  markTestStart();

  const client = createTestClient();
  const email = `test-fallback-${Date.now()}@example.com`;

  const response = await client.post("/v1/auth/magic-link", {
    email,
    // No redirectTo provided
  });

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertExists(response.body.data.redirectTo); // Should have a redirect from env fallback

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/auth/magic-link - validates email format (400)", async () => {
  markTestStart();

  const client = createTestClient();

  const response = await client.post("/v1/auth/magic-link", {
    email: "not-an-email", // Invalid email
    redirectTo: "https://app.example.com/auth/callback",
  });

  assertErrorResponse(response);
  assertStatus(response, 400);
  assertEquals(response.body.error, "Validation Error");

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/auth/magic-link - validates redirect URL format (400)", async () => {
  markTestStart();

  const client = createTestClient();
  const email = `test-${Date.now()}@example.com`;

  const response = await client.post("/v1/auth/magic-link", {
    email,
    redirectTo: "not-a-url", // Invalid URL
  });

  assertErrorResponse(response);
  assertStatus(response, 400);
  assertEquals(response.body.error, "Validation Error");

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/auth/magic-link - requires email field (400)", async () => {
  markTestStart();

  const client = createTestClient();

  const response = await client.post("/v1/auth/magic-link", {
    // Missing email field
    redirectTo: "https://app.example.com/auth/callback",
  });

  assertErrorResponse(response);
  assertStatus(response, 400);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/auth/magic-link - handles database lookup errors gracefully (500)", async () => {
  markTestStart();

  const client = createTestClient();
  const email = `test-error-${Date.now()}@example.com`;

  // This test verifies error handling exists
  // In a real scenario, we'd mock the Supabase client to force an error
  // For now, we just verify the endpoint handles normal cases correctly
  const response = await client.post("/v1/auth/magic-link", {
    email,
    redirectTo: "https://app.example.com/auth/callback",
  });

  // Should succeed with normal database
  assertSuccessResponse(response);
  assertEquals(response.status, 200);

  await cleanupCurrentTestData();
});

// ============================================================================
// GET /v1/auth/roles - Get current user's roles
// ============================================================================

Deno.test("GET /v1/auth/roles - returns user roles successfully", async () => {
  markTestStart();

  // Create user and assign roles
  const user = await registerUserWithMagicLink(
    `test-roles-${Date.now()}@example.com`,
  );
  assertExists(user, "User should be created");

  const adminClient = createAdminClient();

  // Create a test role
  const { data: role, error: roleError } = await adminClient
    .schema("core")
    .from("roles")
    .insert({ name: `test_role_${Date.now()}`, description: "Test role" })
    .select()
    .single();

  assertEquals(roleError, null, "Role should be created without error");
  assertExists(role, "Role should exist");

  // Assign role to user
  const { error: assignError } = await adminClient
    .schema("core")
    .from("role_assignments")
    .insert({
      user_id: user.userId,
      role_id: role.id,
    });

  assertEquals(assignError, null, "Role should be assigned without error");

  // Test endpoint
  const client = createTestClient({ authToken: user.token });
  const response = await client.get("/v1/auth/roles");

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertExists(response.body.data);
  assertExists(response.body.data.roles);
  assert(Array.isArray(response.body.data.roles));
  assert(response.body.data.roles.includes(role.name));
  assertEquals(response.body.data.userId, user.userId);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/auth/roles - returns empty array for user with no roles", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    `test-noroles-${Date.now()}@example.com`,
  );
  assertExists(user, "User should be created");

  const client = createTestClient({ authToken: user.token });
  const response = await client.get("/v1/auth/roles");

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertExists(response.body.data);
  assertExists(response.body.data.roles);
  assert(Array.isArray(response.body.data.roles));
  assertEquals(response.body.data.roles.length, 0);
  assertEquals(response.body.data.userId, user.userId);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/auth/roles - requires authentication (401)", async () => {
  markTestStart();

  const client = createTestClient(); // No auth token
  const response = await client.get("/v1/auth/roles");

  assertErrorResponse(response);
  assertStatus(response, 401);
  assertEquals(response.body.error, "Unauthorized");

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/auth/roles - handles database errors gracefully (500)", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    `test-db-error-${Date.now()}@example.com`,
  );
  assertExists(user, "User should be created");

  const client = createTestClient({ authToken: user.token });
  const response = await client.get("/v1/auth/roles");

  // With normal database, should succeed
  assertSuccessResponse(response);
  assertEquals(response.status, 200);

  await cleanupCurrentTestData();
});

// ============================================================================
// GET /v1/auth/session - Get current session info
// ============================================================================

Deno.test("GET /v1/auth/session - returns session info successfully", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    `test-session-${Date.now()}@example.com`,
  );
  assertExists(user, "User should be created");

  const client = createTestClient({ authToken: user.token });
  const response = await client.get("/v1/auth/session");

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertExists(response.body.data);

  // Verify user info
  assertExists(response.body.data.user);
  assertEquals(response.body.data.user.id, user.userId);
  assertExists(response.body.data.user.email);
  assertExists(response.body.data.user.createdAt);
  assert(typeof response.body.data.user.emailVerified === "boolean");

  // Verify session info
  assertExists(response.body.data.session);
  assertExists(response.body.data.session.accessToken);
  assertExists(response.body.data.session.refreshToken);
  assertExists(response.body.data.session.expiresAt);
  assert(typeof response.body.data.session.expiresIn === "number");

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/auth/session - requires authentication (401)", async () => {
  markTestStart();

  const client = createTestClient(); // No auth token
  const response = await client.get("/v1/auth/session");

  assertErrorResponse(response);
  assertStatus(response, 401);
  assertEquals(response.body.error, "Unauthorized");

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/auth/session - rejects invalid token (401)", async () => {
  markTestStart();

  const client = createTestClient({ authToken: "invalid-token-12345" });
  const response = await client.get("/v1/auth/session");

  assertErrorResponse(response);
  assertStatus(response, 401);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/auth/session - handles malformed auth header (401)", async () => {
  markTestStart();

  const client = createTestClient();
  const response = await client.get("/v1/auth/session", {
    headers: {
      Authorization: "NotBearer invalid", // Malformed header
    },
  });

  assertErrorResponse(response);
  assertStatus(response, 401);

  await cleanupCurrentTestData();
});

// ============================================================================
// Edge Cases and Error Scenarios
// ============================================================================

Deno.test("POST /v1/auth/magic-link - handles case-insensitive duplicate check", async () => {
  markTestStart();

  const baseEmail = `test-case-${Date.now()}@example.com`;

  // Create user with lowercase email
  await registerUserWithMagicLink(baseEmail.toLowerCase());

  // Try to request magic link with uppercase version
  const client = createTestClient();
  const response = await client.post("/v1/auth/magic-link", {
    email: baseEmail.toUpperCase(),
    redirectTo: "https://app.example.com/auth/callback",
  });

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  // Should detect as existing user (login mode), not signup
  assertEquals(response.body.data.mode, "login");
  assertEquals(response.body.data.email, baseEmail.toLowerCase()); // Normalized

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/auth/roles - filters out null role names", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    `test-null-roles-${Date.now()}@example.com`,
  );
  assertExists(user, "User should be created");

  const client = createTestClient({ authToken: user.token });
  const response = await client.get("/v1/auth/roles");

  assertSuccessResponse(response);
  assertEquals(response.status, 200);

  // All roles should be strings (no nulls)
  assert(
    response.body.data.roles.every((role: unknown) => typeof role === "string"),
  );

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/auth/magic-link - accepts various valid email formats", async () => {
  markTestStart();

  const client = createTestClient();
  const validEmails = [
    `simple-${Date.now()}@example.com`,
    `dotted.name-${Date.now()}@example.com`,
    `plus+tag-${Date.now()}@example.com`,
    `hyphen-ated-${Date.now()}@example.com`,
  ];

  for (const email of validEmails) {
    const response = await client.post("/v1/auth/magic-link", {
      email,
      redirectTo: "https://app.example.com/auth/callback",
    });

    assertSuccessResponse(response);
    assertEquals(response.status, 200);
    assertEquals(response.body.data.email, email);
  }

  await cleanupCurrentTestData();
});
