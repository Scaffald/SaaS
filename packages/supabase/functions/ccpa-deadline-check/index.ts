/**
 * CCPA Deadline Check Edge Function
 *
 * This function runs on a daily schedule (cron job) to:
 * 1. Check all active CCPA requests for approaching deadlines
 * 2. Send alerts at 7, 3, and 1 day thresholds
 * 3. Send immediate alerts for overdue requests
 *
 * Schedule: Daily at 9:00 AM UTC
 *
 * To configure the cron schedule, add to supabase/config.toml:
 * ```
 * [functions.ccpa-deadline-check]
 * schedule = "0 9 * * *"
 * ```
 */
import { serve } from 'https://deno.land/std@0.223.0/http/server'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import type { Database } from '../_shared/database.types.ts'
import { corsHeaders, createCorsResponse } from '../_shared/cors'
import { insertNotification } from '../_shared/notifications/utils'

// Constants
const DAY_MS = 24 * 60 * 60 * 1000
const ALERT_THRESHOLDS = {
  warning: 7,
  urgent: 3,
  critical: 1,
} as const

type AlertSeverity = 'info' | 'warning' | 'error'

interface CCPARequest {
  id: string
  user_id: string
  request_type: string
  status: string
  submitted_at: string
  deadline_at: string
  extended_deadline_at: string | null
  metadata: Record<string, unknown> | null
}

interface AlertResult {
  requestId: string
  alertType: string
  severity: AlertSeverity
  sent: boolean
  error?: string
}

/**
 * Calculate days until deadline
 */
function calculateDaysRemaining(deadline: string): number {
  const deadlineDate = new Date(deadline)
  const now = new Date()
  const diffMs = deadlineDate.getTime() - now.getTime()
  return Math.ceil(diffMs / DAY_MS)
}

/**
 * Get alert type key for deduplication
 */
function getAlertTypeKey(daysRemaining: number): string {
  if (daysRemaining <= 0) return 'overdue'
  if (daysRemaining <= ALERT_THRESHOLDS.critical) return 'day1'
  if (daysRemaining <= ALERT_THRESHOLDS.urgent) return 'day3'
  if (daysRemaining <= ALERT_THRESHOLDS.warning) return 'day7'
  return 'none'
}

/**
 * Get alert severity
 */
function getAlertSeverity(daysRemaining: number): AlertSeverity {
  if (daysRemaining <= 0) return 'error'
  if (daysRemaining <= ALERT_THRESHOLDS.critical) return 'error'
  if (daysRemaining <= ALERT_THRESHOLDS.urgent) return 'warning'
  return 'info'
}

/**
 * Parse alert history from metadata
 */
function parseAlertHistory(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== 'object') return []
  const meta = metadata as Record<string, unknown>
  const history = meta.deadline_alerts
  if (!Array.isArray(history)) return []
  return history.filter((h): h is string => typeof h === 'string')
}

/**
 * Check if alert should be sent
 */
function shouldSendAlert(daysRemaining: number, alertHistory: string[]): boolean {
  const alertKey = getAlertTypeKey(daysRemaining)
  if (alertKey === 'none') return false
  return !alertHistory.includes(alertKey)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createCorsResponse('ok')
  }

  // Only allow POST (for cron trigger) or GET (for manual trigger)
  if (!['POST', 'GET'].includes(req.method)) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Initialize Supabase client with service role
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // Get compliance admin user ID from environment or use default
  // In production, this should be configured
  const complianceAdminId = Deno.env.get('CCPA_COMPLIANCE_ADMIN_ID')

  if (!complianceAdminId) {
    console.warn(
      '[ccpa-deadline-check] No CCPA_COMPLIANCE_ADMIN_ID configured, alerts will not be sent'
    )
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No compliance admin configured',
        message: 'Set CCPA_COMPLIANCE_ADMIN_ID environment variable',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }

  // Fetch active requests
  const { data: requests, error: fetchError } = await supabase
    .schema('core')
    .from('ccpa_requests')
    .select(
      'id, user_id, request_type, status, submitted_at, deadline_at, extended_deadline_at, metadata'
    )
    .in('status', ['pending', 'in_progress'])
    .order('deadline_at', { ascending: true })

  if (fetchError) {
    console.error('[ccpa-deadline-check] Failed to fetch requests:', fetchError)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch CCPA requests', details: fetchError.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }

  const results: AlertResult[] = []
  const summary = {
    examined: (requests ?? []).length,
    alertsSent: 0,
    alreadySent: 0,
    notDue: 0,
    errors: 0,
  }

  for (const request of (requests ?? []) as CCPARequest[]) {
    const effectiveDeadline = request.extended_deadline_at ?? request.deadline_at
    const daysRemaining = calculateDaysRemaining(effectiveDeadline)
    const alertHistory = parseAlertHistory(request.metadata)
    const alertKey = getAlertTypeKey(daysRemaining)

    // Check if alert is needed
    if (alertKey === 'none') {
      summary.notDue++
      continue
    }

    if (!shouldSendAlert(daysRemaining, alertHistory)) {
      summary.alreadySent++
      continue
    }

    const severity = getAlertSeverity(daysRemaining)

    // Build notification content
    let title: string
    let message: string

    if (daysRemaining <= 0) {
      const overdueBy = Math.abs(daysRemaining)
      title = `CCPA Request Overdue - ${request.request_type.toUpperCase()}`
      message = `URGENT: CCPA ${request.request_type} request (${request.id.slice(0, 8)}) is ${overdueBy} day${overdueBy > 1 ? 's' : ''} overdue. Immediate action required to avoid regulatory penalties.`
    } else if (daysRemaining <= ALERT_THRESHOLDS.critical) {
      title = `CCPA Deadline Tomorrow - ${request.request_type.toUpperCase()}`
      message = `CRITICAL: CCPA ${request.request_type} request (${request.id.slice(0, 8)}) deadline is tomorrow. Complete processing immediately.`
    } else if (daysRemaining <= ALERT_THRESHOLDS.urgent) {
      title = `CCPA Deadline in ${daysRemaining} Days`
      message = `URGENT: CCPA ${request.request_type} request (${request.id.slice(0, 8)}) deadline is in ${daysRemaining} days. Prioritize completion.`
    } else {
      title = `CCPA Deadline Reminder - ${daysRemaining} Days`
      message = `CCPA ${request.request_type} request (${request.id.slice(0, 8)}) deadline is in ${daysRemaining} days. Please review and process.`
    }

    try {
      // Send notification
      await insertNotification(
        supabase,
        {
          user_id: complianceAdminId,
          title,
          message,
          type: 'ccpa_deadline_alert',
          severity,
          metadata: {
            request_id: request.id,
            request_type: request.request_type,
            days_remaining: daysRemaining,
            deadline: effectiveDeadline,
            alert_type: alertKey,
          },
          cta_label: 'View Request',
          cta_url: `/office/privacy?request=${request.id}`,
        },
        `ccpa_deadline_${request.id}_${alertKey}`
      )

      // Record alert in request history
      await supabase
        .schema('core')
        .from('ccpa_request_history')
        .insert({
          request_id: request.id,
          status: request.status,
          notes: `Deadline alert sent: ${alertKey} (${daysRemaining} days remaining)`,
        })

      // Update request metadata with alert history
      const updatedAlerts = [...alertHistory, alertKey]
      const existingMetadata = (request.metadata ?? {}) as Record<string, unknown>
      await supabase
        .schema('core')
        .from('ccpa_requests')
        .update({
          metadata: {
            ...existingMetadata,
            deadline_alerts: updatedAlerts,
          },
        })
        .eq('id', request.id)

      results.push({
        requestId: request.id,
        alertType: alertKey,
        severity,
        sent: true,
      })
      summary.alertsSent++
    } catch (error) {
      console.error(`[ccpa-deadline-check] Failed to send alert for ${request.id}:`, error)
      results.push({
        requestId: request.id,
        alertType: alertKey,
        severity,
        sent: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      summary.errors++
    }
  }

  console.log('[ccpa-deadline-check] Completed:', JSON.stringify(summary))

  return new Response(
    JSON.stringify({
      success: true,
      summary,
      results,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  )
})
