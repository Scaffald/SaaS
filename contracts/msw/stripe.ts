import { http, HttpResponse } from 'msw'

import type { ContractInteractionRecorder } from './types'

const stripeAccountResponse = {
  id: 'acct_contract_123',
  object: 'account',
  business_type: 'company',
  charges_enabled: true,
  details_submitted: true,
  payouts_enabled: true,
}

export const createStripeHandler = (record: ContractInteractionRecorder) =>
  http.get('https://api.stripe.com/v1/accounts', ({ request }) => {
    record({
      provider: 'stripe',
      name: 'Stripe account lookup',
      request: {
        method: request.method,
        url: request.url,
        headers: { authorization: request.headers.get('authorization') },
      },
      response: {
        status: 200,
        body: stripeAccountResponse,
      },
    })

    return HttpResponse.json(stripeAccountResponse)
  })
