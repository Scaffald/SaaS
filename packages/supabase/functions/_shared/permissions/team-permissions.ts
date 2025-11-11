import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../database.types.ts";

type ServiceSupabaseClient = SupabaseClient<Database>;

export const TeamPermissions = {
  VIEW: "team.view",
  MANAGE: "team.manage",
  MANAGE_MEMBERS: "team.members.manage",
  MANAGE_ROLES: "team.roles.manage",
  MANAGE_INVITATIONS: "team.invitations.manage",
  VIEW_ANALYTICS: "team.analytics.view",
  MANAGE_APPLICATIONS: "applications.manage",
  REVIEW_APPLICATIONS: "applications.review",
  VIEW_APPLICATIONS: "team.applications.view",
  PARTICIPATE_DISCUSSION: "team.discussion.participate",
} as const;

export type TeamPermissionKey = typeof TeamPermissions[keyof typeof TeamPermissions];

const ORGANIZATION_ADMIN_ROLES = new Set(["admin", "manager", "partner_admin"]);

export type TeamPermissionAssignment = {
  scope_org_id: string | null;
  scope_team_id: string | null;
  role: {
    name: string | null;
    scope: string | null;
  } | null;
};

export interface CheckTeamPermissionArgs {
  supabaseAdmin: ServiceSupabaseClient;
  userId: string;
  permission: TeamPermissionKey;
  organizationId?: string;
  team?: { id: string; organization_id: string };
  teamId?: string;
  assignments?: TeamPermissionAssignment[];
}

export interface CheckTeamPermissionResult {
  allowed: boolean;
  organizationId?: string;
  team?: { id: string; organization_id: string };
}

export async function loadUserRoleAssignments(
  supabaseAdmin: ServiceSupabaseClient,
  userId: string,
): Promise<TeamPermissionAssignment[]> {
  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("role_assignments")
    .select("scope_org_id, scope_team_id, role:roles(name, scope)")
    .eq("user_id", userId);

  if (error) {
    throw new Error(
      `[team-permissions] Failed to load role assignments for user ${userId}: ${error.message}`,
    );
  }

  return data ?? [];
}

export function isSuperAdmin(assignments: TeamPermissionAssignment[]): boolean {
  return assignments.some((assignment) =>
    assignment.role?.scope === "platform" &&
    assignment.role?.name === "super_admin"
  );
}

export function isOrganizationAdminRole(roleName: string | null): boolean {
  if (!roleName) return false;
  return ORGANIZATION_ADMIN_ROLES.has(roleName);
}

export async function checkTeamPermission({
  supabaseAdmin,
  userId,
  permission,
  organizationId,
  team,
  teamId,
  assignments: providedAssignments,
}: CheckTeamPermissionArgs): Promise<CheckTeamPermissionResult> {
  if (!userId) {
    return { allowed: false };
  }

  let assignments = providedAssignments;
  if (!assignments) {
    assignments = await loadUserRoleAssignments(supabaseAdmin, userId);
  }

  const superAdmin = isSuperAdmin(assignments);

  let teamRecord = team ?? null;
  if (!teamRecord && teamId) {
    const { data, error } = await supabaseAdmin
      .schema("core")
      .from("teams")
      .select("id, organization_id")
      .eq("id", teamId)
      .single();

    if (error || !data) {
      return { allowed: false };
    }

    teamRecord = {
      id: data.id as string,
      organization_id: data.organization_id as string,
    };
  }

  const resolvedOrganizationId = organizationId ??
    teamRecord?.organization_id ??
    null;

  if (superAdmin) {
    return {
      allowed: true,
      organizationId: resolvedOrganizationId ?? undefined,
      team: teamRecord ?? undefined,
    };
  }

  if (!resolvedOrganizationId) {
    return { allowed: false };
  }

  const { data: organization, error: organizationError } = await supabaseAdmin
    .schema("core")
    .from("organizations")
    .select("owner_user_id")
    .eq("id", resolvedOrganizationId)
    .maybeSingle();

  if (organizationError) {
    throw new Error(
      `[team-permissions] Failed to load organization ${resolvedOrganizationId}: ${organizationError.message}`,
    );
  }

  if (organization?.owner_user_id === userId) {
    return {
      allowed: true,
      organizationId: resolvedOrganizationId,
      team: teamRecord ?? undefined,
    };
  }

  const hasOrganizationAdminRole = assignments.some((assignment) =>
    assignment.role?.scope === "organization" &&
    assignment.scope_org_id === resolvedOrganizationId &&
    isOrganizationAdminRole(assignment.role?.name ?? null)
  );

  if (hasOrganizationAdminRole) {
    return {
      allowed: true,
      organizationId: resolvedOrganizationId,
      team: teamRecord ?? undefined,
    };
  }

  if (!teamRecord) {
    return { allowed: false };
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .schema("core")
    .from("team_members")
    .select("role_id, status")
    .eq("team_id", teamRecord.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(
      `[team-permissions] Failed to load team membership for user ${userId} and team ${teamRecord.id}: ${membershipError.message}`,
    );
  }

  if (!membership || membership.status === "removed") {
    return { allowed: false };
  }

  if (permission === TeamPermissions.VIEW) {
    return {
      allowed: true,
      organizationId: resolvedOrganizationId,
      team: teamRecord,
    };
  }

  const { data: permissionRecord, error: permissionError } = await supabaseAdmin
    .schema("core")
    .from("team_role_permissions")
    .select("permission_key")
    .eq("role_id", membership.role_id as string)
    .eq("permission_key", permission)
    .maybeSingle();

  if (permissionError) {
    throw new Error(
      `[team-permissions] Failed to check team role permission ${permission} for role ${membership.role_id}: ${permissionError.message}`,
    );
  }

  if (permissionRecord) {
    return {
      allowed: true,
      organizationId: resolvedOrganizationId,
      team: teamRecord,
    };
  }

  return { allowed: false };
}


