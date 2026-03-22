import type { AddressResult } from '@scaffald/ui'
import { AddressAutocomplete } from '@scaffald/ui'
import { createMapboxGeocodingProvider } from '@scf/core/utils/mapbox-geocoding-provider'
import { List } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { Button, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { PageHeader } from '@scf/core/components/PageHeader'
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
 * Map-specific filter bar that composes PageHeader with AddressAutocomplete search,
 * filter toggles, and a results count button.
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [searchQuery, setSearchQuery] = useState('')

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

  const renderSearch = useCallback(() => {
    if (tokenValidation.valid && mapboxToken) {
      return (
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
      )
    }

    return (
      <Stack
        style={{ backgroundColor: colors.bg[t].default, borderColor: t === 'dark' ? colors.error[400] : colors.error[500] }}
        padding="sm"
        borderRadius={16}
        borderWidth={1}
        gap={8}
      >
        <Row align="center" gap={8}>
          <Text style={{ color: t === 'dark' ? colors.error[300] : colors.error[600] }}>Map Search Unavailable</Text>
        </Row>
        <Text style={{ color: colors.text[t].secondary }}>{tokenValidation.error}</Text>
      </Stack>
    )
  }, [tokenValidation, mapboxToken, searchQuery, handleLocationSelect, t])

  return (
    <PageHeader
      renderSearch={renderSearch}
      onReset={onReset}
      style={{ backgroundColor: colors.bg[t].default }}
    >
      <FilterDropdown
        showWorkers={showWorkers}
        showOrganizations={showOrganizations}
        showJobs={showJobs}
        onShowWorkersChange={onShowWorkersChange}
        onShowOrganizationsChange={onShowOrganizationsChange}
        onShowJobsChange={onShowJobsChange}
      />

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
    </PageHeader>
  )
}
