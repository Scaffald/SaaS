/**
 * Community Comments REST API
 * CRUD for threaded comments + pin/unpin
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.ts";
import { notifyPostComment } from "../../_shared/community-notifications.ts";

const app = new OpenAPIHono();

app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

const commentSchema = z
  .object({
    id: z.string().uuid(),
    post_id: z.string().uuid(),
    author_id: z.string().uuid(),
    parent_comment_id: z.string().uuid().nullable(),
    body: z.string(),
    is_pinned: z.boolean(),
    upvote_count: z.number().int(),
    created_at: z.string(),
    updated_at: z.string(),
    author: z
      .object({
        id: z.string().uuid(),
        display_name: z.string().nullable(),
        avatar_url: z.string().nullable(),
      })
      .optional(),
    has_upvoted: z.boolean().optional(),
  })
  .openapi("CommunityComment");

const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  parent_comment_id: z.string().uuid().optional(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});

// ============================================================================
// GET /v1/communities/comments/:postId — List comments
// ============================================================================

const listCommentsRoute = createRoute({
  method: "get",
  path: "/{postId}",
  tags: ["Community Comments"],
  summary: "List comments",
  description: "Get comments for a post (pinned first, then chronological)",
  request: {
    params: z.object({ postId: z.string().uuid() }),
    query: listQuerySchema,
  },
  responses: {
    200: {
      description: "Comments list",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(commentSchema),
            total: z.number().int(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(listCommentsRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { postId } = c.req.valid("param");
  const { limit, offset } = c.req.valid("query");

  // Pinned first, then by created_at
  const { data: comments, error } = await supabase
    .schema("community")
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching comments:", error);
    return c.json(
      { error: "Failed to fetch comments", message: error.message },
      500,
    );
  }

  // Enrich with author data
  const authorIds = [
    ...new Set(
      (comments || []).map((c: Record<string, unknown>) => c.author_id),
    ),
  ];
  const { data: users } = authorIds.length
    ? await supabase
      .schema("core")
      .from("users")
      .select("id, display_name, avatar_url")
      .in("id", authorIds)
    : { data: [] };

  const usersById = new Map(
    (users || []).map((u: Record<string, unknown>) => [u.id, u]),
  );

  // Check user's upvotes on these comments
  let upvotedIds = new Set<string>();
  if (user) {
    const commentIds = (comments || []).map((c: Record<string, unknown>) =>
      c.id
    );
    if (commentIds.length > 0) {
      const { data: upvotes } = await supabase
        .schema("community")
        .from("upvotes")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "comment")
        .in("target_id", commentIds);

      upvotedIds = new Set(
        (upvotes || []).map((u: Record<string, unknown>) =>
          u.target_id as string
        ),
      );
    }
  }

  const enriched = (comments || []).map((comment: Record<string, unknown>) => ({
    ...comment,
    author: usersById.get(comment.author_id) || {
      id: comment.author_id,
      display_name: null,
      avatar_url: null,
    },
    has_upvoted: upvotedIds.has(comment.id as string),
  }));

  const { count } = await supabase
    .schema("community")
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
    .is("deleted_at", null);

  return c.json({ data: enriched, total: count || 0 });
});

// ============================================================================
// POST /v1/communities/comments/:postId — Create comment
// ============================================================================

const createCommentRoute = createRoute({
  method: "post",
  path: "/{postId}",
  tags: ["Community Comments"],
  summary: "Add comment",
  description: "Add a comment to a post",
  request: {
    params: z.object({ postId: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: createCommentSchema } },
    },
  },
  responses: {
    201: {
      description: "Comment created",
      content: {
        "application/json": {
          schema: z.object({ data: commentSchema }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(createCommentRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { postId } = c.req.valid("param");
  const body = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: comment, error } = await supabase
    .schema("community")
    .from("comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      body: body.body,
      parent_comment_id: body.parent_comment_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    return c.json(
      { error: "Failed to create comment", message: error.message },
      500,
    );
  }

  // Award reputation for commenting
  await supabase.rpc("update_scaffold_score", {
    p_user_id: user.id,
    p_delta: 1,
    p_action: "comment_created",
    p_reason: "Created comment",
    p_source_type: "comment",
    p_source_id: comment.id,
  });

  // Notify the post author (fire-and-forget)
  const { data: post } = await supabase
    .schema("community")
    .from("posts")
    .select("author_id, title, community_id")
    .eq("id", postId)
    .maybeSingle();

  if (post && post.author_id !== user.id) {
    const { data: community } = await supabase
      .schema("community")
      .from("communities")
      .select("slug")
      .eq("id", post.community_id)
      .maybeSingle();

    notifyPostComment(
      { supabase },
      {
        postAuthorId: post.author_id,
        commenterId: user.id,
        commenterName: user.user_metadata?.display_name || "Someone",
        postId,
        postTitle: post.title,
        communitySlug: community?.slug || "",
        commentPreview: body.body,
      },
    ).catch((err: unknown) =>
      console.error("Failed to send comment notification:", err)
    );
  }

  return c.json({ data: comment }, 201);
});

// ============================================================================
// PATCH /v1/communities/comments/edit/:commentId — Edit comment
// ============================================================================

const editCommentRoute = createRoute({
  method: "patch",
  path: "/edit/{commentId}",
  tags: ["Community Comments"],
  summary: "Edit comment",
  request: {
    params: z.object({ commentId: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ body: z.string().min(1).max(2000) }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Comment updated",
      content: {
        "application/json": {
          schema: z.object({ data: commentSchema }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(editCommentRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { commentId } = c.req.valid("param");
  const { body } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: comment, error } = await supabase
    .schema("community")
    .from("comments")
    .update({ body })
    .eq("id", commentId)
    .eq("author_id", user.id)
    .select()
    .single();

  if (error) {
    return c.json(
      { error: "Failed to update comment", message: error.message },
      500,
    );
  }

  return c.json({ data: comment });
});

// ============================================================================
// DELETE /v1/communities/comments/:commentId — Soft delete comment
// ============================================================================

const deleteCommentRoute = createRoute({
  method: "delete",
  path: "/{commentId}",
  tags: ["Community Comments"],
  summary: "Delete comment",
  request: {
    params: z.object({ commentId: z.string().uuid() }),
  },
  responses: {
    204: { description: "Comment deleted" },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(deleteCommentRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { commentId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .schema("community")
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) {
    return c.json(
      { error: "Failed to delete comment", message: error.message },
      500,
    );
  }

  return c.body(null, 204);
});

// ============================================================================
// POST /v1/communities/comments/pin/:commentId — Pin comment
// ============================================================================

const pinCommentRoute = createRoute({
  method: "post",
  path: "/pin/{commentId}",
  tags: ["Community Comments"],
  summary: "Pin comment",
  description:
    "Pin a comment on your post (1 pinned per post, post author only)",
  request: {
    params: z.object({ commentId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Comment pinned",
      content: {
        "application/json": {
          schema: z.object({ data: commentSchema }),
        },
      },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(pinCommentRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { commentId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get comment and verify post ownership
  const { data: comment } = await supabase
    .schema("community")
    .from("comments")
    .select("id, post_id")
    .eq("id", commentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!comment) {
    return c.json({ error: "Comment not found" }, 404);
  }

  const { data: post } = await supabase
    .schema("community")
    .from("posts")
    .select("author_id")
    .eq("id", comment.post_id)
    .maybeSingle();

  if (!post || post.author_id !== user.id) {
    return c.json({ error: "Only the post author can pin comments" }, 403);
  }

  // Unpin any existing pinned comment on this post
  await supabase
    .schema("community")
    .from("comments")
    .update({ is_pinned: false })
    .eq("post_id", comment.post_id)
    .eq("is_pinned", true);

  // Pin this one
  const { data: pinned, error } = await supabase
    .schema("community")
    .from("comments")
    .update({ is_pinned: true })
    .eq("id", commentId)
    .select()
    .single();

  if (error) {
    return c.json(
      { error: "Failed to pin comment", message: error.message },
      500,
    );
  }

  return c.json({ data: pinned });
});

// ============================================================================
// DELETE /v1/communities/comments/pin/:commentId — Unpin comment
// ============================================================================

const unpinCommentRoute = createRoute({
  method: "delete",
  path: "/pin/{commentId}",
  tags: ["Community Comments"],
  summary: "Unpin comment",
  request: {
    params: z.object({ commentId: z.string().uuid() }),
  },
  responses: {
    204: { description: "Comment unpinned" },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(unpinCommentRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { commentId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify the post is owned by user
  const { data: comment } = await supabase
    .schema("community")
    .from("comments")
    .select("id, post_id")
    .eq("id", commentId)
    .maybeSingle();

  if (comment) {
    const { data: post } = await supabase
      .schema("community")
      .from("posts")
      .select("author_id")
      .eq("id", comment.post_id)
      .maybeSingle();

    if (post?.author_id === user.id) {
      await supabase
        .schema("community")
        .from("comments")
        .update({ is_pinned: false })
        .eq("id", commentId);
    }
  }

  return c.body(null, 204);
});

export default app;
