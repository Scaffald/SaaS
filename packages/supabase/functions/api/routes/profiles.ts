import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { updateGeneralSchema } from "../lib/general-info-schema.ts";
import { authMiddleware, requireAuth } from "../middleware/auth.ts";
import { rateLimiter } from "../middleware/rate-limiter.ts";

const app = new OpenAPIHono();

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

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

  // maybeSingle, not single: a user with no core.profile row yet is a normal
  // state, not an error. And both errors are checked — before #588 they were
  // dropped on the floor, so a grant gap or an RLS denial returned 200 with
  // every field blank, which the client rendered as an editable empty form and
  // then happily saved back over the real data (#580).
  const { data: profile, error: profileError } = await supabase
    .schema("core")
    .from("users")
    .select("avatar_path, about, headline")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    return c.json({
      error: "Failed to load profile",
      message: profileError.message,
    }, 500);
  }

  const { data: privateData, error: privateError } = await supabase
    .schema("core")
    .from("profile")
    .select("first_name, last_name, address, phone")
    .eq("user_id", user.id)
    .maybeSingle();
  if (privateError) {
    return c.json({
      error: "Failed to load profile",
      message: privateError.message,
    }, 500);
  }

  const phone = privateData?.phone ?? authUser?.user?.phone ?? "";
  return c.json({
    first_name: privateData?.first_name ?? "",
    last_name: privateData?.last_name ?? "",
    avatar_path: profile?.avatar_path ?? "",
    email: authUser?.user?.email ?? "",
    phone,
    headline: profile?.headline ?? "",
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
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({
      error: "Invalid request",
      message: "Body must be valid JSON",
    }, 400);
  }

  const parsed = updateGeneralSchema.safeParse(rawBody);
  if (!parsed.success) {
    return c.json({
      error: "Invalid request",
      message: "One or more fields are invalid",
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    }, 400);
  }
  const input = parsed.data;

  // An empty patch is a no-op, not a licence to write nothing over everything.
  if (Object.keys(input).length === 0) {
    return c.json({ success: true }, 200);
  }

  if (
    input.avatar_path !== undefined || input.about !== undefined ||
    input.headline !== undefined
  ) {
    const profileUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.avatar_path !== undefined) {
      profileUpdate.avatar_path = input.avatar_path;
    }
    if (input.about !== undefined) profileUpdate.about = input.about;
    if (input.headline !== undefined) profileUpdate.headline = input.headline;
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

type UserSkillRow = {
  csi_skill_id?: string | null;
  onet_occupation_id?: string | null;
  soft_skill_id?: string | null;
};

/**
 * Resolve core.user_skills rows to display names.
 *
 * There is no core.skills relationship to embed: user_skills_taxonomy_check
 * makes every row point at exactly one catalog — data.masterformat (csi),
 * onet.occupation_data (onet), or core.soft_skills (soft_skills). Ids are
 * batched per catalog so this stays three queries regardless of row count.
 *
 * Takes the *caller's* client, not the service client: these are public
 * reference tables that already grant SELECT to anon, and core.soft_skills
 * grants nothing to service_role, so reading them as service_role fails.
 */
async function resolveSkillNames(
  // deno-lint-ignore no-explicit-any
  catalogs: any,
  rows: UserSkillRow[],
): Promise<string[]> {
  // onet_occupation_id is CHAR(10), so it comes back blank-padded.
  const onetCode = (row: UserSkillRow) =>
    row.onet_occupation_id?.trim() || null;

  const unique = (values: (string | null | undefined)[]) => [
    ...new Set(values.filter((v): v is string => Boolean(v))),
  ];

  const csiIds = unique(rows.map((r) => r.csi_skill_id));
  const softIds = unique(rows.map((r) => r.soft_skill_id));
  const onetCodes = unique(rows.map(onetCode));

  const names = new Map<string, string>();
  const lookups: Promise<void>[] = [];

  if (csiIds.length) {
    lookups.push(
      catalogs.schema("data").from("masterformat").select("id, name").in(
        "id",
        csiIds,
      ).then(({ data }: { data: { id: string; name: string }[] | null }) => {
        for (const row of data ?? []) names.set(`csi:${row.id}`, row.name);
      }),
    );
  }

  if (softIds.length) {
    lookups.push(
      catalogs.schema("core").from("soft_skills").select("id, name").in(
        "id",
        softIds,
      ).then(({ data }: { data: { id: string; name: string }[] | null }) => {
        for (const row of data ?? []) names.set(`soft:${row.id}`, row.name);
      }),
    );
  }

  if (onetCodes.length) {
    lookups.push(
      catalogs.schema("onet").from("occupation_data").select(
        "onetsoc_code, title",
      ).in("onetsoc_code", onetCodes).then(
        (
          { data }: { data: { onetsoc_code: string; title: string }[] | null },
        ) => {
          for (const row of data ?? []) {
            names.set(`onet:${row.onetsoc_code.trim()}`, row.title);
          }
        },
      ),
    );
  }

  await Promise.all(lookups);

  return rows
    .map((row) => {
      if (row.csi_skill_id) return names.get(`csi:${row.csi_skill_id}`);
      if (row.soft_skill_id) return names.get(`soft:${row.soft_skill_id}`);
      const onet = onetCode(row);
      return onet ? names.get(`onet:${onet}`) : undefined;
    })
    .filter((name): name is string => Boolean(name));
}

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

  // The rest of the public profile lives in tables an anonymous caller cannot
  // read for itself: core.profile grants nothing to anon, and core.user_skills
  // and core.user_certifications have no anon grant either. Read them with the
  // service client and project ONLY the fields ProfileSchema already declares
  // public — never spread one of these rows into the response.
  const service = getServiceClient();

  // Get location from core.profile (PII table — `location` alone is public)
  const { data: privateProfile } = await service
    .schema("core")
    .from("profile")
    .select("location")
    .eq("user_id", user.id)
    .maybeSingle();

  // Get user skills (resolved against whichever taxonomy each row names)
  const { data: skillRows } = await service
    .schema("core")
    .from("user_skills")
    .select("csi_skill_id, onet_occupation_id, soft_skill_id")
    .eq("user_id", user.id)
    .limit(20);

  const skills = await resolveSkillNames(supabase, skillRows ?? []);

  // Get user certifications. The catalog (data.certifications) carries no
  // issuer, so name/issuer come from the freeform columns on the join row;
  // rows that only reference the catalog fall back to its title. The
  // user_certifications_catalog_or_freeform check allows either shape.
  const { data: certRows } = await service
    .schema("core")
    .from("user_certifications")
    .select("name, issuing_organization, certification_id, issue_date")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(10);

  type UserCertRow = {
    name?: string | null;
    issuing_organization?: string | null;
    certification_id?: string | null;
    issue_date?: string | null;
  };

  const certRowList = (certRows ?? []) as UserCertRow[];

  const catalogIds = [
    ...new Set(
      certRowList
        .filter((row) => !row.name && row.certification_id)
        .map((row) => row.certification_id as string),
    ),
  ];

  const catalogTitles = new Map<string, string>();
  if (catalogIds.length) {
    const { data: catalogRows } = await supabase
      .schema("data")
      .from("certifications")
      .select("id, title")
      .in("id", catalogIds);
    for (const row of (catalogRows ?? []) as { id: string; title: string }[]) {
      catalogTitles.set(row.id, row.title);
    }
  }

  const certifications = certRowList.map((row) => ({
    name: row.name ??
      (row.certification_id
        ? catalogTitles.get(row.certification_id) ?? ""
        : ""),
    issuer: row.issuing_organization ?? null,
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
        skills,
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

  // Get organization profile.
  //
  // This select used to ask for industry, size, location and founded_year and
  // filter on is_public — none of which exist on core.organizations, so the
  // route answered 500 "column organizations.industry does not exist" for every
  // slug and had never returned a profile. The real columns are industry_id
  // (FK to core.industries) and visibility.
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
      address,
      created_at,
      industry:industry_id (id, slug, name)
    `)
    .eq("slug", slug)
    .eq("visibility", "public")
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

  // Get count of open jobs
  const { count } = await supabase
    .schema("core")
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id)
    // core.jobs.status is CHECK (draft|open|paused|closed) — "published" is not
    // a permitted value, so this counted 0 for every employer.
    .eq("status", "open");

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

  // Get count of open jobs
  const { count } = await supabase
    .schema("core")
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("employer_id", employer.id)
    // See above: "published" is not a value core.jobs.status can hold.
    .eq("status", "open");

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
