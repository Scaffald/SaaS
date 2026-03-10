/**
 * Follows REST API
 * Manages user follows (follow other users, organizations, jobs)
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()

app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi('ErrorResponse')

const followerSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  avatar_url: z.string().url().nullable(),
})

const followeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  avatar_url: z.string().url().nullable(),
})

const followSchema = z
  .object({
    id: z.string().uuid(),
    follower_id: z.string().uuid(),
    follower_type: z.literal('user'),
    followee_id: z.string().uuid(),
    followee_type: z.enum(['user', 'organization', 'job']),
    created_at: z.string(),
    follower: followerSchema.optional(),
    followee: followeeSchema.optional(),
  })
  .openapi('Follow')

// Request schemas
const followUserSchema = z.object({
  targetUserId: z.string().uuid(),
})

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
})

// Response schemas
const followsListResponseSchema = z
  .object({
    data: z.array(followSchema),
    total: z.number().int(),
  })
  .openapi('FollowsListResponse')

const followStatusResponseSchema = z
  .object({
    isFollowing: z.boolean(),
    followId: z.string().uuid().optional(),
  })
  .openapi('FollowStatusResponse')

const followResponseSchema = z
  .object({
    data: followSchema,
  })
  .openapi('FollowResponse')

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/follows/following
 * Get users/entities that the current user is following
 */
const getFollowingRoute = createRoute({
  method: 'get',
  path: '/following',
  tags: ['Follows'],
  summary: 'Get following list',
  description: 'Get users and entities that the authenticated user is following',
  request: {
    query: listQuerySchema,
  },
  responses: {
    200: {
      description: 'List of follows',
      content: {
        'application/json': {
          schema: followsListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getFollowingRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { limit, offset } = c.req.valid('query')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: follows, error } = await supabase
    .schema('core')
    .from('follows')
    .select(`
      id,
      follower_id,
      follower_type,
      followee_id,
      followee_type,
      created_at
    `)
    .eq('follower_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching following:', error)
    return c.json({ error: 'Failed to fetch following', message: error.message }, 500)
  }

  const { count } = await supabase
    .schema('core')
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', user.id)

  return c.json({
    data: follows || [],
    total: count || 0,
  })
})

/**
 * GET /v1/follows/followers
 * Get users following the current user
 */
const getFollowersRoute = createRoute({
  method: 'get',
  path: '/followers',
  tags: ['Follows'],
  summary: 'Get followers list',
  description: 'Get users following the authenticated user',
  request: {
    query: listQuerySchema,
  },
  responses: {
    200: {
      description: 'List of followers',
      content: {
        'application/json': {
          schema: followsListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getFollowersRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { limit, offset } = c.req.valid('query')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: follows, error } = await supabase
    .schema('core')
    .from('follows')
    .select(`
      id,
      follower_id,
      follower_type,
      followee_id,
      followee_type,
      created_at
    `)
    .eq('followee_id', user.id)
    .eq('followee_type', 'user')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching followers:', error)
    return c.json({ error: 'Failed to fetch followers', message: error.message }, 500)
  }

  // follows has no FK to user_profiles; fetch user display data from core.users
  const withFollower = await (async () => {
    if (!follows || follows.length === 0) return follows || []
    const followerIds = [...new Set((follows as { follower_id: string }[]).map((f) => f.follower_id))]
    const { data: users } = await supabase
      .schema('core')
      .from('users')
      .select('id, display_name, avatar_url')
      .in('id', followerIds)
    const byId = new Map((users || []).map((u) => [u.id, u]))
    return (follows as Record<string, unknown>[]).map((row) => {
      const u = byId.get(row.follower_id as string)
      const displayName = (u?.display_name ?? '').trim() || 'Unknown'
      const [first_name, ...rest] = displayName.split(/\s+/)
      const last_name = rest.join(' ') || ''
      return {
        ...row,
        follower: u
          ? { id: u.id, first_name, last_name, avatar_url: u.avatar_url ?? null }
          : { id: row.follower_id, first_name: 'Unknown', last_name: '', avatar_url: null },
      }
    })
  })()

  const { count } = await supabase
    .schema('core')
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('followee_id', user.id)
    .eq('followee_type', 'user')

  return c.json({
    data: withFollower,
    total: count || 0,
  })
})

/**
 * GET /v1/follows/status/:userId
 * Check if current user is following another user
 */
const getFollowStatusRoute = createRoute({
  method: 'get',
  path: '/status/{userId}',
  tags: ['Follows'],
  summary: 'Get follow status',
  description: 'Check if the authenticated user is following another user',
  request: {
    params: z.object({
      userId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Follow status',
      content: {
        'application/json': {
          schema: followStatusResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getFollowStatusRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { userId } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: follow } = await supabase
    .schema('core')
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('followee_id', userId)
    .eq('followee_type', 'user')
    .maybeSingle()

  return c.json({
    isFollowing: !!follow,
    followId: follow?.id,
  })
})

/**
 * POST /v1/follows/user
 * Follow a user
 */
const followUserRoute = createRoute({
  method: 'post',
  path: '/user',
  tags: ['Follows'],
  summary: 'Follow user',
  description: 'Follow another user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: followUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User followed successfully',
      content: {
        'application/json': {
          schema: followResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(followUserRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { targetUserId } = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (targetUserId === user.id) {
    return c.json({ error: 'Cannot follow yourself' }, 400)
  }

  // Check if already following
  const { data: existing } = await supabase
    .schema('core')
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('followee_id', targetUserId)
    .eq('followee_type', 'user')
    .maybeSingle()

  if (existing) {
    return c.json({ error: 'Already following this user' }, 400)
  }

  // Create follow
  const { data: follow, error } = await supabase
    .schema('core')
    .from('follows')
    .insert({
      follower_id: user.id,
      follower_type: 'user',
      followee_id: targetUserId,
      followee_type: 'user',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating follow:', error)
    return c.json({ error: 'Failed to follow user', message: error.message }, 500)
  }

  return c.json({ data: follow }, 201)
})

/**
 * DELETE /v1/follows/user/:userId
 * Unfollow a user
 */
const unfollowUserRoute = createRoute({
  method: 'delete',
  path: '/user/{userId}',
  tags: ['Follows'],
  summary: 'Unfollow user',
  description: 'Unfollow a user',
  request: {
    params: z.object({
      userId: z.string().uuid(),
    }),
  },
  responses: {
    204: {
      description: 'User unfollowed successfully',
    },
    404: {
      description: 'Follow not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(unfollowUserRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { userId } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { error } = await supabase
    .schema('core')
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('followee_id', userId)
    .eq('followee_type', 'user')

  if (error) {
    console.error('Error unfollowing user:', error)
    return c.json({ error: 'Failed to unfollow user', message: error.message }, 500)
  }

  return c.body(null, 204)
})

export default app
