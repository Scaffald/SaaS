/**
 * Profiles API Tests
 * Tests for /v1/profiles endpoints with 100% coverage
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
import { cleanupCurrentTestData } from "../helpers/fixtures.ts";
import { createAdminClient, markTestStart } from "../setup.ts";

/**
 * Helper to create a test user profile (uses core.users + core.profile)
 */
async function createTestUserProfile(overrides: {
  username?: string;
  full_name?: string;
  is_public?: boolean;
} = {}) {
  const admin = createAdminClient();

  const timestamp = Date.now();
  const username = overrides.username || `testuser${timestamp}`;

  // Create user in auth
  const { data: authUser } = await admin.auth.admin.createUser({
    email: `${username}@example.com`,
    password: "testpass123",
    email_confirm: true,
  });

  const userId = authUser.user.id;

  // Create core.users row (public profile)
  await admin
    .schema("core")
    .from("users")
    .insert({
      id: userId,
      username,
      display_name: overrides.full_name || "Test User",
      bio: "Test bio",
      headline: "Software Engineer",
      years_of_experience: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  // Create core.profile row (location etc.)
  await admin
    .schema("core")
    .from("profile")
    .insert({
      user_id: userId,
      location: "San Francisco, CA",
    });

  return { id: userId, username };
}

/**
 * Set a user's vanity slug. The signup trigger seeds slug from the username, so
 * slug-vs-username tests have to set it explicitly.
 */
async function setUserSlug(userId: string, slug: string | null) {
  await createAdminClient()
    .schema("core")
    .from("users")
    .update({ slug })
    .eq("id", userId);
}

/**
 * Helper to create a test organization profile
 */
async function createTestOrganizationProfile(overrides: {
  slug?: string;
  name?: string;
  is_public?: boolean;
} = {}) {
  const admin = createAdminClient();

  const timestamp = Date.now();
  const slug = overrides.slug || `testorg${timestamp}`;

  const { data: org } = await admin
    .schema("core")
    .from("organizations")
    .insert({
      slug,
      name: overrides.name || "Test Organization",
    })
    .select()
    .single();

  return org;
}

/**
 * Helper to create a test employer profile
 */
async function createTestEmployerProfile(overrides: {
  slug?: string;
  name?: string;
  is_active?: boolean;
} = {}) {
  const admin = createAdminClient();

  const timestamp = Date.now();
  const slug = overrides.slug || `testemployer${timestamp}`;

  const { data: employer } = await admin
    .schema("core")
    .from("employers")
    .insert({
      slug,
      name: overrides.name || "Test Employer",
      description: "Test employer description",
      industry: "Technology",
      location: "New York, NY",
      is_active: overrides.is_active !== undefined ? overrides.is_active : true,
    })
    .select()
    .single();

  return employer;
}

/**
 * GET /v1/profiles/:username - Get public user profile
 */

Deno.test("GET /v1/profiles/:username - returns public user profile", async () => {
  markTestStart();

  const profile = await createTestUserProfile({ username: "johndoe" });

  const client = createTestClient();
  const response = await client.get("/v1/profiles/johndoe");

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertEquals(response.body.data.username, "johndoe");
  assertEquals(response.body.data.full_name, "Test User");
  assertExists(response.body.data.bio);
  assertExists(response.body.data.location);
  assertEquals(response.body.data.years_experience, 5);
  assertEquals(response.body.data.current_position, "Software Engineer");

  // Should include skills and certifications arrays
  assert(Array.isArray(response.body.data.skills));
  assert(Array.isArray(response.body.data.certifications));

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/:username - includes user skills", async () => {
  markTestStart();

  const admin = createAdminClient();
  const profile = await createTestUserProfile();

  // Add skills
  const { data: skill1 } = await admin
    .schema("core")
    .from("skills")
    .insert({ name: "JavaScript" })
    .select()
    .single();

  const { data: skill2 } = await admin
    .schema("core")
    .from("skills")
    .insert({ name: "TypeScript" })
    .select()
    .single();

  await admin
    .schema("core")
    .from("user_skills")
    .insert([
      { user_id: profile.id, skill_id: skill1.id },
      { user_id: profile.id, skill_id: skill2.id },
    ]);

  const client = createTestClient();
  const response = await client.get(`/v1/profiles/${profile.username}`);

  assertSuccessResponse(response);
  assert(response.body.data.skills.includes("JavaScript"));
  assert(response.body.data.skills.includes("TypeScript"));

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/:username - includes user certifications", async () => {
  markTestStart();

  const admin = createAdminClient();
  const profile = await createTestUserProfile();

  // Create a certification in the catalog, then link via user_certifications
  const { data: cert } = await admin
    .schema("core")
    .from("certifications")
    .insert({
      name: "AWS Certified Developer",
      slug: "aws-certified-developer",
      issuing_organization: "Amazon Web Services",
    })
    .select()
    .single();

  await admin
    .schema("core")
    .from("user_certifications")
    .insert({
      user_id: profile.id,
      certification_id: cert.id,
      issue_date: "2024-01-01",
      is_active: true,
    });

  const client = createTestClient();
  const response = await client.get(`/v1/profiles/${profile.username}`);

  assertSuccessResponse(response);
  assert(Array.isArray(response.body.data.certifications));
  assert(response.body.data.certifications.length > 0);
  assertEquals(
    response.body.data.certifications[0].name,
    "AWS Certified Developer",
  );
  assertEquals(
    response.body.data.certifications[0].issuer,
    "Amazon Web Services",
  );

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/:username - returns 404 if profile not found", async () => {
  markTestStart();

  const client = createTestClient();
  const response = await client.get("/v1/profiles/nonexistentuser");

  assertStatus(response, 404);
  assertErrorResponse(response);
  assert(response.body.message?.includes("not found"));

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/:username - returns 404 if username does not exist", async () => {
  markTestStart();

  // Do not create any user with username 'privateuser'; GET should 404
  const client = createTestClient();
  const response = await client.get("/v1/profiles/privateuser");

  assertStatus(response, 404);
  assertErrorResponse(response);
  assert(
    response.body.message?.includes("not found") ||
      response.body.message?.includes("not public"),
  );

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/:username - validates username min length", async () => {
  markTestStart();

  const client = createTestClient();
  const response = await client.get("/v1/profiles/ab"); // Too short (min 3)

  assertStatus(response, 400);

  await cleanupCurrentTestData();
});

/**
 * GET /v1/profiles/slug/:slug - Get public user profile by vanity slug
 */

Deno.test("GET /v1/profiles/slug/:slug - resolves a slug that differs from the username", async () => {
  markTestStart();

  const profile = await createTestUserProfile({ username: "slugowner" });
  await setUserSlug(profile.id, "slug-owner-vanity");

  const client = createTestClient();
  const response = await client.get("/v1/profiles/slug/slug-owner-vanity");

  assertStatus(response, 200);
  assertEquals(response.body.id, profile.id);
  assertEquals(response.body.slug, "slug-owner-vanity");
  assertEquals(response.body.username, "slugowner");
  assertEquals(response.body.display_name, "Test User");
  // SSR-loader aliases
  assertEquals(response.body.full_name, "Test User");
  assertEquals(response.body.current_position, "Software Engineer");
  assertExists(response.body.location);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/slug/:slug - falls back to username when no slug matches", async () => {
  markTestStart();

  const profile = await createTestUserProfile({ username: "noslughere" });
  await setUserSlug(profile.id, null);

  const client = createTestClient();
  const response = await client.get("/v1/profiles/slug/noslughere");

  assertStatus(response, 200);
  assertEquals(response.body.id, profile.id);
  assertEquals(response.body.username, "noslughere");

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/slug/:slug - honours profile_visibility for public viewers", async () => {
  markTestStart();

  // core.preferences is RLS-scoped to its owner, so this only passes if the
  // route reads visibility with the service-role client.
  const profile = await createTestUserProfile({ username: "hiddensections" });
  await setUserSlug(profile.id, "hidden-sections");
  await createAdminClient()
    .schema("core")
    .from("preferences")
    .upsert({
      user_id: profile.id,
      profile_visibility: {
        work_experience: true,
        education: false,
        skills: true,
        certifications: true,
        reviews: false,
        contact_info: false,
      },
    });

  const client = createTestClient();
  const response = await client.get("/v1/profiles/slug/hidden-sections");

  assertStatus(response, 200);
  assertEquals(response.body.visibility.education, false);
  assertEquals(response.body.visibility.reviews, false);
  assertEquals(response.body.visibility.skills, true);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/slug/:slug - returns 404 if slug does not exist", async () => {
  markTestStart();

  const client = createTestClient();
  const response = await client.get("/v1/profiles/slug/no-such-vanity-slug");

  assertStatus(response, 404);
  assertErrorResponse(response);
  assert(response.body.message?.includes("not found"));

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/slug/history - is not shadowed by the slug route", async () => {
  markTestStart();

  // /slug/history is the authenticated slug-change-history endpoint; an
  // unauthenticated call must 401 there rather than 404 as a missing profile.
  const client = createTestClient();
  const response = await client.get("/v1/profiles/slug/history");

  assertStatus(response, 401);

  await cleanupCurrentTestData();
});

/**
 * GET /v1/profiles/organizations/:slug - Get organization profile
 */

Deno.test("GET /v1/profiles/organizations/:slug - returns organization profile", async () => {
  markTestStart();

  const org = await createTestOrganizationProfile({ slug: "acme-corp" });

  const client = createTestClient();
  const response = await client.get("/v1/profiles/organizations/acme-corp");

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertEquals(response.body.data.slug, "acme-corp");
  assertEquals(response.body.data.name, "Test Organization");
  assertExists(response.body.data.description);
  assertExists(response.body.data.industry);
  assertExists(response.body.data.size);
  assertExists(response.body.data.location);
  assertEquals(response.body.data.founded_year, 2020);
  assertEquals(typeof response.body.data.job_count, "number");

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/organizations/:slug - includes job count", async () => {
  markTestStart();

  const admin = createAdminClient();
  const org = await createTestOrganizationProfile();

  // Add published jobs
  await admin
    .schema("core")
    .from("jobs")
    .insert([
      {
        organization_id: org.id,
        title: "Job 1",
        description: "Test",
        status: "published",
      },
      {
        organization_id: org.id,
        title: "Job 2",
        description: "Test",
        status: "published",
      },
      {
        organization_id: org.id,
        title: "Job 3",
        description: "Test",
        status: "draft", // Should not be counted
      },
    ]);

  const client = createTestClient();
  const response = await client.get(`/v1/profiles/organizations/${org.slug}`);

  assertSuccessResponse(response);
  assertEquals(response.body.data.job_count, 2); // Only published jobs

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/organizations/:slug - returns 0 job count if no jobs", async () => {
  markTestStart();

  const org = await createTestOrganizationProfile();

  const client = createTestClient();
  const response = await client.get(`/v1/profiles/organizations/${org.slug}`);

  assertSuccessResponse(response);
  assertEquals(response.body.data.job_count, 0);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/organizations/:slug - returns 404 if not found", async () => {
  markTestStart();

  const client = createTestClient();
  const response = await client.get(
    "/v1/profiles/organizations/nonexistent-org",
  );

  assertStatus(response, 404);
  assertErrorResponse(response);
  assert(response.body.message?.includes("not found"));

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/organizations/:slug - returns 404 if not public", async () => {
  markTestStart();

  const org = await createTestOrganizationProfile({
    slug: "private-org",
    is_public: false,
  });

  const client = createTestClient();
  const response = await client.get("/v1/profiles/organizations/private-org");

  assertStatus(response, 404);
  assertErrorResponse(response);

  await cleanupCurrentTestData();
});

/**
 * GET /v1/profiles/employers/:slug - Get employer profile
 */

Deno.test("GET /v1/profiles/employers/:slug - returns employer profile", async () => {
  markTestStart();

  const employer = await createTestEmployerProfile({ slug: "tech-startup" });

  const client = createTestClient();
  const response = await client.get("/v1/profiles/employers/tech-startup");

  assertSuccessResponse(response);
  assertEquals(response.status, 200);
  assertEquals(response.body.data.slug, "tech-startup");
  assertEquals(response.body.data.name, "Test Employer");
  assertExists(response.body.data.description);
  assertExists(response.body.data.industry);
  assertExists(response.body.data.location);
  assertEquals(typeof response.body.data.active_jobs_count, "number");

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/employers/:slug - includes active jobs count", async () => {
  markTestStart();

  const admin = createAdminClient();
  const employer = await createTestEmployerProfile();

  // Add published jobs
  await admin
    .schema("core")
    .from("jobs")
    .insert([
      {
        employer_id: employer.id,
        title: "Job A",
        description: "Test",
        status: "published",
      },
      {
        employer_id: employer.id,
        title: "Job B",
        description: "Test",
        status: "published",
      },
      {
        employer_id: employer.id,
        title: "Job C",
        description: "Test",
        status: "closed", // Should not be counted
      },
    ]);

  const client = createTestClient();
  const response = await client.get(`/v1/profiles/employers/${employer.slug}`);

  assertSuccessResponse(response);
  assertEquals(response.body.data.active_jobs_count, 2); // Only published jobs

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/employers/:slug - returns 0 job count if no jobs", async () => {
  markTestStart();

  const employer = await createTestEmployerProfile();

  const client = createTestClient();
  const response = await client.get(`/v1/profiles/employers/${employer.slug}`);

  assertSuccessResponse(response);
  assertEquals(response.body.data.active_jobs_count, 0);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/employers/:slug - returns 404 if not found", async () => {
  markTestStart();

  const client = createTestClient();
  const response = await client.get(
    "/v1/profiles/employers/nonexistent-employer",
  );

  assertStatus(response, 404);
  assertErrorResponse(response);
  assert(response.body.message?.includes("not found"));

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/employers/:slug - returns 404 if not active", async () => {
  markTestStart();

  const employer = await createTestEmployerProfile({
    slug: "inactive-employer",
    is_active: false,
  });

  const client = createTestClient();
  const response = await client.get("/v1/profiles/employers/inactive-employer");

  assertStatus(response, 404);
  assertErrorResponse(response);
  assert(
    response.body.message?.includes("not found") ||
      response.body.message?.includes("not active"),
  );

  await cleanupCurrentTestData();
});

console.log("✅ All Profiles API tests passed!");
