/**
 * Moderation REST API — reporting content and people, and blocking people.
 *
 * Scaffald carries user-generated content (community posts and comments,
 * inquiry threads, profiles, job posts) and had no way to report or block any
 * of it. Google Play's UGC policy and Apple Guideline 1.2 both require
 * reporting content, reporting a person, and blocking a person. See #690.
 *
 * Two ideas, kept apart on purpose:
 *
 *   reports — a request for moderator attention. Queued, reviewed, resolved.
 *   blocks  — a user's own boundary. Immediate, reversible, needs nobody's
 *             approval, and takes effect in BOTH directions.
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.ts";

/**
 * Service-role client. Defined here rather than imported because there is no
 * shared helper — employer-applications.ts declares its own the same way.
 */
function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

const app = new OpenAPIHono();

app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi("ErrorResponse");

const subjectTypeSchema = z.enum([
  "community_post",
  "community_comment",
  "inquiry_message",
  "user",
  "job",
]);

const reasonSchema = z.enum([
  "spam",
  "harassment",
  "hate_speech",
  "sexual_content",
  "violence_or_threats",
  "scam_or_fraud",
  "off_platform_solicitation",
  "other",
]);

const reportSchema = z
  .object({
    id: z.string().uuid(),
    reporter_id: z.string().uuid(),
    subject_type: subjectTypeSchema,
    subject_id: z.string().uuid(),
    reported_user_id: z.string().uuid().nullable(),
    reason: reasonSchema,
    details: z.string().nullable(),
    status: z.enum(["open", "reviewing", "actioned", "dismissed"]),
    created_at: z.string(),
  })
  .openapi("ContentReport");

const createReportSchema = z.object({
  subjectType: subjectTypeSchema,
  subjectId: z.string().uuid(),
  reason: reasonSchema,
  details: z.string().max(2000).optional(),
});

const blockSchema = z
  .object({
    id: z.string().uuid(),
    blocker_id: z.string().uuid(),
    blocked_id: z.string().uuid(),
    created_at: z.string(),
  })
  .openapi("UserBlock");

const createBlockSchema = z.object({
  userId: z.string().uuid(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ============================================================================
// Resolving the author of reported content
// ============================================================================

/**
 * Who wrote the thing being reported.
 *
 * Stored on the report so a moderator can see repeat offenders across surfaces
 * without joining five tables, and — the reason that matters — so the report
 * still names someone after the content itself is deleted. Deletion is exactly
 * when a report becomes most important.
 *
 * Reads with the service client: the reporter frequently cannot SELECT the row
 * they are reporting (that is often the complaint), and a report that fails
 * because the reporter lacks read access on abusive content would be a
 * spectacular own goal. Nothing user-supplied reaches a query as anything but
 * a bound parameter.
 *
 * Returns null rather than throwing when the author cannot be determined: an
 * unattributed report is still worth filing.
 */
async function resolveAuthor(
  subjectType: z.infer<typeof subjectTypeSchema>,
  subjectId: string,
): Promise<string | null> {
  const db = getServiceClient();

  const lookup: Record<string, { schema: string; table: string; column: string }> = {
    // Column names verified against the live schema rather than assumed —
    // inquiry_comments uses sender_id, and jobs uses created_by_user_id. Both
    // of my first guesses were wrong, and wrong here is silent: the report
    // still files, just with nobody attached to it.
    community_post: { schema: "community", table: "posts", column: "author_id" },
    community_comment: { schema: "community", table: "comments", column: "author_id" },
    inquiry_message: { schema: "core", table: "inquiry_comments", column: "sender_id" },
    job: { schema: "core", table: "jobs", column: "created_by_user_id" },
  };

  // Reporting a person: the subject IS the author.
  if (subjectType === "user") return subjectId;

  const target = lookup[subjectType];
  if (!target) return null;

  const { data, error } = await db
    .schema(target.schema)
    .from(target.table)
    .select(target.column)
    .eq("id", subjectId)
    .maybeSingle();

  if (error || !data) return null;
  return (data as Record<string, string | null>)[target.column] ?? null;
}

// ============================================================================
// POST /v1/moderation/reports
// ============================================================================

const createReportRoute = createRoute({
  method: "post",
  path: "/reports",
  tags: ["Moderation"],
  summary: "Report content or a person",
  description:
    "Files a report for moderator review. One open report per reporter per subject; reporting again is allowed once an earlier report is resolved.",
  request: {
    body: {
      content: { "application/json": { schema: createReportSchema } },
    },
  },
  responses: {
    201: {
      description: "Report filed",
      content: { "application/json": { schema: reportSchema } },
    },
    400: {
      description: "Invalid report",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    409: {
      description: "Already reported and still under review",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

app.openapi(createReportRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const body = c.req.valid("json");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  // `other` with no details is an empty report — it tells a moderator nothing
  // and cannot be actioned. Rejecting it is kinder than queueing it.
  if (body.reason === "other" && !body.details?.trim()) {
    return c.json({
      error: "Details required",
      message: "Tell us what is wrong when choosing 'Other'.",
    }, 400);
  }

  const reportedUserId = await resolveAuthor(body.subjectType, body.subjectId);

  if (reportedUserId && reportedUserId === user.id) {
    return c.json({
      error: "Cannot report yourself",
      message: "This is your own content.",
    }, 400);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("content_reports")
    .insert({
      reporter_id: user.id,
      subject_type: body.subjectType,
      subject_id: body.subjectId,
      reported_user_id: reportedUserId,
      reason: body.reason,
      details: body.details?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    // The partial unique index. A second press of the button is not an error
    // the user should see as a failure, so it gets its own status and message.
    if (error.code === "23505") {
      return c.json({
        error: "Already reported",
        message: "You have already reported this, and we are still looking at it.",
      }, 409);
    }
    console.error("Error creating report:", error);
    return c.json({
      error: "Failed to file report",
      message: error.message,
    }, 400);
  }

  return c.json(data, 201);
});

// ============================================================================
// GET /v1/moderation/reports — the reporter's own history
// ============================================================================

const listReportsRoute = createRoute({
  method: "get",
  path: "/reports",
  tags: ["Moderation"],
  summary: "List your own reports",
  request: { query: listQuerySchema },
  responses: {
    200: {
      description: "Your reports",
      content: {
        "application/json": {
          schema: z.object({ data: z.array(reportSchema), total: z.number().int() }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

app.openapi(listReportsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { limit, offset } = c.req.valid("query");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data, error, count } = await supabase
    .schema("core")
    .from("content_reports")
    .select("*", { count: "exact" })
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error listing reports:", error);
    return c.json({ error: "Failed to list reports", message: error.message }, 400);
  }

  return c.json({ data: data || [], total: count || 0 });
});

// ============================================================================
// POST /v1/moderation/blocks
// ============================================================================

const createBlockRoute = createRoute({
  method: "post",
  path: "/blocks",
  tags: ["Moderation"],
  summary: "Block a person",
  description:
    "Takes effect immediately and in both directions — neither of you can reach the other.",
  request: {
    body: { content: { "application/json": { schema: createBlockSchema } } },
  },
  responses: {
    201: {
      description: "Blocked",
      content: { "application/json": { schema: blockSchema } },
    },
    200: {
      description: "Already blocked",
      content: { "application/json": { schema: blockSchema } },
    },
    400: {
      description: "Invalid",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

app.openapi(createBlockRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { userId } = c.req.valid("json");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  if (userId === user.id) {
    return c.json({
      error: "Cannot block yourself",
    }, 400);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("user_blocks")
    .insert({ blocker_id: user.id, blocked_id: userId })
    .select()
    .single();

  if (error) {
    // Blocking someone already blocked is the outcome the user wanted, not a
    // failure. Return the existing row with 200 so the UI can be idempotent.
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .schema("core")
        .from("user_blocks")
        .select()
        .eq("blocker_id", user.id)
        .eq("blocked_id", userId)
        .single();
      if (existing) return c.json(existing, 200);
    }
    console.error("Error creating block:", error);
    return c.json({ error: "Failed to block", message: error.message }, 400);
  }

  return c.json(data, 201);
});

// ============================================================================
// DELETE /v1/moderation/blocks/{userId}
// ============================================================================

const deleteBlockRoute = createRoute({
  method: "delete",
  path: "/blocks/{userId}",
  tags: ["Moderation"],
  summary: "Unblock a person",
  request: { params: z.object({ userId: z.string().uuid() }) },
  responses: {
    204: { description: "Unblocked" },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

app.openapi(deleteBlockRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { userId } = c.req.valid("param");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { error } = await supabase
    .schema("core")
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", userId);

  if (error) {
    console.error("Error removing block:", error);
    return c.json({ error: "Failed to unblock", message: error.message }, 400);
  }

  return c.body(null, 204);
});

// ============================================================================
// GET /v1/moderation/blocks
// ============================================================================

const listBlocksRoute = createRoute({
  method: "get",
  path: "/blocks",
  tags: ["Moderation"],
  summary: "List people you have blocked",
  request: { query: listQuerySchema },
  responses: {
    200: {
      description: "Blocked people",
      content: {
        "application/json": {
          schema: z.object({ data: z.array(blockSchema), total: z.number().int() }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

app.openapi(listBlocksRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { limit, offset } = c.req.valid("query");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data, error, count } = await supabase
    .schema("core")
    .from("user_blocks")
    .select("*", { count: "exact" })
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error listing blocks:", error);
    return c.json({ error: "Failed to list blocks", message: error.message }, 400);
  }

  return c.json({ data: data || [], total: count || 0 });
});

export default app;
