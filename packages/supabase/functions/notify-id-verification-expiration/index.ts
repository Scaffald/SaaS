import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'

import { corsHeaders } from '../_shared/cors.ts'
import { notifyIdVerificationExpirationReminder } from '../_shared/id-verification-notifications.ts'
import { readReminderTimestamp, writeReminderTimestamp } from '../_shared/id-verification-utils.ts'
import type { NotificationSupabaseClient } from '../_shared/notifications/types.ts'
import { createServiceSupabaseClient } from '../_shared/notifications/utils.ts'
import { requireServiceAuth } from '../_shared/notifications/auth.ts'

type ReminderWindow = 30 | 7

const REMINDER_KEYS: Record<ReminderWindow | 'expired', string> = {
  30: 'expiration_30_day',
  7: 'expiration_7_day',
  expired: 'expiration_expired',
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

async function processReminderWindow(
  supabase: NotificationSupabaseClient,
  window: ReminderWindow,
  now: Date
): Promise<number> {
  const windowStart = addDays(now, window)
  windowStart.setUTCHours(0, 0, 0, 0)
  const windowEnd = addDays(windowStart, 1)

  const { data, error } = await supabase
    .schema('core')
    .from('id_verifications')
    .select('id, worker_user_id, badge_expires_at, metadata')
    .eq('badge_status', 'active')
    .gte('badge_expires_at', windowStart.toISOString())
    .lt('badge_expires_at', windowEnd.toISOString())

  if (error) {
    console.error('[notify-id-verification-expiration] failed to load expiring badges', error)
    throw Object.assign(new Error('failed_to_query_badges'), { status: 500 })
  }

  const rows = data ?? []
  let processed = 0

  for (const row of rows) {
    if (!row.id || !row.worker_user_id || !row.badge_expires_at) continue
    const reminderKey = REMINDER_KEYS[window]
    if (readReminderTimestamp(row.metadata, reminderKey)) {
      continue
    }

    await notifyIdVerificationExpirationReminder({
      supabase,
      verificationId: row.id,
      workerId: row.worker_user_id,
      expiresAt: row.badge_expires_at,
      window: window === 30 ? '30' : '7',
    })

    const metadata = writeReminderTimestamp(row.metadata, reminderKey, new Date().toISOString())
    const { error: updateError } = await supabase
      .schema('core')
      .from('id_verifications')
      .update({ metadata })
      .eq('id', row.id)

    if (updateError) {
      console.error('[notify-id-verification-expiration] failed to persist reminder marker', {
        id: row.id,
        window,
        error: updateError,
      })
    } else {
      processed += 1
    }
  }

  return processed
}

async function expireOverdueBadges(
  supabase: NotificationSupabaseClient,
  now: Date
): Promise<number> {
  const nowIso = now.toISOString()

  const { data, error } = await supabase
    .schema('core')
    .from('id_verifications')
    .select('id, worker_user_id, badge_expires_at, metadata')
    .eq('badge_status', 'active')
    .lt('badge_expires_at', nowIso)

  if (error) {
    console.error('[notify-id-verification-expiration] failed to load overdue badges', error)
    throw Object.assign(new Error('failed_to_query_overdue_badges'), { status: 500 })
  }

  const rows = data ?? []
  for (const row of rows) {
    if (!row.id) continue
    const { error: updateError } = await supabase
      .schema('core')
      .from('id_verifications')
      .update({
        badge_status: 'expired',
      })
      .eq('id', row.id)

    if (updateError) {
      console.error('[notify-id-verification-expiration] failed to mark badge expired', {
        id: row.id,
        error: updateError,
      })
    }
  }

  return rows.length
}

async function processExpiredReminders(
  supabase: NotificationSupabaseClient,
  now: Date
): Promise<number> {
  const windowStart = addDays(now, -1)
  const windowEnd = addDays(now, 1)

  const { data, error } = await supabase
    .schema('core')
    .from('id_verifications')
    .select('id, worker_user_id, badge_expires_at, metadata')
    .eq('badge_status', 'expired')
    .gte('badge_expires_at', windowStart.toISOString())
    .lt('badge_expires_at', windowEnd.toISOString())

  if (error) {
    console.error('[notify-id-verification-expiration] failed to load expired badges', error)
    throw Object.assign(new Error('failed_to_query_expired_badges'), { status: 500 })
  }

  const rows = data ?? []
  let processed = 0

  for (const row of rows) {
    if (!row.id || !row.worker_user_id || !row.badge_expires_at) continue
    const reminderKey = REMINDER_KEYS.expired
    if (readReminderTimestamp(row.metadata, reminderKey)) {
      continue
    }

    await notifyIdVerificationExpirationReminder({
      supabase,
      verificationId: row.id,
      workerId: row.worker_user_id,
      expiresAt: row.badge_expires_at,
      window: 'expired',
    })

    const metadata = writeReminderTimestamp(row.metadata, reminderKey, new Date().toISOString())
    const { error: updateError } = await supabase
      .schema('core')
      .from('id_verifications')
      .update({ metadata })
      .eq('id', row.id)

    if (updateError) {
      console.error(
        '[notify-id-verification-expiration] failed to record expired reminder marker',
        { id: row.id, error: updateError }
      )
    } else {
      processed += 1
    }
  }

  return processed
}

async function runJob(): Promise<Response> {
  const startedAt = new Date()
  const supabase = createServiceSupabaseClient()
  const expiredCount = await expireOverdueBadges(supabase, startedAt)
  const reminders30 = await processReminderWindow(supabase, 30, startedAt)
  const reminders7 = await processReminderWindow(supabase, 7, startedAt)
  const expiredReminders = await processExpiredReminders(supabase, startedAt)

  return new Response(
    JSON.stringify({
      ok: true,
      processed: {
        expiredMarked: expiredCount,
        reminders30,
        reminders7,
        expiredReminders,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Internal infrastructure: only the service role key may drive this. See
  // _shared/notifications/auth.ts for why verify_jwt is not enough.
  const authError = requireServiceAuth(req)
  if (authError) return authError

  try {
    return await runJob()
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500
    console.error('[notify-id-verification-expiration] job failed', error)
    return new Response(JSON.stringify({ error: (error as Error).message ?? 'internal_error' }), {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
