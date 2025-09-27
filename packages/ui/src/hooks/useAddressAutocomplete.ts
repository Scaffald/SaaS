import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MapboxGeocodingService,
  MapboxGeocodingOptions,
  AddressSuggestion,
  createMapboxGeocodingService,
} from '../utils/mapboxGeocoding'
import { getMapboxAccessToken } from '../utils/mapboxConfig'

export interface UseAddressAutocompleteOptions {
  accessToken?: string
  geocodingOptions?: MapboxGeocodingOptions
  debounceMs?: number
  minQueryLength?: number
  onSelect?: (suggestion: AddressSuggestion) => void
  onError?: (error: Error) => void
}

export interface UseAddressAutocompleteResult {
  suggestions: AddressSuggestion[]
  isLoading: boolean
  error: Error | null
  search: (query: string) => void
  clearSuggestions: () => void
  selectSuggestion: (suggestion: AddressSuggestion) => void
}

export function useAddressAutocomplete(
  options: UseAddressAutocompleteOptions = {}
): UseAddressAutocompleteResult {
  const {
    accessToken,
    geocodingOptions = {},
    debounceMs = 300,
    minQueryLength = 2,
    onSelect,
    onError,
  } = options

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Create Mapbox service instance
  const mapboxService = useMemo(() => {
    try {
      // Use provided access token or get from environment variables
      const token = accessToken || getMapboxAccessToken()
      return createMapboxGeocodingService(token)
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to create Mapbox geocoding service')
      setError(error)
      onError?.(error)
      return null
    }
  }, [accessToken, onError])

  // Debounced search function
  const search = useCallback(
    (query: string) => {
      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Clear suggestions for short queries
      if (query.length < minQueryLength) {
        setSuggestions([])
        setIsLoading(false)
        setError(null)
        return
      }

      // Set up debounced search
      debounceTimeoutRef.current = setTimeout(async () => {
        if (!mapboxService?.isConfigured()) {
          const error = new Error('Mapbox geocoding service is not configured')
          setError(error)
          onError?.(error)
          return
        }

        setIsLoading(true)
        setError(null)

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController()

        try {
          const results = await mapboxService.search(query, geocodingOptions)

          // Check if request was aborted
          if (abortControllerRef.current.signal.aborted) {
            return
          }

          setSuggestions(results)
        } catch (err) {
          if (abortControllerRef.current.signal.aborted) {
            return // Ignore aborted requests
          }

          const error = err instanceof Error ? err : new Error('Address search failed')
          setError(error)
          onError?.(error)
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      }, debounceMs)
    },
    [mapboxService, geocodingOptions, debounceMs, minQueryLength, onError]
  )

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setIsLoading(false)
    setError(null)

    // Cancel any pending requests
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // Select suggestion
  const selectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      clearSuggestions()
      onSelect?.(suggestion)
    },
    [clearSuggestions, onSelect]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    suggestions,
    isLoading,
    error,
    search,
    clearSuggestions,
    selectSuggestion,
  }
}
