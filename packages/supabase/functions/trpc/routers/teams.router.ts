import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { officeProcedure, protectedProcedure, publicProcedure, t } from "../middleware.ts";
import type { Context } from "../context.ts";
import { recordTeamAuditLog } from "../../_shared/team-audit-log.ts";
import { buildAppUrl } from "../../_shared/app-url.ts";
import {
  TeamPermissions,
  type TeamPermissionKey,
  checkTeamPermission,
  isOrganizationAdminRole,
  isSuperAdmin,
  loadUserRoleAssignments,
} from "../../_shared/permissions/team-permissions.ts";
import {
  TEAM_INVITATION_TTL_DEFAULT,
  TEAM_MEMBER_STATUSES,
  teamArchiveSchema,
  teamCreateSchema,
  teamIdSchema,
  teamInvitationCancelSchema,
  teamInvitationCreateSchema,
  teamInvitationIdSchema,
  teamInvitationResendSchema,
  teamInvitationRespondSchema,
  teamInvitationUserRespondSchema,
  teamInvitationStatusFilterSchema,
  teamMemberAddSchema,
  teamMemberRemoveSchema,
  teamMemberStatusChangeSchema,
  teamMemberUpdateSchema,
  teamRoleKeySchema,
  teamUpdateSchema,
} from "../../_shared/team-schemas.ts";

type SupabaseAdminClient = Context["supabaseAdmin"];
type AuthenticatedProcedure = typeof protectedProcedure;

const TEAM_MEMBER_STATUS_SET = new Set(TEAM_MEMBER_STATUSES);

const BASE_TEAM_ROLES: ReadonlyArray<{
  key: string;
  name: string;
  description: string;
}> = [
  {
    key: "admin",
    name: "Team Admin",
    description: "Full access to manage the team, members, roles, and invitations.",
  },
  {
    key: "lead",
    name: "Team Lead",
    description: "Manage day-to-day team operations and collaborate on hiring activities.",
  },
  {
    key: "recruiter",
    name: "Recruiter",
    description: "Manage applications, communication, and scheduling with candidates.",
  },
  {
    key: "reviewer",
    name: "Reviewer",
    description: "Review applications and provide structured feedback.",
  },
  {
    key: "member",
    name: "Member",
    description: "Collaborate on evaluations with read access to shared resources.",
  },
];

const ROLE_PERMISSIONS: Record<string, ReadonlyArray<TeamPermissionKey>> = {
  admin: [
    TeamPermissions.VIEW,
    TeamPermissions.MANAGE,
    TeamPermissions.MANAGE_MEMBERS,
    TeamPermissions.MANAGE_ROLES,
    TeamPermissions.MANAGE_INVITATIONS,
    TeamPermissions.VIEW_ANALYTICS,
    TeamPermissions.MANAGE_APPLICATIONS,
    TeamPermissions.REVIEW_APPLICATIONS,
    TeamPermissions.VIEW_APPLICATIONS,
    TeamPermissions.PARTICIPATE_DISCUSSION,
  ],
  lead: [
    TeamPermissions.VIEW,
    TeamPermissions.MANAGE_MEMBERS,
    TeamPermissions.MANAGE_INVITATIONS,
    TeamPermissions.VIEW_ANALYTICS,
    TeamPermissions.MANAGE_APPLICATIONS,
    TeamPermissions.REVIEW_APPLICATIONS,
    TeamPermissions.VIEW_APPLICATIONS,
    TeamPermissions.PARTICIPATE_DISCUSSION,
  ],
  recruiter: [
    TeamPermissions.VIEW,
    TeamPermissions.MANAGE_APPLICATIONS,
    TeamPermissions.REVIEW_APPLICATIONS,
    TeamPermissions.VIEW_APPLICATIONS,
    TeamPermissions.PARTICIPATE_DISCUSSION,
  ],
  reviewer: [
    TeamPermissions.VIEW,
    TeamPermissions.REVIEW_APPLICATIONS,
    TeamPermissions.VIEW_APPLICATIONS,
    TeamPermissions.PARTICIPATE_DISCUSSION,
  ],
  member: [
    TeamPermissions.VIEW,
    TeamPermissions.VIEW_APPLICATIONS,
    TeamPermissions.PARTICIPATE_DISCUSSION,
  ],
};

const nowIso = () => new Date().toISOString();

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

function generateInvitationToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashInvitationToken(token: string): Promise<string> {
  const encoded = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function callEdgeFunction(path: string, payload: unknown) {
  const baseUrl = Deno.env.get("SUPABASE_FUNCTIONS_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!baseUrl || !serviceKey) {
    console.warn(`[teams] Skipping ${path} call: missing Supabase function configuration.`);
    return null;
  }

  const url = `${baseUrl.replace(/\/$/, "")}/${path}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: unknown = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      console.error(`[teams] ${path} responded with status ${response.status}`, data);
      return null;
    }

    return data as Record<string, unknown> | null;
  } catch (error) {
    console.error(`[teams] Failed to call ${path}`, error);
    return null;
  }
}

async function sendTeamInvitationNotification(payload: {
  invitationId: string;
  token: string;
  actorId: string;
  resend?: boolean;
}) {
  await callEdgeFunction("send-team-invitation", payload);
}

async function publishTeamNotification(event: Record<string, unknown>) {
  await callEdgeFunction("notify-publish", event);
}

function buildTeamDashboardUrl(teamId: string): string {
  return buildAppUrl(`/dashboard/teams/${teamId}`);
}

async function notifyTeamMemberAdded(options: {
  member: ReturnType<typeof transformMember>;
  team: { id: string; name: string | null; organization_id: string };
  actorId: string;
}) {
  const { member, team, actorId } = options;
  if (!member.userId) {
    return;
  }

  const teamName = team.name ?? "your team";
  const roleName = member.role?.name ?? "team member";

  await publishTeamNotification({
    id: `team-assigned:${team.id}:${member.userId}:${Date.now()}`,
    type: "team.assigned",
    severity: "important",
    title: `Added to ${teamName}`,
    message: `You were added to ${teamName} as ${roleName}.`,
    recipients: [member.userId],
    channels: ["in_app", "email", "push"],
    body: {
      teamId: team.id,
      organizationId: team.organization_id,
      roleId: member.roleId,
      roleKey: member.role?.key ?? null,
      roleName,
    },
    metadata: {
      actorId,
      event: "team_member_added",
    },
    cta: {
      label: "View team",
      url: buildTeamDashboardUrl(team.id),
    },
    actorId,
  });
}

async function notifyTeamMemberRemoved(options: {
  member: ReturnType<typeof transformMember>;
  team: { id: string; name: string | null; organization_id: string };
  actorId: string | null;
  reason?: string | null;
}) {
  const { member, team, actorId, reason } = options;
  if (!member.userId) {
    return;
  }

  const teamName = team.name ?? "the team";

  await publishTeamNotification({
    id: `team-removed:${team.id}:${member.userId}:${Date.now()}`,
    type: "team.role_changed",
    severity: "info",
    title: `Removed from ${teamName}`,
    message: `Your access to ${teamName} has been removed.`,
    recipients: [member.userId],
    channels: ["in_app", "email", "push"],
    body: {
      teamId: team.id,
      organizationId: team.organization_id,
      previousRoleId: member.roleId,
      previousRoleKey: member.role?.key ?? null,
      reason: reason ?? null,
    },
    metadata: {
      actorId,
      event: "team_member_removed",
      reason: reason ?? null,
    },
    cta: {
      label: "View invitations",
      url: buildAppUrl("/dashboard/teams/invitations"),
    },
    actorId: actorId ?? undefined,
  });
}

function transformTeam(record: Record<string, any>) {
  const defaultRole = record.default_role as Record<string, any> | null;

  return {
    id: record.id as string,
    organizationId: record.organization_id as string,
    name: record.name as string,
    slug: (record.slug as string) ?? null,
    purpose: (record.purpose as string) ?? null,
    visibility: (record.visibility as string) ?? "organization",
    invitationPolicy: (record.invitation_policy as string) ?? "invite_only",
    description: record.description ?? null,
    imageUrl: (record.image_url as string) ?? null,
    metadata: (record.metadata as Record<string, unknown>) ?? {},
    defaultRoleKey: (record.default_role_key as string) ?? "member",
    defaultRoleId: (record.default_role_id as string) ?? null,
    defaultRole: defaultRole
      ? {
          id: defaultRole.id as string,
          key: defaultRole.key as string,
          name: defaultRole.name as string,
        }
      : null,
    isArchived: Boolean(record.is_archived),
    archivedAt: (record.archived_at as string) ?? null,
    archivedBy: (record.archived_by as string) ?? null,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
    createdBy: (record.created_by as string) ?? null,
  };
}

function transformMember(record: Record<string, any>) {
  const role = record.role as Record<string, any> | null;
  const user = record.user as Record<string, any> | null;

  return {
    id: record.id as string,
    teamId: record.team_id as string,
    userId: record.user_id as string,
    roleId: record.role_id as string | null,
    status: record.status as string,
    joinedAt: (record.joined_at as string) ?? null,
    invitedBy: (record.invited_by as string) ?? null,
    removedAt: (record.removed_at as string) ?? null,
    metadata: (record.metadata as Record<string, unknown>) ?? {},
    createdAt: record.created_at as string,
    role: role
      ? {
          id: role.id as string,
          key: role.key as string,
          name: role.name as string,
        }
      : null,
    user: user
      ? {
          id: user.id as string,
          displayName: (user.display_name as string) ?? null,
          username: (user.username as string) ?? null,
          avatarPath: (user.avatar_path as string) ?? null,
        }
      : null,
  };
}

function transformInvitation(record: Record<string, any>) {
  const role = record.role as Record<string, any> | null;
  const team = record.team as Record<string, any> | null;
  const organization =
    team && (team.organization as Record<string, any> | null)
      ? (team.organization as Record<string, any>)
      : null;

  return {
    id: record.id as string,
    teamId: record.team_id as string,
    email: (record.email as string) ?? null,
    invitedUserId: (record.invited_user_id as string) ?? null,
    roleId: (record.role_id as string) ?? null,
    status: record.status as string,
    expiresAt: (record.expires_at as string) ?? null,
    acceptedAt: (record.accepted_at as string) ?? null,
    declinedAt: (record.declined_at as string) ?? null,
    revokedAt: (record.revoked_at as string) ?? null,
    createdAt: record.created_at as string,
    createdBy: (record.created_by as string) ?? null,
    metadata: (record.metadata as Record<string, unknown>) ?? {},
    role: role
      ? {
          id: role.id as string,
          key: role.key as string,
          name: role.name as string,
        }
      : null,
    team: team
      ? {
          id: team.id as string,
          name: (team.name as string) ?? null,
          organizationId: (team.organization_id as string) ?? null,
          organizationName: organization ? ((organization.name as string) ?? null) : null,
        }
      : null,
  };
}

async function fetchTeamOrThrow(supabaseAdmin: SupabaseAdminClient, teamId: string) {
  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("teams")
    .select("id, name, organization_id, default_role_id, is_archived")
    .eq("id", teamId)
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
      message: error ? `Failed to load team: ${error.message}` : "Team not found",
    });
  }

  return data as {
    id: string;
    name: string | null;
    organization_id: string;
    default_role_id: string | null;
    is_archived: boolean;
  };
}

async function ensureOrganizationRoles(
  supabaseAdmin: SupabaseAdminClient,
  organizationId: string,
): Promise<Map<string, string>> {
  const { data: existingRoles, error: rolesError } = await supabaseAdmin
    .schema("core")
    .from("team_roles")
    .select("id, key")
    .eq("organization_id", organizationId);

  if (rolesError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to load team roles: ${rolesError.message}`,
    });
  }

  const roleMap = new Map<string, string>();
  for (const role of existingRoles ?? []) {
    roleMap.set(role.key as string, role.id as string);
  }

  const missingRoles = BASE_TEAM_ROLES.filter((role) => !roleMap.has(role.key));
  if (missingRoles.length > 0) {
    const insertPayload = missingRoles.map((role) => ({
      organization_id: organizationId,
      key: role.key,
      name: role.name,
      description: role.description,
      is_default: role.key === "member",
      is_system: true,
    }));

    const { data: inserted, error: insertError } = await supabaseAdmin
      .schema("core")
      .from("team_roles")
      .insert(insertPayload)
      .select("id, key");

    if (insertError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to seed team roles: ${insertError.message}`,
      });
    }

    for (const role of inserted ?? []) {
      roleMap.set(role.key as string, role.id as string);
    }
  }

  const roleIds = Array.from(roleMap.values());
  if (roleIds.length > 0) {
    const { data: existingPerms, error: permsError } = await supabaseAdmin
      .schema("core")
      .from("team_role_permissions")
      .select("role_id, permission_key")
      .in("role_id", roleIds);

    if (permsError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to load team role permissions: ${permsError.message}`,
      });
    }

    const permissionMap = new Map<string, Set<string>>();
    for (const record of existingPerms ?? []) {
      const roleId = record.role_id as string;
      const permission = record.permission_key as string;
      const set = permissionMap.get(roleId) ?? new Set<string>();
      set.add(permission);
      permissionMap.set(roleId, set);
    }

    const permissionInserts: Array<{ role_id: string; permission_key: string }> = [];
    for (const [roleKey, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap.get(roleKey);
      if (!roleId || permissions.length === 0) {
        continue;
      }

      const existingSet = permissionMap.get(roleId) ?? new Set<string>();
      for (const permission of permissions) {
        if (!existingSet.has(permission)) {
          permissionInserts.push({
            role_id: roleId,
            permission_key: permission,
          });
        }
      }
    }

    if (permissionInserts.length > 0) {
      const { error: permissionInsertError } = await supabaseAdmin
        .schema("core")
        .from("team_role_permissions")
        .insert(permissionInserts);

      if (permissionInsertError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to seed team role permissions: ${permissionInsertError.message}`,
        });
      }
    }
  }

  return roleMap;
}

async function resolveRoleId(options: {
  supabaseAdmin: SupabaseAdminClient;
  organizationId: string;
  roleId?: string | null;
  roleKey?: z.infer<typeof teamRoleKeySchema> | null;
  teamId?: string;
}) {
  if (options.roleId) {
    return options.roleId;
  }

  if (options.roleKey) {
    const roles = await ensureOrganizationRoles(options.supabaseAdmin, options.organizationId);
    const resolved = roles.get(options.roleKey);
    if (!resolved) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Unknown team role key "${options.roleKey}"`,
      });
    }
    return resolved;
  }

  if (options.teamId) {
    const team = await fetchTeamOrThrow(options.supabaseAdmin, options.teamId);
    return team.default_role_id ?? undefined;
  }

  return undefined;
}

async function ensureOrganizationTeamPermission({
  ctx,
  organizationId,
  permission,
}: {
  ctx: Context;
  organizationId: string;
  permission: TeamPermissionKey;
}) {
  const { supabaseAdmin, user } = ctx;

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  await ensureOrganizationRoles(supabaseAdmin, organizationId);

  const result = await checkTeamPermission({
    supabaseAdmin,
    userId: user.id,
    organizationId,
    permission,
  });

  if (!result.allowed) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to manage teams for this organization.",
    });
  }
}

async function ensureTeamActionPermission({
  ctx,
  team,
  permission,
}: {
  ctx: Context;
  team: { id: string; organization_id: string };
  permission: TeamPermissionKey;
}) {
  const { supabaseAdmin, user } = ctx;

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  await ensureOrganizationRoles(supabaseAdmin, team.organization_id);

  const result = await checkTeamPermission({
    supabaseAdmin,
    userId: user.id,
    team,
    permission,
  });

  if (!result.allowed) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action on the team.",
    });
  }
}

function buildMembersRouter(procedure: AuthenticatedProcedure) {
  return t.router({
    roles: procedure
      .input(
        z
          .object({
            organizationId: z.string().uuid().optional(),
            teamId: teamIdSchema.optional(),
          })
          .refine(
            (input) => Boolean(input.organizationId ?? input.teamId),
            "Provide an organizationId or teamId to load roles",
          ),
      )
      .query(async ({ ctx, input }) => {
        const { supabaseAdmin } = ctx;

        let organizationId = input.organizationId ?? null;
        let team: { id: string; organization_id: string } | null = null;

        if (input.teamId) {
          team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);
          organizationId = team.organization_id;
          await ensureTeamActionPermission({
            ctx,
            team,
            permission: TeamPermissions.MANAGE_ROLES,
          });
        } else if (organizationId) {
          await ensureOrganizationTeamPermission({
            ctx,
            organizationId,
            permission: TeamPermissions.MANAGE_ROLES,
          });
        }

        if (!organizationId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unable to resolve organization for team roles" });
        }

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("team_roles")
          .select("id, key, name, description, is_default, is_system")
          .eq("organization_id", organizationId)
          .order("name", { ascending: true });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to load team roles: ${error.message}`,
          });
        }

        return {
          roles: (data ?? []).map((role) => ({
            id: role.id as string,
            key: role.key as string,
            name: role.name as string,
            description: role.description as string | null,
            isDefault: Boolean(role.is_default),
            isSystem: Boolean(role.is_system),
          })),
        };
      }),

    list: procedure
      .input(z.object({ teamId: teamIdSchema }))
      .query(async ({ ctx, input }) => {
        const { supabaseAdmin } = ctx;

        const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);
        await ensureTeamActionPermission({
          ctx,
          team,
          permission: TeamPermissions.VIEW,
        });

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("team_members")
          .select(
            `
            id,
            team_id,
            user_id,
            role_id,
            status,
            joined_at,
            invited_by,
            removed_at,
            metadata,
            created_at,
            role:team_roles(id, key, name),
            user:users(id, display_name, username, avatar_path)
          `,
          )
          .eq("team_id", input.teamId)
          .neq("status", "removed")
          .order("created_at", { ascending: true });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to load team members: ${error.message}`,
          });
        }

        return {
          members: (data ?? []).map((record) => transformMember(record)),
        };
      }),

    add: procedure
      .input(teamMemberAddSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);

        if (team.is_archived) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot add members to an archived team",
          });
        }

        await ensureTeamActionPermission({
          ctx,
          team,
          permission: TeamPermissions.MANAGE_MEMBERS,
        });

        const resolvedRoleId = await resolveRoleId({
          supabaseAdmin,
          organizationId: team.organization_id,
          roleId: input.roleId,
          roleKey: input.roleKey,
          teamId: input.teamId,
        });

        if (!resolvedRoleId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A team role is required when adding a member",
          });
        }

        const status = input.status ?? "active";

        const insertPayload = {
          team_id: input.teamId,
          user_id: input.userId,
          role_id: resolvedRoleId,
          status,
          invited_by: input.addedBy ?? user.id,
          joined_at: status === "active" ? nowIso() : null,
          metadata: input.metadata ?? {},
        };

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("team_members")
          .insert(insertPayload)
          .select(
            `
            *,
            role:team_roles(id, key, name),
            user:users(id, display_name, username, avatar_path)
          `,
          )
          .single();

        if (error) {
          if (error.code === "23505") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This user is already a member of the team",
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to add team member: ${error.message}`,
          });
        }

        const member = transformMember(data as Record<string, any>);

        await recordTeamAuditLog({
          supabaseAdmin,
          teamId: input.teamId,
          action: status === "active" ? "joined" : "invited",
          actorUserId: user.id,
          memberUserId: member.userId ?? null,
          metadata: {
            method: "manual_add",
            status,
          },
        });

        if (member.status === "active") {
          await notifyTeamMemberAdded({ member, team, actorId: user.id });
        }

        return { member };
      }),

    update: procedure
      .input(teamMemberUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const { data: existingMember, error: existingError } = await supabaseAdmin
          .schema("core")
          .from("team_members")
          .select(
            `
            id,
            team_id,
            user_id,
            role_id,
            status,
            metadata,
            role:team_roles(id, key, name)
          `,
          )
          .eq("id", input.teamMemberId)
          .single();

        if (existingError || !existingMember) {
          throw new TRPCError({
            code: existingError?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: existingError ? `Failed to load team member: ${existingError.message}` : "Team member not found",
          });
        }

        const teamId = existingMember.team_id as string;

        if (input.teamId && input.teamId !== teamId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "teamId does not match the member's team",
          });
        }

        const team = await fetchTeamOrThrow(supabaseAdmin, teamId);
        await ensureTeamActionPermission({
          ctx,
          team,
          permission: TeamPermissions.MANAGE_MEMBERS,
        });

        const updates: Record<string, unknown> = {};

        if (input.roleId || input.roleKey) {
          const resolvedRoleId = await resolveRoleId({
            supabaseAdmin,
            organizationId: team.organization_id,
            roleId: input.roleId,
            roleKey: input.roleKey,
            teamId,
          });

          if (!resolvedRoleId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Failed to resolve team member role",
            });
          }

          updates.role_id = resolvedRoleId;
        }

        if (input.status) {
          if (!TEAM_MEMBER_STATUS_SET.has(input.status)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Unsupported team member status "${input.status}"`,
            });
          }

          updates.status = input.status;
          if (input.status === "removed") {
            updates.removed_at = input.removedAt ?? nowIso();
          } else if (input.removedAt !== undefined) {
            updates.removed_at = input.removedAt;
          } else {
            updates.removed_at = null;
          }
        }

        if (input.joinedAt !== undefined) {
          updates.joined_at = input.joinedAt;
        }

        if (input.metadata !== undefined) {
          updates.metadata = input.metadata ?? {};
        }

        if (input.removedAt !== undefined && updates.status === undefined) {
          updates.removed_at = input.removedAt;
        }

        if (Object.keys(updates).length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Provide at least one change when modifying a team member",
          });
        }

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("team_members")
          .update(updates)
          .eq("id", input.teamMemberId)
          .select(
            `
            *,
            role:team_roles(id, key, name),
            user:users(id, display_name, username, avatar_path)
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error ? `Failed to update team member: ${error.message}` : "Team member not found",
          });
        }

        const member = transformMember(data as Record<string, any>);

        const roleChanged = updates.role_id !== undefined &&
          existingMember.role_id !== member.role?.id;
        const statusChanged = updates.status !== undefined &&
          existingMember.status !== updates.status;

        if (roleChanged) {
          await recordTeamAuditLog({
            supabaseAdmin,
            teamId,
            action: "role_changed",
            actorUserId: user.id,
            memberUserId: member.userId ?? null,
            metadata: {
              previousRoleId: existingMember.role_id,
              previousRoleKey: existingMember.role?.key ?? null,
              newRoleId: member.role?.id ?? null,
              newRoleKey: member.role?.key ?? null,
            },
          });
        }

        if (statusChanged) {
          const newStatus = updates.status as string;
          if (newStatus === "removed") {
            await recordTeamAuditLog({
              supabaseAdmin,
              teamId,
              action: "removed",
              actorUserId: user.id,
              memberUserId: member.userId ?? null,
              metadata: {
                previousStatus: existingMember.status,
                removalReason: input.removedAt ? "timestamp_update" : null,
              },
            });

            await notifyTeamMemberRemoved({
              member,
              team,
              actorId: user.id,
              reason: input.removedAt ? "timestamp_update" : null,
            });
          } else if (
            newStatus === "active" &&
            existingMember.status === "removed"
          ) {
            await recordTeamAuditLog({
              supabaseAdmin,
              teamId,
              action: "reinstated",
              actorUserId: user.id,
              memberUserId: member.userId ?? null,
              metadata: {
                previousStatus: existingMember.status,
              },
            });
          }
        }

        return { member };
      }),

    remove: procedure
      .input(teamMemberRemoveSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const { data: existingMember, error: memberError } = await supabaseAdmin
          .schema("core")
          .from("team_members")
          .select("metadata")
          .eq("id", input.teamMemberId)
          .eq("team_id", input.teamId)
          .single();

        if (memberError || !existingMember) {
          throw new TRPCError({
            code: memberError?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: memberError ? `Failed to load team member: ${memberError.message}` : "Team member not found",
          });
        }

        const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);
        await ensureTeamActionPermission({
          ctx,
          team,
          permission: TeamPermissions.MANAGE_MEMBERS,
        });

        const metadata = (existingMember.metadata as Record<string, unknown> | null) ?? {};
        if (input.reason) {
          metadata.removalReason = input.reason;
        }

        const updates: Record<string, unknown> = {
          status: "removed",
          removed_at: nowIso(),
        };

        if (input.reason) {
          updates.metadata = metadata;
        }

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("team_members")
          .update(updates)
          .eq("id", input.teamMemberId)
          .eq("team_id", input.teamId)
          .select(
            `
            *,
            role:team_roles(id, key, name),
            user:users(id, display_name, username, avatar_path)
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error ? `Failed to remove team member: ${error.message}` : "Team member not found",
          });
        }

        const member = transformMember(data as Record<string, any>);

        await recordTeamAuditLog({
          supabaseAdmin,
          teamId: input.teamId,
          action: "removed",
          actorUserId: user.id,
          memberUserId: member.userId ?? null,
          metadata: {
            reason: input.reason ?? null,
          },
        });

        await notifyTeamMemberRemoved({
          member,
          team,
          actorId: user.id,
          reason: input.reason ?? null,
        });

        return { member };
      }),

    statusChange: procedure
      .input(teamMemberStatusChangeSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!TEAM_MEMBER_STATUS_SET.has(input.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Unsupported team member status "${input.status}"`,
          });
        }

        const { data: existingMember, error: existingError } = await supabaseAdmin
          .schema("core")
          .from("team_members")
          .select("team_id, user_id, status")
          .eq("id", input.teamMemberId)
          .single();

        if (existingError || !existingMember) {
          throw new TRPCError({
            code: existingError?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: existingError ? `Failed to load team member: ${existingError.message}` : "Team member not found",
          });
        }

        const team = await fetchTeamOrThrow(supabaseAdmin, existingMember.team_id as string);
        await ensureTeamActionPermission({
          ctx,
          team,
          permission: TeamPermissions.MANAGE_MEMBERS,
        });

        const updates: Record<string, unknown> = {
          status: input.status,
          updated_at: nowIso(),
        };

        if (input.status === "removed") {
          updates.removed_at = nowIso();
        } else {
          updates.removed_at = null;
        }

        if (input.status === "active") {
          updates.joined_at = updates.joined_at ?? nowIso();
        }

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("team_members")
          .update(updates)
          .eq("id", input.teamMemberId)
          .select(
            `
            *,
            role:team_roles(id, key, name),
            user:users(id, display_name, username, avatar_path)
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error ? `Failed to update team member status: ${error.message}` : "Team member not found",
          });
        }

        const member = transformMember(data as Record<string, any>);

        if (input.status === "removed") {
          await recordTeamAuditLog({
            supabaseAdmin,
            teamId: member.teamId,
            action: "removed",
            actorUserId: user?.id ?? null,
            memberUserId: member.userId ?? null,
            metadata: {
              previousStatus: existingMember.status,
            },
          });
        } else if (input.status === "active" && existingMember.status === "removed") {
          await recordTeamAuditLog({
            supabaseAdmin,
            teamId: member.teamId,
            action: "reinstated",
            actorUserId: user?.id ?? null,
            memberUserId: member.userId ?? null,
            metadata: {
              previousStatus: existingMember.status,
            },
          });
        }

        return { member };
      }),
  });
}

function buildInvitationsRouter(procedure: AuthenticatedProcedure) {
  return t.router({
    list: procedure
      .input(
        z.object({
          teamId: teamIdSchema,
          status: teamInvitationStatusFilterSchema,
        }),
      )
      .query(async ({ ctx, input }) => {
        const { supabaseAdmin } = ctx;

        const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);
        await ensureTeamActionPermission({
          ctx,
          team,
          permission: TeamPermissions.MANAGE_INVITATIONS,
        });

        let query = supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .select(
            `
            id,
            team_id,
            email,
            invited_user_id,
            role_id,
            status,
            expires_at,
            accepted_at,
            declined_at,
            revoked_at,
            created_at,
            created_by,
            metadata,
            role:team_roles(id, key, name)
          `,
          )
          .eq("team_id", input.teamId)
          .order("created_at", { ascending: false });

        if (input.status) {
          query = query.eq("status", input.status);
        }

        const { data, error } = await query;

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to load team invitations: ${error.message}`,
          });
        }

        return {
          invitations: (data ?? []).map((record) => transformInvitation(record as Record<string, any>)),
        };
      }),

    mine: procedure
      .input(
        z
          .object({
            status: teamInvitationStatusFilterSchema,
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const normalizedEmail = user.email ? user.email.trim().toLowerCase() : null;
        const status = input?.status ?? "pending";

        let query = supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .select(
            `
            *,
            team:teams(
              id,
              name,
              organization_id,
              organization:organizations(id, name)
            ),
            role:team_roles(id, key, name)
          `,
          )
          .order("created_at", { ascending: false });

        if (status) {
          query = query.eq("status", status);
        }

        const filters: string[] = [`invited_user_id.eq.${user.id}`];
        if (normalizedEmail) {
          filters.push(`email.eq.${normalizedEmail}`);
        }

        if (filters.length === 1) {
          query = query.eq("invited_user_id", user.id);
        } else {
          query = query.or(filters.join(","));
        }

        const { data, error } = await query;

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to load invitations: ${error.message}`,
          });
        }

        return {
          invitations: (data ?? []).map((record) => transformInvitation(record as Record<string, any>)),
        };
      }),

    create: procedure
      .input(teamInvitationCreateSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);

        await ensureTeamActionPermission({
          ctx,
          team,
          permission: TeamPermissions.MANAGE_INVITATIONS,
        });

        const resolvedRoleId = await resolveRoleId({
          supabaseAdmin,
          organizationId: team.organization_id,
          roleId: input.roleId,
          roleKey: input.roleKey,
          teamId: input.teamId,
        });

        if (!resolvedRoleId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "An invitation role must be provided",
          });
        }

        const normalizedEmail = input.email ? String(input.email).trim().toLowerCase() : null;

        if (input.userId) {
          const { data: existingMember } = await supabaseAdmin
            .schema("core")
            .from("team_members")
            .select("id, status")
            .eq("team_id", input.teamId)
            .eq("user_id", input.userId)
            .maybeSingle();

          if (existingMember && existingMember.status !== "removed") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This user is already a member of the team",
            });
          }
        }

        const rawToken = generateInvitationToken();
        const tokenHash = await hashInvitationToken(rawToken);
        const expiresAt = input.expiresAt ? new Date(input.expiresAt) : addDays(new Date(), TEAM_INVITATION_TTL_DEFAULT);

        const metadata = {
          ...(input.metadata ?? {}),
          message: input.message ?? undefined,
        };

        const insertPayload = {
          team_id: input.teamId,
          invited_user_id: input.userId ?? null,
          email: normalizedEmail,
          role_id: resolvedRoleId,
          token: tokenHash,
          status: "pending",
          expires_at: expiresAt.toISOString(),
          accepted_at: null,
          declined_at: null,
          created_by: user.id,
          metadata,
        };

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .insert(insertPayload)
          .select(
            `
            *,
            role:team_roles(id, key, name)
          `,
          )
          .single();

        if (error || !data) {
          if (error?.code === "23505") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "An active invitation already exists for this recipient",
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error ? `Failed to create team invitation: ${error.message}` : "Failed to create team invitation",
          });
        }

        const invitation = transformInvitation(data as Record<string, any>);

        await recordTeamAuditLog({
          supabaseAdmin,
          teamId: team.id,
          action: "invited",
          actorUserId: user.id,
          memberUserId: input.userId ?? null,
          metadata: {
            email: input.email ?? null,
            roleId: resolvedRoleId,
            expiresAt: expiresAt.toISOString(),
          },
        });

        await sendTeamInvitationNotification({
          invitationId: invitation.id,
          token: rawToken,
          actorId: user.id,
        });

        return {
          invitation,
          token: rawToken,
        };
      }),

    resend: procedure
      .input(teamInvitationResendSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);
        await ensureTeamActionPermission({
          ctx,
          team,
          permission: TeamPermissions.MANAGE_INVITATIONS,
        });

        const { data: invitation, error: fetchError } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .select("metadata, status, expires_at")
          .eq("id", input.invitationId)
          .eq("team_id", input.teamId)
          .single();

        if (fetchError || !invitation) {
          throw new TRPCError({
            code: fetchError?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: fetchError ? `Failed to load invitation: ${fetchError.message}` : "Invitation not found",
          });
        }

        if ((invitation.status as string) !== "pending" && (invitation.status as string) !== "expired") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invitation cannot be resent while in status "${invitation.status}".`,
          });
        }

        const metadata = (invitation.metadata as Record<string, unknown> | null) ?? {};
        const resendCount = Number(metadata.resendCount ?? 0) + 1;
        metadata.resendCount = resendCount;
        metadata.lastResentAt = nowIso();
        metadata.lastTokenIssuedAt = nowIso();

        const rawToken = generateInvitationToken();
        const tokenHash = await hashInvitationToken(rawToken);
        const currentExpiry = invitation.expires_at ? new Date(invitation.expires_at as string) : null;
        const suggestedExpiry = addDays(new Date(), TEAM_INVITATION_TTL_DEFAULT);
        const nextExpiry = currentExpiry && currentExpiry > suggestedExpiry ? currentExpiry : suggestedExpiry;

        const { error } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .update({
            token: tokenHash,
            expires_at: nextExpiry.toISOString(),
            status: "pending",
            metadata,
            sent_at: null,
            notification_id: null,
            last_delivery_status: null,
            last_delivery_error: null,
            last_delivery_channels: null,
          })
          .eq("id", input.invitationId)
          .eq("team_id", input.teamId);

        if (error) {
          throw new TRPCError({
            code: error.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error.code === "PGRST116"
              ? "Invitation not found"
              : `Failed to update invitation: ${error.message}`,
          });
        }

        await sendTeamInvitationNotification({
          invitationId: input.invitationId,
          token: rawToken,
          actorId: user.id,
          resend: true,
        });

        return { success: true };
      }),

    cancel: procedure
      .input(teamInvitationCancelSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);
        await ensureTeamActionPermission({
          ctx,
          team,
          permission: TeamPermissions.MANAGE_INVITATIONS,
        });

        const { data: invitation, error: fetchError } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .select("metadata, invited_user_id, status")
          .eq("id", input.invitationId)
          .eq("team_id", input.teamId)
          .single();

        if (fetchError || !invitation) {
          throw new TRPCError({
            code: fetchError?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: fetchError ? `Failed to load invitation: ${fetchError.message}` : "Invitation not found",
          });
        }

        const metadata = (invitation.metadata as Record<string, unknown> | null) ?? {};
        if (input.reason) {
          metadata.revokedReason = input.reason;
        }

        const { error } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .update({
            status: "revoked",
            revoked_at: nowIso(),
            metadata,
          })
          .eq("id", input.invitationId);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to cancel invitation: ${error.message}`,
          });
        }

        await recordTeamAuditLog({
          supabaseAdmin,
          teamId: input.teamId,
          action: "invitation_rescinded",
          actorUserId: user.id,
          memberUserId: invitation.invited_user_id as string | null,
          metadata: {
            reason: input.reason ?? null,
            previousStatus: invitation.status,
          },
        });

        return { success: true };
      }),

    respond: procedure
      .input(teamInvitationUserRespondSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const { data: invitation, error } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .select(
            `
            *,
            team:teams(
              id,
              name,
              organization_id,
              default_role_id,
              default_role_key
            ),
            role:team_roles(id, key, name)
          `,
          )
          .eq("id", input.invitationId)
          .single();

        if (error || !invitation) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error ? `Invitation not found: ${error.message}` : "Invitation not found",
          });
        }

        if ((invitation.status as string) !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invitation has already been ${invitation.status}`,
          });
        }

        if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
          await supabaseAdmin
            .schema("core")
            .from("team_invitations")
            .update({ status: "expired" })
            .eq("id", invitation.id);

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invitation has expired",
          });
        }

        const normalizedUserEmail = user.email ? user.email.trim().toLowerCase() : null;
        const invitationEmail = invitation.email ? String(invitation.email).trim().toLowerCase() : null;
        const matchesInvitedUser =
          invitation.invited_user_id === user.id ||
          (invitationEmail && normalizedUserEmail && invitationEmail === normalizedUserEmail);

        if (!matchesInvitedUser) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to respond to this invitation",
          });
        }

        const team = invitation.team as {
          id: string;
          name: string | null;
          organization_id: string;
          default_role_id: string | null;
          default_role_key: string | null;
        };

        if (!team) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to load team information for invitation",
          });
        }

        const metadata = (invitation.metadata as Record<string, unknown> | null) ?? {};
        metadata.responderId = user.id;
        metadata.lastAction = input.action;
        if (input.responseMetadata) {
          metadata.responseMetadata = input.responseMetadata;
        }

        if (input.action === "accept") {
          const resolvedRoleId =
            invitation.role_id ??
            (await resolveRoleId({
              supabaseAdmin,
              organizationId: team.organization_id,
              teamId: team.id,
            }));

          if (!resolvedRoleId) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Unable to determine team member role for invitation",
            });
          }

          const { data: existingMember } = await supabaseAdmin
            .schema("core")
            .from("team_members")
            .select("id, status, metadata")
            .eq("team_id", team.id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (existingMember) {
            await supabaseAdmin
              .schema("core")
              .from("team_members")
              .update({
                status: "active",
                role_id: resolvedRoleId,
                removed_at: null,
                invited_by: invitation.created_by ?? null,
                metadata: {
                  ...(existingMember.metadata as Record<string, unknown> | null) ?? {},
                  lastJoinedSource: "invitation",
                },
              })
              .eq("id", existingMember.id);
          } else {
            await supabaseAdmin
              .schema("core")
              .from("team_members")
              .insert({
                team_id: team.id,
                user_id: user.id,
                role_id: resolvedRoleId,
                status: "active",
                joined_at: nowIso(),
                invited_by: invitation.created_by ?? null,
                metadata: {
                  source: "invitation",
                },
              });
          }

          await supabaseAdmin
            .schema("core")
            .from("team_invitations")
            .update({
              status: "accepted",
              accepted_at: nowIso(),
              invited_user_id: user.id,
              metadata,
            })
            .eq("id", invitation.id);

          await recordTeamAuditLog({
            supabaseAdmin,
            teamId: team.id,
            action: "joined",
            actorUserId: user.id,
            memberUserId: user.id,
            metadata: {
              invitationId: String(invitation.id ?? ""),
              method: "in_app",
            },
          });

          return {
            status: "accepted" as const,
            team: {
              id: team.id,
              name: team.name ?? null,
            },
          };
        }

        await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .update({
            status: "declined",
            declined_at: nowIso(),
            metadata,
          })
          .eq("id", invitation.id);

        return {
          status: "declined" as const,
          team: {
            id: team.id,
            name: team.name ?? null,
          },
        };
      }),
  });
}

function buildTeamsRouter(procedure: AuthenticatedProcedure) {
  const membersRouter = buildMembersRouter(procedure);
  const invitationsRouter = buildInvitationsRouter(procedure);

  return t.router({
    list: procedure
      .input(
        z.object({
          organizationId: z.string().uuid().optional(),
          includeArchived: z.boolean().default(false),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id);
        const superAdmin = isSuperAdmin(assignments);

        const adminOrganizationIds = new Set<string>();
        const accessibleOrganizationIds = new Set<string>();

        for (const assignment of assignments) {
          const organizationId = assignment.scope_org_id ?? undefined;
          if (assignment.role?.scope === "organization" && organizationId) {
            accessibleOrganizationIds.add(organizationId);
            if (isOrganizationAdminRole(assignment.role?.name ?? null)) {
              adminOrganizationIds.add(organizationId);
            }
          }
        }

        const { data: ownedOrganizations, error: ownedError } = await supabaseAdmin
          .schema("core")
          .from("organizations")
          .select("id")
          .eq("owner_user_id", user.id);

        if (ownedError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to load owned organizations: ${ownedError.message}`,
          });
        }

        for (const organization of ownedOrganizations ?? []) {
          const orgId = typeof organization.id === "string"
            ? organization.id
            : null;
          if (orgId) {
            accessibleOrganizationIds.add(orgId);
            adminOrganizationIds.add(orgId);
          }
        }

        const {
          data: teamMemberships,
          error: membershipsError,
        } = await supabaseAdmin
          .schema("core")
          .from("team_members")
          .select("team_id, status, team:teams(id, organization_id)")
          .eq("user_id", user.id)
          .neq("status", "removed");

        if (membershipsError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to load team memberships: ${membershipsError.message}`,
          });
        }

        const memberTeamIds = new Set<string>();
        const teamToOrganizationMap = new Map<string, string | null>();
        const memberTeamsByOrganization = new Map<string, Set<string>>();

        for (const membership of teamMemberships ?? []) {
          const teamId = typeof membership.team_id === "string"
            ? membership.team_id
            : null;
          const organizationId = membership.team?.organization_id
            ? String(membership.team.organization_id)
            : null;

          if (teamId) {
            memberTeamIds.add(teamId);
            teamToOrganizationMap.set(teamId, organizationId);
          }

          if (organizationId) {
            accessibleOrganizationIds.add(organizationId);
            const set = memberTeamsByOrganization.get(organizationId) ?? new Set<string>();
            if (teamId) {
              set.add(teamId);
            }
            memberTeamsByOrganization.set(organizationId, set);
          }
        }

        if (
          input.organizationId &&
          !superAdmin &&
          !accessibleOrganizationIds.has(input.organizationId)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to the requested organization.",
          });
        }

        const selectClause = `
          *,
          default_role:team_roles(id, key, name)
        `;

        const includeArchived = input.includeArchived;
        const teamsMap = new Map<string, ReturnType<typeof transformTeam>>();

        const fetchTeamsByOrgIds = async (organizationIds: string[]) => {
          if (!organizationIds.length) return;

          let query = supabaseAdmin
            .schema("core")
            .from("teams")
            .select(selectClause)
            .in("organization_id", organizationIds)
            .order("created_at", { ascending: false });

          if (!includeArchived) {
            query = query.eq("is_archived", false);
          }

          const { data, error } = await query;

          if (error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to fetch teams: ${error.message}`,
            });
          }

          for (const record of data ?? []) {
            teamsMap.set(
              record.id as string,
              transformTeam(record as Record<string, any>),
            );
          }
        };

        const fetchTeamsByIds = async (teamIds: string[]) => {
          if (!teamIds.length) return;

          let query = supabaseAdmin
            .schema("core")
            .from("teams")
            .select(selectClause)
            .in("id", teamIds)
            .order("created_at", { ascending: false });

          if (!includeArchived) {
            query = query.eq("is_archived", false);
          }

          const { data, error } = await query;

          if (error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to fetch teams: ${error.message}`,
            });
          }

          for (const record of data ?? []) {
            teamsMap.set(
              record.id as string,
              transformTeam(record as Record<string, any>),
            );
          }
        };

        if (input.organizationId) {
          if (superAdmin || adminOrganizationIds.has(input.organizationId)) {
            await fetchTeamsByOrgIds([input.organizationId]);
          } else {
            const memberTeams = memberTeamsByOrganization.get(input.organizationId);
            if (!memberTeams || memberTeams.size === 0) {
              return { teams: [] };
            }
            await fetchTeamsByIds(Array.from(memberTeams));
          }
        } else if (superAdmin) {
          let query = supabaseAdmin
            .schema("core")
            .from("teams")
            .select(selectClause)
            .order("created_at", { ascending: false });

          if (!includeArchived) {
            query = query.eq("is_archived", false);
          }

          const { data, error } = await query;

          if (error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to fetch teams: ${error.message}`,
            });
          }

          for (const record of data ?? []) {
            teamsMap.set(
              record.id as string,
              transformTeam(record as Record<string, any>),
            );
          }
        } else {
          if (adminOrganizationIds.size > 0) {
            await fetchTeamsByOrgIds(Array.from(adminOrganizationIds));
          }

          if (memberTeamIds.size > 0) {
            const nonAdminTeamIds = Array
              .from(memberTeamIds)
              .filter((teamId) => {
                const orgId = teamToOrganizationMap.get(teamId);
                return !orgId || !adminOrganizationIds.has(orgId);
              });

            await fetchTeamsByIds(nonAdminTeamIds);
          }
        }

        const teams = Array
          .from(teamsMap.values())
          .sort((a, b) => {
            const aTimestamp = a.createdAt ? Date.parse(a.createdAt) : 0;
            const bTimestamp = b.createdAt ? Date.parse(b.createdAt) : 0;
            return bTimestamp - aTimestamp;
          });

        return { teams };
      }),

    byId: procedure
      .input(z.object({ teamId: teamIdSchema }))
      .query(async ({ ctx, input }) => {
        const { supabaseAdmin } = ctx;

        const teamRecord = await fetchTeamOrThrow(supabaseAdmin, input.teamId);
        await ensureTeamActionPermission({
          ctx,
          team: teamRecord,
          permission: TeamPermissions.VIEW,
        });

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("teams")
          .select(
            `
            *,
            default_role:team_roles(id, key, name)
          `,
          )
          .eq("id", input.teamId)
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error ? `Failed to load team: ${error.message}` : "Team not found",
          });
        }

        return { team: transformTeam(data as Record<string, any>) };
      }),

    create: procedure
      .input(teamCreateSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        await ensureOrganizationTeamPermission({
          ctx,
          organizationId: input.organizationId,
          permission: TeamPermissions.MANAGE,
        });

        await ensureOrganizationRoles(supabaseAdmin, input.organizationId);
        const resolvedRoleId = await resolveRoleId({
          supabaseAdmin,
          organizationId: input.organizationId,
          roleId: input.defaultRoleId,
          roleKey: input.defaultRoleKey,
        });

        if (!resolvedRoleId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unable to determine default team role",
          });
        }

        const insertPayload = {
          organization_id: input.organizationId,
          name: input.name,
          slug: input.slug ?? null,
          purpose: input.purpose ?? null,
          visibility: input.visibility ?? "organization",
          invitation_policy: input.invitationPolicy ?? "invite_only",
          description: input.description ?? null,
          image_url: input.imageUrl ?? null,
          metadata: input.metadata ?? {},
          default_role_id: resolvedRoleId,
          default_role_key: input.defaultRoleKey ?? "member",
          created_by: user.id,
        };

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("teams")
          .insert(insertPayload)
          .select(
            `
            *,
            default_role:team_roles(id, key, name)
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error ? `Failed to create team: ${error.message}` : "Failed to create team",
          });
        }

        return { team: transformTeam(data as Record<string, any>) };
      }),

    update: procedure
      .input(teamUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);
        await ensureTeamActionPermission({
          ctx,
          team,
          permission: TeamPermissions.MANAGE,
        });
        const updates: Record<string, unknown> = {};

        if (input.name !== undefined) updates.name = input.name;
        if (input.slug !== undefined) updates.slug = input.slug ?? null;
        if (input.purpose !== undefined) updates.purpose = input.purpose ?? null;
        if (input.visibility !== undefined) updates.visibility = input.visibility;
        if (input.invitationPolicy !== undefined) updates.invitation_policy = input.invitationPolicy;
        if (input.description !== undefined) updates.description = input.description ?? null;
        if (input.imageUrl !== undefined) updates.image_url = input.imageUrl ?? null;
        if (input.metadata !== undefined) updates.metadata = input.metadata ?? {};

        if (input.defaultRoleId || input.defaultRoleKey) {
          const resolvedRoleId = await resolveRoleId({
            supabaseAdmin,
            organizationId: team.organization_id,
            roleId: input.defaultRoleId,
            roleKey: input.defaultRoleKey,
            teamId: team.id,
          });

          if (!resolvedRoleId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Unable to resolve default team role",
            });
          }

          updates.default_role_id = resolvedRoleId;
          if (input.defaultRoleKey) {
            updates.default_role_key = input.defaultRoleKey;
          }
        } else if (input.defaultRoleKey !== undefined) {
          updates.default_role_key = input.defaultRoleKey;
        }

        if (Object.keys(updates).length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Provide at least one field to update",
          });
        }

        updates.updated_at = nowIso();

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("teams")
          .update(updates)
          .eq("id", input.teamId)
          .select(
            `
            *,
            default_role:team_roles(id, key, name)
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error ? `Failed to update team: ${error.message}` : "Team not found",
          });
        }

        return { team: transformTeam(data as Record<string, any>) };
      }),

    archive: procedure
      .input(teamArchiveSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);
        await ensureTeamActionPermission({
          ctx,
          team,
          permission: TeamPermissions.MANAGE,
        });

        const { data: teamRecord, error: teamError } = await supabaseAdmin
          .schema("core")
          .from("teams")
          .select("metadata")
          .eq("id", input.teamId)
          .single();

        if (teamError || !teamRecord) {
          throw new TRPCError({
            code: teamError?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: teamError ? `Failed to load team: ${teamError.message}` : "Team not found",
          });
        }

        const metadata = (teamRecord.metadata as Record<string, unknown> | null) ?? {};
        if (input.reason) {
          metadata.archivedReason = input.reason;
        }

        const updates: Record<string, unknown> = {
          is_archived: true,
          archived_at: nowIso(),
          archived_by: user.id,
          updated_at: nowIso(),
        };

        if (input.reason) {
          updates.metadata = metadata;
        }

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("teams")
          .update(updates)
          .eq("id", input.teamId)
          .select(
            `
            *,
            default_role:team_roles(id, key, name)
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error ? `Failed to archive team: ${error.message}` : "Team not found",
          });
        }

        return { team: transformTeam(data as Record<string, any>) };
      }),

    members: membersRouter,
    invitations: invitationsRouter,

    respondToInvitation: publicProcedure
      .input(teamInvitationRespondSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin } = ctx;
        const tokenHash = await hashInvitationToken(input.token);

        const { data: invitation, error } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .select(
            `
            *,
            team:teams(id, organization_id, default_role_id, default_role_key)
          `,
          )
          .eq("token", tokenHash)
          .single();

        if (error || !invitation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invitation not found or already processed",
          });
        }

        if ((invitation.status as string) !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invitation has already been ${invitation.status}`,
          });
        }

        if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
          await supabaseAdmin
            .schema("core")
            .from("team_invitations")
            .update({ status: "expired" })
            .eq("id", invitation.id);

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invitation has expired",
          });
        }

        const responderId = input.responderId ?? (invitation.invited_user_id as string | null);
        if (!responderId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A responder user ID is required to process the invitation",
          });
        }

        const team = invitation.team as {
          id: string;
          organization_id: string;
          default_role_id: string | null;
          default_role_key: string | null;
        };

        if (input.action === "accept") {
          const resolvedRoleId = invitation.role_id
            ?? (await resolveRoleId({
              supabaseAdmin,
              organizationId: team.organization_id,
              teamId: team.id,
            }));

          if (!resolvedRoleId) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Unable to determine team member role for invitation",
            });
          }

          const { data: existingMember } = await supabaseAdmin
            .schema("core")
            .from("team_members")
            .select("id, status, metadata")
            .eq("team_id", team.id)
            .eq("user_id", responderId)
            .maybeSingle();

          if (existingMember) {
            await supabaseAdmin
              .schema("core")
              .from("team_members")
              .update({
                status: "active",
                role_id: resolvedRoleId,
                removed_at: null,
                invited_by: invitation.created_by ?? null,
                metadata: {
                  ...(existingMember.metadata as Record<string, unknown> | null) ?? {},
                  lastJoinedSource: "invitation",
                },
              })
              .eq("id", existingMember.id);
          } else {
            await supabaseAdmin
              .schema("core")
              .from("team_members")
              .insert({
                team_id: team.id,
                user_id: responderId,
                role_id: resolvedRoleId,
                status: "active",
                joined_at: nowIso(),
                invited_by: invitation.created_by ?? null,
                metadata: {
                  source: "invitation",
                },
              });
          }

          const metadata = (invitation.metadata as Record<string, unknown> | null) ?? {};
          metadata.lastAction = "accepted";
          metadata.responderId = responderId;

          await supabaseAdmin
            .schema("core")
            .from("team_invitations")
            .update({
              status: "accepted",
              accepted_at: nowIso(),
              metadata,
            })
            .eq("id", invitation.id);

          await recordTeamAuditLog({
            supabaseAdmin,
            teamId: team.id,
            action: "joined",
            actorUserId: responderId,
            memberUserId: responderId,
            metadata: {
              invitationId: String(invitation.id ?? ""),
            },
          });

          return { status: "accepted", teamId: team.id };
        }

        await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .update({
            status: "declined",
            declined_at: nowIso(),
            metadata: {
              ...((invitation.metadata as Record<string, unknown> | null) ?? {}),
              lastAction: "declined",
              responderId,
            },
          })
          .eq("id", invitation.id);

        return { status: "declined", teamId: team.id };
      }),
  });
}

export const teamsRouter = buildTeamsRouter(protectedProcedure);
export const officeTeamsRouter = buildTeamsRouter(officeProcedure);

