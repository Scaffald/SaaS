/**
 * Auth Session Edge Function
 * REQ-11: Authentication Flow Refinement - TASK-3
 *
 * Validates session and returns user info with current access token.
 * Used by client to check session validity and get tokens on page load.
 */

import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createServiceClient,
  getSessionFromRequest,
  isTokenExpiringSoon,
  updateSessionTokens,
} from '../_shared/auth/session.ts'
import type { SessionResponse, ScaffaldUser, ScaffaldTokenResponse } from '../_shared/auth/types.ts'

// Environment variables
const SCAFFALD_API_URL = Deno.env.get('SCAFFALD_API_URL')
const SCAFFALD_TOKEN_ENDPOINT = Deno.env.get('SCAFFALD_TOKEN_ENDPOINT')
const SCAFFALD_CLIENT_ID = Deno.env.get('SCAFFALD_CLIENT_ID')
const SCAFFALD_CLIENT_SECRET = Deno.env.get('SCAFFALD_CLIENT_SECRET')

// CORS headers that allow credentials
const credentialsCorsHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Credentials': 'true',
}

/**
 * Get user info from Scaffald using access token
 */
async function getScaffaldUser(accessToken: string): Promise<ScaffaldUser> {
  if (!SCAFFALD_API_URL) {
    throw new Error('SCAFFALD_API_URL not configured')
  }

  const response = await fetch(`${SCAFFALD_API_URL}/api/v1/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.status}`)
  }

  return response.json()
}

/**
 * Refresh tokens with Scaffald
 */
async function refreshTokensWithScaffald(
  refreshToken: string
): Promise<ScaffaldTokenResponse> {
  if (!SCAFFALD_TOKEN_ENDPOINT || !SCAFFALD_CLIENT_ID) {
    throw new Error('Scaffald OAuth not configured')
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: SCAFFALD_CLIENT_ID,
    refresh_token: refreshToken,
  })

  if (SCAFFALD_CLIENT_SECRET) {
    body.set('client_secret', SCAFFALD_CLIENT_SECRET)
  }

  const response = await fetch(SCAFFALD_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`)
  }

  return response.json()
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: credentialsCorsHeaders,
    })
  }

  // Allow both GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...credentialsCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createServiceClient()

    // Get session from cookie
    const session = await getSessionFromRequest(supabase, req)
    if (!session) {
      const response: SessionResponse = {
        valid: false,
        error: 'No valid session',
      }
      return new Response(JSON.stringify(response), {
        status: 401,
        headers: { ...credentialsCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let accessToken = session.access_token
    let expiresAt = session.token_expires_at

    // Proactively refresh if token is expiring soon
    if (isTokenExpiringSoon(session) && session.refresh_token) {
      console.log('[AuthSession] Token expiring soon, refreshing...')
      try {
        const tokens = await refreshTokensWithScaffald(session.refresh_token)

        // Update session with new tokens
        await updateSessionTokens(supabase, {
          session_id: session.session_id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in || 3600,
        })

        accessToken = tokens.access_token
        expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000)

        console.log('[AuthSession] Token refreshed successfully')
      } catch (refreshError) {
        console.warn('[AuthSession] Token refresh failed, using existing token:', refreshError)
        // Continue with existing token - it may still be valid
      }
    }

    // Get user info from Scaffald
    let user: ScaffaldUser
    try {
      user = await getScaffaldUser(accessToken)
    } catch (userError) {
      console.error('[AuthSession] Failed to get user:', userError)
      const response: SessionResponse = {
        valid: false,
        error: 'Failed to validate session',
      }
      return new Response(JSON.stringify(response), {
        status: 401,
        headers: { ...credentialsCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response: SessionResponse = {
      valid: true,
      user,
      access_token: accessToken,
      expires_at: expiresAt.toISOString(),
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...credentialsCorsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[AuthSession] Error:', error)

    const response: SessionResponse = {
      valid: false,
      error: error instanceof Error ? error.message : 'Session validation failed',
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...credentialsCorsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
