/**
 * Employer-side EEO reporting.
 *
 * `EEOReportScreen` rendered hardcoded constants — invented applicant counts,
 * invented selection rates and invented adverse-impact ratios — on a screen
 * that presents itself as a compliance artifact (#535). This is the read path
 * that replaces them.
 *
 * ─── The privacy shape, which drives the whole design ─────────────────────
 *
 * `core.eeo_self_identification` holds protected-class data. Migration 305's
 * policy is `auth.uid() = user_id`: an applicant reaches their own row and
 * nobody else's. Migration 343 granted `authenticated` only SELECT and INSERT
 * — no UPDATE, no DELETE — because a voluntary self-identification is an audit
 * record.
 *
 * Employers get counts. Never rows. There is deliberately no endpoint here
 * that returns a self-identification record, no filter that could narrow a
 * cohort to one person, and no join a caller can shape. The aggregation is
 * `lib/eeo-aggregation.ts`, which is pure and unit-tested, and it applies a
 * minimum cell size so a group of one is not published as a "statistic".
 *
 * ─── Why service_role ─────────────────────────────────────────────────────
 *
 * By design no employer can read these rows under RLS — that is the point. So
 * the aggregate has to be computed above RLS, which means the handler must
 * authorise the caller against the organisation itself before reading
 * anything. `listAccessibleOrganizationIds` with PIPELINE_ROLES does that, and
 * every subsequent query is bounded by the result.
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import {
  type ApiEnv,
  authMiddleware,
  requireAuth,
} from "../middleware/auth.ts";
import {
  listAccessibleOrganizationIds,
  PIPELINE_ROLES,
} from "../lib/application-access.ts";
import {
  buildReport,
  type EeoRecord,
  MIN_CELL_SIZE,
} from "../lib/eeo-aggregation.ts";

const app = new OpenAPIHono<ApiEnv>();

app.use("*", authMiddleware);

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

const errorResponseSchema = z
  .object({ error: z.string(), message: z.string().optional() })
  .openapi("ErrorResponse");

const categorySchema = z.object({
  category: z.string(),
  applications: z.number().int(),
  interviewed: z.number().int(),
  offers: z.number().int(),
  hired: z.number().int(),
  withdrawn: z.number().int(),
  selectionRate: z.number().nullable(),
  impactRatio: z.number().nullable(),
  suppressed: z.boolean(),
});

const reportSchema = z
  .object({
    jobGroups: z.array(z.object({
      jobGroup: z.string(),
      totalApplications: z.number().int(),
      totalHired: z.number().int(),
      categories: z.array(categorySchema),
    })),
    gender: z.array(categorySchema),
    veteranStatus: z.array(categorySchema),
    disabilityStatus: z.array(categorySchema),
    totals: z.object({
      applications: z.number().int(),
      hired: z.number().int(),
      withdrawn: z.number().int(),
      jobGroups: z.number().int(),
      selfIdentified: z.number().int(),
    }),
    minCellSize: z.number().int(),
    coverage: z.object({
      totalApplications: z.number().int(),
      selfIdentified: z.number().int(),
      uncategorizedJobs: z.number().int(),
    }),
    periodStart: z.string().nullable(),
    periodEnd: z.string().nullable(),
  })
  .openapi("EEOReport");

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Compliance"],
  summary: "Aggregate EEO report for the caller's organisations",
  description:
    "Returns counts only. Individual self-identification records are never exposed, and cells below the minimum size are suppressed.",
  middleware: requireAuth,
  request: {
    query: z.object({
      organization_id: z.string().uuid().optional(),
      period_start: z.string().optional(),
      period_end: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Aggregate report",
      content: { "application/json": { schema: reportSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "No access to that organisation",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(listRoute, async (c) => {
  const { organization_id, period_start, period_end } = c.req.valid("query");
  const user = c.get("user");

  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }

  const accessible = await listAccessibleOrganizationIds(
    c.get("supabase"),
    user.id,
    { allowedRoles: PIPELINE_ROLES },
  );

  // Narrowing to a requested organisation is an intersection, never a
  // substitution — asking for an id you cannot act for must not widen access.
  const orgIds = organization_id
    ? accessible.filter((id) => id === organization_id)
    : accessible;

  if (organization_id && orgIds.length === 0) {
    return c.json(
      {
        error: "Forbidden",
        message: "You do not have access to that organisation",
      },
      403,
    );
  }

  const empty = {
    ...buildReport([]),
    coverage: {
      totalApplications: 0,
      selfIdentified: 0,
      uncategorizedJobs: 0,
    },
    periodStart: period_start ?? null,
    periodEnd: period_end ?? null,
  };

  if (orgIds.length === 0) return c.json(empty, 200);

  const admin = adminClient();

  // 1. Requisitions in scope, with the EEO job category they roll up to.
  const { data: jobs, error: jobsError } = await admin
    .schema("core")
    .from("jobs")
    .select("id, eeo_job_category")
    .in("organization_id", orgIds);

  if (jobsError) {
    console.error(JSON.stringify({
      severity: "error",
      component: "employer_eeo_report",
      message: "Failed to read jobs",
      db_error: jobsError.message,
    }));
    return c.json({ error: "Internal Server Error" }, 500);
  }

  const jobRows = (jobs ?? []) as Array<
    { id: string; eeo_job_category: string | null }
  >;
  if (jobRows.length === 0) return c.json(empty, 200);

  const groupByJob = new Map<string, string | null>();
  for (const job of jobRows) groupByJob.set(job.id, job.eeo_job_category);

  // 2. Applications to those requisitions, within the period.
  let applicationsQuery = admin
    .schema("core")
    .from("applications")
    .select("id, job_id, status")
    .in("job_id", jobRows.map((job) => job.id));

  if (period_start) {
    applicationsQuery = applicationsQuery.gte("created_at", period_start);
  }
  if (period_end) {
    applicationsQuery = applicationsQuery.lte("created_at", period_end);
  }

  const { data: applications, error: applicationsError } =
    await applicationsQuery;

  if (applicationsError) {
    console.error(JSON.stringify({
      severity: "error",
      component: "employer_eeo_report",
      message: "Failed to read applications",
      db_error: applicationsError.message,
    }));
    return c.json({ error: "Internal Server Error" }, 500);
  }

  const applicationRows = (applications ?? []) as Array<
    { id: string; job_id: string; status: string }
  >;

  const uncategorizedJobs = jobRows.filter((job) =>
    !job.eeo_job_category
  ).length;

  if (applicationRows.length === 0) {
    return c.json({
      ...empty,
      coverage: { totalApplications: 0, selfIdentified: 0, uncategorizedJobs },
    }, 200);
  }

  const applicationIds = applicationRows.map((row) => row.id);

  // 3. Self-identifications for those applications.
  //
  // Note `eeo_self_identification.application_id` carries no foreign key to
  // core.applications (305 declares one only on user_id), so this is an
  // explicit id match rather than an embed, and an orphaned row simply finds
  // no application and drops out of scope.
  const { data: selfIds, error: selfIdError } = await admin
    .schema("core")
    .from("eeo_self_identification")
    .select(
      "application_id, ethnicity, gender, veteran_status, disability_status",
    )
    .in("application_id", applicationIds);

  if (selfIdError) {
    console.error(JSON.stringify({
      severity: "error",
      component: "employer_eeo_report",
      message: "Failed to read self-identifications",
      db_error: selfIdError.message,
    }));
    return c.json({ error: "Internal Server Error" }, 500);
  }

  // 4. Stage history, so someone rejected after interviewing still counts as
  //    having interviewed.
  const { data: activity } = await admin
    .schema("core")
    .from("application_activity")
    .select("application_id, details")
    .in("application_id", applicationIds)
    .eq("event_type", "status_changed");

  const reachedByApplication = new Map<string, string[]>();
  for (
    const event of (activity ?? []) as Array<
      { application_id: string; details: { to?: string } | null }
    >
  ) {
    const to = event.details?.to;
    if (!to) continue;
    const list = reachedByApplication.get(event.application_id) ?? [];
    list.push(to);
    reachedByApplication.set(event.application_id, list);
  }

  const applicationById = new Map(applicationRows.map((row) => [row.id, row]));

  const records: EeoRecord[] = [];
  for (
    const row of (selfIds ?? []) as Array<{
      application_id: string;
      ethnicity: string | null;
      gender: string | null;
      veteran_status: string | null;
      disability_status: string | null;
    }>
  ) {
    const application = applicationById.get(row.application_id);
    if (!application) continue;

    records.push({
      applicationId: row.application_id,
      jobGroup: groupByJob.get(application.job_id) ?? null,
      // A null column means the applicant skipped that question, which is
      // materially the same as declining and must stay in the denominator.
      ethnicity: row.ethnicity ?? "declined",
      gender: row.gender ?? "declined",
      veteranStatus: row.veteran_status ?? "declined",
      disabilityStatus: row.disability_status ?? "declined",
      currentStatus: application.status,
      reachedStatuses: reachedByApplication.get(row.application_id) ?? [],
    });
  }

  const report = buildReport(records);

  return c.json({
    ...report,
    // Coverage is not decoration. A report over 4 self-identifications out of
    // 900 applicants is not evidence of anything, and the reader needs the
    // denominator to know that before acting on a ratio.
    coverage: {
      totalApplications: applicationRows.length,
      selfIdentified: records.length,
      uncategorizedJobs,
    },
    periodStart: period_start ?? null,
    periodEnd: period_end ?? null,
    minCellSize: MIN_CELL_SIZE,
  }, 200);
});

export default app;
