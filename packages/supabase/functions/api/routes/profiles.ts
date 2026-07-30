import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware, requireAuth } from "../middleware/auth.ts";
import { rateLimiter } from "../middleware/rate-limiter.ts";

const app = new OpenAPIHono();

// Apply auth middleware to all routes
app.use("*", authMiddleware);

// Apply rate limiting to all profile endpoints
// Free tier: 100 requests per 15 minutes
app.use(
  "*",
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    keyGenerator: (c) => {
      const user = c.get("user");
      const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") ||
        "unknown";
      return user ? `user:${user.id}` : `ip:${ip}`;
    },
  }),
);

// Static routes first (so they match before /{username})
// GET /v1/profiles/current - current user (SDK: getCurrentUser)
app.get("/current", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }
  return c.json({ id: user.id, email: user.email ?? null }, 200);
});
// GET /v1/profiles/slug/history - vanity-URL slug change history + 30-day cooldown
// (SDK: getSlugHistory). Ported from the legacy tRPC vanity router so the Vanity
// URL panel resolves instead of 404ing.
app.get("/slug/history", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }

  const { data: history, error } = await supabase
    .schema("core")
    .from("slug_change_history")
    .select("old_slug, new_slug, changed_at")
    .eq("user_id", user.id)
    .order("changed_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching slug history:", error);
    return c.json(
      { error: "Failed to fetch slug history", message: error.message },
      500,
    );
  }

  // 30-day cooldown between slug changes (mirrors updateSlug enforcement).
  const lastChange = history?.[0];
  let nextChangeAllowed: string | null = null;
  let daysRemaining: number | null = null;
  if (lastChange) {
    const daysSinceChange = (Date.now() -
      new Date(lastChange.changed_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceChange < 30) {
      daysRemaining = Math.ceil(30 - daysSinceChange);
      nextChangeAllowed = new Date(
        new Date(lastChange.changed_at).getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
    }
  }

  return c.json({ history: history ?? [], nextChangeAllowed, daysRemaining });
});
// GET /v1/profiles/general - general profile (SDK: getGeneralInfo)
app.get("/general", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const userToken = c.get("userToken");
  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }
  const { data: authUser } = await supabase.auth.getUser(userToken);
  const { data: profile } = await supabase
    .schema("core")
    .from("users")
    .select("avatar_path, about")
    .eq("id", user.id)
    .single();
  const { data: privateData } = await supabase
    .schema("core")
    .from("profile")
    .select("first_name, last_name, address, phone")
    .eq("user_id", user.id)
    .single();
  const phone = privateData?.phone ?? authUser?.user?.phone ?? "";
  return c.json({
    first_name: privateData?.first_name ?? "",
    last_name: privateData?.last_name ?? "",
    avatar_path: profile?.avatar_path ?? "",
    email: authUser?.user?.email ?? "",
    phone,
    about: profile?.about ?? null,
    address: privateData?.address ?? null,
  }, 200);
});
// PATCH /v1/profiles/general - update general (SDK: updateGeneralInfo)
app.patch("/general", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }
  const input = (await c.req.json()) as Record<string, unknown>;
  if (input.avatar_path !== undefined || input.about !== undefined) {
    const profileUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.avatar_path !== undefined) {
      profileUpdate.avatar_path = input.avatar_path;
    }
    if (input.about !== undefined) profileUpdate.about = input.about;
    const { error } = await supabase.schema("core").from("users").update(
      profileUpdate,
    ).eq("id", user.id);
    if (error) {
      return c.json({
        error: "Failed to update profile",
        message: error.message,
      }, 500);
    }
  }
  if (
    input.first_name !== undefined ||
    input.last_name !== undefined ||
    input.address !== undefined ||
    input.phone !== undefined
  ) {
    const privateUpdate: Record<string, unknown> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };
    if (input.first_name !== undefined) {
      privateUpdate.first_name = input.first_name;
    }
    if (input.last_name !== undefined) {
      privateUpdate.last_name = input.last_name;
    }
    if (input.address !== undefined) privateUpdate.address = input.address;
    if (input.phone !== undefined) privateUpdate.phone = input.phone;
    const { error } = await supabase.schema("core").from("profile").upsert(
      privateUpdate,
    );
    if (error) {
      return c.json({
        error: "Failed to update profile",
        message: error.message,
      }, 500);
    }
  }
  return c.json({ success: true }, 200);
});

/**
 * Zod Schemas for Profiles API
 */

// Public user profile schema
const publicProfileSchema = z
  .object({
    id: z.string().uuid(),
    username: z.string(),
    full_name: z.string().nullable(),
    bio: z.string().nullable(),
    avatar_url: z.string().url().nullable(),
    location: z.string().nullable(),
    website: z.string().url().nullable(),
    linkedin_url: z.string().url().nullable(),
    github_url: z.string().url().nullable(),
    years_experience: z.number().int().nullable(),
    current_position: z.string().nullable(),
    skills: z.array(z.string()).nullable(),
    certifications: z
      .array(
        z.object({
          name: z.string(),
          issuer: z.string().nullable(),
          issued_at: z.string().nullable(),
        }),
      )
      .nullable(),
    created_at: z.string(),
  })
  .openapi("PublicProfile");

// Which profile sections a public viewer may see (core.preferences.profile_visibility)
const profileVisibilitySchema = z
  .object({
    work_experience: z.boolean(),
    education: z.boolean(),
    skills: z.boolean(),
    certifications: z.boolean(),
    reviews: z.boolean(),
    contact_info: z.boolean(),
  })
  .openapi("ProfileVisibility");

// Vanity-URL profile schema (GET /slug/{slug})
const profileBySlugSchema = z
  .object({
    id: z.string().uuid(),
    username: z.string(),
    slug: z.string(),
    display_name: z.string().nullable(),
    headline: z.string().nullable(),
    bio: z.string().nullable(),
    about: z.unknown(),
    avatar_url: z.string().nullable(),
    avatar_path: z.string().nullable(),
    location: z.string().nullable(),
    industry_id: z.string().uuid().nullable(),
    industries: z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        slug: z.string(),
      })
      .nullable(),
    years_of_experience: z.number().int().nullable(),
    open_to_work: z.boolean().nullable(),
    visibility: profileVisibilitySchema,
    created_at: z.string(),
    // Aliases matching the PublicProfile shape the SSR loader and JSON-LD use
    // (see apps/scaffald/utils/public-content-loader.ts). Same mapping the
    // /{username} route applies: full_name = display_name, current_position = headline.
    full_name: z.string().nullable(),
    current_position: z.string().nullable(),
  })
  .openapi("ProfileBySlug");

// Organization profile schema
const organizationProfileSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    logo_url: z.string().url().nullable(),
    website: z.string().url().nullable(),
    industry: z.string().nullable(),
    size: z.string().nullable(),
    location: z.string().nullable(),
    founded_year: z.number().int().nullable(),
    created_at: z.string(),
    job_count: z.number().int(),
  })
  .openapi("OrganizationProfile");

// Employer profile schema
const employerProfileSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    logo_url: z.string().url().nullable(),
    website: z.string().url().nullable(),
    industry: z.string().nullable(),
    location: z.string().nullable(),
    created_at: z.string(),
    active_jobs_count: z.number().int(),
  })
  .openapi("EmployerProfile");

// Response schemas
const profileResponseSchema = z
  .object({
    data: publicProfileSchema,
  })
  .openapi("ProfileResponse");

const organizationResponseSchema = z
  .object({
    data: organizationProfileSchema,
  })
  .openapi("OrganizationResponse");

const employerResponseSchema = z
  .object({
    data: employerProfileSchema,
  })
  .openapi("EmployerResponse");

// Error response schema
const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi("ErrorResponse");

// Rate limit error response
const rateLimitErrorSchema = z
  .object({
    error: z.string(),
    message: z.string(),
    retryAfter: z.number().int().openapi({
      description: "Seconds until rate limit resets",
    }),
  })
  .openapi("RateLimitError");

/**
 * GET /v1/profiles/:username
 * Get public user profile by username
 */
const getProfileRoute = createRoute({
  method: "get",
  path: "/{username}",
  tags: ["Profiles"],
  summary: "Get public profile",
  description:
    "Retrieve public profile information for a user by their username. Rate limited to 100 requests per 15 minutes.",
  request: {
    params: z.object({
      username: z.string().min(3).max(50).openapi({
        description: "Username (3-50 characters)",
        example: "johndoe",
      }),
    }),
  },
  responses: {
    200: {
      description: "Public profile data",
      content: {
        "application/json": {
          schema: profileResponseSchema,
        },
      },
    },
    404: {
      description: "Profile not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    429: {
      description: "Too many requests - rate limit exceeded",
      content: {
        "application/json": {
          schema: rateLimitErrorSchema,
        },
      },
      headers: z.object({
        "X-RateLimit-Limit": z.string().openapi({
          description: "Request limit per window",
        }),
        "X-RateLimit-Remaining": z
          .string()
          .openapi({ description: "Remaining requests in current window" }),
        "X-RateLimit-Reset": z
          .string()
          .openapi({ description: "Unix timestamp when window resets" }),
        "Retry-After": z.string().openapi({
          description: "Seconds until rate limit resets",
        }),
      }),
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
});

app.openapi(getProfileRoute, async (c) => {
  const supabase = c.get("supabase");
  const { username } = c.req.valid("param");

  // Get user by username from core.users (public profile data)
  const { data: user, error: userError } = await supabase
    .schema("core")
    .from("users")
    .select(`
      id,
      username,
      slug,
      display_name,
      headline,
      bio,
      avatar_url,
      avatar_path,
      years_of_experience,
      created_at
    `)
    .eq("username", username)
    .single();

  if (userError) {
    if (userError.code === "PGRST116") {
      return c.json(
        {
          error: "Not Found",
          message:
            `Profile with username '${username}' not found or is not public`,
        },
        404,
      );
    }
    console.error("Error fetching profile:", userError);
    return c.json(
      {
        error: "Internal Server Error",
        message: userError.message,
      },
      500,
    );
  }

  // Get location from core.profile (PII table)
  const { data: privateProfile } = await supabase
    .schema("core")
    .from("profile")
    .select("location")
    .eq("user_id", user.id)
    .single();

  // Get user skills
  const { data: skills } = await supabase
    .schema("core")
    .from("user_skills")
    .select("skill:skills(name)")
    .eq("user_id", user.id)
    .limit(20);

  // Get user certifications (join certifications for name and issuing_organization)
  const { data: certRows } = await supabase
    .schema("core")
    .from("user_certifications")
    .select("certifications(name, issuing_organization), issue_date")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(10);

  const certifications = (certRows || []).map((
    row: {
      certifications?: { name?: string; issuing_organization?: string } | null;
      issue_date?: string;
    },
  ) => ({
    name: row.certifications?.name ?? "",
    issuer: row.certifications?.issuing_organization ?? null,
    issued_at: row.issue_date ?? null,
  }));

  // Map to public profile shape (full_name from display_name; website/linkedin/github/current_position not in core schema, return null)
  const profile = {
    id: user.id,
    username: user.username ?? "",
    full_name: user.display_name ?? null,
    bio: user.bio ?? null,
    avatar_url: user.avatar_url ?? null,
    location: privateProfile?.location ?? null,
    website: null as string | null,
    linkedin_url: null as string | null,
    github_url: null as string | null,
    years_experience: user.years_of_experience ?? null,
    current_position: user.headline ?? null,
    created_at: user.created_at,
  };

  return c.json(
    {
      data: {
        ...profile,
        skills: skills?.map((s: { skill?: { name?: string } | null }) =>
          s.skill?.name
        ).filter(Boolean) || [],
        certifications,
      },
    },
    200,
  );
});

/**
 * GET /v1/profiles/slug/:slug
 * Get public profile by vanity slug
 *
 * core.users.slug is a separate column from core.users.username: it is seeded
 * from the username at signup (004_functions.sql) but users can change it
 * independently via the vanity-URL panel (30-day cooldown, tracked in
 * core.slug_change_history), so a slug lookup cannot be folded into
 * GET /{username}. Falls back to a username match so links still resolve for
 * rows whose slug was never backfilled — 018 skips names that don't fit the
 * 3-50 char [a-z0-9-] constraint.
 */
const getProfileBySlugRoute = createRoute({
  method: "get",
  path: "/slug/{slug}",
  tags: ["Profiles"],
  summary: "Get public profile by vanity slug",
  description:
    "Retrieve public profile information for a user by their vanity slug. Rate limited to 100 requests per 15 minutes.",
  request: {
    params: z.object({
      slug: z.string().min(3).max(50).openapi({
        description: "Vanity slug (3-50 characters)",
        example: "john-doe",
      }),
    }),
  },
  responses: {
    200: {
      // Unenveloped, unlike the /{username} and /organizations/{slug} routes:
      // the SDK returns the response body verbatim, and its ProfileBySlug type
      // expects the profile fields at the top level. The other unenveloped
      // routes in this router (/general, /slug/history) work the same way.
      description: "Public profile data",
      content: {
        "application/json": {
          schema: profileBySlugSchema,
        },
      },
    },
    404: {
      description: "Profile not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    429: {
      description: "Too many requests - rate limit exceeded",
      content: {
        "application/json": {
          schema: rateLimitErrorSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
});

// Registered after the static /slug/history route above so that one keeps
// winning; any future /slug/* static route must also be declared before this.
app.openapi(getProfileBySlugRoute, async (c) => {
  const supabase = c.get("supabase");
  const { slug } = c.req.valid("param");

  const selectColumns = `
      id,
      username,
      slug,
      display_name,
      headline,
      bio,
      about,
      avatar_url,
      avatar_path,
      open_to_work,
      years_of_experience,
      industry_id,
      industries:industries(id, name, slug),
      created_at
    `;

  let { data: user, error: userError } = await supabase
    .schema("core")
    .from("users")
    .select(selectColumns)
    .eq("slug", slug)
    .maybeSingle();

  if (!userError && !user) {
    // Legacy rows without a backfilled slug are still reachable by username.
    ({ data: user, error: userError } = await supabase
      .schema("core")
      .from("users")
      .select(selectColumns)
      .eq("username", slug)
      .maybeSingle());
  }

  if (userError) {
    console.error("Error fetching profile by slug:", userError);
    return c.json(
      {
        error: "Internal Server Error",
        message: userError.message,
      },
      500,
    );
  }

  if (!user) {
    return c.json(
      {
        error: "Not Found",
        message: `Profile with slug '${slug}' not found or is not public`,
      },
      404,
    );
  }

  // Get location from core.profile (PII table)
  const { data: privateProfile } = await supabase
    .schema("core")
    .from("profile")
    .select("location")
    .eq("user_id", user.id)
    .single();

  // Section visibility lives in core.preferences, which is RLS-scoped to the
  // owner (preferences_own_all). A public viewer's client reads nothing, so use
  // the service-role client — otherwise every hidden section would fall back to
  // the permissive default and leak.
  let visibility = {
    work_experience: true,
    education: true,
    skills: true,
    certifications: true,
    reviews: true,
    contact_info: false,
  };
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (supabaseUrl && supabaseServiceKey) {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: preferences } = await serviceClient
      .schema("core")
      .from("preferences")
      .select("profile_visibility")
      .eq("user_id", user.id)
      .maybeSingle();
    if (preferences?.profile_visibility) {
      visibility = { ...visibility, ...preferences.profile_visibility };
    }
  }

  const industries = Array.isArray(user.industries)
    ? user.industries[0] ?? null
    : user.industries ?? null;

  return c.json(
    {
      id: user.id,
      username: user.username ?? "",
      slug: user.slug ?? user.username ?? "",
      display_name: user.display_name ?? null,
      headline: user.headline ?? null,
      bio: user.bio ?? null,
      about: user.about ?? null,
      avatar_url: user.avatar_url ?? null,
      avatar_path: user.avatar_path ?? null,
      location: privateProfile?.location ?? null,
      industry_id: user.industry_id ?? null,
      industries,
      years_of_experience: user.years_of_experience ?? null,
      open_to_work: user.open_to_work ?? null,
      visibility,
      created_at: user.created_at,
      // SSR-loader aliases; see profileBySlugSchema.
      full_name: user.display_name ?? null,
      current_position: user.headline ?? null,
    },
    200,
  );
});

/**
 * GET /v1/profiles/organizations/:slug
 * Get organization profile by slug
 */
const getOrganizationRoute = createRoute({
  method: "get",
  path: "/organizations/{slug}",
  tags: ["Profiles"],
  summary: "Get organization profile",
  description:
    "Retrieve public profile information for an organization by their slug. Rate limited to 100 requests per 15 minutes.",
  request: {
    params: z.object({
      slug: z.string().min(3).max(50).openapi({
        description: "Organization slug (3-50 characters)",
        example: "acme-corp",
      }),
    }),
  },
  responses: {
    200: {
      description: "Organization profile data",
      content: {
        "application/json": {
          schema: organizationResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    429: {
      description: "Too many requests - rate limit exceeded",
      content: {
        "application/json": {
          schema: rateLimitErrorSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
});

app.openapi(getOrganizationRoute, async (c) => {
  const supabase = c.get("supabase");
  const { slug } = c.req.valid("param");

  // Get organization profile
  const { data: organization, error } = await supabase
    .schema("core")
    .from("organizations")
    .select(`
      id,
      slug,
      name,
      description,
      logo_url,
      website,
      industry,
      size,
      location,
      founded_year,
      created_at
    `)
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return c.json(
        {
          error: "Not Found",
          message:
            `Organization with slug '${slug}' not found or is not public`,
        },
        404,
      );
    }
    console.error("Error fetching organization:", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: error.message,
      },
      500,
    );
  }

  // Get count of published jobs
  const { count } = await supabase
    .schema("core")
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id)
    .eq("status", "published");

  return c.json(
    {
      data: {
        ...organization,
        job_count: count || 0,
      },
    },
    200,
  );
});

/**
 * GET /v1/profiles/employers/:slug
 * Get employer profile by slug
 */
const getEmployerRoute = createRoute({
  method: "get",
  path: "/employers/{slug}",
  tags: ["Profiles"],
  summary: "Get employer profile",
  description:
    "Retrieve public profile information for an employer by their slug. Rate limited to 100 requests per 15 minutes.",
  request: {
    params: z.object({
      slug: z.string().min(3).max(50).openapi({
        description: "Employer slug (3-50 characters)",
        example: "tech-startup",
      }),
    }),
  },
  responses: {
    200: {
      description: "Employer profile data",
      content: {
        "application/json": {
          schema: employerResponseSchema,
        },
      },
    },
    404: {
      description: "Employer not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    429: {
      description: "Too many requests - rate limit exceeded",
      content: {
        "application/json": {
          schema: rateLimitErrorSchema,
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
});

app.openapi(getEmployerRoute, async (c) => {
  const supabase = c.get("supabase");
  const { slug } = c.req.valid("param");

  // Get employer profile
  const { data: employer, error } = await supabase
    .schema("core")
    .from("employers")
    .select(`
      id,
      slug,
      name,
      description,
      logo_url,
      website,
      industry,
      location,
      created_at
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return c.json(
        {
          error: "Not Found",
          message: `Employer with slug '${slug}' not found or is not active`,
        },
        404,
      );
    }
    console.error("Error fetching employer:", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: error.message,
      },
      500,
    );
  }

  // Get count of active jobs
  const { count } = await supabase
    .schema("core")
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("employer_id", employer.id)
    .eq("status", "published");

  return c.json(
    {
      data: {
        ...employer,
        active_jobs_count: count || 0,
      },
    },
    200,
  );
});

// Generate OpenAPI documentation
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Scaffald Profiles API",
    version: "1.0.0",
    description: "Public API for profile discovery with rate limiting",
  },
});

export default app;
