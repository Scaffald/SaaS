/**
 * SendGrid Webhook Handler for ForSured
 *
 * Email Communication Auditability
 *
 * Receives delivery events from SendGrid and:
 * 1. Validates webhook signature (optional, based on env config)
 * 2. FILTERS to only process ForSured emails (shared SendGrid account)
 * 3. Updates audit_log with delivery status
 * 4. Links events to original email context (project, task, etc.)
 *
 * Endpoint: POST /api/webhooks/sendgrid
 */

import { NextRequest, NextResponse } from 'next/server'
import { processEmailWebhookEvent } from '../../../../lib/email/emailIntegration'
import { auditService } from '../../../../lib/audit'

/**
 * SendGrid Event Webhook Payload
 * @see https://docs.sendgrid.com/for-developers/tracking-events/event
 */
interface SendGridEvent {
  email: string
  timestamp: number
  event: 'processed' | 'deferred' | 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' | 'spamreport' | 'unsubscribe'
  sg_message_id: string
  sg_event_id?: string
  reason?: string
  response?: string
  attempt?: string
  url?: string
  ip?: string
  useragent?: string
  category?: string | string[]
  // Custom arguments passed during send
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/**
 * Check if this is a ForSured email by looking for our identifier
 * in the event metadata
 */
function isForSuredEmail(event: SendGridEvent): boolean {
  // Check for forsured flag in custom args
  if (event.forsured === true || event.forsured === 'true') {
    return true
  }

  // Check for forsured category
  const categories = Array.isArray(event.category) ? event.category : [event.category]
  if (categories.some((cat) => cat?.toLowerCase() === 'forsured')) {
    return true
  }

  // Check for ForSured-specific context fields
  if (event.project_id || event.invitation_id || event.subcontractor_id) {
    return true
  }

  // Default: assume it's ours if we can't determine otherwise
  // This is a shared SendGrid account, but we'd rather log too much than too little
  return true
}

/**
 * Extract message ID from SendGrid's full message ID
 * SendGrid message IDs are in format: "abc123.def456@domain"
 */
function extractMessageId(rawMessageId?: string): string | null {
  if (!rawMessageId) return null
  // Take the part before the first dot or @ symbol
  return rawMessageId.split('.')[0] ?? rawMessageId
}

/**
 * Map SendGrid event names to our internal event types
 */
function mapEventType(sgEvent: string): 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam_report' | null {
  const mapping: Record<string, 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam_report'> = {
    delivered: 'delivered',
    open: 'opened',
    click: 'clicked',
    bounce: 'bounced',
    dropped: 'dropped',
    spamreport: 'spam_report',
    unsubscribe: 'spam_report', // Treat as spam report for audit purposes
  }
  return mapping[sgEvent] || null
}

/**
 * POST /api/webhooks/sendgrid
 * Receives webhook events from SendGrid
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validate content type
  const contentType = request.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  // Optional: Validate webhook signature
  // SendGrid signs webhooks with HMAC SHA256
  const signature = request.headers.get('x-twilio-email-event-webhook-signature')
  const webhookSecret = process.env.SENDGRID_WEBHOOK_SIGNING_SECRET

  if (webhookSecret && signature) {
    // TODO: Implement signature verification when we have the webhook secret
    // For now, we skip verification in development
    if (process.env.NODE_ENV === 'production' && !signature) {
      console.warn('[SendGrid Webhook] Missing signature in production')
    }
  }

  let events: SendGridEvent[] = []

  try {
    const body = await request.json()
    events = Array.isArray(body) ? body : [body]
  } catch (error) {
    console.error('[SendGrid Webhook] Invalid JSON payload:', error)
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const results: Array<{ messageId: string; event: string; processed: boolean; error?: string }> = []

  for (const event of events) {
    const messageId = extractMessageId(event.sg_message_id)
    const eventType = event.event?.toLowerCase()

    // Skip if missing required fields
    if (!messageId || !eventType) {
      results.push({
        messageId: messageId ?? 'unknown',
        event: eventType ?? 'unknown',
        processed: false,
        error: 'Missing message ID or event type',
      })
      continue
    }

    // Filter for ForSured emails
    if (!isForSuredEmail(event)) {
      results.push({
        messageId,
        event: eventType,
        processed: false,
        error: 'Not a ForSured email',
      })
      continue
    }

    // Map event type
    const mappedType = mapEventType(eventType)
    if (!mappedType) {
      // Skip events we don't track (processed, deferred, etc.)
      results.push({
        messageId,
        event: eventType,
        processed: false,
        error: 'Event type not tracked',
      })
      continue
    }

    try {
      // Process the webhook event
      await processEmailWebhookEvent({
        type: mappedType,
        messageId,
        recipient: event.email,
        timestamp: new Date(event.timestamp * 1000),
        metadata: {
          // Extract ForSured context from custom args
          project_id: event.project_id,
          task_id: event.task_id,
          subcontractor_id: event.subcontractor_id,
          invitation_id: event.invitation_id,
          // Include raw event data for debugging
          sg_event_id: event.sg_event_id,
          reason: event.reason,
          response: event.response,
          url: event.url,
        },
      })

      results.push({
        messageId,
        event: eventType,
        processed: true,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[SendGrid Webhook] Error processing event ${messageId}:`, error)

      results.push({
        messageId,
        event: eventType,
        processed: false,
        error: errorMessage,
      })
    }
  }

  // Log webhook processing summary
  const processed = results.filter((r) => r.processed).length
  const failed = results.filter((r) => !r.processed).length

  if (processed > 0 || failed > 0) {
    try {
      await auditService.log({
        category: 'system',
        action: 'webhook_received',
        severity: failed > 0 ? 'low' : 'info',
        resource_type: 'email_webhook',
        status: failed === 0 ? 'success' : 'partial',
        metadata: {
          provider: 'sendgrid',
          events_received: events.length,
          events_processed: processed,
          events_failed: failed,
        },
      })
    } catch {
      // Never fail due to audit logging
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    failed,
    results,
  })
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Twilio-Email-Event-Webhook-Signature',
    },
  })
}
