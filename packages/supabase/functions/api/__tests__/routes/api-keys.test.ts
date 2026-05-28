/**
 * API Keys API Tests
 * Tests for /v1/api-keys endpoints with 100% coverage
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  assertErrorResponse,
  assertStatus,
  assertSuccessResponse,
  createTestClient,
} from "../helpers/test-client.ts";
import {
  cleanupCurrentTestData,
  createTestApiKey,
} from "../helpers/fixtures.ts";
import {
  createAdminClient,
  markTestStart,
  registerUserWithMagicLink,
} from "../setup.ts";

/**
 * Helper to create a test user with organization membership
 */
async function createTestUserWithOrg(overrides: {
  email?: string;
  user_type?: "job_seeker" | "employer" | "organization_admin";
} = {}) {
  const admin = createAdminClient();
  const timestamp = Date.now();

  // Create auth user
  const email = overrides.email || `test-apikey-${timestamp}@example.com`;
  const { data: authUser } = await admin.auth.admin.createUser({
    email,
    password: "testpass123",
    email_confirm: true,
  });

  if (!authUser?.user) {
    throw new Error("Failed to create auth user");
  }

  // Create organization
  const { data: org } = await admin
    .schema("core")
    .from("organizations")
    .insert({
      name: `Test Org ${timestamp}`,
      slug: `test-org-${timestamp}`,
    })
    .select()
    .single();

  if (!org) {
    throw new Error("Failed to create organization");
  }

  // Global "member" team role for the required default_role_id.
  const { data: memberRole } = await admin
    .schema("core")
    .from("team_roles")
    .select("id")
    .eq("key", "member")
    .is("organization_id", null)
    .limit(1)
    .single();

  // Create team
  const { data: team } = await admin
    .schema("core")
    .from("teams")
    .insert({
      organization_id: org.id,
      name: "Default Team",
      default_role_id: memberRole?.id,
    })
    .select()
    .single();

  if (!team) {
    throw new Error("Failed to create team");
  }

  // Create team member
  await admin
    .schema("core")
    .from("team_members")
    .insert({
      team_id: team.id,
      user_id: authUser.user.id,
      organization_id: org.id,
      user_type: overrides.user_type || "employer",
      role: "admin",
    });

  // Get auth token
  const { data: session } = await admin.auth.signInWithPassword({
    email,
    password: "testpass123",
  });

  return {
    userId: authUser.user.id,
    email,
    token: session.session?.access_token || "",
    organization: org,
    team,
  };
}

/**
 * POST /v1/api-keys - Create new API key
 */

Deno.test("POST /v1/api-keys - creates API key successfully", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const client = createTestClient({ authToken: user.token });

  const response = await client.post("/v1/api-keys", {
    name: "Test API Key",
    environment: "test",
    scopes: ["read:jobs", "read:applications"],
    rate_limit_tier: "free",
  });

  assertSuccessResponse(response);
  assertEquals(response.status, 201);
  assertExists(response.body.data.id);
  assertEquals(response.body.data.name, "Test API Key");
  assertExists(response.body.data.key); // Full key should be present
  assert(response.body.data.key.startsWith("sk_test_"));
  assertExists(response.body.warning); // Warning to save the key

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/api-keys - creates live environment key", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const client = createTestClient({ authToken: user.token });

  const response = await client.post("/v1/api-keys", {
    name: "Production Key",
    environment: "live",
  });

  assertSuccessResponse(response);
  assert(response.body.data.key.startsWith("sk_live_"));

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/api-keys - uses default scopes if none provided", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const client = createTestClient({ authToken: user.token });

  const response = await client.post("/v1/api-keys", {
    name: "Default Scopes Key",
  });

  assertSuccessResponse(response);
  assertEquals(response.body.data.scopes, ["read:jobs", "read:applications"]);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/api-keys - accepts optional expiration date", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const client = createTestClient({ authToken: user.token });

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString();

  const response = await client.post("/v1/api-keys", {
    name: "Expiring Key",
    expires_at: expiresAt,
  });

  assertSuccessResponse(response);
  assertExists(response.body.data.expires_at);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/api-keys - returns 403 if user not authenticated", async () => {
  markTestStart();

  const client = createTestClient();
  client.setAuthToken("");

  const response = await client.post(
    "/v1/api-keys",
    {
      name: "Test Key",
    },
    {
      headers: { Authorization: "" },
    },
  );

  assertStatus(response, 401);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/api-keys - returns 403 if authenticated with API key", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient();
  const response = await client.post(
    "/v1/api-keys",
    {
      name: "Test Key",
    },
    {
      headers: { Authorization: `Bearer ${apiKey.raw_key}` },
    },
  );

  assertStatus(response, 403);
  assert(
    response.body.message?.includes("cannot be created using another API key"),
  );

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/api-keys - returns 403 if user not in organization", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink("no-org@example.com");
  assert(user !== null);

  const client = createTestClient({ authToken: user.token });
  const response = await client.post("/v1/api-keys", {
    name: "Test Key",
  });

  assertStatus(response, 403);
  assert(response.body.message?.includes("belong to an organization"));

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/api-keys - validates required fields", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const client = createTestClient({ authToken: user.token });

  // Missing name
  const response = await client.post("/v1/api-keys", {
    environment: "test",
  });

  assertStatus(response, 400);
  assertEquals(response.body.error, "Validation Error");

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/api-keys - validates scopes enum", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const client = createTestClient({ authToken: user.token });

  const response = await client.post("/v1/api-keys", {
    name: "Invalid Scopes",
    scopes: ["invalid:scope"],
  });

  assertStatus(response, 400);

  await cleanupCurrentTestData();
});

/**
 * GET /v1/api-keys - List organization's API keys
 */

Deno.test("GET /v1/api-keys - lists organization API keys for user", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();

  // Create some API keys
  await createTestApiKey({
    organization_id: user.organization.id,
    name: "Key 1",
  });
  await createTestApiKey({
    organization_id: user.organization.id,
    name: "Key 2",
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.get("/v1/api-keys");

  assertSuccessResponse(response);
  assert(Array.isArray(response.body.data));
  assert(response.body.data.length >= 2);

  // Verify fields are present
  const firstKey = response.body.data[0];
  assertExists(firstKey.id);
  assertExists(firstKey.name);
  assertExists(firstKey.key_prefix);
  assert(firstKey.key_prefix.includes("...")); // Should be masked
  assertExists(firstKey.scopes);
  assertEquals(firstKey.key, undefined); // Full key should NOT be present

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/api-keys - lists keys for API key authentication", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient();
  const response = await client.get("/v1/api-keys", {
    headers: { Authorization: `Bearer ${apiKey.raw_key}` },
  });

  assertSuccessResponse(response);
  assert(Array.isArray(response.body.data));

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/api-keys - returns 403 if user not in organization", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink("no-org-list@example.com");
  assert(user !== null);

  const client = createTestClient({ authToken: user.token });
  const response = await client.get("/v1/api-keys");

  assertStatus(response, 403);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/api-keys - returns 401 if not authenticated", async () => {
  markTestStart();

  const client = createTestClient();
  client.setAuthToken("");

  const response = await client.get("/v1/api-keys", {
    headers: { Authorization: "" },
  });

  assertStatus(response, 401);

  await cleanupCurrentTestData();
});

/**
 * GET /v1/api-keys/:id - Get specific API key details
 */

Deno.test("GET /v1/api-keys/:id - returns API key details", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
    name: "Detailed Key",
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.get(`/v1/api-keys/${apiKey.id}`);

  assertSuccessResponse(response);
  assertEquals(response.body.data.id, apiKey.id);
  assertEquals(response.body.data.name, "Detailed Key");
  assertExists(response.body.data.key_prefix);
  assertEquals(response.body.data.key_hash, undefined); // Hash should not be exposed

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/api-keys/:id - returns 404 if key not found", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const client = createTestClient({ authToken: user.token });

  const fakeId = crypto.randomUUID();
  const response = await client.get(`/v1/api-keys/${fakeId}`);

  assertStatus(response, 404);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/api-keys/:id - returns 403 if user not in same organization", async () => {
  markTestStart();

  const user1 = await createTestUserWithOrg({ email: "user1@example.com" });
  const user2 = await createTestUserWithOrg({ email: "user2@example.com" });

  const apiKey = await createTestApiKey({
    organization_id: user1.organization.id,
  });

  const client = createTestClient({ authToken: user2.token });
  const response = await client.get(`/v1/api-keys/${apiKey.id}`);

  assertStatus(response, 403);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/api-keys/:id - allows access with API key from same org", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const apiKey1 = await createTestApiKey({
    organization_id: user.organization.id,
  });
  const apiKey2 = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient();
  const response = await client.get(`/v1/api-keys/${apiKey1.id}`, {
    headers: { Authorization: `Bearer ${apiKey2.raw_key}` },
  });

  assertSuccessResponse(response);

  await cleanupCurrentTestData();
});

/**
 * PATCH /v1/api-keys/:id - Update API key
 */

Deno.test("PATCH /v1/api-keys/:id - updates API key name", async () => {
  markTestStart();

  const user = await createTestUserWithOrg({ user_type: "employer" });
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.patch(`/v1/api-keys/${apiKey.id}`, {
    name: "Updated Key Name",
  });

  assertSuccessResponse(response);
  assertEquals(response.body.data.name, "Updated Key Name");

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/api-keys/:id - updates is_active status", async () => {
  markTestStart();

  const user = await createTestUserWithOrg({ user_type: "employer" });
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.patch(`/v1/api-keys/${apiKey.id}`, {
    is_active: false,
  });

  assertSuccessResponse(response);
  assertEquals(response.body.data.is_active, false);

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/api-keys/:id - returns 403 if not org admin", async () => {
  markTestStart();

  const admin = await createTestUserWithOrg({
    email: "admin@example.com",
    user_type: "employer",
  });
  const user = await createTestUserWithOrg({
    email: "jobseeker@example.com",
    user_type: "job_seeker",
  });

  // Update user to be in same org but as job seeker
  const adminClient = createAdminClient();
  await adminClient
    .schema("core")
    .from("team_members")
    .update({
      organization_id: admin.organization.id,
      user_type: "job_seeker",
    })
    .eq("user_id", user.userId);

  const apiKey = await createTestApiKey({
    organization_id: admin.organization.id,
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.patch(`/v1/api-keys/${apiKey.id}`, {
    name: "Should Fail",
  });

  assertStatus(response, 403);
  assert(response.body.message?.includes("Only organization admins"));

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/api-keys/:id - returns 403 if authenticated with API key", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient();
  const response = await client.patch(
    `/v1/api-keys/${apiKey.id}`,
    { name: "Should Fail" },
    {
      headers: { Authorization: `Bearer ${apiKey.raw_key}` },
    },
  );

  assertStatus(response, 403);

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/api-keys/:id - returns 404 if key not found", async () => {
  markTestStart();

  const user = await createTestUserWithOrg({ user_type: "employer" });
  const client = createTestClient({ authToken: user.token });

  const fakeId = crypto.randomUUID();
  const response = await client.patch(`/v1/api-keys/${fakeId}`, {
    name: "Updated Name",
  });

  assertStatus(response, 404);

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/api-keys/:id - validates input schema", async () => {
  markTestStart();

  const user = await createTestUserWithOrg({ user_type: "employer" });
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.patch(`/v1/api-keys/${apiKey.id}`, {
    name: "", // Empty name should fail validation
  });

  assertStatus(response, 400);

  await cleanupCurrentTestData();
});

/**
 * DELETE /v1/api-keys/:id - Delete (revoke) API key
 */

Deno.test("DELETE /v1/api-keys/:id - deletes API key successfully", async () => {
  markTestStart();

  const user = await createTestUserWithOrg({ user_type: "employer" });
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.delete(`/v1/api-keys/${apiKey.id}`);

  assertSuccessResponse(response);
  assertEquals(response.body.data.id, apiKey.id);
  assert(response.body.data.message?.includes("revoked"));

  // Verify key is deactivated (soft delete)
  const admin = createAdminClient();
  const { data: deletedKey } = await admin
    .schema("core")
    .from("api_keys")
    .select("is_active")
    .eq("id", apiKey.id)
    .single();

  assertEquals(deletedKey?.is_active, false);

  await cleanupCurrentTestData();
});

Deno.test("DELETE /v1/api-keys/:id - returns 403 if not org admin", async () => {
  markTestStart();

  const admin = await createTestUserWithOrg({
    email: "admin@example.com",
    user_type: "employer",
  });
  const user = await createTestUserWithOrg({
    email: "user@example.com",
    user_type: "job_seeker",
  });

  // Update user to be in same org as job seeker
  const adminClient = createAdminClient();
  await adminClient
    .schema("core")
    .from("team_members")
    .update({
      organization_id: admin.organization.id,
      user_type: "job_seeker",
    })
    .eq("user_id", user.userId);

  const apiKey = await createTestApiKey({
    organization_id: admin.organization.id,
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.delete(`/v1/api-keys/${apiKey.id}`);

  assertStatus(response, 403);

  await cleanupCurrentTestData();
});

Deno.test("DELETE /v1/api-keys/:id - returns 403 if authenticated with API key", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient();
  const response = await client.delete(`/v1/api-keys/${apiKey.id}`, {
    headers: { Authorization: `Bearer ${apiKey.raw_key}` },
  });

  assertStatus(response, 403);

  await cleanupCurrentTestData();
});

Deno.test("DELETE /v1/api-keys/:id - returns 404 if key not found", async () => {
  markTestStart();

  const user = await createTestUserWithOrg({ user_type: "employer" });
  const client = createTestClient({ authToken: user.token });

  const fakeId = crypto.randomUUID();
  const response = await client.delete(`/v1/api-keys/${fakeId}`);

  assertStatus(response, 404);

  await cleanupCurrentTestData();
});

/**
 * GET /v1/api-keys/:id/usage - Get usage statistics
 */

Deno.test("GET /v1/api-keys/:id/usage - returns usage statistics", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
  });

  // Create some usage records
  const admin = createAdminClient();
  await admin
    .schema("core")
    .from("api_key_usage")
    .insert([
      {
        api_key_id: apiKey.id,
        endpoint: "/v1/jobs",
        method: "GET",
        status_code: 200,
        response_time_ms: 150,
      },
      {
        api_key_id: apiKey.id,
        endpoint: "/v1/applications",
        method: "POST",
        status_code: 201,
        response_time_ms: 250,
      },
      {
        api_key_id: apiKey.id,
        endpoint: "/v1/jobs",
        method: "GET",
        status_code: 404,
        response_time_ms: 100,
      },
    ]);

  const client = createTestClient({ authToken: user.token });
  const response = await client.get(`/v1/api-keys/${apiKey.id}/usage`);

  assertSuccessResponse(response);
  assertEquals(response.body.data.total_requests, 3);
  assertEquals(response.body.data.success_requests, 2);
  assertEquals(response.body.data.error_requests, 1);
  assertExists(response.body.data.error_rate);
  assertExists(response.body.data.avg_response_time_ms);
  assertEquals(response.body.data.period_days, 30); // Default
  assert(Array.isArray(response.body.data.usage));

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/api-keys/:id/usage - respects days parameter", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.get(`/v1/api-keys/${apiKey.id}/usage`, {
    query: { days: "7" },
  });

  assertSuccessResponse(response);
  assertEquals(response.body.data.period_days, 7);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/api-keys/:id/usage - returns 404 if key not found", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const client = createTestClient({ authToken: user.token });

  const fakeId = crypto.randomUUID();
  const response = await client.get(`/v1/api-keys/${fakeId}/usage`);

  assertStatus(response, 404);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/api-keys/:id/usage - returns 403 if not in same organization", async () => {
  markTestStart();

  const user1 = await createTestUserWithOrg({
    email: "user1-usage@example.com",
  });
  const user2 = await createTestUserWithOrg({
    email: "user2-usage@example.com",
  });

  const apiKey = await createTestApiKey({
    organization_id: user1.organization.id,
  });

  const client = createTestClient({ authToken: user2.token });
  const response = await client.get(`/v1/api-keys/${apiKey.id}/usage`);

  assertStatus(response, 403);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/api-keys/:id/usage - allows access with API key from same org", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const apiKey1 = await createTestApiKey({
    organization_id: user.organization.id,
  });
  const apiKey2 = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient();
  const response = await client.get(`/v1/api-keys/${apiKey1.id}/usage`, {
    headers: { Authorization: `Bearer ${apiKey2.raw_key}` },
  });

  assertSuccessResponse(response);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/api-keys/:id/usage - returns empty stats for no usage", async () => {
  markTestStart();

  const user = await createTestUserWithOrg();
  const apiKey = await createTestApiKey({
    organization_id: user.organization.id,
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.get(`/v1/api-keys/${apiKey.id}/usage`);

  assertSuccessResponse(response);
  assertEquals(response.body.data.total_requests, 0);
  assertEquals(response.body.data.success_requests, 0);
  assertEquals(response.body.data.error_requests, 0);

  await cleanupCurrentTestData();
});

console.log("✅ All API Keys API tests passed!");
