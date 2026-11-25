/**
 * Webhooks Management REST API
 * Manage webhook endpoints and deliveries
 *
 * `public.webhooks` belongs to an organization, not a user: it has
 * `organization_id NOT NULL` and `created_by`, and no `user_id`. Every handler
 * here used to filter or insert on `user_id`, so all three answered 500
 * (`column webhooks.user_id does not exist`) on production too (#1016).
 *
 * Authorization is explicit here (lib/org-developer-roles.ts, #1440): a
 * member of the organization — on one of its teams, its owner, or holding a
 * role scoped to it — sees its webhooks and their deliveries; only its admins
 * create or delete one. The table's RLS (migration 225) admits org-scoped role
 * assignments only, which refused a team_admin with no such role, so reads and
 * writes go through the service client once the check has passed, each query
 * pinned to the organizations it authorized. Create names an organization and
 * never guesses between several (#1037 is what guessing looks like).
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addSupabaseAdminForUser,
  type ApiEnv,
  authMiddleware,
} from "../middleware/auth.ts";
import { webhookEventTypeCatalog } from "../../_shared/webhook-event-types.ts";
import {
  callerOrgRoles,
  type OrgRoles,
  resolveCreateOrganization,
} from "../lib/org-developer-roles.ts";

const app = new OpenAPIHono<ApiEnv>();
app.use("*", authMiddleware);
app.use("*", addSupabaseAdminForUser);

/** The organization a webhook belongs to, or null if there is no such webhook. */
async function webhookOrganizationId(
  admin: SupabaseClient,
  id: string,
): Promise<string | null> {
  const { data } = await admin
    .from("webhooks")
    .select("organization_id")
    .eq("id", id)
    .maybeSingle();
  return (data?.organization_id as string | undefined) ?? null;
}

type WebhookAccess =
  | { status: "ok"; organizationId: string; admin: boolean }
  | { status: "not_found" }
  | { status: "error"; message: string };

/**
 * Whether the caller may see the webhook, and manage it. Not found and not a
 * member are the same answer, so an id outside the caller's organizations
 * confirms nothing.
 */
async function webhookAccess(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<WebhookAccess> {
  try {
    const [organizationId, roles] = await Promise.all([
      webhookOrganizationId(admin, id),
      callerOrgRoles(admin, userId),
    ]);
    const role = organizationId ? roles.get(organizationId) : undefined;
    if (!organizationId || !role) return { status: "not_found" };
    return { status: "ok", organizationId, admin: role.admin };
  } catch (err) {
    return { status: "error", message: (err as Error).message };
  }
}

const WEBHOOK_COLUMNS =
  "id, organization_id, url, description, events, is_active, retry_max_attempts, retry_backoff_seconds, timeout_ms, rate_limit_per_minute, metadata, last_delivery_at, last_success_at, last_failure_at, total_deliveries, successful_deliveries, failed_deliveries, created_at, updated_at, created_by, updated_by";

const _errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

/**
 * GET /v1/webhooks
 * List webhooks
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Webhooks"],
    summary: "List webhooks",
    request: {
      query: z.object({ organization_id: z.string().uuid().optional() }),
    },
    responses: {
      200: {
        description: "Webhooks",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(z.any()),
            }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const admin = c.get("supabaseAdmin");
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // The caller's organizations; the optional filter narrows to one of them.
    // An organization they are not in lists nothing, as RLS did.
    const { organization_id } = c.req.valid("query");
    let orgIds: string[];
    try {
      orgIds = [...(await callerOrgRoles(admin, user.id)).keys()];
    } catch (err) {
      return c.json({
        error: "Failed to fetch webhooks",
        message: (err as Error).message,
      }, 500);
    }
    if (organization_id) {
      orgIds = orgIds.includes(organization_id) ? [organization_id] : [];
    }
    if (orgIds.length === 0) return c.json({ data: [] });

    // Everything but the signing secret, which is shown once, at creation.
    const { data, error } = await admin.from("webhooks")
      .select(WEBHOOK_COLUMNS)
      .in("organization_id", orgIds)
      .order("created_at", { ascending: false });

    if (error) {
      return c.json({
        error: "Failed to fetch webhooks",
        message: error.message,
      }, 500);
    }

    return c.json({ data: data || [] });
  },
);

/**
 * GET /v1/webhooks/event-types
 * The events a webhook can subscribe to.
 *
 * The create screen builds its checklist from this. It was a tRPC procedure
 * that the REST migration dropped without a replacement, so the request 404'd
 * and the screen showed an empty "Event Subscriptions" card (#1085). Declared
 * above any `/{id}` route so the literal path is reachable.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/event-types",
    tags: ["Webhooks"],
    summary: "List subscribable webhook event types",
    responses: {
      200: {
        description: "Event types",
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(z.object({
                value: z.string(),
                label: z.string(),
                category: z.string(),
              })),
            }),
          },
        },
      },
      401: {
        description: "Unauthorized",
        content: { "application/json": { schema: _errorResponseSchema } },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  (c) => {
    if (!c.get("user")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    return c.json({ data: webhookEventTypeCatalog() }, 200);
  },
);

/**
 * POST /v1/webhooks
 * Create webhook
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Webhooks"],
    summary: "Create webhook",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              // Required only for a caller in more than one organization.
              organization_id: z.string().uuid().optional(),
              url: z.string().url(),
              description: z.string().optional(),
              events: z.array(z.string()),
              retry_max_attempts: z.number().optional(),
              timeout_ms: z.number().optional(),
              metadata: z.record(z.any()).optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Webhook created",
        content: {
          "application/json": {
            schema: z.object({
              data: z.any(),
              message: z.string(),
            }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const admin = c.get("supabaseAdmin");
    let roles: OrgRoles;
    try {
      roles = await callerOrgRoles(admin, user.id);
    } catch (err) {
      return c.json({
        error: "Failed to create webhook",
        message: (err as Error).message,
      }, 500);
    }

    const target = resolveCreateOrganization(roles, body.organization_id);
    if (!target.ok) {
      return c.json({
        error: target.status === 400 ? "Bad Request" : "Forbidden",
        message: target.status === 403 && roles.size === 0
          ? "Webhooks belong to an organization, and you are not in one"
          : target.message,
      }, target.status);
    }
    const organizationId = target.organizationId;
    if (!roles.get(organizationId)?.admin) {
      return c.json({
        error: "Forbidden",
        message: "Only organization admins can create webhooks",
      }, 403);
    }

    // Generate webhook secret
    const secret = crypto.randomUUID();

    // The organization was authorized above; the insert is pinned to it.
    const { data, error } = await admin
      .from("webhooks")
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        url: body.url,
        description: body.description,
        events: body.events,
        secret,
        retry_max_attempts: body.retry_max_attempts || 3,
        timeout_ms: body.timeout_ms || 10000,
        metadata: body.metadata,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return c.json({
        error: "Failed to create webhook",
        message: error.message,
      }, 500);
    }

    return c.json(
      {
        data: { ...data, secret },
        message:
          "Webhook created. Save the secret - it will not be shown again.",
      },
      201,
    );
  },
);

/**
 * GET /v1/webhooks/:id
 * One webhook, for its detail screen (#1440). The list row pushed to a detail
 * route that never existed, so tapping a webhook was a 404.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Webhooks"],
    summary: "Retrieve webhook",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Webhook",
        content: {
          "application/json": {
            schema: z.object({ data: z.any() }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const admin = c.get("supabaseAdmin");
    const user = c.get("user");
    const { id } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const access = await webhookAccess(admin, user.id, id);
    if (access.status === "error") {
      return c.json({
        error: "Failed to fetch webhook",
        message: access.message,
      }, 500);
    }
    if (access.status === "not_found") {
      return c.json({ error: "Not Found" }, 404);
    }

    const { data, error } = await admin.from("webhooks")
      .select(WEBHOOK_COLUMNS)
      .eq("id", id)
      .eq("organization_id", access.organizationId)
      .maybeSingle();
    if (error) {
      return c.json({
        error: "Failed to fetch webhook",
        message: error.message,
      }, 500);
    }
    if (!data) return c.json({ error: "Not Found" }, 404);

    return c.json({ data });
  },
);

/**
 * GET /v1/webhooks/:id/deliveries
 * The webhook's recent delivery attempts, newest first.
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/{id}/deliveries",
    tags: ["Webhooks"],
    summary: "List webhook deliveries",
    request: {
      params: z.object({ id: z.string().uuid() }),
      query: z.object({
        status: z.enum([
          "pending",
          "success",
          "failed",
          "retrying",
          "cancelled",
        ])
          .optional(),
        event_type: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        offset: z.coerce.number().int().min(0).optional(),
      }),
    },
    responses: {
      200: {
        description: "Deliveries",
        content: {
          "application/json": {
            schema: z.object({ data: z.array(z.any()) }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const admin = c.get("supabaseAdmin");
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const { status, event_type, limit = 50, offset = 0 } = c.req.valid(
      "query",
    );

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const access = await webhookAccess(admin, user.id, id);
    if (access.status === "error") {
      return c.json({
        error: "Failed to fetch deliveries",
        message: access.message,
      }, 500);
    }
    if (access.status === "not_found") {
      return c.json({ error: "Not Found" }, 404);
    }

    let query = admin.from("webhook_deliveries")
      .select(
        "id, webhook_id, event_type, status, attempt_number, response_status_code, response_time_ms, error_message, retry_count, next_retry_at, created_at, delivered_at, completed_at",
      )
      .eq("webhook_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) query = query.eq("status", status);
    if (event_type) query = query.eq("event_type", event_type);
    const { data, error } = await query;
    if (error) {
      return c.json({
        error: "Failed to fetch deliveries",
        message: error.message,
      }, 500);
    }

    return c.json({ data: data ?? [] });
  },
);

/**
 * DELETE /v1/webhooks/:id
 * Delete webhook
 */
app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["Webhooks"],
    summary: "Delete webhook",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Webhook deleted",
        content: {
          "application/json": {
            schema: z.object({ success: z.boolean() }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const admin = c.get("supabaseAdmin");
    const user = c.get("user");
    const { id } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // A webhook outside the caller's organizations reads as 404, which does
    // not confirm it exists; a member who is not an admin is refused.
    const access = await webhookAccess(admin, user.id, id);
    if (access.status === "error") {
      return c.json({
        error: "Failed to delete webhook",
        message: access.message,
      }, 500);
    }
    if (access.status === "not_found") {
      return c.json({ error: "Not Found" }, 404);
    }
    if (!access.admin) {
      return c.json({
        error: "Forbidden",
        message: "Only organization admins can delete webhooks",
      }, 403);
    }

    const { data, error } = await admin.from("webhooks").delete()
      .eq("id", id).eq("organization_id", access.organizationId).select("id");

    if (error) {
      return c.json({
        error: "Failed to delete webhook",
        message: error.message,
      }, 500);
    }
    if (!data || data.length === 0) {
      return c.json({ error: "Not Found" }, 404);
    }

    return c.json({ success: true });
  },
);

export default app;
