import type { ChannelAdapter, NotificationRow } from '../types.ts'
import { normalizeMetadata } from '../utils.ts'
import { wrapInBrandedTemplate, EMAIL_COLORS } from '../../email-template.ts'
import { NevarMailError, nevarMailFromEnv, nevarMailUseCase } from '../../nevarmail.ts'

interface SendEmailPayload {
  /** Only when a delivery names one (a bare address); otherwise the use case's sender. */
  from?: string
  fromName?: string
  to: string
  subject: string
  html: string
  text: string
}

/** Prepend the app base URL if the CTA URL is relative (starts with /). */
function resolveCtaUrl(url: string | null): string {
  if (!url) return '#'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const baseUrl = Deno.env.get('APP_BASE_URL') ?? ''
  return baseUrl ? `${baseUrl}${url}` : url
}

const SEVERITY_URGENCY: Record<string, string> = {
  critical: 'Urgent',
  important: 'Important',
  info: 'Upcoming',
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildRenewalHtml(
  notification: NotificationRow,
  body: Record<string, unknown>
): string {
  const policyNumber = String(body.policy_number ?? 'N/A')
  const policyType = String(body.policy_type ?? 'Policy')
  const carrierName = String(body.carrier_name ?? '')
  const expirationDate = String(body.expiration_date ?? '')
  const companyName = String(body.company_name ?? '')
  const intervalDays = Number(body.interval_days ?? 0)
  const severity = notification.severity ?? 'info'
  const urgency = SEVERITY_URGENCY[severity] ?? 'Upcoming'

  const severityColor =
    severity === 'critical' ? '#dc2626' : severity === 'important' ? '#f59e0b' : '#3b82f6'

  const ctaUrl = resolveCtaUrl(notification.cta_url)
  const ctaLabel = notification.cta_label ?? 'View Policy'
  const c = EMAIL_COLORS

  const innerBody = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      ${escapeHtml(notification.message ?? notification.title)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.sectionBg};border:1px solid ${c.border};border-radius:6px;margin:24px 0;">
      <tr><td style="padding:20px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${companyName ? `<tr><td style="padding:6px 0;font-size:13px;color:${c.mutedText};width:140px;">Company</td><td style="padding:6px 0;font-size:14px;font-weight:500;color:${c.bodyText};">${escapeHtml(companyName)}</td></tr>` : ''}
          <tr><td style="padding:6px 0;font-size:13px;color:${c.mutedText};width:140px;">Policy Number</td><td style="padding:6px 0;font-size:14px;font-weight:500;color:${c.bodyText};">${escapeHtml(policyNumber)}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:${c.mutedText};width:140px;">Policy Type</td><td style="padding:6px 0;font-size:14px;font-weight:500;color:${c.bodyText};">${escapeHtml(policyType)}</td></tr>
          ${carrierName ? `<tr><td style="padding:6px 0;font-size:13px;color:${c.mutedText};width:140px;">Carrier</td><td style="padding:6px 0;font-size:14px;font-weight:500;color:${c.bodyText};">${escapeHtml(carrierName)}</td></tr>` : ''}
          <tr><td style="padding:6px 0;font-size:13px;color:${c.mutedText};width:140px;">Expiration Date</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:${escapeHtml(severityColor)};">${escapeHtml(expirationDate)}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:${c.mutedText};width:140px;">Days Remaining</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:${escapeHtml(severityColor)};">${intervalDays}</td></tr>
        </table>
      </td></tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="background-color:${c.ctaButton};border-radius:6px;padding:12px 28px;">
        <a href="${escapeHtml(ctaUrl)}" style="color:${c.ctaButtonText};font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">${escapeHtml(ctaLabel)}</a>
      </td></tr>
    </table>`

  return wrapInBrandedTemplate({
    title: 'Scaffald',
    subtitle: `${urgency}: Policy Renewal Reminder`,
    body: innerBody,
    footerHtml: `<p style="margin:0;font-size:12px;text-align:center;">You are receiving this because you are associated with this policy. Manage your notification preferences in your account settings.</p>`,
  })
}

function buildRenewalPlainText(
  notification: NotificationRow,
  body: Record<string, unknown>
): string {
  const policyNumber = String(body.policy_number ?? 'N/A')
  const policyType = String(body.policy_type ?? 'Policy')
  const carrierName = String(body.carrier_name ?? '')
  const expirationDate = String(body.expiration_date ?? '')
  const companyName = String(body.company_name ?? '')
  const intervalDays = Number(body.interval_days ?? 0)
  const ctaUrl = resolveCtaUrl(notification.cta_url)

  const lines = [
    notification.message ?? notification.title,
    '',
    'Policy Details',
    '---',
  ]

  if (companyName) lines.push(`Company: ${companyName}`)
  lines.push(`Policy Number: ${policyNumber}`)
  lines.push(`Policy Type: ${policyType}`)
  if (carrierName) lines.push(`Carrier: ${carrierName}`)
  lines.push(`Expiration Date: ${expirationDate}`)
  lines.push(`Days Remaining: ${intervalDays}`)

  if (ctaUrl) {
    lines.push('')
    lines.push(`View Policy: ${ctaUrl}`)
  }

  lines.push('')
  lines.push('---')
  lines.push(
    'You are receiving this because you are associated with this policy. Manage your notification preferences in your account settings.'
  )

  return lines.join('\n')
}

function buildEmailPayload(
  metadata: Record<string, unknown>,
  notification: NotificationRow,
  notificationBody: Record<string, unknown>,
  messageFallback: string
): SendEmailPayload {
  // The sender is the NevarMail use case's ("Scaffald <notifications@
  // mail.scaffald.com>"). A delivery may still name its own address; NevarMail
  // refuses one outside the use case's domain (403 FROM_NOT_ALLOWED).
  const fromEmail = typeof metadata.fromEmail === 'string' ? metadata.fromEmail : null
  const fromName = typeof metadata.fromName === 'string' ? metadata.fromName : 'Scaffald'

  // Cast to string because the DB enum includes policy.renewal via migration
  // but the generated types may not yet reflect it until next type generation.
  const isRenewal = (notification.type as string) === 'policy.renewal'

  const htmlBody =
    typeof metadata.html === 'string'
      ? metadata.html
      : isRenewal
        ? buildRenewalHtml(notification, notificationBody)
        : // Escaped: notification messages carry user-supplied text (org names,
          // job titles, dispute reasons), and this is the path every
          // non-renewal notification takes.
          `<p>${escapeHtml(messageFallback)}</p>`

  const textBody =
    typeof metadata.text === 'string'
      ? metadata.text
      : isRenewal
        ? buildRenewalPlainText(notification, notificationBody)
        : messageFallback

  return {
    ...(fromEmail ? { from: fromEmail, fromName } : {}),
    to: String(metadata.email),
    subject: typeof metadata.subject === 'string' ? metadata.subject : notification.title,
    html: htmlBody,
    text: textBody,
  }
}

/** Whether a failed send is worth another attempt later. */
function retryable(error: NevarMailError): boolean {
  // The daily cap and rate limits clear on their own; so do outages.
  return error.isDailyCap || error.status === 429 || error.status >= 500
}

export const emailAdapter: ChannelAdapter = {
  async send({ delivery, notification }) {
    const client = nevarMailFromEnv()
    const useCaseId = nevarMailUseCase('notifications')
    if (!client || !useCaseId) {
      return {
        status: 'failed',
        error: 'Email is not configured: NEVARMAIL_API_KEY and NEVARMAIL_USE_CASE_NOTIFICATIONS must be set',
      }
    }

    const metadata = normalizeMetadata((delivery.metadata ?? {}) as Record<string, unknown>)
    const recipient = typeof metadata.email === 'string' ? metadata.email : null

    if (!recipient) {
      return {
        status: 'failed',
        error: 'Missing recipient email address in delivery metadata',
      }
    }

    const bodyPayload = normalizeMetadata(notification.body ?? {})
    const messageFallback = notification.message ?? notification.preview ?? notification.title

    const payload = buildEmailPayload(metadata, notification, bodyPayload, messageFallback)

    try {
      const sent = await client.send({
        to: payload.to,
        useCaseId,
        emailType: 'transactional',
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        ...(payload.from ? { from: payload.from, fromName: payload.fromName } : {}),
        metadata: {
          notificationId: notification.id ?? null,
          deliveryId: delivery.id ?? null,
        },
      })
      return {
        status: 'sent',
        // Stored as notification_deliveries.provider_msg_id; the email webhook
        // matches NevarMail events to deliveries by it (see #1389: NevarMail's
        // send `id` and its webhook `email_id` must agree for that to work).
        providerMessageId: sent.id,
        events: [
          {
            kind: 'accepted',
            meta: { provider: 'nevarmail', provider_provider: sent.provider ?? null },
          },
        ],
      }
    } catch (error) {
      if (error instanceof NevarMailError) {
        return {
          status: retryable(error) ? 'retry' : 'failed',
          error: error.message,
        }
      }
      return {
        status: 'retry',
        error: error instanceof Error ? error.message : 'Unknown email error',
      }
    }
  },
}
