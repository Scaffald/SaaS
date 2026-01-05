import { handleErrorResponse, NetworkError } from './errors.js'
import { RateLimitTracker } from './rate-limit.js'
import { RetryMiddleware } from './retry.js'

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl: string
  apiKey?: string
  accessToken?: string
  maxRetries?: number
  headers?: Record<string, string>
  timeout?: number
}

/**
 * HTTP request options
 */
export interface RequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
}

/**
 * HTTP client with retry and rate limit tracking
 */
export class HttpClient {
  private config: HttpClientConfig
  private retryMiddleware: RetryMiddleware
  public rateLimitTracker: RateLimitTracker

  constructor(config: HttpClientConfig) {
    this.config = {
      maxRetries: 3,
      timeout: 60000,
      ...config,
    }

    this.retryMiddleware = new RetryMiddleware({
      maxRetries: this.config.maxRetries ?? 3,
    })

    this.rateLimitTracker = new RateLimitTracker()
  }

  /**
   * Make an HTTP request
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.query)
    const headers = this.buildHeaders(options.headers)
    const method = options.method || 'GET'

    const fetchFn = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Update rate limit tracker
        this.rateLimitTracker.update(response)

        return response
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === 'AbortError') {
          throw new NetworkError('Request timeout')
        }

        throw new NetworkError(
          error instanceof Error ? error.message : 'Network request failed',
          error instanceof Error ? error : undefined
        )
      }
    }

    // Execute with retry middleware
    const response = await this.retryMiddleware.execute(fetchFn, method)

    // Handle error responses
    if (!response.ok) {
      await handleErrorResponse(response)
    }

    // Parse response
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>
    }

    return response.text() as Promise<T>
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(path, this.config.baseUrl)

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      }
    }

    return url.toString()
  }

  /**
   * Build request headers
   */
  private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': `scaffald-sdk-js/${this.getVersion()}`,
      ...this.config.headers,
      ...additionalHeaders,
    }

    // Add authentication
    if (this.config.accessToken) {
      headers.Authorization = `Bearer ${this.config.accessToken}`
    } else if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`
    }

    return headers
  }

  /**
   * Get SDK version
   */
  private getVersion(): string {
    // This will be replaced during build
    return '0.1.0'
  }

  /**
   * GET request
   */
  get<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(path, { method: 'GET', query })
  }

  /**
   * POST request
   */
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body })
  }

  /**
   * PATCH request
   */
  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body })
  }

  /**
   * DELETE request
   */
  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}
