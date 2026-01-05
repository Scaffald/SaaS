# SendGrid Webhook Payload Documentation

> **Generated:** 2024-12-24
> **REQ-130:** Email Communication Auditability

## Overview

This document describes the SendGrid Event Webhook payload structure used for email delivery tracking in ForSured. Webhook events are captured and logged to the audit trail for compliance purposes.

## Test Emails Sent

| Test | Message ID | Timestamp |
|------|-----------|-----------|
| Simple HTML Email | fXmyfFFTSgaNj4luftz2rQ | 2025-12-25T03:57:46Z |
| ForSured Context Email | 9-6bBLK6QTeLg4L_lH8ppQ | 2025-12-25T03:57:47Z |
| Invitation Email | PTGUvv03R5ywIsZdWOoB_w | 2025-12-25T03:57:48Z |

## Webhook Configuration

### SendGrid Dashboard Setup

1. Navigate to **Settings → Mail Settings → Event Webhook**
2. Enable the Event Webhook
3. Set HTTP POST URL to your endpoint:
   - **Development:** Use ngrok or similar to expose local endpoint
   - **Production:** `https://app.forsured.com/api/webhooks/sendgrid`
4. Select events to track:
   - ✅ Processed
   - ✅ Dropped
   - ✅ Delivered
   - ✅ Deferred
   - ✅ Bounce
   - ✅ Open
   - ✅ Click
   - ✅ Spam Report
   - ✅ Unsubscribe

### Local Development Testing

1. Start the dev server: `pnpm dev`
2. Expose with ngrok: `ngrok http 3000`
3. Configure SendGrid webhook to ngrok URL + `/api/webhooks/sendgrid-capture`
4. Open test emails to trigger events
5. Retrieve captured payloads: `GET /api/webhooks/sendgrid-capture`

## Event Types

### Delivery Events

| Event | Description | Audit Action |
|-------|-------------|--------------|
| `processed` | Email accepted by SendGrid | `email_processed` |
| `delivered` | Email delivered to recipient's server | `email_delivered` |
| `deferred` | Temporary delivery failure, will retry | `email_deferred` |
| `dropped` | Email dropped (spam, invalid, etc.) | `email_dropped` |
| `bounce` | Permanent delivery failure | `email_bounced` |

### Engagement Events

| Event | Description | Audit Action |
|-------|-------------|--------------|
| `open` | Recipient opened email | `email_opened` |
| `click` | Recipient clicked a link | `email_clicked` |
| `spamreport` | Recipient marked as spam | `email_spam_report` |
| `unsubscribe` | Recipient unsubscribed | `email_unsubscribed` |

## Payload Structure

### Standard Fields (All Events)

```json
{
  "email": "recipient@example.com",
  "timestamp": 1703473066,
  "event": "delivered",
  "sg_event_id": "abc123",
  "sg_message_id": "fXmyfFFTSgaNj4luftz2rQ.filterdrecv-abc123-1"
}
```

### Delivery Event Fields

```json
{
  "email": "recipient@example.com",
  "timestamp": 1703473066,
  "event": "delivered",
  "sg_event_id": "delivery-event-123",
  "sg_message_id": "fXmyfFFTSgaNj4luftz2rQ",
  "response": "250 2.0.0 OK 1703473066",
  "ip": "168.245.xxx.xxx",
  "tls": 1
}
```

### Open Event Fields

```json
{
  "email": "recipient@example.com",
  "timestamp": 1703473200,
  "event": "open",
  "sg_event_id": "open-event-456",
  "sg_message_id": "fXmyfFFTSgaNj4luftz2rQ",
  "useragent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "ip": "xxx.xxx.xxx.xxx"
}
```

### Click Event Fields

```json
{
  "email": "recipient@example.com",
  "timestamp": 1703473300,
  "event": "click",
  "sg_event_id": "click-event-789",
  "sg_message_id": "fXmyfFFTSgaNj4luftz2rQ",
  "url": "https://forsured.com/test-link",
  "useragent": "Mozilla/5.0...",
  "ip": "xxx.xxx.xxx.xxx"
}
```

### Bounce Event Fields

```json
{
  "email": "bounced@example.com",
  "timestamp": 1703473100,
  "event": "bounce",
  "sg_event_id": "bounce-event-123",
  "sg_message_id": "fXmyfFFTSgaNj4luftz2rQ",
  "reason": "550 5.1.1 User unknown",
  "status": "5.1.1",
  "type": "bounce",
  "bounce_classification": "Invalid"
}
```

## Custom Args (ForSured Context)

Custom args passed when sending emails are included in webhook payloads:

```json
{
  "email": "recipient@example.com",
  "event": "delivered",
  "sg_message_id": "...",

  "forsured": "true",
  "testType": "context",
  "projectId": "proj-test-123",
  "taskId": "task-test-456",
  "invitationId": "inv-test-123",
  "invitationType": "project"
}
```

### Available Custom Args

| Field | Description |
|-------|-------------|
| `forsured` | Always `"true"` for ForSured emails |
| `projectId` | Associated project ID |
| `taskId` | Associated task ID |
| `subcontractorId` | Recipient subcontractor ID |
| `organizationId` | Sender organization ID |
| `invitationId` | Invitation record ID |
| `invitationType` | Type: `broker`, `relationship`, `referral`, `project` |
| `testType` | For test emails: `simple`, `context`, `invitation` |

## Categories

Emails are tagged with categories for filtering:

```json
{
  "category": ["forsured", "test"]
}
```

### Production Categories

| Category | Description |
|----------|-------------|
| `forsured` | All ForSured platform emails |
| `invitation` | Invitation emails |
| `compliance` | Compliance alerts |
| `notification` | General notifications |

## Filtering ForSured Emails

Webhook handler uses multiple signals to identify ForSured emails:

```typescript
function isForSuredEmail(event: SendGridEvent): boolean {
  // Check custom args
  if (event.forsured === true || event.forsured === 'true') return true;

  // Check categories
  if (event.category?.includes('forsured')) return true;

  // Check context fields
  if (event.projectId || event.taskId || event.subcontractorId) return true;

  return false;
}
```

## Batch Processing

SendGrid sends webhooks in batches. Each POST contains an array of events:

```json
[
  { "email": "a@example.com", "event": "delivered", ... },
  { "email": "a@example.com", "event": "open", ... },
  { "email": "b@example.com", "event": "delivered", ... }
]
```

## Security

### Signature Verification

Production webhooks should verify the SendGrid signature:

```typescript
import crypto from 'crypto';

function verifySignature(
  payload: string,
  signature: string,
  timestamp: string,
  verificationKey: string
): boolean {
  const timestampPayload = timestamp + payload;
  const expectedSignature = crypto
    .createHmac('sha256', verificationKey)
    .update(timestampPayload)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Headers

| Header | Description |
|--------|-------------|
| `X-Twilio-Email-Event-Webhook-Signature` | HMAC signature |
| `X-Twilio-Email-Event-Webhook-Timestamp` | Unix timestamp |

## Provider Registration

### Correct Pattern (Fixed 2024-12-24)

The email-manager requires using `addProvider()` async method, NOT passing providers in constructor config:

```typescript
// WRONG - providers in constructor don't activate
const manager = new EmailManager({
  providers: [{ id: 'sendgrid', ... }]
});

// CORRECT - use addProvider() async method
const manager = new EmailManager({ providers: [] });
await manager.addProvider({
  id: 'sendgrid-primary',
  name: 'SendGrid Primary',
  type: 'sendgrid',
  config: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
    fromName: 'ForSured',
  },
  isActive: true,
  priority: 1,
});
```

See `src/lib/email/emailConfig.ts` for the implementation with `ensureProviderRegistered()`.

## Related Files

| File | Purpose |
|------|---------|
| `src/app/api/webhooks/sendgrid/route.ts` | Production webhook handler |
| `src/app/api/webhooks/sendgrid-capture/route.ts` | Test capture endpoint |
| `src/lib/email/emailConfig.ts` | Email manager configuration |
| `src/lib/email/emailIntegration.ts` | ForSured email integration |
| `scripts/test-sendgrid-direct.ts` | Direct API test script |
| `scripts/test-email-sending.ts` | Email-manager test script |
