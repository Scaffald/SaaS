import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { supabaseUrl } from '../context.ts'
import { officeProcedure, t } from '../middleware.ts'

const WEBHOOK_PATH = '/functions/v1/stripe-webhook'

function buildWebhookUrl(): string {
  if (!supabaseUrl) return WEBHOOK_PATH
  const normalized = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl
  return `${normalized}${WEBHOOK_PATH}`
}

const settingsSelect = [
  'settings_name',
  'publishable_key',
  'api_key_secret_id',
  'webhook_secret_id',
  'test_mode',
  'webhook_endpoint_url',
  'last_tested_at',
  'last_tested_status',
  'last_tested_error',
  'updated_at',
  'updated_by',
].join(', ')

export const stripeSettingsRouter = t.router({
  getSettings: officeProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .schema('core')
      .from('stripe_settings')
      .select(settingsSelect)
      .eq('settings_name', 'stripe')
      .maybeSingle()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load Stripe settings: ${error.message}`,
      })
    }

    return {
      publishableKey: data?.publishable_key ?? '',
      hasApiKey: Boolean(data?.api_key_secret_id),
      hasWebhookSecret: Boolean(data?.webhook_secret_id),
      testMode: data?.test_mode ?? true,
      webhookEndpointUrl: data?.webhook_endpoint_url ?? buildWebhookUrl(),
      lastTestedAt: data?.last_tested_at ?? null,
      lastTestedStatus: data?.last_tested_status ?? null,
      lastTestedError: data?.last_tested_error ?? null,
      updatedAt: data?.updated_at ?? null,
      updatedBy: data?.updated_by ?? null,
    }
  }),

  updatePublishableKey: officeProcedure
    .input(
      z.object({
        publishableKey: z.string().trim().min(16).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .schema('core')
        .from('stripe_settings')
        .update({
          publishable_key: input.publishableKey.trim(),
          updated_by: ctx.user?.id ?? null,
        })
        .eq('settings_name', 'stripe')

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update publishable key: ${error.message}`,
        })
      }

      return { publishableKey: input.publishableKey.trim() }
    }),

  updateTestMode: officeProcedure
    .input(
      z.object({
        testMode: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .schema('core')
        .from('stripe_settings')
        .update({
          test_mode: input.testMode,
          updated_by: ctx.user?.id ?? null,
        })
        .eq('settings_name', 'stripe')

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update test mode: ${error.message}`,
        })
      }

      return { testMode: input.testMode }
    }),

  updateApiKey: officeProcedure
    .input(
      z.object({
        secret: z.string().trim().min(20, 'Secret key appears too short'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const trimmed = input.secret.trim()

      const { data: secretId, error: rotateError } = await ctx.supabaseAdmin
        .schema('core')
        .rpc('rotate_stripe_secret', {
          p_secret: trimmed,
          p_secret_type: 'api_key',
        })

      if (rotateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to store API secret: ${rotateError.message}`,
        })
      }

      const { error: updateError } = await ctx.supabase
        .schema('core')
        .from('stripe_settings')
        .update({
          api_key_secret_id: secretId,
          updated_by: ctx.user?.id ?? null,
        })
        .eq('settings_name', 'stripe')

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to link API secret: ${updateError.message}`,
        })
      }

      const { error: configureError } = await ctx.supabaseAdmin
        .schema('core')
        .rpc('configure_stripe_server', {
          p_api_key_secret_id: secretId,
        })

      if (configureError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Stripe server configuration failed: ${configureError.message}`,
        })
      }

      return { hasApiKey: true }
    }),

  updateWebhookSecret: officeProcedure
    .input(
      z.object({
        secret: z.string().trim().min(10, 'Webhook secret appears too short'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const trimmed = input.secret.trim()

      const { data: secretId, error: rotateError } = await ctx.supabaseAdmin
        .schema('core')
        .rpc('rotate_stripe_secret', {
          p_secret: trimmed,
          p_secret_type: 'webhook',
        })

      if (rotateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to store webhook secret: ${rotateError.message}`,
        })
      }

      const { error: updateError } = await ctx.supabase
        .schema('core')
        .from('stripe_settings')
        .update({
          webhook_secret_id: secretId,
          updated_by: ctx.user?.id ?? null,
        })
        .eq('settings_name', 'stripe')

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to link webhook secret: ${updateError.message}`,
        })
      }

      return { hasWebhookSecret: true }
    }),

  testConnection: officeProcedure.mutation(async ({ ctx }) => {
    const { data: settings, error } = await ctx.supabaseAdmin
      .schema('core')
      .from('stripe_settings')
      .select('api_key_secret_id, test_mode')
      .eq('settings_name', 'stripe')
      .maybeSingle()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load settings: ${error.message}`,
      })
    }

    if (!settings?.api_key_secret_id) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Add an API secret before testing the connection.',
      })
    }

    const { data: secretValue, error: secretError } = await ctx.supabaseAdmin
      .schema('core')
      .rpc('get_secret_value', {
        p_secret_id: settings.api_key_secret_id,
      })

    if (secretError || !secretValue) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: secretError
          ? `Failed to read API secret: ${secretError.message}`
          : 'API secret not found.',
      })
    }

    let testStatus: 'succeeded' | 'failed' = 'succeeded'
    let testError: string | null = null

    try {
      const response = await fetch('https://api.stripe.com/v1/accounts', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretValue}`,
        },
      })

      if (!response.ok) {
        testStatus = 'failed'
        const message = await response.text()
        testError = `Stripe API error: ${message}`
      }
    } catch (networkError) {
      testStatus = 'failed'
      testError = networkError instanceof Error ? networkError.message : String(networkError)
    }

    await ctx.supabase
      .schema('core')
      .from('stripe_settings')
      .update({
        last_tested_at: new Date().toISOString(),
        last_tested_status: testStatus,
        last_tested_error: testError,
        updated_by: ctx.user?.id ?? null,
      })
      .eq('settings_name', 'stripe')

    if (testStatus === 'failed' && testError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: testError,
      })
    }

    return { ok: true }
  }),
})
