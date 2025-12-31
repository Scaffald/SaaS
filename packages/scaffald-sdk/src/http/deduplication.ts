/**
 * In-flight request tracker for deduplication
 */
export class RequestDeduplicator {
  private inFlight = new Map<string, Promise<Response>>()
  private enabled: boolean

  constructor(enabled = true) {
    this.enabled = enabled
  }

  /**
   * Generate request key
   */
  private generateKey(url: string, method: string, body?: unknown): string {
    const parts = [method, url]
    if (body) {
      parts.push(JSON.stringify(body))
    }
    return parts.join('::')
  }

  /**
   * Get or create a deduplicated request
   *
   * If an identical request is already in-flight, returns the existing promise.
   * Otherwise, executes the request function and tracks it.
   */
  async deduplicate<T extends Response>(
    url: string,
    method: string,
    body: unknown,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // If deduplication is disabled, just execute
    if (!this.enabled) {
      return requestFn()
    }

    // Only deduplicate GET requests by default
    if (method !== 'GET') {
      return requestFn()
    }

    const key = this.generateKey(url, method, body)

    // Check if request is already in-flight
    const existing = this.inFlight.get(key)
    if (existing) {
      // Clone the response for each consumer
      return existing.then((response) => response.clone() as T)
    }

    // Execute new request
    const promise = requestFn()

    // Track in-flight request
    this.inFlight.set(key, promise)

    try {
      const response = await promise
      return response
    } finally {
      // Clean up after request completes
      this.inFlight.delete(key)
    }
  }

  /**
   * Check if a request is currently in-flight
   */
  isInFlight(url: string, method: string, body?: unknown): boolean {
    const key = this.generateKey(url, method, body)
    return this.inFlight.has(key)
  }

  /**
   * Get number of in-flight requests
   */
  getInFlightCount(): number {
    return this.inFlight.size
  }

  /**
   * Enable request deduplication
   */
  enable(): void {
    this.enabled = true
  }

  /**
   * Disable request deduplication
   */
  disable(): void {
    this.enabled = false
  }

  /**
   * Clear all in-flight request tracking
   * Note: This doesn't cancel requests, just stops tracking them
   */
  clear(): void {
    this.inFlight.clear()
  }
}
