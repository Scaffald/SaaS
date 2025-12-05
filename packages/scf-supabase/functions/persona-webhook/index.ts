import { serve } from 'https://deno.land/std@0.223.0/http/server'
import { z } from 'zod'

import { corsHeaders } from '../_shared/cors'
import { addMonths, mergeMetadata, patchPersonaMetadata } from '../_shared/id-verification-utils'
import { createServiceSupabaseClient } from '../_shared/notifications/utils'

const SIGNATURE_HEADER = 'persona-signature'
const SUCCESS_STATUSES = ['approved', 'completed', 'passed', 'succeeded']
const FAILURE_STATUSES = ['declined', 'failed', 'fraud', 'rejected', 'canceled']
const EXPIRED_STATUSES = ['expired', 'abandoned']

const personaEventSchema = z.object({
  data: z.object({
    id: z.string(),
    type: z.string(),
    attributes: z
      .object({
        status: z.string().optional(),
        status_reason: z.string().optional(),
        completed_at: z.string().datetime().optional(),
        expired_at: z.string().datetime().optional(),
        created_at: z.string().datetime().optional(),
        reference_id: z.string().optional(),
      })
      .passthrough(),
    relationships: z
      .object({
        inquiry: z
          .object({
            data: z
              .object({
                id: z.string(),
              })
              .nullable()
              .optional(),
          })
          .optional(),
      })
      .optional(),
  }),
})

type PersonaEvent = z.infer<typeof personaEventSchema>

function extractInquiryId(event: PersonaEvent): string | null {
  const relationshipId =
    event.data.relationships?.inquiry?.data &&
    typeof event.data.relationships.inquiry.data === 'object'
      ? event.data.relationships.inquiry.data?.id
      : null
  if (relationshipId) return relationshipId
  return event.data.id ?? null
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
  const allowList = (Deno.env.get('PERSONA_ALLOWED_IPS') ?? '')
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

function extractSignatureValue(header: string | null): string | null {
  if (!header) return null
  if (header.includes('v1=')) {
    const part = header
      .split(',')
      .map((chunk) => chunk.trim())
      .find((chunk) => chunk.startsWith('v1='))
    return part ? (part.split('=', 2)[1] ?? null) : null
  }
  return header.trim()
}

async function computeSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const bytes = new Uint8Array(signature)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

async function verifySignature(signatureHeader: string | null, rawBody: string): Promise<void> {
  const secret = Deno.env.get('PERSONA_WEBHOOK_SECRET')
  if (!secret) {
    return
  }

  const signature = extractSignatureValue(signatureHeader)
  if (!signature) {
    throw Object.assign(new Error('missing_signature'), { status: 401 })
  }

  const computed = await computeSignature(secret, rawBody)
  if (!timingSafeEqual(computed, signature)) {
    throw Object.assign(new Error('invalid_signature'), { status: 401 })
  }
}

function determineTransition(
  event: PersonaEvent,
  status: string | null
): 'activate' | 'expire' | 'revoke' | null {
  const normalizedStatus = status?.toLowerCase() ?? ''
  if (SUCCESS_STATUSES.some((candidate) => normalizedStatus.includes(candidate))) {
    return 'activate'
  }
  if (EXPIRED_STATUSES.some((candidate) => normalizedStatus.includes(candidate))) {
    return 'expire'
  }
  if (FAILURE_STATUSES.some((candidate) => normalizedStatus.includes(candidate))) {
    return 'revoke'
  }

  const type = event.data.type.toLowerCase()
  if (type.includes('approved') || type.includes('completed')) {
    return 'activate'
  }
  if (type.includes('expired')) {
    return 'expire'
  }
  if (type.includes('declined') || type.includes('failed')) {
    return 'revoke'
  }

  return null
}

async function handleEvent(event: PersonaEvent): Promise<Response> {
  const inquiryId = extractInquiryId(event)
  if (!inquiryId) {
    return new Response(JSON.stringify({ ok: true, ignored: 'missing_inquiry' }), {
      status: 202,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createServiceSupabaseClient()

  const { data: verification, error } = await supabase
    .schema('core')
    .from('id_verifications')
    .select('id, badge_status, badge_expires_at, metadata, persona_status')
    .eq('persona_inquiry_id', inquiryId)
    .maybeSingle()

  if (error) {
    console.error('[persona-webhook] failed to load verification', error)
    throw Object.assign(new Error('failed_to_load_verification'), { status: 500 })
  }

  if (!verification) {
    console.warn('[persona-webhook] unknown inquiry id', { inquiryId, eventType: event.data.type })
    return new Response(JSON.stringify({ ok: true, ignored: 'unknown_inquiry' }), {
      status: 202,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const personaStatus = event.data.attributes?.status ?? null
  const transition = determineTransition(event, personaStatus)
  const nowIso = new Date().toISOString()

  const updates: Record<string, unknown> = {
    persona_status: personaStatus ?? verification.persona_status ?? event.data.type,
    metadata: patchPersonaMetadata(verification.metadata, {
      last_event: {
        type: event.data.type,
        status: personaStatus ?? null,
        received_at: nowIso,
      },
    }),
  }

  if (transition === 'activate') {
    const verifiedAt = new Date()
    updates.badge_status = 'active'
    updates.verified_at = verifiedAt.toISOString()
    updates.badge_expires_at = addMonths(verifiedAt).toISOString()
    updates.revoked_at = null
    updates.revocation_reason = null
  } else if (transition === 'expire') {
    updates.badge_status = 'expired'
    updates.badge_expires_at =
      event.data.attributes?.expired_at ?? verification.badge_expires_at ?? nowIso
  } else if (transition === 'revoke') {
    updates.badge_status = 'revoked'
    updates.revoked_at = nowIso
    updates.revocation_reason = event.data.attributes?.status_reason ?? `persona:${event.data.type}`
  } else {
    // Still update metadata/persona status even if no badge transition.
  }

  const mergedMetadata = mergeMetadata(
    verification.metadata,
    updates.metadata as Record<string, unknown>
  )
  updates.metadata = mergedMetadata

  const { error: updateError } = await supabase
    .schema('core')
    .from('id_verifications')
    .update({
      ...updates,
      metadata: mergedMetadata,
    })
    .eq('id', verification.id)

  if (updateError) {
    console.error('[persona-webhook] failed to update verification', updateError)
    throw Object.assign(new Error('failed_to_update_verification'), { status: 500 })
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
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
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

  let event: PersonaEvent
  try {
    const parsed = JSON.parse(rawBody)
    event = personaEventSchema.parse(parsed)
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

  try {
    return await handleEvent(event)
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500
    console.error('[persona-webhook] unhandled error', error)
    return new Response(JSON.stringify({ error: (error as Error).message ?? 'internal_error' }), {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
