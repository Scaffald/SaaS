/**
 * Community Posts REST API
 * CRUD for posts + submit (moderation) + publish + feed endpoints
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.ts";
import { notifyFollowersOfNewPost } from "../../_shared/community-notifications.ts";
import { blockedUserIds } from "../lib/blocks.ts";

const app = new OpenAPIHono();

app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

const postSchema = z
  .object({
    id: z.string().uuid(),
    community_id: z.string().uuid(),
    author_id: z.string().uuid(),
    post_type: z.enum(["advice", "critique", "showcase"]),
    status: z.enum([
      "draft",
      "pending_moderation",
      "published",
      "flagged",
      "removed",
    ]),
    title: z.string(),
    body: z.string().nullable(),
    media_urls: z.array(z.string()),
    media_thumbnails: z.array(z.string()),
    skill_tags: z.array(z.string().uuid()),
    upvote_count: z.number().int(),
    comment_count: z.number().int(),
    rating_avg: z.number().nullable(),
    rating_count: z.number().int(),
    is_published: z.boolean(),
    published_at: z.string().nullable(),
    moderation_result: z.string().nullable(),
    ai_feedback_summary: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    author: z
      .object({
        id: z.string().uuid(),
        display_name: z.string().nullable(),
        avatar_url: z.string().nullable(),
        headline: z.string().nullable(),
      })
      .optional(),
    has_upvoted: z.boolean().optional(),
    has_bookmarked: z.boolean().optional(),
  })
  .openapi("CommunityPost");

const createPostSchema = z.object({
  post_type: z.enum(["advice", "critique", "showcase"]),
  title: z.string().min(1).max(200),
  body: z.string().max(5000).optional(),
  media_urls: z.array(z.string()).optional().default([]),
  skill_tags: z.array(z.string().uuid()).optional().default([]),
});

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().max(5000).optional(),
  media_urls: z.array(z.string()).min(1).optional(),
  skill_tags: z.array(z.string().uuid()).optional(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
  cursor: z.string().optional(),
  post_type: z.enum(["advice", "critique", "showcase"]).optional(),
  sort: z.enum(["recent", "top_rated", "most_upvoted"]).optional().default(
    "recent",
  ),
});

// ============================================================================
// Helpers
// ============================================================================

async function enrichPosts(
  supabase: SupabaseClient,
  posts: Record<string, unknown>[],
  userId?: string,
) {
  if (!posts || posts.length === 0) return [];

  // Fetch authors
  const authorIds = [...new Set(posts.map((p) => p.author_id as string))];
  const { data: users } = await (supabase as SupabaseClient)
    .schema("core")
    .from("users")
    .select("id, display_name, avatar_url, headline")
    .in("id", authorIds);

  const usersById = new Map(
    (users || []).map((u: Record<string, unknown>) => [u.id, u]),
  );

  // Fetch user's upvotes and bookmarks for these posts
  let upvotedPostIds = new Set<string>();
  let bookmarkedPostIds = new Set<string>();

  if (userId) {
    const postIds = posts.map((p) => p.id as string);

    const { data: upvotes } = await (supabase as SupabaseClient)
      .schema("community")
      .from("upvotes")
      .select("target_id")
      .eq("user_id", userId)
      .eq("target_type", "post")
      .in("target_id", postIds);

    upvotedPostIds = new Set(
      (upvotes || []).map((u: Record<string, unknown>) =>
        u.target_id as string
      ),
    );

    const { data: bookmarks } = await (supabase as SupabaseClient)
      .schema("community")
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds);

    bookmarkedPostIds = new Set(
      (bookmarks || []).map((b: Record<string, unknown>) =>
        b.post_id as string
      ),
    );
  }

  return posts.map((p) => ({
    ...p,
    author: usersById.get(p.author_id as string) || {
      id: p.author_id,
      display_name: null,
      avatar_url: null,
      headline: null,
    },
    has_upvoted: upvotedPostIds.has(p.id as string),
    has_bookmarked: bookmarkedPostIds.has(p.id as string),
  }));
}

// Reputation score deltas
const REPUTATION = {
  POST_PUBLISHED: 5,
  POST_PUBLISHED_FULL_TAXONOMY: 20,
  POST_UNPUBLISHED: -15,
  POST_DELETED: -25,
} as const;

// ============================================================================
// GET /v1/communities/posts/feed/:communityId — Community feed
// ============================================================================

const getCommunityFeedRoute = createRoute({
  method: "get",
  path: "/feed/{communityId}",
  tags: ["Community Posts"],
  summary: "Community feed",
  description: "Get posts in a community (members only for unpublished)",
  request: {
    params: z.object({ communityId: z.string().uuid() }),
    query: listQuerySchema,
  },
  responses: {
    200: {
      description: "Post feed",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(postSchema),
            next_cursor: z.string().nullable(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getCommunityFeedRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { communityId } = c.req.valid("param");
  const { limit, cursor, post_type, sort } = c.req.valid("query");

  // #690: hide posts by anyone on either side of a block, before paging —
  // filtering after the fact would silently shorten pages and break the
  // cursor. `not in ()` is invalid SQL, hence the guard on an empty set.
  const blocked = user?.id
    ? await blockedUserIds(supabase, user.id as string)
    : new Set<string>();

  let query = supabase
    .schema("community")
    .from("posts")
    .select("*")
    .eq("community_id", communityId)
    .eq("status", "published")
    .is("deleted_at", null);

  if (blocked.size > 0) {
    query = query.not("author_id", "in", `(${[...blocked].join(",")})`);
  }

  if (post_type) {
    query = query.eq("post_type", post_type);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  // Sort
  if (sort === "top_rated") {
    query = query.order("rating_avg", { ascending: false, nullsFirst: false });
  } else if (sort === "most_upvoted") {
    query = query.order("upvote_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.limit(limit);

  const { data: posts, error } = await query;

  if (error) {
    console.error("Error fetching community feed:", error);
    return c.json(
      { error: "Failed to fetch feed", message: error.message },
      500,
    );
  }

  const enriched = await enrichPosts(supabase, posts || [], user?.id);

  const lastPost = posts?.[posts.length - 1];
  const next_cursor = lastPost
    ? (lastPost as Record<string, unknown>).created_at
    : null;

  return c.json({ data: enriched, next_cursor });
});

// ============================================================================
// GET /v1/communities/posts/published — Cross-community published feed
// ============================================================================

const getPublishedFeedRoute = createRoute({
  method: "get",
  path: "/published",
  tags: ["Community Posts"],
  summary: "Published feed",
  description: "Cross-community published posts (public portfolio posts)",
  request: {
    query: listQuerySchema,
  },
  responses: {
    200: {
      description: "Published posts",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(postSchema),
            next_cursor: z.string().nullable(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getPublishedFeedRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { limit, cursor } = c.req.valid("query");

  let query = supabase
    .schema("community")
    .from("posts")
    .select("*")
    .eq("is_published", true)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false });

  if (cursor) {
    query = query.lt("published_at", cursor);
  }

  query = query.limit(limit);

  const { data: posts, error } = await query;

  if (error) {
    console.error("Error fetching published feed:", error);
    return c.json(
      { error: "Failed to fetch feed", message: error.message },
      500,
    );
  }

  const enriched = await enrichPosts(supabase, posts || [], user?.id);

  const lastPost = posts?.[posts.length - 1];
  const next_cursor = lastPost
    ? (lastPost as Record<string, unknown>).published_at
    : null;

  return c.json({ data: enriched, next_cursor });
});

// ============================================================================
// GET /v1/communities/posts/user/:userId — User's published posts (portfolio)
// ============================================================================

const getUserPostsRoute = createRoute({
  method: "get",
  path: "/user/{userId}",
  tags: ["Community Posts"],
  summary: "User portfolio posts",
  description: "Get published posts for a user (public portfolio)",
  request: {
    params: z.object({ userId: z.string().uuid() }),
    query: listQuerySchema,
  },
  responses: {
    200: {
      description: "User posts",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(postSchema),
            next_cursor: z.string().nullable(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getUserPostsRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { userId } = c.req.valid("param");
  const { limit, cursor } = c.req.valid("query");

  let query = supabase
    .schema("community")
    .from("posts")
    .select("*")
    .eq("author_id", userId)
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("published_at", { ascending: false });

  if (cursor) {
    query = query.lt("published_at", cursor);
  }

  query = query.limit(limit);

  const { data: posts, error } = await query;

  if (error) {
    console.error("Error fetching user posts:", error);
    return c.json(
      { error: "Failed to fetch posts", message: error.message },
      500,
    );
  }

  const enriched = await enrichPosts(supabase, posts || [], user?.id);

  const lastPost = posts?.[posts.length - 1];
  const next_cursor = lastPost
    ? (lastPost as Record<string, unknown>).published_at
    : null;

  return c.json({ data: enriched, next_cursor });
});

// ============================================================================
// POST /v1/communities/posts/:communityId — Create post
// ============================================================================

const createPostRoute = createRoute({
  method: "post",
  path: "/{communityId}",
  tags: ["Community Posts"],
  summary: "Create post",
  description: "Create a new community post (draft)",
  request: {
    params: z.object({ communityId: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: createPostSchema } },
    },
  },
  responses: {
    201: {
      description: "Post created",
      content: {
        "application/json": {
          schema: z.object({ data: postSchema }),
        },
      },
    },
    400: {
      description: "Bad request",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(createPostRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { communityId } = c.req.valid("param");
  const body = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify membership
  const { data: membership } = await supabase
    .schema("community")
    .from("memberships")
    .select("id, is_verified")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return c.json({ error: "Must be a community member to post" }, 403);
  }

  if (!membership.is_verified) {
    return c.json({
      error: "Must be verified to post. Submit your license for verification.",
    }, 403);
  }

  // Validate media required for showcase and critique post types
  if (
    (body.post_type === "showcase" || body.post_type === "critique") &&
    (!body.media_urls || body.media_urls.length === 0)
  ) {
    return c.json({
      error:
        "At least one media item (photo or video) is required for showcase and critique posts",
    }, 400);
  }

  // Auto-expand skill tags with ancestors
  let expandedTags = body.skill_tags || [];
  if (expandedTags.length > 0) {
    const { data: ancestors } = await supabase.rpc("get_skill_ancestors", {
      p_skill_id: expandedTags[expandedTags.length - 1],
    });
    if (ancestors) {
      expandedTags = [...new Set([...expandedTags, ...ancestors])];
    }
  }

  const { data: post, error } = await supabase
    .schema("community")
    .from("posts")
    .insert({
      community_id: communityId,
      author_id: user.id,
      post_type: body.post_type,
      status: "draft",
      title: body.title,
      body: body.body || null,
      media_urls: body.media_urls || [],
      skill_tags: expandedTags,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating post:", error);
    return c.json(
      { error: "Failed to create post", message: error.message },
      500,
    );
  }

  return c.json({ data: post }, 201);
});

// ============================================================================
// GET /v1/communities/posts/:postId — Get single post
// ============================================================================

const getPostRoute = createRoute({
  method: "get",
  path: "/{postId}",
  tags: ["Community Posts"],
  summary: "Get post",
  description: "Get a single post by ID",
  request: {
    params: z.object({ postId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Post detail",
      content: {
        "application/json": {
          schema: z.object({ data: postSchema }),
        },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getPostRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { postId } = c.req.valid("param");

  const { data: post, error } = await supabase
    .schema("community")
    .from("posts")
    .select("*")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !post) {
    return c.json({ error: "Post not found" }, 404);
  }

  const enriched = await enrichPosts(supabase, [post], user?.id);

  return c.json({ data: enriched[0] });
});

// ============================================================================
// PATCH /v1/communities/posts/:postId — Update draft post
// ============================================================================

const updatePostRoute = createRoute({
  method: "patch",
  path: "/{postId}",
  tags: ["Community Posts"],
  summary: "Update post",
  description: "Update a draft post",
  request: {
    params: z.object({ postId: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: updatePostSchema } },
    },
  },
  responses: {
    200: {
      description: "Post updated",
      content: {
        "application/json": {
          schema: z.object({ data: postSchema }),
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

app.openapi(updatePostRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { postId } = c.req.valid("param");
  const body = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify ownership and draft status
  const { data: existing } = await supabase
    .schema("community")
    .from("posts")
    .select("id, author_id, status")
    .eq("id", postId)
    .maybeSingle();

  if (!existing || existing.author_id !== user.id) {
    return c.json({ error: "Post not found or not yours" }, 404);
  }

  if (existing.status !== "draft") {
    return c.json({ error: "Can only edit draft posts" }, 400);
  }

  const { data: post, error } = await supabase
    .schema("community")
    .from("posts")
    .update(body)
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    console.error("Error updating post:", error);
    return c.json(
      { error: "Failed to update post", message: error.message },
      500,
    );
  }

  return c.json({ data: post });
});

// ============================================================================
// POST /v1/communities/posts/:postId/submit — Submit for moderation
// ============================================================================

const submitPostRoute = createRoute({
  method: "post",
  path: "/{postId}/submit",
  tags: ["Community Posts"],
  summary: "Submit post",
  description: "Submit a draft post for AI moderation",
  request: {
    params: z.object({ postId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Post submitted",
      content: {
        "application/json": {
          schema: z.object({ data: postSchema }),
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

app.openapi(submitPostRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { postId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: existing } = await supabase
    .schema("community")
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("author_id", user.id)
    .maybeSingle();

  if (!existing) {
    return c.json({ error: "Post not found" }, 404);
  }

  if (existing.status !== "draft") {
    return c.json({ error: "Can only submit draft posts" }, 400);
  }

  if (
    (existing.post_type === "showcase" || existing.post_type === "critique") &&
    (!existing.media_urls || existing.media_urls.length === 0)
  ) {
    return c.json({
      error:
        "At least one media item is required for showcase and critique posts",
    }, 400);
  }

  // AI Moderation stub — auto-approve for now (Phase 3 will implement real moderation)
  const moderationResult = "approved";
  const moderationMetadata = {
    model: "stub",
    confidence: 1.0,
    reason: "Auto-approved (moderation service pending)",
    moderated_at: new Date().toISOString(),
  };

  // Determine status after moderation
  let newStatus = "published";
  let isPublished = false;
  let publishedAt = null;

  if (moderationResult === "approved") {
    newStatus = "published";

    // Showcase auto-publishes to profile
    if (existing.post_type === "showcase") {
      isPublished = true;
      publishedAt = new Date().toISOString();
    }
  } else {
    newStatus = "flagged";
  }

  const { data: post, error } = await supabase
    .schema("community")
    .from("posts")
    .update({
      status: newStatus,
      moderation_result: moderationResult,
      moderation_metadata: moderationMetadata,
      is_published: isPublished,
      published_at: publishedAt,
    })
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    console.error("Error submitting post:", error);
    return c.json(
      { error: "Failed to submit post", message: error.message },
      500,
    );
  }

  // Award reputation for publishing
  if (isPublished) {
    const allTiersTagged = existing.skill_tags &&
      existing.skill_tags.length >= 3;
    const delta = allTiersTagged
      ? REPUTATION.POST_PUBLISHED_FULL_TAXONOMY
      : REPUTATION.POST_PUBLISHED;
    const action = allTiersTagged
      ? "post_published_full_taxonomy"
      : "post_published";

    await supabase.rpc("update_scaffold_score", {
      p_user_id: user.id,
      p_delta: delta,
      p_action: action,
      p_reason: `Published ${existing.post_type} post`,
      p_source_type: "post",
      p_source_id: postId,
    });
  }

  // Notify followers of new published post (fire-and-forget)
  if (isPublished) {
    const { data: community } = await supabase
      .schema("community")
      .from("communities")
      .select("slug")
      .eq("id", existing.community_id)
      .maybeSingle();

    notifyFollowersOfNewPost(
      { supabase },
      {
        authorId: user.id,
        authorName: user.user_metadata?.display_name || "A user",
        postId,
        postTitle: existing.title,
        communitySlug: community?.slug || "",
      },
    ).catch((err: unknown) =>
      console.error("Failed to notify followers:", err)
    );
  }

  return c.json({ data: post });
});

// ============================================================================
// POST /v1/communities/posts/:postId/publish — Publish to profile (critique)
// ============================================================================

const publishPostRoute = createRoute({
  method: "post",
  path: "/{postId}/publish",
  tags: ["Community Posts"],
  summary: "Publish to profile",
  description:
    "Publish a critique post to your public profile (after receiving feedback)",
  request: {
    params: z.object({ postId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Post published to profile",
      content: {
        "application/json": {
          schema: z.object({ data: postSchema }),
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

app.openapi(publishPostRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { postId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: existing } = await supabase
    .schema("community")
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("author_id", user.id)
    .maybeSingle();

  if (!existing) {
    return c.json({ error: "Post not found" }, 404);
  }

  if (existing.post_type === "advice") {
    return c.json(
      { error: "Advice posts cannot be published to profile" },
      400,
    );
  }

  if (existing.status !== "published") {
    return c.json({ error: "Post must be approved before publishing" }, 400);
  }

  if (existing.is_published) {
    return c.json({ error: "Post is already published to profile" }, 400);
  }

  // Critique posts need at least 1 comment/rating before publishing
  if (
    existing.post_type === "critique" && existing.comment_count === 0 &&
    existing.rating_count === 0
  ) {
    return c.json({
      error: "Critique posts need feedback before publishing to profile",
    }, 400);
  }

  const { data: post, error } = await supabase
    .schema("community")
    .from("posts")
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    console.error("Error publishing post:", error);
    return c.json(
      { error: "Failed to publish post", message: error.message },
      500,
    );
  }

  // Award reputation
  const allTiersTagged = existing.skill_tags && existing.skill_tags.length >= 3;
  const delta = allTiersTagged
    ? REPUTATION.POST_PUBLISHED_FULL_TAXONOMY
    : REPUTATION.POST_PUBLISHED;

  await supabase.rpc("update_scaffold_score", {
    p_user_id: user.id,
    p_delta: delta,
    p_action: allTiersTagged
      ? "post_published_full_taxonomy"
      : "post_published",
    p_reason: `Published ${existing.post_type} to profile`,
    p_source_type: "post",
    p_source_id: postId,
  });

  // Notify followers (fire-and-forget)
  const { data: community } = await supabase
    .schema("community")
    .from("communities")
    .select("slug")
    .eq("id", existing.community_id)
    .maybeSingle();

  notifyFollowersOfNewPost(
    { supabase },
    {
      authorId: user.id,
      authorName: user.user_metadata?.display_name || "A user",
      postId,
      postTitle: existing.title,
      communitySlug: community?.slug || "",
    },
  ).catch((err: unknown) => console.error("Failed to notify followers:", err));

  return c.json({ data: post });
});

// ============================================================================
// POST /v1/communities/posts/:postId/unpublish — Unpublish from profile
// ============================================================================

const unpublishPostRoute = createRoute({
  method: "post",
  path: "/{postId}/unpublish",
  tags: ["Community Posts"],
  summary: "Unpublish from profile",
  description: "Remove a post from your public profile (costs reputation)",
  request: {
    params: z.object({ postId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Post unpublished",
      content: {
        "application/json": {
          schema: z.object({ data: postSchema }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(unpublishPostRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { postId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: existing } = await supabase
    .schema("community")
    .from("posts")
    .select("id, author_id, is_published")
    .eq("id", postId)
    .eq("author_id", user.id)
    .maybeSingle();

  if (!existing?.is_published) {
    return c.json({ error: "Post not found or not published" }, 404);
  }

  const { data: post, error } = await supabase
    .schema("community")
    .from("posts")
    .update({ is_published: false, published_at: null })
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    return c.json(
      { error: "Failed to unpublish", message: error.message },
      500,
    );
  }

  // Reputation penalty
  await supabase.rpc("update_scaffold_score", {
    p_user_id: user.id,
    p_delta: REPUTATION.POST_UNPUBLISHED,
    p_action: "post_unpublished",
    p_reason: "Unpublished post from profile",
    p_source_type: "post",
    p_source_id: postId,
  });

  return c.json({ data: post });
});

// ============================================================================
// DELETE /v1/communities/posts/:postId — Soft delete post
// ============================================================================

const deletePostRoute = createRoute({
  method: "delete",
  path: "/{postId}",
  tags: ["Community Posts"],
  summary: "Delete post",
  description: "Soft-delete a post (costs significant reputation)",
  request: {
    params: z.object({ postId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Post deleted",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(deletePostRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { postId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: existing } = await supabase
    .schema("community")
    .from("posts")
    .select("id, author_id")
    .eq("id", postId)
    .eq("author_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) {
    return c.json({ error: "Post not found" }, 404);
  }

  const { error } = await supabase
    .schema("community")
    .from("posts")
    .update({ deleted_at: new Date().toISOString(), is_published: false })
    .eq("id", postId);

  if (error) {
    return c.json(
      { error: "Failed to delete post", message: error.message },
      500,
    );
  }

  // Reputation penalty
  await supabase.rpc("update_scaffold_score", {
    p_user_id: user.id,
    p_delta: REPUTATION.POST_DELETED,
    p_action: "post_deleted",
    p_reason: "Deleted post",
    p_source_type: "post",
    p_source_id: postId,
  });

  return c.json({ message: "Post deleted" });
});

export default app;
