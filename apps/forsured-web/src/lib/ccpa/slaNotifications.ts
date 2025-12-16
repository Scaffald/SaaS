/**
 * CCPA SLA Notification Service
 * REQ-6, TASK-12: SLA Notification System for CCPA Deadlines
 *
 * Handles SLA deadline monitoring and notification generation:
 * - Approaching deadline alerts (7 days, 3 days)
 * - Overdue request alerts
 * - Escalation notifications for long-overdue requests
 */

/**
 * SLA Warning Levels
 */
export type SLAWarningLevel = 'approaching' | 'urgent' | 'overdue' | 'escalated'

/**
 * SLA Warning Thresholds (in days)
 */
export const SLA_THRESHOLDS = {
  /** First warning at 7 days before deadline */
  APPROACHING: 7,
  /** Urgent warning at 3 days before deadline */
  URGENT: 3,
  /** Escalate to supervisor after 5 days overdue */
  ESCALATION: 5,
} as const

/**
 * CCPA Request for SLA checking
 */
export interface CCPASLARequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  type: 'access' | 'deletion' | 'correction' | 'portability' | 'opt_out' | 'opt_in'
  status: 'pending' | 'in_progress' | 'completed' | 'denied' | 'cancelled'
  submittedAt: string
  deadlineAt: string
  assignedTo?: string
  assignedEmail?: string
}

/**
 * SLA Alert for notification
 */
export interface SLAAlert {
  request: CCPASLARequest
  warningLevel: SLAWarningLevel
  daysRemaining: number
  message: string
}

/**
 * Calculate days remaining until deadline
 */
export function calculateDaysRemaining(deadlineAt: string): number {
  const deadline = new Date(deadlineAt)
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Determine SLA warning level based on days remaining
 */
export function getWarningLevel(daysRemaining: number): SLAWarningLevel | null {
  if (daysRemaining < -SLA_THRESHOLDS.ESCALATION) {
    return 'escalated'
  }
  if (daysRemaining < 0) {
    return 'overdue'
  }
  if (daysRemaining <= SLA_THRESHOLDS.URGENT) {
    return 'urgent'
  }
  if (daysRemaining <= SLA_THRESHOLDS.APPROACHING) {
    return 'approaching'
  }
  return null // No alert needed
}

/**
 * Generate SLA alert message
 */
export function generateAlertMessage(
  request: CCPASLARequest,
  warningLevel: SLAWarningLevel,
  daysRemaining: number
): string {
  const typeLabel = getRequestTypeLabel(request.type)
  const userInfo = `${request.userName} (${request.userEmail})`

  switch (warningLevel) {
    case 'escalated':
      return `ESCALATED: ${typeLabel} request from ${userInfo} is ${Math.abs(daysRemaining)} days overdue. Immediate action required.`
    case 'overdue':
      return `OVERDUE: ${typeLabel} request from ${userInfo} is ${Math.abs(daysRemaining)} days past deadline.`
    case 'urgent':
      return `URGENT: ${typeLabel} request from ${userInfo} is due in ${daysRemaining} days.`
    case 'approaching':
      return `WARNING: ${typeLabel} request from ${userInfo} is due in ${daysRemaining} days.`
    default:
      return `${typeLabel} request from ${userInfo} requires attention.`
  }
}

/**
 * Get human-readable request type label
 */
function getRequestTypeLabel(
  type: 'access' | 'deletion' | 'correction' | 'portability' | 'opt_out' | 'opt_in'
): string {
  const labels: Record<typeof type, string> = {
    access: 'Data Export',
    deletion: 'Deletion',
    correction: 'Correction',
    portability: 'Portability',
    opt_out: 'Opt Out',
    opt_in: 'Opt In',
  }
  return labels[type]
}

/**
 * Check requests for SLA alerts
 */
export function checkRequestsForAlerts(requests: CCPASLARequest[]): SLAAlert[] {
  const alerts: SLAAlert[] = []

  for (const request of requests) {
    // Skip completed or cancelled requests
    if (['completed', 'denied', 'cancelled'].includes(request.status)) {
      continue
    }

    const daysRemaining = calculateDaysRemaining(request.deadlineAt)
    const warningLevel = getWarningLevel(daysRemaining)

    if (warningLevel) {
      alerts.push({
        request,
        warningLevel,
        daysRemaining,
        message: generateAlertMessage(request, warningLevel, daysRemaining),
      })
    }
  }

  // Sort by urgency (most urgent first)
  return alerts.sort((a, b) => {
    const priorityOrder: Record<SLAWarningLevel, number> = {
      escalated: 0,
      overdue: 1,
      urgent: 2,
      approaching: 3,
    }
    return priorityOrder[a.warningLevel] - priorityOrder[b.warningLevel]
  })
}

/**
 * Group alerts by warning level for display
 */
export function groupAlertsByLevel(alerts: SLAAlert[]): Record<SLAWarningLevel, SLAAlert[]> {
  return alerts.reduce(
    (acc, alert) => {
      acc[alert.warningLevel].push(alert)
      return acc
    },
    {
      escalated: [],
      overdue: [],
      urgent: [],
      approaching: [],
    } as Record<SLAWarningLevel, SLAAlert[]>
  )
}

/**
 * Email template data for SLA notification
 */
export interface SLAEmailTemplateData {
  recipientName: string
  recipientEmail: string
  alerts: SLAAlert[]
  dashboardUrl: string
  unsubscribeUrl: string
}

/**
 * Generate email subject for SLA notification
 */
export function generateEmailSubject(alerts: SLAAlert[]): string {
  const overdueCount = alerts.filter(
    (a) => a.warningLevel === 'overdue' || a.warningLevel === 'escalated'
  ).length
  const urgentCount = alerts.filter((a) => a.warningLevel === 'urgent').length
  const approachingCount = alerts.filter((a) => a.warningLevel === 'approaching').length

  if (overdueCount > 0) {
    return `[ACTION REQUIRED] ${overdueCount} CCPA request${overdueCount > 1 ? 's' : ''} overdue`
  }
  if (urgentCount > 0) {
    return `[URGENT] ${urgentCount} CCPA request${urgentCount > 1 ? 's' : ''} due soon`
  }
  if (approachingCount > 0) {
    return `CCPA Deadline Reminder: ${approachingCount} request${approachingCount > 1 ? 's' : ''} approaching deadline`
  }
  return 'CCPA SLA Status Update'
}

/**
 * Generate plain text email body for SLA notification
 */
export function generateEmailBodyText(data: SLAEmailTemplateData): string {
  const { recipientName, alerts, dashboardUrl } = data

  let body = `Hello ${recipientName},\n\n`
  body += 'This is an automated notification about CCPA request deadlines.\n\n'

  const grouped = groupAlertsByLevel(alerts)

  if (grouped.escalated.length > 0) {
    body += '=== ESCALATED (Immediate Action Required) ===\n'
    for (const alert of grouped.escalated) {
      body += `- ${alert.message}\n`
    }
    body += '\n'
  }

  if (grouped.overdue.length > 0) {
    body += '=== OVERDUE ===\n'
    for (const alert of grouped.overdue) {
      body += `- ${alert.message}\n`
    }
    body += '\n'
  }

  if (grouped.urgent.length > 0) {
    body += '=== DUE SOON ===\n'
    for (const alert of grouped.urgent) {
      body += `- ${alert.message}\n`
    }
    body += '\n'
  }

  if (grouped.approaching.length > 0) {
    body += '=== APPROACHING DEADLINE ===\n'
    for (const alert of grouped.approaching) {
      body += `- ${alert.message}\n`
    }
    body += '\n'
  }

  body += `View all requests: ${dashboardUrl}\n\n`
  body += '---\n'
  body += 'This is an automated message from your CCPA Compliance System.\n'

  return body
}

/**
 * SLA Summary for dashboard banner
 */
export interface SLASummary {
  totalAlerts: number
  escalatedCount: number
  overdueCount: number
  urgentCount: number
  approachingCount: number
  mostUrgent: SLAAlert | null
}

/**
 * Generate SLA summary for dashboard display
 */
export function generateSLASummary(alerts: SLAAlert[]): SLASummary {
  const grouped = groupAlertsByLevel(alerts)

  return {
    totalAlerts: alerts.length,
    escalatedCount: grouped.escalated.length,
    overdueCount: grouped.overdue.length,
    urgentCount: grouped.urgent.length,
    approachingCount: grouped.approaching.length,
    mostUrgent: alerts[0] ?? null, // Already sorted by urgency
  }
}
