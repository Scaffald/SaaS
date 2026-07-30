/**
 * Test Fixtures
 * Utilities for creating test data in the database
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient, getTestStartTime } from "../setup.ts";
import {
  generateApiKey,
  getApiKeyPrefix,
  hashApiKey,
} from "../../utils/crypto.ts";

/**
 * Generate unique test identifier
 */
function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Create a test user
 */
export async function createTestUser(overrides: {
  email?: string;
  name?: string;
} = {}) {
  const admin = createAdminClient();

  const email = overrides.email || `${generateTestId()}@example.com`;
  const name = overrides.name || "Test User";

  // Create user via Supabase Auth
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "testpassword123",
    email_confirm: true,
    user_metadata: {
      name,
    },
  });

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return {
    id: data.user.id,
    email: data.user.email || email,
    name,
  };
}

/**
 * Create a test organization
 */
export async function createTestOrganization(overrides: {
  name?: string;
  slug?: string;
} = {}) {
  const admin = createAdminClient();

  const name = overrides.name || `Test Org ${generateTestId()}`;
  const slug = overrides.slug || `test-org-${generateTestId()}`;

  const { data, error } = await admin
    .schema("core")
    .from("organizations")
    .insert({
      name,
      slug,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test organization: ${error.message}`);
  }

  return data;
}

/**
 * Create a test job
 */
export async function createTestJob(overrides: {
  organization_id?: string;
  title?: string;
  description?: string;
  // DB check constraint allows draft|open|paused|closed. "published" is the
  // API-level alias for "open" (see routes/jobs.ts) — map it before insert.
  status?: "draft" | "open" | "paused" | "closed" | "published";
  employment_type?: "full_time" | "part_time" | "contract" | "temp" | "intern";
  remote_option?: "on_site" | "hybrid" | "remote";
  location?: string;
  slug?: string;
} = {}) {
  const admin = createAdminClient();

  // Create org if not provided
  let organizationId = overrides.organization_id;
  if (!organizationId) {
    const org = await createTestOrganization();
    organizationId = org.id;
  }

  const testId = generateTestId();
  const { data, error } = await admin
    .schema("core")
    .from("jobs")
    .insert({
      organization_id: organizationId,
      title: overrides.title || `Test Job ${testId}`,
      description: overrides.description || "This is a test job description",
      status: overrides.status === "published" || !overrides.status
        ? "open"
        : overrides.status,
      employment_type: overrides.employment_type || "full_time",
      remote_option: overrides.remote_option || "remote",
      location: overrides.location || "San Francisco, CA",
      pay_range_min_cents: 10000000, // $100k
      pay_range_max_cents: 15000000, // $150k
      pay_range_type: "salary",
      number_of_openings: 1,
      is_featured: false,
      ...(overrides.slug != null && { slug: overrides.slug }),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test job: ${error.message}`);
  }

  return data;
}

/**
 * Create a test application
 */
// DB check constraint (migration 112) — API-level names like "pending" and
// "reviewing" map through STATUS_API_TO_DB in routes/applications.ts.
const APPLICATION_API_TO_DB_STATUS: Record<string, string> = {
  pending: "new",
  reviewing: "screen",
  interviewing: "interview",
  accepted: "hired",
};

export async function createTestApplication(overrides: {
  job_id?: string;
  user_id?: string;
  status?:
    | "pending"
    | "reviewing"
    | "interviewing"
    | "offer"
    | "accepted"
    | "rejected"
    | "withdrawn";
  type?: "quick" | "full";
} = {}) {
  const admin = createAdminClient();

  // Create job if not provided
  let jobId = overrides.job_id;
  if (!jobId) {
    const job = await createTestJob();
    jobId = job.id;
  }

  // Create user if not provided
  let userId = overrides.user_id;
  if (!userId) {
    const user = await createTestUser();
    userId = user.id;
  }

  const { data, error } = await admin
    .schema("core")
    .from("applications")
    .insert({
      job_id: jobId,
      user_id: userId,
      status: APPLICATION_API_TO_DB_STATUS[overrides.status ?? "pending"] ??
        overrides.status ?? "new",
      type: overrides.type || "quick",
      screening_answers: {},
      custom_answers: {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test application: ${error.message}`);
  }

  return data;
}

/**
 * Create a test API key
 */
export async function createTestApiKey(overrides: {
  organization_id?: string;
  created_by?: string;
  name?: string;
  environment?: "test" | "live";
  tier?: "free" | "pro" | "enterprise";
  scopes?: string[];
  expires_at?: string;
} = {}) {
  const admin = createAdminClient();

  // Create org if not provided
  let organizationId = overrides.organization_id;
  if (!organizationId) {
    const org = await createTestOrganization();
    organizationId = org.id;
  }

  // api_keys.created_by is NOT NULL — create a user if the caller didn't supply one.
  let createdBy = overrides.created_by;
  if (!createdBy) {
    const u = await createTestUser();
    createdBy = u.id;
  }

  // Generate a properly-formatted key (sk_{test|live}_{32 base62}) with the SAME
  // utils the auth middleware validates + hashes with. A hand-rolled key fails
  // validateApiKeyFormat in the middleware, so api-key auth never recognizes it.
  const environment = overrides.environment || "test";
  const rawKey = generateApiKey(environment);
  const keyHash = await hashApiKey(rawKey);

  const { data: apiKeyData, error } = await admin
    .schema("core")
    .from("api_keys")
    .insert({
      organization_id: organizationId,
      created_by: createdBy,
      name: overrides.name || `Test API Key ${generateTestId()}`,
      key_hash: keyHash,
      key_prefix: getApiKeyPrefix(rawKey).replace("...", ""),
      scopes: overrides.scopes || ["jobs:read", "applications:write"],
      rate_limit_tier: overrides.tier || "free",
      expires_at: overrides.expires_at || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test API key: ${error.message}`);
  }

  return {
    ...apiKeyData,
    raw_key: rawKey, // Include raw key for testing
  };
}

/**
 * Create multiple test jobs in bulk
 */
export async function createTestJobs(
  count: number,
  overrides: Parameters<typeof createTestJob>[0] = {},
): Promise<Awaited<ReturnType<typeof createTestJob>>[]> {
  const jobs = [];
  for (let i = 0; i < count; i++) {
    const job = await createTestJob({
      ...overrides,
      title: `${overrides.title || "Test Job"} #${i + 1}`,
    });
    jobs.push(job);
  }
  return jobs;
}

/**
 * Clean up test data created after a specific timestamp
 */
export async function cleanupTestDataAfter(timestamp: number) {
  const admin = createAdminClient();

  const timestampStr = new Date(timestamp).toISOString();

  try {
    // Clean in dependency order
    await admin
      .schema("core")
      .from("applications")
      .delete()
      .gte("created_at", timestampStr);

    await admin.schema("core").from("jobs").delete().gte(
      "created_at",
      timestampStr,
    );

    await admin
      .schema("core")
      .from("api_key_usage")
      .delete()
      .gte("created_at", timestampStr);

    await admin
      .schema("core")
      .from("api_keys")
      .delete()
      .gte("created_at", timestampStr);

    await admin
      .schema("core")
      .from("organizations")
      .delete()
      .gte("created_at", timestampStr);

    await cleanupTestAuthUsersAfter(admin, timestamp);
  } catch (error) {
    console.error("Error cleaning up test data:", error);
  }
}

/**
 * Delete the auth.users records the run created.
 *
 * Deleting core.* rows was never enough: fixtures that use a fixed email
 * (createTestUserProfile({ username: "johndoe" }) -> johndoe@example.com, and
 * the OAuth and application fixtures) left the GoTrue user behind. The second
 * use of that email got `{ user: null, error: "A user with this email address
 * has already been registered" }`, and callers that don't check `error` then
 * threw on `null.id`. Because `deno test *.test.ts` runs every file in one
 * process against one database, this bit *across files within a single run*,
 * not just on local re-runs — the root cause of the ~48 failing route tests
 * in #411.
 *
 * Scoped by BOTH conditions, deliberately:
 *   - created at or after the run's start timestamp, and
 *   - an @example.com address (all 93 fixture emails use it).
 *
 * Either alone would be enough locally. Together they mean that pointing
 * SUPABASE_URL at a real project — the defaults are localhost, but they are
 * env-overridable — cannot delete a real user, because real users are neither
 * @example.com nor created during the run.
 */
async function cleanupTestAuthUsersAfter(
  admin: SupabaseClient,
  timestamp: number,
): Promise<void> {
  const perPage = 200;
  const doomed: Array<{ id: string; email: string }> = [];

  // Collect the full list before deleting anything. Deleting mid-pagination
  // shifts later users into pages already visited, so they would be skipped.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("Error listing auth users for cleanup:", error);
      return;
    }

    const users = data?.users ?? [];

    for (const user of users) {
      const email = (user.email ?? "").toLowerCase();
      if (!email.endsWith("@example.com")) continue;
      if (!user.created_at) continue;
      if (new Date(user.created_at).getTime() < timestamp) continue;
      doomed.push({ id: user.id, email });
    }

    if (users.length < perPage) break;
  }

  for (const user of doomed) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`Error deleting test auth user ${user.email}:`, error);
    }
  }
}

/**
 * Clean up all test data from current test run
 */
export async function cleanupCurrentTestData() {
  const startTime = getTestStartTime();
  await cleanupTestDataAfter(startTime);
}
