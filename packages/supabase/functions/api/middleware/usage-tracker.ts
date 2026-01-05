/**
 * API Key Usage Tracking Middleware
 * Records API requests made with API keys for analytics and billing
 */

import { createClient } from '@supabase/supabase-js'
import type { Context, Next } from 'hono'

/**
 * Track API key usage - records request details to api_key_usage table
 *
 * This middleware:
 * 1. Checks if request is authenticated with an API key
 * 2. Records endpoint, method, status code, response time
 * 3. Runs asynchronously (doesn't block the response)
 */
export async function trackApiKeyUsage(c: Context, next: Next) {
  const authType = c.get('authType')

  // Only track if authenticated with API key (not JWT)
  if (authType !== 'api_key') {
    await next()
    return
  }

  const apiKey = c.get('apiKey')
  if (!apiKey) {
    await next()
    return
  }

  // Start timing
  const startTime = Date.now()

  // Execute the request
  await next()

  // Calculate response time
  const responseTime = Date.now() - startTime

  // Get request details
  const endpoint = new URL(c.req.url).pathname
  const method = c.req.method
  const statusCode = c.res.status
  const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null
  const userAgent = c.req.header('user-agent') || null

  // Record usage asynchronously (fire and forget)
  recordUsage({
    apiKeyId: apiKey.id,
    endpoint,
    method,
    statusCode,
    responseTimeMs: responseTime,
    ipAddress,
    userAgent,
  }).catch((error) => {
    console.error('Failed to record API key usage:', error)
  })
}

/**
 * Record usage to database
 */
async function recordUsage(data: {
  apiKeyId: string
  endpoint: string
  method: string
  statusCode: number
  responseTimeMs: number
  ipAddress: string | null
  userAgent: string | null
}) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

  await serviceClient.schema('core').from('api_key_usage').insert({
    api_key_id: data.apiKeyId,
    endpoint: data.endpoint,
    method: data.method,
    status_code: data.statusCode,
    response_time_ms: data.responseTimeMs,
    ip_address: data.ipAddress,
    user_agent: data.userAgent,
  })
}

/**
 * Rate limit middleware - checks if API key has exceeded rate limits
 *
 * This is a simple in-memory rate limiter. For production, consider using Redis.
 */

// Simple in-memory rate limit tracking
const rateLimitCache = new Map<
  string,
  {
    requests: number[]
    lastReset: number
  }
>()

export async function rateLimitMiddleware(c: Context, next: Next) {
  const authType = c.get('authType')

  // Only apply rate limiting to API key requests
  if (authType !== 'api_key') {
    await next()
    return
  }

  const apiKey = c.get('apiKey')
  if (!apiKey) {
    await next()
    return
  }

  // Get rate limit for tier
  const limits = {
    free: 100, // requests per minute
    pro: 1000,
    enterprise: 10000,
  }

  const limit = limits[apiKey.rateLimitTier as keyof typeof limits] || limits.free

  // Get or create rate limit entry
  const now = Date.now()
  const minute = Math.floor(now / 60000) // Current minute
  const cacheKey = `${apiKey.id}:${minute}`

  let entry = rateLimitCache.get(cacheKey)

  if (!entry) {
    entry = {
      requests: [],
      lastReset: minute,
    }
    rateLimitCache.set(cacheKey, entry)
  }

  // Clean up old entries (older than 5 minutes)
  const fiveMinutesAgo = minute - 5
  for (const [key] of rateLimitCache) {
    const keyMinute = Number.parseInt(key.split(':')[1], 10)
    if (keyMinute < fiveMinutesAgo) {
      rateLimitCache.delete(key)
    }
  }

  // Add current request
  entry.requests.push(now)

  // Check if over limit
  if (entry.requests.length > limit) {
    // Set rate limit headers
    c.header('X-RateLimit-Limit', limit.toString())
    c.header('X-RateLimit-Remaining', '0')
    c.header('X-RateLimit-Reset', ((minute + 1) * 60).toString())
    c.header('Retry-After', '60')

    return c.json(
      {
        error: 'Rate Limit Exceeded',
        message: `You have exceeded the rate limit of ${limit} requests per minute for your ${apiKey.rateLimitTier} tier`,
        limit,
        reset_at: new Date((minute + 1) * 60000).toISOString(),
      },
      429
    )
  }

  // Set rate limit headers
  c.header('X-RateLimit-Limit', limit.toString())
  c.header('X-RateLimit-Remaining', (limit - entry.requests.length).toString())
  c.header('X-RateLimit-Reset', ((minute + 1) * 60).toString())

  await next()
}
