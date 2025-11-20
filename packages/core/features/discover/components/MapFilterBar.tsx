import type { AddressResult } from '@app/ui'
import { AddressAutocomplete } from '@app/ui'
import { List, RotateCcw } from '@tamagui/lucide-icons'
import { useCallback, useMemo, useState } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
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
    <XStack
      width="100%"
      px="$4"
      py="$3"
      gap="$3"
      items="center"
      bg="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      $sm={{
        flexDirection: 'column',
        items: 'stretch',
      }}
    >
      {/* Search Input */}
      {tokenValidation.valid ? (
        <YStack flex={1} minW="100%" $md={{ minW: 200 }} $sm={{ minW: '100%', maxW: '100%' }}>
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
              w: '100%',
              bg: 'white',
              rounded: '$4',
            }}
          />
        </YStack>
      ) : (
        <YStack
          flex={1}
          width="100%"
          minW="100%"
          $md={{ minW: 200 }}
          bg="$background"
          p="$3"
          rounded="$4"
          borderWidth={1}
          borderColor="$red8"
          gap="$2"
          $sm={{ minW: '100%', maxW: '100%' }}
        >
          <XStack items="center" gap="$2">
            <Text fontSize="$3" color="$red10" fontWeight="600">
              Map Search Unavailable
            </Text>
          </XStack>
          <Text fontSize="$2" color="$color10">
            {tokenValidation.error}
          </Text>
        </YStack>
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
        size="$4"
        variant="outlined"
        onPress={onResultsPress}
        bg="$background"
        hoverStyle={{ bg: '$backgroundHover' }}
        pressStyle={{ bg: '$backgroundPress' }}
        icon={resultsCount > 0 ? undefined : List}
        $sm={{ minW: '100%' }}
      >
        {resultsCount > 0 ? (
          <Text fontSize="$4" fontWeight="600">
            {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
          </Text>
        ) : (
          <Text fontSize="$4">Results</Text>
        )}
      </Button>

      {/* Reset Button */}
      <Button
        size="$4"
        variant="outlined"
        icon={RotateCcw}
        scaleIcon={1.2}
        onPress={onReset}
        bg="$background"
        hoverStyle={{ bg: '$backgroundHover' }}
        pressStyle={{ bg: '$backgroundPress' }}
        aria-label="Reset filters and search"
        $sm={{ minW: '100%' }}
      />
    </XStack>
  )
}
