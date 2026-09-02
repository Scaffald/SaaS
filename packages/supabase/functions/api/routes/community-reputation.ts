/**
 * Community Reputation REST API
 * Scaffold Score, Karma Bank, reputation history
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type ApiEnv, authMiddleware } from "../middleware/auth.ts";
import { notifyKarmaReceived } from "../../_shared/community-notifications.ts";

const app = new OpenAPIHono<ApiEnv>();

app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

const scaffoldScoreSchema = z
  .object({
    user_id: z.string().uuid(),
    score: z.number().int(),
    karma_bank: z.number().int(),
    total_earned: z.number().int(),
    total_spent: z.number().int(),
    updated_at: z.string(),
  })
  .openapi("ScaffoldScore");

const reputationEventSchema = z
  .object({
    id: z.string().uuid(),
    action: z.string(),
    delta: z.number().int(),
    reason: z.string().nullable(),
    source_type: z.string().nullable(),
    source_id: z.string().uuid().nullable(),
    created_at: z.string(),
  })
  .openapi("ReputationEvent");

const giftKarmaSchema = z.object({
  receiver_id: z.string().uuid(),
  amount: z.number().int().min(1).max(10),
  message: z.string().max(200).optional(),
});

// ============================================================================
// GET /v1/communities/reputation/me — Get my score
// ============================================================================

const getMyScoreRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["Community Reputation"],
  summary: "My Scaffold Score",
  description: "Get the authenticated users Scaffold Score and Karma Bank",
  responses: {
    200: {
      description: "Score data",
      content: {
        "application/json": {
          schema: z.object({ data: scaffoldScoreSchema }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getMyScoreRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Lazy-init the score row (RLS may block client-context inserts; ignore errors,
  // we'll fall through to defaults below if no row exists).
  await supabase
    .schema("community")
    .from("scaffold_scores")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });

  const { data, error } = await supabase
    .schema("community")
    .from("scaffold_scores")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return c.json(
      { error: "Failed to fetch score", message: error.message },
      500,
    );
  }

  if (!data) {
    const now = new Date().toISOString();
    return c.json({
      data: {
        user_id: user.id as string,
        score: 0,
        karma_bank: 5,
        total_earned: 0,
        total_spent: 0,
        last_updated_at: now,
        created_at: now,
      },
    });
  }

  return c.json({ data });
});

// ============================================================================
// GET /v1/communities/reputation/user/:userId — Get user's public score
// ============================================================================

const getUserScoreRoute = createRoute({
  method: "get",
  path: "/user/{userId}",
  tags: ["Community Reputation"],
  summary: "User Scaffold Score",
  description: "Get a users public Scaffold Score",
  request: {
    params: z.object({ userId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Score data",
      content: {
        "application/json": {
          schema: z.object({
            data: z.object({
              user_id: z.string().uuid(),
              score: z.number().int(),
            }),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getUserScoreRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const { userId } = c.req.valid("param");

  const { data } = await supabase
    .schema("community")
    .from("scaffold_scores")
    .select("user_id, score")
    .eq("user_id", userId)
    .maybeSingle();

  return c.json({
    data: data || { user_id: userId, score: 100 }, // Default 100 if no row
  });
});

// ============================================================================
// GET /v1/communities/reputation/history — Reputation event history
// ============================================================================

const getHistoryRoute = createRoute({
  method: "get",
  path: "/history",
  tags: ["Community Reputation"],
  summary: "Reputation history",
  description: "Get the authenticated users reputation event history",
  request: {
    query: z.object({
      limit: z.coerce.number().int().positive().max(100).optional().default(50),
      offset: z.coerce.number().int().nonnegative().optional().default(0),
    }),
  },
  responses: {
    200: {
      description: "Reputation events",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(reputationEventSchema),
            total: z.number().int(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getHistoryRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { limit, offset } = c.req.valid("query");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabase
    .schema("community")
    .from("reputation_events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return c.json(
      { error: "Failed to fetch history", message: error.message },
      500,
    );
  }

  const { count } = await supabase
    .schema("community")
    .from("reputation_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return c.json({ data: data || [], total: count || 0 });
});

// ============================================================================
// POST /v1/communities/reputation/gift-karma — Gift karma
// ============================================================================

const giftKarmaRoute = createRoute({
  method: "post",
  path: "/gift-karma",
  tags: ["Community Reputation"],
  summary: "Gift karma",
  description: "Gift karma from your Karma Bank to another member",
  request: {
    body: {
      content: { "application/json": { schema: giftKarmaSchema } },
    },
  },
  responses: {
    200: {
      description: "Karma gifted",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), message: z.string() }),
        },
      },
    },
    400: {
      description: "Bad request",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(giftKarmaRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { receiver_id, amount, message } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (receiver_id === user.id) {
    return c.json({ error: "Cannot gift karma to yourself" }, 400);
  }

  // Daily limit check (50/day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: dailyGifts } = await supabase
    .schema("community")
    .from("karma_gifts")
    .select("*", { count: "exact", head: true })
    .eq("giver_id", user.id)
    .gte("created_at", today.toISOString());

  if ((dailyGifts || 0) >= 5) {
    return c.json({ error: "Daily karma gift limit reached (5 per day)" }, 400);
  }

  // Call the gift_karma function (defined in the community schema)
  const { error } = await supabase.schema("community").rpc("gift_karma", {
    p_giver_id: user.id,
    p_receiver_id: receiver_id,
    p_amount: amount,
    p_message: message || null,
  });

  if (error) {
    console.error("Error gifting karma:", error);
    return c.json({ error: error.message || "Failed to gift karma" }, 400);
  }

  // Notify receiver (fire-and-forget)
  notifyKarmaReceived(
    { supabase },
    {
      receiverId: receiver_id,
      giverId: user.id,
      giverName: user.user_metadata?.display_name || "Someone",
      amount,
      message: message || undefined,
    },
  ).catch((err: unknown) =>
    console.error("Failed to send karma notification:", err)
  );

  return c.json({ success: true, message: `Gifted ${amount} karma` });
});

export default app;
