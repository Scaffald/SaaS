/**
 * Inquiries REST API
 * User inquiries and support tickets
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { type ApiEnv, authMiddleware } from "../middleware/auth.ts";
import { blockedUserIds, withoutBlocked } from "../lib/blocks.ts";

/**
 * Service-role client, for the existence lookup in checkApplicationAccess only.
 * Same escape hatch, and the same reason, as employer-applications.ts (#608).
 */
function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

const app = new OpenAPIHono<ApiEnv>();
app.use("*", authMiddleware);

const _errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

/**
 * GET /v1/inquiries and POST /v1/inquiries used to live here, and are gone.
 *
 * Both read core.inquiries, which does not exist and never has (#476). They
 * were not a rename of the real table: the list filtered on `sender_id` /
 * `recipient_id` and the create inserted `subject`, `message`, `inquiry_type`,
 * none of which exist on core.application_inquiries. They described a generic
 * person-to-person messaging feature that was never built.
 *
 * The real feature is application-scoped and is served below by
 * GET /by-application/{applicationId} against core.application_inquiries —
 * which every inquiry child table has a foreign key to.
 *
 * Deleted rather than implemented, per the method on #660: nothing calls them.
 * `Inquiries.list()` and `Inquiries.create()` in the SDK were the only callers
 * and are retired alongside; no hook or screen used either. Building
 * core.inquiries to satisfy them would have shipped a table for an endpoint
 * nothing can reach.
 */

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
  // Service role, not the request client.
  //
  // This is a LOOKUP, not an authorisation decision — the decision is made
  // below, unchanged, from the row's own user_id, the organisation owner, and
  // an org-scoped role assignment. Reading it under RLS made this function
  // answer "Application not found" to the very employers it then goes on to
  // authorise: RLS on core.applications does not expose an org's applications
  // to its staff, which is why employer-applications.ts reads the same table
  // with the service role (#608, #649).
  //
  // Measured, not assumed. For an employer whose own list returns application
  // d95a852c:
  //
  //   visible to the REQUEST client (RLS): NO   <- the 404 came from here
  //   visible to the SERVICE client      : yes
  //
  // So GET /by-application/{id} 404'd on every application an employer could
  // see, which is the whole inquiry thread screen — including the per-message
  // report control #703 put on it.
  const { data: application, error } = await getServiceClient()
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

    // Service role again, for the same reason and only after the access check
    // above has authorised this caller.
    //
    // RLS hides core.application_inquiries from an organisation's own staff
    // exactly as it hides core.applications, so reading it as the request
    // client turned the 404 into a 200 with an empty thread — a different
    // broken, not a fixed one. Measured on the same employer:
    //
    //   core.applications           RLS: NO   service: yes
    //   core.application_inquiries  RLS: NO   service: yes
    //
    // The authorisation decision is still the one checkApplicationAccess made;
    // this only stops the read from silently returning nothing to someone who
    // is allowed to see it.
    const db = getServiceClient();

    const { data: inquiry, error: inquiryError } = await db
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
    // Same authorised-then-read pattern: RLS hides this row from the very
    // employer the access check just approved, and a null here silently
    // degrades the screen to "Candidate" / "Job" placeholders.
    const applicationPromise = db
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
      db
        .schema("core")
        .from("inquiry_sections")
        .select("*")
        .eq("inquiry_id", inquiry.id)
        .order("section_name"),
      db
        .schema("core")
        .from("inquiry_comments")
        .select("*")
        .eq("inquiry_id", inquiry.id)
        .order("created_at", { ascending: true }),
      db
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
