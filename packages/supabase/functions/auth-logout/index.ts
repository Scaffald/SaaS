/**
 * Auth Logout Edge Function
 * REQ-11: Authentication Flow Refinement - TASK-3
 *
 * Deletes the session from database and clears the session cookie.
 */

import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createServiceClient,
  deleteSession,
} from '../_shared/auth/session.ts'
import {
  getSessionIdFromRequest,
  createClearSessionCookie,
} from '../_shared/auth/cookies.ts'
import type { LogoutResponse } from '../_shared/auth/types.ts'

// CORS headers that allow credentials
const credentialsCorsHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Credentials': 'true',
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
    const sessionId = getSessionIdFromRequest(req)

    // Even if no session, clear the cookie
    const clearCookie = createClearSessionCookie()

    if (!sessionId) {
      console.log('[AuthLogout] No session cookie found, clearing anyway')
      const response: LogoutResponse = { success: true }
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...credentialsCorsHeaders,
          'Content-Type': 'application/json',
          'Set-Cookie': clearCookie,
        },
      })
    }

    console.log('[AuthLogout] Deleting session:', sessionId)

    // Delete session from database (also cleans up vault secrets)
    const supabase = createServiceClient()
    await deleteSession(supabase, sessionId)

    console.log('[AuthLogout] Session deleted successfully')

    const response: LogoutResponse = { success: true }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...credentialsCorsHeaders,
        'Content-Type': 'application/json',
        'Set-Cookie': clearCookie,
      },
    })
  } catch (error) {
    console.error('[AuthLogout] Error:', error)

    // Even on error, try to clear the cookie
    const response: LogoutResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        ...credentialsCorsHeaders,
        'Content-Type': 'application/json',
        'Set-Cookie': createClearSessionCookie(),
      },
    })
  }
})
