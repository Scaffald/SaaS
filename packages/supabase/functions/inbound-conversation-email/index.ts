/**
 * Inbound Conversation Email Edge Function (no-op)
 * Forsured app removed; this function is retained for deployment compatibility but does not process emails.
 */
import { serve } from 'https://deno.land/std@0.223.0/http/server'
import { createCorsResponse } from '../_shared/cors'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return createCorsResponse('ok')
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }
  // No-op: accept and acknowledge without processing (forsured schema removed)
  return jsonResponse({ received: true })
})
