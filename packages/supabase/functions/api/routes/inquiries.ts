/**
 * Inquiries REST API
 * User inquiries and support tickets
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.ts";
import { blockedUserIds, withoutBlocked } from "../lib/blocks.ts";

const app = new OpenAPIHono();
app.use("*", authMiddleware);

const _errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

/**
 * GET /v1/inquiries
 * List inquiries
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Inquiries"],
    summary: "List inquiries",
    request: {
      query: z.object({
        direction: z.enum(["sent", "received"]).optional(),
        status: z.enum(["pending", "responded", "archived"]).optional(),
        inquiry_type: z.enum(["general", "job_inquiry", "support", "feedback"])
          .optional(),
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
      }),
    },
    responses: {
      200: {
        description: "Inquiries list",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(z.any()),
              pagination: z.object({
                total: z.number(),
                page: z.number(),
                limit: z.number(),
                total_pages: z.number(),
              }),
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
    const { direction, status, page = 1, limit = 20 } = c.req.valid("query");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let query = supabase.schema("core").from("inquiries").select("*", {
      count: "exact",
    });

    if (direction === "sent") {
      query = query.eq("sender_id", user.id);
    } else if (direction === "received") {
      query = query.eq("recipient_id", user.id);
    } else {
      query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order("created_at", {
      ascending: false,
    });

    const { data, error, count } = await query;

    if (error) {
      return c.json({
        error: "Failed to fetch inquiries",
        message: error.message,
      }, 500);
    }

    return c.json({
      data: data || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  },
);

/**
 * POST /v1/inquiries
 * Create inquiry
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Inquiries"],
    summary: "Create inquiry",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              recipient_id: z.string().uuid(),
              subject: z.string().optional(),
              message: z.string().optional(),
              inquiry_type: z.enum([
                "general",
                "job_inquiry",
                "support",
                "feedback",
              ]).optional(),
              job_id: z.string().uuid().optional(),
              template_id: z.string().uuid().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Inquiry created",
        content: {
          "application/json": {
            schema: z.object({ data: z.any() }),
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

    const { data, error } = await supabase
      .schema("core")
      .from("inquiries")
      .insert({
        sender_id: user.id,
        recipient_id: body.recipient_id,
        subject: body.subject || "Inquiry",
        message: body.message || "",
        inquiry_type: body.inquiry_type || "general",
        job_id: body.job_id,
        template_id: body.template_id,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return c.json({
        error: "Failed to create inquiry",
        message: error.message,
      }, 500);
    }

    return c.json({ data }, 201);
  },
);

/**
 * authMiddleware stores its values on an untyped `Context`, so `c.get(...)`
 * infers as `never` and every property access on it is a type error. That is
 * true of every route file in this API, not just this one — typing the
 * middleware's Variables is a cross-cutting change and out of scope here. These
 * two readers keep the new handler below from adding to the pile.
 */
// deno-lint-ignore no-explicit-any
type AuthedSupabase = any;
interface AuthedUser {
  id: string;
}

// deno-lint-ignore no-explicit-any
function authed(
  c: any,
): { supabase: AuthedSupabase; user: AuthedUser | undefined } {
  return { supabase: c.get("supabase"), user: c.get("user") };
}

/** PostgREST returns embedded to-one relations as an object on some versions and
 * a single-element array on others. Tolerate both rather than betting on one. */
// deno-lint-ignore no-explicit-any
export function one(value: any): any {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

/**
 * Map an application row to the camelCase shape the inquiry views consume.
 * Ported from the legacy tRPC `mapApplicationRecord` so the office page keeps
 * reading `candidate.displayName` / `job.title` off the response unchanged.
 */
// deno-lint-ignore no-explicit-any
export function mapApplicationRecord(application: any) {
  if (!application) {
    return { application: null, capabilityQuestions: [] };
  }

  const job = one(application.job);
  const candidate = one(application.candidate);
  const organization = job ? one(job.organization) : null;

  const rawQuestions = job?.inquiry_capability_questions ?? [];
  const capabilityQuestions = Array.isArray(rawQuestions) ? rawQuestions : [];

  return {
    application: {
      id: application.id,
      status: application.status ?? null,
      // Keep the response keys the views already read, sourced from the columns
      // that actually exist (see the select above).
      applicationScore: application.score_total ?? null,
      appliedAt: application.created_at ?? null,
      stageChangedAt: application.stage_changed_at ?? null,
      createdAt: application.created_at,
      updatedAt: application.updated_at,
      jobTitle: job?.title ?? null,
      job: job
        ? {
          id: job.id,
          title: job.title ?? null,
          employmentType: job.employment_type ?? null,
          location: job.location ?? null,
          remoteOption: job.remote_option ?? null,
          organization: organization
            ? { id: organization.id, name: organization.name ?? null }
            : null,
          payRangeMinCents: job.pay_range_min_cents ?? null,
          payRangeMaxCents: job.pay_range_max_cents ?? null,
          payRangeType: job.pay_range_type ?? null,
          capabilityQuestions,
        }
        : null,
      candidate: candidate
        ? {
          id: candidate.id,
          displayName: candidate.display_name ?? null,
          username: candidate.username ?? null,
          avatarPath: candidate.avatar_path ?? null,
          name: candidate.display_name ?? candidate.username ?? null,
        }
        : null,
    },
    capabilityQuestions,
  };
}

/**
 * Confirm the caller may see this application, mirroring the legacy tRPC
 * `verifyApplicationAccess`: the applicant themselves, the owner of the hiring
 * organization, or anyone with a role assignment scoped to that organization.
 *
 * Returns a discriminated result rather than throwing so the caller can map it
 * onto the right status code — 404 for "no such application" and 403 for "not
 * yours" are different answers and the UI needs to tell them apart.
 */
export async function checkApplicationAccess(
  supabase: AuthedSupabase,
  userId: string,
  applicationId: string,
): Promise<
  { ok: true } | { ok: false; status: 403 | 404 | 500; error: string }
> {
  const { data: application, error } = await supabase
    .schema("core")
    .from("applications")
    .select(
      `id, user_id, job_id,
       job:jobs!job_id(id, organization_id, organization:organizations!organization_id(id, owner_user_id))`,
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, error: error.message };
  }
  if (!application) {
    return { ok: false, status: 404, error: "Application not found" };
  }

  if (application.user_id === userId) {
    return { ok: true };
  }

  const job = one(application.job);
  const organization = job ? one(job.organization) : null;

  if (organization?.owner_user_id === userId) {
    return { ok: true };
  }

  const orgId = job?.organization_id;
  if (orgId) {
    const { data: roleAssignment } = await supabase
      .schema("core")
      .from("role_assignments")
      .select("id")
      .eq("user_id", userId)
      .eq("scope_org_id", orgId)
      .maybeSingle();

    if (roleAssignment) {
      return { ok: true };
    }
  }

  return {
    ok: false,
    status: 403,
    error: "You do not have access to this application",
  };
}

/**
 * GET /v1/inquiries/by-application/:applicationId
 *
 * The capability inquiry attached to an application, with its sections,
 * comments and capability responses. Ported from the legacy tRPC
 * `inquiries.getByApplication`, which was the only implementation — the SDK
 * method the app calls never existed, and an `as unknown as` cast in
 * inquiries-sdk-hooks.ts hid that until it failed at runtime.
 *
 * Note this reads core.application_inquiries, the ATS capability-inquiry
 * feature. That is a different concept from the sender/recipient `inquiries`
 * that the list and create endpoints above model.
 *
 * Returns the object bare rather than under a `data` key: the SDK hands the
 * body back verbatim and the caller reads `.inquiry` off it.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/by-application/{applicationId}",
    tags: ["Inquiries"],
    summary: "Get the capability inquiry for an application",
    request: {
      params: z.object({ applicationId: z.string().uuid() }),
    },
    responses: {
      200: {
        description:
          "Inquiry details, or null when the application has no inquiry yet",
        content: {
          "application/json": {
            schema: z.object({
              inquiry: z.any().nullable(),
              sections: z.array(z.any()),
              comments: z.array(z.any()),
              capabilityResponses: z.array(z.any()),
            }).nullable(),
          },
        },
      },
      403: { description: "No access to this application" },
      404: { description: "Application not found" },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const { supabase, user } = authed(c);
    const { applicationId } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const access = await checkApplicationAccess(
      supabase,
      user.id,
      applicationId,
    );
    if (!access.ok) {
      return c.json({ error: access.error }, access.status);
    }

    const { data: inquiry, error: inquiryError } = await supabase
      .schema("core")
      .from("application_inquiries")
      .select("*")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (inquiryError) {
      return c.json(
        { error: "Failed to fetch inquiry", message: inquiryError.message },
        500,
      );
    }

    // No inquiry yet is a legitimate state, not a failure. It returns 200/null
    // so the UI can render an empty state instead of an error — most
    // applications have never had one raised.
    if (!inquiry) {
      return c.json(null, 200);
    }

    // The office view reads candidate/job off the response, so fetch the
    // application alongside and map it to the same camelCase shape the legacy
    // tRPC procedure returned. Omitting these would silently degrade that page
    // to "Candidate" / "Job" placeholders.
    const applicationPromise = supabase
      .schema("core")
      .from("applications")
      // NB: the legacy tRPC procedure selected `applied_at` and
      // `application_score`, neither of which exists on core.applications — so
      // that query would 400 outright. The real columns are `created_at` (the
      // application was created when it was submitted) and `score_total`.
      .select(
        `id, status, stage_changed_at, score_total, created_at, updated_at,
         job:jobs!job_id(
           id, title, employment_type, location, remote_option,
           pay_range_min_cents, pay_range_max_cents, pay_range_type,
           inquiry_capability_questions,
           organization:organizations!organization_id(id, name)
         ),
         candidate:users!user_id(id, display_name, username, avatar_path)`,
      )
      .eq("id", applicationId)
      .maybeSingle();

    const [sections, comments, capabilityResponses] = await Promise.all([
      supabase
        .schema("core")
        .from("inquiry_sections")
        .select("*")
        .eq("inquiry_id", inquiry.id)
        .order("section_name"),
      supabase
        .schema("core")
        .from("inquiry_comments")
        .select("*")
        .eq("inquiry_id", inquiry.id)
        .order("created_at", { ascending: true }),
      supabase
        .schema("core")
        .from("inquiry_capability_responses")
        .select("*")
        .eq("inquiry_id", inquiry.id),
    ]);

    const applicationResult = await applicationPromise;

    // #690: a block hides the thread's messages in both directions. Applied
    // here rather than in the query because the block list is symmetric and
    // comes from a definer function — the caller cannot see who blocked them,
    // so this cannot be expressed as a filter the request client could run.
    const blocked = await blockedUserIds(supabase, user.id);
    const visibleComments = withoutBlocked(
      comments.data,
      blocked,
      (row: { sender_id?: string | null }) => row.sender_id,
    );

    const failed = [sections, comments, capabilityResponses, applicationResult]
      .find((r) => r.error);
    if (failed?.error) {
      return c.json(
        {
          error: "Failed to fetch inquiry details",
          message: failed.error.message,
        },
        500,
      );
    }

    const { application: applicationDetails, capabilityQuestions } =
      mapApplicationRecord(applicationResult.data);

    return c.json({
      inquiry,
      sections: sections.data ?? [],
      // Filtered, not raw — see the blocked-user note above (#690).
      comments: visibleComments,
      capabilityResponses: capabilityResponses.data ?? [],
      application: applicationDetails,
      candidate: applicationDetails?.candidate ?? null,
      job: applicationDetails?.job ?? null,
      capabilityQuestions,
    }, 200);
  },
);

export default app;
