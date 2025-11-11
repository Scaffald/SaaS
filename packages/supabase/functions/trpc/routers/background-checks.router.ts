import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
  BACKGROUND_CHECK_ALLOWED_MIME_TYPES,
  backgroundCheckDisputeSchema,
  backgroundCheckDocumentUploadSchema,
  backgroundCheckInitiationSchema,
  backgroundCheckStatusEnum,
  backgroundCheckUploadRequestSchema,
} from '../../_shared/background-check-schemas.ts'
import {
  notifyBackgroundCheckInvitation,
  notifyBackgroundCheckStatusChange,
} from '../../_shared/background-check-notifications.ts'
import {
  createNationSearchClient,
  isNationSearchOutageError,
  type CheckStatusResponse,
} from '../../_shared/nationsearch/client.ts'
import {
  appendStatusHistory,
  BackgroundCheckStatus,
  BACKGROUND_CHECK_BASE_COLUMNS,
  BACKGROUND_CHECK_SYNC_COLUMNS,
  mapProviderStatus,
  mergeMetadata,
  shouldSyncStatus,
} from '../../_shared/background-check-status.ts'
import type { Context } from '../context.ts'
import { officeProcedure, protectedProcedure, publicProcedure, t } from '../middleware.ts'

const listPackagesOutputSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  display_name: z.string(),
  description: z.string().nullable(),
  provider_package_code: z.string().nullable(),
  platform_cost_cents: z.number(),
  retail_cost_cents: z.number(),
  estimated_completion_days: z.number().nullable(),
  metadata: z.record(z.unknown()).default({}),
  components: z.array(
    z.object({
      id: z.string().uuid(),
      slug: z.string(),
      display_name: z.string(),
      description: z.string().nullable(),
      category: z.string().nullable(),
      validity_days: z.number().nullable(),
      estimated_completion_days: z.number().nullable(),
    }),
  ),
})

const listChecksOutputSchema = z.object({
  id: z.string().uuid(),
  status: backgroundCheckStatusEnum,
  package: z.object({
    id: z.string().uuid().nullable(),
    display_name: z.string().nullable(),
    slug: z.string().nullable(),
  }),
  completed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable(),
  invited_at: z.string().datetime().nullable(),
  provider_check_id: z.string().nullable(),
  findings: z.record(z.unknown()).nullable(),
  metadata: z.record(z.unknown()).nullable(),
})

const getCheckOutputSchema = z.object({
  check: z.object({
    id: z.string().uuid(),
    status: backgroundCheckStatusEnum,
    status_history: z.array(z.record(z.unknown())).default([]),
    package_id: z.string().uuid().nullable(),
    check_type_ids: z.array(z.string().uuid()),
    provider_check_id: z.string().nullable(),
    summary: z.string().nullable(),
    findings: z.record(z.unknown()).nullable(),
    component_statuses: z.array(z.record(z.unknown())).default([]),
    metadata: z.record(z.unknown()).nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    expires_at: z.string().datetime().nullable(),
    estimated_completion_date: z.string().date().nullable(),
  }),
  documents: z.array(
    z.object({
      id: z.string().uuid(),
      document_type: z.string(),
      file_path: z.string(),
      file_name: z.string(),
      file_size: z.number().nullable(),
      mime_type: z.string().nullable(),
      uploaded_at: z.string().datetime(),
      verified: z.boolean(),
    }),
  ),
})

const BACKGROUND_CHECK_BUCKET_ID = 'background-check-documents'
const SIGNED_UPLOAD_URL_TTL_SECONDS = 60 * 5
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName.replace(/[^A-Za-z0-9._-]/g, '_')
  return cleaned.length > 255 ? cleaned.slice(cleaned.length - 255) : cleaned
}

function buildDocumentStoragePath(userId: string, backgroundCheckId: string, fileName: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const sanitizedFileName = sanitizeFileName(fileName)
  return `${userId}/${backgroundCheckId}/${timestamp}-${sanitizedFileName}`
}

type BackgroundCheckRecord = {
  id: string
  status: BackgroundCheckStatus
  status_history?: unknown
  provider_check_id?: string | null
  metadata?: unknown
  summary?: string | null
  findings?: unknown
  component_statuses?: unknown
  completed_at?: string | null
  expires_at?: string | null
  estimated_completion_date?: string | null
}

async function syncBackgroundCheckFromProvider(params: {
  nationSearch: ReturnType<typeof createNationSearchClient>
  supabaseAdmin: Context['supabaseAdmin']
  check: BackgroundCheckRecord
}): Promise<BackgroundCheckRecord | null> {
  const { nationSearch, supabaseAdmin, check } = params

  if (!check.provider_check_id || !shouldSyncStatus(check.status)) {
    return null
  }

  try {
    const providerStatus = (await nationSearch.fetchCheckStatus(check.provider_check_id)) as CheckStatusResponse

    const updates: Record<string, unknown> = {}
    let history = Array.isArray(check.status_history) ? [...(check.status_history as unknown[])] : []
    const mappedStatus = mapProviderStatus(providerStatus.status)

    if (mappedStatus && mappedStatus !== check.status) {
      updates.status = mappedStatus
      history = appendStatusHistory(history, {
        status: mappedStatus,
        occurred_at: new Date().toISOString(),
        actor: 'provider',
        provider_status: providerStatus.status,
      })
    }

    if (providerStatus.summary !== undefined) {
      updates.summary = providerStatus.summary ?? null
    }

    if (providerStatus.findings !== undefined) {
      updates.findings = providerStatus.findings ?? null
    }

    if (providerStatus.components?.length) {
      updates.component_statuses = providerStatus.components
    }

    if (providerStatus.completed_at !== undefined) {
      updates.completed_at = providerStatus.completed_at ?? null
    }

    if (providerStatus.expires_at !== undefined) {
      updates.expires_at = providerStatus.expires_at ?? null
    }

    if (providerStatus.estimated_completion_date !== undefined) {
      updates.estimated_completion_date = providerStatus.estimated_completion_date ?? null
    }

    if (providerStatus.metadata && typeof providerStatus.metadata === 'object') {
      updates.metadata = mergeMetadata(check.metadata, { nationsearch: providerStatus.metadata })
    }

    if (JSON.stringify(history) !== JSON.stringify(check.status_history)) {
      updates.status_history = history
    }

    if (Object.keys(updates).length === 0) {
      return null
    }

    const { data: refreshed, error } = await supabaseAdmin
      .schema('core')
      .from('background_checks')
      .update(updates)
      .eq('id', check.id)
      .select(BACKGROUND_CHECK_BASE_COLUMNS)
      .maybeSingle()

    if (error) {
      console.error('[backgroundChecks.syncBackgroundCheckFromProvider] failed to persist provider status', error)
      return { ...check, ...updates }
    }

    return (refreshed as BackgroundCheckRecord | null) ?? { ...check, ...updates }
  } catch (error) {
    if (isNationSearchOutageError(error)) {
      console.warn('[backgroundChecks.syncBackgroundCheckFromProvider] provider outage while syncing', error)
      return null
    }
    console.error('[backgroundChecks.syncBackgroundCheckFromProvider] failed to fetch provider status', error)
    return null
  }
}

export const backgroundChecksRouter = t.router({
  /**
   * List active NationSearch packages with resolved component metadata.
   */
  listPackages: protectedProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx

    const { data: packages, error: packageError } = await supabase
      .schema('core')
      .from('background_check_packages')
      .select(
        'id, slug, display_name, description, provider_package_code, check_type_ids, platform_cost_cents, retail_cost_cents, estimated_completion_days, metadata',
      )
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (packageError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to load background check packages',
        cause: packageError,
      })
    }

    const typeIds = Array.from(
      new Set(
        packages
          ?.flatMap((pkg) => pkg.check_type_ids ?? [])
          .filter((id): id is string => typeof id === 'string'),
      ),
    )

    const { data: types, error: typeError } = await supabase
      .schema('core')
      .from('background_check_types')
      .select(
        'id, slug, display_name, description, category, validity_days, estimated_completion_days',
      )
      .in('id', typeIds.length > 0 ? typeIds : ['00000000-0000-0000-0000-000000000000'])

    if (typeError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to load background check components',
        cause: typeError,
      })
    }

    const typeMap = new Map(types?.map((type) => [type.id, type]) ?? [])

    const result = (packages ?? []).map((pkg) => ({
      id: pkg.id,
      slug: pkg.slug,
      display_name: pkg.display_name,
      description: pkg.description,
      provider_package_code: pkg.provider_package_code,
      platform_cost_cents: pkg.platform_cost_cents,
      retail_cost_cents: pkg.retail_cost_cents,
      estimated_completion_days: pkg.estimated_completion_days,
      metadata: pkg.metadata ?? {},
      components: (pkg.check_type_ids ?? [])
        .map((typeId: string) => typeMap.get(typeId))
        .filter(Boolean),
    }))

    return listPackagesOutputSchema.array().parse(result)
  }),

  /**
   * Initiate a background check for the current user.
   */
  initiate: protectedProcedure
    .input(
      backgroundCheckInitiationSchema
        .omit({ organization_id: true, job_id: true })
        .extend({
          package_id: z.string().uuid(),
          organization_id: z.string().uuid().optional(),
          job_id: z.string().uuid().optional(),
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data: pkg, error: pkgError } = await supabase
        .schema('core')
        .from('background_check_packages')
        .select('id, check_type_ids, metadata, is_active, slug, display_name')
        .eq('id', input.package_id)
        .maybeSingle()

      if (pkgError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check package',
          cause: pkgError,
        })
      }

      if (!pkg || !pkg.is_active) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected background check package is not available',
        })
      }

      const checkTypeIds =
        input.check_type_overrides && input.check_type_overrides.length > 0
          ? input.check_type_overrides
          : (pkg.check_type_ids ?? [])

      if (checkTypeIds.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected package does not have any configured components',
        })
      }

      const statusHistory = [
        {
          status: 'pending',
          occurred_at: new Date().toISOString(),
          actor: 'worker',
        },
      ]
      let currentHistory: unknown = statusHistory

      const { data: record, error: insertError } = await supabase
        .schema('core')
        .from('background_checks')
        .insert({
          user_id: user!.id,
          package_id: pkg.id,
          check_type_ids: checkTypeIds,
          custom_configuration: input.custom_configuration ?? {},
          status: 'pending',
          status_history,
          paid_by: input.paid_by,
          cost_cents: input.cost_cents,
          metadata: input.metadata ?? {},
          invited_at: new Date().toISOString(),
          estimated_completion_date: null,
        })
        .select('id, status, status_history, provider_check_id, metadata, estimated_completion_date')
        .single()

      if (insertError || !record) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to create background check record',
          cause: insertError,
        })
      }

      let finalRecord: BackgroundCheckRecord = record as unknown as BackgroundCheckRecord

      try {
        const nationSearch = createNationSearchClient()
        const payload = {
          package_code: pkg.slug ?? '',
          user: {
            id: user!.id,
            email: ctx.user?.email ?? undefined,
          },
          metadata: {
            background_check_id: record.id,
          },
          custom_configuration: input.custom_configuration ?? {},
        }

        const response = await nationSearch.initiateCheck(payload)
        const providerCheckId = response?.id ?? null

        if (providerCheckId) {
          const newHistory = appendStatusHistory(currentHistory, {
            status: 'in_progress',
            occurred_at: new Date().toISOString(),
            actor: 'worker',
          })

          const metadataPatch = mergeMetadata(record.metadata, {
            provider_check_id: providerCheckId,
            provider_reference: response.metadata ?? null,
          })

          const { data: updatedRecord, error: updateError } = await supabase
            .schema('core')
            .from('background_checks')
            .update({
              provider_check_id: providerCheckId,
              status: 'in_progress',
              status_history: newHistory,
              metadata: metadataPatch,
              estimated_completion_date: response.estimated_completion_date ?? null,
            })
            .eq('id', record.id)
            .select(BACKGROUND_CHECK_BASE_COLUMNS)
            .maybeSingle()

          currentHistory = newHistory

          if (!updateError && updatedRecord) {
            finalRecord = updatedRecord as BackgroundCheckRecord
          } else {
            finalRecord = {
              ...finalRecord,
              provider_check_id: providerCheckId,
              status: 'in_progress',
              status_history: newHistory,
              metadata: metadataPatch,
              estimated_completion_date: response.estimated_completion_date ?? null,
            }
          }
        }
      } catch (error) {
        if (isNationSearchOutageError(error)) {
          const outageHistory = appendStatusHistory(currentHistory, {
            status: 'pending',
            occurred_at: new Date().toISOString(),
            actor: 'system',
            notes: 'queued_due_to_provider_outage',
          })
          const outageMessage = error instanceof Error ? error.message : String(error)
          const outageMetadata = mergeMetadata(finalRecord.metadata, {
            provider_outage: true,
            provider_message: outageMessage,
          })

          const { data: outageRecord } = await supabase
            .schema('core')
            .from('background_checks')
            .update({
              status_history: outageHistory,
              metadata: outageMetadata,
            })
            .eq('id', record.id)
            .select(BACKGROUND_CHECK_BASE_COLUMNS)
            .maybeSingle()

          currentHistory = outageHistory

          finalRecord = (outageRecord as BackgroundCheckRecord | null) ?? {
            ...finalRecord,
            status_history: outageHistory,
            metadata: outageMetadata,
          }
        } else {
          console.error('[backgroundChecks.initiate] NationSearch initiation failed', error)
        }
      }

      return finalRecord
    }),

  /**
   * List current user's background checks.
   */
  listChecks: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('background_checks')
      .select('id, status, package_id, completed_at, created_at, expires_at, invited_at, provider_check_id, findings, metadata, package:background_check_packages(id, display_name, slug)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to load background checks',
        cause: error,
      })
    }

    return listChecksOutputSchema.array().parse(
      (data ?? []).map((row) => ({
        id: row.id,
        status: row.status,
        package: {
          id: row.package?.id ?? null,
          display_name: row.package?.display_name ?? null,
          slug: row.package?.slug ?? null,
        },
        completed_at: row.completed_at,
        created_at: row.created_at,
        expires_at: row.expires_at,
        invited_at: row.invited_at,
        provider_check_id: row.provider_check_id,
        findings: row.findings,
        metadata: row.metadata,
      })),
    )
  }),

  /**
   * Get a specific background check (with documents).
   */
  getCheck: protectedProcedure
    .input(z.object({ background_check_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, supabaseAdmin, user } = ctx

      const { data: check, error: checkError } = await supabase
        .schema('core')
        .from('background_checks')
        .select(
          'id, status, status_history, package_id, check_type_ids, provider_check_id, summary, findings, component_statuses, metadata, created_at, updated_at, expires_at, estimated_completion_date',
        )
        .eq('id', input.background_check_id)
        .eq('user_id', user!.id)
        .maybeSingle()

      if (checkError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check',
          cause: checkError,
        })
      }

      if (!check) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check not found',
        })
      }

      let hydratedCheck = check as BackgroundCheckRecord

      if (shouldSyncStatus(hydratedCheck.status)) {
        const nationSearch = createNationSearchClient()
        const synced = await syncBackgroundCheckFromProvider({
          nationSearch,
          supabaseAdmin,
          check: hydratedCheck,
        })

        if (synced) {
          hydratedCheck = synced
        }
      }

      const { data: documents, error: docError } = await supabase
        .schema('core')
        .from('background_check_documents')
        .select('id, document_type, file_path, file_name, file_size, mime_type, uploaded_at, verified')
        .eq('background_check_id', input.background_check_id)
        .order('uploaded_at', { ascending: false })

      if (docError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check documents',
          cause: docError,
        })
      }

      return getCheckOutputSchema.parse({
        check: hydratedCheck,
        documents: documents ?? [],
      })
    }),

  /**
   * Generate a signed upload URL for a background check document.
   */
  createUploadUrl: protectedProcedure
    .input(backgroundCheckUploadRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data: check, error: checkError } = await supabase
        .schema('core')
        .from('background_checks')
        .select('id')
        .eq('id', input.background_check_id)
        .eq('user_id', user!.id)
        .maybeSingle()

      if (checkError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify background check before upload',
          cause: checkError,
        })
      }

      if (!check) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check not found for user',
        })
      }

      if (!BACKGROUND_CHECK_ALLOWED_MIME_TYPES.includes(input.mime_type)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unsupported file type: ${input.mime_type}`,
        })
      }

      if (input.file_size > MAX_DOCUMENT_SIZE_BYTES) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File exceeds maximum size of 10MB',
        })
      }

      const storagePath = buildDocumentStoragePath(
        user!.id,
        input.background_check_id,
        input.file_name,
      )

      const { data, error } = await supabase.storage
        .from(BACKGROUND_CHECK_BUCKET_ID)
        .createSignedUploadUrl(storagePath, SIGNED_UPLOAD_URL_TTL_SECONDS)

      if (error || !data) {
        console.error('[backgroundChecks.createUploadUrl] failed to create signed URL', {
          background_check_id: input.background_check_id,
          user_id: user!.id,
          message: error?.message,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to create upload URL',
        })
      }

      return {
        uploadUrl: data.signedUrl,
        token: data.token,
        storagePath,
        bucket: BACKGROUND_CHECK_BUCKET_ID,
        expiresIn: SIGNED_UPLOAD_URL_TTL_SECONDS,
      }
    }),

  /**
   * Upload background check supporting document metadata (storage upload handled client-side).
   */
  addDocumentMetadata: protectedProcedure
    .input(backgroundCheckDocumentUploadSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data: existing, error: checkError } = await supabase
        .schema('core')
        .from('background_checks')
        .select('id')
        .eq('id', input.background_check_id)
        .eq('user_id', user!.id)
        .maybeSingle()

      if (checkError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify background check ownership',
          cause: checkError,
        })
      }

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check not found for user',
        })
      }

      if (!BACKGROUND_CHECK_ALLOWED_MIME_TYPES.includes(input.mime_type)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unsupported file type: ${input.mime_type}`,
        })
      }

      if (input.file_size > MAX_DOCUMENT_SIZE_BYTES) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File exceeds maximum size of 10MB',
        })
      }

      const expectedPrefix = `${user!.id}/${input.background_check_id}/`
      if (!input.storage_path.startsWith(expectedPrefix)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid storage path for document upload',
        })
      }

      const { data, error } = await supabase
        .schema('core')
        .from('background_check_documents')
        .insert({
          background_check_id: input.background_check_id,
          document_type: input.document_type,
          file_path: input.storage_path,
          file_name: input.file_name,
          file_size: input.file_size,
          mime_type: input.mime_type,
          uploaded_by_user_id: user!.id,
          metadata: input.metadata ?? {},
        })
        .select('id, document_type, file_name')
        .single()

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record document metadata',
          cause: error,
        })
      }

      return data
    }),

  /**
   * File a dispute for an existing background check result.
   */
  submitDispute: protectedProcedure
    .input(backgroundCheckDisputeSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data: existing, error: checkError } = await supabase
        .schema('core')
        .from('background_checks')
        .select(
          'id, status, status_history, requested_by_user_id, package:background_check_packages(display_name, slug)',
        )
        .eq('id', input.background_check_id)
        .eq('user_id', user!.id)
        .maybeSingle()

      if (checkError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify background check ownership',
          cause: checkError,
        })
      }

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check not found for user',
        })
      }

      const allowedStatuses: Array<z.infer<typeof backgroundCheckStatusEnum>> = [
        'completed_clear',
        'completed_consider',
        'completed_not_clear',
        'partially_completed',
      ]

      if (!allowedStatuses.includes(existing.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Background check must be completed before filing a dispute',
        })
      }

      const { data, error } = await supabase
        .schema('core')
        .from('background_check_disputes')
        .insert({
          background_check_id: input.background_check_id,
          user_id: user!.id,
          dispute_reason: input.dispute_reason,
          dispute_details: input.dispute_details,
          supporting_documents: input.supporting_documents ?? [],
        })
        .select('id, status, created_at')
        .single()

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit dispute',
          cause: error,
        })
      }

      if (existing.status !== 'disputed') {
        const disputeHistory = Array.isArray(existing.status_history) ? [...existing.status_history] : []
        disputeHistory.push({
          status: 'disputed',
          occurred_at: new Date().toISOString(),
          actor: 'worker',
          notes: input.dispute_reason ?? null,
          submitter_user_id: user!.id,
        })

        const { error: disputeStatusError } = await supabase
          .schema('core')
          .from('background_checks')
          .update({
            status: 'disputed',
            status_history: disputeHistory,
          })
          .eq('id', input.background_check_id)

        if (disputeStatusError) {
          console.error('[backgroundChecks.submitDispute] failed to update dispute status', disputeStatusError)
        }
      }

      try {
        await notifyBackgroundCheckStatusChange({
          supabase: ctx.supabaseAdmin,
          status: 'disputed',
          workerId: user!.id,
          requesterId: existing.requested_by_user_id ?? null,
          checkId: input.background_check_id,
          packageName: existing.package?.display_name ?? existing.package?.slug ?? null,
          summary: input.dispute_reason ?? input.dispute_details ?? null,
          actorId: user!.id,
        })
      } catch (error) {
        console.error('[backgroundChecks.submitDispute] failed to send dispute notification', error)
      }

      return data
    }),

  /**
   * Organization scoped endpoints
   */
  organizationListChecks: officeProcedure
    .input(z.object({ organization_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('background_checks')
        .select(
          'id, status, user_id, package_id, job_id, completed_at, created_at, expires_at, invited_at, provider_check_id, findings, metadata, package:background_check_packages(id, display_name, slug)',
        )
        .eq('organization_id', input.organization_id)
        .eq('requested_by_user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load organization background checks',
          cause: error,
        })
      }

      return (data ?? []).map((row) => ({
        id: row.id,
        status: row.status,
        worker_user_id: row.user_id,
        job_id: row.job_id,
        package: row.package ?? null,
        completed_at: row.completed_at,
        created_at: row.created_at,
        expires_at: row.expires_at,
        invited_at: row.invited_at,
        provider_check_id: row.provider_check_id,
        findings: row.findings,
        metadata: row.metadata,
      }))
    }),

  organizationInitiate: officeProcedure
    .input(
      backgroundCheckInitiationSchema
        .extend({
          organization_id: z.string().uuid(),
          worker_user_id: z.string().uuid(),
          job_id: z.string().uuid().optional(),
        })
        .omit({ paid_by: true })
        .extend({ paid_by: z.literal('organization') }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data: pkg, error: pkgError } = await supabase
        .schema('core')
        .from('background_check_packages')
        .select('id, display_name, check_type_ids, metadata, is_active, slug')
        .eq('id', input.package_id)
        .maybeSingle()

      if (pkgError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check package',
          cause: pkgError,
        })
      }

      if (!pkg || !pkg.is_active) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected background check package is not available',
        })
      }

      const checkTypeIds =
        input.check_type_overrides && input.check_type_overrides.length > 0
          ? input.check_type_overrides
          : (pkg.check_type_ids ?? [])

      if (checkTypeIds.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected package does not have any configured components',
        })
      }

      const statusHistory = [
        {
          status: 'pending' as const,
          occurred_at: new Date().toISOString(),
          actor: 'organization',
        },
      ]
      let currentHistory: unknown = statusHistory

      const { data: record, error: insertError } = await supabase
        .schema('core')
        .from('background_checks')
        .insert({
          user_id: input.worker_user_id,
          organization_id: input.organization_id,
          job_id: input.job_id ?? null,
          package_id: pkg.id,
          check_type_ids: checkTypeIds,
          custom_configuration: input.custom_configuration ?? {},
          status: 'pending',
          status_history,
          paid_by: 'organization',
          cost_cents: input.cost_cents,
          metadata: input.metadata ?? {},
          requested_by_user_id: user!.id,
          invited_at: new Date().toISOString(),
        })
        .select('id, status, status_history, provider_check_id, metadata, estimated_completion_date')
        .single()

      if (insertError || !record) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to create background check record',
          cause: insertError,
        })
      }

      let finalRecord: BackgroundCheckRecord = record as unknown as BackgroundCheckRecord

      try {
        const nationSearch = createNationSearchClient()
        const payload = {
          package_code: pkg.slug ?? '',
          user: {
            id: input.worker_user_id,
          },
          organization: {
            id: input.organization_id,
          },
          metadata: {
            background_check_id: record.id,
            requested_by: user!.id,
          },
          custom_configuration: input.custom_configuration ?? {},
        }

        const response = await nationSearch.initiateCheck(payload)
        const providerCheckId = response?.id ?? null

        if (providerCheckId) {
          const newHistory = appendStatusHistory(currentHistory, {
            status: 'invited',
            occurred_at: new Date().toISOString(),
            actor: 'organization',
            requested_by: user!.id,
          })

          const metadataPatch = mergeMetadata(record.metadata, {
            provider_check_id: providerCheckId,
            provider_reference: response.metadata ?? null,
          })

          const { data: updatedRecord, error: updateError } = await supabase
            .schema('core')
            .from('background_checks')
            .update({
              provider_check_id: providerCheckId,
              status: 'invited',
              status_history: newHistory,
              metadata: metadataPatch,
              estimated_completion_date: response.estimated_completion_date ?? null,
            })
            .eq('id', record.id)
            .select(BACKGROUND_CHECK_BASE_COLUMNS)
            .maybeSingle()

          currentHistory = newHistory

          if (!updateError && updatedRecord) {
            finalRecord = updatedRecord as BackgroundCheckRecord
          } else {
            finalRecord = {
              ...finalRecord,
              provider_check_id: providerCheckId,
              status: 'invited',
              status_history: newHistory,
              metadata: metadataPatch,
              estimated_completion_date: response.estimated_completion_date ?? null,
            }
          }
        }
      } catch (error) {
        if (isNationSearchOutageError(error)) {
          const outageHistory = appendStatusHistory(currentHistory, {
            status: 'pending',
            occurred_at: new Date().toISOString(),
            actor: 'system',
            notes: 'queued_due_to_provider_outage',
          })
          const outageMessage = error instanceof Error ? error.message : String(error)
          const outageMetadata = mergeMetadata(finalRecord.metadata, {
            provider_outage: true,
            provider_message: outageMessage,
          })

          const { data: outageRecord } = await supabase
            .schema('core')
            .from('background_checks')
            .update({
              status_history: outageHistory,
              metadata: outageMetadata,
            })
            .eq('id', record.id)
            .select(BACKGROUND_CHECK_BASE_COLUMNS)
            .maybeSingle()

          currentHistory = outageHistory

          finalRecord = (outageRecord as BackgroundCheckRecord | null) ?? {
            ...finalRecord,
            status_history: outageHistory,
            metadata: outageMetadata,
          }
        } else {
          console.error('[backgroundChecks.organizationInitiate] NationSearch initiation failed', error)
        }
      }

      try {
        await notifyBackgroundCheckInvitation({
          supabase: ctx.supabaseAdmin,
          workerId: input.worker_user_id,
          invitedById: user!.id,
          checkId: record.id,
          packageName: pkg.display_name ?? pkg.slug ?? null,
          actorId: user!.id,
        })
      } catch (error) {
        console.error('[backgroundChecks.organizationInitiate] failed to send invitation notification', error)
      }

      return finalRecord
    }),

  organizationGet: officeProcedure
    .input(z.object({ background_check_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, supabaseAdmin, user } = ctx

      const { data: check, error: checkError } = await supabase
        .schema('core')
        .from('background_checks')
        .select(
          'id, status, user_id, organization_id, job_id, requested_by_user_id, status_history, findings, summary, provider_check_id, metadata, component_statuses, completed_at, expires_at, estimated_completion_date, created_at, updated_at',
        )
        .eq('id', input.background_check_id)
        .maybeSingle()

      if (checkError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check',
          cause: checkError,
        })
      }

      if (!check || check.requested_by_user_id !== user!.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check not found for organization',
        })
      }

      let hydratedCheck = check as BackgroundCheckRecord

      if (shouldSyncStatus(hydratedCheck.status)) {
        const nationSearch = createNationSearchClient()
        const synced = await syncBackgroundCheckFromProvider({
          nationSearch,
          supabaseAdmin,
          check: hydratedCheck,
        })
        if (synced) {
          hydratedCheck = synced
        }
      }

      return hydratedCheck
    }),

  adminListChecks: officeProcedure
    .input(
      z
        .object({
          status: backgroundCheckStatusEnum.optional(),
          limit: z.number().int().positive().max(200).default(50),
          offset: z.number().int().nonnegative().default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      let query = supabase
        .schema('core')
        .from('background_checks')
        .select(
          'id, status, user_id, organization_id, job_id, summary, findings, created_at, updated_at, invited_at, completed_at, expires_at, package:background_check_packages(id, display_name, slug)',
        )
        .order('created_at', { ascending: false })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50) - 1)

      if (input?.status) {
        query = query.eq('status', input.status)
      }

      const { data, error } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background checks for review',
          cause: error,
        })
      }

      return data ?? []
    }),

  adminUpdateStatus: officeProcedure
    .input(
      z.object({
        background_check_id: z.string().uuid(),
        status: backgroundCheckStatusEnum,
        summary: z.string().nullable().optional(),
        findings: z.record(z.unknown()).nullable().optional(),
        component_statuses: z.array(z.record(z.unknown())).optional(),
        expires_at: z.string().datetime().nullable().optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data: existing, error: fetchError } = await supabase
        .schema('core')
        .from('background_checks')
        .select(
          'status_history, user_id, requested_by_user_id, package:background_check_packages(display_name, slug)',
        )
        .eq('id', input.background_check_id)
        .maybeSingle()

      if (fetchError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check for update',
          cause: fetchError,
        })
      }

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check not found',
        })
      }

      const history = Array.isArray(existing.status_history) ? existing.status_history : []
      history.push({
        status: input.status,
        occurred_at: new Date().toISOString(),
        actor: 'admin',
        notes: input.notes ?? null,
        reviewer_user_id: user!.id,
      })

      const { data: updated, error: updateError } = await supabase
        .schema('core')
        .from('background_checks')
        .update({
          status: input.status,
          summary: input.summary ?? null,
          findings: input.findings ?? null,
          component_statuses: input.component_statuses ?? null,
          status_history: history,
          expires_at: input.expires_at ?? null,
        })
        .eq('id', input.background_check_id)
        .select(
          'id, status, updated_at, summary, findings, component_statuses, status_history, expires_at, user_id, requested_by_user_id, package:background_check_packages(display_name, slug)',
        )
        .single()

      if (updateError || !updated) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update background check status',
          cause: updateError,
        })
      }

      try {
        await notifyBackgroundCheckStatusChange({
          supabase: ctx.supabaseAdmin,
          status: updated.status,
          workerId: updated.user_id,
          requesterId: updated.requested_by_user_id ?? null,
          checkId: updated.id,
          packageName: updated.package?.display_name ?? updated.package?.slug ?? null,
          summary: input.summary ?? updated.summary ?? null,
          actorId: user!.id,
        })
      } catch (error) {
        console.error('[backgroundChecks.adminUpdateStatus] failed to send status notification', error)
      }

      return updated
    }),

  adminListDisputes: officeProcedure
    .input(
      z
        .object({
          status: z
            .enum(['pending', 'under_review', 'resolved', 'upheld', 'cancelled'])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      let query = supabase
        .schema('core')
        .from('background_check_disputes')
        .select(
          'id, background_check_id, user_id, dispute_reason, dispute_details, supporting_documents, status, created_at, updated_at, resolved_at, resolved_by_user_id',
        )
        .order('created_at', { ascending: false })

      if (input?.status) {
        query = query.eq('status', input.status)
      }

      const { data, error } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check disputes',
          cause: error,
        })
      }

      return data ?? []
    }),

  adminResolveDispute: officeProcedure
    .input(
      z.object({
        dispute_id: z.string().uuid(),
        status: z.enum(['resolved', 'upheld', 'cancelled']),
        resolution: z.string().nullable().optional(),
        resolution_notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('background_check_disputes')
        .update({
          status: input.status,
          resolution: input.resolution ?? null,
          resolution_notes: input.resolution_notes ?? null,
          resolved_at: new Date().toISOString(),
          resolved_by_user_id: user!.id,
        })
        .eq('id', input.dispute_id)
        .select('id, status, resolved_at, resolution, resolution_notes')
        .single()

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resolve dispute',
          cause: error,
        })
      }

      return data
    }),

  /**
   * Expose webhook signature verification for Edge Functions.
   */
  verifyWebhookSignature: publicProcedure
    .input(z.object({ signature: z.string(), payload: z.string() }))
    .mutation(async ({ input }) => {
      const client = createNationSearchClient()
      return client.verifyWebhookSignature(input.signature, input.payload)
    }),
})

