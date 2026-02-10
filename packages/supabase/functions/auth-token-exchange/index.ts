/**
 * Auth Token Exchange Edge Function
 * Authentication flow - token exchange
 *
 * Exchanges OAuth authorization code for tokens, stores them encrypted
 * in Vault, and returns a session cookie.
 */

import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createServiceClient,
  createSession,
  extractRequestMetadata,
} from '../_shared/auth/session.ts'
import { createSessionCookie, isSecureContext, SESSION_MAX_AGE } from '../_shared/auth/cookies.ts'
import type {
  TokenExchangeRequest,
  TokenExchangeResponse,
  ScaffaldTokenResponse,
  ScaffaldUser,
} from '../_shared/auth/types.ts'

// Environment variables
const SCAFFALD_TOKEN_ENDPOINT = Deno.env.get('SCAFFALD_TOKEN_ENDPOINT')
const SCAFFALD_CLIENT_ID = Deno.env.get('SCAFFALD_CLIENT_ID')
const SCAFFALD_CLIENT_SECRET = Deno.env.get('SCAFFALD_CLIENT_SECRET')
const SCAFFALD_API_URL = Deno.env.get('SCAFFALD_API_URL')

// CORS headers that allow credentials
const credentialsCorsHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Credentials': 'true',
}

/**
 * Exchange authorization code for tokens with Scaffald
 */
async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<ScaffaldTokenResponse> {
  if (!SCAFFALD_TOKEN_ENDPOINT || !SCAFFALD_CLIENT_ID) {
    throw new Error('Scaffald OAuth not configured')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: SCAFFALD_CLIENT_ID,
    code,
    redirect_uri: redirectUri,
  })

  // Add PKCE code_verifier if provided
  if (codeVerifier) {
    body.set('code_verifier', codeVerifier)
  }

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
    console.error('[TokenExchange] Token exchange failed:', response.status, error)
    throw new Error(`Token exchange failed: ${response.status}`)
  }

  return response.json()
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
    // Parse request body
    const body: TokenExchangeRequest = await req.json()
    const { code, code_verifier, redirect_uri } = body

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing code or redirect_uri' }),
        {
          status: 400,
          headers: { ...credentialsCorsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[TokenExchange] Exchanging code for tokens')

    // Exchange code for tokens with Scaffald
    const tokens = await exchangeCodeForTokens(code, redirect_uri, code_verifier)

    console.log('[TokenExchange] Got tokens, expires_in:', tokens.expires_in)

    // Get user info from Scaffald
    const user = await getScaffaldUser(tokens.access_token)

    console.log('[TokenExchange] Got user:', user.email)

    // Create session in database with encrypted tokens
    const supabase = createServiceClient()
    const metadata = extractRequestMetadata(req)

    const sessionId = await createSession(supabase, {
      scaffald_user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in || 3600,
      user_agent: metadata.user_agent,
      ip_address: metadata.ip_address,
    })

    console.log('[TokenExchange] Created session:', sessionId)

    // Calculate token expiry for response
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000)

    // Create session cookie
    const sessionCookie = createSessionCookie(sessionId, {
      secure: isSecureContext(),
      maxAge: SESSION_MAX_AGE,
    })

    // Build response
    const response: TokenExchangeResponse = {
      success: true,
      user,
      access_token: tokens.access_token,
      expires_at: expiresAt.toISOString(),
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...credentialsCorsHeaders,
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookie,
      },
    })
  } catch (error) {
    console.error('[TokenExchange] Error:', error)

    const response: TokenExchangeResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Token exchange failed',
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...credentialsCorsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
