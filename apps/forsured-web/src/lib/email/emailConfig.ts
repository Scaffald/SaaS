/**
 * ForSured Email Manager Configuration
 *
 * REQ-130: Email communication auditability
 *
 * STUB IMPLEMENTATION: The @bernierllc/email-manager package is not available.
 * This provides stub implementations for server-side email functionality.
 *
 * TODO: Implement proper email sending via Supabase Edge Functions or replace with working package
 *
 * This is a server-side module (Node.js only).
 */

// Validate required environment variables at module load
if (typeof process !== 'undefined') {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[email-manager] SENDGRID_API_KEY not set - email sending will fail')
  }
}

/**
 * Send a simple email - STUB IMPLEMENTATION
 */
export async function sendEmail(options: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  metadata?: Record<string, unknown>
}) {
  console.warn('[email-manager] STUB: sendEmail called', {
    to: options.to,
    subject: options.subject,
    metadata: options.metadata,
  })

  // Return a mock successful result
  return {
    success: true,
    messageId: `stub-${Date.now()}`,
    provider: 'stub',
  }
}

/**
 * Send a templated email - STUB IMPLEMENTATION
 */
export async function sendTemplatedEmail(
  templateId: string,
  data: Record<string, unknown>,
  to: string | string[],
  metadata?: Record<string, unknown>
) {
  console.warn('[email-manager] STUB: sendTemplatedEmail called', {
    templateId,
    to,
    metadata,
  })

  // Return a mock successful result
  return {
    success: true,
    messageId: `stub-${Date.now()}`,
    provider: 'stub',
  }
}

/**
 * Track an email event for audit logging - STUB IMPLEMENTATION
 * Called from the webhook handler
 */
export function trackEmailEvent(
  eventType: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam_report',
  messageId: string,
  recipient: string,
  metadata?: Record<string, unknown>
) {
  console.warn('[email-manager] STUB: trackEmailEvent called', {
    eventType,
    messageId,
    recipient,
    metadata,
  })

  // Return void (no-op)
}
