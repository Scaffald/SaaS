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

  // Handle input change - trigger search when input changes
  // Don't call onChange here to avoid loops - only sync on selection
  const handleInputChange = useCallback(
    (value: string) => {
      if (value.trim().length >= minLength) {
        search(value)
      }
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
      onInputChange={handleInputChange}
      options={results}
      getOptionLabel={(address) => address.formattedAddress}
      getOptionValue={(address) => address.id}
      getOptionDescription={(address) => address.locality || undefined}
      isLoading={loading}
      error={error || searchError || undefined}
      disabled={disabled}
      placeholder={placeholder}
      minSearchLength={minLength}
      enableFuzzyMatch={false}
      renderOption={renderOption}
    />
  )
}
