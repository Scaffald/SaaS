import { serve } from 'https://deno.land/std@0.168.0/http/server'
import { z } from 'zod'

import { createServiceClient, updateFeedbackStatus } from '../_shared/feedback-sync'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_ATTEMPTS = Number(Deno.env.get('FEEDBACK_SYNC_MAX_ATTEMPTS') ?? '5')
const DEFAULT_BATCH_SIZE = Number(Deno.env.get('FEEDBACK_SYNC_RETRY_BATCH') ?? '10')

const requestSchema = z.object({
  limit: z.number().int().positive().max(50).optional(),
  statuses: z
    .array(z.enum(['pending', 'failed']))
    .min(1)
    .max(2)
    .optional(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { ...corsHeaders, Allow: 'POST, OPTIONS' },
    })
  }

  const supabase = createServiceClient()

  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: 'Supabase environment variables are not configured',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  let body: unknown
  if (req.body) {
    try {
      body = await req.json()
    } catch (error) {
      console.error('[feedback-sync-retry] Failed to parse request body', {
        error,
      })
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // Always call safeParse - empty object is valid since all fields are optional
  const parseResult = requestSchema.safeParse(body ?? {})

  if (parseResult.success === false) {
    return new Response(
      JSON.stringify({
        error: 'Invalid request payload',
        details: parseResult.error.flatten(),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  const limit = parseResult.data.limit ?? DEFAULT_BATCH_SIZE
  const statuses = parseResult.data.statuses ?? ['pending', 'failed']

  const { data: candidates, error } = await supabase
    .schema('logs')
    .from('user_feedback')
    .select('id, sync_retry_count, braingrid_sync_status')
    .in('braingrid_sync_status', statuses)
    .lt('sync_retry_count', MAX_ATTEMPTS)
    .order('updated_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[feedback-sync-retry] Failed to load candidates', {
      error: error.message,
    })
    return new Response(JSON.stringify({ error: 'Failed to load feedback submissions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const pending = candidates ?? []
  const results: {
    processed: number
    succeeded: number
    failed: number
    skipped: number
    details: Array<{
      id: string
      status: 'success' | 'failed'
      error?: string
    }>
  } = {
    processed: pending.length,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    details: [],
  }

  for (const candidate of pending) {
    const { id } = candidate
    try {
      const { data: syncResult, error: invokeError } = await supabase.functions.invoke(
        'feedback-to-braingrid',
        {
          body: {
            feedbackId: id,
            trigger: 'retry',
          },
        }
      )

      if (invokeError) {
        results.failed += 1
        results.details.push({
          id,
          status: 'failed',
          error: invokeError.message,
        })

        await updateFeedbackStatus(supabase, id, {
          braingrid_sync_status: 'failed',
          braingrid_sync_error: invokeError.message,
        })
        continue
      }

      if (
        syncResult &&
        typeof syncResult === 'object' &&
        'success' in syncResult &&
        (syncResult as { success?: boolean }).success
      ) {
        results.succeeded += 1
        results.details.push({ id, status: 'success' })
      } else if (syncResult && typeof syncResult === 'object' && 'error' in syncResult) {
        const errorMessage =
          (syncResult as { error?: string }).error ?? 'Unknown Braingrid sync error'

        results.failed += 1
        results.details.push({
          id,
          status: 'failed',
          error: errorMessage,
        })

        await updateFeedbackStatus(supabase, id, {
          braingrid_sync_status: 'failed',
          braingrid_sync_error: errorMessage,
        })
      } else {
        // Treat absence of explicit success as success to avoid double-counting.
        results.succeeded += 1
        results.details.push({ id, status: 'success' })
      }
    } catch (invokeError) {
      const errorMessage = invokeError instanceof Error ? invokeError.message : String(invokeError)

      results.failed += 1
      results.details.push({
        id,
        status: 'failed',
        error: errorMessage,
      })

      await updateFeedbackStatus(supabase, id, {
        braingrid_sync_status: 'failed',
        braingrid_sync_error: errorMessage,
      })
    }
  }

  return new Response(
    JSON.stringify({
      ...results,
      limit,
      statuses,
      maxAttempts: MAX_ATTEMPTS,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})
