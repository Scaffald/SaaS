/**
 * Communities REST API
 * Manages trade-specific community groups (list, join, leave, members)
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono();

app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

const communitySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    icon_url: z.string().nullable(),
    banner_url: z.string().nullable(),
    member_count: z.number().int(),
    post_count: z.number().int(),
    is_active: z.boolean(),
    created_at: z.string(),
  })
  .openapi("Community");

const communityDetailSchema = communitySchema
  .extend({
    is_member: z.boolean(),
    is_verified: z.boolean(),
    membership_id: z.string().uuid().nullable(),
  })
  .openapi("CommunityDetail");

const memberSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    joined_at: z.string(),
    is_verified: z.boolean(),
    user: z.object({
      id: z.string().uuid(),
      display_name: z.string().nullable(),
      avatar_url: z.string().nullable(),
      headline: z.string().nullable(),
    }),
  })
  .openapi("CommunityMember");

const membershipSchema = z
  .object({
    id: z.string().uuid(),
    community_id: z.string().uuid(),
    user_id: z.string().uuid(),
    joined_at: z.string(),
    is_verified: z.boolean(),
  })
  .openapi("Membership");

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});

// ============================================================================
// GET /v1/communities — List all communities
// ============================================================================

const listCommunitiesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Communities"],
  summary: "List communities",
  description: "Get all active trade communities",
  request: {
    query: listQuerySchema,
  },
  responses: {
    200: {
      description: "List of communities",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(communitySchema),
            total: z.number().int(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(listCommunitiesRoute, async (c) => {
  const supabase = c.get("supabase");
  const { limit, offset } = c.req.valid("query");

  const { data, error } = await supabase
    .schema("community")
    .from("communities")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching communities:", error);
    return c.json({
      error: "Failed to fetch communities",
      message: error.message,
    }, 500);
  }

  const { count } = await supabase
    .schema("community")
    .from("communities")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  return c.json({ data: data || [], total: count || 0 });
});

// ============================================================================
// GET /v1/communities/my — Get communities the current user belongs to
// (must be registered BEFORE /{slug} so the static path wins the matcher)
// ============================================================================

const myCommunitiesRoute = createRoute({
  method: "get",
  path: "/my",
  tags: ["Communities"],
  summary: "My communities",
  description: "Get communities the authenticated user belongs to",
  responses: {
    200: {
      description: "List of community memberships with nested community detail",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(
              z.object({
                community_id: z.string().uuid(),
                community: communitySchema,
                joined_at: z.string().nullable(),
                is_verified: z.boolean(),
                membership_id: z.string().uuid(),
              }),
            ),
          }),
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

app.openapi(myCommunitiesRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: memberships, error } = await supabase
    .schema("community")
    .from("memberships")
    .select("id, community_id, is_verified, joined_at")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching memberships:", error);
    return c.json({
      error: "Failed to fetch memberships",
      message: error.message,
    }, 500);
  }

  if (!memberships || memberships.length === 0) {
    return c.json({ data: [] });
  }

  const communityIds = memberships.map((m) => m.community_id);
  const { data: communities } = await supabase
    .schema("community")
    .from("communities")
    .select("*")
    .in("id", communityIds)
    .eq("is_active", true);

  const communityMap = new Map((communities || []).map((c) => [c.id, c]));

  const data = memberships
    .map((m) => {
      const community = communityMap.get(m.community_id);
      if (!community) return null;
      return {
        community_id: m.community_id,
        community,
        joined_at: m.joined_at ?? null,
        is_verified: m.is_verified || false,
        membership_id: m.id,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return c.json({ data });
});

// ============================================================================
// GET /v1/communities/:slug — Get community detail
// ============================================================================

const getCommunityRoute = createRoute({
  method: "get",
  path: "/{slug}",
  tags: ["Communities"],
  summary: "Get community detail",
  description: "Get a community by slug with membership status",
  request: {
    params: z.object({ slug: z.string() }),
  },
  responses: {
    200: {
      description: "Community detail",
      content: {
        "application/json": {
          schema: z.object({ data: communityDetailSchema }),
        },
      },
    },
    404: {
      description: "Community not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getCommunityRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { slug } = c.req.valid("param");

  const { data: community, error } = await supabase
    .schema("community")
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !community) {
    return c.json({ error: "Community not found" }, 404);
  }

  // Check membership
  let is_member = false;
  let is_verified = false;
  let membership_id = null;

  if (user) {
    const { data: membership } = await supabase
      .schema("community")
      .from("memberships")
      .select("id, is_verified")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      is_member = true;
      is_verified = membership.is_verified;
      membership_id = membership.id;
    }
  }

  return c.json({
    data: { ...community, is_member, is_verified, membership_id },
  });
});

// ============================================================================
// POST /v1/communities/:id/join — Join a community
// ============================================================================

const joinCommunityRoute = createRoute({
  method: "post",
  path: "/{id}/join",
  tags: ["Communities"],
  summary: "Join community",
  description: "Join a trade community (verification required to post)",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              license_state: z.string().optional(),
              license_number: z.string().optional(),
              license_type: z.string().optional(),
            })
            .optional(),
        },
      },
      required: false,
    },
  },
  responses: {
    201: {
      description: "Joined community",
      content: {
        "application/json": {
          schema: z.object({ data: membershipSchema }),
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

app.openapi(joinCommunityRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check community exists
  const { data: community } = await supabase
    .schema("community")
    .from("communities")
    .select("id")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!community) {
    return c.json({ error: "Community not found" }, 404);
  }

  // Check not already a member
  const { data: existing } = await supabase
    .schema("community")
    .from("memberships")
    .select("id")
    .eq("community_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return c.json({ error: "Already a member of this community" }, 400);
  }

  // Build verification data if provided
  let body: Record<string, unknown> = {};
  try {
    body = (await c.req.json()) || {};
  } catch {
    // No body provided
  }

  const verification_data: Record<string, unknown> = {};
  if (body.license_state) verification_data.state = body.license_state;
  if (body.license_number) {
    verification_data.license_number = body.license_number;
  }
  if (body.license_type) verification_data.license_type = body.license_type;
  if (Object.keys(verification_data).length > 0) {
    verification_data.submitted_at = new Date().toISOString();
  }

  const { data: membership, error } = await supabase
    .schema("community")
    .from("memberships")
    .insert({
      community_id: id,
      user_id: user.id,
      is_verified: false,
      verification_data,
    })
    .select()
    .single();

  if (error) {
    console.error("Error joining community:", error);
    return c.json(
      { error: "Failed to join community", message: error.message },
      500,
    );
  }

  // Initialize scaffold score for this user (lazy init)
  await supabase
    .schema("community")
    .from("scaffold_scores")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });

  return c.json({ data: membership }, 201);
});

// ============================================================================
// DELETE /v1/communities/:id/leave — Leave a community
// ============================================================================

const leaveCommunityRoute = createRoute({
  method: "delete",
  path: "/{id}/leave",
  tags: ["Communities"],
  summary: "Leave community",
  description: "Leave a trade community",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    204: { description: "Left community" },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(leaveCommunityRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { error } = await supabase
    .schema("community")
    .from("memberships")
    .delete()
    .eq("community_id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error leaving community:", error);
    return c.json({
      error: "Failed to leave community",
      message: error.message,
    }, 500);
  }

  return c.body(null, 204);
});

// ============================================================================
// GET /v1/communities/:id/members — List community members
// ============================================================================

const listMembersRoute = createRoute({
  method: "get",
  path: "/{id}/members",
  tags: ["Communities"],
  summary: "List members",
  description: "List members of a community",
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: listQuerySchema,
  },
  responses: {
    200: {
      description: "List of members",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(memberSchema),
            total: z.number().int(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(listMembersRoute, async (c) => {
  const supabase = c.get("supabase");
  const { id } = c.req.valid("param");
  const { limit, offset } = c.req.valid("query");

  const { data: memberships, error } = await supabase
    .schema("community")
    .from("memberships")
    .select("id, user_id, joined_at, is_verified")
    .eq("community_id", id)
    .order("joined_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching members:", error);
    return c.json(
      { error: "Failed to fetch members", message: error.message },
      500,
    );
  }

  // Fetch user profiles
  const userIds = (memberships || []).map((m) => m.user_id);
  const { data: users } = userIds.length
    ? await supabase
      .schema("core")
      .from("users")
      .select("id, display_name, avatar_url, headline")
      .in("id", userIds)
    : { data: [] };

  const usersById = new Map((users || []).map((u) => [u.id, u]));

  // Return a flattened CommunityMember shape (id is user_id, fields hoisted from
  // the joined user row) so the SDK type and all consumers line up.
  const data = (memberships || []).map((m) => {
    const u = usersById.get(m.user_id);
    return {
      id: m.user_id,
      display_name: u?.display_name ?? null,
      avatar_url: u?.avatar_url ?? null,
      headline: u?.headline ?? null,
      is_verified: m.is_verified,
      joined_at: m.joined_at,
    };
  });

  const { count } = await supabase
    .schema("community")
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .eq("community_id", id);

  return c.json({ data, total: count || 0 });
});

export default app;
