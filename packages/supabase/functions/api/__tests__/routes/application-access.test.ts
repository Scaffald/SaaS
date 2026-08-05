/**
 * Tests for the employer-side access helper (#527).
 *
 * This decides who can read an organisation's hiring pipeline, so the negative
 * cases matter more than the positive ones. A stranger, and a member of a
 * *different* organisation, must both be refused.
 *
 * The PostgREST select strings the helper uses were validated against the live
 * local database before these were written:
 *   applications?select=...candidate:users!user_id(...),job:jobs!job_id(...)  -> 200
 *   role_assignments?select=scope_org_id,role:roles!role_id(name)            -> 200
 *
 * Stubbed rather than integration-tested because the shared auth fixtures are
 * red for unrelated ES256/auth.uid() reasons.
 */

import {
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  listAccessibleOrganizationIds,
  PIPELINE_ROLES,
  resolveApplicationOrgAccess,
  userHasOrgAccess,
} from "../../lib/application-access.ts";

const APPLICANT = "11111111-1111-1111-1111-111111111111";
const OWNER = "22222222-2222-2222-2222-222222222222";
const ORG_ADMIN = "33333333-3333-3333-3333-333333333333";
const ORG_MEMBER = "44444444-4444-4444-4444-444444444444";
const STRANGER = "55555555-5555-5555-5555-555555555555";
const OTHER_ORG_ADMIN = "66666666-6666-6666-6666-666666666666";

const ORG = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const OTHER_ORG = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const APP_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";

interface Assignment {
  user_id: string;
  scope_org_id: string | null;
  roleName: string;
}

const ASSIGNMENTS: Assignment[] = [
  { user_id: ORG_ADMIN, scope_org_id: ORG, roleName: "admin" },
  { user_id: ORG_MEMBER, scope_org_id: ORG, roleName: "member" },
  { user_id: OTHER_ORG_ADMIN, scope_org_id: OTHER_ORG, roleName: "admin" },
];

/**
 * Minimal stand-in for the PostgREST builder chain. Filters are collected and
 * applied when the chain is awaited, which is close enough to the real thing
 * for the access decisions under test.
 */
function stubSupabase(opts: { application?: unknown; ownedOrgs?: string[] } = {}) {
  const build = (table: string) => {
    const filters: Record<string, unknown> = {};

    const chain = {
      // deno-lint-ignore no-explicit-any
      select(_columns?: string, _opts?: unknown): any {
        return chain;
      },
      // deno-lint-ignore no-explicit-any
      eq(column: string, value: unknown): any {
        filters[column] = value;
        return chain;
      },
      // deno-lint-ignore no-explicit-any
      not(_column: string, _op: string, _value: unknown): any {
        return chain;
      },
      single() {
        return Promise.resolve({ data: opts.application ?? null, error: null });
      },
      maybeSingle() {
        const rows = resolve();
        return Promise.resolve({ data: rows[0] ?? null, error: null });
      },
      // Awaiting the chain resolves the list form.
      // deno-lint-ignore no-explicit-any
      then(onFulfilled: (value: any) => unknown) {
        return Promise.resolve({ data: resolve(), error: null }).then(
          onFulfilled,
        );
      },
    };

    function resolve() {
      if (table === "organizations") {
        return (opts.ownedOrgs ?? [])
          .filter(() => filters.owner_user_id !== undefined)
          .map((id) => ({ id }));
      }

      if (table === "role_assignments") {
        return ASSIGNMENTS
          .filter((a) =>
            filters.user_id === undefined || a.user_id === filters.user_id
          )
          .filter((a) =>
            filters.scope_org_id === undefined ||
            a.scope_org_id === filters.scope_org_id
          )
          .map((a) => ({
            id: `${a.user_id}:${a.scope_org_id}`,
            scope_org_id: a.scope_org_id,
            role: { name: a.roleName },
          }));
      }

      return [];
    }

    return chain;
  };

  return {
    schema() {
      return { from: (table: string) => build(table) };
    },
  };
}

function applicationRow() {
  return {
    id: APP_ID,
    user_id: APPLICANT,
    job_id: "job-1",
    job: {
      organization_id: ORG,
      organization: { owner_user_id: OWNER },
    },
  };
}

Deno.test("missing application reports found:false rather than throwing", async () => {
  const access = await resolveApplicationOrgAccess(
    stubSupabase({ application: null }),
    STRANGER,
    APP_ID,
  );

  assertFalse(access.found);
  assertFalse(access.hasOrgAccess);
});

Deno.test("the applicant is recognised without an org lookup", async () => {
  const access = await resolveApplicationOrgAccess(
    stubSupabase({ application: applicationRow() }),
    APPLICANT,
    APP_ID,
  );

  assertEquals(access.isApplicant, true);
  assertEquals(access.applicantUserId, APPLICANT);
  assertEquals(access.organizationId, ORG);
});

Deno.test("the organisation owner has access", async () => {
  const access = await resolveApplicationOrgAccess(
    stubSupabase({ application: applicationRow() }),
    OWNER,
    APP_ID,
    { allowedRoles: PIPELINE_ROLES },
  );

  assertEquals(access.hasOrgAccess, true);
  assertFalse(access.isApplicant);
});

Deno.test("an org admin has pipeline access", async () => {
  const access = await resolveApplicationOrgAccess(
    stubSupabase({ application: applicationRow() }),
    ORG_ADMIN,
    APP_ID,
    { allowedRoles: PIPELINE_ROLES },
  );

  assertEquals(access.hasOrgAccess, true);
});

Deno.test("a stranger is refused", async () => {
  const access = await resolveApplicationOrgAccess(
    stubSupabase({ application: applicationRow() }),
    STRANGER,
    APP_ID,
    { allowedRoles: PIPELINE_ROLES },
  );

  assertFalse(access.hasOrgAccess);
});

Deno.test("an admin of a different organisation is refused", async () => {
  // The case a naive `role_assignments where user_id = ...` check would miss.
  const access = await resolveApplicationOrgAccess(
    stubSupabase({ application: applicationRow() }),
    OTHER_ORG_ADMIN,
    APP_ID,
    { allowedRoles: PIPELINE_ROLES },
  );

  assertFalse(access.hasOrgAccess);
});

Deno.test("the role allow-list is what separates member from admin", async () => {
  const supabase = stubSupabase({ application: applicationRow() });

  // Omitting allowedRoles reproduces the original message-thread behaviour:
  // any org-scoped assignment qualifies.
  const permissive = await resolveApplicationOrgAccess(
    supabase,
    ORG_MEMBER,
    APP_ID,
  );
  assertEquals(permissive.hasOrgAccess, true);

  // PIPELINE_ROLES is admin-only, so the same user is refused the pipeline.
  const restricted = await resolveApplicationOrgAccess(
    supabase,
    ORG_MEMBER,
    APP_ID,
    { allowedRoles: PIPELINE_ROLES },
  );
  assertFalse(restricted.hasOrgAccess);
});

Deno.test("an empty allow-list denies everyone except the owner", async () => {
  const supabase = stubSupabase({ application: applicationRow() });

  assertEquals(
    await userHasOrgAccess(supabase, OWNER, ORG, OWNER, { allowedRoles: [] }),
    true,
  );
  assertFalse(
    await userHasOrgAccess(supabase, ORG_ADMIN, ORG, OWNER, {
      allowedRoles: [],
    }),
  );
});

Deno.test("an application with no organisation grants nobody org access", async () => {
  const orphan = {
    ...applicationRow(),
    job: { organization_id: null, organization: null },
  };

  const access = await resolveApplicationOrgAccess(
    stubSupabase({ application: orphan }),
    ORG_ADMIN,
    APP_ID,
    { allowedRoles: PIPELINE_ROLES },
  );

  assertFalse(access.hasOrgAccess);
  assertEquals(access.organizationId, null);
});

Deno.test("accessible orgs combine ownership and qualifying roles", async () => {
  const ids = await listAccessibleOrganizationIds(
    stubSupabase({ ownedOrgs: [OTHER_ORG] }),
    ORG_ADMIN,
    { allowedRoles: PIPELINE_ROLES },
  );

  assertEquals([...ids].sort(), [OTHER_ORG, ORG].sort());
});

Deno.test("accessible orgs exclude roles outside the allow-list", async () => {
  const ids = await listAccessibleOrganizationIds(
    stubSupabase({ ownedOrgs: [] }),
    ORG_MEMBER,
    { allowedRoles: PIPELINE_ROLES },
  );

  assertEquals(ids, []);
});

Deno.test("a user with no orgs gets an empty list, not everything", async () => {
  const ids = await listAccessibleOrganizationIds(
    stubSupabase({ ownedOrgs: [] }),
    STRANGER,
    { allowedRoles: PIPELINE_ROLES },
  );

  assertEquals(ids, []);
});
