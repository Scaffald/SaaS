/**
 * ForSured Email Manager Configuration
 *
 * REQ-130: Email communication auditability
 *
 * Uses @bernierllc/email-manager for:
 * - SendGrid email sending
 * - Multi-provider support with failover
 * - Email event tracking for audit logging
 *
 * This is a server-side module (Node.js only).
 */

import { EmailManager, EmailManagerConfig } from '@bernierllc/email-manager'

// Validate required environment variables at module load
if (typeof process !== 'undefined') {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[email-manager] SENDGRID_API_KEY not set - email sending will fail')
  }
}

/**
 * Email Manager Configuration
 */
const emailConfig: EmailManagerConfig = {
  providers: [
    {
      id: 'sendgrid-primary',
      name: 'SendGrid Primary',
      type: 'sendgrid',
      config: {
        apiKey: process.env.SENDGRID_API_KEY || '',
      },
      isActive: true,
      priority: 1,
      rateLimit: {
        maxPerSecond: 100,
        maxPerMinute: 1000,
        maxPerHour: 10000,
      },
    },
  ],
  analytics: {
    enabled: true,
  },
  scheduling: {
    enabled: true,
    checkInterval: 60000, // 1 minute
    retryAttempts: 3,
    retryDelay: 300000, // 5 minutes
  },
  defaults: {
    from: {
      email: process.env.EMAIL_FROM_ADDRESS || 'noreply@forsured.com',
      name: process.env.EMAIL_FROM_NAME || 'ForSured',
    },
  },
}

/**
 * Singleton EmailManager instance
 */
let emailManagerInstance: EmailManager | null = null

/**
 * Get or create the EmailManager instance
 * Lazily initializes to avoid issues when env vars aren't loaded yet
 */
export function getEmailManager(): EmailManager {
  if (!emailManagerInstance) {
    emailManagerInstance = new EmailManager(emailConfig)
  }
  return emailManagerInstance
}

/**
 * Send a simple email
 */
export async function sendEmail(options: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  metadata?: Record<string, unknown>
}) {
  const manager = getEmailManager()
  return manager.sendEmail({
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    metadata: options.metadata,
  })
}

/**
 * Send a templated email
 */
export async function sendTemplatedEmail(
  templateId: string,
  data: Record<string, unknown>,
  to: string | string[],
  metadata?: Record<string, unknown>
) {
  const manager = getEmailManager()
  return manager.sendTemplatedEmail(templateId, data, Array.isArray(to) ? to : [to], metadata)
}

/**
 * Track an email event for audit logging
 * Called from the webhook handler
 */
export function trackEmailEvent(
  eventType: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam_report',
  messageId: string,
  recipient: string,
  metadata?: Record<string, unknown>
) {
  const manager = getEmailManager()
  return manager.trackEmailEvent(eventType, messageId, recipient, metadata)
}

// Export the manager for direct access if needed
export { EmailManager }
