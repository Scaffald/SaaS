import { Fragment } from 'react'
import { Button, ScrollView, Separator, Text, XStack, YStack, useTheme } from '@app/ui'
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
import { AddressAutocompleteInput, FilterChip } from '@app/ui'

import type { ActiveFilter } from '../types'
import type { AddressSuggestion } from '@app/ui/src/utils/mapboxGeocoding'

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
}: FilterBarProps) => {
  const theme = useTheme()

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    // Update the location query with the selected address
    onLocationChange(suggestion.fullAddress)

    // TODO: Update map center to the selected address coordinates
    // This would require passing coordinates back to the parent component
    console.log('Selected address:', suggestion)
  }

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
        <XStack
          flexGrow={1}
          minWidth={200}
          alignItems="center"
          borderWidth={1}
          borderColor="$color5"
          backgroundColor="$color2"
          borderRadius="$3"
          paddingHorizontal="$2"
          paddingVertical="$1"
          gap="$2"
        >
          <AddressAutocompleteInput
            flexGrow={1}
            borderWidth={0}
            backgroundColor="transparent"
            size="$3"
            value={locationQuery}
            onChangeText={onLocationChange}
            onAddressSelect={handleAddressSelect}
            placeholder="Search by city or address"
            variant="clean"
            maxSuggestions={5}
            autocompleteOptions={{
              geocodingOptions: {
                country: 'US',
                types: ['address', 'place'],
                limit: 5,
                language: 'en',
              },
              debounceMs: 300,
              minQueryLength: 2,
            }}
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
          />
        </XStack>
        <Button size="$2" icon={SlidersHorizontal} theme="blue" onPress={onAdjustFilters}>
          Adjust filters
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
                Clear all
              </Button>
            </Fragment>
          )}
        </XStack>
      </ScrollView>
    </YStack>
  )
}
