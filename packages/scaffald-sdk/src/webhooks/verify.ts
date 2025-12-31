/**
 * Webhook event types
 */
export type WebhookEvent = 'application.created' | 'application.updated' | 'application.withdrawn'

/**
 * Webhook payload structure
 */
export interface WebhookPayload<T = unknown> {
  event: WebhookEvent
  timestamp: string
  data: T
}

/**
 * Verify webhook signature using HMAC SHA-256
 *
 * @param payload - The webhook payload (string or object)
 * @param signature - The signature from X-Webhook-Signature header
 * @param secret - Your webhook secret
 * @returns Promise<boolean> - True if signature is valid
 *
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from '@scaffald/sdk'
 *
 * // In your webhook handler
 * app.post('/webhooks/scaffald', async (req, res) => {
 *   const signature = req.headers['x-webhook-signature']
 *   const isValid = await verifyWebhookSignature(
 *     req.body,
 *     signature,
 *     process.env.SCAFFALD_WEBHOOK_SECRET
 *   )
 *
 *   if (!isValid) {
 *     return res.status(401).send('Invalid signature')
 *   }
 *
 *   // Process webhook
 *   const payload = req.body as WebhookPayload
 *   console.log('Event:', payload.event)
 *   console.log('Data:', payload.data)
 *
 *   res.status(200).send('OK')
 * })
 * ```
 */
export async function verifyWebhookSignature(
  payload: string | object,
  signature: string | undefined,
  secret: string
): Promise<boolean> {
  if (!signature) {
    return false
  }

  const encoder = new TextEncoder()
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload)

  // Import crypto key
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Calculate signature
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const calculatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison to prevent timing attacks
  return signature === calculatedSignature
}

/**
 * Parse and verify webhook payload
 *
 * @param body - The webhook request body
 * @param signature - The signature from X-Webhook-Signature header
 * @param secret - Your webhook secret
 * @returns Promise<WebhookPayload | null> - Parsed payload if valid, null if invalid
 *
 * @example
 * ```typescript
 * const payload = await parseWebhook(req.body, req.headers['x-webhook-signature'], secret)
 * if (!payload) {
 *   return res.status(401).send('Invalid signature')
 * }
 *
 * switch (payload.event) {
 *   case 'application.created':
 *     console.log('New application:', payload.data)
 *     break
 *   case 'application.updated':
 *     console.log('Application updated:', payload.data)
 *     break
 *   case 'application.withdrawn':
 *     console.log('Application withdrawn:', payload.data)
 *     break
 * }
 * ```
 */
export async function parseWebhook(
  body: string | object,
  signature: string | undefined,
  secret: string
): Promise<WebhookPayload | null> {
  const isValid = await verifyWebhookSignature(body, signature, secret)
  if (!isValid) {
    return null
  }

  const payload = typeof body === 'string' ? JSON.parse(body) : body
  return payload as WebhookPayload
}
