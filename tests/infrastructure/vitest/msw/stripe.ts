
import { http, HttpResponse } from 'msw'

const stripeAccountResponse = {
  id: 'acct_contract_123',
  object: 'account',
  business_type: 'company',
  charges_enabled: true,
  details_submitted: true,
  payouts_enabled: true,
}

export const createStripeHandler = () =>
  http.get('https://api.stripe.com/v1/accounts', () => {
    return HttpResponse.json(stripeAccountResponse)
  })
