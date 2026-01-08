/**
 * Cache entry
 */
interface CacheEntry {
  response: Response
  data: unknown
  timestamp: number
  ttl: number
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /**
   * Default TTL in milliseconds (default: 5 minutes)
   */
  defaultTtl?: number

  /**
   * Maximum cache size (default: 100 entries)
   */
  maxSize?: number

  /**
   * Whether to cache by default (default: false)
   */
  enabled?: boolean
}

/**
 * Cache key generator options
 */
export interface CacheKeyOptions {
  url: string
  method: string
  headers?: Record<string, string>
  body?: unknown
}

/**
 * Response cache manager
 */
export class ResponseCache {
  private cache = new Map<string, CacheEntry>()
  private defaultTtl: number
  private maxSize: number
  private enabled: boolean

  constructor(config: CacheConfig = {}) {
    this.defaultTtl = config.defaultTtl || 5 * 60 * 1000 // 5 minutes
    this.maxSize = config.maxSize || 100
    this.enabled = config.enabled ?? false
  }

  /**
   * Generate cache key from request
   */
  private generateKey(options: CacheKeyOptions): string {
    const { url, method, body } = options

    // Only cache GET requests by default
    if (method !== 'GET') {
      return ''
    }

    // Create key from URL and body (if present)
    const parts = [method, url]
    if (body) {
      parts.push(JSON.stringify(body))
    }

    return parts.join('::')
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp
    return age < entry.ttl
  }

  /**
   * Get cached response
   */
  get(options: CacheKeyOptions): unknown | null {
    if (!this.enabled) {
      return null
    }

    const key = this.generateKey(options)
    if (!key) {
      return null
    }

    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    // Check if expired
    if (!this.isValid(entry)) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set cached response
   */
  set(options: CacheKeyOptions, response: Response, data: unknown, ttl?: number): void {
    if (!this.enabled) {
      return
    }

    const key = this.generateKey(options)
    if (!key) {
      return
    }

    // Enforce max size (simple LRU: remove oldest entry)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      response: response.clone(),
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
    })
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      // Clear all
      this.cache.clear()
      return
    }

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; enabled: boolean } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      enabled: this.enabled,
    }
  }

  /**
   * Enable cache
   */
  enable(): void {
    this.enabled = true
  }

  /**
   * Disable cache
   */
  disable(): void {
    this.enabled = false
    this.cache.clear()
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
  }
}
