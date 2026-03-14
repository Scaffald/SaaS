import { createMapboxGeocodingProvider } from '@scf/core/utils/mapbox-geocoding-provider'
import type { AddressResult } from '@scaffald/ui'
import { AddressAutocomplete, useThemeContext } from '@scaffald/ui'
import { AlertCircle } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  railVisible: _railVisible = false,
}: MapSearchInputProps) => {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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

  if (!isVisible) return null

  return (
    <Row
      justify="flex-start"
      align="center"
      paddingHorizontal={16}
      style={{ position: 'absolute', top: 100, left: 0, zIndex: 60 }}
    >
          {tokenValidation.valid && mapboxToken ? (
            <AddressAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onAddressSelect={handleLocationSelect}
              placeholder="Search city, county, or region..."
              provider={createMapboxGeocodingProvider(mapboxToken)}
              searchOptions={{
                types: ['place', 'region', 'district', 'locality'],
                zoomLevel: 'city',
              }}
              minLength={2}
              maxResults={5}
              debounceMs={300}
            />
          ) : (
            <Stack
              style={{
                minWidth: 250,
                width: '100%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
              }}
              backgroundColor={colors.bg[t].default}
              padding="md"
              borderRadius={32}
              borderWidth={1}
              borderColor={colors.border[t].default}
              gap={8}
            >
              <Row align="center" gap={8}>
                <AlertCircle size={18} color={colors.text[t].secondary} />
                <Text style={{ color: colors.text[t].secondary }}>Map Search Unavailable</Text>
              </Row>
              <Text style={{ color: colors.text[t].secondary }}>{tokenValidation.error}</Text>
        </Stack>
      )}
    </Row>
  )
}
