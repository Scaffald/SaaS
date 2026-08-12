/**
 * Who may read an organization's internal records.
 *
 * This predicate was already written inline three times in organizations.ts
 * (/{id}/location-visibility, /{id}/projects-with-overrides, and now
 * /{id}/background-checks). It is pulled out here because background checks are
 * the most sensitive rows in the schema — consent timestamps, adverse-action
 * dates and findings about named individuals — and a copy of an authorization
 * check is a copy that can drift.
 *
 * Allowed: the organization's owner, anyone holding a role scoped to that
 * organization, and platform admin / super_admin.
 *
 * Note what is deliberately *not* here: being the subject of a record does not
 * grant access to the organization's list. A worker reads their own checks
 * through GET /v1/background-checks.
 */

export interface OrgAccess {
  /** Whether an organization with that id exists at all. */
  found: boolean;
  /** Whether the caller may read its internal records. */
  allowed: boolean;
}

interface RoleRef {
  name?: string | null;
  scope?: string | null;
}

export interface RoleAssignmentRow {
  role: RoleRef | RoleRef[] | null;
  scope_org_id: string | null;
}

/** PostgREST returns an embedded to-one relation as an object or a 1-element array. */
function roleOf(assignment: RoleAssignmentRow): RoleRef | null {
  const role = assignment.role;
  if (!role) return null;
  return Array.isArray(role) ? (role[0] ?? null) : role;
}

/**
 * The decision itself, over rows already fetched — no client, so the rule can be
 * tested directly rather than through a query builder.
 */
export function grantsOrgAccess(
  organizationId: string,
  ownerUserId: string | null,
  userId: string,
  assignments: ReadonlyArray<RoleAssignmentRow>,
): boolean {
  if (ownerUserId && ownerUserId === userId) return true;

  return assignments.some((assignment) => {
    const role = roleOf(assignment);
    if (!role) return false;
    if (assignment.scope_org_id === organizationId) return true;
    return role.scope === "platform" &&
      (role.name === "admin" || role.name === "super_admin");
  });
}

// deno-lint-ignore no-explicit-any
type SupabaseLike = any;

/** Fetch what grantsOrgAccess needs, then apply it. */
export async function canReadOrgInternals(
  supabase: SupabaseLike,
  organizationId: string,
  userId: string,
): Promise<OrgAccess> {
  const { data: org } = await supabase
    .schema("core")
    .from("organizations")
    .select("owner_user_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (!org) return { found: false, allowed: false };

  const { data: assignments } = await supabase
    .schema("core")
    .from("role_assignments")
    .select("role:roles(name, scope), scope_org_id")
    .eq("user_id", userId);

  return {
    found: true,
    allowed: grantsOrgAccess(
      organizationId,
      org.owner_user_id ?? null,
      userId,
      (assignments ?? []) as RoleAssignmentRow[],
    ),
  };
}
