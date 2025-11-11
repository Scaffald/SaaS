import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { officeProcedure, protectedProcedure, publicProcedure, t } from "../middleware.ts";
import type { Context } from "../context.ts";
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

const ROLE_PERMISSIONS: Record<string, ReadonlyArray<string>> = {
  admin: [
    "team.manage",
    "team.members.manage",
    "team.roles.manage",
    "team.invitations.manage",
    "team.analytics.view",
    "applications.manage",
    "applications.review",
  ],
  lead: [
    "team.members.manage",
    "team.invitations.manage",
    "team.analytics.view",
    "applications.manage",
    "applications.review",
  ],
  recruiter: ["applications.manage", "applications.review", "team.discussion.participate"],
  reviewer: ["applications.review", "team.discussion.participate"],
  member: ["team.applications.view", "team.discussion.participate"],
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
  };
}

async function fetchTeamOrThrow(supabaseAdmin: SupabaseAdminClient, teamId: string) {
  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("teams")
    .select("id, organization_id, default_role_id, is_archived")
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
        const { supabase, supabaseAdmin } = ctx;

        let organizationId = input.organizationId ?? null;
        if (!organizationId && input.teamId) {
          const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);
          organizationId = team.organization_id;
        }

        if (!organizationId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unable to resolve organization for team roles" });
        }

        await ensureOrganizationRoles(supabaseAdmin, organizationId);

        const { data, error } = await supabase
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
        const { supabase } = ctx;

        const { data, error } = await supabase
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
        const { supabaseAdmin } = ctx;
        const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);

        if (team.is_archived) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot add members to an archived team",
          });
        }

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
          invited_by: input.addedBy ?? user?.id ?? null,
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

        return { member: transformMember(data as Record<string, any>) };
      }),

    update: procedure
      .input(teamMemberUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        const updates: Record<string, unknown> = {};

        if (input.roleId || input.roleKey) {
          if (!input.teamId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "teamId is required when updating a role",
            });
          }

          const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);
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

        return { member: transformMember(data as Record<string, any>) };
      }),

    remove: procedure
      .input(teamMemberRemoveSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin } = ctx;

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

        return { member: transformMember(data as Record<string, any>) };
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

        return { member: transformMember(data as Record<string, any>) };
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
        const { supabase } = ctx;

        let query = supabase
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

    create: procedure
      .input(teamInvitationCreateSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const team = await fetchTeamOrThrow(supabaseAdmin, input.teamId);

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
          email: input.email ?? null,
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

        return {
          invitation: transformInvitation(data as Record<string, any>),
          token: rawToken,
        };
      }),

    resend: procedure
      .input(teamInvitationResendSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin } = ctx;

        const { data: invitation, error: fetchError } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .select("metadata")
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
        const resendCount = Number(metadata.resendCount ?? 0) + 1;
        metadata.resendCount = resendCount;
        metadata.lastResentAt = nowIso();

        const { error } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .update({
            metadata,
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

        return { success: true };
      }),

    cancel: procedure
      .input(teamInvitationCancelSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin } = ctx;

        const { data: invitation, error: fetchError } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .select("metadata")
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

        return { success: true };
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
        const { supabase } = ctx;

        let query = supabase
          .schema("core")
          .from("teams")
          .select(
            `
            *,
            default_role:team_roles(id, key, name)
          `,
          )
          .order("created_at", { ascending: false });

        if (input.organizationId) {
          query = query.eq("organization_id", input.organizationId);
        }

        if (!input.includeArchived) {
          query = query.eq("is_archived", false);
        }

        const { data, error } = await query;

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to fetch teams: ${error.message}`,
          });
        }

        return {
          teams: (data ?? []).map((record) => transformTeam(record as Record<string, any>)),
        };
      }),

    byId: procedure
      .input(z.object({ teamId: teamIdSchema }))
      .query(async ({ ctx, input }) => {
        const { supabase } = ctx;

        const { data, error } = await supabase
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

