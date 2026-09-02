/**
 * Engagement REST API
 * Tracks user engagement events (views, clicks, searches, etc.)
 * Used for analytics and metrics
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

const engagementEventTypeSchema = z.enum([
  "profile_view",
  "job_view",
  "job_click",
  "application_start",
  "application_complete",
  "search",
  "filter_change",
]);

const engagementTargetTypeSchema = z.enum(["user", "job", "organization"]);

const engagementEventSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    event_type: engagementEventTypeSchema,
    target_type: engagementTargetTypeSchema.optional(),
    target_id: z.string().uuid().optional(),
    event_metadata: z.record(z.unknown()).optional(),
    occurred_at: z.string(),
    created_at: z.string(),
  })
  .openapi("EngagementEvent");

// Request schemas
const trackEventSchema = z.object({
  eventType: engagementEventTypeSchema,
  targetType: engagementTargetTypeSchema.optional(),
  targetId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const recentActivityQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  eventTypes: z
    .string()
    .transform((val) => val.split(","))
    .optional(),
});

const metricsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional().default(30),
});

// Response schemas
const trackEventResponseSchema = z
  .object({
    data: engagementEventSchema,
  })
  .openapi("TrackEventResponse");

const recentActivityResponseSchema = z
  .object({
    data: z.array(engagementEventSchema),
  })
  .openapi("RecentActivityResponse");

const engagementMetricsSchema = z
  .object({
    profile_views: z.number().int(),
    job_views: z.number().int(),
    applications_started: z.number().int(),
    applications_completed: z.number().int(),
    searches: z.number().int(),
    total_events: z.number().int(),
  })
  .openapi("EngagementMetrics");

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /v1/engagement/track
 * Track an engagement event
 */
const trackEventRoute = createRoute({
  method: "post",
  path: "/track",
  tags: ["Engagement"],
  summary: "Track engagement event",
  description: "Track a user engagement event for analytics",
  request: {
    body: {
      content: {
        "application/json": {
          schema: trackEventSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Event tracked successfully",
      content: {
        "application/json": {
          schema: trackEventResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: errorResponseSchema,
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

app.openapi(trackEventRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { eventType, targetType, targetId, metadata } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: event, error } = await supabase
    .schema("engagement")
    .from("activity_events")
    .insert({
      user_id: user.id,
      event_type: eventType,
      target_type: targetType,
      target_id: targetId,
      event_metadata: metadata,
      occurred_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error tracking event:", error);
    return c.json(
      { error: "Failed to track event", message: error.message },
      500,
    );
  }

  return c.json({ data: event }, 201);
});

/**
 * GET /v1/engagement/activity
 * Get recent engagement activity
 */
const getRecentActivityRoute = createRoute({
  method: "get",
  path: "/activity",
  tags: ["Engagement"],
  summary: "Get recent activity",
  description: "Get recent engagement activity for the authenticated user",
  request: {
    query: recentActivityQuerySchema,
  },
  responses: {
    200: {
      description: "Recent activity",
      content: {
        "application/json": {
          schema: recentActivityResponseSchema,
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

app.openapi(getRecentActivityRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { limit, eventTypes } = c.req.valid("query");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let query = supabase
    .schema("engagement")
    .from("activity_events")
    .select("*")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (eventTypes && eventTypes.length > 0) {
    query = query.in("event_type", eventTypes);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error("Error fetching activity:", error);
    return c.json(
      { error: "Failed to fetch activity", message: error.message },
      500,
    );
  }

  return c.json({ data: events || [] });
});

/**
 * GET /v1/engagement/metrics
 * Get engagement metrics for the user
 */
const getMetricsRoute = createRoute({
  method: "get",
  path: "/metrics",
  tags: ["Engagement"],
  summary: "Get engagement metrics",
  description:
    "Get engagement metrics for the authenticated user over a time period",
  request: {
    query: metricsQuerySchema,
  },
  responses: {
    200: {
      description: "Engagement metrics",
      content: {
        "application/json": {
          schema: engagementMetricsSchema,
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

app.openapi(getMetricsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { days } = c.req.valid("query");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all events in the time window
  const { data: events, error } = await supabase
    .schema("engagement")
    .from("activity_events")
    .select("event_type")
    .eq("user_id", user.id)
    .gte("occurred_at", startDate.toISOString());

  if (error) {
    console.error("Error fetching metrics:", error);
    return c.json(
      { error: "Failed to fetch metrics", message: error.message },
      500,
    );
  }

  // Calculate metrics
  const metrics = {
    profile_views: 0,
    job_views: 0,
    applications_started: 0,
    applications_completed: 0,
    searches: 0,
    total_events: events?.length || 0,
  };

  events?.forEach((event) => {
    switch (event.event_type) {
      case "profile_view":
        metrics.profile_views++;
        break;
      case "job_view":
        metrics.job_views++;
        break;
      case "application_start":
        metrics.applications_started++;
        break;
      case "application_complete":
        metrics.applications_completed++;
        break;
      case "search":
        metrics.searches++;
        break;
    }
  });

  return c.json(metrics);
});

export default app;
