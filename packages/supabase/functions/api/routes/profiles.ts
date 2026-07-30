import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
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
/**
 * Vanity-URL slug helpers (ported from the legacy tRPC vanity router).
 */

// Slug format enforced by migration 018 (users_slug_format_check): 3-50 chars,
// lowercase alphanumerics and dashes only.
const SLUG_PATTERN = /^[a-z0-9-]+$/;

function normalizeSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const slug = value.toLowerCase().trim();
  if (slug.length < 3 || slug.length > 50) return null;
  if (!SLUG_PATTERN.test(slug)) return null;
  return slug;
}

/**
 * Generate up to 3 alternative slugs when the requested one is taken.
 */
function generateSlugSuggestions(
  baseSlug: string,
  existingSlugs: string[],
): string[] {
  const suggestions: string[] = [];
  const existingSet = new Set(existingSlugs.map((s) => s.toLowerCase()));

  // Strategy 1: numeric suffix
  for (let i = 2; i <= 5; i++) {
    const candidate = `${baseSlug}-${i}`;
    if (!existingSet.has(candidate)) {
      suggestions.push(candidate);
      if (suggestions.length >= 3) break;
    }
  }

  // Strategy 2: common suffixes
  if (suggestions.length < 3) {
    for (const suffix of ["dev", "pro", "official"]) {
      if (suggestions.length >= 3) break;
      const candidate = `${baseSlug}-${suffix}`;
      if (!existingSet.has(candidate)) suggestions.push(candidate);
    }
  }

  // Strategy 3: drop the dashes
  if (suggestions.length < 3) {
    const candidate = baseSlug.replace(/-/g, "");
    if (candidate.length >= 3 && !existingSet.has(candidate)) {
      suggestions.push(candidate);
    }
  }

  return suggestions.slice(0, 3);
}

/**
 * Look up slugs starting with `slug` and turn them into suggestions.
 */
// deno-lint-ignore no-explicit-any
async function suggestAlternatives(
  supabase: any,
  slug: string,
): Promise<string[]> {
  const { data: similarUsers } = await supabase
    .schema("core")
    .from("users")
    .select("slug")
    .like("slug", `${slug}%`)
    .limit(10);

  const existingSlugs = ((similarUsers || []) as { slug?: string | null }[])
    .map((u) => u.slug || "")
    .filter(Boolean);
  return generateSlugSuggestions(slug, existingSlugs);
}

// GET /v1/profiles/slug/check?slug=... - vanity-URL availability check
// (SDK: checkSlugAvailability). Registered before the /slug/{slug} param route
// so it isn't shadowed. Response is UNENVELOPED to match SDK SlugAvailability.
app.get("/slug/check", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }

  const slug = normalizeSlug(c.req.query("slug"));
  if (!slug) {
    return c.json(
      {
        error: "Bad Request",
        message:
          "slug must be 3-50 characters using lowercase letters, numbers and dashes",
      },
      400,
    );
  }

  // The caller's own slug doesn't count as taken — re-saving it is a no-op.
  const { data: existingUser, error } = await supabase
    .schema("core")
    .from("users")
    .select("id, slug")
    .eq("slug", slug)
    .neq("id", user.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking slug availability:", error);
    return c.json(
      { error: "Failed to check slug availability", message: error.message },
      500,
    );
  }

  const available = !existingUser;

  return c.json({
    available,
    suggestions: available ? [] : await suggestAlternatives(supabase, slug),
  }, 200);
});
// PATCH /v1/profiles/slug - change the caller's vanity slug (SDK: updateSlug).
// Enforces the same 30-day cooldown as GET /slug/history and records the change
// in core.slug_change_history. Response is UNENVELOPED (SDK UpdateSlugResponse).
app.patch("/slug", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401,
    );
  }

  let input: Record<string, unknown>;
  try {
    input = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json(
      { error: "Bad Request", message: "Request body must be valid JSON" },
      400,
    );
  }

  const newSlug = normalizeSlug(input?.slug);
  if (!newSlug) {
    return c.json(
      {
        error: "Bad Request",
        message:
          "slug must be 3-50 characters using lowercase letters, numbers and dashes",
      },
      400,
    );
  }

  // 30-day cooldown between changes.
  const { data: lastChange, error: historyError } = await supabase
    .schema("core")
    .from("slug_change_history")
    .select("changed_at")
    .eq("user_id", user.id)
    .order("changed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (historyError && historyError.code !== "PGRST116") {
    console.error("Error checking slug change history:", historyError);
    return c.json(
      {
        error: "Failed to check slug change history",
        message: historyError.message,
      },
      500,
    );
  }

  if (lastChange) {
    const daysSinceChange = (Date.now() -
      new Date(lastChange.changed_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceChange < 30) {
      const daysRemaining = Math.ceil(30 - daysSinceChange);
      const nextChangeAllowed = new Date(
        new Date(lastChange.changed_at).getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      return c.json(
        {
          error: "Slug change not allowed yet",
          message:
            `Slug can only be changed once every 30 days. Next change available in ${daysRemaining} days.`,
          nextChangeAllowed,
          daysRemaining,
        },
        400,
      );
    }
  }

  const { data: currentUser } = await supabase
    .schema("core")
    .from("users")
    .select("slug")
    .eq("id", user.id)
    .single();

  // Taken by somebody else? Return 409 with alternatives.
  const { data: existingUser } = await supabase
    .schema("core")
    .from("users")
    .select("id")
    .eq("slug", newSlug)
    .maybeSingle();

  if (existingUser && existingUser.id !== user.id) {
    return c.json(
      {
        error: "Conflict",
        message: `Slug "${newSlug}" is already taken`,
        suggestions: await suggestAlternatives(supabase, newSlug),
      },
      409,
    );
  }

  const { error: updateError } = await supabase
    .schema("core")
    .from("users")
    .update({ slug: newSlug, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error updating slug:", updateError);
    return c.json(
      { error: "Failed to update slug", message: updateError.message },
      500,
    );
  }

  // History is best-effort — a failed insert shouldn't undo a successful change.
  const { error: historyInsertError } = await supabase
    .schema("core")
    .from("slug_change_history")
    .insert({
      user_id: user.id,
      old_slug: currentUser?.slug ?? null,
      new_slug: newSlug,
    });

  if (historyInsertError) {
    console.error("Failed to record slug change history:", historyInsertError);
  }

  return c.json({
    success: true,
    slug: newSlug,
    nextChangeAllowed: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString(),
  }, 200);
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
