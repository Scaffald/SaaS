import { Fragment, useMemo } from 'react'
import {
  Button,
  ScrollView,
  Separator,
  Text,
  XStack,
  YStack,
  useTheme,
  AddressAutocomplete,
} from '@app/ui'
import {
  Filter,
  SlidersHorizontal,
  X as CloseIcon,
  Compass,
  MapPin,
  Target,
  Code,
  Award,
  Tag,
} from '@tamagui/lucide-icons'
import { FilterChip } from '@app/ui'

import type { ActiveFilter } from '../types'

type FilterBarProps = {
  locationQuery: string
  onLocationChange: (value: string) => void
  onLocationRequest: () => void
  onAdjustFilters: () => void
  filters: ActiveFilter[]
  onRemoveFilter: (filterId: string) => void
  onClearFilters: () => void
  isLocationLoading?: boolean
  locationPermissionStatus?: 'granted' | 'denied' | 'prompt' | 'unknown'
  onLocationSelect?: (coordinates: { lat: number; lng: number }) => void
}

export const FilterBar = ({
  locationQuery,
  onLocationChange,
  onLocationRequest,
  onAdjustFilters,
  filters,
  onRemoveFilter,
  onClearFilters,
  isLocationLoading = false,
  locationPermissionStatus = 'unknown',
  onLocationSelect,
}: FilterBarProps) => {
  const theme = useTheme()

  // Memoize search options to prevent recreation on every render
  const searchOptions = useMemo(
    () => ({
      types: ['place', 'locality'], // Mapbox types for cities and localities
      country: 'US',
    }),
    []
  )

  const getFilterIcon = (category: ActiveFilter['category']) => {
    switch (category) {
      case 'location':
        return <MapPin />
      case 'radius':
        return <Target />
      case 'skill':
        return <Code />
      case 'certification':
        return <Award />
      case 'other':
        return <Tag />
      default:
        return <Tag />
    }
  }

  const getFilterColor = (category: ActiveFilter['category']) => {
    switch (category) {
      case 'location':
        return 'blue'
      case 'radius':
        return 'green'
      case 'skill':
        return 'purple'
      case 'certification':
        return 'orange'
      case 'other':
        return 'pink'
      default:
        return 'blue'
    }
  }

  return (
    <YStack gap="$3" width="100%">
      <XStack gap="$3" width="100%" flexWrap="wrap" alignItems="center">
        <XStack flexGrow={1} minWidth={200} alignItems="center" position="relative">
          <AddressAutocomplete
            value={locationQuery}
            onChange={onLocationChange}
            onAddressSelect={(address) => {
              onLocationChange(address.formattedAddress)
              onLocationSelect?.(address.coordinates)
            }}
            placeholder="Search by city or address"
            provider="mapbox"
            apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
            zoomLevel="city"
            searchOptions={searchOptions}
            maxResults={5}
            debounceMs={300}
          />
          <Button
            size="$2"
            circular
            variant="outlined"
            icon={Compass}
            onPress={onLocationRequest}
            disabled={isLocationLoading}
            opacity={locationPermissionStatus === 'denied' ? 0.5 : 1}
            backgroundColor={isLocationLoading ? '$color3' : 'transparent'}
            position="absolute"
            right="$2"
            zIndex={10}
          />
        </XStack>
        <Button size="$2" icon={SlidersHorizontal} theme="blue" onPress={onAdjustFilters}>
          <Button.Text>Adjust filters</Button.Text>
        </Button>
      </XStack>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} paddingVertical="$1">
        <XStack gap="$2" alignItems="center">
          {filters.length === 0 ? (
            <XStack alignItems="center" gap="$2">
              <Filter size={16} color={theme.color10.val} />
              <Text color="$color11">Add filters to narrow results</Text>
            </XStack>
          ) : (
            <Fragment>
              {filters.map((filter) => (
                <FilterChip
                  key={filter.id}
                  label={filter.label}
                  icon={getFilterIcon(filter.category)}
                  color={getFilterColor(filter.category)}
                  size="$3"
                  onRemove={() => onRemoveFilter(filter.id)}
                />
              ))}
              <Separator vertical height="$3" />
              <Button size="$2" theme="gray" onPress={onClearFilters}>
                <Button.Text>Clear all</Button.Text>
              </Button>
            </Fragment>
          )}
        </XStack>
      </ScrollView>
    </YStack>
  )
}
