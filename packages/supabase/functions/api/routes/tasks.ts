/**
 * Tasks REST API
 *
 * First-class units of work scoped to an organization. See
 * `packages/supabase/migrations/325_tasks_and_punchlists.sql` for the schema.
 *
 * Endpoints:
 *   GET    /v1/tasks             list (filters: organizationId, status, assigneeUserId, projectId, punchlistId, teamSlug, search)
 *   POST   /v1/tasks             create
 *   GET    /v1/tasks/:taskId     fetch by id
 *   PATCH  /v1/tasks/:taskId     update (title, description, status, priority, due_date, assignee_user_id, project_id, punchlist_id, team_slug)
 *   DELETE /v1/tasks/:taskId     delete (creator or org admin only)
 *   POST   /v1/tasks/:taskId/complete  shortcut: status=done; optional workLogId records the completing log via core.work_log_tasks
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono();
app.use("*", authMiddleware);

const taskStatusSchema = z.enum(["todo", "in_progress", "done", "cancelled"]);
const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

/**
 * GET /v1/tasks — list
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Tasks"],
    summary: "List tasks",
    request: {
      query: z.object({
        organizationId: z.string().uuid().optional(),
        status: z.union([z.string(), z.array(z.string())]).optional(),
        assigneeUserId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
        punchlistId: z.string().uuid().optional(),
        teamSlug: z.string().optional(),
        search: z.string().optional(),
        page: z.coerce.number().optional(),
        pageSize: z.coerce.number().optional(),
        sortField: z.enum(["created_at", "updated_at", "due_date", "priority"]).optional(),
        sortDirection: z.enum(["asc", "desc"]).optional(),
      }),
    },
    responses: {
      200: {
        description: "Tasks list",
        content: {
          "application/json": {
            schema: z.object({
              tasks: z.array(z.any()),
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
    const sortField = q.sortField ?? "created_at";
    const sortDirection = q.sortDirection ?? "desc";

    const statusList = Array.isArray(q.status)
      ? q.status
      : typeof q.status === "string" && q.status.length > 0
      ? q.status.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    let query = supabase
      .schema("core")
      .from("tasks")
      .select("*", { count: "exact" });

    if (q.organizationId) query = query.eq("organization_id", q.organizationId);
    if (q.assigneeUserId) query = query.eq("assignee_user_id", q.assigneeUserId);
    if (q.projectId) query = query.eq("project_id", q.projectId);
    if (q.punchlistId) query = query.eq("punchlist_id", q.punchlistId);
    if (q.teamSlug) query = query.eq("team_slug", q.teamSlug);
    if (statusList && statusList.length > 0) query = query.in("status", statusList);
    if (q.search && q.search.trim().length > 0) {
      const needle = q.search.trim();
      query = query.or(`title.ilike.%${needle}%,description.ilike.%${needle}%`);
    }

    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1).order(sortField, {
      ascending: sortDirection === "asc",
    });

    const { data, error, count } = await query;
    if (error) {
      return c.json({ error: "Failed to list tasks", message: error.message }, 500);
    }
    return c.json({
      tasks: data ?? [],
      totalCount: count ?? 0,
      page,
      pageSize,
      hasMore: (count ?? 0) > offset + pageSize,
    });
  },
);

/**
 * POST /v1/tasks — create
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Tasks"],
    summary: "Create task",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              organizationId: z.string().uuid(),
              title: z.string().min(1).max(200),
              description: z.string().optional(),
              status: taskStatusSchema.optional(),
              priority: taskPrioritySchema.optional(),
              dueDate: z.string().optional(),
              assigneeUserId: z.string().uuid().nullable().optional(),
              projectId: z.string().uuid().nullable().optional(),
              punchlistId: z.string().uuid().nullable().optional(),
              teamSlug: z.string().nullable().optional(),
              source: z.string().nullable().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: { description: "Task created", content: { "application/json": { schema: z.any() } } },
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
      .from("tasks")
      .insert({
        organization_id: body.organizationId,
        title: body.title,
        description: body.description ?? null,
        status: body.status ?? "todo",
        priority: body.priority ?? "medium",
        due_date: body.dueDate ?? null,
        assignee_user_id: body.assigneeUserId ?? null,
        project_id: body.projectId ?? null,
        punchlist_id: body.punchlistId ?? null,
        team_slug: body.teamSlug ?? null,
        source: body.source ?? null,
        created_by_user_id: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Failed to create task", message: error?.message }, 500);
    }
    return c.json(data, 201);
  },
);

/**
 * GET /v1/tasks/:taskId
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{taskId}",
    tags: ["Tasks"],
    summary: "Get task by id",
    request: { params: z.object({ taskId: z.string().uuid() }) },
    responses: {
      200: { description: "Task", content: { "application/json": { schema: z.any() } } },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { taskId } = c.req.valid("param");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase
      .schema("core")
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .maybeSingle();
    if (error || !data) {
      return c.json({ error: "Not found", message: error?.message }, 404);
    }
    return c.json(data);
  },
);

/**
 * PATCH /v1/tasks/:taskId
 */
app.openapi(
  createRoute({
    method: "patch",
    path: "/{taskId}",
    tags: ["Tasks"],
    summary: "Update task",
    request: {
      params: z.object({ taskId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              title: z.string().min(1).max(200).optional(),
              description: z.string().nullable().optional(),
              status: taskStatusSchema.optional(),
              priority: taskPrioritySchema.optional(),
              dueDate: z.string().nullable().optional(),
              assigneeUserId: z.string().uuid().nullable().optional(),
              projectId: z.string().uuid().nullable().optional(),
              punchlistId: z.string().uuid().nullable().optional(),
              teamSlug: z.string().nullable().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: { description: "Task updated", content: { "application/json": { schema: z.any() } } },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { taskId } = c.req.valid("param");
    const body = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.status !== undefined) patch.status = body.status;
    if (body.priority !== undefined) patch.priority = body.priority;
    if (body.dueDate !== undefined) patch.due_date = body.dueDate;
    if (body.assigneeUserId !== undefined) patch.assignee_user_id = body.assigneeUserId;
    if (body.projectId !== undefined) patch.project_id = body.projectId;
    if (body.punchlistId !== undefined) patch.punchlist_id = body.punchlistId;
    if (body.teamSlug !== undefined) patch.team_slug = body.teamSlug;

    if (Object.keys(patch).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const { data, error } = await supabase
      .schema("core")
      .from("tasks")
      .update(patch)
      .eq("id", taskId)
      .select()
      .single();
    if (error || !data) {
      return c.json({ error: "Failed to update task", message: error?.message }, 404);
    }
    return c.json(data);
  },
);

/**
 * DELETE /v1/tasks/:taskId
 */
app.openapi(
  createRoute({
    method: "delete",
    path: "/{taskId}",
    tags: ["Tasks"],
    summary: "Delete task",
    request: { params: z.object({ taskId: z.string().uuid() }) },
    responses: {
      204: { description: "Deleted" },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { taskId } = c.req.valid("param");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { error } = await supabase
      .schema("core")
      .from("tasks")
      .delete()
      .eq("id", taskId);
    if (error) {
      return c.json({ error: "Failed to delete task", message: error.message }, 403);
    }
    return c.body(null, 204);
  },
);

/**
 * POST /v1/tasks/:taskId/complete — set status=done and (optionally) link to a work log.
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/{taskId}/complete",
    tags: ["Tasks"],
    summary: "Complete task",
    request: {
      params: z.object({ taskId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              workLogId: z.string().uuid().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: { description: "Task completed", content: { "application/json": { schema: z.any() } } },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { taskId } = c.req.valid("param");
    const body = c.req.valid("json");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { data: task, error: updErr } = await supabase
      .schema("core")
      .from("tasks")
      .update({ status: "done" })
      .eq("id", taskId)
      .select()
      .single();
    if (updErr || !task) {
      return c.json({ error: "Failed to complete task", message: updErr?.message }, 404);
    }

    if (body.workLogId) {
      const { error: linkErr } = await supabase
        .schema("core")
        .from("work_log_tasks")
        .insert({ work_log_id: body.workLogId, task_id: taskId });
      if (linkErr && !linkErr.message.includes("duplicate")) {
        return c.json({
          error: "Task completed but link failed",
          message: linkErr.message,
          task,
        }, 200);
      }
    }
    return c.json(task);
  },
);

export default app;
