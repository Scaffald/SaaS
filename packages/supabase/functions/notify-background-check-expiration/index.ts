import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'
import { notifyBackgroundCheckExpirationReminder } from '../_shared/background-check-notifications.ts'
import { corsHeaders, createCorsResponse } from '../_shared/cors.ts'
import { createServiceSupabaseClient } from '../_shared/notifications/utils.ts'
import { requireServiceAuth } from '../_shared/notifications/auth.ts'

const DAY_MS = 86_400_000
const REMINDER_WINDOWS = [
  { days: 30 as const, key: 'days30' },
  { days: 7 as const, key: 'days7' },
]

const ELIGIBLE_STATUSES = new Set([
  'completed_clear',
  'completed_consider',
  'completed_not_clear',
  'partially_completed',
])

interface BackgroundCheckRow {
  id: string
  status: string
  user_id: string
  requested_by_user_id: string | null
  expires_at: string | null
  metadata: unknown
  package: { display_name?: string | null; slug?: string | null } | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function reminderAlreadySent(metadata: unknown, key: string): boolean {
  if (!isRecord(metadata)) return false
  const reminders = metadata.reminders
  if (!isRecord(reminders)) return false
  const expiration = reminders.expiration
  if (!isRecord(expiration)) return false
  return typeof expiration[key] === 'string'
}

function markReminderSent(
  metadata: unknown,
  key: string,
  timestamp: string
): Record<string, unknown> {
  const base = isRecord(metadata) ? { ...metadata } : {}
  const reminders = isRecord(base.reminders) ? { ...base.reminders } : {}
  const expiration = isRecord(reminders.expiration) ? { ...reminders.expiration } : {}
  expiration[key] = timestamp
  reminders.expiration = expiration
  base.reminders = reminders
  return base
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return createCorsResponse('ok')
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Internal infrastructure: only the service role key may drive this. See
  // _shared/notifications/auth.ts for why verify_jwt is not enough.
  const authError = requireServiceAuth(req)
  if (authError) return authError

  const supabase = createServiceSupabaseClient()
  const now = new Date()
  const cutoff = new Date(now.getTime() + 31 * DAY_MS)

  const { data, error } = await supabase
    .schema('core')
    .from('background_checks')
    .select(
      'id, status, user_id, requested_by_user_id, expires_at, metadata, package:background_check_packages(display_name, slug)'
    )
    .not('expires_at', 'is', null)
    .in('status', Array.from(ELIGIBLE_STATUSES))
    .gte('expires_at', now.toISOString())
    .lte('expires_at', cutoff.toISOString())

  if (error) {
    console.error('[notify-background-check-expiration] query error', error)
    return new Response(JSON.stringify({ error: 'failed_to_fetch_checks' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const rows = (data ?? []) as BackgroundCheckRow[]
  const summary = {
    examined: rows.length,
    remindersSent: 0,
    alreadySent: 0,
    updatedMetadata: 0,
    errors: [] as string[],
  }

  for (const row of rows) {
    if (!row.expires_at) continue
    if (!ELIGIBLE_STATUSES.has(row.status)) continue

    const expiresAt = new Date(row.expires_at)
    if (Number.isNaN(expiresAt.valueOf())) {
      summary.errors.push(`invalid_expires_at:${row.id}:${row.expires_at}`)
      continue
    }

    for (const window of REMINDER_WINDOWS) {
      const diffDays = Math.round((expiresAt.getTime() - now.getTime()) / DAY_MS)

      if (diffDays !== window.days) {
        continue
      }

      if (reminderAlreadySent(row.metadata, window.key)) {
        summary.alreadySent++
        continue
      }

      try {
        await notifyBackgroundCheckExpirationReminder({
          supabase,
          checkId: row.id,
          workerId: row.user_id,
          requesterId: row.requested_by_user_id ?? null,
          packageName: row.package?.display_name ?? row.package?.slug ?? null,
          expiresAt: row.expires_at,
          windowDays: window.days,
        })
        summary.remindersSent++

        const updatedMetadata = markReminderSent(row.metadata, window.key, new Date().toISOString())

        const { error: updateError } = await supabase
          .schema('core')
          .from('background_checks')
          .update({ metadata: updatedMetadata })
          .eq('id', row.id)

        if (updateError) {
          console.error(
            '[notify-background-check-expiration] failed to update metadata',
            updateError
          )
          summary.errors.push(`metadata_update_failed:${row.id}`)
        } else {
          summary.updatedMetadata++
        }
      } catch (error) {
        console.error('[notify-background-check-expiration] reminder error', error)
        summary.errors.push(`reminder_failed:${row.id}`)
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, summary }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})
