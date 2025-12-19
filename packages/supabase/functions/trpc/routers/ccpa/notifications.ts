/**
 * CCPA Notification Service
 *
 * Integrates with the platform notification system to send
 * CCPA-specific notifications via email, SMS, and in-app channels.
 *
 * Notification events:
 * - Request submitted confirmation
 * - Identity verification required
 * - Request acknowledged (processing started)
 * - Request completed (data ready for download)
 * - Deletion scheduled confirmation
 * - Deletion completed confirmation
 * - Opt-out confirmation
 * - Deadline reminder (approaching deadline)
 * - Request denied (with reason)
 * - Appeal received confirmation
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../_shared/database.types.ts'

type DbClient = SupabaseClient<Database>

// ========================================================
// CCPA NOTIFICATION TYPES
// ========================================================

/**
 * CCPA-specific notification types
 * These map to the platform notification system types
 */
export const CCPA_NOTIFICATION_TYPES = {
  REQUEST_SUBMITTED: 'ccpa.request_submitted',
  VERIFICATION_REQUIRED: 'ccpa.verification_required',
  REQUEST_ACKNOWLEDGED: 'ccpa.request_acknowledged',
  REQUEST_IN_PROGRESS: 'ccpa.request_in_progress',
  REQUEST_COMPLETED: 'ccpa.request_completed',
  DELETION_SCHEDULED: 'ccpa.deletion_scheduled',
  DELETION_COMPLETED: 'ccpa.deletion_completed',
  OPT_OUT_CONFIRMED: 'ccpa.opt_out_confirmed',
  OPT_IN_CONFIRMED: 'ccpa.opt_in_confirmed',
  DEADLINE_REMINDER: 'ccpa.deadline_reminder',
  DEADLINE_EXTENDED: 'ccpa.deadline_extended',
  REQUEST_DENIED: 'ccpa.request_denied',
  APPEAL_RECEIVED: 'ccpa.appeal_received',
  EXPORT_READY: 'ccpa.export_ready',
  EXPORT_EXPIRING: 'ccpa.export_expiring',
} as const

export type CCPANotificationType = (typeof CCPA_NOTIFICATION_TYPES)[keyof typeof CCPA_NOTIFICATION_TYPES]

/**
 * Request types for human-readable display
 */
const REQUEST_TYPE_LABELS: Record<string, string> = {
  access: 'Data Access',
  deletion: 'Data Deletion',
  correction: 'Data Correction',
  portability: 'Data Portability',
  opt_out: 'Opt-Out',
  opt_in: 'Opt-In',
}

/**
 * Notification configuration
 */
export const NOTIFICATION_CONFIG = {
  /** Default sender name for emails */
  FROM_NAME: 'Scaffald Privacy Team',

  /** Support email for privacy inquiries */
  SUPPORT_EMAIL: 'privacy@scaffald.com',

  /** Days before deadline to send reminder */
  DEADLINE_REMINDER_DAYS: [7, 3, 1],

  /** Hours before export expiry to send reminder */
  EXPORT_EXPIRY_REMINDER_HOURS: 4,
} as const

// ========================================================
// NOTIFICATION INTERFACES
// ========================================================

/**
 * CCPA request info for notifications
 */
export interface CCPARequestInfo {
  requestId: string
  requestType: string
  userId: string
  userEmail: string
  userName?: string
  deadline?: string
  status?: string
}

/**
 * Notification result
 */
export interface NotificationResult {
  success: boolean
  notificationId?: string
  error?: string
}

// ========================================================
// NOTIFICATION TEMPLATES
// ========================================================

/**
 * Get notification content for a CCPA event
 */
function getNotificationContent(
  type: CCPANotificationType,
  request: CCPARequestInfo,
  additionalData?: Record<string, unknown>
): {
  title: string
  message: string
  emailSubject: string
  emailBody: string
  ctaText?: string
  ctaUrl?: string
} {
  const requestTypeLabel = REQUEST_TYPE_LABELS[request.requestType] ?? request.requestType
  const baseUrl = Deno.env.get('PUBLIC_APP_URL') ?? 'https://scaffald.com'
  const privacyDashboardUrl = `${baseUrl}/settings/privacy`
  const requestUrl = `${baseUrl}/settings/privacy/requests/${request.requestId}`

  switch (type) {
    case CCPA_NOTIFICATION_TYPES.REQUEST_SUBMITTED:
      return {
        title: 'Privacy Request Submitted',
        message: `Your ${requestTypeLabel} request has been submitted and is being reviewed.`,
        emailSubject: `Your ${requestTypeLabel} Request Has Been Received`,
        emailBody: `
Dear ${request.userName ?? 'User'},

Thank you for submitting your ${requestTypeLabel} request under the California Consumer Privacy Act (CCPA).

**Request ID:** ${request.requestId.slice(0, 8).toUpperCase()}
**Request Type:** ${requestTypeLabel}
**Submitted:** ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}

**What happens next:**
1. We will verify your identity within 10 business days
2. Once verified, we will process your request
3. You will receive updates on your request status

**Timeline:** Under CCPA, we will respond to your request within 45 calendar days.${request.deadline ? ` Your request deadline is ${new Date(request.deadline).toLocaleDateString('en-US', { dateStyle: 'long' })}.` : ''}

You can track your request status at any time by visiting your Privacy Dashboard.

If you have questions, contact us at ${NOTIFICATION_CONFIG.SUPPORT_EMAIL}.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'View Request Status',
        ctaUrl: requestUrl,
      }

    case CCPA_NOTIFICATION_TYPES.VERIFICATION_REQUIRED:
      return {
        title: 'Identity Verification Required',
        message: 'Please verify your identity to proceed with your privacy request.',
        emailSubject: 'Action Required: Verify Your Identity',
        emailBody: `
Dear ${request.userName ?? 'User'},

To protect your privacy and ensure your data is only shared with you, we need to verify your identity before processing your ${requestTypeLabel} request.

**Request ID:** ${request.requestId.slice(0, 8).toUpperCase()}

**Action Required:**
Please click the button below to complete identity verification. This typically takes less than 5 minutes.

**Important:** Your request will be placed on hold until verification is complete. The CCPA deadline will resume once your identity is verified.

If you have questions or need assistance, contact us at ${NOTIFICATION_CONFIG.SUPPORT_EMAIL}.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'Verify Identity',
        ctaUrl: `${requestUrl}?action=verify`,
      }

    case CCPA_NOTIFICATION_TYPES.REQUEST_ACKNOWLEDGED:
      return {
        title: 'Privacy Request Acknowledged',
        message: `Your ${requestTypeLabel} request is now being processed.`,
        emailSubject: `Your ${requestTypeLabel} Request Is Being Processed`,
        emailBody: `
Dear ${request.userName ?? 'User'},

Good news! Your identity has been verified and your ${requestTypeLabel} request is now being processed.

**Request ID:** ${request.requestId.slice(0, 8).toUpperCase()}
**Status:** In Progress
${request.deadline ? `**Expected Completion:** By ${new Date(request.deadline).toLocaleDateString('en-US', { dateStyle: 'long' })}` : ''}

We will notify you when your request is complete.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'View Request Status',
        ctaUrl: requestUrl,
      }

    case CCPA_NOTIFICATION_TYPES.REQUEST_COMPLETED:
      return {
        title: 'Privacy Request Completed',
        message: `Your ${requestTypeLabel} request has been completed.`,
        emailSubject: `Your ${requestTypeLabel} Request Is Complete`,
        emailBody: `
Dear ${request.userName ?? 'User'},

Your ${requestTypeLabel} request has been completed successfully.

**Request ID:** ${request.requestId.slice(0, 8).toUpperCase()}
**Completed:** ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}

${request.requestType === 'access' || request.requestType === 'portability' ? `
**Your Data Export:**
Your data export is now available for download. Please note:
- The download link will expire in 24 hours
- You can download your data up to 3 times
- For security, only you can access this download

Click the button below to download your data.
` : ''}

Thank you for using Scaffald. If you have any questions, contact us at ${NOTIFICATION_CONFIG.SUPPORT_EMAIL}.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: request.requestType === 'access' || request.requestType === 'portability'
          ? 'Download Your Data'
          : 'View Request Details',
        ctaUrl: requestUrl,
      }

    case CCPA_NOTIFICATION_TYPES.DELETION_SCHEDULED:
      return {
        title: 'Data Deletion Scheduled',
        message: 'Your data deletion has been scheduled and will be completed within the required timeframe.',
        emailSubject: 'Your Data Deletion Has Been Scheduled',
        emailBody: `
Dear ${request.userName ?? 'User'},

Your data deletion request has been scheduled.

**Request ID:** ${request.requestId.slice(0, 8).toUpperCase()}
${additionalData?.scheduledDate ? `**Scheduled Deletion Date:** ${new Date(additionalData.scheduledDate as string).toLocaleDateString('en-US', { dateStyle: 'long' })}` : ''}

**What will be deleted:**
- Personal information (name, email, phone, address)
- Professional information (resume, skills, work history)
- Usage data (profile views, applications, saved jobs)
- Communications (reviews, feedback)

**What will be retained:**
${additionalData?.retainedCategories && Array.isArray(additionalData.retainedCategories)
  ? (additionalData.retainedCategories as Array<{ category: string; reason: string }>).map(item => `- ${item.category}: ${item.reason}`).join('\n')
  : '- Any data required by law or for legitimate business purposes will be retained as required.'}

**Important:** This action cannot be undone. If you wish to cancel this request, please do so before the scheduled deletion date.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'View Request Details',
        ctaUrl: requestUrl,
      }

    case CCPA_NOTIFICATION_TYPES.DELETION_COMPLETED:
      return {
        title: 'Data Deletion Completed',
        message: 'Your personal data has been permanently deleted from our systems.',
        emailSubject: 'Your Data Has Been Deleted',
        emailBody: `
Dear ${request.userName ?? 'User'},

Your data deletion request has been completed.

**Request ID:** ${request.requestId.slice(0, 8).toUpperCase()}
**Completed:** ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}

Your personal data has been permanently deleted from our systems in accordance with your request and the California Consumer Privacy Act (CCPA).

**Deleted data includes:**
${additionalData?.deletedCategories && Array.isArray(additionalData.deletedCategories)
  ? (additionalData.deletedCategories as string[]).map(cat => `- ${cat}`).join('\n')
  : '- All personal information as requested'}

**Retained data (if any):**
${additionalData?.retainedCategories && Array.isArray(additionalData.retainedCategories)
  ? (additionalData.retainedCategories as Array<{ category: string; reason: string }>).map(item => `- ${item.category}: ${item.reason}`).join('\n')
  : '- Any legally required records'}

If you have questions about this deletion, contact us at ${NOTIFICATION_CONFIG.SUPPORT_EMAIL}.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'Visit Scaffald',
        ctaUrl: baseUrl,
      }

    case CCPA_NOTIFICATION_TYPES.OPT_OUT_CONFIRMED:
      return {
        title: 'Opt-Out Confirmed',
        message: 'Your opt-out preferences have been updated.',
        emailSubject: 'Your Opt-Out Preferences Have Been Confirmed',
        emailBody: `
Dear ${request.userName ?? 'User'},

Your opt-out preferences have been updated.

**Effective immediately, we will NOT:**
${additionalData?.categories && Array.isArray(additionalData.categories)
  ? (additionalData.categories as string[]).map(cat => {
      const labels: Record<string, string> = {
        sale: 'Sell your personal information',
        sharing: 'Share your personal information with third parties',
        targeted_advertising: 'Use your data for targeted advertising',
        profiling: 'Use automated profiling for decision-making',
      }
      return `- ${labels[cat] ?? cat}`
    }).join('\n')
  : '- Process your data in the ways you opted out of'}

You can change your preferences at any time through your Privacy Dashboard.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'Manage Privacy Settings',
        ctaUrl: privacyDashboardUrl,
      }

    case CCPA_NOTIFICATION_TYPES.OPT_IN_CONFIRMED:
      return {
        title: 'Opt-In Confirmed',
        message: 'Your opt-in preferences have been updated.',
        emailSubject: 'Your Privacy Preferences Have Been Updated',
        emailBody: `
Dear ${request.userName ?? 'User'},

Your privacy preferences have been updated.

You have chosen to allow:
${additionalData?.categories && Array.isArray(additionalData.categories)
  ? (additionalData.categories as string[]).map(cat => {
      const labels: Record<string, string> = {
        sale: 'Sale of personal information',
        sharing: 'Sharing personal information with third parties',
        targeted_advertising: 'Targeted advertising',
        profiling: 'Automated profiling',
      }
      return `- ${labels[cat] ?? cat}`
    }).join('\n')
  : '- Data processing as selected'}

You can change your preferences at any time through your Privacy Dashboard.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'Manage Privacy Settings',
        ctaUrl: privacyDashboardUrl,
      }

    case CCPA_NOTIFICATION_TYPES.DEADLINE_REMINDER: {
      const daysRemaining = additionalData?.daysRemaining as number | undefined
      return {
        title: 'Privacy Request Deadline Approaching',
        message: `Your ${requestTypeLabel} request deadline is in ${daysRemaining ?? 'a few'} days.`,
        emailSubject: `Action Needed: ${requestTypeLabel} Request Deadline in ${daysRemaining ?? 'a few'} Days`,
        emailBody: `
Dear ${request.userName ?? 'User'},

This is a reminder that the deadline for your ${requestTypeLabel} request is approaching.

**Request ID:** ${request.requestId.slice(0, 8).toUpperCase()}
${request.deadline ? `**Deadline:** ${new Date(request.deadline).toLocaleDateString('en-US', { dateStyle: 'long' })}` : ''}
**Days Remaining:** ${daysRemaining ?? 'A few'}

${additionalData?.actionRequired
  ? `**Action Required:** ${additionalData.actionRequired}`
  : 'No action is required from you at this time. We are working on your request.'}

If you have questions, contact us at ${NOTIFICATION_CONFIG.SUPPORT_EMAIL}.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'View Request Status',
        ctaUrl: requestUrl,
      }
    }

    case CCPA_NOTIFICATION_TYPES.REQUEST_DENIED:
      return {
        title: 'Privacy Request Denied',
        message: `Your ${requestTypeLabel} request could not be processed.`,
        emailSubject: `Update on Your ${requestTypeLabel} Request`,
        emailBody: `
Dear ${request.userName ?? 'User'},

We regret to inform you that your ${requestTypeLabel} request could not be processed at this time.

**Request ID:** ${request.requestId.slice(0, 8).toUpperCase()}

**Reason:**
${additionalData?.reason ?? 'Please contact us for more information.'}

**Your Rights:**
You have the right to appeal this decision. To file an appeal, please contact us at ${NOTIFICATION_CONFIG.SUPPORT_EMAIL} or visit your Privacy Dashboard.

We apologize for any inconvenience this may cause.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'File an Appeal',
        ctaUrl: `${requestUrl}?action=appeal`,
      }

    case CCPA_NOTIFICATION_TYPES.EXPORT_READY:
      return {
        title: 'Your Data Export is Ready',
        message: 'Your data export is ready for download.',
        emailSubject: 'Your Data Export is Ready to Download',
        emailBody: `
Dear ${request.userName ?? 'User'},

Your data export is ready for download.

**Request ID:** ${request.requestId.slice(0, 8).toUpperCase()}

**Download Information:**
- Link expires in: 24 hours
- Maximum downloads: 3
- Format: ${additionalData?.format ?? 'PDF'}
${additionalData?.fileSize ? `- File size: ${additionalData.fileSize}` : ''}

For your security, please download your data soon and store it in a secure location.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'Download Your Data',
        ctaUrl: requestUrl,
      }

    case CCPA_NOTIFICATION_TYPES.EXPORT_EXPIRING:
      return {
        title: 'Data Export Expiring Soon',
        message: 'Your data export will expire soon. Download it now.',
        emailSubject: 'Reminder: Your Data Export Will Expire Soon',
        emailBody: `
Dear ${request.userName ?? 'User'},

Your data export will expire in ${additionalData?.hoursRemaining ?? 4} hours.

**Request ID:** ${request.requestId.slice(0, 8).toUpperCase()}
**Downloads remaining:** ${additionalData?.downloadsRemaining ?? 'Unknown'}

Please download your data before it expires. After expiration, you will need to submit a new request.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'Download Now',
        ctaUrl: requestUrl,
      }

    default:
      return {
        title: 'Privacy Request Update',
        message: 'There is an update to your privacy request.',
        emailSubject: 'Update on Your Privacy Request',
        emailBody: `
Dear ${request.userName ?? 'User'},

There is an update to your privacy request.

**Request ID:** ${request.requestId.slice(0, 8).toUpperCase()}

Please visit your Privacy Dashboard for more details.

Best regards,
${NOTIFICATION_CONFIG.FROM_NAME}
        `.trim(),
        ctaText: 'View Request',
        ctaUrl: requestUrl,
      }
  }
}

// ========================================================
// NOTIFICATION FUNCTIONS
// ========================================================

/**
 * Send a CCPA notification
 *
 * Creates a notification record and queues it for delivery
 * via the platform notification system.
 */
export async function sendCCPANotification(
  supabase: DbClient,
  type: CCPANotificationType,
  request: CCPARequestInfo,
  additionalData?: Record<string, unknown>
): Promise<NotificationResult> {
  try {
    const content = getNotificationContent(type, request, additionalData)

    // Create the notification record
    const { data: notification, error: insertError } = await supabase
      .schema('core')
      .from('notifications')
      .insert({
        user_id: request.userId,
        type: type,
        severity: getSeverityForType(type),
        title: content.title,
        message: content.message,
        body: content.emailBody,
        metadata: {
          requestId: request.requestId,
          requestType: request.requestType,
          emailSubject: content.emailSubject,
          ...additionalData,
        },
        cta_text: content.ctaText,
        cta_url: content.ctaUrl,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[ccpa-notifications] Failed to create notification:', insertError)
      return {
        success: false,
        error: insertError.message,
      }
    }

    // Queue for email delivery
    const { error: deliveryError } = await supabase
      .schema('core')
      .from('notification_deliveries')
      .insert({
        notification_id: notification.id,
        channel: 'email',
        status: 'queued',
        delivery_metadata: {
          email: request.userEmail,
          emailSubject: content.emailSubject,
          emailBody: content.emailBody,
        },
      })

    if (deliveryError) {
      console.warn('[ccpa-notifications] Failed to queue email delivery:', deliveryError)
      // Don't fail the whole notification - in-app will still work
    }

    console.log(`[ccpa-notifications] Sent ${type} notification for request ${request.requestId}`)

    return {
      success: true,
      notificationId: notification.id,
    }
  } catch (error) {
    console.error('[ccpa-notifications] Error sending notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get severity level for notification type
 */
function getSeverityForType(type: CCPANotificationType): 'info' | 'important' | 'critical' {
  switch (type) {
    case CCPA_NOTIFICATION_TYPES.VERIFICATION_REQUIRED:
    case CCPA_NOTIFICATION_TYPES.DEADLINE_REMINDER:
    case CCPA_NOTIFICATION_TYPES.REQUEST_DENIED:
    case CCPA_NOTIFICATION_TYPES.EXPORT_EXPIRING:
      return 'important'

    case CCPA_NOTIFICATION_TYPES.DELETION_COMPLETED:
      return 'critical'

    default:
      return 'info'
  }
}

// ========================================================
// CONVENIENCE FUNCTIONS
// ========================================================

/**
 * Send request submitted notification
 */
export async function notifyRequestSubmitted(
  supabase: DbClient,
  request: CCPARequestInfo
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.REQUEST_SUBMITTED,
    request
  )
}

/**
 * Send verification required notification
 */
export async function notifyVerificationRequired(
  supabase: DbClient,
  request: CCPARequestInfo
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.VERIFICATION_REQUIRED,
    request
  )
}

/**
 * Send request acknowledged notification
 */
export async function notifyRequestAcknowledged(
  supabase: DbClient,
  request: CCPARequestInfo
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.REQUEST_ACKNOWLEDGED,
    request
  )
}

/**
 * Send request completed notification
 */
export async function notifyRequestCompleted(
  supabase: DbClient,
  request: CCPARequestInfo,
  additionalData?: Record<string, unknown>
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.REQUEST_COMPLETED,
    request,
    additionalData
  )
}

/**
 * Send deletion scheduled notification
 */
export async function notifyDeletionScheduled(
  supabase: DbClient,
  request: CCPARequestInfo,
  scheduledDate: string,
  retainedCategories?: Array<{ category: string; reason: string }>
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.DELETION_SCHEDULED,
    request,
    { scheduledDate, retainedCategories }
  )
}

/**
 * Send deletion completed notification
 */
export async function notifyDeletionCompleted(
  supabase: DbClient,
  request: CCPARequestInfo,
  deletedCategories: string[],
  retainedCategories?: Array<{ category: string; reason: string }>
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.DELETION_COMPLETED,
    request,
    { deletedCategories, retainedCategories }
  )
}

/**
 * Send opt-out confirmed notification
 */
export async function notifyOptOutConfirmed(
  supabase: DbClient,
  request: CCPARequestInfo,
  categories: string[]
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.OPT_OUT_CONFIRMED,
    request,
    { categories }
  )
}

/**
 * Send opt-in confirmed notification
 */
export async function notifyOptInConfirmed(
  supabase: DbClient,
  request: CCPARequestInfo,
  categories: string[]
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.OPT_IN_CONFIRMED,
    request,
    { categories }
  )
}

/**
 * Send deadline reminder notification
 */
export async function notifyDeadlineReminder(
  supabase: DbClient,
  request: CCPARequestInfo,
  daysRemaining: number,
  actionRequired?: string
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.DEADLINE_REMINDER,
    request,
    { daysRemaining, actionRequired }
  )
}

/**
 * Send request denied notification
 */
export async function notifyRequestDenied(
  supabase: DbClient,
  request: CCPARequestInfo,
  reason: string
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.REQUEST_DENIED,
    request,
    { reason }
  )
}

/**
 * Send export ready notification
 */
export async function notifyExportReady(
  supabase: DbClient,
  request: CCPARequestInfo,
  format: string,
  fileSize?: string
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.EXPORT_READY,
    request,
    { format, fileSize }
  )
}

/**
 * Send export expiring notification
 */
export async function notifyExportExpiring(
  supabase: DbClient,
  request: CCPARequestInfo,
  hoursRemaining: number,
  downloadsRemaining: number
): Promise<NotificationResult> {
  return sendCCPANotification(
    supabase,
    CCPA_NOTIFICATION_TYPES.EXPORT_EXPIRING,
    request,
    { hoursRemaining, downloadsRemaining }
  )
}

// ========================================================
// BATCH NOTIFICATION FUNCTIONS
// ========================================================

/**
 * Send deadline reminders for all requests approaching deadline
 *
 * This function should be called periodically (e.g., daily cron job)
 * to send reminders for requests approaching their deadline.
 */
export async function sendDeadlineReminders(
  supabase: DbClient
): Promise<{
  success: boolean
  sent: number
  errors: Array<{ requestId: string; error: string }>
}> {
  const errors: Array<{ requestId: string; error: string }> = []
  let sent = 0

  try {
    const now = new Date()

    // Check each reminder interval
    for (const daysAhead of NOTIFICATION_CONFIG.DEADLINE_REMINDER_DAYS) {
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + daysAhead)

      // Find requests with deadlines on this target date
      const { data: requests, error: queryError } = await supabase
        .schema('core')
        .from('ccpa_requests')
        .select(`
          id,
          user_id,
          request_type,
          deadline,
          status,
          metadata
        `)
        .eq('status', 'in_progress')
        .gte('deadline', targetDate.toISOString().split('T')[0])
        .lt('deadline', new Date(targetDate.getTime() + 86400000).toISOString().split('T')[0])

      if (queryError) {
        console.error('[ccpa-notifications] Failed to query deadline reminders:', queryError)
        continue
      }

      if (!requests || requests.length === 0) {
        continue
      }

      // Send reminders for each request
      for (const request of requests) {
        // Get user email
        const { data: profile } = await supabase
          .schema('core')
          .from('profile')
          .select('email, first_name, last_name')
          .eq('id', request.user_id)
          .single()

        if (!profile?.email) {
          errors.push({
            requestId: request.id,
            error: 'User email not found',
          })
          continue
        }

        const result = await notifyDeadlineReminder(
          supabase,
          {
            requestId: request.id,
            requestType: request.request_type,
            userId: request.user_id,
            userEmail: profile.email,
            userName: profile.first_name
              ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
              : undefined,
            deadline: request.deadline ?? undefined,
          },
          daysAhead
        )

        if (result.success) {
          sent++
        } else {
          errors.push({
            requestId: request.id,
            error: result.error ?? 'Unknown error',
          })
        }
      }
    }

    return {
      success: errors.length === 0,
      sent,
      errors,
    }
  } catch (error) {
    console.error('[ccpa-notifications] Error sending deadline reminders:', error)
    return {
      success: false,
      sent,
      errors: [{
        requestId: 'batch',
        error: error instanceof Error ? error.message : 'Unknown error',
      }],
    }
  }
}
