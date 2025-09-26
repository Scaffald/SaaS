'use client'

import { useMemo, useState } from 'react'
import { Button, Paragraph, Separator, Sheet, Text, XStack, YStack, useMedia } from '@app/ui'
import { Filter, RefreshCw } from '@tamagui/lucide-icons'

import { FilterBar } from './components/FilterBar'
import { ResultList } from './components/ResultList'
import { defaultCenter, defaultRadiusMeters } from './data/mockProfiles'
import { useTalentProfiles } from './hooks/useTalentProfiles'
import type { ActiveFilter } from './types'
import type { TalentMarker } from './map/types'
import { TalentMap } from './map/TalentMap'

const INITIAL_FILTERS: ActiveFilter[] = [
  {
    id: 'location:marlborough',
    label: 'Marlborough, Connecticut, United States',
    category: 'location',
  },
  { id: 'radius:<50', label: 'Radius: < 50 mi', category: 'radius' },
  { id: 'score:40', label: 'Elevate score: > 40', category: 'other' },
  { id: 'skills:hardwood', label: 'Skills: Hardwood, Exterior, Interior', category: 'skill' },
  {
    id: 'cert:osha',
    label: 'Certification: OSHA Outreach · Construction',
    category: 'certification',
  },
]

export const DiscoverMapScreen = () => {
  const media = useMedia()
  const isSmallScreen = media.sm && !media.gtSm

  const [locationQuery, setLocationQuery] = useState('Marlborough, Connecticut, United States')
  const [radiusMeters] = useState(defaultRadiusMeters)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(INITIAL_FILTERS)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: talentProfiles = [], isLoading } = useTalentProfiles()

  const markers: TalentMarker[] = useMemo(
    () =>
      talentProfiles.map((profile) => ({
        id: profile.id,
        coordinate: profile.coordinates,
        title: profile.organization ?? 'Worker',
        metric: `e ${profile.score}`,
      })),
    [talentProfiles]
  )

  return (
    <YStack flex={1} backgroundColor="$backgroundSoft" height="100vh" overflow="hidden">
      <YStack padding="$5" gap="$4" flexShrink={0}>
        <FilterBar
          locationQuery={locationQuery}
          onLocationChange={setLocationQuery}
          onAdjustFilters={() => setFiltersOpen(true)}
          filters={activeFilters}
          onRemoveFilter={(filterId) =>
            setActiveFilters((current) => current.filter((filter) => filter.id !== filterId))
          }
          onClearFilters={() => setActiveFilters([])}
        />
      </YStack>

      <YStack flex={1} paddingHorizontal="$5" paddingBottom="$5" overflow="hidden">
        {isSmallScreen ? (
          <YStack gap="$4" flex={1} overflow="hidden">
            <YStack height={320} flexShrink={0}>
              <TalentMap
                center={defaultCenter}
                markers={markers}
                radiusMeters={radiusMeters}
                selectedMarkerId={selectedProfileId}
                onMarkerPress={setSelectedProfileId}
              />
            </YStack>
            <YStack flex={1} overflow="hidden">
              <ResultList
                profiles={talentProfiles}
                selectedId={selectedProfileId}
                onSelect={setSelectedProfileId}
                isLoading={isLoading}
              />
            </YStack>
          </YStack>
        ) : (
          <XStack flex={1} gap="$4" overflow="hidden">
            <YStack flexBasis={380} maxWidth={420} gap="$3" overflow="hidden">
              <ResultList
                profiles={talentProfiles}
                selectedId={selectedProfileId}
                onSelect={setSelectedProfileId}
                isLoading={isLoading}
              />
            </YStack>
            <YStack flex={1} overflow="hidden">
              <TalentMap
                center={defaultCenter}
                markers={markers}
                radiusMeters={radiusMeters}
                selectedMarkerId={selectedProfileId}
                onMarkerPress={setSelectedProfileId}
              />
            </YStack>
          </XStack>
        )}
      </YStack>

      <Sheet modal open={filtersOpen} onOpenChange={setFiltersOpen} snapPoints={[70]}>
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame padding="$5" gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="700">
              Filters
            </Text>
            <Button
              size="$2"
              theme="gray"
              icon={RefreshCw}
              onPress={() => setActiveFilters(INITIAL_FILTERS)}
            >
              Reset
            </Button>
          </XStack>
          <Paragraph color="$color11">
            Filter controls will connect to live data in a follow-up pass. For now this keeps the
            layout and interactions consistent across web and native.
          </Paragraph>
          <Separator />
          <YStack gap="$3">
            {activeFilters.map((filter) => (
              <XStack
                key={filter.id}
                justifyContent="space-between"
                alignItems="center"
                borderWidth={1}
                borderColor="$color5"
                borderRadius="$3"
                padding="$3"
              >
                <Text fontWeight="600">{filter.label}</Text>
                <Button
                  size="$2"
                  theme="surface2"
                  icon={Filter}
                  onPress={() => setFiltersOpen(false)}
                >
                  Adjust
                </Button>
              </XStack>
            ))}
            {activeFilters.length === 0 ? (
              <XStack alignItems="center" gap="$2">
                <Filter size={16} color="$color10" />
                <Text color="$color10">No filters applied</Text>
              </XStack>
            ) : null}
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  )
}

export default DiscoverMapScreen
