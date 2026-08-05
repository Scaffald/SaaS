/**
 * Prerequisites REST API Tests
 * Tests for /v1/prerequisites/check, /complete and /accept-legal, focused on
 * the versioned legal acceptance contract (migration 342): acceptance only
 * counts at the CURRENT core.legal_documents version; /complete and
 * /accept-legal stamp the table's versions (never a literal) and write
 * consent_records audit rows.
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { assertStatus, createTestClient } from "../helpers/test-client.ts";
import { cleanupCurrentTestData, createTestUser } from "../helpers/fixtures.ts";
import { createAdminClient, getAuthToken, markTestStart } from "../setup.ts";

const TEST_PASSWORD = "testpassword123";

async function getCurrentVersions() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .schema("core")
    .from("legal_documents")
    .select("doc_type, version")
    .eq("is_current", true);
  if (error) {
    throw new Error(`Failed to read legal_documents: ${error.message}`);
  }
  const terms = data?.find((d: { doc_type: string }) =>
    d.doc_type === "terms_of_service"
  );
  const privacy = data?.find((d: { doc_type: string }) =>
    d.doc_type === "privacy_policy"
  );
  if (!terms || !privacy) {
    throw new Error("legal_documents missing current rows");
  }
  return { terms: terms.version as string, privacy: privacy.version as string };
}

async function getAnyIndustryId(): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .schema("core")
    .from("industries")
    .select("id")
    .limit(1)
    .single();
  if (error || !data) {
    throw new Error("No seeded industries — run pnpm supa db reset");
  }
  return data.id;
}

function completePayload(industryId: string) {
  return {
    first_name: "Prereq",
    last_name: "Tester",
    address: {
      street: "123 Main St",
      city: "Grand Rapids",
      state: "MI",
      zip: "49503",
      country: "US",
    },
    user_types: ["worker"],
    industry_id: industryId,
    accepts_privacy_policy: true,
    accepts_terms_of_service: true,
  };
}

Deno.test("GET /v1/prerequisites/check - unauthenticated returns incomplete defaults with 200", async () => {
  markTestStart();

  const client = createTestClient();
  client.setAuthToken("");
  const response = await client.get("/v1/prerequisites/check", {
    headers: { Authorization: "" },
  });

  assertStatus(response, 200);
  const body = response.body as Record<string, unknown>;
  assertEquals(body.isComplete, false);
  assertEquals(body.needsOnboarding, true);
  assertEquals(body.needsLegalAcceptance, false);
  assert(body.legal && typeof body.legal === "object");
});

Deno.test("GET /v1/prerequisites/check - fresh user needs onboarding, legal state carries required versions", async () => {
  markTestStart();

  const user = await createTestUser();
  const token = await getAuthToken(user.email, TEST_PASSWORD);
  if (!token) throw new Error("Could not sign in test user");

  const client = createTestClient({ authToken: token });
  const response = await client.get("/v1/prerequisites/check");

  assertStatus(response, 200);
  // deno-lint-ignore no-explicit-any
  const body = response.body as any;
  assertEquals(body.isComplete, false);
  assertEquals(body.needsOnboarding, true);
  // Legal staleness is only surfaced separately once the profile is complete.
  assertEquals(body.needsLegalAcceptance, false);

  const versions = await getCurrentVersions();
  assertEquals(
    body.legal.documents.terms_of_service.requiredVersion,
    versions.terms,
  );
  assertEquals(
    body.legal.documents.privacy_policy.requiredVersion,
    versions.privacy,
  );
  assertEquals(body.legal.documents.terms_of_service.needsAcceptance, true);
  assertEquals(body.hasAcceptedTerms, false);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/prerequisites/complete - stamps the table's current versions and writes consent rows", async () => {
  markTestStart();

  const user = await createTestUser();
  const token = await getAuthToken(user.email, TEST_PASSWORD);
  if (!token) throw new Error("Could not sign in test user");
  const industryId = await getAnyIndustryId();

  const client = createTestClient({ authToken: token });
  const response = await client.post(
    "/v1/prerequisites/complete",
    completePayload(industryId),
  );

  assertStatus(response, 200);
  // deno-lint-ignore no-explicit-any
  assertEquals((response.body as any).success, true);

  const versions = await getCurrentVersions();
  const admin = createAdminClient();
  const { data: prefs } = await admin
    .schema("core")
    .from("preferences")
    .select(
      "terms_of_service_version, privacy_policy_version, accepted_terms_of_service_at",
    )
    .eq("user_id", user.id)
    .single();
  assertEquals(prefs?.terms_of_service_version, versions.terms);
  assertEquals(prefs?.privacy_policy_version, versions.privacy);
  assert(
    prefs?.accepted_terms_of_service_at,
    "acceptance timestamp must be set",
  );

  const { data: consents } = await admin
    .from("consent_records")
    .select("consent_type, consent_version, consent_method")
    .eq("user_id", user.id)
    .in("consent_type", ["terms_of_service", "privacy_policy"]);
  assertEquals(consents?.length, 2);
  for (const row of consents ?? []) {
    assertEquals(row.consent_method, "form_submission");
  }

  // /check now reports fully complete.
  const check = await client.get("/v1/prerequisites/check");
  assertStatus(check, 200);
  // deno-lint-ignore no-explicit-any
  assertEquals((check.body as any).isComplete, true);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/prerequisites/complete - rejects unaccepted legal (400)", async () => {
  markTestStart();

  const user = await createTestUser();
  const token = await getAuthToken(user.email, TEST_PASSWORD);
  if (!token) throw new Error("Could not sign in test user");
  const industryId = await getAnyIndustryId();

  const client = createTestClient({ authToken: token });
  const payload = {
    ...completePayload(industryId),
    accepts_terms_of_service: false,
  };
  const response = await client.post("/v1/prerequisites/complete", payload);

  assertStatus(response, 400);

  await cleanupCurrentTestData();
});

Deno.test("stale accepted version → needsLegalAcceptance; /accept-legal restores completeness", async () => {
  markTestStart();

  const user = await createTestUser();
  const token = await getAuthToken(user.email, TEST_PASSWORD);
  if (!token) throw new Error("Could not sign in test user");
  const industryId = await getAnyIndustryId();

  const client = createTestClient({ authToken: token });
  const complete = await client.post(
    "/v1/prerequisites/complete",
    completePayload(industryId),
  );
  assertStatus(complete, 200);

  // Simulate a published terms version bump for this user: their accepted
  // version no longer equals the current one.
  const admin = createAdminClient();
  const { error: staleError } = await admin
    .schema("core")
    .from("preferences")
    .update({ terms_of_service_version: "v0.9-test-stale" })
    .eq("user_id", user.id);
  if (staleError) {
    throw new Error(`Failed to stale version: ${staleError.message}`);
  }

  // deno-lint-ignore no-explicit-any
  const staleCheck = (await client.get("/v1/prerequisites/check")).body as any;
  assertEquals(staleCheck.isComplete, false);
  assertEquals(staleCheck.needsOnboarding, false);
  assertEquals(staleCheck.needsLegalAcceptance, true);
  assertEquals(staleCheck.hasAcceptedTerms, false);
  assertEquals(staleCheck.hasAcceptedPrivacy, true);
  assertEquals(
    staleCheck.legal.documents.terms_of_service.needsAcceptance,
    true,
  );
  assertEquals(
    staleCheck.legal.documents.terms_of_service.acceptedVersion,
    "v0.9-test-stale",
  );

  // Re-accept via the lightweight endpoint.
  const accept = await client.post("/v1/prerequisites/accept-legal", {
    accepts_terms_of_service: true,
    accepts_privacy_policy: true,
  });
  assertStatus(accept, 200);

  // deno-lint-ignore no-explicit-any
  const finalCheck = (await client.get("/v1/prerequisites/check")).body as any;
  assertEquals(finalCheck.isComplete, true);
  assertEquals(finalCheck.needsLegalAcceptance, false);

  const versions = await getCurrentVersions();
  const { data: prefs } = await admin
    .schema("core")
    .from("preferences")
    .select("terms_of_service_version")
    .eq("user_id", user.id)
    .single();
  assertEquals(prefs?.terms_of_service_version, versions.terms);

  const { data: consents } = await admin
    .from("consent_records")
    .select("consent_method")
    .eq("user_id", user.id)
    .eq("consent_method", "button_click");
  assertEquals(consents?.length, 2);

  await cleanupCurrentTestData();
});

Deno.test("POST /v1/prerequisites/accept-legal - 401 without auth", async () => {
  markTestStart();

  const client = createTestClient();
  client.setAuthToken("");
  const response = await client.post(
    "/v1/prerequisites/accept-legal",
    { accepts_terms_of_service: true, accepts_privacy_policy: true },
    { headers: { Authorization: "" } },
  );

  assertStatus(response, 401);
});

Deno.test("POST /v1/prerequisites/accept-legal - rejects false acceptance (400)", async () => {
  markTestStart();

  const user = await createTestUser();
  const token = await getAuthToken(user.email, TEST_PASSWORD);
  if (!token) throw new Error("Could not sign in test user");

  const client = createTestClient({ authToken: token });
  const response = await client.post("/v1/prerequisites/accept-legal", {
    accepts_terms_of_service: true,
    accepts_privacy_policy: false,
  });

  assertStatus(response, 400);

  await cleanupCurrentTestData();
});
