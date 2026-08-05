/**
 * Employer-scoped applications.
 *
 * `/v1/applications` is the *candidate's* view: every handler there filters or
 * gates on `user_id === auth user`. There was no way for a recruiter to read
 * the pipeline for their own organisation's jobs, which is why the office
 * kanban has rendered zero rows since the tRPC→SDK migration (#527, #528).
 *
 * This router is the hiring side of the same data. It is a separate mount
 * rather than a `?scope=` flag on the candidate route so that the access rules
 * are impossible to confuse: everything here requires organisation access, and
 * nothing here will ever return an application belonging to an org the caller
 * cannot act for.
 *
 * Column names below are the real ones on core.applications, which differ from
 * what the office UI transform currently assumes — there is no `applied_at`,
 * `application_score` or `auto_rejected` column, and the flat screening fields
 * live inside the `screening_answers` JSONB. See #528 for reconciling the
 * client side.
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware, requireAuth } from "../middleware/auth.ts";
import { createClient } from "@supabase/supabase-js";
import {
  listAccessibleOrganizationIds,
  PIPELINE_ROLES,
  resolveApplicationOrgAccess,
} from "../lib/application-access.ts";
import { checkTransition } from "../lib/application-transitions.ts";
import {
  API_STATUSES,
  STATUS_API_TO_DB,
  withApiStatus,
} from "./applications.ts";

/**
 * Service-role client, used only after a handler has already authorised the
 * request.
 *
 * The middleware hands handlers an RLS-enforcing client carrying the caller's
 * JWT. core.application_activity's insert policy requires *team membership*,
 * while pipeline access is granted by an org-level role assignment — so an org
 * admin who is not on a team would be silently unable to record the transition
 * they just performed. Rather than widen that policy (which would grant a
 * second, looser path to the same data), authorise explicitly in the handler
 * and write the audit row with the service role.
 */
function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

const app = new OpenAPIHono();

app.use("*", authMiddleware);

const employerApplicationSchema = z
  .object({
    id: z.string().uuid(),
    job_id: z.string().uuid(),
    user_id: z.string().uuid(),
    status: z.enum(API_STATUSES),
    created_at: z.string(),
    updated_at: z.string().nullable(),
    stage_changed_at: z.string().nullable(),
    score_total: z.number().int().nullable(),
    source: z.string().nullable(),
    union_status: z.record(z.string(), z.unknown()).nullable(),
    assigned_to: z.string().uuid().nullable(),
    is_shortlisted: z.boolean().nullable(),
    screening_answers: z.record(z.string(), z.unknown()).nullable(),
    attachment_metadata: z.record(z.string(), z.unknown()).nullable(),
    candidate: z
      .object({
        id: z.string().uuid(),
        display_name: z.string().nullable(),
        username: z.string().nullable(),
        headline: z.string().nullable(),
        avatar_url: z.string().nullable(),
        avatar_path: z.string().nullable(),
      })
      .nullable(),
    job: z
      .object({
        id: z.string().uuid(),
        title: z.string().nullable(),
        location: z.string().nullable(),
        employment_type: z.string().nullable(),
        organization_id: z.string().uuid().nullable(),
        pay_range_min_cents: z.number().int().nullable(),
        pay_range_max_cents: z.number().int().nullable(),
        pay_range_type: z.string().nullable(),
      })
      .nullable(),
  })
  .openapi("EmployerApplication");

const listResponseSchema = z
  .object({
    data: z.array(employerApplicationSchema),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })
  .openapi("ListEmployerApplicationsResponse");

const errorResponseSchema = z
  .object({ error: z.string(), message: z.string().optional() })
  .openapi("ErrorResponse");

/**
 * The embed the kanban needs in one round trip: candidate identity for the
 * card, job for the column grouping and pay display.
 */
const LIST_SELECT = `
  id, job_id, user_id, status, created_at, updated_at, stage_changed_at,
  score_total, source, union_status, assigned_to, is_shortlisted,
  screening_answers, attachment_metadata,
  candidate:users!user_id(id, display_name, username, headline, avatar_url, avatar_path),
  job:jobs!job_id(
    id, title, location, employment_type, organization_id,
    pay_range_min_cents, pay_range_max_cents, pay_range_type
  )
`.replace(/\s+/g, " ").trim();

/**
 * Whether a `min_score` value should become a query filter at all.
 *
 * A floor of 0 means "no floor". `score_total` is nullable and nothing
 * populates it yet (#534), so a plain `.gte("score_total", 0)` drops every row
 * — `NULL >= 0` is NULL, not true. The board's score slider sits at 0 by
 * default, so the naive version turned "show me everything" into an empty
 * pipeline. Found by calling the endpoint, not by reading it.
 *
 * Above 0 the filter is deliberately exclusive of unscored applications: one
 * with no score has not demonstrably cleared the bar.
 */
export function shouldApplyScoreFilter(minScore: number | undefined): boolean {
  return minScore !== undefined && minScore > 0;
}

const listEmployerApplicationsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Applications"],
  summary: "List applications for the caller's organisations",
  description:
    "List applications to jobs posted by organisations the caller owns or holds a qualifying role in. Returns an empty list rather than 403 when the caller has no organisations, so a personal account sees an empty pipeline instead of an error.",
  middleware: requireAuth,
  request: {
    query: z.object({
      organization_id: z.string().uuid().optional(),
      job_id: z.string().uuid().optional(),
      status: z.enum(API_STATUSES).optional(),
      assigned_to: z.string().uuid().optional(),
      min_score: z.coerce.number().int().min(0).optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional().default(50),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }),
  },
  responses: {
    200: {
      description: "Applications for the caller's organisations",
      content: { "application/json": { schema: listResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "Caller cannot act for the requested organisation",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(listEmployerApplicationsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const query = c.req.valid("query");

  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }

  const accessibleOrgIds = await listAccessibleOrganizationIds(
    supabase,
    user.id,
    { allowedRoles: PIPELINE_ROLES },
  );

  // Asking for an org you cannot act for is a 403 — that is a caller error and
  // saying so is more useful than an empty list. Having no orgs at all is not:
  // a personal account browsing the office UI should see an empty pipeline.
  if (
    query.organization_id && !accessibleOrgIds.includes(query.organization_id)
  ) {
    return c.json(
      {
        error: "Forbidden",
        message: "You do not have access to that organization",
      },
      403,
    );
  }

  const orgIds = query.organization_id
    ? [query.organization_id]
    : accessibleOrgIds;

  if (orgIds.length === 0) {
    return c.json(
      { data: [], total: 0, limit: query.limit, offset: query.offset },
      200,
    );
  }

  // Scope by the jobs those organisations posted. Resolving job ids first keeps
  // the org filter on a column PostgREST can index, rather than filtering on an
  // embedded resource after the fact.
  let jobQuery = supabase
    .schema("core")
    .from("jobs")
    .select("id")
    .in("organization_id", orgIds);

  if (query.job_id) {
    jobQuery = jobQuery.eq("id", query.job_id);
  }

  const { data: jobRows, error: jobError } = await jobQuery;

  if (jobError) {
    console.error("Error resolving organization jobs:", jobError);
    return c.json(
      { error: "Internal Server Error", message: jobError.message },
      500,
    );
  }

  const jobIds = (jobRows ?? []).map((row: { id: string }) => row.id);

  if (jobIds.length === 0) {
    return c.json(
      { data: [], total: 0, limit: query.limit, offset: query.offset },
      200,
    );
  }

  let applicationQuery = supabase
    .schema("core")
    .from("applications")
    .select(LIST_SELECT, { count: "exact" })
    .in("job_id", jobIds)
    .order("created_at", { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.status) {
    // Filter in the DB vocabulary — the same translation the write path needs.
    applicationQuery = applicationQuery.eq(
      "status",
      STATUS_API_TO_DB[query.status],
    );
  }
  if (query.assigned_to) {
    applicationQuery = applicationQuery.eq("assigned_to", query.assigned_to);
  }
  if (shouldApplyScoreFilter(query.min_score)) {
    applicationQuery = applicationQuery.gte("score_total", query.min_score);
  }
  if (query.date_from) {
    applicationQuery = applicationQuery.gte("created_at", query.date_from);
  }
  if (query.date_to) {
    applicationQuery = applicationQuery.lte("created_at", query.date_to);
  }

  const { data, error, count } = await applicationQuery;

  if (error) {
    console.error("Error listing employer applications:", error);
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  const rows = (data ?? []).map((row: Record<string, unknown>) =>
    withApiStatus(row)
  );

  return c.json(
    {
      data: rows,
      total: count ?? 0,
      limit: query.limit,
      offset: query.offset,
    },
    200,
  );
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /v1/employer/applications/{id}
// ─────────────────────────────────────────────────────────────────────────

/**
 * Employer-side update. Deliberately a *separate* schema from
 * applicationUpdateSchema: that one is the applicant's, and widening it to
 * carry `status` would let a candidate move themselves to `hired`.
 */
const employerApplicationUpdateSchema = z
  .object({
    status: z.enum(API_STATUSES).optional(),
    assigned_to: z.string().uuid().nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Provide at least one field to update",
  })
  .openapi("UpdateEmployerApplicationRequest");

const updateEmployerApplicationRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Applications"],
  summary: "Update an application from the hiring side",
  description:
    "Move an application through the pipeline or reassign it. Requires organisation access. Stage moves are validated against the transition table and recorded in the activity log.",
  middleware: requireAuth,
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": { schema: employerApplicationUpdateSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Updated application",
      content: { "application/json": { schema: employerApplicationSchema } },
    },
    400: {
      description: "Transition not allowed",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "No access to this application",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(updateEmployerApplicationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const input = c.req.valid("json");

  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }

  const access = await resolveApplicationOrgAccess(supabase, user.id, id, {
    allowedRoles: PIPELINE_ROLES,
  });

  // 404 before 403 on a missing row, so a stranger cannot probe which
  // application ids exist.
  if (!access.found) {
    return c.json(
      { error: "Not Found", message: "Application not found" },
      404,
    );
  }

  if (!access.hasOrgAccess) {
    return c.json(
      {
        error: "Forbidden",
        message: "You do not have access to this application",
      },
      403,
    );
  }

  const { data: existing, error: readError } = await supabase
    .schema("core")
    .from("applications")
    .select("id, status, assigned_to")
    .eq("id", id)
    .single();

  if (readError || !existing) {
    return c.json(
      { error: "Not Found", message: "Application not found" },
      404,
    );
  }

  const currentStatus = existing.status as string;
  const nextStatus = input.status
    ? STATUS_API_TO_DB[input.status]
    : currentStatus;

  const transition = checkTransition(currentStatus, nextStatus);
  if (!transition.allowed) {
    return c.json(
      {
        error: "Bad Request",
        message: transition.reason ?? "Invalid transition",
      },
      400,
    );
  }

  const now = new Date().toISOString();
  const statusChanged = nextStatus !== currentStatus;

  const payload: Record<string, unknown> = { updated_at: now };
  if (input.status !== undefined) {
    payload.status = nextStatus;
    // Only bump stage_changed_at on an actual move — time-in-stage is computed
    // from it, and touching it on an unrelated PATCH would reset the clock.
    if (statusChanged) payload.stage_changed_at = now;
  }
  if (input.assigned_to !== undefined) {
    payload.assigned_to = input.assigned_to;
    payload.assigned_by = user.id;
    payload.assigned_at = now;
  }

  const { data: updated, error: updateError } = await supabase
    .schema("core")
    .from("applications")
    .update(payload)
    .eq("id", id)
    .select(LIST_SELECT)
    .single();

  if (updateError || !updated) {
    console.error("Error updating application:", updateError);
    return c.json(
      {
        error: "Internal Server Error",
        message: updateError?.message ?? "Update failed",
      },
      500,
    );
  }

  await recordActivity(access.organizationId, id, user.id, {
    statusChanged,
    currentStatus,
    nextStatus,
    assignedToChanged: input.assigned_to !== undefined &&
      input.assigned_to !== existing.assigned_to,
    previousAssignee: existing.assigned_to as string | null,
    nextAssignee: input.assigned_to ?? null,
  });

  return c.json(withApiStatus(updated), 200);
});

interface ActivityFacts {
  statusChanged: boolean;
  currentStatus: string;
  nextStatus: string;
  assignedToChanged: boolean;
  previousAssignee: string | null;
  nextAssignee: string | null;
}

/**
 * Record what just happened on the application.
 *
 * Best-effort: a failure here must not fail the request, because the write it
 * describes has already committed. Returning 500 after a successful update
 * would tell the caller their change was rejected when it was not — the client
 * would roll the card back on a board that no longer matches the database.
 * Logged loudly instead.
 *
 * Nothing wrote to this table before, which is why `stageHistory` was hardcoded
 * empty in the office UI and time-to-hire could never compute (#531).
 */
async function recordActivity(
  organizationId: string | null,
  applicationId: string,
  actorUserId: string,
  facts: ActivityFacts,
): Promise<void> {
  if (!organizationId) return;

  const rows: Array<Record<string, unknown>> = [];

  if (facts.statusChanged) {
    rows.push({
      application_id: applicationId,
      organization_id: organizationId,
      actor_user_id: actorUserId,
      event_type: "status_changed",
      details: { from: facts.currentStatus, to: facts.nextStatus },
    });
  }

  if (facts.assignedToChanged) {
    rows.push({
      application_id: applicationId,
      organization_id: organizationId,
      actor_user_id: actorUserId,
      event_type: "assignment_changed",
      details: { from: facts.previousAssignee, to: facts.nextAssignee },
    });
  }

  if (rows.length === 0) return;

  try {
    const { error } = await getServiceClient()
      .schema("core")
      .from("application_activity")
      .insert(rows);

    if (error) {
      console.error(
        JSON.stringify({
          severity: "error",
          component: "employer_applications_activity",
          message: "Failed to record application activity",
          application_id: applicationId,
          db_error: error.message,
        }),
      );
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        severity: "error",
        component: "employer_applications_activity",
        message: "Threw while recording application activity",
        application_id: applicationId,
        error: String(err),
      }),
    );
  }
}

export default app;
