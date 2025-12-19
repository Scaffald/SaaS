/**
 * CCPA Request Processing Orchestrator
 *
 * Orchestrates the complete lifecycle of CCPA requests:
 * 1. Verify request is ready for processing
 * 2. Collect core platform data
 * 3. Notify OAuth apps and collect their contributions
 * 4. Aggregate all data
 * 5. Generate export (delegates to PDF generator)
 * 6. Finalize and notify user
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../_shared/database.types';
import { collectCoreUserData } from './data-collector';
import type { UserDataExport, CollectionResult } from './types';
import { insertNotification } from '../../../_shared/notifications/utils';

type DbClient = SupabaseClient<Database>

// Processing configuration
const OAUTH_WEBHOOK_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
const OAUTH_CONTRIBUTION_WAIT_MS = 30 * 60 * 1000 // 30 minutes
const OAUTH_POLL_INTERVAL_MS = 30 * 1000 // 30 seconds

/**
 * Processing stages for progress tracking
 */
export type ProcessingStage =
  | 'initializing'
  | 'collecting_core_data'
  | 'notifying_oauth_apps'
  | 'waiting_for_contributions'
  | 'aggregating_data'
  | 'generating_export'
  | 'finalizing'
  | 'completed'
  | 'failed'

/**
 * Processing result with detailed status
 */
export interface ProcessingResult {
  success: boolean
  requestId: string
  stage: ProcessingStage
  coreDataCollected: boolean
  oauthAppsNotified: number
  oauthAppsContributed: number
  totalRecords: number
  errors: Array<{ source: string; error: string; stage: string }>
  completedAt: string | null
}

/**
 * OAuth app contribution tracking
 */
interface OAuthAppContribution {
  appId: string
  appName: string
  contributedAt: string | null
  categories: string[]
  dataSize: number
  status: 'pending' | 'received' | 'timeout' | 'error'
  error?: string
}

/**
 * Update request progress in metadata
 */
async function updateProgress(
  supabase: DbClient,
  requestId: string,
  stage: ProcessingStage,
  additionalData?: Record<string, unknown>
): Promise<void> {
  const { data: request } = await supabase
    .schema('core')
    .from('ccpa_requests')
    .select('metadata')
    .eq('id', requestId)
    .single()

  const existingMetadata = (request?.metadata as Record<string, unknown>) ?? {}

  await supabase
    .schema('core')
    .from('ccpa_requests')
    .update({
      metadata: {
        ...existingMetadata,
        processing: {
          ...(existingMetadata.processing as Record<string, unknown> | undefined),
          stage,
          updated_at: new Date().toISOString(),
          ...additionalData,
        },
      },
    })
    .eq('id', requestId)
}

/**
 * Log processing event to history
 */
async function logProcessingEvent(
  supabase: DbClient,
  requestId: string,
  status: string,
  notes: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await supabase
    .schema('core')
    .from('ccpa_request_history')
    .insert({
      request_id: requestId,
      status,
      notes,
      metadata,
    })
}

/**
 * Get registered OAuth apps
 */
async function getRegisteredOAuthApps(
  supabase: DbClient
): Promise<Array<{ app_id: string; app_name: string; webhook_url: string; data_categories: unknown[] }>> {
  const { data, error } = await supabase
    .schema('core')
    .from('ccpa_oauth_app_registry')
    .select('app_id, app_name, webhook_url, data_categories')
    .eq('is_active', true)

  if (error) {
    console.error('[request-processor] Failed to fetch OAuth apps:', error)
    return []
  }

  return data ?? []
}

/**
 * Send webhook to OAuth app
 */
async function sendOAuthWebhook(
  app: { app_id: string; app_name: string; webhook_url: string },
  requestId: string,
  userId: string,
  requestType: string
): Promise<{ success: boolean; error?: string }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OAUTH_WEBHOOK_TIMEOUT_MS)

  try {
    const response = await fetch(app.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CCPA-Event': 'export.requested',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify({
        event: 'ccpa.export.requested',
        requestId,
        userId,
        requestType,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    return { success: true }
  } catch (error) {
    clearTimeout(timeoutId)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Notify all OAuth apps and track their status
 */
async function notifyOAuthApps(
  supabase: DbClient,
  requestId: string,
  userId: string,
  requestType: string
): Promise<OAuthAppContribution[]> {
  const apps = await getRegisteredOAuthApps(supabase)
  const contributions: OAuthAppContribution[] = []

  // Send webhooks in parallel
  const webhookPromises = apps.map(async (app) => {
    const result = await sendOAuthWebhook(app, requestId, userId, requestType)

    const contribution: OAuthAppContribution = {
      appId: app.app_id,
      appName: app.app_name,
      contributedAt: null,
      categories: [],
      dataSize: 0,
      status: result.success ? 'pending' : 'error',
      error: result.error,
    }

    return contribution
  })

  const results = await Promise.allSettled(webhookPromises)

  for (const result of results) {
    if (result.status === 'fulfilled') {
      contributions.push(result.value)
    }
  }

  return contributions
}

/**
 * Wait for OAuth apps to contribute data
 */
async function waitForOAuthContributions(
  supabase: DbClient,
  requestId: string,
  expectedApps: OAuthAppContribution[]
): Promise<OAuthAppContribution[]> {
  const startTime = Date.now()
  const pendingApps = expectedApps.filter((app) => app.status === 'pending')

  if (pendingApps.length === 0) {
    return expectedApps
  }

  while (Date.now() - startTime < OAUTH_CONTRIBUTION_WAIT_MS) {
    // Get current request metadata to check for contributions
    const { data: request } = await supabase
      .schema('core')
      .from('ccpa_requests')
      .select('metadata')
      .eq('id', requestId)
      .single()

    const metadata = request?.metadata as Record<string, unknown>
    const contributions = metadata?.oauth_app_contributions as Record<string, unknown> | undefined

    if (contributions) {
      // Update contribution status
      for (const app of pendingApps) {
        const appContribution = contributions[app.appId] as {
          contributed_at: string
          categories: string[]
          data_size: number
        } | undefined

        if (appContribution && app.status === 'pending') {
          app.status = 'received'
          app.contributedAt = appContribution.contributed_at
          app.categories = appContribution.categories ?? []
          app.dataSize = appContribution.data_size ?? 0
        }
      }
    }

    // Check if all pending apps have contributed
    const stillPending = pendingApps.filter((app) => app.status === 'pending')
    if (stillPending.length === 0) {
      break
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, OAUTH_POLL_INTERVAL_MS))
  }

  // Mark remaining pending apps as timeout
  for (const app of pendingApps) {
    if (app.status === 'pending') {
      app.status = 'timeout'
      app.error = 'App did not respond within 30 minutes'
    }
  }

  return expectedApps
}

/**
 * Aggregate core data with OAuth app contributions
 */
async function aggregateAllData(
  coreData: UserDataExport | null,
  oauthContributions: OAuthAppContribution[],
  _requestId: string,
  _supabase: DbClient
): Promise<UserDataExport | null> {
  if (!coreData) {
    return null
  }

  // Enhance metadata with OAuth app information
  const successfulContributions = oauthContributions.filter(
    (c) => c.status === 'received'
  )

  const enhancedData: UserDataExport = {
    ...coreData,
    metadata: {
      ...coreData.metadata,
      oauthApps: {
        notified: oauthContributions.length,
        contributed: successfulContributions.length,
        apps: successfulContributions.map((c) => ({
          appId: c.appId,
          appName: c.appName,
          contributedAt: c.contributedAt,
          categories: c.categories,
        })),
      },
    },
  }

  return enhancedData
}

/**
 * Finalize the request after successful processing
 */
async function finalizeRequest(
  supabase: DbClient,
  requestId: string,
  result: ProcessingResult,
  adminUserId?: string
): Promise<void> {
  const now = new Date().toISOString()

  await supabase
    .schema('core')
    .from('ccpa_requests')
    .update({
      status: result.success ? 'completed' : 'in_progress',
      completed_at: result.success ? now : null,
    })
    .eq('id', requestId)

  await logProcessingEvent(
    supabase,
    requestId,
    result.success ? 'completed' : 'in_progress',
    result.success
      ? `Request completed. ${result.totalRecords} records collected.`
      : `Processing encountered errors. Stage: ${result.stage}`,
    {
      oauth_apps_notified: result.oauthAppsNotified,
      oauth_apps_contributed: result.oauthAppsContributed,
      total_records: result.totalRecords,
      errors: result.errors,
    }
  )

  // Notify compliance admin if there were errors
  if (!result.success && adminUserId) {
    await insertNotification(
      supabase,
      {
        user_id: adminUserId,
        title: 'CCPA Request Processing Error',
        message: `Request ${requestId.slice(0, 8)} encountered errors during processing. Manual review may be required.`,
        type: 'ccpa_processing_error',
        severity: 'warning',
        metadata: {
          request_id: requestId,
          stage: result.stage,
          errors: result.errors,
        },
        cta_label: 'View Request',
        cta_url: `/office/privacy?request=${requestId}`,
      },
      `ccpa_processing_error_${requestId}`
    )
  }
}

/**
 * Main request processing orchestrator
 *
 * Processes a verified CCPA request through all stages:
 * 1. Validate request state
 * 2. Collect core platform data
 * 3. Notify OAuth apps
 * 4. Wait for contributions
 * 5. Aggregate data
 * 6. Finalize request
 */
export async function processRequest(
  supabase: DbClient,
  supabaseAdmin: DbClient,
  requestId: string,
  adminUserId?: string
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    success: false,
    requestId,
    stage: 'initializing',
    coreDataCollected: false,
    oauthAppsNotified: 0,
    oauthAppsContributed: 0,
    totalRecords: 0,
    errors: [],
    completedAt: null,
  }

  try {
    // 1. Validate request is ready for processing
    await updateProgress(supabaseAdmin, requestId, 'initializing', {
      started_at: new Date().toISOString(),
    })

    const { data: request, error: fetchError } = await supabaseAdmin
      .schema('core')
      .from('ccpa_requests')
      .select('id, user_id, request_type, status, verification_completed_at')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      result.errors.push({
        source: 'orchestrator',
        error: 'Request not found',
        stage: 'initializing',
      })
      return result
    }

    if (request.status !== 'in_progress') {
      result.errors.push({
        source: 'orchestrator',
        error: `Request is not in 'in_progress' status. Current: ${request.status}`,
        stage: 'initializing',
      })
      return result
    }

    // 2. Collect core platform data
    result.stage = 'collecting_core_data'
    await updateProgress(supabaseAdmin, requestId, 'collecting_core_data')
    await logProcessingEvent(supabaseAdmin, requestId, 'in_progress', 'Collecting core platform data')

    let coreData: CollectionResult
    try {
      coreData = await collectCoreUserData(supabase, request.user_id, supabaseAdmin)
      result.coreDataCollected = coreData.success
      result.totalRecords = coreData.data?.metadata.totalRecords ?? 0

      if (coreData.errors.length > 0) {
        for (const err of coreData.errors) {
          result.errors.push({
            source: err.source,
            error: err.error,
            stage: 'collecting_core_data',
          })
        }
      }
    } catch (error) {
      result.errors.push({
        source: 'data_collector',
        error: error instanceof Error ? error.message : 'Unknown error',
        stage: 'collecting_core_data',
      })
      coreData = { success: false, data: null, errors: [] }
    }

    // Store core data in metadata
    if (coreData.data) {
      const { data: currentRequest } = await supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('metadata')
        .eq('id', requestId)
        .single()

      const existingMetadata = (currentRequest?.metadata as Record<string, unknown>) ?? {}

      await supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .update({
          metadata: {
            ...existingMetadata,
            core_data_collected: true,
            core_data_records: coreData.data.metadata.totalRecords,
            core_data_size: coreData.data.metadata.approximateSizeBytes,
          },
        })
        .eq('id', requestId)
    }

    // 3. Notify OAuth apps
    result.stage = 'notifying_oauth_apps'
    await updateProgress(supabaseAdmin, requestId, 'notifying_oauth_apps')
    await logProcessingEvent(supabaseAdmin, requestId, 'in_progress', 'Notifying registered OAuth apps')

    const oauthContributions = await notifyOAuthApps(
      supabaseAdmin,
      requestId,
      request.user_id,
      request.request_type
    )
    result.oauthAppsNotified = oauthContributions.length

    // Log webhook results
    for (const contrib of oauthContributions) {
      if (contrib.status === 'error') {
        result.errors.push({
          source: `oauth_app:${contrib.appId}`,
          error: contrib.error ?? 'Webhook failed',
          stage: 'notifying_oauth_apps',
        })
      }
    }

    // 4. Wait for OAuth contributions (if any apps were notified)
    if (oauthContributions.some((c) => c.status === 'pending')) {
      result.stage = 'waiting_for_contributions'
      await updateProgress(supabaseAdmin, requestId, 'waiting_for_contributions')
      await logProcessingEvent(
        supabaseAdmin,
        requestId,
        'in_progress',
        `Waiting for ${oauthContributions.filter((c) => c.status === 'pending').length} OAuth apps to contribute data`
      )

      await waitForOAuthContributions(supabaseAdmin, requestId, oauthContributions)
    }

    result.oauthAppsContributed = oauthContributions.filter(
      (c) => c.status === 'received'
    ).length

    // Log timeout errors
    for (const contrib of oauthContributions) {
      if (contrib.status === 'timeout') {
        result.errors.push({
          source: `oauth_app:${contrib.appId}`,
          error: contrib.error ?? 'Contribution timeout',
          stage: 'waiting_for_contributions',
        })
      }
    }

    // 5. Aggregate all data
    result.stage = 'aggregating_data'
    await updateProgress(supabaseAdmin, requestId, 'aggregating_data')
    await logProcessingEvent(supabaseAdmin, requestId, 'in_progress', 'Aggregating collected data')

    const aggregatedData = await aggregateAllData(
      coreData.data,
      oauthContributions,
      requestId,
      supabaseAdmin
    )

    if (aggregatedData) {
      result.totalRecords = aggregatedData.metadata.totalRecords
    }

    // 6. Store aggregated data for export generation
    // Note: PDF generation and S3 upload are handled by separate tasks (7, 8)
    if (aggregatedData) {
      const { data: currentRequest } = await supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .select('metadata')
        .eq('id', requestId)
        .single()

      const existingMetadata = (currentRequest?.metadata as Record<string, unknown>) ?? {}

      await supabaseAdmin
        .schema('core')
        .from('ccpa_requests')
        .update({
          metadata: {
            ...existingMetadata,
            aggregated_data: {
              total_records: aggregatedData.metadata.totalRecords,
              size_bytes: aggregatedData.metadata.approximateSizeBytes,
              data_sources: aggregatedData.metadata.dataSources.length,
              collected_at: new Date().toISOString(),
            },
            // Store the actual data (will be consumed by export generator)
            export_data: aggregatedData,
          },
        })
        .eq('id', requestId)
    }

    // 7. Finalize
    result.stage = 'finalizing'
    await updateProgress(supabaseAdmin, requestId, 'finalizing')

    result.success = coreData.success
    result.completedAt = new Date().toISOString()
    result.stage = result.success ? 'completed' : 'failed'

    await finalizeRequest(supabaseAdmin, requestId, result, adminUserId)

    return result
  } catch (error) {
    result.errors.push({
      source: 'orchestrator',
      error: error instanceof Error ? error.message : 'Unknown error',
      stage: result.stage,
    })
    result.stage = 'failed'

    await updateProgress(supabaseAdmin, requestId, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      failed_at: new Date().toISOString(),
    })

    await logProcessingEvent(
      supabaseAdmin,
      requestId,
      'in_progress',
      `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { stage: result.stage }
    )

    return result
  }
}

/**
 * Get current processing status for a request
 */
export async function getProcessingStatus(
  supabase: DbClient,
  requestId: string
): Promise<{
  stage: ProcessingStage
  startedAt: string | null
  updatedAt: string | null
  errors: Array<{ source: string; error: string }>
} | null> {
  const { data: request, error } = await supabase
    .schema('core')
    .from('ccpa_requests')
    .select('metadata')
    .eq('id', requestId)
    .single()

  if (error || !request) {
    return null
  }

  const metadata = request.metadata as Record<string, unknown>
  const processing = metadata?.processing as {
    stage: ProcessingStage
    started_at: string
    updated_at: string
  } | undefined

  return {
    stage: processing?.stage ?? 'initializing',
    startedAt: processing?.started_at ?? null,
    updatedAt: processing?.updated_at ?? null,
    errors: [],
  }
}

/**
 * Retry a failed request processing
 */
export async function retryProcessing(
  supabase: DbClient,
  supabaseAdmin: DbClient,
  requestId: string,
  adminUserId?: string
): Promise<ProcessingResult> {
  // Reset processing metadata
  const { data: request } = await supabaseAdmin
    .schema('core')
    .from('ccpa_requests')
    .select('metadata')
    .eq('id', requestId)
    .single()

  const existingMetadata = (request?.metadata as Record<string, unknown>) ?? {}

  await supabaseAdmin
    .schema('core')
    .from('ccpa_requests')
    .update({
      status: 'in_progress',
      completed_at: null,
      metadata: {
        ...existingMetadata,
        processing: {
          stage: 'initializing',
          retry_count: ((existingMetadata.processing as Record<string, unknown>)?.retry_count as number ?? 0) + 1,
          retry_at: new Date().toISOString(),
        },
      },
    })
    .eq('id', requestId)

  await logProcessingEvent(
    supabaseAdmin,
    requestId,
    'in_progress',
    'Retrying request processing'
  )

  return processRequest(supabase, supabaseAdmin, requestId, adminUserId)
}
