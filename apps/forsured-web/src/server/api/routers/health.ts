/**
 * Health Check Router
 * REQ-292: Configure tRPC for production deployment
 * TASK-8: Create health check endpoint for deployment verification
 *
 * Provides simple health check endpoint for monitoring and deployment verification.
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

/**
 * Health check router
 *
 * Provides lightweight endpoints for monitoring and deployment verification.
 * These procedures are public (no authentication required) and Edge Runtime compatible.
 */
export const healthRouter = createTRPCRouter({
  /**
   * Basic health check
   * Returns 200 OK with status and timestamp
   */
  check: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Health check with echo
   * Useful for testing tRPC client-server communication
   */
  echo: publicProcedure
    .input(z.object({ message: z.string().optional() }))
    .query(({ input }) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        echo: input.message || 'pong',
      };
    }),
});
