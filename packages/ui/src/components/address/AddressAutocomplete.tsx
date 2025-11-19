import { useCallback, useMemo } from 'react'
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

  // Convert AddressResult[] to SearchSelectOption<AddressResult>[]
  const options = useMemo<SearchSelectOption<AddressResult>[]>(
    () =>
      results.map((address) => ({
        id: address.id,
        label: address.formattedAddress,
        value: address,
        searchableText: address.formattedAddress,
      })),
    [results]
  )

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      search(query)
    },
    [search]
  )

  // Handle selection
  const handleSelect = useCallback(
    (option: SearchSelectOption<AddressResult> | null) => {
      if (option) {
        onAddressSelect?.(option.value)
        onChange?.(option.value.formattedAddress)
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

  return (
    <SearchSelect<AddressResult>
      value={propsValue}
      onChange={onChange}
      onSelect={handleSelect}
      options={options}
      onSearch={handleSearch}
      loading={loading}
      error={error || searchError || undefined}
      disabled={disabled}
      placeholder={placeholder}
      minSearchLength={minLength}
      debounceMs={debounceMs}
      renderOption={renderOption}
      containerProps={containerProps}
    />
  )
}
