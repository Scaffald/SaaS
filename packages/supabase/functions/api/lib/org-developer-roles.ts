/**
 * Who may see and manage an organization's API keys and webhooks (#1440).
 *
 * Both belong to an organization. The two routes used to decide membership
 * from different single sources: api-keys read only `team_members`, webhooks
 * only org-scoped `role_assignments`. So an organization's owner who sits on
 * no team (the seeded orgAdmin, reviewer-employer, is exactly that) was
 * refused every API-key call, and a team_admin with no org-scoped role could
 * not create a webhook. This reads all three relationships, the same ones
 * `useOrganizations` reads in the app (#1312), and both routes use it.
 *
 * Member: on any of the organization's teams, its owner, or holding any role
 *   scoped to it. Members see the organization's keys and webhooks.
 * Admin: `team_admin` in any of its teams, its owner, or holding the `admin`
 *   role scoped to it. Only admins create, change, revoke or delete them.
 *
 * Anything not listed is no access: an organization absent from the map is
 * one the caller does not belong to.
 */

export interface OrgRole {
  admin: boolean;
}

export type OrgRoles = Map<string, OrgRole>;

/** PostgREST hands a to-one embed back as an object or a one-element array. */
function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export interface TeamMemberRow {
  team: { organization_id: string | null } | {
    organization_id: string | null;
  }[] | null;
  role: { key: string | null } | { key: string | null }[] | null;
}

export interface OwnedOrgRow {
  id: string;
}

export interface ScopedRoleRow {
  scope_org_id: string | null;
  role: { name: string | null } | { name: string | null }[] | null;
}

/** The rule itself, over rows already fetched, so it can be tested without a client. */
export function mergeOrgRoles(sources: {
  teams?: ReadonlyArray<TeamMemberRow> | null;
  owned?: ReadonlyArray<OwnedOrgRow> | null;
  roles?: ReadonlyArray<ScopedRoleRow> | null;
}): OrgRoles {
  const roles: OrgRoles = new Map();
  const add = (orgId: string | null | undefined, admin: boolean) => {
    if (!orgId) return;
    roles.set(orgId, { admin: Boolean(roles.get(orgId)?.admin) || admin });
  };
  for (const m of sources.teams ?? []) {
    add(one(m.team)?.organization_id, one(m.role)?.key === "team_admin");
  }
  for (const o of sources.owned ?? []) add(o.id, true);
  for (const r of sources.roles ?? []) {
    add(r.scope_org_id, one(r.role)?.name === "admin");
  }
  return roles;
}

// deno-lint-ignore no-explicit-any
type SupabaseLike = any;

/**
 * Every organization the caller belongs to, and whether they are its admin.
 * Pass the service client: each read is filtered to the caller, so the answer
 * does not depend on how each table's own RLS happens to be written.
 */
export async function callerOrgRoles(
  admin: SupabaseLike,
  userId: string,
): Promise<OrgRoles> {
  const core = admin.schema("core");
  const [teams, owned, scoped] = await Promise.all([
    core
      .from("team_members")
      .select("team:teams(organization_id), role:team_roles(key)")
      .eq("user_id", userId),
    core.from("organizations").select("id").eq("owner_user_id", userId),
    core
      .from("role_assignments")
      .select("scope_org_id, role:roles(name)")
      .eq("user_id", userId)
      .not("scope_org_id", "is", null),
  ]);
  // Any one failing is a failure, not a shorter list.
  for (const result of [teams, owned, scoped]) {
    if (result.error) throw result.error;
  }
  return mergeOrgRoles({
    teams: teams.data,
    owned: owned.data,
    roles: scoped.data,
  });
}

/**
 * Which organization a create call is for: the one named, if the caller
 * belongs to it, or the caller's only one. Never a guess between several
 * (#1037).
 */
export function resolveCreateOrganization(
  roles: OrgRoles,
  requested: string | undefined,
):
  | { ok: true; organizationId: string }
  | { ok: false; status: 400 | 403; message: string } {
  if (requested) {
    if (!roles.has(requested)) {
      return {
        ok: false,
        status: 403,
        message: "You do not belong to that organization",
      };
    }
    return { ok: true, organizationId: requested };
  }
  const ids = [...roles.keys()];
  if (ids.length === 1) return { ok: true, organizationId: ids[0] };
  if (ids.length === 0) {
    return {
      ok: false,
      status: 403,
      message: "You must belong to an organization",
    };
  }
  return {
    ok: false,
    status: 400,
    message: "You belong to more than one organization; pass organization_id",
  };
}
