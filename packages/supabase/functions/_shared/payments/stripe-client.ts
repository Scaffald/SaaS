/**
 * Stripe client construction for the payment background functions.
 *
 * `stripe-webhook` and `payments-reconcile` both need a Stripe client built
 * from the key in `core.stripe_settings` -> Vault, and the webhook additionally
 * needs the signing secret. Factored out so there is one Stripe version, one
 * API version and one secret-loading path between them; the request-scoped
 * routes under `api/` have their own copy because they load through the
 * per-request admin client.
 */

import type Stripe from 'stripe'

import type { NotificationSupabaseClient } from '../notifications/types.ts'

// Pinned deliberately: these integrations are written against the 2025-11-17
// response shapes. stripe@20.4.1 types `apiVersion` as `LatestApiVersion`
// (2026-02-25.clover), so pinning any earlier version is a type error even
// though the Stripe API supports it — hence the cast. Moving the runtime
// version is a behavioural change against a live payment provider and belongs
// with the SDK upgrade in #454.
export const STRIPE_API_VERSION = '2025-11-17.clover' as Stripe.LatestApiVersion

let StripeClass: typeof import('stripe').default | null = null

/**
 * Lazy on purpose. A top-level runtime import of `stripe` is evaluated at
 * module load, which is where this family used to call createFetchHttpClient()
 * and createSubtleCryptoProvider() — making a function that cannot boot when
 * the module fails to resolve, rather than one that returns a 500 (#923).
 */
export async function getStripeClass(): Promise<typeof import('stripe').default> {
  if (!StripeClass) {
    const stripeModule = await import('stripe')
    StripeClass = stripeModule.default
  }
  return StripeClass
}

interface StripeSettingsRow {
  api_key_secret_id: string | null
  webhook_secret_id: string | null
}

async function loadSettings(supabase: NotificationSupabaseClient): Promise<StripeSettingsRow> {
  const { data, error } = await supabase
    .schema('core')
    .from('stripe_settings')
    .select('api_key_secret_id, webhook_secret_id')
    .eq('settings_name', 'stripe')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load stripe settings: ${error.message}`)
  }

  return {
    api_key_secret_id: data?.api_key_secret_id ?? null,
    webhook_secret_id: data?.webhook_secret_id ?? null,
  }
}

async function readSecret(
  supabase: NotificationSupabaseClient,
  secretId: string,
  label: string
): Promise<string> {
  const { data, error } = await supabase
    .schema('core')
    .rpc('get_secret_value', { p_secret_id: secretId })

  if (error) {
    throw new Error(`Failed to read ${label}: ${error.message}`)
  }
  if (!data) {
    throw new Error(`${label} secret missing`)
  }

  return data as unknown as string
}

export interface StripeSecrets {
  apiKey: string
  webhookSecret: string
}

/** Both secrets, for the webhook — it cannot do anything useful without each. */
export async function loadStripeSecrets(
  supabase: NotificationSupabaseClient
): Promise<StripeSecrets> {
  const settings = await loadSettings(supabase)

  if (!settings.api_key_secret_id) throw new Error('Stripe API key is not configured')
  if (!settings.webhook_secret_id) throw new Error('Stripe webhook secret is not configured')

  const [apiKey, webhookSecret] = await Promise.all([
    readSecret(supabase, settings.api_key_secret_id, 'API key'),
    readSecret(supabase, settings.webhook_secret_id, 'webhook secret'),
  ])

  return { apiKey, webhookSecret }
}

/** Just the API key, for callers that originate requests rather than receive them. */
export async function loadStripeApiKey(supabase: NotificationSupabaseClient): Promise<string> {
  const settings = await loadSettings(supabase)

  if (!settings.api_key_secret_id) throw new Error('Stripe API key is not configured')

  return readSecret(supabase, settings.api_key_secret_id, 'API key')
}

export async function createStripeApiClient(apiKey: string): Promise<Stripe> {
  const Stripe = await getStripeClass()
  return new Stripe(apiKey, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: Stripe.createFetchHttpClient(),
  })
}
