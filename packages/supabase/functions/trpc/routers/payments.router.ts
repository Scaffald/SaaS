// This file uses Deno ESM imports from esm.sh that are not compatible with TypeScript checking
import { TRPCError } from '@trpc/server'
import type Stripe from 'stripe'
import { z } from 'zod'
import type { Database } from '../_shared/database.types.ts'
import type { Context } from '../context.ts'
import { officeProcedure, protectedProcedure, t } from '../middleware.ts'

const STRIPE_API_VERSION = '2024-06-20'

// Lazy initialization of Stripe to avoid module loading issues
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

const mockStripeSetupIntents = new Map<string, Stripe.SetupIntent>()
const mockStripePaymentMethods = new Map<string, Stripe.PaymentMethod>()
const mockStripeCustomers = new Map<
  string,
  { id: string; name?: string | null; email?: string | null }
>()

function stripeMockEnabled(): boolean {
  return typeof Deno !== 'undefined' && Deno.env.get('STRIPE_MOCK_MODE') === '1'
}

async function createMockStripeClient(): Promise<Stripe> {
  const setupIntents = {
    create: async (params: Stripe.SetupIntentCreateParams): Promise<Stripe.SetupIntent> => {
      const id = `seti_${crypto.randomUUID()}`
      const clientSecret = `cs_${crypto.randomUUID()}`
      const intent: Stripe.SetupIntent = {
        id,
        object: 'setup_intent',
        client_secret: clientSecret,
        customer: params.customer ?? null,
        status: 'requires_confirmation',
        usage: params.usage ?? null,
      } as Stripe.SetupIntent
      mockStripeSetupIntents.set(id, intent)
      return intent
    },
  }

  const paymentMethods = {
    attach: async (
      paymentMethodId: string,
      params: Stripe.PaymentMethodAttachParams
    ): Promise<Stripe.PaymentMethod> => {
      const existing = mockStripePaymentMethods.get(paymentMethodId)
      if (existing) {
        existing.customer = params.customer ?? null
        return existing
      }
      const method: Stripe.PaymentMethod = {
        id: paymentMethodId,
        object: 'payment_method',
        customer: params.customer ?? null,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: new Date().getFullYear() + 2,
        },
        billing_details: {
          name: 'Mock Card',
          email: 'billing@example.com',
          phone: null,
          address: {
            city: null,
            country: 'US',
            line1: null,
            line2: null,
            postal_code: '94107',
            state: null,
          },
        },
      } as Stripe.PaymentMethod
      mockStripePaymentMethods.set(paymentMethodId, method)
      return method
    },
    retrieve: async (paymentMethodId: string): Promise<Stripe.PaymentMethod> => {
      const existing = mockStripePaymentMethods.get(paymentMethodId)
      if (existing) {
        return existing
      }
      const method: Stripe.PaymentMethod = {
        id: paymentMethodId,
        object: 'payment_method',
        customer: null,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: new Date().getFullYear() + 2,
        },
        billing_details: {
          name: 'Mock Card',
          email: 'billing@example.com',
          phone: null,
          address: {
            city: null,
            country: 'US',
            line1: null,
            line2: null,
            postal_code: '94107',
            state: null,
          },
        },
      } as Stripe.PaymentMethod
      mockStripePaymentMethods.set(paymentMethodId, method)
      return method
    },
    detach: async (paymentMethodId: string): Promise<Stripe.PaymentMethod> => {
      mockStripePaymentMethods.delete(paymentMethodId)
      return {
        id: paymentMethodId,
        object: 'payment_method',
        customer: null,
      } as Stripe.PaymentMethod
    },
  }

  const customers = {
    create: async (params: Stripe.CustomerCreateParams): Promise<Stripe.Customer> => {
      const id = `cus_${crypto.randomUUID()}`
      const customer: Stripe.Customer = {
        id,
        object: 'customer',
        name: params.name ?? null,
        email: params.email ?? null,
      } as Stripe.Customer
      mockStripeCustomers.set(id, {
        id,
        name: customer.name,
        email: customer.email ?? undefined,
      })
      return customer
    },
  }

  return {
    setupIntents,
    paymentMethods,
    customers,
  } as unknown as Stripe
}

async function loadStripeClient(ctx: Context): Promise<Stripe> {
  if (stripeMockEnabled()) {
    return createMockStripeClient()
  }

  const { data: settings, error } = await ctx.supabaseAdmin
    .schema('core')
    .from('stripe_settings')
    .select('api_key_secret_id')
    .eq('settings_name', 'stripe')
    .maybeSingle()

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load Stripe settings: ${error.message}`,
    })
  }

  if (!settings?.api_key_secret_id) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Stripe API key is not configured.',
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
        ? `Failed to read Stripe secret: ${secretError.message}`
        : 'Stripe API secret unavailable.',
    })
  }

  const Stripe = await getStripeClass()
  return new Stripe(secretValue, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: await getStripeHttpClient(),
  })
}

async function userHasPlatformRole(ctx: Context): Promise<boolean> {
  if (!ctx.user?.id) return false
  const { data, error } = await ctx.supabaseAdmin
    .schema('core')
    .from('role_assignments')
    .select('role:roles(name, scope)')
    .eq('user_id', ctx.user.id)

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Unable to verify platform roles: ${error.message}`,
    })
  }

  return Boolean(
    data?.some(
      (assignment: { role?: { scope?: string; name?: string } | null }) =>
        assignment.role?.scope === 'platform' &&
        ['office', 'super_admin'].includes(assignment.role?.name ?? '')
    )
  )
}

async function ensureOrganizationAccess(ctx: Context, organizationId: string): Promise<void> {
  if (!ctx.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const hasPlatformRole = await userHasPlatformRole(ctx)
  if (hasPlatformRole) return

  const { data: organization, error: orgError } = await ctx.supabaseAdmin
    .schema('core')
    .from('organizations')
    .select('id, owner_user_id')
    .eq('id', organizationId)
    .maybeSingle()

  if (orgError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load organization: ${orgError.message}`,
    })
  }

  if (!organization) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Organization not found',
    })
  }

  if (organization.owner_user_id === ctx.user.id) return

  const { data: assignment, error: assignmentError } = await ctx.supabaseAdmin
    .schema('core')
    .from('role_assignments')
    .select('scope_org_id')
    .eq('user_id', ctx.user.id)
    .eq('scope_org_id', organizationId)
    .maybeSingle()

  if (assignmentError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to verify organization access: ${assignmentError.message}`,
    })
  }

  if (!assignment) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this organization',
    })
  }
}

async function getOrCreateStripeCustomer(
  ctx: Context,
  stripe: Stripe,
  organizationId: string
): Promise<string> {
  const { data: organization, error } = await ctx.supabaseAdmin
    .schema('core')
    .from('organizations')
    .select('id, name, stripe_customer_id')
    .eq('id', organizationId)
    .maybeSingle()

  if (error || !organization) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error ? `Failed to load organization: ${error.message}` : 'Organization not found',
    })
  }

  if (organization.stripe_customer_id) {
    return organization.stripe_customer_id
  }

  let customerId: string
  if (stripeMockEnabled()) {
    const mockCustomer = await stripe.customers.create({
      name: organization.name ?? undefined,
    })
    customerId = mockCustomer.id
  } else {
    const customer = await stripe.customers.create({
      name: organization.name ?? undefined,
      metadata: { organization_id: organizationId },
    })
    customerId = customer.id
  }

  const { error: updateError } = await ctx.supabaseAdmin
    .schema('core')
    .from('organizations')
    .update({ stripe_customer_id: customerId })
    .eq('id', organizationId)

  if (updateError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to persist Stripe customer: ${updateError.message}`,
    })
  }

  return customerId
}

type DbPaymentMethodRow = Database['core']['Tables']['organization_payment_methods']['Row']

function serializePaymentMethod(row: DbPaymentMethodRow) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    brand: row.brand,
    last4: row.last4,
    expMonth: row.exp_month,
    expYear: row.exp_year,
    billingName: row.billing_name,
    billingEmail: row.billing_email,
    billingCountry: row.billing_country,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const paymentsRouter = t.router({
  /**
   * Expose publishable Stripe configuration to authenticated clients.
   * This allows Stripe.js to initialize without revealing secrets.
   */
  getStripeConfig: protectedProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('stripe_settings')
      .select('publishable_key, test_mode')
      .eq('settings_name', 'stripe')
      .maybeSingle()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load Stripe configuration: ${error.message}`,
      })
    }

    if (!data?.publishable_key) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Stripe publishable key is not configured.',
      })
    }

    return {
      publishableKey: data.publishable_key,
      mode: data.test_mode ? 'test' : 'live',
      testMode: data.test_mode ?? true,
    }
  }),

  /**
   * Admin: List service pricing rows
   */
  adminListPricing: officeProcedure
    .input(
      z
        .object({
          serviceType: z.enum(['background_check', 'id_verification']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      let query = supabaseAdmin
        .schema('core')
        .from('service_pricing')
        .select('*')
        .order('service_type', { ascending: true })
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (input?.serviceType) {
        query = query.eq('service_type', input.serviceType)
      }

      const { data, error } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load service pricing: ${error.message}`,
        })
      }

      return (data ?? []).map((row: { id: string; service_type: string; tier: string; name: string; description: string | null; price_cents: number; is_active: boolean; display_order: number; metadata: Record<string, unknown> | null }) => ({
        id: row.id,
        serviceType: row.service_type,
        tier: row.tier,
        name: row.name,
        description: row.description,
        priceCents: row.price_cents,
        isActive: row.is_active,
        displayOrder: row.display_order,
        metadata: row.metadata ?? {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    }),

  /**
   * Admin: Create or update service pricing row
   */
  adminUpsertPricing: officeProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        serviceType: z.enum(['background_check', 'id_verification']),
        tier: z.string().nullable().optional(),
        name: z.string().min(1).max(200),
        description: z.string().nullable().optional(),
        priceCents: z.number().int().nonnegative(),
        isActive: z.boolean().default(true),
        displayOrder: z.number().int().default(0),
        metadata: z.record(z.unknown()).default({}),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      const payload = {
        service_type: input.serviceType,
        tier: input.tier ?? null,
        name: input.name,
        description: input.description ?? null,
        price_cents: input.priceCents,
        is_active: input.isActive,
        display_order: input.displayOrder,
        metadata: input.metadata,
        updated_at: new Date().toISOString(),
      }

      let result
      if (input.id) {
        const { data, error } = await supabaseAdmin
          .schema('core')
          .from('service_pricing')
          .update(payload)
          .eq('id', input.id)
          .select('*')
          .maybeSingle()

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update service pricing: ${error.message}`,
          })
        }

        if (!data) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Service pricing row not found',
          })
        }

        result = data
      } else {
        const { data, error } = await supabaseAdmin
          .schema('core')
          .from('service_pricing')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })
          .select('*')
          .maybeSingle()

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create service pricing: ${error.message}`,
          })
        }

        if (!data) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create service pricing row',
          })
        }

        result = data
      }

      return {
        id: result.id,
        serviceType: result.service_type,
        tier: result.tier,
        name: result.name,
        description: result.description,
        priceCents: result.price_cents,
        isActive: result.is_active,
        displayOrder: result.display_order,
        metadata: result.metadata ?? {},
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      }
    }),

  /**
   * Admin: Delete service pricing row
   */
  adminDeletePricing: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      const { error } = await supabaseAdmin
        .schema('core')
        .from('service_pricing')
        .delete()
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete service pricing: ${error.message}`,
        })
      }

      return { ok: true }
    }),

  /**
   * Admin: Set service pricing active/inactive
   */
  adminSetPricingActive: officeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      const { error } = await supabaseAdmin
        .schema('core')
        .from('service_pricing')
        .update({
          is_active: input.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update service pricing status: ${error.message}`,
        })
      }

      return { ok: true }
    }),

  /**
   * Admin: Get payment analytics and KPIs
   */
  adminGetAnalytics: officeProcedure
    .input(
      z
        .object({
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          organizationId: z.string().uuid().optional(),
          transactionType: z
            .enum([
              'success_fee_upfront',
              'success_fee_final',
              'background_check',
              'background_check_shared',
              'id_verification',
              'credit_deposit',
              'credit_refund',
            ])
            .optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      const startDate = input?.startDate
        ? new Date(input.startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days
      const endDate = input?.endDate ? new Date(input.endDate) : new Date()

      let query = supabaseAdmin
        .schema('core')
        .from('payment_transactions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (input?.organizationId) {
        query = query.eq('organization_id', input.organizationId)
      }

      if (input?.transactionType) {
        query = query.eq('transaction_type', input.transactionType)
      }

      const { data: transactions, error } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load payment analytics: ${error.message}`,
        })
      }

      const allTransactions = transactions ?? []

      // Calculate KPIs
      const totalRevenue = allTransactions
        .filter((t: { status: string }) => t.status === 'succeeded')
        .reduce((sum: number, t: { amount_cents?: number | null }) => sum + (t.amount_cents ?? 0), 0)

      const totalTransactions = allTransactions.length
      const succeededTransactions = allTransactions.filter((t: { status: string }) => t.status === 'succeeded').length
      const failedTransactions = allTransactions.filter((t: { status: string }) => t.status === 'failed').length
      const pendingTransactions = allTransactions.filter((t: { status: string }) => t.status === 'pending').length

      const successRate =
        totalTransactions > 0 ? (succeededTransactions / totalTransactions) * 100 : 0

      // Breakdown by transaction type
      const byType = allTransactions.reduce(
        (acc: Record<string, { count: number; revenue: number; succeeded: number; failed: number }>, t: { transaction_type?: string | null; status: string; amount_cents?: number | null }) => {
          const type = t.transaction_type ?? 'unknown'
          if (!acc[type]) {
            acc[type] = {
              count: 0,
              revenue: 0,
              succeeded: 0,
              failed: 0,
            }
          }
          acc[type].count += 1
          if (t.status === 'succeeded') {
            acc[type].revenue += t.amount_cents ?? 0
            acc[type].succeeded += 1
          }
          if (t.status === 'failed') {
            acc[type].failed += 1
          }
          return acc
        },
        {} as Record<string, { count: number; revenue: number; succeeded: number; failed: number }>
      )

      // Breakdown by status
      const byStatus = allTransactions.reduce(
        (acc: Record<string, number>, t: { status?: string | null }) => {
          const status = t.status ?? 'unknown'
          acc[status] = (acc[status] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      // Time series data (daily revenue)
      const dailyRevenue = allTransactions
        .filter((t: { status: string }) => t.status === 'succeeded')
        .reduce(
          (acc: Record<string, number>, t: { created_at: string; amount_cents?: number | null }) => {
            const date = new Date(t.created_at).toISOString().split('T')[0]!
            acc[date] = (acc[date] ?? 0) + (t.amount_cents ?? 0)
            return acc
          },
          {} as Record<string, number>
        )

      // Failed transactions queue
      const failedQueue = allTransactions
        .filter((t: { status?: string | null }) => t.status === 'failed')
        .map((t: { id: string; transaction_type?: string | null; amount_cents?: number | null; failure_reason?: string | null; created_at: string; failed_at?: string | null; organization_id: string; user_id: string | null }) => ({
          id: t.id,
          transactionType: t.transaction_type,
          amountCents: t.amount_cents,
          failureReason: t.failure_reason,
          createdAt: t.created_at,
          failedAt: t.failed_at,
          organizationId: t.organization_id,
          userId: t.user_id,
        }))
        .sort(
          (a: { failedAt?: string | null; createdAt: string }, b: { failedAt?: string | null; createdAt: string }) =>
            new Date(b.failedAt ?? b.createdAt).getTime() -
            new Date(a.failedAt ?? a.createdAt).getTime()
        )

      return {
        kpis: {
          totalRevenue,
          totalTransactions,
          succeededTransactions,
          failedTransactions,
          pendingTransactions,
          successRate: Math.round(successRate * 100) / 100,
        },
        breakdowns: {
          byType,
          byStatus,
        },
        timeSeries: {
          dailyRevenue,
        },
        failedQueue,
      }
    }),

  /**
   * Admin: List payment transactions with filters
   */
  adminListTransactions: officeProcedure
    .input(
      z
        .object({
          limit: z.number().int().positive().max(500).default(100),
          offset: z.number().int().nonnegative().default(0),
          status: z.enum(['pending', 'succeeded', 'failed', 'refunded', 'cancelled']).optional(),
          transactionType: z
            .enum([
              'success_fee_upfront',
              'success_fee_final',
              'background_check',
              'background_check_shared',
              'id_verification',
              'credit_deposit',
              'credit_refund',
            ])
            .optional(),
          organizationId: z.string().uuid().optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      let query = supabaseAdmin
        .schema('core')
        .from('payment_transactions')
        .select(
          `
          *,
          organization:organizations(id, name),
          user:users(id, display_name, email)
        `
        )
        .order('created_at', { ascending: false })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 100) - 1)

      if (input?.status) {
        query = query.eq('status', input.status)
      }

      if (input?.transactionType) {
        query = query.eq('transaction_type', input.transactionType)
      }

      if (input?.organizationId) {
        query = query.eq('organization_id', input.organizationId)
      }

      if (input?.startDate) {
        query = query.gte('created_at', input.startDate)
      }

      if (input?.endDate) {
        query = query.lte('created_at', input.endDate)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load transactions: ${error.message}`,
        })
      }

      return {
        items: (data ?? []).map((row: { id: string; organization_id: string; organization?: { name?: string } | null; user_id: string | null; user?: { display_name?: string; email?: string } | null; amount_cents?: number | null; currency?: string | null; transaction_type?: string | null; status?: string | null; failure_reason?: string | null; stripe_payment_intent_id?: string | null; created_at: string; succeeded_at?: string | null; failed_at?: string | null; refunded_at?: string | null; metadata?: unknown }) => ({
          id: row.id,
          organizationId: row.organization_id,
          organizationName: (row.organization as { name?: string } | null)?.name ?? null,
          userId: row.user_id,
          userName:
            (row.user as { display_name?: string; email?: string } | null)?.display_name ??
            (row.user as { display_name?: string; email?: string } | null)?.email ??
            null,
          amountCents: row.amount_cents,
          currency: row.currency,
          transactionType: row.transaction_type,
          status: row.status,
          failureReason: row.failure_reason,
          stripePaymentIntentId: row.stripe_payment_intent_id,
          createdAt: row.created_at,
          succeededAt: row.succeeded_at,
          failedAt: row.failed_at,
          refundedAt: row.refunded_at,
          metadata: row.metadata ?? {},
        })),
        totalCount: count ?? 0,
      }
    }),

  // =========================================================
  // Payment Methods Management
  // =========================================================

  /**
   * Create a SetupIntent for adding a payment method
   */
  createSetupIntent: officeProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId)
      const stripe = await loadStripeClient(ctx)
      const customerId = await getOrCreateStripeCustomer(ctx, stripe, input.organizationId)

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      })

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      }
    }),

  /**
   * Save a payment method after SetupIntent confirmation
   */
  savePaymentMethod: officeProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId)
      const stripe = await loadStripeClient(ctx)
      const customerId = await getOrCreateStripeCustomer(ctx, stripe, input.organizationId)

      // Attach payment method to customer
      const paymentMethod = await stripe.paymentMethods.attach(input.paymentMethodId, {
        customer: customerId,
      })

      // Soft delete any existing payment method for this organization
      const { error: softDeleteError } = await ctx.supabaseAdmin
        .schema('core')
        .from('organization_payment_methods')
        .update({ deleted_at: new Date().toISOString() })
        .eq('organization_id', input.organizationId)
        .is('deleted_at', null)

      if (softDeleteError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to soft delete existing payment method: ${softDeleteError.message}`,
        })
      }

      // Create new payment method record
      const card = paymentMethod.card
      const { data: saved, error: insertError } = await ctx.supabaseAdmin
        .schema('core')
        .from('organization_payment_methods')
        .insert({
          organization_id: input.organizationId,
          stripe_customer_id: customerId,
          stripe_payment_method_id: paymentMethod.id,
          brand: card?.brand ?? null,
          last4: card?.last4 ?? null,
          exp_month: card?.exp_month ?? null,
          exp_year: card?.exp_year ?? null,
          billing_name: paymentMethod.billing_details?.name ?? null,
          billing_email: paymentMethod.billing_details?.email ?? null,
          billing_phone: paymentMethod.billing_details?.phone ?? null,
          billing_country: paymentMethod.billing_details?.address?.country ?? null,
          is_default: true,
          created_by: ctx.user?.id ?? null,
          metadata: paymentMethod.metadata ?? {},
        })
        .select('*')
        .maybeSingle()

      if (insertError || !saved) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: insertError
            ? `Failed to save payment method: ${insertError.message}`
            : 'Failed to create payment method record',
        })
      }

      // Update organization default
      const { error: updateError } = await ctx.supabaseAdmin
        .schema('core')
        .from('organizations')
        .update({ default_payment_method_id: saved.id })
        .eq('id', input.organizationId)

      if (updateError) {
        console.warn(`Failed to update organization default payment method: ${updateError.message}`)
      }

      return {
        id: saved.id,
        brand: saved.brand,
        last4: saved.last4,
        expMonth: saved.exp_month,
        expYear: saved.exp_year,
        isDefault: saved.is_default,
      }
    }),

  /**
   * Get the current payment method for an organization
   */
  getPaymentMethod: officeProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId)

      const { data: method, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('organization_payment_methods')
        .select('*')
        .eq('organization_id', input.organizationId)
        .is('deleted_at', null)
        .maybeSingle()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load payment method: ${error.message}`,
        })
      }

      if (!method) {
        return null
      }

      return {
        id: method.id,
        brand: method.brand,
        last4: method.last4,
        expMonth: method.exp_month,
        expYear: method.exp_year,
        billingName: method.billing_name,
        billingEmail: method.billing_email,
        isDefault: method.is_default,
        createdAt: method.created_at,
      }
    }),

  /**
   * Delete (soft delete) a payment method
   */
  deletePaymentMethod: officeProcedure
    .input(z.object({ organizationPaymentMethodId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: method, error: fetchError } = await ctx.supabaseAdmin
        .schema('core')
        .from('organization_payment_methods')
        .select('organization_id, stripe_payment_method_id')
        .eq('id', input.organizationPaymentMethodId)
        .is('deleted_at', null)
        .maybeSingle()

      if (fetchError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load payment method: ${fetchError.message}`,
        })
      }

      if (!method) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment method not found',
        })
      }

      await ensureOrganizationAccess(ctx, method.organization_id)

      // Detach from Stripe
      const stripe = await loadStripeClient(ctx)
      try {
        await stripe.paymentMethods.detach(method.stripe_payment_method_id)
      } catch (stripeError) {
        console.warn(`Failed to detach payment method from Stripe: ${stripeError}`)
        // Continue with soft delete even if Stripe detach fails
      }

      // Soft delete in database
      const { error: deleteError } = await ctx.supabaseAdmin
        .schema('core')
        .from('organization_payment_methods')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', input.organizationPaymentMethodId)

      if (deleteError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete payment method: ${deleteError.message}`,
        })
      }

      // Clear organization default if this was the default
      const { error: clearError } = await ctx.supabaseAdmin
        .schema('core')
        .from('organizations')
        .update({ default_payment_method_id: null })
        .eq('default_payment_method_id', input.organizationPaymentMethodId)

      if (clearError) {
        console.warn(`Failed to clear organization default: ${clearError.message}`)
      }

      return { ok: true }
    }),

  // =========================================================
  // Transaction History & Receipts
  // =========================================================

  /**
   * Get a single transaction by ID (for receipt details)
   */
  getTransaction: officeProcedure
    .input(z.object({ transactionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      const { data: transaction, error } = await supabaseAdmin
        .schema('core')
        .from('payment_transactions')
        .select(
          `
          *,
          organization:organizations(id, name, address),
          user:users(id, display_name, email)
        `
        )
        .eq('id', input.transactionId)
        .maybeSingle()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load transaction: ${error.message}`,
        })
      }

      if (!transaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        })
      }

      // Verify access (office users can see all, org members can see their org's transactions)
      const hasPlatformRole = await userHasPlatformRole(ctx)
      if (!hasPlatformRole && transaction.organization_id) {
        await ensureOrganizationAccess(ctx, transaction.organization_id)
      }

      return {
        id: transaction.id,
        organizationId: transaction.organization_id,
        organizationName: (transaction.organization as { name?: string } | null)?.name ?? null,
        organizationAddress:
          (transaction.organization as { address?: unknown } | null)?.address ?? null,
        userId: transaction.user_id,
        userName:
          (transaction.user as { display_name?: string; email?: string } | null)?.display_name ??
          (transaction.user as { display_name?: string; email?: string } | null)?.email ??
          null,
        userEmail: (transaction.user as { email?: string } | null)?.email ?? null,
        amountCents: transaction.amount_cents,
        currency: transaction.currency,
        transactionType: transaction.transaction_type,
        status: transaction.status,
        failureReason: transaction.failure_reason,
        stripePaymentIntentId: transaction.stripe_payment_intent_id,
        successFeeId: transaction.success_fee_id,
        backgroundCheckId: transaction.background_check_id,
        backgroundCheckAccessId: transaction.background_check_access_id,
        idVerificationId: transaction.id_verification_id,
        createdAt: transaction.created_at,
        succeededAt: transaction.succeeded_at,
        failedAt: transaction.failed_at,
        refundedAt: transaction.refunded_at,
        metadata: transaction.metadata ?? {},
      }
    }),

  /**
   * List transactions for an organization (organization-facing, not admin)
   */
  listTransactions: protectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().uuid(),
          limit: z.number().int().positive().max(500).default(50),
          offset: z.number().int().nonnegative().default(0),
          status: z.enum(['pending', 'succeeded', 'failed', 'refunded', 'cancelled']).optional(),
          transactionType: z
            .enum([
              'success_fee_upfront',
              'success_fee_final',
              'background_check',
              'background_check_shared',
              'id_verification',
              'credit_deposit',
              'credit_refund',
            ])
            .optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!input?.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'organizationId is required',
        })
      }

      await ensureOrganizationAccess(ctx, input.organizationId)

      const { supabaseAdmin } = ctx

      let query = supabaseAdmin
        .schema('core')
        .from('payment_transactions')
        .select(
          `
          *,
          organization:organizations(id, name),
          user:users(id, display_name, email)
        `
        )
        .eq('organization_id', input.organizationId)
        .order('created_at', { ascending: false })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50) - 1)

      if (input?.status) {
        query = query.eq('status', input.status)
      }

      if (input?.transactionType) {
        query = query.eq('transaction_type', input.transactionType)
      }

      if (input?.startDate) {
        query = query.gte('created_at', input.startDate)
      }

      if (input?.endDate) {
        query = query.lte('created_at', input.endDate)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load transactions: ${error.message}`,
        })
      }

      return {
        items: (data ?? []).map((row: { id: string; organization_id: string; organization?: { name?: string } | null; user_id: string | null; user?: { display_name?: string; email?: string } | null; amount_cents?: number | null; currency?: string | null; transaction_type?: string | null; status?: string | null; failure_reason?: string | null; stripe_payment_intent_id?: string | null; created_at: string; succeeded_at?: string | null; failed_at?: string | null; refunded_at?: string | null; metadata?: unknown }) => ({
          id: row.id,
          organizationId: row.organization_id,
          organizationName: (row.organization as { name?: string } | null)?.name ?? null,
          userId: row.user_id,
          userName:
            (row.user as { display_name?: string; email?: string } | null)?.display_name ??
            (row.user as { display_name?: string; email?: string } | null)?.email ??
            null,
          amountCents: row.amount_cents,
          currency: row.currency,
          transactionType: row.transaction_type,
          status: row.status,
          failureReason: row.failure_reason,
          stripePaymentIntentId: row.stripe_payment_intent_id,
          createdAt: row.created_at,
          succeededAt: row.succeeded_at,
          failedAt: row.failed_at,
          refundedAt: row.refunded_at,
          metadata: row.metadata ?? {},
        })),
        totalCount: count ?? 0,
      }
    }),

  /**
   * Export transactions as CSV or JSON
   */
  exportTransactions: officeProcedure
    .input(
      z.object({
        format: z.enum(['csv', 'json']).default('csv'),
        organizationId: z.string().uuid().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        status: z.enum(['pending', 'succeeded', 'failed', 'refunded', 'cancelled']).optional(),
        transactionType: z
          .enum([
            'success_fee_upfront',
            'success_fee_final',
            'background_check',
            'background_check_shared',
            'id_verification',
            'credit_deposit',
            'credit_refund',
          ])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      let query = supabaseAdmin
        .schema('core')
        .from('payment_transactions')
        .select(
          `
          *,
          organization:organizations(id, name),
          user:users(id, display_name, email)
        `
        )
        .order('created_at', { ascending: false })

      if (input.organizationId) {
        query = query.eq('organization_id', input.organizationId)
      }

      if (input.status) {
        query = query.eq('status', input.status)
      }

      if (input.transactionType) {
        query = query.eq('transaction_type', input.transactionType)
      }

      if (input.startDate) {
        query = query.gte('created_at', input.startDate)
      }

      if (input.endDate) {
        query = query.lte('created_at', input.endDate)
      }

      const { data, error } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to export transactions: ${error.message}`,
        })
      }

      const transactions = (data ?? []).map((row: { id: string; organization?: { name?: string } | null; user?: { display_name?: string; email?: string } | null; amount_cents?: number | null; currency?: string | null; transaction_type?: string | null; status?: string | null; failure_reason?: string | null; stripe_payment_intent_id?: string | null; created_at: string; succeeded_at?: string | null; failed_at?: string | null; refunded_at?: string | null }) => ({
        id: row.id,
        organizationName: (row.organization as { name?: string } | null)?.name ?? 'N/A',
        userName:
          (row.user as { display_name?: string; email?: string } | null)?.display_name ??
          (row.user as { display_name?: string; email?: string } | null)?.email ??
          'N/A',
        amountCents: row.amount_cents,
        currency: row.currency,
        transactionType: row.transaction_type,
        status: row.status,
        failureReason: row.failure_reason ?? '',
        stripePaymentIntentId: row.stripe_payment_intent_id,
        createdAt: row.created_at,
        succeededAt: row.succeeded_at ?? '',
        failedAt: row.failed_at ?? '',
        refundedAt: row.refunded_at ?? '',
      }))

      if (input.format === 'json') {
        return {
          format: 'json' as const,
          data: JSON.stringify(transactions, null, 2),
          contentType: 'application/json',
        }
      }

      // CSV format
      if (transactions.length === 0) {
        return {
          format: 'csv' as const,
          data: '',
          contentType: 'text/csv',
        }
      }

      const headers = [
        'ID',
        'Organization',
        'User',
        'Amount (cents)',
        'Currency',
        'Type',
        'Status',
        'Failure Reason',
        'Stripe Payment Intent ID',
        'Created At',
        'Succeeded At',
        'Failed At',
        'Refunded At',
      ]

      const rows = transactions.map((t: { id: string; organizationName: string; userName: string; amountCents?: number | null; currency?: string | null; transactionType?: string | null; status?: string | null; failureReason: string; stripePaymentIntentId?: string | null; createdAt: string; succeededAt: string; failedAt: string; refundedAt: string }) => [
        t.id,
        t.organizationName,
        t.userName,
        String(t.amountCents),
        t.currency,
        t.transactionType,
        t.status,
        t.failureReason,
        t.stripePaymentIntentId,
        t.createdAt,
        t.succeededAt,
        t.failedAt,
        t.refundedAt,
      ])

      const csvRows = [headers, ...rows]
        .map((row: (string | number | null | undefined)[]) => row.map((cell: string | number | null | undefined) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      return {
        format: 'csv' as const,
        data: csvRows,
        contentType: 'text/csv',
      }
    }),

  /**
   * Generate receipt data for a transaction (for PDF/email generation)
   */
  generateReceipt: officeProcedure
    .input(z.object({ transactionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.caller.payments.getTransaction({
        transactionId: input.transactionId,
      })

      const formatCurrency = (cents: number, currency: string): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency.toUpperCase(),
        }).format(cents / 100)
      }

      const formatTransactionType = (type: string): string => {
        return type
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }

      return {
        transactionId: transaction.id,
        receiptNumber: `RCP-${transaction.id.slice(0, 8).toUpperCase()}`,
        date: transaction.succeededAt ?? transaction.createdAt,
        organizationName: transaction.organizationName ?? 'N/A',
        organizationAddress: transaction.organizationAddress,
        amount: formatCurrency(transaction.amountCents, transaction.currency),
        amountCents: transaction.amountCents,
        currency: transaction.currency,
        transactionType: formatTransactionType(transaction.transactionType),
        status: transaction.status,
        stripePaymentIntentId: transaction.stripePaymentIntentId,
        metadata: transaction.metadata,
      }
    }),

  // =========================================================
  // Account Credits (Pre-funding)
  // =========================================================

  /**
   * Get account credits balance for an organization
   */
  getAccountCredits: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId)

      const { data: credits, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('account_credits')
        .select('*')
        .eq('organization_id', input.organizationId)
        .maybeSingle()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load account credits: ${error.message}`,
        })
      }

      if (!credits) {
        // Return zero balance if no record exists
        return {
          id: null,
          organizationId: input.organizationId,
          balanceCents: 0,
          currency: 'usd',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }

      return {
        id: credits.id,
        organizationId: credits.organization_id,
        balanceCents: credits.balance_cents,
        currency: credits.currency,
        createdAt: credits.created_at,
        updatedAt: credits.updated_at,
      }
    }),

  /**
   * Deposit credits to an organization account (top-up via Stripe)
   */
  depositCredits: officeProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        amountCents: z.number().int().positive(),
        paymentMethodId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId)
      const stripe = await loadStripeClient(ctx)
      const customerId = await getOrCreateStripeCustomer(ctx, stripe, input.organizationId)

      // Create PaymentIntent for credit deposit
      const paymentIntent = await stripe.paymentIntents.create({
        amount: input.amountCents,
        currency: 'usd',
        customer: customerId,
        payment_method: input.paymentMethodId,
        confirm: input.paymentMethodId ? true : false,
        description: `Account credit deposit - ${input.amountCents / 100} USD`,
        metadata: {
          organization_id: input.organizationId,
          transaction_type: 'credit_deposit',
        },
      })

      // Record payment transaction
      const { data: transaction, error: txError } = await ctx.supabaseAdmin
        .schema('core')
        .from('payment_transactions')
        .insert({
          organization_id: input.organizationId,
          user_id: ctx.user?.id ?? null,
          stripe_payment_intent_id: paymentIntent.id,
          amount_cents: input.amountCents,
          currency: 'usd',
          transaction_type: 'credit_deposit',
          status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
          succeeded_at: paymentIntent.status === 'succeeded' ? new Date().toISOString() : null,
        })
        .select('*')
        .maybeSingle()

      if (txError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to record payment transaction: ${txError.message}`,
        })
      }

      // If payment succeeded, deposit credits
      if (paymentIntent.status === 'succeeded' && transaction) {
        const { error: creditError } = await ctx.supabaseAdmin
          .schema('core')
          .rpc('apply_credit_transaction', {
            p_organization_id: input.organizationId,
            p_amount_cents: input.amountCents,
            p_transaction_type: 'deposit',
            p_direction: 'credit',
            p_description: `Credit deposit via Stripe`,
            p_payment_transaction_id: transaction.id,
            p_created_by: ctx.user?.id ?? null,
          })

        if (creditError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to deposit credits: ${creditError.message}`,
          })
        }
      }

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        transactionId: transaction?.id ?? null,
      }
    }),

  /**
   * Get credit ledger (transaction history)
   */
  getCreditLedger: protectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().uuid(),
          limit: z.number().int().positive().max(500).default(50),
          offset: z.number().int().nonnegative().default(0),
          transactionType: z
            .enum(['deposit', 'withdrawal', 'refund', 'expiration', 'adjustment'])
            .optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!input?.organizationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'organizationId is required',
        })
      }

      await ensureOrganizationAccess(ctx, input.organizationId)

      const { supabaseAdmin } = ctx

      let query = supabaseAdmin
        .schema('core')
        .from('credit_ledger')
        .select('*')
        .eq('organization_id', input.organizationId)
        .order('created_at', { ascending: false })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50) - 1)

      if (input?.transactionType) {
        query = query.eq('transaction_type', input.transactionType)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load credit ledger: ${error.message}`,
        })
      }

      return {
        items: (data ?? []).map((row: { id: string; account_credit_id: string; organization_id: string; amount_cents?: number | null; currency?: string | null; transaction_type?: string | null; direction?: string | null; description?: string | null; payment_transaction_id?: string | null; success_fee_id?: string | null; background_check_id?: string | null; id_verification_id?: string | null; metadata?: unknown; created_by?: string | null; created_at: string }) => ({
          id: row.id,
          accountCreditId: row.account_credit_id,
          organizationId: row.organization_id,
          amountCents: row.amount_cents,
          currency: row.currency,
          transactionType: row.transaction_type,
          direction: row.direction,
          description: row.description,
          paymentTransactionId: row.payment_transaction_id,
          successFeeId: row.success_fee_id,
          backgroundCheckId: row.background_check_id,
          idVerificationId: row.id_verification_id,
          metadata: row.metadata ?? {},
          createdBy: row.created_by,
          createdAt: row.created_at,
        })),
        totalCount: count ?? 0,
      }
    }),

  /**
   * Apply credits to a payment (internal helper, called by payment flows)
   */
  applyCreditsToPayment: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        amountCents: z.number().int().positive(),
        transactionType: z.enum([
          'success_fee_upfront',
          'success_fee_final',
          'background_check',
          'background_check_shared',
          'id_verification',
        ]),
        description: z.string(),
        paymentTransactionId: z.string().uuid().optional(),
        successFeeId: z.string().uuid().optional(),
        backgroundCheckId: z.string().uuid().optional(),
        idVerificationId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId)

      const { error } = await ctx.supabaseAdmin.schema('core').rpc('apply_credit_transaction', {
        p_organization_id: input.organizationId,
        p_amount_cents: input.amountCents,
        p_transaction_type: 'withdrawal',
        p_direction: 'debit',
        p_description: input.description,
        p_payment_transaction_id: input.paymentTransactionId ?? null,
        p_success_fee_id: input.successFeeId ?? null,
        p_background_check_id: input.backgroundCheckId ?? null,
        p_id_verification_id: input.idVerificationId ?? null,
        p_created_by: ctx.user?.id ?? null,
      })

      if (error) {
        throw new TRPCError({
          code: error.message.includes('Insufficient credits')
            ? 'BAD_REQUEST'
            : 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return { ok: true }
    }),

  /**
   * Check if organization has sufficient credits and optionally apply them
   * This is a helper for payment flows to check/use credits before creating PaymentIntents
   */
  checkAndApplyCredits: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        amountCents: z.number().int().positive(),
        autoApply: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId)

      const credits = await ctx.caller.payments.getAccountCredits({
        organizationId: input.organizationId,
      })

      const hasSufficientCredits = credits.balanceCents >= input.amountCents
      const creditAmount = Math.min(credits.balanceCents, input.amountCents)
      const remainingAmount = input.amountCents - creditAmount

      return {
        hasSufficientCredits,
        balanceCents: credits.balanceCents,
        creditAmount,
        remainingAmount,
        willUseCredits: hasSufficientCredits && input.autoApply,
      }
    }),
})
