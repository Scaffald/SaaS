/**
 * Teams REST API
 * Manages teams, members, invitations, and job assignments
 * Migrated from: packages/supabase/functions/trpc/routers/teams.router.ts
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { addSupabaseAdminForUser, authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono();

app.use("*", authMiddleware);
app.use("*", addSupabaseAdminForUser);

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi("ErrorResponse");

const teamSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    name: z.string(),
    purpose: z.string().nullable(),
    description: z.string().nullable(),
    visibility: z.enum(["organization", "public", "private"]),
    invitation_policy: z.enum([
      "invite_only",
      "self_join",
      "approval_required",
    ]),
    allow_self_join: z.boolean(),
    is_archived: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi("Team");

const teamMemberSchema = z
  .object({
    id: z.string().uuid(),
    team_id: z.string().uuid(),
    user_id: z.string().uuid(),
    role_key: z.string(),
    status: z.enum(["active", "inactive"]),
    joined_at: z.string(),
  })
  .openapi("TeamMember");

const teamInvitationSchema = z
  .object({
    id: z.string().uuid(),
    team_id: z.string().uuid(),
    email: z.string().email(),
    role_key: z.string(),
    status: z.enum(["pending", "accepted", "declined", "cancelled"]),
    expires_at: z.string(),
    created_at: z.string(),
  })
  .openapi("TeamInvitation");

const teamJobAssignmentSchema = z
  .object({
    id: z.string().uuid(),
    team_id: z.string().uuid(),
    job_id: z.string().uuid(),
    assigned_at: z.string(),
  })
  .openapi("TeamJobAssignment");

// Request schemas
const listTeamsQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  includeArchived: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

const createTeamSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  purpose: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(["organization", "public", "private"]).default(
    "organization",
  ),
  invitationPolicy: z
    .enum(["invite_only", "self_join", "approval_required"])
    .default("invite_only"),
  allowSelfJoin: z.boolean().default(false),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  purpose: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(["organization", "public", "private"]).optional(),
  invitationPolicy: z.enum(["invite_only", "self_join", "approval_required"])
    .optional(),
  allowSelfJoin: z.boolean().optional(),
});

const archiveTeamSchema = z.object({
  reason: z.string().optional(),
});

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  roleKey: z.string().default("member"),
});

const updateMemberSchema = z.object({
  roleKey: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  roleKey: z.string().default("member"),
});

const _respondToInvitationSchema = z.object({
  accept: z.boolean(),
});

const _respondToInvitationWithTokenSchema = z.object({
  token: z.string(),
  accept: z.boolean(),
});

const createJobAssignmentSchema = z.object({
  jobId: z.string().uuid(),
});

// Response schemas
const teamsListResponseSchema = z
  .object({
    teams: z.array(teamSchema),
  })
  .openapi("TeamsListResponse");

const teamResponseSchema = z
  .object({
    team: teamSchema,
  })
  .openapi("TeamResponse");

const teamMembersListResponseSchema = z
  .object({
    members: z.array(teamMemberSchema),
  })
  .openapi("TeamMembersListResponse");

const teamMemberResponseSchema = z
  .object({
    member: teamMemberSchema,
  })
  .openapi("TeamMemberResponse");

const teamInvitationsListResponseSchema = z
  .object({
    invitations: z.array(teamInvitationSchema),
  })
  .openapi("TeamInvitationsListResponse");

const teamInvitationResponseSchema = z
  .object({
    invitation: teamInvitationSchema,
  })
  .openapi("TeamInvitationResponse");

const teamJobAssignmentsListResponseSchema = z
  .object({
    assignments: z.array(teamJobAssignmentSchema),
  })
  .openapi("TeamJobAssignmentsListResponse");

const teamJobAssignmentResponseSchema = z
  .object({
    assignment: teamJobAssignmentSchema,
  })
  .openapi("TeamJobAssignmentResponse");

const deleteResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi("DeleteResponse");

const _rolesListResponseSchema = z
  .object({
    roles: z.array(
      z.object({
        key: z.string(),
        name: z.string(),
        description: z.string().nullable(),
      }),
    ),
  })
  .openapi("RolesListResponse");

// ============================================================================
// Core Team Routes
// ============================================================================

// GET / - List teams
const listRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List teams",
  request: {
    query: listTeamsQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: teamsListResponseSchema } },
      description: "List of teams",
    },
    401: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Unauthorized",
    },
  },
});

app.openapi(listRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { organizationId, includeArchived } = c.req.valid("query");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    let query = supabase
      .schema("core")
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data, error } = await query;

    if (error) {
      return c.json(
        { error: "Failed to fetch teams", message: error.message },
        500,
      );
    }

    return c.json({ teams: data || [] });
  } catch (error) {
    console.error("Error listing teams:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// GET /:id - Get team by ID
const getByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  summary: "Get team by ID",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: teamResponseSchema } },
      description: "Team details",
    },
    404: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Team not found",
    },
  },
});

app.openapi(getByIdRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("teams")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return c.json({ error: "Team not found" }, 404);
    }

    return c.json({ team: data });
  } catch (error) {
    console.error("Error fetching team:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// POST / - Create team
const createTeamRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create a new team",
  request: {
    body: {
      content: { "application/json": { schema: createTeamSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: teamResponseSchema } },
      description: "Created team",
    },
  },
});

app.openapi(createTeamRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const result = createTeamSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: "Validation error", message: result.error.message },
      400,
    );
  }

  const {
    organizationId,
    name,
    purpose,
    description,
    visibility,
    invitationPolicy,
    allowSelfJoin,
  } = result.data;

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("teams")
      .insert({
        organization_id: organizationId,
        name,
        purpose: purpose || null,
        description: description || null,
        visibility,
        invitation_policy: invitationPolicy,
        allow_self_join: allowSelfJoin,
      })
      .select()
      .single();

    if (error || !data) {
      return c.json(
        { error: "Failed to create team", message: error?.message },
        500,
      );
    }

    // Add creator as team owner
    await supabase.schema("core").from("team_members").insert({
      team_id: data.id,
      user_id: user.id,
      role_key: "owner",
      status: "active",
    });

    return c.json({ team: data });
  } catch (error) {
    console.error("Error creating team:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// PATCH /:id - Update team
const updateRoute = createRoute({
  method: "patch",
  path: "/{id}",
  summary: "Update a team",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: updateTeamSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: teamResponseSchema } },
      description: "Updated team",
    },
  },
});

app.openapi(updateRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const result = updateTeamSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: "Validation error", message: result.error.message },
      400,
    );
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (result.data.name) updateData.name = result.data.name;
    if (result.data.purpose !== undefined) {
      updateData.purpose = result.data.purpose;
    }
    if (result.data.description !== undefined) {
      updateData.description = result.data.description;
    }
    if (result.data.visibility) updateData.visibility = result.data.visibility;
    if (result.data.invitationPolicy) {
      updateData.invitation_policy = result.data.invitationPolicy;
    }
    if (result.data.allowSelfJoin !== undefined) {
      updateData.allow_self_join = result.data.allowSelfJoin;
    }

    const { data, error } = await supabase
      .schema("core")
      .from("teams")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return c.json(
        { error: "Failed to update team", message: error?.message },
        500,
      );
    }

    return c.json({ team: data });
  } catch (error) {
    console.error("Error updating team:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// POST /:id/archive - Archive team
const archiveRoute = createRoute({
  method: "post",
  path: "/{id}/archive",
  summary: "Archive a team",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: archiveTeamSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: teamResponseSchema } },
      description: "Archived team",
    },
  },
});

app.openapi(archiveRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("teams")
      .update({ is_archived: true })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return c.json({
        error: "Failed to archive team",
        message: error?.message,
      }, 500);
    }

    return c.json({ team: data });
  } catch (error) {
    console.error("Error archiving team:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// ============================================================================
// Member Management Routes
// ============================================================================

// GET /:id/members - List team members
const listMembersRoute = createRoute({
  method: "get",
  path: "/{id}/members",
  summary: "List team members",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: teamMembersListResponseSchema },
      },
      description: "List of team members",
    },
  },
});

app.openapi(listMembersRoute, async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user || !supabaseAdmin) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { data, error } = await supabaseAdmin
      .schema("core")
      .from("team_members")
      .select(
        `id, team_id, user_id, role_id, status, joined_at, invited_by, removed_at, metadata, created_at,
         role:team_roles(id, key, name),
         user:users!team_members_user_id_fkey(id, display_name, username, avatar_path)`,
      )
      .eq("team_id", id)
      .neq("status", "removed")
      .order("created_at", { ascending: true });

    if (error) {
      return c.json({
        error: "Failed to fetch members",
        message: error.message,
      }, 500);
    }

    const members = (data ?? []).map((record: Record<string, unknown>) => {
      const role = record.role as Record<string, unknown> | null;
      const userRecord = record.user as Record<string, unknown> | null;
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
        user: userRecord
          ? {
            id: userRecord.id as string,
            displayName: (userRecord.display_name as string) ?? null,
            username: (userRecord.username as string) ?? null,
            avatarPath: (userRecord.avatar_path as string) ?? null,
          }
          : null,
      };
    });

    return c.json({ members });
  } catch (error) {
    console.error("Error listing members:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// POST /:id/members - Add team member
const addMemberRoute = createRoute({
  method: "post",
  path: "/{id}/members",
  summary: "Add a member to the team",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: addMemberSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: teamMemberResponseSchema } },
      description: "Added team member",
    },
  },
});

app.openapi(addMemberRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const result = addMemberSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: "Validation error", message: result.error.message },
      400,
    );
  }

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("team_members")
      .insert({
        team_id: id,
        user_id: result.data.userId,
        role_key: result.data.roleKey,
        status: "active",
      })
      .select()
      .single();

    if (error || !data) {
      return c.json(
        { error: "Failed to add member", message: error?.message },
        500,
      );
    }

    return c.json({ member: data });
  } catch (error) {
    console.error("Error adding member:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// PATCH /:id/members/:userId - Update team member
const updateMemberRoute = createRoute({
  method: "patch",
  path: "/{id}/members/{userId}",
  summary: "Update a team member",
  request: {
    params: z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
    }),
    body: {
      content: { "application/json": { schema: updateMemberSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: teamMemberResponseSchema } },
      description: "Updated team member",
    },
  },
});

app.openapi(updateMemberRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, userId } = c.req.valid("param");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const result = updateMemberSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: "Validation error", message: result.error.message },
      400,
    );
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (result.data.roleKey) updateData.role_key = result.data.roleKey;
    if (result.data.status) updateData.status = result.data.status;

    const { data, error } = await supabase
      .schema("core")
      .from("team_members")
      .update(updateData)
      .eq("team_id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      return c.json({
        error: "Failed to update member",
        message: error?.message,
      }, 500);
    }

    return c.json({ member: data });
  } catch (error) {
    console.error("Error updating member:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// DELETE /:id/members/:userId - Remove team member
const removeMemberRoute = createRoute({
  method: "delete",
  path: "/{id}/members/{userId}",
  summary: "Remove a team member",
  request: {
    params: z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: deleteResponseSchema } },
      description: "Member removed",
    },
  },
});

app.openapi(removeMemberRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id, userId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { error } = await supabase
      .schema("core")
      .from("team_members")
      .delete()
      .eq("team_id", id)
      .eq("user_id", userId);

    if (error) {
      return c.json({
        error: "Failed to remove member",
        message: error.message,
      }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// ============================================================================
// Invitation Routes
// ============================================================================

// GET /invitations/mine - List invitations for the current user
const listMyInvitationsRoute = createRoute({
  method: "get",
  path: "/invitations/mine",
  summary: "List my team invitations",
  description:
    "Returns invitations sent to the current user, optionally filtered by status.",
  request: {
    query: z.object({
      status: z.enum(["pending", "accepted", "declined", "cancelled"])
        .optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: teamInvitationsListResponseSchema },
      },
      description: "List of invitations for the current user",
    },
    401: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Unauthorized",
    },
  },
});

app.openapi(listMyInvitationsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const query = c.req.valid("query");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    let queryBuilder = supabase
      .schema("core")
      .from("team_invitations")
      .select("*")
      .eq("invited_user_id", user.id)
      .order("created_at", { ascending: false });

    if (query.status) {
      queryBuilder = queryBuilder.eq("status", query.status);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      return c.json({
        error: "Failed to fetch invitations",
        message: error.message,
      }, 500);
    }

    return c.json({ invitations: data ?? [] });
  } catch (err) {
    console.error("Error listing my invitations:", err);
    return c.json(
      {
        error: "Internal server error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  }
});

// GET /:id/invitations - List team invitations
const listInvitationsRoute = createRoute({
  method: "get",
  path: "/{id}/invitations",
  summary: "List team invitations",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: teamInvitationsListResponseSchema },
      },
      description: "List of team invitations",
    },
  },
});

app.openapi(listInvitationsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("team_invitations")
      .select("*")
      .eq("team_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return c.json({
        error: "Failed to fetch invitations",
        message: error.message,
      }, 500);
    }

    return c.json({ invitations: data || [] });
  } catch (error) {
    console.error("Error listing invitations:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// POST /:id/invitations - Invite member
const inviteMemberRoute = createRoute({
  method: "post",
  path: "/{id}/invitations",
  summary: "Invite a member to the team",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: inviteMemberSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: teamInvitationResponseSchema } },
      description: "Created invitation",
    },
  },
});

app.openapi(inviteMemberRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const result = inviteMemberSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: "Validation error", message: result.error.message },
      400,
    );
  }

  try {
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .schema("core")
      .from("team_invitations")
      .insert({
        team_id: id,
        email: result.data.email,
        role_key: result.data.roleKey,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      return c.json({
        error: "Failed to create invitation",
        message: error?.message,
      }, 500);
    }

    // TODO: Send invitation email

    return c.json({ invitation: data });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// DELETE /:id/invitations/:invitationId - Cancel invitation
const cancelInvitationRoute = createRoute({
  method: "delete",
  path: "/{id}/invitations/{invitationId}",
  summary: "Cancel a team invitation",
  request: {
    params: z.object({
      id: z.string().uuid(),
      invitationId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: deleteResponseSchema } },
      description: "Invitation cancelled",
    },
  },
});

app.openapi(cancelInvitationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { invitationId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { error } = await supabase
      .schema("core")
      .from("team_invitations")
      .update({ status: "cancelled" })
      .eq("id", invitationId);

    if (error) {
      return c.json({
        error: "Failed to cancel invitation",
        message: error.message,
      }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// ============================================================================
// Job Assignment Routes
// ============================================================================

// GET /:id/job-assignments - List job assignments
const listJobAssignmentsRoute = createRoute({
  method: "get",
  path: "/{id}/job-assignments",
  summary: "List team job assignments",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: teamJobAssignmentsListResponseSchema },
      },
      description: "List of job assignments",
    },
  },
});

app.openapi(listJobAssignmentsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("team_job_assignments")
      .select("*")
      .eq("team_id", id)
      .order("assigned_at", { ascending: false });

    if (error) {
      return c.json({
        error: "Failed to fetch job assignments",
        message: error.message,
      }, 500);
    }

    return c.json({ assignments: data || [] });
  } catch (error) {
    console.error("Error listing job assignments:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// POST /:id/job-assignments - Create job assignment
const createJobAssignmentRoute = createRoute({
  method: "post",
  path: "/{id}/job-assignments",
  summary: "Assign a job to the team",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: createJobAssignmentSchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: teamJobAssignmentResponseSchema },
      },
      description: "Created job assignment",
    },
  },
});

app.openapi(createJobAssignmentRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const result = createJobAssignmentSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: "Validation error", message: result.error.message },
      400,
    );
  }

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("team_job_assignments")
      .insert({
        team_id: id,
        job_id: result.data.jobId,
      })
      .select()
      .single();

    if (error || !data) {
      return c.json({
        error: "Failed to create job assignment",
        message: error?.message,
      }, 500);
    }

    return c.json({ assignment: data });
  } catch (error) {
    console.error("Error creating job assignment:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// DELETE /:id/job-assignments/:assignmentId - Delete job assignment
const deleteJobAssignmentRoute = createRoute({
  method: "delete",
  path: "/{id}/job-assignments/{assignmentId}",
  summary: "Remove a job assignment",
  request: {
    params: z.object({
      id: z.string().uuid(),
      assignmentId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: deleteResponseSchema } },
      description: "Job assignment removed",
    },
  },
});

app.openapi(deleteJobAssignmentRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { assignmentId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { error } = await supabase
      .schema("core")
      .from("team_job_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      return c.json({
        error: "Failed to delete job assignment",
        message: error.message,
      }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting job assignment:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// ============================================================================
// Application Assignment
// ============================================================================

app.post("/:teamId/applications/:applicationId/assign", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { teamId, applicationId } = c.req.param();
  if (!supabaseAdmin || !user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: { assigneeUserId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const { assigneeUserId } = body;
  if (!assigneeUserId) {
    return c.json({ error: "assigneeUserId is required" }, 400);
  }

  const { data: applicationRecord, error: applicationError } =
    await supabaseAdmin
      .schema("core").from("applications").select("id, job_id").eq(
        "id",
        applicationId,
      ).maybeSingle();
  if (applicationError || !applicationRecord) {
    return c.json({ error: "Application not found" }, 404);
  }

  const jobId = applicationRecord.job_id as string;
  const { data: jobRecord, error: jobError } = await supabaseAdmin
    .schema("core").from("jobs").select("id, assigned_team_id, organization_id")
    .eq("id", jobId).maybeSingle();
  if (jobError || !jobRecord) return c.json({ error: "Job not found" }, 404);

  const { data: jobTeams } = await supabaseAdmin.schema("core").from(
    "job_teams" as never,
  ).select("team_id").eq("job_id", jobId);
  const teamIds = new Set(
    ((jobTeams ?? []) as unknown as Array<{ team_id: string }>).map((r) =>
      r.team_id
    ),
  );
  if (jobRecord.assigned_team_id) {
    teamIds.add(jobRecord.assigned_team_id as string);
  }

  if (!teamIds.has(teamId)) {
    return c.json({ error: "Team is not assigned to this job" }, 403);
  }

  const { error: updateError } = await supabaseAdmin
    .schema("core").from("applications").update({
      assigned_to: assigneeUserId,
      assigned_at: new Date().toISOString(),
      assigned_by: user.id,
    }).eq("id", applicationId);
  if (updateError) {
    return c.json({
      error: "Failed to assign application",
      message: updateError.message,
    }, 500);
  }

  await supabaseAdmin.schema("core").from("application_assignment_history")
    .insert({
      application_id: applicationId,
      team_id: teamId,
      assigned_to: assigneeUserId,
      assigned_by: user.id,
      source: "manual",
      metadata: {},
    });

  return c.json({ success: true });
});

// ============================================================================
// Analytics
// ============================================================================

// GET /:teamId/analytics/workload - Get workload snapshots
app.get("/:teamId/analytics/workload", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { teamId } = c.req.param();
  if (!supabaseAdmin || !user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { includeHistorical: includeHistoricalStr, asOf } = c.req.query();
  const includeHistorical = includeHistoricalStr === "true";

  const baseQuery = includeHistorical
    ? supabaseAdmin.schema("core").from("team_member_workloads")
    : supabaseAdmin.schema("core").from(
      "v_team_member_workloads_latest" as never,
    );

  let query = (baseQuery as ReturnType<typeof supabaseAdmin.schema>)
    .select(
      `id, organization_id, team_id, team_member_id, user_id, captured_at,
       pending_assignments, active_assignments, overdue_assignments, completed_reviews,
       weekly_capacity, availability_score, metadata`,
    )
    .eq("team_id", teamId)
    .order("captured_at", { ascending: false });

  if (asOf) query = query.lte("captured_at", asOf);
  if (includeHistorical) query = query.limit(200);

  const { data, error } = await query;
  if (error) {
    return c.json(
      { error: "Failed to load workloads", message: error.message },
      500,
    );
  }

  const snapshots = (data ?? []).map((record: Record<string, unknown>) => ({
    id: record.id as string,
    teamId: record.team_id as string,
    organizationId: record.organization_id as string,
    teamMemberId: record.team_member_id as string,
    userId: record.user_id as string,
    capturedAt: record.captured_at as string,
    pendingAssignments: Number(record.pending_assignments ?? 0),
    activeAssignments: Number(record.active_assignments ?? 0),
    overdueAssignments: Number(record.overdue_assignments ?? 0),
    completedReviews: Number(record.completed_reviews ?? 0),
    weeklyCapacity: record.weekly_capacity as number | null,
    availabilityScore: record.availability_score as number | null,
    metadata: (record.metadata as Record<string, unknown> | null) ?? {},
  }));

  return c.json({ snapshots });
});

// GET /:teamId/analytics/activity - Get activity feed (cursor-paginated)
app.get("/:teamId/analytics/activity", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { teamId } = c.req.param();
  if (!supabaseAdmin || !user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { pageSize: pageSizeStr, cursor, startDate, endDate } = c.req.query();
  const pageSize = Math.min(Number(pageSizeStr ?? 20), 100);

  let query = supabaseAdmin
    .schema("core")
    .from("team_activity_events")
    .select(
      `id, organization_id, team_id, event_type, actor_user_id, subject_user_id,
       related_member_id, related_job_id, related_application_id, payload, occurred_at, created_at`,
    )
    .eq("team_id", teamId)
    .order("occurred_at", { ascending: false })
    .limit(pageSize);

  if (startDate) query = query.gte("occurred_at", startDate);
  if (endDate) query = query.lte("occurred_at", endDate);
  if (cursor) query = query.lt("occurred_at", cursor);

  const { data, error } = await query;
  if (error) {
    return c.json(
      { error: "Failed to load activity", message: error.message },
      500,
    );
  }

  const events = (data ?? []).map((record: Record<string, unknown>) => ({
    id: record.id as string,
    teamId: record.team_id as string,
    organizationId: record.organization_id as string,
    eventType: record.event_type as string,
    actorUserId: record.actor_user_id as string | null,
    subjectUserId: record.subject_user_id as string | null,
    relatedMemberId: record.related_member_id as string | null,
    relatedJobId: record.related_job_id as string | null,
    relatedApplicationId: record.related_application_id as string | null,
    payload: (record.payload as Record<string, unknown> | null) ?? {},
    occurredAt: record.occurred_at as string,
    createdAt: record.created_at as string,
  }));

  return c.json({
    events,
    nextCursor: events.length === pageSize
      ? (events[events.length - 1]?.occurredAt ?? null)
      : null,
  });
});

// GET /:teamId/analytics/comments - Get team comments
app.get("/:teamId/analytics/comments", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { teamId } = c.req.param();
  if (!supabaseAdmin || !user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { applicationId, limit: limitStr, cursor } = c.req.query();
  const limit = Math.min(Number(limitStr ?? 50), 100);

  let query = supabaseAdmin
    .schema("core")
    .from("team_activity_events")
    .select(
      `id, team_id, organization_id, event_type, actor_user_id, related_application_id,
       payload, occurred_at, created_at,
       actor:users(id, display_name, username)`,
    )
    .eq("team_id", teamId)
    .eq("event_type", "discussion.comment" as never)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (applicationId) query = query.eq("related_application_id", applicationId);
  if (cursor) query = query.lt("occurred_at", cursor);

  const { data, error } = await query;
  if (error) {
    return c.json(
      { error: "Failed to load comments", message: error.message },
      500,
    );
  }

  const comments = (data ?? []).map((record: Record<string, unknown>) => {
    const payload = (record.payload as Record<string, unknown> | null) ?? {};
    const actor = record.actor as Record<string, unknown> | null;
    return {
      id: record.id as string,
      teamId: record.team_id as string,
      organizationId: record.organization_id as string,
      eventType: record.event_type as string,
      actorUserId: record.actor_user_id as string | null,
      actorDisplayName: actor
        ? ((actor.display_name as string | null) ??
          (actor.username as string | null) ?? null)
        : null,
      relatedApplicationId: record.related_application_id as string | null,
      body: typeof payload.body === "string" ? payload.body : "",
      mentions: Array.isArray(payload.mentions)
        ? (payload.mentions as string[])
        : [],
      occurredAt: record.occurred_at as string,
      createdAt: record.created_at as string,
    };
  });

  return c.json({
    comments,
    nextCursor: comments.length === limit
      ? (comments[comments.length - 1]?.occurredAt ?? null)
      : null,
  });
});

// POST /:teamId/analytics/comments - Post a team comment
app.post("/:teamId/analytics/comments", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { teamId } = c.req.param();
  if (!supabaseAdmin || !user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: { body?: string; mentions?: string[]; applicationId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!body.body?.trim()) return c.json({ error: "body is required" }, 400);

  const { data: teamRecord, error: teamError } = await supabaseAdmin
    .schema("core")
    .from("teams")
    .select("id, organization_id")
    .eq("id", teamId)
    .maybeSingle();
  if (teamError || !teamRecord) return c.json({ error: "Team not found" }, 404);

  const { error } = await supabaseAdmin
    .schema("core")
    .from("team_activity_events")
    .insert({
      organization_id: teamRecord.organization_id,
      team_id: teamId,
      event_type: "discussion.comment" as never,
      actor_user_id: user.id,
      related_application_id: body.applicationId ?? null,
      payload: {
        body: body.body.trim(),
        mentions: body.mentions ?? [],
      } as never,
    });

  if (error) {
    return c.json(
      { error: "Failed to post comment", message: error.message },
      500,
    );
  }

  return c.json({ success: true });
});

// POST /:teamId/members/transfer-ownership - Transfer team ownership
app.post("/:teamId/members/transfer-ownership", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { teamId } = c.req.param();
  if (!supabaseAdmin || !user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: { memberId?: string; roleKey?: string; notify?: boolean };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!body.memberId) return c.json({ error: "memberId is required" }, 400);

  const { data: targetMember, error: memberError } = await supabaseAdmin
    .schema("core")
    .from("team_members")
    .select("id, user_id, role_id, status")
    .eq("id", body.memberId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (memberError || !targetMember) {
    return c.json({ error: "Member not found" }, 404);
  }
  if ((targetMember.status as string) === "removed") {
    return c.json(
      { error: "Cannot transfer ownership to a removed member" },
      400,
    );
  }

  // Resolve the admin role ID for this team
  const { data: teamRecord, error: teamError } = await supabaseAdmin
    .schema("core")
    .from("teams")
    .select("id, organization_id")
    .eq("id", teamId)
    .maybeSingle();
  if (teamError || !teamRecord) return c.json({ error: "Team not found" }, 404);

  const roleKey = body.roleKey ?? "admin";
  const { data: roleRecord } = await supabaseAdmin
    .schema("core")
    .from("team_roles")
    .select("id")
    .eq("organization_id", teamRecord.organization_id)
    .eq("key", roleKey)
    .maybeSingle();

  if (roleRecord?.id && roleRecord.id !== targetMember.role_id) {
    const { error: updateError } = await supabaseAdmin
      .schema("core")
      .from("team_members")
      .update({ role_id: roleRecord.id })
      .eq("id", body.memberId);
    if (updateError) {
      return c.json({
        error: "Failed to promote member",
        message: updateError.message,
      }, 500);
    }
  }

  // Record activity event
  await supabaseAdmin
    .schema("core")
    .from("team_activity_events")
    .insert({
      organization_id: teamRecord.organization_id,
      team_id: teamId,
      event_type: "team.ownership_transferred" as never,
      actor_user_id: user.id,
      subject_user_id: targetMember.user_id as string,
      payload: { roleKey, notify: body.notify ?? false } as never,
    });

  return c.json({ success: true });
});

// POST /:teamId/members/self-remove - Leave a team
app.post("/:teamId/members/self-remove", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { teamId } = c.req.param();
  if (!supabaseAdmin || !user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: { reason?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    // body is optional
  }

  const { data: existingMember, error: fetchError } = await supabaseAdmin
    .schema("core")
    .from("team_members")
    .select("id, team_id, status, metadata")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !existingMember) {
    return c.json({ error: "Member not found" }, 404);
  }
  if ((existingMember.status as string) === "removed") {
    return c.json({ error: "Already removed from team" }, 400);
  }

  const metadata =
    ((existingMember.metadata as Record<string, unknown>) ?? {}) as Record<
      string,
      unknown
    >;
  metadata.selfRemovedAt = new Date().toISOString();
  metadata.selfRemovedReason = body.reason ?? null;

  const { error: updateError } = await supabaseAdmin
    .schema("core")
    .from("team_members")
    .update({ status: "removed", metadata: metadata as never })
    .eq("id", existingMember.id);

  if (updateError) {
    return c.json({
      error: "Failed to leave team",
      message: updateError.message,
    }, 500);
  }

  // Get team for activity event
  const { data: teamRecord } = await supabaseAdmin
    .schema("core")
    .from("teams")
    .select("id, organization_id")
    .eq("id", teamId)
    .maybeSingle();

  if (teamRecord) {
    await supabaseAdmin
      .schema("core")
      .from("team_activity_events")
      .insert({
        organization_id: teamRecord.organization_id,
        team_id: teamId,
        event_type: "member.self_removed" as never,
        actor_user_id: user.id,
        payload: { reason: body.reason ?? null } as never,
      });
  }

  return c.json({ success: true });
});

app.get("/:teamId/analytics/overview", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { teamId } = c.req.param();
  if (!supabaseAdmin || !user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { startDate, endDate, limit: limitStr } = c.req.query();
  const limit = limitStr ? Math.min(Number(limitStr), 90) : 30;

  let query = supabaseAdmin
    .schema("core")
    .from("team_daily_metrics")
    .select(
      `id, organization_id, team_id, metric_date, members_total, members_active,
       members_pending, jobs_active, applications_active, applications_reviewed,
       applications_escalated, pending_invitations, avg_time_to_first_review_seconds,
       median_time_to_first_review_seconds, workload_pressure_score, metadata,
       created_at, updated_at`,
    )
    .eq("team_id", teamId)
    .order("metric_date", { ascending: false })
    .limit(limit);

  if (startDate) query = query.gte("metric_date", startDate.slice(0, 10));
  if (endDate) query = query.lte("metric_date", endDate.slice(0, 10));

  const { data, error } = await query;
  if (error) {
    return c.json(
      { error: "Failed to load analytics", message: error.message },
      500,
    );
  }

  const metrics = (data ?? []).map((record: Record<string, unknown>) => ({
    id: record.id as string,
    teamId: record.team_id as string,
    organizationId: record.organization_id as string,
    date: record.metric_date as string,
    members: {
      total: Number(record.members_total ?? 0),
      active: Number(record.members_active ?? 0),
      pending: Number(record.members_pending ?? 0),
    },
    jobs: { active: Number(record.jobs_active ?? 0) },
    applications: {
      active: Number(record.applications_active ?? 0),
      reviewed: Number(record.applications_reviewed ?? 0),
      escalated: Number(record.applications_escalated ?? 0),
    },
    invitations: { pending: Number(record.pending_invitations ?? 0) },
    timeToFirstReview: {
      averageSeconds: record.avg_time_to_first_review_seconds as number | null,
      medianSeconds: record.median_time_to_first_review_seconds as
        | number
        | null,
    },
    workloadPressureScore: record.workload_pressure_score as number | null,
    metadata: (record.metadata as Record<string, unknown> | null) ?? {},
    capturedAt: record.updated_at as string,
    createdAt: record.created_at as string,
  }));

  return c.json({ metrics });
});

export default app;
