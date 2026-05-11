import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'

import { createOpenAIHandler } from './msw/openai'
import { createSendgridHandler } from './msw/sendgrid'
import { createStripeHandler } from './msw/stripe'
import type { ContractInteraction } from './msw/types'

const interactions: ContractInteraction[] = []

const record = (interaction: ContractInteraction) => {
  interactions.push(interaction)
}

const server = setupServer(
  createOpenAIHandler(record),
  createSendgridHandler(record),
  createStripeHandler(record),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => {
  server.close()
  const outDir = resolve(import.meta.dirname, 'generated')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(
    resolve(outDir, 'contracts.json'),
    JSON.stringify({ contracts: interactions }, null, 2),
  )
})

describe('Third-party API contracts', () => {
  // MapboxProvider was removed from @scaffald/ui; skipped until re-implemented
  it.skip('satisfies the Mapbox geocoding contract via the provider hook', async () => {
    expect(true).toBe(true)
  })

  it('satisfies the OpenAI chat completions contract', async () => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer openai-test-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a resume parser' },
          { role: 'user', content: 'Parse this resume content please' },
        ],
      }),
    })

    expect(response.status).toBe(200)
    const completion = await response.json()
    expect(completion.choices?.[0]?.message?.content).toContain('Casey Contractor')
  })

  it('satisfies the Stripe account lookup contract', async () => {
    const response = await fetch('https://api.stripe.com/v1/accounts', {
      headers: { Authorization: 'Bearer stripe-key' },
    })

    expect(response.status).toBe(200)
    const account = await response.json()
    expect(account.object).toBe('account')
  })

  it('satisfies the SendGrid mail send contract', async () => {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer sendgrid-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: 'user@example.com', name: 'Recipient' }],
            subject: 'Contract test',
          },
        ],
        from: { email: 'no-reply@example.com', name: 'Contract Harness' },
        content: [{ type: 'text/plain', value: 'This is a contract test message.' }],
      }),
    })

    expect(response.status).toBe(202)
  })
})
