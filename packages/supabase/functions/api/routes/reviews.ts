/**
 * Reviews REST API
 * Peer review system for users and organizations
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { type ApiEnv, authMiddleware } from "../middleware/auth.ts";
import { isDraft, loadOwnReview, mergeMetadata } from "../lib/review-drafts.ts";

const app = new OpenAPIHono<ApiEnv>();
app.use("*", authMiddleware);

const _errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

/**
 * GET /reviews/soft-skills
 * Get soft skills list
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/soft-skills",
    tags: ["Reviews"],
    summary: "Get soft skills",
    request: {
      query: z.object({
        category: z.enum([
          "reliability",
          "collaboration",
          "professionalism",
          "technical",
        ]).optional(),
      }),
    },
    responses: {
      200: {
        description: "Soft skills",
        content: {
          "application/json": {
            schema: z.array(z.any()),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { category } = c.req.valid("query");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let query = supabase.schema("core").from("soft_skills").select("*").eq(
      "is_active",
      true,
    );

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query.order("order_index");

    if (error) {
      return c.json({
        error: "Failed to fetch soft skills",
        message: error.message,
      }, 500);
    }

    return c.json(data || []);
  },
);

/**
 * POST /reviews/drafts
 * Create review draft
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/drafts",
    tags: ["Reviews"],
    summary: "Create review draft",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              subject_id: z.string().uuid(),
              subject_type: z.enum(["user", "organization"]),
              context: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Review draft created",
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

    const { data, error } = await supabase
      .schema("core")
      .from("reviews")
      .insert({
        author_user_id: user.id,
        subject_id: body.subject_id,
        subject_type: body.subject_type,
        metadata: { context: body.context, status: "draft" },
      })
      .select()
      .single();

    if (error) {
      return c.json(
        { error: "Failed to create draft", message: error.message },
        500,
      );
    }

    return c.json(data, 201);
  },
);

/**
 * GET /reviews/by-subject
 * Get reviews by subject
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/by-subject",
    tags: ["Reviews"],
    summary: "Get reviews by subject",
    request: {
      query: z.object({
        subject_id: z.string().uuid(),
        subject_type: z.enum(["user", "organization"]),
        status: z.enum(["draft", "submitted", "released"]).optional(),
      }),
    },
    responses: {
      200: {
        description: "Reviews",
        content: {
          "application/json": {
            schema: z.array(z.any()),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { subject_id, subject_type, status } = c.req.valid("query");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let query = supabase.schema("core").from("reviews").select("*").eq(
      "subject_id",
      subject_id,
    ).eq("subject_type", subject_type);

    if (status) {
      query = query.eq("metadata->>status", status);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({
        error: "Failed to fetch reviews",
        message: error.message,
      }, 500);
    }

    return c.json(data || []);
  },
);

/**
 * POST /reviews/:reviewId/submit
 * Submit review
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/{reviewId}/submit",
    tags: ["Reviews"],
    summary: "Submit review",
    request: {
      params: z.object({ reviewId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              recommendation: z.number(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Review submitted",
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
    const { reviewId } = c.req.valid("param");
    const { recommendation } = c.req.valid("json");

    // Load first so the metadata merge above has something to merge into, and
    // so a review belonging to someone else is a 404 rather than an edit.
    const { review: existing, error: loadError } = await loadOwnReview(
      supabase,
      reviewId,
      user?.id ?? "",
    );
    if (loadError) {
      return c.json(
        { error: "Failed to load review", message: loadError },
        500,
      );
    }
    if (!existing) {
      return c.json(
        {
          error: "Not found",
          message: "No review with that id belongs to you",
        },
        404,
      );
    }

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { error } = await supabase
      .schema("core")
      .from("reviews")
      .update({
        rating: recommendation,
        // Merge. A plain object here replaced the whole column, discarding the
        // draft body, the wizard's step progress and the is_public flag the
        // comment step had just written — everything the reviewer filled in was
        // dropped at the moment they submitted it.
        metadata: mergeMetadata(existing?.metadata, { status: "submitted" }),
      })
      .eq("id", reviewId)
      .eq("author_user_id", user.id);

    if (error) {
      return c.json({
        error: "Failed to submit review",
        message: error.message,
      }, 500);
    }

    return c.json({ success: true });
  },
);

// ============================================================================
// Draft editing — the surface ReviewWizard drives
//
// These ten routes existed in @scaffald/sdk and nowhere else, so every step of
// the review wizard 404'd (#447). core.reviews and its five child tables were
// already in place; this wires them up.
//
// Literal paths are registered before /{reviewId}/* of the same method on
// purpose: this router matches in declaration order, so a literal declared
// after a sibling param route is unreachable and surfaces as a validation
// error about a param the caller never sent. GET /v1/work-logs/public-feed
// reported "Invalid uuid: workLogId" for exactly that reason.
// ============================================================================

const NOT_FOUND = {
  error: "Not found",
  message: "No draft review with that id belongs to you",
} as const;

/**
 * GET /reviews/my-reviews
 * Reviews authored by the caller.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/my-reviews",
    tags: ["Reviews"],
    summary: "List reviews I have written",
    responses: {
      200: {
        description: "Reviews authored by the caller",
        content: {
          "application/json": {
            schema: z.object({ reviews: z.array(z.any()) }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase
      .schema("core")
      .from("reviews")
      .select("*")
      .eq("author_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return c.json(
        { error: "Failed to fetch reviews", message: error.message },
        500,
      );
    }

    return c.json({ reviews: data ?? [] });
  },
);

/**
 * GET /reviews/soft-skills/by-category
 * The same catalog as /soft-skills, grouped for the wizard's category tabs.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/soft-skills/by-category",
    tags: ["Reviews"],
    summary: "Soft skills grouped by category",
    responses: {
      200: {
        description: "Soft skills keyed by category",
        content: { "application/json": { schema: z.record(z.array(z.any())) } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase
      .schema("core")
      .from("soft_skills")
      .select("*")
      .eq("is_active", true)
      .order("order_index");

    if (error) {
      return c.json(
        { error: "Failed to fetch soft skills", message: error.message },
        500,
      );
    }

    const grouped: Record<string, unknown[]> = {};
    for (const skill of data ?? []) {
      const key = (skill as { category?: string }).category ?? "other";
      const bucket = grouped[key] ?? [];
      bucket.push(skill);
      grouped[key] = bucket;
    }

    return c.json(grouped);
  },
);

/**
 * GET /reviews/{reviewId}/draft
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{reviewId}/draft",
    tags: ["Reviews"],
    summary: "Get a draft review",
    request: { params: z.object({ reviewId: z.string().uuid() }) },
    responses: {
      200: {
        description: "The draft",
        content: { "application/json": { schema: z.any() } },
      },
      404: {
        description: "No such draft for this author",
        content: { "application/json": { schema: _errorResponseSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { reviewId } = c.req.valid("param");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { review, error } = await loadOwnReview(supabase, reviewId, user.id);
    if (error) {
      return c.json({ error: "Failed to load draft", message: error }, 500);
    }
    if (!review) return c.json(NOT_FOUND, 404);

    return c.json(review);
  },
);

/**
 * PATCH /reviews/{reviewId}/draft
 * Whole-blob autosave from the wizard.
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/{reviewId}/draft",
    tags: ["Reviews"],
    summary: "Save a draft review",
    request: {
      params: z.object({ reviewId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({ draft: z.record(z.unknown()) }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Saved",
        content: {
          "application/json": { schema: z.object({ success: z.boolean() }) },
        },
      },
      404: {
        description: "No such draft for this author",
        content: { "application/json": { schema: _errorResponseSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { reviewId } = c.req.valid("param");
    const { draft } = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { review, error } = await loadOwnReview(supabase, reviewId, user.id, {
      requireDraft: true,
    });
    if (error) {
      return c.json({ error: "Failed to load draft", message: error }, 500);
    }
    if (!review) return c.json(NOT_FOUND, 404);

    const { error: updateError } = await supabase
      .schema("core")
      .from("reviews")
      .update({
        metadata: mergeMetadata(review.metadata, { draft }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (updateError) {
      return c.json(
        { error: "Failed to save draft", message: updateError.message },
        500,
      );
    }

    return c.json({ success: true });
  },
);

/**
 * PATCH /reviews/{reviewId}/step
 * Wizard progress, so a half-finished review reopens where it was left.
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/{reviewId}/step",
    tags: ["Reviews"],
    summary: "Update wizard step",
    request: {
      params: z.object({ reviewId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              step: z.string().min(1).max(64),
              data: z.record(z.unknown()),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Saved",
        content: {
          "application/json": { schema: z.object({ success: z.boolean() }) },
        },
      },
      404: {
        description: "No such draft for this author",
        content: { "application/json": { schema: _errorResponseSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { reviewId } = c.req.valid("param");
    const { step, data } = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { review, error } = await loadOwnReview(supabase, reviewId, user.id, {
      requireDraft: true,
    });
    if (error) {
      return c.json({ error: "Failed to load draft", message: error }, 500);
    }
    if (!review) return c.json(NOT_FOUND, 404);

    const steps = mergeMetadata(
      (review.metadata?.["steps"] as Record<string, unknown>) ?? {},
      { [step]: data },
    );

    const { error: updateError } = await supabase
      .schema("core")
      .from("reviews")
      .update({
        metadata: mergeMetadata(review.metadata, {
          current_step: step,
          steps,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (updateError) {
      return c.json(
        { error: "Failed to update step", message: updateError.message },
        500,
      );
    }

    return c.json({ success: true });
  },
);

/**
 * PATCH /reviews/{reviewId}/skill-ratings
 * Technical skill scores. Replaces the set rather than merging: the wizard
 * sends the full list each time, and a merge would strand a skill the reviewer
 * removed.
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/{reviewId}/skill-ratings",
    tags: ["Reviews"],
    summary: "Update skill ratings",
    request: {
      params: z.object({ reviewId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              ratings: z.array(z.object({
                skill_id: z.string().uuid(),
                score: z.number().int().min(0).max(5),
              })).max(200),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Saved",
        content: {
          "application/json": { schema: z.object({ success: z.boolean() }) },
        },
      },
      404: {
        description: "No such draft for this author",
        content: { "application/json": { schema: _errorResponseSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { reviewId } = c.req.valid("param");
    const { ratings } = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { review, error } = await loadOwnReview(supabase, reviewId, user.id, {
      requireDraft: true,
    });
    if (error) {
      return c.json({ error: "Failed to load draft", message: error }, 500);
    }
    if (!review) return c.json(NOT_FOUND, 404);

    const { error: deleteError } = await supabase
      .schema("core")
      .from("review_skill_ratings")
      .delete()
      .eq("review_id", reviewId);

    if (deleteError) {
      return c.json(
        {
          error: "Failed to update skill ratings",
          message: deleteError.message,
        },
        500,
      );
    }

    if (ratings.length > 0) {
      const { error: insertError } = await supabase
        .schema("core")
        .from("review_skill_ratings")
        .insert(
          ratings.map((r) => ({
            review_id: reviewId,
            skill_id: r.skill_id,
            score: r.score,
          })),
        );

      if (insertError) {
        return c.json(
          {
            error: "Failed to update skill ratings",
            message: insertError.message,
          },
          500,
        );
      }
    }

    return c.json({ success: true });
  },
);

/**
 * PATCH /reviews/{reviewId}/category-rating
 * One category at a time — the wizard rates them on separate screens.
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/{reviewId}/category-rating",
    tags: ["Reviews"],
    summary: "Update a category rating",
    request: {
      params: z.object({ reviewId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              category: z.enum([
                "skills",
                "reliability",
                "collaboration",
                "professionalism",
                "technical",
              ]),
              rating: z.number().int().min(0).max(5),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Saved",
        content: {
          "application/json": { schema: z.object({ success: z.boolean() }) },
        },
      },
      404: {
        description: "No such draft for this author",
        content: { "application/json": { schema: _errorResponseSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { reviewId } = c.req.valid("param");
    const { category, rating } = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { review, error } = await loadOwnReview(supabase, reviewId, user.id, {
      requireDraft: true,
    });
    if (error) {
      return c.json({ error: "Failed to load draft", message: error }, 500);
    }
    if (!review) return c.json(NOT_FOUND, 404);

    // (review_id, category) is the natural key — rating a category twice is an
    // edit, not a second opinion.
    const { error: upsertError } = await supabase
      .schema("core")
      .from("review_category_ratings")
      .upsert(
        { review_id: reviewId, category, rating },
        { onConflict: "review_id,category" },
      );

    if (upsertError) {
      return c.json(
        {
          error: "Failed to update category rating",
          message: upsertError.message,
        },
        500,
      );
    }

    return c.json({ success: true });
  },
);

/**
 * PATCH /reviews/{reviewId}/soft-skill-votes
 * Strengths and improvements. Replaced wholesale, same reasoning as skills.
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/{reviewId}/soft-skill-votes",
    tags: ["Reviews"],
    summary: "Update soft skill votes",
    request: {
      params: z.object({ reviewId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              votes: z.array(z.object({
                skill_id: z.string().uuid(),
                rating: z.number().int().min(0).max(5).optional(),
                is_strength: z.boolean(),
                notes: z.string().max(1000).optional(),
              })).max(200),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Saved",
        content: {
          "application/json": { schema: z.object({ success: z.boolean() }) },
        },
      },
      404: {
        description: "No such draft for this author",
        content: { "application/json": { schema: _errorResponseSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { reviewId } = c.req.valid("param");
    const { votes } = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { review, error } = await loadOwnReview(supabase, reviewId, user.id, {
      requireDraft: true,
    });
    if (error) {
      return c.json({ error: "Failed to load draft", message: error }, 500);
    }
    if (!review) return c.json(NOT_FOUND, 404);

    const { error: deleteError } = await supabase
      .schema("core")
      .from("review_soft_skill_votes")
      .delete()
      .eq("review_id", reviewId);

    if (deleteError) {
      return c.json(
        { error: "Failed to update votes", message: deleteError.message },
        500,
      );
    }

    if (votes.length > 0) {
      const { error: insertError } = await supabase
        .schema("core")
        .from("review_soft_skill_votes")
        .insert(
          votes.map((v) => ({
            review_id: reviewId,
            skill_id: v.skill_id,
            rating: v.rating ?? null,
            is_strength: v.is_strength,
            notes: v.notes ?? null,
          })),
        );

      if (insertError) {
        return c.json(
          { error: "Failed to update votes", message: insertError.message },
          500,
        );
      }
    }

    return c.json({ success: true });
  },
);

/**
 * PATCH /reviews/{reviewId}/comment
 * The free-text body, plus whether it is shown publicly.
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/{reviewId}/comment",
    tags: ["Reviews"],
    summary: "Update the review comment",
    request: {
      params: z.object({ reviewId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              comment: z.string().max(5000),
              is_public: z.boolean(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Saved",
        content: {
          "application/json": { schema: z.object({ success: z.boolean() }) },
        },
      },
      404: {
        description: "No such draft for this author",
        content: { "application/json": { schema: _errorResponseSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { reviewId } = c.req.valid("param");
    const { comment, is_public } = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { review, error } = await loadOwnReview(supabase, reviewId, user.id, {
      requireDraft: true,
    });
    if (error) {
      return c.json({ error: "Failed to load draft", message: error }, 500);
    }
    if (!review) return c.json(NOT_FOUND, 404);

    const { error: updateError } = await supabase
      .schema("core")
      .from("reviews")
      .update({
        body: comment,
        metadata: mergeMetadata(review.metadata, { is_public }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (updateError) {
      return c.json(
        { error: "Failed to update comment", message: updateError.message },
        500,
      );
    }

    return c.json({ success: true });
  },
);

/**
 * GET /reviews/analytics
 * Aggregate view of everything written about one subject.
 *
 * Drafts are excluded throughout — an unsubmitted review is one person's
 * unfinished opinion and must not move a public average.
 *
 * `reviews.rating` holds the recommendation (-1 or 1) rather than a 0-5 score;
 * that is what POST /{reviewId}/submit writes, and the per-category scores live
 * in review_category_ratings.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/analytics",
    tags: ["Reviews"],
    summary: "Aggregate review analytics for a subject",
    request: {
      query: z.object({
        subjectId: z.string().uuid(),
        subjectType: z.enum(["user", "organization"]).optional(),
      }),
    },
    responses: {
      200: {
        description: "Analytics",
        content: { "application/json": { schema: z.any() } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { subjectId, subjectType } = c.req.valid("query");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    let reviewQuery = supabase
      .schema("core")
      .from("reviews")
      .select("id, rating, created_at, metadata")
      .eq("subject_id", subjectId);
    if (subjectType) reviewQuery = reviewQuery.eq("subject_type", subjectType);

    const { data: allReviews, error } = await reviewQuery;
    if (error) {
      return c.json(
        { error: "Failed to load reviews", message: error.message },
        500,
      );
    }

    const reviews = (allReviews ?? []).filter(
      (r: { metadata?: Record<string, unknown> }) =>
        (r.metadata ?? {})["status"] === "submitted",
    );
    const reviewIds = reviews.map((r: { id: string }) => r.id);

    const empty = {
      overall: {
        totalReviews: 0,
        recommendCount: 0,
        notRecommendCount: 0,
        recommendPercentage: 0,
      },
      skills: [],
      categories: [],
      tags: { strengths: [], improvements: [] },
      timeline: [],
    };
    if (reviewIds.length === 0) return c.json(empty);

    const [categoryRes, skillRes, voteRes] = await Promise.all([
      supabase.schema("core").from("review_category_ratings")
        .select("category, rating").in("review_id", reviewIds),
      supabase.schema("core").from("review_skill_ratings")
        .select("skill_id, score").in("review_id", reviewIds),
      supabase.schema("core").from("review_soft_skill_votes")
        .select("skill_id, is_strength").in("review_id", reviewIds),
    ]);

    const recommendCount = reviews.filter(
      (r: { rating: number | null }) => (r.rating ?? 0) > 0,
    ).length;
    const notRecommendCount = reviews.filter(
      (r: { rating: number | null }) => (r.rating ?? 0) < 0,
    ).length;

    // category -> running total + count, so one pass gives both average and
    // frequency without holding every row.
    const catAcc = new Map<string, { total: number; n: number }>();
    for (const row of categoryRes.data ?? []) {
      const k = (row as { category: string }).category;
      const cur = catAcc.get(k) ?? { total: 0, n: 0 };
      cur.total += (row as { rating: number }).rating ?? 0;
      cur.n += 1;
      catAcc.set(k, cur);
    }

    const skillAcc = new Map<string, { total: number; n: number }>();
    for (const row of skillRes.data ?? []) {
      const k = (row as { skill_id: string }).skill_id;
      const cur = skillAcc.get(k) ?? { total: 0, n: 0 };
      cur.total += (row as { score: number }).score ?? 0;
      cur.n += 1;
      skillAcc.set(k, cur);
    }

    const strengthAcc = new Map<string, number>();
    const improvementAcc = new Map<string, number>();
    for (const row of voteRes.data ?? []) {
      const v = row as { skill_id: string; is_strength: boolean };
      const target = v.is_strength ? strengthAcc : improvementAcc;
      target.set(v.skill_id, (target.get(v.skill_id) ?? 0) + 1);
    }

    // Resolve names in one query rather than per skill.
    const softIds = [
      ...new Set([...strengthAcc.keys(), ...improvementAcc.keys()]),
    ];
    const skillIds = [...skillAcc.keys()];
    const [softNames, hardNames] = await Promise.all([
      softIds.length
        ? supabase.schema("core").from("soft_skills")
          .select("id, name, category").in("id", softIds)
        : Promise.resolve({ data: [] }),
      // core.skills, not data.masterformat: review_skill_ratings.skill_id has a
      // foreign key to core.skills, so that is the only table whose ids can
      // appear here. Joining masterformat would silently yield blank names.
      skillIds.length
        ? supabase.schema("core").from("skills")
          .select("id, name").in("id", skillIds)
        : Promise.resolve({ data: [] }),
    ]);
    const softName = new Map(
      (softNames.data ?? []).map((
        s: { id: string; name: string; category: string },
      ) => [s.id, s]),
    );
    const hardName = new Map(
      (hardNames.data ?? []).map((
        s: { id: string; name: string },
      ) => [s.id, s.name]),
    );

    const monthAcc = new Map<string, { count: number; total: number }>();
    for (const r of reviews) {
      const month = String((r as { created_at: string }).created_at).slice(
        0,
        7,
      );
      const cur = monthAcc.get(month) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += (r as { rating: number | null }).rating ?? 0;
      monthAcc.set(month, cur);
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;

    return c.json({
      overall: {
        totalReviews: reviews.length,
        recommendCount,
        notRecommendCount,
        recommendPercentage: reviews.length
          ? Math.round((recommendCount / reviews.length) * 100)
          : 0,
      },
      skills: [...skillAcc.entries()].map(([skillId, v]) => ({
        skillId,
        skillName: hardName.get(skillId) ?? "",
        averageRating: round2(v.total / v.n),
        frequency: v.n,
      })).sort((a, b) => b.frequency - a.frequency),
      categories: [...catAcc.entries()].map(([category, v]) => ({
        category,
        averageRating: round2(v.total / v.n),
        frequency: v.n,
      })).sort((a, b) => b.frequency - a.frequency),
      tags: {
        strengths: [...strengthAcc.entries()].map(([id, count]) => ({
          name: softName.get(id)?.name ?? "",
          count,
          category: softName.get(id)?.category ?? "",
        })).sort((a, b) => b.count - a.count),
        improvements: [...improvementAcc.entries()].map(([id, count]) => ({
          name: softName.get(id)?.name ?? "",
          count,
          category: softName.get(id)?.category ?? "",
        })).sort((a, b) => b.count - a.count),
      },
      timeline: [...monthAcc.entries()].map(([month, v]) => ({
        month,
        count: v.count,
        avgRating: round2(v.total / v.count),
        totalRating: v.total,
      })).sort((a, b) => a.month.localeCompare(b.month)),
    });
  },
);

export default app;
