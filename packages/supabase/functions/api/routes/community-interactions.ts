/**
 * Community Interactions REST API
 * Upvotes (posts + comments) and Bookmarks
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type ApiEnv, authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono<ApiEnv>();

app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

const upvoteSchema = z.object({
  target_type: z.enum(["post", "comment"]),
  target_id: z.string().uuid(),
});

const bookmarkSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    post_id: z.string().uuid(),
    created_at: z.string(),
  })
  .openapi("Bookmark");

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
  cursor: z.string().optional(),
});

// ============================================================================
// POST /v1/communities/interactions/upvote — Upvote
// ============================================================================

const upvoteRoute = createRoute({
  method: "post",
  path: "/upvote",
  tags: ["Community Interactions"],
  summary: "Upvote",
  description: "Upvote a post or comment",
  request: {
    body: {
      content: { "application/json": { schema: upvoteSchema } },
    },
  },
  responses: {
    201: {
      description: "Upvoted",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
    400: {
      description: "Already upvoted",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(upvoteRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { target_type, target_id } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .schema("community")
    .from("upvotes")
    .insert({
      user_id: user.id,
      target_type,
      target_id,
    });

  if (error) {
    if (error.code === "23505") {
      return c.json({ error: "Already upvoted" }, 400);
    }
    console.error("Error upvoting:", error);
    return c.json({ error: "Failed to upvote", message: error.message }, 500);
  }

  // Award reputation to the content author
  let authorId: string | null = null;
  if (target_type === "post") {
    const { data: post } = await supabase
      .schema("community")
      .from("posts")
      .select("author_id")
      .eq("id", target_id)
      .maybeSingle();
    authorId = post?.author_id;
  } else {
    const { data: comment } = await supabase
      .schema("community")
      .from("comments")
      .select("author_id")
      .eq("id", target_id)
      .maybeSingle();
    authorId = comment?.author_id;
  }

  if (authorId && authorId !== user.id) {
    await supabase.rpc("update_scaffold_score", {
      p_user_id: authorId,
      p_delta: 1,
      p_action: "upvote_received",
      p_reason: `Received upvote on ${target_type}`,
      p_source_type: target_type,
      p_source_id: target_id,
    });
  }

  return c.json({ success: true }, 201);
});

// ============================================================================
// DELETE /v1/communities/interactions/upvote/:targetType/:targetId — Remove upvote
// ============================================================================

const removeUpvoteRoute = createRoute({
  method: "delete",
  path: "/upvote/{targetType}/{targetId}",
  tags: ["Community Interactions"],
  summary: "Remove upvote",
  request: {
    params: z.object({
      targetType: z.enum(["post", "comment"]),
      targetId: z.string().uuid(),
    }),
  },
  responses: {
    204: { description: "Upvote removed" },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(removeUpvoteRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { targetType, targetId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await supabase
    .schema("community")
    .from("upvotes")
    .delete()
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  return c.body(null, 204);
});

// ============================================================================
// POST /v1/communities/interactions/bookmark/:postId — Bookmark
// ============================================================================

const bookmarkRoute = createRoute({
  method: "post",
  path: "/bookmark/{postId}",
  tags: ["Community Interactions"],
  summary: "Bookmark post",
  request: {
    params: z.object({ postId: z.string().uuid() }),
  },
  responses: {
    201: {
      description: "Bookmarked",
      content: {
        "application/json": {
          schema: z.object({ data: bookmarkSchema }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(bookmarkRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { postId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: bookmark, error } = await supabase
    .schema("community")
    .from("bookmarks")
    .insert({ user_id: user.id, post_id: postId })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return c.json({ error: "Already bookmarked" }, 400);
    }
    return c.json({ error: "Failed to bookmark", message: error.message }, 500);
  }

  return c.json({ data: bookmark }, 201);
});

// ============================================================================
// DELETE /v1/communities/interactions/bookmark/:postId — Remove bookmark
// ============================================================================

const removeBookmarkRoute = createRoute({
  method: "delete",
  path: "/bookmark/{postId}",
  tags: ["Community Interactions"],
  summary: "Remove bookmark",
  request: {
    params: z.object({ postId: z.string().uuid() }),
  },
  responses: {
    204: { description: "Bookmark removed" },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(removeBookmarkRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { postId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await supabase
    .schema("community")
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", postId);

  return c.body(null, 204);
});

// ============================================================================
// GET /v1/communities/interactions/bookmarks — List bookmarks
// ============================================================================

const listBookmarksRoute = createRoute({
  method: "get",
  path: "/bookmarks",
  tags: ["Community Interactions"],
  summary: "List bookmarks",
  description: "Get the authenticated users bookmarked posts",
  request: {
    query: listQuerySchema,
  },
  responses: {
    200: {
      description: "Bookmarked posts",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(z.unknown()),
            next_cursor: z.string().nullable(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(listBookmarksRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { limit, cursor } = c.req.valid("query");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let query = supabase
    .schema("community")
    .from("bookmarks")
    .select("id, post_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  query = query.limit(limit);

  const { data: bookmarks, error } = await query;

  if (error) {
    return c.json({
      error: "Failed to fetch bookmarks",
      message: error.message,
    }, 500);
  }

  // Fetch the actual posts
  const postIds = (bookmarks || []).map((b: Record<string, unknown>) =>
    b.post_id
  );
  let posts: Record<string, unknown>[] = [];

  if (postIds.length > 0) {
    const { data } = await supabase
      .schema("community")
      .from("posts")
      .select("*")
      .in("id", postIds)
      .is("deleted_at", null);

    posts = data || [];
  }

  // Enrich posts with author info
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const { data: users } = authorIds.length
    ? await supabase
      .schema("core")
      .from("users")
      .select("id, display_name, avatar_url, headline")
      .in("id", authorIds)
    : { data: [] };

  const usersById = new Map(
    (users || []).map((u: Record<string, unknown>) => [u.id, u]),
  );
  const enriched = posts.map((p) => ({
    ...p,
    author: usersById.get(p.author_id) || {
      id: p.author_id,
      display_name: null,
      avatar_url: null,
      headline: null,
    },
    has_bookmarked: true,
  }));

  const lastBookmark = bookmarks?.[bookmarks.length - 1];
  const next_cursor = lastBookmark ? lastBookmark.created_at : null;

  return c.json({ data: enriched, next_cursor });
});

export default app;
