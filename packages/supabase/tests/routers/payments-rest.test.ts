/**
 * Payments REST API — authorization and the transaction reads.
 *
 * Two bugs, fixed together because fixing either alone is unsafe:
 *
 * - Every `/v1/payments` handler reads through the service role and checked only
 *   that the caller was signed in. A worker in no organization read platform
 *   payment analytics and any organization's credits and payment method (#1041).
 * - The transaction reads embedded `user:profiles(...)`, and there is no
 *   relationship from payment_transactions to profiles, so list, export and
 *   receipt answered 500 on production (#1019). That 500 was the only thing
 *   keeping transactions from the same callers.
 *
 * Users: `office` is zach@unicorn.love (platform office role); `regular` is
 * test@example.com (no office role, no organization).
 */

import { assertEquals, assertExists } from '../shared/assert.ts'

import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  createAdminClient,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const API = `${TEST_SUPABASE_URL}/functions/v1/api/v1/payments`

async function call(path: string, token: string) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  })
  const text = await response.text()
  let body: Record<string, unknown> | null = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  return { status: response.status, body }
}

async function setup() {
  await requireAuthSetup()
  const tokens = await loadCachedTokens()
  assertExists(tokens, 'Cached tokens should exist')
  assertExists(tokens.office, 'An office-role token is required')
  const admin = createAdminClient()
  const { data: org } = await admin.schema('core').from('organizations').select('id').eq('slug', 'unicorn').single()
  assertExists(org?.id, 'The seeded Unicorn organization should exist')
  // The cached entry's userId can be empty; the JWT's `sub` is authoritative.
  const officeUserId = JSON.parse(atob(tokens.office!.token.split('.')[1])).sub as string
  return { tokens, office: tokens.office!, officeUserId, admin, orgId: org.id as string }
}

Deno.test({
  name: 'Payments REST - a caller without the office role is refused on every read',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { tokens, orgId } = await setup()
    const paths = [
      '/analytics',
      '/transactions',
      '/transactions/export',
      '/receipts/00000000-0000-0000-0000-000000000000',
      `/credits?organizationId=${orgId}`,
      `/credits/ledger?organizationId=${orgId}`,
      `/payment-methods?organizationId=${orgId}`,
    ]
    for (const path of paths) {
      const { status } = await call(path, tokens.regular.token)
      assertEquals(status, 403, `${path} must be office-only, got ${status}`)
    }
  },
})

Deno.test({
  name: 'Payments REST - the office reads transactions, the export and a receipt, with the payer named',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { office, officeUserId, admin, orgId } = await setup()

    const { data: tx, error } = await admin
      .schema('core')
      .from('payment_transactions')
      .insert({
        organization_id: orgId,
        user_id: officeUserId,
        stripe_payment_intent_id: `pi_test_payments_rest_${Date.now()}`,
        amount_cents: 4900,
        transaction_type: 'background_check',
        status: 'succeeded',
        succeeded_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    assertEquals(error, null, `seeding a transaction failed: ${error?.message}`)
    const id = tx!.id as string

    try {
      const { data: payer } = await admin.schema('core').from('users').select('display_name').eq('id', officeUserId).single()

      const list = await call(`/transactions?organizationId=${orgId}&limit=100`, office.token)
      assertEquals(list.status, 200, `list should load, got ${JSON.stringify(list.body)}`)
      const item = (list.body?.items as { id: string; userName: string | null }[]).find((t) => t.id === id)
      assertExists(item, 'the seeded transaction is listed')
      assertEquals(item?.userName, payer?.display_name ?? null, 'the payer is named from core.users')

      const exported = await call(`/transactions/export?organizationId=${orgId}`, office.token)
      assertEquals(exported.status, 200, `export should succeed, got ${JSON.stringify(exported.body)}`)
      assertEquals(String(exported.body?.data ?? '').includes(id), true, 'the export contains the transaction')

      const receipt = await call(`/receipts/${id}`, office.token)
      assertEquals(receipt.status, 200, `receipt should load, got ${JSON.stringify(receipt.body)}`)
      assertEquals(receipt.body?.transactionId, id)
      assertEquals(receipt.body?.amountCents, 4900)
    } finally {
      await admin.schema('core').from('payment_transactions').delete().eq('id', id)
    }
  },
})
