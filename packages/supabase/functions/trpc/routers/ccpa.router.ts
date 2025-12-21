/**
 * CCPA Compliance Router
 *
 * Provides tRPC endpoints for CCPA data subject rights:
 * - Data access requests (Right to Know)
 * - Data deletion requests (Right to Delete)
 * - Data correction requests (Right to Correct - CPRA)
 * - Opt-out management (Right to Opt-Out)
 * - Data portability (Right to Data Portability)
 *
 * Also includes admin endpoints for compliance management and
 * OAuth app endpoints for multi-app data coordination.
 */
import { TRPCError } from '@trpc/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { officeProcedure, protectedProcedure, publicProcedure, t } from '../middleware.ts';
import { supabaseServiceKey, supabaseUrl } from '../context.ts';
import { collectCoreUserData } from './ccpa/data-collector.ts';
import { getDeadlineMetrics as getDeadlineMetricsUtil } from './ccpa/deadline-tracker.ts';
import {
  approveRequestInputSchema,
  cancelRequestInputSchema,
  completeEnhancedVerificationInputSchema,
  completeManualVerificationInputSchema,
  confirmDeletionInputSchema,
  contributeExportDataInputSchema,
  denyRequestInputSchema,
  downloadExportInputSchema,
  extendDeadlineInputSchema,
  getMetricsInputSchema,
  getRequestStatusInputSchema,
  getVerificationStatusInputSchema,
  initiateVerificationInputSchema,
  listMyRequestsInputSchema,
  listRequestsInputSchema,
  optInInputSchema,
  optOutInputSchema,
  registerDataCategoryInputSchema,
  requestCorrectionInputSchema,
  requestDataAccessInputSchema,
  requestDeletionInputSchema,
  requestManualVerificationInputSchema,
  requestPortabilityInputSchema,
  resendVerificationInputSchema,
  verifyEmailOTPInputSchema,
} from './ccpa/schemas.ts';
import {
  completeEnhancedVerification,
  completeManualVerification,
  getVerificationStatus,
  initiateEmailVerification,
  initiateEnhancedVerification,
  requestManualVerification,
  resendVerificationCode,
  verifyEmailOTP,
} from './ccpa/identity-verification.ts';
import {
  getProcessingStatus,
  processRequest,
  retryProcessing,
} from './ccpa/request-processor.ts';
import {
  estimatePDFSize,
  generateCCPAPDF,
} from './ccpa/pdf-generator.ts';
import {
  cleanupExpiredExports,
  createExportDownload,
  getDownloadRecord,
  trackDownload,
  EXPORT_CONFIG,
} from './ccpa/export-storage.ts';
import {
  notifyRequestSubmitted,
  notifyVerificationRequired,
  notifyRequestCompleted,
  notifyOptOutConfirmed,
  notifyExportReady,
  sendDeadlineReminders,
  type CCPARequestInfo,
  type NotificationResult,
  CCPA_NOTIFICATION_TYPES,
} from './ccpa/notifications.ts';
import {
  GPC_CONFIG,
  processGPCSignal,
  getGPCStatus,
  getGPCDisclosureText,
  getDoNotSellPageStatus,
} from './ccpa/gpc.ts';

// All CCPA opt-out categories
const ALL_OPT_OUT_CATEGORIES = ['sale', 'sharing', 'targeted_advertising', 'profiling'] as const

/**
 * Create a service client for OAuth app endpoints that need admin access
 * These endpoints are called server-to-server and don't have user context
 */
function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Check if user has an active request of the same type
 * (prevents duplicate requests within 30 days)
 */
async function checkForActiveRequest(
  supabaseAdmin: { schema: (s: string) => { from: (t: string) => unknown } },
  userId: string,
  requestType: string
): Promise<boolean> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = (await (supabaseAdmin.schema('core').from('ccpa_requests') as unknown as {
    select: (s: string) => {
      eq: (c: string, v: string) => {
        eq: (c: string, v: string) => {
          in: (c: string, v: string[]) => {
            gte: (c: string, v: string) => {
              maybeSingle: () => Promise<{ data: unknown }>
            }
          }
        }
      }
    }
  })
    .select('id')
    .eq('user_id', userId)
    .eq('request_type', requestType)
    .in('status', ['pending', 'in_progress'])
    .gte('submitted_at', thirtyDaysAgo.toISOString())
    .maybeSingle()) as { data: unknown }

  return Boolean(data)
}

export const ccpaRouter = t.router({
  // ========================================================
  // USER ENDPOINTS
  // ========================================================

  /**
   * Request data access (Right to Know)
   * Creates a new CCPA data access request with 45-day deadline
   */
  requestDataAccess: protectedProcedure
    .input(requestDataAccessInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check for duplicate active requests
      const hasActiveRequest = await checkForActiveRequest(
        ctx.supabase,
        ctx.user.id,
        'access'
      )

      if (hasActiveRequest) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have an active data access request. Please wait for it to complete or cancel it before submitting a new one.',
        })
      }

      // Insert new request (deadline is auto-calculated by trigger)
      const { data: request, error } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .insert({
          user_id: ctx.user.id,
          request_type: 'access',
          status: 'pending',
          verification_method: 'email',
          metadata: input.metadata ?? {},
        })
        .select('id, deadline_at, status, submitted_at')
        .single()

      if (error || !request) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message ?? 'Failed to create data access request',
        })
      }

      return {
        id: request.id,
        status: request.status,
        deadlineAt: request.deadline_at,
        submittedAt: request.submitted_at,
        message: 'Your data access request has been submitted. You will receive a verification email shortly.',
      }
    }),

  /**
   * Request data deletion (Right to Delete)
   * Requires enhanced verification for security
   */
  requestDeletion: protectedProcedure
    .input(requestDeletionInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const hasActiveRequest = await checkForActiveRequest(
        ctx.supabase,
        ctx.user.id,
        'deletion'
      )

      if (hasActiveRequest) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have an active deletion request. Please wait for it to complete or cancel it before submitting a new one.',
        })
      }

      const { data: request, error } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .insert({
          user_id: ctx.user.id,
          request_type: 'deletion',
          status: 'pending',
          verification_method: 'enhanced', // Deletion requires enhanced verification
          metadata: {
            reason: input.reason,
            ...input.metadata,
          },
        })
        .select('id, deadline_at, status, submitted_at')
        .single()

      if (error || !request) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message ?? 'Failed to create deletion request',
        })
      }

      return {
        id: request.id,
        status: request.status,
        deadlineAt: request.deadline_at,
        submittedAt: request.submitted_at,
        message: 'Your deletion request has been submitted. You will need to complete enhanced verification to proceed.',
      }
    }),

  /**
   * Request data correction (Right to Correct - CPRA)
   */
  requestCorrection: protectedProcedure
    .input(requestCorrectionInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const hasActiveRequest = await checkForActiveRequest(
        ctx.supabase,
        ctx.user.id,
        'correction'
      )

      if (hasActiveRequest) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have an active correction request.',
        })
      }

      const { data: request, error } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .insert({
          user_id: ctx.user.id,
          request_type: 'correction',
          status: 'pending',
          verification_method: 'email',
          metadata: {
            correctionDetails: input.correctionDetails,
            ...input.metadata,
          },
        })
        .select('id, deadline_at, status, submitted_at')
        .single()

      if (error || !request) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message ?? 'Failed to create correction request',
        })
      }

      return {
        id: request.id,
        status: request.status,
        deadlineAt: request.deadline_at,
        submittedAt: request.submitted_at,
        message: 'Your correction request has been submitted.',
      }
    }),

  /**
   * Request data portability
   */
  requestPortability: protectedProcedure
    .input(requestPortabilityInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const hasActiveRequest = await checkForActiveRequest(
        ctx.supabase,
        ctx.user.id,
        'portability'
      )

      if (hasActiveRequest) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have an active portability request.',
        })
      }

      const { data: request, error } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .insert({
          user_id: ctx.user.id,
          request_type: 'portability',
          status: 'pending',
          verification_method: 'email',
          metadata: {
            format: input.format,
            ...input.metadata,
          },
        })
        .select('id, deadline_at, status, submitted_at')
        .single()

      if (error || !request) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message ?? 'Failed to create portability request',
        })
      }

      return {
        id: request.id,
        status: request.status,
        deadlineAt: request.deadline_at,
        submittedAt: request.submitted_at,
        format: input.format,
        message: 'Your data portability request has been submitted.',
      }
    }),

  /**
   * Get request status
   */
  getRequestStatus: protectedProcedure
    .input(getRequestStatusInputSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { data: request, error } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('*')
        .eq('id', input.requestId)
        .single()

      if (error || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      // Verify ownership or admin access
      if (request.user_id !== ctx.user.id) {
        // Check for admin role
        const { data: adminCheck } = await ctx.supabase
          .schema('core')
          .from('role_assignments')
          .select('role_id')
          .eq('user_id', ctx.user.id)
          .maybeSingle()

        if (!adminCheck) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this request',
          })
        }
      }

      // Calculate days remaining
      const deadlineDate = request.extended_deadline_at ?? request.deadline_at
      const daysRemaining = Math.ceil(
        (new Date(deadlineDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: request.id,
        requestType: request.request_type,
        status: request.status,
        submittedAt: request.submitted_at,
        deadlineAt: request.deadline_at,
        extendedDeadlineAt: request.extended_deadline_at,
        completedAt: request.completed_at,
        denialReason: request.denial_reason,
        verificationMethod: request.verification_method,
        verificationCompletedAt: request.verification_completed_at,
        daysRemaining: Math.max(0, daysRemaining),
        isOverdue: daysRemaining < 0,
        metadata: request.metadata,
      }
    }),

  /**
   * Cancel a pending request
   */
  cancelRequest: protectedProcedure
    .input(cancelRequestInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { data: request, error: fetchError } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('id, user_id, status')
        .eq('id', input.requestId)
        .single()

      if (fetchError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      if (request.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to cancel this request',
        })
      }

      if (!['pending', 'in_progress'].includes(request.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot cancel a request with status '${request.status}'`,
        })
      }

      const { error: updateError } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .update({
          status: 'cancelled',
          metadata: {
            cancellation_reason: input.reason,
            cancelled_at: new Date().toISOString(),
          },
        })
        .eq('id', input.requestId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel request',
        })
      }

      return {
        id: input.requestId,
        status: 'cancelled',
        message: 'Your request has been cancelled.',
      }
    }),

  /**
   * List user's own requests
   */
  listMyRequests: protectedProcedure
    .input(listMyRequestsInputSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      let query = ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('*', { count: 'exact' })
        .eq('user_id', ctx.user.id)
        .order('submitted_at', { ascending: false })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 20) - 1)

      if (input?.status) {
        query = query.eq('status', input.status)
      }

      if (input?.requestType) {
        query = query.eq('request_type', input.requestType)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load requests',
        })
      }

      return {
        items: (data ?? []).map((row: Record<string, unknown>) => ({
          id: row.id,
          requestType: row.request_type,
          status: row.status,
          submittedAt: row.submitted_at,
          deadlineAt: row.deadline_at,
          extendedDeadlineAt: row.extended_deadline_at,
          completedAt: row.completed_at,
        })),
        totalCount: count ?? 0,
      }
    }),

  // ========================================================
  // OPT-OUT ENDPOINTS
  // ========================================================

  /**
   * Opt out of data processing categories
   */
  optOut: protectedProcedure
    .input(optOutInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const categories = input.categories === 'all'
        ? ALL_OPT_OUT_CATEGORIES
        : input.categories

      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      }

      const insertData = categories.map((category) => ({
        user_id: ctx.user.id,
        category,
        source: 'user_request' as const,
        metadata: {},
      }))

      // Use upsert to handle existing opt-outs
      const { error } = await ctx.supabase
        .schema('core')
        .from('ccpa_opt_outs')
        .upsert(insertData, {
          onConflict: 'user_id,category',
          ignoreDuplicates: true,
        })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process opt-out request',
        })
      }

      return {
        categories: [...categories],
        message: `You have opted out of ${categories.length === 4 ? 'all' : categories.join(', ')} data processing.`,
      }
    }),

  /**
   * Opt back into data processing categories
   */
  optIn: protectedProcedure
    .input(optInInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { error } = await ctx.supabase
        .schema('core')
        .from('ccpa_opt_outs')
        .delete()
        .eq('user_id', ctx.user.id)
        .in('category', input.categories)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process opt-in request',
        })
      }

      return {
        categories: input.categories,
        message: `You have opted back into ${input.categories.join(', ')} data processing.`,
      }
    }),

  /**
   * Get current opt-out status
   */
  getOptOutStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { data, error } = await ctx.supabase
      .schema('core')
      .from('ccpa_opt_outs')
      .select('category, opted_out_at, source')
      .eq('user_id', ctx.user.id)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to load opt-out status',
      })
    }

    const optOuts = data ?? []
    const optOutMap = new Map(optOuts.map((o: Record<string, unknown>) => [o.category, o]))

    return {
      sale: {
        optedOut: optOutMap.has('sale'),
        optedOutAt: optOutMap.get('sale')?.opted_out_at ?? null,
        source: optOutMap.get('sale')?.source ?? null,
      },
      sharing: {
        optedOut: optOutMap.has('sharing'),
        optedOutAt: optOutMap.get('sharing')?.opted_out_at ?? null,
        source: optOutMap.get('sharing')?.source ?? null,
      },
      targeted_advertising: {
        optedOut: optOutMap.has('targeted_advertising'),
        optedOutAt: optOutMap.get('targeted_advertising')?.opted_out_at ?? null,
        source: optOutMap.get('targeted_advertising')?.source ?? null,
      },
      profiling: {
        optedOut: optOutMap.has('profiling'),
        optedOutAt: optOutMap.get('profiling')?.opted_out_at ?? null,
        source: optOutMap.get('profiling')?.source ?? null,
      },
      allOptedOut: optOuts.length === 4,
    }
  }),

  // ========================================================
  // VERIFICATION ENDPOINTS
  // ========================================================

  /**
   * Initiate email verification for a CCPA request
   */
  initiateVerification: protectedProcedure
    .input(initiateVerificationInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Get request and verify ownership
      const { data: request, error: fetchError } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('id, user_id, verification_method, verification_completed_at')
        .eq('id', input.requestId)
        .single()

      if (fetchError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      if (request.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to verify this request',
        })
      }

      if (request.verification_completed_at) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Verification already completed',
        })
      }

      // Get user email from context (already authenticated)
      const userEmail = ctx.user.email

      if (!userEmail) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Could not retrieve user email',
        })
      }

      // Initiate based on verification method
      if (request.verification_method === 'enhanced') {
        const result = await initiateEnhancedVerification(
          ctx.supabase,
          input.requestId,
          ctx.user.id
        )

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error ?? 'Failed to initiate enhanced verification',
          })
        }

        return {
          method: 'enhanced',
          token: result.token,
          expiresAt: result.expiresAt.toISOString(),
          message: 'Enhanced verification initiated. Use the token to complete verification.',
        }
      }

      // Default to email verification
      const result = await initiateEmailVerification(
        ctx.supabase,
        input.requestId,
        userEmail
      )

      if (!result.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error ?? 'Failed to initiate verification',
        })
      }

      return {
        method: 'email',
        expiresAt: result.expiresAt.toISOString(),
        message: 'Verification code sent to your email address.',
      }
    }),

  /**
   * Verify email OTP code
   */
  verifyEmailOTP: protectedProcedure
    .input(verifyEmailOTPInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Verify ownership
      const { data: request } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('user_id')
        .eq('id', input.requestId)
        .single()

      if (!request || request.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to verify this request',
        })
      }

      const result = await verifyEmailOTP(ctx.supabase, input.requestId, input.code)

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error ?? 'Verification failed',
        })
      }

      return {
        verified: true,
        message: 'Email verification completed successfully.',
      }
    }),

  /**
   * Complete enhanced verification with token
   */
  completeEnhancedVerification: protectedProcedure
    .input(completeEnhancedVerificationInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Verify ownership
      const { data: request } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('user_id')
        .eq('id', input.requestId)
        .single()

      if (!request || request.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to verify this request',
        })
      }

      const result = await completeEnhancedVerification(
        ctx.supabase,
        input.requestId,
        input.token
      )

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error ?? 'Enhanced verification failed',
        })
      }

      return {
        verified: true,
        message: 'Enhanced verification completed successfully.',
      }
    }),

  /**
   * Resend verification code
   */
  resendVerification: protectedProcedure
    .input(resendVerificationInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Verify ownership
      const { data: request } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('user_id')
        .eq('id', input.requestId)
        .single()

      if (!request || request.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to resend verification for this request',
        })
      }

      // Get user email from context (already authenticated)
      const userEmail = ctx.user.email

      if (!userEmail) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Could not retrieve user email',
        })
      }

      const result = await resendVerificationCode(
        ctx.supabase,
        input.requestId,
        userEmail
      )

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error ?? 'Failed to resend verification code',
        })
      }

      return {
        expiresAt: result.expiresAt?.toISOString(),
        message: 'New verification code sent to your email address.',
      }
    }),

  /**
   * Get verification status for a request
   */
  getVerificationStatus: protectedProcedure
    .input(getVerificationStatusInputSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Verify ownership or admin
      const { data: request } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('user_id')
        .eq('id', input.requestId)
        .single()

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      if (request.user_id !== ctx.user.id) {
        // Check for admin role
        const { data: adminCheck } = await ctx.supabase
          .schema('core')
          .from('role_assignments')
          .select('role_id')
          .eq('user_id', ctx.user.id)
          .maybeSingle()

        if (!adminCheck) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this verification status',
          })
        }
      }

      const status = await getVerificationStatus(ctx.supabase, input.requestId)

      if (!status) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve verification status',
        })
      }

      return {
        method: status.method,
        status: status.status,
        completedAt: status.completedAt?.toISOString() ?? null,
        attemptsRemaining: status.attemptsRemaining,
        expiresAt: status.expiresAt?.toISOString(),
      }
    }),

  /**
   * Request manual verification
   */
  requestManualVerification: protectedProcedure
    .input(requestManualVerificationInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Verify ownership
      const { data: request } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('user_id')
        .eq('id', input.requestId)
        .single()

      if (!request || request.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to request manual verification',
        })
      }

      // Get compliance admin ID from environment
      const complianceAdminId = Deno.env.get('CCPA_COMPLIANCE_ADMIN_ID')

      const result = await requestManualVerification(
        ctx.supabase,
        input.requestId,
        input.reason,
        complianceAdminId
      )

      if (!result.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error ?? 'Failed to request manual verification',
        })
      }

      return {
        message: 'Manual verification has been requested. An admin will review your request.',
      }
    }),

  /**
   * Complete manual verification (admin only)
   */
  completeManualVerification: officeProcedure
    .input(completeManualVerificationInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const result = await completeManualVerification(
        ctx.supabaseAdmin,
        input.requestId,
        ctx.user.id,
        input.approved,
        input.notes
      )

      if (!result.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error ?? 'Failed to complete manual verification',
        })
      }

      return {
        approved: input.approved,
        message: input.approved
          ? 'Manual verification approved successfully.'
          : 'Manual verification denied.',
      }
    }),

  // ========================================================
  // OAUTH APP ENDPOINTS
  // ========================================================

  /**
   * Register an OAuth app's data categories
   * Called by OAuth apps to register for CCPA compliance
   */
  registerDataCategory: publicProcedure
    .input(registerDataCategoryInputSchema)
    .mutation(async ({ input }) => {
      const serviceClient = createServiceClient()
      const { error } = await serviceClient
        .schema('core')
        .from('ccpa_oauth_app_registry')
        .upsert({
          app_id: input.appId,
          app_name: input.appName,
          data_categories: input.dataCategories,
          webhook_url: input.webhookUrl,
          webhook_secret: input.webhookSecret,
          registered_at: new Date().toISOString(),
          last_verified_at: new Date().toISOString(),
          is_active: true,
        }, {
          onConflict: 'app_id',
        })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to register OAuth app',
        })
      }

      return {
        appId: input.appId,
        registered: true,
        message: 'OAuth app registered for CCPA compliance.',
      }
    }),

  /**
   * Contribute export data from an OAuth app
   */
  contributeExportData: publicProcedure
    .input(contributeExportDataInputSchema)
    .mutation(async ({ input }) => {
      const serviceClient = createServiceClient()
      // Verify the request exists and is in progress
      const { data: request, error: fetchError } = await serviceClient
        .schema('core')
        .from('ccpa_requests')
        .select('id, status')
        .eq('id', input.requestId)
        .single()

      if (fetchError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'CCPA request not found',
        })
      }

      if (request.status !== 'in_progress') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot contribute data to a request with status '${request.status}'`,
        })
      }

      // Store the contributed data in metadata
      // In production, this would be stored in a separate table or S3
      const { error: updateError } = await serviceClient
        .schema('core')
        .from('ccpa_requests')
        .update({
          metadata: {
            oauth_app_contributions: {
              [input.appId]: {
                contributed_at: new Date().toISOString(),
                categories: input.categories,
                data_size: JSON.stringify(input.data).length,
              },
            },
          },
        })
        .eq('id', input.requestId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record data contribution',
        })
      }

      return {
        requestId: input.requestId,
        appId: input.appId,
        recorded: true,
      }
    }),

  /**
   * Confirm deletion completion from an OAuth app
   */
  confirmDeletion: publicProcedure
    .input(confirmDeletionInputSchema)
    .mutation(async ({ input }) => {
      const serviceClient = createServiceClient()
      const { data: request, error: fetchError } = await serviceClient
        .schema('core')
        .from('ccpa_requests')
        .select('id, status, request_type, metadata')
        .eq('id', input.requestId)
        .single()

      if (fetchError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'CCPA request not found',
        })
      }

      if (request.request_type !== 'deletion') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This is not a deletion request',
        })
      }

      // Record the deletion confirmation
      const existingMetadata = (request.metadata as Record<string, unknown>) ?? {}
      const oauthConfirmations = (existingMetadata.oauth_deletion_confirmations as Record<string, unknown>) ?? {}

      const { error: updateError } = await serviceClient
        .schema('core')
        .from('ccpa_requests')
        .update({
          metadata: {
            ...existingMetadata,
            oauth_deletion_confirmations: {
              ...oauthConfirmations,
              [input.appId]: {
                confirmed_at: new Date().toISOString(),
                deleted_categories: input.deletedCategories,
                anonymized_categories: input.anonymizedCategories ?? [],
                retention_reason: input.retentionReason,
              },
            },
          },
        })
        .eq('id', input.requestId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record deletion confirmation',
        })
      }

      return {
        requestId: input.requestId,
        appId: input.appId,
        confirmed: true,
      }
    }),

  // ========================================================
  // ADMIN ENDPOINTS
  // ========================================================

  /**
   * List all CCPA requests (admin only)
   */
  listRequests: officeProcedure
    .input(listRequestsInputSchema)
    .query(async ({ ctx, input }) => {
      let query = ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select(`
          *,
          user:auth.users!ccpa_requests_user_id_fkey(email)
        `, { count: 'exact' })
        .order(input?.sortBy ?? 'deadline_at', { ascending: input?.sortOrder === 'asc' })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50) - 1)

      if (input?.status) {
        query = query.eq('status', input.status)
      }

      if (input?.requestType) {
        query = query.eq('request_type', input.requestType)
      }

      if (input?.userId) {
        query = query.eq('user_id', input.userId)
      }

      if (input?.overdueOnly) {
        query = query.lt('deadline_at', new Date().toISOString())
          .in('status', ['pending', 'in_progress'])
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load requests',
        })
      }

      return {
        items: (data ?? []).map((row: Record<string, unknown>) => {
          const deadline = (row.extended_deadline_at ?? row.deadline_at) as string
          const daysRemaining = Math.ceil(
            (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )

          return {
            id: row.id,
            userId: row.user_id,
            userEmail: (row.user as Record<string, unknown>)?.email,
            requestType: row.request_type,
            status: row.status,
            submittedAt: row.submitted_at,
            deadlineAt: row.deadline_at,
            extendedDeadlineAt: row.extended_deadline_at,
            completedAt: row.completed_at,
            denialReason: row.denial_reason,
            daysRemaining: Math.max(0, daysRemaining),
            isOverdue: daysRemaining < 0,
          }
        }),
        totalCount: count ?? 0,
      }
    }),

  /**
   * Approve a pending request (move to in_progress)
   */
  approveRequest: officeProcedure
    .input(approveRequestInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: request, error: fetchError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('id, status')
        .eq('id', input.requestId)
        .single()

      if (fetchError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot approve a request with status '${request.status}'`,
        })
      }

      const { error: updateError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .update({ status: 'in_progress' })
        .eq('id', input.requestId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve request',
        })
      }

      // Record in history
      await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_request_history')
        .insert({
          request_id: input.requestId,
          status: 'in_progress',
          changed_by: ctx.user?.id,
          notes: input.notes ?? 'Request approved and moved to in_progress',
        })

      return {
        id: input.requestId,
        status: 'in_progress',
        message: 'Request has been approved and is now in progress.',
      }
    }),

  /**
   * Deny a request
   */
  denyRequest: officeProcedure
    .input(denyRequestInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: request, error: fetchError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('id, status')
        .eq('id', input.requestId)
        .single()

      if (fetchError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      if (!['pending', 'in_progress'].includes(request.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot deny a request with status '${request.status}'`,
        })
      }

      const { error: updateError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .update({
          status: 'denied',
          denial_reason: input.reason,
          completed_at: new Date().toISOString(),
        })
        .eq('id', input.requestId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to deny request',
        })
      }

      // Record in history
      await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_request_history')
        .insert({
          request_id: input.requestId,
          status: 'denied',
          changed_by: ctx.user?.id,
          notes: input.reason,
        })

      return {
        id: input.requestId,
        status: 'denied',
        message: 'Request has been denied.',
      }
    }),

  /**
   * Extend a request deadline by 45 days
   */
  extendDeadline: officeProcedure
    .input(extendDeadlineInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: request, error: fetchError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('id, status, deadline_at, extended_deadline_at')
        .eq('id', input.requestId)
        .single()

      if (fetchError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      if (request.extended_deadline_at) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This request has already been extended. CCPA only allows one 45-day extension.',
        })
      }

      if (!['pending', 'in_progress'].includes(request.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot extend deadline for a request with status '${request.status}'`,
        })
      }

      // Calculate new deadline (45 days from current deadline)
      const currentDeadline = new Date(request.deadline_at)
      const newDeadline = new Date(currentDeadline.getTime() + 45 * 24 * 60 * 60 * 1000)

      const { error: updateError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .update({
          extended_deadline_at: newDeadline.toISOString(),
        })
        .eq('id', input.requestId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to extend deadline',
        })
      }

      // Record in history
      await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_request_history')
        .insert({
          request_id: input.requestId,
          status: request.status,
          changed_by: ctx.user?.id,
          notes: `Deadline extended by 45 days. Reason: ${input.reason}`,
          metadata: {
            action: 'deadline_extension',
            reason: input.reason,
            new_deadline: newDeadline.toISOString(),
          },
        })

      return {
        id: input.requestId,
        newDeadline: newDeadline.toISOString(),
        message: 'Deadline has been extended by 45 days.',
      }
    }),

  /**
   * Get CCPA compliance metrics
   */
  getMetrics: officeProcedure
    .input(getMetricsInputSchema)
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 30
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get all requests in the period
      const { data: requests, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('*')
        .gte('submitted_at', startDate.toISOString())

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load metrics',
        })
      }

      const allRequests = requests ?? []

      // Calculate metrics
      const totalRequests = allRequests.length
      const completedRequests = allRequests.filter((r: Record<string, unknown>) => r.status === 'completed')
      const deniedRequests = allRequests.filter((r: Record<string, unknown>) => r.status === 'denied')
      const overdueRequests = allRequests.filter((r: Record<string, unknown>) => {
        if (!['pending', 'in_progress'].includes(r.status as string)) return false
        const deadline = (r.extended_deadline_at ?? r.deadline_at) as string
        return new Date(deadline) < new Date()
      })

      // Calculate average response time (for completed requests)
      let avgResponseDays = 0
      if (completedRequests.length > 0) {
        const totalDays = completedRequests.reduce((sum: number, r: Record<string, unknown>) => {
          const submitted = new Date(r.submitted_at as string)
          const completed = new Date(r.completed_at as string)
          return sum + (completed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
        }, 0)
        avgResponseDays = Math.round(totalDays / completedRequests.length)
      }

      // Breakdown by request type
      const byType = {
        access: allRequests.filter((r: Record<string, unknown>) => r.request_type === 'access').length,
        deletion: allRequests.filter((r: Record<string, unknown>) => r.request_type === 'deletion').length,
        correction: allRequests.filter((r: Record<string, unknown>) => r.request_type === 'correction').length,
        portability: allRequests.filter((r: Record<string, unknown>) => r.request_type === 'portability').length,
        opt_out: allRequests.filter((r: Record<string, unknown>) => r.request_type === 'opt_out').length,
        opt_in: allRequests.filter((r: Record<string, unknown>) => r.request_type === 'opt_in').length,
      }

      return {
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        totalRequests,
        completedRequests: completedRequests.length,
        pendingRequests: allRequests.filter((r: Record<string, unknown>) => r.status === 'pending').length,
        inProgressRequests: allRequests.filter((r: Record<string, unknown>) => r.status === 'in_progress').length,
        deniedRequests: deniedRequests.length,
        cancelledRequests: allRequests.filter((r: Record<string, unknown>) => r.status === 'cancelled').length,
        overdueRequests: overdueRequests.length,
        avgResponseDays,
        denialRate: totalRequests > 0 ? Math.round((deniedRequests.length / totalRequests) * 100) : 0,
        byType,
      }
    }),

  /**
   * Get deadline-specific metrics for compliance dashboard
   * Shows requests by deadline status (on-time, at-risk, overdue)
   */
  getDeadlineMetrics: officeProcedure
    .query(async ({ ctx }) => {
      const metrics = await getDeadlineMetricsUtil(ctx.supabaseAdmin)
      return metrics
    }),

  // ========================================================
  // REQUEST PROCESSING ENDPOINTS
  // ========================================================

  /**
   * Process a CCPA request (admin action)
   * Triggers the full processing pipeline: data collection, OAuth app notification,
   * aggregation, and export generation.
   */
  processRequest: officeProcedure
    .input(z.object({
      requestId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify request exists
      const { data: request, error: requestError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('id, status, request_type, identity_verified')
        .eq('id', input.requestId)
        .single()

      if (requestError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'CCPA request not found',
        })
      }

      // Verify identity is verified before processing
      if (!request.identity_verified) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Identity must be verified before processing this request',
        })
      }

      // Only process pending or in_progress requests
      if (!['pending', 'in_progress'].includes(request.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot process request with status '${request.status}'`,
        })
      }

      // Process the request
      const result = await processRequest(
        ctx.supabase,
        ctx.supabaseAdmin,
        input.requestId,
        ctx.user?.id
      )

      return result
    }),

  /**
   * Get processing status for a CCPA request
   * Returns detailed status of the processing pipeline.
   */
  getProcessingStatus: officeProcedure
    .input(z.object({
      requestId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const status = await getProcessingStatus(ctx.supabaseAdmin, input.requestId)
      return status
    }),

  /**
   * Retry processing for a failed CCPA request
   * Allows admin to retry processing after fixing issues.
   */
  retryProcessing: officeProcedure
    .input(z.object({
      requestId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify request exists and is in failed state
      const { data: request, error: requestError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('id, status')
        .eq('id', input.requestId)
        .single()

      if (requestError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'CCPA request not found',
        })
      }

      // Only allow retry for failed or in_progress requests
      if (!['in_progress'].includes(request.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot retry request with status '${request.status}'. Only in_progress requests can be retried.`,
        })
      }

      // Retry processing
      const result = await retryProcessing(
        ctx.supabase,
        ctx.supabaseAdmin,
        input.requestId,
        ctx.user?.id
      )

      return result
    }),

  // ========================================================
  // PDF GENERATION ENDPOINTS
  // ========================================================

  /**
   * Generate PDF export for a completed request
   * Returns the PDF as base64 encoded data
   */
  generatePDF: officeProcedure
    .input(z.object({
      requestId: z.string().uuid(),
      includeQRCode: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the request and verify it's ready for PDF generation
      const { data: request, error: requestError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('id, user_id, request_type, status, metadata')
        .eq('id', input.requestId)
        .single()

      if (requestError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'CCPA request not found',
        })
      }

      // Check if request has export data
      const metadata = request.metadata as Record<string, unknown>
      const exportData = metadata?.export_data as Record<string, unknown> | undefined

      if (!exportData) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Request has not been processed yet. Run processRequest first.',
        })
      }

      // Generate the PDF
      const pdfResult = await generateCCPAPDF(
        exportData as unknown as Parameters<typeof generateCCPAPDF>[0],
        {
          requestId: input.requestId,
          requestType: request.request_type as 'access' | 'deletion' | 'correction' | 'portability',
          includeQRCode: input.includeQRCode,
          baseUrl: 'https://scaffald.com',
        }
      )

      if (!pdfResult.success || !pdfResult.pdfBytes) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `PDF generation failed: ${pdfResult.error}`,
        })
      }

      // Convert to base64 for transmission
      const base64PDF = btoa(String.fromCharCode(...pdfResult.pdfBytes))

      return {
        success: true,
        fileName: pdfResult.fileName,
        sizeBytes: pdfResult.sizeBytes,
        pageCount: pdfResult.pageCount,
        generatedAt: pdfResult.generatedAt,
        pdfBase64: base64PDF,
        mimeType: 'application/pdf',
      }
    }),

  /**
   * Estimate PDF size for a request before generation
   * Useful for showing users expected download size
   */
  estimatePDFSize: officeProcedure
    .input(z.object({
      requestId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Get the request and its export data
      const { data: request, error: requestError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('id, metadata')
        .eq('id', input.requestId)
        .single()

      if (requestError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'CCPA request not found',
        })
      }

      const metadata = request.metadata as Record<string, unknown>
      const exportData = metadata?.export_data as Record<string, unknown> | undefined

      if (!exportData) {
        return {
          available: false,
          message: 'Request has not been processed yet',
        }
      }

      const estimate = estimatePDFSize(
        exportData as unknown as Parameters<typeof estimatePDFSize>[0]
      )

      return {
        available: true,
        estimatedBytes: estimate.estimatedBytes,
        estimatedPages: estimate.estimatedPages,
        category: estimate.category,
        humanReadableSize:
          estimate.estimatedBytes < 1024 * 1024
            ? `${(estimate.estimatedBytes / 1024).toFixed(1)} KB`
            : `${(estimate.estimatedBytes / (1024 * 1024)).toFixed(1)} MB`,
      }
    }),

  // ========================================================
  // DOWNLOAD ENDPOINT
  // ========================================================

  /**
   * Get download URL for a completed export
   */
  downloadExport: protectedProcedure
    .input(downloadExportInputSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check request ownership
      const { data: request, error: requestError } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('user_id, status, request_type')
        .eq('id', input.requestId)
        .single()

      if (requestError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      if (request.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to download this export',
        })
      }

      if (request.status !== 'completed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Export is not yet available. Request status: ${request.status}`,
        })
      }

      // Get the download record
      const { data: download, error: downloadError } = await ctx.supabase
        .schema('core')
        .from('ccpa_export_downloads')
        .select('*')
        .eq('request_id', input.requestId)
        .single()

      if (downloadError || !download) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export file not found. It may have expired.',
        })
      }

      // Check expiry
      if (new Date(download.expires_at) < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This export has expired. Please submit a new request.',
        })
      }

      // Check download limit
      if (download.download_count >= download.max_downloads) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Maximum download limit reached. Please submit a new request.',
        })
      }

      // Increment download count
      await ctx.supabase
        .schema('core')
        .from('ccpa_export_downloads')
        .update({
          download_count: download.download_count + 1,
          last_downloaded_at: new Date().toISOString(),
          first_downloaded_at: download.first_downloaded_at ?? new Date().toISOString(),
        })
        .eq('id', download.id)

      // In production, this would generate a fresh signed S3 URL
      // For now, return the stored URL
      return {
        downloadUrl: download.signed_url,
        expiresAt: download.expires_at,
        downloadCount: download.download_count + 1,
        maxDownloads: download.max_downloads,
        fileFormat: download.file_format,
        fileSizeBytes: download.file_size_bytes,
      }
    }),

  // ========================================================
  // INTERNAL DATA COLLECTION ENDPOINT
  // ========================================================

  /**
   * Collect all user data for export (internal use by export pipeline)
   * This endpoint is used by the export processing pipeline to gather
   * all user data from the Scaffald platform.
   */
  collectUserData: officeProcedure
    .input(z.object({
      userId: z.string().uuid(),
      requestId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify the request exists and is for this user
      const { data: request, error: requestError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('id, user_id, request_type, status')
        .eq('id', input.requestId)
        .single()

      if (requestError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'CCPA request not found',
        })
      }

      if (request.user_id !== input.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Request user ID does not match provided user ID',
        })
      }

      if (!['pending', 'in_progress'].includes(request.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot collect data for request with status '${request.status}'`,
        })
      }

      // Collect all user data using the data collector
      const result = await collectCoreUserData(
        ctx.supabase,
        input.userId,
        ctx.supabaseAdmin
      )

      if (!result.success) {
        console.warn('CCPA data collection had errors:', result.errors)
      }

      return {
        success: result.success,
        data: result.data,
        errors: result.errors,
        requestId: input.requestId,
        requestType: request.request_type,
      }
    }),

  /**
   * Get data summary for a user (for privacy dashboard display)
   * Returns high-level summary of what data we have about the user
   */
  getDataSummary: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Collect data to generate summary
      const result = await collectCoreUserData(
        ctx.supabase,
        ctx.user.id
      )

      if (!result.data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to collect data summary',
        })
      }

      const data = result.data

      // Return summary counts by category
      return {
        categories: {
          personalInformation: {
            hasData: !!(data.personalInformation.email || data.personalInformation.firstName),
            description: 'Name, email, phone, address, account info',
          },
          professionalInformation: {
            hasData: data.professionalInformation.education.length > 0 ||
              data.professionalInformation.skills.length > 0 ||
              data.professionalInformation.experience.length > 0,
            itemCount: data.professionalInformation.education.length +
              data.professionalInformation.skills.length +
              data.professionalInformation.experience.length +
              data.professionalInformation.certifications.length +
              data.professionalInformation.workLogs.length,
            description: 'Education, skills, work experience, certifications, work logs',
          },
          financialInformation: {
            hasData: data.financialInformation.stripeConnected ||
              data.financialInformation.payments.length > 0,
            description: 'Payment information and transaction history',
          },
          usageInformation: {
            hasData: data.usageInformation.applicationCount > 0 ||
              data.usageInformation.profileViews.length > 0,
            itemCount: data.usageInformation.applicationCount +
              data.usageInformation.connectionCount,
            description: 'Profile views, applications, connections',
          },
          sensitiveInformation: {
            hasData: data.sensitiveInformation.backgroundChecks.length > 0 ||
              data.sensitiveInformation.idVerifications.length > 0 ||
              data.sensitiveInformation.personalityAssessments.length > 0,
            description: 'Background checks, ID verification, assessments',
          },
          communications: {
            hasData: data.communications.reviews.length > 0 ||
              data.communications.feedback.length > 0,
            itemCount: data.communications.reviews.length +
              data.communications.feedback.length,
            description: 'Reviews and platform feedback',
          },
        },
        totalRecords: data.metadata.totalRecords,
        approximateSizeKb: Math.round(data.metadata.approximateSizeBytes / 1024),
        dataSources: data.metadata.dataSources.length,
      }
    }),

  // ========================================================
  // EXPORT STORAGE MANAGEMENT ENDPOINTS
  // ========================================================

  /**
   * Get export status for a completed request
   * Returns download availability, count, and expiry info
   */
  getExportStatus: protectedProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Check request ownership
      const { data: request, error: requestError } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('user_id, status, request_type')
        .eq('id', input.requestId)
        .single()

      if (requestError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      if (request.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this export',
        })
      }

      // Get the download record
      const downloadRecord = await getDownloadRecord(ctx.supabase, input.requestId)

      if (!downloadRecord) {
        return {
          available: false,
          reason: request.status === 'completed'
            ? 'Export file not found. It may have been cleaned up.'
            : `Request status is '${request.status}'. Export will be available when complete.`,
        }
      }

      const now = new Date()
      const expiresAt = new Date(downloadRecord.expiresAt)
      const isExpired = expiresAt < now
      const downloadsRemaining = Math.max(0, downloadRecord.maxDownloads - downloadRecord.downloadCount)

      return {
        available: !isExpired && downloadsRemaining > 0,
        downloadCount: downloadRecord.downloadCount,
        maxDownloads: downloadRecord.maxDownloads,
        downloadsRemaining,
        expiresAt: downloadRecord.expiresAt,
        isExpired,
        fileFormat: downloadRecord.fileFormat,
        fileSizeBytes: downloadRecord.fileSizeBytes,
        firstDownloadedAt: downloadRecord.firstDownloadedAt,
        lastDownloadedAt: downloadRecord.lastDownloadedAt,
        createdAt: downloadRecord.createdAt,
      }
    }),

  /**
   * Create and upload export file (admin/office use)
   *
   * This endpoint is used by the processing pipeline to:
   * 1. Generate a PDF from collected user data
   * 2. Upload it to secure storage
   * 3. Create a download record for tracking
   */
  createAndUploadExport: officeProcedure
    .input(z.object({
      requestId: z.string().uuid(),
      userId: z.string().uuid(),
      format: z.enum(['pdf', 'json', 'csv']).default('pdf'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify the request exists and is ready for export
      const { data: request, error: requestError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('id, user_id, request_type, status, metadata')
        .eq('id', input.requestId)
        .single()

      if (requestError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'CCPA request not found',
        })
      }

      if (request.user_id !== input.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User ID does not match request',
        })
      }

      // Get the export data from metadata
      const metadata = request.metadata as Record<string, unknown> | null
      const exportData = metadata?.export_data as Record<string, unknown> | undefined

      if (!exportData) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No export data available. Run data collection first.',
        })
      }

      // Generate PDF
      const pdfResult = await generateCCPAPDF(
        exportData as Parameters<typeof generateCCPAPDF>[0],
        {
          requestId: input.requestId,
          requestType: request.request_type as 'access' | 'deletion' | 'correction' | 'portability',
          includeQRCode: true,
          baseUrl: Deno.env.get('PUBLIC_APP_URL') ?? 'https://scaffald.com',
        }
      )

      if (!pdfResult.success || !pdfResult.pdfBytes) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `PDF generation failed: ${pdfResult.error ?? 'Unknown error'}`,
        })
      }

      // Upload to storage and create download record
      const uploadResult = await createExportDownload(
        ctx.supabaseAdmin,
        input.requestId,
        input.userId,
        pdfResult.pdfBytes,
        input.format
      )

      if (!uploadResult.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Upload failed: ${uploadResult.error ?? 'Unknown error'}`,
        })
      }

      return {
        success: true,
        downloadUrl: uploadResult.downloadUrl,
        expiresAt: uploadResult.expiresAt,
        fileName: uploadResult.fileName,
        fileSizeBytes: pdfResult.sizeBytes,
        pageCount: pdfResult.pageCount,
        maxDownloads: EXPORT_CONFIG.MAX_DOWNLOADS,
        retentionHours: EXPORT_CONFIG.RETENTION_HOURS,
      }
    }),

  /**
   * Track a download attempt (internal use)
   *
   * Called when a user clicks to download their export.
   * Increments the download count and enforces limits.
   */
  recordDownload: protectedProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Verify request ownership
      const { data: request, error: requestError } = await ctx.supabase
        .schema('core')
        .from('ccpa_requests')
        .select('user_id')
        .eq('id', input.requestId)
        .single()

      if (requestError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      if (request.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this export',
        })
      }

      // Track the download
      const trackResult = await trackDownload(ctx.supabase, input.requestId)

      if (!trackResult.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: trackResult.error ?? 'Download tracking failed',
        })
      }

      return {
        success: true,
        downloadCount: trackResult.downloadCount,
        remaining: trackResult.remaining,
      }
    }),

  /**
   * Run cleanup job for expired exports (admin only)
   *
   * This should be called periodically (e.g., daily cron job)
   * to clean up expired export files and records.
   */
  runExportCleanup: officeProcedure
    .mutation(async ({ ctx }) => {
      console.log('[ccpa] Running export cleanup job...')

      const result = await cleanupExpiredExports(ctx.supabaseAdmin)

      if (!result.success) {
        console.warn('[ccpa] Cleanup completed with errors:', result.errors)
      } else {
        console.log(
          `[ccpa] Cleanup complete: ${result.filesDeleted} files, ${result.recordsDeleted} records deleted`
        )
      }

      return {
        success: result.success,
        filesDeleted: result.filesDeleted,
        recordsDeleted: result.recordsDeleted,
        errors: result.errors,
      }
    }),

  // ========================================================
  // NOTIFICATION ENDPOINTS
  // ========================================================

  /**
   * Send a notification for a CCPA request event
   *
   * This endpoint can be called to send notifications for various
   * CCPA request events. It's primarily used by the processing pipeline
   * and admin actions.
   */
  sendNotification: officeProcedure
    .input(z.object({
      requestId: z.string().uuid(),
      notificationType: z.enum([
        'request_submitted',
        'verification_required',
        'request_completed',
        'export_ready',
      ]),
      additionalData: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the request and user info
      const { data: request, error: requestError } = await ctx.supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('id, user_id, request_type, status, deadline_at')
        .eq('id', input.requestId)
        .single()

      if (requestError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      // Get user profile for email
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .schema('core')
        .from('profile')
        .select('email, first_name, last_name')
        .eq('id', request.user_id)
        .single()

      if (profileError || !profile?.email) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile or email not found',
        })
      }

      const requestInfo: CCPARequestInfo = {
        requestId: request.id,
        requestType: request.request_type,
        userId: request.user_id,
        userEmail: profile.email,
        userName: profile.first_name
          ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
          : undefined,
        deadline: request.deadline_at ?? undefined,
        status: request.status,
      }

      let notificationResult: NotificationResult

      switch (input.notificationType) {
        case 'request_submitted':
          notificationResult = await notifyRequestSubmitted(ctx.supabaseAdmin, requestInfo)
          break
        case 'verification_required':
          notificationResult = await notifyVerificationRequired(ctx.supabaseAdmin, requestInfo)
          break
        case 'request_completed':
          notificationResult = await notifyRequestCompleted(
            ctx.supabaseAdmin,
            requestInfo,
            input.additionalData
          )
          break
        case 'export_ready':
          notificationResult = await notifyExportReady(
            ctx.supabaseAdmin,
            requestInfo,
            (input.additionalData?.format as string) ?? 'pdf',
            input.additionalData?.fileSize as string | undefined
          )
          break
        default:
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Unknown notification type: ${input.notificationType}`,
          })
      }

      if (!notificationResult.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: notificationResult.error ?? 'Failed to send notification',
        })
      }

      return {
        success: true,
        notificationId: notificationResult.notificationId,
        type: input.notificationType,
      }
    }),

  /**
   * Send deadline reminder notifications (admin cron job)
   *
   * This endpoint should be called periodically (e.g., daily)
   * to send reminder notifications for requests approaching deadline.
   */
  sendDeadlineReminders: officeProcedure
    .mutation(async ({ ctx }) => {
      console.log('[ccpa] Running deadline reminder job...')

      const result = await sendDeadlineReminders(ctx.supabaseAdmin)

      if (!result.success) {
        console.warn('[ccpa] Deadline reminders completed with errors:', result.errors)
      } else {
        console.log(`[ccpa] Sent ${result.sent} deadline reminder notifications`)
      }

      return {
        success: result.success,
        sent: result.sent,
        errors: result.errors,
      }
    }),

  /**
   * Get notification types for CCPA
   *
   * Returns all available CCPA notification types for reference.
   */
  getNotificationTypes: publicProcedure
    .query(() => {
      return {
        types: CCPA_NOTIFICATION_TYPES,
        description: {
          [CCPA_NOTIFICATION_TYPES.REQUEST_SUBMITTED]: 'Sent when a new request is submitted',
          [CCPA_NOTIFICATION_TYPES.VERIFICATION_REQUIRED]: 'Sent when identity verification is needed',
          [CCPA_NOTIFICATION_TYPES.REQUEST_ACKNOWLEDGED]: 'Sent when processing begins',
          [CCPA_NOTIFICATION_TYPES.REQUEST_IN_PROGRESS]: 'Sent for progress updates',
          [CCPA_NOTIFICATION_TYPES.REQUEST_COMPLETED]: 'Sent when request is complete',
          [CCPA_NOTIFICATION_TYPES.DELETION_SCHEDULED]: 'Sent when deletion is scheduled',
          [CCPA_NOTIFICATION_TYPES.DELETION_COMPLETED]: 'Sent when deletion is complete',
          [CCPA_NOTIFICATION_TYPES.OPT_OUT_CONFIRMED]: 'Sent when opt-out is confirmed',
          [CCPA_NOTIFICATION_TYPES.OPT_IN_CONFIRMED]: 'Sent when opt-in is confirmed',
          [CCPA_NOTIFICATION_TYPES.DEADLINE_REMINDER]: 'Sent as deadline approaches',
          [CCPA_NOTIFICATION_TYPES.DEADLINE_EXTENDED]: 'Sent when deadline is extended',
          [CCPA_NOTIFICATION_TYPES.REQUEST_DENIED]: 'Sent when request is denied',
          [CCPA_NOTIFICATION_TYPES.APPEAL_RECEIVED]: 'Sent when appeal is received',
          [CCPA_NOTIFICATION_TYPES.EXPORT_READY]: 'Sent when export is ready to download',
          [CCPA_NOTIFICATION_TYPES.EXPORT_EXPIRING]: 'Sent when export is about to expire',
        },
      }
    }),

  // ========================================================
  // GPC (GLOBAL PRIVACY CONTROL) ENDPOINTS
  // ========================================================

  /**
   * Process GPC signal from request headers
   *
   * Call this endpoint when a page loads to check for and honor
   * the GPC (Global Privacy Control) signal. When GPC is detected,
   * the user is automatically opted out of sale and sharing.
   *
   * @see https://globalprivacycontrol.org/
   */
  processGPCSignal: protectedProcedure
    .input(z.object({
      gpcHeaderValue: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Create a mock signal result from the provided header value
      const signal = {
        detected: input.gpcHeaderValue === GPC_CONFIG.ENABLED_VALUE,
        headerValue: input.gpcHeaderValue,
        timestamp: new Date().toISOString(),
      }

      if (!signal.detected) {
        return {
          gpcDetected: false,
          processed: false,
          categories: [],
          message: 'No GPC signal detected',
        }
      }

      // Process the GPC signal
      const result = await processGPCSignal(ctx.supabase, ctx.user.id, signal)

      if (!result.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error ?? 'Failed to process GPC signal',
        })
      }

      if (result.alreadyOptedOut) {
        return {
          gpcDetected: true,
          processed: false,
          categories: result.categories,
          message: 'GPC preferences already honored',
        }
      }

      // Send opt-out confirmation if categories were processed
      if (result.processed && result.categories.length > 0) {
        // Get user profile for notification
        const { data: profile } = await ctx.supabase
          .schema('core')
          .from('profile')
          .select('email, first_name, last_name')
          .eq('id', ctx.user.id)
          .single()

        if (profile?.email) {
          await notifyOptOutConfirmed(
            ctx.supabase,
            {
              requestId: '', // GPC-based, no specific request
              requestType: 'opt_out',
              userId: ctx.user.id,
              userEmail: profile.email,
              userName: profile.first_name
                ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
                : undefined,
            },
            result.categories
          )
        }
      }

      return {
        gpcDetected: true,
        processed: result.processed,
        categories: result.categories,
        message: result.processed
          ? `Opted out of ${result.categories.join(', ')} per GPC signal`
          : 'GPC signal processed',
      }
    }),

  /**
   * Get GPC status for current user
   *
   * Returns whether the user has GPC-based opt-outs and the
   * status of each opt-out category.
   */
  getGPCStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const status = await getGPCStatus(ctx.supabase, ctx.user.id)

    return {
      hasGPCOptOut: status.hasGPCOptOut,
      gpcOptedOutAt: status.gpcOptedOutAt,
      categories: status.categories,
      gpcApplicableCategories: GPC_CONFIG.APPLICABLE_CATEGORIES,
    }
  }),

  /**
   * Get GPC disclosure text for privacy policy
   *
   * Returns standardized disclosure text explaining GPC support.
   * Use this in your privacy policy or Do Not Sell page.
   */
  getGPCDisclosure: publicProcedure.query(() => {
    return {
      disclosureText: getGPCDisclosureText(),
      headerName: GPC_CONFIG.HEADER_NAME,
      applicableCategories: GPC_CONFIG.APPLICABLE_CATEGORIES,
      allCategories: GPC_CONFIG.ALL_CATEGORIES,
      categoryLabels: {
        sale: 'Sale of Personal Information',
        sharing: 'Sharing for Cross-Context Behavioral Advertising',
        targeted_advertising: 'Targeted Advertising',
        profiling: 'Automated Profiling',
      },
    }
  }),

  /**
   * Get Do Not Sell page status
   *
   * Returns combined status for a "Do Not Sell My Personal Information" page.
   * Includes GPC detection, user opt-out status, and category details.
   */
  getDoNotSellStatus: publicProcedure
    .input(z.object({
      gpcHeaderValue: z.string().nullable().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      // Create mock headers from input
      const headers = new Headers()
      if (input?.gpcHeaderValue) {
        headers.set(GPC_CONFIG.HEADER_NAME, input.gpcHeaderValue)
      }

      const userId = ctx.user?.id ?? null

      const status = await getDoNotSellPageStatus(
        ctx.supabase,
        userId,
        headers
      )

      return {
        ...status,
        isAuthenticated: !!userId,
        gpcHeaderName: GPC_CONFIG.HEADER_NAME,
        gpcApplicableCategories: [...GPC_CONFIG.APPLICABLE_CATEGORIES],
        learnMoreUrl: 'https://globalprivacycontrol.org/',
      }
    }),

  /**
   * Get GPC configuration
   *
   * Returns the GPC configuration for client-side use.
   */
  getGPCConfig: publicProcedure.query(() => {
    return {
      headerName: GPC_CONFIG.HEADER_NAME,
      enabledValue: GPC_CONFIG.ENABLED_VALUE,
      applicableCategories: GPC_CONFIG.APPLICABLE_CATEGORIES,
      allCategories: GPC_CONFIG.ALL_CATEGORIES,
      source: GPC_CONFIG.SOURCE,
    }
  }),
})
