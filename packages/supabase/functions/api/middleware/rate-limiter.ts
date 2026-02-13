import type { Context, Next } from 'hono'

/**
 * Rate Limiter Middleware
 *
 * Implements a sliding window rate limiter using in-memory storage.
 * For production, consider using Redis or other distributed cache.
 */

interface RateLimiterConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  keyGenerator?: (c: Context) => string // Function to generate rate limit key
  message?: string // Custom error message
  statusCode?: number // HTTP status code for rate limit errors
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory storage for rate limits
// For production: use Redis or other distributed cache
const rateLimitStore = new Map<string, RateLimitRecord>()

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  },
  5 * 60 * 1000
)

/**
 * Rate limiter middleware factory
 */
export function rateLimiter(config: RateLimiterConfig) {
  const {
    windowMs,
    max,
    keyGenerator = defaultKeyGenerator,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c)
    const now = Date.now()
    const resetTime = now + windowMs

    // Get or create rate limit record
    let record = rateLimitStore.get(key)

    if (!record || record.resetTime < now) {
      // Create new record for this window
      record = {
        count: 0,
        resetTime,
      }
      rateLimitStore.set(key, record)
    }

    // Increment count
    record.count++

    // Set rate limit headers
    const remaining = Math.max(0, max - record.count)
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000)

    c.header('X-RateLimit-Limit', max.toString())
    c.header('X-RateLimit-Remaining', remaining.toString())
    c.header('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString())

    // Check if rate limit exceeded
    if (record.count > max) {
      c.header('Retry-After', resetSeconds.toString())
      return c.json(
        {
          error: 'Too Many Requests',
          message,
          retryAfter: resetSeconds,
        },
        statusCode as 429
      )
    }

    // Execute next middleware/handler
    await next()

    // Optionally skip counting based on response status
    if (skipSuccessfulRequests && c.res.status >= 200 && c.res.status < 400) {
      record.count--
    } else if (skipFailedRequests && c.res.status >= 400) {
      record.count--
    }
  }
}

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(c: Context): string {
  // Try to get real IP from common headers
  const forwardedFor = c.req.header('x-forwarded-for')
  const realIp = c.req.header('x-real-ip')
  const cfConnectingIp = c.req.header('cf-connecting-ip')

  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown'

  return `ip:${ip}`
}

/**
 * Export helper function to create user-based rate limiter
 */
export function userRateLimiter(config: Omit<RateLimiterConfig, 'keyGenerator'>) {
  return rateLimiter({
    ...config,
    keyGenerator: (c) => {
      const user = c.get('user')
      if (user?.id) {
        return `user:${user.id}`
      }
      // Fall back to IP if no user
      return defaultKeyGenerator(c)
    },
  })
}

/**
 * Export helper function to create endpoint-specific rate limiter
 */
export function endpointRateLimiter(
  endpoint: string,
  config: Omit<RateLimiterConfig, 'keyGenerator'>
) {
  return rateLimiter({
    ...config,
    keyGenerator: (c) => {
      const user = c.get('user')
      const baseKey = user ? `user:${user.id}` : defaultKeyGenerator(c)
      return `${baseKey}:${endpoint}`
    },
  })
}
