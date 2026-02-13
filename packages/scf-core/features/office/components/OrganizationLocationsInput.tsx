import type { OrganizationLocation } from '@scf/schemas'
import type { AddressResult } from '@scaffald/ui'
import { AddressAutocomplete, useThemeContext } from '@scaffald/ui'
import { Plus, X } from 'lucide-react-native'
import { randomUUID } from 'expo-crypto'
import { useCallback, useEffect, useRef } from 'react'
import { Button, Input, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface OrganizationLocationsInputProps {
  value: OrganizationLocation[]
  onChange: (locations: OrganizationLocation[]) => void
  errors?: string
  disabled?: boolean
  provider?: 'google' | 'mapbox'
  apiKey?: string
}

/**
 * Organization Locations Input Component
 *
 * Allows users to add multiple locations with name and address.
 * Each location requires both a name and full address.
 *
 * @example
 * ```tsx
 * <OrganizationLocationsInput
 *   value={locations}
 *   onChange={setLocations}
 *   provider="mapbox"
 *   apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
 * />
 * ```
 */
export function OrganizationLocationsInput({
  value = [],
  onChange,
  errors,
  disabled = false,
  provider = 'mapbox',
  apiKey,
}: OrganizationLocationsInputProps) {
  const { theme } = useThemeContext()
  const resolvedProvider = provider === 'google' ? 'mapbox' : provider
  const resolvedApiKey =
    apiKey || (resolvedProvider === 'mapbox' ? process.env.EXPO_PUBLIC_MAPBOX_TOKEN : undefined)

  // Maintain stable IDs across renders - only generate new IDs for new items
  const locationIdsRef = useRef<string[]>([])

  // Update IDs only when array grows (new items added)
  useEffect(() => {
    if (value.length > locationIdsRef.current.length) {
      // Add new IDs for new items
      const newIds = Array.from({ length: value.length - locationIdsRef.current.length }, () =>
        randomUUID()
      )
      locationIdsRef.current = [...locationIdsRef.current, ...newIds]
    } else if (value.length < locationIdsRef.current.length) {
      // Trim IDs when items are removed
      locationIdsRef.current = locationIdsRef.current.slice(0, value.length)
    }
  }, [value.length])

  // Initialize IDs if empty
  if (value.length > 0 && locationIdsRef.current.length === 0) {
    locationIdsRef.current = value.map(() => randomUUID())
  }

  const locationIds = locationIdsRef.current

  // Handle location change at specific index
  const handleLocationChange = useCallback(
    (index: number, field: 'name' | 'address', fieldValue: string | Record<string, unknown>) => {
      const updated = [...value]

      // Ensure array is long enough
      while (updated.length <= index) {
        updated.push({ name: '', locationType: 'other' as const, isActive: true, address: {} })
      }

      if (field === 'name') {
        updated[index] = { ...updated[index], name: fieldValue as string }
      } else {
        updated[index] = { ...updated[index], address: fieldValue as Record<string, unknown> }
      }

      onChange(updated)
    },
    [value, onChange]
  )

  // Handle address selection from autocomplete
  const handleAddressSelect = useCallback(
    (index: number, address: AddressResult) => {
      handleLocationChange(index, 'address', {
        formattedAddress: address.formattedAddress,
        streetAddress: address.streetAddress,
        locality: address.locality,
        administrativeAreaLevel1: address.administrativeAreaLevel1,
        stateAbbreviation: address.stateAbbreviation,
        postalCode: address.postalCode,
        country: address.country,
        countryCode: address.countryCode,
        coordinates: address.coordinates,
      })
    },
    [handleLocationChange]
  )

  // Add new location
  const handleAddLocation = useCallback(() => {
    onChange([...value, { name: '', locationType: 'other' as const, isActive: true, address: {} }])
  }, [value, onChange])

  // Remove location at index
  const handleRemoveLocation = useCallback(
    (index: number) => {
      const updated = value.filter((_, i) => i !== index)
      onChange(updated)
    },
    [value, onChange]
  )

  // Get formatted address string for display in autocomplete
  const getAddressString = (address: Record<string, unknown>): string => {
    if (address.formattedAddress) {
      return address.formattedAddress as string
    }
    return ''
  }

  return (
    <Stack gap={12}>
      {/* Label and Help Text */}
      <Stack gap={8}>
        <Text>Locations *</Text>
        <Text style={{ color: colors.text[theme].secondary }} lineHeight={4}>
          Add one or more locations for this organization
        </Text>
      </Stack>

      {/* Location Inputs */}
      <Stack gap={16}>
        {value.length > 0 ? (
          value.map((location, index) => (
            <Stack
              key={locationIds[index]}
              gap={8}
              padding="sm"
              style={{ backgroundColor: colors.bg[theme].default }}
              borderWidth={1}
              borderColor={colors.border[theme].default}
            >
              {/* Location Name */}
              <Stack gap={8}>
                <Text>Location Name</Text>
                <Input
                  value={location.name}
                  onChangeText={(text) => handleLocationChange(index, 'name', text)}
                  placeholder={index === 0 ? 'e.g., Headquarters' : `Location ${index + 1}`}
                  disabled={disabled}
                />
              </Stack>

              {/* Location Address */}
              <Stack gap={8}>
                <Text>Address</Text>
                <AddressAutocomplete
                  key={`address-${locationIds[index]}`}
                  value={getAddressString(location.address ?? {})}
                  onAddressSelect={(address: AddressResult) => handleAddressSelect(index, address)}
                  placeholder="Search for an address..."
                  provider={resolvedProvider}
                  apiKey={resolvedApiKey}
                  disabled={disabled}
                  debounceMs={300}
                  minLength={3}
                  maxResults={8}
                />
              </Stack>

              {/* Remove Button */}
              <Row justify="flex-end">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleRemoveLocation(index)}
                  disabled={disabled || value.length === 1}
                  backgroundColor="transparent"
                  borderColor={colors.border[theme].default}
                >
                  <Button.Icon>
                    <X size="md" style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }} />
                  </Button.Icon>
                  <Button.Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>
                    Remove Location
                  </Button.Text>
                </Button>
              </Row>
            </Stack>
          ))
        ) : (
          /* Empty state - show Add Location button */
          <Stack padding="md" borderWidth={1} borderColor={colors.border[theme].default} gap={8}>
            <Text style={{ color: colors.text[theme].secondary }}>No locations added yet</Text>
            <Button
              variant="outline"
              size="sm"
              onPress={handleAddLocation}
              disabled={disabled}
              backgroundColor="transparent"
              borderColor={colors.border[theme].default}
            >
              <Button.Icon>
                <Plus size="md" style={{ color: colors.text[theme].secondary }} />
              </Button.Icon>
              <Button.Text style={{ color: colors.text[theme].secondary }}>
                Add First Location
              </Button.Text>
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Add Another Location Button */}
      {value.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onPress={handleAddLocation}
          disabled={disabled}
          alignSelf="flex-start"
          backgroundColor="transparent"
          borderColor={colors.border[theme].default}
        >
          <Button.Icon>
            <Plus size="md" style={{ color: colors.text[theme].secondary }} />
          </Button.Icon>
          <Button.Text style={{ color: colors.text[theme].secondary }}>
            Add Another Location
          </Button.Text>
        </Button>
      )}

      {/* Error Message */}
      {errors && <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>{errors}</Text>}
    </Stack>
  )
}
