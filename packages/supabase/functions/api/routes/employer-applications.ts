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
import {
  listAccessibleOrganizationIds,
  PIPELINE_ROLES,
} from "../lib/application-access.ts";
import {
  API_STATUSES,
  STATUS_API_TO_DB,
  withApiStatus,
} from "./applications.ts";

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
  if (query.organization_id && !accessibleOrgIds.includes(query.organization_id)) {
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
  if (query.min_score !== undefined) {
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

export default app;
