import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  mergeOrgRoles,
  resolveCreateOrganization,
} from "../../lib/org-developer-roles.ts";

Deno.test("mergeOrgRoles - a team member is a member; team_admin is an admin", () => {
  const roles = mergeOrgRoles({
    teams: [
      { team: { organization_id: "a" }, role: { key: "member" } },
      { team: [{ organization_id: "b" }], role: [{ key: "team_admin" }] },
    ],
  });
  assertEquals(roles.get("a"), { admin: false });
  assertEquals(roles.get("b"), { admin: true });
});

Deno.test("mergeOrgRoles - the owner on no team is an admin (#1440)", () => {
  const roles = mergeOrgRoles({ owned: [{ id: "a" }] });
  assertEquals(roles.get("a"), { admin: true });
});

Deno.test("mergeOrgRoles - an org-scoped admin role is an admin; any other scoped role is a member", () => {
  const roles = mergeOrgRoles({
    roles: [
      { scope_org_id: "a", role: { name: "admin" } },
      { scope_org_id: "b", role: [{ name: "recruiter" }] },
      { scope_org_id: null, role: { name: "admin" } },
    ],
  });
  assertEquals(roles.get("a"), { admin: true });
  assertEquals(roles.get("b"), { admin: false });
  assertEquals(roles.size, 2, "a role scoped to no organization grants none");
});

Deno.test("mergeOrgRoles - the strongest relationship wins, whatever order the rows come in", () => {
  const roles = mergeOrgRoles({
    teams: [
      { team: { organization_id: "a" }, role: { key: "team_admin" } },
      { team: { organization_id: "a" }, role: { key: "member" } },
    ],
    roles: [{ scope_org_id: "a", role: { name: "recruiter" } }],
  });
  assertEquals(roles.get("a"), { admin: true });
});

Deno.test("mergeOrgRoles - nothing is no access", () => {
  assertEquals(mergeOrgRoles({}).size, 0);
  assertEquals(
    mergeOrgRoles({ teams: [{ team: null, role: { key: "team_admin" } }] })
      .size,
    0,
  );
});

Deno.test("resolveCreateOrganization - never guesses between several organizations", () => {
  const two = mergeOrgRoles({ owned: [{ id: "a" }, { id: "b" }] });
  const one = mergeOrgRoles({ owned: [{ id: "a" }] });

  const named = resolveCreateOrganization(two, "b");
  assert(named.ok && named.organizationId === "b");

  const ambiguous = resolveCreateOrganization(two, undefined);
  assert(!ambiguous.ok && ambiguous.status === 400);

  const only = resolveCreateOrganization(one, undefined);
  assert(only.ok && only.organizationId === "a");

  const elsewhere = resolveCreateOrganization(one, "z");
  assert(!elsewhere.ok && elsewhere.status === 403);

  const none = resolveCreateOrganization(new Map(), undefined);
  assert(!none.ok && none.status === 403);
});
