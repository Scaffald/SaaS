import { Plus, X } from '@tamagui/lucide-icons'
import { useEffect, useMemo, useState } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import { AddressAutocomplete } from './AddressAutocomplete'
import type { AddressResult } from './types'

interface LocationListInputProps {
  value: string[]
  onChange: (locations: string[]) => void
  maxLocations?: number
  helpText?: string
  placeholder?: string
  provider?: 'mapbox'
  apiKey?: string
  disabled?: boolean
}

/**
 * Location List Input Component
 *
 * Allows users to add multiple locations using autocomplete.
 * Shows an "Add Location" button by default when no locations are set.
 * All locations can be deleted, including the first one.
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
  // Track how many input fields to show
  const [fieldCount, setFieldCount] = useState(value.length)

  // Update field count when value changes from outside
  useEffect(() => {
    if (value.length > 0) {
      setFieldCount((prev) => Math.max(value.length, prev))
    } else {
      // Reset field count when all locations are removed
      setFieldCount(0)
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
      // Add an empty string to the value array to trigger the input field
      const updated = [...value, '']
      onChange(updated)
      setFieldCount(fieldCount + 1)
    }
  }

  // Remove location at index
  const handleRemoveLocation = (index: number) => {
    if (value.length > 0) {
      // Remove the value at this index
      const updated = value.filter((_, i) => i !== index)
      onChange(updated)

      // Decrease field count
      setFieldCount(Math.max(0, fieldCount - 1))
    }
  }

  // Search options optimized for broader locations (city, county, state)
  // Memoize to prevent recreating on every render
  const searchOptions = useMemo(
    () => ({
      zoomLevel: 'city' as const,
      types: ['place', 'locality', 'district', 'region'], // Cities, localities, districts, states/regions
      country: 'us', // Restrict to US for work locations
    }),
    []
  )

  return (
    <YStack gap="$3" position="relative" z={999}>
      {/* Help Text */}
      {helpText && (
        <Text fontSize="$3" color="$color11" lineHeight="$1">
          {helpText}
        </Text>
      )}

      {/* Location Inputs */}
      <YStack gap="$2">
        {value.length > 0 ? (
          value.map((location, index) => (
            <XStack key={`location-input-${index}-${location}`} gap="$2" items="flex-start">
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

              {/* Remove button (show for all locations when there are locations) */}
              {value.length > 0 && (
                <Button
                  variant="outlined"
                  size="$3"
                  onPress={() => handleRemoveLocation(index)}
                  disabled={disabled}
                  circular
                  bg="transparent"
                  borderColor="$color8"
                  mt="$1"
                >
                  <Button.Icon>
                    <X size={16} color="$color11" />
                  </Button.Icon>
                </Button>
              )}
            </XStack>
          ))
        ) : (
          /* Empty state - show Add Location button */
          <Button
            variant="outlined"
            size="$3"
            onPress={handleAddLocation}
            disabled={disabled}
            self="flex-start"
            bg="transparent"
            borderColor="$color8"
          >
            <Button.Icon>
              <Plus size={16} color="$color11" />
            </Button.Icon>
            <Button.Text color="$color11">Add Preferred Work Location</Button.Text>
          </Button>
        )}
      </YStack>

      {/* Add Location Button (only show when there are existing locations) */}
      {value.length > 0 && fieldCount < maxLocations && (
        <Button
          variant="outlined"
          size="$3"
          onPress={handleAddLocation}
          disabled={disabled}
          self="flex-start"
          bg="transparent"
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
    </YStack>
  )
}
