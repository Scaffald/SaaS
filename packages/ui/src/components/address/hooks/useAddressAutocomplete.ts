import { useCallback, useEffect, useRef, useState } from 'react'
import { useAddressDebounce, useAddressDebouncedCallback } from './useDebounce'
import { useGeocodingProvider } from './useGeocodingProvider'
import type {
  AddressResult,
  GeocodingProvider,
  ProviderConfig,
  SearchOptions,
  UseAddressAutocompleteReturn,
} from '../types'

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
  const { provider: hookProvider, isReady } = useGeocodingProvider(
    config || {
      provider: 'google',
      apiKey: process.env.GOOGLE_PLACES_API_KEY || '',
    }
  )

  const provider = externalProvider || hookProvider
  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounced query
  const debouncedQuery = useAddressDebounce(query, debounceMs)

  // Search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      // Validate inputs
      if (!searchQuery.trim() || searchQuery.length < minLength) {
        setResults([])
        setLoading(false)
        setError(null)
        return
      }

      if (!provider || !isReady) {
        setError('Geocoding provider not available')
        setLoading(false)
        return
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setLoading(true)
      setError(null)

      try {
        const searchResults = await provider.search(searchQuery, {
          ...searchOptions,
          limit: maxResults,
        })

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        setResults(searchResults)
        setError(null)
      } catch (err: unknown) {
        // Don't show error for aborted requests
        if (
          err instanceof Error &&
          (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted)
        ) {
          return
        }

        console.error('Address search failed:', err)
        const errorMessage = err instanceof Error ? err.message : 'Search failed'
        setError(errorMessage)
        setResults([])
      } finally {
        setLoading(false)
        abortControllerRef.current = null
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
  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
  }, [])

  // Clear results function
  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
    setQuery('')
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
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
 * @param provider - Provider type ('google' | 'mapbox')
 * @param options - Additional options
 * @returns Autocomplete functionality
 */
export function useSimpleAddressAutocomplete(
  apiKey: string,
  provider: 'google' | 'mapbox' = 'google',
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
