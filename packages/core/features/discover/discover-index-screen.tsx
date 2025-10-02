import { useMemo, useState, useRef, useCallback } from 'react'
import { Button, Paragraph, Separator, Sheet, Text, XStack, YStack } from '@app/ui'
import { MapContainer, type MapContainerRef, type MapPinType } from '@app/ui'
import { Filter, RefreshCw } from '@tamagui/lucide-icons'
import { useWindowDimensions } from 'react-native'

import { FilterBar } from './components/FilterBar'
import { RadiusSlider } from './components/RadiusSlider'
import { ResultsRail } from './components/ResultsRail'
import { ProfileSummaryCard } from './components/ProfileSummaryCard'
import { DrawModeIndicator } from './components/DrawModeIndicator'
import type { ResultListRef } from './components/ResultList'
import { defaultCenter, defaultRadiusMeters } from './data/mockProfiles'
import { useTalentProfiles } from './hooks/useTalentProfiles'
import { useUserLocation } from './hooks/useUserLocation'
import type { ActiveFilter, TalentProfile } from './types'

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
  const mapRef = useRef<MapContainerRef>(null)

  // Location functionality
  const { location } = useUserLocation()

  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null)
  const [radiusMeters, setRadiusMeters] = useState(defaultRadiusMeters)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(INITIAL_FILTERS)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [summaryProfileId, setSummaryProfileId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [radiusAdjustmentOpen, setRadiusAdjustmentOpen] = useState(false)
  const [showSearchSheet, setShowSearchSheet] = useState(false)
  const [drawMode, setDrawMode] = useState(false)
  const [showRail, setShowRail] = useState(true)
  const [showResultsSheet, setShowResultsSheet] = useState(false)

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

  // Convert profiles to map pins with selected state
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
        selected: profile.id === summaryProfileId || profile.id === selectedProfileId,
      })),
    [talentProfiles, summaryProfileId, selectedProfileId]
  )

  // Get profile for summary card
  const summaryProfile = useMemo<TalentProfile | null>(() => {
    if (!summaryProfileId) return null
    return talentProfiles.find((p) => p.id === summaryProfileId) || null
  }, [summaryProfileId, talentProfiles])

  // Handle pin click - show summary card or deselect
  const handleMarkerPress = useCallback((profileId: string | null) => {
    if (profileId === null) {
      // Clicking empty space - clear selection
      setSummaryProfileId(null)
      setSelectedProfileId(null)
    } else {
      // Clicking a pin - show summary card
      setSummaryProfileId(profileId)
    }
  }, [])

  // Handle summary card click - show rail/sheet and highlight profile
  const handleSummaryCardPress = useCallback(() => {
    if (summaryProfileId) {
      setSelectedProfileId(summaryProfileId)

      if (isSmallScreen) {
        // On mobile, open the results sheet
        setShowResultsSheet(true)
      } else {
        // On desktop, show the rail
        setShowRail(true)
      }

      // Scroll to card with slight delay for better UX
      setTimeout(() => {
        resultListRef.current?.scrollToCard(summaryProfileId)
      }, 100)

      // Hide summary card
      setSummaryProfileId(null)
    }
  }, [summaryProfileId, isSmallScreen])

  const handleReset = useCallback(() => {
    setActiveFilters(INITIAL_FILTERS)
    setSelectedProfileId(null)
    setSummaryProfileId(null)
    setRadiusMeters(defaultRadiusMeters)
    setSearchCenter(null)
    setDrawMode(false)
  }, [])

  return (
    <YStack flex={1} height="100vh" overflow="hidden" position="relative">
      {/* Map as base layer */}
      <MapContainer
        ref={mapRef}
        pins={mapPins}
        center={mapCenter}
        zoom={7}
        onPinPress={handleMarkerPress}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Overlay elements */}
      {isSmallScreen ? (
        <>
          {/* Profile Summary Card - positioned above FilterBar */}
          {summaryProfile && (
            <YStack position="absolute" b={100} l="$4" r="$4" z={45} items="center">
              <ProfileSummaryCard profile={summaryProfile} onPress={handleSummaryCardPress} />
            </YStack>
          )}

          {/* Filter Bar */}
          <FilterBar
            onResultsPress={() => setShowResultsSheet(true)}
            resultsCount={talentProfiles.length}
            onSearchPress={() => setShowSearchSheet(true)}
            onFilterPress={() => setFiltersOpen(true)}
            onDrawPress={() => setDrawMode(!drawMode)}
            onResetPress={handleReset}
          />

          {/* Draw Mode Indicator */}
          <DrawModeIndicator isActive={drawMode} />
        </>
      ) : (
        <>
          {/* Profile Summary Card - positioned above FilterBar */}
          {summaryProfile && (
            <YStack position="absolute" b={100} l="$4" r="$4" z={45} items="center">
              <ProfileSummaryCard profile={summaryProfile} onPress={handleSummaryCardPress} />
            </YStack>
          )}

          {/* Results Rail */}
          <ResultsRail
            isVisible={showRail}
            profiles={talentProfiles}
            selectedId={selectedProfileId}
            onSelect={(id) => {
              setSelectedProfileId(id)
              // Center map on selected pin
              if (mapRef.current?.centerOnPin) {
                mapRef.current.centerOnPin(id)
              }
            }}
            isLoading={isLoading}
            resultListRef={resultListRef}
          />

          {/* Filter Bar */}
          <FilterBar
            onResultsPress={() => setShowRail(!showRail)}
            resultsCount={talentProfiles.length}
            onSearchPress={() => setShowSearchSheet(true)}
            onFilterPress={() => setFiltersOpen(true)}
            onDrawPress={() => setDrawMode(!drawMode)}
            onResetPress={handleReset}
          />

          {/* Draw Mode Indicator */}
          <DrawModeIndicator isActive={drawMode} />
        </>
      )}

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
            <ResultsRail
              isVisible={true}
              profiles={talentProfiles}
              selectedId={selectedProfileId}
              onSelect={(id) => {
                setSelectedProfileId(id)
              }}
              isLoading={isLoading}
              resultListRef={resultListRef}
            />
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* Filter Sheet */}
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

      {/* Radius Adjustment Sheet */}
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
