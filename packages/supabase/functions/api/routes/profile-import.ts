/**
 * Profile Import REST API
 * Handles profile data import from various sources (resume, JSON, LinkedIn)
 * Temporary storage with 24-hour TTL
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
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

const importPayloadSchema = z.object({
  general: z.array(z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    headline: z.string().optional(),
    summary: z.string().optional(),
    confidence_score: z.number().optional(),
  })),
  experience: z.array(z.object({
    job_title: z.string(),
    company_name: z.string(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    is_current: z.boolean().optional(),
    confidence_score: z.number().optional(),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    confidence_score: z.number().optional(),
  })),
  skills: z.array(z.object({
    name: z.string(),
    taxonomy: z.string().optional(),
    confidence_score: z.number().optional(),
  })),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string().optional(),
    issue_date: z.string().nullable().optional(),
    confidence_score: z.number().optional(),
  })),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/profiles/import/data
 * Get saved import data
 */
const getImportDataRoute = createRoute({
  method: "get",
  path: "/data",
  tags: ["Profile Import"],
  summary: "Get import data",
  responses: {
    200: {
      description: "Import data metadata",
      content: {
        "application/json": {
          schema: z.object({
            version: z.number(),
            source: z.enum(["resume", "json", "linkedin", "manual"]),
            storedAt: z.string(),
            expiresAt: z.string(),
            payload: importPayloadSchema,
          }).nullable(),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getImportDataRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("profile_import_data")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return c.json(null);
  }

  // Check if expired (24 hours)
  const expiresAt = new Date(data.created_at);
  expiresAt.setHours(expiresAt.getHours() + 24);

  if (new Date() > expiresAt) {
    // Delete expired data
    await supabase
      .schema("core")
      .from("profile_import_data")
      .delete()
      .eq("id", data.id);

    return c.json(null);
  }

  return c.json({
    version: 1,
    source: data.source,
    storedAt: data.created_at,
    expiresAt: expiresAt.toISOString(),
    payload: data.payload,
  });
});

/**
 * POST /v1/profiles/import/data
 * Save import data for review
 */
const saveImportDataRoute = createRoute({
  method: "post",
  path: "/data",
  tags: ["Profile Import"],
  summary: "Save import data",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            payload: importPayloadSchema,
            source: z.enum(["resume", "json", "linkedin", "manual"]),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Import data saved",
      content: {
        "application/json": {
          schema: z.object({
            metadata: z.object({
              version: z.number(),
              source: z.enum(["resume", "json", "linkedin", "manual"]),
              storedAt: z.string(),
              expiresAt: z.string(),
              payload: importPayloadSchema,
            }),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(saveImportDataRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { payload, source } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const storedAt = new Date().toISOString();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Delete any existing import data
  await supabase
    .schema("core")
    .from("profile_import_data")
    .delete()
    .eq("user_id", user.id);

  // Insert new import data
  const { error } = await supabase
    .schema("core")
    .from("profile_import_data")
    .insert({
      user_id: user.id,
      source,
      payload,
    })
    .select()
    .single();

  if (error) {
    return c.json({
      error: "Failed to save import data",
      message: error.message,
    }, 500);
  }

  return c.json({
    metadata: {
      version: 1,
      source,
      storedAt,
      expiresAt: expiresAt.toISOString(),
      payload,
    },
  }, 201);
});

/**
 * DELETE /v1/profiles/import/data
 * Clear saved import data
 */
const clearImportDataRoute = createRoute({
  method: "delete",
  path: "/data",
  tags: ["Profile Import"],
  summary: "Clear import data",
  responses: {
    200: {
      description: "Import data cleared",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(clearImportDataRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .schema("core")
    .from("profile_import_data")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return c.json({
      error: "Failed to clear import data",
      message: error.message,
    }, 500);
  }

  return c.json({ success: true });
});

export default app;
