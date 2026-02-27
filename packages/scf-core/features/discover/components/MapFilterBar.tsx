import type { AddressResult } from '@scaffald/ui'
import { AddressAutocomplete } from '@scaffald/ui'
import { createMapboxGeocodingProvider } from '@scf/core/utils/mapbox-geocoding-provider'
import { List, RotateCcw } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { Button, Text, Row, Stack } from '@scaffald/ui'
import { FilterDropdown } from './FilterDropdown'

type MapFilterBarProps = {
  onLocationSelect: (location: { longitude: number; latitude: number; label: string }) => void
  showWorkers?: boolean
  showOrganizations?: boolean
  showJobs?: boolean
  onShowWorkersChange?: (value: boolean) => void
  onShowOrganizationsChange?: (value: boolean) => void
  onShowJobsChange?: (value: boolean) => void
  resultsCount?: number
  onResultsPress?: () => void
  onReset?: () => void
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
 * Full-width Map Filter Bar Component
 *
 * A comprehensive filter bar positioned above the map and drawer components.
 * Contains search input, filter dropdowns, results count, and reset functionality.
 *
 * Features:
 * - Always-visible search input using AddressAutocomplete
 * - Filter dropdown for Workers/Organizations/Jobs toggles
 * - Results count display (clickable to toggle results rail/sheet)
 * - Reset button to clear all filters and search
 * - Responsive design: horizontal on desktop, may stack on mobile
 */
export const MapFilterBar = ({
  onLocationSelect,
  showWorkers = true,
  showOrganizations = true,
  showJobs = true,
  onShowWorkersChange,
  onShowOrganizationsChange,
  onShowJobsChange,
  resultsCount = 0,
  onResultsPress,
  onReset,
}: MapFilterBarProps) => {
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
    },
    [onLocationSelect]
  )

  return (
    <Row
      width="100%"
      paddingHorizontal={16}
      paddingVertical={12}
      gap={12}
      align="center"
      backgroundColor="$background"
      style={{ borderBottomWidth: 1, borderBottomColor: '$borderColor' }}
    >
      {/* Search Input */}
      {tokenValidation.valid && mapboxToken ? (
        <Stack flex={1} minWidth={200}>
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
        </Stack>
      ) : (
        <Stack
          flex={1}
          minWidth={200}
          backgroundColor="$background"
          padding="sm"
          borderRadius={16}
          borderWidth={1}
          borderColor="$red8"
          gap={8}
        >
          <Row align="center" gap={8}>
            <Text color="$red10">Map Search Unavailable</Text>
          </Row>
          <Text color="$gray11">{tokenValidation.error}</Text>
        </Stack>
      )}

      {/* Filter Dropdown */}
      <FilterDropdown
        showWorkers={showWorkers}
        showOrganizations={showOrganizations}
        showJobs={showJobs}
        onShowWorkersChange={onShowWorkersChange}
        onShowOrganizationsChange={onShowOrganizationsChange}
        onShowJobsChange={onShowJobsChange}
      />

      {/* Results Count */}
      <Button
        size="md"
        variant="outline"
        onPress={onResultsPress}
        color="gray"
        iconStart={resultsCount > 0 ? undefined : List}
      >
        {resultsCount > 0 ? (
          <Text>
            {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
          </Text>
        ) : (
          <Text>Results</Text>
        )}
      </Button>

      {/* Reset Button */}
      <Button
        size="md"
        variant="outline"
        iconStart={RotateCcw}
        onPress={onReset}
        color="gray"
        accessibilityLabel="Reset filters and search"
      />
    </Row>
  )
}
