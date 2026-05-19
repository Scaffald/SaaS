/**
 * Punchlists REST API
 *
 * Named buckets of tasks (sprint / milestone / release). See
 * `packages/supabase/migrations/325_tasks_and_punchlists.sql`.
 *
 * Endpoints:
 *   GET    /v1/punchlists                  list (organizationId, status, projectId, search)
 *   POST   /v1/punchlists                  create
 *   GET    /v1/punchlists/:punchlistId     fetch by id
 *   PATCH  /v1/punchlists/:punchlistId     update
 *   DELETE /v1/punchlists/:punchlistId     delete (creator or org admin)
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono();
app.use("*", authMiddleware);

const punchlistStatusSchema = z.enum(["active", "completed", "archived"]);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Punchlists"],
    summary: "List punchlists",
    request: {
      query: z.object({
        organizationId: z.string().uuid().optional(),
        status: punchlistStatusSchema.optional(),
        projectId: z.string().uuid().optional(),
        search: z.string().optional(),
        page: z.coerce.number().optional(),
        pageSize: z.coerce.number().optional(),
      }),
    },
    responses: {
      200: {
        description: "Punchlists list",
        content: {
          "application/json": {
            schema: z.object({
              punchlists: z.array(z.any()),
              totalCount: z.number(),
              page: z.number(),
              pageSize: z.number(),
              hasMore: z.boolean(),
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
    const q = c.req.valid("query");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const page = q.page ?? 1;
    const pageSize = Math.min(q.pageSize ?? 50, 200);

    let query = supabase
      .schema("core")
      .from("punchlists")
      .select("*", { count: "exact" });
    if (q.organizationId) query = query.eq("organization_id", q.organizationId);
    if (q.status) query = query.eq("status", q.status);
    if (q.projectId) query = query.eq("project_id", q.projectId);
    if (q.search && q.search.trim().length > 0) {
      query = query.ilike("name", `%${q.search.trim()}%`);
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1).order("created_at", { ascending: false });

    const { data, error, count } = await query;
    if (error) {
      return c.json({ error: "Failed to list punchlists", message: error.message }, 500);
    }
    return c.json({
      punchlists: data ?? [],
      totalCount: count ?? 0,
      page,
      pageSize,
      hasMore: (count ?? 0) > offset + pageSize,
    });
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Punchlists"],
    summary: "Create punchlist",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              organizationId: z.string().uuid(),
              name: z.string().min(1).max(100),
              description: z.string().optional(),
              status: punchlistStatusSchema.optional(),
              projectId: z.string().uuid().nullable().optional(),
              targetDate: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: { description: "Punchlist created", content: { "application/json": { schema: z.any() } } },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const body = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase
      .schema("core")
      .from("punchlists")
      .insert({
        organization_id: body.organizationId,
        name: body.name,
        description: body.description ?? null,
        status: body.status ?? "active",
        project_id: body.projectId ?? null,
        target_date: body.targetDate ?? null,
        created_by_user_id: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Failed to create punchlist", message: error?.message }, 500);
    }
    return c.json(data, 201);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{punchlistId}",
    tags: ["Punchlists"],
    summary: "Get punchlist by id",
    request: { params: z.object({ punchlistId: z.string().uuid() }) },
    responses: {
      200: { description: "Punchlist", content: { "application/json": { schema: z.any() } } },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { punchlistId } = c.req.valid("param");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase
      .schema("core")
      .from("punchlists")
      .select("*")
      .eq("id", punchlistId)
      .maybeSingle();
    if (error || !data) {
      return c.json({ error: "Not found", message: error?.message }, 404);
    }
    return c.json(data);
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{punchlistId}",
    tags: ["Punchlists"],
    summary: "Update punchlist",
    request: {
      params: z.object({ punchlistId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().min(1).max(100).optional(),
              description: z.string().nullable().optional(),
              status: punchlistStatusSchema.optional(),
              projectId: z.string().uuid().nullable().optional(),
              targetDate: z.string().nullable().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: { description: "Updated", content: { "application/json": { schema: z.any() } } },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { punchlistId } = c.req.valid("param");
    const body = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.status !== undefined) patch.status = body.status;
    if (body.projectId !== undefined) patch.project_id = body.projectId;
    if (body.targetDate !== undefined) patch.target_date = body.targetDate;
    if (Object.keys(patch).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("punchlists")
      .update(patch)
      .eq("id", punchlistId)
      .select()
      .single();
    if (error || !data) {
      return c.json({ error: "Failed to update punchlist", message: error?.message }, 404);
    }
    return c.json(data);
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{punchlistId}",
    tags: ["Punchlists"],
    summary: "Delete punchlist",
    request: { params: z.object({ punchlistId: z.string().uuid() }) },
    responses: { 204: { description: "Deleted" } },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { punchlistId } = c.req.valid("param");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { error } = await supabase
      .schema("core")
      .from("punchlists")
      .delete()
      .eq("id", punchlistId);
    if (error) {
      return c.json({ error: "Failed to delete punchlist", message: error.message }, 403);
    }
    return c.body(null, 204);
  },
);

export default app;
