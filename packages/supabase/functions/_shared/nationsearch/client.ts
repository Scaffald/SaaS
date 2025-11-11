/**
 * Thin NationSearch REST client for Edge Functions.
 * Handles authenticated requests, HMAC signatures, retries, and webhook validation.
 */

const DEFAULT_TIMEOUT_MS = 15_000
const SIGNATURE_HEADER = 'x-nationsearch-signature'
const IDEMPOTENCY_HEADER = 'Idempotency-Key'

const textEncoder = new TextEncoder()

type FetchLike = (input: string | Request, init?: RequestInit) => Promise<Response>

export interface NationSearchClientOptions {
  baseUrl?: string
  apiKey?: string
  apiSecret?: string
  fetchImpl?: FetchLike
  timeoutMs?: number
  userAgent?: string
}

export interface NationSearchRequestOptions extends RequestInit {
  idempotencyKey?: string
  retryCount?: number
}

export interface InitiateCheckPayload {
  package_code: string
  user: {
    id: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    date_of_birth?: string
    ssn_last4?: string
  }
  organization?: {
    id: string
    name?: string
  }
  custom_configuration?: Record<string, unknown>
  documents?: Array<{
    document_type: string
    file_url: string
    file_name?: string
  }>
  metadata?: Record<string, unknown>
}

export interface SubmitDocumentPayload {
  document_type: string
  file_url: string
  file_name?: string
  metadata?: Record<string, unknown>
}

export interface NationSearchErrorPayload {
  code: string
  message: string
  details?: unknown
}

export class NationSearchError extends Error {
  public readonly status: number
  public readonly payload?: NationSearchErrorPayload

  constructor(message: string, status: number, payload?: NationSearchErrorPayload) {
    super(message)
    this.status = status
    this.payload = payload
    this.name = 'NationSearchError'
  }
}

async function hmacSha256(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payload))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function getBaseConfig(): Required<Pick<NationSearchClientOptions, 'apiKey' | 'apiSecret' | 'baseUrl'>> {
  const apiKey = Deno.env.get('NATIONSEARCH_API_KEY') ?? ''
  const apiSecret = Deno.env.get('NATIONSEARCH_API_SECRET') ?? ''
  const baseUrl = Deno.env.get('NATIONSEARCH_BASE_URL') ?? 'https://api.nationsearch.com/v1'

  if (!apiKey || !apiSecret) {
    throw new Error('NationSearch credentials are not configured. Set NATIONSEARCH_API_KEY and NATIONSEARCH_API_SECRET.')
  }

  return { apiKey, apiSecret, baseUrl }
}

async function requestWithRetry(
  fetchImpl: FetchLike,
  baseUrl: string,
  apiKey: string,
  apiSecret: string,
  path: string,
  init: NationSearchRequestOptions = {},
  timeoutMs: number,
  userAgent?: string,
): Promise<unknown> {
  const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  const method = init.method ?? (init.body ? 'POST' : 'GET')
  const bodyString = init.body ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : undefined
  const headers = new Headers(init.headers)

  headers.set('Authorization', `Bearer ${apiKey}`)
  headers.set('Content-Type', 'application/json')
  if (userAgent) headers.set('User-Agent', userAgent)
  if (init.idempotencyKey) headers.set(IDEMPOTENCY_HEADER, init.idempotencyKey)

  if (bodyString) {
    const signature = await hmacSha256(apiSecret, bodyString)
    headers.set(SIGNATURE_HEADER, signature)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(
      url,
      {
        ...init,
        method,
        body: bodyString,
        headers,
        signal: controller.signal,
      },
    )

    const responseText = await response.text()
    const json = responseText ? JSON.parse(responseText) : undefined

    if (!response.ok) {
      const payload = json as NationSearchErrorPayload | undefined
      throw new NationSearchError(payload?.message ?? `NationSearch request failed with status ${response.status}`, response.status, payload)
    }

    return json
  } catch (error) {
    const retryCount = init.retryCount ?? 0
    if (retryCount < 2 && shouldRetry(error)) {
      return requestWithRetry(fetchImpl, baseUrl, apiKey, apiSecret, path, { ...init, retryCount: retryCount + 1 }, timeoutMs * 2, userAgent)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof NationSearchError) {
    return error.status >= 500 || error.status === 429
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }
  return false
}

export function createNationSearchClient(options: NationSearchClientOptions = {}) {
  const { apiKey, apiSecret, baseUrl } = getBaseConfig()
  const resolvedBaseUrl = options.baseUrl ?? baseUrl
  const resolvedApiKey = options.apiKey ?? apiKey
  const resolvedApiSecret = options.apiSecret ?? apiSecret
  const fetchImpl = options.fetchImpl ?? fetch
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const userAgent =
    options.userAgent ??
    `nationsearch-client/1.0 (runtime=deno; commit=${Deno.env.get('RELEASE_VERSION') ?? 'dev'})`

  return {
    /**
     * Initiate a background check with NationSearch
     */
    async initiateCheck(payload: InitiateCheckPayload, idempotencyKey = crypto.randomUUID()) {
      return requestWithRetry(
        fetchImpl,
        resolvedBaseUrl,
        resolvedApiKey,
        resolvedApiSecret,
        '/checks',
        {
          method: 'POST',
          body: payload,
          idempotencyKey,
        },
        timeoutMs,
        userAgent,
      )
    },

    /**
     * Fetch NationSearch check status/details
     */
    async getCheck(checkId: string) {
      return requestWithRetry(
        fetchImpl,
        resolvedBaseUrl,
        resolvedApiKey,
        resolvedApiSecret,
        `/checks/${checkId}`,
        { method: 'GET' },
        timeoutMs,
        userAgent,
      )
    },

    /**
     * Submit supplemental documentation for an existing check
     */
    async submitDocument(checkId: string, payload: SubmitDocumentPayload) {
      return requestWithRetry(
        fetchImpl,
        resolvedBaseUrl,
        resolvedApiKey,
        resolvedApiSecret,
        `/checks/${checkId}/documents`,
        {
          method: 'POST',
          body: payload,
        },
        timeoutMs,
        userAgent,
      )
    },

    /**
     * Cancel a check prior to completion
     */
    async cancelCheck(checkId: string, reason?: string) {
      return requestWithRetry(
        fetchImpl,
        resolvedBaseUrl,
        resolvedApiKey,
        resolvedApiSecret,
        `/checks/${checkId}`,
        {
          method: 'DELETE',
          body: reason ? { reason } : undefined,
        },
        timeoutMs,
        userAgent,
      )
    },

    /**
     * Validate webhook signature sent by NationSearch.
     */
    async verifyWebhookSignature(signature: string, rawBody: string) {
      const expected = await hmacSha256(resolvedApiSecret, rawBody)
      // Constant time comparison
      const a = textEncoder.encode(signature)
      const b = textEncoder.encode(expected)
      if (a.length !== b.length) return false
      let result = 0
      for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i]
      }
      return result === 0
    },
  }
}

export type NationSearchClient = ReturnType<typeof createNationSearchClient>

