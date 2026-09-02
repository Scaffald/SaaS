/**
 * Experience REST API
 * Manages user work experience/portfolio entries
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { type ApiEnv, authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono<ApiEnv>();

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

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const experienceEntrySchema = z
  .object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    organization_id: z.string().uuid().nullable().optional(),
    job_title: z.string(),
    company_name: z.string(),
    employment_type: z.string().nullable().optional(),
    location: z.union([z.string(), addressSchema]).nullable().optional(),
    is_remote: z.boolean(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    is_current: z.boolean(),
    description: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .openapi("ExperienceEntry");

const experienceSummarySchema = z
  .object({
    career_level: z.string().nullable(),
  })
  .openapi("ExperienceSummary");

const saveExperienceSchema = z.object({
  career_level: z.string().nullable().optional(),
  experience_entries: z.array(experienceEntrySchema),
});

const saveExperienceResponseSchema = z
  .object({
    success: z.boolean(),
    experience_entries: z.array(experienceEntrySchema),
  })
  .openapi("SaveExperienceResponse");

const deleteExperienceSchema = z.object({
  experienceId: z.string().uuid(),
});

const deleteExperienceResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi("DeleteExperienceResponse");

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/profiles/experience
 * Get user's experience entries
 */
const getExperienceRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Experience"],
  summary: "Get experience",
  description: "Get work experience entries for the authenticated user",
  responses: {
    200: {
      description: "Experience entries",
      content: {
        "application/json": {
          schema: z.array(experienceEntrySchema),
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
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getExperienceRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: entries, error } = await supabase
    .schema("core")
    .from("user_experience")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Error fetching experience:", error);
    return c.json({
      error: "Failed to fetch experience",
      message: error.message,
    }, 500);
  }

  return c.json(entries || []);
});

/**
 * GET /v1/profiles/experience/summary
 * Get experience summary (career level)
 */
const getExperienceSummaryRoute = createRoute({
  method: "get",
  path: "/summary",
  tags: ["Experience"],
  summary: "Get experience summary",
  description: "Get career level from user profile",
  responses: {
    200: {
      description: "Experience summary",
      content: {
        "application/json": {
          schema: experienceSummarySchema,
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
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getExperienceSummaryRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: profile, error } = await supabase
    .schema("core")
    .from("user_profiles")
    .select("career_level")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching experience summary:", error);
    return c.json({
      error: "Failed to fetch experience summary",
      message: error.message,
    }, 500);
  }

  return c.json({
    career_level: profile?.career_level ?? null,
  });
});

/**
 * POST /v1/profiles/experience
 * Save experience entries (bulk create/update)
 */
const saveExperienceRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Experience"],
  summary: "Save experience",
  description: "Create or update experience entries in bulk",
  request: {
    body: {
      content: {
        "application/json": {
          schema: saveExperienceSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Experience saved",
      content: {
        "application/json": {
          schema: saveExperienceResponseSchema,
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
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(saveExperienceRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { career_level, experience_entries } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Update career level if provided
  if (career_level !== undefined) {
    await supabase
      .schema("core")
      .from("user_profiles")
      .update({ career_level, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  // Upsert experience entries
  const entriesToUpsert = experience_entries.map((entry) => ({
    ...entry,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  }));

  const { data: savedEntries, error } = await supabase
    .schema("core")
    .from("user_experience")
    .upsert(entriesToUpsert, { onConflict: "id" })
    .select();

  if (error) {
    console.error("Error saving experience:", error);
    return c.json({
      error: "Failed to save experience",
      message: error.message,
    }, 500);
  }

  return c.json({
    success: true,
    experience_entries: savedEntries || [],
  });
});

/**
 * POST /v1/profiles/experience/delete
 * Delete experience entry
 */
const deleteExperienceRoute = createRoute({
  method: "post",
  path: "/delete",
  tags: ["Experience"],
  summary: "Delete experience",
  description: "Delete a single experience entry",
  request: {
    body: {
      content: {
        "application/json": {
          schema: deleteExperienceSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Experience deleted",
      content: {
        "application/json": {
          schema: deleteExperienceResponseSchema,
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
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(deleteExperienceRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { experienceId } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .schema("core")
    .from("user_experience")
    .delete()
    .eq("id", experienceId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting experience:", error);
    return c.json({
      error: "Failed to delete experience",
      message: error.message,
    }, 500);
  }

  return c.json({ success: true });
});

export default app;
