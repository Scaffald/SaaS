import { HttpClient } from './http/client.js'
import { JobsResource } from './resources/jobs.js'
import { ApplicationsResource } from './resources/applications.js'
import { ProfilesResource } from './resources/profiles.js'
import { AuthResource } from './resources/auth.js'
import { APIKeysResource } from './resources/api-keys.js'
import { type ScaffaldConfig, validateConfig, getDefaultConfig } from './config.js'
import type { RateLimitInfo } from './http/rate-limit.js'
import type { InterceptorManager } from './http/interceptors.js'
import type { ResponseCache } from './http/cache.js'

/**
 * Main Scaffald SDK client
 *
 * @example
 * ```typescript
 * // Server-side with API key
 * const client = new Scaffald({
 *   apiKey: 'sk_live_...'
 * })
 *
 * // Client-side with OAuth token
 * const client = new Scaffald({
 *   accessToken: 'oauth_token_...'
 * })
 *
 * // Use the client
 * const jobs = await client.jobs.list({ limit: 20 })
 * const application = await client.applications.createQuick({
 *   jobId: 'job_123',
 *   currentLocation: 'San Francisco, CA'
 * })
 * ```
 */
export class Scaffald {
  private http: HttpClient

  /**
   * Authentication API resource
   */
  public readonly auth: AuthResource

  /**
   * Jobs API resource
   */
  public readonly jobs: JobsResource

  /**
   * Applications API resource
   */
  public readonly applications: ApplicationsResource

  /**
   * Profiles API resource (rate-limited)
   */
  public readonly profiles: ProfilesResource

  /**
   * API Keys API resource
   */
  public readonly apiKeys: APIKeysResource

  constructor(config: ScaffaldConfig) {
    // Validate configuration
    validateConfig(config)

    // Merge with defaults
    const finalConfig = {
      ...getDefaultConfig(),
      ...config,
    }

    // Create HTTP client (defaults ensure these values are defined)
    this.http = new HttpClient({
      baseUrl: finalConfig.baseUrl ?? 'https://api.scaffald.com',
      apiKey: finalConfig.apiKey,
      accessToken: finalConfig.accessToken,
      maxRetries: finalConfig.maxRetries,
      timeout: finalConfig.timeout,
      headers: finalConfig.headers,
      cache: finalConfig.cache,
      enableDeduplication: finalConfig.enableDeduplication,
    })

    // Initialize resources
    this.auth = new AuthResource(this.http)
    this.jobs = new JobsResource(this.http)
    this.applications = new ApplicationsResource(this.http)
    this.profiles = new ProfilesResource(this.http)
    this.apiKeys = new APIKeysResource(this.http)
  }

  /**
   * Get current rate limit information
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.http.rateLimitTracker.getInfo()
  }

  /**
   * Subscribe to rate limit updates
   *
   * @example
   * ```typescript
   * const unsubscribe = client.onRateLimitUpdate((info) => {
   *   console.log(`Rate limit: ${info.remaining}/${info.limit}`)
   * })
   *
   * // Later: unsubscribe()
   * ```
   */
  onRateLimitUpdate(callback: (info: RateLimitInfo) => void): () => void {
    return this.http.rateLimitTracker.subscribe(callback)
  }

  /**
   * Check if rate limit is approaching (< 20% remaining)
   */
  isRateLimitApproaching(): boolean {
    return this.http.rateLimitTracker.isApproaching()
  }

  /**
   * Check if rate limit is exceeded
   */
  isRateLimitExceeded(): boolean {
    return this.http.rateLimitTracker.isExceeded()
  }

  /**
   * Get seconds until rate limit reset
   */
  getSecondsUntilRateLimitReset(): number {
    return this.http.rateLimitTracker.getSecondsUntilReset()
  }

  /**
   * Get the interceptor manager for adding custom request/response/error interceptors
   *
   * @example
   * ```typescript
   * // Add a request interceptor to log all requests
   * client.getInterceptors().addRequestInterceptor(async (url, init) => {
   *   console.log('Request:', url, init.method)
   *   return { url, init }
   * })
   *
   * // Add a response interceptor to log all responses
   * client.getInterceptors().addResponseInterceptor(async (response) => {
   *   console.log('Response:', response.status)
   *   return response
   * })
   *
   * // Add an error interceptor to handle errors
   * client.getInterceptors().addErrorInterceptor(async (error) => {
   *   console.error('Error:', error.message)
   *   return error
   * })
   * ```
   */
  getInterceptors(): InterceptorManager {
    return this.http.interceptors
  }

  /**
   * Get the response cache manager
   *
   * @example
   * ```typescript
   * // Enable caching
   * client.getCache().enable()
   *
   * // Disable caching
   * client.getCache().disable()
   *
   * // Clear cache
   * client.getCache().clear()
   *
   * // Invalidate specific cache entries
   * client.getCache().invalidate(/jobs/)
   *
   * // Get cache stats
   * const stats = client.getCache().getStats()
   * console.log(`Cache: ${stats.size}/${stats.maxSize}`)
   * ```
   */
  getCache(): ResponseCache {
    return this.http.cache
  }
}
