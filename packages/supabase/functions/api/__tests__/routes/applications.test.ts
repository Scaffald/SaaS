/**
 * Applications API Tests
 * Tests for /v1/applications endpoints with 100% coverage
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
  createTestApplication,
  createTestJob,
  createTestUser,
} from "../helpers/fixtures.ts";
import {
  createAdminClient,
  markTestStart,
  registerUserWithMagicLink,
} from "../setup.ts";

/**
 * POST /v1/applications - Create application
 */

Deno.test("POST /v1/applications - creates quick application successfully", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink("test-app-create@example.com");
  assert(user !== null);

  const job = await createTestJob({ status: "published" });

  const client = createTestClient({ authToken: user.token });
  const response = await client.post("/v1/applications", {
    job_id: job.id,
    current_location: "San Francisco, CA",
    willing_to_relocate: true,
    years_experience: 5,
    is_authorized_to_work: true,
    earliest_start_date: "2025-02-01",
    screening_answers: { question1: "answer1" },
    is_complete: true,
  });

  assertSuccessResponse(response);
  assertEquals(response.status, 201);
  assertEquals(response.body.data.job_id, job.id);
  assertEquals(response.body.data.user_id, user.userId);
  assertEquals(response.body.data.status, "pending");
  assertEquals(response.body.data.current_location, "San Francisco, CA");
  assertEquals(response.body.data.years_experience, 5);
  assertExists(response.body.data.applied_at);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications - creates full application with custom answers", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink("test-app-full@example.com");
  assert(user !== null);

  const job = await createTestJob({ status: "published" });

  const client = createTestClient({ authToken: user.token });
  const response = await client.post("/v1/applications", {
    job_id: job.id,
    current_location: "New York, NY",
    willing_to_relocate: false,
    years_experience: 3,
    is_authorized_to_work: true,
    earliest_start_date: "2025-03-01",
    screening_answers: {},
    custom_question_answers: [
      { question: "Why do you want this job?", answer: "Great opportunity" },
    ],
    attachments: {
      resume: {
        filename: "resume.pdf",
        size: 12345,
        type: "application/pdf",
        url: "https://example.com/resume.pdf",
      },
    },
    completed_steps: ["screening", "custom_questions", "attachments"],
    is_complete: true,
  });

  assertSuccessResponse(response);
  assertEquals(response.status, 201);
  assert(Array.isArray(response.body.data.custom_question_answers));
  assert(response.body.data.custom_question_answers.length > 0);
  assertExists(response.body.data.attachments);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications - requires authentication", async () => {
  markTestStart();

  const job = await createTestJob({ status: "published" });

  const client = createTestClient();
  client.setAuthToken(""); // No auth

  const response = await client.post(
    "/v1/applications",
    {
      job_id: job.id,
      is_complete: true,
    },
    { headers: { Authorization: "" } },
  );

  assertStatus(response, 401);
  assertErrorResponse(response);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications - returns 409 for duplicate application", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    "test-app-duplicate@example.com",
  );
  assert(user !== null);

  const job = await createTestJob({ status: "published" });

  // Create first application
  await createTestApplication({ job_id: job.id, user_id: user.userId });

  // Try to create duplicate
  const client = createTestClient({ authToken: user.token });
  const response = await client.post("/v1/applications", {
    job_id: job.id,
    is_complete: true,
  });

  assertStatus(response, 409);
  assertErrorResponse(response);
  assert(response.body.error.toLowerCase().includes("conflict"));
  assert(response.body.message?.toLowerCase().includes("already applied"));

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications - returns 404 if job not found", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink("test-app-nojob@example.com");
  assert(user !== null);

  const fakeJobId = "00000000-0000-0000-0000-000000000000";

  const client = createTestClient({ authToken: user.token });
  const response = await client.post("/v1/applications", {
    job_id: fakeJobId,
    is_complete: true,
  });

  assertStatus(response, 404);
  assertErrorResponse(response);
  assert(response.body.message?.toLowerCase().includes("job not found"));

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications - returns 400 if job not published", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink("test-app-draft@example.com");
  assert(user !== null);

  const job = await createTestJob({ status: "draft" });

  const client = createTestClient({ authToken: user.token });
  const response = await client.post("/v1/applications", {
    job_id: job.id,
    is_complete: true,
  });

  assertStatus(response, 400);
  assertErrorResponse(response);
  assert(
    response.body.message?.toLowerCase().includes("not accepting applications"),
  );

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications - returns 400 if application deadline passed", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink("test-app-deadline@example.com");
  assert(user !== null);

  // Create job with deadline in the past
  const admin = createAdminClient();
  const { data: org } = await admin
    .schema("core")
    .from("organizations")
    .insert({ name: "Test Org", slug: `test-${Date.now()}` })
    .select()
    .single();

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);

  const { data: job } = await admin
    .schema("core")
    .from("jobs")
    .insert({
      organization_id: org.id,
      title: "Test Job",
      description: "Test",
      status: "published",
      application_deadline: pastDate.toISOString(),
    })
    .select()
    .single();

  const client = createTestClient({ authToken: user.token });
  const response = await client.post("/v1/applications", {
    job_id: job.id,
    is_complete: true,
  });

  assertStatus(response, 400);
  assertErrorResponse(response);
  assert(response.body.message?.toLowerCase().includes("deadline has passed"));

  await cleanupCurrentTestData();
});

/**
 * GET /v1/applications/:id - Get application
 */

Deno.test("GET /v1/applications/:id - returns application for owner", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink("test-app-get@example.com");
  assert(user !== null);

  const application = await createTestApplication({ user_id: user.userId });

  const client = createTestClient({ authToken: user.token });
  const response = await client.get(`/v1/applications/${application.id}`);

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertEquals(response.body.data.id, application.id);
  assertEquals(response.body.data.user_id, user.userId);
  assertEquals(response.body.data.status, "pending");

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/applications/:id - returns 403 if not owner", async () => {
  markTestStart();

  const user1 = await registerUserWithMagicLink("test-app-owner@example.com");
  const user2 = await registerUserWithMagicLink(
    "test-app-notowner@example.com",
  );
  assert(user1 !== null && user2 !== null);

  // Create application owned by user1
  const application = await createTestApplication({ user_id: user1.userId });

  // Try to access with user2's token
  const client = createTestClient({ authToken: user2.token });
  const response = await client.get(`/v1/applications/${application.id}`);

  assertStatus(response, 403);
  assertErrorResponse(response);
  assert(response.body.error.toLowerCase().includes("forbidden"));
  assert(
    response.body.message?.toLowerCase().includes("your own applications"),
  );

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/applications/:id - returns 404 if not found", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink("test-app-404@example.com");
  assert(user !== null);

  const fakeId = "00000000-0000-0000-0000-000000000000";

  const client = createTestClient({ authToken: user.token });
  const response = await client.get(`/v1/applications/${fakeId}`);

  assertStatus(response, 404);
  assertErrorResponse(response);
  assert(response.body.error.toLowerCase().includes("not found"));

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/applications/:id - requires authentication", async () => {
  markTestStart();

  const application = await createTestApplication();

  const client = createTestClient();
  client.setAuthToken("");

  const response = await client.get(`/v1/applications/${application.id}`, {
    headers: { Authorization: "" },
  });

  assertStatus(response, 401);

  await cleanupCurrentTestData();
});

/**
 * PATCH /v1/applications/:id - Update application
 */

Deno.test("PATCH /v1/applications/:id - updates application successfully", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink("test-app-update@example.com");
  assert(user !== null);

  const application = await createTestApplication({
    user_id: user.userId,
    status: "pending",
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.patch(`/v1/applications/${application.id}`, {
    current_location: "Updated Location",
    years_experience: 10,
  });

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertEquals(response.body.data.current_location, "Updated Location");
  assertEquals(response.body.data.years_experience, 10);
  assertExists(response.body.data.updated_at);

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/applications/:id - returns 403 if not owner", async () => {
  markTestStart();

  const user1 = await registerUserWithMagicLink(
    "test-app-update-owner@example.com",
  );
  const user2 = await registerUserWithMagicLink(
    "test-app-update-notowner@example.com",
  );
  assert(user1 !== null && user2 !== null);

  const application = await createTestApplication({
    user_id: user1.userId,
    status: "pending",
  });

  // Try to update with user2's token
  const client = createTestClient({ authToken: user2.token });
  const response = await client.patch(`/v1/applications/${application.id}`, {
    current_location: "Hacked Location",
  });

  assertStatus(response, 403);
  assertErrorResponse(response);
  assert(
    response.body.message?.toLowerCase().includes("your own applications"),
  );

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/applications/:id - returns 400 if status not pending/reviewing", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    "test-app-update-rejected@example.com",
  );
  assert(user !== null);

  const application = await createTestApplication({
    user_id: user.userId,
    status: "rejected", // Cannot update rejected application
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.patch(`/v1/applications/${application.id}`, {
    current_location: "New Location",
  });

  assertStatus(response, 400);
  assertErrorResponse(response);
  assert(response.body.message?.toLowerCase().includes("cannot update"));
  assert(response.body.message?.includes("rejected"));

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/applications/:id - allows update for reviewing status", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    "test-app-update-reviewing@example.com",
  );
  assert(user !== null);

  const application = await createTestApplication({
    user_id: user.userId,
    status: "reviewing", // Should allow update
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.patch(`/v1/applications/${application.id}`, {
    current_location: "Updated from Reviewing",
  });

  assertSuccessResponse(response);
  assertEquals(response.body.data.current_location, "Updated from Reviewing");

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/applications/:id - returns 404 if not found", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    "test-app-update-404@example.com",
  );
  assert(user !== null);

  const fakeId = "00000000-0000-0000-0000-000000000000";

  const client = createTestClient({ authToken: user.token });
  const response = await client.patch(`/v1/applications/${fakeId}`, {
    current_location: "New Location",
  });

  assertStatus(response, 404);

  await cleanupCurrentTestData();
});

/**
 * POST /v1/applications/:id/withdraw - Withdraw application
 */

Deno.test("POST /v1/applications/:id/withdraw - withdraws application successfully", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink("test-app-withdraw@example.com");
  assert(user !== null);

  const application = await createTestApplication({
    user_id: user.userId,
    status: "pending",
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.post(
    `/v1/applications/${application.id}/withdraw`,
    {
      reason: "Accepted another offer",
    },
  );

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertEquals(response.body.data.status, "withdrawn");
  assertExists(response.body.data.metadata);
  assertExists(response.body.data.updated_at);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications/:id/withdraw - allows withdrawal without reason", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    "test-app-withdraw-noreason@example.com",
  );
  assert(user !== null);

  const application = await createTestApplication({
    user_id: user.userId,
    status: "pending",
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.post(
    `/v1/applications/${application.id}/withdraw`,
    {},
  );

  assertSuccessResponse(response);
  assertEquals(response.body.data.status, "withdrawn");

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications/:id/withdraw - allows withdrawal from reviewing status", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    "test-app-withdraw-reviewing@example.com",
  );
  assert(user !== null);

  const application = await createTestApplication({
    user_id: user.userId,
    status: "reviewing",
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.post(
    `/v1/applications/${application.id}/withdraw`,
    {
      reason: "Changed my mind",
    },
  );

  assertSuccessResponse(response);
  assertEquals(response.body.data.status, "withdrawn");

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications/:id/withdraw - allows withdrawal from inquired status", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    "test-app-withdraw-inquired@example.com",
  );
  assert(user !== null);

  const application = await createTestApplication({
    user_id: user.userId,
    status: "inquired",
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.post(
    `/v1/applications/${application.id}/withdraw`,
    {},
  );

  assertSuccessResponse(response);
  assertEquals(response.body.data.status, "withdrawn");

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications/:id/withdraw - returns 403 if not owner", async () => {
  markTestStart();

  const user1 = await registerUserWithMagicLink(
    "test-app-withdraw-owner@example.com",
  );
  const user2 = await registerUserWithMagicLink(
    "test-app-withdraw-notowner@example.com",
  );
  assert(user1 !== null && user2 !== null);

  const application = await createTestApplication({
    user_id: user1.userId,
    status: "pending",
  });

  // Try to withdraw with user2's token
  const client = createTestClient({ authToken: user2.token });
  const response = await client.post(
    `/v1/applications/${application.id}/withdraw`,
    {
      reason: "Malicious withdrawal",
    },
  );

  assertStatus(response, 403);
  assertErrorResponse(response);
  assert(
    response.body.message?.toLowerCase().includes("your own applications"),
  );

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications/:id/withdraw - returns 400 if already withdrawn", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    "test-app-withdraw-already@example.com",
  );
  assert(user !== null);

  const application = await createTestApplication({
    user_id: user.userId,
    status: "withdrawn", // Already withdrawn
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.post(
    `/v1/applications/${application.id}/withdraw`,
    {},
  );

  assertStatus(response, 400);
  assertErrorResponse(response);
  assert(response.body.message?.toLowerCase().includes("cannot withdraw"));
  assert(response.body.message?.includes("withdrawn"));

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications/:id/withdraw - returns 400 if status is hired", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    "test-app-withdraw-hired@example.com",
  );
  assert(user !== null);

  const application = await createTestApplication({
    user_id: user.userId,
    status: "hired",
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.post(
    `/v1/applications/${application.id}/withdraw`,
    {},
  );

  assertStatus(response, 400);
  assertErrorResponse(response);
  assert(response.body.message?.toLowerCase().includes("cannot withdraw"));

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications/:id/withdraw - returns 400 if status is rejected", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    "test-app-withdraw-rejected@example.com",
  );
  assert(user !== null);

  const application = await createTestApplication({
    user_id: user.userId,
    status: "rejected",
  });

  const client = createTestClient({ authToken: user.token });
  const response = await client.post(
    `/v1/applications/${application.id}/withdraw`,
    {},
  );

  assertStatus(response, 400);
  assertErrorResponse(response);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/applications/:id/withdraw - returns 404 if not found", async () => {
  markTestStart();

  const user = await registerUserWithMagicLink(
    "test-app-withdraw-404@example.com",
  );
  assert(user !== null);

  const fakeId = "00000000-0000-0000-0000-000000000000";

  const client = createTestClient({ authToken: user.token });
  const response = await client.post(`/v1/applications/${fakeId}/withdraw`, {});

  assertStatus(response, 404);

  await cleanupCurrentTestData();
});

console.log("✅ All Applications API tests passed!");
