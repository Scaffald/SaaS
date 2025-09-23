import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios'
import { performance } from 'node:perf_hooks'

const DEFAULT_BASE_URL = 'https://jooble.org/api'

export interface JoobleClientOptions {
  /** Override the API key used for authentication. Defaults to process.env.JOOBLE_API_KEY. */
  apiKey?: string
  /** Override the base URL used by the HTTP client. */
  baseURL?: string
  /** Provide a preconfigured axios instance (mainly for testing). */
  httpClient?: AxiosInstance
  /** Enable axios proxy resolution. Disabled by default to keep tests deterministic. */
  useProxy?: boolean
}

export interface JoobleSearchRequest {
  keywords?: string
  location?: string
  radius?: number
  page?: number
  size?: number
}

export interface JoobleJob {
  id: string
  title: string
  location?: string
  snippet?: string
  salary?: string
  type?: string
  company?: string
  link?: string
  updated?: string
  published?: string
}

export interface JoobleSearchResponse {
  totalCount?: number
  jobs: JoobleJob[]
  error?: string
}

export interface JoobleClientResult {
  data: JoobleSearchResponse
  durationMs: number
  status: number
}

function assertApiKey(apiKey?: string): string {
  const resolved = apiKey ?? process.env.JOOBLE_API_KEY
  if (!resolved) {
    throw new Error('JOOBLE_API_KEY is not defined')
  }

  return resolved
}

function cleanPayload(payload: JoobleSearchRequest): JoobleSearchRequest {
  const result: JoobleSearchRequest = {}

  if (payload.keywords) {
    result.keywords = payload.keywords
  }

  if (payload.location) {
    result.location = payload.location
  }

  if (typeof payload.radius === 'number') {
    result.radius = payload.radius
  }

  if (typeof payload.page === 'number') {
    result.page = payload.page
  }

  if (typeof payload.size === 'number') {
    result.size = payload.size
  }

  return result
}

export class JoobleClient {
  private readonly apiKey: string
  private readonly http: AxiosInstance

  constructor(options: JoobleClientOptions = {}) {
    this.apiKey = assertApiKey(options.apiKey)
    if (options.httpClient) {
      this.http = options.httpClient
    } else {
      const axiosConfig: CreateAxiosDefaults = { baseURL: options.baseURL ?? DEFAULT_BASE_URL }
      if (!options.useProxy) {
        axiosConfig.proxy = false
      }

      this.http = axios.create(axiosConfig)
    }
  }

  async search(
    payload: JoobleSearchRequest,
    options: { signal?: AbortSignal } = {}
  ): Promise<JoobleClientResult> {
    const cleanedPayload = cleanPayload(payload)
    const startedAt = performance.now()

    try {
      const response = await this.http.post<JoobleSearchResponse>(
        `/${this.apiKey}`,
        cleanedPayload,
        { signal: options.signal }
      )

      if (response.data?.error) {
        throw new Error(response.data.error)
      }

      const durationMs = performance.now() - startedAt
      const data: JoobleSearchResponse = {
        totalCount: response.data?.totalCount ?? response.data?.jobs?.length ?? 0,
        jobs: response.data?.jobs ?? [],
      }

      return {
        data,
        durationMs,
        status: response.status,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          typeof error.response?.data === 'string'
            ? error.response?.data
            : (error.response?.data?.error ?? error.message)

        throw new Error(
          `Jooble request failed (${error.response?.status ?? 'no-status'}): ${errorMessage}`
        )
      }

      throw error
    }
  }
}
