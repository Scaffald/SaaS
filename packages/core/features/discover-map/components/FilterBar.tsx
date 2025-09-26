import { Fragment } from 'react'
import { Button, Input, ScrollView, Separator, Text, XStack, YStack, useTheme } from '@app/ui'
import { Filter, MapPin, SlidersHorizontal, X as CloseIcon } from '@tamagui/lucide-icons'

import type { ActiveFilter } from '../types'

type FilterBarProps = {
  locationQuery: string
  onLocationChange: (value: string) => void
  onAdjustFilters: () => void
  filters: ActiveFilter[]
  onRemoveFilter: (filterId: string) => void
  onClearFilters: () => void
}

export const FilterBar = ({
  locationQuery,
  onLocationChange,
  onAdjustFilters,
  filters,
  onRemoveFilter,
  onClearFilters,
}: FilterBarProps) => {
  const theme = useTheme()

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
          <MapPin size={14} color={theme.color10.val} />
          <Input
            flexGrow={1}
            borderWidth={0}
            backgroundColor="transparent"
            size="$2"
            value={locationQuery}
            onChangeText={onLocationChange}
            placeholder="Search by city or address"
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
                <Button
                  key={filter.id}
                  size="$2"
                  borderRadius="$10"
                  theme="surface2"
                  iconAfter={CloseIcon}
                  onPress={() => onRemoveFilter(filter.id)}
                >
                  {filter.label}
                </Button>
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
