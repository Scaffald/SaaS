import { describe, it, expect } from 'vitest'
import { Webhooks } from '../webhooks/verify'

describe('Webhooks', () => {
  const secret = 'test_webhook_secret_key_12345'

  describe('verify', () => {
    it('should verify valid webhook signature', async () => {
      const payload = {
        event: 'application.created',
        data: { id: 'app_123', job_id: 'job_456' },
        timestamp: '2024-01-01T00:00:00Z',
        webhook_id: 'wh_123',
      }

      // Calculate expected signature using Web Crypto API
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(JSON.stringify(payload))
      )
      const signature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      const isValid = await Webhooks.verify(payload, signature, secret)
      expect(isValid).toBe(true)
    })

    it('should reject invalid signature', async () => {
      const payload = {
        event: 'application.created',
        data: { id: 'app_123' },
        timestamp: '2024-01-01T00:00:00Z',
        webhook_id: 'wh_123',
      }

      const invalidSignature = 'invalid_signature_12345'
      const isValid = await Webhooks.verify(payload, invalidSignature, secret)
      expect(isValid).toBe(false)
    })

    it('should verify string payload', async () => {
      const payload = '{"event":"job.created","data":{"id":"job_123"}}'

      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
      const signature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      const isValid = await Webhooks.verify(payload, signature, secret)
      expect(isValid).toBe(true)
    })

    it('should reject signature with wrong secret', async () => {
      const payload = { event: 'job.updated', data: {} }

      const encoder = new TextEncoder()
      const correctKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        correctKey,
        encoder.encode(JSON.stringify(payload))
      )
      const signature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      const wrongSecret = 'wrong_secret'
      const isValid = await Webhooks.verify(payload, signature, wrongSecret)
      expect(isValid).toBe(false)
    })

    it('should handle malformed signatures gracefully', async () => {
      const payload = { event: 'application.updated', data: {} }
      const malformedSignature = 'not-a-valid-hex-string!'

      const isValid = await Webhooks.verify(payload, malformedSignature, secret)
      expect(isValid).toBe(false)
    })
  })
})
