/**
 * tRPC Server Configuration
 * REQ-286: Create tRPC Router Structure for Forsured
 * REQ-292: Configure tRPC for production deployment
 * TASK-1: Create Base tRPC Router Configuration
 * TASK-4: Configure environment-based error handling
 *
 * This module initializes tRPC with:
 * - Context creation with Supabase session and database access
 * - Public procedure builder for unauthenticated endpoints
 * - Protected procedure builder with authentication middleware
 * - Environment-based error formatting (dev vs production)
 */

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';
import { formatError } from './middleware/errorFormatter';
import { checkRateLimit } from './middleware/rateLimit';

// Re-export Context type for convenience
export type { Context };

/**
 * Initialize tRPC with context type and configuration
 */
const t = initTRPC.context<Context>().create({
  /**
   * SuperJSON transformer for handling Date, Map, Set, etc.
   * Ensures data types are preserved across client-server boundary
   */
  transformer: superjson,

  /**
   * Error formatter for environment-aware error handling
   * - Development: Full error details with stack traces
   * - Production: Sanitized errors without sensitive information
   */
  errorFormatter: formatError,
});

/**
 * Export reusable router and procedure helpers
 */

/**
 * Router creator function
 * Use this to create new tRPC routers
 */
export const createTRPCRouter = t.router;

/**
 * Rate limiting middleware
 * Applies rate limits to all procedures
 */
const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  await checkRateLimit(ctx);
  return next();
});

/**
 * Public procedure builder
 *
 * Use for endpoints that don't require authentication.
 * Example: health checks, public data queries
 * Includes rate limiting protection.
 */
export const publicProcedure = t.procedure.use(rateLimitMiddleware);

/**
 * Authentication middleware
 *
 * Verifies that the user is authenticated by checking for a valid session.
 * Throws UNAUTHORIZED error if session is missing.
 */
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Narrow session type to non-null since we verified it exists
      session: ctx.session,
      // organizationId might still be null if user doesn't have one
      organizationId: ctx.organizationId,
    },
  });
});

/**
 * Protected procedure builder
 *
 * Use for endpoints that require authentication.
 * Automatically checks for valid session before executing procedure.
 * Rejects unauthenticated calls with UNAUTHORIZED error.
 * Includes rate limiting protection.
 *
 * Example:
 * ```ts
 * protectedProcedure
 *   .input(z.object({ id: z.string() }))
 *   .query(async ({ ctx, input }) => {
 *     // ctx.session is guaranteed to be non-null
 *     // ctx.organizationId is the user's organization ID
 *   })
 * ```
 */
export const protectedProcedure = t.procedure
  .use(rateLimitMiddleware)
  .use(isAuthenticated);

/**
 * Export tRPC instance for advanced usage
 */
export const trpc = t;
