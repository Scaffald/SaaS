/**
 * Profile Widgets REST API
 * Read-only endpoints for profile widget components
 * Supports viewing own profile and other users' profiles
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { type ApiEnv, authMiddleware } from "../middleware/auth.ts";
import { loadSkillLookups, toSkillWidgetEntry } from "../lib/skill-lookups.ts";
import {
  canViewSection,
  loadProfileVisibility,
  type ProfileSection,
  resolveAudience,
} from "../lib/profile-visibility.ts";

const app = new OpenAPIHono<ApiEnv>();
app.use("*", authMiddleware);

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

/**
 * Resolve whose profile a section request is for, and whether it may be served.
 *
 * These endpoints each did `if (!user) return 401` and then
 * `userId || user.id`. The auth check existed to make that fallback possible —
 * without a caller there is no "me" — but it also locked out the anonymous
 * visitor these sections exist for. GET /v1/profiles/slug/{slug} already serves
 * anonymously and hands the page a `visibility` object saying which sections to
 * render; the page then asked for them here and got 401, so every public
 * profile showed "No profile data available" for a profile that had data
 * (#732).
 *
 * An explicit userId needs no fallback, so it is served — subject to the
 * owner's core.preferences.profile_visibility, which is the same rule
 * /slug/{slug} already applies.
 */
async function resolveSectionAccess(
  requestedUserId: string | undefined,
  viewerId: string | undefined,
  section: ProfileSection | null,
): Promise<
  | { ok: true; targetUserId: string; useServiceClient: boolean }
  | { ok: false; status: 401 | 404 }
> {
  const audience = resolveAudience({ requestedUserId, viewerId });
  if (audience.kind === "unauthenticated") return { ok: false, status: 401 };
  if (audience.kind === "self") {
    // Reading your own profile stays on your own client, so RLS still applies.
    return { ok: true, targetUserId: audience.userId, useServiceClient: false };
  }
  if (section === null) {
    return { ok: true, targetUserId: audience.userId, useServiceClient: true };
  }

  const visibility = await loadProfileVisibility(
    getServiceClient(),
    audience.userId,
  );
  if (!canViewSection(audience, section, visibility)) {
    // 404 rather than 403: a hidden section should be indistinguishable from
    // one that holds nothing, or the response confirms what the owner hid.
    return { ok: false, status: 404 };
  }
  // core.user_experience, user_education and user_certifications carry
  // owner-only SELECT policies, so a viewer's client reads nothing of somebody
  // else's profile no matter what the owner published. The visibility check
  // above is the authorization; the service client is only the mechanism that
  // carries it out — the same split profiles.ts already uses for /slug/{slug}.
  return { ok: true, targetUserId: audience.userId, useServiceClient: true };
}

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
 * GET /v1/profiles/widgets/general-info
 * Get general profile information
 */
const generalInfoRoute = createRoute({
  method: "get",
  path: "/general-info",
  tags: ["Profile Widgets"],
  summary: "Get general profile info",
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: "General profile information",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string().uuid(),
            username: z.string().nullable(),
            slug: z.string().nullable(),
            avatar_path: z.string().nullable(),
            avatar_url: z.string().nullable(),
            about: z.string().nullable(),
            headline: z.string().nullable(),
            display_name: z.string().nullable(),
            industry_id: z.string().uuid().nullable(),
            years_of_experience: z.number().nullable(),
            open_to_work: z.boolean().nullable(),
            calculatedYearsOfExperience: z.number(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(generalInfoRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { userId } = c.req.valid("query");

  const access = await resolveSectionAccess(userId, user?.id, null);
  if (!access.ok) {
    return c.json(
      access.status === 401
        ? { error: "Unauthorized" }
        : { error: "not_found", message: "Profile section not available" },
      access.status,
    );
  }
  const targetUserId = access.targetUserId;
  const db = access.useServiceClient ? getServiceClient() : supabase;

  const { data, error } = await db
    .schema("core")
    .from("users")
    .select(
      "id, username, slug, avatar_path, avatar_url, about, headline, display_name, industry_id, years_of_experience, open_to_work",
    )
    .eq("id", targetUserId)
    .single();

  if (error) {
    // No row found (e.g. profile not yet created) → 404 so frontend can show "Complete your profile"
    if (error.code === "PGRST116") {
      return c.json(
        {
          error: "profile_not_found",
          message: "Profile not found. Complete your profile to get started.",
        },
        404,
      );
    }
    return c.json(
      { error: "Failed to fetch profile", message: error.message },
      500,
    );
  }

  return c.json({
    ...data,
    calculatedYearsOfExperience: data.years_of_experience || 0,
  });
});

/**
 * GET /v1/profiles/widgets/experience
 * Get work experience
 */
const experienceRoute = createRoute({
  method: "get",
  path: "/experience",
  tags: ["Profile Widgets"],
  summary: "Get work experience",
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: "Work experience entries",
      content: {
        "application/json": {
          schema: z.array(z.object({
            id: z.string().uuid(),
            user_id: z.string().uuid(),
            job_title: z.string(),
            company_name: z.string(),
            start_date: z.string().nullable(),
            end_date: z.string().nullable(),
            is_current: z.boolean().nullable(),
            location: z.string().nullable(),
            employment_type: z.string().nullable(),
            is_remote: z.boolean().nullable(),
            description: z.string().nullable(),
            created_at: z.string(),
            updated_at: z.string(),
          })),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(experienceRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { userId } = c.req.valid("query");

  const access = await resolveSectionAccess(
    userId,
    user?.id,
    "work_experience",
  );
  if (!access.ok) {
    return c.json(
      access.status === 401
        ? { error: "Unauthorized" }
        : { error: "not_found", message: "Profile section not available" },
      access.status,
    );
  }
  const targetUserId = access.targetUserId;
  const db = access.useServiceClient ? getServiceClient() : supabase;

  const { data, error } = await db
    .schema("core")
    .from("user_experience")
    .select("*")
    .eq("user_id", targetUserId)
    .order("start_date", { ascending: false });

  if (error) {
    return c.json({
      error: "Failed to fetch experience",
      message: error.message,
    }, 500);
  }

  return c.json(data || []);
});

/**
 * GET /v1/profiles/widgets/education
 * Get education
 */
const educationRoute = createRoute({
  method: "get",
  path: "/education",
  tags: ["Profile Widgets"],
  summary: "Get education",
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: "Education entries",
      content: {
        "application/json": {
          schema: z.array(z.object({
            id: z.string().uuid(),
            user_id: z.string().uuid(),
            degree_type: z.string().nullable(),
            field_of_study: z.string().nullable(),
            institution_name: z.string().nullable(),
            start_date: z.string().nullable(),
            end_date: z.string().nullable(),
            is_current: z.boolean().nullable(),
            description: z.string().nullable(),
            location: z.string().nullable(),
            created_at: z.string(),
            updated_at: z.string(),
          })),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(educationRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { userId } = c.req.valid("query");

  const access = await resolveSectionAccess(userId, user?.id, "education");
  if (!access.ok) {
    return c.json(
      access.status === 401
        ? { error: "Unauthorized" }
        : { error: "not_found", message: "Profile section not available" },
      access.status,
    );
  }
  const targetUserId = access.targetUserId;
  const db = access.useServiceClient ? getServiceClient() : supabase;

  const { data, error } = await db
    .schema("core")
    .from("user_education")
    .select("*")
    .eq("user_id", targetUserId)
    .order("start_date", { ascending: false });

  if (error) {
    return c.json({
      error: "Failed to fetch education",
      message: error.message,
    }, 500);
  }

  return c.json(data || []);
});

/**
 * GET /v1/profiles/widgets/skills
 * Get technical skills
 */
const skillsRoute = createRoute({
  method: "get",
  path: "/skills",
  tags: ["Profile Widgets"],
  summary: "Get skills",
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: "Skills",
      content: {
        "application/json": {
          schema: z.array(z.object({
            id: z.string().uuid(),
            taxonomy: z.enum(["csi", "onet"]),
            name: z.string(),
            label: z.string(),
            displayCode: z.string().nullable(),
            proficiency: z.number(),
            yearsExperience: z.number().nullable(),
            verified: z.boolean(),
            metadata: z.record(z.unknown()).nullable(),
          })),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(skillsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { userId } = c.req.valid("query");

  const access = await resolveSectionAccess(userId, user?.id, "skills");
  if (!access.ok) {
    return c.json(
      access.status === 401
        ? { error: "Unauthorized" }
        : { error: "not_found", message: "Profile section not available" },
      access.status,
    );
  }
  const targetUserId = access.targetUserId;
  const db = access.useServiceClient ? getServiceClient() : supabase;

  const { data, error } = await db
    .schema("core")
    .from("user_skills")
    .select("*")
    .eq("user_id", targetUserId)
    .in("skill_taxonomy", ["csi", "onet"]);

  if (error) {
    return c.json(
      { error: "Failed to fetch skills", message: error.message },
      500,
    );
  }

  // Resolve names and display codes. This used to return the raw user_skills
  // rows, which carry only a taxonomy discriminator and a foreign key — no
  // `name`, no `displayCode` — despite the SDK type for this endpoint
  // (SkillWidgetEntry) declaring both. Any consumer rendering `label` got an
  // empty string (#603).
  const rows = data || [];
  const lookups = await loadSkillLookups(supabase, rows);

  return c.json(rows.map((row: unknown) => toSkillWidgetEntry(row, lookups)));
});

/**
 * GET /v1/profiles/widgets/certifications
 * Get certifications
 */
const certificationsRoute = createRoute({
  method: "get",
  path: "/certifications",
  tags: ["Profile Widgets"],
  summary: "Get certifications",
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: "Certifications",
      content: {
        "application/json": {
          schema: z.array(z.object({
            id: z.string().uuid(),
            user_id: z.string().uuid(),
            name: z.string(),
            issuing_organization: z.string().nullable(),
            issue_date: z.string().nullable(),
            expiration_date: z.string().nullable(),
            credential_id: z.string().nullable(),
            credential_url: z.string().nullable(),
            does_not_expire: z.boolean().nullable(),
            created_at: z.string(),
            updated_at: z.string(),
          })),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(certificationsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { userId } = c.req.valid("query");

  const access = await resolveSectionAccess(userId, user?.id, "certifications");
  if (!access.ok) {
    return c.json(
      access.status === 401
        ? { error: "Unauthorized" }
        : { error: "not_found", message: "Profile section not available" },
      access.status,
    );
  }
  const targetUserId = access.targetUserId;
  const db = access.useServiceClient ? getServiceClient() : supabase;

  const { data, error } = await db
    .schema("core")
    .from("user_certifications")
    .select("*")
    .eq("user_id", targetUserId)
    .eq("is_active", true);

  if (error) {
    return c.json({
      error: "Failed to fetch certifications",
      message: error.message,
    }, 500);
  }

  return c.json(data || []);
});

/**
 * GET /v1/profiles/widgets/preferences
 * Get work preferences (own profile only)
 */
const preferencesRoute = createRoute({
  method: "get",
  path: "/preferences",
  tags: ["Profile Widgets"],
  summary: "Get work preferences",
  responses: {
    200: {
      description: "Work preferences",
      content: {
        "application/json": {
          schema: z.object({
            availability: z.string().nullable().optional(),
            preferred_work_locations: z.array(z.string()).nullable().optional(),
            open_to_travel: z.boolean().nullable().optional(),
            travel_distance_miles: z.number().nullable().optional(),
            career_level: z.string().nullable().optional(),
            hourly_rate_cents: z.number().nullable().optional(),
            us_resident: z.boolean().nullable().optional(),
            us_passport: z.boolean().nullable().optional(),
            authorized_countries: z.array(z.string()).nullable().optional(),
            veteran: z.boolean().nullable().optional(),
            military_status: z.string().nullable().optional(),
            drivers_license_classes: z.array(z.string()).nullable().optional(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(preferencesRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabase
    .schema("core")
    .from("preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return c.json({
      error: "Failed to fetch preferences",
      message: error.message,
    }, 500);
  }

  return c.json(data || {});
});

export default app;
