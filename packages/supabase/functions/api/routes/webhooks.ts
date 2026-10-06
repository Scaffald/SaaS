/**
 * Webhooks Management REST API
 * Manage webhook endpoints and deliveries
 *
 * `public.webhooks` belongs to an organization, not a user: it has
 * `organization_id NOT NULL` and `created_by`, and no `user_id`. Every handler
 * here used to filter or insert on `user_id`, so all three answered 500
 * (`column webhooks.user_id does not exist`) on production too (#1016).
 *
 * Authorization is the table's RLS (migration 225): a row is visible and
 * writable only to callers holding a role assignment scoped to its
 * organization. So list and delete simply run as the caller; create has to
 * name an organization, which it resolves from the caller's own org-scoped
 * role assignments and never guesses between several (#1037 is what guessing
 * looks like).
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addSupabaseAdminForUser,
  type ApiEnv,
  authMiddleware,
} from "../middleware/auth.ts";

const app = new OpenAPIHono<ApiEnv>();
app.use("*", authMiddleware);
app.use("*", addSupabaseAdminForUser);

/**
 * The organizations the caller holds an org-scoped role in. Read with the
 * service client, filtered to the caller, so the answer does not depend on how
 * role_assignments' own RLS is written.
 */
async function callerOrganizationIds(
  admin: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await admin
    .schema("core")
    .from("role_assignments")
    .select("scope_org_id")
    .eq("user_id", userId)
    .not("scope_org_id", "is", null);
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.scope_org_id as string))];
}

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
    const supabase = c.get("supabase");
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // RLS limits the rows to the caller's organizations; the optional filter
    // narrows to one of them.
    const { organization_id } = c.req.valid("query");
    let query = supabase.from("webhooks").select("*")
      .order("created_at", { ascending: false });
    if (organization_id) query = query.eq("organization_id", organization_id);
    const { data, error } = await query;

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
    const supabase = c.get("supabase");
    const user = c.get("user");
    const body = c.req.valid("json");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let orgIds: string[];
    try {
      orgIds = await callerOrganizationIds(c.get("supabaseAdmin"), user.id);
    } catch (err) {
      return c.json({
        error: "Failed to create webhook",
        message: (err as Error).message,
      }, 500);
    }

    let organizationId: string;
    if (body.organization_id) {
      if (!orgIds.includes(body.organization_id)) {
        return c.json({
          error: "Forbidden",
          message: "You do not belong to that organization",
        }, 403);
      }
      organizationId = body.organization_id;
    } else if (orgIds.length === 1) {
      organizationId = orgIds[0];
    } else if (orgIds.length === 0) {
      return c.json({
        error: "Forbidden",
        message: "Webhooks belong to an organization, and you are not in one",
      }, 403);
    } else {
      return c.json({
        error: "Bad Request",
        message:
          "You belong to more than one organization; pass organization_id",
      }, 400);
    }

    // Generate webhook secret
    const secret = crypto.randomUUID();

    // Inserted as the caller, so the table's insert policy still has the final
    // say on the organization.
    const { data, error } = await supabase
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
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { id } = c.req.valid("param");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // RLS scopes the delete to the caller's organizations. A webhook outside
    // them matches no row, which reads as 404 rather than confirming it exists.
    const { data, error } = await supabase.from("webhooks").delete()
      .eq("id", id).select("id");

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
