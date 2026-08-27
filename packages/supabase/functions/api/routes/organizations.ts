/**
 * Organizations REST API
 * Organization management, members, documents, and settings
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.ts";
import { canReadOrgInternals } from "../lib/org-access.ts";
import { firstOf } from "../lib/postgrest.ts";

// Nine route files carry their own copy of this; following the local
// convention rather than refactoring all of them from a bug fix.
function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

const app = new OpenAPIHono();
app.use("*", authMiddleware);

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

/**
 * GET /v1/organizations/:id
 * Get organization by ID
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Organizations"],
    summary: "Get organization",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Organization",
        content: {
          "application/json": {
            schema: z.any(),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase.schema("core").from("organizations")
      .select("*").eq("id", id).single();

    if (error || !data) {
      return c.json({ error: "Organization not found" }, 404);
    }

    return c.json(data);
  },
);

/**
 * GET /v1/organizations/:id/members
 * List organization members
 */
/**
 * GET /v1/organizations/{id}/members
 *
 * This read `core.organization_members`, which exists in no schema, so it
 * returned 500 for every organization (#655). Membership here is a role scoped
 * to the org — `core.role_assignments.scope_org_id` — which is what
 * lib/org-access.ts, /{id}/location-visibility and /{id}/projects-with-overrides
 * have always used. The members route was the odd one out.
 *
 * One person can hold several roles in the same organization, so assignments are
 * grouped per user and the roles collected. joinedAt is the earliest assignment:
 * when they first got any role here, not when the most recent one was added.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{id}/members",
    tags: ["Organizations"],
    summary: "List members",
    request: {
      params: z.object({ id: z.string().uuid() }),
      query: z.object({
        search: z.string().optional(),
        roleNames: z.union([z.string(), z.array(z.string())]).optional(),
      }),
    },
    responses: {
      200: {
        description: "Members",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
      404: {
        description: "No such organization, or not visible to the caller",
        content: { "application/json": { schema: errorResponseSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const { search, roleNames } = c.req.valid("query");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Who belongs to an organization is not public. Same gate, and the same 404
    // rather than 403, as the background-check list.
    const access = await canReadOrgInternals(supabase, id, user.id);
    if (!access.found || !access.allowed) {
      return c.json({ error: "Organization not found" }, 404);
    }

    // core.role_assignments carries one policy — role_assignments_own_read,
    // `user_id = auth.uid()` — so the caller's own client can only ever see
    // their own row. Reading it with the user client returned a one-member
    // organization out of fifteen. canReadOrgInternals above is what makes the
    // service client safe here.
    const { data, error } = await getServiceClient()
      .schema("core")
      .from("role_assignments")
      .select(
        "user_id, created_at, role:role_id (name), user:user_id (id, display_name, username, avatar_url, headline)",
      )
      .eq("scope_org_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return c.json({
        error: "Failed to fetch members",
        message: error.message,
      }, 500);
    }

    const wanted = roleNames === undefined
      ? null
      : new Set(
        (Array.isArray(roleNames) ? roleNames : roleNames.split(","))
          .map((r) => r.trim()).filter(Boolean),
      );

    const term = search?.trim().toLowerCase();

    const byUser = new Map<string, {
      userId: string;
      profile: Record<string, unknown> | null;
      roles: string[];
      joinedAt: string;
    }>();

    for (const row of (data ?? []) as Array<Record<string, unknown>>) {
      const roleName = (firstOf<{ name?: string }>(row.role))?.name;
      // The previous version filtered with `ilike` on user_id, which is a uuid —
      // it could only ever match nothing. Search is on the name people know.
      const profile = firstOf<Record<string, unknown>>(row.user);
      const userId = row.user_id as string;

      if (wanted && (!roleName || !wanted.has(roleName))) continue;

      if (term) {
        const haystack = [
          profile?.display_name,
          profile?.username,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(term)) continue;
      }

      const existing = byUser.get(userId);
      if (existing) {
        if (roleName && !existing.roles.includes(roleName)) {
          existing.roles.push(roleName);
        }
        continue;
      }

      byUser.set(userId, {
        userId,
        profile: profile
          ? {
            id: profile.id,
            display_name: profile.display_name ?? null,
            username: profile.username ?? null,
            avatar_url: profile.avatar_url ?? null,
            headline: profile.headline ?? null,
          }
          : null,
        roles: roleName ? [roleName] : [],
        // Rows arrive oldest first, so the first one seen is the earliest.
        joinedAt: row.created_at as string,
      });
    }

    return c.json([...byUser.values()]);
  },
);

/**
 * GET /v1/organizations/:id/settings
 * Get organization settings
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{id}/settings",
    tags: ["Organizations"],
    summary: "Get settings",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Settings",
        content: {
          "application/json": {
            schema: z.any(),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("organization_settings")
      .select("*")
      .eq("organization_id", id)
      .single();

    if (error || !data) {
      return c.json({ error: "Settings not found" }, 404);
    }

    return c.json(data);
  },
);

/**
 * PATCH /v1/organizations/:id/settings
 * Update organization settings
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}/settings",
    tags: ["Organizations"],
    summary: "Update settings",
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              timezone: z.string().optional(),
              enforceMfa: z.boolean().optional(),
              sessionTimeoutMinutes: z.number().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Settings updated",
        content: {
          "application/json": {
            schema: z.any(),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("organization_settings")
      .update(body)
      .eq("organization_id", id)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Failed to update settings" }, 500);
    }

    return c.json(data);
  },
);

/**
 * POST /v1/organizations/requests
 * Create organization request
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/requests",
    tags: ["Organizations"],
    summary: "Create organization request",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().min(1),
              slug: z.string().min(1).regex(
                /^[a-z0-9-]+$/,
                "Slug must contain only lowercase letters, numbers, and hyphens",
              ),
              website: z.string().url().optional(),
              notes: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Organization request created",
        content: {
          "application/json": {
            schema: z.object({
              request: z.object({
                id: z.string().uuid(),
                name: z.string(),
                slug: z.string(),
                status: z.string(),
                created_at: z.string(),
              }),
            }),
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
      409: {
        description: "Conflict - slug already exists",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = c.req.valid("json");
    const trimmedName = body.name.trim();
    const normalizedSlug = body.slug.trim().toLowerCase();

    // Check if slug is already in use by an existing organization
    const { data: existingOrganization, error: existingOrgError } =
      await supabase
        .schema("core")
        .from("organizations")
        .select("id")
        .eq("slug", normalizedSlug)
        .maybeSingle();

    if (existingOrgError && existingOrgError.code !== "PGRST116") {
      return c.json(
        {
          error: "Failed to validate organization slug",
          message: existingOrgError.message,
        },
        500,
      );
    }

    if (existingOrganization) {
      return c.json(
        { error: "An organization with this slug already exists" },
        409,
      );
    }

    // Check for pending or approved requests with this slug
    const { data: existingRequest, error: existingRequestError } =
      await supabase
        .schema("core")
        .from("organization_requests")
        .select("id, status, created_by_user_id")
        .eq("slug", normalizedSlug)
        .in("status", ["pending", "approved"])
        .maybeSingle();

    if (existingRequestError && existingRequestError.code !== "PGRST116") {
      return c.json(
        {
          error: "Failed to validate organization request",
          message: existingRequestError.message,
        },
        500,
      );
    }

    if (existingRequest) {
      const isOwnRequest = existingRequest.created_by_user_id === user.id;
      const message = isOwnRequest
        ? "You already have a pending request for this organization"
        : "Another user already requested this organization and it is pending review";
      return c.json({ error: message }, 409);
    }

    // Create the organization request
    const { data: request, error: requestError } = await supabase
      .schema("core")
      .from("organization_requests")
      .insert({
        name: trimmedName,
        slug: normalizedSlug,
        website: body.website?.trim() ?? null,
        notes: body.notes?.trim() ?? null,
        created_by_user_id: user.id,
      })
      .select("id, name, slug, status, created_at")
      .single();

    if (requestError) {
      return c.json(
        {
          error: "Failed to submit organization request",
          message: requestError.message,
        },
        500,
      );
    }

    return c.json({ request }, 201);
  },
);

/**
 * GET /v1/organizations/:id/reminder-settings
 * Get inquiry reminder settings
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{id}/reminder-settings",
    tags: ["Organizations"],
    summary: "Get reminder settings",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Reminder settings",
        content: {
          "application/json": {
            schema: z.object({
              reminderEnabled: z.boolean(),
              reminderDays: z.number(),
            }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // TODO: Add organization admin check
    // For now, allow any authenticated user to read reminder settings

    const { data: org, error } = await supabase
      .schema("core")
      .from("organizations")
      .select("inquiry_reminder_enabled, inquiry_reminder_days")
      .eq("id", id)
      .single();

    if (error || !org) {
      return c.json({ error: "Organization not found" }, 404);
    }

    return c.json({
      reminderEnabled: org.inquiry_reminder_enabled ?? true,
      reminderDays: org.inquiry_reminder_days ?? 3,
    });
  },
);

/**
 * PUT /v1/organizations/:id/reminder-settings
 * Update inquiry reminder settings
 */
app.openapi(
  createRoute({
    method: "put",
    path: "/{id}/reminder-settings",
    tags: ["Organizations"],
    summary: "Update reminder settings",
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              reminderEnabled: z.boolean(),
              reminderDays: z.number().int().min(1).max(14),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Reminder settings updated",
        content: {
          "application/json": {
            schema: z.object({
              reminderEnabled: z.boolean(),
              reminderDays: z.number(),
            }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // TODO: Add organization admin check
    // For now, allow any authenticated user to update reminder settings

    const { data: org, error } = await supabase
      .schema("core")
      .from("organizations")
      .update({
        inquiry_reminder_enabled: body.reminderEnabled,
        inquiry_reminder_days: body.reminderDays,
      })
      .eq("id", id)
      .select("inquiry_reminder_enabled, inquiry_reminder_days")
      .single();

    if (error || !org) {
      return c.json({
        error: "Failed to update reminder settings",
        message: error?.message,
      }, 500);
    }

    return c.json({
      reminderEnabled: org.inquiry_reminder_enabled,
      reminderDays: org.inquiry_reminder_days,
    });
  },
);

/**
 * GET /v1/organizations/:id/projects-with-overrides
 * Get projects that override the organization's default location visibility
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{id}/projects-with-overrides",
    tags: ["Organizations"],
    summary: "Get projects with location visibility overrides",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Projects with overrides",
        content: {
          "application/json": {
            schema: z.object({ projects: z.array(z.any()) }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data: org } = await supabase
      .schema("core")
      .from("organizations")
      .select("owner_user_id")
      .eq("id", id)
      .single();

    if (!org) return c.json({ error: "Organization not found" }, 404);

    const isOwner = org.owner_user_id === user.id;
    const { data: roleAssignments } = await supabase
      .schema("core")
      .from("role_assignments")
      .select("role:roles(name, scope), scope_org_id")
      .eq("user_id", user.id);

    const isAdmin = roleAssignments?.some(
      // biome-ignore lint/suspicious/noExplicitAny: Complex type inference from Supabase query
      (assignment: any) =>
        assignment.role &&
        (assignment.scope_org_id === id ||
          (assignment.role.name === "admin" &&
            assignment.role.scope === "platform") ||
          (assignment.role.name === "super_admin" &&
            assignment.role.scope === "platform")),
    );

    if (!isOwner && !isAdmin) return c.json({ error: "Forbidden" }, 403);

    const { data: projects, error } = await supabase
      .schema("core")
      .from("projects")
      .select(
        "id, name, status, location_visibility, location_visibility_override, created_at",
      )
      .eq("organization_id", id)
      .eq("location_visibility_override", true)
      .order("created_at", { ascending: false });

    if (error) {
      return c.json({
        error: "Failed to fetch projects",
        message: error.message,
      }, 500);
    }

    return c.json({ projects: projects || [] });
  },
);

/**
 * PATCH /v1/organizations/:id/location-visibility
 * Update the organization's default project location visibility
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}/location-visibility",
    tags: ["Organizations"],
    summary: "Update default project location visibility",
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              default_project_location_visibility: z.enum([
                "public",
                "authenticated",
                "organization_only",
                "private",
              ]),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated organization",
        content: {
          "application/json": { schema: z.object({ organization: z.any() }) },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data: org } = await supabase
      .schema("core")
      .from("organizations")
      .select("owner_user_id")
      .eq("id", id)
      .single();

    if (!org) return c.json({ error: "Organization not found" }, 404);

    const isOwner = org.owner_user_id === user.id;
    const { data: roleAssignments } = await supabase
      .schema("core")
      .from("role_assignments")
      .select("role:roles(name, scope), scope_org_id")
      .eq("user_id", user.id);

    const isAdmin = roleAssignments?.some(
      // biome-ignore lint/suspicious/noExplicitAny: Complex type inference from Supabase query
      (assignment: any) =>
        assignment.role &&
        (assignment.scope_org_id === id ||
          (assignment.role.name === "admin" &&
            assignment.role.scope === "platform") ||
          (assignment.role.name === "super_admin" &&
            assignment.role.scope === "platform")),
    );

    if (!isOwner && !isAdmin) return c.json({ error: "Forbidden" }, 403);

    const { data: organization, error } = await supabase
      .schema("core")
      .from("organizations")
      .update({
        default_project_location_visibility:
          body.default_project_location_visibility,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !organization) {
      return c.json({
        error: "Failed to update location visibility",
        message: error?.message,
      }, 500);
    }

    return c.json({ organization });
  },
);

/**
 * GET /v1/organizations/{id}/open-jobs-count
 *
 * The "N open jobs" figure on the employer preview modal, the profile hover
 * card and the employer detail pane (all three reachable from /workers/map and
 * /employers/{id}). The route did not exist, so every one of them fell back to
 * its `return 0` branch (#447).
 *
 * "open" is literally core.jobs.status = 'open'. Note that the two job counts
 * in profiles.ts asked for status = 'published', which the table's CHECK
 * constraint does not even permit (draft|open|paused|closed) — those are fixed
 * in the same change. Counting the wrong status is indistinguishable from an
 * employer having no jobs, which is why it went unnoticed.
 *
 * Readable by any signed-in user: an open job is public, and the discover map
 * shows this count for organizations the viewer has no relationship with.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{id}/open-jobs-count",
    tags: ["Organizations"],
    summary: "Count an organization's open jobs",
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: {
        description: "Open job count",
        content: {
          "application/json": {
            schema: z.object({
              count: z.number(),
              organizationId: z.string(),
            }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { count, error } = await supabase
      .schema("core")
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", id)
      .eq("status", "open");

    if (error) {
      return c.json(
        { error: "Failed to count open jobs", message: error.message },
        500,
      );
    }

    return c.json({ count: count ?? 0, organizationId: id });
  },
);

/**
 * GET /v1/organizations/{id}/background-checks
 *
 * OrganizationBackgroundChecksPage, mounted at /office/ats/checks. The route did
 * not exist, so that page has never loaded data (#447).
 *
 * Gated on canReadOrgInternals: these rows carry consent timestamps, adverse
 * action dates and findings about named individuals. A 404 rather than a 403 for
 * a non-member, so the endpoint does not confirm that an org id exists.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{id}/background-checks",
    tags: ["Organizations"],
    summary: "List an organization's background checks",
    request: {
      params: z.object({ id: z.string().uuid() }),
      query: z.object({
        status: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(200).optional(),
      }),
    },
    responses: {
      200: {
        description: "Background checks, newest first",
        content: { "application/json": { schema: z.array(z.any()) } },
      },
      404: {
        description: "No such organization, or not visible to the caller",
        content: { "application/json": { schema: errorResponseSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const { status, limit } = c.req.valid("query");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const access = await canReadOrgInternals(supabase, id, user.id);
    if (!access.found || !access.allowed) {
      return c.json({ error: "Organization not found" }, 404);
    }

    let query = supabase
      .schema("core")
      .from("background_checks")
      .select("*")
      .eq("organization_id", id)
      .order("created_at", { ascending: false })
      .limit(limit ?? 100);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;

    if (error) {
      return c.json(
        { error: "Failed to fetch background checks", message: error.message },
        500,
      );
    }

    return c.json(data ?? []);
  },
);


export default app;
