/**
 * Prerequisites REST API
 * Handles user onboarding prerequisites
 * Migrated from: packages/supabase/functions/trpc/routers/prerequisites.router.ts
 *
 * Versioned legal acceptance (migration 342): the required Terms of
 * Service / Privacy Policy versions live in core.legal_documents (one
 * is_current row per doc_type). /check compares each user's accepted version
 * against the current one — acceptance of a superseded version no longer
 * counts, which is what lets a published version bump force re-acceptance
 * with no code deploy. Two discriminators tell clients WHICH blocking flow
 * to show:
 *   needsOnboarding      — profile fields missing → full onboarding form
 *   needsLegalAcceptance — profile complete, legal missing/stale → the
 *                          lightweight /legal-update accept screen
 * isComplete === !needsOnboarding && !needsLegalAcceptance. Future gates add
 * another needsX discriminator + sub-object without disturbing consumers.
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { type ApiEnv, authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono<ApiEnv>();

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

const legalDocStateSchema = z
  .object({
    requiredVersion: z.string(),
    effectiveAt: z.string(),
    url: z.string(),
    acceptedVersion: z.string().nullable(),
    acceptedAt: z.string().nullable(),
    needsAcceptance: z.boolean(),
  })
  .openapi("LegalDocState");

const legalStateSchema = z
  .object({
    needsAcceptance: z.boolean(),
    documents: z.object({
      terms_of_service: legalDocStateSchema,
      privacy_policy: legalDocStateSchema,
    }),
  })
  .openapi("LegalState");

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
    needsOnboarding: z.boolean(),
    needsLegalAcceptance: z.boolean(),
    legal: legalStateSchema,
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

const acceptLegalRequestSchema = z
  .object({
    accepts_terms_of_service: z
      .literal(true, {
        errorMap: () => ({ message: "You must accept the Terms of Service" }),
      }),
    accepts_privacy_policy: z
      .literal(true, {
        errorMap: () => ({ message: "You must accept the Privacy Policy" }),
      }),
  })
  .openapi("AcceptLegalRequest");

const acceptLegalResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi("AcceptLegalResponse");

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi("ErrorResponse");

// ============================================================================
// Legal document helpers
// ============================================================================

interface LegalDocRow {
  doc_type: "terms_of_service" | "privacy_policy";
  version: string;
  effective_at: string;
  url: string;
  title: string | null;
}

interface CurrentLegalDocs {
  terms: LegalDocRow;
  privacy: LegalDocRow;
}

// deno-lint-ignore no-explicit-any
async function getCurrentLegalDocs(
  supabase: any,
): Promise<CurrentLegalDocs | null> {
  const { data, error } = await supabase
    .schema("core")
    .from("legal_documents")
    .select("doc_type, version, effective_at, url, title")
    .eq("is_current", true);

  if (error) {
    console.error("Failed to fetch current legal documents:", error);
    return null;
  }

  const terms = data?.find((d: LegalDocRow) =>
    d.doc_type === "terms_of_service"
  );
  const privacy = data?.find((d: LegalDocRow) =>
    d.doc_type === "privacy_policy"
  );
  if (!terms || !privacy) {
    console.error(
      "core.legal_documents is missing an is_current row — expected one per doc_type, got:",
      data,
    );
    return null;
  }
  return { terms, privacy };
}

function buildLegalDocState(
  doc: LegalDocRow,
  acceptedAt: string | null,
  acceptedVersion: string | null,
) {
  return {
    requiredVersion: doc.version,
    effectiveAt: doc.effective_at,
    url: doc.url,
    acceptedVersion,
    acceptedAt,
    needsAcceptance: !acceptedAt || acceptedVersion !== doc.version,
  };
}

/**
 * Write the acceptance audit rows. The operative record is the stamp in
 * core.preferences — a consent_records failure is logged loudly but never
 * fails the request.
 */
// deno-lint-ignore no-explicit-any
async function recordLegalConsent(supabase: any, opts: {
  userId: string;
  docs: CurrentLegalDocs;
  method: "form_submission" | "button_click";
  source: "onboarding_complete" | "legal_reacceptance";
  userAgent: string | null;
  ipAddress: string | null;
}): Promise<void> {
  const base = {
    user_id: opts.userId,
    consent_given: true,
    consent_method: opts.method,
    user_agent: opts.userAgent,
    ip_address: opts.ipAddress,
    metadata: { source: opts.source },
  };
  const { error } = await supabase.from("consent_records").insert([
    {
      ...base,
      consent_type: "terms_of_service",
      consent_version: opts.docs.terms.version,
      consent_text: opts.source === "onboarding_complete"
        ? "I agree to the Terms of Service"
        : `Accepted the updated Terms of Service (version ${opts.docs.terms.version}) via Agree and continue`,
    },
    {
      ...base,
      consent_type: "privacy_policy",
      consent_version: opts.docs.privacy.version,
      consent_text: opts.source === "onboarding_complete"
        ? "I agree to the Privacy Policy"
        : `Accepted the updated Privacy Policy (version ${opts.docs.privacy.version}) via Agree and continue`,
    },
  ]);
  if (error) {
    console.error(
      `Failed to write consent_records audit rows (source=${opts.source}, user=${opts.userId}):`,
      error,
    );
  }
}

function clientIp(header: string | undefined): string | null {
  if (!header) return null;
  const first = header.split(",")[0]?.trim();
  return first || null;
}

// ============================================================================
// Routes
// ============================================================================

// GET /check - Check prerequisites completion status
const checkRoute = createRoute({
  method: "get",
  path: "/check",
  summary: "Check prerequisites status",
  description:
    "Returns whether all required onboarding prerequisites are completed for the current user, including whether the currently-published legal document versions have been accepted.",
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

  // When unauthenticated, return default "incomplete" so clients (e.g. onboarding)
  // don't get 401. Legal doc info is still fetched (anon SELECT is allowed) so the
  // shape stays consistent; on failure a placeholder keeps this path 200-only.
  if (!user) {
    const docs = await getCurrentLegalDocs(supabase);
    const placeholder = {
      requiredVersion: "",
      effectiveAt: "",
      url: "",
      acceptedVersion: null,
      acceptedAt: null,
      needsAcceptance: false,
    };
    return c.json({
      isComplete: false,
      hasName: false,
      hasAddress: false,
      hasUserTypes: false,
      hasIndustry: false,
      hasAcceptedPrivacy: false,
      hasAcceptedTerms: false,
      completedAt: null,
      needsOnboarding: true,
      needsLegalAcceptance: false,
      legal: {
        needsAcceptance: false,
        documents: {
          terms_of_service: docs
            ? buildLegalDocState(docs.terms, null, null)
            : placeholder,
          privacy_policy: docs
            ? buildLegalDocState(docs.privacy, null, null)
            : placeholder,
        },
      },
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
    // Required legal versions — fail closed: without them we cannot assert
    // that a user's acceptance is current.
    const docs = await getCurrentLegalDocs(supabase);
    if (!docs) {
      return c.json(
        {
          error: "Legal documents unavailable",
          message: "core.legal_documents has no current rows",
        },
        500,
      );
    }

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

    // Get preferences (user_types, prerequisites_completed_at, legal acceptance + versions)
    const { data: preferences, error: prefsError } = await supabase
      .schema("core")
      .from("preferences")
      .select(
        "user_types, prerequisites_completed_at, accepted_privacy_policy_at, accepted_terms_of_service_at, privacy_policy_version, terms_of_service_version",
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

    // Check if all required profile fields are present
    const hasName = privateData?.first_name && privateData?.last_name;
    const hasAddress = privateData?.address?.street &&
      privateData?.address?.city &&
      privateData?.address?.state &&
      privateData?.address?.zip;
    const hasUserTypes = preferences?.user_types &&
      preferences.user_types.length > 0;
    const hasIndustry = userData?.industry_id;

    // Legal acceptance only counts at the CURRENT version — acceptance of a
    // superseded version routes the user to re-acceptance (SC-110 + migration
    // 342). Legacy rows all carry 'v1.0', which the migration seeds as current,
    // so nobody is retroactively un-onboarded by this deploy.
    const termsState = buildLegalDocState(
      docs.terms,
      preferences?.accepted_terms_of_service_at || null,
      preferences?.terms_of_service_version || null,
    );
    const privacyState = buildLegalDocState(
      docs.privacy,
      preferences?.accepted_privacy_policy_at || null,
      preferences?.privacy_policy_version || null,
    );
    const hasAcceptedTerms = !termsState.needsAcceptance;
    const hasAcceptedPrivacy = !privacyState.needsAcceptance;

    const needsOnboarding =
      !(hasName && hasAddress && hasUserTypes && hasIndustry);
    const legalNeedsAcceptance = termsState.needsAcceptance ||
      privacyState.needsAcceptance;
    const needsLegalAcceptance = !needsOnboarding && legalNeedsAcceptance;
    const isComplete = !needsOnboarding && !legalNeedsAcceptance;

    return c.json({
      isComplete,
      hasName: !!hasName,
      hasAddress: !!hasAddress,
      hasUserTypes: !!hasUserTypes,
      hasIndustry: !!hasIndustry,
      hasAcceptedPrivacy,
      hasAcceptedTerms,
      completedAt: preferences?.prerequisites_completed_at || null,
      needsOnboarding,
      needsLegalAcceptance,
      legal: {
        needsAcceptance: legalNeedsAcceptance,
        documents: {
          terms_of_service: termsState,
          privacy_policy: privacyState,
        },
      },
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
    // The versions being accepted — resolved up front so a missing-config
    // failure happens before any writes.
    const docs = await getCurrentLegalDocs(supabase);
    if (!docs) {
      return c.json(
        {
          error: "Legal documents unavailable",
          message: "core.legal_documents has no current rows",
        },
        500,
      );
    }

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

    // 3. Update core.preferences table (user_types, prerequisites_completed_at,
    //    legal acceptance stamped at the CURRENT published versions)
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
        privacy_policy_version: docs.privacy.version,
        terms_of_service_version: docs.terms.version,
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

    await recordLegalConsent(supabase, {
      userId: user.id,
      docs,
      method: "form_submission",
      source: "onboarding_complete",
      userAgent: c.req.header("user-agent") || null,
      ipAddress: clientIp(c.req.header("x-forwarded-for")),
    });

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

// POST /accept-legal - Re-accept the current legal document versions
//
// Used by the lightweight /legal-update screen shown to already-onboarded
// users after a version bump. Deliberately allowed for profile-incomplete
// users too — harmless, onboarding still gates them.
const acceptLegalRoute = createRoute({
  method: "post",
  path: "/accept-legal",
  summary: "Accept current legal document versions",
  description:
    "Records acceptance of the currently-published Terms of Service and Privacy Policy versions for the authenticated user.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: acceptLegalRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: acceptLegalResponseSchema },
      },
      description: "Acceptance recorded",
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

app.openapi(acceptLegalRoute, async (c) => {
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
  const result = acceptLegalRequestSchema.safeParse(input);
  if (!result.success) {
    return c.json(
      {
        error: "Validation error",
        message: result.error.message,
      },
      400,
    );
  }

  try {
    const docs = await getCurrentLegalDocs(supabase);
    if (!docs) {
      return c.json(
        {
          error: "Legal documents unavailable",
          message: "core.legal_documents has no current rows",
        },
        500,
      );
    }

    const now = new Date().toISOString();
    const { error: prefsError } = await supabase
      .schema("core")
      .from("preferences")
      .upsert({
        user_id: user.id,
        accepted_privacy_policy_at: now,
        accepted_terms_of_service_at: now,
        privacy_policy_version: docs.privacy.version,
        terms_of_service_version: docs.terms.version,
        updated_at: now,
      });

    if (prefsError) {
      console.error("Failed to record legal acceptance:", prefsError);
      return c.json(
        {
          error: "Failed to record legal acceptance",
          message: prefsError.message,
        },
        500,
      );
    }

    await recordLegalConsent(supabase, {
      userId: user.id,
      docs,
      method: "button_click",
      source: "legal_reacceptance",
      userAgent: c.req.header("user-agent") || null,
      ipAddress: clientIp(c.req.header("x-forwarded-for")),
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in accept-legal:", error);
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
