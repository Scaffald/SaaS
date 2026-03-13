/**
 * Office Communities REST API (Admin)
 * Verification queue management: list pending, approve, reject
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()

app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
})

const pendingVerificationSchema = z
  .object({
    membership_id: z.string().uuid(),
    community_id: z.string().uuid(),
    community_name: z.string(),
    user_id: z.string().uuid(),
    display_name: z.string().nullable(),
    email: z.string().nullable(),
    verification_data: z.unknown(),
    joined_at: z.string(),
  })
  .openapi('PendingVerification')

// ============================================================================
// Helpers
// ============================================================================

async function requireOfficeRole(supabase: SupabaseClient, userId: string) {
  const { data: user } = await supabase
    .schema('core')
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  return user?.role === 'office' || user?.role === 'admin'
}

// ============================================================================
// GET /v1/office/communities/verification-queue — List pending verifications
// ============================================================================

const verificationQueueRoute = createRoute({
  method: 'get',
  path: '/verification-queue',
  tags: ['Office Communities'],
  summary: 'Verification queue',
  description: 'List all pending community verification requests (office role required)',
  request: {
    query: z.object({
      community_id: z.string().uuid().optional(),
      limit: z.coerce.number().int().positive().max(100).optional().default(50),
      offset: z.coerce.number().int().nonnegative().optional().default(0),
    }),
  },
  responses: {
    200: {
      description: 'Pending verifications',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(pendingVerificationSchema),
            total: z.number().int(),
          }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(verificationQueueRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient
  const user = c.get('user') as Record<string, unknown> | null
  const { community_id, limit, offset } = c.req.valid('query')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const isOffice = await requireOfficeRole(supabase, user.id)
  if (!isOffice) {
    return c.json({ error: 'Office role required' }, 403)
  }

  // Get memberships with pending verification
  let query = supabase
    .schema('community')
    .from('memberships')
    .select('id, community_id, user_id, verification_data, joined_at')
    .eq('is_verified', false)
    .not('verification_data', 'is', null)
    .order('joined_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (community_id) {
    query = query.eq('community_id', community_id)
  }

  const { data: memberships, error } = await query

  if (error) {
    return c.json({ error: 'Failed to fetch queue', message: error.message }, 500)
  }

  if (!memberships || memberships.length === 0) {
    return c.json({ data: [], total: 0 })
  }

  // Enrich with community names and user info
  const communityIds = [...new Set(memberships.map((m: Record<string, unknown>) => m.community_id))]
  const userIds = [...new Set(memberships.map((m: Record<string, unknown>) => m.user_id))]

  const [{ data: communities }, { data: users }] = await Promise.all([
    supabase
      .schema('community')
      .from('communities')
      .select('id, name')
      .in('id', communityIds),
    supabase
      .schema('core')
      .from('users')
      .select('id, display_name, email')
      .in('id', userIds),
  ])

  const communityMap = new Map((communities || []).map((comm: Record<string, unknown>) => [comm.id, comm.name]))
  const userMap = new Map((users || []).map((u: Record<string, unknown>) => [u.id, u]))

  const enriched = memberships.map((m: Record<string, unknown>) => {
    const u = (userMap.get(m.user_id) || {}) as Record<string, unknown>
    return {
      membership_id: m.id,
      community_id: m.community_id,
      community_name: communityMap.get(m.community_id) || 'Unknown',
      user_id: m.user_id,
      display_name: u.display_name || null,
      email: u.email || null,
      verification_data: m.verification_data,
      joined_at: m.joined_at,
    }
  })

  // Get total count
  let countQuery = supabase
    .schema('community')
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', false)
    .not('verification_data', 'is', null)

  if (community_id) {
    countQuery = countQuery.eq('community_id', community_id)
  }

  const { count } = await countQuery

  return c.json({ data: enriched, total: count || 0 })
})

// ============================================================================
// PATCH /v1/office/communities/verify/:membershipId — Approve verification
// ============================================================================

const approveVerificationRoute = createRoute({
  method: 'patch',
  path: '/verify/{membershipId}',
  tags: ['Office Communities'],
  summary: 'Approve verification',
  description: 'Approve a community verification request (office role required)',
  request: {
    params: z.object({ membershipId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Verification approved',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean(), message: z.string() }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(approveVerificationRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient
  const user = c.get('user') as Record<string, unknown> | null
  const { membershipId } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const isOffice = await requireOfficeRole(supabase, user.id)
  if (!isOffice) {
    return c.json({ error: 'Office role required' }, 403)
  }

  // Get membership
  const { data: membership } = await supabase
    .schema('community')
    .from('memberships')
    .select('id, user_id, verification_data')
    .eq('id', membershipId)
    .maybeSingle()

  if (!membership) {
    return c.json({ error: 'Membership not found' }, 404)
  }

  // Approve
  const { error } = await supabase
    .schema('community')
    .from('memberships')
    .update({
      is_verified: true,
      verification_data: {
        ...membership.verification_data,
        status: 'approved',
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      },
    })
    .eq('id', membershipId)

  if (error) {
    return c.json({ error: 'Failed to approve', message: error.message }, 500)
  }

  // Award reputation for getting verified
  await supabase.rpc('update_scaffold_score', {
    p_user_id: membership.user_id,
    p_delta: 10,
    p_action: 'community_verified',
    p_reason: 'Community license verification approved',
    p_source_type: 'verification',
    p_source_id: membershipId,
  })

  return c.json({ success: true, message: 'Verification approved' })
})

// ============================================================================
// PATCH /v1/office/communities/reject/:membershipId — Reject verification
// ============================================================================

const rejectVerificationRoute = createRoute({
  method: 'patch',
  path: '/reject/{membershipId}',
  tags: ['Office Communities'],
  summary: 'Reject verification',
  description: 'Reject a community verification request (office role required)',
  request: {
    params: z.object({ membershipId: z.string().uuid() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            reason: z.string().max(500).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Verification rejected',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean(), message: z.string() }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(rejectVerificationRoute, async (c) => {
  const supabase = c.get('supabase') as SupabaseClient
  const user = c.get('user') as Record<string, unknown> | null
  const { membershipId } = c.req.valid('param')
  const { reason } = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const isOffice = await requireOfficeRole(supabase, user.id)
  if (!isOffice) {
    return c.json({ error: 'Office role required' }, 403)
  }

  const { data: membership } = await supabase
    .schema('community')
    .from('memberships')
    .select('id, verification_data')
    .eq('id', membershipId)
    .maybeSingle()

  if (!membership) {
    return c.json({ error: 'Membership not found' }, 404)
  }

  const { error } = await supabase
    .schema('community')
    .from('memberships')
    .update({
      verification_data: {
        ...membership.verification_data,
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
        rejection_reason: reason || null,
      },
    })
    .eq('id', membershipId)

  if (error) {
    return c.json({ error: 'Failed to reject', message: error.message }, 500)
  }

  return c.json({ success: true, message: 'Verification rejected' })
})

export default app
