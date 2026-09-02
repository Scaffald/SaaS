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
import {
  createAdminClient,
  createTestSupabaseClient,
  getAuthToken,
  markTestStart,
} from "../setup.ts";

/**
 * Delete a leftover @example.com auth user by address.
 *
 * GoTrue has no get-user-by-email admin call, so this pages listUsers. Only
 * reached when createUser reports a duplicate, so the scan cost is rare. The
 * @example.com guard mirrors cleanupTestAuthUsersAfter: pointing
 * SUPABASE_URL at a real project must not let a fixture delete a real user.
 */
async function deleteAuthUserByEmail(
  // deno-lint-ignore no-explicit-any
  admin: any,
  email: string,
): Promise<void> {
  if (!email.toLowerCase().endsWith("@example.com")) return;

  const perPage = 200;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return;

    const users: { id: string; email?: string }[] = data?.users ?? [];
    const match = users.find(
      (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
    );
    if (match) {
      await admin.auth.admin.deleteUser(match.id);
      return;
    }

    if (users.length < perPage) return;
  }
}

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

  const email = `${username}@example.com`;

  // Create user in auth. Callers that pass a fixed username (johndoe) reuse a
  // fixed email, so a run that died before cleanupCurrentTestData leaves the
  // GoTrue user behind and every later run fails here. Drop the stale one and
  // retry once rather than requiring a manual database cleanup between runs.
  let authUser = await admin.auth.admin.createUser({
    email,
    password: "testpass123",
    email_confirm: true,
  });

  if (authUser.error?.message.includes("already been registered")) {
    await deleteAuthUserByEmail(admin, email);
    authUser = await admin.auth.admin.createUser({
      email,
      password: "testpass123",
      email_confirm: true,
    });
  }

  if (authUser.error || !authUser.data?.user) {
    throw new Error(
      `Failed to create auth user ${username}: ${
        authUser.error?.message ?? "no user returned"
      }`,
    );
  }

  const userId = authUser.data.user.id;

  // The core.handle_new_user trigger on auth.users already created the
  // core.users and core.profile rows, with display_name defaulted to the
  // username. Upsert (not insert) to overwrite them with the seed values a
  // plain insert would lose to a users_pkey/profile_pkey conflict.
  const { error: userError } = await admin
    .schema("core")
    .from("users")
    .upsert({
      id: userId,
      username,
      display_name: overrides.full_name || "Test User",
      bio: "Test bio",
      headline: "Software Engineer",
      years_of_experience: 5,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (userError) {
    throw new Error(
      `Failed to seed core.users for ${username}: ${userError.message}`,
    );
  }

  // Seed core.profile row (location etc.)
  const { error: profileError } = await admin
    .schema("core")
    .from("profile")
    .upsert({
      user_id: userId,
      location: "San Francisco, CA",
    }, { onConflict: "user_id" });

  if (profileError) {
    throw new Error(
      `Failed to seed core.profile for ${username}: ${profileError.message}`,
    );
  }

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

  // core.user_skills is a taxonomy table, not a join to a free-form skill
  // list: user_skills_taxonomy_check makes every row name exactly one catalog.
  // Link rows from the soft-skills catalog that migration 001 seeds, rather
  // than inventing catalog entries — reference data is not cleaned up between
  // runs, so a fixture that writes it poisons the next run.
  //
  // Read that catalog as anon, not via `admin`: core.soft_skills grants SELECT
  // to anon and authenticated but not to service_role.
  const { data: catalog, error: catalogError } =
    await createTestSupabaseClient()
      .schema("core")
      .from("soft_skills")
      .select("id, name")
      .order("name")
      .limit(2);

  if (catalogError || !catalog || catalog.length < 2) {
    throw new Error(
      `Expected at least 2 core.soft_skills rows: ${
        catalogError?.message ?? `got ${catalog?.length ?? 0}`
      }`,
    );
  }

  const { error: linkError } = await admin
    .schema("core")
    .from("user_skills")
    .insert(
      (catalog as { id: string }[]).map((skill) => ({
        user_id: profile.id,
        skill_taxonomy: "soft_skills",
        soft_skill_id: skill.id,
      })),
    );

  if (linkError) {
    throw new Error(`Failed to link user skills: ${linkError.message}`);
  }

  const client = createTestClient();
  const response = await client.get(`/v1/profiles/${profile.username}`);

  assertSuccessResponse(response);
  for (const skill of catalog as { name: string }[]) {
    assert(
      response.body.data.skills.includes(skill.name),
      `expected skills to include '${skill.name}', got ${
        JSON.stringify(response.body.data.skills)
      }`,
    );
  }

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/:username - includes user certifications", async () => {
  markTestStart();

  const admin = createAdminClient();
  const profile = await createTestUserProfile();

  // certification_id references data.certifications, which has no issuer
  // column at all — a certification with an issuer is stored in the freeform
  // name/issuing_organization columns, the other shape
  // user_certifications_catalog_or_freeform allows. Seeding it this way also
  // keeps the fixture from writing catalog rows that outlive the run.
  const { error: certError } = await admin
    .schema("core")
    .from("user_certifications")
    .insert({
      user_id: profile.id,
      name: "AWS Certified Developer",
      issuing_organization: "Amazon Web Services",
      issue_date: "2024-01-01",
      is_active: true,
    });

  if (certError) {
    throw new Error(`Failed to seed user certification: ${certError.message}`);
  }

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
 * Vanity URL slug endpoints
 *
 * Note: these responses are UNENVELOPED (no `data` key) because the SDK returns
 * the HTTP body verbatim — so assert with assertStatus, not assertSuccessResponse.
 */

const SLUG_TEST_PASSWORD = "testpass123";
let slugUserCounter = 0;

// core.users.slug is globally unique and survives a crashed run, so every slug
// a test writes is suffixed with a per-run token. Fixed literals collide with
// leftovers from an earlier run and make these tests flaky.
const SLUG_RUN = Date.now().toString(36);
const slugFor = (name: string) => `${name}-${SLUG_RUN}`;

/**
 * Create a test user, optionally with a slug already set, and sign them in.
 */
async function createSlugTestUser(options: { slug?: string } = {}) {
  const username = `slugtester${Date.now()}${slugUserCounter++}`;
  const profile = await createTestUserProfile({ username });

  if (options.slug) {
    const admin = createAdminClient();
    const { error } = await admin
      .schema("core")
      .from("users")
      .update({ slug: options.slug })
      .eq("id", profile.id);
    if (error) {
      throw new Error(
        `Failed to seed slug '${options.slug}' for ${username}: ${error.message}`,
      );
    }
  }

  const token = await getAuthToken(
    `${username}@example.com`,
    SLUG_TEST_PASSWORD,
  );
  if (!token) {
    throw new Error(`Failed to sign in test user ${username}`);
  }

  return { ...profile, token };
}

/**
 * GET /v1/profiles/slug/check - Check slug availability
 */

Deno.test("GET /v1/profiles/slug/check - returns available for an unused slug", async () => {
  markTestStart();

  const user = await createSlugTestUser();

  const client = createTestClient({ authToken: user.token });
  const response = await client.get("/v1/profiles/slug/check", {
    query: { slug: slugFor("unused") },
  });

  assertStatus(response, 200);
  assertEquals(response.body.available, true);
  assertEquals(response.body.suggestions, []);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/slug/check - returns unavailable with suggestions when taken", async () => {
  markTestStart();

  await createSlugTestUser({ slug: slugFor("taken") });
  const caller = await createSlugTestUser();

  const client = createTestClient({ authToken: caller.token });
  const response = await client.get("/v1/profiles/slug/check", {
    query: { slug: slugFor("taken") },
  });

  assertStatus(response, 200);
  assertEquals(response.body.available, false);
  assert(Array.isArray(response.body.suggestions));
  assert(response.body.suggestions.length > 0);
  assert(
    response.body.suggestions.every((s: string) => s !== slugFor("taken")),
    "suggestions must not include the taken slug",
  );

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/slug/check - caller's own slug counts as available", async () => {
  markTestStart();

  const user = await createSlugTestUser({ slug: slugFor("own") });

  const client = createTestClient({ authToken: user.token });
  const response = await client.get("/v1/profiles/slug/check", {
    query: { slug: slugFor("own") },
  });

  assertStatus(response, 200);
  assertEquals(response.body.available, true);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/slug/check - returns 400 for an invalid slug", async () => {
  markTestStart();

  const user = await createSlugTestUser();
  const client = createTestClient({ authToken: user.token });

  // Too short (min 3)
  assertStatus(
    await client.get("/v1/profiles/slug/check", { query: { slug: "ab" } }),
    400,
  );
  // Illegal characters
  const invalidChars = await client.get("/v1/profiles/slug/check", {
    query: { slug: "Not A Slug!" },
  });
  assertStatus(invalidChars, 400);
  assertErrorResponse(invalidChars);
  // Missing entirely
  assertStatus(await client.get("/v1/profiles/slug/check"), 400);

  await cleanupCurrentTestData();
});

Deno.test("GET /v1/profiles/slug/check - returns 401 without auth", async () => {
  markTestStart();

  const client = createTestClient();
  const response = await client.get("/v1/profiles/slug/check", {
    query: { slug: "some-slug" },
    headers: { Authorization: "" },
  });

  assertStatus(response, 401);
  assertErrorResponse(response);
});

/**
 * PATCH /v1/profiles/slug - Update own slug
 */

Deno.test("PATCH /v1/profiles/slug - updates the slug and records history", async () => {
  markTestStart();

  const user = await createSlugTestUser({ slug: slugFor("before") });

  const client = createTestClient({ authToken: user.token });
  const response = await client.patch("/v1/profiles/slug", {
    slug: slugFor("after"),
  });

  assertStatus(response, 200);
  assertEquals(response.body.success, true);
  assertEquals(response.body.slug, slugFor("after"));
  assertExists(response.body.nextChangeAllowed);
  // Cooldown ends ~30 days out
  assert(
    new Date(response.body.nextChangeAllowed).getTime() > Date.now(),
    "nextChangeAllowed must be in the future",
  );

  const admin = createAdminClient();
  const { data: updated } = await admin
    .schema("core")
    .from("users")
    .select("slug")
    .eq("id", user.id)
    .single();
  assertEquals(updated?.slug, slugFor("after"));

  const { data: history } = await admin
    .schema("core")
    .from("slug_change_history")
    .select("old_slug, new_slug")
    .eq("user_id", user.id);
  assertEquals(history?.length, 1);
  assertEquals(history?.[0].old_slug, slugFor("before"));
  assertEquals(history?.[0].new_slug, slugFor("after"));

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/profiles/slug - normalizes case and surrounding whitespace", async () => {
  markTestStart();

  const user = await createSlugTestUser();
  const client = createTestClient({ authToken: user.token });

  // Uppercase is normalized, not rejected (migration 018 stores lowercase only)
  const response = await client.patch("/v1/profiles/slug", {
    slug: `  MixedCase-${SLUG_RUN.toUpperCase()}  `,
  });

  assertStatus(response, 200);
  assertEquals(response.body.slug, `mixedcase-${SLUG_RUN}`);

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/profiles/slug - enforces the 30-day cooldown", async () => {
  markTestStart();

  const user = await createSlugTestUser({ slug: slugFor("cooldown-start") });
  const client = createTestClient({ authToken: user.token });

  assertStatus(
    await client.patch("/v1/profiles/slug", {
      slug: slugFor("cooldown-first"),
    }),
    200,
  );

  const second = await client.patch("/v1/profiles/slug", {
    slug: slugFor("cooldown-second"),
  });

  assertStatus(second, 400);
  assertErrorResponse(second);
  assert(second.body.message?.includes("30 days"));
  assertExists(second.body.nextChangeAllowed);
  assertEquals(second.body.daysRemaining, 30);

  // The slug is unchanged
  const admin = createAdminClient();
  const { data: updated } = await admin
    .schema("core")
    .from("users")
    .select("slug")
    .eq("id", user.id)
    .single();
  assertEquals(updated?.slug, slugFor("cooldown-first"));

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/profiles/slug - returns 409 with suggestions when taken", async () => {
  markTestStart();

  await createSlugTestUser({ slug: slugFor("already-mine") });
  const caller = await createSlugTestUser({ slug: slugFor("caller") });

  const client = createTestClient({ authToken: caller.token });
  const response = await client.patch("/v1/profiles/slug", {
    slug: slugFor("already-mine"),
  });

  assertStatus(response, 409);
  assertErrorResponse(response);
  assert(Array.isArray(response.body.suggestions));
  assert(response.body.suggestions.length > 0);

  // No history row written for a rejected change
  const admin = createAdminClient();
  const { data: history } = await admin
    .schema("core")
    .from("slug_change_history")
    .select("id")
    .eq("user_id", caller.id);
  assertEquals(history?.length, 0);

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/profiles/slug - returns 400 for an invalid slug", async () => {
  markTestStart();

  const user = await createSlugTestUser();
  const client = createTestClient({ authToken: user.token });

  assertStatus(await client.patch("/v1/profiles/slug", { slug: "ab" }), 400);
  assertStatus(
    await client.patch("/v1/profiles/slug", { slug: "not a slug!" }),
    400,
  );
  assertStatus(
    await client.patch("/v1/profiles/slug", { slug: "a".repeat(51) }),
    400,
  );

  const missing = await client.patch("/v1/profiles/slug", {});
  assertStatus(missing, 400);
  assertErrorResponse(missing);

  await cleanupCurrentTestData();
});

Deno.test("PATCH /v1/profiles/slug - returns 401 without auth", async () => {
  markTestStart();

  const client = createTestClient();
  const response = await client.patch(
    "/v1/profiles/slug",
    { slug: "some-slug" },
    { headers: { Authorization: "" } },
  );

  assertStatus(response, 401);
  assertErrorResponse(response);
});

console.log("✅ All Profiles API tests passed!");
