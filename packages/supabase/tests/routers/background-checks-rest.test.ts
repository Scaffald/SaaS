/// <reference lib="deno.ns" />

/**
 * Background checks REST — the worker's side (#1267 part 1, #1127).
 *
 * What was broken, and what each test pins down:
 *
 *   - `/request` inserted `status: 'pending_payment'` and `initiated_at`;
 *     neither exists, so every request 500'd. It also returned `pi_mock`
 *     instead of a real intent and wrote no ledger row.
 *   - `paid_by: 'employer'` is not a value of the `background_check_paid_by`
 *     enum (worker | organization | platform); the Office request form sends
 *     it for every employer-paid check, so that whole flow 500'd too.
 *   - The SDK called five routes the api never had: confirm-payment, the two
 *     document routes, create dispute and list disputes.
 *   - `/packages` selected `*`, sending `platform_cost_cents` to every worker.
 *   - `PATCH /:id/privacy` wrote a `privacy_level` column that does not exist.
 *   - Mounting the worker router before the admin router would have let the
 *     new `GET /:checkId/disputes` swallow `GET /admin/disputes`.
 *
 * Runs against the real `api` function and the real database, with Stripe in
 * mock mode — the same setup, and the same reason it is not in GATED.txt yet,
 * as id-verification-rest.test.ts (#937: nothing passes STRIPE_MOCK_MODE to
 * the shared edge runtime CI starts). Verified with:
 *
 *     cd packages/supabase/functions/api
 *     SUPABASE_URL=http://127.0.0.1:54321 \
 *     SUPABASE_ANON_KEY=<local anon> SUPABASE_SERVICE_ROLE_KEY=<local service> \
 *     STRIPE_MOCK_MODE=1 deno run --allow-all --no-check --node-modules-dir=auto index.ts
 *
 *     cd packages/supabase
 *     BGC_TEST_API_BASE=http://127.0.0.1:8000/v1 deno test --allow-all \
 *       --no-check --config tests/deno.json tests/routers/background-checks-rest.test.ts
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import {
  createAdminClient,
  getAuthToken,
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
} from '../shared/setup.ts'
import { getUserIdByEmail } from '../shared/test-context.ts'

const REST_BASE = Deno.env.get('BGC_TEST_API_BASE') ??
  `${TEST_SUPABASE_URL}/functions/v1/api/v1`

async function callREST(
  path: string,
  init: RequestInit & { authToken?: string | null } = {}
) {
  const { authToken, headers: extraHeaders, ...rest } = init
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: TEST_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${authToken && authToken.length > 0 ? authToken : TEST_SUPABASE_ANON_KEY}`,
    ...(extraHeaders as Record<string, string> | undefined),
  }
  const response = await fetch(`${REST_BASE}${path}`, { ...rest, headers })
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: response.status, body }
}

// deno-lint-ignore no-explicit-any
type Json = any

async function token(user: { email: string; password: string }) {
  const t = await getAuthToken(user.email, user.password)
  assertExists(t, `could not obtain a token for ${user.email}`)
  return t
}

const now = () => new Date().toISOString()
const consent = () => ({
  consent_signature: 'Test Worker',
  consent_given_at: now(),
  disclosure_provided_at: now(),
  summary_of_rights_provided_at: now(),
})

// deno-lint-ignore no-explicit-any
async function cleanup(core: any, checkIds: string[]) {
  if (checkIds.length === 0) return
  await core.from('background_check_disputes').delete().in('background_check_id', checkIds)
  await core.from('background_check_documents').delete().in('background_check_id', checkIds)
  await core.from('payment_transactions').delete().in('background_check_id', checkIds)
  await core.from('background_checks').delete().in('id', checkIds)
}

async function firstPackage(workerToken: string) {
  const res = await callREST('/background-checks/packages', { authToken: workerToken })
  assertEquals(res.status, 200, `packages: ${JSON.stringify(res.body)}`)
  const list = res.body as Json[]
  assert(list.length > 0, 'no active packages seeded')
  return list[0]
}

async function requestCheck(workerToken: string, packageId: string) {
  return await callREST('/background-checks/request', {
    method: 'POST',
    authToken: workerToken,
    body: JSON.stringify({ package_id: packageId, paid_by: 'worker', consent: consent() }),
  })
}

Deno.test({
  name: 'background checks REST - /packages carries no platform cost (#1127) and lists components',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const workerToken = await token(TEST_USERS.regular)
    const res = await callREST('/background-checks/packages', { authToken: workerToken })
    assertEquals(res.status, 200)
    for (const pkg of res.body as Json[]) {
      assert(!('platform_cost_cents' in pkg), `package ${pkg.slug} leaks platform_cost_cents`)
      assert(!('provider_package_code' in pkg), `package ${pkg.slug} leaks provider_package_code`)
      assert(typeof pkg.retail_cost_cents === 'number')
      assert(Array.isArray(pkg.components))
      for (const component of pkg.components) {
        assert(!('platform_cost_cents' in component), 'component leaks platform_cost_cents')
      }
    }
  },
})

Deno.test({
  name: 'background checks REST - /request creates a real check, intent and ledger row; /confirm-payment marks it paid',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    // deno-lint-ignore no-explicit-any
    const core = (admin as any).schema('core')
    const workerToken = await token(TEST_USERS.regular)
    const workerId = await getUserIdByEmail(admin, TEST_USERS.regular.email)
    const pkg = await firstPackage(workerToken)
    const created: string[] = []

    try {
      const req = await requestCheck(workerToken, pkg.id)
      assertEquals(req.status, 201, `request failed: ${JSON.stringify(req.body)}`)
      const { backgroundCheckId, paymentIntentId, clientSecret, amountCents } = req.body as Json
      created.push(backgroundCheckId)
      assert(paymentIntentId !== 'pi_mock' && paymentIntentId.startsWith('pi_'))
      assertExists(clientSecret)
      assertEquals(amountCents, pkg.retail_cost_cents)

      const { data: check } = await core.from('background_checks').select('*')
        .eq('id', backgroundCheckId).single()
      assertEquals(check.status, 'pending')
      assertEquals(check.user_id, workerId)
      assertEquals(check.paid_by, 'worker')
      assertEquals(check.cost_cents, pkg.retail_cost_cents)
      assertEquals(check.payment_intent_id, paymentIntentId)
      assertEquals(check.paid_at, null)
      assertExists(check.consent_given_at)

      const { data: ledger } = await core.from('payment_transactions').select('*')
        .eq('stripe_payment_intent_id', paymentIntentId).single()
      assertEquals(ledger.transaction_type, 'background_check')
      assertEquals(ledger.background_check_id, backgroundCheckId)
      assertEquals(ledger.amount_cents, pkg.retail_cost_cents)

      const confirm = await callREST('/background-checks/confirm-payment', {
        method: 'POST',
        authToken: workerToken,
        body: JSON.stringify({ background_check_id: backgroundCheckId, payment_intent_id: paymentIntentId }),
      })
      assertEquals(confirm.status, 200, `confirm failed: ${JSON.stringify(confirm.body)}`)
      assertExists((confirm.body as Json).paid_at)

      const { data: ledgerAfter } = await core.from('payment_transactions').select('status')
        .eq('stripe_payment_intent_id', paymentIntentId).single()
      assertEquals(ledgerAfter.status, 'succeeded')

      // A repeat confirm is idempotent.
      const again = await callREST('/background-checks/confirm-payment', {
        method: 'POST',
        authToken: workerToken,
        body: JSON.stringify({ background_check_id: backgroundCheckId, payment_intent_id: paymentIntentId }),
      })
      assertEquals(again.status, 200)
      assertEquals((again.body as Json).paid_at, (confirm.body as Json).paid_at)

      // The check appears in the worker's own list.
      const mine = await callREST('/background-checks', { authToken: workerToken })
      assert((mine.body as Json[]).some((c) => c.id === backgroundCheckId))
    } finally {
      await cleanup(core, created)
    }
  },
})

Deno.test({
  name: 'background checks REST - employer-paid: staff order for a worker (invited, no worker consent recorded); outsiders get 403',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    // deno-lint-ignore no-explicit-any
    const core = (admin as any).schema('core')
    const workerToken = await token(TEST_USERS.regular)
    const officeToken = await token(TEST_USERS.office)
    const workerId = await getUserIdByEmail(admin, TEST_USERS.regular.email)
    const officeId = await getUserIdByEmail(admin, TEST_USERS.office.email)
    const pkg = await firstPackage(workerToken)
    const { data: org } = await core.from('organizations').select('id, owner_user_id')
      .neq('owner_user_id', workerId).limit(1).single()
    assertExists(org, 'no organization seeded')
    const created: string[] = []
    const employerBody = (orgId: string) => JSON.stringify({
      package_id: pkg.id,
      paid_by: 'employer',
      consent: { ...consent(), consent_signature: 'organization_request' },
      metadata: { organization_id: orgId, worker_user_id: workerId, requested_via: 'office_dashboard' },
    })

    try {
      // A worker with no role in the organization cannot order on its behalf.
      const outsider = await callREST('/background-checks/request', {
        method: 'POST', authToken: workerToken, body: employerBody(org.id),
      })
      assertEquals(outsider.status, 403, `outsider: ${JSON.stringify(outsider.body)}`)

      // Missing worker/org is a 400, not a check about nobody.
      const incomplete = await callREST('/background-checks/request', {
        method: 'POST', authToken: officeToken,
        body: JSON.stringify({ package_id: pkg.id, paid_by: 'employer', consent: consent() }),
      })
      assertEquals(incomplete.status, 400)

      const ordered = await callREST('/background-checks/request', {
        method: 'POST', authToken: officeToken, body: employerBody(org.id),
      })
      assertEquals(ordered.status, 201, `employer request: ${JSON.stringify(ordered.body)}`)
      const { backgroundCheckId, paymentIntentId } = ordered.body as Json
      created.push(backgroundCheckId)

      const { data: check } = await core.from('background_checks').select('*').eq('id', backgroundCheckId).single()
      assertEquals(check.user_id, workerId)
      assertEquals(check.organization_id, org.id)
      assertEquals(check.requested_by_user_id, officeId)
      assertEquals(check.paid_by, 'organization')
      assertEquals(check.initiated_by, 'organization')
      assertEquals(check.status, 'invited')
      assertExists(check.invited_at)
      // The requester's placeholder is not recorded as the worker's consent.
      assertEquals(check.consent_signature, null)
      assertEquals(check.consent_given_at, null)

      const { data: ledger } = await core.from('payment_transactions').select('user_id, organization_id')
        .eq('stripe_payment_intent_id', paymentIntentId).single()
      assertEquals(ledger.user_id, officeId)
      assertEquals(ledger.organization_id, org.id)

      // The requester (payer) confirms; the check stays invited, now paid.
      const confirm = await callREST('/background-checks/confirm-payment', {
        method: 'POST', authToken: officeToken,
        body: JSON.stringify({ background_check_id: backgroundCheckId, payment_intent_id: paymentIntentId }),
      })
      assertEquals(confirm.status, 200, `employer confirm: ${JSON.stringify(confirm.body)}`)
      assertEquals((confirm.body as Json).status, 'invited')
      assertExists((confirm.body as Json).paid_at)

      // The worker sees the check they were invited to.
      const mine = await callREST('/background-checks', { authToken: workerToken })
      assert((mine.body as Json[]).some((c) => c.id === backgroundCheckId))
    } finally {
      await cleanup(core, created)
    }
  },
})

Deno.test({
  name: "background checks REST - /confirm-payment refuses another user's check and another check's payment",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    // deno-lint-ignore no-explicit-any
    const core = (admin as any).schema('core')
    const workerToken = await token(TEST_USERS.regular)
    const otherToken = await token(TEST_USERS.office)
    const pkg = await firstPackage(workerToken)
    const created: string[] = []

    try {
      const a = await requestCheck(workerToken, pkg.id)
      const b = await requestCheck(workerToken, pkg.id)
      assertEquals(a.status, 201)
      assertEquals(b.status, 201)
      const checkA = (a.body as Json).backgroundCheckId
      const checkB = (b.body as Json).backgroundCheckId
      created.push(checkA, checkB)

      // Another user cannot confirm (or even see) this worker's check.
      const stranger = await callREST('/background-checks/confirm-payment', {
        method: 'POST',
        authToken: otherToken,
        body: JSON.stringify({ background_check_id: checkA, payment_intent_id: (a.body as Json).paymentIntentId }),
      })
      assertEquals(stranger.status, 404)

      // Check B's payment cannot pay for check A.
      const crossed = await callREST('/background-checks/confirm-payment', {
        method: 'POST',
        authToken: workerToken,
        body: JSON.stringify({ background_check_id: checkA, payment_intent_id: (b.body as Json).paymentIntentId }),
      })
      assertEquals(crossed.status, 400)

      const { data } = await core.from('background_checks').select('paid_at').eq('id', checkA).single()
      assertEquals(data.paid_at, null)
    } finally {
      await cleanup(core, created)
    }
  },
})

Deno.test({
  name: 'background checks REST - documents: upload URL under the owner folder, metadata only for that folder',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    // deno-lint-ignore no-explicit-any
    const core = (admin as any).schema('core')
    const workerToken = await token(TEST_USERS.regular)
    const workerId = await getUserIdByEmail(admin, TEST_USERS.regular.email)
    const pkg = await firstPackage(workerToken)
    const created: string[] = []

    try {
      const req = await requestCheck(workerToken, pkg.id)
      const checkId = (req.body as Json).backgroundCheckId
      created.push(checkId)

      const badType = await callREST('/background-checks/documents/upload-url', {
        method: 'POST',
        authToken: workerToken,
        body: JSON.stringify({ background_check_id: checkId, document_type: 'id', file_name: 'x.exe', mime_type: 'application/x-msdownload', file_size: 10 }),
      })
      assertEquals(badType.status, 400)

      const url = await callREST('/background-checks/documents/upload-url', {
        method: 'POST',
        authToken: workerToken,
        body: JSON.stringify({ background_check_id: checkId, document_type: 'government_id', file_name: 'my id.pdf', mime_type: 'application/pdf', file_size: 1024 }),
      })
      assertEquals(url.status, 200, `upload-url failed: ${JSON.stringify(url.body)}`)
      const { storagePath, uploadUrl, token: uploadToken, bucket } = url.body as Json
      assert(storagePath.startsWith(`${workerId}/${checkId}/`), `path ${storagePath} not under owner folder`)
      assertExists(uploadUrl)
      assertExists(uploadToken)
      assertEquals(bucket, 'background-check-documents')

      const foreign = await callREST('/background-checks/documents', {
        method: 'POST',
        authToken: workerToken,
        body: JSON.stringify({ background_check_id: checkId, storage_path: `someone-else/${checkId}/x.pdf`, document_type: 'government_id', file_name: 'x.pdf', mime_type: 'application/pdf', file_size: 1024 }),
      })
      assertEquals(foreign.status, 400)

      const doc = await callREST('/background-checks/documents', {
        method: 'POST',
        authToken: workerToken,
        body: JSON.stringify({ background_check_id: checkId, storage_path: storagePath, document_type: 'government_id', file_name: 'my id.pdf', mime_type: 'application/pdf', file_size: 1024 }),
      })
      assertEquals(doc.status, 201, `documents failed: ${JSON.stringify(doc.body)}`)
      assertEquals((doc.body as Json).storage_path, storagePath)
      assertEquals((doc.body as Json).background_check_id, checkId)
    } finally {
      await cleanup(core, created)
    }
  },
})

Deno.test({
  name: 'background checks REST - disputes: only a completed check, then it is disputed and listed',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    // deno-lint-ignore no-explicit-any
    const core = (admin as any).schema('core')
    const workerToken = await token(TEST_USERS.regular)
    const workerId = await getUserIdByEmail(admin, TEST_USERS.regular.email)
    const pkg = await firstPackage(workerToken)
    const created: string[] = []

    try {
      const req = await requestCheck(workerToken, pkg.id)
      const checkId = (req.body as Json).backgroundCheckId
      created.push(checkId)

      const early = await callREST('/background-checks/disputes', {
        method: 'POST',
        authToken: workerToken,
        body: JSON.stringify({ background_check_id: checkId, reason: 'Not my record' }),
      })
      assertEquals(early.status, 409)

      await core.from('background_checks').update({ status: 'completed_consider' }).eq('id', checkId)

      const dispute = await callREST('/background-checks/disputes', {
        method: 'POST',
        authToken: workerToken,
        body: JSON.stringify({ background_check_id: checkId, reason: 'Not my record', details: 'Wrong person', supporting_documents: [`${workerId}/${checkId}/proof.pdf`] }),
      })
      assertEquals(dispute.status, 201, `dispute failed: ${JSON.stringify(dispute.body)}`)
      assertEquals((dispute.body as Json).reason, 'Not my record')
      assertEquals((dispute.body as Json).status, 'pending')

      const { data: check } = await core.from('background_checks').select('status').eq('id', checkId).single()
      assertEquals(check.status, 'disputed')

      const list = await callREST(`/background-checks/${checkId}/disputes`, { authToken: workerToken })
      assertEquals(list.status, 200)
      assertEquals((list.body as Json[]).length, 1)
      assertEquals((list.body as Json[])[0].details, 'Wrong person')
    } finally {
      await cleanup(core, created)
    }
  },
})

Deno.test({
  name: 'background checks REST - privacy maps to is_public; /admin/disputes still reaches the admin router',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    // deno-lint-ignore no-explicit-any
    const core = (admin as any).schema('core')
    const workerToken = await token(TEST_USERS.regular)
    const officeToken = await token(TEST_USERS.office)
    const pkg = await firstPackage(workerToken)
    const created: string[] = []

    try {
      const req = await requestCheck(workerToken, pkg.id)
      const checkId = (req.body as Json).backgroundCheckId
      created.push(checkId)

      const pub = await callREST(`/background-checks/${checkId}/privacy`, {
        method: 'PATCH',
        authToken: workerToken,
        body: JSON.stringify({ privacy_level: 'public' }),
      })
      assertEquals(pub.status, 200, `privacy failed: ${JSON.stringify(pub.body)}`)
      assertEquals((pub.body as Json).is_public, true)

      // Mount order: this must hit the admin router (200 for office), not the
      // worker router's /:checkId/disputes with checkId = "admin" (400).
      const adminDisputes = await callREST('/background-checks/admin/disputes', { authToken: officeToken })
      assertEquals(adminDisputes.status, 200, `admin disputes: ${JSON.stringify(adminDisputes.body)}`)
    } finally {
      await cleanup(core, created)
    }
  },
})

Deno.test({
  name: 'background checks REST - the admin catalog lists packages and check types (395 adds is_active)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const officeToken = await token(TEST_USERS.office)
    for (const path of ['/background-checks/admin/packages', '/background-checks/admin/check-types']) {
      const res = await callREST(path, { authToken: officeToken })
      assertEquals(res.status, 200, `${path}: ${JSON.stringify(res.body)}`)
      const rows = (res.body as Json).data as Json[]
      assert(rows.length > 0, `${path} returned nothing`)
      assert(rows.every((r) => typeof r.is_active === 'boolean'))
    }
  },
})
