/**
 * Prerequisites REST API
 * Handles user onboarding prerequisites
 * Migrated from: packages/supabase/functions/trpc/routers/prerequisites.router.ts
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono();

app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const addressSchema = z
  .object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .openapi("Address");

const prerequisitesDataSchema = z
  .object({
    first_name: z.string(),
    last_name: z.string(),
    address: addressSchema.nullable(),
    user_types: z.array(z.enum(["worker", "employer", "customer"])),
    industry_id: z.string(),
  })
  .openapi("PrerequisitesData");

const prerequisitesCheckResponseSchema = z
  .object({
    isComplete: z.boolean(),
    hasName: z.boolean(),
    hasAddress: z.boolean(),
    hasUserTypes: z.boolean(),
    hasIndustry: z.boolean(),
    hasAcceptedPrivacy: z.boolean(),
    hasAcceptedTerms: z.boolean(),
    completedAt: z.string().nullable(),
    data: prerequisitesDataSchema,
  })
  .openapi("PrerequisitesCheckResponse");

const completePrerequisitesRequestSchema = z
  .object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    address: addressSchema,
    user_types: z.array(z.enum(["worker", "employer", "customer"])).min(1),
    industry_id: z.string().min(1),
    // SC-110: explicit legal acceptance. Server enforces in addition to the
    // client schema so a stale or stripped client can't bypass — previously the
    // handler stamped accepted_*_at timestamps unconditionally on completion.
    accepts_privacy_policy: z
      .literal(true, {
        errorMap: () => ({ message: "You must accept the Privacy Policy" }),
      }),
    accepts_terms_of_service: z
      .literal(true, {
        errorMap: () => ({ message: "You must accept the Terms of Service" }),
      }),
  })
  .openapi("CompletePrerequisitesRequest");

const completePrerequisitesResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi("CompletePrerequisitesResponse");

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi("ErrorResponse");

// ============================================================================
// Routes
// ============================================================================

// GET /check - Check prerequisites completion status
const checkRoute = createRoute({
  method: "get",
  path: "/check",
  summary: "Check prerequisites status",
  description:
    "Returns whether all required onboarding prerequisites are completed for the current user.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: prerequisitesCheckResponseSchema,
        },
      },
      description: "Prerequisites status",
    },
    401: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Internal server error",
    },
  },
});

app.openapi(checkRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  // When unauthenticated, return default "incomplete" so clients (e.g. onboarding) don't get 401
  if (!user) {
    return c.json({
      isComplete: false,
      hasName: false,
      hasAddress: false,
      hasUserTypes: false,
      hasIndustry: false,
      hasAcceptedPrivacy: false,
      hasAcceptedTerms: false,
      completedAt: null,
      data: {
        first_name: "",
        last_name: "",
        address: null,
        user_types: [],
        industry_id: "",
      },
    });
  }

  try {
    // Get private data (first_name, last_name, address)
    const { data: privateData, error: privateError } = await supabase
      .schema("core")
      .from("profile")
      .select("first_name, last_name, address")
      .eq("user_id", user.id)
      .single();

    if (privateError && privateError.code !== "PGRST116") {
      console.error("Failed to fetch private data:", privateError);
      return c.json(
        {
          error: "Failed to fetch private data",
          message: privateError.message,
        },
        500,
      );
    }

    // Get public user data (industry_id)
    const { data: userData, error: userError } = await supabase
      .schema("core")
      .from("users")
      .select("industry_id")
      .eq("id", user.id)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("Failed to fetch user data:", userError);
      return c.json(
        {
          error: "Failed to fetch user data",
          message: userError.message,
        },
        500,
      );
    }

    // Get preferences (user_types, prerequisites_completed_at, legal acceptance)
    const { data: preferences, error: prefsError } = await supabase
      .schema("core")
      .from("preferences")
      .select(
        "user_types, prerequisites_completed_at, accepted_privacy_policy_at, accepted_terms_of_service_at",
      )
      .eq("user_id", user.id)
      .single();

    if (prefsError && prefsError.code !== "PGRST116") {
      console.error("Failed to fetch preferences:", prefsError);
      return c.json(
        {
          error: "Failed to fetch preferences",
          message: prefsError.message,
        },
        500,
      );
    }

    // Check if all required fields are present
    const hasName = privateData?.first_name && privateData?.last_name;
    const hasAddress = privateData?.address?.street &&
      privateData?.address?.city &&
      privateData?.address?.state &&
      privateData?.address?.zip;
    const hasUserTypes = preferences?.user_types &&
      preferences.user_types.length > 0;
    const hasIndustry = userData?.industry_id;
    const hasAcceptedPrivacy = !!preferences?.accepted_privacy_policy_at;
    const hasAcceptedTerms = !!preferences?.accepted_terms_of_service_at;

    // Legal acceptance is now part of the completion contract — without this,
    // legacy users with all profile fields but no ToS/PP timestamps would be
    // marked complete by /check, bypass the redirect-to-onboarding gate in the
    // protected/onboarding layouts, and never get a chance to check the boxes
    // that POST /complete now requires.
    const isComplete = hasName && hasAddress && hasUserTypes && hasIndustry &&
      hasAcceptedPrivacy && hasAcceptedTerms;

    return c.json({
      isComplete: !!isComplete,
      hasName: !!hasName,
      hasAddress: !!hasAddress,
      hasUserTypes: !!hasUserTypes,
      hasIndustry: !!hasIndustry,
      hasAcceptedPrivacy,
      hasAcceptedTerms,
      completedAt: preferences?.prerequisites_completed_at || null,
      data: {
        first_name: privateData?.first_name || "",
        last_name: privateData?.last_name || "",
        address: privateData?.address || null,
        user_types: preferences?.user_types || [],
        industry_id: userData?.industry_id || "",
      },
    });
  } catch (error) {
    console.error("Unexpected error in prerequisites check:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// POST /complete - Complete prerequisites
const completeRoute = createRoute({
  method: "post",
  path: "/complete",
  summary: "Complete prerequisites",
  description: "Updates all required onboarding prerequisites atomically.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: completePrerequisitesRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: completePrerequisitesResponseSchema,
        },
      },
      description: "Prerequisites completed successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Bad request",
    },
    401: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Internal server error",
    },
  },
});

app.openapi(completeRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json(
      {
        error: "Unauthorized",
        message: "User not authenticated",
      },
      401,
    );
  }

  const input = await c.req.json();

  // Validate input
  const result = completePrerequisitesRequestSchema.safeParse(input);
  if (!result.success) {
    return c.json(
      {
        error: "Validation error",
        message: result.error.message,
      },
      400,
    );
  }

  const data = result.data;

  try {
    // 1. Update core.profile table (first_name, last_name, address)
    const { error: privateError } = await supabase.schema("core").from(
      "profile",
    ).upsert({
      user_id: user.id,
      first_name: data.first_name,
      last_name: data.last_name,
      address: data.address,
      updated_at: new Date().toISOString(),
    });

    if (privateError) {
      console.error("Failed to update private data:", privateError);
      return c.json(
        {
          error: "Failed to update private data",
          message: privateError.message,
        },
        500,
      );
    }

    // 2. Update users table (industry_id)
    const { error: userError } = await supabase
      .schema("core")
      .from("users")
      .update({
        industry_id: data.industry_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (userError) {
      console.error("Failed to update user data:", userError);
      return c.json(
        {
          error: "Failed to update user data",
          message: userError.message,
        },
        500,
      );
    }

    // 3. Update core.preferences table (user_types, prerequisites_completed_at, legal acceptance)
    const now = new Date().toISOString();
    const { error: prefsError } = await supabase
      .schema("core")
      .from("preferences")
      .upsert({
        user_id: user.id,
        user_types: data.user_types,
        prerequisites_completed_at: now,
        accepted_privacy_policy_at: now,
        accepted_terms_of_service_at: now,
        privacy_policy_version: "v1.0",
        terms_of_service_version: "v1.0",
        updated_at: now,
      });

    if (prefsError) {
      console.error("Failed to update preferences:", prefsError);
      return c.json(
        {
          error: "Failed to update preferences",
          message: prefsError.message,
        },
        500,
      );
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in prerequisites complete:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default app;
