import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  type ApiEnv,
  authMiddleware,
  requireAuth,
} from "../middleware/auth.ts";
import {
  applicationCreateSchema,
  applicationUpdateSchema,
} from "../../_shared/application-schemas.ts";
import { createClient } from "@supabase/supabase-js";
import {
  PIPELINE_ROLES,
  resolveApplicationOrgAccess,
} from "../lib/application-access.ts";

const app = new OpenAPIHono<ApiEnv>();

// Apply auth middleware to all routes
app.use("*", authMiddleware);

/**
 * Zod Schemas for Applications API
 */

// Application status namespaces — single source of truth.
//
// DB side: enum is gated by `applications_status_check` (migration 112).
// API side: renames `new` → `pending` and `screen` → `reviewing` for the
// public surface; the rest pass through 1:1. Both maps are exhaustive so
// adding a new DB status without updating the API surface is a compile
// error, not a silent fall-through.
//
// SC-107: previously these were partial Record<string, string> maps with
// a `?? raw` fallback, which made the namespace boundary leaky.

export const DB_STATUSES = [
  "new",
  "screen",
  "inquired",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
] as const;
export type DbStatus = typeof DB_STATUSES[number];

export const API_STATUSES = [
  "pending",
  "reviewing",
  "inquired",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
] as const;
type ApiStatus = typeof API_STATUSES[number];

export const STATUS_DB_TO_API: Record<DbStatus, ApiStatus> = {
  new: "pending",
  screen: "reviewing",
  inquired: "inquired",
  interview: "interview",
  offer: "offer",
  hired: "hired",
  rejected: "rejected",
  withdrawn: "withdrawn",
};

export const STATUS_API_TO_DB: Record<ApiStatus, DbStatus> = {
  pending: "new",
  reviewing: "screen",
  inquired: "inquired",
  interview: "interview",
  offer: "offer",
  hired: "hired",
  rejected: "rejected",
  withdrawn: "withdrawn",
};

export function mapDbStatus(dbStatus: string): ApiStatus {
  if (dbStatus in STATUS_DB_TO_API) {
    return STATUS_DB_TO_API[dbStatus as DbStatus];
  }
  // Defensive: unknown DB status means the DB schema drifted past the API
  // contract. Log so operators see it and return the raw value as-is rather
  // than crashing the response (best-effort surface).
  console.error(
    JSON.stringify({
      severity: "error",
      component: "applications_status_map",
      message: "Unmapped DB status encountered",
      db_status: dbStatus,
    }),
  );
  return dbStatus as ApiStatus;
}

/**
 * Return an application row with its status translated to the API surface.
 *
 * Every handler that returns an application must go through this. The read
 * handlers did it inline and the write handlers did not, so POST, PATCH and
 * withdraw all returned raw DB names (`new`, `screen`) while
 * applicationResponseSchema declares the API enum — a response that violated
 * its own published contract.
 */
export function withApiStatus<T extends { status?: unknown }>(
  application: T,
): T & { status: ApiStatus } {
  return {
    ...application,
    status: mapDbStatus(application.status as string),
  };
}

/**
 * Build the column payload for an application update.
 *
 * Exists as a named function so the vocabulary translation is testable without
 * standing up the Hono context. The handler used to spread the validated body
 * straight into `.update()`, which sent an API-surface status name to a column
 * constrained to DB names — `pending` and `reviewing` failed
 * `applications_status_check` outright, and the rest passed only because both
 * vocabularies spell them identically.
 */
/**
 * Which request fields are real columns on core.applications.
 *
 * An allow-list, not a deny-list. applicationUpdateSchema accepts twelve
 * fields and only two of them — `screening_answers` and `completed_steps` —
 * are columns. The rest reached `.update()` verbatim and PostgREST rejected
 * the whole request:
 *
 *   Could not find the 'is_complete' column of 'applications'
 *
 * #546 fixed the five flat screening answers by name. That was the same bug
 * with a narrower blast radius: `custom_question_answers`, `attachments`,
 * `is_complete`, `notes` and `metadata` were still broken. Enumerating what is
 * real means the next schema field added without a column fails loudly at the
 * boundary rather than at PostgREST.
 */
const APPLICATION_COLUMNS = new Set([
  "screening_answers",
  "completed_steps",
  "status",
  "updated_at",
]);

/** Top-level fields that belong inside the screening_answers JSONB. */
const FLAT_SCREENING_FIELDS = [
  "current_location",
  "willing_to_relocate",
  "years_experience",
  "is_authorized_to_work",
  "earliest_start_date",
  "custom_question_answers",
] as const;

/**
 * Request fields with nowhere to go.
 *
 * `is_complete` is a submission signal — it drives scoring, and is not stored.
 * `notes` and `metadata` are accepted by the schema and persisted by nothing,
 * on create or update. Dropped explicitly so the intent is visible rather than
 * looking like an oversight.
 */
const NON_PERSISTED_FIELDS = new Set(["is_complete", "notes", "metadata"]);

export function buildApplicationUpdatePayload(
  input: Record<string, unknown> & { status?: ApiStatus },
  now: string,
  existingScreeningAnswers: Record<string, unknown> | null = null,
): Record<string, unknown> {
  const { status: apiStatus, screening_answers: incomingAnswers, ...rest } =
    input;

  const payload: Record<string, unknown> = { updated_at: now };

  // `attachments` is the request name; the column is `attachment_metadata`.
  if (rest.attachments !== undefined) {
    payload.attachment_metadata = rest.attachments;
  }

  for (const [key, value] of Object.entries(rest)) {
    if (APPLICATION_COLUMNS.has(key)) payload[key] = value;
  }

  const flatAnswers: Record<string, unknown> = {};
  for (const field of FLAT_SCREENING_FIELDS) {
    if (rest[field] !== undefined) flatAnswers[field] = rest[field];
  }

  const explicitAnswers = (incomingAnswers ?? null) as
    | Record<string, unknown>
    | null;

  // Merge rather than replace. A PATCH naming one screening field must not
  // blank the rest, and PATCH is not a PUT.
  if (Object.keys(flatAnswers).length > 0 || explicitAnswers) {
    payload.screening_answers = {
      ...(existingScreeningAnswers ?? {}),
      ...(explicitAnswers ?? {}),
      ...flatAnswers,
    };
  }

  // Status no longer reaches here from the applicant schema — it was removed
  // so an applicant could not promote themselves (#530). The mapping stays
  // because this helper is the one place that owns the vocabulary boundary.
  if (apiStatus !== undefined) {
    payload.status = STATUS_API_TO_DB[apiStatus];
  }

  return payload;
}

/** Fields the update schema accepts but cannot store. Exported for tests. */
export const NON_PERSISTED_APPLICATION_FIELDS = NON_PERSISTED_FIELDS;

// Job summary embedded in application responses
const jobSummarySchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().nullable(),
    location: z.string().nullable(),
    employment_type: z.string().nullable(),
    remote_option: z.string().nullable(),
    pay_range_min_cents: z.number().int().nullable(),
    pay_range_max_cents: z.number().int().nullable(),
    pay_range_type: z.string().nullable(),
    organization: z
      .object({
        id: z.string().uuid(),
        name: z.string().nullable(),
        logo_url: z.string().nullable(),
      })
      .nullable(),
  })
  .openapi("ApplicationJobSummary");

// Application response schema (public fields only)
const applicationSchema = z
  .object({
    id: z.string().uuid(),
    job_id: z.string().uuid(),
    user_id: z.string().uuid(),
    status: z.enum(API_STATUSES),
    screening_answers: z.record(z.string(), z.unknown()).nullable(),
    attachment_metadata: z.record(z.string(), z.unknown()).nullable(),
    completed_steps: z.array(z.string()).nullable(),
    created_at: z.string(),
    stage_changed_at: z.string().nullable(),
    score: z.number().int().nullable(),
    job: jobSummarySchema.nullable().optional(),
  })
  .openapi("Application");

// Application create request schema
const createApplicationRequestSchema = applicationCreateSchema.openapi(
  "CreateApplicationRequest",
);

// Application update request schema
const updateApplicationRequestSchema = applicationUpdateSchema
  .omit({ application_id: true })
  .openapi("UpdateApplicationRequest");

// Withdraw request schema
const withdrawRequestSchema = z
  .object({
    reason: z.string().optional().openapi({
      description: "Optional reason for withdrawal",
      example: "Accepted another offer",
    }),
  })
  .openapi("WithdrawRequest");

// SC-100: the SDK's `client.applications.{create,retrieve,update,withdraw}`
// methods expect the unwrapped Application object directly. The old shape was
// `{ data: Application }`, which made `result.id` undefined at every call site
// (notably useApplicationForm.createDraft at line 110, which then threw
// "Failed to create application: no ID returned"). list() / getActivity() stay
// wrapped because their SDK callers expect `{ data: [], ... }`.
const applicationResponseSchema = applicationSchema.openapi(
  "ApplicationResponse",
);

// List applications response
const listApplicationsResponseSchema = z
  .object({
    data: z.array(applicationSchema),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })
  .openapi("ListApplicationsResponse");

// Error response schema
const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi("ErrorResponse");

/**
 * GET /v1/applications
 * List current user's applications (with optional status filter and pagination)
 */
const listApplicationsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Applications"],
  summary: "List applications",
  description:
    "List the authenticated user's applications with optional status filter and pagination.",
  middleware: requireAuth,
  request: {
    query: z.object({
      status: z.enum(API_STATUSES).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }),
  },
  responses: {
    200: {
      description: "List of applications",
      content: {
        "application/json": {
          schema: listApplicationsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(listApplicationsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { status, limit, offset } = c.req.valid("query");

  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }

  // Map API status filter back to DB status for querying. The full,
  // exhaustive map lives at the top of the file (SC-107).
  const dbStatus = status ? STATUS_API_TO_DB[status] : undefined;

  let query = supabase
    .schema("core")
    .from("applications")
    .select(
      "*, job:jobs!job_id(id, title, location, employment_type, remote_option, pay_range_min_cents, pay_range_max_cents, pay_range_type, organization:organizations!organization_id(id, name, logo_url))",
      { count: "exact" },
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (dbStatus) {
    query = query.eq("status", dbStatus);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error listing applications:", error);
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  const rows = data ?? [];
  const mapped = rows.map((row: Record<string, unknown>) => withApiStatus(row));

  return c.json(
    {
      data: mapped,
      total: count ?? 0,
      limit,
      offset,
    },
    200,
  );
});

/**
 * POST /v1/applications
 * Submit a new job application
 */
const createApplicationRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Applications"],
  summary: "Submit job application",
  description:
    "Submit a new application for a job posting. Supports both quick applications (screening questions only) and full applications with custom questions and document uploads.",
  middleware: requireAuth,
  request: {
    body: {
      content: {
        "application/json": {
          schema: createApplicationRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Application created successfully",
      content: {
        "application/json": {
          schema: applicationResponseSchema,
        },
      },
    },
    400: {
      description:
        "Bad request - validation error or job not accepting applications",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: "Conflict - already applied to this job",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
});

app.openapi(createApplicationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const input = c.req.valid("json");

  if (!user) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Authentication required to submit application",
      },
      401,
    );
  }

  // Check for duplicate application
  const { data: existingApp } = await supabase
    .schema("core")
    .from("applications")
    .select("id")
    .eq("job_id", input.job_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingApp) {
    return c.json(
      {
        error: "Conflict",
        message: "You have already applied to this job",
      },
      409,
    );
  }

  // Verify job exists and is accepting applications
  const { data: job, error: jobError } = await supabase
    .schema("core")
    .from("jobs")
    .select(
      "id, status, application_deadline, assigned_team_id, organization_id",
    )
    .eq("id", input.job_id)
    .single();

  if (jobError || !job) {
    return c.json(
      {
        error: "Not Found",
        message: "Job not found",
      },
      404,
    );
  }

  if (job.status !== "open") {
    return c.json(
      {
        error: "Bad Request",
        message: "This job is not accepting applications",
      },
      400,
    );
  }

  if (job.application_deadline) {
    const deadline = new Date(job.application_deadline);
    if (deadline < new Date()) {
      return c.json(
        {
          error: "Bad Request",
          message: "Application deadline has passed",
        },
        400,
      );
    }
  }

  // Create application
  // Map flat screening fields into the screening_answers JSONB column
  // and attachments into attachment_metadata JSONB column
  const screeningAnswers = {
    current_location: input.current_location,
    willing_to_relocate: input.willing_to_relocate,
    years_experience: input.years_experience,
    is_authorized_to_work: input.is_authorized_to_work,
    earliest_start_date: input.earliest_start_date,
    ...(input.screening_answers || {}),
  };

  const { data: application, error } = await supabase
    .schema("core")
    .from("applications")
    .insert({
      job_id: input.job_id,
      user_id: user.id,
      screening_answers: screeningAnswers,
      attachment_metadata: input.attachments || {},
      completed_steps: input.completed_steps || [],
      status: "new",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating application:", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: error.message,
      },
      500,
    );
  }

  // Score only a finished submission. A draft has nothing meaningful to score.
  if (input.is_complete) {
    await scoreAndScreen(application.id as string);
  }

  // Trigger webhook for application.created event
  await triggerWebhook("application.created", application);

  return c.json(withApiStatus(application), 201);
});

/**
 * GET /v1/applications/:id
 * Get application details by ID
 */
const getApplicationRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Applications"],
  summary: "Get application details",
  description:
    "Retrieve detailed information about a specific application. Users can only access their own applications.",
  middleware: requireAuth,
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: "Application ID",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    }),
  },
  responses: {
    200: {
      description: "Application details",
      content: {
        "application/json": {
          schema: applicationResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - not authorized to view this application",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Application not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
});

app.openapi(getApplicationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: application, error } = await supabase
    .schema("core")
    .from("applications")
    .select(
      "*, job:jobs!job_id(id, title, location, employment_type, remote_option, pay_range_min_cents, pay_range_max_cents, pay_range_type, organization:organizations!organization_id(id, name, logo_url))",
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return c.json({ error: "Application not found" }, 404);
    }
    console.error("Error fetching application:", error);
    return c.json({ error: error.message }, 500);
  }

  // Applicant, or someone working the hiring side of this job. Narrowed to
  // PIPELINE_ROLES because this returns the applicant's screening answers and
  // attachment metadata, not just a status.
  if (application.user_id !== user.id) {
    const access = await resolveApplicationOrgAccess(supabase, user.id, id, {
      allowedRoles: PIPELINE_ROLES,
    });

    if (!access.hasOrgAccess) {
      return c.json(
        {
          error: "Forbidden",
          message: "You do not have access to this application",
        },
        403,
      );
    }
  }

  return c.json(withApiStatus(application), 200);
});

/**
 * PATCH /v1/applications/:id
 * Update an application
 */
const updateApplicationRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Applications"],
  summary: "Update application",
  description:
    "Update an existing application. Users can only update their own applications that are in pending or reviewing status.",
  middleware: requireAuth,
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: "Application ID",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: updateApplicationRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Application updated successfully",
      content: {
        "application/json": {
          schema: applicationResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - cannot update application in current status",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Application not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
});

app.openapi(updateApplicationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const input = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get existing application
  const { data: existing, error: fetchError } = await supabase
    .schema("core")
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return c.json({ error: "Application not found" }, 404);
    }
    return c.json({ error: fetchError.message }, 500);
  }

  // Verify user owns this application
  if (existing.user_id !== user.id) {
    return c.json(
      {
        error: "Forbidden",
        message: "You can only update your own applications",
      },
      403,
    );
  }

  // Check if application can be updated
  // SC-107: `existing.status` is the raw DB value (`new`/`screen`/…), not
  // the API surface alias. Comparing against API names always rejected
  // updates of just-created applications.
  const UPDATABLE_DB_STATUSES: DbStatus[] = ["new", "screen"];
  if (!UPDATABLE_DB_STATUSES.includes(existing.status as DbStatus)) {
    return c.json(
      {
        error: "Bad Request",
        message: `Cannot update application with status: ${
          mapDbStatus(existing.status as string)
        }`,
      },
      400,
    );
  }

  // Update application. buildApplicationUpdatePayload translates the status
  // from the API vocabulary to the DB one — see its docstring for why the
  // previous `{ ...input }` spread was a 500 for two of the eight statuses.
  const updatePayload = buildApplicationUpdatePayload(
    input,
    new Date().toISOString(),
    (existing.screening_answers ?? null) as Record<string, unknown> | null,
  );

  const { data: application, error } = await supabase
    .schema("core")
    .from("applications")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating application:", error);
    return c.json({ error: error.message }, 500);
  }

  // The other way an application gets submitted.
  //
  // Gated on the request alone, not on a transition: `is_complete` is not a
  // column on core.applications — the schema accepts it and the insert drops
  // it — so there is no stored previous value to compare against. Same class
  // of phantom field as the flat screening answers in #546. Re-scoring on a
  // repeat submit is cheap and idempotent, so that is the safe reading.
  if (input.is_complete) {
    await scoreAndScreen(id);
  }

  // Trigger webhook for application.updated event
  await triggerWebhook("application.updated", application);

  return c.json(withApiStatus(application), 200);
});

/**
 * POST /v1/applications/:id/withdraw
 * Withdraw an application
 */
const withdrawApplicationRoute = createRoute({
  method: "post",
  path: "/{id}/withdraw",
  tags: ["Applications"],
  summary: "Withdraw application",
  description:
    "Withdraw a submitted application. Can only withdraw applications in pending, reviewing, or inquired status.",
  middleware: requireAuth,
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: "Application ID",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: withdrawRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Application withdrawn successfully",
      content: {
        "application/json": {
          schema: applicationResponseSchema,
        },
      },
    },
    400: {
      description:
        "Bad request - cannot withdraw application in current status",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Application not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
});

app.openapi(withdrawApplicationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const input = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get existing application
  const { data: existing, error: fetchError } = await supabase
    .schema("core")
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return c.json({ error: "Application not found" }, 404);
    }
    return c.json({ error: fetchError.message }, 500);
  }

  // Verify user owns this application
  if (existing.user_id !== user.id) {
    return c.json(
      {
        error: "Forbidden",
        message: "You can only withdraw your own applications",
      },
      403,
    );
  }

  // Check if application can be withdrawn
  // SC-107: see the update guard — `existing.status` is the raw DB value.
  const WITHDRAWABLE_DB_STATUSES: DbStatus[] = ["new", "screen", "inquired"];
  if (!WITHDRAWABLE_DB_STATUSES.includes(existing.status as DbStatus)) {
    return c.json(
      {
        error: "Bad Request",
        message: `Cannot withdraw application with status: ${
          mapDbStatus(existing.status as string)
        }`,
      },
      400,
    );
  }

  // Withdraw application
  const { data: application, error } = await supabase
    .schema("core")
    .from("applications")
    .update({
      status: "withdrawn",
      metadata: {
        ...existing.metadata,
        withdrawal_reason: input.reason || null,
        withdrawn_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error withdrawing application:", error);
    return c.json({ error: error.message }, 500);
  }

  // Trigger webhook for application.withdrawn event
  await triggerWebhook("application.withdrawn", application);

  return c.json(withApiStatus(application), 200);
});

/**
 * Webhook trigger helper
 * Sends application events to configured webhook URLs
 */
/**
 * Deliver an application event to the organisation's configured webhooks.
 *
 * The payload carries the **API** status vocabulary, matching what the REST
 * responses return. It used to emit the row verbatim, so a consumer polling
 * GET /v1/applications/{id} saw `pending` while the webhook for the same row
 * said `new` — one field, one resource, two vocabularies (#541).
 */
/**
 * Score a submitted application, then apply the job's auto-rejection rule.
 *
 * Migrations 151 and 152 have provided `core.calculate_application_score` and
 * `core.auto_reject_application` since they were written, and nothing has ever
 * called them. 151 also installs a trigger, but it fires on
 * `current_step = 'review'` and nothing writes `applications.current_step` —
 * so no application has ever been scored. Verified: 21 rows locally, 0 with a
 * score and 0 with a current_step.
 *
 * Calling the functions explicitly rather than setting `current_step` to reach
 * the trigger. Relying on the side effect of an unrelated column is how this
 * got lost in the first place.
 *
 * SECURITY DEFINER on both, and the RPCs are called with the service role: the
 * applicant must not be able to influence their own score, and the score write
 * touches columns the applicant cannot update.
 *
 * Best-effort. A submission that scores late is recoverable; a submission
 * rejected because scoring failed is not, so a failure here is logged and the
 * application stands unscored.
 */
async function scoreAndScreen(applicationId: string): Promise<void> {
  const client = getWebhookClient();

  const { error: scoreError } = await client
    .schema("core")
    .rpc("calculate_application_score", { p_application_id: applicationId });

  if (scoreError) {
    console.error(
      JSON.stringify({
        severity: "error",
        component: "application_scoring",
        outcome: "score_failed",
        application_id: applicationId,
        db_error: scoreError.message,
      }),
    );
    // No score means auto-rejection has nothing to threshold against, and
    // rejecting on a missing score would be worse than not rejecting.
    return;
  }

  const { error: rejectError } = await client
    .schema("core")
    .rpc("auto_reject_application", { p_application_id: applicationId });

  if (rejectError) {
    console.error(
      JSON.stringify({
        severity: "error",
        component: "application_scoring",
        outcome: "auto_reject_failed",
        application_id: applicationId,
        db_error: rejectError.message,
      }),
    );
  }
}

/**
 * Service-role client for webhook work.
 *
 * public.webhooks is gated by `webhooks_select_policy`, which requires a
 * role_assignments row scoped to the organisation for auth.uid(). The events
 * here are triggered by the *applicant* — who by definition holds no such row —
 * so on the caller's RLS client the lookup returns empty and delivery silently
 * never happens. Whether an organisation is notified about its own application
 * is not a function of the actor's permissions.
 */
function getWebhookClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

/**
 * Write one row to public.webhook_deliveries.
 *
 * Extracted so the column names live in one place — the two call sites had
 * drifted from the schema in the same way, and from each other.
 *
 * Best-effort: the HTTP delivery has already happened, so a failure to record
 * it must not propagate. Logged loudly instead, because a silent failure here
 * is exactly how the broken table reference stayed hidden.
 */
// deno-lint-ignore no-explicit-any
async function recordDelivery(supabase: any, row: {
  webhook_id: string;
  event_type: string;
  event_id: string;
  event_data: unknown;
  request_body: unknown;
  status: "success" | "failed";
  response_status_code?: number;
  response_body?: string;
  error_message?: string;
}): Promise<void> {
  const { error } = await supabase
    .schema("public")
    .from("webhook_deliveries")
    .insert({
      ...row,
      delivered_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

  if (error) {
    console.error(
      JSON.stringify({
        severity: "error",
        component: "webhook_delivery",
        outcome: "record_failed",
        event: row.event_type,
        webhook_id: row.webhook_id,
        db_error: error.message,
      }),
    );
  }
}

export async function triggerWebhook(
  event: string,
  application: Record<string, unknown>,
) {
  // No Hono context: every query below deliberately uses the service client,
  // so the caller's identity is irrelevant. Exported so the employer write
  // path can emit too — a recruiter moving a candidate is the event an
  // organisation most wants to hear about, and it was emitting nothing.
  try {
    // Fetch organization's webhook configuration
    const webhookClient = getWebhookClient();

    const { data: job } = await webhookClient
      .schema("core")
      .from("jobs")
      .select("organization_id")
      .eq("id", application.job_id)
      .single();

    if (!job) return;

    // core.webhook_configurations never existed — not in any migration, not in
    // any environment. The real table is public.webhooks (migration 225), and
    // its flag is `is_active`, not `enabled`. Because the error was discarded
    // below, every delivery since this was written looked like "this org has no
    // webhooks" (#555).
    const { data: webhooks, error: lookupError } = await webhookClient
      .schema("public")
      .from("webhooks")
      .select("id, url, secret, events")
      .eq("organization_id", job.organization_id)
      .eq("is_active", true)
      .contains("events", [event]);

    if (lookupError) {
      // Log rather than discard. Swallowing this is what hid the broken table
      // reference for the lifetime of the feature.
      console.error(
        JSON.stringify({
          severity: "error",
          component: "webhook_delivery",
          outcome: "lookup_failed",
          event,
          organization_id: job.organization_id,
          db_error: lookupError.message,
        }),
      );
      return;
    }

    if (!webhooks || webhooks.length === 0) return;

    // Send webhook to each configured URL
    const webhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: withApiStatus(application),
    };

    for (const webhook of webhooks) {
      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Event": event,
            "X-Webhook-Signature": await generateWebhookSignature(
              webhookPayload,
              webhook.secret,
            ),
          },
          body: JSON.stringify(webhookPayload),
        });

        const responseBody = await response.text();

        // SC-108: structured logging on non-2xx so operator dashboards /
        // alerts can pick up ATS webhook regressions instead of relying on
        // someone reading the `core.webhook_deliveries` table by hand.
        if (!response.ok) {
          console.error(
            JSON.stringify({
              severity: "error",
              component: "webhook_delivery",
              outcome: "http_error",
              event,
              webhook_id: webhook.id,
              webhook_url: webhook.url,
              http_status: response.status,
              response_body: responseBody.slice(0, 500),
            }),
          );
        }

        // Log webhook delivery (table is the durable record; logs are the
        // alerting surface).
        // Column names are the ones public.webhook_deliveries actually has.
        // The previous shape would have failed on every count: wrong schema,
        // `event`/`payload` are not columns, the NOT NULL `event_id` and
        // `request_body` were absent, and "delivered" is not in the status
        // CHECK constraint (pending|success|failed|retrying|cancelled).
        await recordDelivery(webhookClient, {
          webhook_id: webhook.id,
          event_type: event,
          event_id: application.id as string,
          event_data: webhookPayload,
          request_body: webhookPayload,
          status: response.ok ? "success" : "failed",
          response_status_code: response.status,
          response_body: responseBody.slice(0, 4000),
        });
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : "Unknown error";

        console.error(
          JSON.stringify({
            severity: "error",
            component: "webhook_delivery",
            outcome: "fetch_exception",
            event,
            webhook_id: webhook.id,
            webhook_url: webhook.url,
            error: errorMessage,
          }),
        );

        // Log failed delivery
        await recordDelivery(webhookClient, {
          webhook_id: webhook.id,
          event_type: event,
          event_id: application.id as string,
          event_data: webhookPayload,
          request_body: webhookPayload,
          status: "failed",
          error_message: errorMessage,
        });
      }
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        severity: "error",
        component: "webhook_delivery",
        outcome: "trigger_exception",
        event,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    );
  }
}

/**
 * Generate HMAC SHA-256 signature for webhook payload
 */
async function generateWebhookSignature(
  payload: unknown,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * GET /v1/applications/:id/activity
 * Get activity feed for an application
 */
const activitySchema = z
  .object({
    id: z.string().uuid(),
    application_id: z.string().uuid(),
    event_type: z.string(),
    details: z.record(z.string(), z.unknown()).nullable(),
    created_at: z.string(),
  })
  .openapi("ApplicationActivity");

const getActivityRoute = createRoute({
  method: "get",
  path: "/{id}/activity",
  tags: ["Applications"],
  summary: "Get application activity feed",
  description: "Get the activity timeline for a specific application.",
  middleware: requireAuth,
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Activity feed",
      content: {
        "application/json": {
          schema: z.object({ data: z.array(activitySchema) }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getActivityRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify user owns this application
  const { data: application, error: appError } = await supabase
    .schema("core")
    .from("applications")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (appError || !application) {
    return c.json(
      { error: "Not Found", message: "Application not found" },
      404,
    );
  }

  // The activity log is how a recruiter sees stage history, so it has to admit
  // the hiring side too — same allow-list as the detail route.
  if (application.user_id !== user.id) {
    const access = await resolveApplicationOrgAccess(supabase, user.id, id, {
      allowedRoles: PIPELINE_ROLES,
    });

    if (!access.hasOrgAccess) {
      return c.json({
        error: "Forbidden",
        message: "You do not have access to this application",
      }, 403);
    }
  }

  const { data: activity, error } = await supabase
    .schema("core")
    .from("application_activity")
    .select("id, application_id, event_type, details, created_at")
    .eq("application_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching activity:", error);
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  return c.json({ data: activity ?? [] }, 200);
});

// ─────────────────────────────────────────────────────────────────────────
// SC-101: ports of the tRPC application file-upload + messaging routes that
// the SDK has been declaring but the REST API never implemented. Without
// these the wizard's resume upload and the application messaging thread were
// 404'd in production.
// ─────────────────────────────────────────────────────────────────────────

const attachmentTypeEnum = z.enum([
  "resume",
  "cover_letter",
  "portfolio",
  "assessment",
  "video_interview",
]);

/**
 * POST /v1/applications/upload-url
 * Mint a presigned upload URL for an application attachment.
 */
const getUploadUrlRoute = createRoute({
  method: "post",
  path: "/upload-url",
  tags: ["Applications"],
  summary: "Get upload URL",
  middleware: requireAuth,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            application_id: z.string().uuid(),
            attachment_type: attachmentTypeEnum,
            filename: z.string().min(1),
            content_type: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Signed upload URL",
      content: {
        "application/json": {
          schema: z.object({
            uploadUrl: z.string(),
            path: z.string(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getUploadUrlRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { application_id, attachment_type, filename } = c.req.valid("json");

  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }

  const { data: application } = await supabase
    .schema("core")
    .from("applications")
    .select("user_id, job_id")
    .eq("id", application_id)
    .single();

  if (!application || application.user_id !== user.id) {
    return c.json(
      {
        error: "Forbidden",
        message: "You can only upload files to your own applications",
      },
      403,
    );
  }

  const filePath =
    `${user.id}/${application.job_id}/${application_id}/${attachment_type}/${filename}`;

  const { data, error } = await supabase.storage
    .from("application-attachments")
    .createSignedUploadUrl(filePath);

  if (error) {
    return c.json(
      {
        error: "Internal Server Error",
        message: "Failed to generate upload URL",
      },
      500,
    );
  }

  return c.json({ uploadUrl: data.signedUrl, path: filePath });
});

/**
 * POST /v1/applications/confirm-upload
 * Record that a file finished uploading and attach it to the application.
 */
const confirmUploadRoute = createRoute({
  method: "post",
  path: "/confirm-upload",
  tags: ["Applications"],
  summary: "Confirm uploaded attachment",
  middleware: requireAuth,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            application_id: z.string().uuid(),
            attachment_type: attachmentTypeEnum,
            path: z.string().min(1),
            filename: z.string().min(1),
            size: z.number().int().nonnegative(),
            mime_type: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Application with attachment recorded",
      content: {
        "application/json": {
          schema: applicationResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(confirmUploadRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const input = c.req.valid("json");

  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }

  const { data: application } = await supabase
    .schema("core")
    .from("applications")
    .select("user_id, attachment_metadata")
    .eq("id", input.application_id)
    .single();

  if (!application || application.user_id !== user.id) {
    return c.json(
      {
        error: "Forbidden",
        message: "You can only update your own applications",
      },
      403,
    );
  }

  const attachments =
    (application.attachment_metadata as Record<string, unknown>) || {};
  attachments[input.attachment_type] = {
    path: input.path,
    filename: input.filename,
    size: input.size,
    mime_type: input.mime_type,
    uploaded_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .schema("core")
    .from("applications")
    .update({ attachment_metadata: attachments })
    .eq("id", input.application_id)
    .select()
    .single();

  if (error) {
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  return c.json(updated, 200);
});

/**
 * GET /v1/applications/:id/messages
 * Fetch the application thread. Either the applicant or someone with
 * organization access (owner or role_assignment) may read.
 */
const getMessagesRoute = createRoute({
  method: "get",
  path: "/{id}/messages",
  tags: ["Applications"],
  summary: "Get application messages",
  middleware: requireAuth,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: "Messages",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(
              z.object({
                id: z.string().uuid(),
                application_id: z.string().uuid(),
                sender_id: z.string().uuid(),
                body: z.string(),
                created_at: z.string(),
                sender_name: z.string().optional(),
                sender_role: z.enum(["applicant", "recruiter", "system"])
                  .optional(),
              }),
            ),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getMessagesRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }

  // Access unchanged from the inline block this replaces: applicant, org owner,
  // or any org-scoped role assignment. Deliberately NOT narrowed to
  // PIPELINE_ROLES — being party to a thread is a narrower grant than reading
  // the whole pipeline, and tightening it here would be a silent regression.
  const access = await resolveApplicationOrgAccess(supabase, user.id, id);

  if (!access.found) {
    return c.json(
      { error: "Not Found", message: "Application not found" },
      404,
    );
  }

  if (!access.isApplicant && !access.hasOrgAccess) {
    return c.json(
      {
        error: "Forbidden",
        message: "You do not have access to this application",
      },
      403,
    );
  }

  const { data: messages, error } = await supabase
    .schema("core")
    .from("application_messages")
    .select(
      "id, body, created_at, author_user_id, author:users!author_user_id(id, display_name, username)",
    )
    .eq("application_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  // Shape to the SDK's ApplicationMessage contract — author_user_id → sender_id,
  // computed sender_role from whether the author is the applicant.
  const data = (messages || []).map(
    (msg: {
      id: string;
      body: string;
      created_at: string;
      author_user_id: string;
      author: { display_name?: string; username?: string } | null;
    }) => ({
      id: msg.id,
      application_id: id,
      sender_id: msg.author_user_id,
      body: msg.body,
      created_at: msg.created_at,
      sender_name: msg.author?.display_name || msg.author?.username,
      sender_role: (msg.author_user_id === access.applicantUserId
        ? "applicant"
        : "recruiter") as "applicant" | "recruiter",
    }),
  );

  return c.json({ data }, 200);
});

/**
 * POST /v1/applications/:id/messages
 * Send a message into the application thread.
 */
const sendMessageRoute = createRoute({
  method: "post",
  path: "/{id}/messages",
  tags: ["Applications"],
  summary: "Send application message",
  middleware: requireAuth,
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ body: z.string().min(1) }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Message created",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string().uuid(),
            application_id: z.string().uuid(),
            sender_id: z.string().uuid(),
            body: z.string(),
            created_at: z.string(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(sendMessageRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { body } = c.req.valid("json");

  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }

  // Allow the applicant OR org owner/role_assignee to reply. The read route
  // permits the same set, so a recruiter previously could load the thread but
  // not respond — every reply 403'd before this access check ran.
  const access = await resolveApplicationOrgAccess(supabase, user.id, id);

  if (!access.found) {
    return c.json(
      { error: "Not Found", message: "Application not found" },
      404,
    );
  }

  if (!access.isApplicant && !access.hasOrgAccess) {
    return c.json(
      {
        error: "Forbidden",
        message: "You cannot post in this application thread",
      },
      403,
    );
  }

  const { data: message, error } = await supabase
    .schema("core")
    .from("application_messages")
    .insert({
      application_id: id,
      author_user_id: user.id,
      body,
    })
    .select()
    .single();

  if (error) {
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  return c.json(
    {
      id: message.id,
      application_id: id,
      sender_id: user.id,
      body: message.body,
      created_at: message.created_at,
    },
    201,
  );
});

// Generate OpenAPI documentation
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Scaffald Applications API",
    version: "1.0.0",
    description:
      "Public API for job application management with webhook support",
  },
});

export default app;
