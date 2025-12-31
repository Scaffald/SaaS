# Webhooks Guide

Receive real-time notifications when events happen in your Scaffald account using webhooks.

## Table of Contents

- [Overview](#overview)
- [Webhook Events](#webhook-events)
- [Setting Up Webhooks](#setting-up-webhooks)
- [Verifying Signatures](#verifying-signatures)
- [Handling Events](#handling-events)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Webhooks allow Scaffald to push real-time notifications to your application when specific events occur. Instead of polling the API repeatedly, webhooks deliver events as they happen.

**Common Use Cases:**
- Send notifications when applications are reviewed
- Update internal systems when application status changes
- Track application metrics and analytics
- Trigger workflows in other tools

## Webhook Events

Scaffald sends the following webhook events:

### Application Events

| Event | Description | Payload |
|-------|-------------|---------|
| `application.created` | New application submitted | Full application object |
| `application.updated` | Application details updated | Updated application object |
| `application.status_changed` | Application status changed | Application with new status |
| `application.withdrawn` | Application withdrawn by applicant | Application with withdrawal reason |

### Job Events (Coming Soon)

| Event | Description |
|-------|-------------|
| `job.created` | New job posted |
| `job.updated` | Job details updated |
| `job.published` | Job published |
| `job.archived` | Job archived |

## Setting Up Webhooks

### 1. Create a Webhook Endpoint

Create an endpoint in your application to receive webhook POST requests:

```typescript
// Express example
import express from 'express'
import { verifyWebhookSignature } from '@scaffald/sdk'

const app = express()

// Important: Use raw body for signature verification
app.post(
  '/webhooks/scaffald',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['x-webhook-signature'] as string
    const webhookSecret = process.env.SCAFFALD_WEBHOOK_SECRET!

    // Verify signature
    const isValid = await verifyWebhookSignature(
      req.body,
      signature,
      webhookSecret
    )

    if (!isValid) {
      console.error('Invalid webhook signature')
      return res.status(401).send('Invalid signature')
    }

    // Parse and handle event
    const event = JSON.parse(req.body.toString())
    await handleWebhookEvent(event)

    res.status(200).send('OK')
  }
)
```

### 2. Configure Webhook in Scaffald Dashboard

1. Go to [Scaffald Dashboard](https://app.scaffald.com)
2. Navigate to **Settings > Webhooks**
3. Click **Add Webhook Endpoint**
4. Enter your endpoint URL (e.g., `https://yourapp.com/webhooks/scaffald`)
5. Select events to subscribe to
6. Save and copy your webhook secret

### 3. Store Webhook Secret Securely

```bash
# .env
SCAFFALD_WEBHOOK_SECRET=whsec_abc123...
```

Never commit webhook secrets to version control!

## Verifying Signatures

**Always verify webhook signatures** to ensure requests come from Scaffald and haven't been tampered with.

### Using the SDK

```typescript
import { verifyWebhookSignature } from '@scaffald/sdk'

const signature = request.headers['x-webhook-signature']
const payload = request.body // Raw body as string or buffer

const isValid = await verifyWebhookSignature(
  payload,
  signature,
  process.env.SCAFFALD_WEBHOOK_SECRET
)

if (!isValid) {
  throw new Error('Invalid signature')
}
```

### Manual Verification

If you can't use the SDK, verify signatures manually:

```typescript
import crypto from 'crypto'

function verifySignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  const payloadString = typeof payload === 'string'
    ? payload
    : payload.toString('utf8')

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payloadString)
  const calculatedSignature = hmac.digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  )
}
```

### Important Notes

1. **Use Raw Body**: Verify signature against the raw request body, not parsed JSON
2. **Timing-Safe Comparison**: Use constant-time comparison to prevent timing attacks
3. **HTTPS Only**: Only accept webhooks over HTTPS in production

## Handling Events

### Event Structure

All webhook events have this structure:

```typescript
interface WebhookEvent {
  id: string               // Unique event ID
  type: string             // Event type (e.g., 'application.created')
  created: number          // Unix timestamp
  data: any                // Event-specific data
  livemode: boolean        // false for test events
}
```

### Example: Application Created Event

```json
{
  "id": "evt_abc123",
  "type": "application.created",
  "created": 1704067200,
  "livemode": true,
  "data": {
    "id": "app_xyz789",
    "job_id": "job_abc123",
    "applicant_id": "usr_def456",
    "status": "pending",
    "application_type": "quick",
    "current_location": "San Francisco, CA",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

### Event Handler Pattern

```typescript
async function handleWebhookEvent(event: WebhookEvent) {
  switch (event.type) {
    case 'application.created':
      await handleApplicationCreated(event.data)
      break

    case 'application.updated':
      await handleApplicationUpdated(event.data)
      break

    case 'application.status_changed':
      await handleApplicationStatusChanged(event.data)
      break

    case 'application.withdrawn':
      await handleApplicationWithdrawn(event.data)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

async function handleApplicationCreated(application: Application) {
  console.log(`New application ${application.id} for job ${application.job_id}`)

  // Send notification email
  await sendEmail({
    to: 'hiring@company.com',
    subject: 'New Application Received',
    body: `Applicant from ${application.current_location} applied`
  })

  // Update analytics
  await trackEvent('application_received', {
    job_id: application.job_id,
    application_type: application.application_type
  })
}

async function handleApplicationStatusChanged(application: Application) {
  console.log(`Application ${application.id} status changed to ${application.status}`)

  // Notify applicant
  if (application.status === 'interviewing') {
    await sendEmail({
      to: application.applicant_email,
      subject: 'Interview Invitation',
      body: 'We would like to interview you...'
    })
  }
}
```

## Best Practices

### 1. Return 200 Quickly

Respond to webhooks within 5 seconds to prevent timeouts and retries:

```typescript
app.post('/webhooks/scaffald', async (req, res) => {
  // Verify signature
  const isValid = await verifyWebhookSignature(...)
  if (!isValid) {
    return res.status(401).send('Invalid signature')
  }

  // Immediately return 200
  res.status(200).send('OK')

  // Process asynchronously
  const event = JSON.parse(req.body.toString())
  processWebhookAsync(event).catch(console.error)
})

async function processWebhookAsync(event: WebhookEvent) {
  // Long-running processing here
  await handleWebhookEvent(event)
}
```

### 2. Implement Idempotency

Scaffald may send duplicate events. Use event IDs to prevent duplicate processing:

```typescript
const processedEvents = new Set<string>()

async function handleWebhookEvent(event: WebhookEvent) {
  // Check if already processed
  if (processedEvents.has(event.id)) {
    console.log(`Event ${event.id} already processed, skipping`)
    return
  }

  // Process event
  await processEvent(event)

  // Mark as processed
  processedEvents.add(event.id)
}
```

For production, use a database or Redis:

```typescript
async function handleWebhookEvent(event: WebhookEvent) {
  const exists = await db.webhookEvent.findUnique({ where: { id: event.id } })
  if (exists) return

  await db.webhookEvent.create({ data: { id: event.id, processed_at: new Date() } })
  await processEvent(event)
}
```

### 3. Handle Failures Gracefully

```typescript
async function handleWebhookEvent(event: WebhookEvent) {
  try {
    await processEvent(event)
  } catch (error) {
    console.error(`Failed to process event ${event.id}:`, error)

    // Log to error tracking service
    await logError(error, { event })

    // Optionally: retry with exponential backoff
    await retryWithBackoff(() => processEvent(event), 3)
  }
}
```

### 4. Log All Events

Keep a record of all webhook events for debugging:

```typescript
async function handleWebhookEvent(event: WebhookEvent) {
  // Log raw event
  await db.webhookLog.create({
    data: {
      event_id: event.id,
      event_type: event.type,
      payload: event,
      received_at: new Date()
    }
  })

  await processEvent(event)
}
```

### 5. Use a Queue for Processing

For high-volume webhooks, use a message queue:

```typescript
import { Queue } from 'bull'

const webhookQueue = new Queue('webhooks')

app.post('/webhooks/scaffald', async (req, res) => {
  const isValid = await verifyWebhookSignature(...)
  if (!isValid) return res.status(401).send('Invalid')

  const event = JSON.parse(req.body.toString())

  // Add to queue
  await webhookQueue.add('process-webhook', event)

  res.status(200).send('OK')
})

// Worker process
webhookQueue.process('process-webhook', async (job) => {
  await handleWebhookEvent(job.data)
})
```

## Full Example

### Express + TypeScript

```typescript
import express from 'express'
import { verifyWebhookSignature } from '@scaffald/sdk'
import type { Application } from '@scaffald/sdk'

const app = express()

// Webhook endpoint
app.post(
  '/webhooks/scaffald',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['x-webhook-signature'] as string
    const secret = process.env.SCAFFALD_WEBHOOK_SECRET!

    // Verify signature
    const isValid = await verifyWebhookSignature(req.body, signature, secret)
    if (!isValid) {
      console.error('Invalid webhook signature')
      return res.status(401).send('Invalid signature')
    }

    // Parse event
    const event = JSON.parse(req.body.toString())

    // Log event
    console.log(`Received webhook: ${event.type} (${event.id})`)

    // Return 200 immediately
    res.status(200).send('OK')

    // Process asynchronously
    try {
      await handleWebhookEvent(event)
    } catch (error) {
      console.error('Error processing webhook:', error)
    }
  }
)

interface WebhookEvent {
  id: string
  type: string
  created: number
  data: Application
  livemode: boolean
}

async function handleWebhookEvent(event: WebhookEvent) {
  switch (event.type) {
    case 'application.created':
      console.log(`New application: ${event.data.id}`)
      await notifyHiringManager(event.data)
      break

    case 'application.status_changed':
      console.log(`Application ${event.data.id} status: ${event.data.status}`)
      await notifyApplicant(event.data)
      break

    default:
      console.log(`Unhandled event: ${event.type}`)
  }
}

async function notifyHiringManager(application: Application) {
  // Send email, Slack notification, etc.
}

async function notifyApplicant(application: Application) {
  // Send status update email
}

app.listen(3000)
```

### Next.js API Route

```typescript
// pages/api/webhooks/scaffald.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyWebhookSignature } from '@scaffald/sdk'
import { buffer } from 'micro'

// Disable body parsing, we need raw body
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  const signature = req.headers['x-webhook-signature'] as string
  const rawBody = await buffer(req)

  const isValid = await verifyWebhookSignature(
    rawBody,
    signature,
    process.env.SCAFFALD_WEBHOOK_SECRET!
  )

  if (!isValid) {
    return res.status(401).send('Invalid signature')
  }

  const event = JSON.parse(rawBody.toString())

  // Process event
  await handleWebhookEvent(event)

  res.status(200).send('OK')
}
```

## Troubleshooting

### Signature Verification Fails

**Problem:** Signature verification always fails

**Solutions:**

1. Check webhook secret is correct
2. Verify you're using the raw request body (not parsed JSON)
3. Ensure no middleware is modifying the body
4. Check for encoding issues (UTF-8)

```typescript
// ✅ Correct: Use raw body
app.use('/webhooks', express.raw({ type: 'application/json' }))

// ❌ Wrong: Don't use JSON parser
app.use('/webhooks', express.json()) // Modifies body!
```

### Webhooks Timing Out

**Problem:** Scaffald retries webhooks repeatedly

**Solutions:**

1. Return 200 within 5 seconds
2. Process asynchronously
3. Move heavy processing to background job

```typescript
// ✅ Good: Quick response
app.post('/webhook', async (req, res) => {
  res.status(200).send('OK')
  processAsync(req.body)
})

// ❌ Bad: Slow processing
app.post('/webhook', async (req, res) => {
  await heavyProcessing() // Takes 30 seconds
  res.status(200).send('OK')
})
```

### Duplicate Events

**Problem:** Same event processed multiple times

**Solution:** Implement idempotency using event IDs

```typescript
const processed = new Set<string>()

async function handleEvent(event) {
  if (processed.has(event.id)) return
  processed.add(event.id)
  await processEvent(event)
}
```

### Missing Events

**Problem:** Not receiving expected webhooks

**Solutions:**

1. Check webhook configuration in dashboard
2. Verify endpoint is publicly accessible
3. Check server logs for errors
4. Test with webhook testing tools (e.g., webhook.site)
5. Ensure HTTPS is working (Scaffald only sends to HTTPS in production)

## Testing Webhooks

### Manual Testing

Use the Scaffald Dashboard to send test webhooks:

1. Go to **Settings > Webhooks**
2. Select your webhook endpoint
3. Click **Send Test Event**

### Local Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your local server
npm run dev

# Expose to internet
ngrok http 3000

# Use ngrok URL in webhook settings
https://abc123.ngrok.io/webhooks/scaffald
```

### Automated Testing

```typescript
import { verifyWebhookSignature } from '@scaffald/sdk'

describe('Webhook Handler', () => {
  it('should verify valid signature', async () => {
    const payload = JSON.stringify({ id: 'evt_123', type: 'test' })
    const secret = 'test_secret'

    const signature = await generateSignature(payload, secret)
    const isValid = await verifyWebhookSignature(payload, signature, secret)

    expect(isValid).toBe(true)
  })

  it('should reject invalid signature', async () => {
    const payload = JSON.stringify({ id: 'evt_123' })
    const isValid = await verifyWebhookSignature(
      payload,
      'invalid_signature',
      'test_secret'
    )

    expect(isValid).toBe(false)
  })
})
```

---

## Next Steps

- [Getting Started Guide](./getting-started.md)
- [API Reference](./api-reference.md)
- [OAuth Guide](./oauth.md)
- [Error Handling](./error-handling.md)
