import { useCallback, useMemo } from 'react'
import { SizableText, YStack } from 'tamagui'
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

  // Determine if this is a full address search (vs region/city search)
  const isFullAddressSearch = zoomLevel === 'street' || !zoomLevel

  // Custom render function for address results
  const renderOption = useCallback(
    (option: SearchSelectOption<AddressResult>) => {
      const address = option.raw

      // For full address searches, show two-line format
      if (isFullAddressSearch && address.streetAddress) {
        // Build the second line: city, state zip, country
        const secondLineParts: string[] = []
        if (address.locality) {
          secondLineParts.push(address.locality)
        }
        const stateZip = [address.stateAbbreviation, address.postalCode].filter(Boolean).join(' ')
        if (stateZip) {
          secondLineParts.push(stateZip)
        }
        if (address.country && address.country !== 'United States') {
          secondLineParts.push(address.country)
        }

        return (
          <YStack gap="$1" flex={1} items="flex-start">
            <SizableText fontSize="$4" color="$color12" fontWeight="600" numberOfLines={1}>
              {address.streetAddress}
            </SizableText>
            {secondLineParts.length > 0 && (
              <SizableText fontSize="$2" color="$color11" numberOfLines={1}>
                {secondLineParts.join(', ')}
              </SizableText>
            )}
          </YStack>
        )
      }

      // For region/city searches, show single-line format (current behavior)
      return (
        <SizableText fontSize="$4" color="$color12" numberOfLines={1}>
          {option.label}
        </SizableText>
      )
    },
    [isFullAddressSearch]
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
      options={results}
      onInputChange={handleInputChange}
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
