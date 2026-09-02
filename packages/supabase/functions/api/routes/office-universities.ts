/**
 * Office Universities REST API
 * Office role required for admin operations; search is for authenticated users.
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

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  country: z.string().optional(),
  sortBy: z.enum(["name", "country", "created_at"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const createBodySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  country: z.string().min(1),
  alpha_two_code: z.string().length(2),
  domains: z.array(z.string()).default([]),
  web_pages: z.array(z.string()).default([]),
  state_province: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  alpha_two_code: z.string().length(2).optional(),
  domains: z.array(z.string()).optional(),
  web_pages: z.array(z.string()).optional(),
  state_province: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const searchQuerySchema = z.object({
  query: z.string().min(1),
  country: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET / - List universities (office role)
app.get(
  "/",
  requireRole("office", "platform"),
  zValidator("query", listQuerySchema),
  async (c) => {
    const supabase = c.get("supabase");
    const { page, pageSize, search, country, sortBy, sortOrder } = c.req.valid(
      "query",
    );

    let query = supabase.schema("data").from("universities").select("*", {
      count: "exact",
    });

    if (search) query = query.ilike("name", `%${search}%`);
    if (country) query = query.eq("country", country);

    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      return c.json({
        error: "Failed to fetch universities",
        message: error.message,
      }, 500);
    }

    return c.json({
      universities: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  },
);

// GET /:id - Get single university (office role)
app.get("/:id", requireRole("office", "platform"), async (c) => {
  const supabase = c.get("supabase");
  const { id } = c.req.param();

  const { data, error } = await supabase
    .schema("data")
    .from("universities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return c.json(
      { error: "University not found", message: error.message },
      404,
    );
  }

  return c.json({ university: data });
});

// GET /search - Search universities (authenticated users)
app.get("/search", zValidator("query", searchQuerySchema), async (c) => {
  const supabase = c.get("supabase");
  const { query, country, limit } = c.req.valid("query");

  const { data, error } = await supabase.schema("data").rpc(
    "search_universities",
    {
      p_query: query,
      p_country: country || null,
      p_limit: limit,
    },
  );

  if (error) {
    return c.json({
      error: "Failed to search universities",
      message: error.message,
    }, 500);
  }

  return c.json({ universities: data || [] });
});

// POST / - Create university (office role)
app.post(
  "/",
  requireRole("office", "platform"),
  zValidator("json", createBodySchema),
  async (c) => {
    const supabase = c.get("supabase");
    const input = c.req.valid("json");

    const { data: existing } = await supabase
      .schema("data")
      .from("universities")
      .select("id")
      .eq("slug", input.slug)
      .single();

    if (existing) {
      return c.json(
        { error: "A university with this slug already exists" },
        400,
      );
    }

    const { data, error } = await supabase
      .schema("data")
      .from("universities")
      .insert({
        ...input,
        alpha_two_code: input.alpha_two_code.toUpperCase(),
      })
      .select()
      .single();

    if (error) {
      return c.json({
        error: "Failed to create university",
        message: error.message,
      }, 500);
    }

    return c.json({ success: true, university: data }, 201);
  },
);

// PATCH /:id - Update university (office role)
app.patch(
  "/:id",
  requireRole("office", "platform"),
  zValidator("json", updateBodySchema),
  async (c) => {
    const supabase = c.get("supabase");
    const { id } = c.req.param();
    const input = c.req.valid("json");

    if (input.slug) {
      const { data: existing } = await supabase
        .schema("data")
        .from("universities")
        .select("id")
        .eq("slug", input.slug)
        .neq("id", id)
        .single();

      if (existing) {
        return c.json(
          { error: "A university with this slug already exists" },
          400,
        );
      }
    }

    const updateData = {
      ...input,
      ...(input.alpha_two_code
        ? { alpha_two_code: input.alpha_two_code.toUpperCase() }
        : {}),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .schema("data")
      .from("universities")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return c.json({
        error: "Failed to update university",
        message: error.message,
      }, 500);
    }

    return c.json({ success: true, university: data });
  },
);

// DELETE /:id - Delete university (office role)
app.delete("/:id", requireRole("office", "platform"), async (c) => {
  const supabase = c.get("supabase");
  const { id } = c.req.param();

  const { count } = await supabase
    .schema("core")
    .from("user_education")
    .select("id", { count: "exact", head: true })
    .eq("university_id", id);

  if (count && count > 0) {
    return c.json({
      error:
        `Cannot delete university: ${count} user(s) have this in their education history`,
    }, 400);
  }

  const { error } = await supabase.schema("data").from("universities").delete()
    .eq("id", id);

  if (error) {
    return c.json({
      error: "Failed to delete university",
      message: error.message,
    }, 500);
  }

  return c.json({ success: true });
});

export default app;
