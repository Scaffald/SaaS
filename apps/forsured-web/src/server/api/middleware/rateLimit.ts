/**
 * Rate Limiting Middleware for tRPC
 * REQ-292: Configure tRPC for production deployment
 * TASK-3: Implement rate limiting middleware with configurable storage
 *
 * Implements Fixed Window rate limiting with in-memory storage.
 * Protects API from abuse by limiting requests per time window.
 */

import { TRPCError } from '@trpc/server';
import { env } from '../../env';
import type { Context } from '../context';

/**
 * Rate limit configuration
 */
export const rateLimitConfig = {
  publicRoutes: {
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  },
  authenticatedRoutes: {
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS) * 5, // 5x limit for authenticated users
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  },
};

/**
 * Rate limit entry tracking requests in a time window
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Rate limiter using Fixed Window algorithm
 */
class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup process to prevent memory leaks
    this.startCleanup();
  }

  /**
   * Check if request should be rate limited
   * @returns true if request should be allowed, false if rate limited
   */
  checkLimit(identifier: string, maxRequests: number, windowMs: number): {
    allowed: boolean;
    retryAfter?: number;
  } {
    const now = Date.now();
    const entry = this.storage.get(identifier);

    // No entry or window expired - create new window
    if (!entry || now - entry.windowStart >= windowMs) {
      this.storage.set(identifier, {
        count: 1,
        windowStart: now,
      });
      return { allowed: true };
    }

    // Within current window - check if limit exceeded
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment count
    entry.count++;
    return { allowed: true };
  }

  /**
   * Start cleanup process to remove expired entries
   */
  private startCleanup() {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxWindowMs = Math.max(
        rateLimitConfig.publicRoutes.windowMs,
        rateLimitConfig.authenticatedRoutes.windowMs
      );

      for (const [identifier, entry] of this.storage.entries()) {
        // Remove entries older than the longest window
        if (now - entry.windowStart > maxWindowMs) {
          this.storage.delete(identifier);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop cleanup process (for testing/shutdown)
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Singleton rate limiter instance
 */
const rateLimiter = new RateLimiter();

/**
 * Get identifier for rate limiting
 * Uses user ID for authenticated requests, IP address for public requests
 */
function getIdentifier(ctx: Context, req?: Request): string {
  // Use user ID if authenticated
  if (ctx.session) {
    return `user:${ctx.session.id}`;
  }

  // Try to get IP address from request headers
  if (req) {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    return `ip:${ip}`;
  }

  return 'unknown';
}

/**
 * Rate limiting middleware
 * Apply to procedures that need rate limiting protection
 */
export async function checkRateLimit(ctx: Context, req?: Request): Promise<void> {
  // Skip if rate limiting is disabled
  if (!env.ENABLE_RATE_LIMITING) {
    return;
  }

  const identifier = getIdentifier(ctx, req);
  const config = ctx.session
    ? rateLimitConfig.authenticatedRoutes
    : rateLimitConfig.publicRoutes;

  const { allowed, retryAfter } = rateLimiter.checkLimit(
    identifier,
    config.maxRequests,
    config.windowMs
  );

  if (!allowed) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      cause: {
        retryAfter,
      },
    });
  }
}

/**
 * Export rate limiter for testing
 */
export { rateLimiter };
