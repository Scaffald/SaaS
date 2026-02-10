/**
 * Temporary SendGrid Webhook Capture Endpoint
 *
 * Email Communication Auditability - Phase 2 Testing
 *
 * This endpoint captures raw SendGrid webhook payloads for analysis
 * before building the production handler. It logs all incoming webhooks
 * to the console and stores them in memory for inspection.
 *
 * IMPORTANT: This is a development/testing endpoint only.
 * Remove or disable in production.
 *
 * Usage:
 * 1. Configure SendGrid Event Webhook to point here
 * 2. Send test emails via scripts/test-email-sending.ts
 * 3. Open emails, click links to trigger events
 * 4. GET this endpoint to retrieve captured payloads
 */

import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for captured webhooks (development only)
interface CapturedWebhook {
  timestamp: string
  events: SendGridEvent[]
  rawBody: string
  headers: Record<string, string>
}

// Store up to 100 webhook batches
const capturedWebhooks: CapturedWebhook[] = []
const MAX_STORED = 100

/**
 * SendGrid Event structure (to be refined based on actual payloads)
 */
interface SendGridEvent {
  email: string
  timestamp: number
  event: string
  sg_event_id?: string
  sg_message_id?: string
  category?: string[]
  url?: string
  useragent?: string
  ip?: string
  response?: string
  reason?: string
  status?: string
  attempt?: string
  // Custom args passed via X-SMTPAPI header or unique_args
  forsured?: boolean | string
  projectId?: string
  taskId?: string
  subcontractorId?: string
  organizationId?: string
  invitationId?: string
  testType?: string
  [key: string]: unknown // Allow other properties
}

/**
 * POST handler - Receive and capture webhook events
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const timestamp = new Date().toISOString()

  try {
    // Get raw body for logging
    const rawBody = await request.text()

    // Extract headers of interest
    const headers: Record<string, string> = {}
    const interestingHeaders = [
      'content-type',
      'user-agent',
      'x-twilio-email-event-webhook-signature',
      'x-twilio-email-event-webhook-timestamp',
    ]

    interestingHeaders.forEach((h) => {
      const value = request.headers.get(h)
      if (value) headers[h] = value
    })

    // Parse the events
    let events: SendGridEvent[] = []
    try {
      events = JSON.parse(rawBody)
      if (!Array.isArray(events)) {
        events = [events]
      }
    } catch {
      console.error('[SendGrid Capture] Failed to parse JSON:', rawBody.substring(0, 500))
      events = []
    }

    // Log to console with formatting
    console.log('\n' + '═'.repeat(80))
    console.log('[SendGrid Webhook Capture]', timestamp)
    console.log('═'.repeat(80))
    console.log('Headers:', JSON.stringify(headers, null, 2))
    console.log('Event Count:', events.length)
    console.log('─'.repeat(80))

    events.forEach((event, index) => {
      console.log(`\nEvent ${index + 1}/${events.length}:`)
      console.log(JSON.stringify(event, null, 2))

      // Highlight ForSured-specific events
      if (event.forsured || event.projectId || event.taskId) {
        console.log('  ⭐ ForSured context detected!')
      }
    })

    console.log('─'.repeat(80))
    console.log('Raw Body:', rawBody.length > 2000 ? rawBody.substring(0, 2000) + '...' : rawBody)
    console.log('═'.repeat(80) + '\n')

    // Store captured webhook
    capturedWebhooks.unshift({
      timestamp,
      events,
      rawBody,
      headers,
    })

    // Limit stored webhooks
    while (capturedWebhooks.length > MAX_STORED) {
      capturedWebhooks.pop()
    }

    return NextResponse.json({
      captured: true,
      timestamp,
      eventCount: events.length,
      totalCaptured: capturedWebhooks.length,
    })
  } catch (error) {
    console.error('[SendGrid Capture] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET handler - Retrieve captured webhooks for analysis
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '10', 10)
  const eventType = url.searchParams.get('event') // Filter by event type
  const forsuredOnly = url.searchParams.get('forsured') === 'true'

  let results = capturedWebhooks.slice(0, limit)

  // Filter by event type if specified
  if (eventType) {
    results = results
      .map((webhook) => ({
        ...webhook,
        events: webhook.events.filter((e) => e.event === eventType),
      }))
      .filter((webhook) => webhook.events.length > 0)
  }

  // Filter for ForSured emails only
  if (forsuredOnly) {
    results = results
      .map((webhook) => ({
        ...webhook,
        events: webhook.events.filter(
          (e) => e.forsured || e.projectId || e.taskId || e.subcontractorId
        ),
      }))
      .filter((webhook) => webhook.events.length > 0)
  }

  // Generate summary statistics
  const allEvents = capturedWebhooks.flatMap((w) => w.events)
  const eventCounts: Record<string, number> = {}
  allEvents.forEach((e) => {
    eventCounts[e.event] = (eventCounts[e.event] || 0) + 1
  })

  return NextResponse.json({
    totalWebhooks: capturedWebhooks.length,
    totalEvents: allEvents.length,
    eventCounts,
    forsuredEvents: allEvents.filter(
      (e) => e.forsured || e.projectId || e.taskId || e.subcontractorId
    ).length,
    webhooks: results,
    queryParams: {
      limit,
      eventType,
      forsuredOnly,
    },
  })
}

/**
 * DELETE handler - Clear captured webhooks
 */
export async function DELETE(): Promise<NextResponse> {
  const count = capturedWebhooks.length
  capturedWebhooks.length = 0

  return NextResponse.json({
    cleared: true,
    count,
  })
}

/**
 * OPTIONS handler - CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
