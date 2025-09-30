import React, { useState } from 'react'
import { YStack, XStack, Text, Button } from 'tamagui'
import { Plus, X } from '@tamagui/lucide-icons'
import { AddressAutocomplete } from './AddressAutocomplete'
import type { AddressResult } from './types'

interface LocationListInputProps {
  value: string[]
  onChange: (locations: string[]) => void
  maxLocations?: number
  helpText?: string
  placeholder?: string
  provider?: 'google' | 'mapbox'
  apiKey?: string
  disabled?: boolean
}

/**
 * Location List Input Component
 *
 * Allows users to add multiple locations using autocomplete.
 * Shows one input initially with + button to add up to maxLocations total.
 * Configured for broader location searches (city, county, state level).
 *
 * @example
 * ```tsx
 * <LocationListInput
 *   value={locations}
 *   onChange={setLocations}
 *   maxLocations={3}
 *   helpText="You can add up to three locations."
 *   provider="mapbox"
 *   apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
 * />
 * ```
 */
export function LocationListInput({
  value = [],
  onChange,
  maxLocations = 3,
  helpText,
  placeholder = 'Search for a location...',
  provider = 'mapbox',
  apiKey,
  disabled = false,
}: LocationListInputProps) {
  // Track how many input fields to show (always at least 1)
  const [fieldCount, setFieldCount] = useState(Math.max(1, value.length))

  // Update field count when value changes from outside
  React.useEffect(() => {
    if (value.length > 0) {
      setFieldCount((prev) => Math.max(value.length, prev))
    }
  }, [value.length])

  // Handle location change at specific index
  const handleLocationChange = (index: number, location: string) => {
    const updated = [...value]

    // Ensure array is long enough
    while (updated.length <= index) {
      updated.push('')
    }

    updated[index] = location

    // Filter out empty strings when sending to parent
    const filtered = updated.filter(Boolean)
    onChange(filtered)
  }

  // Handle address selection from autocomplete
  const handleAddressSelect = (index: number, address: AddressResult) => {
    handleLocationChange(index, address.formattedAddress)
  }

  // Add new location input
  const handleAddLocation = () => {
    if (fieldCount < maxLocations) {
      setFieldCount(fieldCount + 1)
    }
  }

  // Remove location at index
  const handleRemoveLocation = (index: number) => {
    if (fieldCount > 1) {
      // Remove the value at this index
      const updated = value.filter((_, i) => i !== index)
      onChange(updated)

      // Decrease field count
      setFieldCount(fieldCount - 1)
    }
  }

  // Search options optimized for broader locations (city, county, state)
  const searchOptions = {
    zoomLevel: 'city' as const,
    types: ['place', 'locality', 'district', 'region'], // Cities, localities, districts, states/regions
    country: 'us', // Restrict to US for work locations
  }

  return (
    <YStack gap="$3" position="relative" zIndex={999}>
      {/* Location Inputs */}
      <YStack gap="$2">
        {Array.from({ length: fieldCount }, (_, index) => (
          <XStack key={index} gap="$2" alignItems="flex-start">
            <YStack flex={1}>
              <AddressAutocomplete
                value={value[index] || ''}
                onChange={(text) => handleLocationChange(index, text)}
                onAddressSelect={(address) => handleAddressSelect(index, address)}
                placeholder={index === 0 ? placeholder : `Location ${index + 1}`}
                provider={provider}
                apiKey={apiKey}
                searchOptions={searchOptions}
                zoomLevel="city"
                disabled={disabled}
                debounceMs={300}
                minLength={2}
                maxResults={8}
              />
            </YStack>

            {/* Remove button (only show for second location onwards) */}
            {index > 0 && (
              <Button
                variant="outlined"
                size="$3"
                onPress={() => handleRemoveLocation(index)}
                disabled={disabled}
                circular
                backgroundColor="transparent"
                borderColor="$color8"
                marginTop="$1"
              >
                <Button.Icon>
                  <X size={16} color="$color11" />
                </Button.Icon>
              </Button>
            )}
          </XStack>
        ))}
      </YStack>

      {/* Add Location Button */}
      {fieldCount < maxLocations && (
        <Button
          variant="outlined"
          size="$3"
          onPress={handleAddLocation}
          disabled={disabled}
          alignSelf="flex-start"
          backgroundColor="transparent"
          borderColor="$color8"
        >
          <Button.Icon>
            <Plus size={16} color="$color11" />
          </Button.Icon>
          <Button.Text color="$color11">
            Add Location ({fieldCount}/{maxLocations})
          </Button.Text>
        </Button>
      )}

      {/* Help Text */}
      {helpText && (
        <Text fontSize="$3" color="$color11" lineHeight="$1">
          {helpText}
        </Text>
      )}
    </YStack>
  )
}
