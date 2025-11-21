import type Stripe from 'stripe'
import { describe, expect, it } from 'vitest'

import failedEvent from './fixtures/payment_intent_failed.json'
import succeededEvent from './fixtures/payment_intent_succeeded.json'
import { handleStripeEvent, loadStripeSecretsWithClient } from '../handler'
import { createStripeWebhookSupabaseMock } from '../../../../../tests/infrastructure/vitest/helpers/supabase-webhook-mock'

const baseTransaction = {
  id: 'txn_1',
  stripe_payment_intent_id: 'pi_12345',
  status: 'pending',
  metadata: { existing: true },
  succeeded_at: null,
  failed_at: null,
  failure_reason: null,
}

describe('stripe webhook handler', () => {
  it('loads secrets from Supabase RPCs', async () => {
    const mock = createStripeWebhookSupabaseMock({
      stripeSettings: {
        api_key_secret_id: 'api_secret_id',
        webhook_secret_id: 'webhook_secret_id',
      },
      secrets: {
        api_secret_id: 'sk_test_api',
        webhook_secret_id: 'whsec_test_secret',
      },
    })

    const secrets = await loadStripeSecretsWithClient(mock.client)

    expect(secrets).toEqual({ apiKey: 'sk_test_api', webhookSecret: 'whsec_test_secret' })
  })

  it('updates transactions when payment intents succeed', async () => {
    const mock = createStripeWebhookSupabaseMock({
      transactions: [baseTransaction],
    })

    await handleStripeEvent(mock.client, succeededEvent as unknown as Stripe.Event)
    const updated = mock.getTransaction('txn_1')

    expect(updated?.status).toBe('succeeded')
    expect(updated?.metadata).toMatchObject({
      existing: true,
      last_stripe_event_id: succeededEvent.id,
      last_stripe_event_type: succeededEvent.type,
    })
    expect(updated?.succeeded_at).toBe(new Date(succeededEvent.data.object.created * 1000).toISOString())
  })

  it('is idempotent for previously processed events', async () => {
    const mock = createStripeWebhookSupabaseMock({
      transactions: [
        {
          ...baseTransaction,
          status: 'succeeded',
          metadata: {
            ...baseTransaction.metadata,
            last_stripe_event_id: succeededEvent.id,
          },
        },
      ],
    })

    await handleStripeEvent(mock.client, succeededEvent as unknown as Stripe.Event)
    const updated = mock.getTransaction('txn_1')

    expect(updated?.status).toBe('succeeded')
    expect(updated?.metadata?.last_stripe_event_type).toBeUndefined()
  })

  it('records failure reasons for payment failures', async () => {
    const mock = createStripeWebhookSupabaseMock({
      transactions: [baseTransaction],
    })

    await handleStripeEvent(mock.client, failedEvent as unknown as Stripe.Event)
    const updated = mock.getTransaction('txn_1')

    expect(updated?.status).toBe('failed')
    expect(updated?.failure_reason).toBe('Card declined')
    expect(updated?.failed_at).not.toBeNull()
  })
})
