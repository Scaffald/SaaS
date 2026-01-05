import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import type { Context } from '../context.ts'
import { officeProcedure, protectedProcedure, t } from '../middleware.ts'

async function ensureOrganizationAccess(ctx: Context, organizationId: string) {
  if (!ctx.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (!ctx.supabaseAdmin) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Admin client not available',
    })
  }

  // Office users have access to all organizations
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

export const legalAgreementsRouter = t.router({
  /**
   * Create a hire agreement (called when success fee is paid)
   */
  createHireAgreement: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        workerUserId: z.string().uuid(),
        applicationId: z.string().uuid().optional(),
        successFeeId: z.string().uuid().optional(),
        agreementText: z.string().optional(),
        termsAccepted: z.boolean().default(true),
        antiCircumventionAccepted: z.boolean().default(true),
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

      // Get default agreement text if not provided
      const { data: agreementTextData, error: textError } = await ctx.supabaseAdmin
        .schema('core')
        .rpc('get_default_hire_agreement_text')

      if (textError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get agreement text: ${textError.message}`,
        })
      }

      const agreementText =
        input.agreementText ?? agreementTextData ?? 'PLACEHOLDER: Legal Agreement Text'

      const { data: agreement, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('hire_agreements')
        .insert({
          organization_id: input.organizationId,
          worker_user_id: input.workerUserId,
          application_id: input.applicationId ?? null,
          success_fee_id: input.successFeeId ?? null,
          agreement_text: agreementText,
          agreement_version: '1.0',
          agreed_by_user_id: ctx.user?.id ?? null,
          terms_accepted: input.termsAccepted,
          anti_circumvention_accepted: input.antiCircumventionAccepted,
        })
        .select('*')
        .maybeSingle()

      if (error || !agreement) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error
            ? `Failed to create hire agreement: ${error.message}`
            : 'Failed to create hire agreement',
        })
      }

      return {
        id: agreement.id,
        organizationId: agreement.organization_id,
        workerUserId: agreement.worker_user_id,
        applicationId: agreement.application_id,
        successFeeId: agreement.success_fee_id,
        agreementVersion: agreement.agreement_version,
        status: agreement.status,
        agreedAt: agreement.agreed_at,
        createdAt: agreement.created_at,
      }
    }),

  /**
   * Get hire agreements for an organization or worker
   */
  getHireAgreements: protectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().uuid().optional(),
          workerUserId: z.string().uuid().optional(),
          applicationId: z.string().uuid().optional(),
          successFeeId: z.string().uuid().optional(),
          status: z.enum(['active', 'violated', 'voided', 'disputed']).optional(),
          limit: z.number().int().positive().max(100).default(50),
          offset: z.number().int().nonnegative().default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      if (!supabaseAdmin) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Admin client not available',
        })
      }

      let query = supabaseAdmin
        .schema('core')
        .from('hire_agreements')
        .select('*')
        .order('created_at', { ascending: false })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50) - 1)

      if (input?.organizationId) {
        await ensureOrganizationAccess(ctx, input.organizationId)
        query = query.eq('organization_id', input.organizationId)
      }

      if (input?.workerUserId) {
        if (input.workerUserId !== ctx.user?.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only view your own agreements',
          })
        }
        query = query.eq('worker_user_id', input.workerUserId)
      }

      if (input?.applicationId) {
        query = query.eq('application_id', input.applicationId)
      }

      if (input?.successFeeId) {
        query = query.eq('success_fee_id', input.successFeeId)
      }

      if (input?.status) {
        query = query.eq('status', input.status)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load hire agreements: ${error.message}`,
        })
      }

      return {
        // biome-ignore lint/suspicious/noExplicitAny: Database row type mismatch
        items: (data ?? []).map((row: any) => ({
          id: row.id,
          organizationId: row.organization_id,
          workerUserId: row.worker_user_id,
          applicationId: row.application_id,
          successFeeId: row.success_fee_id,
          agreementVersion: row.agreement_version,
          agreementText: row.agreement_text,
          termsAccepted: row.terms_accepted,
          antiCircumventionAccepted: row.anti_circumvention_accepted,
          status: row.status,
          agreedAt: row.agreed_at,
          violatedAt: row.violated_at,
          violationReason: row.violation_reason,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
        totalCount: count ?? 0,
      }
    }),

  /**
   * Report an anti-circumvention violation
   */
  reportViolation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid().optional(),
        workerUserId: z.string().uuid().optional(),
        hireAgreementId: z.string().uuid().optional(),
        violationType: z.enum([
          'off_platform_hire',
          'off_platform_communication',
          'fee_avoidance',
          'other',
        ]),
        description: z.string().min(10),
        evidenceUrls: z.array(z.string().url()).optional(),
        evidenceNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.supabaseAdmin) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Admin client not available',
        })
      }

      const { data: report, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('circumvention_reports')
        .insert({
          reported_by_user_id: ctx.user?.id ?? null,
          organization_id: input.organizationId ?? null,
          worker_user_id: input.workerUserId ?? null,
          hire_agreement_id: input.hireAgreementId ?? null,
          violation_type: input.violationType,
          description: input.description,
          evidence_urls: input.evidenceUrls ?? [],
          evidence_notes: input.evidenceNotes ?? null,
          status: 'pending',
        })
        .select('*')
        .maybeSingle()

      if (error || !report) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error
            ? `Failed to create violation report: ${error.message}`
            : 'Failed to create violation report',
        })
      }

      // If linked to a hire agreement, mark it as violated
      if (input.hireAgreementId) {
        await ctx.supabaseAdmin
          .schema('core')
          .from('hire_agreements')
          .update({
            status: 'violated',
            violated_at: new Date().toISOString(),
            violation_reason: input.description,
          })
          .eq('id', input.hireAgreementId)
      }

      return {
        id: report.id,
        status: report.status,
        createdAt: report.created_at,
      }
    }),

  /**
   * Admin: List violation reports
   */
  listViolationReports: officeProcedure
    .input(
      z
        .object({
          status: z
            .enum(['pending', 'under_review', 'confirmed', 'dismissed', 'resolved'])
            .optional(),
          violationType: z
            .enum(['off_platform_hire', 'off_platform_communication', 'fee_avoidance', 'other'])
            .optional(),
          organizationId: z.string().uuid().optional(),
          workerUserId: z.string().uuid().optional(),
          limit: z.number().int().positive().max(100).default(50),
          offset: z.number().int().nonnegative().default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      let query = supabaseAdmin
        .schema('core')
        .from('circumvention_reports')
        .select(
          `
          *,
          reported_by:users!circumvention_reports_reported_by_user_id_fkey(id, display_name, email),
          organization:organizations(id, name),
          worker:users!circumvention_reports_worker_user_id_fkey(id, display_name, email),
          hire_agreement:hire_agreements(id, status)
        `
        )
        .order('created_at', { ascending: false })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50) - 1)

      if (input?.status) {
        query = query.eq('status', input.status)
      }

      if (input?.violationType) {
        query = query.eq('violation_type', input.violationType)
      }

      if (input?.organizationId) {
        query = query.eq('organization_id', input.organizationId)
      }

      if (input?.workerUserId) {
        query = query.eq('worker_user_id', input.workerUserId)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load violation reports: ${error.message}`,
        })
      }

      return {
        items: (data ?? []).map(
          (row: {
            id: string
            reported_by_user_id: string
            reported_by?: { display_name?: string; email?: string } | null
            organization_id: string
            organization?: { name?: string } | null
            worker_user_id: string
            worker?: { display_name?: string; email?: string } | null
            hire_agreement_id: string | null
            hire_agreement?: { status?: string } | null
            violation_type: string
            description: string
            status: string
            created_at: string
            updated_at: string
            [key: string]: unknown
          }) => ({
            id: row.id,
            reportedByUserId: row.reported_by_user_id,
            reportedByName:
              (row.reported_by as { display_name?: string; email?: string } | null)?.display_name ??
              (row.reported_by as { display_name?: string; email?: string } | null)?.email ??
              null,
            organizationId: row.organization_id,
            organizationName: (row.organization as { name?: string } | null)?.name ?? null,
            workerUserId: row.worker_user_id,
            workerName:
              (row.worker as { display_name?: string; email?: string } | null)?.display_name ??
              (row.worker as { display_name?: string; email?: string } | null)?.email ??
              null,
            hireAgreementId: row.hire_agreement_id,
            hireAgreementStatus: (row.hire_agreement as { status?: string } | null)?.status ?? null,
            violationType: row.violation_type,
            description: row.description,
            evidenceUrls: row.evidence_urls ?? [],
            evidenceNotes: row.evidence_notes,
            status: row.status,
            reviewedByUserId: row.reviewed_by_user_id,
            reviewedAt: row.reviewed_at,
            reviewNotes: row.review_notes,
            resolutionAction: row.resolution_action,
            resolvedAt: row.resolved_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })
        ),
        totalCount: count ?? 0,
      }
    }),

  /**
   * Admin: Update violation report status
   */
  updateViolationReport: officeProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
        status: z
          .enum(['pending', 'under_review', 'confirmed', 'dismissed', 'resolved'])
          .optional(),
        reviewNotes: z.string().optional(),
        resolutionAction: z
          .enum([
            'warning_issued',
            'fee_collected',
            'account_suspended',
            'account_terminated',
            'no_action',
            'other',
          ])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {}

      if (input.status) {
        updateData.status = input.status
        if (
          input.status === 'under_review' ||
          input.status === 'confirmed' ||
          input.status === 'dismissed' ||
          input.status === 'resolved'
        ) {
          updateData.reviewed_by_user_id = ctx.user?.id ?? null
          updateData.reviewed_at = new Date().toISOString()
        }
        if (input.status === 'resolved') {
          updateData.resolved_at = new Date().toISOString()
        }
      }

      if (input.reviewNotes !== undefined) {
        updateData.review_notes = input.reviewNotes
      }

      if (input.resolutionAction !== undefined) {
        updateData.resolution_action = input.resolutionAction
      }

      const { data: report, error } = await ctx.supabaseAdmin
        .schema('core')
        .from('circumvention_reports')
        .update(updateData)
        .eq('id', input.reportId)
        .select('*')
        .maybeSingle()

      if (error || !report) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error
            ? `Failed to update violation report: ${error.message}`
            : 'Violation report not found',
        })
      }

      return {
        id: report.id,
        status: report.status,
        updatedAt: report.updated_at,
      }
    }),
})
