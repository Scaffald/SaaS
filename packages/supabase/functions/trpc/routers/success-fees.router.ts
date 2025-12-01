// This file uses Deno ESM imports from esm.sh that are not compatible with TypeScript checking
import { TRPCError } from '@trpc/server'
import type Stripe from 'stripe'
import { z } from 'zod'

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

const computeFeeInput = z.object({
  totalHireValueCents: z.number().int().positive(),
  jobDurationDays: z.number().int().positive(),
  hireStartDate: z.string().optional(),
})

const createSuccessFeeInput = computeFeeInput.extend({
  organizationId: z.string().uuid(),
  workerUserId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  hireStartDate: z.string(),
})

const confirmPaymentInput = z.object({
  successFeeId: z.string().uuid(),
  paymentIntentId: z.string().min(5),
})

const getStatusByApplicationInput = z.object({
  organizationId: z.string().uuid(),
  applicationId: z.string().uuid(),
  workerUserId: z.string().uuid(),
})

const adjustScheduleInput = z.object({
  successFeeId: z.string().uuid(),
  newJobDurationDays: z.number().int().positive(),
  note: z.string().max(2000).optional(),
})

const processFinalPaymentInput = z.object({
  successFeeId: z.string().uuid(),
})

type SuccessFeeSchedule = {
  paymentSchedule: 'standard' | 'short'
  upfrontPercentage: number
  finalPercentage: number
  upfrontAmountCents: number
  finalAmountCents: number
  finalPaymentDueDate: string | null
}

type SuccessFeeRecord = {
  id: string
  organization_id: string
  worker_user_id: string | null
  job_id: string | null
  application_id: string | null
  total_hire_value_cents: number
  total_fee_cents: number
  job_duration_days: number | null
  payment_schedule: 'standard' | 'short'
  upfront_percentage: number
  final_percentage: number
  upfront_amount_cents: number
  final_amount_cents: number
  hire_start_date: string
  final_payment_due_date: string
  upfront_payment_intent_id: string | null
  final_payment_intent_id: string | null
  status: 'pending' | 'upfront_paid' | 'completed' | 'failed' | 'cancelled'
  upfront_paid_at: string | null
  created_at: string
}

const FEE_PERCENTAGE = 10

type SuccessFeeStatus = {
  successFeeId: string
  schedule: SuccessFeeSchedule
  status: SuccessFeeRecord['status']
  upfrontPaidAt: string | null
  upfrontPaymentIntentId: string | null
  finalPaymentIntentId: string | null
  createdAt: string
}

function calculateFinalDueDate(
  paymentSchedule: 'standard' | 'short',
  hireStartDate: string,
  jobDurationDays: number
): string {
  const start = new Date(hireStartDate)
  if (Number.isNaN(start.getTime())) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'hireStartDate must be a valid ISO date string',
    })
  }

  const offset = paymentSchedule === 'standard' ? 30 : Math.max(jobDurationDays, 1)
  const due = new Date(start)
  due.setDate(due.getDate() + offset)
  return due.toISOString().split('T')[0]!
}

function determinePaymentSchedule(params: {
  totalFeeCents: number
  jobDurationDays: number
  hireStartDate?: string
}): SuccessFeeSchedule {
  const { totalFeeCents, jobDurationDays, hireStartDate } = params
  const useStandard = jobDurationDays >= 30
  const paymentSchedule: 'standard' | 'short' = useStandard ? 'standard' : 'short'
  const upfrontPercentage = useStandard ? 20 : 50
  const finalPercentage = 100 - upfrontPercentage
  const upfrontAmountCents = Math.round(totalFeeCents * (upfrontPercentage / 100))
  const finalAmountCents = Math.max(totalFeeCents - upfrontAmountCents, 0)

  return {
    paymentSchedule,
    upfrontPercentage,
    finalPercentage,
    upfrontAmountCents,
    finalAmountCents,
    finalPaymentDueDate: hireStartDate
      ? calculateFinalDueDate(paymentSchedule, hireStartDate, jobDurationDays)
      : null,
  }
}

function scheduleFromRecord(record: SuccessFeeRecord): SuccessFeeSchedule {
  return {
    paymentSchedule: record.payment_schedule,
    upfrontPercentage: record.upfront_percentage,
    finalPercentage: record.final_percentage,
    upfrontAmountCents: record.upfront_amount_cents,
    finalAmountCents: record.final_amount_cents,
    finalPaymentDueDate: record.final_payment_due_date,
  }
}

async function findLatestSuccessFee(
  ctx: Context,
  filters: { organizationId: string; applicationId: string; workerUserId: string }
): Promise<SuccessFeeRecord | null> {
  const supabase = ctx.supabaseAdmin ?? ctx.supabase
  const { data, error } = await supabase
    .schema('core')
    .from('success_fees')
    .select('*')
    .eq('organization_id', filters.organizationId)
    .eq('application_id', filters.applicationId)
    .eq('worker_user_id', filters.workerUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load success fee: ${error.message}`,
    })
  }

  return (data as SuccessFeeRecord | null) ?? null
}

async function ensureUpfrontPaymentIntent(
  ctx: Context,
  successFee: SuccessFeeRecord,
  schedule: SuccessFeeSchedule
): Promise<Stripe.PaymentIntent> {
  const stripe = await loadStripeClient(ctx)

  if (successFee.upfront_payment_intent_id) {
    return await stripe.paymentIntents.retrieve(successFee.upfront_payment_intent_id)
  }

  const intent = await stripe.paymentIntents.create({
    amount: schedule.upfrontAmountCents,
    currency: 'usd',
    metadata: {
      success_fee_id: successFee.id,
      organization_id: successFee.organization_id,
      stage: 'upfront',
    },
    automatic_payment_methods: {
      enabled: true,
    },
  })

  const supabase = ctx.supabaseAdmin ?? ctx.supabase
  const { error: updateError } = await supabase
    .schema('core')
    .from('success_fees')
    .update({
      upfront_payment_intent_id: intent.id,
    })
    .eq('id', successFee.id)

  if (updateError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to link payment intent: ${updateError.message}`,
    })
  }

  return intent
}

async function loadStripeClient(ctx: Context): Promise<Stripe> {
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
      (assignment: { role?: { scope?: string; name?: string | null } | null; [key: string]: unknown }) =>
        assignment.role?.scope === 'platform' &&
        ['office', 'super_admin'].includes(assignment.role?.name ?? '')
    )
  )
}

async function ensureOrganizationAccess(ctx: Context, organizationId: string) {
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

async function recordTransaction(
  ctx: Context,
  params: {
    organizationId: string
    userId: string | undefined
    amountCents: number
    transactionType: 'success_fee_upfront' | 'success_fee_final'
    successFeeId: string
    paymentIntentId: string
    metadata?: Record<string, unknown>
  }
) {
  const { error } = await ctx.supabaseAdmin
    .schema('core')
    .from('payment_transactions')
    .insert({
      organization_id: params.organizationId,
      user_id: params.userId ?? null,
      amount_cents: params.amountCents,
      currency: 'usd',
      transaction_type: params.transactionType,
      success_fee_id: params.successFeeId,
      stripe_payment_intent_id: params.paymentIntentId,
      metadata: params.metadata ?? {},
    })

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to record payment transaction: ${error.message}`,
    })
  }
}

async function getSuccessFee(ctx: Context, id: string): Promise<SuccessFeeRecord> {
  const { data, error } = await ctx.supabaseAdmin
    .schema('core')
    .from('success_fees')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load success fee: ${error.message}`,
    })
  }

  if (!data) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Success fee not found',
    })
  }

  await ensureOrganizationAccess(ctx, data.organization_id)
  return data as SuccessFeeRecord
}

export const successFeesRouter = t.router({
  calculateFee: protectedProcedure.input(computeFeeInput).query(({ input }) => {
    const totalFeeCents = Math.round(input.totalHireValueCents * (FEE_PERCENTAGE / 100))

    const schedule = determinePaymentSchedule({
      totalFeeCents,
      jobDurationDays: input.jobDurationDays,
      hireStartDate: input.hireStartDate,
    })

    return {
      feePercentage: FEE_PERCENTAGE,
      totalFeeCents,
      ...schedule,
    }
  }),

  createSuccessFee: protectedProcedure
    .input(createSuccessFeeInput)
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId)

      if (!input.applicationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'applicationId is required to create a success fee.',
        })
      }

      const totalFeeCents = Math.round(input.totalHireValueCents * (FEE_PERCENTAGE / 100))

      const schedule = determinePaymentSchedule({
        totalFeeCents,
        jobDurationDays: input.jobDurationDays,
        hireStartDate: input.hireStartDate,
      })

      const now = new Date().toISOString()

      const latest = await findLatestSuccessFee(ctx, {
        organizationId: input.organizationId,
        applicationId: input.applicationId,
        workerUserId: input.workerUserId,
      })

      const supabase = ctx.supabaseAdmin ?? ctx.supabase
      let successFee: SuccessFeeRecord
      let calculatedSchedule = schedule
      let createdNewSuccessFee = false

      if (!latest) {
        const { data: inserted, error: insertError } = await supabase
          .schema('core')
          .from('success_fees')
          .insert({
            organization_id: input.organizationId,
            worker_user_id: input.workerUserId,
            job_id: input.jobId ?? null,
            application_id: input.applicationId,
            total_hire_value_cents: input.totalHireValueCents,
            fee_percentage: FEE_PERCENTAGE,
            total_fee_cents: totalFeeCents,
            job_duration_days: input.jobDurationDays,
            payment_schedule: schedule.paymentSchedule,
            upfront_percentage: schedule.upfrontPercentage,
            final_percentage: schedule.finalPercentage,
            upfront_amount_cents: schedule.upfrontAmountCents,
            final_amount_cents: schedule.finalAmountCents,
            final_payment_due_date: schedule.finalPaymentDueDate,
            hire_start_date: input.hireStartDate,
            hire_confirmed_at: now,
            status: 'pending',
          })
          .select('*')
          .maybeSingle()

        if (insertError || !inserted) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: insertError
              ? `Failed to create success fee: ${insertError.message}`
              : 'Failed to create success fee',
          })
        }

        successFee = inserted as SuccessFeeRecord
        createdNewSuccessFee = true
      } else {
        successFee = latest
        calculatedSchedule = scheduleFromRecord(latest)
      }

      if (successFee.status === 'upfront_paid') {
        return {
          successFeeId: successFee.id,
          clientSecret: null,
          paymentIntentId: successFee.upfront_payment_intent_id,
          schedule: calculatedSchedule,
          status: successFee.status,
          upfrontPaidAt: successFee.upfront_paid_at ?? null,
        }
      }

      const stripe = await loadStripeClient(ctx)
      let intent: Stripe.PaymentIntent
      let createdNewIntent = false

      if (successFee.upfront_payment_intent_id) {
        intent = await stripe.paymentIntents.retrieve(successFee.upfront_payment_intent_id)
      } else {
        intent = await stripe.paymentIntents.create({
          amount: calculatedSchedule.upfrontAmountCents,
          currency: 'usd',
          metadata: {
            success_fee_id: successFee.id,
            organization_id: successFee.organization_id,
            stage: 'upfront',
          },
          automatic_payment_methods: {
            enabled: true,
          },
        })

        const { error: updateError } = await supabase
          .schema('core')
          .from('success_fees')
          .update({
            upfront_payment_intent_id: intent.id,
          })
          .eq('id', successFee.id)

        if (updateError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to link payment intent: ${updateError.message}`,
          })
        }

        successFee.upfront_payment_intent_id = intent.id
        createdNewIntent = true
      }

      if (createdNewSuccessFee || createdNewIntent) {
        await recordTransaction(ctx, {
          organizationId: successFee.organization_id,
          userId: ctx.user?.id,
          amountCents: calculatedSchedule.upfrontAmountCents,
          transactionType: 'success_fee_upfront',
          successFeeId: successFee.id,
          paymentIntentId: intent.id,
          metadata: {
            stage: 'upfront',
          },
        })
      }

      return {
        successFeeId: successFee.id,
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        schedule: calculatedSchedule,
        status: successFee.status,
        upfrontPaidAt: successFee.upfront_paid_at ?? null,
      }
    }),

  confirmUpfrontPayment: protectedProcedure
    .input(confirmPaymentInput)
    .mutation(async ({ ctx, input }) => {
      const successFee = await getSuccessFee(ctx, input.successFeeId)

      if (!successFee.upfront_payment_intent_id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Success fee does not have an upfront payment intent.',
        })
      }

      if (successFee.upfront_payment_intent_id !== input.paymentIntentId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Provided payment intent does not match the success fee.',
        })
      }

      const stripe = await loadStripeClient(ctx)
      const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId)

      if (intent.status !== 'succeeded') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment has not succeeded yet.',
        })
      }

      const { error: updateError } = await ctx.supabaseAdmin
        .schema('core')
        .from('success_fees')
        .update({
          upfront_paid_at: new Date(intent.created * 1000).toISOString(),
          status: 'upfront_paid',
        })
        .eq('id', successFee.id)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update success fee: ${updateError.message}`,
        })
      }

      await ctx.supabaseAdmin
        .schema('core')
        .from('payment_transactions')
        .update({
          status: 'succeeded',
          succeeded_at: new Date(intent.created * 1000).toISOString(),
          metadata: {
            last_stripe_event_id: intent.latest_charge ?? null,
            last_stripe_event_type: 'manual_confirmation',
          },
        })
        .eq('stripe_payment_intent_id', input.paymentIntentId)

      // Create hire agreement when upfront payment is confirmed
      try {
        await ctx.caller.legalAgreements.createHireAgreement({
          organizationId: successFee.organization_id,
          workerUserId: successFee.worker_user_id,
          applicationId: successFee.application_id ?? undefined,
          successFeeId: successFee.id,
          termsAccepted: true,
          antiCircumventionAccepted: true,
        })
      } catch (agreementError) {
        // Log but don't fail the payment confirmation if agreement creation fails
        console.error('Failed to create hire agreement:', agreementError)
      }

      return { ok: true }
    }),

  getStatusByApplication: protectedProcedure
    .input(getStatusByApplicationInput)
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId)

      const successFee = await findLatestSuccessFee(ctx, {
        organizationId: input.organizationId,
        applicationId: input.applicationId,
        workerUserId: input.workerUserId,
      })

      if (!successFee) {
        return null
      }

      return {
        successFeeId: successFee.id,
        status: successFee.status,
        schedule: scheduleFromRecord(successFee),
        upfrontPaidAt: successFee.upfront_paid_at ?? null,
        upfrontPaymentIntentId: successFee.upfront_payment_intent_id,
        finalPaymentIntentId: successFee.final_payment_intent_id,
        createdAt: successFee.created_at,
      } satisfies SuccessFeeStatus
    }),

  adjustPaymentSchedule: protectedProcedure
    .input(adjustScheduleInput)
    .mutation(async ({ ctx, input }) => {
      const successFee = await getSuccessFee(ctx, input.successFeeId)

      const totalFeeCents = successFee.total_fee_cents
      const schedule = determinePaymentSchedule({
        totalFeeCents,
        jobDurationDays: input.newJobDurationDays,
        hireStartDate: successFee.hire_start_date,
      })

      const { error: updateError } = await ctx.supabaseAdmin
        .schema('core')
        .from('success_fees')
        .update({
          job_duration_days: input.newJobDurationDays,
          payment_schedule: schedule.paymentSchedule,
          upfront_percentage: schedule.upfrontPercentage,
          final_percentage: schedule.finalPercentage,
          upfront_amount_cents: schedule.upfrontAmountCents,
          final_amount_cents: schedule.finalAmountCents,
          final_payment_due_date: schedule.finalPaymentDueDate,
          duration_adjusted: true,
          original_schedule: successFee.payment_schedule,
          adjustment_notes: input.note ?? 'Schedule adjusted via API',
        })
        .eq('id', successFee.id)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to adjust schedule: ${updateError.message}`,
        })
      }

      return {
        successFeeId: successFee.id,
        schedule,
      }
    }),

  processFinalPayment: officeProcedure
    .input(processFinalPaymentInput)
    .mutation(async ({ ctx, input }) => {
      const successFee = await getSuccessFee(ctx, input.successFeeId)

      if (successFee.status !== 'upfront_paid') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Success fee must have an upfront payment completed before final charge.',
        })
      }

      if (successFee.final_amount_cents <= 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Final amount is zero; nothing to charge.',
        })
      }

      if (successFee.final_payment_intent_id) {
        return { paymentIntentId: successFee.final_payment_intent_id }
      }

      const stripe = await loadStripeClient(ctx)
      const intent = await stripe.paymentIntents.create({
        amount: successFee.final_amount_cents,
        currency: 'usd',
        metadata: {
          success_fee_id: successFee.id,
          organization_id: successFee.organization_id,
          stage: 'final',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      const { error: updateError } = await ctx.supabaseAdmin
        .schema('core')
        .from('success_fees')
        .update({
          final_payment_intent_id: intent.id,
        })
        .eq('id', successFee.id)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to store final payment intent: ${updateError.message}`,
        })
      }

      await recordTransaction(ctx, {
        organizationId: successFee.organization_id,
        userId: ctx.user?.id,
        amountCents: successFee.final_amount_cents,
        transactionType: 'success_fee_final',
        successFeeId: successFee.id,
        paymentIntentId: intent.id,
        metadata: {
          stage: 'final',
        },
      })

      return {
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
      }
    }),
})
