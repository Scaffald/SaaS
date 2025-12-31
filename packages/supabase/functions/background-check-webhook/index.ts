import { serve } from 'https://deno.land/std@0.223.0/http/server'
import { z } from 'zod'
import { notifyBackgroundCheckStatusChange } from '../_shared/background-check-notifications'
import {
  appendStatusHistory,
  BACKGROUND_CHECK_SYNC_COLUMNS,
  BackgroundCheckStatus,
  mapProviderStatus,
  mergeMetadata,
} from '../_shared/background-check-status'
import { corsHeaders } from '../_shared/cors'
import { createNationSearchClient } from '../_shared/nationsearch/client'
import type { NotificationSupabaseClient } from '../_shared/notifications/types'
import { createServiceSupabaseClient } from '../_shared/notifications/utils'

const SIGNATURE_HEADER = 'x-nationsearch-signature'
const IDEMPOTENCY_HEADER = 'x-nationsearch-idempotency'
const IDEMPOTENCY_TTL_MS = 1000 * 60 * 60 // 1 hour

const processedEvents = new Map<string, number>()

const componentStatusSchema = z.object({
  code: z.string(),
  status: z.string(),
  completed_at: z.string().datetime().nullable().optional(),
  findings: z.record(z.string(), z.unknown()).nullable().optional(),
})

const webhookEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'check.created',
    'check.in_progress',
    'check.component_completed',
    'check.completed',
    'check.failed',
  ]),
  created_at: z.string().datetime().optional(),
  idempotency_key: z.string().optional(),
  data: z.object({
    check_id: z.string(),
    status: z.string().optional(),
    summary: z.string().nullable().optional(),
    findings: z.record(z.string(), z.unknown()).nullable().optional(),
    completed_at: z.string().datetime().nullable().optional(),
    expires_at: z.string().datetime().nullable().optional(),
    estimated_completion_date: z.string().datetime().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    components: z.array(componentStatusSchema).optional(),
    component: componentStatusSchema.optional(),
  }),
})

type WebhookEvent = z.infer<typeof webhookEventSchema>

const eventStatusDefaults: Record<WebhookEvent['type'], string | null> = {
  'check.created': 'submitted',
  'check.in_progress': 'in_progress',
  'check.component_completed': null,
  'check.completed': 'completed_clear',
  'check.failed': 'failed',
}

function cleanupIdempotencyCache() {
  const now = Date.now()
  for (const [key, timestamp] of processedEvents.entries()) {
    if (now - timestamp > IDEMPOTENCY_TTL_MS) {
      processedEvents.delete(key)
    }
  }
}

function isDuplicateEvent(key: string | null | undefined): boolean {
  if (!key) return false
  cleanupIdempotencyCache()
  const now = Date.now()
  const lastProcessed = processedEvents.get(key)
  if (lastProcessed && now - lastProcessed < IDEMPOTENCY_TTL_MS) {
    return true
  }
  processedEvents.set(key, now)
  return false
}

function getClientIp(req: Request): string | null {
  const xForwardedFor = req.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    const ip = xForwardedFor.split(',')[0]?.trim()
    if (ip) return ip
  }
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp.trim()
  return null
}

function assertIpAllowed(req: Request) {
  const allowList = (Deno.env.get('NATIONSEARCH_ALLOWED_IPS') ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (allowList.length === 0) {
    return
  }

  const ip = getClientIp(req)
  if (!ip || !allowList.includes(ip)) {
    throw Object.assign(new Error('ip_not_allowed'), { status: 403 })
  }
}

async function verifySignature(signature: string | null, rawBody: string): Promise<void> {
  if (!signature) {
    throw Object.assign(new Error('missing_signature'), { status: 401 })
  }

  const client = createNationSearchClient()
  const isValid = await client.verifyWebhookSignature(signature, rawBody)
  if (!isValid) {
    throw Object.assign(new Error('invalid_signature'), { status: 401 })
  }
}

async function updateComponentStatuses(existing: unknown, event: WebhookEvent): Promise<unknown> {
  const components: Array<Record<string, unknown>> = Array.isArray(existing)
    ? [...(existing as Array<Record<string, unknown>>)]
    : []

  const updates: Array<z.infer<typeof componentStatusSchema>> = []

  if (event.data.components?.length) {
    updates.push(...event.data.components)
  }

  if (event.data.component) {
    updates.push(event.data.component)
  }

  if (updates.length === 0) {
    return components
  }

  for (const update of updates) {
    const index = components.findIndex(
      (component) => (component?.code as string | undefined) === update.code
    )
    const merged = {
      ...(index >= 0 ? components[index] : {}),
      ...update,
      completed_at: update.completed_at ?? components[index]?.completed_at ?? null,
      findings: update.findings ?? components[index]?.findings ?? null,
    }

    if (index >= 0) {
      components[index] = merged
    } else {
      components.push(merged)
    }
  }

  return components
}

type BackgroundCheckRecord = {
  id: string
  status: BackgroundCheckStatus
  status_history?: unknown
  provider_check_id?: string | null
  provider_reference?: unknown
  summary?: string | null
  findings?: unknown
  component_statuses?: unknown
  completed_at?: string | null
  expires_at?: string | null
  estimated_completion_date?: string | null
  user_id: string
  requested_by_user_id?: string | null
  package?: { display_name?: string | null; slug?: string | null } | null
}

async function handleEvent(
  supabase: NotificationSupabaseClient,
  event: WebhookEvent
): Promise<Response> {
  const providerCheckId = event.data.check_id

  const { data: check, error: fetchError } = await supabase
    .schema('core')
    .from('background_checks')
    .select(BACKGROUND_CHECK_SYNC_COLUMNS)
    .eq('provider_check_id', providerCheckId)
    .maybeSingle()

  if (fetchError) {
    console.error('[background-check-webhook] failed to load background check', fetchError)
    throw Object.assign(new Error('failed_to_load_check'), { status: 500 })
  }

  if (!check) {
    console.warn('[background-check-webhook] ignoring webhook for unknown check', {
      providerCheckId,
      eventId: event.id,
    })
    return new Response(JSON.stringify({ ok: true, ignored: 'unknown_check' }), {
      status: 202,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const typedCheck = check as BackgroundCheckRecord

  const updates: Record<string, unknown> = {}
  let history = Array.isArray(typedCheck.status_history)
    ? [...(typedCheck.status_history as unknown[])]
    : []
  let shouldRecordHistory = false
  const occurredAt = new Date().toISOString()

  const candidateStatus =
    mapProviderStatus(event.data.status ?? null) ??
    (eventStatusDefaults[event.type] ? mapProviderStatus(eventStatusDefaults[event.type]) : null)

  if (candidateStatus && candidateStatus !== typedCheck.status) {
    updates.status = candidateStatus
    shouldRecordHistory = true
  }

  if (event.data.summary !== undefined) {
    updates.summary = event.data.summary ?? null
    shouldRecordHistory = true
  }

  if (event.data.findings !== undefined) {
    updates.findings = event.data.findings ?? null
    shouldRecordHistory = true
  }

  if (
    event.type === 'check.component_completed' ||
    (event.data.components && event.data.components.length > 0)
  ) {
    updates.component_statuses = await updateComponentStatuses(typedCheck.component_statuses, event)
    shouldRecordHistory = true
  }

  if (event.data.completed_at !== undefined) {
    updates.completed_at = event.data.completed_at ?? null
    shouldRecordHistory = true
  }

  if (event.data.expires_at !== undefined) {
    updates.expires_at = event.data.expires_at ?? null
    shouldRecordHistory = true
  }

  if (event.data.estimated_completion_date !== undefined) {
    updates.estimated_completion_date = event.data.estimated_completion_date ?? null
    shouldRecordHistory = true
  }

  const previousReference =
    typedCheck.provider_reference && typeof typedCheck.provider_reference === 'object'
      ? (typedCheck.provider_reference as Record<string, unknown>)
      : {}
  const previousNationSearch =
    previousReference?.nationsearch && typeof previousReference.nationsearch === 'object'
      ? (previousReference.nationsearch as Record<string, unknown>)
      : {}

  updates.provider_reference = mergeMetadata(typedCheck.provider_reference, {
    nationsearch: {
      ...previousNationSearch,
      last_event: event,
    },
  })
  shouldRecordHistory = true

  if (shouldRecordHistory) {
    const historyEntry: Record<string, unknown> = {
      status: (updates.status as BackgroundCheckStatus | undefined) ?? typedCheck.status,
      occurred_at: occurredAt,
      actor: 'provider',
      event: event.type,
      provider_status: event.data.status ?? eventStatusDefaults[event.type] ?? null,
    }
    history = appendStatusHistory(history, historyEntry)
    updates.status_history = history
  }

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ ok: true, unchanged: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const { data: updated, error: updateError } = await supabase
    .schema('core')
    .from('background_checks')
    .update(updates)
    .eq('id', typedCheck.id)
    .select(BACKGROUND_CHECK_SYNC_COLUMNS)
    .maybeSingle()

  if (updateError) {
    console.error('[background-check-webhook] failed to update check', updateError)
    throw Object.assign(new Error('failed_to_update_check'), { status: 500 })
  }

  const refreshed = (updated ?? { ...typedCheck, ...updates }) as BackgroundCheckRecord

  if (refreshed.status !== typedCheck.status) {
    await notifyBackgroundCheckStatusChange({
      supabase,
      status: refreshed.status,
      workerId: refreshed.user_id,
      requesterId: refreshed.requested_by_user_id ?? null,
      checkId: refreshed.id,
      packageName: refreshed.package?.display_name ?? refreshed.package?.slug ?? null,
      summary: refreshed.summary ?? null,
      actorId: 'nationsearch:webhook',
    })
  }

  return new Response(JSON.stringify({ ok: true, updated: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  let rawBody: string

  try {
    assertIpAllowed(req)
    rawBody = await req.text()
    await verifySignature(req.headers.get(SIGNATURE_HEADER), rawBody)
  } catch (error) {
    const status = (error as { status?: number }).status ?? 400
    return new Response(JSON.stringify({ error: (error as Error).message ?? 'invalid_request' }), {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  let event: WebhookEvent
  try {
    const parsed = JSON.parse(rawBody)
    event = webhookEventSchema.parse(parsed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'invalid_payload', issues: error.issues }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const idempotencyKey =
    event.idempotency_key ?? req.headers.get(IDEMPOTENCY_HEADER) ?? `${event.type}:${event.id}`

  if (isDuplicateEvent(idempotencyKey)) {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createServiceSupabaseClient()

  try {
    return await handleEvent(supabase, event)
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500
    console.error('[background-check-webhook] unhandled error', error)
    return new Response(JSON.stringify({ error: (error as Error).message ?? 'unhandled_error' }), {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
