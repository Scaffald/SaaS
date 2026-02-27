/**
 * Account Deletion REST API
 * Handles worker and organization account deletion requests.
 * Migrated from tRPC accountDeletionRouter.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.ts'

const app = new Hono()
app.use('*', requireAuth)

app.post(
  '/worker',
  zValidator(
    'json',
    z.object({
      reason: z.string().optional(),
    })
  ),
  async (c) => {
    const supabaseAdmin = c.get('supabaseAdmin')
    const user = c.get('user')
    if (!supabaseAdmin || !user?.id) return c.json({ error: 'Unauthorized' }, 401)

    const { reason } = c.req.valid('json')

    const { data: deletion, error: deletionError } = await supabaseAdmin
      .schema('core')
      .from('account_deletions')
      .insert({
        deleted_user_id: user.id,
        deletion_type: 'worker',
        requested_by_user_id: user.id,
        reason: reason ?? null,
        status: 'pending',
      })
      .select('id, status, created_at')
      .maybeSingle()

    if (deletionError || !deletion) {
      return c.json(
        {
          error: deletionError
            ? `Failed to create deletion record: ${deletionError.message}`
            : 'Failed to create deletion record',
        },
        500
      )
    }

    return c.json({
      id: (deletion as Record<string, unknown>).id,
      status: (deletion as Record<string, unknown>).status,
      createdAt: (deletion as Record<string, unknown>).created_at,
    })
  }
)

app.post(
  '/organization',
  zValidator(
    'json',
    z.object({
      organizationId: z.string().uuid(),
      reason: z.string().optional(),
    })
  ),
  async (c) => {
    const supabaseAdmin = c.get('supabaseAdmin')
    const user = c.get('user')
    if (!supabaseAdmin || !user?.id) return c.json({ error: 'Unauthorized' }, 401)

    const { organizationId, reason } = c.req.valid('json')

    // Check user has access to this organization
    const { data: roleCheck } = await supabaseAdmin
      .schema('core')
      .from('role_assignments')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'office')
      .maybeSingle()

    if (!roleCheck) {
      const { data: org } = await supabaseAdmin
        .schema('core')
        .from('organizations')
        .select('owner_user_id')
        .eq('id', organizationId)
        .maybeSingle()

      if (!org) return c.json({ error: 'Organization not found' }, 404)

      if (org.owner_user_id !== user.id) {
        const { data: assignment } = await supabaseAdmin
          .schema('core')
          .from('role_assignments')
          .select('scope_org_id')
          .eq('user_id', user.id)
          .eq('scope_org_id', organizationId)
          .maybeSingle()

        if (!assignment) return c.json({ error: 'Forbidden' }, 403)
      }
    }

    const { data: deletion, error: deletionError } = await supabaseAdmin
      .schema('core')
      .from('account_deletions')
      .insert({
        deleted_organization_id: organizationId,
        deletion_type: 'organization',
        requested_by_user_id: user.id,
        reason: reason ?? null,
        status: 'pending',
      })
      .select('id, status, created_at')
      .maybeSingle()

    if (deletionError || !deletion) {
      return c.json(
        {
          error: deletionError
            ? `Failed to create deletion record: ${deletionError.message}`
            : 'Failed to create deletion record',
        },
        500
      )
    }

    return c.json({
      id: (deletion as Record<string, unknown>).id,
      status: (deletion as Record<string, unknown>).status,
      createdAt: (deletion as Record<string, unknown>).created_at,
    })
  }
)

export default app
