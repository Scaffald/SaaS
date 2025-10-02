import { useMemo, useState, useRef } from 'react'
import { Button, Paragraph, Separator, Sheet, Text, XGroup, XStack, YStack } from '@app/ui'
import { MapContainer, type MapPinType } from '@app/ui'
import { Filter, RefreshCw, List } from '@tamagui/lucide-icons'

import { FilterBar } from './components/FilterBar'
import { RadiusSlider } from './components/RadiusSlider'
import { ResultList, type ResultListRef } from './components/ResultList'
import { defaultCenter, defaultRadiusMeters } from './data/mockProfiles'
import { useTalentProfiles } from './hooks/useTalentProfiles'
import { useUserLocation } from './hooks/useUserLocation'
import type { ActiveFilter } from './types'
import { useWindowDimensions } from 'react-native'

const formatRadius = (meters: number): string => {
  const miles = meters / 1609.34
  if (miles < 1) {
    return `${Math.round(miles * 10) / 10} mi`
  }
  return `${Math.round(miles)} mi`
}

const INITIAL_FILTERS: ActiveFilter[] = [
  {
    id: 'location:marlborough',
    label: 'Marlborough, Connecticut, United States',
    category: 'location',
  },
  { id: 'score:40', label: 'Elevate score: > 40', category: 'other' },
  { id: 'skills:hardwood', label: 'Skills: Hardwood, Exterior, Interior', category: 'skill' },
  {
    id: 'cert:osha',
    label: 'Certification: OSHA Outreach · Construction',
    category: 'certification',
  },
]

export const DiscoverIndexScreen = () => {
  const { width } = useWindowDimensions()
  const isSmallScreen = width < 640
  const resultListRef = useRef<ResultListRef>(null)

  // Location functionality
  const { location } = useUserLocation()

  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null)
  const [radiusMeters, setRadiusMeters] = useState(defaultRadiusMeters)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(INITIAL_FILTERS)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [radiusAdjustmentOpen, setRadiusAdjustmentOpen] = useState(false)
  const [showSearchSheet, setShowSearchSheet] = useState(false)
  const [drawMode, setDrawMode] = useState(false)
  const [showRail, setshowRail] = useState(true)

  const { data: talentProfiles = [], isLoading } = useTalentProfiles()

  // Determine map center based on search location, user location, or default
  const mapCenter: [number, number] = useMemo(() => {
    if (searchCenter) {
      return searchCenter
    }
    if (location) {
      return [location.longitude, location.latitude]
    }
    return defaultCenter
  }, [searchCenter, location])

  // Create radius filter dynamically
  const radiusFilter: ActiveFilter = {
    id: 'radius:custom',
    label: `Radius: ${formatRadius(radiusMeters)}`,
    category: 'radius',
  }

  // Combine radius filter with other filters
  const allFilters = useMemo(() => {
    return [radiusFilter, ...activeFilters]
  }, [radiusFilter, activeFilters])

  // Convert profiles to map pins
  const mapPins: MapPinType[] = useMemo(
    () =>
      talentProfiles.map((profile) => ({
        id: profile.id,
        coordinate: profile.coordinates,
        title: profile.name,
        subtitle: profile.title,
        metric: `e ${profile.score}`,
        score: profile.score,
        hourlyRate: profile.hourlyRate,
        badges: profile.badges,
        availability: 'available' as const,
      })),
    [talentProfiles]
  )

  // State for mobile results sheet
  const [showResultsSheet, setShowResultsSheet] = useState(false)

  const handleMarkerPress = (profileId: string) => {
    setSelectedProfileId(profileId)

    // Scroll to card with slight delay for better UX
    setTimeout(() => {
      resultListRef.current?.scrollToCard(profileId)
    }, 100)
  }

  return (
    <YStack flex={1}>
      <YStack flex={1}>
        {isSmallScreen ? (
          <YStack flex={1} position="relative">
            {/* Fullscreen Map */}
            <MapContainer
              pins={mapPins}
              center={mapCenter}
              zoom={7}
              onPinPress={handleMarkerPress}
            />

            <XGroup
              style={{
                backgroundColor: 'red',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
              }}
            >
              <XGroup.Item>
                <Button width="50%" size="$2">
                  Map
                </Button>
              </XGroup.Item>

              <XGroup.Item>
                <Button width="50%" size="$2">
                  List
                </Button>
              </XGroup.Item>
            </XGroup>

            {/* Filter Bar with results button */}
            <FilterBar
              onResultsPress={() => setShowResultsSheet(true)}
              resultsCount={talentProfiles.length}
              onSearchPress={() => setShowSearchSheet(true)}
              onFilterPress={() => setFiltersOpen(true)}
              onDrawPress={() => setDrawMode(!drawMode)}
              onResetPress={() => {
                setActiveFilters(INITIAL_FILTERS)
                setSelectedProfileId(null)
                setRadiusMeters(defaultRadiusMeters)
                setSearchCenter(null)
                setDrawMode(false)
              }}
            />

            {/* Draw Mode Indicator */}
            {drawMode && (
              <YStack
                position="absolute"
                t="$4"
                l="$4"
                r="$4"
                z={100}
                bg="$blue9"
                p="$3"
                rounded="$4"
                items="center"
              >
                <Text color="white" fontSize="$4" fontWeight="600">
                  🖊️ Draw Mode Active - Draw on the map to select an area
                </Text>
              </YStack>
            )}
          </YStack>
        ) : (
          <XStack flex={1} gap="$4" overflow="hidden">
            <YStack flex={1} overflow="hidden" position="relative">
              <MapContainer
                pins={mapPins}
                center={mapCenter}
                zoom={7}
                onPinPress={handleMarkerPress}
              />

              {/* Filter Bar for desktop view */}
              <FilterBar
                onResultsPress={() => setshowRail(!showRail)}
                resultsCount={talentProfiles.length}
                onSearchPress={() => setShowSearchSheet(true)}
                onFilterPress={() => setFiltersOpen(true)}
                onDrawPress={() => setDrawMode(!drawMode)}
                onResetPress={() => {
                  setActiveFilters(INITIAL_FILTERS)
                  setSelectedProfileId(null)
                  setRadiusMeters(defaultRadiusMeters)
                  setSearchCenter(null)
                  setDrawMode(false)
                }}
              />

              {/* Draw Mode Indicator */}
              {drawMode && (
                <YStack
                  position="absolute"
                  t="$4"
                  l="$4"
                  r="$4"
                  z={100}
                  bg="$blue9"
                  p="$3"
                  rounded="$4"
                  items="center"
                >
                  <Text color="white" fontSize="$4" fontWeight="600">
                    🖊️ Draw Mode Active - Draw on the map to select an area
                  </Text>
                </YStack>
              )}
            </YStack>

            {showRail && (
              <YStack flexBasis={380} maxW={420} gap="$3" overflow="hidden">
                <ResultList
                  ref={resultListRef}
                  profiles={talentProfiles}
                  selectedId={selectedProfileId}
                  onSelect={setSelectedProfileId}
                  isLoading={isLoading}
                />
              </YStack>
            )}
          </XStack>
        )}
      </YStack>

      {/* Search Sheet */}
      <Sheet
        modal
        open={showSearchSheet}
        onOpenChange={setShowSearchSheet}
        snapPoints={[60]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame bg="$background" p="$4" gap="$4">
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="bold" color="$color12">
              Search
            </Text>
            <Paragraph color="$color11">Search by location, worker name, or skills...</Paragraph>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* Mobile Results Sheet */}
      <Sheet
        modal
        open={showResultsSheet}
        onOpenChange={setShowResultsSheet}
        snapPoints={[85, 50]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame>
          <YStack flex={1} overflow="hidden">
            <ResultList
              ref={resultListRef}
              profiles={talentProfiles}
              selectedId={selectedProfileId}
              onSelect={(id) => {
                setSelectedProfileId(id)
                setShowResultsSheet(false)
              }}
              isLoading={isLoading}
            />
          </YStack>
        </Sheet.Frame>
      </Sheet>

      <Sheet modal open={filtersOpen} onOpenChange={setFiltersOpen} snapPoints={[70]}>
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame p="$5" gap="$4">
          <XStack justify="space-between" items="center">
            <Text fontSize="$5" fontWeight="700">
              Filters
            </Text>
            <Button size="$2" icon={RefreshCw} onPress={() => setActiveFilters(INITIAL_FILTERS)}>
              Reset
            </Button>
          </XStack>
          <Paragraph color="$color11">
            Filter controls will connect to live data in a follow-up pass. For now this keeps the
            layout and interactions consistent across web and native.
          </Paragraph>
          <Separator />
          <YStack gap="$3">
            {allFilters.map((filter) => (
              <XStack
                key={filter.id}
                justify="space-between"
                items="center"
                borderWidth={1}
                borderColor="$color5"
                rounded="$3"
                p="$3"
              >
                <Text fontWeight="600">{filter.label}</Text>
                <Button
                  size="$2"
                  icon={Filter}
                  onPress={() => {
                    if (filter.id === 'radius:custom') {
                      setRadiusAdjustmentOpen(true)
                      setFiltersOpen(false)
                    } else {
                      setFiltersOpen(false)
                    }
                  }}
                >
                  Adjust
                </Button>
              </XStack>
            ))}
            {allFilters.length === 0 ? (
              <XStack items="center" gap="$2">
                <Filter size={16} color="$color10" />
                <Text color="$color10">No filters applied</Text>
              </XStack>
            ) : null}
          </YStack>
        </Sheet.Frame>
      </Sheet>

      <Sheet
        modal
        open={radiusAdjustmentOpen}
        onOpenChange={setRadiusAdjustmentOpen}
        snapPoints={[50]}
      >
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame p="$5" gap="$4">
          <XStack justify="space-between" items="center">
            <Text fontSize="$5" fontWeight="700">
              Adjust Search Radius
            </Text>
            <Button size="$2" onPress={() => setRadiusAdjustmentOpen(false)}>
              Done
            </Button>
          </XStack>
          <Paragraph color="$color11">
            Drag the slider to adjust your search radius. The map will update in real-time.
          </Paragraph>
          <Separator />
          <RadiusSlider
            value={radiusMeters}
            onValueChange={setRadiusMeters}
            min={1000}
            max={100000}
            step={1000}
          />
        </Sheet.Frame>
      </Sheet>
    </YStack>
  )
}

export default DiscoverIndexScreen
