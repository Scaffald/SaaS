import { useMemo, useState, useRef, useCallback } from 'react'
import { Button, Paragraph, Separator, Sheet, Text, XStack, YStack } from 'tamagui'
import { MapContainer, type MapContainerRef, type MapPinType } from '@app/ui'
import { Filter, RefreshCw } from '@tamagui/lucide-icons'
import { useWindowDimensions } from 'react-native'

import { FilterBar } from './components/FilterBar'
import { MapSearchInput } from './components/MapSearchInput'
import { ResultsRail } from './components/ResultsRail'
import { ProfileSummaryCard } from './components/ProfileSummaryCard'
import type { ResultListRef } from './components/ResultList'
import { defaultCenter } from './data/mockProfiles'
import { useTalentProfiles } from './hooks/useTalentProfiles'
import { useUserLocation } from './hooks/useUserLocation'
import type { ActiveFilter, TalentProfile } from './types'

const INITIAL_FILTERS: ActiveFilter[] = [
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
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(INITIAL_FILTERS)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [summaryProfileId, setSummaryProfileId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showSearchInput, setShowSearchInput] = useState(false)
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
  const handleMarkerPress = useCallback(
    (profileId: string | null) => {
      // Hide search input when user interacts with map
      setShowSearchInput(false)

      if (profileId === null) {
        // Clicking empty space - clear selection
        setSummaryProfileId(null)
        setSelectedProfileId(null)
      } else {
        // On mobile: show summary card
        // On desktop: select in rail and scroll to it
        if (isSmallScreen) {
          setSummaryProfileId(profileId)
        } else {
          setSelectedProfileId(profileId)
          // Ensure rail is visible first
          setShowRail(true)
          // Scroll to card in rail after ensuring visibility
          setTimeout(() => {
            if (resultListRef.current?.scrollToCard) {
              resultListRef.current.scrollToCard(profileId)
            }
          }, 200)
        }
      }
    },
    [isSmallScreen]
  )

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
    setSearchCenter(null)
    setShowSearchInput(false)
  }, [])

  const handleLocationSelect = useCallback(
    (location: { longitude: number; latitude: number; label: string }) => {
      setSearchCenter([location.longitude, location.latitude])
      // Center the map on the new location
      if (mapRef.current?.flyTo) {
        mapRef.current.flyTo([location.longitude, location.latitude], 12)
      }
    },
    []
  )

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

      {/* Search Input Overlay */}
      <MapSearchInput
        isVisible={showSearchInput}
        onClose={() => setShowSearchInput(false)}
        onLocationSelect={handleLocationSelect}
      />

      {/* Overlay elements */}
      {isSmallScreen ? (
        <>
          {/* Profile Summary Card - Mobile Only - Full Width Above FilterBar */}
          {summaryProfile && (
            <YStack position="absolute" justify="center" b={100} l={0} r={0} z={45}>
              <ProfileSummaryCard profile={summaryProfile} onPress={handleSummaryCardPress} />
            </YStack>
          )}
          {/* Filter Bar */}
          <FilterBar
            onResultsPress={() => setShowResultsSheet(true)}
            resultsCount={talentProfiles.length}
            onSearchPress={() => setShowSearchInput(true)}
            onFilterPress={() => setFiltersOpen(true)}
            onResetPress={handleReset}
          />
        </>
      ) : (
        <>
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
            onSearchPress={() => setShowSearchInput(true)}
            onFilterPress={() => setFiltersOpen(true)}
            onResetPress={handleReset}
          />
        </>
      )}

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
            {activeFilters.map((filter) => (
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
                    setFiltersOpen(false)
                  }}
                >
                  Adjust
                </Button>
              </XStack>
            ))}
            {activeFilters.length === 0 ? (
              <XStack items="center" gap="$2">
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

export default DiscoverIndexScreen
