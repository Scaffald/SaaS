/**
 * Shared ID verification API logic for REST and tRPC
 * Extracted from trpc/routers/id-verification.router.ts
 */

import type Stripe from 'stripe'

const STRIPE_API_VERSION = '2025-11-17.clover'

let StripeClass: typeof import('stripe').default | null = null

async function getStripeClass(): Promise<typeof import('stripe').default> {
  if (!StripeClass) {
    const stripeModule = await import('stripe')
    StripeClass = stripeModule.default
  }
  return StripeClass
}

async function getStripeHttpClient() {
  const Stripe = await getStripeClass()
  return Stripe.createFetchHttpClient()
}

const mockStripePaymentIntents = new Map<
  string,
  { amount: number; currency: string; clientSecret: string; metadata: Record<string, unknown> }
>()

function stripeMockEnabled(): boolean {
  return typeof Deno !== 'undefined' && Deno.env.get('STRIPE_MOCK_MODE') === '1'
}

function createMockStripeClient(): Stripe {
  return {
    paymentIntents: {
      create: async (payload: Stripe.PaymentIntentCreateParams) => {
        const id = `pi_${crypto.randomUUID()}`
        const clientSecret = `cs_${crypto.randomUUID()}`
        mockStripePaymentIntents.set(id, {
          amount: payload.amount ?? 0,
          currency: payload.currency ?? 'usd',
          clientSecret,
          metadata: (payload.metadata as Record<string, unknown>) ?? {},
        })
        return {
          id,
          amount: payload.amount ?? 0,
          currency: payload.currency ?? 'usd',
          client_secret: clientSecret,
          metadata: payload.metadata ?? {},
          status: 'requires_confirmation',
          created: Math.floor(Date.now() / 1000),
          object: 'payment_intent',
        } as Stripe.PaymentIntent
      },
      retrieve: async (paymentIntentId: string) => {
        const stored = mockStripePaymentIntents.get(paymentIntentId)
        if (!stored) throw new Error('Mock payment intent not found')
        return {
          id: paymentIntentId,
          amount: stored.amount,
          currency: stored.currency,
          client_secret: stored.clientSecret,
          metadata: stored.metadata,
          status: 'succeeded',
          created: Math.floor(Date.now() / 1000),
          object: 'payment_intent',
        } as Stripe.PaymentIntent
      },
    },
  } as unknown as Stripe
}

type SupabaseLike = {
  schema: (s: string) => {
    from: (t: string) => {
      select: (cols: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: unknown; error: unknown }> } }
    }
    rpc: (name: string, params: Record<string, string>) => Promise<{ data: unknown; error: unknown }>
  }
}

export async function loadStripeClient(supabaseAdmin: SupabaseLike): Promise<Stripe> {
  if (stripeMockEnabled()) return createMockStripeClient()
  if (!supabaseAdmin) throw new Error('Admin client not available')

  const { data: settings, error } = await supabaseAdmin
    .schema('core')
    .from('stripe_settings')
    .select('api_key_secret_id')
    .eq('settings_name', 'stripe')
    .maybeSingle()

  if (error) throw new Error(`Failed to load Stripe settings: ${(error as { message: string }).message}`)
  if (!settings?.api_key_secret_id) throw new Error('Stripe API key is not configured.')

  const { data: secretValue, error: secretError } = await supabaseAdmin
    .schema('core')
    .rpc('get_secret_value', { p_secret_id: settings.api_key_secret_id })

  if (secretError || !secretValue) {
    throw new Error(
      secretError ? `Failed to load Stripe secret: ${(secretError as { message: string }).message}` : 'Stripe API secret unavailable.'
    )
  }

  const Stripe = await getStripeClass()
  return new Stripe(secretValue as string, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: await getStripeHttpClient(),
  })
}

export async function userHasPlatformRole(supabaseAdmin: SupabaseLike, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .schema('core')
    .from('role_assignments')
    .select('role:roles(name, scope)')
    .eq('user_id', userId)

  if (error) throw new Error(`Unable to verify platform roles: ${(error as { message: string }).message}`)
  return Boolean(
    (data as Array<{ role?: { scope?: string; name?: string | null } | null }> | null)?.some(
      (a) =>
        a.role?.scope === 'platform' && ['office', 'super_admin'].includes(a.role?.name ?? '')
    )
  )
}

export async function ensureCanRequestForWorker(
  supabaseAdmin: SupabaseLike,
  userId: string,
  workerUserId: string
): Promise<void> {
  if (!userId) throw new Error('UNAUTHORIZED')
  if (userId === workerUserId) return
  const hasPlatform = await userHasPlatformRole(supabaseAdmin, userId)
  if (!hasPlatform) throw new Error('You are not allowed to request verification for this worker.')
}

export async function createPersonaInquiry(workerUserId: string): Promise<{ inquiryId: string; status: string }> {
  const apiKey = Deno.env.get('PERSONA_API_KEY')
  const templateId = Deno.env.get('PERSONA_TEMPLATE_ID')
  if (!apiKey || !templateId) {
    return { inquiryId: `persona_${crypto.randomUUID()}`, status: 'pending' }
  }
  const response = await fetch('https://withpersona.com/api/v1/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      data: {
        type: 'inquiry',
        attributes: { template_id: templateId, reference_id: workerUserId },
      },
    }),
  })
  if (!response.ok) throw new Error(`Persona inquiry creation failed: ${await response.text()}`)
  const json = await response.json()
  return {
    inquiryId: json?.data?.id ?? `persona_${crypto.randomUUID()}`,
    status: json?.data?.attributes?.status ?? 'pending',
  }
}

export function addSixMonths(base: Date): Date {
  const expiry = new Date(base)
  expiry.setMonth(expiry.getMonth() + 6)
  return expiry
}
