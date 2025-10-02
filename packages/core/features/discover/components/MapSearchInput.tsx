import { useState, useCallback } from 'react'
import { XStack, AnimatePresence } from 'tamagui'
import { AddressAutocomplete } from '@app/ui'
import type { AddressResult } from '@app/ui'

type MapSearchInputProps = {
  isVisible: boolean
  onClose: () => void
  onLocationSelect: (location: { longitude: number; latitude: number; label: string }) => void
  railVisible?: boolean
}

/**
 * Animated search input that appears at the top of the map
 * Provides Mapbox geocoding autocomplete for city, county, region searches
 * Centered above the filter bar with 250px minimum width
 */
export const MapSearchInput = ({
  isVisible,
  onClose,
  onLocationSelect,
  railVisible = false,
}: MapSearchInputProps) => {
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
          t={100}
          l={0}
          r={railVisible ? 440 : 0}
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
            containerProps={{
              minW: 250,
              maxW: 600,
              w: '100%',
              rounded: '$8',
              shadowColor: '$shadowColor',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            }}
          />
        </XStack>
      )}
    </AnimatePresence>
  )
}
