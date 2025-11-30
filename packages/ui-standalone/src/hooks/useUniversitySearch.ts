import { useCallback, useEffect, useRef, useState } from 'react'
// University type moved - import from local types if needed
// For now, define locally or make it a generic type
export interface University {
  id: string
  name: string
  country?: string
  [key: string]: unknown
}

export interface UseUniversitySearchOptions {
  debounceMs?: number
  minLength?: number
  maxResults?: number
  defaultCountry?: string
  enableCache?: boolean
  cacheSize?: number
  cacheTTL?: number // Time to live in milliseconds
}

export interface UseUniversitySearchResult {
  results: University[]
  loading: boolean
  error: string | undefined
  search: (query: string) => void
  clearResults: () => void
  clearCache: () => void
}

// In-memory cache shared across hook instances
interface CacheEntry {
  results: University[]
  timestamp: number
}

const globalCache = new Map<string, CacheEntry>()
const MAX_CACHE_SIZE = 50
const DEFAULT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Helper to get cache key
function getCacheKey(query: string, country: string, limit: number): string {
  return `${query.toLowerCase().trim()}:${country}:${limit}`
}

// Helper to clean expired cache entries
function cleanExpiredCache(ttl: number) {
  const now = Date.now()
  for (const [key, entry] of globalCache.entries()) {
    if (now - entry.timestamp > ttl) {
      globalCache.delete(key)
    }
  }
}

// Helper to enforce cache size limit
function enforceCacheSizeLimit(maxSize: number) {
  if (globalCache.size <= maxSize) return

  // Remove oldest entries
  const entries = Array.from(globalCache.entries())
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

  const toRemove = entries.slice(0, globalCache.size - maxSize)
  for (const [key] of toRemove) {
    globalCache.delete(key)
  }
}

/**
 * Hook for searching universities with debouncing
 * Uses tRPC endpoint to search university catalog
 *
 * @param searchFn - Function to call for searching (typically from tRPC)
 * @param options - Configuration options
 * @returns Search results and control functions
 */
export function useUniversitySearch(
  searchFn: (params: {
    query: string
    country?: string
    limit: number
  }) => Promise<{ universities: University[] }>,
  options: UseUniversitySearchOptions = {}
): UseUniversitySearchResult {
  const {
    debounceMs = 300,
    minLength = 3,
    maxResults = 5,
    defaultCountry = 'United States',
    enableCache = true,
    cacheSize = MAX_CACHE_SIZE,
    cacheTTL = DEFAULT_CACHE_TTL,
  } = options

  const [results, setResults] = useState<University[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Clear results
  const clearResults = useCallback(() => {
    setResults([])
    setError(undefined)
    setLoading(false)
  }, [])

  // Clear cache function
  const clearCache = useCallback(() => {
    globalCache.clear()
  }, [])

  // Search function with debouncing, caching, and query cancellation
  const search = useCallback(
    (query: string) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Cancel previous search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Validate query length
      const trimmedQuery = query.trim()
      if (trimmedQuery.length < minLength) {
        clearResults()
        return
      }

      // Check cache first if enabled
      if (enableCache) {
        cleanExpiredCache(cacheTTL)
        const cacheKey = getCacheKey(trimmedQuery, defaultCountry, maxResults)
        const cachedEntry = globalCache.get(cacheKey)

        if (cachedEntry && Date.now() - cachedEntry.timestamp < cacheTTL) {
          // Return cached results immediately
          setResults(cachedEntry.results)
          setLoading(false)
          setError(undefined)
          return
        }
      }

      // Set loading state immediately
      setLoading(true)
      setError(undefined)

      // Debounce the actual search
      debounceTimerRef.current = setTimeout(async () => {
        try {
          // Create abort controller for this search
          abortControllerRef.current = new AbortController()

          // Execute search
          const result = await searchFn({
            query: trimmedQuery,
            country: defaultCountry,
            limit: maxResults,
          })

          // Update results if not aborted
          if (!abortControllerRef.current.signal.aborted) {
            setResults(result.universities)
            setLoading(false)

            // Cache results if enabled
            if (enableCache) {
              const cacheKey = getCacheKey(trimmedQuery, defaultCountry, maxResults)
              globalCache.set(cacheKey, {
                results: result.universities,
                timestamp: Date.now(),
              })
              enforceCacheSizeLimit(cacheSize)
            }
          }
        } catch (err) {
          // Only update error if not aborted
          if (!abortControllerRef.current?.signal.aborted) {
            setError(err instanceof Error ? err.message : 'Search failed')
            setResults([])
            setLoading(false)
          }
        }
      }, debounceMs)
    },
    [
      searchFn,
      minLength,
      maxResults,
      defaultCountry,
      debounceMs,
      clearResults,
      enableCache,
      cacheTTL,
      cacheSize,
    ]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    results,
    loading,
    error,
    search,
    clearResults,
    clearCache,
  }
}
