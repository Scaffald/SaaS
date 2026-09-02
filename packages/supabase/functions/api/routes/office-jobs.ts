/**
 * Office Jobs REST API
 * Office role required. Migrated from tRPC office.listJobs.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type ApiEnv, authMiddleware, requireRole } from "../middleware/auth.ts";
import {
  isSuperAdmin,
  loadUserRoleAssignments,
} from "../../_shared/permissions/team-permissions.ts";

const listJobsQuerySchema = z.object({
  organization_id: z.string().uuid().optional(),
  status: z.enum(["draft", "open", "paused", "closed"]).optional(),
  team_id: z.string().uuid().optional(),
  myTeamsOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const app = new Hono<ApiEnv>();
app.use("*", authMiddleware);
app.use("*", requireRole("office", "platform"));

app.get("/", zValidator("query", listJobsQuerySchema), async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");

  if (!supabaseAdmin || !user?.id) {
    return c.json(
      { error: "Unauthorized", message: "User not authenticated" },
      401,
    );
  }

  const input = c.req.valid("query");

  const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id);
  const superAdmin = isSuperAdmin(assignments);

  let organizationIds: Set<string> | null = null;
  if (!superAdmin) {
    organizationIds = new Set<string>();

    const { data: ownedOrgs, error: ownedError } = await supabaseAdmin
      .schema("core")
      .from("organizations")
      .select("id")
      .eq("owner_user_id", user.id);

    if (ownedError) {
      return c.json({
        error: "Internal Server Error",
        message: `Failed to fetch owned organizations: ${ownedError.message}`,
      }, 500);
    }

    for (const org of ownedOrgs ?? []) {
      if (org.id) organizationIds.add(org.id as string);
    }

    const { data: teamMemberships, error: membershipsError } =
      await supabaseAdmin
        .schema("core")
        .from("team_members")
        .select("teams!inner(organization_id)")
        .eq("user_id", user.id)
        .neq("status", "removed");

    if (membershipsError) {
      return c.json({
        error: "Internal Server Error",
        message: `Failed to load team memberships: ${membershipsError.message}`,
      }, 500);
    }

    for (const membership of teamMemberships ?? []) {
      const orgId = (membership as { teams?: { organization_id?: string } })
        ?.teams?.organization_id;
      if (orgId && typeof orgId === "string") organizationIds.add(orgId);
    }

    if (organizationIds.size === 0) {
      return c.json({ data: { jobs: [], total: 0 } });
    }

    if (input.organization_id) {
      if (!organizationIds.has(input.organization_id)) {
        return c.json({
          error: "Forbidden",
          message: "You do not have access to this organization",
        }, 403);
      }
      organizationIds.clear();
      organizationIds.add(input.organization_id);
    }
  }

  const jobTeamsRelationship = input.team_id || input.myTeamsOnly
    ? "job_team_assignments!inner"
    : "job_team_assignments";
  // NB: this is a PostgREST select string, not TypeScript — `--` inside it
  // is sent to the server, not stripped. Keep explanations out here.
  //
  // `team:teams` must name its constraint: core.jobs has two FKs to
  // core.teams (team_id and assigned_team_id), and an unqualified embed
  // makes PostgREST refuse the whole query with "more than one
  // relationship was found for 'jobs' and 'teams'".
  const selectClause = `
    id,
    title,
    description,
    status,
    employment_type,
    remote_option,
    location,
    pay_range_min_cents,
    pay_range_max_cents,
    pay_range_type,
    posted_at,
    created_at,
    updated_at,
    organization:organizations!organization_id(id, name, slug),
    team:teams!jobs_team_id_fkey(id, name, organization_id),
    team_assignments:${jobTeamsRelationship}(
      team_id,
      is_primary,
      role_key,
      assigned_at,
      team:teams(id, name, organization_id)
    ),
    created_by:users!created_by_user_id(id, username, display_name)
  `;

  let query = supabaseAdmin
    .schema("core")
    .from("jobs")
    .select(selectClause, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(input.offset, input.offset + input.limit - 1);

  if (!superAdmin && organizationIds && organizationIds.size > 0) {
    query = query.in("organization_id", Array.from(organizationIds));
  } else if (input.organization_id) {
    query = query.eq("organization_id", input.organization_id);
  }

  if (input.status) query = query.eq("status", input.status);
  if (input.team_id) {
    query = query.eq("team_assignments.team_id", input.team_id);
  }

  if (input.myTeamsOnly) {
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .schema("core")
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .neq("status", "removed");

    if (membershipsError) {
      return c.json({
        error: "Internal Server Error",
        message: `Failed to load team memberships: ${membershipsError.message}`,
      }, 500);
    }

    const teamIds = (memberships ?? [])
      .map((m: { team_id?: string | null }) => m.team_id as string | null)
      .filter((id: string | null): id is string => Boolean(id));

    if (teamIds.length === 0) {
      return c.json({ data: { jobs: [], total: 0 } });
    }
    query = query.in("team_assignments.team_id", teamIds);
  }

  const { data, error, count } = await query;

  if (error) {
    return c.json({
      error: "Internal Server Error",
      message: `Failed to fetch jobs: ${error.message}`,
    }, 500);
  }

  const jobs = (data ?? []).map((job: Record<string, unknown>) => {
    const { team_assignments: jobTeamsRaw, ...rest } = job;
    const teamAssignments =
      (jobTeamsRaw as Array<Record<string, unknown>> | null)?.map((
        assignment: Record<string, unknown>,
      ) => ({
        teamId: assignment.team_id as string,
        isPrimary: Boolean(assignment.is_primary),
        roleKey: assignment.role_key as string,
        assignedAt: assignment.assigned_at as string,
        team: assignment.team
          ? {
            id: (assignment.team as Record<string, unknown>).id as string,
            name: (assignment.team as Record<string, unknown>).name as
              | string
              | null,
            organization_id: (assignment.team as Record<string, unknown>)
              .organization_id as string,
          }
          : null,
      })) ?? [];

    const primaryAssignment = teamAssignments.find((a) => a.isPrimary) ?? null;

    return {
      ...rest,
      teamAssignments,
      team_ids: teamAssignments.map((a) => a.teamId),
      primary_team_id: primaryAssignment?.teamId ?? null,
      team: primaryAssignment?.team ?? null,
    };
  });

  return c.json({ data: { jobs, total: count ?? 0 } });
});

const createJobBodySchema = z.object({
  organization_id: z.string().uuid("Invalid organization ID"),
  // SC-122: match the shared schema in functions/_shared/job-schemas.ts so the
  // REST surface and the tRPC surface reject the same inputs. Was .min(1) /
  // .min(1) with no max — the UI's "Save as Draft" enabled with 1-char titles
  // that the shared schema rejects elsewhere.
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(["draft", "open", "paused", "closed"]).default("draft"),
  employment_type: z.enum([
    "full_time",
    "part_time",
    "contract",
    "temp",
    "intern",
  ]).optional(),
  remote_option: z.enum(["on_site", "hybrid", "remote"]).optional(),
  position_level: z.string().optional(),
  location: z.string().optional(),
  pay_range_min_cents: z.number().int().positive().optional(),
  pay_range_max_cents: z.number().int().positive().optional(),
  pay_range_type: z.enum(["hourly", "salary", "contract", "project"])
    .optional(),
});

app.post("/", zValidator("json", createJobBodySchema), async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");

  if (!supabaseAdmin || !user?.id) {
    return c.json(
      { error: "Unauthorized", message: "User not authenticated" },
      401,
    );
  }

  const input = c.req.valid("json");

  // Verify organization access
  const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id);
  const superAdmin = isSuperAdmin(assignments);

  if (!superAdmin) {
    const { data: orgAccess } = await supabaseAdmin
      .schema("core")
      .from("organizations")
      .select("id")
      .eq("id", input.organization_id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!orgAccess) {
      const { data: teamAccess } = await supabaseAdmin
        .schema("core")
        .from("team_members")
        .select("teams!inner(organization_id)")
        .eq("user_id", user.id)
        .neq("status", "removed")
        .filter("teams.organization_id", "eq", input.organization_id)
        .maybeSingle();

      if (!teamAccess) {
        return c.json({
          error: "Forbidden",
          message: "You do not have access to this organization",
        }, 403);
      }
    }
  }

  const { data: job, error } = await supabaseAdmin
    .schema("core")
    .from("jobs")
    .insert({
      organization_id: input.organization_id,
      title: input.title,
      description: input.description,
      status: input.status,
      employment_type: input.employment_type,
      remote_option: input.remote_option,
      position_level: input.position_level,
      location: input.location,
      pay_range_min_cents: input.pay_range_min_cents,
      pay_range_max_cents: input.pay_range_max_cents,
      pay_range_type: input.pay_range_type,
      created_by_user_id: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  return c.json({ data: { job } }, 201);
});

const updateJobBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(["draft", "open", "paused", "closed"]).optional(),
  employment_type: z.enum([
    "full_time",
    "part_time",
    "contract",
    "temp",
    "intern",
  ]).optional(),
  remote_option: z.enum(["on_site", "hybrid", "remote"]).optional(),
  position_level: z.string().optional(),
  location: z.string().optional(),
  pay_range_min_cents: z.number().int().positive().optional(),
  pay_range_max_cents: z.number().int().positive().optional(),
  pay_range_type: z.enum(["hourly", "salary", "contract", "project"])
    .optional(),
  organization_id: z.string().uuid().optional(),
});

app.patch("/:id", zValidator("json", updateJobBodySchema), async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!supabaseAdmin || !user?.id) {
    return c.json(
      { error: "Unauthorized", message: "User not authenticated" },
      401,
    );
  }

  const input = c.req.valid("json");

  // Fetch existing job to verify access
  const { data: existingJob, error: fetchError } = await supabaseAdmin
    .schema("core")
    .from("jobs")
    .select("id, organization_id")
    .eq("id", id)
    .single();

  if (fetchError || !existingJob) {
    return c.json({ error: "Not Found", message: "Job not found" }, 404);
  }

  const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id);
  const superAdmin = isSuperAdmin(assignments);

  if (!superAdmin) {
    const orgId = existingJob.organization_id as string;
    const { data: orgAccess } = await supabaseAdmin
      .schema("core")
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!orgAccess) {
      const { data: teamAccess } = await supabaseAdmin
        .schema("core")
        .from("team_members")
        .select("teams!inner(organization_id)")
        .eq("user_id", user.id)
        .neq("status", "removed")
        .filter("teams.organization_id", "eq", orgId)
        .maybeSingle();

      if (!teamAccess) {
        return c.json({
          error: "Forbidden",
          message: "You do not have access to this job",
        }, 403);
      }
    }
  }

  // SC-120: reject org reassignment that the existing-org access check above
  // doesn't cover. Without this, a user with access to org A could move a job
  // to org B (where they have no permission) by including organization_id in
  // the PATCH body. Cross-org moves should go through a dedicated handler
  // that verifies access to the destination org.
  if (
    input.organization_id !== undefined &&
    input.organization_id !== existingJob.organization_id
  ) {
    return c.json(
      {
        error: "Bad Request",
        message:
          "Changing organization_id via PATCH is not supported. Use the org-transfer flow.",
      },
      400,
    );
  }

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.status !== undefined) updateData.status = input.status;
  if (input.employment_type !== undefined) {
    updateData.employment_type = input.employment_type;
  }
  if (input.remote_option !== undefined) {
    updateData.remote_option = input.remote_option;
  }
  if (input.position_level !== undefined) {
    updateData.position_level = input.position_level;
  }
  if (input.location !== undefined) updateData.location = input.location;
  if (input.pay_range_min_cents !== undefined) {
    updateData.pay_range_min_cents = input.pay_range_min_cents;
  }
  if (input.pay_range_max_cents !== undefined) {
    updateData.pay_range_max_cents = input.pay_range_max_cents;
  }
  if (input.pay_range_type !== undefined) {
    updateData.pay_range_type = input.pay_range_type;
  }

  const { data: job, error } = await supabaseAdmin
    .schema("core")
    .from("jobs")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  return c.json({ data: { job } });
});

app.delete("/:id", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!supabaseAdmin || !user?.id) {
    return c.json(
      { error: "Unauthorized", message: "User not authenticated" },
      401,
    );
  }

  const { data: existingJob, error: fetchError } = await supabaseAdmin
    .schema("core")
    .from("jobs")
    .select("organization_id")
    .eq("id", id)
    .single();

  if (fetchError || !existingJob) {
    return c.json({ error: "Not Found", message: "Job not found" }, 404);
  }

  const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id);
  const superAdmin = isSuperAdmin(assignments);

  if (!superAdmin) {
    const organizationId = existingJob.organization_id as string;
    const organizationIds = new Set<string>();

    const { data: ownedOrgs } = await supabaseAdmin
      .schema("core").from("organizations").select("id").eq(
        "owner_user_id",
        user.id,
      );
    for (const org of ownedOrgs ?? []) {
      if (org.id) organizationIds.add(org.id as string);
    }

    const { data: teamMemberships } = await supabaseAdmin
      .schema("core").from("team_members").select(
        "teams!inner(organization_id)",
      )
      .eq("user_id", user.id).neq("status", "removed");
    for (const membership of teamMemberships ?? []) {
      const orgId = (membership as { teams?: { organization_id?: string } })
        ?.teams?.organization_id;
      if (orgId && typeof orgId === "string") organizationIds.add(orgId);
    }

    if (!organizationIds.has(organizationId)) {
      return c.json({
        error: "Forbidden",
        message: "You do not have access to this job",
      }, 403);
    }
  }

  await supabaseAdmin.schema("core").from("job_certifications").delete().eq(
    "job_id",
    id,
  );
  await supabaseAdmin.schema("core").from("job_skills").delete().eq(
    "job_id",
    id,
  );
  await supabaseAdmin.schema("core").from("applications").delete().eq(
    "job_id",
    id,
  );

  const { error } = await supabaseAdmin.schema("core").from("jobs").delete().eq(
    "id",
    id,
  );

  if (error) {
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  return c.json({ success: true });
});

app.post("/:id/duplicate", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  const { id } = c.req.param();

  if (!supabaseAdmin || !user?.id) {
    return c.json(
      { error: "Unauthorized", message: "User not authenticated" },
      401,
    );
  }

  const { data: originalJob, error: jobError } = await supabaseAdmin
    .schema("core").from("jobs").select("*").eq("id", id).single();

  if (jobError || !originalJob) {
    return c.json({ error: "Not Found", message: "Job not found" }, 404);
  }

  const assignments = await loadUserRoleAssignments(supabaseAdmin, user.id);
  const superAdmin = isSuperAdmin(assignments);

  if (!superAdmin) {
    const organizationId = originalJob.organization_id as string;
    const organizationIds = new Set<string>();

    const { data: ownedOrgs } = await supabaseAdmin
      .schema("core").from("organizations").select("id").eq(
        "owner_user_id",
        user.id,
      );
    for (const org of ownedOrgs ?? []) {
      if (org.id) organizationIds.add(org.id as string);
    }

    const { data: teamMemberships } = await supabaseAdmin
      .schema("core").from("team_members").select(
        "teams!inner(organization_id)",
      )
      .eq("user_id", user.id).neq("status", "removed");
    for (const membership of teamMemberships ?? []) {
      const orgId = (membership as { teams?: { organization_id?: string } })
        ?.teams?.organization_id;
      if (orgId && typeof orgId === "string") organizationIds.add(orgId);
    }

    if (!organizationIds.has(organizationId)) {
      return c.json({
        error: "Forbidden",
        message: "You do not have access to this job",
      }, 403);
    }
  }

  const {
    id: _id,
    created_at: _created_at,
    updated_at: _updated_at,
    posted_at: _posted_at,
    created_by_user_id: _created_by_user_id,
    ...jobData
  } = originalJob as Record<string, unknown>;

  const { data: newJob, error: createError } = await supabaseAdmin
    .schema("core").from("jobs").insert({
      ...jobData,
      status: "draft",
      title: `${jobData.title as string} (Copy)`,
      created_by_user_id: user.id,
    }).select().single();

  if (createError) {
    return c.json({
      error: "Internal Server Error",
      message: createError.message,
    }, 500);
  }

  const { data: certifications } = await supabaseAdmin
    .schema("core").from("job_certifications").select(
      "certification_id, is_required",
    ).eq("job_id", id);
  if (certifications && certifications.length > 0) {
    await supabaseAdmin.schema("core").from("job_certifications").insert(
      certifications.map((
        cert: { certification_id: string; is_required: boolean },
      ) => ({
        job_id: (newJob as { id: string }).id,
        certification_id: cert.certification_id,
        is_required: cert.is_required,
      })),
    );
  }

  const { data: teamAssignments } = await supabaseAdmin
    .schema("core").from("job_team_assignments")
    .select("team_id, is_primary, role_key, organization_id").eq("job_id", id);
  if (teamAssignments && teamAssignments.length > 0) {
    await supabaseAdmin.schema("core").from("job_team_assignments").insert(
      teamAssignments.map((
        a: {
          team_id: string;
          is_primary?: boolean | null;
          role_key?: string | null;
          organization_id: string;
        },
      ) => ({
        job_id: (newJob as { id: string }).id,
        team_id: a.team_id,
        is_primary: a.is_primary,
        role_key: a.role_key,
        organization_id: a.organization_id,
        assigned_by: user.id,
      })),
    );
  }

  return c.json({ data: { job: newJob } }, 201);
});

export default app;
