/**
 * Session management utilities for httpOnly cookie token storage
 * Authentication flow - session helpers
 *
 * Uses Supabase database functions with Vault encryption for secure token storage.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getSessionIdFromRequest, getClientIp, getUserAgent } from './cookies.ts'

// Types for session data
export interface AuthSession {
  session_id: string
  scaffald_user_id: string
  supabase_user_id: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: Date
  session_expires_at: Date
  last_used_at: Date
}

export interface CreateSessionInput {
  scaffald_user_id: string
  supabase_user_id?: string | null
  access_token: string
  refresh_token?: string | null
  expires_in: number // seconds until token expiration
  user_agent?: string | null
  ip_address?: string | null
}

export interface UpdateTokensInput {
  session_id: string
  access_token: string
  refresh_token?: string | null
  expires_in: number
}

/**
 * Create Supabase client with service role for session operations
 * Uses the 'forsured' schema where auth session functions are defined
 */
export function createServiceClient(): SupabaseClient<any, 'forsured', any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, serviceKey, {
    global: { headers: { 'X-Client-Info': 'auth-edge-functions' } },
    auth: { persistSession: false },
    db: { schema: 'forsured' }, // Use forsured schema for auth session functions
  })
}

/**
 * Create a new auth session with encrypted tokens via Vault
 */
export async function createSession(
  supabase: SupabaseClient,
  input: CreateSessionInput
): Promise<string> {
  const tokenExpiresAt = new Date(Date.now() + input.expires_in * 1000)

  const { data, error } = await supabase.rpc('create_auth_session', {
    p_scaffald_user_id: input.scaffald_user_id,
    p_supabase_user_id: input.supabase_user_id || null,
    p_access_token: input.access_token,
    p_refresh_token: input.refresh_token || null,
    p_token_expires_at: tokenExpiresAt.toISOString(),
    p_user_agent: input.user_agent || null,
    p_ip_address: input.ip_address || null,
  })

  if (error) {
    console.error('[Session] Failed to create session:', error)
    throw new Error(`Failed to create session: ${error.message}`)
  }

  if (!data) {
    throw new Error('Failed to create session: no session ID returned')
  }

  console.log('[Session] Created session:', data)
  return data as string
}

/**
 * Get session with decrypted tokens
 */
export async function getSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<AuthSession | null> {
  const { data, error } = await supabase.rpc('get_auth_session', {
    p_session_id: sessionId,
  })

  if (error) {
    console.error('[Session] Failed to get session:', error)
    return null
  }

  if (!data || data.length === 0) {
    console.log('[Session] Session not found or expired:', sessionId)
    return null
  }

  const row = data[0]
  return {
    session_id: row.session_id,
    scaffald_user_id: row.scaffald_user_id,
    supabase_user_id: row.supabase_user_id,
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    token_expires_at: new Date(row.token_expires_at),
    session_expires_at: new Date(row.session_expires_at),
    last_used_at: new Date(row.last_used_at),
  }
}

/**
 * Get session from request cookie
 */
export async function getSessionFromRequest(
  supabase: SupabaseClient,
  request: Request
): Promise<AuthSession | null> {
  const sessionId = getSessionIdFromRequest(request)
  if (!sessionId) {
    console.log('[Session] No session cookie found')
    return null
  }

  return getSession(supabase, sessionId)
}

/**
 * Update tokens after refresh
 */
export async function updateSessionTokens(
  supabase: SupabaseClient,
  input: UpdateTokensInput
): Promise<boolean> {
  const tokenExpiresAt = new Date(Date.now() + input.expires_in * 1000)

  const { data, error } = await supabase.rpc('update_auth_session_tokens', {
    p_session_id: input.session_id,
    p_access_token: input.access_token,
    p_refresh_token: input.refresh_token || null,
    p_token_expires_at: tokenExpiresAt.toISOString(),
  })

  if (error) {
    console.error('[Session] Failed to update tokens:', error)
    return false
  }

  console.log('[Session] Updated tokens for session:', input.session_id)
  return data === true
}

/**
 * Delete session (logout)
 */
export async function deleteSession(supabase: SupabaseClient, sessionId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('delete_auth_session', {
    p_session_id: sessionId,
  })

  if (error) {
    console.error('[Session] Failed to delete session:', error)
    return false
  }

  console.log('[Session] Deleted session:', sessionId)
  return data === true
}

/**
 * Check if token needs refresh (5-minute buffer)
 */
export function isTokenExpiringSoon(session: AuthSession): boolean {
  const bufferMs = 5 * 60 * 1000 // 5 minutes
  return session.token_expires_at.getTime() - Date.now() < bufferMs
}

/**
 * Extract request metadata for session creation
 */
export function extractRequestMetadata(request: Request): {
  user_agent: string | null
  ip_address: string | null
} {
  return {
    user_agent: getUserAgent(request),
    ip_address: getClientIp(request),
  }
}
