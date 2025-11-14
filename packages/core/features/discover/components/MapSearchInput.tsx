import { useState, useCallback, useMemo } from 'react'
import { XStack, AnimatePresence, YStack, Text } from 'tamagui'
import { AddressAutocomplete } from '@app/ui'
import type { AddressResult } from '@app/ui'
import { AlertCircle } from '@tamagui/lucide-icons'

type MapSearchInputProps = {
  isVisible: boolean
  onClose: () => void
  onLocationSelect: (location: { longitude: number; latitude: number; label: string }) => void
  railVisible?: boolean
}

/**
 * Validate Mapbox API key format
 * Mapbox tokens start with 'pk.' for public tokens
 */
function validateMapboxToken(token: string | undefined): { valid: boolean; error?: string } {
  if (!token) {
    return {
      valid: false,
      error: 'Map search is temporarily unavailable. Please contact support.',
    }
  }

  if (!token.startsWith('pk.')) {
    console.error('Invalid Mapbox token format:', `${token.substring(0, 10)}...`)
    return {
      valid: false,
      error: 'Map search configuration error. Please contact support.',
    }
  }

  return { valid: true }
}

/**
 * Animated search input that appears at the top of the map
 * Provides Mapbox geocoding autocomplete for city, county, region searches
 * Centered above the filter bar with 250px minimum width
 *
 * Features:
 * - Validates Mapbox API key before enabling search
 * - Shows user-friendly error messages when API key is missing or invalid
 * - Disables search input when provider is unavailable
 */
export const MapSearchInput = ({
  isVisible,
  onClose,
  onLocationSelect,
  railVisible = false,
}: MapSearchInputProps) => {
  const [searchQuery, setSearchQuery] = useState('')

  // Validate API key
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN
  const tokenValidation = useMemo(() => validateMapboxToken(mapboxToken), [mapboxToken])

  const handleLocationSelect = useCallback(
    (address: AddressResult) => {
      onLocationSelect({
        longitude: address.coordinates.lng,
        latitude: address.coordinates.lat,
        label: address.formattedAddress,
      })
      setSearchQuery('')
      onClose()
    },
    [onLocationSelect, onClose]
  )

  return (
    <AnimatePresence>
      {isVisible && (
        <XStack
          position="absolute"
          t={100}
          l={0}
          r={0}
          $sm={{ r: 0 }}
          $gtSm={{ r: railVisible ? 440 : 0 }}
          z={60}
          animation="quick"
          enterStyle={{ opacity: 0, y: 20 }}
          exitStyle={{ opacity: 0, y: 20 }}
          opacity={1}
          y={0}
          justify="center"
          items="center"
          px="$4"
        >
          {tokenValidation.valid ? (
            <AddressAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onAddressSelect={handleLocationSelect}
              placeholder="Search city, county, or region..."
              provider="mapbox"
              apiKey={mapboxToken}
              zoomLevel="city"
              searchOptions={{
                types: ['place', 'region', 'district', 'locality'],
              }}
              minLength={2}
              maxResults={5}
              debounceMs={300}
              containerProps={{
                style: { minWidth: 250, maxWidth: 600, width: '100%' },
                rounded: '$8',
                shadowColor: '$shadowColor',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
              }}
            />
          ) : (
            <YStack
              style={{ minWidth: 250, maxWidth: 600, width: '100%' }}
              bg="$background"
              p="$4"
              rounded="$8"
              borderWidth={1}
              borderColor="$red8"
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.15}
              shadowRadius={12}
              gap="$2"
            >
              <XStack items="center" gap="$2">
                <AlertCircle size={18} color="$red10" />
                <Text fontSize="$3" color="$red10" fontWeight="600">
                  Map Search Unavailable
                </Text>
              </XStack>
              <Text fontSize="$2" color="$color10">
                {tokenValidation.error}
              </Text>
            </YStack>
          )}
        </XStack>
      )}
    </AnimatePresence>
  )
}
