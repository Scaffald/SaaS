import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  canReadOrgInternals,
  grantsOrgAccess,
  type RoleAssignmentRow,
} from "../../lib/org-access.ts";

const ORG = "org-1";
const USER = "user-1";

const scoped = (orgId: string | null): RoleAssignmentRow => ({
  role: { name: "admin", scope: "organization" },
  scope_org_id: orgId,
});

const platform = (name: string): RoleAssignmentRow => ({
  role: { name, scope: "platform" },
  scope_org_id: null,
});

Deno.test("the owner is allowed", () => {
  assert(grantsOrgAccess(ORG, USER, USER, []));
});

Deno.test("a role scoped to the org is allowed", () => {
  assert(grantsOrgAccess(ORG, "someone-else", USER, [scoped(ORG)]));
});

Deno.test("a role scoped to a different org is not", () => {
  // The bug this guards: a user who administers org B must not read org A.
  assertEquals(
    grantsOrgAccess(ORG, "someone-else", USER, [scoped("org-2")]),
    false,
  );
});

Deno.test("platform admin and super_admin are allowed", () => {
  assert(grantsOrgAccess(ORG, "someone-else", USER, [platform("admin")]));
  assert(grantsOrgAccess(ORG, "someone-else", USER, [platform("super_admin")]));
});

Deno.test("an unrelated platform role is not", () => {
  // "worker" and "office" are platform-scoped too; scope alone must not pass.
  assertEquals(
    grantsOrgAccess(ORG, "someone-else", USER, [
      platform("worker"),
      platform("office"),
    ]),
    false,
  );
});

Deno.test("no assignments and not the owner is denied", () => {
  assertEquals(grantsOrgAccess(ORG, "someone-else", USER, []), false);
});

Deno.test("a null role on an assignment is skipped, not thrown on", () => {
  assertEquals(
    grantsOrgAccess(ORG, "someone-else", USER, [
      { role: null, scope_org_id: ORG },
    ]),
    false,
  );
});

Deno.test("an org-scoped assignment survives the array-shaped embed", () => {
  // PostgREST returns the embedded role as an object on some versions and a
  // one-element array on others; both reach this predicate.
  assert(
    grantsOrgAccess(ORG, "someone-else", USER, [
      { role: [{ name: "admin", scope: "organization" }], scope_org_id: ORG },
    ]),
  );
});

Deno.test("a missing owner_user_id does not accidentally match", () => {
  // `null === null` would let anyone in if the owner check were naive.
  assertEquals(grantsOrgAccess(ORG, null, USER, []), false);
});

/** Minimal client returning a canned row per table. */
function fakeSupabase(rows: Record<string, unknown>) {
  return {
    schema: () => ({
      from: (table: string) => {
        const builder = {
          select: () => builder,
          eq: () => builder,
          maybeSingle: () => Promise.resolve({ data: rows[table] ?? null }),
          then: (
            resolve: (v: { data: unknown }) => unknown,
          ) => Promise.resolve({ data: rows[table] ?? null }).then(resolve),
        };
        return builder;
      },
    }),
  };
}

Deno.test("canReadOrgInternals reports a missing org as not found", async () => {
  const result = await canReadOrgInternals(fakeSupabase({}), ORG, USER);

  assertEquals(result, { found: false, allowed: false });
});

Deno.test("canReadOrgInternals separates 'no such org' from 'not yours'", async () => {
  // The route answers 404 for both, so it does not confirm an org id exists —
  // but the two have to be distinguishable here or that choice is not a choice.
  const result = await canReadOrgInternals(
    fakeSupabase({
      organizations: { owner_user_id: "someone-else" },
      role_assignments: [],
    }),
    ORG,
    USER,
  );

  assertEquals(result, { found: true, allowed: false });
});

Deno.test("canReadOrgInternals allows the owner", async () => {
  const result = await canReadOrgInternals(
    fakeSupabase({
      organizations: { owner_user_id: USER },
      role_assignments: [],
    }),
    ORG,
    USER,
  );

  assertEquals(result, { found: true, allowed: true });
});
