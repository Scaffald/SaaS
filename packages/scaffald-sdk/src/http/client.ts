import type { ScaffaldConfigInternal } from '../config.js'
import { createErrorFromResponse, ScaffaldError } from './errors.js'

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  query?: Record<string, any>
  body?: any
  headers?: Record<string, string>
  idempotencyKey?: string
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class HttpClient {
  private config: ScaffaldConfigInternal
  private rateLimitInfo?: RateLimitInfo

  constructor(config: ScaffaldConfigInternal) {
    this.config = config
  }

  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.rateLimitInfo
  }

  async request<T = any>(options: RequestOptions, attempt = 0): Promise<T> {
    const { method, path, query, body, headers = {}, idempotencyKey } = options
    const url = new URL(path, this.config.baseUrl)
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'scaffald-sdk-js/0.1.0',
      ...this.config.headers,
      ...headers,
    }

    if (this.config.apiKey) {
      requestHeaders['Authorization'] = 'Bearer ' + this.config.apiKey
    } else if (this.config.accessToken) {
      requestHeaders['Authorization'] = 'Bearer ' + this.config.accessToken
    }

    if (method === 'POST' && idempotencyKey) {
      requestHeaders['Idempotency-Key'] = idempotencyKey
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
      const urlString = url.toString()

      const response = await fetch(urlString, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      this.parseRateLimitHeaders(response)
      const requestId = response.headers.get('x-request-id') || undefined

      if (response.ok) {
        if (response.status === 204) return undefined as T
        const data = await response.json()
        return data
      }

      const errorBody = await response.json().catch(() => ({}))
      const error = createErrorFromResponse(response.status, errorBody, requestId)

      if (this.shouldRetry(method, response.status, attempt)) {
        const delay = this.getRetryDelay(response, attempt)
        await sleep(delay)
        return this.request(options, attempt + 1)
      }

      throw error
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ScaffaldError('Request timeout')
      }
      if (error instanceof ScaffaldError) throw error
      throw new ScaffaldError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  private parseRateLimitHeaders(response: Response): void {
    const limit = response.headers.get('x-ratelimit-limit')
    const remaining = response.headers.get('x-ratelimit-remaining')
    const reset = response.headers.get('x-ratelimit-reset')

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      }
    }
  }

  private shouldRetry(method: string, statusCode: number, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) return false
    if (method === 'POST') return false
    return [408, 429, 500, 502, 503, 504].includes(statusCode)
  }

  private getRetryDelay(response: Response, attempt: number): number {
    const retryAfter = response.headers.get('retry-after')
    if (retryAfter) {
      const retryAfterMs = parseInt(retryAfter, 10) * 1000
      if (!isNaN(retryAfterMs)) return Math.min(retryAfterMs, 30000)
    }
    return Math.min(1000 * Math.pow(2, attempt), 30000)
  }

  async get<T = any>(path: string, query?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'GET', path, query, headers })
  }

  async post<T = any>(path: string, body?: any, headers?: Record<string, string>, idempotencyKey?: string): Promise<T> {
    return this.request<T>({ method: 'POST', path, body, headers, idempotencyKey })
  }

  async put<T = any>(path: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body, headers })
  }

  async patch<T = any>(path: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body, headers })
  }

  async delete<T = any>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'DELETE', path, headers })
  }
}
