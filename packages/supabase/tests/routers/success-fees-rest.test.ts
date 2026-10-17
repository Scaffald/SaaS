/// <reference lib="deno.ns" />

/**
 * Success fees REST — what an employer is charged for a hire (#1256, #1257).
 *
 * #1256: the fee was 10% of `totalHireValueCents` taken from the request body,
 * so the caller set the price of their own fee. The server now derives the hire
 * value from the job's pay range (the formula the Hire screen used:
 * max ?? min, hourly × 40 h × 52 weeks) and ignores the client's figure.
 *
 * #1257 (Clay, 2026-10-17): the whole fee is charged upfront — one intent for
 * 100% of it, nothing deferred.
 *
 * Like id-verification-rest, this needs STRIPE_MOCK_MODE=1 inside the function,
 * which CI's shared edge runtime cannot give it yet (#937). Run it against this
 * branch's api on :8000:
 *
 *     SUCCESS_FEE_TEST_API_BASE=http://127.0.0.1:8000/v1 deno test --allow-all \
 *       --no-check --config tests/deno.json tests/routers/success-fees-rest.test.ts
 *
 * Users: reviewer-employer@scaffald.com (admin of one organization, seeds/010)
 * hires test@example.com (seeds/002a).
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import {
  createAdminClient,
  getAuthToken,
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
} from '../shared/setup.ts'

const API = Deno.env.get('SUCCESS_FEE_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`
const RUN = crypto.randomUUID().slice(0, 8)

async function call(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
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

const sub = (token: string) =>
  JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub as string

// deno-lint-ignore no-explicit-any
const core = () => (createAdminClient() as any).schema('core')

async function employerOrgId(userId: string): Promise<string> {
  const { data, error } = await core()
    .from('role_assignments')
    .select('scope_org_id')
    .eq('user_id', userId)
    .not('scope_org_id', 'is', null)
    .limit(1)
    .single()
  if (error || !data?.scope_org_id) throw new Error('reviewer-employer has no organization (seeds/010)')
  return data.scope_org_id
}

/** An open job with an hourly pay range of $40–$50, and the worker's application to it. */
async function hireFixture(orgId: string, workerId: string, label: string) {
  const { data: job, error: jobError } = await core()
    .from('jobs')
    .insert({
      organization_id: orgId,
      title: `success-fee-${RUN}-${label}`,
      status: 'open',
      pay_range_min_cents: 4_000,
      pay_range_max_cents: 5_000,
      pay_range_type: 'hourly',
    })
    .select('id')
    .single()
  if (jobError) throw new Error(`job fixture: ${jobError.message}`)
  const { data: app, error: appError } = await core()
    .from('applications')
    .insert({ job_id: job.id, user_id: workerId, status: 'offer' })
    .select('id')
    .single()
  if (appError) throw new Error(`application fixture: ${appError.message}`)
  return { jobId: job.id as string, applicationId: app.id as string }
}

async function cleanup(jobId: string, applicationId: string) {
  const { data: fees } = await core().from('success_fees').select('id').eq('application_id', applicationId)
  for (const fee of fees ?? []) {
    await core().from('payment_transactions').delete().eq('success_fee_id', fee.id)
    await core().from('hire_agreements').delete().eq('success_fee_id', fee.id)
    await core().from('success_fees').delete().eq('id', fee.id)
  }
  await core().from('applications').delete().eq('id', applicationId)
  await core().from('jobs').delete().eq('id', jobId)
}

// $50/h × 40 h × 52 weeks = $104,000 hire value; 10% fee = $10,400.
const EXPECTED_HIRE_VALUE = 5_000 * 40 * 52
const EXPECTED_FEE = Math.round(EXPECTED_HIRE_VALUE * 0.1)

Deno.test({
  name: 'Success fees REST - the fee comes from the job, not the request, and is charged whole (#1256, #1257)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const employer = await getAuthToken('reviewer-employer@scaffald.com', 'Scaffald2026!')
    assertExists(employer, 'reviewer-employer@scaffald.com should sign in (seeds/010)')
    const worker = await getAuthToken(TEST_USERS.regular.email, TEST_USERS.regular.password)
    assertExists(worker, 'test@example.com should sign in')
    const orgId = await employerOrgId(sub(employer))
    const { jobId, applicationId } = await hireFixture(orgId, sub(worker), 'tamper')
    try {
      const created = await call('/success-fees', employer, {
        method: 'POST',
        body: JSON.stringify({
          organizationId: orgId,
          workerUserId: sub(worker),
          jobId,
          applicationId,
          totalHireValueCents: 100, // what a tampering client would send
          jobDurationDays: 90,
          hireStartDate: '2026-11-01',
        }),
      })
      assertEquals(created.status, 200, `create failed: ${JSON.stringify(created.body)}`)

      const { data: fee } = await core()
        .from('success_fees')
        .select('total_hire_value_cents, total_fee_cents, upfront_percentage, upfront_amount_cents, final_amount_cents, upfront_payment_intent_id')
        .eq('application_id', applicationId)
        .single()
      assertEquals(fee.total_hire_value_cents, EXPECTED_HIRE_VALUE, 'hire value derived from the job pay range')
      assertEquals(fee.total_fee_cents, EXPECTED_FEE)
      assertEquals(Number(fee.upfront_percentage), 100, 'the whole fee is charged upfront')
      assertEquals(fee.upfront_amount_cents, EXPECTED_FEE)
      assertEquals(fee.final_amount_cents, 0)

      const { data: ledger } = await core()
        .from('payment_transactions')
        .select('amount_cents')
        .eq('stripe_payment_intent_id', fee.upfront_payment_intent_id)
        .single()
      assertEquals(ledger.amount_cents, EXPECTED_FEE, 'one charge for the whole fee')
    } finally {
      await cleanup(jobId, applicationId)
    }
  },
})

Deno.test({
  name: "Success fees REST - an application to another organization's job is refused (#1256)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const employer = await getAuthToken('reviewer-employer@scaffald.com', 'Scaffald2026!')
    assertExists(employer, 'reviewer-employer@scaffald.com should sign in (seeds/010)')
    const worker = await getAuthToken(TEST_USERS.regular.email, TEST_USERS.regular.password)
    assertExists(worker, 'test@example.com should sign in')
    const orgId = await employerOrgId(sub(employer))
    // A job owned by some other organization.
    const { data: other } = await core().from('organizations').select('id').neq('id', orgId).limit(1).single()
    const { jobId, applicationId } = await hireFixture(other.id, sub(worker), 'foreign')
    try {
      const created = await call('/success-fees', employer, {
        method: 'POST',
        body: JSON.stringify({
          organizationId: orgId,
          workerUserId: sub(worker),
          jobId,
          applicationId,
          totalHireValueCents: 100,
          jobDurationDays: 90,
          hireStartDate: '2026-11-01',
        }),
      })
      assert(created.status === 400 || created.status === 404, `expected 400/404, got ${created.status} ${JSON.stringify(created.body)}`)
      const { data: fees } = await core().from('success_fees').select('id').eq('application_id', applicationId)
      assertEquals(fees.length, 0, 'no fee row for a mismatched application')
    } finally {
      await cleanup(jobId, applicationId)
    }
  },
})
