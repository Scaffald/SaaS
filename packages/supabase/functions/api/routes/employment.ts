/**
 * Employment REST API
 * Manages employment preferences (work authorization, travel, hourly rate, etc.)
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

const employmentPreferencesSchema = z
  .object({
    preferred_work_locations: z.array(z.string()),
    open_to_travel: z.boolean(),
    travel_distance_miles: z.number(),
    us_resident: z.boolean(),
    authorized_countries: z.array(z.string()),
    us_passport: z.boolean(),
    drivers_license_classes: z.array(z.string()),
    military_status: z.array(z.string()),
    availability: z.array(z.string()),
    hourly_rate: z.number(),
  })
  .openapi("EmploymentPreferences");

const updateEmploymentSchema = z.object({
  preferred_work_locations: z.array(z.string()).optional(),
  open_to_travel: z.boolean().optional(),
  travel_distance_miles: z.number().optional(),
  us_resident: z.boolean().optional(),
  authorized_countries: z.array(z.string()).optional(),
  us_passport: z.boolean().optional(),
  drivers_license_classes: z.array(z.string()).optional(),
  military_status: z.array(z.string()).optional(),
  availability: z.array(z.string()).optional(),
  hourly_rate: z.number().optional(),
});

const updateEmploymentResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi("UpdateEmploymentResponse");

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/profiles/employment
 * Get employment preferences
 */
const getEmploymentRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Employment"],
  summary: "Get employment preferences",
  description:
    "Get employment preferences and work status for the authenticated user",
  responses: {
    200: {
      description: "Employment preferences",
      content: {
        "application/json": {
          schema: employmentPreferencesSchema,
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

app.openapi(getEmploymentRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: profile, error } = await supabase
    .schema("core")
    .from("user_profiles")
    .select(
      `
      preferred_work_locations,
      open_to_travel,
      travel_distance_miles,
      us_resident,
      authorized_countries,
      us_passport,
      drivers_license_classes,
      military_status,
      availability,
      hourly_rate
    `,
    )
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching employment preferences:", error);
    return c.json({
      error: "Failed to fetch employment preferences",
      message: error.message,
    }, 500);
  }

  return c.json({
    preferred_work_locations: profile?.preferred_work_locations || [],
    open_to_travel: profile?.open_to_travel || false,
    travel_distance_miles: profile?.travel_distance_miles || 0,
    us_resident: profile?.us_resident || false,
    authorized_countries: profile?.authorized_countries || [],
    us_passport: profile?.us_passport || false,
    drivers_license_classes: profile?.drivers_license_classes || [],
    military_status: profile?.military_status || [],
    availability: profile?.availability || [],
    hourly_rate: profile?.hourly_rate || 0,
  });
});

/**
 * PATCH /v1/profiles/employment
 * Update employment preferences
 */
const updateEmploymentRoute = createRoute({
  method: "patch",
  path: "/",
  tags: ["Employment"],
  summary: "Update employment preferences",
  description: "Update employment preferences and work status",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateEmploymentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Employment preferences updated",
      content: {
        "application/json": {
          schema: updateEmploymentResponseSchema,
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

app.openapi(updateEmploymentRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const updates = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .schema("core")
    .from("user_profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating employment preferences:", error);
    return c.json({
      error: "Failed to update employment preferences",
      message: error.message,
    }, 500);
  }

  return c.json({ success: true });
});

export default app;
