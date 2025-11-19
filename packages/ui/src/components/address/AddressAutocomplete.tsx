import { useCallback, useMemo, useRef, useEffect } from 'react'
import { Text } from 'tamagui'
import { SearchSelect, type SearchSelectOption } from '../search-select'
import { useAddressAutocomplete } from './hooks'
import type { AddressAutocompleteProps, AddressResult } from './types'

/**
 * Address Autocomplete Component
 *
 * Simple input with dropdown suggestions for address search.
 * Perfect for map search and quick address selection.
 *
 * @example
 * ```tsx
 * <AddressAutocomplete
 *   value={address}
 *   onAddressSelect={(address) => {
 *     setMapCenter({ lat: address.coordinates.lat, lng: address.coordinates.lng })
 *   }}
 *   zoomLevel="city"
 *   placeholder="Search for a city..."
 * />
 * ```
 */
export function AddressAutocomplete({
  value: propsValue,
  onAddressSelect,
  onChange,
  placeholder = 'Search addresses...',
  error,
  disabled = false,
  provider = 'mapbox',
  apiKey,
  searchOptions = {},
  zoomLevel,
  debounceMs = 300,
  minLength = 2,
  maxResults = 5,
  containerProps = {},
}: AddressAutocompleteProps) {
  // Memoize config to prevent recreation on every render
  const providerConfig = useMemo(() => {
    if (!apiKey) return undefined
    return {
      provider,
      apiKey,
      defaultCountry: 'US' as const,
    }
  }, [provider, apiKey])

  // Memoize searchOptions to prevent recreation on every render
  const memoizedSearchOptions = useMemo(() => {
    return {
      ...searchOptions,
      zoomLevel,
    }
  }, [searchOptions, zoomLevel])

  // Address autocomplete hook
  const {
    results,
    loading,
    error: searchError,
    search,
  } = useAddressAutocomplete({
    config: providerConfig,
    searchOptions: memoizedSearchOptions,
    debounceMs,
    minLength,
    maxResults,
  })

  // Track pending search queries to resolve Promises when results arrive
  const pendingQueriesRef = useRef<Map<string, { resolve: (results: AddressResult[]) => void; reject: (error: Error) => void }>>(new Map())
  const prevLoadingRef = useRef(loading)

  // Resolve pending queries when search completes (loading changes from true to false)
  useEffect(() => {
    if (prevLoadingRef.current && !loading && pendingQueriesRef.current.size > 0) {
      // Search completed - resolve all pending queries with current results
      for (const [query, { resolve }] of pendingQueriesRef.current) {
        resolve(results)
      }
      pendingQueriesRef.current.clear()
    }
    prevLoadingRef.current = loading
  }, [loading, results])

  // Create async search function for SearchSelect
  const handleSearch = useCallback(
    async (query: string): Promise<AddressResult[]> => {
      const trimmed = query.trim()
      if (trimmed.length < minLength) {
        return []
      }

      // Trigger the search via the hook
      search(trimmed)

      // Return a Promise that resolves when results arrive
      return new Promise<AddressResult[]>((resolve, reject) => {
        // Store the resolver for this query
        pendingQueriesRef.current.set(trimmed, { resolve, reject })

        // Reject after timeout if no results
        setTimeout(() => {
          if (pendingQueriesRef.current.has(trimmed)) {
            pendingQueriesRef.current.delete(trimmed)
            reject(new Error('Search timeout'))
          }
        }, 10000)
      })
    },
    [search, minLength]
  )

  // Handle selection - this is when we sync with parent
  const handleChange = useCallback(
    (value: AddressResult | AddressResult[] | null) => {
      if (value && !Array.isArray(value)) {
        onAddressSelect?.(value)
        onChange?.(value.formattedAddress)
      } else {
        onChange?.('')
      }
    },
    [onAddressSelect, onChange]
  )

  // Custom render function for address results
  const renderOption = useCallback(
    (option: SearchSelectOption<AddressResult>) => (
      <Text fontSize="$3" color="$color12" numberOfLines={1}>
        {option.label}
      </Text>
    ),
    []
  )

  // Find matching address from results if value matches
  const selectedAddress = useMemo(() => {
    if (!propsValue) return null
    return results.find((addr) => addr.formattedAddress === propsValue) || null
  }, [propsValue, results])

  return (
    <SearchSelect<AddressResult>
      value={selectedAddress}
      onChange={handleChange}
      onSearch={handleSearch}
      getOptionLabel={(address) => address.formattedAddress}
      getOptionValue={(address) => address.id}
      getOptionDescription={(address) => address.locality || undefined}
      isLoading={loading}
      error={error || searchError || undefined}
      disabled={disabled}
      placeholder={placeholder}
      minSearchLength={minLength}
      debounceMs={debounceMs}
      enableFuzzyMatch={false}
      renderOption={renderOption}
    />
  )
}
