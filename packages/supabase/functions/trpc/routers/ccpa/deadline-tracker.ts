/**
 * CCPA Deadline Tracking System
 *
 * Provides utilities for tracking CCPA request deadlines and sending
 * timely alerts to the compliance team.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../_shared/database.types.ts';
import { insertNotification, createServiceSupabaseClient } from '../../../_shared/notifications/utils.ts';

type DbClient = SupabaseClient<Database>

// CCPA standard deadline (45 days)
const CCPA_DEADLINE_DAYS = 45
const CCPA_EXTENSION_DAYS = 45

// Alert thresholds (days before deadline)
const ALERT_THRESHOLDS = {
  warning: 7,
  urgent: 3,
  critical: 1,
} as const

// Day in milliseconds
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error'

/**
 * Deadline status for a request
 */
export interface DeadlineStatus {
  requestId: string
  userId: string
  userEmail: string | null
  requestType: string
  status: string
  submittedAt: Date
  deadline: Date
  extendedDeadline: Date | null
  effectiveDeadline: Date
  daysRemaining: number
  isOverdue: boolean
  isAtRisk: boolean
  alertHistory: string[]
}

/**
 * Alert result
 */
export interface AlertResult {
  requestId: string
  alertType: string
  severity: AlertSeverity
  sent: boolean
  error?: string
}

/**
 * Calculate the CCPA deadline from a submission date
 */
export function calculateDeadline(submittedAt: Date): Date {
  const deadline = new Date(submittedAt)
  deadline.setDate(deadline.getDate() + CCPA_DEADLINE_DAYS)
  return deadline
}

/**
 * Calculate an extended deadline (original deadline + 45 days)
 */
export function calculateExtendedDeadline(originalDeadline: Date): Date {
  const extended = new Date(originalDeadline)
  extended.setDate(extended.getDate() + CCPA_EXTENSION_DAYS)
  return extended
}

/**
 * Calculate days until a deadline
 */
export function calculateDaysUntilDeadline(deadline: Date, now: Date = new Date()): number {
  const diffMs = deadline.getTime() - now.getTime()
  return Math.ceil(diffMs / DAY_MS)
}

/**
 * Determine alert severity based on days remaining
 */
export function getAlertSeverity(daysRemaining: number): AlertSeverity {
  if (daysRemaining <= 0) return 'error'
  if (daysRemaining <= ALERT_THRESHOLDS.critical) return 'error'
  if (daysRemaining <= ALERT_THRESHOLDS.urgent) return 'warning'
  if (daysRemaining <= ALERT_THRESHOLDS.warning) return 'info'
  return 'info'
}

/**
 * Determine the alert type key for deduplication
 */
export function getAlertTypeKey(daysRemaining: number): string {
  if (daysRemaining <= 0) return 'overdue'
  if (daysRemaining <= ALERT_THRESHOLDS.critical) return 'day1'
  if (daysRemaining <= ALERT_THRESHOLDS.urgent) return 'day3'
  if (daysRemaining <= ALERT_THRESHOLDS.warning) return 'day7'
  return 'none'
}

/**
 * Check if an alert should be sent (not already sent for this threshold)
 */
export function shouldSendAlert(daysRemaining: number, alertHistory: string[]): boolean {
  const alertKey = getAlertTypeKey(daysRemaining)
  if (alertKey === 'none') return false
  return !alertHistory.includes(alertKey)
}

/**
 * Parse alert history from request metadata
 */
function parseAlertHistory(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== 'object') return []
  const meta = metadata as Record<string, unknown>
  const history = meta.deadline_alerts
  if (!Array.isArray(history)) return []
  return history.filter((h): h is string => typeof h === 'string')
}

/**
 * Get all active CCPA requests with deadline information
 */
export async function getActiveRequestsWithDeadlines(
  supabase: DbClient
): Promise<DeadlineStatus[]> {
  const { data, error } = await supabase
    .schema('core')
    .from('ccpa_requests')
    .select(`
      id,
      user_id,
      request_type,
      status,
      submitted_at,
      deadline_at,
      extended_deadline_at,
      metadata
    `)
    .in('status', ['pending', 'in_progress'])
    .order('deadline_at', { ascending: true })

  if (error) {
    console.error('[deadline-tracker] Failed to fetch requests:', error)
    return []
  }

  const now = new Date()
  const requests: DeadlineStatus[] = []

  for (const row of data ?? []) {
    const submittedAt = new Date(row.submitted_at)
    const deadline = new Date(row.deadline_at)
    const extendedDeadline = row.extended_deadline_at
      ? new Date(row.extended_deadline_at)
      : null
    const effectiveDeadline = extendedDeadline ?? deadline
    const daysRemaining = calculateDaysUntilDeadline(effectiveDeadline, now)
    const alertHistory = parseAlertHistory(row.metadata)

    requests.push({
      requestId: row.id,
      userId: row.user_id,
      userEmail: null, // Would need join to get email
      requestType: row.request_type,
      status: row.status,
      submittedAt,
      deadline,
      extendedDeadline,
      effectiveDeadline,
      daysRemaining,
      isOverdue: daysRemaining < 0,
      isAtRisk: daysRemaining <= ALERT_THRESHOLDS.warning && daysRemaining > 0,
      alertHistory,
    })
  }

  return requests
}

/**
 * Get requests that need alerts
 */
export async function getRequestsNeedingAlerts(
  supabase: DbClient
): Promise<DeadlineStatus[]> {
  const requests = await getActiveRequestsWithDeadlines(supabase)

  return requests.filter((r) => {
    const alertKey = getAlertTypeKey(r.daysRemaining)
    // Need alert if: within threshold AND not already sent
    return alertKey !== 'none' && !r.alertHistory.includes(alertKey)
  })
}

/**
 * Send a deadline alert notification
 */
export async function sendDeadlineAlert(
  supabase: DbClient,
  request: DeadlineStatus,
  adminUserId: string
): Promise<AlertResult> {
  const alertKey = getAlertTypeKey(request.daysRemaining)
  const severity = getAlertSeverity(request.daysRemaining)

  let title: string
  let message: string

  if (request.isOverdue) {
    const overdueBy = Math.abs(request.daysRemaining)
    title = `CCPA Request Overdue - ${request.requestType.toUpperCase()}`
    message = `URGENT: CCPA ${request.requestType} request (${request.requestId.slice(0, 8)}) is ${overdueBy} day${overdueBy > 1 ? 's' : ''} overdue. Immediate action required to avoid regulatory penalties.`
  } else if (request.daysRemaining <= ALERT_THRESHOLDS.critical) {
    title = `CCPA Deadline Tomorrow - ${request.requestType.toUpperCase()}`
    message = `CRITICAL: CCPA ${request.requestType} request (${request.requestId.slice(0, 8)}) deadline is tomorrow. Complete processing immediately.`
  } else if (request.daysRemaining <= ALERT_THRESHOLDS.urgent) {
    title = `CCPA Deadline in ${request.daysRemaining} Days`
    message = `URGENT: CCPA ${request.requestType} request (${request.requestId.slice(0, 8)}) deadline is in ${request.daysRemaining} days. Prioritize completion.`
  } else {
    title = `CCPA Deadline Reminder - ${request.daysRemaining} Days`
    message = `CCPA ${request.requestType} request (${request.requestId.slice(0, 8)}) deadline is in ${request.daysRemaining} days. Please review and process.`
  }

  try {
    // Send notification to admin
    await insertNotification(
      supabase,
      {
        user_id: adminUserId,
        title,
        message,
        type: 'ccpa_deadline_alert' as any,
        severity: severity as any,
        metadata: {
          request_id: request.requestId,
          request_type: request.requestType,
          days_remaining: request.daysRemaining,
          deadline: request.effectiveDeadline.toISOString(),
          alert_type: alertKey,
        },
        cta_label: 'View Request',
        cta_url: `/office/privacy?request=${request.requestId}`,
      },
      `ccpa_deadline_${request.requestId}_${alertKey}`
    )

    // Record alert in request history
    await supabase
      .schema('core')
      .from('ccpa_request_history')
      .insert({
        request_id: request.requestId,
        status: request.status,
        notes: `Deadline alert sent: ${alertKey} (${request.daysRemaining} days remaining)`,
      })

    // Update request metadata with alert history
    const updatedAlerts = [...request.alertHistory, alertKey]
    await supabase
      .schema('core')
      .from('ccpa_requests')
      .update({
        metadata: {
          ...(typeof request.alertHistory === 'object' ? {} : {}),
          deadline_alerts: updatedAlerts,
        },
      })
      .eq('id', request.requestId)

    return {
      requestId: request.requestId,
      alertType: alertKey,
      severity,
      sent: true,
    }
  } catch (error) {
    return {
      requestId: request.requestId,
      alertType: alertKey,
      severity,
      sent: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get deadline metrics for admin dashboard
 */
export async function getDeadlineMetrics(supabase: DbClient): Promise<{
  total: number
  onTime: number
  atRisk: number
  overdue: number
  avgDaysRemaining: number
  upcomingDeadlines: Array<{
    requestId: string
    requestType: string
    daysRemaining: number
    deadline: string
  }>
}> {
  const requests = await getActiveRequestsWithDeadlines(supabase)

  const onTime = requests.filter((r) => r.daysRemaining > ALERT_THRESHOLDS.warning).length
  const atRisk = requests.filter(
    (r) => r.daysRemaining <= ALERT_THRESHOLDS.warning && r.daysRemaining > 0
  ).length
  const overdue = requests.filter((r) => r.isOverdue).length

  const totalDays = requests.reduce((sum, r) => sum + Math.max(0, r.daysRemaining), 0)
  const avgDaysRemaining = requests.length > 0 ? Math.round(totalDays / requests.length) : 0

  // Get upcoming 5 deadlines
  const upcomingDeadlines = requests
    .filter((r) => !r.isOverdue)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5)
    .map((r) => ({
      requestId: r.requestId,
      requestType: r.requestType,
      daysRemaining: r.daysRemaining,
      deadline: r.effectiveDeadline.toISOString(),
    }))

  return {
    total: requests.length,
    onTime,
    atRisk,
    overdue,
    avgDaysRemaining,
    upcomingDeadlines,
  }
}

/**
 * Run the deadline check and send alerts
 * This is the main function called by the cron job
 */
export async function runDeadlineCheck(adminUserId: string): Promise<{
  checked: number
  alertsSent: number
  errors: number
  details: AlertResult[]
}> {
  const supabase = createServiceSupabaseClient()

  const requestsNeedingAlerts = await getRequestsNeedingAlerts(supabase)

  const results: AlertResult[] = []

  for (const request of requestsNeedingAlerts) {
    const result = await sendDeadlineAlert(supabase, request, adminUserId)
    results.push(result)
  }

  return {
    checked: requestsNeedingAlerts.length,
    alertsSent: results.filter((r) => r.sent).length,
    errors: results.filter((r) => !r.sent).length,
    details: results,
  }
}
