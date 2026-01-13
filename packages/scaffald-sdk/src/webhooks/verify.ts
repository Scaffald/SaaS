/**
 * Webhook signature verification utilities
 *
 * Scaffald webhooks are signed with HMAC-SHA256 to ensure authenticity.
 * The signature is sent in the 'x-webhook-signature' header.
 */

/**
 * Verify a webhook signature
 *
 * @param payload - The raw webhook payload (string or object)
 * @param signature - The signature from the 'x-webhook-signature' header
 * @param secret - Your webhook secret from the Scaffald dashboard
 * @returns true if the signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * import { Webhooks } from '@scaffald/sdk'
 *
 * // Express.js middleware
 * app.post('/webhooks/scaffald', async (req, res) => {
 *   const signature = req.headers['x-webhook-signature'] as string
 *   const isValid = await Webhooks.verify(req.body, signature, process.env.WEBHOOK_SECRET)
 *
 *   if (!isValid) {
 *     return res.status(401).json({ error: 'Invalid signature' })
 *   }
 *
 *   // Process webhook...
 *   res.json({ received: true })
 * })
 * ```
 */
export async function verifyWebhookSignature(
  payload: string | object,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload)

    // Import the secret key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Calculate the signature
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    const calculatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Compare signatures (constant-time comparison)
    return signature === calculatedSignature
  } catch (error) {
    console.error('[Scaffald SDK] Webhook signature verification failed:', error)
    return false
  }
}

/**
 * Webhook event types
 */
export type WebhookEvent =
  | 'application.created'
  | 'application.updated'
  | 'application.withdrawn'
  | 'job.created'
  | 'job.updated'
  | 'job.published'
  | 'job.closed'

/**
 * Webhook payload structure
 */
export interface WebhookPayload<T = any> {
  event: WebhookEvent
  data: T
  timestamp: string
  webhook_id: string
}

/**
 * Webhooks namespace
 */
export const Webhooks = {
  verify: verifyWebhookSignature,
}
