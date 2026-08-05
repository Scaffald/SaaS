/**
 * Tests for GET /v1/inquiries/by-application/{applicationId} internals.
 *
 * Covers the access decision and the response mapping with a stubbed Supabase
 * client, so they do not depend on the shared auth fixtures (which are red for
 * unrelated ES256/auth.uid() reasons).
 *
 * Every PostgREST select string used by the handler was separately validated
 * against a live local database — that is what surfaced `applied_at` and
 * `application_score`, two columns the legacy tRPC procedure selected which do
 * not exist on core.applications.
 */

import {
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  checkApplicationAccess,
  mapApplicationRecord,
  one,
} from "../../routes/inquiries.ts";

const APPLICANT = "11111111-1111-1111-1111-111111111111";
const OWNER = "22222222-2222-2222-2222-222222222222";
const MEMBER = "33333333-3333-3333-3333-333333333333";
const STRANGER = "44444444-4444-4444-4444-444444444444";
const ORG = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const APP_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

/**
 * Minimal stub of the query-builder chain the handler uses. `applications`
 * resolves to the given row; `role_assignments` resolves to a row only for
 * `memberUserId`.
 */
function stubSupabase(
  // deno-lint-ignore no-explicit-any
  opts: {
    application?: any;
    error?: { message: string };
    memberUserId?: string;
  },
) {
  return {
    schema() {
      return this;
    },
    from(table: string) {
      // deno-lint-ignore no-explicit-any
      const self: any = {
        _table: table,
        _filters: {} as Record<string, unknown>,
        select() {
          return self;
        },
        eq(col: string, val: unknown) {
          self._filters[col] = val;
          return self;
        },
        maybeSingle() {
          if (self._table === "applications") {
            if (opts.error) {
              return Promise.resolve({ data: null, error: opts.error });
            }
            return Promise.resolve({
              data: opts.application ?? null,
              error: null,
            });
          }
          if (self._table === "role_assignments") {
            const match = opts.memberUserId !== undefined &&
              self._filters.user_id === opts.memberUserId;
            return Promise.resolve({
              data: match ? { id: "role-1" } : null,
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        },
      };
      return self;
    },
  };
}

/** An application row shaped the way PostgREST returns it (embeds as objects). */
function applicationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: APP_ID,
    user_id: APPLICANT,
    job_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    job: {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      organization_id: ORG,
      organization: { id: ORG, owner_user_id: OWNER },
    },
    ...overrides,
  };
}

Deno.test("one() unwraps both PostgREST embed shapes", () => {
  assertEquals(one({ id: "x" }), { id: "x" });
  assertEquals(one([{ id: "x" }]), { id: "x" });
  assertEquals(one([]), null);
  assertEquals(one(null), null);
  assertEquals(one(undefined), null);
});

Deno.test("access: the applicant themselves is allowed", async () => {
  const result = await checkApplicationAccess(
    stubSupabase({ application: applicationRow() }),
    APPLICANT,
    APP_ID,
  );
  assertEquals(result, { ok: true });
});

Deno.test("access: the hiring organization's owner is allowed", async () => {
  const result = await checkApplicationAccess(
    stubSupabase({ application: applicationRow() }),
    OWNER,
    APP_ID,
  );
  assertEquals(result, { ok: true });
});

Deno.test("access: a user with a role assignment scoped to the org is allowed", async () => {
  const result = await checkApplicationAccess(
    stubSupabase({ application: applicationRow(), memberUserId: MEMBER }),
    MEMBER,
    APP_ID,
  );
  assertEquals(result, { ok: true });
});

Deno.test("access: an unrelated user is refused with 403, not 404", async () => {
  const result = await checkApplicationAccess(
    stubSupabase({ application: applicationRow() }),
    STRANGER,
    APP_ID,
  );
  assertEquals(result.ok, false);
  assertObjectMatch(result as Record<string, unknown>, { status: 403 });
});

Deno.test("access: a missing application is 404, distinct from 403", async () => {
  const result = await checkApplicationAccess(
    stubSupabase({ application: null }),
    APPLICANT,
    APP_ID,
  );
  assertEquals(result.ok, false);
  assertObjectMatch(result as Record<string, unknown>, {
    status: 404,
    error: "Application not found",
  });
});

Deno.test("access: a query failure is 500, not mistaken for absence", async () => {
  const result = await checkApplicationAccess(
    stubSupabase({ error: { message: "boom" } }),
    APPLICANT,
    APP_ID,
  );
  assertEquals(result.ok, false);
  assertObjectMatch(result as Record<string, unknown>, { status: 500 });
});

Deno.test("access: embeds arriving as arrays still resolve the owner", async () => {
  const row = applicationRow({
    job: [{
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      organization_id: ORG,
      organization: [{ id: ORG, owner_user_id: OWNER }],
    }],
  });
  const result = await checkApplicationAccess(
    stubSupabase({ application: row }),
    OWNER,
    APP_ID,
  );
  assertEquals(result, { ok: true });
});

Deno.test("mapApplicationRecord: null in, null out", () => {
  assertEquals(mapApplicationRecord(null), {
    application: null,
    capabilityQuestions: [],
  });
});

Deno.test("mapApplicationRecord: maps to the camelCase shape the views read", () => {
  const { application, capabilityQuestions } = mapApplicationRecord({
    id: APP_ID,
    status: "new",
    stage_changed_at: "2026-07-28T00:00:00Z",
    score_total: 42,
    created_at: "2026-07-27T00:00:00Z",
    updated_at: "2026-07-29T00:00:00Z",
    job: {
      id: "job-1",
      title: "Senior Software Engineer",
      employment_type: "full_time",
      location: "Clare, MI",
      remote_option: "hybrid",
      pay_range_min_cents: 12000000,
      pay_range_max_cents: 16000000,
      pay_range_type: "salary",
      inquiry_capability_questions: [{ name: "lift_50lb" }],
      organization: { id: ORG, name: "Unicorn" },
    },
    candidate: {
      id: APPLICANT,
      display_name: "Eric Wong",
      username: "ewongagent",
      avatar_path: null,
    },
  });

  assertEquals(application?.status, "new");
  // Sourced from columns that exist: score_total and created_at.
  assertEquals(application?.applicationScore, 42);
  assertEquals(application?.appliedAt, "2026-07-27T00:00:00Z");
  assertEquals(application?.jobTitle, "Senior Software Engineer");
  assertEquals(application?.job?.employmentType, "full_time");
  assertEquals(application?.job?.payRangeMinCents, 12000000);
  assertEquals(application?.job?.organization, { id: ORG, name: "Unicorn" });
  // The office view reads candidate.displayName off this.
  assertEquals(application?.candidate?.displayName, "Eric Wong");
  assertEquals(application?.candidate?.name, "Eric Wong");
  assertEquals(capabilityQuestions, [{ name: "lift_50lb" }]);
});

Deno.test("mapApplicationRecord: candidate name falls back to username", () => {
  const { application } = mapApplicationRecord({
    id: APP_ID,
    created_at: "2026-07-27T00:00:00Z",
    updated_at: "2026-07-27T00:00:00Z",
    candidate: {
      id: APPLICANT,
      display_name: null,
      username: "ewongagent",
      avatar_path: null,
    },
  });
  assertEquals(application?.candidate?.name, "ewongagent");
});

Deno.test("mapApplicationRecord: tolerates a missing job and non-array questions", () => {
  const { application, capabilityQuestions } = mapApplicationRecord({
    id: APP_ID,
    created_at: "2026-07-27T00:00:00Z",
    updated_at: "2026-07-27T00:00:00Z",
    job: null,
  });
  assertEquals(application?.job, null);
  assertEquals(application?.jobTitle, null);
  assertEquals(capabilityQuestions, []);

  const weird = mapApplicationRecord({
    id: APP_ID,
    created_at: "x",
    updated_at: "x",
    job: { id: "job-1", inquiry_capability_questions: "not-an-array" },
  });
  assertEquals(weird.capabilityQuestions, []);
});
