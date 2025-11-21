import { TRPCError } from '@trpc/server'
import type Stripe from 'stripe'
import { z } from 'zod'
import { mergeMetadata } from '../../_shared/id-verification-utils.ts'
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
const mockStripePaymentIntents = new Map<
  string,
  {
    amount: number
    currency: string
    clientSecret: string
    metadata: Record<string, unknown>
  }
>()

const requestVerificationInput = z.object({
  workerUserId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  pricingId: z.string().uuid().optional(),
})

const confirmVerificationInput = z.object({
  paymentIntentId: z.string().min(5),
})

const getStatusInput = z.object({
  idVerificationId: z.string().uuid(),
})

const getCurrentVerificationInput = z.object({
  workerUserId: z.string().uuid().optional(),
})

const listVerificationsInput = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().max(120).optional(),
  status: z.enum(['all', 'active', 'expired', 'revoked']).default('all'),
  organizationId: z.string().uuid().optional(),
})

const revokeVerificationInput = z.object({
  idVerificationId: z.string().uuid(),
  reason: z.string().trim().min(5).max(500),
})

type PricingRow = {
  id: string
  name: string
  description: string | null
  price_cents: number
}

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
          metadata: payload.metadata ?? {},
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
        if (!stored) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Mock payment intent not found',
          })
        }
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
        ? `Failed to load Stripe secret: ${secretError.message}`
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
      (assignment) =>
        assignment.role?.scope === 'platform' &&
        ['office', 'super_admin'].includes(assignment.role?.name ?? '')
    )
  )
}

async function ensureCanRequestForWorker(ctx: Context, workerUserId: string) {
  if (!ctx.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (ctx.user.id === workerUserId) {
    return
  }

  const hasPlatformRole = await userHasPlatformRole(ctx)
  if (!hasPlatformRole) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not allowed to request verification for this worker.',
    })
  }
}

function addSixMonths(base: Date): Date {
  const expiry = new Date(base)
  expiry.setMonth(expiry.getMonth() + 6)
  return expiry
}

async function recordPaymentTransaction(
  ctx: Context,
  params: {
    organizationId: string | null
    userId: string | null
    amountCents: number
    idVerificationId: string
    paymentIntentId: string
  }
) {
  const { error } = await ctx.supabaseAdmin
    .schema('core')
    .from('payment_transactions')
    .insert({
      organization_id: params.organizationId,
      user_id: params.userId,
      amount_cents: params.amountCents,
      currency: 'usd',
      transaction_type: 'id_verification',
      id_verification_id: params.idVerificationId,
      stripe_payment_intent_id: params.paymentIntentId,
      status: 'succeeded',
      succeeded_at: new Date().toISOString(),
      metadata: {
        source: 'id_verification_router',
      },
    })

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to record payment transaction: ${error.message}`,
    })
  }
}

type PersonaInquiryResult = {
  inquiryId: string
  status: string
}

async function createPersonaInquiry(workerUserId: string): Promise<PersonaInquiryResult> {
  const apiKey = Deno.env.get('PERSONA_API_KEY')
  const templateId = Deno.env.get('PERSONA_TEMPLATE_ID')

  if (!apiKey || !templateId) {
    return {
      inquiryId: `persona_${crypto.randomUUID()}`,
      status: 'pending',
    }
  }

  const response = await fetch('https://withpersona.com/api/v1/inquiries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'inquiry',
        attributes: {
          template_id: templateId,
          reference_id: workerUserId,
        },
      },
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Persona inquiry creation failed: ${message}`,
    })
  }

  const json = await response.json()
  const inquiryId = json?.data?.id ?? `persona_${crypto.randomUUID()}`
  const status = json?.data?.attributes?.status ?? 'pending'

  return { inquiryId, status }
}

export const idVerificationRouter = t.router({
  getPricing: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .schema('core')
      .from('service_pricing')
      .select('id, name, description, price_cents, metadata')
      .eq('service_type', 'id_verification')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load pricing: ${error.message}`,
      })
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      priceCents: row.price_cents,
      metadata: row.metadata ?? {},
    }))
  }),

  requestVerification: protectedProcedure
    .input(requestVerificationInput)
    .mutation(async ({ ctx, input }) => {
      await ensureCanRequestForWorker(ctx, input.workerUserId)

      const { data: pricingRows, error: pricingError } = await ctx.supabase
        .schema('core')
        .from('service_pricing')
        .select('id, name, description, price_cents')
        .eq('service_type', 'id_verification')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (pricingError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load pricing: ${pricingError.message}`,
        })
      }

      const pricingList = pricingRows ?? []
      const selectedPricing: PricingRow | undefined = input.pricingId
        ? pricingList.find((row) => row.id === input.pricingId)
        : pricingList[0]

      if (!selectedPricing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'ID verification pricing is not configured.',
        })
      }

      if (selectedPricing.price_cents <= 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Pricing for ID verification must be greater than zero.',
        })
      }

      const stripe = await loadStripeClient(ctx)
      const intent = await stripe.paymentIntents.create({
        amount: selectedPricing.price_cents,
        currency: 'usd',
        metadata: {
          service_type: 'id_verification',
          worker_user_id: input.workerUserId,
          initiated_by_user_id: ctx.user?.id ?? '',
          organization_id: input.organizationId ?? '',
          service_pricing_id: selectedPricing.id,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      if (!intent.client_secret) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe client secret was not returned for the payment intent.',
        })
      }

      return {
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        amountCents: selectedPricing.price_cents,
        currency: intent.currency,
      }
    }),

  confirmVerificationPayment: protectedProcedure
    .input(confirmVerificationInput)
    .mutation(async ({ ctx, input }) => {
      const stripe = await loadStripeClient(ctx)
      const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId)

      if (intent.status !== 'succeeded') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Payment intent is not succeeded (current status: ${intent.status}).`,
        })
      }

      const metadata = intent.metadata ?? {}
      const workerUserId = metadata.worker_user_id ?? ctx.user?.id
      if (!workerUserId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unable to determine worker for verification.',
        })
      }

      await ensureCanRequestForWorker(ctx, workerUserId)

      const initiatedByUserId = metadata.initiated_by_user_id?.length
        ? metadata.initiated_by_user_id
        : (ctx.user?.id ?? null)
      const organizationId = metadata.organization_id?.length ? metadata.organization_id : null

      // Check if verification already exists for this payment intent
      const { data: existing, error: existingError } = await ctx.supabaseAdmin
        .schema('core')
        .from('id_verifications')
        .select('id, badge_status')
        .eq('payment_intent_id', input.paymentIntentId)
        .maybeSingle()

      if (existingError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to check existing verification: ${existingError.message}`,
        })
      }

      if (existing) {
        return { id: existing.id, badgeStatus: existing.badge_status }
      }

      const personaInquiry = await createPersonaInquiry(workerUserId)
      const paidAt = new Date((intent.created ?? Math.floor(Date.now() / 1000)) * 1000)
      const verifiedAt = new Date()
      const badgeExpiresAt = addSixMonths(verifiedAt)

      const { data: record, error: insertError } = await ctx.supabaseAdmin
        .schema('core')
        .from('id_verifications')
        .insert({
          worker_user_id: workerUserId,
          initiated_by_user_id: initiatedByUserId,
          initiated_by_org_id: organizationId,
          payment_intent_id: intent.id,
          price_cents: intent.amount ?? 0,
          paid_at: paidAt.toISOString(),
          persona_inquiry_id: personaInquiry.inquiryId,
          persona_status: personaInquiry.status,
          verification_level: 'government_id',
          verified_at: verifiedAt.toISOString(),
          badge_status: 'active',
          badge_expires_at: badgeExpiresAt.toISOString(),
          metadata: mergeMetadata(metadata, {
            service_pricing_id: metadata.service_pricing_id ?? null,
          }),
        })
        .select('*')
        .maybeSingle()

      if (insertError || !record) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: insertError
            ? `Failed to create id verification: ${insertError.message}`
            : 'Failed to create id verification record.',
        })
      }

      await recordPaymentTransaction(ctx, {
        organizationId,
        userId: workerUserId,
        amountCents: intent.amount ?? 0,
        idVerificationId: record.id,
        paymentIntentId: intent.id,
      })

      return {
        id: record.id,
        badgeStatus: record.badge_status,
        badgeExpiresAt: record.badge_expires_at,
      }
    }),

  getVerificationStatus: protectedProcedure.input(getStatusInput).query(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabaseAdmin
      .schema('core')
      .from('id_verifications')
      .select('*')
      .eq('id', input.idVerificationId)
      .maybeSingle()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load verification: ${error.message}`,
      })
    }

    if (!data) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Verification not found' })
    }

    await ensureCanRequestForWorker(ctx, data.worker_user_id)

    return {
      id: data.id,
      badgeStatus: data.badge_status,
      badgeExpiresAt: data.badge_expires_at,
      personaStatus: data.persona_status,
      verificationLevel: data.verification_level,
      verifiedAt: data.verified_at,
      metadata: data.metadata ?? {},
    }
  }),

  getCurrentVerification: protectedProcedure
    .input(getCurrentVerificationInput)
    .query(async ({ ctx, input }) => {
      const workerUserId = input.workerUserId ?? ctx.user?.id
      if (!workerUserId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'workerUserId is required',
        })
      }

      await ensureCanRequestForWorker(ctx, workerUserId)

      const { data, error } = await ctx.supabaseAdmin
        .schema('core')
        .rpc('get_current_verification', {
          p_worker_user_id: workerUserId,
        })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load verification badge: ${error.message}`,
        })
      }

      if (!data) {
        return null
      }

      return {
        id: data.id,
        verificationLevel: data.verification_level,
        badgeStatus: data.badge_status,
        badgeExpiresAt: data.badge_expires_at,
        verifiedAt: data.verified_at,
      }
    }),

  listVerifications: officeProcedure.input(listVerificationsInput).query(async ({ ctx, input }) => {
    type RowRecord = {
      id: string
      worker_user_id: string | null
      initiated_by_user_id: string | null
      initiated_by_org_id: string | null
      payment_intent_id: string | null
      price_cents: number | null
      paid_at: string | null
      badge_status: string | null
      badge_expires_at: string | null
      verification_level: string | null
      verified_at: string | null
      persona_status: string | null
      created_at: string | null
      worker: {
        id?: string | null
        display_name?: string | null
        email?: string | null
        avatar_path?: string | null
      } | null
      initiator: {
        id?: string | null
        display_name?: string | null
        email?: string | null
      } | null
      organization: {
        id?: string | null
        name?: string | null
      } | null
    }

    type DerivedStatus = 'active' | 'expired' | 'revoked'
    const queryLimit = 500

    let query = ctx.supabase
      .schema('core')
      .from('id_verifications')
      .select(
        `
            id,
            worker_user_id,
            initiated_by_user_id,
            initiated_by_org_id,
            payment_intent_id,
            price_cents,
            paid_at,
            badge_status,
            badge_expires_at,
            verification_level,
            verified_at,
            persona_status,
            created_at,
            worker:users!id_verifications_worker_user_id_fkey(id, display_name, email, avatar_path),
            initiator:users!id_verifications_initiated_by_user_id_fkey(id, display_name, email),
            organization:organizations!id_verifications_initiated_by_org_id_fkey(id, name)
          `
      )
      .order('created_at', { ascending: false })
      .limit(queryLimit)

    if (input.organizationId) {
      query = query.eq('initiated_by_org_id', input.organizationId)
    }

    const { data, error } = await query

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load ID verifications: ${error.message}`,
      })
    }

    const rows: RowRecord[] = (data ?? []) as RowRecord[]
    const now = Date.now()

    const deriveStatus = (row: RowRecord): DerivedStatus => {
      const baseStatus =
        row.badge_status === 'revoked'
          ? 'revoked'
          : row.badge_status === 'expired'
            ? 'expired'
            : 'active'

      if (
        baseStatus === 'active' &&
        row.badge_expires_at &&
        !Number.isNaN(Date.parse(row.badge_expires_at)) &&
        Date.parse(row.badge_expires_at) < now
      ) {
        return 'expired'
      }

      return baseStatus
    }

    const deriveWorkerName = (row: RowRecord): string => {
      const displayName = row.worker?.display_name?.trim()
      if (displayName) return displayName
      const email = row.worker?.email?.trim()
      if (email) return email
      if (row.worker_user_id) {
        return `User ${row.worker_user_id.slice(0, 8)}`
      }
      return 'Unknown worker'
    }

    const normalized = rows.map((row) => {
      const badgeStatus = deriveStatus(row)
      const source: 'worker' | 'organization' | 'platform' = row.initiated_by_org_id
        ? 'organization'
        : row.initiated_by_user_id &&
            row.worker_user_id &&
            row.initiated_by_user_id !== row.worker_user_id
          ? 'platform'
          : 'worker'

      return {
        id: row.id,
        workerUserId: row.worker_user_id,
        workerName: deriveWorkerName(row),
        workerEmail: row.worker?.email ?? null,
        workerAvatarUrl: row.worker?.avatar_path ?? null,
        organizationId: row.organization?.id ?? row.initiated_by_org_id ?? null,
        organizationName: row.organization?.name ?? null,
        initiatedByUserId: row.initiated_by_user_id,
        initiatedByOrgId: row.initiated_by_org_id,
        paymentIntentId: row.payment_intent_id,
        priceCents: row.price_cents ?? 0,
        paidAt: row.paid_at,
        badgeStatus,
        rawBadgeStatus: row.badge_status,
        badgeExpiresAt: row.badge_expires_at,
        verificationLevel: row.verification_level,
        personaStatus: row.persona_status,
        verifiedAt: row.verified_at,
        createdAt: row.created_at,
        source,
      }
    })

    const summary = normalized.reduce(
      (acc, item) => {
        acc.total += 1
        acc[item.badgeStatus] += 1
        return acc
      },
      {
        total: 0,
        active: 0,
        expired: 0,
        revoked: 0,
      } as Record<'total' | DerivedStatus, number>
    )

    const statusFiltered =
      input.status === 'all'
        ? normalized
        : normalized.filter((item) => item.badgeStatus === input.status)

    const searchTerm = input.search?.trim().toLowerCase()
    const filtered = searchTerm
      ? statusFiltered.filter((item) => {
          const haystack = [
            item.workerName,
            item.workerEmail ?? '',
            item.organizationName ?? '',
            item.badgeStatus,
            item.personaStatus ?? '',
            item.verificationLevel ?? '',
          ]
            .join(' ')
            .toLowerCase()
          return haystack.includes(searchTerm)
        })
      : statusFiltered

    const total = filtered.length
    const start = Math.min(input.offset, total)
    const end = Math.min(start + input.limit, total)
    const items = filtered.slice(start, end)

    return {
      items,
      total,
      hasMore: end < total,
      summary: {
        total: summary.total,
        active: summary.active,
        expired: summary.expired,
        revoked: summary.revoked,
      },
    }
  }),

  revokeVerification: officeProcedure
    .input(revokeVerificationInput)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('id_verifications')
        .update({
          badge_status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by_user_id: ctx.user?.id ?? null,
          revocation_reason: input.reason,
        })
        .eq('id', input.idVerificationId)
        .select('id')
        .maybeSingle()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to revoke verification: ${error.message}`,
        })
      }

      if (!data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Verification not found' })
      }

      return { revoked: true }
    }),
})
