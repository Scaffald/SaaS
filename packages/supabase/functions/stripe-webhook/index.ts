import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'

import { createServiceSupabaseClient } from '../_shared/notifications/utils.ts'
import {
  createStripeApiClient,
  getStripeClass,
  loadStripeSecrets,
} from '../_shared/payments/stripe-client.ts'
import { handleStripeWebhook } from './webhook.ts'

// `stripe` resolves through packages/supabase/package.json ("stripe": "20.4.1"),
// pulled in lazily by _shared/payments/stripe-client. This function used to
// override it in its own deno.json with a version npm never published (#923).
//
// The ledger write and the paid-state advance both live in
// _shared/payments/settlement.ts (#948). This function used to update
// `payment_transactions` and stop there, so a successful upfront success-fee
// charge left `core.success_fees` at status 'pending' with `upfront_paid_at`
// null — the two tables disagreeing about whether the money arrived, with no
// path that would ever reconcile them. `payments-reconcile` shares the same
// module so a missed webhook settles identically to a delivered one.
//
// The handler lives in webhook.ts so it can be tested (#1259).

serve((req) => {
  const supabase = createServiceSupabaseClient()
  return handleStripeWebhook(req, {
    supabase,
    loadSecrets: () => loadStripeSecrets(supabase),
    createStripe: (apiKey) => createStripeApiClient(apiKey),
    cryptoProvider: async () => (await getStripeClass()).createSubtleCryptoProvider(),
  })
})
