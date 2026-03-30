import type { ChannelAdapter, NotificationRow } from '../types.ts'
import { normalizeMetadata } from '../utils.ts'
import { wrapInBrandedTemplate, EMAIL_COLORS } from '../../email-template.ts'

interface SendEmailPayload {
  personalizations: Array<{
    to: Array<{ email: string }>
    dynamic_template_data?: Record<string, unknown>
  }>
  from: { email: string; name?: string }
  subject?: string
  content?: Array<{ type: string; value: string }>
  template_id?: string
  mail_settings?: { sandbox_mode?: { enable: boolean } }
}

const SENDGRID_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send'

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

function buildRenewalTemplateData(
  notification: NotificationRow,
  body: Record<string, unknown>
): Record<string, unknown> {
  return {
    title: notification.title,
    message: notification.message ?? notification.title,
    severity: notification.severity ?? 'info',
    urgency: SEVERITY_URGENCY[notification.severity ?? 'info'] ?? 'Upcoming',
    policy_number: body.policy_number ?? null,
    policy_type: body.policy_type ?? null,
    carrier_name: body.carrier_name ?? null,
    expiration_date: body.expiration_date ?? null,
    company_name: body.company_name ?? null,
    days_until_expiration: body.interval_days ?? null,
    interval_days: body.interval_days ?? null,
    recipient_role: body.recipient_role ?? null,
    cta_url: resolveCtaUrl(notification.cta_url),
    cta_label: notification.cta_label ?? 'View Policy',
  }
}

function buildEmailPayload(
  metadata: Record<string, unknown>,
  notification: NotificationRow,
  notificationBody: Record<string, unknown>,
  messageFallback: string
): SendEmailPayload {
  const fromEmail =
    typeof metadata.fromEmail === 'string'
      ? metadata.fromEmail
      : (Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'notifications@scaffald.com')

  const fromName =
    typeof metadata.fromName === 'string'
      ? metadata.fromName
      : (Deno.env.get('SENDGRID_FROM_NAME') ?? 'Scaffald')

  const templateId =
    typeof metadata.templateId === 'string'
      ? metadata.templateId
      : (Deno.env.get('SENDGRID_TEMPLATE_ID') ?? undefined)

  // Cast to string because the DB enum includes policy.renewal via migration
  // but the generated types may not yet reflect it until next type generation.
  const isRenewal = (notification.type as string) === 'policy.renewal'

  const dynamicTemplateData =
    metadata.templateData && typeof metadata.templateData === 'object'
      ? (metadata.templateData as Record<string, unknown>)
      : isRenewal
        ? buildRenewalTemplateData(notification, notificationBody)
        : undefined

  const htmlBody =
    typeof metadata.html === 'string'
      ? metadata.html
      : isRenewal
        ? buildRenewalHtml(notification, notificationBody)
        : `<p>${messageFallback}</p>`

  const textBody =
    typeof metadata.text === 'string'
      ? metadata.text
      : isRenewal
        ? buildRenewalPlainText(notification, notificationBody)
        : messageFallback

  const payload: SendEmailPayload = {
    personalizations: [
      {
        to: [
          {
            email: String(metadata.email),
          },
        ],
        dynamic_template_data: dynamicTemplateData,
      },
    ],
    from: { email: fromEmail, name: fromName },
  }

  if (templateId) {
    payload.template_id = templateId
    if (!payload.personalizations[0].dynamic_template_data) {
      payload.personalizations[0].dynamic_template_data = {
        title: notification.title,
        preview: messageFallback,
        body: notificationBody,
      }
    }
  } else {
    payload.subject =
      typeof metadata.subject === 'string' ? metadata.subject : notification.title
    payload.content = [
      { type: 'text/plain', value: textBody },
      { type: 'text/html', value: htmlBody },
    ]
  }

  if (Deno.env.get('SENDGRID_SANDBOX_MODE') === 'true') {
    payload.mail_settings = {
      sandbox_mode: { enable: true },
    }
  }

  return payload
}

export const emailAdapter: ChannelAdapter = {
  async send({ delivery, notification }) {
    const apiKey = Deno.env.get('SENDGRID_API_KEY')
    if (!apiKey) {
      return {
        status: 'failed',
        error: 'SENDGRID_API_KEY environment variable is not set',
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
      const response = await fetch(SENDGRID_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok || response.status === 202) {
        const providerMessageId = response.headers.get('x-message-id') ?? undefined
        return {
          status: 'sent',
          providerMessageId,
          events: [
            {
              kind: 'accepted',
              meta: {
                provider: 'sendgrid',
                status: response.status,
              },
            },
          ],
        }
      }

      const errorBody = await response.text()

      const shouldRetry = response.status >= 500

      return {
        status: shouldRetry ? 'retry' : 'failed',
        error: `SendGrid responded with status ${response.status}: ${errorBody}`,
      }
    } catch (error) {
      return {
        status: 'retry',
        error: error instanceof Error ? error.message : 'Unknown email error',
      }
    }
  },
}
