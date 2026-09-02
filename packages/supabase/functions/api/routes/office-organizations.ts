/**
 * Office Organizations REST API
 * Office role required. Manages organizations, requests, and slug checking.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  type ApiEnv,
  authMiddleware,
  requireRole,
} from "../middleware/auth.ts";

const app = new Hono<ApiEnv>();
app.use("*", authMiddleware);
app.use("*", requireRole("office", "platform"));

// GET /organizations — list all (simple, for dropdowns)
app.get("/", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  if (!supabaseAdmin) return c.json({ error: "Unauthorized" }, 401);

  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("organizations")
    .select("id, name, slug, owner_user_id")
    .order("name", { ascending: true });

  if (error) {
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }
  return c.json({ organizations: data ?? [] });
});

// GET /organizations/list — paginated list with industry info
app.get(
  "/list",
  zValidator(
    "query",
    z.object({
      limit: z.coerce.number().min(1).max(100).default(50),
      offset: z.coerce.number().min(0).default(0),
      search: z.string().optional(),
    }),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) return c.json({ error: "Unauthorized" }, 401);

    const input = c.req.valid("query");

    let query = supabaseAdmin
      .schema("core")
      .from("organizations")
      .select(
        "id, name, slug, industry_id, logo_url, visibility, owner_user_id, created_at, updated_at, industry:industries(name)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (input.search) {
      query = query.or(
        `name.ilike.%${input.search}%,slug.ilike.%${input.search}%`,
      );
    }

    const { data, error, count } = await query;
    if (error) {
      return c.json(
        { error: "Internal Server Error", message: error.message },
        500,
      );
    }

    const organizations = (data ?? []).map((org: Record<string, unknown>) => ({
      ...org,
      industry_name: (org.industry as { name?: string } | null)?.name ?? null,
    }));

    return c.json({ organizations, total: count ?? 0 });
  },
);

// GET /organizations/requests — list organization requests
app.get(
  "/requests",
  zValidator(
    "query",
    z.object({
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      limit: z.coerce.number().min(1).max(100).default(25),
    }),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) return c.json({ error: "Unauthorized" }, 401);

    const { status, limit } = c.req.valid("query");

    let query = supabaseAdmin
      .schema("core")
      .from("organization_requests")
      .select(
        "id, name, slug, website, notes, message, personal_note, viewed_at, resent_count, status, metadata, created_at, created_by_user_id, reviewed_at, reviewed_by_user_id, rejection_reason, organization_id",
      )
      .order("created_at", { ascending: true })
      .limit(limit);

    if (status) query = query.eq("status", status);

    const { data: requests, error } = await query;
    if (error) {
      return c.json(
        { error: "Internal Server Error", message: error.message },
        500,
      );
    }

    const [
      { count: pendingCount = 0 } = {},
      { count: approvedCount = 0 } = {},
      { count: rejectedCount = 0 } = {},
    ] = await Promise.all([
      supabaseAdmin.schema("core").from("organization_requests").select("*", {
        head: true,
        count: "exact",
      }).eq("status", "pending"),
      supabaseAdmin.schema("core").from("organization_requests").select("*", {
        head: true,
        count: "exact",
      }).eq("status", "approved"),
      supabaseAdmin.schema("core").from("organization_requests").select("*", {
        head: true,
        count: "exact",
      }).eq("status", "rejected"),
    ]);

    return c.json({
      requests: requests ?? [],
      counts: {
        pending: pendingCount ?? 0,
        approved: approvedCount ?? 0,
        rejected: rejectedCount ?? 0,
      },
    });
  },
);

// GET /organizations/check-slug — check slug availability
app.get(
  "/check-slug",
  zValidator(
    "query",
    z.object({
      slug: z.string().min(1).max(120),
      organizationId: z.string().uuid().optional(),
    }),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) return c.json({ error: "Unauthorized" }, 401);

    const { slug, organizationId } = c.req.valid("query");
    const normalizedSlug = slug.toLowerCase().trim();

    // Basic format validation
    const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
    const reservedSlugs = [
      "admin",
      "api",
      "app",
      "auth",
      "dashboard",
      "home",
      "login",
      "logout",
      "office",
      "platform",
      "profile",
      "settings",
      "signup",
    ];

    if (!slugRegex.test(normalizedSlug)) {
      return c.json({
        available: false,
        reason: "format",
        message:
          "Vanity URL must be 3-50 characters, lowercase letters, numbers, and single hyphens.",
        suggestions: [],
        slug: normalizedSlug,
      });
    }

    if (reservedSlugs.includes(normalizedSlug)) {
      return c.json({
        available: false,
        reason: "reserved",
        message: "This vanity URL is reserved for internal routes.",
        suggestions: [],
        slug: normalizedSlug,
      });
    }

    const { data: existing } = await supabaseAdmin
      .schema("core").from("organizations").select("id").eq(
        "slug",
        normalizedSlug,
      ).maybeSingle();

    if (existing && existing.id !== organizationId) {
      const { data: similar } = await supabaseAdmin
        .schema("core").from("organizations").select("slug").like(
          "slug",
          `${normalizedSlug}%`,
        ).limit(10);

      const usedSlugs = (similar ?? []).map((o: { slug?: string | null }) =>
        o.slug ?? ""
      ).filter(Boolean);
      const suggestions: string[] = [];
      for (let i = 1; suggestions.length < 3; i++) {
        const candidate = `${normalizedSlug}-${i}`;
        if (!usedSlugs.includes(candidate)) suggestions.push(candidate);
      }

      return c.json({
        available: false,
        reason: "taken",
        message: "An organization with this vanity URL already exists.",
        suggestions,
        slug: normalizedSlug,
      });
    }

    return c.json({ available: true, slug: normalizedSlug });
  },
);

// POST /organizations/requests/:id/review
app.post(
  "/requests/:id/review",
  zValidator(
    "json",
    z.object({
      action: z.enum(["approve", "reject"]),
      rejectionReason: z.string().trim().max(1000).optional(),
    }),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    const user = c.get("user");
    const { id } = c.req.param();

    if (!supabaseAdmin || !user?.id) {
      return c.json(
        { error: "Unauthorized" },
        401,
      );
    }

    const input = c.req.valid("json");

    const { data: request, error: requestError } = await supabaseAdmin
      .schema("core").from("organization_requests").select("*").eq("id", id)
      .single();

    if (requestError || !request) {
      return c.json({
        error: "Not Found",
        message: "Organization request not found",
      }, 404);
    }
    if (request.status !== "pending") {
      return c.json({
        error: "Bad Request",
        message: "Only pending requests can be reviewed",
      }, 400);
    }

    const moderationTimestamp = new Date().toISOString();

    if (input.action === "reject") {
      if (!input.rejectionReason?.trim()) {
        return c.json({
          error: "Bad Request",
          message: "Rejection reason is required when rejecting a request",
        }, 400);
      }
      const { data: updatedRequest, error: updateError } = await supabaseAdmin
        .schema("core").from("organization_requests").update({
          status: "rejected",
          reviewed_by_user_id: user.id,
          reviewed_at: moderationTimestamp,
          rejection_reason: input.rejectionReason.trim(),
        }).eq("id", id).select().single();

      if (updateError) {
        return c.json({
          error: "Internal Server Error",
          message: updateError.message,
        }, 500);
      }
      return c.json({ request: updatedRequest, organization: null });
    }

    // Approve flow - create organization from request
    const { data: existingOrg } = await supabaseAdmin
      .schema("core").from("organizations").select("id").eq(
        "slug",
        request.slug,
      ).maybeSingle();

    if (existingOrg) {
      return c.json({
        error: "Conflict",
        message: "An organization with this slug already exists",
      }, 409);
    }

    const { data: organization, error: createError } = await supabaseAdmin
      .schema("core").from("organizations").insert({
        name: request.name,
        slug: request.slug,
        owner_user_id: request.created_by_user_id,
        visibility: "public",
      }).select().single();

    if (createError) {
      return c.json({
        error: "Internal Server Error",
        message: createError.message,
      }, 500);
    }

    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .schema("core").from("organization_requests").update({
        status: "approved",
        reviewed_by_user_id: user.id,
        reviewed_at: moderationTimestamp,
        organization_id: (organization as { id: string }).id,
      }).eq("id", id).select().single();

    if (updateError) {
      return c.json({
        error: "Internal Server Error",
        message: updateError.message,
      }, 500);
    }
    return c.json({ request: updatedRequest, organization });
  },
);

// POST /organizations — create organization
app.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      industry_id: z.string().uuid().optional(),
      logo_url: z.string().url().optional().or(z.literal("")),
      visibility: z.enum(["public", "private"]).default("public"),
      address: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    const user = c.get("user");
    if (!supabaseAdmin || !user?.id) {
      return c.json(
        { error: "Unauthorized" },
        401,
      );
    }

    const input = c.req.valid("json");

    const { data: existing } = await supabaseAdmin
      .schema("core").from("organizations").select("id").eq("slug", input.slug)
      .maybeSingle();
    if (existing) {
      return c.json({
        error: "Conflict",
        message: "An organization with this vanity URL already exists",
      }, 409);
    }

    const { data: organization, error } = await supabaseAdmin
      .schema("core").from("organizations").insert({
        ...input,
        owner_user_id: user.id,
      }).select().single();

    if (error) {
      return c.json(
        { error: "Internal Server Error", message: error.message },
        500,
      );
    }
    return c.json({ organization }, 201);
  },
);

// PATCH /organizations/:id — update organization
app.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      industry_id: z.string().uuid().optional(),
      logo_url: z.string().url().optional().or(z.literal("")),
      visibility: z.enum(["public", "private"]).optional(),
      address: z.record(z.string(), z.unknown()).optional(),
      locations: z.array(
        z.object({
          name: z.string(),
          address: z.record(z.string(), z.unknown()),
        }),
      ).optional(),
    }),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) return c.json({ error: "Unauthorized" }, 401);

    const { id } = c.req.param();
    const input = c.req.valid("json");

    if (input.slug) {
      const { data: existing } = await supabaseAdmin
        .schema("core").from("organizations").select("id").eq(
          "slug",
          input.slug,
        ).neq("id", id).maybeSingle();
      if (existing) {
        return c.json({
          error: "Conflict",
          message: "An organization with this vanity URL already exists",
        }, 409);
      }
    }

    const { data: organization, error } = await supabaseAdmin
      .schema("core").from("organizations").update(input).eq("id", id).select()
      .single();

    if (error) {
      return c.json(
        { error: "Internal Server Error", message: error.message },
        500,
      );
    }
    return c.json({ organization });
  },
);

// DELETE /organizations/:id
app.delete("/:id", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  if (!supabaseAdmin) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();
  const { error } = await supabaseAdmin.schema("core").from("organizations")
    .delete().eq("id", id);
  if (error) {
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }
  return c.json({ success: true });
});

export default app;
