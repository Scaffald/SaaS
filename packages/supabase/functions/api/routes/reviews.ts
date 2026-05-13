/**
 * Reviews REST API
 * Peer review system for users and organizations
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono();
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

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { error } = await supabase
      .schema("core")
      .from("reviews")
      .update({
        rating: recommendation,
        metadata: { status: "submitted" },
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

export default app;
