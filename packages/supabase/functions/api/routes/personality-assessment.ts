/**
 * Personality Assessment REST API
 * Manages personality assessment operations (Luscher tests, IPIP)
 * Endpoints for assessment status, progress saving, report generation, and sharing
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { mapToArchetype } from "../../_shared/ipip-archetype-mapper.ts";
import { getScore } from "../../_shared/ipip-score.ts";
import type { IPIPAnswer } from "../../_shared/ipip-types.ts";
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

const ipipAnswerSchema = z.object({
  id: z.string(),
  domain: z.enum(["A", "E", "N", "C", "O"]),
  facet: z.number(),
  score: z.number().min(1).max(5),
});

const assessmentStatusSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    current_step: z
      .enum(["luscher1", "cooldown", "ipip", "luscher2", "acute", "completed"])
      .nullable(),
    completion_score: z.number(),
    started_at: z.string(),
    last_updated_at: z.string(),
    updated_at: z.string(),
    completed_at: z.string().nullable(),
    luscher1_choices: z.array(z.number()).nullable(),
    luscher1_completed_at: z.string().nullable(),
    luscher2_choices: z.array(z.number()).nullable(),
    luscher2_completed_at: z.string().nullable(),
    luscher2_results: z.string().nullable(),
    ipip_answers: z.array(ipipAnswerSchema).nullable(),
    ipip_current_index: z.number().nullable(),
    ipip_language: z.string().nullable(),
    ipip_completed_at: z.string().nullable(),
    ai_report: z.string().nullable(),
    ai_report_generated_at: z.string().nullable(),
    cooldown_end_time: z.string().nullable(),
    next_available_at: z.string().nullable(),
    next_luscher_test_available_at: z.string().nullable(),
    diary_response: z.string().nullable(),
  })
  .openapi("AssessmentStatus");

const ipipStatusSchema = z
  .object({
    isCompleted: z.boolean(),
    completedAt: z.string().nullable(),
    progress: z.number(),
  })
  .openapi("IPIPStatus");

const luscherTest1StatusSchema = z
  .object({
    isCompleted: z.boolean(),
    completedAt: z.string().nullable(),
  })
  .openapi("LuscherTest1Status");

const luscherTest2StatusSchema = z
  .object({
    isCompleted: z.boolean(),
    completedAt: z.string().nullable(),
  })
  .openapi("LuscherTest2Status");

const luscherTestAvailabilitySchema = z
  .object({
    isCompleted: z.boolean(),
    isOnCooldown: z.boolean(),
    nextAvailableAt: z.string().nullable(),
  })
  .openapi("LuscherTestAvailability");

const saveProgressResponseSchema = z
  .object({
    success: z.boolean(),
    isComplete: z.boolean().optional(),
  })
  .openapi("SaveProgressResponse");

const generateReportResponseSchema = z
  .object({
    success: z.boolean(),
    report: z.string(),
  })
  .openapi("GenerateReportResponse");

const generateShareTokenResponseSchema = z
  .object({
    token: z.string().uuid(),
    shareUrl: z.string(),
    expiresAt: z.string().nullable(),
  })
  .openapi("GenerateShareTokenResponse");

const saveLuscherTestSessionResponseSchema = z
  .object({
    success: z.boolean(),
    nextAvailableAt: z.string(),
  })
  .openapi("SaveLuscherTestSessionResponse");

const awardResultsViewXPResponseSchema = z
  .object({
    success: z.boolean(),
    alreadyAwarded: z.boolean().optional(),
    newXP: z.number().optional(),
  })
  .openapi("AwardResultsViewXPResponse");

// Request schemas
const saveLuscher1Schema = z.object({
  choices: z.array(z.number()).length(8, "Must select exactly 8 colors"),
});

const saveLuscher2Schema = z.object({
  choices: z.array(z.number()).length(8, "Must select exactly 8 colors"),
  results: z.string().optional(),
});

const saveIPIPProgressSchema = z.object({
  answers: z.array(ipipAnswerSchema),
  current_index: z.number().min(0).max(120),
  language: z.string().default("en"),
});

const updateCurrentStepSchema = z.object({
  step: z.enum([
    "luscher1",
    "cooldown",
    "ipip",
    "luscher2",
    "acute",
    "completed",
  ]),
});

const saveLuscherTestSessionSchema = z.object({
  luscher1Choices: z.array(z.number()).length(
    8,
    "Must select exactly 8 colors",
  ),
  luscher2Choices: z.array(z.number()).length(
    8,
    "Must select exactly 8 colors",
  ),
  diaryResponse: z.string().optional(),
});

const generateReportSchema = z.object({
  luscherResults: z.string().min(1, "Luscher results are required"),
});

const generateShareTokenSchema = z.object({
  expiresInDays: z.number().min(1).max(365).optional(),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/personality-assessment/status
 * Get assessment status or create new assessment
 */
const getStatusRoute = createRoute({
  method: "get",
  path: "/status",
  tags: ["Personality Assessment"],
  summary: "Get assessment status",
  description: "Get current progress or create a new assessment if none exists",
  responses: {
    200: {
      description: "Assessment status",
      content: {
        "application/json": {
          schema: assessmentStatusSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
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

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("personality_assessments")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching assessment:", error);
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to fetch assessment: ${error.message}`,
        },
        500,
      );
    }

    if (data) {
      return c.json(data, 200);
    }

    // Create new assessment
    const now = new Date().toISOString();
    const { data: newAssessment, error: createError } = await supabase
      .schema("core")
      .from("personality_assessments")
      .insert({
        user_id: user.id,
        current_step: "luscher1",
        completion_score: 0,
        started_at: now,
        last_updated_at: now,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating assessment:", createError);
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to create assessment: ${createError.message}`,
        },
        500,
      );
    }

    return c.json(newAssessment, 200);
  } catch (error) {
    console.error("Error in getAssessmentStatus:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to get assessment status",
    }, 500);
  }
});

/**
 * GET /v1/personality-assessment/ipip/status
 * Get IPIP assessment completion status
 */
const getIPIPStatusRoute = createRoute({
  method: "get",
  path: "/ipip/status",
  tags: ["Personality Assessment"],
  summary: "Get IPIP status",
  description: "Get IPIP assessment completion status",
  responses: {
    200: {
      description: "IPIP status",
      content: {
        "application/json": {
          schema: ipipStatusSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getIPIPStatusRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("personality_assessments")
      .select("ipip_answers, ipip_completed_at")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to fetch status: ${error.message}`,
        },
        500,
      );
    }

    const answers = (data?.ipip_answers as Array<unknown>) || [];
    return c.json(
      {
        isCompleted: !!(data?.ipip_completed_at && answers.length >= 120),
        completedAt: data?.ipip_completed_at || null,
        progress: answers.length,
      },
      200,
    );
  } catch (error) {
    console.error("Error in getIPIPStatus:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to get IPIP status",
    }, 500);
  }
});

/**
 * GET /v1/personality-assessment/luscher-1/status
 * Get Luscher Test 1 completion status
 */
const getLuscherTest1StatusRoute = createRoute({
  method: "get",
  path: "/luscher-1/status",
  tags: ["Personality Assessment"],
  summary: "Get Luscher Test 1 status",
  description: "Get Luscher Test 1 completion status",
  responses: {
    200: {
      description: "Luscher Test 1 status",
      content: {
        "application/json": {
          schema: luscherTest1StatusSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getLuscherTest1StatusRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("personality_assessments")
      .select("luscher1_choices, luscher1_completed_at")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to fetch status: ${error.message}`,
        },
        500,
      );
    }

    return c.json(
      {
        isCompleted: !!(data?.luscher1_completed_at &&
          data?.luscher1_choices?.length === 8),
        completedAt: data?.luscher1_completed_at || null,
      },
      200,
    );
  } catch (error) {
    console.error("Error in getLuscherTest1Status:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to get Luscher Test 1 status",
    }, 500);
  }
});

/**
 * GET /v1/personality-assessment/luscher-2/status
 * Get Luscher Test 2 completion status
 */
const getLuscherTest2StatusRoute = createRoute({
  method: "get",
  path: "/luscher-2/status",
  tags: ["Personality Assessment"],
  summary: "Get Luscher Test 2 status",
  description: "Get Luscher Test 2 completion status",
  responses: {
    200: {
      description: "Luscher Test 2 status",
      content: {
        "application/json": {
          schema: luscherTest2StatusSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getLuscherTest2StatusRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("personality_assessments")
      .select("luscher2_choices, luscher2_completed_at")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to fetch status: ${error.message}`,
        },
        500,
      );
    }

    return c.json(
      {
        isCompleted: !!(data?.luscher2_completed_at &&
          data?.luscher2_choices?.length === 8),
        completedAt: data?.luscher2_completed_at || null,
      },
      200,
    );
  } catch (error) {
    console.error("Error in getLuscherTest2Status:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to get Luscher Test 2 status",
    }, 500);
  }
});

/**
 * GET /v1/personality-assessment/luscher/availability
 * Get Luscher Test availability (cooldown status)
 */
const getLuscherTestAvailabilityRoute = createRoute({
  method: "get",
  path: "/luscher/availability",
  tags: ["Personality Assessment"],
  summary: "Get Luscher Test availability",
  description: "Check if Luscher tests are available (cooldown status)",
  responses: {
    200: {
      description: "Luscher Test availability",
      content: {
        "application/json": {
          schema: luscherTestAvailabilitySchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getLuscherTestAvailabilityRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { data, error } = await supabase
      .schema("core")
      .from("personality_assessments")
      .select(
        "luscher1_completed_at, luscher2_completed_at, next_luscher_test_available_at",
      )
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to fetch availability: ${error.message}`,
        },
        500,
      );
    }

    const isCompleted =
      !!(data?.luscher1_completed_at && data?.luscher2_completed_at);
    const nextAvailableAt = data?.next_luscher_test_available_at || null;
    const now = new Date();

    let isOnCooldown = false;
    if (nextAvailableAt) {
      const availableDate = new Date(nextAvailableAt);
      isOnCooldown = availableDate > now;
    }

    return c.json(
      {
        isCompleted,
        isOnCooldown,
        nextAvailableAt,
      },
      200,
    );
  } catch (error) {
    console.error("Error in getLuscherTestAvailability:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to get test availability",
    }, 500);
  }
});

/**
 * POST /v1/personality-assessment/luscher-1
 * Save Luscher Test 1 results
 */
const saveLuscher1Route = createRoute({
  method: "post",
  path: "/luscher-1",
  tags: ["Personality Assessment"],
  summary: "Save Luscher Test 1",
  description: "Save Luscher Test 1 results",
  request: {
    body: {
      content: {
        "application/json": {
          schema: saveLuscher1Schema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Save successful",
      content: {
        "application/json": {
          schema: saveProgressResponseSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(saveLuscher1Route, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const now = new Date();

    // Get existing assessment to preserve other fields
    const { error: fetchError } = await supabase
      .schema("core")
      .from("personality_assessments")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Create assessment if it doesn't exist
    if (fetchError && fetchError.code === "PGRST116") {
      const cooldownEndTime = new Date(now.getTime() + 60 * 1000); // 60 seconds from now

      const { error: createError } = await supabase
        .schema("core")
        .from("personality_assessments")
        .insert({
          user_id: user.id,
          luscher1_choices: body.choices,
          luscher1_completed_at: now.toISOString(),
          current_step: "cooldown",
          completion_score: 25,
          cooldown_end_time: cooldownEndTime.toISOString(),
          started_at: now.toISOString(),
          last_updated_at: now.toISOString(),
        });

      if (createError) {
        return c.json(
          {
            error: "Internal server error",
            message: `Failed to create assessment: ${createError.message}`,
          },
          500,
        );
      }

      return c.json({ success: true }, 200);
    }

    const cooldownEndTime = new Date(now.getTime() + 60 * 1000); // 60 seconds from now

    const updateData = {
      luscher1_choices: body.choices,
      luscher1_completed_at: now.toISOString(),
      completion_score: 25, // 25% after completing luscher1
      last_updated_at: now.toISOString(),
      updated_at: now.toISOString(),
      current_step: "cooldown",
      cooldown_end_time: cooldownEndTime.toISOString(),
    };

    const { error } = await supabase
      .schema("core")
      .from("personality_assessments")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error saving Luscher Test 1:", error);
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to save Luscher Test 1: ${error.message}`,
        },
        500,
      );
    }

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Error in saveLuscher1:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to save Luscher Test 1",
    }, 500);
  }
});

/**
 * POST /v1/personality-assessment/ipip
 * Save IPIP progress (incremental saves)
 */
const saveIPIPProgressRoute = createRoute({
  method: "post",
  path: "/ipip",
  tags: ["Personality Assessment"],
  summary: "Save IPIP progress",
  description: "Save IPIP assessment progress (incremental saves)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: saveIPIPProgressSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Save successful",
      content: {
        "application/json": {
          schema: saveProgressResponseSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(saveIPIPProgressRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const now = new Date().toISOString();
    const isComplete = body.answers.length >= 120;

    // Calculate completion score: 25% for luscher1 (if exists) + progress in IPIP
    const { data: assessment } = await supabase
      .schema("core")
      .from("personality_assessments")
      .select("luscher1_choices")
      .eq("user_id", user.id)
      .single();

    const luscher1Completed = assessment?.luscher1_choices?.length === 8;
    const luscher1Progress = luscher1Completed ? 25 : 0;
    const ipipProgress = Math.min((body.answers.length / 120) * 25, 25);
    const completionScore = Math.round(luscher1Progress + ipipProgress);

    const updateData: Record<string, unknown> = {
      ipip_answers: body.answers,
      ipip_current_index: body.current_index,
      ipip_language: body.language || "en",
      completion_score: completionScore,
      last_updated_at: now,
      updated_at: now,
    };

    if (isComplete) {
      updateData.ipip_completed_at = now;
      // Only update step if part of combined flow
      const { data: existing } = await supabase
        .schema("core")
        .from("personality_assessments")
        .select("current_step")
        .eq("user_id", user.id)
        .single();
      if (existing?.current_step && existing.current_step !== "completed") {
        updateData.current_step = "luscher2";
      }
      updateData.completion_score = Math.round(luscher1Progress + 25); // 25% for completed IPIP

      // Set 30-day cooldown for retest
      const nextAvailableAt = new Date();
      nextAvailableAt.setDate(nextAvailableAt.getDate() + 30);
      updateData.next_available_at = nextAvailableAt.toISOString();
    }

    const { error } = await supabase
      .schema("core")
      .from("personality_assessments")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error saving IPIP progress:", error);
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to save IPIP progress: ${error.message}`,
        },
        500,
      );
    }

    // On completion: calculate archetype, store it, and award completion bonus XP
    if (isComplete) {
      try {
        // Calculate IPIP scores
        const scores = getScore({ answers: body.answers as IPIPAnswer[] });

        // Calculate archetype
        const archetypeResult = mapToArchetype(scores);

        // Get archetype ID from database
        const { data: archetypeData, error: archetypeError } = await supabase
          .schema("core")
          .from("archetypes")
          .select("id")
          .eq("name", archetypeResult.archetype.replace("Evolving ", ""))
          .single();

        if (!archetypeError && archetypeData) {
          // Mark previous archetypes as not primary
          await supabase
            .schema("core")
            .from("user_archetypes")
            .update({ is_primary: false })
            .eq("user_id", user.id);

          // Store new archetype as primary
          await supabase
            .schema("core")
            .from("user_archetypes")
            .insert({
              user_id: user.id,
              archetype_id: archetypeData.id,
              assessment_date: now,
              confidence_score: archetypeResult.confidence,
              domain_scores: scores as unknown as Record<string, unknown>,
              is_primary: true,
            });

          // Award +50 XP completion bonus (check if already awarded)
          const { data: existingXP } = await supabase
            .schema("core")
            .from("user_assessment_xp")
            .select("id")
            .eq("user_id", user.id)
            .eq("assessment_type", "ipip")
            .eq("xp_type", "completion")
            .single();

          if (!existingXP) {
            // Award +50 XP
            const { data: userData } = await supabase
              .schema("core")
              .from("users")
              .select("frequency_xp")
              .eq("id", user.id)
              .single();

            const currentXP = (userData?.frequency_xp as number) || 0;
            const newXP = currentXP + 50;

            await supabase.schema("core").from("users").update({
              frequency_xp: newXP,
            }).eq("id", user.id);

            // Track XP award
            await supabase.schema("core").from("user_assessment_xp").insert({
              user_id: user.id,
              assessment_type: "ipip",
              xp_type: "completion",
              xp_amount: 50,
            });
          }
        }
      } catch (archetypeError) {
        // Log but don't fail the save operation
        console.error("Error calculating archetype:", archetypeError);
      }
    }

    return c.json({ success: true, isComplete }, 200);
  } catch (error) {
    console.error("Error in saveIPIPProgress:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to save IPIP progress",
    }, 500);
  }
});

/**
 * POST /v1/personality-assessment/luscher-2
 * Save Luscher Test 2 results
 */
const saveLuscher2Route = createRoute({
  method: "post",
  path: "/luscher-2",
  tags: ["Personality Assessment"],
  summary: "Save Luscher Test 2",
  description: "Save Luscher Test 2 results",
  request: {
    body: {
      content: {
        "application/json": {
          schema: saveLuscher2Schema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Save successful",
      content: {
        "application/json": {
          schema: saveProgressResponseSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(saveLuscher2Route, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const now = new Date().toISOString();

    // Calculate completion score: luscher1 (25%) + ipip (25%) + luscher2 (25%)
    const { data: assessment } = await supabase
      .schema("core")
      .from("personality_assessments")
      .select("luscher1_choices, ipip_answers")
      .eq("user_id", user.id)
      .single();

    const luscher1Completed = assessment?.luscher1_choices?.length === 8;
    const ipipAnswers = (assessment?.ipip_answers as Array<{
      id: string;
      domain: string;
      facet: number;
      score: number;
    }>) || [];
    const ipipCompleted = ipipAnswers.length >= 120;
    const completionScore = (luscher1Completed ? 25 : 0) +
      (ipipCompleted ? 25 : 0) + 25;

    const updateData: Record<string, unknown> = {
      luscher2_choices: body.choices,
      luscher2_completed_at: now,
      completion_score: completionScore,
      last_updated_at: now,
      updated_at: now,
    };

    // Only update step if part of combined flow
    const { data: existing } = await supabase
      .schema("core")
      .from("personality_assessments")
      .select("current_step")
      .eq("user_id", user.id)
      .single();
    if (existing?.current_step && existing.current_step !== "completed") {
      updateData.current_step = "acute";
    }

    if (body.results) {
      updateData.luscher2_results = body.results;
    }

    const { error } = await supabase
      .schema("core")
      .from("personality_assessments")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error saving Luscher Test 2:", error);
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to save Luscher Test 2: ${error.message}`,
        },
        500,
      );
    }

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Error in saveLuscher2:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to save Luscher Test 2",
    }, 500);
  }
});

/**
 * PUT /v1/personality-assessment/step
 * Update current step
 */
const updateCurrentStepRoute = createRoute({
  method: "put",
  path: "/step",
  tags: ["Personality Assessment"],
  summary: "Update current step",
  description: "Update the current assessment step",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateCurrentStepSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Update successful",
      content: {
        "application/json": {
          schema: saveProgressResponseSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(updateCurrentStepRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const now = new Date().toISOString();
    const { error } = await supabase
      .schema("core")
      .from("personality_assessments")
      .update({
        current_step: body.step,
        last_updated_at: now,
        updated_at: now,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating step:", error);
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to update step: ${error.message}`,
        },
        500,
      );
    }

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Error in updateCurrentStep:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to update step",
    }, 500);
  }
});

/**
 * POST /v1/personality-assessment/luscher/session
 * Save unified Luscher test session
 */
const saveLuscherTestSessionRoute = createRoute({
  method: "post",
  path: "/luscher/session",
  tags: ["Personality Assessment"],
  summary: "Save Luscher test session",
  description:
    "Save unified Luscher test session (both parts + diary + XP + cooldown)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: saveLuscherTestSessionSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Save successful",
      content: {
        "application/json": {
          schema: saveLuscherTestSessionResponseSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(saveLuscherTestSessionRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const now = new Date();
    const nextAvailableAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Get existing assessment
    const { error: fetchError } = await supabase
      .schema("core")
      .from("personality_assessments")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const updateData: Record<string, unknown> = {
      luscher1_choices: body.luscher1Choices,
      luscher1_completed_at: now.toISOString(),
      luscher2_choices: body.luscher2Choices,
      luscher2_completed_at: now.toISOString(),
      current_step: "completed",
      completion_score: 100,
      completed_at: now.toISOString(),
      next_luscher_test_available_at: nextAvailableAt.toISOString(),
      last_updated_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    if (body.diaryResponse) {
      updateData.diary_response = body.diaryResponse;
    }

    // Create or update assessment
    if (fetchError && fetchError.code === "PGRST116") {
      // Create new
      const { error: createError } = await supabase
        .schema("core")
        .from("personality_assessments")
        .insert({
          user_id: user.id,
          ...updateData,
          started_at: now.toISOString(),
        });

      if (createError) {
        return c.json(
          {
            error: "Internal server error",
            message: `Failed to create assessment: ${createError.message}`,
          },
          500,
        );
      }
    } else {
      // Update existing
      const { error: updateError } = await supabase
        .schema("core")
        .from("personality_assessments")
        .update(updateData)
        .eq("user_id", user.id);

      if (updateError) {
        return c.json(
          {
            error: "Internal server error",
            message: `Failed to update assessment: ${updateError.message}`,
          },
          500,
        );
      }
    }

    // Award +5 Frequency XP
    const { error: xpError } = await supabase.rpc("increment_frequency_xp", {
      user_id_param: user.id,
      xp_amount: 5,
    });

    // If RPC doesn't exist, update directly
    if (xpError) {
      const { data: userData } = await supabase
        .schema("core")
        .from("users")
        .select("frequency_xp")
        .eq("id", user.id)
        .single();

      const currentXP = (userData?.frequency_xp as number) || 0;
      const newXP = currentXP + 5;

      await supabase.schema("core").from("users").update({
        frequency_xp: newXP,
      }).eq("id", user.id);
    }

    // Create assessment session record
    await supabase
      .schema("core")
      .from("assessment_sessions")
      .insert({
        user_id: user.id,
        assessment_type: "personality",
        session_data: {
          luscher1_choices: body.luscher1Choices,
          luscher2_choices: body.luscher2Choices,
          diary_response: body.diaryResponse || null,
        },
        completed_at: now.toISOString(),
        next_available_at: nextAvailableAt.toISOString(),
      });

    return c.json(
      {
        success: true,
        nextAvailableAt: nextAvailableAt.toISOString(),
      },
      200,
    );
  } catch (error) {
    console.error("Error in saveLuscherTestSession:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to save test session",
    }, 500);
  }
});

/**
 * POST /v1/personality-assessment/report
 * Generate AI report from Luscher results
 */
const generateReportRoute = createRoute({
  method: "post",
  path: "/report",
  tags: ["Personality Assessment"],
  summary: "Generate AI report",
  description: "Generate AI report from Luscher results using OpenAI",
  request: {
    body: {
      content: {
        "application/json": {
          schema: generateReportSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Report generated successfully",
      content: {
        "application/json": {
          schema: generateReportResponseSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(generateReportRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return c.json({
        error: "Internal server error",
        message: "OpenAI API key not configured",
      }, 500);
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a career psychologist and consultant. Use the following raw results from a Lüscher test and write a second-hand report to me, your client. The report should be a professional with a cohesive narrative around my acute vs aspirational challenges and opportunities. Unprofessional themes such as 'sexual frustration' could be mapped to 'frustrations in personal life' and so on. You don't need an opener or closing statement, just the raw report.",
          },
          {
            role: "user",
            content: body.luscherResults,
          },
        ],
        temperature: 1,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      return c.json(
        {
          error: "Internal server error",
          message: "Failed to generate report from OpenAI",
        },
        500,
      );
    }

    const data = await response.json();
    const report = data.choices[0]?.message?.content;

    if (!report) {
      return c.json(
        {
          error: "Internal server error",
          message: "No report generated from OpenAI",
        },
        500,
      );
    }

    // Save report to database
    const now = new Date().toISOString();
    const { error } = await supabase
      .schema("core")
      .from("personality_assessments")
      .update({
        ai_report: report,
        ai_report_generated_at: now,
        current_step: "completed",
        completed_at: now,
        completion_score: 100,
        last_updated_at: now,
        updated_at: now,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error saving report:", error);
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to save report: ${error.message}`,
        },
        500,
      );
    }

    return c.json({ success: true, report }, 200);
  } catch (error) {
    console.error("Error in generateReport:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to generate report",
    }, 500);
  }
});

/**
 * POST /v1/personality-assessment/share
 * Generate share token for IPIP results
 */
const generateShareTokenRoute = createRoute({
  method: "post",
  path: "/share",
  tags: ["Personality Assessment"],
  summary: "Generate share token",
  description: "Generate share token for IPIP results",
  request: {
    body: {
      content: {
        "application/json": {
          schema: generateShareTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Token generated successfully",
      content: {
        "application/json": {
          schema: generateShareTokenResponseSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(generateShareTokenRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();

    // Validate user has completed IPIP
    const { data: assessment } = await supabase
      .schema("core")
      .from("personality_assessments")
      .select("id, ipip_completed_at")
      .eq("user_id", user.id)
      .single();

    if (!assessment?.ipip_completed_at) {
      return c.json(
        {
          error: "Bad request",
          message: "IPIP assessment must be completed before sharing",
        },
        400,
      );
    }

    // Calculate expiration
    const expiresAt = body.expiresInDays
      ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
        .toISOString()
      : null;

    // Generate token (UUID will be generated by database)
    const { data: tokenData, error: tokenError } = await supabase
      .schema("core")
      .from("ipip_share_tokens")
      .insert({
        user_id: user.id,
        assessment_id: assessment.id,
        expires_at: expiresAt,
      })
      .select("token")
      .single();

    if (tokenError) {
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to generate share token: ${tokenError.message}`,
        },
        500,
      );
    }

    // Award +5 XP for first share (check if already awarded)
    const { data: existingXP } = await supabase
      .schema("core")
      .from("user_assessment_xp")
      .select("id")
      .eq("user_id", user.id)
      .eq("assessment_type", "ipip")
      .eq("xp_type", "share")
      .single();

    if (!existingXP) {
      const { data: userData } = await supabase
        .schema("core")
        .from("users")
        .select("frequency_xp")
        .eq("id", user.id)
        .single();

      const currentXP = (userData?.frequency_xp as number) || 0;
      const newXP = currentXP + 5;

      await supabase.schema("core").from("users").update({
        frequency_xp: newXP,
      }).eq("id", user.id);

      await supabase.schema("core").from("user_assessment_xp").insert({
        user_id: user.id,
        assessment_type: "ipip",
        xp_type: "share",
        xp_amount: 5,
      });
    }

    return c.json(
      {
        token: tokenData.token,
        shareUrl: `/profile/ipip/share/${tokenData.token}`,
        expiresAt: expiresAt,
      },
      200,
    );
  } catch (error) {
    console.error("Error in generateShareToken:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to generate share token",
    }, 500);
  }
});

/**
 * DELETE /v1/personality-assessment/share/:token
 * Revoke share token
 */
const revokeShareTokenRoute = createRoute({
  method: "delete",
  path: "/share/{token}",
  tags: ["Personality Assessment"],
  summary: "Revoke share token",
  description: "Revoke a share token",
  request: {
    params: z.object({
      token: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Token revoked successfully",
      content: {
        "application/json": {
          schema: saveProgressResponseSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(revokeShareTokenRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { token } = c.req.param();

    const { error } = await supabase
      .schema("core")
      .from("ipip_share_tokens")
      .update({ is_revoked: true })
      .eq("token", token)
      .eq("user_id", user.id);

    if (error) {
      return c.json(
        {
          error: "Internal server error",
          message: `Failed to revoke token: ${error.message}`,
        },
        500,
      );
    }

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Error in revokeShareToken:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to revoke share token",
    }, 500);
  }
});

/**
 * POST /v1/personality-assessment/xp/results-view
 * Award XP for viewing results (one-time)
 */
const awardResultsViewXPRoute = createRoute({
  method: "post",
  path: "/xp/results-view",
  tags: ["Personality Assessment"],
  summary: "Award results view XP",
  description: "Award XP for viewing results (one-time)",
  responses: {
    200: {
      description: "XP awarded successfully",
      content: {
        "application/json": {
          schema: awardResultsViewXPResponseSchema,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(awardResultsViewXPRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Claim the award first, and let the unique constraint on
    // (user_id, assessment_type, xp_type) decide who wins.
    //
    // This used to read the row, return early if it existed, then credit XP and
    // insert last — a check-then-act window in which two requests can both pass
    // the check, both credit +2, and only one insert survive the constraint,
    // leaving inflated XP with a single award row to show for it. The client was
    // firing this in a render loop (#740), which is the concurrency such a
    // window needs.
    //
    // Honesty about the evidence: 20 simultaneous requests against the old code
    // on a local stack did *not* inflate anything, so the window is argued from
    // the ordering rather than demonstrated — the local edge runtime appears to
    // serialise, which is exactly the condition under which a race cannot show
    // up. Inserting first removes the window either way and costs nothing: the
    // unique constraint becomes the lock, and a duplicate is rejected before any
    // XP is credited.
    const { error: claimError } = await supabase
      .schema("core")
      .from("user_assessment_xp")
      .insert({
        user_id: user.id,
        assessment_type: "ipip",
        xp_type: "view",
        xp_amount: 2,
      });

    if (claimError) {
      // 23505 is unique_violation: somebody already holds this award, which is
      // the normal outcome on a revisit and not an error.
      if (claimError.code === "23505") {
        return c.json({ success: true, alreadyAwarded: true }, 200);
      }
      throw claimError;
    }

    // Award +2 XP now that the claim is ours alone.
    const { data: userData } = await supabase
      .schema("core")
      .from("users")
      .select("frequency_xp")
      .eq("id", user.id)
      .single();

    const currentXP = (userData?.frequency_xp as number) || 0;
    const newXP = currentXP + 2;

    await supabase.schema("core").from("users").update({ frequency_xp: newXP })
      .eq("id", user.id);

    return c.json({ success: true, newXP }, 200);
  } catch (error) {
    console.error("Error in awardResultsViewXP:", error);
    return c.json({
      error: "Internal server error",
      message: "Failed to award results view XP",
    }, 500);
  }
});

// ============================================================================
// GET /archetype - Get primary archetype for current user
// ============================================================================

const archetypeDetailsSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    strengths: z.array(z.string()),
    work_styles: z.string(),
    team_dynamics: z.string(),
    growth_areas: z.array(z.string()),
  })
  .openapi("ArchetypeDetails");

const archetypeResponseSchema = z
  .object({
    archetype: z.string(),
    confidence: z.number(),
    details: archetypeDetailsSchema.nullable(),
  })
  .nullable()
  .openapi("ArchetypeResponse");

const getArchetypeRoute = createRoute({
  method: "get",
  path: "/archetype",
  tags: ["Personality Assessment"],
  summary: "Get user primary archetype",
  responses: {
    200: {
      description: "Primary archetype or null if not yet determined",
      content: { "application/json": { schema: archetypeResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getArchetypeRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("user_archetypes")
    .select(
      "confidence_score, archetype:archetypes(name, description, strengths, work_styles, team_dynamics, growth_areas)",
    )
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    return c.json(
      { error: "Failed to load archetype", message: error.message },
      500,
    );
  }

  if (!data) return c.json(null);

  // Supabase returns joined row as object or array depending on relationship
  const archetypeRow = Array.isArray(data.archetype)
    ? data.archetype[0]
    : data.archetype;

  if (!archetypeRow) return c.json(null);

  return c.json({
    archetype: archetypeRow.name ?? "",
    confidence: data.confidence_score ?? 0,
    details: archetypeRow,
  });
});

/**
 * GET /v1/personality-assessment/shared/:token
 * Get shared IPIP results by token (public endpoint, no auth required)
 */
app.get("/shared/:token", async (c) => {
  const { token } = c.req.param();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return c.json({ error: "Internal server error" }, 500);
  }

  const { createClient } = await import("jsr:@supabase/supabase-js@2");
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Look up share token
  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .schema("core")
    .from("ipip_share_tokens")
    .select("assessment_id, expires_at, is_revoked")
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return c.json({ error: "Share link not found or invalid" }, 404);
  }

  if (tokenData.is_revoked) {
    return c.json({ error: "This share link has been revoked" }, 410);
  }

  if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
    return c.json({ error: "This share link has expired" }, 410);
  }

  // Fetch the assessment data
  const { data: assessment, error: assessmentError } = await supabaseAdmin
    .schema("core")
    .from("personality_assessments")
    .select("ipip_answers, archetype_id")
    .eq("id", tokenData.assessment_id)
    .single();

  if (assessmentError || !assessment) {
    return c.json({ error: "Assessment not found" }, 404);
  }

  // Fetch archetype if present
  let archetype = null;
  if (assessment.archetype_id) {
    const { data: archetypeData } = await supabaseAdmin
      .schema("core")
      .from("user_archetypes")
      .select("confidence_score, archetype:archetypes(name)")
      .eq("id", assessment.archetype_id)
      .single();

    if (archetypeData) {
      const archetypeRow = Array.isArray(archetypeData.archetype)
        ? archetypeData.archetype[0]
        : archetypeData.archetype;
      archetype = {
        name: archetypeRow?.name ?? "",
        confidence: archetypeData.confidence_score ?? 0,
      };
    }
  }

  return c.json({
    answers: assessment.ipip_answers || [],
    archetype,
  });
});

export default app;
