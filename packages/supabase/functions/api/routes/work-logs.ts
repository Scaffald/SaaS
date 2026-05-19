/**
 * Work Logs REST API
 * Work time tracking and work log management
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.ts";

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

const app = new OpenAPIHono();
app.use("*", authMiddleware);

const _errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

/**
 * GET /v1/work-logs
 * List work logs
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Work Logs"],
    summary: "List work logs",
    request: {
      query: z.object({
        page: z.coerce.number().optional(),
        pageSize: z.coerce.number().optional(),
        projectId: z.string().uuid().optional(),
        organizationId: z.string().uuid().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        // Accept comma-separated or repeated values; coerce to array.
        statuses: z.union([z.string(), z.array(z.string())]).optional(),
        search: z.string().optional(),
        sortField: z.enum(["log_date", "created_at", "updated_at", "total_hours"]).optional(),
        sortDirection: z.enum(["asc", "desc"]).optional(),
      }),
    },
    responses: {
      200: {
        description: "Work logs",
        content: {
          "application/json": {
            schema: z.object({
              workLogs: z.array(z.any()),
              totalCount: z.number(),
              page: z.number(),
              pageSize: z.number(),
              hasMore: z.boolean(),
            }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const {
      page = 1,
      pageSize = 20,
      projectId,
      organizationId,
      dateFrom,
      dateTo,
      statuses,
      search,
      sortField = "log_date",
      sortDirection = "desc",
    } = c.req.valid("query");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const statusList = Array.isArray(statuses)
      ? statuses
      : typeof statuses === "string" && statuses.length > 0
      ? statuses.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    let query = supabase.schema("core").from("work_logs").select("*", {
      count: "exact",
    });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (organizationId) {
      // Check the user is a member of this organization
      const { data: memberships } = await supabase
        .schema("core")
        .from("role_assignments")
        .select("scope_org_id")
        .eq("user_id", user.id)
        .not("scope_org_id", "is", null);
      const orgIds = new Set(
        (memberships ?? []).map((m) => m.scope_org_id).filter((
          id,
        ): id is string => typeof id === "string"),
      );
      if (!orgIds.has(organizationId)) {
        return c.json({
          error: "Forbidden",
          message: "You do not have access to the requested organization.",
        }, 403);
      }
      // Use service client to bypass RLS for org admin view
      const adminClient = getServiceClient();
      const { data: projectRows, error: projError } = await adminClient
        .schema("core")
        .from("construction_projects")
        .select("id")
        .eq("organization_id", organizationId);
      if (projError) {
        console.error("[work-logs] project query error:", projError);
      }
      const projectIds = (projectRows ?? []).map((
        p,
      ) => (typeof p.id === "string" ? p.id : String(p.id)));
      // Rebuild query with service client to see all org members' logs
      query = adminClient.schema("core").from("work_logs").select("*", {
        count: "exact",
      });
      if (projectIds.length > 0) {
        query = query.in("project_id", projectIds);
      } else {
        query = query.eq("project_id", "00000000-0000-0000-0000-000000000000");
      }
    } else {
      // No org filter — show only user's own logs
      query = query.eq("user_id", user.id);
    }

    // Common filters (apply to both user-scope and org-scope queries)
    if (statusList && statusList.length > 0) {
      query = query.in("status", statusList);
    }
    if (dateFrom) {
      query = query.gte("log_date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("log_date", dateTo);
    }
    if (search && search.trim().length > 0) {
      query = query.ilike("work_description", `%${search.trim()}%`);
    }

    const offset = (page - 1) * pageSize;
    query = query
      .range(offset, offset + pageSize - 1)
      .order(sortField, { ascending: sortDirection === "asc" });

    const { data, error, count } = await query;

    if (error) {
      return c.json({
        error: "Failed to fetch work logs",
        message: error.message,
      }, 500);
    }

    return c.json({
      workLogs: data || [],
      totalCount: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    });
  },
);

/**
 * POST /v1/work-logs
 * Create work log
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Work Logs"],
    summary: "Create work log",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              projectId: z.string().uuid().optional(),
              entryType: z.enum(["single_day", "date_range"]),
              logDate: z.string(),
              endDate: z.string().optional(),
              timeEntries: z.array(z.any()).optional(),
              tasksCompleted: z.array(z.string()).optional(),
              skillsUsed: z.array(z.string()).optional(),
              workDescription: z.string().optional(),
              visibility: z.enum(["private", "organization", "public"])
                .optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Work log created",
        content: {
          "application/json": {
            schema: z.any(),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const body = c.req.valid("json");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Translate SDK shape → DB schema shape.
    // SDK uses entryType single_day|date_range and time_entries {start_time,end_time};
    // DB schema (core.work_logs) uses entry_type daily|project|task and
    // time_entries {start,end}. See DOGFOODING-BUGS.md for the rename plan.
    const entryTypeForDb = body.entryType === "date_range" ? "project" : "daily";
    const timeEntriesForDb = (body.timeEntries ?? []).map(
      (e: { start_time?: string; end_time?: string; start?: string; end?: string }) => ({
        start: e.start ?? e.start_time,
        end: e.end ?? e.end_time,
      }),
    );
    const visibilityForDb = body.visibility === "organization"
      ? "private"
      : (body.visibility || "private");

    const { data, error } = await supabase
      .schema("core")
      .from("work_logs")
      .insert({
        user_id: user.id,
        project_id: body.projectId,
        entry_type: entryTypeForDb,
        log_date: body.logDate,
        time_entries: timeEntriesForDb,
        tasks_completed: body.tasksCompleted,
        skills_used: body.skillsUsed,
        work_description: body.workDescription,
        visibility: visibilityForDb,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      return c.json({
        error: "Failed to create work log",
        message: error.message,
      }, 500);
    }

    return c.json(data, 201);
  },
);

/**
 * PATCH /v1/work-logs/:workLogId
 * Update work log
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/{workLogId}",
    tags: ["Work Logs"],
    summary: "Update work log",
    request: {
      params: z.object({ workLogId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              workDescription: z.string().optional(),
              visibility: z.enum(["private", "organization", "public"])
                .optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Work log updated",
        content: {
          "application/json": {
            schema: z.any(),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { workLogId } = c.req.valid("param");
    const body = c.req.valid("json");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("work_logs")
      .update(body)
      .eq("id", workLogId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Failed to update work log" }, 500);
    }

    return c.json(data);
  },
);

/**
 * GET /v1/work-logs/projects
 * List project options available for creating work logs.
 * Returns construction_projects in orgs the caller is a member of (and the
 * caller's own); fed into the project picker on the log create form.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/projects",
    tags: ["Work Logs"],
    summary: "List project options for work logs",
    request: {
      query: z.object({
        organizationId: z.string().uuid().optional(),
        search: z.string().optional(),
        includeArchived: z.coerce.boolean().optional(),
      }),
    },
    responses: {
      200: {
        description: "Project options",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { organizationId, search, includeArchived } = c.req.valid("query");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Resolve orgs the user belongs to so we can scope.
    const { data: memberships } = await supabase
      .schema("core")
      .from("role_assignments")
      .select("scope_org_id")
      .eq("user_id", user.id)
      .not("scope_org_id", "is", null);
    const userOrgIds = (memberships ?? [])
      .map((m) => m.scope_org_id)
      .filter((id): id is string => typeof id === "string");

    if (organizationId && !userOrgIds.includes(organizationId)) {
      return c.json({
        error: "Forbidden",
        message: "You do not have access to the requested organization.",
      }, 403);
    }

    // Use service client so admins see all org projects (mirrors LIST behavior).
    const adminClient = getServiceClient();
    let query = adminClient
      .schema("core")
      .from("construction_projects")
      .select("id, name, status, is_archived, organization_id, project_number");

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    } else if (userOrgIds.length > 0) {
      query = query.in("organization_id", userOrgIds);
    } else {
      return c.json([]);
    }

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }
    if (search && search.trim().length > 0) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    query = query.order("name", { ascending: true });

    const { data, error } = await query;
    if (error) {
      return c.json({ error: "Failed to list projects", message: error.message }, 500);
    }

    return c.json(
      (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        isArchived: p.is_archived,
        organizationId: p.organization_id,
        projectNumber: p.project_number,
      })),
    );
  },
);

/**
 * GET /v1/work-logs/:workLogId
 * Fetch a single work log by id. Visibility is enforced by RLS (own logs +
 * collaborator logs).
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{workLogId}",
    tags: ["Work Logs"],
    summary: "Get work log by id",
    request: { params: z.object({ workLogId: z.string().uuid() }) },
    responses: {
      200: {
        description: "Work log",
        content: { "application/json": { schema: z.any() } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { workLogId } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // First try with the user's client (RLS-scoped: own + collaborator).
    let { data, error } = await supabase
      .schema("core")
      .from("work_logs")
      .select("*")
      .eq("id", workLogId)
      .maybeSingle();

    // If not visible directly, fall back to the org-admin path: fetch with
    // service role and check the caller is a member of the log's org.
    if (!data) {
      const adminClient = getServiceClient();
      const { data: log } = await adminClient
        .schema("core")
        .from("work_logs")
        .select("*, construction_projects!inner(organization_id)")
        .eq("id", workLogId)
        .maybeSingle();
      if (log) {
        const orgId = (log.construction_projects as { organization_id: string } | null)?.organization_id;
        if (orgId) {
          const { data: memberships } = await supabase
            .schema("core")
            .from("role_assignments")
            .select("scope_org_id")
            .eq("user_id", user.id)
            .eq("scope_org_id", orgId);
          if (memberships && memberships.length > 0) {
            const { construction_projects: _omit, ...rest } = log as Record<string, unknown> & {
              construction_projects?: unknown;
            };
            data = rest;
            error = null;
          }
        }
      }
    }

    if (error || !data) {
      return c.json({ error: "Not found", message: error?.message }, 404);
    }

    return c.json(data);
  },
);

/**
 * POST /v1/work-logs/:workLogId/submit
 * Submit a draft work log for verification.
 * Only the owner can submit; only draft logs can transition.
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/{workLogId}/submit",
    tags: ["Work Logs"],
    summary: "Submit work log for verification",
    request: {
      params: z.object({ workLogId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Work log submitted",
        content: { "application/json": { schema: z.any() } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { workLogId } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("work_logs")
      .update({
        status: "pending_verification",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", workLogId)
      .eq("user_id", user.id)
      .eq("status", "draft")
      .select()
      .single();

    if (error || !data) {
      return c.json({
        error: "Failed to submit work log",
        message: error?.message ?? "Not found or not in draft status",
      }, 404);
    }

    return c.json(data);
  },
);

export default app;
