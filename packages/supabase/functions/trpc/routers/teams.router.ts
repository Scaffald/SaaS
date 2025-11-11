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

type AuthenticatedProcedure = typeof protectedProcedure;
type SupabaseAdminClient = Context["supabaseAdmin"];

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const toIsoString = (date: Date) => date.toISOString();

function transformTeamRecord(record: Record<string, unknown>) {
  if (!record) {
    return record;
  }

  const defaultRole = record.default_role as Record<string, unknown> | null;

  return {
    id: record.id,
    organizationId: record.organization_id,
    name: record.name,
    slug: record.slug,
    purpose: record.purpose,
    visibility: record.visibility,
    description: record.description,
    imageUrl: record.image_url,
    settings: record.settings ?? {},
    parentTeamId: record.parent_team_id,
    defaultRoleId: record.default_role_id,
    defaultRole: defaultRole
      ? {
        id: defaultRole.id,
        key: defaultRole.key,
        name: defaultRole.name,
        level: defaultRole.level,
      }
      : null,
    invitationExpirationDays: record.invitation_expiration_days,
    allowSelfJoin: record.allow_self_join,
    autoAssignJobs: record.auto_assign_jobs,
    isArchived: record.is_archived,
    archivedAt: record.archived_at,
    archivedBy: record.archived_by,
    archivedReason: record.archived_reason,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    createdBy: record.created_by,
    updatedBy: record.updated_by,
  };
}

function transformMemberRecord(record: Record<string, unknown>) {
  const role = record.role as Record<string, unknown> | null;
  const user = record.user as Record<string, unknown> | null;

  return {
    id: record.id,
    teamId: record.team_id,
    userId: record.user_id,
    status: record.status,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    joinedAt: record.joined_at,
    invitationId: record.invitation_id,
    addedBy: record.added_by,
    removedAt: record.removed_at,
    removedBy: record.removed_by,
    removalReason: record.removal_reason,
    permissionsOverride: record.permissions_override ?? {},
    metadata: record.metadata ?? {},
    role: role
      ? {
        id: role.id,
        key: role.key,
        name: role.name,
        level: role.level,
      }
      : null,
    user: user
      ? {
        id: user.id,
        displayName: user.display_name,
        username: user.username,
        avatarPath: user.avatar_path,
      }
      : null,
  };
}

function transformInvitationRecord(record: Record<string, unknown>) {
  const role = record.role as Record<string, unknown> | null;

  return {
    id: record.id,
    teamId: record.team_id,
    organizationId: record.organization_id,
    email: record.email,
    status: record.status,
    expiresAt: record.expires_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    invitedBy: record.invited_by,
    invitedUserId: record.invited_user_id,
    acceptedAt: record.accepted_at,
    declinedAt: record.declined_at,
    cancelledAt: record.cancelled_at,
    respondedAt: record.responded_at,
    respondedBy: record.responded_by,
    responseMessage: record.response_message,
    role: role
      ? {
        id: role.id,
        key: role.key,
        name: role.name,
        level: role.level,
      }
      : null,
    metadata: record.metadata ?? {},
  };
}

async function resolveRoleId(
  supabaseAdmin: SupabaseAdminClient,
  roleId: string | undefined,
  roleKey: z.infer<typeof teamRoleKeySchema> | undefined,
  fallbackTeamId?: string,
): Promise<string | undefined> {
  if (roleId) {
    return roleId;
  }

  if (!roleKey) {
    if (!fallbackTeamId) {
      return undefined;
    }

    const { data, error } = await supabaseAdmin
      .schema("core")
      .from("teams")
      .select("default_role_id")
      .eq("id", fallbackTeamId)
      .single();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to resolve team default role: ${error.message}`,
      });
    }

    return data?.default_role_id as string | undefined;
  }

  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("team_roles")
    .select("id")
    .eq("key", roleKey)
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unable to resolve role key "${roleKey}"`,
    });
  }

  return data.id as string;
}

async function hashInvitationToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function buildMembersRouter(procedure: AuthenticatedProcedure) {
  return t.router({
    roles: procedure.query(async ({ ctx }) => {
      const { supabase } = ctx;

      const { data, error } = await supabase
        .schema("core")
        .from("team_roles")
        .select("id, key, name, description, level, is_default")
        .order("level", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load team roles: ${error.message}`,
        });
      }

      return {
        roles: (data ?? []).map((role) => ({
          id: role.id,
          key: role.key,
          name: role.name,
          description: role.description,
          level: role.level,
          isDefault: role.is_default,
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
            invitation_id,
            added_by,
            removed_at,
            removed_by,
            removal_reason,
            permissions_override,
            metadata,
            created_at,
            updated_at,
            role:team_roles(
              id,
              key,
              name,
              level
            ),
            user:users(
              id,
              display_name,
              username,
              avatar_path
            )
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
          members: (data ?? []).map((record) => transformMemberRecord(record)),
        };
      }),

    add: procedure
      .input(teamMemberAddSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const resolvedRoleId = await resolveRoleId(
          supabaseAdmin,
          input.roleId,
          input.roleKey,
          input.teamId,
        );

        if (!resolvedRoleId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unable to determine team member role",
          });
        }

        const { data: existingMember } = await supabase
          .schema("core")
          .from("team_members")
          .select("id, status")
          .eq("team_id", input.teamId)
          .eq("user_id", input.userId)
          .maybeSingle();

        if (existingMember) {
          if (existingMember.status === "removed") {
            const reactivationPayload: Record<string, unknown> = {
              role_id: resolvedRoleId,
              status: "active" as (typeof TEAM_MEMBER_STATUSES)[number],
              added_by: user.id,
              removed_at: null,
              removed_by: null,
              removal_reason: null,
              invitation_id: null,
              joined_at: toIsoString(new Date()),
            };

            const { data, error } = await supabase
              .schema("core")
              .from("team_members")
              .update(reactivationPayload)
              .eq("id", existingMember.id)
              .select(
                `
                id,
                team_id,
                user_id,
                role_id,
                status,
                joined_at,
                invitation_id,
                added_by,
                removed_at,
                removed_by,
                removal_reason,
                permissions_override,
                metadata,
                created_at,
                updated_at,
                role:team_roles(
                  id,
                  key,
                  name,
                  level
                ),
                user:users(
                  id,
                  display_name,
                  username,
                  avatar_path
                )
              `,
              )
              .single();

            if (error || !data) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error
                  ? `Failed to reactivate team member: ${error.message}`
                  : "Unable to reactivate team member",
              });
            }

            return {
              member: transformMemberRecord(data),
            };
          }

          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already a team member",
          });
        }

        const insertPayload = {
          team_id: input.teamId,
          user_id: input.userId,
          role_id: resolvedRoleId,
          added_by: user.id,
          joined_at: toIsoString(new Date()),
          status: "active" as (typeof TEAM_MEMBER_STATUSES)[number],
        };

        const { data, error } = await supabase
          .schema("core")
          .from("team_members")
          .insert(insertPayload)
          .select(
            `
            id,
            team_id,
            user_id,
            role_id,
            status,
            joined_at,
            invitation_id,
            added_by,
            removed_at,
            removed_by,
            removal_reason,
            permissions_override,
            metadata,
            created_at,
            updated_at,
            role:team_roles(
              id,
              key,
              name,
              level
            ),
            user:users(
              id,
              display_name,
              username,
              avatar_path
            )
          `,
          )
          .single();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to add team member: ${error.message}`,
          });
        }

        return {
          member: transformMemberRecord(data),
        };
      }),

    update: procedure
      .input(teamMemberUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, supabaseAdmin, user } = ctx;

        const resolvedRoleId = await resolveRoleId(
          supabaseAdmin,
          input.roleId,
          input.roleKey,
        );

        const updatePayload: Record<string, unknown> = {};
        if (resolvedRoleId) {
          updatePayload.role_id = resolvedRoleId;
        }
        if (input.status !== undefined) {
          updatePayload.status = input.status;
          if (input.status === "removed") {
            updatePayload.removed_at = toIsoString(new Date());
            updatePayload.removed_by = user?.id ?? null;
          } else {
            if (input.status === "active") {
              updatePayload.joined_at = toIsoString(new Date());
            }
            updatePayload.removed_at = null;
            updatePayload.removed_by = null;
            updatePayload.removal_reason = null;
          }
        }
        if (Object.keys(updatePayload).length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No updates provided",
          });
        }

        const { data, error } = await supabase
          .schema("core")
          .from("team_members")
          .update(updatePayload)
          .eq("id", input.teamMemberId)
          .select(
            `
            id,
            team_id,
            user_id,
            role_id,
            status,
            joined_at,
            invitation_id,
            added_by,
            removed_at,
            removed_by,
            removal_reason,
            permissions_override,
            metadata,
            created_at,
            updated_at,
            role:team_roles(
              id,
              key,
              name,
              level
            ),
            user:users(
              id,
              display_name,
              username,
              avatar_path
            )
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error
              ? `Failed to update team member: ${error.message}`
              : "Team member not found",
          });
        }

        return {
          member: transformMemberRecord(data),
        };
      }),

    remove: procedure
      .input(teamMemberRemoveSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        const { error } = await supabase
          .schema("core")
          .from("team_members")
          .update({
            status: "removed",
            removed_at: toIsoString(new Date()),
            removed_by: user?.id ?? null,
            removal_reason: input.reason ?? null,
          })
          .eq("id", input.teamMemberId)
          .eq("team_id", input.teamId);

        if (error) {
          throw new TRPCError({
            code: error.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error.code === "PGRST116"
              ? "Team member not found"
              : `Failed to remove team member: ${error.message}`,
          });
        }

        return {
          success: true as const,
        };
      }),

    changeStatus: procedure
      .input(teamMemberStatusChangeSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        const updatePayload: Record<string, unknown> = {
          status: input.status,
        };

        if (input.status === "removed") {
          updatePayload.removed_at = toIsoString(new Date());
          updatePayload.removed_by = user?.id ?? null;
        } else {
          if (input.status === "active") {
            updatePayload.joined_at = toIsoString(new Date());
          }
          updatePayload.removed_at = null;
          updatePayload.removed_by = null;
          updatePayload.removal_reason = null;
        }

        const { data, error } = await supabase
          .schema("core")
          .from("team_members")
          .update(updatePayload)
          .eq("id", input.teamMemberId)
          .select(
            `
            id,
            team_id,
            user_id,
            role_id,
            status,
            joined_at,
            invitation_id,
            added_by,
            removed_at,
            removed_by,
            removal_reason,
            permissions_override,
            metadata,
            created_at,
            updated_at,
            role:team_roles(
              id,
              key,
              name,
              level
            ),
            user:users(
              id,
              display_name,
              username,
              avatar_path
            )
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error
              ? `Failed to update member status: ${error.message}`
              : "Team member not found",
          });
        }

        return {
          member: transformMemberRecord(data),
        };
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
            *,
            role:team_roles(
              id,
              key,
              name,
              level
            )
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
            message: `Failed to load invitations: ${error.message}`,
          });
        }

        return {
          invitations: (data ?? []).map((record) => transformInvitationRecord(record)),
        };
      }),

    create: procedure
      .input(teamInvitationCreateSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const resolvedRoleId = await resolveRoleId(
          supabaseAdmin,
          input.roleId,
          input.roleKey,
        );

        if (!resolvedRoleId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unable to determine invitation role",
          });
        }

        const rawToken = crypto.randomUUID().replace(/-/g, "");
        const tokenHash = await hashInvitationToken(rawToken);

        const { data: team, error: teamError } = await supabase
          .schema("core")
          .from("teams")
          .select("organization_id, invitation_expiration_days")
          .eq("id", input.teamId)
          .single();

        if (teamError || !team) {
          throw new TRPCError({
            code: teamError?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: teamError
              ? `Failed to load team: ${teamError.message}`
              : "Team not found",
          });
        }

        const expirationDays = team.invitation_expiration_days ?? TEAM_INVITATION_TTL_DEFAULT;

        const expiresAt = input.expiresAt
          ? new Date(input.expiresAt)
          : addDays(new Date(), expirationDays);

        const { data, error } = await supabase
          .schema("core")
          .from("team_invitations")
          .insert({
            team_id: input.teamId,
            organization_id: team.organization_id,
            email: input.email.toLowerCase(),
            role_id: resolvedRoleId,
            token_hash: tokenHash,
            status: "pending",
            expires_at: toIsoString(expiresAt),
            invited_by: user.id,
            metadata: {
              ...(input.metadata ?? {}),
              ...(input.message ? { invitation_message: input.message } : {}),
            },
          })
          .select(
            `
            *,
            role:team_roles(
              id,
              key,
              name,
              level
            )
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create invitation: ${error?.message ?? "unknown error"}`,
          });
        }

        return {
          invitation: transformInvitationRecord(data),
          token: rawToken,
        };
      }),

    resend: procedure
      .input(teamInvitationResendSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase } = ctx;

        const { data: team, error: teamError } = await supabase
          .schema("core")
          .from("teams")
          .select("invitation_expiration_days")
          .eq("id", input.teamId)
          .single();

        if (teamError || !team) {
          throw new TRPCError({
            code: teamError?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: teamError
              ? `Failed to load team: ${teamError.message}`
              : "Team not found",
          });
        }

        const expirationDays = team.invitation_expiration_days ?? TEAM_INVITATION_TTL_DEFAULT;

        const { data, error } = await supabase
          .schema("core")
          .from("team_invitations")
          .update({
            expires_at: toIsoString(addDays(new Date(), expirationDays)),
            updated_at: toIsoString(new Date()),
          })
          .eq("id", input.invitationId)
          .eq("team_id", input.teamId)
          .eq("status", "pending")
          .select(
            `
            *,
            role:team_roles(
              id,
              key,
              name,
              level
            )
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error
              ? `Failed to resend invitation: ${error.message}`
              : "Invitation not found",
          });
        }

        return {
          invitation: transformInvitationRecord(data),
        };
      }),

    cancel: procedure
      .input(teamInvitationCancelSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        const { data, error } = await supabase
          .schema("core")
          .from("team_invitations")
          .update({
            status: "cancelled",
            cancelled_at: toIsoString(new Date()),
            responded_by: user?.id ?? null,
            responded_at: toIsoString(new Date()),
            response_message: input.reason ?? null,
            metadata: input.reason
              ? {
                ...(input.reason ? { cancellation_reason: input.reason } : {}),
              }
              : undefined,
          })
          .eq("id", input.invitationId)
          .eq("team_id", input.teamId)
          .eq("status", "pending")
          .select(
            `
            *,
            role:team_roles(
              id,
              key,
              name,
              level
            )
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error
              ? `Failed to cancel invitation: ${error.message}`
              : "Invitation not found",
          });
        }

        return {
          invitation: transformInvitationRecord(data),
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
        const { supabase, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        let query = supabase
          .schema("core")
          .from("teams")
          .select(
            `
            *,
            default_role:team_roles(
              id,
              key,
              name,
              level
            )
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
          teams: (data ?? []).map((record) => transformTeamRecord(record)),
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
            default_role:team_roles(
              id,
              key,
              name,
              level
            )
          `,
          )
          .eq("id", input.teamId)
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error
              ? `Failed to find team: ${error.message}`
              : "Team not found",
          });
        }

        return {
          team: transformTeamRecord(data),
        };
      }),

    create: procedure
      .input(teamCreateSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const resolvedRoleId = await resolveRoleId(
          supabaseAdmin,
          input.defaultRoleId,
          input.defaultRoleKey ?? "member",
        );

        if (!resolvedRoleId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unable to resolve default role for new team",
          });
        }

        let parentTeamId: string | null = null;
        if (input.parentTeamId) {
          const { data: parentTeam, error: parentError } = await supabase
            .schema("core")
            .from("teams")
            .select("id, organization_id")
            .eq("id", input.parentTeamId)
            .single();

          if (parentError || !parentTeam) {
            throw new TRPCError({
              code: parentError?.code === "PGRST116" ? "NOT_FOUND" : "BAD_REQUEST",
              message: parentError
                ? `Unable to load parent team: ${parentError.message}`
                : "Parent team not found",
            });
          }

          if (parentTeam.organization_id !== input.organizationId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Parent team must belong to the same organization",
            });
          }

          parentTeamId = input.parentTeamId;
        }

        const insertPayload = {
          organization_id: input.organizationId,
          name: input.name.trim(),
          slug: input.slug ? input.slug.trim().toLowerCase() : null,
          purpose: input.purpose?.trim() ?? null,
          visibility: input.visibility,
          description: input.description ?? null,
          image_url: input.imageUrl ?? null,
          settings: input.settings ?? {},
          parent_team_id: parentTeamId,
          invitation_expiration_days: input.invitationExpirationDays,
          allow_self_join: input.allowSelfJoin,
          auto_assign_jobs: input.autoAssignJobs,
          default_role_id: resolvedRoleId,
          created_by: user.id,
          updated_by: user.id,
        };

        const { data, error } = await supabase
          .schema("core")
          .from("teams")
          .insert(insertPayload)
          .select(
            `
            *,
            default_role:team_roles(
              id,
              key,
              name,
              level
            )
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create team: ${error?.message ?? "unknown error"}`,
          });
        }

        return {
          team: transformTeamRecord(data),
        };
      }),

    update: procedure
      .input(teamUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, supabaseAdmin, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const { data: existingTeam, error: existingTeamError } = await supabase
          .schema("core")
          .from("teams")
          .select("organization_id")
          .eq("id", input.teamId)
          .single();

        if (existingTeamError || !existingTeam) {
          throw new TRPCError({
            code: existingTeamError?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: existingTeamError
              ? `Failed to load team: ${existingTeamError.message}`
              : "Team not found",
          });
        }

        const targetOrganizationId = input.organizationId ?? existingTeam.organization_id;

        const resolvedRoleId = await resolveRoleId(
          supabaseAdmin,
          input.defaultRoleId,
          input.defaultRoleKey,
        );

        const updatePayload: Record<string, unknown> = {};

        if (input.name !== undefined) {
          updatePayload.name = input.name.trim();
        }
        if (input.slug !== undefined) {
          updatePayload.slug = input.slug ? input.slug.trim().toLowerCase() : null;
        }
        if (input.purpose !== undefined) {
          updatePayload.purpose = input.purpose === null ? null : input.purpose?.trim() ?? null;
        }
        if (input.visibility !== undefined) {
          updatePayload.visibility = input.visibility;
        }
        if (input.description !== undefined) {
          updatePayload.description = input.description ?? null;
        }
        if (input.imageUrl !== undefined) {
          updatePayload.image_url = input.imageUrl ?? null;
        }
        if (input.settings !== undefined) {
          updatePayload.settings = input.settings ?? {};
        }
        if (resolvedRoleId !== undefined) {
          updatePayload.default_role_id = resolvedRoleId;
        }
        if (input.organizationId !== undefined) {
          updatePayload.organization_id = input.organizationId;
        }
        if (input.parentTeamId !== undefined) {
          if (input.parentTeamId === null) {
            updatePayload.parent_team_id = null;
          } else {
            const { data: parentTeam, error: parentError } = await supabase
              .schema("core")
              .from("teams")
              .select("organization_id")
              .eq("id", input.parentTeamId)
              .single();

            if (parentError || !parentTeam) {
              throw new TRPCError({
                code: parentError?.code === "PGRST116" ? "NOT_FOUND" : "BAD_REQUEST",
                message: parentError
                  ? `Unable to load parent team: ${parentError.message}`
                  : "Parent team not found",
              });
            }

            if (parentTeam.organization_id !== targetOrganizationId) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Parent team must belong to the same organization",
              });
            }

            updatePayload.parent_team_id = input.parentTeamId;
          }
        }
        if (input.invitationExpirationDays !== undefined) {
          updatePayload.invitation_expiration_days = input.invitationExpirationDays;
        }
        if (input.allowSelfJoin !== undefined) {
          updatePayload.allow_self_join = input.allowSelfJoin;
        }
        if (input.autoAssignJobs !== undefined) {
          updatePayload.auto_assign_jobs = input.autoAssignJobs;
        }

        if (Object.keys(updatePayload).length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No updates provided",
          });
        }

        updatePayload.updated_by = user.id;

        const { data, error } = await supabase
          .schema("core")
          .from("teams")
          .update(updatePayload)
          .eq("id", input.teamId)
          .select(
            `
            *,
            default_role:team_roles(
              id,
              key,
              name,
              level
            )
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error
              ? `Failed to update team: ${error.message}`
              : "Team not found",
          });
        }

        return {
          team: transformTeamRecord(data),
        };
      }),

    archive: procedure
      .input(teamArchiveSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabase, user } = ctx;

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const { data, error } = await supabase
          .schema("core")
          .from("teams")
          .update({
            is_archived: true,
            archived_at: toIsoString(new Date()),
            archived_by: user.id,
            archived_reason: input.reason ?? null,
          })
          .eq("id", input.teamId)
          .select(
            `
            *,
            default_role:team_roles(
              id,
              key,
              name,
              level
            )
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: error?.code === "PGRST116" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
            message: error
              ? `Failed to archive team: ${error.message}`
              : "Team not found",
          });
        }

        return {
          team: transformTeamRecord(data),
        };
      }),

    members: membersRouter,
    invitations: invitationsRouter,

    respondToInvitation: publicProcedure
      .input(teamInvitationRespondSchema)
      .mutation(async ({ ctx, input }) => {
        const { supabaseAdmin } = ctx;

        const tokenHash = await hashInvitationToken(input.token);

        const { data: invitation, error: invitationError } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .select(
            `
            *,
            role:team_roles(
              id,
              key,
              name,
              level
            )
          `,
          )
          .eq("token_hash", tokenHash)
          .single();

        if (invitationError || !invitation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invitation not found or already processed",
          });
        }

        if (invitation.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invitation is already ${invitation.status}`,
          });
        }

        if (new Date(invitation.expires_at) < new Date()) {
          await supabaseAdmin
            .schema("core")
            .from("team_invitations")
            .update({
              status: "expired",
              updated_at: toIsoString(new Date()),
            })
            .eq("id", invitation.id);

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invitation has expired",
          });
        }

        if (input.action === "accept" && !input.responderId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Responder ID is required to accept an invitation",
          });
        }

        if (input.action === "accept") {
          const joinedAt = toIsoString(new Date());

          const { error: memberError } = await supabaseAdmin
            .schema("core")
            .from("team_members")
            .upsert({
              team_id: invitation.team_id,
              user_id: input.responderId!,
              role_id: invitation.role_id,
              status: "active",
              added_by: invitation.invited_by ?? input.responderId!,
              invitation_id: invitation.id,
              joined_at: joinedAt,
              removed_at: null,
              removed_by: null,
              removal_reason: null,
            }, { onConflict: "team_id,user_id" });

          if (memberError) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to add member from invitation: ${memberError.message}`,
            });
          }
        }

        const updates: Record<string, unknown> = {
          status: input.action === "accept" ? "accepted" : "declined",
          responded_by: input.responderId ?? null,
          invited_user_id: input.responderId ?? null,
          updated_at: toIsoString(new Date()),
          responded_at: toIsoString(new Date()),
        };

        if (input.action === "accept") {
          updates.accepted_at = toIsoString(new Date());
        } else {
          updates.declined_at = toIsoString(new Date());
        }

        if (input.responseMetadata) {
          updates.metadata = {
            ...(invitation.metadata ?? {}),
            response: input.responseMetadata,
          };
        }

        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("team_invitations")
          .update(updates)
          .eq("id", invitation.id)
          .select(
            `
            *,
            role:team_roles(
              id,
              key,
              name,
              level
            )
          `,
          )
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update invitation status: ${error?.message ?? "unknown error"}`,
          });
        }

        return {
          invitation: transformInvitationRecord(data),
        };
      }),
  });
}

export const teamsRouter = buildTeamsRouter(protectedProcedure);
export const officeTeamsRouter = buildTeamsRouter(officeProcedure);

