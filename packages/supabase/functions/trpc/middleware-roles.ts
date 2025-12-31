import { createClient } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import type { Database } from '../_shared/database.types.ts'
import { supabaseServiceKey, supabaseUrl } from './context.ts'
import type { Context } from './context.ts'
import { t } from './middleware.ts'

/**
 * Check if user has a specific role with optional scope
 * Returns true if user has the role, false otherwise
 */
async function hasRole(
  supabase: Context['supabase'],
  userId: string,
  roleName: string,
  scope?: string
): Promise<boolean> {
  const query = supabase
    .schema('core')
    .from('role_assignments')
    .select('role:roles(name, scope)')
    .eq('user_id', userId)
    .limit(1)

  const { data, error } = await query

  if (error) {
    console.error('[middleware-roles] Error checking role:', error.message)
    return false
  }

  if (!data || data.length === 0) {
    return false
  }

  const assignment = data[0]
  const role = assignment.role as { name: string; scope: string } | null

  if (!role) {
    return false
  }

  const nameMatches = role.name === roleName
  const scopeMatches = scope === undefined || role.scope === scope

  return nameMatches && scopeMatches
}

/**
 * Create service client if user has required role
 * Logs usage for security audit
 */
export function createServiceClientIfAuthorized(
  ctx: Context,
  requiredRole: string,
  scope?: string
): ReturnType<typeof createClient<Database>> {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
  }

  // Note: This is a synchronous function that creates the client
  // The actual role check should be done in middleware before calling this
  // This function is for creating the client after role verification
  const serviceClient = createClient<Database>(supabaseUrl, supabaseServiceKey)

  // Log service client usage for security audit
  console.log('[middleware-roles] Service client created', {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    requiredRole,
    scope,
    timestamp: new Date().toISOString(),
  })

  return serviceClient
}

/**
 * Middleware to enforce a specific role
 * Checks if user has the required role before proceeding
 * Adds supabaseAdmin to context only if role is verified
 */
export function enforceRole(roleName: string, scope?: string) {
  return t.middleware(async ({ ctx, next, path }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      })
    }

    const userHasRole = await hasRole(ctx.supabase, ctx.user.id, roleName, scope)

    if (!userHasRole) {
      console.warn('[middleware-roles] Access denied', {
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        requiredRole: roleName,
        scope,
        path,
      })
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied: ${roleName} role required${scope ? ` with ${scope} scope` : ''}`,
      })
    }

    // Create service client only after role verification
    const supabaseAdmin = createServiceClientIfAuthorized(ctx, roleName, scope)

    return next({
      ctx: {
        ...ctx,
        supabaseAdmin, // Only available after role verification
      },
    })
  })
}

/**
 * Helper to get service client for office operations
 * This is a convenience wrapper around enforceRole('office', 'platform')
 */
export const enforceOfficeRole = enforceRole('office', 'platform')
