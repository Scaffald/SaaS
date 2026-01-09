import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { generateApiKey, getKeyPrefix, hashApiKey } from '../_shared/utils/api-key'
import { protectedProcedure, t } from '../middleware'

const router = t.router

// ============================================================================
// Schemas
// ============================================================================

const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100).describe('Human-readable name for the API key'),
  environment: z.enum(['test', 'live']).default('live').describe('API key environment'),
  scopes: z
    .array(
      z.enum([
        'read:jobs',
        'write:jobs',
        'read:applications',
        'write:applications',
        'read:profiles',
        'write:profiles',
        'read:organizations',
        'write:organizations',
      ])
    )
    .min(1)
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
  id: z.string().uuid().describe('API key ID'),
  name: z.string().min(1).max(100).optional().describe('Update the key name'),
  is_active: z.boolean().optional().describe('Activate or deactivate the key'),
  scopes: z
    .array(
      z.enum([
        'read:jobs',
        'write:jobs',
        'read:applications',
        'write:applications',
        'read:profiles',
        'write:profiles',
        'read:organizations',
        'write:organizations',
      ])
    )
    .min(1)
    .optional()
    .describe('Update permission scopes'),
})

const RevokeApiKeySchema = z.object({
  id: z.string().uuid().describe('API key ID to revoke'),
})

const GetUsageSchema = z.object({
  id: z.string().uuid().describe('API key ID'),
  days: z.number().int().min(1).max(90).optional().default(30).describe('Number of days to query'),
})

// ============================================================================
// API Keys Router
// ============================================================================

export const apiKeysRouter = router({
  /**
   * List all API keys for the user's organization
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view API keys',
      })
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
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You must belong to an organization to view API keys',
      })
    }

    // biome-ignore lint/suspicious/noExplicitAny: Supabase query type inference limitation
    const organizationId = (membership.team as any).organization_id

    if (!organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Invalid organization membership',
      })
    }

    // List all API keys for the organization
    const { data: keys, error } = await supabase
      .schema('core')
      .from('api_keys')
      .select(
        'id, name, key_prefix, scopes, rate_limit_tier, is_active, last_used_at, created_at, expires_at'
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to list API keys:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve API keys',
      })
    }

    // Add display prefix with ellipsis
    const keysWithMaskedPrefix = keys.map((key) => ({
      ...key,
      key_prefix: `${key.key_prefix}...`, // Mask the key prefix for display
    }))

    return keysWithMaskedPrefix
  }),

  /**
   * Create a new API key
   * Returns the full key ONCE - user must save it immediately
   */
  create: protectedProcedure.input(CreateApiKeySchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to create API keys',
      })
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
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You must belong to an organization to create API keys',
      })
    }

    // biome-ignore lint/suspicious/noExplicitAny: Supabase query type inference limitation
    const organizationId = (membership.team as any).organization_id

    if (!organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Invalid organization membership',
      })
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
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to create API key: ${insertError.message}`,
      })
    }

    // Return the key (this is the ONLY time the full key will be shown)
    return {
      ...createdKey,
      key: apiKey, // Full API key - user must save this now
    }
  }),

  /**
   * Update an API key (name, scopes, or active status)
   */
  update: protectedProcedure.input(UpdateApiKeySchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to update API keys',
      })
    }

    // Get user's organization and verify admin role
    const { data: profile, error: profileError } = await supabase
      .schema('core')
      .from('team_members')
      .select('organization_id, user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || !profile.organization_id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You must belong to an organization to update API keys',
      })
    }

    // Only org admins can update keys
    if (!['employer', 'organization_admin'].includes(profile.user_type)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only organization admins can update API keys',
      })
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
      .eq('id', input.id)
      .eq('organization_id', profile.organization_id)
      .select(
        'id, name, key_prefix, scopes, rate_limit_tier, is_active, last_used_at, created_at, expires_at'
      )
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found or you do not have permission to update it',
        })
      }

      console.error('Failed to update API key:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update API key',
      })
    }

    return {
      ...updatedKey,
      key_prefix: `${updatedKey.key_prefix}...`,
    }
  }),

  /**
   * Revoke (soft delete) an API key
   */
  revoke: protectedProcedure.input(RevokeApiKeySchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to revoke API keys',
      })
    }

    // Get user's organization and verify admin role
    const { data: profile, error: profileError } = await supabase
      .schema('core')
      .from('team_members')
      .select('organization_id, user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || !profile.organization_id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You must belong to an organization to revoke API keys',
      })
    }

    // Only org admins can revoke keys
    if (!['employer', 'organization_admin'].includes(profile.user_type)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only organization admins can revoke API keys',
      })
    }

    // Soft delete by setting is_active to false
    const { data: revokedKey, error } = await supabase
      .schema('core')
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', input.id)
      .eq('organization_id', profile.organization_id)
      .select('id, name')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found or you do not have permission to revoke it',
        })
      }

      console.error('Failed to revoke API key:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to revoke API key',
      })
    }

    return {
      id: revokedKey.id,
      name: revokedKey.name,
      message: 'API key revoked successfully',
    }
  }),

  /**
   * Get usage statistics for an API key
   */
  getUsage: protectedProcedure.input(GetUsageSchema).query(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view API key usage',
      })
    }

    // Verify access to this key
    const { data: key, error: keyError } = await supabase
      .schema('core')
      .from('api_keys')
      .select('organization_id')
      .eq('id', input.id)
      .single()

    if (keyError || !key) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'API key not found',
      })
    }

    // Check if user has access to this organization
    const { data: profile, error: profileError } = await supabase
      .schema('core')
      .from('team_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.organization_id !== key.organization_id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this API key',
      })
    }

    // Get usage statistics
    const since = new Date()
    since.setDate(since.getDate() - input.days)

    const { data: usage, error } = await supabase
      .schema('core')
      .from('api_key_usage')
      .select('endpoint, method, status_code, response_time_ms, timestamp')
      .eq('api_key_id', input.id)
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Failed to retrieve usage:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve usage statistics',
      })
    }

    // Calculate statistics
    const totalRequests = usage.length
    const successRequests = usage.filter((u) => u.status_code >= 200 && u.status_code < 300).length
    const errorRequests = usage.filter((u) => u.status_code >= 400).length
    const avgResponseTime =
      usage.reduce((sum, u) => sum + (u.response_time_ms || 0), 0) / (totalRequests || 1)

    return {
      total_requests: totalRequests,
      success_requests: successRequests,
      error_requests: errorRequests,
      error_rate: totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) : '0.00',
      avg_response_time_ms: Math.round(avgResponseTime),
      period_days: input.days,
      usage,
    }
  }),
})
