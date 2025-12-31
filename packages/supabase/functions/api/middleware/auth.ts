import { createClient } from '@supabase/supabase-js'
import type { Context, Next } from 'hono'
import { hashApiKey, validateApiKeyFormat } from '../_shared/utils/api-key.ts'

/**
 * Authentication middleware - verifies JWT tokens OR API keys and adds context
 *
 * This middleware supports two authentication methods:
 * 1. JWT tokens (Bearer {jwt}) - for user authentication via Supabase Auth
 * 2. API keys (Bearer sk_live_xxx or Bearer sk_test_xxx) - for third-party SDK access
 *
 * For JWT tokens:
 * - Creates a Supabase client with RLS (Row Level Security) enabled
 * - Verifies the token and adds user to context
 * - Shares the same auth logic as tRPC context.ts
 *
 * For API keys:
 * - Validates key format and checks database
 * - Adds organization context (not user context)
 * - Updates last_used_at timestamp
 * - Enforces rate limits by tier
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')?.trim()

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  // Check if this is an API key (starts with sk_)
  const isApiKey = token?.startsWith('sk_')

  if (isApiKey && token) {
    // ============================================================================
    // API Key Authentication
    // ============================================================================

    // Validate format
    if (!validateApiKeyFormat(token)) {
      return c.json(
        {
          error: 'Invalid API Key',
          message: 'API key format is invalid. Expected format: sk_{test|live}_{32_chars}',
        },
        401
      )
    }

    // Hash the API key to look it up in database
    const keyHash = await hashApiKey(token)

    // Use service role client to bypass RLS for API key lookup
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Look up API key
    const { data: apiKeyData, error: keyError } = await serviceClient
      .schema('core')
      .from('api_keys')
      .select(
        `
        id,
        organization_id,
        name,
        key_prefix,
        scopes,
        rate_limit_tier,
        is_active,
        expires_at,
        organizations:organization_id (
          id,
          name,
          slug
        )
      `
      )
      .eq('key_hash', keyHash)
      .single()

    if (keyError || !apiKeyData) {
      return c.json(
        {
          error: 'Invalid API Key',
          message: 'API key not found or has been revoked',
        },
        401
      )
    }

    // Check if key is active
    if (!apiKeyData.is_active) {
      return c.json(
        {
          error: 'API Key Revoked',
          message: 'This API key has been revoked',
        },
        401
      )
    }

    // Check if key is expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return c.json(
        {
          error: 'API Key Expired',
          message: 'This API key has expired',
        },
        401
      )
    }

    // Update last_used_at timestamp (fire and forget)
    serviceClient
      .schema('core')
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyData.id)
      .then(() => {
        // Success - no action needed
      })
      .catch((error) => {
        console.error('Failed to update API key last_used_at:', error)
      })

    // Create a regular Supabase client (with anon key)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Add to Hono context
    c.set('supabase', supabase)
    c.set('authType', 'api_key')
    c.set('apiKey', {
      id: apiKeyData.id,
      organizationId: apiKeyData.organization_id,
      name: apiKeyData.name,
      scopes: apiKeyData.scopes || [],
      rateLimitTier: apiKeyData.rate_limit_tier,
    })
    c.set('organization', apiKeyData.organizations)
    c.set('user', undefined) // API keys don't have user context

    await next()
    return
  }

  // ============================================================================
  // JWT Token Authentication (existing logic)
  // ============================================================================

  // Detect if using anon key vs actual user token
  const isAnonKey = token === supabaseAnonKey

  // Create Supabase client with RLS enforcement
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token && !isAnonKey ? { Authorization: `Bearer ${token}` } : {},
    },
  })

  // Verify token and get user
  let user = null
  let userEmail = null

  if (token && !isAnonKey) {
    const {
      data: { user: verifiedUser },
      error,
    } = await supabase.auth.getUser(token)
    if (!error && verifiedUser) {
      user = verifiedUser
      userEmail = verifiedUser.email
    }
  }

  // Add to Hono context (matches tRPC context structure)
  c.set('supabase', supabase)
  c.set('authType', 'jwt')
  c.set('user', user ? { id: user.id, email: userEmail } : undefined)
  c.set('userToken', token)

  await next()
}

/**
 * Require authentication - throws 401 if no authenticated user OR API key
 */
export async function requireAuth(c: Context, next: Next) {
  const user = c.get('user')
  const apiKey = c.get('apiKey')

  // Accept either user (JWT) or API key authentication
  if (!user && !apiKey) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Authentication required. Please provide a valid Bearer token or API key.',
      },
      401
    )
  }

  await next()
}

/**
 * Require specific role - throws 403 if user doesn't have required role
 */
export async function requireRole(roleName: string, scope?: string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    const supabase = c.get('supabase')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Check role assignments
    const { data: assignments, error } = await supabase
      .schema('core')
      .from('role_assignments')
      .select('role:roles(name, scope)')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error checking role:', error)
      return c.json({ error: 'Failed to verify permissions' }, 500)
    }

    // Verify user has required role
    const hasRole = assignments?.some((assignment: { role?: { name?: string; scope?: string } | null }) => {
      const role = assignment.role
      return role?.name === roleName && (!scope || role?.scope === scope)
    })

    if (!hasRole) {
      return c.json(
        {
          error: 'Forbidden',
          message: `Requires ${roleName} role${scope ? ` with ${scope} scope` : ''}`,
        },
        403
      )
    }

    await next()
  }
}
