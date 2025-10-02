import { useState, useCallback } from 'react'
import { XStack, AnimatePresence } from 'tamagui'
import { AddressAutocomplete } from '@app/ui'
import type { AddressResult } from '@app/ui'

type MapSearchInputProps = {
  isVisible: boolean
  onClose: () => void
  onLocationSelect: (location: { longitude: number; latitude: number; label: string }) => void
}

/**
 * Animated search input that appears at the top of the map
 * Provides Mapbox geocoding autocomplete for city, county, region searches
 */
export const MapSearchInput = ({ isVisible, onClose, onLocationSelect }: MapSearchInputProps) => {
  const [searchQuery, setSearchQuery] = useState('')

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
          t="$4"
          l="$4"
          r="$4"
          z={60}
          animation="quick"
          enterStyle={{ opacity: 0, y: -20 }}
          exitStyle={{ opacity: 0, y: -20 }}
          opacity={1}
          y={0}
        >
          <XStack
            flex={1}
            bg="$background"
            rounded="$8"
            borderWidth={1}
            borderColor="$borderColor"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.15}
            shadowRadius={12}
          >
            <AddressAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onAddressSelect={handleLocationSelect}
              placeholder="Search city, county, or region..."
              provider="mapbox"
              apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
              zoomLevel="city"
              searchOptions={{
                types: ['place', 'region', 'district', 'locality'],
              }}
              minLength={2}
              maxResults={5}
              debounceMs={300}
            />
          </XStack>
        </XStack>
      )}
    </AnimatePresence>
  )
}
