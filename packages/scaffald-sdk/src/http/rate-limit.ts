/**
 * Rate limit information from response headers
 */
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

/**
 * Parse rate limit headers from response
 */
export function parseRateLimitHeaders(response: Response): RateLimitInfo | null {
  const limit = response.headers.get('X-RateLimit-Limit')
  const remaining = response.headers.get('X-RateLimit-Remaining')
  const reset = response.headers.get('X-RateLimit-Reset')
  const retryAfter = response.headers.get('Retry-After')

  if (!limit || !remaining || !reset) {
    return null
  }

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: parseInt(reset, 10),
    retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
  }
}

/**
 * Rate limit tracker
 */
export class RateLimitTracker {
  private rateLimitInfo: RateLimitInfo | null = null
  private callbacks: Array<(info: RateLimitInfo) => void> = []

  /**
   * Update rate limit info from response
   */
  update(response: Response): void {
    const info = parseRateLimitHeaders(response)
    if (info) {
      this.rateLimitInfo = info
      this.notifyCallbacks(info)
    }
  }

  /**
   * Get current rate limit info
   */
  getInfo(): RateLimitInfo | null {
    return this.rateLimitInfo
  }

  /**
   * Check if rate limit is approaching (< 20% remaining)
   */
  isApproaching(): boolean {
    if (!this.rateLimitInfo) {
      return false
    }

    const { limit, remaining } = this.rateLimitInfo
    return remaining < limit * 0.2
  }

  /**
   * Check if rate limit is exceeded
   */
  isExceeded(): boolean {
    if (!this.rateLimitInfo) {
      return false
    }

    return this.rateLimitInfo.remaining === 0
  }

  /**
   * Get seconds until rate limit reset
   */
  getSecondsUntilReset(): number {
    if (!this.rateLimitInfo) {
      return 0
    }

    const now = Math.floor(Date.now() / 1000)
    return Math.max(0, this.rateLimitInfo.reset - now)
  }

  /**
   * Subscribe to rate limit updates
   */
  subscribe(callback: (info: RateLimitInfo) => void): () => void {
    this.callbacks.push(callback)

    // Return unsubscribe function
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback)
    }
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(info: RateLimitInfo): void {
    for (const callback of this.callbacks) {
      try {
        callback(info)
      } catch (error) {
        console.error('Error in rate limit callback:', error)
      }
    }
  }
}
