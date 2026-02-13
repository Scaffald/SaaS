import { useCallback, useRef, useState } from 'react'
import type { AddressResult, AddressSearchOptions, GeocodingProvider } from './Address.types'

export interface UseAddressAutocompleteConfig {
  provider?: GeocodingProvider | null
  searchOptions?: AddressSearchOptions
  debounceMs?: number
  minLength?: number
  maxResults?: number
}

export interface UseAddressAutocompleteReturn {
  results: AddressResult[]
  loading: boolean
  error: string | null
  search: (query: string) => void
  clearResults: () => void
}

export function useAddressAutocomplete({
  provider,
  searchOptions,
  debounceMs = 300,
  minLength = 2,
  maxResults = 5,
}: UseAddressAutocompleteConfig): UseAddressAutocompleteReturn {
  const [results, setResults] = useState<AddressResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearResults = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setResults([])
    setError(null)
    setLoading(false)
  }, [])

  const search = useCallback(
    (query: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      const trimmed = query.trim()
      if (trimmed.length < minLength) {
        setResults([])
        setLoading(false)
        return
      }
      if (!provider) {
        setResults([])
        setLoading(false)
        return
      }
      timeoutRef.current = setTimeout(async () => {
        setLoading(true)
        setError(null)
        try {
          const list = await provider.search(trimmed, { ...searchOptions, limit: maxResults })
          setResults(list ?? [])
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Search failed'
          setError(message)
          setResults([])
        } finally {
          setLoading(false)
        }
      }, debounceMs)
    },
    [provider, debounceMs, minLength, maxResults, searchOptions]
  )

  return { results, loading, error, search, clearResults }
}
