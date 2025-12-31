import { HttpClient } from './http/client.js'
import { JobsResource } from './resources/jobs.js'
import { ApplicationsResource } from './resources/applications.js'
import { ProfilesResource } from './resources/profiles.js'
import { type ScaffaldConfig, validateConfig, getDefaultConfig } from './config.js'
import type { RateLimitInfo } from './http/rate-limit.js'

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
    })

    // Initialize resources
    this.jobs = new JobsResource(this.http)
    this.applications = new ApplicationsResource(this.http)
    this.profiles = new ProfilesResource(this.http)
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
}
