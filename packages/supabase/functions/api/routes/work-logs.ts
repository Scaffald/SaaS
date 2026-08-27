/**
 * Work Logs REST API
 * Work time tracking and work log management
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.ts";
import { firstOf } from "../lib/postgrest.ts";
import {
  buildWorkLogCsv,
  buildWorkLogPdf,
  type WorkLogExportSnapshot,
  type WorkLogExportTimeEntry,
} from "../../_shared/work-log-export.ts";
import { enrichUserSkills } from "../../trpc/routers/utils/skill-enrichment.ts";

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

const WORK_LOG_STATUSES = [
  "draft",
  "pending_verification",
  "verified",
  "disputed",
] as const;

type SupabaseClientLike = ReturnType<typeof getServiceClient>;

// Translate SDK shape → DB schema shape.
// SDK uses entryType single_day|date_range, time_entries {start_time,end_time}
// and visibility private|organization|public; DB (core.work_logs) uses
// entry_type daily|project|task, time_entries {start,end} and
// visibility public|private. See the schema-realign dogfood task.
type SdkTimeEntry = {
  start_time?: string;
  end_time?: string;
  start?: string;
  end?: string;
};

const entryTypeToDb = (entryType: string | undefined): string =>
  entryType === "date_range" ? "project" : "daily";

const timeEntriesToDb = (entries: SdkTimeEntry[]) =>
  entries.map((e) => ({
    start: e.start ?? e.start_time,
    end: e.end ?? e.end_time,
  }));

const visibilityToDb = (visibility: string | undefined): string =>
  visibility === "organization" ? "private" : (visibility || "private");

/** Shapes for the public feed's joined select. */
interface PhotoRow {
  id: string;
  work_log_id: string;
  caption: string | null;
  file_path: string | null;
  thumbnail_path: string | null;
}

interface PublicPhoto {
  id: string;
  caption: string | null;
  signedUrl: string | null;
  thumbnailSignedUrl: string | null;
}

interface PublicFeedRow {
  id: string;
  project_id: string | null;
  log_date: string | null;
  show_date_range_on_profile: boolean | null;
  verified_at: string | null;
  projects:
    | { name: string | null; organizations: unknown }
    | Array<{ name: string | null; organizations: unknown }>
    | null;
}

/** How long a public-profile photo link stays valid. */
const PUBLIC_PHOTO_URL_TTL_SECONDS = 60 * 60;

async function signProfilePhoto(
  adminClient: SupabaseClientLike,
  photo: PhotoRow,
): Promise<PublicPhoto> {
  const sign = async (path: string | null) => {
    if (!path) return null;
    const { data } = await adminClient.storage
      .from(WORK_LOG_PHOTO_BUCKET)
      .createSignedUrl(path, PUBLIC_PHOTO_URL_TTL_SECONDS);
    return data?.signedUrl ?? null;
  };
  return {
    id: photo.id,
    caption: photo.caption,
    signedUrl: await sign(photo.file_path),
    thumbnailSignedUrl: await sign(photo.thumbnail_path ?? photo.file_path),
  };
}


/**
 * Resolve a work log the caller may access: their own or a collaborator log
 * (via RLS), falling back to service-role + org-membership check for org
 * admins. Returns the log row (without the joined project) or null.
 */
async function resolveAccessibleWorkLog(
  supabase: SupabaseClientLike,
  userId: string,
  workLogId: string,
): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .schema("core")
    .from("work_logs")
    .select("*")
    .eq("id", workLogId)
    .maybeSingle();
  if (data) {
    return data;
  }

  const adminClient = getServiceClient();
  const { data: log } = await adminClient
    .schema("core")
    .from("work_logs")
    .select("*, construction_projects!inner(organization_id)")
    .eq("id", workLogId)
    .maybeSingle();
  if (!log) {
    return null;
  }
  const orgId =
    (log.construction_projects as { organization_id: string } | null)
      ?.organization_id;
  if (!orgId) {
    return null;
  }
  const { data: memberships } = await supabase
    .schema("core")
    .from("role_assignments")
    .select("scope_org_id")
    .eq("user_id", userId)
    .eq("scope_org_id", orgId);
  if (!memberships || memberships.length === 0) {
    return null;
  }
  const { construction_projects: _omit, ...rest } = log as
    & Record<string, unknown>
    & {
      construction_projects?: unknown;
    };
  return rest;
}

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
        teamId: z.string().uuid().optional(),
        organizationId: z.string().uuid().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        // Accept comma-separated or repeated values; coerce to array.
        statuses: z.union([z.string(), z.array(z.string())]).optional(),
        search: z.string().optional(),
        sortField: z.enum([
          "log_date",
          "created_at",
          "updated_at",
          "total_hours",
        ]).optional(),
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
      page = 0,
      pageSize = 20,
      projectId,
      teamId,
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
    //
    // projectId and teamId belong here, not before the branch above: the
    // org-admin path REBUILDS `query` with the service client, so any filter
    // applied earlier is discarded. projectId was applied early and was
    // therefore ignored whenever organizationId was also supplied.
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    if (teamId) {
      query = query.eq("team_id", teamId);
    }
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

    // The SDK/UI paginate 0-based (list screen starts at page=0); a 1-based
    // offset here made the first page query range(-20,-1) and return [].
    const offset = Math.max(0, page) * pageSize;
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
              teamId: z.string().uuid().nullish(),
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

    // core.work_logs.project_id is NOT NULL; fail fast with a 400 instead of
    // surfacing the constraint violation as a 500.
    if (!body.projectId) {
      return c.json({
        error: "Invalid request",
        message: "projectId is required to create a work log.",
      }, 400);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("work_logs")
      .insert({
        user_id: user.id,
        project_id: body.projectId,
        entry_type: entryTypeToDb(body.entryType),
        log_date: body.logDate,
        time_entries: timeEntriesToDb(body.timeEntries ?? []),
        tasks_completed: body.tasksCompleted,
        skills_used: body.skillsUsed,
        work_description: body.workDescription,
        team_id: body.teamId ?? null,
        visibility: visibilityToDb(body.visibility),
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
              projectId: z.string().uuid().optional(),
              teamId: z.string().uuid().nullish(),
              entryType: z.enum(["single_day", "date_range"]).optional(),
              logDate: z.string().optional(),
              endDate: z.string().optional(),
              timeEntries: z.array(z.any()).min(1).optional(),
              tasksCompleted: z.array(z.string()).optional(),
              skillsUsed: z.array(z.string()).optional(),
              workDescription: z.string().optional(),
              visibility: z.enum(["private", "organization", "public"])
                .optional(),
              showOnProfile: z.boolean().optional(),
              showDateRangeOnProfile: z.boolean().optional(),
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

    // PATCH semantics: only map fields the caller actually sent.
    const update: Record<string, unknown> = {};
    if (body.projectId !== undefined) update.project_id = body.projectId;
    // nullish so a caller can explicitly clear the team association.
    if (body.teamId !== undefined) update.team_id = body.teamId ?? null;
    if (body.entryType !== undefined) {
      update.entry_type = entryTypeToDb(body.entryType);
    }
    if (body.logDate !== undefined) update.log_date = body.logDate;
    if (body.timeEntries !== undefined) {
      update.time_entries = timeEntriesToDb(body.timeEntries);
    }
    if (body.tasksCompleted !== undefined) {
      update.tasks_completed = body.tasksCompleted;
    }
    if (body.skillsUsed !== undefined) update.skills_used = body.skillsUsed;
    if (body.workDescription !== undefined) {
      update.work_description = body.workDescription;
    }
    if (body.visibility !== undefined) {
      update.visibility = visibilityToDb(body.visibility);
    }
    if (body.showOnProfile !== undefined) {
      update.show_on_profile = body.showOnProfile;
    }
    if (body.showDateRangeOnProfile !== undefined) {
      update.show_date_range_on_profile = body.showDateRangeOnProfile;
    }

    if (Object.keys(update).length === 0) {
      return c.json({
        error: "Invalid request",
        message: "At least one updatable field must be provided.",
      }, 400);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("work_logs")
      .update(update)
      .eq("id", workLogId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return c.json({
        error: "Failed to update work log",
        message: error?.message,
      }, 500);
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
      return c.json({
        error: "Failed to list projects",
        message: error.message,
      }, 500);
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
 * GET /v1/work-logs/overview
 * Status summary + totals for the caller's own work logs. Feeds the
 * "Quick summary" banner on the Logs list screen.
 * Registered before GET /{workLogId} so "overview" isn't parsed as an id.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/overview",
    tags: ["Work Logs"],
    summary: "Work log overview for the current user",
    request: {
      query: z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: "Work log overview",
        content: {
          "application/json": {
            schema: z.object({
              statusSummary: z.record(z.object({
                count: z.number(),
                hours: z.number(),
              })),
              totalHours: z.number(),
              totalEntries: z.number(),
              recentActivity: z.array(z.any()),
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
    const { dateFrom, dateTo } = c.req.valid("query");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let query = supabase
      .schema("core")
      .from("work_logs")
      .select("status, total_hours")
      .eq("user_id", user.id);
    if (dateFrom) {
      query = query.gte("log_date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("log_date", dateTo);
    }

    const { data: rows, error } = await query;
    if (error) {
      return c.json({
        error: "Failed to fetch work log overview",
        message: error.message,
      }, 500);
    }

    // The banner dereferences every status key unguarded — always emit all four.
    const statusSummary: Record<string, { count: number; hours: number }> = {};
    for (const status of WORK_LOG_STATUSES) {
      statusSummary[status] = { count: 0, hours: 0 };
    }
    let totalHours = 0;
    for (const row of rows ?? []) {
      const hours = typeof row.total_hours === "number" ? row.total_hours : 0;
      totalHours += hours;
      const bucket = statusSummary[row.status as string];
      if (bucket) {
        bucket.count += 1;
        bucket.hours += hours;
      }
    }

    let recentQuery = supabase
      .schema("core")
      .from("work_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5);
    if (dateFrom) {
      recentQuery = recentQuery.gte("log_date", dateFrom);
    }
    if (dateTo) {
      recentQuery = recentQuery.lte("log_date", dateTo);
    }
    const { data: recentActivity } = await recentQuery;

    return c.json({
      statusSummary,
      totalHours,
      totalEntries: (rows ?? []).length,
      recentActivity: recentActivity ?? [],
    });
  },
);

/**
 * GET /v1/work-logs/public-feed
 *
 * The "Verified work history" strip on a public profile
 * (WorkLogPortfolioWidget, rendered by app/(public)/users/[slug].tsx). The route
 * did not exist, so that section was broken on every public profile — and
 * because GET /{workLogId} caught the path first, it failed as
 * "Invalid uuid: workLogId" rather than a 404, which is why it never read as a
 * missing endpoint (#447).
 *
 * Declared above GET /{workLogId} on purpose: for two routes of the same method
 * this router matches in declaration order, so a literal registered after a
 * sibling /{param} is unreachable. GET /v1/work-logs/projects sits above it for
 * the same reason.
 *
 * Everything here is public to anyone with the profile URL, so the filters are
 * the publication rule rather than a caller convenience:
 *
 *   status = verified          a self-asserted log is not work history, and
 *                              WorkLogDetailScreen refuses the toggle without
 *                              it — re-checked here because a client-side gate
 *                              is not a rule
 *   show_on_profile            the worker opted this log in
 *   photos.show_on_profile     and opted each photo in separately
 *
 * Deliberately NOT filtered on `visibility`: that column is org-scope sharing
 * (private|public within the org), and the profile toggle never writes it — see
 * handleShowOnProfileToggle, which sends showOnProfile alone. Requiring both
 * would leave the feed permanently empty no matter what the worker turned on.
 *
 * show_date_range_on_profile is honoured by nulling logDate — the widget renders
 * "Date hidden by worker" for it, so a worker can show the work without dating
 * it.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/public-feed",
    tags: ["Work Logs"],
    summary: "Public work-log feed for a profile",
    request: {
      query: z.object({
        userId: z.string().uuid(),
        limit: z.coerce.number().int().min(1).max(50).optional(),
      }),
    },
    responses: {
      200: {
        description: "Public work logs, newest first",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const user = c.get("user");
    const { userId, limit } = c.req.valid("query");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    // Service client: the reader is not the owner, and core.work_logs' RLS is
    // scoped to owners, collaborators and org members. The filters above are
    // what makes reading someone else's logs safe here.
    const adminClient = getServiceClient();
    const { data, error } = await adminClient
      .schema("core")
      .from("work_logs")
      .select(
        "id, project_id, log_date, show_date_range_on_profile, verified_at, projects:project_id (name, organizations:organization_id (name))",
      )
      .eq("user_id", userId)
      .eq("show_on_profile", true)
      .eq("status", "verified")
      .order("log_date", { ascending: false })
      .limit(limit ?? 20);

    if (error) {
      return c.json(
        { error: "Failed to load public feed", message: error.message },
        500,
      );
    }

    const rows = data ?? [];
    if (rows.length === 0) return c.json([]);

    // One query for every log's photos rather than one per log.
    const { data: photoRows } = await adminClient
      .schema("core")
      .from("work_log_photos")
      .select("id, work_log_id, caption, file_path, thumbnail_path")
      .in("work_log_id", rows.map((r: { id: string }) => r.id))
      .eq("show_on_profile", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    const photosByLog = new Map<string, PublicPhoto[]>();
    for (const photo of (photoRows ?? []) as PhotoRow[]) {
      const signed = await signProfilePhoto(adminClient, photo);
      const bucket = photosByLog.get(photo.work_log_id) ?? [];
      bucket.push(signed);
      photosByLog.set(photo.work_log_id, bucket);
    }

    return c.json(rows.map((row: PublicFeedRow) => {
      const project = firstOf(row.projects);
      const organization = project ? firstOf(project.organizations) : null;
      const showDate = row.show_date_range_on_profile !== false;
      return {
        id: row.id,
        projectId: row.project_id,
        projectName: project?.name ?? null,
        organizationName: organization?.name ?? null,
        logDate: showDate ? row.log_date : null,
        showDateOnProfile: showDate,
        verifiedAt: row.verified_at,
        photos: photosByLog.get(row.id) ?? [],
      };
    }));
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

    const data = await resolveAccessibleWorkLog(supabase, user.id, workLogId);

    if (!data) {
      return c.json({ error: "Not found" }, 404);
    }

    // The photo gallery reads `workLog.photos` from this response.
    const adminClient = getServiceClient();
    const { data: photos } = await adminClient
      .schema("core")
      .from("work_log_photos")
      .select("*")
      .eq("work_log_id", workLogId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    return c.json({ ...data, photos: photos ?? [] });
  },
);

/**
 * GET /v1/work-logs/:workLogId/conversation
 * List the conversation (comments) on a work log, oldest first.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{workLogId}/conversation",
    tags: ["Work Logs"],
    summary: "Get work log conversation",
    request: { params: z.object({ workLogId: z.string().uuid() }) },
    responses: {
      200: {
        description: "Conversation entries",
        content: { "application/json": { schema: z.array(z.any()) } },
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

    const workLog = await resolveAccessibleWorkLog(
      supabase,
      user.id,
      workLogId,
    );
    if (!workLog) {
      return c.json({ error: "Not found" }, 404);
    }

    // Access is established above; read with service role so org admins see
    // the full thread regardless of conversation-level RLS.
    const adminClient = getServiceClient();
    const { data, error } = await adminClient
      .schema("core")
      .from("work_log_conversations")
      .select("*, user:users!user_id(display_name, username)")
      .eq("work_log_id", workLogId)
      .order("created_at", { ascending: true });

    if (error) {
      return c.json({
        error: "Failed to fetch conversation",
        message: error.message,
      }, 500);
    }

    return c.json(data ?? []);
  },
);

/**
 * POST /v1/work-logs/:workLogId/comments
 * Add a comment to a work log's conversation.
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/{workLogId}/comments",
    tags: ["Work Logs"],
    summary: "Add work log comment",
    request: {
      params: z.object({ workLogId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              content: z.string().min(1),
              // Accepted for SDK compatibility; work_log_conversations has no
              // parent_comment_id column, so threading is ignored for now.
              parentCommentId: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Comment created",
        content: { "application/json": { schema: z.any() } },
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

    const workLog = await resolveAccessibleWorkLog(
      supabase,
      user.id,
      workLogId,
    );
    if (!workLog) {
      return c.json({ error: "Not found" }, 404);
    }

    const adminClient = getServiceClient();
    const { data, error } = await adminClient
      .schema("core")
      .from("work_log_conversations")
      .insert({
        work_log_id: workLogId,
        user_id: user.id,
        message: body.content.trim(),
      })
      .select("*, user:users!user_id(display_name, username)")
      .single();

    if (error || !data) {
      return c.json({
        error: "Failed to add comment",
        message: error?.message,
      }, 500);
    }

    return c.json(data, 201);
  },
);

const COLLABORATOR_SELECT = `
  id,
  work_log_id,
  collaborator_user_id,
  permission_level,
  invited_at,
  created_at,
  user:users!collaborator_user_id(id, display_name, username, avatar_url)
`;

/** Best-effort audit trail; failures must not fail the request. */
async function recordAuditLog(
  supabase: SupabaseClientLike,
  entry: {
    workLogId: string;
    userId: string;
    action: string;
    newValue?: Record<string, unknown> | null;
  },
): Promise<void> {
  try {
    await supabase
      .schema("core")
      .from("work_log_audit_log")
      .insert({
        work_log_id: entry.workLogId,
        user_id: entry.userId,
        action: entry.action,
        new_value: entry.newValue ?? null,
      });
  } catch (err) {
    console.error("[work-logs] audit log write failed:", err);
  }
}

/**
 * GET /v1/work-logs/:workLogId/collaborators
 * List collaborators on a work log.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{workLogId}/collaborators",
    tags: ["Work Logs"],
    summary: "List work log collaborators",
    request: { params: z.object({ workLogId: z.string().uuid() }) },
    responses: {
      200: {
        description: "Collaborators",
        content: { "application/json": { schema: z.array(z.any()) } },
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

    const workLog = await resolveAccessibleWorkLog(
      supabase,
      user.id,
      workLogId,
    );
    if (!workLog) {
      return c.json({ error: "Not found" }, 404);
    }

    const adminClient = getServiceClient();
    const { data, error } = await adminClient
      .schema("core")
      .from("work_log_collaborators")
      .select(COLLABORATOR_SELECT)
      .eq("work_log_id", workLogId)
      .order("created_at", { ascending: true });

    if (error) {
      return c.json({
        error: "Failed to load collaborators",
        message: error.message,
      }, 500);
    }

    return c.json(data ?? []);
  },
);

/**
 * POST /v1/work-logs/:workLogId/collaborators
 * Add a collaborator. Owner only.
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/{workLogId}/collaborators",
    tags: ["Work Logs"],
    summary: "Add work log collaborator",
    request: {
      params: z.object({ workLogId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              collaboratorUserId: z.string().uuid(),
              // SDK sends `role`; the schemas package uses `permissionLevel`.
              // Accept either; both map to DB permission_level view|edit.
              role: z.enum(["view", "edit"]).optional(),
              permissionLevel: z.enum(["view", "edit"]).optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Collaborator added",
        content: { "application/json": { schema: z.any() } },
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

    const workLog = await resolveAccessibleWorkLog(
      supabase,
      user.id,
      workLogId,
    );
    if (!workLog) {
      return c.json({ error: "Not found" }, 404);
    }
    if (workLog.user_id !== user.id) {
      return c.json({
        error: "Forbidden",
        message: "Only the owner can manage collaborators.",
      }, 403);
    }
    if (body.collaboratorUserId === user.id) {
      return c.json({
        error: "Invalid request",
        message: "You are already the owner of this work log.",
      }, 400);
    }

    const adminClient = getServiceClient();

    const { data: collaboratorUser } = await adminClient
      .schema("core")
      .from("users")
      .select("id")
      .eq("id", body.collaboratorUserId)
      .maybeSingle();
    if (!collaboratorUser) {
      return c.json({
        error: "Invalid request",
        message: "Collaborator user does not exist.",
      }, 400);
    }

    const { data: existing } = await adminClient
      .schema("core")
      .from("work_log_collaborators")
      .select("id")
      .eq("work_log_id", workLogId)
      .eq("collaborator_user_id", body.collaboratorUserId)
      .maybeSingle();
    if (existing) {
      return c.json({
        error: "Conflict",
        message: "Collaborator already added to this work log.",
      }, 409);
    }

    const permissionLevel = body.role ?? body.permissionLevel ?? "view";
    const { data, error } = await adminClient
      .schema("core")
      .from("work_log_collaborators")
      .insert({
        work_log_id: workLogId,
        collaborator_user_id: body.collaboratorUserId,
        permission_level: permissionLevel,
      })
      .select(COLLABORATOR_SELECT)
      .single();

    if (error || !data) {
      return c.json({
        error: "Failed to add collaborator",
        message: error?.message,
      }, 500);
    }

    await recordAuditLog(adminClient, {
      workLogId,
      userId: user.id,
      action: "collaborator_added",
      newValue: {
        collaborator_user_id: body.collaboratorUserId,
        permission_level: permissionLevel,
      },
    });

    return c.json(data, 201);
  },
);

/**
 * Resolve a collaborator row and assert the caller owns its work log.
 */
async function resolveOwnedCollaborator(
  userId: string,
  collaboratorId: string,
): Promise<
  | { row: Record<string, unknown>; error?: never; status?: never }
  | { row?: never; error: string; status: 403 | 404 }
> {
  const adminClient = getServiceClient();
  const { data: row } = await adminClient
    .schema("core")
    .from("work_log_collaborators")
    .select("*, work_log:work_logs!work_log_id(user_id)")
    .eq("id", collaboratorId)
    .maybeSingle();
  if (!row) {
    return { error: "Not found", status: 404 };
  }
  const ownerId = (row.work_log as { user_id: string } | null)?.user_id;
  if (ownerId !== userId) {
    return { error: "Only the owner can manage collaborators.", status: 403 };
  }
  return { row };
}

/**
 * PATCH /v1/work-logs/collaborators/:collaboratorId
 * Update a collaborator's permission level. Owner only.
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/collaborators/{collaboratorId}",
    tags: ["Work Logs"],
    summary: "Update work log collaborator",
    request: {
      params: z.object({ collaboratorId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              role: z.enum(["view", "edit"]).optional(),
              permissionLevel: z.enum(["view", "edit"]).optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Collaborator updated",
        content: { "application/json": { schema: z.any() } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const user = c.get("user");
    const { collaboratorId } = c.req.valid("param");
    const body = c.req.valid("json");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const permissionLevel = body.role ?? body.permissionLevel;
    if (!permissionLevel) {
      return c.json({
        error: "Invalid request",
        message: "role (view|edit) is required.",
      }, 400);
    }

    const resolved = await resolveOwnedCollaborator(user.id, collaboratorId);
    if (resolved.error) {
      return c.json({ error: resolved.error }, resolved.status);
    }

    const adminClient = getServiceClient();
    const { data, error } = await adminClient
      .schema("core")
      .from("work_log_collaborators")
      .update({ permission_level: permissionLevel })
      .eq("id", collaboratorId)
      .select(COLLABORATOR_SELECT)
      .single();

    if (error || !data) {
      return c.json({
        error: "Failed to update collaborator",
        message: error?.message,
      }, 500);
    }

    return c.json(data);
  },
);

/**
 * DELETE /v1/work-logs/collaborators/:collaboratorId
 * Remove a collaborator. Owner only.
 */
app.openapi(
  createRoute({
    method: "delete",
    path: "/collaborators/{collaboratorId}",
    tags: ["Work Logs"],
    summary: "Remove work log collaborator",
    request: { params: z.object({ collaboratorId: z.string().uuid() }) },
    responses: {
      200: {
        description: "Collaborator removed",
        content: {
          "application/json": {
            schema: z.object({ success: z.boolean() }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const user = c.get("user");
    const { collaboratorId } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const resolved = await resolveOwnedCollaborator(user.id, collaboratorId);
    if (resolved.error) {
      return c.json({ error: resolved.error }, resolved.status);
    }

    const adminClient = getServiceClient();
    const { error } = await adminClient
      .schema("core")
      .from("work_log_collaborators")
      .delete()
      .eq("id", collaboratorId);

    if (error) {
      return c.json({
        error: "Failed to remove collaborator",
        message: error.message,
      }, 500);
    }

    return c.json({ success: true });
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

const WORK_LOG_EXPORT_BUCKET = "work-log-exports";
const SIGNED_EXPORT_URL_TTL_SECONDS = 60 * 10;

const sanitizeFileName = (fileName: string): string =>
  fileName
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const toMinutesFromTimeString = (value: string): number => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) {
    return Number.NaN;
  }
  return Number(match[1]) * 60 + Number(match[2]);
};

const parseExportTimeEntries = (raw: unknown): WorkLogExportTimeEntry[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  const entries: WorkLogExportTimeEntry[] = [];
  for (const candidate of raw) {
    if (typeof candidate !== "object" || candidate === null) {
      continue;
    }
    const entry = candidate as Record<string, unknown>;
    const start = typeof entry.start === "string" ? entry.start : null;
    const end = typeof entry.end === "string" ? entry.end : null;
    if (!start || !end) {
      continue;
    }
    const startMinutes = toMinutesFromTimeString(start);
    const endMinutes = toMinutesFromTimeString(end);
    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
      continue;
    }
    entries.push({
      start,
      end,
      durationHours: Math.max(endMinutes - startMinutes, 0) / 60,
      breakMinutes: 0,
      description: null,
    });
  }
  return entries;
};

const resolveStringField = (
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null => {
  if (!source) {
    return null;
  }
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const getUserDisplayName = async (
  supabase: SupabaseClientLike,
  userId: string,
): Promise<string> => {
  const { data } = await supabase
    .schema("core")
    .from("users")
    .select("display_name, username")
    .eq("id", userId)
    .maybeSingle();
  return data?.display_name?.trim() || data?.username?.trim() || "Member";
};

async function buildExportSnapshot(
  adminClient: SupabaseClientLike,
  workLog: Record<string, unknown>,
  ownerEmail: string | null,
): Promise<WorkLogExportSnapshot> {
  const workLogId = workLog.id as string;
  const ownerId = workLog.user_id as string;
  const ownerName = await getUserDisplayName(adminClient, ownerId);

  let projectRecord: Record<string, unknown> | null = null;
  if (typeof workLog.project_id === "string") {
    const { data } = await adminClient
      .schema("core")
      .from("construction_projects")
      .select("*")
      .eq("id", workLog.project_id)
      .maybeSingle();
    projectRecord = data ?? null;
  }

  let organizationRecord: Record<string, unknown> | null = null;
  const organizationId = resolveStringField(projectRecord, ["organization_id"]);
  if (organizationId) {
    const { data } = await adminClient
      .schema("core")
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .maybeSingle();
    organizationRecord = data ?? null;
  }

  const { data: collaboratorRows } = await adminClient
    .schema("core")
    .from("work_log_collaborators")
    .select(
      "collaborator_user_id, permission_level, user:users!collaborator_user_id(display_name, username)",
    )
    .eq("work_log_id", workLogId)
    .order("invited_at", { ascending: true });

  const collaborators: WorkLogExportSnapshot["collaborators"] = (
    collaboratorRows ?? []
  )
    .filter((row) => typeof row.collaborator_user_id === "string")
    .map((row) => {
      const userRecord = row.user as {
        display_name?: string | null;
        username?: string | null;
      } | null;
      return {
        userId: row.collaborator_user_id as string,
        displayName: userRecord?.display_name?.trim() ||
          userRecord?.username?.trim() || "Member",
        permissionLevel: (row.permission_level as "view" | "edit") ?? "view",
      };
    });

  const [{ count: photoCount }, { count: commentCount }] = await Promise.all([
    adminClient
      .schema("core")
      .from("work_log_photos")
      .select("id", { count: "exact", head: true })
      .eq("work_log_id", workLogId),
    adminClient
      .schema("core")
      .from("work_log_conversations")
      .select("id", { count: "exact", head: true })
      .eq("work_log_id", workLogId),
  ]);

  const tasks = Array.isArray(workLog.tasks_completed)
    ? (workLog.tasks_completed as unknown[]).filter(
      (task): task is string =>
        typeof task === "string" && task.trim().length > 0,
    )
    : [];
  const skillIds = Array.isArray(workLog.skills_used)
    ? (workLog.skills_used as unknown[]).filter(
      (skill): skill is string =>
        typeof skill === "string" && skill.trim().length > 0,
    )
    : [];

  let skills: string[] = [];
  let skillSummaries: WorkLogExportSnapshot["skillSummaries"] = [];
  if (skillIds.length > 0) {
    try {
      const { data: userSkillRows } = await adminClient
        .schema("core")
        .from("user_skills")
        .select("*")
        .in("id", skillIds);
      // deno-lint-ignore no-explicit-any
      const enriched = await enrichUserSkills(
        adminClient as any,
        userSkillRows ?? [],
      );
      skills = enriched.map((skill) => skill.label);
      skillSummaries = enriched.map((skill) => ({
        id: skill.id,
        label: skill.label,
        taxonomy: skill.taxonomy,
        tradeId: skill.tradeId,
        tradeName: skill.tradeName,
        tradeSlug: skill.tradeSlug,
      }));
    } catch (err) {
      console.error("[work-logs] skill enrichment failed for export:", err);
    }
  }

  const totalHours = typeof workLog.total_hours === "number"
    ? workLog.total_hours
    : workLog.total_hours
    ? Number(workLog.total_hours)
    : 0;

  return {
    // deno-lint-ignore no-explicit-any
    workLog: workLog as any,
    ownerName,
    ownerEmail,
    projectName: resolveStringField(projectRecord, [
      "name",
      "title",
      "project_name",
    ]),
    projectIdentifier: resolveStringField(projectRecord, [
      "project_code",
      "job_number",
      "slug",
      "reference_code",
    ]),
    organizationName: resolveStringField(organizationRecord, [
      "name",
      "display_name",
    ]),
    organizationIdentifier: resolveStringField(organizationRecord, [
      "slug",
      "external_id",
      "short_code",
    ]),
    totalHours,
    tasks,
    skills,
    skillSummaries,
    timeEntries: parseExportTimeEntries(workLog.time_entries),
    collaborators,
    photoCount: photoCount ?? 0,
    commentCount: commentCount ?? 0,
  };
}

/**
 * POST /v1/work-logs/:workLogId/export
 * Generate a PDF or CSV export and return a short-lived signed download URL.
 * Owner only (matches the legacy tRPC procedure).
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/{workLogId}/export",
    tags: ["Work Logs"],
    summary: "Export work log as PDF or CSV",
    request: {
      params: z.object({ workLogId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              format: z.enum(["pdf", "csv"]).default("csv"),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Export generated",
        content: {
          "application/json": {
            schema: z.object({
              fileName: z.string(),
              mimeType: z.string(),
              byteLength: z.number(),
              downloadUrl: z.string(),
              expiresAt: z.string(),
              storagePath: z.string(),
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
    const { workLogId } = c.req.valid("param");
    const { format } = c.req.valid("json");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const workLog = await resolveAccessibleWorkLog(
      supabase,
      user.id,
      workLogId,
    );
    if (!workLog) {
      return c.json({ error: "Not found" }, 404);
    }
    if (workLog.user_id !== user.id) {
      return c.json({
        error: "Forbidden",
        message: "Only the owner can export this work log.",
      }, 403);
    }

    const adminClient = getServiceClient();
    const snapshot = await buildExportSnapshot(
      adminClient,
      workLog,
      typeof user.email === "string" ? user.email : null,
    );

    const baseNameParts = [
      "work-log",
      (workLog.log_date as string | null) ?? null,
      workLogId.slice(0, 8),
    ].filter(Boolean) as string[];
    const proposedName = sanitizeFileName(baseNameParts.join("-"));
    const fileBaseName = proposedName.length > 0
      ? proposedName
      : `work-log-${workLogId.slice(0, 8)}`;

    let fileBytes: Uint8Array;
    let mimeType: string;
    let extension: "pdf" | "csv";
    if (format === "pdf") {
      fileBytes = await buildWorkLogPdf(snapshot);
      mimeType = "application/pdf";
      extension = "pdf";
    } else {
      fileBytes = new TextEncoder().encode(buildWorkLogCsv(snapshot));
      mimeType = "text/csv";
      extension = "csv";
    }

    const timestampSuffix = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);
    const storagePath =
      `${user.id}/${workLogId}/${fileBaseName}-${timestampSuffix}.${extension}`;

    const { error: uploadError } = await adminClient.storage
      .from(WORK_LOG_EXPORT_BUCKET)
      .upload(storagePath, fileBytes, {
        contentType: mimeType,
        upsert: true,
      });
    if (uploadError) {
      return c.json({
        error: "Failed to persist work log export",
        message: uploadError.message,
      }, 500);
    }

    const { data: signedUrlData, error: signedUrlError } = await adminClient
      .storage
      .from(WORK_LOG_EXPORT_BUCKET)
      .createSignedUrl(storagePath, SIGNED_EXPORT_URL_TTL_SECONDS);
    if (signedUrlError || !signedUrlData?.signedUrl) {
      return c.json({
        error: "Failed to generate download link",
        message: signedUrlError?.message,
      }, 500);
    }

    await recordAuditLog(adminClient, {
      workLogId,
      userId: user.id,
      action: "export_generated",
      newValue: { format: extension, storagePath },
    });

    return c.json({
      fileName: `${fileBaseName}.${extension}`,
      mimeType,
      byteLength: fileBytes.length,
      downloadUrl: signedUrlData.signedUrl,
      expiresAt: new Date(Date.now() + SIGNED_EXPORT_URL_TTL_SECONDS * 1000)
        .toISOString(),
      storagePath,
    });
  },
);

const WORK_LOG_PHOTO_BUCKET = "work-log-photos";
const SIGNED_UPLOAD_URL_TTL_SECONDS = 60 * 5;
const DEFAULT_STORAGE_LIMIT_BYTES = 104_857_600;

type WorkLogRole = "owner" | "editor" | "viewer";

/**
 * Resolve the caller's role on a work log: owner, editor (edit collaborator)
 * or viewer (view collaborator / org member). Null when inaccessible.
 */
async function resolveWorkLogRole(
  supabase: SupabaseClientLike,
  userId: string,
  workLogId: string,
): Promise<{ workLog: Record<string, unknown>; role: WorkLogRole } | null> {
  const workLog = await resolveAccessibleWorkLog(supabase, userId, workLogId);
  if (!workLog) {
    return null;
  }
  if (workLog.user_id === userId) {
    return { workLog, role: "owner" };
  }
  const adminClient = getServiceClient();
  const { data: collaborator } = await adminClient
    .schema("core")
    .from("work_log_collaborators")
    .select("permission_level")
    .eq("work_log_id", workLogId)
    .eq("collaborator_user_id", userId)
    .maybeSingle();
  return {
    workLog,
    role: collaborator?.permission_level === "edit" ? "editor" : "viewer",
  };
}

/** Adjust the owner's work-log photo storage usage by delta bytes. */
async function adjustPhotoStorageUsage(
  adminClient: SupabaseClientLike,
  ownerId: string,
  deltaBytes: number,
): Promise<void> {
  const { data: usage } = await adminClient
    .schema("core")
    .from("user_storage_usage")
    .select("work_log_photos_bytes")
    .eq("user_id", ownerId)
    .maybeSingle();
  if (usage) {
    await adminClient
      .schema("core")
      .from("user_storage_usage")
      .update({
        work_log_photos_bytes: Math.max(
          0,
          (usage.work_log_photos_bytes ?? 0) + deltaBytes,
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", ownerId);
  } else if (deltaBytes > 0) {
    await adminClient.schema("core").from("user_storage_usage").insert({
      user_id: ownerId,
      work_log_photos_bytes: deltaBytes,
      portfolio_photos_bytes: 0,
      certification_files_bytes: 0,
    });
  }
}

/**
 * POST /v1/work-logs/:workLogId/photos
 * Register a photo and return a signed upload URL. Owner or edit collaborator.
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/{workLogId}/photos",
    tags: ["Work Logs"],
    summary: "Create signed upload for a work log photo",
    request: {
      params: z.object({ workLogId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              fileName: z.string().min(1),
              mimeType: z.string().min(1),
              fileSizeBytes: z.number().int().positive(),
              caption: z.string().optional(),
              photoType: z.enum(["before", "progress", "after", "general"])
                .optional(),
              displayOrder: z.number().int().min(0).optional(),
              showOnProfile: z.boolean().optional(),
              takenAt: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Signed upload created",
        content: { "application/json": { schema: z.any() } },
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

    const access = await resolveWorkLogRole(supabase, user.id, workLogId);
    if (!access) {
      return c.json({ error: "Not found" }, 404);
    }
    if (access.role === "viewer") {
      return c.json({
        error: "Forbidden",
        message:
          "You do not have permission to upload photos for this work log.",
      }, 403);
    }

    const adminClient = getServiceClient();
    const ownerId = access.workLog.user_id as string;

    const { data: usage } = await adminClient
      .schema("core")
      .from("user_storage_usage")
      .select("work_log_photos_bytes, storage_limit_bytes")
      .eq("user_id", ownerId)
      .maybeSingle();
    const currentUsage = usage?.work_log_photos_bytes ?? 0;
    const storageLimit = usage?.storage_limit_bytes ??
      DEFAULT_STORAGE_LIMIT_BYTES;
    if (currentUsage + body.fileSizeBytes > storageLimit) {
      return c.json({
        error: "Storage limit reached",
        message: "Remove existing photos or contact support.",
      }, 400);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = `${ownerId}/${workLogId}/${timestamp}-${
      sanitizeFileName(body.fileName)
    }`;

    const { data: signedUpload, error: signedUrlError } = await adminClient
      .storage
      .from(WORK_LOG_PHOTO_BUCKET)
      .createSignedUploadUrl(filePath);
    if (signedUrlError || !signedUpload) {
      return c.json({
        error: "Unable to create upload URL",
        message: signedUrlError?.message,
      }, 500);
    }

    const { data: photo, error: insertError } = await adminClient
      .schema("core")
      .from("work_log_photos")
      .insert({
        work_log_id: workLogId,
        file_path: filePath,
        file_size_bytes: body.fileSizeBytes,
        caption: body.caption ?? null,
        photo_type: body.photoType ?? null,
        display_order: body.displayOrder ?? 0,
        show_on_profile: body.showOnProfile ?? false,
        taken_at: body.takenAt ?? null,
      })
      .select()
      .single();
    if (insertError || !photo) {
      return c.json({
        error: "Failed to record photo metadata",
        message: insertError?.message,
      }, 500);
    }

    await adjustPhotoStorageUsage(adminClient, ownerId, body.fileSizeBytes);
    await recordAuditLog(adminClient, {
      workLogId,
      userId: user.id,
      action: "photo_added",
      newValue: { photo_id: photo.id, file_path: filePath },
    });

    // `path` + `token` are the real signed-upload inputs
    // (supabase.storage.uploadToSignedUrl(path, token, data)); photoId is the
    // row id. uploadUrl kept for the SDK's UploadPhotoResponse type.
    return c.json({
      photoId: photo.id,
      uploadUrl: signedUpload.signedUrl,
      token: signedUpload.token,
      path: filePath,
      expiresAt: new Date(Date.now() + SIGNED_UPLOAD_URL_TTL_SECONDS * 1000)
        .toISOString(),
      photo,
    }, 201);
  },
);

/**
 * Resolve a photo row and the caller's role on its work log.
 */
async function resolvePhotoAccess(
  supabase: SupabaseClientLike,
  userId: string,
  photoId: string,
): Promise<
  | {
    photo: Record<string, unknown>;
    workLog: Record<string, unknown>;
    role: WorkLogRole;
  }
  | null
> {
  const adminClient = getServiceClient();
  const { data: photo } = await adminClient
    .schema("core")
    .from("work_log_photos")
    .select("*")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo) {
    return null;
  }
  const access = await resolveWorkLogRole(
    supabase,
    userId,
    photo.work_log_id as string,
  );
  if (!access) {
    return null;
  }
  return { photo, workLog: access.workLog, role: access.role };
}

/**
 * PATCH /v1/work-logs/photos/:photoId
 * Update photo metadata. Owner or edit collaborator.
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/photos/{photoId}",
    tags: ["Work Logs"],
    summary: "Update work log photo metadata",
    request: {
      params: z.object({ photoId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              caption: z.string().nullable().optional(),
              photoType: z.enum(["before", "progress", "after", "general"])
                .nullable().optional(),
              displayOrder: z.number().int().min(0).optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Photo updated",
        content: { "application/json": { schema: z.any() } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { photoId } = c.req.valid("param");
    const body = c.req.valid("json");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const access = await resolvePhotoAccess(supabase, user.id, photoId);
    if (!access) {
      return c.json({ error: "Not found" }, 404);
    }
    if (access.role === "viewer") {
      return c.json({
        error: "Forbidden",
        message: "You do not have permission to update this photo.",
      }, 403);
    }

    const updates: Record<string, unknown> = {};
    if (body.caption !== undefined) updates.caption = body.caption;
    if (body.photoType !== undefined) updates.photo_type = body.photoType;
    if (body.displayOrder !== undefined) {
      updates.display_order = body.displayOrder;
    }
    if (Object.keys(updates).length === 0) {
      return c.json({
        error: "Invalid request",
        message: "No metadata fields provided for update.",
      }, 400);
    }

    const adminClient = getServiceClient();
    const { data, error } = await adminClient
      .schema("core")
      .from("work_log_photos")
      .update(updates)
      .eq("id", photoId)
      .select()
      .single();
    if (error || !data) {
      return c.json({
        error: "Failed to update photo metadata",
        message: error?.message,
      }, 500);
    }

    return c.json(data);
  },
);

/**
 * PATCH /v1/work-logs/photos/:photoId/visibility
 * Toggle a photo's profile visibility. Owner only.
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/photos/{photoId}/visibility",
    tags: ["Work Logs"],
    summary: "Update work log photo visibility",
    request: {
      params: z.object({ photoId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              // SDK sends visibility public|private|organization; the DB
              // column is boolean show_on_profile. Accept either form.
              visibility: z.enum(["public", "private", "organization"])
                .optional(),
              showOnProfile: z.boolean().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Photo visibility updated",
        content: { "application/json": { schema: z.any() } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { photoId } = c.req.valid("param");
    const body = c.req.valid("json");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const showOnProfile = body.showOnProfile ?? (body.visibility === "public");
    if (body.showOnProfile === undefined && body.visibility === undefined) {
      return c.json({
        error: "Invalid request",
        message: "visibility or showOnProfile is required.",
      }, 400);
    }

    const access = await resolvePhotoAccess(supabase, user.id, photoId);
    if (!access) {
      return c.json({ error: "Not found" }, 404);
    }
    if (access.role !== "owner") {
      return c.json({
        error: "Forbidden",
        message: "Only the owner can change photo visibility.",
      }, 403);
    }

    const adminClient = getServiceClient();
    const { data, error } = await adminClient
      .schema("core")
      .from("work_log_photos")
      .update({ show_on_profile: showOnProfile })
      .eq("id", photoId)
      .select()
      .single();
    if (error || !data) {
      return c.json({
        error: "Failed to update photo visibility",
        message: error?.message,
      }, 500);
    }

    return c.json(data);
  },
);

/**
 * DELETE /v1/work-logs/photos/:photoId
 * Delete a photo (storage objects + row). Owner or edit collaborator.
 */
app.openapi(
  createRoute({
    method: "delete",
    path: "/photos/{photoId}",
    tags: ["Work Logs"],
    summary: "Delete work log photo",
    request: { params: z.object({ photoId: z.string().uuid() }) },
    responses: {
      200: {
        description: "Photo deleted",
        content: {
          "application/json": {
            schema: z.object({ success: z.boolean() }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { photoId } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const access = await resolvePhotoAccess(supabase, user.id, photoId);
    if (!access) {
      return c.json({ error: "Not found" }, 404);
    }
    if (access.role === "viewer") {
      return c.json({
        error: "Forbidden",
        message: "You do not have permission to delete this photo.",
      }, 403);
    }

    const adminClient = getServiceClient();
    const filePaths = [
      access.photo.file_path,
      access.photo.thumbnail_path,
      access.photo.medium_path,
    ].filter((value): value is string =>
      typeof value === "string" && value.length > 0
    );
    if (filePaths.length > 0) {
      const { error: removeError } = await adminClient.storage
        .from(WORK_LOG_PHOTO_BUCKET)
        .remove(filePaths);
      if (removeError) {
        console.warn(
          "[work-logs] failed to delete photo storage objects:",
          removeError.message,
        );
      }
    }

    const { error: deleteError } = await adminClient
      .schema("core")
      .from("work_log_photos")
      .delete()
      .eq("id", photoId);
    if (deleteError) {
      return c.json({
        error: "Failed to delete photo record",
        message: deleteError.message,
      }, 500);
    }

    const photoBytes = Number(access.photo.file_size_bytes ?? 0);
    if (photoBytes > 0) {
      await adjustPhotoStorageUsage(
        adminClient,
        access.workLog.user_id as string,
        -photoBytes,
      );
    }

    return c.json({ success: true });
  },
);

/**
 * PATCH /v1/work-logs/{workLogId}/profile-visibility
 *
 * The toggle on WorkLogDetailScreen. Owner-only: whether a log appears on a
 * public profile is the worker's decision, not a collaborator's or an org
 * admin's, so this deliberately does not use resolveAccessibleWorkLog.
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/{workLogId}/profile-visibility",
    tags: ["Work Logs"],
    summary: "Show or hide a work log on your public profile",
    request: {
      params: z.object({ workLogId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              showOnProfile: z.boolean(),
              showDateRangeOnProfile: z.boolean().optional(),
            }).strip(),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated work log",
        content: { "application/json": { schema: z.any() } },
      },
      404: {
        description: "Not the caller's work log",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
              message: z.string().optional(),
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
    const { workLogId } = c.req.valid("param");
    const body = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const patch: Record<string, unknown> = {
      show_on_profile: body.showOnProfile,
      updated_at: new Date().toISOString(),
    };
    if (body.showDateRangeOnProfile !== undefined) {
      patch.show_date_range_on_profile = body.showDateRangeOnProfile;
    }

    const { data, error } = await supabase
      .schema("core")
      .from("work_logs")
      .update(patch)
      .eq("id", workLogId)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      return c.json(
        { error: "Failed to update visibility", message: error.message },
        500,
      );
    }
    if (!data) {
      return c.json(
        { error: "Not found", message: "No work log with that id is yours" },
        404,
      );
    }

    return c.json(data);
  },
);

export default app;
