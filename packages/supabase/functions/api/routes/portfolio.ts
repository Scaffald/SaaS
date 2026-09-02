/**
 * Portfolio REST API
 * Manages user portfolio items - projects, work samples, achievements
 */

import {
  createRoute as createOpenAPIRoute,
  OpenAPIHono,
  z,
} from "@hono/zod-openapi";
import { type ApiEnv, authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono<ApiEnv>();
app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const _errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
}).openapi("ErrorResponse");

const portfolioItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  description: z.unknown().nullable().optional(),
  image_url: z.string().nullable().optional(),
  file_path: z.string().nullable().optional(),
  display_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/profiles/portfolio
 * List portfolio items
 */
const listRoute = createOpenAPIRoute({
  method: "get",
  path: "/",
  tags: ["Portfolio"],
  summary: "List portfolio items",
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: "Portfolio items",
      content: {
        "application/json": {
          schema: z.array(portfolioItemSchema),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(listRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { userId } = c.req.valid("query");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const targetUserId = userId || user.id;

  const { data, error } = await supabase
    .schema("core")
    .from("portfolio_items")
    .select("*")
    .eq("user_id", targetUserId)
    .order("display_order");

  if (error) {
    return c.json({
      error: "Failed to fetch portfolio",
      message: error.message,
    }, 500);
  }

  return c.json(data || []);
});

/**
 * POST /v1/profiles/portfolio
 * Create a new portfolio item
 */
const createRoute = createOpenAPIRoute({
  method: "post",
  path: "/",
  tags: ["Portfolio"],
  summary: "Create portfolio item",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string(),
            description: z.unknown().optional(),
            imageUrl: z.string().optional(),
            filePath: z.string().optional(),
            displayOrder: z.number().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Portfolio item created",
      content: {
        "application/json": {
          schema: portfolioItemSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(createRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const body = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get max display_order
  const { data: maxItem } = await supabase
    .schema("core")
    .from("portfolio_items")
    .select("display_order")
    .eq("user_id", user.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  const displayOrder = body.displayOrder ??
    ((maxItem?.display_order ?? -1) + 1);

  const { data, error } = await supabase
    .schema("core")
    .from("portfolio_items")
    .insert({
      user_id: user.id,
      title: body.title,
      description: body.description,
      image_url: body.imageUrl,
      file_path: body.filePath,
      display_order: displayOrder,
    })
    .select()
    .single();

  if (error) {
    return c.json({
      error: "Failed to create portfolio item",
      message: error.message,
    }, 500);
  }

  return c.json(data, 201);
});

/**
 * PATCH /v1/profiles/portfolio/:id
 * Update a portfolio item
 */
const updateRoute = createOpenAPIRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Portfolio"],
  summary: "Update portfolio item",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().optional(),
            description: z.unknown().optional(),
            imageUrl: z.string().nullable().optional(),
            filePath: z.string().nullable().optional(),
            displayOrder: z.number().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Portfolio item updated",
      content: {
        "application/json": {
          schema: portfolioItemSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(updateRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.imageUrl !== undefined) updates.image_url = body.imageUrl;
  if (body.filePath !== undefined) updates.file_path = body.filePath;
  if (body.displayOrder !== undefined) {
    updates.display_order = body.displayOrder;
  }

  const { data, error } = await supabase
    .schema("core")
    .from("portfolio_items")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return c.json({
      error: "Failed to update portfolio item",
      message: error.message,
    }, 500);
  }

  if (!data) {
    return c.json({ error: "Portfolio item not found" }, 404);
  }

  return c.json(data);
});

/**
 * DELETE /v1/profiles/portfolio/:id
 * Delete a portfolio item
 */
const deleteRoute = createOpenAPIRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Portfolio"],
  summary: "Delete portfolio item",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Portfolio item deleted",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            deletedItem: portfolioItemSchema,
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(deleteRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("portfolio_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return c.json({
      error: "Failed to delete portfolio item",
      message: error.message,
    }, 500);
  }

  if (!data) {
    return c.json({ error: "Portfolio item not found" }, 404);
  }

  return c.json({ success: true, deletedItem: data });
});

/**
 * POST /v1/profiles/portfolio/reorder
 * Reorder portfolio items
 */
const reorderRoute = createOpenAPIRoute({
  method: "post",
  path: "/reorder",
  tags: ["Portfolio"],
  summary: "Reorder portfolio items",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(z.object({
              id: z.string().uuid(),
              displayOrder: z.number(),
            })),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Portfolio items reordered",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            updatedCount: z.number(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(reorderRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { items } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Update each item's display_order
  let updatedCount = 0;
  for (const item of items) {
    const { error } = await supabase
      .schema("core")
      .from("portfolio_items")
      .update({ display_order: item.displayOrder })
      .eq("id", item.id)
      .eq("user_id", user.id);

    if (!error) {
      updatedCount++;
    }
  }

  return c.json({ success: true, updatedCount });
});

export default app;
