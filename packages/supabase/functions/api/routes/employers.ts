/**
 * Employers REST API
 * Employer discovery and interaction with employer organizations
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
 * GET /v1/employers
 * List employers
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Employers"],
    summary: "List employers",
    request: {
      query: z.object({
        search: z.string().optional(),
        industry: z.string().optional(),
        location: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }),
    },
    responses: {
      200: {
        description: "Employers",
        content: {
          "application/json": {
            schema: z.object({
              employers: z.array(z.any()),
              total: z.number(),
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
    const { search, industry, location, limit = 20, offset = 0 } = c.req.valid(
      "query",
    );

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let query = supabase.schema("core").from("organizations").select("*", {
      count: "exact",
    });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (industry) {
      query = query.eq("industry", industry);
    }

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return c.json({
        error: "Failed to fetch employers",
        message: error.message,
      }, 500);
    }

    return c.json({ employers: data || [], total: count || 0 });
  },
);

/**
 * GET /v1/employers/:id
 * Get employer by ID
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Employers"],
    summary: "Get employer",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Employer",
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
    const { id } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase.schema("core").from("organizations")
      .select("*").eq("id", id).single();

    if (error || !data) {
      return c.json({ error: "Employer not found" }, 404);
    }

    return c.json(data);
  },
);

/**
 * GET /v1/employers/employment/status
 * Check employment status
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/employment/status",
    tags: ["Employers"],
    summary: "Get employment status",
    request: {
      query: z.object({
        organizationId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Employment status",
        content: {
          "application/json": {
            schema: z.object({
              isLinked: z.boolean(),
              experienceId: z.string().uuid().nullable(),
              source: z.string().nullable(),
              isCurrent: z.boolean(),
              claimedAt: z.string().nullable(),
              createdAt: z.string().nullable(),
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
    const { organizationId } = c.req.valid("query");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data } = await supabase
      .schema("core")
      .from("user_experience")
      .select("*")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!data) {
      return c.json({
        isLinked: false,
        experienceId: null,
        source: null,
        isCurrent: false,
        claimedAt: null,
        createdAt: null,
      });
    }

    return c.json({
      isLinked: true,
      experienceId: data.id,
      source: "claimed",
      isCurrent: data.is_current || false,
      claimedAt: data.created_at,
      createdAt: data.created_at,
    });
  },
);

/**
 * POST /v1/employers/employment/claim
 * Claim employment
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/employment/claim",
    tags: ["Employers"],
    summary: "Claim employment",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              organizationId: z.string().uuid(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Employment claimed",
        content: {
          "application/json": {
            schema: z.object({
              alreadyLinked: z.boolean().optional(),
              experience: z.any(),
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
    const { organizationId } = c.req.valid("json");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if already exists
    const { data: existing } = await supabase
      .schema("core")
      .from("user_experience")
      .select("*")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (existing) {
      return c.json({ alreadyLinked: true, experience: existing });
    }

    const { data, error } = await supabase
      .schema("core")
      .from("user_experience")
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        source: "claimed",
        is_current: true,
      })
      .select()
      .single();

    if (error) {
      return c.json({
        error: "Failed to claim employment",
        message: error.message,
      }, 500);
    }

    return c.json({ experience: data }, 201);
  },
);

export default app;
