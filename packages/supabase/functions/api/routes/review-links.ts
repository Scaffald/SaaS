/**
 * Review Links REST API (SC-38)
 *
 * Shareable, no-auth-required review request tokens. A worker generates
 * a link, sends it to a former employer / instructor / foreman / client
 * via text/email/QR. The recipient submits a review WITHOUT creating a
 * Scaffald account.
 *
 * Endpoints:
 *   POST   /v1/reviews/links                                (auth)   create a link
 *   GET    /v1/reviews/links                                (auth)   list my links
 *   DELETE /v1/reviews/links/:id                            (auth)   revoke a link
 *   GET    /v1/reviews/links/by-token/:token                (anon)   validate + return subject
 *   POST   /v1/reviews/links/by-token/:token/submit         (anon)   submit a review
 *
 * Anonymous submissions are inserted into `core.reviews` with
 * `author_user_id = NULL`. Real reviewer identity (name, optional
 * email, relationship) lives in `metadata.reviewer_*` and the link id
 * is mirrored to `metadata.via_review_link` for audit.
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.ts";

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

function generateToken(): string {
  // 32 hex chars from a v4 UUID, no dashes. ~128 bits of entropy, safe
  // to embed in a URL.
  return crypto.randomUUID().replace(/-/g, "");
}

function buildShareUrl(token: string): string {
  const base = Deno.env.get("PUBLIC_APP_URL") ?? "https://scaffald.com";
  return `${base.replace(/\/$/, "")}/reviews/${token}`;
}

const RELATIONSHIP_VALUES = [
  "instructor",
  "manager",
  "coworker",
  "client",
  "foreman",
  "supervisor",
  "other",
] as const;

const app = new OpenAPIHono();
app.use("*", authMiddleware);

// ============================================================================
// POST /v1/reviews/links — create a new review link
// ============================================================================
app.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Reviews"],
    summary: "Create a shareable review link",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              label: z.string().max(120).optional(),
              expires_at: z.string().datetime().optional(),
              max_uses: z.number().int().positive().max(1000).optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Review link created",
        content: { "application/json": { schema: z.any() } },
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

    const token = generateToken();

    const { data, error } = await supabase
      .schema("core")
      .from("review_links")
      .insert({
        subject_user_id: user.id,
        token,
        label: body.label ?? null,
        expires_at: body.expires_at ?? null,
        max_uses: body.max_uses ?? null,
      })
      .select("id, token, label, expires_at, max_uses, used_count, created_at")
      .single();

    if (error) {
      return c.json(
        { error: "Failed to create review link", message: error.message },
        500,
      );
    }

    return c.json({ ...data, share_url: buildShareUrl(data.token) }, 201);
  },
);

// ============================================================================
// GET /v1/reviews/links — list my active links
// ============================================================================
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Reviews"],
    summary: "List my shareable review links",
    responses: {
      200: {
        description: "Review links",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("review_links")
      .select(
        "id, token, label, expires_at, max_uses, used_count, is_revoked, created_at",
      )
      // RLS already scopes this to the caller, but this select had no filter at
      // all, so the policy was the only thing between a caller and every share
      // link on the platform. Two independent guards, since a token is the only
      // secret protecting a review link.
      .eq("subject_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return c.json(
        { error: "Failed to fetch review links", message: error.message },
        500,
      );
    }

    const enriched = (data ?? []).map((row) => ({
      ...row,
      share_url: buildShareUrl(row.token),
    }));

    return c.json(enriched);
  },
);

// ============================================================================
// DELETE /v1/reviews/links/:id — revoke a link
// ============================================================================
app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["Reviews"],
    summary: "Revoke a review link",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Revoked",
        content: {
          "application/json": { schema: z.object({ success: z.boolean() }) },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("review_links")
      .update({ is_revoked: true })
      .eq("id", id)
      .eq("subject_user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return c.json(
        { error: "Failed to revoke", message: error.message },
        500,
      );
    }

    // The predicate above matches nothing when the link belongs to someone
    // else, and an UPDATE that changes no rows is not an error — so without
    // this, revoking another user's link answered 200 and did nothing. 404
    // rather than 403, so the response does not confirm the link exists.
    if (!data) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json({ success: true });
  },
);

// ============================================================================
// GET /v1/reviews/links/by-token/:token — anon validation + subject lookup
// ============================================================================
app.openapi(
  createRoute({
    method: "get",
    path: "/by-token/{token}",
    tags: ["Reviews"],
    summary: "Validate a review token + return subject info (anon)",
    request: {
      params: z.object({ token: z.string().min(16).max(128) }),
    },
    responses: {
      200: {
        description: "Token valid",
        content: { "application/json": { schema: z.any() } },
      },
      404: { description: "Token invalid or expired" },
    },
  }),
  async (c) => {
    // Anon route — use the service client so RLS doesn't block the join.
    const service = getServiceClient();
    const { token } = c.req.valid("param");

    const { data: link, error: linkError } = await service
      .schema("core")
      .from("review_links")
      .select(
        "id, subject_user_id, label, expires_at, max_uses, used_count, is_revoked",
      )
      .eq("token", token)
      .maybeSingle();

    if (linkError) {
      return c.json(
        { error: "Lookup failed", message: linkError.message },
        500,
      );
    }
    if (!link) {
      return c.json({ error: "Invalid token" }, 404);
    }
    if (link.is_revoked) {
      return c.json({ error: "This link has been revoked" }, 404);
    }
    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
      return c.json({ error: "This link has expired" }, 404);
    }
    if (link.max_uses && link.used_count >= link.max_uses) {
      return c.json({ error: "This link has reached its use limit" }, 404);
    }

    const { data: subject, error: subjectError } = await service
      .schema("core")
      .from("users")
      .select("id, display_name, username, slug, avatar_path, headline")
      .eq("id", link.subject_user_id)
      .maybeSingle();

    if (subjectError || !subject) {
      return c.json({ error: "Subject not found" }, 404);
    }

    return c.json({
      link: {
        id: link.id,
        label: link.label,
        expires_at: link.expires_at,
      },
      subject: {
        id: subject.id,
        display_name: subject.display_name ?? subject.username,
        slug: subject.slug,
        avatar_path: subject.avatar_path,
        headline: subject.headline,
      },
    });
  },
);

// ============================================================================
// POST /v1/reviews/links/by-token/:token/submit — anon review submission
// ============================================================================
app.openapi(
  createRoute({
    method: "post",
    path: "/by-token/{token}/submit",
    tags: ["Reviews"],
    summary: "Submit a review via a shared token (anon)",
    request: {
      params: z.object({ token: z.string().min(16).max(128) }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              reviewer_name: z.string().min(1).max(120),
              reviewer_email: z.string().email().optional(),
              reviewer_relationship: z.enum(RELATIONSHIP_VALUES),
              rating: z.number().int().min(1).max(5),
              body: z.string().min(1).max(2000),
              headline: z.string().max(200).optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Review submitted",
        content: {
          "application/json": {
            schema: z.object({
              review_id: z.string(),
              subject_slug: z.string().nullable(),
            }),
          },
        },
      },
      404: { description: "Token invalid or expired" },
    },
  }),
  async (c) => {
    const service = getServiceClient();
    const { token } = c.req.valid("param");
    const body = c.req.valid("json");

    // Re-validate the token inside the transaction window. Anon
    // callers can hammer this endpoint, so the API layer is the
    // only place we can apply per-token consumption limits.
    const { data: link, error: linkError } = await service
      .schema("core")
      .from("review_links")
      .select(
        "id, subject_user_id, expires_at, max_uses, used_count, is_revoked",
      )
      .eq("token", token)
      .maybeSingle();

    if (linkError) {
      return c.json(
        { error: "Lookup failed", message: linkError.message },
        500,
      );
    }
    if (!link || link.is_revoked) {
      return c.json({ error: "Invalid token" }, 404);
    }
    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
      return c.json({ error: "This link has expired" }, 404);
    }
    if (link.max_uses && link.used_count >= link.max_uses) {
      return c.json({ error: "This link has reached its use limit" }, 404);
    }

    // Light dedup: if the reviewer provided an email, block a second
    // submission from the same email against the same link. Best-effort
    // only — we don't have anti-spam yet.
    if (body.reviewer_email) {
      const { data: existing } = await service
        .schema("core")
        .from("reviews")
        .select("id")
        .is("author_user_id", null)
        .eq("subject_type", "user")
        .eq("subject_id", link.subject_user_id)
        .filter("metadata->>via_review_link", "eq", link.id)
        .filter(
          "metadata->>reviewer_email",
          "eq",
          body.reviewer_email.toLowerCase(),
        )
        .maybeSingle();
      if (existing) {
        return c.json(
          { error: "You have already submitted a review with this link" },
          409,
        );
      }
    }

    // Atomic slot claim — only succeeds if no concurrent submission has
    // incremented `used_count` since we read it. This is the
    // single source of truth for max_uses enforcement; the earlier
    // validation block produces nicer error messages but cannot be
    // trusted against concurrent traffic on the same token.
    //
    // PostgREST translates chained `.eq()` filters into a `WHERE`
    // clause; combined with the matching `used_count` predicate, this
    // is a compare-and-swap. If another caller has incremented in the
    // window between SELECT and UPDATE, the predicate misses, the
    // update affects 0 rows, and we refuse the submission.
    const { data: claimed, error: claimError } = await service
      .schema("core")
      .from("review_links")
      .update({
        used_count: link.used_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", link.id)
      .eq("used_count", link.used_count)
      .eq("is_revoked", false)
      .select("id")
      .maybeSingle();

    if (claimError) {
      return c.json(
        { error: "Failed to claim slot", message: claimError.message },
        500,
      );
    }
    if (!claimed) {
      // Another submission landed in the validation window, OR the link
      // was revoked between our SELECT and UPDATE. Either way the
      // caller should re-try (which will fail validation cleanly).
      return c.json(
        {
          error:
            "This link was just used by someone else. Please ask for a new one.",
        },
        409,
      );
    }

    const metadata = {
      status: "submitted" as const,
      via_review_link: link.id,
      reviewer_name: body.reviewer_name.trim(),
      reviewer_email: body.reviewer_email?.toLowerCase() ?? null,
      reviewer_relationship: body.reviewer_relationship,
      submitted_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await service
      .schema("core")
      .from("reviews")
      .insert({
        kind: "review",
        subject_type: "user",
        subject_id: link.subject_user_id,
        author_user_id: null,
        rating: body.rating,
        headline: body.headline ?? null,
        body: body.body,
        metadata,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      // The slot was already claimed (used_count incremented). Refund
      // it so the link doesn't burn a slot on a failed write — best
      // effort; if this fails too, the worst case is one wasted slot.
      await service
        .schema("core")
        .from("review_links")
        .update({
          used_count: link.used_count,
          updated_at: new Date().toISOString(),
        })
        .eq("id", link.id)
        .eq("used_count", link.used_count + 1);

      return c.json(
        {
          error: "Failed to submit review",
          message: insertError?.message ?? "Unknown error",
        },
        500,
      );
    }

    // Look up the slug so the success screen can deep-link to the
    // public profile.
    const { data: subject } = await service
      .schema("core")
      .from("users")
      .select("slug")
      .eq("id", link.subject_user_id)
      .maybeSingle();

    return c.json(
      { review_id: inserted.id, subject_slug: subject?.slug ?? null },
      201,
    );
  },
);

export default app;
