/**
 * Document Cache
 *
 * LRU (Least Recently Used) cache for document metadata with TTL support.
 * Reduces database queries for frequently accessed documents.
 *
 * Features:
 * - LRU cache with 1000 entry limit
 * - 5-minute TTL for document metadata
 * - Cache invalidation on update/delete
 * - Cache hit/miss metrics
 */

export interface CacheEntry<T> {
  value: T
  createdAt: number
  lastAccessed: number
  accessCount: number
}

export interface CacheMetrics {
  size: number
  maxSize: number
  hits: number
  misses: number
  hitRate: number
  evictions: number
  invalidations: number
}

export interface CacheOptions {
  maxSize?: number
  ttlMs?: number
  onEvict?: (key: string, entry: CacheEntry<unknown>) => void
}

const DEFAULT_MAX_SIZE = 1000
const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

export class DocumentCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private accessOrder: string[] = []
  private options: Required<CacheOptions>
  private hits = 0
  private misses = 0
  private evictions = 0
  private invalidations = 0

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: options.maxSize ?? DEFAULT_MAX_SIZE,
      ttlMs: options.ttlMs ?? DEFAULT_TTL_MS,
      onEvict: options.onEvict ?? (() => {}),
    }
  }

  /**
   * Get a value from the cache
   * Returns undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      this.misses++
      return undefined
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.delete(key)
      this.misses++
      return undefined
    }

    // Update access time and count
    entry.lastAccessed = Date.now()
    entry.accessCount++
    this.hits++

    // Move to end of access order (most recently used)
    this.updateAccessOrder(key)

    return entry.value
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T): void {
    const now = Date.now()

    // If key already exists, update it
    const existingEntry = this.cache.get(key)
    if (existingEntry) {
      existingEntry.value = value
      existingEntry.createdAt = now
      existingEntry.lastAccessed = now
      this.updateAccessOrder(key)
      return
    }

    // Evict LRU entries if at capacity
    while (this.cache.size >= this.options.maxSize) {
      this.evictLRU()
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
    }

    this.cache.set(key, entry)
    this.accessOrder.push(key)
  }

  /**
   * Check if a key exists in the cache (and is not expired)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (this.isExpired(entry)) {
      this.delete(key)
      return false
    }
    return true
  }

  /**
   * Delete a key from the cache
   * Returns true if the key was found and deleted
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    this.cache.delete(key)
    this.removeFromAccessOrder(key)
    this.invalidations++

    return true
  }

  /**
   * Invalidate cache entries matching a pattern
   * Pattern can be a string prefix or a RegExp
   */
  invalidate(pattern: string | RegExp): number {
    let count = 0
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      const matches = typeof pattern === 'string' ? key.startsWith(pattern) : pattern.test(key)

      if (matches) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.delete(key)
      count++
    }

    return count
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    const total = this.hits + this.misses
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      evictions: this.evictions,
      invalidations: this.invalidations,
    }
  }

  /**
   * Reset metrics counters
   */
  resetMetrics(): void {
    this.hits = 0
    this.misses = 0
    this.evictions = 0
    this.invalidations = 0
  }

  /**
   * Get or set a value using a factory function
   * If the key doesn't exist, the factory is called and the result is cached
   */
  async getOrSet(key: string, factory: () => T | Promise<T>): Promise<T> {
    const cached = this.get(key)
    if (cached !== undefined) {
      return cached
    }

    const value = await factory()
    this.set(key, value)
    return value
  }

  /**
   * Get the number of entries in the cache
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * Iterate over all cache entries
   */
  *entries(): IterableIterator<[string, T]> {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        yield [key, entry.value]
      }
    }
  }

  /**
   * Prune expired entries
   * Returns the number of entries removed
   */
  prune(): number {
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.delete(key)
    }

    return keysToDelete.length
  }

  /**
   * Check if an entry has expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.createdAt > this.options.ttlMs
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return

    const lruKey = this.accessOrder[0]
    const entry = this.cache.get(lruKey)

    if (entry) {
      this.options.onEvict(lruKey, entry as CacheEntry<unknown>)
      this.cache.delete(lruKey)
      this.evictions++
    }

    this.accessOrder.shift()
  }

  /**
   * Update the access order for a key (move to end)
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.accessOrder.push(key)
  }

  /**
   * Remove a key from the access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index !== -1) {
      this.accessOrder.splice(index, 1)
    }
  }
}

/**
 * Document-specific cache with predefined key patterns
 */
export class DocumentMetadataCache extends DocumentCache<{
  id: string
  name: string
  organizationId: string
  mimeType: string
  fileSize: number
  storagePath: string
  storageBackend: string
  createdAt: string
  updatedAt: string
}> {
  /**
   * Get cache key for a document by ID
   */
  static keyById(documentId: string): string {
    return `doc:id:${documentId}`
  }

  /**
   * Get cache key prefix for organization documents
   */
  static keyPrefixByOrg(organizationId: string): string {
    return `doc:org:${organizationId}:`
  }

  /**
   * Invalidate all documents for an organization
   */
  invalidateOrganization(organizationId: string): number {
    return this.invalidate(DocumentMetadataCache.keyPrefixByOrg(organizationId))
  }
}

/**
 * Create a document metadata cache with default settings
 */
export function createDocumentCache(options?: CacheOptions): DocumentMetadataCache {
  return new DocumentMetadataCache(options)
}

// Singleton cache instance for use across the application
let _documentCache: DocumentMetadataCache | null = null

export function getDocumentCache(): DocumentMetadataCache {
  if (!_documentCache) {
    _documentCache = createDocumentCache()
  }
  return _documentCache
}

export function resetDocumentCache(): void {
  if (_documentCache) {
    _documentCache.clear()
    _documentCache.resetMetrics()
  }
  _documentCache = null
}
