/**
 * Cookie utilities for httpOnly session management
 * REQ-11: Authentication Flow Refinement - TASK-3
 */

export const SESSION_COOKIE_NAME = 'forsured_session'

// 30 days in seconds
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60

interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
  path?: string
  maxAge?: number
  domain?: string
}

/**
 * Parse cookies from request headers
 */
export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}

  const cookies: Record<string, string> = {}
  const pairs = cookieHeader.split(';')

  for (const pair of pairs) {
    const [name, ...valueParts] = pair.trim().split('=')
    if (name && valueParts.length > 0) {
      cookies[name.trim()] = decodeURIComponent(valueParts.join('=').trim())
    }
  }

  return cookies
}

/**
 * Get session ID from request cookies
 */
export function getSessionIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie')
  const cookies = parseCookies(cookieHeader)
  return cookies[SESSION_COOKIE_NAME] || null
}

/**
 * Create Set-Cookie header value for session
 */
export function createSessionCookie(sessionId: string, options: CookieOptions = {}): string {
  const {
    httpOnly = true,
    secure = true,
    sameSite = 'Lax',
    path = '/',
    maxAge = SESSION_MAX_AGE,
    domain,
  } = options

  let cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`
  cookie += `; Path=${path}`
  cookie += `; Max-Age=${maxAge}`

  if (httpOnly) cookie += '; HttpOnly'
  if (secure) cookie += '; Secure'
  if (sameSite) cookie += `; SameSite=${sameSite}`
  if (domain) cookie += `; Domain=${domain}`

  return cookie
}

/**
 * Create Set-Cookie header to clear the session cookie
 */
export function createClearSessionCookie(
  options: Pick<CookieOptions, 'path' | 'domain'> = {}
): string {
  const { path = '/', domain } = options

  let cookie = `${SESSION_COOKIE_NAME}=; Path=${path}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  cookie += '; HttpOnly; Secure; SameSite=Lax'
  if (domain) cookie += `; Domain=${domain}`

  return cookie
}

/**
 * Determine if we should use Secure cookie based on environment
 */
export function isSecureContext(): boolean {
  // In Supabase Edge Functions, check the environment
  const env = Deno.env.get('SUPABASE_URL') || ''
  // Local development uses http://localhost
  return !env.includes('localhost') && !env.includes('127.0.0.1')
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string | null {
  // Check various headers for forwarded IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  // Fallback - may not be available in all contexts
  return null
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string | null {
  return request.headers.get('user-agent')
}
