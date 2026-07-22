/**
 * Profile Completion REST API
 * Tracks profile completion status, milestones, and nudges
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.ts";
import {
  completionPercentage as sumCompletionPercentage,
  getSectionStatuses,
  milestoneBadges,
  nextMilestone,
} from "../lib/profile-completion-calc.ts";

const app = new OpenAPIHono();
app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const _errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
}).openapi("ErrorResponse");

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/profiles/completion/status
 * Get profile completion status
 */
const getStatusRoute = createRoute({
  method: "get",
  path: "/status",
  tags: ["Profile Completion"],
  summary: "Get completion status",
  responses: {
    200: {
      description: "Profile completion status",
      content: {
        "application/json": {
          schema: z.object({
            completionPercentage: z.number(),
            milestoneBadges: z.array(z.object({
              id: z.string(),
              threshold: z.number(),
              achieved: z.boolean(),
              reachedAt: z.string().nullable(),
            })),
            sectionProgress: z.array(z.object({
              id: z.string(),
              title: z.string(),
              weight: z.number(),
              completed: z.boolean(),
              missingFields: z.array(z.string()),
            })),
            incompleteSections: z.array(z.string()),
            hasReachedFiftyPercent: z.boolean(),
            milestoneHistory: z.record(z.string()),
            nudgeStatus: z.object({
              dismissed: z.record(z.object({
                dismissedAt: z.string(),
                reason: z.string().optional(),
              })),
              lastDismissedAt: z.string().nullable(),
              shouldPrompt: z.boolean(),
            }),
            summary: z.object({
              completedWeight: z.number(),
              remainingWeight: z.number(),
              nextMilestone: z.number().nullable(),
            }),
            updatedAt: z.string(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getStatusRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Pull the data the weighted section algorithm needs. Mirrors the canonical
  // tRPC implementation: profile fields + headline + counts across the
  // skills/certifications/education/experience tables (all schema "core").
  const [
    profileRes,
    userRes,
    skillsRes,
    certificationsRes,
    educationRes,
    experienceRes,
  ] = await Promise.all([
    supabase
      .schema("core")
      .from("profile")
      .select(
        "first_name, last_name, address, preferred_work_locations, education_level",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .schema("core")
      .from("users")
      .select("headline")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.schema("core").from("user_skills").select("id").eq(
      "user_id",
      user.id,
    ),
    supabase
      .schema("core")
      .from("user_certifications")
      .select("id")
      .eq("user_id", user.id),
    supabase.schema("core").from("user_education").select("id").eq(
      "user_id",
      user.id,
    ),
    supabase
      .schema("core")
      .from("user_experience")
      .select("job_title, company_name")
      .eq("user_id", user.id),
  ]);

  // PGRST116 = "no rows" from .maybeSingle(); treat as empty, surface anything else.
  const realError = [
    profileRes.error,
    userRes.error,
    skillsRes.error,
    certificationsRes.error,
    educationRes.error,
    experienceRes.error,
  ].find((e) => e && e.code !== "PGRST116");
  if (realError) {
    console.error("[profileCompletion] getStatus query failed", realError);
    return c.json(
      {
        error: "Failed to compute completion status",
        message: realError.message,
      },
      500,
    );
  }

  const sectionProgress = getSectionStatuses({
    profile: profileRes.data ?? null,
    headline: userRes.data?.headline,
    skillsCount: skillsRes.data?.length ?? 0,
    certificationsCount: certificationsRes.data?.length ?? 0,
    educationCount: educationRes.data?.length ?? 0,
    experience: (experienceRes.data ?? []) as Array<Record<string, unknown>>,
  });

  const completionPercentage = sumCompletionPercentage(sectionProgress);
  const completedWeight = completionPercentage;
  const incompleteSections = sectionProgress
    .filter((s) => !s.completed)
    .map((s) => s.id);

  return c.json({
    completionPercentage,
    milestoneBadges: milestoneBadges(completionPercentage),
    sectionProgress,
    incompleteSections,
    hasReachedFiftyPercent: completionPercentage >= 50,
    milestoneHistory: {},
    nudgeStatus: {
      dismissed: {},
      lastDismissedAt: null,
      shouldPrompt: completionPercentage < 100,
    },
    summary: {
      completedWeight,
      remainingWeight: 100 - completedWeight,
      nextMilestone: nextMilestone(completionPercentage),
    },
    updatedAt: new Date().toISOString(),
  });
});

/**
 * POST /v1/profiles/completion/nudges/dismiss
 * Dismiss a profile completion nudge
 */
const dismissNudgeRoute = createRoute({
  method: "post",
  path: "/nudges/dismiss",
  tags: ["Profile Completion"],
  summary: "Dismiss nudge",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            nudgeId: z.string(),
            reason: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Nudge dismissed",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            nudgeHistory: z.object({
              dismissed: z.record(z.object({
                dismissedAt: z.string(),
                reason: z.string().optional(),
              })),
              lastDismissedAt: z.string(),
            }),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(dismissNudgeRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { nudgeId, reason } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const dismissedAt = new Date().toISOString();

  // Store dismissal in user metadata or separate table
  const { error } = await supabase
    .schema("core")
    .from("profile_completion_nudges")
    .upsert({
      user_id: user.id,
      nudge_id: nudgeId,
      dismissed_at: dismissedAt,
      reason,
    });

  if (error) {
    return c.json(
      { error: "Failed to dismiss nudge", message: error.message },
      500,
    );
  }

  return c.json({
    success: true,
    nudgeHistory: {
      dismissed: {
        [nudgeId]: {
          dismissedAt,
          reason,
        },
      },
      lastDismissedAt: dismissedAt,
    },
  });
});

/**
 * GET /v1/profiles/completion/benefits
 * Get personalized benefits messaging
 */
const getBenefitsRoute = createRoute({
  method: "get",
  path: "/benefits",
  tags: ["Profile Completion"],
  summary: "Get personalized benefits",
  responses: {
    200: {
      description: "Personalized benefits",
      content: {
        "application/json": {
          schema: z.object({
            benefits: z.array(z.object({
              id: z.string(),
              title: z.string(),
              description: z.string(),
              relatedSection: z.string(),
              userType: z.string(),
              opportunityCount: z.number(),
            })),
            completionPercentage: z.number(),
            incompleteSections: z.array(z.string()),
            userTypes: z.array(z.string()),
            updatedAt: z.string(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getBenefitsRoute, async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({
    benefits: [
      {
        id: "skills-benefit",
        title: "Stand Out to Employers",
        description: "Add skills to increase profile visibility",
        relatedSection: "skills",
        userType: "worker",
        opportunityCount: 0,
      },
    ],
    completionPercentage: 50,
    incompleteSections: ["skills", "certifications"],
    userTypes: ["worker"],
    updatedAt: new Date().toISOString(),
  });
});

export default app;
