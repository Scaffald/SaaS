/**
 * CCPA Admin Router
 * CCPA Admin UI Implementation
 *
 * Provides admin endpoints for CCPA compliance management:
 * - Dashboard metrics (total, pending, processing, completed, overdue)
 * - Request listing with filtering and sorting
 * - Request status management
 * - Request assignment
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { core } from '../../../lib/supabase'

/**
 * CCPA request status enum
 */
const CCPAStatusEnum = z.enum(['pending', 'in_progress', 'completed', 'denied', 'cancelled'])

/**
 * CCPA request type enum
 */
const CCPARequestTypeEnum = z.enum([
  'access',
  'deletion',
  'correction',
  'portability',
  'opt_out',
  'opt_in',
])

export const ccpaAdminRouter = createTRPCRouter({
  /**
   * Get CCPA compliance metrics for dashboard
   * Returns counts by status, compliance rate, and average processing time
   */
  getMetrics: protectedProcedure
    .input(
      z
        .object({
          days: z.number().int().positive().default(30),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const days = input?.days ?? 30
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get all requests in the period
      const { data: requests, error } = await core('ccpa_requests')
        .select('*')
        .gte('submitted_at', startDate.toISOString())

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load metrics: ${error.message}`,
        })
      }

      const allRequests = requests ?? []
      const now = new Date()

      // Calculate metrics
      const totalRequests = allRequests.length
      const pendingRequests = allRequests.filter((r) => r.status === 'pending')
      const processingRequests = allRequests.filter((r) => r.status === 'in_progress')
      const completedRequests = allRequests.filter((r) => r.status === 'completed')
      const deniedRequests = allRequests.filter((r) => r.status === 'denied')
      const cancelledRequests = allRequests.filter((r) => r.status === 'cancelled')

      // Calculate overdue (pending or in_progress past deadline)
      const overdueRequests = allRequests.filter((r) => {
        if (!['pending', 'in_progress'].includes(r.status)) return false
        const deadline = r.extended_deadline_at ?? r.deadline_at
        return new Date(deadline) < now
      })

      // Calculate average response time (for completed requests)
      let avgResponseDays = 0
      if (completedRequests.length > 0) {
        const totalDays = completedRequests.reduce((sum: number, r) => {
          const submitted = new Date(r.submitted_at)
          const completed = new Date(r.completed_at)
          return sum + (completed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
        }, 0)
        avgResponseDays = totalDays / completedRequests.length
      }

      // Calculate compliance rate (completed on time / total completed + denied)
      const resolvedRequests = [...completedRequests, ...deniedRequests]
      const onTimeRequests = resolvedRequests.filter((r) => {
        const deadline = r.extended_deadline_at ?? r.deadline_at
        const completedAt = new Date(r.completed_at)
        return completedAt <= new Date(deadline)
      })
      const complianceRate =
        resolvedRequests.length > 0 ? onTimeRequests.length / resolvedRequests.length : 1

      // Breakdown by request type
      const requestsByType = {
        access: allRequests.filter((r) => r.request_type === 'access').length,
        deletion: allRequests.filter((r) => r.request_type === 'deletion').length,
        correction: allRequests.filter((r) => r.request_type === 'correction').length,
        portability: allRequests.filter((r) => r.request_type === 'portability').length,
        opt_out: allRequests.filter((r) => r.request_type === 'opt_out').length,
        opt_in: allRequests.filter((r) => r.request_type === 'opt_in').length,
      }

      return {
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        },
        total_requests: totalRequests,
        pending_requests: pendingRequests.length,
        processing_requests: processingRequests.length,
        completed_requests: completedRequests.length,
        failed_requests: deniedRequests.length,
        cancelled_requests: cancelledRequests.length,
        overdue_count: overdueRequests.length,
        average_processing_days: Math.round(avgResponseDays * 10) / 10,
        compliance_rate: Math.round(complianceRate * 100) / 100,
        requests_by_type: requestsByType,
      }
    }),

  /**
   * List CCPA requests with filtering and pagination
   */
  listRequests: protectedProcedure
    .input(
      z
        .object({
          status: CCPAStatusEnum.optional(),
          requestType: CCPARequestTypeEnum.optional(),
          overdueOnly: z.boolean().optional(),
          sortBy: z.enum(['deadline_at', 'submitted_at', 'status']).default('deadline_at'),
          sortOrder: z.enum(['asc', 'desc']).default('asc'),
          limit: z.number().int().positive().max(100).default(50),
          offset: z.number().int().nonnegative().default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const {
        status,
        requestType,
        overdueOnly,
        sortBy = 'deadline_at',
        sortOrder = 'asc',
        limit = 50,
        offset = 0,
      } = input ?? {}

      // Build query
      let query = core('ccpa_requests')
        .select('*', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      if (requestType) {
        query = query.eq('request_type', requestType)
      }

      if (overdueOnly) {
        query = query
          .lt('deadline_at', new Date().toISOString())
          .in('status', ['pending', 'in_progress'])
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load requests: ${error.message}`,
        })
      }

      const now = new Date()

      // Transform data for frontend
      const items = (data ?? []).map((row) => {
        const deadline = row.extended_deadline_at ?? row.deadline_at
        const daysRemaining = Math.ceil(
          (new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        const daysElapsed = Math.ceil(
          (now.getTime() - new Date(row.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        return {
          id: row.id,
          user_id: row.user_id,
          user_email: row.metadata?.user_email ?? 'Unknown',
          user_name: row.metadata?.user_name ?? 'Unknown User',
          type: row.request_type,
          status: row.status,
          created_at: row.submitted_at,
          updated_at: row.updated_at ?? row.submitted_at,
          deadline_at: deadline,
          assigned_to: row.metadata?.assigned_to,
          priority: calculatePriority(daysRemaining, row.status),
          days_elapsed: daysElapsed,
          days_remaining: Math.max(0, daysRemaining),
          is_overdue: daysRemaining < 0 && ['pending', 'in_progress'].includes(row.status),
        }
      })

      return {
        items,
        totalCount: count ?? 0,
        limit,
        offset,
      }
    }),

  /**
   * Update request status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        status: CCPAStatusEnum,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { requestId, status, notes } = input

      // Get current request
      const { data: request, error: fetchError } = await core('ccpa_requests')
        .select('id, status')
        .eq('id', requestId)
        .single()

      if (fetchError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        pending: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'denied', 'cancelled'],
        completed: [],
        denied: [],
        cancelled: [],
      }

      if (!validTransitions[request.status]?.includes(status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot transition from '${request.status}' to '${status}'`,
        })
      }

      // Update request
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'completed' || status === 'denied') {
        updateData.completed_at = new Date().toISOString()
      }

      if (status === 'denied' && notes) {
        updateData.denial_reason = notes
      }

      const { error: updateError } = await core('ccpa_requests')
        .update(updateData)
        .eq('id', requestId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update request: ${updateError.message}`,
        })
      }

      // Record in history
      await core('ccpa_request_history').insert({
        request_id: requestId,
        status,
        changed_by: ctx.user?.id,
        notes: notes ?? `Status changed to ${status}`,
      })

      return {
        id: requestId,
        status,
        message: `Request status updated to ${status}`,
      }
    }),

  /**
   * Assign request to admin
   */
  assignRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        assignedTo: z.string().uuid().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { requestId, assignedTo } = input

      // Get current request
      const { data: request, error: fetchError } = await core('ccpa_requests')
        .select('id, metadata')
        .eq('id', requestId)
        .single()

      if (fetchError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      // Update metadata with assignment
      const metadata = (request.metadata as Record<string, unknown>) ?? {}
      metadata.assigned_to = assignedTo
      metadata.assigned_at = assignedTo ? new Date().toISOString() : null

      const { error: updateError } = await core('ccpa_requests')
        .update({
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to assign request: ${updateError.message}`,
        })
      }

      // Record in history
      await core('ccpa_request_history').insert({
        request_id: requestId,
        status: request.status ?? 'pending',
        changed_by: ctx.user?.id,
        notes: assignedTo ? `Request assigned to ${assignedTo}` : 'Request unassigned',
        metadata: { action: 'assignment', assigned_to: assignedTo },
      })

      return {
        id: requestId,
        assignedTo,
        message: assignedTo ? 'Request assigned successfully' : 'Request unassigned',
      }
    }),

  /**
   * Get a single CCPA request by ID with full details
   */
  getRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const { requestId } = input

      const { data: request, error } = await core('ccpa_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (error || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      const now = new Date()
      const deadline = request.extended_deadline_at ?? request.deadline_at
      const daysRemaining = Math.ceil(
        (new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      const daysElapsed = Math.ceil(
        (now.getTime() - new Date(request.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: request.id,
        user_id: request.user_id,
        user_email: request.metadata?.user_email ?? 'Unknown',
        user_name: request.metadata?.user_name ?? 'Unknown User',
        type: request.request_type,
        status: request.status,
        created_at: request.submitted_at,
        updated_at: request.updated_at ?? request.submitted_at,
        completed_at: request.completed_at,
        deadline_at: deadline,
        original_deadline_at: request.deadline_at,
        extended_deadline_at: request.extended_deadline_at,
        assigned_to: request.metadata?.assigned_to,
        priority: calculatePriority(daysRemaining, request.status),
        days_elapsed: daysElapsed,
        days_remaining: Math.max(0, daysRemaining),
        is_overdue: daysRemaining < 0 && ['pending', 'in_progress'].includes(request.status),
        denial_reason: request.denial_reason,
        verification_method: request.verification_method,
        verified_at: request.verified_at,
        metadata: request.metadata ?? {},
        internal_notes:
          (request.metadata?.internal_notes as Array<{
            text: string
            author: string
            created_at: string
          }>) ?? [],
      }
    }),

  /**
   * Get request history (timeline)
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const { requestId } = input

      const { data, error } = await core('ccpa_request_history')
        .select('*')
        .eq('request_id', requestId)
        .order('changed_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load history: ${error.message}`,
        })
      }

      return (data ?? []).map((entry) => ({
        id: entry.id,
        status: entry.status,
        changed_at: entry.changed_at,
        changed_by: entry.changed_by,
        notes: entry.notes,
        metadata: entry.metadata,
      }))
    }),

  /**
   * Add internal note to a request
   */
  addNote: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        note: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { requestId, note } = input

      // Get current request
      const { data: request, error: fetchError } = await core('ccpa_requests')
        .select('id, metadata, status')
        .eq('id', requestId)
        .single()

      if (fetchError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      // Add note to metadata
      const metadata = (request.metadata as Record<string, unknown>) ?? {}
      const notes =
        (metadata.internal_notes as Array<{ text: string; author: string; created_at: string }>) ??
        []

      notes.push({
        text: note,
        author: ctx.user?.id ?? 'system',
        created_at: new Date().toISOString(),
      })

      metadata.internal_notes = notes

      const { error: updateError } = await core('ccpa_requests')
        .update({
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to add note: ${updateError.message}`,
        })
      }

      // Record in history
      await core('ccpa_request_history').insert({
        request_id: requestId,
        status: request.status,
        changed_by: ctx.user?.id,
        notes: `Internal note added: ${note.substring(0, 100)}${note.length > 100 ? '...' : ''}`,
        metadata: { action: 'note_added' },
      })

      return {
        id: requestId,
        message: 'Note added successfully',
        note: {
          text: note,
          author: ctx.user?.id ?? 'system',
          created_at: new Date().toISOString(),
        },
      }
    }),

  /**
   * Approve a pending request (move to in_progress)
   */
  approveRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { requestId, notes } = input

      // Get current request
      const { data: request, error: fetchError } = await core('ccpa_requests')
        .select('id, status')
        .eq('id', requestId)
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

      const { error: updateError } = await core('ccpa_requests')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to approve request: ${updateError.message}`,
        })
      }

      // Record in history
      await core('ccpa_request_history').insert({
        request_id: requestId,
        status: 'in_progress',
        changed_by: ctx.user?.id,
        notes: notes ?? 'Request approved and moved to in_progress',
      })

      return {
        id: requestId,
        status: 'in_progress',
        message: 'Request approved and is now in progress',
      }
    }),

  // =====================================================
  // OAuth App CCPA Configuration Endpoints (TASK-5)
  // =====================================================

  /**
   * List all OAuth apps with their CCPA configuration status
   */
  listApps: protectedProcedure.query(async () => {
    // Get OAuth apps
    const { data: oauthApps, error: oauthError } = await core('oauth_apps')
      .select('id, name, display_name, description, status, created_at, updated_at')
      .order('display_name', { ascending: true })

    if (oauthError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load OAuth apps: ${oauthError.message}`,
      })
    }

    // Get CCPA app registry entries
    const { data: ccpaConfigs, error: ccpaError } =
      await core('ccpa_oauth_app_registry').select('*')

    if (ccpaError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load CCPA configs: ${ccpaError.message}`,
      })
    }

    // Map OAuth apps to their CCPA config status
    const configMap = new Map((ccpaConfigs ?? []).map((c) => [c.app_id, c]))

    const apps = (oauthApps ?? []).map((app) => {
      const config = configMap.get(app.name)
      let ccpaStatus: 'not_configured' | 'partially_configured' | 'compliant' = 'not_configured'

      if (config) {
        const dataCategories = (config.data_categories as unknown[]) ?? []
        const hasWebhook = !!config.webhook_url
        const isActive = config.is_active

        if (dataCategories.length > 0 && hasWebhook && isActive) {
          ccpaStatus = 'compliant'
        } else if (dataCategories.length > 0 || hasWebhook) {
          ccpaStatus = 'partially_configured'
        }
      }

      return {
        id: app.id,
        name: app.name,
        displayName: app.display_name,
        description: app.description,
        status: app.status,
        ccpaStatus,
        ccpaConfigId: config?.id ?? null,
        lastVerifiedAt: config?.last_verified_at ?? null,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
      }
    })

    return apps
  }),

  /**
   * Get CCPA configuration for a specific OAuth app
   */
  getAppConfig: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const { appId } = input

      // Get the OAuth app
      const { data: oauthApp, error: oauthError } = await core('oauth_apps')
        .select('*')
        .eq('id', appId)
        .single()

      if (oauthError || !oauthApp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      // Get CCPA config if exists
      const { data: ccpaConfig } = await core('ccpa_oauth_app_registry')
        .select('*')
        .eq('app_id', oauthApp.name)
        .single()

      return {
        app: {
          id: oauthApp.id,
          name: oauthApp.name,
          displayName: oauthApp.display_name,
          description: oauthApp.description,
          status: oauthApp.status,
          redirectUris: oauthApp.redirect_uris,
          allowedScopes: oauthApp.allowed_scopes,
          ownerEmail: oauthApp.owner_email,
          homepageUrl: oauthApp.homepage_url,
          logoUrl: oauthApp.logo_url,
          createdAt: oauthApp.created_at,
          updatedAt: oauthApp.updated_at,
        },
        ccpaConfig: ccpaConfig
          ? {
              id: ccpaConfig.id,
              appId: ccpaConfig.app_id,
              appName: ccpaConfig.app_name,
              dataCategories: ccpaConfig.data_categories,
              webhookUrl: ccpaConfig.webhook_url,
              webhookSecret: ccpaConfig.webhook_secret ? '••••••••' : null,
              isActive: ccpaConfig.is_active,
              lastVerifiedAt: ccpaConfig.last_verified_at,
              registeredAt: ccpaConfig.registered_at,
              createdAt: ccpaConfig.created_at,
              updatedAt: ccpaConfig.updated_at,
            }
          : null,
      }
    }),

  /**
   * Create or update CCPA configuration for an OAuth app
   */
  updateAppConfig: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        dataCategories: z.array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            piiTypes: z.array(z.string()).optional(),
          })
        ),
        webhookUrl: z.string().url(),
        webhookSecret: z.string().optional(),
        isActive: z.boolean().default(true),
        // Request type support
        supportedRequestTypes: z
          .object({
            access: z.boolean().default(false),
            deletion: z.boolean().default(false),
            correction: z.boolean().default(false),
            portability: z.boolean().default(false),
            opt_out: z.boolean().default(false),
            opt_in: z.boolean().default(false),
          })
          .optional(),
        // SLA overrides
        slaOverrides: z
          .object({
            acknowledgmentDays: z.number().int().positive().max(45).optional(),
            completionDays: z.number().int().positive().max(90).optional(),
            justification: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        appId,
        dataCategories,
        webhookUrl,
        webhookSecret,
        isActive,
        supportedRequestTypes,
        slaOverrides,
      } = input

      // Get the OAuth app
      const { data: oauthApp, error: oauthError } = await core('oauth_apps')
        .select('id, name, display_name')
        .eq('id', appId)
        .single()

      if (oauthError || !oauthApp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      // Build metadata
      const metadata = {
        supportedRequestTypes: supportedRequestTypes ?? {
          access: true,
          deletion: true,
          correction: false,
          portability: false,
          opt_out: true,
          opt_in: true,
        },
        slaOverrides: slaOverrides ?? null,
      }

      // Check if config exists
      const { data: existingConfig } = await core('ccpa_oauth_app_registry')
        .select('id')
        .eq('app_id', oauthApp.name)
        .single()

      if (existingConfig) {
        // Update existing config
        const updateData: Record<string, unknown> = {
          data_categories: dataCategories,
          webhook_url: webhookUrl,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        }

        if (webhookSecret) {
          updateData.webhook_secret = webhookSecret
        }

        const { error: updateError } = await core('ccpa_oauth_app_registry')
          .update(updateData)
          .eq('id', existingConfig.id)

        if (updateError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update config: ${updateError.message}`,
          })
        }

        return {
          id: existingConfig.id,
          message: 'CCPA configuration updated successfully',
          metadata,
        }
      } else {
        // Create new config
        const { data: newConfig, error: insertError } = await core('ccpa_oauth_app_registry')
          .insert({
            app_id: oauthApp.name,
            app_name: oauthApp.display_name,
            data_categories: dataCategories,
            webhook_url: webhookUrl,
            webhook_secret: webhookSecret ?? null,
            is_active: isActive,
          })
          .select('id')
          .single()

        if (insertError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create config: ${insertError.message}`,
          })
        }

        return {
          id: newConfig?.id,
          message: 'CCPA configuration created successfully',
          metadata,
        }
      }
    }),

  /**
   * Test integration with an OAuth app's CCPA webhook
   */
  testAppIntegration: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        requestType: CCPARequestTypeEnum,
      })
    )
    .mutation(async ({ input }) => {
      const { appId, requestType } = input

      // Get the OAuth app
      const { data: oauthApp, error: oauthError } = await core('oauth_apps')
        .select('id, name')
        .eq('id', appId)
        .single()

      if (oauthError || !oauthApp) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OAuth app not found',
        })
      }

      // Get CCPA config
      const { data: ccpaConfig, error: ccpaError } = await core('ccpa_oauth_app_registry')
        .select('*')
        .eq('app_id', oauthApp.name)
        .single()

      if (ccpaError || !ccpaConfig) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'CCPA configuration not found for this app',
        })
      }

      if (!ccpaConfig.webhook_url) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No webhook URL configured for this app',
        })
      }

      // Send test request
      const testPayload = {
        type: 'ccpa_test',
        request_type: requestType,
        timestamp: new Date().toISOString(),
        test_user_id: `test-user-${crypto.randomUUID().substring(0, 8)}`,
        data_categories: ccpaConfig.data_categories,
      }

      const startTime = Date.now()
      let responseStatus = 0
      let responseBody = ''
      let error: string | null = null

      try {
        const response = await fetch(ccpaConfig.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CCPA-Test': 'true',
            ...(ccpaConfig.webhook_secret ? { 'X-Webhook-Secret': ccpaConfig.webhook_secret } : {}),
          },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })

        responseStatus = response.status
        responseBody = await response.text()
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error'
      }

      const duration = Date.now() - startTime

      // Update last verified at
      if (responseStatus >= 200 && responseStatus < 300) {
        await core('ccpa_oauth_app_registry')
          .update({ last_verified_at: new Date().toISOString() })
          .eq('id', ccpaConfig.id)
      }

      return {
        success: responseStatus >= 200 && responseStatus < 300,
        status: responseStatus,
        duration,
        response: responseBody.substring(0, 1000), // Limit response size
        error,
        testPayload,
        testedAt: new Date().toISOString(),
      }
    }),

  // =====================================================
  // Breach Notification Endpoints (TASK-6)
  // =====================================================

  /**
   * List all breach incidents with filtering
   */
  listBreaches: protectedProcedure
    .input(
      z
        .object({
          severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
          notificationRequired: z.boolean().optional(),
          limit: z.number().int().positive().max(100).default(50),
          offset: z.number().int().nonnegative().default(0),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const { severity, notificationRequired, limit = 50, offset = 0 } = input ?? {}

      // Use supabase directly for public schema tables
      const supabase = ctx.supabase

      let query = supabase
        .from('breach_notifications')
        .select('*', { count: 'exact' })
        .order('discovered_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (severity) {
        query = query.eq('severity', severity)
      }

      if (notificationRequired !== undefined) {
        query = query.eq('notification_required', notificationRequired)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load breaches: ${error.message}`,
        })
      }

      const now = new Date()

      const items = (data ?? []).map((breach) => {
        const notificationDeadline = breach.notification_deadline
          ? new Date(breach.notification_deadline)
          : null
        const hoursToDeadline = notificationDeadline
          ? Math.ceil((notificationDeadline.getTime() - now.getTime()) / (1000 * 60 * 60))
          : null

        return {
          id: breach.id,
          breachNumber: breach.breach_number,
          breachType: breach.breach_type,
          severity: breach.severity,
          discoveredAt: breach.discovered_at,
          affectedUserCount: breach.affected_user_count,
          affectedCaliforniaResidents: breach.affected_california_residents,
          dataTypesExposed: breach.data_types_exposed,
          sensitiveDataExposed: breach.sensitive_data_exposed,
          notificationRequired: breach.notification_required,
          notificationDeadline: breach.notification_deadline,
          hoursToDeadline,
          userNotificationSent: breach.user_notification_sent,
          userNotificationSentAt: breach.user_notification_sent_at,
          californiaAgNotified: breach.california_ag_notified,
          remediationStatus: breach.remediation_status,
          containedAt: breach.contained_at,
          createdAt: breach.created_at,
          updatedAt: breach.updated_at,
        }
      })

      return {
        items,
        totalCount: count ?? 0,
        limit,
        offset,
      }
    }),

  /**
   * Get a single breach incident by ID
   */
  getBreach: protectedProcedure
    .input(
      z.object({
        breachId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { breachId } = input
      const supabase = ctx.supabase

      const { data: breach, error } = await supabase
        .from('breach_notifications')
        .select('*')
        .eq('id', breachId)
        .single()

      if (error || !breach) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Breach incident not found',
        })
      }

      const now = new Date()
      const notificationDeadline = breach.notification_deadline
        ? new Date(breach.notification_deadline)
        : null
      const hoursToDeadline = notificationDeadline
        ? Math.ceil((notificationDeadline.getTime() - now.getTime()) / (1000 * 60 * 60))
        : null

      return {
        id: breach.id,
        breachNumber: breach.breach_number,
        breachType: breach.breach_type,
        severity: breach.severity,
        discoveredAt: breach.discovered_at,
        reportedInternallyAt: breach.reported_internally_at,
        reportedExternallyAt: breach.reported_externally_at,
        affectedUserCount: breach.affected_user_count,
        affectedCaliforniaResidents: breach.affected_california_residents,
        dataTypesExposed: breach.data_types_exposed,
        sensitiveDataExposed: breach.sensitive_data_exposed,
        impactDescription: breach.impact_description,
        rootCause: breach.root_cause,
        attackVector: breach.attack_vector,
        systemsCompromised: breach.systems_compromised,
        containedAt: breach.contained_at,
        containmentActions: breach.containment_actions,
        remediationStatus: breach.remediation_status,
        remediationNotes: breach.remediation_notes,
        notificationRequired: breach.notification_required,
        notificationDeadline: breach.notification_deadline,
        hoursToDeadline,
        userNotificationSent: breach.user_notification_sent,
        userNotificationSentAt: breach.user_notification_sent_at,
        userNotificationMethod: breach.user_notification_method,
        californiaAgNotified: breach.california_ag_notified,
        californiaAgNotifiedAt: breach.california_ag_notified_at,
        otherRegulatorsNotified: breach.other_regulators_notified,
        lawEnforcementNotified: breach.law_enforcement_notified,
        lawEnforcementAgency: breach.law_enforcement_agency,
        lawEnforcementCaseNumber: breach.law_enforcement_case_number,
        cyberInsuranceClaimFiled: breach.cyber_insurance_claim_filed,
        cyberInsuranceClaimNumber: breach.cyber_insurance_claim_number,
        postIncidentReviewCompleted: breach.post_incident_review_completed,
        postIncidentReviewDate: breach.post_incident_review_date,
        lessonsLearned: breach.lessons_learned,
        preventiveMeasures: breach.preventive_measures,
        metadata: breach.metadata ?? {},
        createdAt: breach.created_at,
        updatedAt: breach.updated_at,
        createdByUserId: breach.created_by_user_id,
      }
    }),

  /**
   * Create a new breach incident
   */
  createBreach: protectedProcedure
    .input(
      z.object({
        breachType: z.enum([
          'unauthorized_access',
          'data_exfiltration',
          'ransomware',
          'insider_threat',
          'lost_device',
          'misconfiguration',
          'third_party_breach',
          'other',
        ]),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        discoveredAt: z.string().datetime(),
        affectedUserCount: z.number().int().nonnegative(),
        affectedCaliforniaResidents: z.number().int().nonnegative(),
        dataTypesExposed: z.array(z.string()),
        sensitiveDataExposed: z.boolean(),
        impactDescription: z.string().optional(),
        rootCause: z.string().optional(),
        notificationRequired: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = ctx.supabase

      const { data: breach, error } = await supabase
        .from('breach_notifications')
        .insert({
          breach_type: input.breachType,
          severity: input.severity,
          discovered_at: input.discoveredAt,
          affected_user_count: input.affectedUserCount,
          affected_california_residents: input.affectedCaliforniaResidents,
          data_types_exposed: input.dataTypesExposed,
          sensitive_data_exposed: input.sensitiveDataExposed,
          impact_description: input.impactDescription,
          root_cause: input.rootCause,
          notification_required: input.notificationRequired,
          remediation_status: 'not_started',
          created_by_user_id: ctx.user?.id,
        })
        .select('id, breach_number')
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create breach: ${error.message}`,
        })
      }

      return {
        id: breach?.id,
        breachNumber: breach?.breach_number,
        message: 'Breach incident created successfully',
      }
    }),

  /**
   * Update breach incident
   */
  updateBreach: protectedProcedure
    .input(
      z.object({
        breachId: z.string().uuid(),
        remediationStatus: z
          .enum(['not_started', 'in_progress', 'completed', 'ongoing_monitoring'])
          .optional(),
        remediationNotes: z.string().optional(),
        containedAt: z.string().datetime().optional(),
        containmentActions: z.string().optional(),
        userNotificationSent: z.boolean().optional(),
        userNotificationMethod: z.string().optional(),
        californiaAgNotified: z.boolean().optional(),
        lawEnforcementNotified: z.boolean().optional(),
        lawEnforcementAgency: z.string().optional(),
        lessonsLearned: z.string().optional(),
        preventiveMeasures: z.string().optional(),
        postIncidentReviewCompleted: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { breachId, ...updateFields } = input
      const supabase = ctx.supabase

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        last_modified_by_user_id: ctx.user?.id,
      }

      if (updateFields.remediationStatus) {
        updateData.remediation_status = updateFields.remediationStatus
      }
      if (updateFields.remediationNotes) {
        updateData.remediation_notes = updateFields.remediationNotes
      }
      if (updateFields.containedAt) {
        updateData.contained_at = updateFields.containedAt
      }
      if (updateFields.containmentActions) {
        updateData.containment_actions = updateFields.containmentActions
      }
      if (updateFields.userNotificationSent !== undefined) {
        updateData.user_notification_sent = updateFields.userNotificationSent
        if (updateFields.userNotificationSent) {
          updateData.user_notification_sent_at = new Date().toISOString()
        }
      }
      if (updateFields.userNotificationMethod) {
        updateData.user_notification_method = updateFields.userNotificationMethod
      }
      if (updateFields.californiaAgNotified !== undefined) {
        updateData.california_ag_notified = updateFields.californiaAgNotified
        if (updateFields.californiaAgNotified) {
          updateData.california_ag_notified_at = new Date().toISOString()
        }
      }
      if (updateFields.lawEnforcementNotified !== undefined) {
        updateData.law_enforcement_notified = updateFields.lawEnforcementNotified
      }
      if (updateFields.lawEnforcementAgency) {
        updateData.law_enforcement_agency = updateFields.lawEnforcementAgency
      }
      if (updateFields.lessonsLearned) {
        updateData.lessons_learned = updateFields.lessonsLearned
      }
      if (updateFields.preventiveMeasures) {
        updateData.preventive_measures = updateFields.preventiveMeasures
      }
      if (updateFields.postIncidentReviewCompleted !== undefined) {
        updateData.post_incident_review_completed = updateFields.postIncidentReviewCompleted
        if (updateFields.postIncidentReviewCompleted) {
          updateData.post_incident_review_date = new Date().toISOString()
        }
      }

      const { error } = await supabase
        .from('breach_notifications')
        .update(updateData)
        .eq('id', breachId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update breach: ${error.message}`,
        })
      }

      return {
        id: breachId,
        message: 'Breach incident updated successfully',
      }
    }),

  // =====================================================
  // Audit Log Endpoints (TASK-7)
  // =====================================================

  /**
   * List CCPA-related audit log entries
   */
  listAuditLogs: protectedProcedure
    .input(
      z
        .object({
          category: z
            .enum([
              'authentication',
              'authorization',
              'data_access',
              'data_modification',
              'admin',
              'security',
              'compliance',
              'system',
            ])
            .optional(),
          severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
          action: z.string().optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          limit: z.number().int().positive().max(200).default(50),
          offset: z.number().int().nonnegative().default(0),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const { category, severity, action, startDate, endDate, limit = 50, offset = 0 } = input ?? {}

      const supabase = ctx.supabase

      // Filter to CCPA-related categories only
      const ccpaCategories = ['compliance', 'security', 'data_access', 'data_modification']

      let query = supabase
        .from('audit_log')
        .select(
          'id, created_at, category, action, severity, user_id, record_id, resource_type, resource_name, table_name, operation, status, error_message, metadata, ip_address',
          { count: 'exact' }
        )
        .in('category', category ? [category] : ccpaCategories)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (severity) {
        query = query.eq('severity', severity)
      }

      if (action) {
        query = query.ilike('action', `%${action}%`)
      }

      if (startDate) {
        query = query.gte('created_at', startDate)
      }

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load audit logs: ${error.message}`,
        })
      }

      const items = (data ?? []).map((log) => ({
        id: log.id,
        createdAt: log.created_at,
        category: log.category,
        action: log.action,
        severity: log.severity,
        userId: log.user_id,
        recordId: log.record_id,
        resourceType: log.resource_type,
        resourceName: log.resource_name,
        tableName: log.table_name,
        operation: log.operation,
        status: log.status,
        errorMessage: log.error_message,
        metadata: log.metadata ?? {},
        ipAddress: log.ip_address,
      }))

      return {
        items,
        totalCount: count ?? 0,
        limit,
        offset,
      }
    }),

  // =====================================================
  // Bulk Operations Endpoints (TASK-10)
  // =====================================================

  /**
   * Bulk update request status with validation
   */
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        requestIds: z.array(z.string().uuid()).min(1).max(50),
        newStatus: CCPAStatusEnum,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { requestIds, newStatus, notes } = input

      const results: Array<{ id: string; success: boolean; error?: string }> = []

      // Valid status transitions
      const validTransitions: Record<string, string[]> = {
        pending: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'denied', 'cancelled'],
        completed: [], // Terminal state
        denied: [], // Terminal state
        cancelled: [], // Terminal state
      }

      for (const requestId of requestIds) {
        try {
          // Get current request status
          const { data: request, error: fetchError } = await core('ccpa_requests')
            .select('id, status')
            .eq('id', requestId)
            .single()

          if (fetchError || !request) {
            results.push({
              id: requestId,
              success: false,
              error: 'Request not found',
            })
            continue
          }

          const currentStatus = request.status as string
          const allowedTransitions = validTransitions[currentStatus] ?? []

          if (!allowedTransitions.includes(newStatus)) {
            results.push({
              id: requestId,
              success: false,
              error: `Cannot transition from ${currentStatus} to ${newStatus}`,
            })
            continue
          }

          // Update the request
          const updateData: Record<string, unknown> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          }

          if (newStatus === 'completed') {
            updateData.completed_at = new Date().toISOString()
          }

          const { error: updateError } = await core('ccpa_requests')
            .update(updateData)
            .eq('id', requestId)

          if (updateError) {
            results.push({
              id: requestId,
              success: false,
              error: updateError.message,
            })
            continue
          }

          // Add history entry
          await core('ccpa_request_history').insert({
            request_id: requestId,
            status: newStatus,
            changed_by: ctx.user?.id,
            notes: notes ?? `Bulk status change to ${newStatus}`,
          })

          results.push({ id: requestId, success: true })
        } catch (err) {
          results.push({
            id: requestId,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      }

      const successCount = results.filter((r) => r.success).length
      const failedCount = results.filter((r) => !r.success).length

      return {
        results,
        summary: {
          total: requestIds.length,
          success: successCount,
          failed: failedCount,
          message:
            failedCount === 0
              ? `Successfully updated ${successCount} request(s)`
              : `Updated ${successCount} request(s), ${failedCount} failed`,
        },
      }
    }),

  /**
   * Bulk assign requests to a staff member
   */
  bulkAssign: protectedProcedure
    .input(
      z.object({
        requestIds: z.array(z.string().uuid()).min(1).max(50),
        assigneeId: z.string().uuid(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { requestIds, assigneeId, notes } = input

      const results: Array<{ id: string; success: boolean; error?: string }> = []

      for (const requestId of requestIds) {
        try {
          const { error: updateError } = await core('ccpa_requests')
            .update({
              metadata: {
                assigned_to: assigneeId,
                assigned_at: new Date().toISOString(),
                assigned_by: ctx.user?.id,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', requestId)

          if (updateError) {
            results.push({
              id: requestId,
              success: false,
              error: updateError.message,
            })
            continue
          }

          // Add history entry
          await core('ccpa_request_history').insert({
            request_id: requestId,
            status: 'in_progress',
            changed_by: ctx.user?.id,
            notes: notes ?? `Assigned to ${assigneeId}`,
          })

          results.push({ id: requestId, success: true })
        } catch (err) {
          results.push({
            id: requestId,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      }

      const successCount = results.filter((r) => r.success).length
      const failedCount = results.filter((r) => !r.success).length

      return {
        results,
        summary: {
          total: requestIds.length,
          success: successCount,
          failed: failedCount,
          message:
            failedCount === 0
              ? `Successfully assigned ${successCount} request(s)`
              : `Assigned ${successCount} request(s), ${failedCount} failed`,
        },
      }
    }),

  /**
   * Get audit log statistics
   */
  getAuditStats: protectedProcedure
    .input(
      z
        .object({
          days: z.number().int().positive().max(365).default(30),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const days = input?.days ?? 30
      const supabase = ctx.supabase

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get counts by category
      const { data: logs, error } = await supabase
        .from('audit_log')
        .select('category, severity, status')
        .gte('created_at', startDate.toISOString())

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load audit stats: ${error.message}`,
        })
      }

      const allLogs = logs ?? []

      // Calculate statistics
      const categoryBreakdown: Record<string, number> = {}
      const severityBreakdown: Record<string, number> = {}
      let failedCount = 0
      let securityEvents = 0

      for (const log of allLogs) {
        categoryBreakdown[log.category] = (categoryBreakdown[log.category] ?? 0) + 1
        severityBreakdown[log.severity] = (severityBreakdown[log.severity] ?? 0) + 1

        if (log.status === 'failure' || log.status === 'denied') {
          failedCount++
        }

        if (log.category === 'security' || log.severity === 'critical') {
          securityEvents++
        }
      }

      return {
        totalEvents: allLogs.length,
        failedEvents: failedCount,
        securityEvents,
        categoryBreakdown,
        severityBreakdown,
        periodDays: days,
      }
    }),

  /**
   * Get team members who can be assigned to CCPA requests
   * Returns list of users with CCPA admin or compliance roles
   */
  getTeamMembers: protectedProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase

    // Query users who can handle CCPA requests
    // In a real implementation, this would check for specific roles/permissions
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .order('first_name', { ascending: true })
      .limit(100)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load team members: ${error.message}`,
      })
    }

    return (users ?? []).map((user) => ({
      id: user.id,
      email: user.email ?? '',
      name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Unknown',
    }))
  }),

  /**
   * Get current user's CCPA access level and permissions
   * Returns role and owned app IDs for permission checks
   */
  getCurrentUserAccess: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id
    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      })
    }

    const supabase = ctx.supabase

    // Check if user has a CCPA-specific role assignment
    // For now, we'll derive the role from the user's general role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    // Map user role to CCPA role
    let ccpaRole: 'global_admin' | 'compliance_admin' | 'app_owner' | 'auditor' = 'auditor'
    const userRole = userData.role?.toLowerCase() ?? ''

    if (userRole === 'admin' || userRole === 'super_admin') {
      ccpaRole = 'global_admin'
    } else if (userRole === 'compliance' || userRole === 'compliance_admin') {
      ccpaRole = 'compliance_admin'
    } else if (userRole === 'app_owner' || userRole === 'owner') {
      ccpaRole = 'app_owner'
    }

    // Get owned app IDs for app_owner role
    let ownedAppIds: string[] = []
    if (ccpaRole === 'app_owner') {
      const { data: ownedApps } = await supabase
        .from('oauth_apps')
        .select('id')
        .eq('owner_id', userId)

      ownedAppIds = ownedApps?.map((app) => app.id) ?? []
    }

    return {
      userId,
      role: ccpaRole,
      ownedAppIds,
      email: userData.email,
    }
  }),

  /**
   * Get SLA alerts for CCPA requests approaching deadlines
   * Returns requests that are approaching deadline, overdue, or escalated
   */
  getSLAAlerts: protectedProcedure.query(async () => {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Get all active requests with deadlines within 7 days or overdue
    const { data: requests, error } = await core('ccpa_requests')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .lte('deadline_at', sevenDaysFromNow.toISOString())
      .order('deadline_at', { ascending: true })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load SLA alerts: ${error.message}`,
      })
    }

    const allRequests = requests ?? []

    // Calculate alerts
    const alerts = {
      escalated: [] as typeof allRequests,
      overdue: [] as typeof allRequests,
      urgent: [] as typeof allRequests,
      approaching: [] as typeof allRequests,
    }

    for (const request of allRequests) {
      const deadline = new Date(request.extended_deadline_at ?? request.deadline_at)
      const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysRemaining < -5) {
        alerts.escalated.push(request)
      } else if (daysRemaining < 0) {
        alerts.overdue.push(request)
      } else if (daysRemaining <= 3) {
        alerts.urgent.push(request)
      } else if (daysRemaining <= 7) {
        alerts.approaching.push(request)
      }
    }

    return {
      escalatedCount: alerts.escalated.length,
      overdueCount: alerts.overdue.length,
      urgentCount: alerts.urgent.length,
      approachingCount: alerts.approaching.length,
      totalAlerts:
        alerts.escalated.length +
        alerts.overdue.length +
        alerts.urgent.length +
        alerts.approaching.length,
      escalated: alerts.escalated.slice(0, 5), // Return top 5 of each for display
      overdue: alerts.overdue.slice(0, 5),
      urgent: alerts.urgent.slice(0, 5),
      approaching: alerts.approaching.slice(0, 5),
    }
  }),
})

/**
 * Calculate priority based on days remaining
 */
function calculatePriority(
  daysRemaining: number,
  status: string
): 'low' | 'medium' | 'high' | 'urgent' {
  if (!['pending', 'in_progress'].includes(status)) {
    return 'low'
  }

  if (daysRemaining < 0) return 'urgent' // Overdue
  if (daysRemaining <= 7) return 'urgent' // Less than 7 days
  if (daysRemaining <= 14) return 'high' // Less than 14 days
  if (daysRemaining <= 30) return 'medium' // Less than 30 days
  return 'low'
}
