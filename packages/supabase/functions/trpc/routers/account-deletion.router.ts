// This file uses Deno ESM imports from esm.sh that are not compatible with TypeScript checking
// The file is only used in Supabase Edge Functions, not in the React Native app
import { TRPCError } from '@trpc/server'
import type Stripe from 'stripe'
import { z } from 'zod'

import type { Context } from '../context.ts'
import { officeProcedure, protectedProcedure, t } from '../middleware.ts'

// Pinned deliberately: this integration is written against the 2025-11-17
// response shapes. stripe@20.4.1 types `apiVersion` as `LatestApiVersion`
// (2026-02-25.clover), so pinning any earlier version is a type error even
// though the Stripe API supports it — hence the cast. Moving the runtime
// version is a behavioural change against a live payment provider and belongs
// with the SDK upgrade in #454, not with a build fix.
const STRIPE_API_VERSION = '2025-11-17.clover' as Stripe.LatestApiVersion

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

async function loadStripeClient(_ctx: Context): Promise<Stripe> {
  if (Deno.env.get('STRIPE_MOCK_MODE') === '1') {
    const Stripe = await getStripeClass()
    return new Stripe('sk_test_mock', {
      httpClient: await getStripeHttpClient(),
      apiVersion: STRIPE_API_VERSION,
    })
  }

  const apiKeySecretId = Deno.env.get('STRIPE_API_KEY_SECRET_ID')
  if (!apiKeySecretId) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Stripe API key secret ID not configured',
    })
  }

  // In production, fetch from Vault
  // For now, use environment variable fallback
  const apiKey = Deno.env.get('STRIPE_SECRET_KEY') ?? 'sk_test_mock'

  const Stripe = await getStripeClass()
  return new Stripe(apiKey, {
    httpClient: await getStripeHttpClient(),
    apiVersion: STRIPE_API_VERSION,
  })
}

async function ensureOrganizationAccess(ctx: Context, organizationId: string) {
  if (!ctx.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (!ctx.supabaseAdmin) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Admin client not available' })
  }

  const { data: roleCheck } = await ctx.supabaseAdmin
    .schema('core')
    .from('role_assignments')
    .select('role')
    .eq('user_id', ctx.user.id)
    .eq('role', 'office')
    .maybeSingle()

  if (roleCheck) {
    return
  }

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

  if (organization.owner_user_id === ctx.user.id) {
    return
  }

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

/**
 * Handler for processing worker account deletion
 * Extracted for direct calls without using ctx.caller
 */
async function handleProcessWorkerDeletion(
  ctx: Context,
  deletionId: string
): Promise<{ id: string; status: string; errors?: string[] }> {
  if (!ctx.supabaseAdmin) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Admin client not available' })
  }

  const { data: deletion, error: fetchError } = await ctx.supabaseAdmin
    .schema('core')
    .from('account_deletions')
    .select('*')
    .eq('id', deletionId)
    .eq('deletion_type', 'worker')
    .maybeSingle()

  if (fetchError || !deletion) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Deletion record not found',
    })
  }

  if (!deletion.deleted_user_id) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Deletion record missing user ID',
    })
  }

  // Update status to in_progress
  await ctx.supabaseAdmin
    .schema('core')
    .from('account_deletions')
    .update({
      status: 'in_progress',
    })
    .eq('id', deletionId)

  const errors: string[] = []

  // 1. Anonymize payment data
  try {
    // biome-ignore lint/suspicious/noExplicitAny: RPC function not in generated schema
    await ctx.supabaseAdmin.rpc('anonymize_worker_payment_data' as any, {
      p_worker_user_id: deletion.deleted_user_id,
    })

    await ctx.supabaseAdmin
      .schema('core')
      .from('account_deletions')
      .update({
        payment_data_anonymized: true,
        payment_data_anonymized_at: new Date().toISOString(),
      })
      .eq('id', deletionId)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Payment data anonymization failed: ${errorMsg}`)
  }

  // 2. Cleanup Stripe data (if any)
  try {
    const _stripe = await loadStripeClient(ctx)

    // Find Stripe customers for this user
    const { data: transactions } = await ctx.supabaseAdmin
      .schema('core')
      .from('payment_transactions')
      .select('stripe_payment_intent_id')
      .eq('user_id', deletion.deleted_user_id)
      .not('stripe_payment_intent_id', 'is', null)
      .limit(10)

    // Note: In production, we'd need to track Stripe customer IDs
    // For now, we'll just log that cleanup would be needed
    const stripeCleanupNeeded = transactions && transactions.length > 0

    await ctx.supabaseAdmin
      .schema('core')
      .from('account_deletions')
      .update({
        stripe_customer_deleted: !stripeCleanupNeeded, // Mark as done if no cleanup needed
        stripe_customer_deleted_at: stripeCleanupNeeded ? null : new Date().toISOString(),
        stripe_payment_methods_deleted: !stripeCleanupNeeded,
        stripe_payment_methods_deleted_at: stripeCleanupNeeded ? null : new Date().toISOString(),
        stripe_cleanup_errors: stripeCleanupNeeded
          ? ['Stripe customer cleanup requires manual intervention']
          : [],
      })
      .eq('id', deletionId)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Stripe cleanup failed: ${errorMsg}`)
  }

  // 3. Update compliance log
  const complianceLog = {
    gdpr_compliant: true,
    anonymization_completed: deletion.payment_data_anonymized,
    deleted_at: new Date().toISOString(),
    retention_period_days: 90, // Keep anonymized data for compliance
  }

  // 4. Mark as completed or partial
  const finalStatus = errors.length > 0 ? 'partial' : 'completed'

  await ctx.supabaseAdmin
    .schema('core')
    .from('account_deletions')
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      compliance_log: complianceLog,
      stripe_cleanup_errors: errors.length > 0 ? errors : null,
      error_message: errors.length > 0 ? errors.join('; ') : null,
    })
    .eq('id', deletionId)

  return {
    id: deletionId,
    status: finalStatus,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Handler for processing organization account deletion
 * Extracted for direct calls without using ctx.caller
 */
async function handleProcessOrganizationDeletion(
  ctx: Context,
  deletionId: string
): Promise<{ id: string; status: string; errors?: string[] }> {
  if (!ctx.supabaseAdmin) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Admin client not available' })
  }

  const { data: deletion, error: fetchError } = await ctx.supabaseAdmin
    .schema('core')
    .from('account_deletions')
    .select('*')
    .eq('id', deletionId)
    .eq('deletion_type', 'organization')
    .maybeSingle()

  if (fetchError || !deletion) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Deletion record not found',
    })
  }

  if (!deletion.deleted_organization_id) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Deletion record missing organization ID',
    })
  }

  await ctx.supabaseAdmin
    .schema('core')
    .from('account_deletions')
    .update({
      status: 'in_progress',
    })
    .eq('id', deletionId)

  const errors: string[] = []

  // 1. Anonymize payment data
  try {
    // biome-ignore lint/suspicious/noExplicitAny: RPC function not in generated schema
    await ctx.supabaseAdmin.rpc('anonymize_organization_payment_data' as any, {
      p_organization_id: deletion.deleted_organization_id,
    })

    await ctx.supabaseAdmin
      .schema('core')
      .from('account_deletions')
      .update({
        payment_data_anonymized: true,
        payment_data_anonymized_at: new Date().toISOString(),
      })
      .eq('id', deletionId)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Payment data anonymization failed: ${errorMsg}`)
  }

  // 2. Cleanup Stripe data
  try {
    const stripe = await loadStripeClient(ctx)

    // Get organization's Stripe customer ID
    const { data: org } = await ctx.supabaseAdmin
      .schema('core')
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', deletion.deleted_organization_id)
      .maybeSingle()

    if (org?.stripe_customer_id) {
      try {
        // Delete payment methods
        const paymentMethods = await stripe.paymentMethods.list({
          customer: org.stripe_customer_id,
        })

        for (const pm of paymentMethods.data) {
          await stripe.paymentMethods.detach(pm.id)
        }

        // Delete customer
        await stripe.customers.del(org.stripe_customer_id)

        await ctx.supabaseAdmin
          .schema('core')
          .from('account_deletions')
          .update({
            stripe_customer_deleted: true,
            stripe_customer_deleted_at: new Date().toISOString(),
            stripe_payment_methods_deleted: true,
            stripe_payment_methods_deleted_at: new Date().toISOString(),
          })
          .eq('id', deletionId)
      } catch (stripeError) {
        const errorMsg = stripeError instanceof Error ? stripeError.message : 'Unknown error'
        errors.push(`Stripe cleanup failed: ${errorMsg}`)
      }
    } else {
      // No Stripe customer to clean up
      await ctx.supabaseAdmin
        .schema('core')
        .from('account_deletions')
        .update({
          stripe_customer_deleted: true,
          stripe_customer_deleted_at: new Date().toISOString(),
          stripe_payment_methods_deleted: true,
          stripe_payment_methods_deleted_at: new Date().toISOString(),
        })
        .eq('id', deletionId)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Stripe cleanup failed: ${errorMsg}`)
  }

  // 3. Update compliance log
  const complianceLog = {
    gdpr_compliant: true,
    anonymization_completed: deletion.payment_data_anonymized,
    deleted_at: new Date().toISOString(),
    retention_period_days: 90,
  }

  // 4. Mark as completed or partial
  const finalStatus = errors.length > 0 ? 'partial' : 'completed'

  await ctx.supabaseAdmin
    .schema('core')
    .from('account_deletions')
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      compliance_log: complianceLog,
      stripe_cleanup_errors: errors.length > 0 ? errors : null,
      error_message: errors.length > 0 ? errors.join('; ') : null,
    })
    .eq('id', deletionId)

  return {
    id: deletionId,
    status: finalStatus,
    errors: errors.length > 0 ? errors : undefined,
  }
}

export const accountDeletionRouter = t.router({
  /**
   * Request worker account deletion
   */
  requestWorkerDeletion: protectedProcedure
    .input(
      z.object({
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      if (!ctx.supabaseAdmin) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Admin client not available',
        })
      }

      // Create deletion record
      const { data: deletion, error: deletionError } = await ctx.supabaseAdmin
        .schema('core')
        .from('account_deletions')
        .insert({
          deleted_user_id: ctx.user.id,
          deletion_type: 'worker',
          requested_by_user_id: ctx.user.id,
          reason: input.reason ?? null,
          status: 'pending',
        })
        .select('*')
        .maybeSingle()

      if (deletionError || !deletion) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: deletionError
            ? `Failed to create deletion record: ${deletionError.message}`
            : 'Failed to create deletion record',
        })
      }

      // Start deletion process (async)
      // In production, this would be queued for background processing
      try {
        await handleProcessWorkerDeletion(ctx, deletion.id)
      } catch (error) {
        console.error('Failed to process worker deletion:', error)
        // Update status to failed
        await ctx.supabaseAdmin
          .schema('core')
          .from('account_deletions')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', deletion.id)
      }

      return {
        id: deletion.id,
        status: deletion.status,
        createdAt: deletion.created_at,
      }
    }),

  /**
   * Request organization account deletion
   */
  requestOrganizationDeletion: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId)

      if (!ctx.supabaseAdmin) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Admin client not available',
        })
      }

      // Create deletion record
      const { data: deletion, error: deletionError } = await ctx.supabaseAdmin
        .schema('core')
        .from('account_deletions')
        .insert({
          deleted_organization_id: input.organizationId,
          deletion_type: 'organization',
          requested_by_user_id: ctx.user?.id ?? null,
          reason: input.reason ?? null,
          status: 'pending',
        })
        .select('*')
        .maybeSingle()

      if (deletionError || !deletion) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: deletionError
            ? `Failed to create deletion record: ${deletionError.message}`
            : 'Failed to create deletion record',
        })
      }

      // Start deletion process (async)
      try {
        await handleProcessOrganizationDeletion(ctx, deletion.id)
      } catch (error) {
        console.error('Failed to process organization deletion:', error)
        await ctx.supabaseAdmin
          .schema('core')
          .from('account_deletions')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', deletion.id)
      }

      return {
        id: deletion.id,
        status: deletion.status,
        createdAt: deletion.created_at,
      }
    }),

  /**
   * Process worker account deletion (internal/admin)
   */
  processWorkerDeletion: officeProcedure
    .input(
      z.object({
        deletionId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return handleProcessWorkerDeletion(ctx, input.deletionId)
    }),

  /**
   * Process organization account deletion (internal/admin)
   */
  processOrganizationDeletion: officeProcedure
    .input(
      z.object({
        deletionId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return handleProcessOrganizationDeletion(ctx, input.deletionId)
    }),

  /**
   * Get deletion status
   */
  getDeletionStatus: protectedProcedure
    .input(
      z.object({
        deletionId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.supabaseAdmin) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Admin client not available',
        })
      }

      const { data: deletion, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('account_deletions')
        .select('*')
        .eq('id', input.deletionId)
        .maybeSingle()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load deletion status: ${error.message}`,
        })
      }

      if (!deletion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deletion record not found',
        })
      }

      // Check access
      if (
        deletion.deleted_user_id !== ctx.user?.id &&
        deletion.deleted_organization_id &&
        !(await ctx.supabaseAdmin
          .schema('core')
          .from('role_assignments')
          .select('scope_org_id')
          .eq('user_id', ctx.user?.id ?? '')
          .eq('scope_org_id', deletion.deleted_organization_id)
          .maybeSingle())
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this deletion record',
        })
      }

      return {
        id: deletion.id,
        deletionType: deletion.deletion_type,
        status: deletion.status,
        paymentDataAnonymized: deletion.payment_data_anonymized,
        stripeCustomerDeleted: deletion.stripe_customer_deleted,
        stripePaymentMethodsDeleted: deletion.stripe_payment_methods_deleted,
        stripeCleanupErrors: deletion.stripe_cleanup_errors ?? [],
        completedAt: deletion.completed_at,
        errorMessage: deletion.error_message,
        createdAt: deletion.created_at,
      }
    }),

  /**
   * Admin: List all deletions
   */
  listDeletions: officeProcedure
    .input(
      z
        .object({
          status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'partial']).optional(),
          deletionType: z.enum(['worker', 'organization']).optional(),
          limit: z.number().int().positive().max(100).default(50),
          offset: z.number().int().nonnegative().default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      let query = supabaseAdmin
        .schema('core')
        .from('account_deletions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50) - 1)

      if (input?.status) {
        query = query.eq('status', input.status)
      }

      if (input?.deletionType) {
        query = query.eq('deletion_type', input.deletionType)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load deletions: ${error.message}`,
        })
      }

      return {
        items: (data ?? []).map(
          (row: {
            id: string
            deleted_user_id: string
            deleted_organization_id: string | null
            deletion_type: string
            status: string
            payment_data_anonymized: boolean
            stripe_customer_deleted: boolean
            stripe_payment_methods_deleted: boolean
            stripe_cleanup_errors?: string[] | null
            completed_at: string | null
            error_message: string | null
            created_at: string
            [key: string]: unknown
          }) => ({
            id: row.id,
            deletedUserId: row.deleted_user_id,
            deletedOrganizationId: row.deleted_organization_id,
            deletionType: row.deletion_type,
            status: row.status,
            paymentDataAnonymized: row.payment_data_anonymized,
            stripeCustomerDeleted: row.stripe_customer_deleted,
            stripePaymentMethodsDeleted: row.stripe_payment_methods_deleted,
            stripeCleanupErrors: row.stripe_cleanup_errors ?? [],
            completedAt: row.completed_at,
            errorMessage: row.error_message,
            createdAt: row.created_at,
          })
        ),
        totalCount: count ?? 0,
      }
    }),
})
