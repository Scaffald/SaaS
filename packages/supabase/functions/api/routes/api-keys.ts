/**
 * API Keys Management Routes
 * Handles creation, listing, and revocation of API keys for third-party access
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { generateApiKey, getKeyPrefix, hashApiKey } from '../../_shared/utils/api-key.ts'
import { requireAuth } from '../middleware/auth.ts'

const app = new Hono()

// ============================================================================
// Schemas
// ============================================================================

const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100).describe('Human-readable name for the API key'),
  environment: z.enum(['test', 'live']).default('live').describe('API key environment'),
  scopes: z
    .array(z.enum(['read:jobs', 'write:jobs', 'read:applications', 'write:applications', 'read:profiles']))
    .optional()
    .default(['read:jobs', 'read:applications'])
    .describe('Permission scopes for this API key'),
  expires_at: z
    .string()
    .datetime()
    .optional()
    .describe('Optional expiration date (ISO 8601 format)'),
  rate_limit_tier: z
    .enum(['free', 'pro', 'enterprise'])
    .optional()
    .default('free')
    .describe('Rate limit tier'),
})

const UpdateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional().describe('Update the key name'),
  is_active: z.boolean().optional().describe('Activate or deactivate the key'),
  scopes: z
    .array(z.enum(['read:jobs', 'write:jobs', 'read:applications', 'write:applications', 'read:profiles', 'write:profiles', 'read:organizations', 'write:organizations']))
    .min(1)
    .optional()
    .describe('Update permission scopes'),
})

// ============================================================================
// POST /v1/api-keys - Create new API key
// ============================================================================

app.post('/', requireAuth, async (c) => {
  try {
    const body = await c.req.json()
    const input = CreateApiKeySchema.parse(body)

    const user = c.get('user')
    const supabase = c.get('supabase')

    // API keys can only be created by authenticated users (not by other API keys)
    if (!user) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'API keys cannot be created using another API key. Please authenticate as a user.',
        },
        403
      )
    }

    // Get user's organization through team membership
    const { data: membership, error: membershipError } = await supabase
      .schema('core')
      .from('team_members')
      .select('team:teams(organization_id)')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (membershipError || !membership || !membership.team) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'You must belong to an organization to create API keys',
        },
        403
      )
    }

    // biome-ignore lint/suspicious/noExplicitAny: Supabase query type inference limitation
    const organizationId = (membership.team as any).organization_id

    if (!organizationId) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'Invalid organization membership',
        },
        403
      )
    }

    // Generate the API key
    const apiKey = generateApiKey(input.environment)
    const keyHash = await hashApiKey(apiKey)
    const keyPrefix = getKeyPrefix(apiKey)

    // Insert into database
    const { data: createdKey, error: insertError } = await supabase
      .schema('core')
      .from('api_keys')
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        name: input.name,
        key_hash: keyHash,
        key_prefix: keyPrefix.replace('...', ''), // Store without the '...'
        scopes: input.scopes,
        rate_limit_tier: input.rate_limit_tier,
        expires_at: input.expires_at || null,
      })
      .select('id, name, key_prefix, scopes, rate_limit_tier, created_at, expires_at')
      .single()

    if (insertError) {
      console.error('Failed to create API key:', insertError)
      return c.json(
        {
          error: 'Internal Server Error',
          message: 'Failed to create API key',
          details: insertError.message,
        },
        500
      )
    }

    // Return the key (this is the ONLY time the full key will be shown)
    return c.json(
      {
        data: {
          ...createdKey,
          key: apiKey, // Full API key - user must save this now
        },
        warning: 'Save this API key now. It will not be shown again.',
      },
      201
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Validation Error',
          message: 'Invalid request body',
          details: error.errors,
        },
        400
      )
    }

    console.error('Error creating API key:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

// ============================================================================
// GET /v1/api-keys - List organization's API keys
// ============================================================================

app.get('/', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    const apiKey = c.get('apiKey')
    const supabase = c.get('supabase')

    let organizationId: string

    if (apiKey) {
      // API key authentication - use the key's organization
      organizationId = apiKey.organizationId
    } else if (user) {
      // User authentication - get user's organization
      const { data: membership } = await supabase
        .schema('core')
        .from('team_members')
        .select('team:teams(organization_id)')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!membership?.team) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must belong to an organization to view API keys',
          },
          403
        )
      }

      // biome-ignore lint/suspicious/noExplicitAny: Supabase query type inference limitation
      organizationId = (membership.team as any).organization_id
    } else {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // List all API keys for the organization
    const { data: keys, error } = await supabase
      .schema('core')
      .from('api_keys')
      .select('id, name, key_prefix, scopes, rate_limit_tier, is_active, last_used_at, created_at, expires_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to list API keys:', error)
      return c.json(
        {
          error: 'Internal Server Error',
          message: 'Failed to retrieve API keys',
        },
        500
      )
    }

    // Add display prefix with ellipsis
    const keysWithMaskedPrefix = keys.map((key) => ({
      ...key,
      key_prefix: `${key.key_prefix}...`, // Mask the key prefix for display
    }))

    return c.json({ data: keysWithMaskedPrefix })
  } catch (error) {
    console.error('Error listing API keys:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

// ============================================================================
// GET /v1/api-keys/:id - Get specific API key details
// ============================================================================

app.get('/:id', requireAuth, async (c) => {
  try {
    const keyId = c.param('id')
    const user = c.get('user')
    const apiKey = c.get('apiKey')
    const supabase = c.get('supabase')

    // Get the API key
    const { data: key, error } = await supabase
      .schema('core')
      .from('api_keys')
      .select('*, organization:organizations(id, name, slug)')
      .eq('id', keyId)
      .single()

    if (error || !key) {
      return c.json(
        {
          error: 'Not Found',
          message: 'API key not found',
        },
        404
      )
    }

    // Verify access (must be same organization)
    let hasAccess = false

    if (apiKey && apiKey.organizationId === key.organization_id) {
      hasAccess = true
    } else if (user) {
      const { data: profile } = await supabase
        .schema('core')
        .from('team_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (profile && profile.organization_id === key.organization_id) {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'You do not have access to this API key',
        },
        403
      )
    }

    // Mask the key prefix
    const maskedKey = {
      ...key,
      key_hash: undefined, // Don't expose the hash
      key_prefix: `${key.key_prefix}...`,
    }

    return c.json({ data: maskedKey })
  } catch (error) {
    console.error('Error retrieving API key:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

// ============================================================================
// PATCH /v1/api-keys/:id - Update API key (rename or revoke)
// ============================================================================

app.patch('/:id', requireAuth, async (c) => {
  try {
    const keyId = c.param('id')
    const body = await c.req.json()
    const input = UpdateApiKeySchema.parse(body)

    const user = c.get('user')
    const supabase = c.get('supabase')

    // Only users (not API keys) can update keys
    if (!user) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'API keys cannot be updated using another API key',
        },
        403
      )
    }

    // Get user's organization
    const { data: profile } = await supabase
      .schema('core')
      .from('team_members')
      .select('organization_id, user_type')
      .eq('user_id', user.id)
      .single()

    if (!profile?.organization_id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // Only org admins can update keys
    if (!['employer', 'organization_admin'].includes(profile.user_type)) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'Only organization admins can update API keys',
        },
        403
      )
    }

    // Update the key
    const { data: updatedKey, error } = await supabase
      .schema('core')
      .from('api_keys')
      .update({
        name: input.name,
        is_active: input.is_active,
        scopes: input.scopes,
      })
      .eq('id', keyId)
      .eq('organization_id', profile.organization_id)
      .select('id, name, key_prefix, scopes, rate_limit_tier, is_active, last_used_at, created_at, expires_at')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json(
          {
            error: 'Not Found',
            message: 'API key not found or you do not have permission to update it',
          },
          404
        )
      }

      console.error('Failed to update API key:', error)
      return c.json({ error: 'Internal Server Error' }, 500)
    }

    return c.json({
      data: {
        ...updatedKey,
        key_prefix: `${updatedKey.key_prefix}...`,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Validation Error',
          details: error.errors,
        },
        400
      )
    }

    console.error('Error updating API key:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

// ============================================================================
// DELETE /v1/api-keys/:id - Delete (revoke) API key
// ============================================================================

app.delete('/:id', requireAuth, async (c) => {
  try {
    const keyId = c.param('id')
    const user = c.get('user')
    const supabase = c.get('supabase')

    // Only users (not API keys) can delete keys
    if (!user) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'API keys cannot be deleted using another API key',
        },
        403
      )
    }

    // Get user's organization
    const { data: profile } = await supabase
      .schema('core')
      .from('team_members')
      .select('organization_id, user_type')
      .eq('user_id', user.id)
      .single()

    if (!profile?.organization_id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // Only org admins can delete keys
    if (!['employer', 'organization_admin'].includes(profile.user_type)) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'Only organization admins can delete API keys',
        },
        403
      )
    }

    // Soft delete by setting is_active to false
    const { data: deletedKey, error } = await supabase
      .schema('core')
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('organization_id', profile.organization_id)
      .select('id, name')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json(
          {
            error: 'Not Found',
            message: 'API key not found or you do not have permission to delete it',
          },
          404
        )
      }

      console.error('Failed to delete API key:', error)
      return c.json({ error: 'Internal Server Error' }, 500)
    }

    return c.json({
      data: {
        id: deletedKey.id,
        name: deletedKey.name,
        message: 'API key revoked successfully',
      },
    })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

// ============================================================================
// GET /v1/api-keys/:id/usage - Get usage statistics for an API key
// ============================================================================

app.get('/:id/usage', requireAuth, async (c) => {
  try {
    const keyId = c.param('id')
    const days = Number.parseInt(c.req.query('days') || '30', 10)
    const user = c.get('user')
    const apiKey = c.get('apiKey')
    const supabase = c.get('supabase')

    // Verify access to this key
    const { data: key } = await supabase
      .schema('core')
      .from('api_keys')
      .select('organization_id')
      .eq('id', keyId)
      .single()

    if (!key) {
      return c.json({ error: 'Not Found', message: 'API key not found' }, 404)
    }

    // Check access
    let hasAccess = false
    if (apiKey && apiKey.organizationId === key.organization_id) {
      hasAccess = true
    } else if (user) {
      const { data: profile } = await supabase
        .schema('core')
        .from('team_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (profile && profile.organization_id === key.organization_id) {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // Get usage statistics
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: usage, error } = await supabase
      .schema('core')
      .from('api_key_usage')
      .select('endpoint, method, status_code, response_time_ms, timestamp')
      .eq('api_key_id', keyId)
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Failed to retrieve usage:', error)
      return c.json({ error: 'Internal Server Error' }, 500)
    }

    // Calculate statistics
    const totalRequests = usage.length
    const successRequests = usage.filter((u) => u.status_code >= 200 && u.status_code < 300).length
    const errorRequests = usage.filter((u) => u.status_code >= 400).length
    const avgResponseTime =
      usage.reduce((sum, u) => sum + (u.response_time_ms || 0), 0) / (totalRequests || 1)

    return c.json({
      data: {
        total_requests: totalRequests,
        success_requests: successRequests,
        error_requests: errorRequests,
        error_rate: totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) : '0.00',
        avg_response_time_ms: Math.round(avgResponseTime),
        period_days: days,
        usage,
      },
    })
  } catch (error) {
    console.error('Error retrieving usage:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

export default app
