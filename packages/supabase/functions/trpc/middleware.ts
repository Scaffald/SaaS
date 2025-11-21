import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './context.ts'

// Initialize tRPC with context type
export const t = initTRPC.context<Context>().create()

const requestLoggingMiddleware = t.middleware(async ({ next, path, type }) => {
  const start = performance.now()
  console.log(
    '[trpc] request:start',
    JSON.stringify({
      path,
      type,
      timestamp: new Date().toISOString(),
    })
  )

  try {
    const result = await next()
    console.log(
      '[trpc] request:success',
      JSON.stringify({
        path,
        type,
        durationMs: Math.round(performance.now() - start),
      })
    )
    return result
  } catch (error) {
    console.error(
      '[trpc] request:error',
      JSON.stringify({
        path,
        type,
        durationMs: Math.round(performance.now() - start),
        message: error instanceof Error ? error.message : String(error),
      })
    )
    throw error
  }
})

const errorHandlingMiddleware = t.middleware(async ({ next, path, ctx, input }) => {
  try {
    return await next()
  } catch (error) {
    console.error('[trpc] unhandled error', {
      procedure: path,
      input,
      userId: ctx.user?.id,
      userEmail: ctx.user?.email,
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})

/**
 * Middleware to enforce user authentication
 * Ensures user is logged in before accessing protected procedures
 */
export const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      user: { id: ctx.user.id, email: ctx.user.email },
      userToken: ctx.userToken,
      supabase: ctx.supabase,
    },
  })
})

/**
 * Middleware to enforce office role
 * Checks if user has office role before proceeding
 * Adds supabaseAdmin to context only after role verification
 */
export const enforceOfficeRole = t.middleware(async ({ ctx, next, path }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Query role_assignments directly to check for office role
  // This avoids RPC schema resolution issues with functions in custom schemas
  const { data, error } = await ctx.supabase
    .schema('core')
    .from('role_assignments')
    .select('role:roles(name, scope)')
    .eq('user_id', ctx.user.id)

  if (error) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Office access required',
    })
  }

  // Check if user has office role with platform scope
  const hasOfficeRole = data?.some(
    (assignment: { role?: { name?: string; scope?: string } | null; [key: string]: unknown }) => {
      const role = assignment.role as { name: string; scope: string } | null
      return role?.name === 'office' && role?.scope === 'platform'
    }
  )

  if (!hasOfficeRole) {
    console.warn('[middleware] Office access denied', {
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      path,
    })
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Office access required',
    })
  }

  // Create service client only after role verification
  const { createClient } = await import('@supabase/supabase-js')
  const { supabaseServiceKey, supabaseUrl } = await import('./context.ts')
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Log service client usage for security audit
  console.log('[middleware] Service client created for office role', {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    path,
    timestamp: new Date().toISOString(),
  })

  return next({
    ctx: {
      ...ctx,
      supabaseAdmin, // Only available after role verification
    },
  })
})

const baseProcedure = t.procedure.use(requestLoggingMiddleware).use(errorHandlingMiddleware)

/**
 * Base procedure - no authentication required
 */
export const publicProcedure = baseProcedure

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = baseProcedure.use(enforceUserIsAuthed)

/**
 * Office procedure - requires office role
 */
export const officeProcedure = baseProcedure.use(enforceOfficeRole)
