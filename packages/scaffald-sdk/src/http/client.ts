import { handleErrorResponse, NetworkError } from './errors.js'
import { RateLimitTracker } from './rate-limit.js'
import { RetryMiddleware } from './retry.js'
import { InterceptorManager } from './interceptors.js'
import { ResponseCache, type CacheConfig } from './cache.js'
import { RequestDeduplicator } from './deduplication.js'

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
  cache?: CacheConfig
  enableDeduplication?: boolean
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
 * HTTP client with retry, rate limit tracking, caching, and interceptors
 */
export class HttpClient {
  private config: HttpClientConfig
  private retryMiddleware: RetryMiddleware
  public rateLimitTracker: RateLimitTracker
  public interceptors: InterceptorManager
  public cache: ResponseCache
  private deduplicator: RequestDeduplicator

  constructor(config: HttpClientConfig) {
    this.config = {
      maxRetries: 3,
      timeout: 60000,
      enableDeduplication: true,
      ...config,
    }

    this.retryMiddleware = new RetryMiddleware({
      maxRetries: this.config.maxRetries ?? 3,
    })

    this.rateLimitTracker = new RateLimitTracker()
    this.interceptors = new InterceptorManager()
    this.cache = new ResponseCache(this.config.cache)
    this.deduplicator = new RequestDeduplicator(this.config.enableDeduplication)
  }

  /**
   * Make an HTTP request
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.query)
    const headers = this.buildHeaders(options.headers)
    const method = options.method || 'GET'

    // Check cache first (GET requests only)
    const cachedData = this.cache.get({ url, method, body: options.body })
    if (cachedData !== null) {
      return cachedData as T
    }

    const fetchFn = async (): Promise<Response> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      try {
        // Execute request interceptors
        const intercepted = await this.interceptors.executeRequestInterceptors(url, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        })

        const response = await fetch(intercepted.url, intercepted.init)

        clearTimeout(timeoutId)

        // Execute response interceptors
        const interceptedResponse = await this.interceptors.executeResponseInterceptors(response)

        // Update rate limit tracker
        this.rateLimitTracker.update(interceptedResponse)

        return interceptedResponse
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === 'AbortError') {
          throw new NetworkError('Request timeout')
        }

        // Execute error interceptors
        const interceptedError = await this.interceptors.executeErrorInterceptors(
          error instanceof Error ? error : new Error('Network request failed')
        )

        // If error interceptor returned a Response, use it
        if (interceptedError instanceof Response) {
          return interceptedError
        }

        throw new NetworkError(
          interceptedError instanceof Error ? interceptedError.message : 'Network request failed',
          interceptedError instanceof Error ? interceptedError : undefined
        )
      }
    }

    // Deduplicate concurrent requests
    const deduplicatedFetch = () =>
      this.deduplicator.deduplicate(url, method, options.body, fetchFn)

    // Execute with retry middleware
    const response = await this.retryMiddleware.execute(deduplicatedFetch, method)

    // Handle error responses
    if (!response.ok) {
      await handleErrorResponse(response)
    }

    // Parse response
    const contentType = response.headers.get('content-type')
    let data: T
    if (contentType?.includes('application/json')) {
      data = (await response.json()) as T
    } else {
      data = (await response.text()) as T
    }

    // Cache successful GET requests
    if (method === 'GET' && response.ok) {
      this.cache.set({ url, method, body: options.body }, response, data)
    }

    return data
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
