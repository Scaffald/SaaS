/**
 * Education REST API
 * Manages user education entries
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

const educationEntrySchema = z
  .object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    university_id: z.string().uuid().nullable().optional(),
    institution_name: z.string(),
    is_verified: z.boolean().optional(),
    degree_type: z.string().nullable().optional(),
    custom_degree_type: z.string().nullable().optional(),
    field_of_study: z.string().nullable().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    expected_graduation_date: z.string().nullable().optional(),
    is_current: z.boolean().optional(),
    gpa: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .openapi("EducationEntry");

const educationLevelSchema = z
  .object({
    education_level: z.string().nullable(),
  })
  .openapi("EducationLevel");

const saveEducationSchema = z.object({
  education_level: z.string().nullable().optional(),
  education_entries: z.array(educationEntrySchema),
});

const saveEducationResponseSchema = z
  .object({
    success: z.boolean(),
    education_entries: z.array(educationEntrySchema),
  })
  .openapi("SaveEducationResponse");

const deleteEducationSchema = z.object({
  educationId: z.string().uuid(),
});

const deleteEducationResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi("DeleteEducationResponse");

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/profiles/education
 * Get education entries
 */
const getEducationRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Education"],
  summary: "Get education",
  description: "Get education entries for the authenticated user",
  responses: {
    200: {
      description: "Education entries",
      content: {
        "application/json": {
          schema: z.array(educationEntrySchema),
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

app.openapi(getEducationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: entries, error } = await supabase
    .schema("core")
    .from("user_education")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Error fetching education:", error);
    return c.json({
      error: "Failed to fetch education",
      message: error.message,
    }, 500);
  }

  return c.json(entries || []);
});

/**
 * GET /v1/profiles/education/level
 * Get education level
 */
const getEducationLevelRoute = createRoute({
  method: "get",
  path: "/level",
  tags: ["Education"],
  summary: "Get education level",
  description: "Get education level from user profile",
  responses: {
    200: {
      description: "Education level",
      content: {
        "application/json": {
          schema: educationLevelSchema,
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

app.openapi(getEducationLevelRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: profile, error } = await supabase
    .schema("core")
    .from("user_profiles")
    .select("education_level")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching education level:", error);
    return c.json({
      error: "Failed to fetch education level",
      message: error.message,
    }, 500);
  }

  return c.json({
    education_level: profile?.education_level || null,
  });
});

/**
 * POST /v1/profiles/education
 * Save education entries
 */
const saveEducationRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Education"],
  summary: "Save education",
  description: "Create or update education entries in bulk",
  request: {
    body: {
      content: {
        "application/json": {
          schema: saveEducationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Education saved",
      content: {
        "application/json": {
          schema: saveEducationResponseSchema,
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

app.openapi(saveEducationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { education_level, education_entries } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Update education level if provided
  if (education_level !== undefined) {
    await supabase
      .schema("core")
      .from("user_profiles")
      .update({ education_level, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  // Upsert education entries
  const entriesToUpsert = education_entries.map((entry) => ({
    ...entry,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  }));

  const { data: savedEntries, error } = await supabase
    .schema("core")
    .from("user_education")
    .upsert(entriesToUpsert, { onConflict: "id" })
    .select();

  if (error) {
    console.error("Error saving education:", error);
    return c.json(
      { error: "Failed to save education", message: error.message },
      500,
    );
  }

  return c.json({
    success: true,
    education_entries: savedEntries || [],
  });
});

/**
 * POST /v1/profiles/education/delete
 * Delete education entry
 */
const deleteEducationRoute = createRoute({
  method: "post",
  path: "/delete",
  tags: ["Education"],
  summary: "Delete education",
  description: "Delete a single education entry",
  request: {
    body: {
      content: {
        "application/json": {
          schema: deleteEducationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Education deleted",
      content: {
        "application/json": {
          schema: deleteEducationResponseSchema,
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

app.openapi(deleteEducationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { educationId } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .schema("core")
    .from("user_education")
    .delete()
    .eq("id", educationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting education:", error);
    return c.json({
      error: "Failed to delete education",
      message: error.message,
    }, 500);
  }

  return c.json({ success: true });
});

export default app;
