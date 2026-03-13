/**
 * Community Ratings REST API
 * 5-star peer review with optional sub-dimensions (Quality, Technique, Creativity)
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authMiddleware } from '../middleware/auth.ts'
import { notifyPostRating } from '../../_shared/community-notifications.ts'

const app = new OpenAPIHono()

app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
})

const ratingSchema = z
  .object({
    id: z.string().uuid(),
    post_id: z.string().uuid(),
    rater_id: z.string().uuid(),
    base_rating: z.number().int().min(1).max(5),
    quality_rating: z.number().int().min(1).max(5).nullable(),
    technique_rating: z.number().int().min(1).max(5).nullable(),
    creativity_rating: z.number().int().min(1).max(5).nullable(),
    created_at: z.string(),
    rater: z
      .object({
        id: z.string().uuid(),
        display_name: z.string().nullable(),
        avatar_url: z.string().nullable(),
      })
      .optional(),
  })
  .openapi('PostRating')

const createRatingSchema = z.object({
  base_rating: z.number().int().min(1).max(5),
  quality_rating: z.number().int().min(1).max(5).optional(),
  technique_rating: z.number().int().min(1).max(5).optional(),
  creativity_rating: z.number().int().min(1).max(5).optional(),
})

const ratingSummarySchema = z
  .object({
    rating_avg: z.number().nullable(),
    rating_count: z.number().int(),
    quality_avg: z.number().nullable(),
    technique_avg: z.number().nullable(),
    creativity_avg: z.number().nullable(),
    distribution: z.object({
      '1': z.number().int(),
      '2': z.number().int(),
      '3': z.number().int(),
      '4': z.number().int(),
      '5': z.number().int(),
    }),
  })
  .openapi('RatingSummary')

// ============================================================================
// POST /v1/communities/ratings/:postId — Rate a post
// ============================================================================

const ratePostRoute = createRoute({
  method: 'post',
  path: '/{postId}',
  tags: ['Community Ratings'],
  summary: 'Rate post',
  description: 'Rate a critique or showcase post (5-star + optional sub-dimensions)',
  request: {
    params: z.object({ postId: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: createRatingSchema } },
    },
  },
  responses: {
    201: {
      description: 'Rating submitted',
      content: {
        'application/json': {
          schema: z.object({ data: ratingSchema }),
        },
      },
    },
    400: {
      description: 'Bad request',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(ratePostRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient
  const user = c.get('user') as Record<string, unknown> | null
  const { postId } = c.req.valid('param')
  const body = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Verify post exists and is ratable (critique/showcase, published)
  const { data: post } = await supabase
    .schema('community')
    .from('posts')
    .select('id, post_type, status, author_id')
    .eq('id', postId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!post) {
    return c.json({ error: 'Post not found' }, 404)
  }

  if (post.post_type === 'advice') {
    return c.json({ error: 'Cannot rate advice posts' }, 400)
  }

  if (post.status !== 'published') {
    return c.json({ error: 'Can only rate published posts' }, 400)
  }

  if (post.author_id === user.id) {
    return c.json({ error: 'Cannot rate your own post' }, 400)
  }

  // Check if already rated
  const { data: existing } = await supabase
    .schema('community')
    .from('post_ratings')
    .select('id')
    .eq('post_id', postId)
    .eq('rater_id', user.id)
    .maybeSingle()

  if (existing) {
    // Update existing rating
    const { data: rating, error } = await supabase
      .schema('community')
      .from('post_ratings')
      .update({
        base_rating: body.base_rating,
        quality_rating: body.quality_rating || null,
        technique_rating: body.technique_rating || null,
        creativity_rating: body.creativity_rating || null,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return c.json({ error: 'Failed to update rating', message: error.message }, 500)
    }

    return c.json({ data: rating })
  }

  // Create new rating
  const { data: rating, error } = await supabase
    .schema('community')
    .from('post_ratings')
    .insert({
      post_id: postId,
      rater_id: user.id,
      base_rating: body.base_rating,
      quality_rating: body.quality_rating || null,
      technique_rating: body.technique_rating || null,
      creativity_rating: body.creativity_rating || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating rating:', error)
    return c.json({ error: 'Failed to rate post', message: error.message }, 500)
  }

  // Award reputation to rater
  const isDetailed = body.quality_rating && body.technique_rating && body.creativity_rating
  const raterDelta = isDetailed ? 10 : 3
  const raterAction = isDetailed ? 'rating_given_detailed' : 'rating_given_base'

  await supabase.rpc('update_scaffold_score', {
    p_user_id: user.id,
    p_delta: raterDelta,
    p_action: raterAction,
    p_reason: `Rated a ${post.post_type} post`,
    p_source_type: 'rating',
    p_source_id: rating.id,
  })

  // Award reputation to post author
  await supabase.rpc('update_scaffold_score', {
    p_user_id: post.author_id,
    p_delta: body.base_rating, // Variable: stars received
    p_action: 'rating_received',
    p_reason: `Received ${body.base_rating}-star rating`,
    p_source_type: 'rating',
    p_source_id: rating.id,
  })

  // Notify post author of new rating (fire-and-forget)
  const { data: postDetail } = await supabase
    .schema('community')
    .from('posts')
    .select('title, community_id')
    .eq('id', postId)
    .maybeSingle()

  if (postDetail) {
    const { data: community } = await supabase
      .schema('community')
      .from('communities')
      .select('slug')
      .eq('id', postDetail.community_id)
      .maybeSingle()

    notifyPostRating(
      { supabase },
      {
        postAuthorId: post.author_id,
        raterId: user.id,
        raterName: user.user_metadata?.display_name || 'Someone',
        postId,
        postTitle: postDetail.title,
        communitySlug: community?.slug || '',
        baseRating: body.base_rating,
      }
    ).catch((err: unknown) => console.error('Failed to send rating notification:', err))
  }

  return c.json({ data: rating }, 201)
})

// ============================================================================
// GET /v1/communities/ratings/:postId — List ratings
// ============================================================================

const listRatingsRoute = createRoute({
  method: 'get',
  path: '/{postId}',
  tags: ['Community Ratings'],
  summary: 'List ratings',
  description: 'Get all ratings for a post',
  request: {
    params: z.object({ postId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Ratings list',
      content: {
        'application/json': {
          schema: z.object({ data: z.array(ratingSchema) }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(listRatingsRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient
  const { postId } = c.req.valid('param')

  const { data: ratings, error } = await supabase
    .schema('community')
    .from('post_ratings')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (error) {
    return c.json({ error: 'Failed to fetch ratings', message: error.message }, 500)
  }

  // Enrich with rater info
  const raterIds = [...new Set((ratings || []).map((r: Record<string, unknown>) => r.rater_id))]
  const { data: users } = raterIds.length
    ? await supabase
        .schema('core')
        .from('users')
        .select('id, display_name, avatar_url')
        .in('id', raterIds)
    : { data: [] }

  const usersById = new Map((users || []).map((u: Record<string, unknown>) => [u.id, u]))

  const enriched = (ratings || []).map((r: Record<string, unknown>) => ({
    ...r,
    rater: usersById.get(r.rater_id as string) || {
      id: r.rater_id,
      display_name: null,
      avatar_url: null,
    },
  }))

  return c.json({ data: enriched })
})

// ============================================================================
// GET /v1/communities/ratings/summary/:postId — Rating summary
// ============================================================================

const ratingSummaryRoute = createRoute({
  method: 'get',
  path: '/summary/{postId}',
  tags: ['Community Ratings'],
  summary: 'Rating summary',
  description: 'Get aggregated rating stats for a post',
  request: {
    params: z.object({ postId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Rating summary',
      content: {
        'application/json': {
          schema: z.object({ data: ratingSummarySchema }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(ratingSummaryRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient
  const { postId } = c.req.valid('param')

  const { data: ratings } = await supabase
    .schema('community')
    .from('post_ratings')
    .select('base_rating, quality_rating, technique_rating, creativity_rating')
    .eq('post_id', postId)

  const all = ratings || []
  const count = all.length

  if (count === 0) {
    return c.json({
      data: {
        rating_avg: null,
        rating_count: 0,
        quality_avg: null,
        technique_avg: null,
        creativity_avg: null,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      },
    })
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null)
  const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
  for (const r of all) {
    distribution[String(r.base_rating) as keyof typeof distribution]++
  }

  return c.json({
    data: {
      rating_avg: avg(all.map((r: Record<string, unknown>) => r.base_rating as number)),
      rating_count: count,
      quality_avg: avg(all.filter((r: Record<string, unknown>) => r.quality_rating != null).map((r: Record<string, unknown>) => r.quality_rating as number)),
      technique_avg: avg(
        all.filter((r: Record<string, unknown>) => r.technique_rating != null).map((r: Record<string, unknown>) => r.technique_rating as number)
      ),
      creativity_avg: avg(
        all.filter((r: Record<string, unknown>) => r.creativity_rating != null).map((r: Record<string, unknown>) => r.creativity_rating as number)
      ),
      distribution,
    },
  })
})

export default app
