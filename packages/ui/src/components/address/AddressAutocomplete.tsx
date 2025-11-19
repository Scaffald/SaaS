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

  // Track the current query being searched and pending resolver
  const currentQueryRef = useRef<string>('')
  const pendingQueryRef = useRef<{
    query: string
    resolve: (results: AddressResult[]) => void
    reject: (error: Error) => void
  } | null>(null)
  const prevLoadingRef = useRef(loading)
  const hasResolvedRef = useRef(false)

  // Resolve pending query when search completes (loading changes from true to false)
  useEffect(() => {
    const wasLoading = prevLoadingRef.current
    const isLoading = loading

    // Only process if we transitioned from loading to not loading
    if (wasLoading && !isLoading && pendingQueryRef.current) {
      const pending = pendingQueryRef.current
      // Only resolve if the query matches the current query and we haven't resolved yet
      if (pending.query === currentQueryRef.current && !hasResolvedRef.current) {
        hasResolvedRef.current = true
        // Use setTimeout to avoid resolving during render
        setTimeout(() => {
          if (pendingQueryRef.current === pending) {
            pending.resolve(results)
            pendingQueryRef.current = null
          }
        }, 0)
      }
    }

    // Reset resolved flag when loading starts
    if (!wasLoading && isLoading) {
      hasResolvedRef.current = false
    }

    prevLoadingRef.current = loading
  }, [loading, results])

  // Create async search function for SearchSelect
  const handleSearch = useCallback(
    async (query: string): Promise<AddressResult[]> => {
      const trimmed = query.trim()
      if (trimmed.length < minLength) {
        // Clear any pending query if query is too short
        if (pendingQueryRef.current) {
          const pending = pendingQueryRef.current
          pendingQueryRef.current = null
          pending.reject(new Error('Query too short'))
        }
        hasResolvedRef.current = false
        return []
      }

      // Update current query and reset resolved flag
      currentQueryRef.current = trimmed
      hasResolvedRef.current = false

      // If there's a pending query for a different query, reject it
      if (pendingQueryRef.current && pendingQueryRef.current.query !== trimmed) {
        const oldPending = pendingQueryRef.current
        pendingQueryRef.current = null
        oldPending.reject(new Error('Query superseded'))
      }

      // Trigger the search via the hook
      search(trimmed)

      // Return a Promise that resolves when results arrive
      return new Promise<AddressResult[]>((resolve, reject) => {
        // Set up timeout first
        const timeoutId = setTimeout(() => {
          if (pendingQueryRef.current && pendingQueryRef.current.query === trimmed) {
            const pending = pendingQueryRef.current
            pendingQueryRef.current = null
            hasResolvedRef.current = false
            pending.reject(new Error('Search timeout'))
          }
        }, 10000)

        // Create wrapped resolve/reject that clean up timeout
        const wrappedResolve = (value: AddressResult[]) => {
          clearTimeout(timeoutId)
          resolve(value)
        }
        const wrappedReject = (error: Error) => {
          clearTimeout(timeoutId)
          reject(error)
        }

        // Store the resolver for this query
        pendingQueryRef.current = {
          query: trimmed,
          resolve: wrappedResolve,
          reject: wrappedReject,
        }
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
