import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AddressResult,
  GeocodingProvider,
  ProviderConfig,
  SearchOptions,
  UseAddressAutocompleteReturn,
} from '../types'
import { useAddressDebounce } from './useDebounce'
import { useGeocodingProvider } from './useGeocodingProvider'

interface UseAddressAutocompleteOptions {
  /** Provider configuration */
  config?: ProviderConfig
  /** Provider instance (overrides config) */
  provider?: GeocodingProvider
  /** Search options */
  searchOptions?: SearchOptions
  /** Debounce delay in milliseconds */
  debounceMs?: number
  /** Minimum characters before search */
  minLength?: number
  /** Maximum results to return */
  maxResults?: number
  /** Auto-clear results after selection */
  autoClear?: boolean
}

/**
 * Hook for address autocomplete functionality
 *
 * @param options - Configuration options
 * @returns Autocomplete state and actions
 */
export function useAddressAutocomplete(
  options: UseAddressAutocompleteOptions = {}
): UseAddressAutocompleteReturn {
  const {
    config,
    provider: externalProvider,
    searchOptions = {},
    debounceMs = 300,
    minLength = 2,
    maxResults = 5,
  } = options

  // State
  const [results, setResults] = useState<AddressResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // Provider setup
  const defaultConfig: ProviderConfig = useMemo(() => {
    if (config) return config

    return {
      provider: 'mapbox',
      apiKey: process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '',
      defaultCountry: process.env.GEOCODING_DEFAULT_COUNTRY || 'US',
      language: process.env.GEOCODING_LANGUAGE || 'en',
    }
  }, [config])

  const { provider: hookProvider, isReady } = useGeocodingProvider(defaultConfig)

  const provider = externalProvider || hookProvider
  const abortControllerRef = useRef<AbortController | null>(null)
  const mounted = useRef(true)
  const lastRequest = useRef<unknown>(undefined)

  // Mounted tracking
  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  // Debounced query
  const debouncedQuery = useAddressDebounce(query, debounceMs)

  // Search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      // Validate inputs
      if (!searchQuery.trim() || searchQuery.length < minLength) {
        if (!mounted.current) return
        setResults([])
        setLoading(false)
        setError(null)
        return
      }

      if (!provider || !isReady) {
        if (!mounted.current) return
        setError('Geocoding provider not available')
        setLoading(false)
        return
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new request token
      const request = {}
      lastRequest.current = request
      abortControllerRef.current = new AbortController()

      if (!mounted.current) return
      setLoading(true)
      setError(null)

      try {
        const searchResults = await provider.search(searchQuery, {
          ...searchOptions,
          limit: maxResults,
        })

        // Check if component is still mounted and this is still the latest request
        if (!mounted.current || request !== lastRequest.current) {
          return
        }

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        if (!mounted.current) return
        const limitedResults =
          typeof maxResults === 'number' && maxResults > 0
            ? searchResults.slice(0, maxResults)
            : searchResults
        setResults(limitedResults)
        setError(null)
      } catch (err: unknown) {
        // Don't show error for aborted requests or if unmounted/stale
        if (!mounted.current || request !== lastRequest.current) {
          return
        }

        if (
          err instanceof Error &&
          (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted)
        ) {
          return
        }

        console.error('Address search failed:', err)
        const errorMessage = err instanceof Error ? err.message : 'Search failed'
        if (!mounted.current) return
        setError(errorMessage)
        setResults([])
      } finally {
        // Only update loading state if still mounted and this is the latest request
        if (mounted.current && request === lastRequest.current) {
          setLoading(false)
        }
        if (request === lastRequest.current) {
          abortControllerRef.current = null
        }
      }
    },
    [provider, isReady, searchOptions, maxResults, minLength]
  )

  // Trigger search when debounced query changes
  useEffect(() => {
    // Only search when we have a debounced query
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  // Manual search function
  const search = useCallback(
    (searchQuery: string) => {
      if (!mounted.current) return
      setQuery(searchQuery)

      if (debounceMs === 0) {
        void performSearch(searchQuery)
      }
    },
    [debounceMs, performSearch]
  )

  // Clear results function
  const clearResults = useCallback(() => {
    if (!mounted.current) return
    setResults([])
    setError(null)
    setQuery('')
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    lastRequest.current = undefined
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
  }
}

/**
 * Simplified hook for basic address search
 *
 * @param apiKey - API key for the geocoding provider
 * @param provider - Provider type ('mapbox')
 * @param options - Additional options
 * @returns Autocomplete functionality
 */
export function useSimpleAddressAutocomplete(
  apiKey: string,
  provider: 'mapbox' = 'mapbox',
  options: Omit<UseAddressAutocompleteOptions, 'config' | 'provider'> = {}
): UseAddressAutocompleteReturn {
  return useAddressAutocomplete({
    ...options,
    config: {
      provider,
      apiKey,
      defaultCountry: 'US',
    },
  })
}
