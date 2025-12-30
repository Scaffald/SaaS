/**
 * Auth Refresh Edge Function
 * REQ-11: Authentication Flow Refinement - TASK-3
 *
 * Refreshes access token using stored refresh token and updates the session.
 */

import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createServiceClient,
  getSessionFromRequest,
  updateSessionTokens,
} from '../_shared/auth/session.ts'
import type { RefreshResponse, ScaffaldTokenResponse } from '../_shared/auth/types.ts'

// Environment variables
const SCAFFALD_TOKEN_ENDPOINT = Deno.env.get('SCAFFALD_TOKEN_ENDPOINT')
const SCAFFALD_CLIENT_ID = Deno.env.get('SCAFFALD_CLIENT_ID')
const SCAFFALD_CLIENT_SECRET = Deno.env.get('SCAFFALD_CLIENT_SECRET')

// CORS headers that allow credentials
const credentialsCorsHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Credentials': 'true',
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

  // Add client_secret if configured (confidential client)
  if (SCAFFALD_CLIENT_SECRET) {
    body.set('client_secret', SCAFFALD_CLIENT_SECRET)
  }

  const response = await fetch(SCAFFALD_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[AuthRefresh] Token refresh failed:', response.status, error)
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

  // Only allow POST
  if (req.method !== 'POST') {
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
      const response: RefreshResponse = {
        success: false,
        error: 'No valid session',
      }
      return new Response(JSON.stringify(response), {
        status: 401,
        headers: { ...credentialsCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if we have a refresh token
    if (!session.refresh_token) {
      const response: RefreshResponse = {
        success: false,
        error: 'No refresh token available',
      }
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...credentialsCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('[AuthRefresh] Refreshing tokens for session:', session.session_id)

    // Refresh tokens with Scaffald
    const tokens = await refreshTokensWithScaffald(session.refresh_token)

    console.log('[AuthRefresh] Got new tokens, expires_in:', tokens.expires_in)

    // Update session with new tokens
    const updated = await updateSessionTokens(supabase, {
      session_id: session.session_id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in || 3600,
    })

    if (!updated) {
      throw new Error('Failed to update session tokens')
    }

    // Calculate token expiry for response
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000)

    const response: RefreshResponse = {
      success: true,
      access_token: tokens.access_token,
      expires_at: expiresAt.toISOString(),
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...credentialsCorsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[AuthRefresh] Error:', error)

    const response: RefreshResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...credentialsCorsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
