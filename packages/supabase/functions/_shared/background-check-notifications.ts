import { z } from 'zod'
import { backgroundCheckStatusEnum } from './background-check-schemas.ts'
import type { Json } from './database.types.ts'
import type {
  NotificationChannel,
  NotificationSeverity,
  NotificationSupabaseClient,
  NotificationType,
} from './notifications/types.ts'
import {
  enqueueDelivery,
  ensureChannelArray,
  getUserContacts,
  insertNotification,
} from './notifications/utils.ts'

type BackgroundCheckStatus = z.infer<typeof backgroundCheckStatusEnum>
type JsonRecord = Record<string, Json | undefined>

interface StatusTemplateContext {
  status: BackgroundCheckStatus
  packageName?: string | null
  summary?: string | null
  checkId?: string | null
}

type ExpirationReminderWindow = 30 | 7

interface ExpirationReminderPayload {
  supabase: NotificationSupabaseClient
  checkId: string
  workerId: string
  requesterId?: string | null
  packageName?: string | null
  expiresAt: string
  windowDays: ExpirationReminderWindow
  actorId?: string | null
}

function formatDateForReminder(date: Date): string {
  try {
    return date.toLocaleDateString('en-US', { dateStyle: 'medium' })
  } catch {
    return date.toISOString().split('T')[0] ?? date.toISOString()
  }
}

function buildReminderLines(
  audience: 'worker' | 'requester',
  windowDays: ExpirationReminderWindow,
  formattedDate: string,
  portalUrl: string,
  packageName?: string | null
): string[] {
  const base =
    audience === 'worker'
      ? `Your background check will expire in ${windowDays} days on ${formattedDate}.`
      : `A background check you requested will expire in ${windowDays} days on ${formattedDate}.`

  const lines: string[] = [base]

  if (packageName) {
    lines.push(`Package: ${packageName}`)
  }

  lines.push(`Review background check details: ${portalUrl}`)

  if (audience === 'worker') {
    lines.push(
      'Start a new background check from your dashboard to keep your verified status current.'
    )
  } else {
    lines.push(
      "Request a new background check now if continued access to the worker's results is required."
    )
  }

  if (windowDays === 7) {
    lines.push(
      'Need help? Reply to this email or contact support and our compliance team will assist.'
    )
  }

  return lines
}

export async function notifyBackgroundCheckExpirationReminder(
  payload: ExpirationReminderPayload
): Promise<void> {
  const { supabase, checkId, workerId, requesterId, packageName, expiresAt, windowDays, actorId } =
    payload

  const expiresDate = new Date(expiresAt)
  if (Number.isNaN(expiresDate.valueOf())) {
    console.warn('[background-checks] skip expiration reminder: invalid expires_at', {
      checkId,
      expiresAt,
    })
    return
  }

  const formattedDate = formatDateForReminder(expiresDate)
  const portalUrl = BACKGROUND_CHECK_DASHBOARD_URL
  const subject =
    windowDays === 30 ? 'Background Check Expires in 30 Days' : 'Background Check Expires in 7 Days'
  const dedupeBase = `bgcheck:${checkId}:expiration:${windowDays}`
  const reminderStatusTag = windowDays === 30 ? 'expiration_30_day' : 'expiration_7_day'

  let workerEmail: string | null = null
  try {
    const contacts = await getUserContacts(supabase, workerId)
    workerEmail = contacts.email ?? null
  } catch (error) {
    console.error(
      '[background-checks] failed to load worker contact details for expiration reminder',
      error
    )
  }

  const workerLines = buildReminderLines(
    'worker',
    windowDays,
    formattedDate,
    portalUrl,
    packageName
  )
  const workerChannels = buildNotificationChannels(Boolean(workerEmail))
  const workerTemplateData: JsonRecord = {
    subject,
    message: workerLines[0],
    windowDays,
    packageName: packageName ?? null,
    expiresAt: expiresDate.toISOString(),
    portalUrl,
    audience: 'worker',
  }

  const workerMetadata = {
    background_check_id: checkId,
    status: reminderStatusTag,
    packageName: packageName ?? null,
    actorId: actorId ?? null,
    portal_url: portalUrl,
    reminder_window_days: windowDays,
    expires_at: expiresDate.toISOString(),
  } satisfies Record<string, Json | undefined>

  try {
    const workerNotification = await insertNotification(
      supabase,
      {
        user_id: workerId,
        type: 'info',
        severity: 'important',
        title: subject,
        message: workerLines[0],
        preview: workerLines[0],
        body: {
          background_check_id: checkId,
          status: reminderStatusTag,
          audience: 'worker',
        },
        metadata: workerMetadata,
        routed_channels: workerChannels,
      },
      `${dedupeBase}:worker:${workerId}`
    )

    if (workerNotification && workerEmail) {
      try {
        await enqueueDelivery(supabase, workerNotification.id, 'email', 'sendgrid', {
          email: workerEmail,
          subject,
          text: workerLines.join('\n\n'),
          html: toHtmlParagraphs(workerLines),
          templateData: workerTemplateData,
        })
      } catch (error) {
        console.error('[background-checks] failed to queue worker expiration reminder email', error)
      }
    }
  } catch (error) {
    console.error(
      '[background-checks] failed to insert worker expiration reminder notification',
      error
    )
  }

  if (requesterId && requesterId !== workerId) {
    let requesterEmail: string | null = null
    try {
      const contacts = await getUserContacts(supabase, requesterId)
      requesterEmail = contacts.email ?? null
    } catch (error) {
      console.error(
        '[background-checks] failed to load requester contact details for expiration reminder',
        error
      )
    }

    const requesterLines = buildReminderLines(
      'requester',
      windowDays,
      formattedDate,
      portalUrl,
      packageName
    )
    const requesterChannels = buildNotificationChannels(Boolean(requesterEmail))
    const requesterTemplateData: JsonRecord = {
      subject,
      message: requesterLines[0],
      windowDays,
      packageName: packageName ?? null,
      expiresAt: expiresDate.toISOString(),
      portalUrl,
      audience: 'requester',
    }

    const requesterMetadata = {
      background_check_id: checkId,
      status: reminderStatusTag,
      packageName: packageName ?? null,
      actorId: actorId ?? null,
      portal_url: portalUrl,
      reminder_window_days: windowDays,
      expires_at: expiresDate.toISOString(),
      workerId,
    } satisfies Record<string, Json | undefined>

    try {
      const requesterNotification = await insertNotification(
        supabase,
        {
          user_id: requesterId,
          type: 'info',
          severity: 'important',
          title: subject,
          message: requesterLines[0],
          preview: requesterLines[0],
          body: {
            background_check_id: checkId,
            status: reminderStatusTag,
            audience: 'requester',
          },
          metadata: requesterMetadata,
          routed_channels: requesterChannels,
        },
        `${dedupeBase}:requester:${requesterId}`
      )

      if (requesterNotification && requesterEmail) {
        try {
          await enqueueDelivery(supabase, requesterNotification.id, 'email', 'sendgrid', {
            email: requesterEmail,
            subject,
            text: requesterLines.join('\n\n'),
            html: toHtmlParagraphs(requesterLines),
            templateData: requesterTemplateData,
          })
        } catch (error) {
          console.error(
            '[background-checks] failed to queue requester expiration reminder email',
            error
          )
        }
      }
    } catch (error) {
      console.error(
        '[background-checks] failed to insert requester expiration reminder notification',
        error
      )
    }
  }
}

interface StatusTemplate {
  type: NotificationType
  severity: NotificationSeverity
  workerTitle: string
  workerMessage: (ctx: StatusTemplateContext) => string
  requesterTitle?: string
  requesterMessage?: (ctx: StatusTemplateContext) => string
}

const COMPLETION_STATUSES = new Set<BackgroundCheckStatus>([
  'completed_clear',
  'completed_consider',
  'completed_not_clear',
  'partially_completed',
])

const NEGATIVE_STATUSES = new Set<BackgroundCheckStatus>([
  'failed',
  'cancelled',
  'disputed',
  'expired',
  'refunded',
])

const _IN_APP_ONLY = ['in_app'] as const

const SUMMARY_OF_RIGHTS_URL =
  'https://files.consumerfinance.gov/f/201504_cfpb_summary_your-rights-under-fcra.pdf'
const BACKGROUND_CHECK_PORTAL_PATH = '/dashboard/profile/background-check'
const DISPUTE_RESPONSE_DAYS = 5

const WORKER_EMAIL_STATUSES = new Set<BackgroundCheckStatus>([
  'invited',
  'completed_consider',
  'completed_not_clear',
  'failed',
  'disputed',
  'expired',
])

const REQUESTER_EMAIL_STATUSES = new Set<BackgroundCheckStatus>([
  'invited',
  'completed_consider',
  'completed_not_clear',
  'failed',
  'disputed',
  'expired',
])

const ADVERSE_NOTICE_STATUSES = new Set<BackgroundCheckStatus>([
  'completed_consider',
  'completed_not_clear',
  'failed',
])

function getEnvValue(key: string): string | undefined {
  if (typeof Deno !== 'undefined' && typeof Deno.env?.get === 'function') {
    try {
      const value = Deno.env.get(key)
      if (value) return value
    } catch {
      // Ignore Deno env access errors (e.g., in tests)
    }
  }

  const globalProcess = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> }
    }
  ).process

  if (globalProcess?.env) {
    const value = globalProcess.env[key]
    if (value) return value
  }

  return undefined
}

function resolveAppBaseUrl(): string {
  return (
    getEnvValue('EXPO_PUBLIC_URL') ??
    getEnvValue('SUPABASE_SITE_URL') ??
    getEnvValue('SITE_URL') ??
    'https://app.scaffald.com'
  )
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const APP_BASE_URL = normalizeBaseUrl(resolveAppBaseUrl())
const BACKGROUND_CHECK_DASHBOARD_URL = `${APP_BASE_URL}${BACKGROUND_CHECK_PORTAL_PATH}`

interface EmailPayload {
  subject: string
  text: string
  html: string
  templateData: JsonRecord
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toHtmlParagraphs(lines: string[]): string {
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')
}

function composeEmailContent(
  status: BackgroundCheckStatus,
  ctx: StatusTemplateContext,
  audience: 'worker' | 'requester'
): EmailPayload | null {
  const template = buildStatusMessage(audience, ctx)
  if (!template) {
    return null
  }

  const subject =
    audience === 'worker' ? template.workerTitle : (template.requesterTitle ?? template.workerTitle)
  const baseMessage =
    audience === 'worker'
      ? template.workerMessage(ctx)
      : (template.requesterMessage?.(ctx) ?? template.workerMessage(ctx))

  const lines: string[] = [baseMessage]

  if (ctx.packageName) {
    lines.push(`Package: ${ctx.packageName}`)
  }

  if (ctx.summary) {
    lines.push(`Notes: ${ctx.summary}`)
  }

  if (ctx.checkId) {
    lines.push(`Reference ID: ${ctx.checkId}`)
  }

  const portalLine =
    audience === 'worker'
      ? `Review your background check dashboard: ${BACKGROUND_CHECK_DASHBOARD_URL}`
      : `Review this background check: ${BACKGROUND_CHECK_DASHBOARD_URL}`
  lines.push(portalLine)

  if (ADVERSE_NOTICE_STATUSES.has(status) && audience === 'worker') {
    lines.push(
      `As required by the Fair Credit Reporting Act (FCRA), you have at least ${DISPUTE_RESPONSE_DAYS} business days to review and respond before any adverse action is taken.`
    )
    lines.push(`Summary of Rights under the FCRA: ${SUMMARY_OF_RIGHTS_URL}`)
    lines.push(
      'If you believe any information is inaccurate, please submit a dispute from your dashboard or reply to this email with supporting details.'
    )
  } else if (status === 'disputed') {
    if (audience === 'worker') {
      lines.push(
        'Our compliance team is reviewing your dispute. We will follow up with any requests for additional information.'
      )
    } else {
      lines.push(
        `The worker has disputed the findings. Please review the dispute and respond within ${DISPUTE_RESPONSE_DAYS} business days to remain FCRA compliant.`
      )
    }
  } else if (status === 'expired') {
    if (audience === 'worker') {
      lines.push(
        'Start a new background check from your dashboard to keep your verified status current.'
      )
    } else {
      lines.push(
        "Request a new background check if continued access to the worker's results is required."
      )
    }
  } else if (status === 'failed' && audience === 'worker') {
    lines.push(
      'Contact support if you believe this was an error or if you need assistance restarting your background check.'
    )
  } else if (status === 'invited' && audience === 'worker') {
    lines.push(
      'We can’t continue with opportunities until your background check is complete. Start the process now to avoid delays.'
    )
  }

  const text = lines.join('\n\n')
  const html = toHtmlParagraphs(lines)
  const needsSummaryOfRights = ADVERSE_NOTICE_STATUSES.has(status) && audience === 'worker'

  const templateData: JsonRecord = {
    subject,
    message: baseMessage,
    status,
    packageName: ctx.packageName ?? null,
    summary: ctx.summary ?? null,
    audience,
    portalUrl: BACKGROUND_CHECK_DASHBOARD_URL,
    summaryOfRightsUrl: needsSummaryOfRights ? SUMMARY_OF_RIGHTS_URL : null,
    checkId: ctx.checkId ?? null,
    disputeResponseDays: DISPUTE_RESPONSE_DAYS,
  }

  return {
    subject,
    text,
    html,
    templateData,
  }
}

function buildNotificationChannels(includeEmail: boolean): NotificationChannel[] {
  return includeEmail
    ? ensureChannelArray(['in_app', 'email'] as NotificationChannel[])
    : ensureChannelArray(['in_app'] as NotificationChannel[])
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

const statusTemplates: Partial<Record<BackgroundCheckStatus, StatusTemplate>> = {
  invited: {
    type: 'info',
    severity: 'important',
    workerTitle: 'Background Check Invitation',
    workerMessage: ({ packageName }) =>
      packageName
        ? `You have been invited to start the ${packageName} background check package.`
        : 'You have been invited to start a background check. Begin the process to keep your profile active.',
    requesterTitle: 'Background Check Invitation Sent',
    requesterMessage: ({ packageName }) =>
      packageName
        ? `The ${packageName} background check package was sent to the worker.`
        : 'A background check invitation was sent to the worker.',
  },
  submitted: {
    type: 'info',
    severity: 'info',
    workerTitle: 'Background Check Submitted',
    workerMessage: () =>
      'Thanks! We received your background check submission. We’ll let you know when results are ready.',
    requesterTitle: 'Background Check Submitted',
    requesterMessage: () =>
      'The worker has submitted their background check information. You’ll be notified when results are available.',
  },
  in_progress: {
    type: 'info',
    severity: 'info',
    workerTitle: 'Background Check In Progress',
    workerMessage: () =>
      'Your background check is being processed. You’ll receive an update once we have results.',
    requesterTitle: 'Background Check In Progress',
    requesterMessage: () =>
      'The background check is now processing. We’ll notify you when the results are ready.',
  },
  under_review: {
    type: 'info',
    severity: 'important',
    workerTitle: 'Background Check Under Review',
    workerMessage: () =>
      'Your background check requires additional review. We’ll update you once the review is complete.',
    requesterTitle: 'Background Check Under Review',
    requesterMessage: () =>
      'The background check moved into manual review. We’ll notify you once it’s resolved.',
  },
  completed_clear: {
    type: 'bgcheck.completed',
    severity: 'info',
    workerTitle: 'Background Check Completed',
    workerMessage: () => 'Great news! Your background check is complete and no issues were found.',
    requesterTitle: 'Background Check Completed',
    requesterMessage: () =>
      'The background check finished with a clear result. Review the findings in the dashboard.',
  },
  completed_consider: {
    type: 'bgcheck.completed',
    severity: 'important',
    workerTitle: 'Background Check Requires Attention',
    workerMessage: ({ summary }) =>
      summary
        ? `Your background check is complete. Notes: ${summary}`
        : 'Your background check is complete. Please review the details and follow up if requested.',
    requesterTitle: 'Background Check Requires Review',
    requesterMessage: ({ summary }) =>
      summary
        ? `The background check finished with items to review: ${summary}`
        : 'The background check finished with items to review. Please review the report.',
  },
  completed_not_clear: {
    type: 'bgcheck.completed',
    severity: 'critical',
    workerTitle: 'Background Check Flagged',
    workerMessage: ({ summary }) =>
      summary
        ? `Your background check completed with issues: ${summary}`
        : 'Your background check completed with issues that need attention. Please review and respond if requested.',
    requesterTitle: 'Background Check Flagged',
    requesterMessage: ({ summary }) =>
      summary
        ? `The background check completed with critical findings: ${summary}`
        : 'The background check completed with critical findings. Review the report as soon as possible.',
  },
  partially_completed: {
    type: 'bgcheck.completed',
    severity: 'important',
    workerTitle: 'Partial Background Check Results',
    workerMessage: ({ summary }) =>
      summary
        ? `Partial results are ready: ${summary}`
        : 'Partial background check results are available. We’ll share updates as remaining components finish.',
    requesterTitle: 'Partial Background Check Results',
    requesterMessage: ({ summary }) =>
      summary
        ? `Partial background check results need review: ${summary}`
        : 'Partial background check results are available. Monitor for completion.',
  },
  failed: {
    type: 'info',
    severity: 'critical',
    workerTitle: 'Background Check Failed',
    workerMessage: ({ summary }) =>
      summary
        ? `We couldn’t complete your background check: ${summary}`
        : 'We couldn’t complete your background check. Please contact support to resolve the issue.',
    requesterTitle: 'Background Check Failed',
    requesterMessage: ({ summary }) =>
      summary
        ? `The background check failed to complete: ${summary}`
        : 'The background check couldn’t be completed. Review the record for next steps.',
  },
  cancelled: {
    type: 'info',
    severity: 'important',
    workerTitle: 'Background Check Cancelled',
    workerMessage: ({ summary }) =>
      summary
        ? `Your background check was cancelled: ${summary}`
        : 'Your background check was cancelled. Reach out if you expected it to continue.',
    requesterTitle: 'Background Check Cancelled',
    requesterMessage: ({ summary }) =>
      summary
        ? `The background check was cancelled: ${summary}`
        : 'The background check was cancelled. Review the record if further action is needed.',
  },
  disputed: {
    type: 'info',
    severity: 'important',
    workerTitle: 'Background Check Dispute Submitted',
    workerMessage: () =>
      'We received your dispute. Our team will review the details and follow up shortly.',
    requesterTitle: 'Background Check Dispute Filed',
    requesterMessage: () =>
      'The worker filed a dispute on their background check results. Review the record to respond.',
  },
  expired: {
    type: 'info',
    severity: 'important',
    workerTitle: 'Background Check Expired',
    workerMessage: ({ packageName }) =>
      packageName
        ? `The ${packageName} background check has expired. Start a new check if ongoing access is required.`
        : 'Your background check has expired. Start a new check if ongoing access is required.',
    requesterTitle: 'Background Check Expired',
    requesterMessage: ({ packageName }) =>
      packageName
        ? `The ${packageName} background check for this worker expired. Re-run the check if access is still needed.`
        : 'The background check for this worker expired. Re-run the check if access is still required.',
  },
  refunded: {
    type: 'info',
    severity: 'info',
    workerTitle: 'Background Check Refunded',
    workerMessage: () =>
      'We processed a refund for your background check payment. Contact support if this was unexpected.',
    requesterTitle: 'Background Check Refunded',
    requesterMessage: () =>
      'The background check payment was refunded. Review billing records for details.',
  },
}

function buildStatusMessage(
  _audience: 'worker' | 'requester',
  ctx: StatusTemplateContext
): StatusTemplate | null {
  const template = statusTemplates[ctx.status]

  if (template) {
    return template
  }

  // Provide sensible defaults for statuses without explicit templates
  if (COMPLETION_STATUSES.has(ctx.status)) {
    return {
      type: 'bgcheck.completed',
      severity: 'info',
      workerTitle: 'Background Check Update',
      workerMessage: ({ summary }) =>
        summary
          ? `Your background check status changed: ${summary}`
          : 'Your background check status has been updated. Review the latest details.',
      requesterTitle: 'Background Check Update',
      requesterMessage: ({ summary }) =>
        summary
          ? `The background check status changed: ${summary}`
          : 'The background check status has been updated. Review the record for details.',
    }
  }

  if (NEGATIVE_STATUSES.has(ctx.status)) {
    return {
      type: 'info',
      severity: 'important',
      workerTitle: 'Background Check Update',
      workerMessage: ({ summary }) =>
        summary
          ? `There’s an update on your background check: ${summary}`
          : 'There’s an important update on your background check. Review the record for details.',
      requesterTitle: 'Background Check Update',
      requesterMessage: ({ summary }) =>
        summary
          ? `There’s an update on the background check: ${summary}`
          : 'There’s an important update on the background check. Review the record for details.',
    }
  }

  return {
    type: 'info',
    severity: 'info',
    workerTitle: 'Background Check Update',
    workerMessage: ({ summary }) =>
      summary
        ? `Your background check status changed: ${summary}`
        : 'Your background check status changed. We’ll keep you posted as it progresses.',
    requesterTitle: 'Background Check Update',
    requesterMessage: ({ summary }) =>
      summary
        ? `The background check status changed: ${summary}`
        : 'The background check status changed. Monitor the record for next steps.',
  }
}

interface BaseNotificationPayload extends StatusTemplateContext {
  supabase: NotificationSupabaseClient
  checkId: string
  actorId?: string | null
}

interface StatusNotificationPayload extends BaseNotificationPayload {
  status: BackgroundCheckStatus
  workerId: string
  requesterId?: string | null
}

export async function notifyBackgroundCheckStatusChange(
  payload: StatusNotificationPayload
): Promise<void> {
  const { supabase, status, workerId, requesterId, checkId, packageName, summary, actorId } =
    payload

  const ctx: StatusTemplateContext = {
    status,
    packageName,
    summary,
    checkId,
  }

  const dedupeBase = `bgcheck:${checkId}:${status}`

  let workerEmail: string | null = null
  if (WORKER_EMAIL_STATUSES.has(status)) {
    try {
      const contacts = await getUserContacts(supabase, workerId)
      workerEmail = contacts.email ?? null
    } catch (error) {
      console.error('[background-checks] failed to load worker contact details', error)
    }
  }

  const workerTemplate = buildStatusMessage('worker', ctx)
  const workerEmailContent = composeEmailContent(status, ctx, 'worker')
  const workerChannels = buildNotificationChannels(Boolean(workerEmail))
  const workerSummaryUrl = getString(workerEmailContent?.templateData.summaryOfRightsUrl)

  if (workerTemplate) {
    const workerMetadata = {
      background_check_id: checkId,
      status,
      packageName: packageName ?? null,
      actorId: actorId ?? null,
      portal_url: BACKGROUND_CHECK_DASHBOARD_URL,
      summary_of_rights_url: workerSummaryUrl,
    } satisfies Record<string, Json | undefined>

    try {
      const notification = await insertNotification(
        supabase,
        {
          user_id: workerId,
          type: workerTemplate.type,
          severity: workerTemplate.severity,
          title: workerTemplate.workerTitle,
          message: workerTemplate.workerMessage(ctx),
          preview: summary ?? workerTemplate.workerMessage(ctx),
          body: {
            background_check_id: checkId,
            status,
            summary,
            audience: 'worker',
          },
          metadata: workerMetadata,
          routed_channels: workerChannels,
        },
        `${dedupeBase}:worker:${workerId}`
      )

      if (notification && workerEmail && workerEmailContent) {
        try {
          await enqueueDelivery(supabase, notification.id, 'email', 'sendgrid', {
            email: workerEmail,
            subject: workerEmailContent.subject,
            text: workerEmailContent.text,
            html: workerEmailContent.html,
            templateData: workerEmailContent.templateData,
          })
        } catch (error) {
          console.error('[background-checks] failed to queue worker email notification', error)
        }
      }
    } catch (error) {
      console.error('[background-checks] failed to create worker notification', error)
    }
  }

  if (requesterId && requesterId !== workerId) {
    let requesterEmail: string | null = null
    if (REQUESTER_EMAIL_STATUSES.has(status)) {
      try {
        const contacts = await getUserContacts(supabase, requesterId)
        requesterEmail = contacts.email ?? null
      } catch (error) {
        console.error('[background-checks] failed to load requester contact details', error)
      }
    }

    const requesterTemplate = buildStatusMessage('requester', ctx)
    const requesterEmailContent = composeEmailContent(status, ctx, 'requester')
    const requesterChannels = buildNotificationChannels(Boolean(requesterEmail))
    const requesterSummaryUrl = getString(requesterEmailContent?.templateData.summaryOfRightsUrl)

    if (requesterTemplate) {
      const requesterMetadata = {
        background_check_id: checkId,
        status,
        packageName: packageName ?? null,
        actorId: actorId ?? null,
        portal_url: BACKGROUND_CHECK_DASHBOARD_URL,
        summary_of_rights_url: requesterSummaryUrl,
      } satisfies Record<string, Json | undefined>

      try {
        const notification = await insertNotification(
          supabase,
          {
            user_id: requesterId,
            type: requesterTemplate.type,
            severity: requesterTemplate.severity,
            title: requesterTemplate.requesterTitle ?? requesterTemplate.workerTitle,
            message:
              requesterTemplate.requesterMessage?.(ctx) ?? requesterTemplate.workerMessage(ctx),
            preview:
              requesterTemplate.requesterMessage?.(ctx) ?? requesterTemplate.workerMessage(ctx),
            body: {
              background_check_id: checkId,
              status,
              summary,
              audience: 'requester',
            },
            metadata: requesterMetadata,
            routed_channels: requesterChannels,
          },
          `${dedupeBase}:requester:${requesterId}`
        )

        if (notification && requesterEmail && requesterEmailContent) {
          try {
            await enqueueDelivery(supabase, notification.id, 'email', 'sendgrid', {
              email: requesterEmail,
              subject: requesterEmailContent.subject,
              text: requesterEmailContent.text,
              html: requesterEmailContent.html,
              templateData: requesterEmailContent.templateData,
            })
          } catch (error) {
            console.error('[background-checks] failed to queue requester email notification', error)
          }
        }
      } catch (error) {
        console.error('[background-checks] failed to create requester notification', error)
      }
    }
  }
}

interface InvitationNotificationPayload extends BaseNotificationPayload {
  workerId: string
  invitedById?: string | null
}

export async function notifyBackgroundCheckInvitation(
  payload: InvitationNotificationPayload
): Promise<void> {
  const { supabase, workerId, invitedById, checkId, packageName, actorId } = payload
  const status = payload.status ?? 'invited'

  const baseCtx: StatusTemplateContext = {
    status,
    packageName,
    checkId,
  }
  const workerEmailContent = composeEmailContent(status, baseCtx, 'worker')

  let workerEmail: string | null = null
  try {
    const contacts = await getUserContacts(supabase, workerId)
    workerEmail = contacts.email ?? null
  } catch (error) {
    console.error('[background-checks] failed to load invitee contact details', error)
  }

  const workerChannels = buildNotificationChannels(Boolean(workerEmail))
  const workerEmailMessage = getString(workerEmailContent?.templateData.message)

  try {
    const workerMetadata = {
      background_check_id: checkId,
      status,
      packageName: packageName ?? null,
      invitedById: invitedById ?? null,
      actorId: actorId ?? null,
      portal_url: BACKGROUND_CHECK_DASHBOARD_URL,
    } satisfies Record<string, Json | undefined>

    const workerNotification = await insertNotification(
      supabase,
      {
        user_id: workerId,
        type: 'info',
        severity: 'important',
        title: workerEmailContent?.subject ?? 'Action Required: Background Check',
        message:
          workerEmailMessage ??
          'Please complete your background check to keep your opportunities moving.',
        preview:
          workerEmailMessage ??
          'Please complete your background check to keep your opportunities moving.',
        body: {
          background_check_id: checkId,
          status,
          audience: 'worker',
        },
        metadata: workerMetadata,
        routed_channels: workerChannels,
      },
      `bgcheck:${checkId}:invited:${workerId}`
    )

    if (workerNotification && workerEmail && workerEmailContent) {
      try {
        await enqueueDelivery(supabase, workerNotification.id, 'email', 'sendgrid', {
          email: workerEmail,
          subject: workerEmailContent.subject,
          text: workerEmailContent.text,
          html: workerEmailContent.html,
          templateData: workerEmailContent.templateData,
        })
      } catch (error) {
        console.error('[background-checks] failed to queue invitation email', error)
      }
    }
  } catch (error) {
    console.error('[background-checks] failed to create invitation notification', error)
  }

  if (invitedById && invitedById !== workerId) {
    const requesterCtx: StatusTemplateContext = {
      ...baseCtx,
      summary: null,
    }
    const requesterEmailContent = composeEmailContent(status, requesterCtx, 'requester')

    let inviterEmail: string | null = null
    try {
      const contacts = await getUserContacts(supabase, invitedById)
      inviterEmail = contacts.email ?? null
    } catch (error) {
      console.error('[background-checks] failed to load inviter contact details', error)
    }

    const inviterChannels = buildNotificationChannels(Boolean(inviterEmail))
    const inviterEmailMessage = getString(requesterEmailContent?.templateData.message)

    try {
      const inviterMetadata = {
        background_check_id: checkId,
        status,
        packageName: packageName ?? null,
        workerId,
        actorId: actorId ?? null,
        portal_url: BACKGROUND_CHECK_DASHBOARD_URL,
      } satisfies Record<string, Json | undefined>

      const inviterNotification = await insertNotification(
        supabase,
        {
          user_id: invitedById,
          type: 'info',
          severity: 'info',
          title: requesterEmailContent?.subject ?? 'Background Check Invitation Sent',
          message:
            inviterEmailMessage ??
            (packageName
              ? `You invited a worker to complete the ${packageName} background check package.`
              : 'You invited a worker to complete a background check package.'),
          preview:
            inviterEmailMessage ??
            (packageName
              ? `Invitation sent for ${packageName}`
              : 'Background check invitation sent'),
          body: {
            background_check_id: checkId,
            status,
            audience: 'requester',
          },
          metadata: inviterMetadata,
          routed_channels: inviterChannels,
        },
        `bgcheck:${checkId}:invited:${invitedById}`
      )

      if (inviterNotification && inviterEmail && requesterEmailContent) {
        try {
          await enqueueDelivery(supabase, inviterNotification.id, 'email', 'sendgrid', {
            email: inviterEmail,
            subject: requesterEmailContent.subject,
            text: requesterEmailContent.text,
            html: requesterEmailContent.html,
            templateData: requesterEmailContent.templateData,
          })
        } catch (error) {
          console.error('[background-checks] failed to queue invitation confirmation email', error)
        }
      }
    } catch (error) {
      console.error('[background-checks] failed to create requester invitation notification', error)
    }
  }
}
