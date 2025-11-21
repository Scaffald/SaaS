import { TRPCError } from '@trpc/server'
import type Stripe from 'stripe'
import { z } from 'zod'
import {
  notifyBackgroundCheckInvitation,
  notifyBackgroundCheckStatusChange,
} from '../../_shared/background-check-notifications.ts'
import {
  BACKGROUND_CHECK_ALLOWED_MIME_TYPES,
  backgroundCheckDisputeSchema,
  backgroundCheckDocumentUploadSchema,
  backgroundCheckInitiationSchema,
  backgroundCheckPaidByEnum,
  backgroundCheckStatusEnum,
  backgroundCheckUploadRequestSchema,
  consentMetadataSchema,
} from '../../_shared/background-check-schemas.ts'
import {
  appendStatusHistory,
  BACKGROUND_CHECK_BASE_COLUMNS,
  BACKGROUND_CHECK_SYNC_COLUMNS,
  BackgroundCheckStatus,
  mapProviderStatus,
  mergeMetadata,
  shouldSyncStatus,
} from '../../_shared/background-check-status.ts'
import {
  type CheckStatusResponse,
  createNationSearchClient,
  isNationSearchOutageError,
} from '../../_shared/nationsearch/client.ts'
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
    })
  ),
})

const WORKER_CONSENT_TEXT = [
  'By proceeding you acknowledge that Scaffolded Trades will obtain a consumer report (background check) for employment purposes.',
  'You have the right to request information about the nature and scope of any consumer report and dispute inaccurate information.',
].join('\n\n')

const WORKER_CONSENT_VERSION = '2024-11-18'

type ConsentPayload = z.infer<typeof consentMetadataSchema>

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
    estimated_completion_date: z.string().nullable(),
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
    })
  ),
})

const updatePrivacyInputSchema = z.object({
  background_check_id: z.string().uuid(),
  share_publicly: z.boolean(),
  shared_with_organization_ids: z.array(z.string().uuid()).default([]),
})

const adminCheckWorkerSchema = z.object({
  id: z.string().uuid().nullable(),
  display_name: z.string().nullable(),
  username: z.string().nullable(),
  email: z.string().nullable(),
  avatar_path: z.string().nullable(),
})

const adminCheckOrganizationSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().nullable(),
})

const adminDisputeSummarySchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  dispute_reason: z.string().nullable(),
  dispute_details: z.string().nullable(),
  supporting_documents: z.record(z.unknown()).nullable(),
  created_at: z.string().datetime(),
  resolved_at: z.string().datetime().nullable(),
  resolution: z.string().nullable(),
  resolution_notes: z.string().nullable(),
})

const adminGetCheckOutputSchema = z.object({
  check: getCheckOutputSchema.shape.check.extend({
    metadata: z.record(z.unknown()).nullable(),
    worker: adminCheckWorkerSchema.nullable(),
    organization: adminCheckOrganizationSchema.nullable(),
  }),
  documents: getCheckOutputSchema.shape.documents,
  disputes: z.array(adminDisputeSummarySchema),
})

const adminCheckTypeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  display_name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  provider_check_code: z.string().nullable(),
  validity_days: z.number().nullable(),
  platform_cost_cents: z.number(),
  retail_cost_cents: z.number().nullable(),
  estimated_completion_days: z.number().nullable(),
  required_documents: z.array(z.string()),
  provider_configuration: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).default({}),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

const adminPackageSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  display_name: z.string(),
  description: z.string().nullable(),
  provider_package_code: z.string().nullable(),
  check_type_ids: z.array(z.string().uuid()),
  component_overrides: z.array(z.record(z.unknown())).default([]),
  platform_cost_cents: z.number(),
  retail_cost_cents: z.number(),
  estimated_completion_days: z.number().nullable(),
  is_active: z.boolean(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  components: z.array(
    adminCheckTypeSchema.pick({
      id: true,
      slug: true,
      display_name: true,
      category: true,
      validity_days: true,
      estimated_completion_days: true,
      platform_cost_cents: true,
      retail_cost_cents: true,
      is_active: true,
    })
  ),
})

const adminUpsertCheckTypeInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  display_name: z.string().min(1).max(180),
  description: z.string().max(2000).nullable().optional(),
  category: z.string().max(120).nullable().optional(),
  provider_check_code: z.string().max(120).nullable().optional(),
  validity_days: z.number().int().positive().nullable().optional(),
  platform_cost_cents: z.number().int().min(0),
  retail_cost_cents: z.number().int().min(0).nullable().optional(),
  estimated_completion_days: z.number().int().min(0).nullable().optional(),
  required_documents: z.array(z.string().min(1)).optional(),
  provider_configuration: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
})

const adminUpsertPackageInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  display_name: z.string().min(1).max(180),
  description: z.string().max(2000).nullable().optional(),
  provider_package_code: z.string().max(120).nullable().optional(),
  check_type_ids: z.array(z.string().uuid()).min(1),
  platform_cost_cents: z.number().int().min(0),
  retail_cost_cents: z.number().int().min(0),
  estimated_completion_days: z.number().int().min(0).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  component_overrides: z.array(z.record(z.unknown())).optional(),
  is_active: z.boolean().optional(),
})

const adminToggleActiveInputSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
})

const requestBackgroundCheckInputSchema = z.object({
  package_id: z.string().uuid(),
  tier: z.string().min(1),
  add_on_ids: z.array(z.string().uuid()).optional(),
  paid_by: backgroundCheckPaidByEnum.default('worker'),
  organization_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  worker_user_id: z.string().uuid().optional(),
  custom_configuration: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  consent: consentMetadataSchema.optional(),
})

const confirmBackgroundCheckPaymentSchema = z.object({
  background_check_id: z.string().uuid(),
  payment_intent_id: z.string().min(5),
})

const purchaseSharedAccessInputSchema = z.object({
  background_check_id: z.string().uuid(),
  organization_id: z.string().uuid(),
})

const confirmSharedAccessPaymentInputSchema = purchaseSharedAccessInputSchema.extend({
  payment_intent_id: z.string().min(5),
})

const BACKGROUND_CHECK_BUCKET_ID = 'background-check-documents'
const SIGNED_UPLOAD_URL_TTL_SECONDS = 60 * 5
const SIGNED_DOWNLOAD_URL_TTL_SECONDS = 60 * 60
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024
const STRIPE_API_VERSION = '2024-06-20'
const SHARED_BACKGROUND_CHECK_DISCOUNT = 0.25
const mockStripePaymentIntents = new Map<string, { amount: number; currency: string }>()

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

async function loadStripeClient(ctx: Context): Promise<Stripe> {
  if (typeof Deno !== 'undefined' && Deno.env.get('STRIPE_MOCK_MODE') === '1') {
    return {
      paymentIntents: {
        create: async (payload: Stripe.PaymentIntentCreateParams) => {
          const id = `pi_${crypto.randomUUID()}`
          const clientSecret = `cs_${crypto.randomUUID()}`
          mockStripePaymentIntents.set(id, {
            amount: payload.amount ?? 0,
            currency: payload.currency ?? 'usd',
          })
          return {
            id,
            client_secret: clientSecret,
            amount: payload.amount ?? 0,
            currency: payload.currency ?? 'usd',
            metadata: payload.metadata ?? {},
            status: 'requires_confirmation',
            object: 'payment_intent',
          } as Stripe.PaymentIntent
        },
        retrieve: async (paymentIntentId: string) => {
          const existing = mockStripePaymentIntents.get(paymentIntentId)
          if (!existing) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Mock payment intent not found',
            })
          }
          return {
            id: paymentIntentId,
            amount: existing.amount,
            currency: existing.currency,
            status: 'succeeded',
            created: Math.floor(Date.now() / 1000),
            client_secret: `cs_${paymentIntentId}`,
            object: 'payment_intent',
          } as Stripe.PaymentIntent
        },
      },
    } as unknown as Stripe
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
      code: 'FAILED_PRECONDITION',
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
  if (!ctx.user?.id) {
    return false
  }

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

async function ensureOrganizationAccess(ctx: Context, organizationId: string) {
  if (!ctx.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (await userHasPlatformRole(ctx)) {
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

  const { data: membership, error: membershipError } = await ctx.supabaseAdmin
    .schema('core')
    .from('role_assignments')
    .select('scope_org_id')
    .eq('user_id', ctx.user.id)
    .eq('scope_org_id', organizationId)
    .maybeSingle()

  if (membershipError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to verify organization membership: ${membershipError.message}`,
    })
  }

  if (!membership) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to act on this organization',
    })
  }
}

async function recordBackgroundCheckTransaction(
  ctx: Context,
  params: {
    organizationId?: string | null
    userId?: string | null
    backgroundCheckId?: string | null
    backgroundCheckAccessId?: string | null
    amountCents: number
    transactionType: 'background_check' | 'background_check_shared'
    paymentIntentId: string
    metadata?: Record<string, unknown>
  }
) {
  const { error } = await ctx.supabaseAdmin
    .schema('core')
    .from('payment_transactions')
    .insert({
      organization_id: params.organizationId ?? null,
      user_id: params.userId ?? null,
      background_check_id: params.backgroundCheckId ?? null,
      background_check_access_id: params.backgroundCheckAccessId ?? null,
      amount_cents: params.amountCents,
      currency: 'usd',
      transaction_type: params.transactionType,
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

async function recordBackgroundCheckConsent(
  ctx: Context,
  params: {
    backgroundCheckId: string
    workerUserId: string
    consent: ConsentPayload
    source: 'worker_self_service' | 'organization_portal' | 'system'
  }
) {
  const { supabaseAdmin } = ctx
  const consentedAt = params.consent.consent_given_at ?? new Date().toISOString()

  await supabaseAdmin
    .schema('core')
    .from('background_check_consent')
    .delete()
    .eq('background_check_id', params.backgroundCheckId)

  const { error } = await supabaseAdmin
    .schema('core')
    .from('background_check_consent')
    .insert({
      background_check_id: params.backgroundCheckId,
      worker_user_id: params.workerUserId,
      consent_text: WORKER_CONSENT_TEXT,
      consent_version: WORKER_CONSENT_VERSION,
      consented_at: consentedAt,
      ip_address: params.consent.consent_ip_address ?? null,
      user_agent: params.consent.consent_user_agent ?? null,
      metadata: {
        consent_signature: params.consent.consent_signature ?? null,
        consent_payload: params.consent,
        consent_source: params.source,
      },
    })

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to record background check consent: ${error.message}`,
    })
  }
}

async function submitBackgroundCheckToNationSearch(
  ctx: Context,
  backgroundCheckId: string
): Promise<BackgroundCheckRecord> {
  const { supabaseAdmin } = ctx

  const { data: record, error: recordError } = await supabaseAdmin
    .schema('core')
    .from('background_checks')
    .select(
      `
        id,
        user_id,
        status,
        status_history,
        package_id,
        check_type_ids,
        custom_configuration,
        metadata,
        package:background_check_packages(id, slug, check_type_ids, metadata)
      `
    )
    .eq('id', backgroundCheckId)
    .maybeSingle()

  if (recordError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load background check: ${recordError.message}`,
    })
  }

  if (!record) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Background check not found',
    })
  }

  const pkg = record.package
  const checkTypeIds =
    Array.isArray(record.check_type_ids) && record.check_type_ids.length > 0
      ? record.check_type_ids
      : Array.isArray(pkg?.check_type_ids)
        ? pkg?.check_type_ids
        : []

  if (!pkg || checkTypeIds.length === 0) {
    throw new TRPCError({
      code: 'FAILED_PRECONDITION',
      message: 'Background check package is misconfigured',
    })
  }

  const nationSearch = createNationSearchClient()
  const payload = {
    package_code: pkg.slug ?? '',
    user: {
      id: (record.user_id ?? '') as string,
    },
    metadata: {
      background_check_id: record.id,
    },
    custom_configuration: record.custom_configuration ?? {},
  }

  const statusHistory = Array.isArray(record.status_history)
    ? [...(record.status_history as unknown[])]
    : []

  let finalRecord: BackgroundCheckRecord = record as unknown as BackgroundCheckRecord
  let historyRef: unknown = statusHistory

  try {
    const response = await nationSearch.initiateCheck(payload)
    const providerCheckId = response?.id ?? null

    if (providerCheckId) {
      const newHistory = appendStatusHistory(historyRef, {
        status: 'in_progress',
        occurred_at: new Date().toISOString(),
        actor: 'worker',
      })

      const metadataPatch = mergeMetadata(record.metadata, {
        provider_check_id: providerCheckId,
        provider_reference: response.metadata ?? null,
      })

      const { data: updatedRecord, error: updateError } = await supabaseAdmin
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

      historyRef = newHistory

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
      const outageHistory = appendStatusHistory(historyRef, {
        status: 'pending',
        occurred_at: new Date().toISOString(),
        actor: 'system',
        notes: 'queued_due_to_provider_outage',
      })
      const outageMetadata = mergeMetadata(record.metadata, {
        provider_outage: true,
        provider_message: error instanceof Error ? error.message : String(error),
      })

      const { data: outageRecord } = await supabaseAdmin
        .schema('core')
        .from('background_checks')
        .update({
          status_history: outageHistory,
          metadata: outageMetadata,
        })
        .eq('id', record.id)
        .select(BACKGROUND_CHECK_BASE_COLUMNS)
        .maybeSingle()

      historyRef = outageHistory
      finalRecord = (outageRecord as BackgroundCheckRecord | null) ?? {
        ...finalRecord,
        status_history: outageHistory,
        metadata: outageMetadata,
      }
    } else {
      console.error(
        '[backgroundChecks.submitBackgroundCheckToNationSearch] initiation failed',
        error
      )
    }
  }

  return finalRecord
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
    const providerStatus = (await nationSearch.fetchCheckStatus(
      check.provider_check_id
    )) as CheckStatusResponse

    const updates: Record<string, unknown> = {}
    let history = Array.isArray(check.status_history)
      ? [...(check.status_history as unknown[])]
      : []
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
      updates.metadata = mergeMetadata(check.metadata, {
        nationsearch: providerStatus.metadata,
      })
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
      console.error(
        '[backgroundChecks.syncBackgroundCheckFromProvider] failed to persist provider status',
        error
      )
      return { ...check, ...updates }
    }

    return (refreshed as BackgroundCheckRecord | null) ?? { ...check, ...updates }
  } catch (error) {
    if (isNationSearchOutageError(error)) {
      console.warn(
        '[backgroundChecks.syncBackgroundCheckFromProvider] provider outage while syncing',
        error
      )
      return null
    }
    console.error(
      '[backgroundChecks.syncBackgroundCheckFromProvider] failed to fetch provider status',
      error
    )
    return null
  }
}

type RawAdminCheckTypeRow = {
  id: string
  slug: string
  display_name: string
  description: string | null
  category: string | null
  provider_check_code: string | null
  validity_days: number | null
  platform_cost_cents: number
  retail_cost_cents: number | null
  estimated_completion_days: number | null
  required_documents: unknown
  provider_configuration: unknown
  metadata: unknown
  is_active: boolean | null
  created_at: string
  updated_at: string
}

type RawAdminPackageRow = {
  id: string
  slug: string
  display_name: string
  description: string | null
  provider_package_code: string | null
  check_type_ids: string[] | null
  component_overrides: unknown
  platform_cost_cents: number
  retail_cost_cents: number
  estimated_completion_days: number | null
  is_active: boolean | null
  metadata: unknown
  created_at: string
  updated_at: string
}

type AdminCheckTypeRecord = z.infer<typeof adminCheckTypeSchema>
type AdminPackageRecord = z.infer<typeof adminPackageSchema>

function mapAdminCheckType(row: RawAdminCheckTypeRow): AdminCheckTypeRecord {
  const requiredDocuments = Array.isArray(row.required_documents)
    ? row.required_documents.filter((doc): doc is string => typeof doc === 'string')
    : []

  const providerConfiguration =
    row.provider_configuration &&
    typeof row.provider_configuration === 'object' &&
    !Array.isArray(row.provider_configuration)
      ? (row.provider_configuration as Record<string, unknown>)
      : {}

  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {}

  return adminCheckTypeSchema.parse({
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    description: row.description ?? null,
    category: row.category ?? null,
    provider_check_code: row.provider_check_code ?? null,
    validity_days: row.validity_days ?? null,
    platform_cost_cents: row.platform_cost_cents,
    retail_cost_cents: row.retail_cost_cents ?? null,
    estimated_completion_days: row.estimated_completion_days ?? null,
    required_documents: requiredDocuments,
    provider_configuration: providerConfiguration,
    metadata,
    is_active: Boolean(row.is_active ?? true),
    created_at: row.created_at,
    updated_at: row.updated_at,
  })
}

async function fetchAdminCheckTypes(ctx: Context, ids?: string[]): Promise<AdminCheckTypeRecord[]> {
  const { supabaseAdmin } = ctx

  let query = supabaseAdmin
    .schema('core')
    .from('background_check_types')
    .select(
      'id, slug, display_name, description, category, provider_check_code, validity_days, platform_cost_cents, retail_cost_cents, estimated_completion_days, required_documents, provider_configuration, metadata, is_active, created_at, updated_at'
    )
    .order('display_name', { ascending: true })

  if (ids && ids.length > 0) {
    query = query.in('id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000'])
  }

  const { data, error } = await query

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to load background check types',
      cause: error,
    })
  }

  return (data ?? []).map((row) => mapAdminCheckType(row as RawAdminCheckTypeRow))
}

function mapAdminPackage(
  row: RawAdminPackageRow,
  typeMap: Map<string, AdminCheckTypeRecord>
): AdminPackageRecord {
  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {}

  const componentOverrides = Array.isArray(row.component_overrides) ? row.component_overrides : []

  const components = (row.check_type_ids ?? [])
    .map((id) => typeMap.get(id))
    .filter((type): type is AdminCheckTypeRecord => Boolean(type))

  return adminPackageSchema.parse({
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    description: row.description ?? null,
    provider_package_code: row.provider_package_code ?? null,
    check_type_ids: (row.check_type_ids ?? []).filter(
      (value): value is string => typeof value === 'string'
    ),
    component_overrides: componentOverrides,
    platform_cost_cents: row.platform_cost_cents,
    retail_cost_cents: row.retail_cost_cents,
    estimated_completion_days: row.estimated_completion_days ?? null,
    is_active: Boolean(row.is_active ?? true),
    metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    components,
  })
}

async function fetchAdminPackages(
  ctx: Context,
  packageIds?: string[]
): Promise<AdminPackageRecord[]> {
  const { supabaseAdmin } = ctx

  let query = supabaseAdmin
    .schema('core')
    .from('background_check_packages')
    .select(
      'id, slug, display_name, description, provider_package_code, check_type_ids, component_overrides, platform_cost_cents, retail_cost_cents, estimated_completion_days, is_active, metadata, created_at, updated_at'
    )
    .order('display_name', { ascending: true })

  if (packageIds && packageIds.length > 0) {
    query = query.in(
      'id',
      packageIds.length > 0 ? packageIds : ['00000000-0000-0000-0000-000000000000']
    )
  }

  const { data, error } = await query

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to load background check packages',
      cause: error,
    })
  }

  const packageRows = data ?? []
  if (packageRows.length === 0) {
    return []
  }

  const typeIds = new Set<string>()
  for (const pkg of packageRows) {
    for (const typeId of pkg.check_type_ids ?? []) {
      if (typeof typeId === 'string') {
        typeIds.add(typeId)
      }
    }
  }

  const typeMap = new Map<string, AdminCheckTypeRecord>()
  if (typeIds.size > 0) {
    const typeRecords = await fetchAdminCheckTypes(ctx, Array.from(typeIds))
    for (const typeRecord of typeRecords) {
      typeMap.set(typeRecord.id, typeRecord)
    }
  }

  return packageRows.map((pkg) => mapAdminPackage(pkg as RawAdminPackageRow, typeMap))
}

export const backgroundChecksRouter = t.router({
  getPricing: protectedProcedure.query(async ({ ctx }) => {
    const { supabaseAdmin } = ctx

    const { data: tiers, error: tiersError } = await supabaseAdmin
      .schema('core')
      .from('service_pricing')
      .select('id, tier, name, description, price_cents, metadata')
      .eq('service_type', 'background_check')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (tiersError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load background check pricing: ${tiersError.message}`,
      })
    }

    const { data: addOns, error: addOnsError } = await supabaseAdmin
      .schema('core')
      .from('background_check_addons')
      .select('id, name, description, price_cents, metadata')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (addOnsError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load background check add-ons: ${addOnsError.message}`,
      })
    }

    return {
      tiers: tiers ?? [],
      addOns: addOns ?? [],
    }
  }),

  requestCheck: protectedProcedure
    .input(requestBackgroundCheckInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx
      const workerUserId = input.worker_user_id ?? user?.id

      if (!workerUserId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const requiresConsent = input.paid_by === 'worker'
      if (requiresConsent && !input.consent) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Worker consent is required before starting a background check.',
        })
      }

      if (input.consent && !input.consent.consent_signature) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Consent signature is required when providing consent metadata.',
        })
      }

      if (input.paid_by === 'organization' && !input.organization_id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Organization is required when paid_by is organization',
        })
      }

      if (input.organization_id) {
        await ensureOrganizationAccess(ctx, input.organization_id)
      }

      const { data: pkg, error: pkgError } = await supabaseAdmin
        .schema('core')
        .from('background_check_packages')
        .select('id, slug, check_type_ids, metadata')
        .eq('id', input.package_id)
        .eq('is_active', true)
        .maybeSingle()

      if (pkgError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load background check package: ${pkgError.message}`,
        })
      }

      if (!pkg) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check package not found',
        })
      }

      const checkTypeIds = Array.isArray(pkg.check_type_ids) ? pkg.check_type_ids : []

      if (checkTypeIds.length === 0) {
        throw new TRPCError({
          code: 'FAILED_PRECONDITION',
          message: 'The selected package does not include any components',
        })
      }

      const { data: tierRow, error: tierError } = await supabaseAdmin
        .schema('core')
        .from('service_pricing')
        .select('id, tier, name, price_cents')
        .eq('service_type', 'background_check')
        .eq('tier', input.tier)
        .eq('is_active', true)
        .maybeSingle()

      if (tierError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load pricing tier: ${tierError.message}`,
        })
      }

      if (!tierRow) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Pricing tier "${input.tier}" not found`,
        })
      }

      let addOnsTotal = 0
      const activeAddOnIds: string[] = []

      if (input.add_on_ids?.length) {
        const { data: addOns, error: addOnsError } = await supabaseAdmin
          .schema('core')
          .from('background_check_addons')
          .select('id, price_cents')
          .in('id', input.add_on_ids)
          .eq('is_active', true)

        if (addOnsError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to load add-ons: ${addOnsError.message}`,
          })
        }

        for (const addOn of addOns ?? []) {
          activeAddOnIds.push(addOn.id)
          addOnsTotal += addOn.price_cents ?? 0
        }
      }

      const totalPriceCents = tierRow.price_cents + addOnsTotal
      const now = new Date().toISOString()
      const statusHistory = [
        {
          status: 'pending',
          occurred_at: now,
          actor: input.organization_id ? 'organization' : 'worker',
        },
      ]

      const { data: insertedRecord, error: insertError } = await supabaseAdmin
        .schema('core')
        .from('background_checks')
        .insert({
          user_id: workerUserId,
          initiated_by_user_id: user?.id ?? null,
          initiated_by_org_id: input.organization_id ?? null,
          organization_id: input.organization_id ?? null,
          package_id: pkg.id,
          check_type_ids: checkTypeIds,
          custom_configuration: input.custom_configuration ?? {},
          status: 'pending',
          status_history: statusHistory,
          paid_by: input.paid_by,
          tier: input.tier,
          add_on_ids: activeAddOnIds,
          base_price_cents: tierRow.price_cents,
          add_ons_price_cents: addOnsTotal,
          total_price_cents: totalPriceCents,
          metadata: input.metadata ?? {},
          invited_at: now,
        })
        .select('id, total_price_cents')
        .maybeSingle()

      if (insertError || !insertedRecord) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: insertError
            ? `Unable to create background check: ${insertError.message}`
            : 'Unable to create background check record',
        })
      }

      if (input.consent) {
        await recordBackgroundCheckConsent(ctx, {
          backgroundCheckId: insertedRecord.id,
          workerUserId,
          consent: input.consent,
          source: input.paid_by === 'worker' ? 'worker_self_service' : 'organization_portal',
        })
      }

      const stripe = await loadStripeClient(ctx)
      const intent = await stripe.paymentIntents.create({
        amount: totalPriceCents,
        currency: 'usd',
        metadata: {
          background_check_id: insertedRecord.id,
          tier: input.tier,
          package_id: input.package_id,
          stage: 'background_check',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      const { error: updateError } = await supabaseAdmin
        .schema('core')
        .from('background_checks')
        .update({
          payment_intent_id: intent.id,
        })
        .eq('id', insertedRecord.id)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to link payment intent: ${updateError.message}`,
        })
      }

      await recordBackgroundCheckTransaction(ctx, {
        organizationId: input.paid_by === 'organization' ? (input.organization_id ?? null) : null,
        userId: user?.id ?? null,
        backgroundCheckId: insertedRecord.id,
        amountCents: totalPriceCents,
        transactionType: 'background_check',
        paymentIntentId: intent.id,
        metadata: {
          tier: input.tier,
          add_on_ids: activeAddOnIds,
        },
      })

      return {
        backgroundCheckId: insertedRecord.id,
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        amountCents: totalPriceCents,
      }
    }),

  confirmCheckPayment: protectedProcedure
    .input(confirmBackgroundCheckPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx

      const { data: checkRecord, error: checkError } = await supabaseAdmin
        .schema('core')
        .from('background_checks')
        .select('id, user_id, initiated_by_user_id, organization_id, payment_intent_id')
        .eq('id', input.background_check_id)
        .maybeSingle()

      if (checkError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load background check: ${checkError.message}`,
        })
      }

      if (!checkRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check not found',
        })
      }

      let hasAccess = false

      if (
        (checkRecord.user_id && checkRecord.user_id === user?.id) ||
        (checkRecord.initiated_by_user_id && checkRecord.initiated_by_user_id === user?.id)
      ) {
        hasAccess = true
      } else if (checkRecord.organization_id) {
        try {
          await ensureOrganizationAccess(ctx, checkRecord.organization_id)
          hasAccess = true
        } catch {
          hasAccess = false
        }
      }

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to confirm this payment',
        })
      }

      if (
        !checkRecord.payment_intent_id ||
        checkRecord.payment_intent_id !== input.payment_intent_id
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment intent does not match the background check record',
        })
      }

      const stripe = await loadStripeClient(ctx)
      const intent = await stripe.paymentIntents.retrieve(input.payment_intent_id)

      if (intent.status !== 'succeeded') {
        throw new TRPCError({
          code: 'FAILED_PRECONDITION',
          message: 'Payment has not succeeded yet.',
        })
      }

      const paidAt = new Date(intent.created * 1000).toISOString()

      const { error: updateError } = await supabaseAdmin
        .schema('core')
        .from('background_checks')
        .update({
          paid_at: paidAt,
        })
        .eq('id', checkRecord.id)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update background check record: ${updateError.message}`,
        })
      }

      await supabaseAdmin
        .schema('core')
        .from('payment_transactions')
        .update({
          status: 'succeeded',
          succeeded_at: paidAt,
        })
        .eq('stripe_payment_intent_id', input.payment_intent_id)

      const finalRecord = await submitBackgroundCheckToNationSearch(ctx, checkRecord.id)

      return finalRecord
    }),

  purchaseSharedAccess: protectedProcedure
    .input(purchaseSharedAccessInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx
      await ensureOrganizationAccess(ctx, input.organization_id)

      const { data: checkRecord, error: checkError } = await supabaseAdmin
        .schema('core')
        .from('background_checks')
        .select('id, total_price_cents, is_public, shared_with_org_ids')
        .eq('id', input.background_check_id)
        .maybeSingle()

      if (checkError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load background check: ${checkError.message}`,
        })
      }

      if (!checkRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check not found',
        })
      }

      const allowedOrganizations = Array.isArray(checkRecord.shared_with_org_ids)
        ? checkRecord.shared_with_org_ids
        : []

      const hasAccess =
        checkRecord.is_public || allowedOrganizations.includes(input.organization_id)

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This background check is not shared with your organization',
        })
      }

      const discountedPrice = Math.max(
        1,
        Math.round(checkRecord.total_price_cents * (1 - SHARED_BACKGROUND_CHECK_DISCOUNT))
      )

      const stripe = await loadStripeClient(ctx)
      const intent = await stripe.paymentIntents.create({
        amount: discountedPrice,
        currency: 'usd',
        metadata: {
          background_check_id: checkRecord.id,
          organization_id: input.organization_id,
          stage: 'background_check_shared',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      await recordBackgroundCheckTransaction(ctx, {
        organizationId: input.organization_id,
        userId: user?.id ?? null,
        backgroundCheckId: checkRecord.id,
        amountCents: discountedPrice,
        transactionType: 'background_check_shared',
        paymentIntentId: intent.id,
      })

      return {
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        amountCents: discountedPrice,
      }
    }),

  confirmSharedAccessPayment: protectedProcedure
    .input(confirmSharedAccessPaymentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin, user } = ctx
      await ensureOrganizationAccess(ctx, input.organization_id)

      const stripe = await loadStripeClient(ctx)
      const intent = await stripe.paymentIntents.retrieve(input.payment_intent_id)

      if (intent.status !== 'succeeded') {
        throw new TRPCError({
          code: 'FAILED_PRECONDITION',
          message: 'Payment has not succeeded yet.',
        })
      }

      const paidAt = new Date(intent.created * 1000).toISOString()

      const { data: existingAccess } = await supabaseAdmin
        .schema('core')
        .from('background_check_access')
        .select('id')
        .eq('background_check_id', input.background_check_id)
        .eq('organization_id', input.organization_id)
        .maybeSingle()

      if (existingAccess) {
        return { ok: true }
      }

      const { error: insertError } = await supabaseAdmin
        .schema('core')
        .from('background_check_access')
        .insert({
          background_check_id: input.background_check_id,
          organization_id: input.organization_id,
          accessed_by_user_id: user?.id ?? null,
          payment_intent_id: input.payment_intent_id,
          price_cents: intent.amount ?? 0,
          paid_at: paidAt,
        })

      if (insertError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to grant shared access: ${insertError.message}`,
        })
      }

      await supabaseAdmin
        .schema('core')
        .from('payment_transactions')
        .update({
          status: 'succeeded',
          succeeded_at: paidAt,
        })
        .eq('stripe_payment_intent_id', input.payment_intent_id)

      return { ok: true }
    }),

  /**
   * List active NationSearch packages with resolved component metadata.
   */
  listPackages: protectedProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx

    const { data: packages, error: packageError } = await supabase
      .schema('core')
      .from('background_check_packages')
      .select(
        'id, slug, display_name, description, provider_package_code, check_type_ids, platform_cost_cents, retail_cost_cents, estimated_completion_days, metadata'
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
          .filter((id): id is string => typeof id === 'string')
      )
    )

    const { data: types, error: typeError } = await supabase
      .schema('core')
      .from('background_check_types')
      .select(
        'id, slug, display_name, description, category, validity_days, estimated_completion_days'
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
   * List all background check packages for administrators (including inactive).
   */
  adminListPackages: officeProcedure.query(async ({ ctx }) => {
    const packages = await fetchAdminPackages(ctx)
    return adminPackageSchema.array().parse(packages)
  }),

  /**
   * List all background check types for administrators.
   */
  adminListCheckTypes: officeProcedure.query(async ({ ctx }) => {
    const types = await fetchAdminCheckTypes(ctx)
    return adminCheckTypeSchema.array().parse(types)
  }),

  /**
   * Create or update a background check type.
   */
  adminUpsertCheckType: officeProcedure
    .input(adminUpsertCheckTypeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      const payload = {
        slug: input.slug,
        display_name: input.display_name,
        description: input.description ?? null,
        category: input.category ?? null,
        provider_check_code: input.provider_check_code ?? null,
        validity_days: input.validity_days ?? null,
        platform_cost_cents: input.platform_cost_cents,
        retail_cost_cents: input.retail_cost_cents ?? null,
        estimated_completion_days: input.estimated_completion_days ?? null,
        required_documents: input.required_documents?.filter((doc) => doc.trim().length > 0) ?? [],
        provider_configuration:
          input.provider_configuration &&
          typeof input.provider_configuration === 'object' &&
          !Array.isArray(input.provider_configuration)
            ? input.provider_configuration
            : {},
        metadata:
          input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
            ? input.metadata
            : input.metadata === undefined
              ? {}
              : input.metadata,
        is_active: input.is_active ?? true,
      }

      const query = supabaseAdmin.schema('core').from('background_check_types')

      const { data, error } = input.id
        ? await query
            .update(payload)
            .eq('id', input.id)
            .select(
              'id, slug, display_name, description, category, provider_check_code, validity_days, platform_cost_cents, retail_cost_cents, estimated_completion_days, required_documents, provider_configuration, metadata, is_active, created_at, updated_at'
            )
            .maybeSingle()
        : await query
            .insert(payload)
            .select(
              'id, slug, display_name, description, category, provider_check_code, validity_days, platform_cost_cents, retail_cost_cents, estimated_completion_days, required_documents, provider_configuration, metadata, is_active, created_at, updated_at'
            )
            .maybeSingle()

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save background check type',
          cause: error ?? undefined,
        })
      }

      return adminCheckTypeSchema.parse(mapAdminCheckType(data as RawAdminCheckTypeRow))
    }),

  /**
   * Create or update a background check package.
   */
  adminUpsertPackage: officeProcedure
    .input(adminUpsertPackageInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      const payload = {
        slug: input.slug,
        display_name: input.display_name,
        description: input.description ?? null,
        provider_package_code: input.provider_package_code ?? null,
        check_type_ids: input.check_type_ids,
        component_overrides: Array.isArray(input.component_overrides)
          ? input.component_overrides
          : [],
        platform_cost_cents: input.platform_cost_cents,
        retail_cost_cents: input.retail_cost_cents,
        estimated_completion_days: input.estimated_completion_days ?? null,
        metadata:
          input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
            ? input.metadata
            : input.metadata === undefined
              ? {}
              : input.metadata,
        is_active: input.is_active ?? true,
      }

      const query = supabaseAdmin.schema('core').from('background_check_packages')

      const { data, error } = input.id
        ? await query
            .update(payload)
            .eq('id', input.id)
            .select(
              'id, slug, display_name, description, provider_package_code, check_type_ids, component_overrides, platform_cost_cents, retail_cost_cents, estimated_completion_days, is_active, metadata, created_at, updated_at'
            )
            .maybeSingle()
        : await query
            .insert(payload)
            .select(
              'id, slug, display_name, description, provider_package_code, check_type_ids, component_overrides, platform_cost_cents, retail_cost_cents, estimated_completion_days, is_active, metadata, created_at, updated_at'
            )
            .maybeSingle()

      if (error || !data) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save background check package',
          cause: error ?? undefined,
        })
      }

      const packages = await fetchAdminPackages(ctx, [data.id as string])
      const [record] = packages

      if (!record) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load updated background check package',
        })
      }

      return adminPackageSchema.parse(record)
    }),

  /**
   * Set active state for a background check type.
   */
  adminSetCheckTypeActive: officeProcedure
    .input(adminToggleActiveInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      const { error } = await supabaseAdmin
        .schema('core')
        .from('background_check_types')
        .update({ is_active: input.is_active })
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update check type status',
          cause: error,
        })
      }

      return { success: true }
    }),

  /**
   * Set active state for a background check package.
   */
  adminSetPackageActive: officeProcedure
    .input(adminToggleActiveInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx

      const { error } = await supabaseAdmin
        .schema('core')
        .from('background_check_packages')
        .update({ is_active: input.is_active })
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update package status',
          cause: error,
        })
      }

      return { success: true }
    }),

  /**
   * Initiate a background check for the current user.
   */
  initiate: protectedProcedure
    .input(
      backgroundCheckInitiationSchema.omit({ organization_id: true, job_id: true }).extend({
        package_id: z.string().uuid(),
        organization_id: z.string().uuid().optional(),
        job_id: z.string().uuid().optional(),
      })
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

      if (!input.consent || !input.consent.consent_signature) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Worker consent is required before initiating a background check.',
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
        .select(
          'id, status, status_history, provider_check_id, metadata, estimated_completion_date'
        )
        .single()

      if (insertError || !record) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to create background check record',
          cause: insertError,
        })
      }

      if (input.consent) {
        await recordBackgroundCheckConsent(ctx, {
          backgroundCheckId: record.id,
          workerUserId: input.worker_user_id,
          consent: input.consent,
          source: 'organization_portal',
        })
      }

      await recordBackgroundCheckConsent(ctx, {
        backgroundCheckId: record.id,
        workerUserId: user!.id,
        consent: input.consent,
        source: 'worker_self_service',
      })

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
      .select(
        'id, status, package_id, completed_at, created_at, expires_at, invited_at, provider_check_id, findings, metadata, package:background_check_packages(id, display_name, slug)'
      )
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
      }))
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
          'id, status, status_history, package_id, check_type_ids, provider_check_id, summary, findings, component_statuses, metadata, created_at, updated_at, expires_at, estimated_completion_date'
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
        .select(
          'id, document_type, file_path, file_name, file_size, mime_type, uploaded_at, verified'
        )
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
   * Get detailed background check information for administrators.
   */
  adminGetCheck: officeProcedure
    .input(z.object({ background_check_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, supabaseAdmin } = ctx

      const { data: checkRecord, error: checkError } = await supabase
        .schema('core')
        .from('background_checks')
        .select(
          `
            id,
            status,
            status_history,
            package_id,
            check_type_ids,
            provider_check_id,
            summary,
            findings,
            component_statuses,
            metadata,
            created_at,
            updated_at,
            expires_at,
            estimated_completion_date,
            user:users!background_checks_user_id_fkey(id, display_name, username, email, avatar_path),
            organization:organizations!background_checks_organization_id_fkey(id, name),
            package:background_check_packages(id, display_name, slug)
          `
        )
        .eq('id', input.background_check_id)
        .maybeSingle()

      if (checkError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check for admin review',
          cause: checkError,
        })
      }

      if (!checkRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check not found',
        })
      }

      let hydratedCheck = checkRecord as BackgroundCheckRecord & {
        metadata?: unknown
        worker?: unknown
        organization?: unknown
        package?: unknown
      }

      if (shouldSyncStatus(hydratedCheck.status)) {
        const nationSearch = createNationSearchClient()
        const synced = await syncBackgroundCheckFromProvider({
          nationSearch,
          supabaseAdmin,
          check: hydratedCheck,
        })

        if (synced) {
          hydratedCheck = {
            ...hydratedCheck,
            ...synced,
          }
        }
      }

      const { data: documents, error: documentsError } = await supabase
        .schema('core')
        .from('background_check_documents')
        .select(
          'id, document_type, file_path, file_name, file_size, mime_type, uploaded_at, verified'
        )
        .eq('background_check_id', input.background_check_id)
        .order('uploaded_at', { ascending: false })

      if (documentsError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check documents',
          cause: documentsError,
        })
      }

      const { data: disputes, error: disputesError } = await supabase
        .schema('core')
        .from('background_check_disputes')
        .select(
          `
            id,
            status,
            dispute_reason,
            dispute_details,
            supporting_documents,
            created_at,
            resolved_at,
            resolution,
            resolution_notes
          `
        )
        .eq('background_check_id', input.background_check_id)
        .order('created_at', { ascending: true })

      if (disputesError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check disputes',
          cause: disputesError,
        })
      }

      return adminGetCheckOutputSchema.parse({
        check: {
          ...hydratedCheck,
          metadata:
            hydratedCheck.metadata && typeof hydratedCheck.metadata === 'object'
              ? (hydratedCheck.metadata as Record<string, unknown>)
              : null,
          worker: checkRecord.user ?? null,
          organization: checkRecord.organization ?? null,
        },
        documents: documents ?? [],
        disputes: disputes ?? [],
      })
    }),

  /**
   * List disputes for the authenticated user's background check.
   */
  listDisputesForCheck: protectedProcedure
    .input(z.object({ background_check_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('background_check_disputes')
        .select(
          'id, dispute_reason, dispute_details, supporting_documents, status, created_at, updated_at, resolved_at, resolution, resolution_notes'
        )
        .eq('background_check_id', input.background_check_id)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load disputes for this background check',
          cause: error,
        })
      }

      return (data ?? []).map((row) => ({
        id: row.id,
        dispute_reason: row.dispute_reason,
        dispute_details: row.dispute_details,
        supporting_documents: Array.isArray(row.supporting_documents)
          ? row.supporting_documents
          : [],
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        resolved_at: row.resolved_at,
        resolution: row.resolution,
        resolution_notes: row.resolution_notes,
      }))
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
        input.file_name
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
   * Update privacy controls for a background check record.
   */
  updatePrivacy: protectedProcedure
    .input(updatePrivacyInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data: existing, error: fetchError } = await supabase
        .schema('core')
        .from('background_checks')
        .select('metadata')
        .eq('id', input.background_check_id)
        .eq('user_id', user!.id)
        .maybeSingle()

      if (fetchError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check metadata',
          cause: fetchError,
        })
      }

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check not found for user',
        })
      }

      const existingMetadata =
        existing.metadata &&
        typeof existing.metadata === 'object' &&
        !Array.isArray(existing.metadata)
          ? (existing.metadata as Record<string, unknown>)
          : {}

      const updatedPrivacy = {
        share_publicly: input.share_publicly,
        shared_with_organization_ids: input.shared_with_organization_ids,
      }

      const updatedMetadata = mergeMetadata(existingMetadata, {
        privacy: updatedPrivacy,
      })

      const { error: updateError } = await supabase
        .schema('core')
        .from('background_checks')
        .update({ metadata: updatedMetadata })
        .eq('id', input.background_check_id)
        .eq('user_id', user!.id)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update background check privacy settings',
          cause: updateError,
        })
      }

      return {
        privacy: updatedPrivacy,
      }
    }),

  /**
   * Update privacy controls for a background check (admin override).
   */
  adminUpdatePrivacy: officeProcedure
    .input(updatePrivacyInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx

      const { data: existing, error: fetchError } = await supabase
        .schema('core')
        .from('background_checks')
        .select('metadata')
        .eq('id', input.background_check_id)
        .maybeSingle()

      if (fetchError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load background check metadata for admin update',
          cause: fetchError,
        })
      }

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Background check not found',
        })
      }

      const existingMetadata =
        existing.metadata &&
        typeof existing.metadata === 'object' &&
        !Array.isArray(existing.metadata)
          ? (existing.metadata as Record<string, unknown>)
          : {}

      const updatedPrivacy = {
        share_publicly: input.share_publicly,
        shared_with_organization_ids: input.shared_with_organization_ids,
      }

      const updatedMetadata = mergeMetadata(existingMetadata, {
        privacy: updatedPrivacy,
      })

      const { error: updateError } = await supabase
        .schema('core')
        .from('background_checks')
        .update({ metadata: updatedMetadata })
        .eq('id', input.background_check_id)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update background check privacy settings',
          cause: updateError,
        })
      }

      return {
        privacy: updatedPrivacy,
      }
    }),

  /**
   * Generate an admin download URL for a background check document.
   */
  adminGetDocumentDownloadUrl: officeProcedure
    .input(z.object({ document_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, supabaseAdmin, user } = ctx

      const { data: document, error: fetchError } = await supabase
        .schema('core')
        .from('background_check_documents')
        .select('file_path, file_name, background_check_id')
        .eq('id', input.document_id)
        .maybeSingle()

      if (fetchError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load document metadata',
          cause: fetchError,
        })
      }

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        })
      }

      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
        .from(BACKGROUND_CHECK_BUCKET_ID)
        .createSignedUrl(document.file_path, SIGNED_DOWNLOAD_URL_TTL_SECONDS, {
          download: document.file_name ?? undefined,
        })

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate download URL',
          cause: signedUrlError,
        })
      }

      await supabase
        .schema('core')
        .from('background_check_access_log')
        .insert({
          background_check_id: document.background_check_id,
          accessed_by_user_id: user!.id,
          access_type: 'document_download',
          accessed_data: {
            document_id: input.document_id,
            file_name: document.file_name,
          },
        })

      return {
        signedUrl: signedUrlData.signedUrl,
      }
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
          'id, status, status_history, requested_by_user_id, package:background_check_packages(display_name, slug)'
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
        const disputeHistory = Array.isArray(existing.status_history)
          ? [...existing.status_history]
          : []
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
          console.error(
            '[backgroundChecks.submitDispute] failed to update dispute status',
            disputeStatusError
          )
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
          `
        id,
        status,
        user_id,
        package_id,
        job_id,
        completed_at,
        created_at,
        expires_at,
        invited_at,
        provider_check_id,
        findings,
        metadata,
        package:background_check_packages(id, display_name, slug),
        worker:users!background_checks_user_id_fkey(id, display_name, username, email, avatar_path),
        job:jobs!background_checks_job_id_fkey(id, title)
      `
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

      return (data ?? []).map((row) => {
        const workerRecord = (row.worker ?? null) as {
          id?: string | null
          display_name?: string | null
          username?: string | null
          email?: string | null
          avatar_path?: string | null
        } | null
        const jobRecord = (row.job ?? null) as {
          id?: string | null
          title?: string | null
        } | null

        return {
          id: row.id,
          status: row.status,
          worker_user_id: row.user_id,
          job_id: row.job_id,
          package: row.package ?? null,
          worker: workerRecord
            ? {
                id: workerRecord.id ?? null,
                display_name: workerRecord.display_name ?? null,
                username: workerRecord.username ?? null,
                email: workerRecord.email ?? null,
                avatar_path: workerRecord.avatar_path ?? null,
              }
            : null,
          job: jobRecord
            ? {
                id: jobRecord.id ?? null,
                title: jobRecord.title ?? null,
              }
            : null,
          completed_at: row.completed_at,
          created_at: row.created_at,
          expires_at: row.expires_at,
          invited_at: row.invited_at,
          provider_check_id: row.provider_check_id,
          findings: row.findings,
          metadata: row.metadata,
        }
      })
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
        .extend({ paid_by: z.literal('organization') })
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
        .select(
          'id, status, status_history, provider_check_id, metadata, estimated_completion_date'
        )
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
          console.error(
            '[backgroundChecks.organizationInitiate] NationSearch initiation failed',
            error
          )
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
        console.error(
          '[backgroundChecks.organizationInitiate] failed to send invitation notification',
          error
        )
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
          'id, status, user_id, organization_id, job_id, requested_by_user_id, status_history, findings, summary, provider_check_id, metadata, component_statuses, completed_at, expires_at, estimated_completion_date, created_at, updated_at'
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
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      let query = supabase
        .schema('core')
        .from('background_checks')
        .select(
          `
            id,
            status,
            user_id,
            organization_id,
            job_id,
            requested_by_user_id,
            summary,
            findings,
            status_history,
            created_at,
            updated_at,
            invited_at,
            completed_at,
            expires_at,
            package:background_check_packages(id, display_name, slug),
            worker:users!background_checks_user_id_fkey(id, display_name, username, email, avatar_path),
            organization:organizations!background_checks_organization_id_fkey(id, name),
            requester:users!background_checks_requested_by_user_id_fkey(id, display_name, email)
          `
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

      return (data ?? []).map((row) => {
        const workerRecord = (row.worker ?? null) as {
          id?: string | null
          display_name?: string | null
          username?: string | null
          email?: string | null
          avatar_path?: string | null
        } | null
        const organizationRecord = (row.organization ?? null) as {
          id?: string | null
          name?: string | null
        } | null
        const requesterRecord = (row.requester ?? null) as {
          id?: string | null
          display_name?: string | null
          email?: string | null
        } | null

        return {
          id: row.id,
          status: row.status,
          user_id: row.user_id,
          organization_id: row.organization_id,
          job_id: row.job_id,
          requested_by_user_id: row.requested_by_user_id,
          summary: row.summary ?? null,
          findings: row.findings ?? null,
          status_history: row.status_history ?? null,
          created_at: row.created_at,
          updated_at: row.updated_at,
          invited_at: row.invited_at,
          completed_at: row.completed_at,
          expires_at: row.expires_at,
          package: row.package ?? null,
          worker: workerRecord
            ? {
                id: workerRecord.id ?? null,
                display_name: workerRecord.display_name ?? null,
                username: workerRecord.username ?? null,
                email: workerRecord.email ?? null,
                avatar_path: workerRecord.avatar_path ?? null,
              }
            : null,
          organization: organizationRecord
            ? {
                id: organizationRecord.id ?? null,
                name: organizationRecord.name ?? null,
              }
            : null,
          requester: requesterRecord
            ? {
                id: requesterRecord.id ?? null,
                display_name: requesterRecord.display_name ?? null,
                email: requesterRecord.email ?? null,
              }
            : null,
        }
      })
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data: existing, error: fetchError } = await supabase
        .schema('core')
        .from('background_checks')
        .select(
          'status_history, user_id, requested_by_user_id, package:background_check_packages(display_name, slug)'
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
          'id, status, updated_at, summary, findings, component_statuses, status_history, expires_at, user_id, requested_by_user_id, package:background_check_packages(display_name, slug)'
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
        console.error(
          '[backgroundChecks.adminUpdateStatus] failed to send status notification',
          error
        )
      }

      return updated
    }),

  adminListDisputes: officeProcedure
    .input(
      z
        .object({
          status: z.enum(['pending', 'under_review', 'resolved', 'upheld', 'cancelled']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      let query = supabase
        .schema('core')
        .from('background_check_disputes')
        .select(
          `
            id,
            background_check_id,
            user_id,
            dispute_reason,
            dispute_details,
            supporting_documents,
            status,
            created_at,
            updated_at,
            resolved_at,
            resolved_by_user_id,
            background_check:background_checks(
              id,
              status,
              summary,
              findings,
              completed_at,
              expires_at,
              package:background_check_packages(id, display_name, slug),
              worker:users!background_checks_user_id_fkey(id, display_name, username, email),
              organization:organizations!background_checks_organization_id_fkey(id, name)
            )
          `
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

      return (data ?? []).map((row) => {
        const backgroundCheckRecord = (row.background_check ?? null) as {
          id?: string | null
          status?: string | null
          summary?: string | null
          findings?: Record<string, unknown> | null
          completed_at?: string | null
          expires_at?: string | null
          package?: Record<string, unknown> | null
          worker?: {
            id?: string | null
            display_name?: string | null
            username?: string | null
            email?: string | null
          } | null
          organization?: { id?: string | null; name?: string | null } | null
        } | null

        return {
          id: row.id,
          background_check_id: row.background_check_id,
          user_id: row.user_id,
          dispute_reason: row.dispute_reason,
          dispute_details: row.dispute_details,
          supporting_documents: row.supporting_documents,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
          resolved_at: row.resolved_at,
          resolved_by_user_id: row.resolved_by_user_id,
          background_check: backgroundCheckRecord
            ? {
                id: backgroundCheckRecord.id ?? null,
                status: backgroundCheckRecord.status ?? null,
                summary: backgroundCheckRecord.summary ?? null,
                findings: backgroundCheckRecord.findings ?? null,
                completed_at: backgroundCheckRecord.completed_at ?? null,
                expires_at: backgroundCheckRecord.expires_at ?? null,
                package: backgroundCheckRecord.package ?? null,
                worker: backgroundCheckRecord.worker
                  ? {
                      id: backgroundCheckRecord.worker.id ?? null,
                      display_name: backgroundCheckRecord.worker.display_name ?? null,
                      username: backgroundCheckRecord.worker.username ?? null,
                      email: backgroundCheckRecord.worker.email ?? null,
                    }
                  : null,
                organization: backgroundCheckRecord.organization
                  ? {
                      id: backgroundCheckRecord.organization.id ?? null,
                      name: backgroundCheckRecord.organization.name ?? null,
                    }
                  : null,
              }
            : null,
        }
      })
    }),

  adminResolveDispute: officeProcedure
    .input(
      z.object({
        dispute_id: z.string().uuid(),
        status: z.enum(['resolved', 'upheld', 'cancelled']),
        resolution: z.string().nullable().optional(),
        resolution_notes: z.string().nullable().optional(),
      })
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

  adminGetMetrics: officeProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx

    const [{ data: checks, error: checksError }, { data: disputes, error: disputesError }] =
      await Promise.all([
        supabase
          .schema('core')
          .from('background_checks')
          .select(
            'status, created_at, completed_at, package:background_check_packages(id, display_name, slug)'
          ),
        supabase.schema('core').from('background_check_disputes').select('status'),
      ])

    if (checksError || disputesError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to load background check metrics',
        cause: checksError ?? disputesError,
      })
    }

    const statusTotals: Record<string, number> = {}
    const packageTotals: Record<string, number> = {}
    let completedCount = 0
    let durationSumDays = 0
    ;(checks ?? []).forEach((record) => {
      const status = record.status ?? 'unknown'
      statusTotals[status] = (statusTotals[status] ?? 0) + 1

      if (record.completed_at) {
        const createdAt = new Date(record.created_at ?? record.completed_at).getTime()
        const completedAt = new Date(record.completed_at).getTime()
        if (!Number.isNaN(createdAt) && !Number.isNaN(completedAt) && completedAt >= createdAt) {
          const diffDays = (completedAt - createdAt) / (1000 * 60 * 60 * 24)
          durationSumDays += diffDays
          completedCount += 1
        }
      }

      const packageLabel =
        record.package?.display_name ?? record.package?.slug ?? 'Uncategorized Package'
      packageTotals[packageLabel] = (packageTotals[packageLabel] ?? 0) + 1
    })

    const disputeTotals: Record<string, number> = {}
    ;(disputes ?? []).forEach((record) => {
      const status = record.status ?? 'unknown'
      disputeTotals[status] = (disputeTotals[status] ?? 0) + 1
    })

    const averageCompletionDays =
      completedCount > 0 ? +(durationSumDays / completedCount).toFixed(1) : null

    const packageDistribution = Object.entries(packageTotals).map(([label, count]) => ({
      label,
      count,
    }))

    return {
      totals: {
        checks: checks?.length ?? 0,
        under_review: statusTotals['under_review'] ?? 0,
        disputed: statusTotals['disputed'] ?? 0,
        completed:
          (statusTotals['completed_clear'] ?? 0) +
          (statusTotals['completed_consider'] ?? 0) +
          (statusTotals['completed_not_clear'] ?? 0),
      },
      disputes: {
        pending: disputeTotals['pending'] ?? 0,
        under_review: disputeTotals['under_review'] ?? 0,
        resolved: disputeTotals['resolved'] ?? 0,
        upheld: disputeTotals['upheld'] ?? 0,
      },
      averageCompletionDays,
      packageDistribution,
    }
  }),

  adminGetAccessLog: officeProcedure
    .input(
      z
        .object({
          limit: z.number().int().positive().max(500).default(200),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('background_check_access_log')
        .select(
          `
            id,
            background_check_id,
            accessed_by_user_id,
            access_type,
            accessed_at,
            ip_address,
            user_agent,
            background_check:background_checks(
              id,
              status,
              package:background_check_packages(id, display_name, slug),
              worker:users!background_checks_user_id_fkey(id, display_name, username, email)
            ),
            actor:users!background_check_access_log_accessed_by_user_id_fkey(id, display_name, username, email)
          `
        )
        .order('accessed_at', { ascending: false })
        .limit(input?.limit ?? 200)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load access log entries',
          cause: error,
        })
      }

      return (data ?? []).map((row) => {
        const backgroundCheckRecord = (row.background_check ?? null) as {
          id?: string | null
          status?: string | null
          package?: { display_name?: string | null; slug?: string | null } | null
          worker?: {
            id?: string | null
            display_name?: string | null
            username?: string | null
            email?: string | null
          } | null
        } | null

        const actorRecord = (row.actor ?? null) as {
          id?: string | null
          display_name?: string | null
          username?: string | null
          email?: string | null
        } | null

        const backgroundCheckPackage =
          backgroundCheckRecord?.package?.display_name ??
          backgroundCheckRecord?.package?.slug ??
          null
        const workerName =
          backgroundCheckRecord?.worker?.display_name ??
          backgroundCheckRecord?.worker?.username ??
          (backgroundCheckRecord?.worker?.id
            ? `User ${backgroundCheckRecord.worker.id.slice(0, 8)}`
            : null)

        const actorName =
          actorRecord?.display_name ??
          actorRecord?.username ??
          (actorRecord?.id ? `User ${actorRecord.id.slice(0, 8)}` : 'Administrator')

        return {
          id: row.id,
          background_check_id: row.background_check_id,
          access_type: row.access_type,
          accessed_at: row.accessed_at,
          ip_address: row.ip_address,
          user_agent: row.user_agent,
          actor: {
            id: actorRecord?.id ?? null,
            name: actorName,
            email: actorRecord?.email ?? null,
          },
          background_check: {
            id: backgroundCheckRecord?.id ?? null,
            status: backgroundCheckRecord?.status ?? null,
            package_name: backgroundCheckPackage,
            worker_name: workerName,
          },
        }
      })
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
