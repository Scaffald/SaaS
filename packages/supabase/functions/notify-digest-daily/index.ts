import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'

import { corsHeaders, createCorsResponse } from '../_shared/cors.ts'
import { processDigestQueue } from '../_shared/notifications/digest.ts'
import { createServiceSupabaseClient } from '../_shared/notifications/utils.ts'
import { requireServiceAuth } from '../_shared/notifications/auth.ts'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
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

  // Internal infrastructure: only the service role key may drive this. See
  // _shared/notifications/auth.ts for why verify_jwt is not enough.
  const authError = requireServiceAuth(req)
  if (authError) return authError

  const supabase = createServiceSupabaseClient()

  try {
    const summary = await processDigestQueue('digest_daily', { supabase })
    return jsonResponse({ ok: true, summary })
  } catch (error) {
    console.error('Failed to process daily digest', error)
    return jsonResponse({ error: 'Failed to process daily digest' }, 500)
  }
})
