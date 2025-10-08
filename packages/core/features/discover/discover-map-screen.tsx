import { useMemo, useState, useRef, useCallback } from 'react'
import { Sheet, YStack } from 'tamagui'
import { MapContainer, type MapContainerRef, type MapPinType } from '@app/ui'
import { useWindowDimensions } from 'react-native'

import { FilterBar } from './components/FilterBar'
import { FilterPopup } from './components/FilterPopup'
import { MapSearchInput } from './components/MapSearchInput'
import { ResultsRail } from './components/ResultsRail'
import { ProfileSummaryCard } from './components/ProfileSummaryCard'
import type { ResultListRef } from './components/ResultList'
import { defaultCenter } from './data/mockProfiles'
import { useTalentProfiles } from './hooks/useTalentProfiles'
import { useOrganizations } from './hooks/useOrganizations'
import { useJobs } from './hooks/useJobs'
import { useUserLocation } from './hooks/useUserLocation'
import type { TalentProfile } from './types'

export const DiscoverMapScreen = () => {
  const { width } = useWindowDimensions()
  const isSmallScreen = width < 640
  const resultListRef = useRef<ResultListRef>(null)
  const mapRef = useRef<MapContainerRef>(null)

  // Location functionality
  const { location } = useUserLocation()

  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [summaryProfileId, setSummaryProfileId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [showRail, setShowRail] = useState(true)
  const [showResultsSheet, setShowResultsSheet] = useState(false)
  const [showWorkers, setShowWorkers] = useState(true)
  const [showOrganizations, setShowOrganizations] = useState(true)
  const [showJobs, setShowJobs] = useState(true)

  const { data: talentProfiles = [], isLoading } = useTalentProfiles()
  const { data: organizations = [], isLoading: isLoadingOrgs } = useOrganizations()
  const { data: jobs = [], isLoading: isLoadingJobs } = useJobs()

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

  // Convert profiles, organizations, and jobs to map pins with selected state
  const mapPins: MapPinType[] = useMemo(() => {
    const workerPins = showWorkers
      ? talentProfiles.map((profile) => ({
          id: profile.id,
          coordinate: profile.coordinates,
          title: profile.name,
          subtitle: profile.title,
          metric: `e ${profile.score}`,
          score: profile.score,
          hourlyRate: profile.hourlyRate,
          badges: profile.badges,
          availability: 'available' as const,
          organization: 'Individual' as const,
          selected: profile.id === summaryProfileId || profile.id === selectedProfileId,
        }))
      : []

    const orgPins = showOrganizations
      ? organizations.map((org) => ({
          id: org.id,
          coordinate: org.coordinates,
          title: org.name,
          subtitle: org.industry || 'Organization',
          organization: 'Organization' as const,
          selected: org.id === summaryProfileId || org.id === selectedProfileId,
        }))
      : []

    const jobPins = showJobs
      ? jobs.map((job) => ({
          id: job.id,
          coordinate: job.coordinates,
          title: job.title,
          subtitle: job.organization_name || 'Job Opening',
          organization: 'Job' as const,
          color: '#FFD700', // Yellow for jobs
          selected: job.id === summaryProfileId || job.id === selectedProfileId,
        }))
      : []

    return [...workerPins, ...orgPins, ...jobPins]
  }, [
    talentProfiles,
    organizations,
    jobs,
    summaryProfileId,
    selectedProfileId,
    showWorkers,
    showOrganizations,
    showJobs,
  ])

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
    [isSmallScreen, showRail]
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
        railVisible={!isSmallScreen && showRail}
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
            resultsCount={talentProfiles.length + organizations.length + jobs.length}
            onSearchPress={() => {
              if (!showSearchInput) {
                setSummaryProfileId(null)
              }
              setShowSearchInput(!showSearchInput)
            }}
            onFilterPress={() => {
              if (!filtersOpen) {
                setSummaryProfileId(null)
              }
              setFiltersOpen(!filtersOpen)
            }}
            onResetPress={handleReset}
            railVisible={false}
            searchActive={showSearchInput}
            filterActive={filtersOpen}
          />
        </>
      ) : (
        <>
          {/* Results Rail */}
          <ResultsRail
            isVisible={showRail}
            profiles={showWorkers ? talentProfiles : []}
            organizations={showOrganizations ? organizations : []}
            jobs={showJobs ? jobs : []}
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
            resultsCount={talentProfiles.length + organizations.length + jobs.length}
            onSearchPress={() => {
              if (!showSearchInput) {
                setSummaryProfileId(null)
              }
              setShowSearchInput(!showSearchInput)
            }}
            onFilterPress={() => {
              if (!filtersOpen) {
                setSummaryProfileId(null)
              }
              setFiltersOpen(!filtersOpen)
            }}
            onResetPress={handleReset}
            railVisible={showRail}
            searchActive={showSearchInput}
            filterActive={filtersOpen}
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
              profiles={showWorkers ? talentProfiles : []}
              organizations={showOrganizations ? organizations : []}
              jobs={showJobs ? jobs : []}
              selectedId={selectedProfileId}
              onSelect={(id) => {
                setSelectedProfileId(id)
              }}
              isLoading={isLoading || isLoadingOrgs || isLoadingJobs}
              resultListRef={resultListRef}
            />
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* Filter Popup */}
      <FilterPopup
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        railVisible={!isSmallScreen && showRail}
        showWorkers={showWorkers}
        showOrganizations={showOrganizations}
        showJobs={showJobs}
        onShowWorkersChange={setShowWorkers}
        onShowOrganizationsChange={setShowOrganizations}
        onShowJobsChange={setShowJobs}
      />
    </YStack>
  )
}

export default DiscoverMapScreen
