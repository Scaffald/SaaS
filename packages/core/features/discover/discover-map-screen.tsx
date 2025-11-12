import { useMemo, useState, useRef, useCallback } from 'react'
import { Sheet, YStack } from 'tamagui'
import { MapContainer, type MapContainerRef, type MapPinType, type ViewportBounds } from '@app/ui'
import { useWindowDimensions } from 'react-native'

import { FilterBar } from './components/FilterBar'
import { FilterPopup } from './components/FilterPopup'
import { MapSearchInput } from './components/MapSearchInput'
import { ResultsRail } from './components/ResultsRail'
import { WorkerPreviewModal } from './components/WorkerPreviewModal'
import { JobPreviewModal } from './components/JobPreviewModal'
import { OrganizationPreviewModal } from './components/OrganizationPreviewModal'
import { UserProfilePanel } from './components/UserProfilePanel'
import type { ResultListRef } from './components/ResultList'
import { defaultCenter } from './data/mockProfiles'
import { useTalentProfiles } from './hooks/useTalentProfiles'
import { useOrganizations } from './hooks/useOrganizations'
import { useJobs } from './hooks/useJobs'
import { useUserLocation } from './hooks/useUserLocation'
import { useMapState } from './providers/MapStateProvider'

export const DiscoverMapScreen = () => {
  const { width } = useWindowDimensions()
  const isSmallScreen = width < 640
  const resultListRef = useRef<ResultListRef>(null)
  const mapRef = useRef<MapContainerRef>(null)

  // Location functionality
  const { location } = useUserLocation()

  // Map state from context (persisted)
  const {
    state,
    updateSearchLocation,
    updateFilters,
    updateResultsRailVisible,
    clearState,
  } = useMapState()

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Modal states
  const [workerModalOpen, setWorkerModalOpen] = useState(false)
  const [workerModalUserId, setWorkerModalUserId] = useState<string | null>(null)
  const [jobModalOpen, setJobModalOpen] = useState(false)
  const [jobModalId, setJobModalId] = useState<string | null>(null)
  const [orgModalOpen, setOrgModalOpen] = useState(false)
  const [orgModalId, setOrgModalId] = useState<string | null>(null)
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [showResultsSheet, setShowResultsSheet] = useState(false)
  const [userPanelOpen, setUserPanelOpen] = useState(false)
  const [userPanelUserId, setUserPanelUserId] = useState<string | null>(null)

  // Use persisted state from context
  const showRail = state.resultsRailVisible
  const showWorkers = state.activeFilters.showWorkers
  const showOrganizations = state.activeFilters.showOrganizations
  const showJobs = state.activeFilters.showJobs

  // Fetch data with viewport bounds filtering
  // Only apply bounds filtering after initial load (when viewportBounds is set)
  // This prevents refetching on every pan and ensures initial data loads
  const queryEnabled = mapReady && viewportBounds !== null

  const { data: talentProfiles = [], isLoading } = useTalentProfiles({
    bounds: viewportBounds,
    limit: 500,
    enabled: queryEnabled && showWorkers,
  })
  const { data: organizations = [], isLoading: isLoadingOrgs } = useOrganizations({
    bounds: viewportBounds,
    limit: 200,
    enabled: queryEnabled && showOrganizations,
  })
  const { data: jobs = [], isLoading: isLoadingJobs } = useJobs({
    bounds: viewportBounds,
    limit: 500,
    enabled: queryEnabled && showJobs,
  })

  // Determine map center based on search location, user location, or default
  const mapCenter: [number, number] = useMemo(() => {
    if (state.lastSearchLocation?.coordinates) {
      return state.lastSearchLocation.coordinates
    }
    if (location) {
      return [location.longitude, location.latitude]
    }
    return defaultCenter
  }, [state.lastSearchLocation, location])

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
          selected: profile.id === selectedProfileId,
          type: 'worker' as const,
        }))
      : []

    const orgPins = showOrganizations
      ? organizations.map((org) => ({
          id: org.id,
          coordinate: org.coordinates,
          title: org.name,
          subtitle: org.industry || 'Organization',
          organization: 'Organization' as const,
          selected: org.id === selectedProfileId,
          type: 'organization' as const,
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
          selected: job.id === selectedProfileId,
          type: 'job' as const,
        }))
      : []

    return [...workerPins, ...orgPins, ...jobPins]
  }, [
    talentProfiles,
    organizations,
    jobs,
    selectedProfileId,
    showWorkers,
    showOrganizations,
    showJobs,
  ])

  // Handle pin click - open appropriate modal
  const handleMarkerPress = useCallback(
    (pinId: string | null) => {
      // Hide search input when user interacts with map
      setShowSearchInput(false)

      if (pinId === null) {
        // Clicking empty space - clear selection
        setSelectedProfileId(null)
        return
      }

      // Determine entity type by checking which array contains the ID
      const isWorker = talentProfiles.some((p) => p.id === pinId)
      const isJob = jobs.some((j) => j.id === pinId)
      const isOrg = organizations.some((o) => o.id === pinId)

      // Open appropriate modal or panel
      if (isWorker) {
        // For workers, show UserProfilePanel on map (lightweight preview)
        setUserPanelUserId(pinId)
        setUserPanelOpen(true)
        // Also open full modal for detailed view (optional - can be removed if only panel is desired)
        setWorkerModalUserId(pinId)
        setWorkerModalOpen(true)
      } else if (isJob) {
        setJobModalId(pinId)
        setJobModalOpen(true)
      } else if (isOrg) {
        setOrgModalId(pinId)
        setOrgModalOpen(true)
      }

      // Also select in rail for desktop view
      if (!isSmallScreen) {
        setSelectedProfileId(pinId)
        updateResultsRailVisible(true)
        setTimeout(() => {
          if (resultListRef.current?.scrollToCard) {
            resultListRef.current.scrollToCard(pinId)
          }
        }, 200)
      }
    },
    [isSmallScreen, talentProfiles, jobs, organizations, updateResultsRailVisible]
  )

  const handleReset = useCallback(() => {
    setSelectedProfileId(null)
    setShowSearchInput(false)
    // Close any open modals and panels
    setWorkerModalOpen(false)
    setJobModalOpen(false)
    setOrgModalOpen(false)
    setUserPanelOpen(false)
    setUserPanelUserId(null)
    // Clear persisted state
    clearState()
  }, [clearState])

  const handleLocationSelect = useCallback(
    (location: { longitude: number; latitude: number; label: string }) => {
      // Update persisted search location
      updateSearchLocation({
        coordinates: [location.longitude, location.latitude],
        label: location.label,
        zoomLevel: 12,
        timestamp: Date.now(),
      })
      
      // Calculate viewport bounds immediately based on target location and zoom level
      // This triggers data fetching before the map animation completes
      // At zoom level 12, approximate bounds are ±0.1 degrees (roughly 10km radius)
      const boundsDelta = 0.1
      const immediateBounds: ViewportBounds = {
        north: location.latitude + boundsDelta,
        south: location.latitude - boundsDelta,
        east: location.longitude + boundsDelta,
        west: location.longitude - boundsDelta,
      }
      setViewportBounds(immediateBounds)
      setMapReady(true)
      
      // Center the map on the new location
      if (mapRef.current?.flyTo) {
        mapRef.current.flyTo([location.longitude, location.latitude], 12)
      }
    },
    [updateSearchLocation]
  )

  // Handle viewport changes from map (debounced by 500ms in MapContainer)
  // Only update viewport bounds for data fetching, not persisted state (to avoid excessive updates)
  const handleViewportChange = useCallback(
    (bounds: ViewportBounds, _zoom: number) => {
      // Only update bounds if they've changed significantly (avoid unnecessary refetches)
      // Check both center position and bounds size to determine if viewport changed meaningfully
      setViewportBounds((prevBounds) => {
        if (!prevBounds) {
          setMapReady(true)
          return bounds // First bounds update
        }
        
        // Calculate center points
        const prevCenterLat = (prevBounds.north + prevBounds.south) / 2
        const prevCenterLng = (prevBounds.east + prevBounds.west) / 2
        const centerLat = (bounds.north + bounds.south) / 2
        const centerLng = (bounds.east + bounds.west) / 2
        
        // Calculate bounds size (width and height)
        const prevLatRange = Math.abs(prevBounds.north - prevBounds.south)
        const prevLngRange = Math.abs(prevBounds.east - prevBounds.west)
        const latRange = Math.abs(bounds.north - bounds.south)
        const lngRange = Math.abs(bounds.east - bounds.west)
        
        // Check if center moved significantly (more than 20% of viewport size)
        const centerLatDiff = Math.abs(centerLat - prevCenterLat) / prevLatRange
        const centerLngDiff = Math.abs(centerLng - prevCenterLng) / prevLngRange
        
        // Check if bounds size changed significantly (more than 15% change in zoom)
        const latRangeDiff = Math.abs(latRange - prevLatRange) / prevLatRange
        const lngRangeDiff = Math.abs(lngRange - prevLngRange) / prevLngRange
        
        // Only update if center moved significantly OR bounds size changed significantly
        // This prevents refetching on small pans while still updating on zoom changes
        if (centerLatDiff > 0.2 || centerLngDiff > 0.2 || latRangeDiff > 0.15 || lngRangeDiff > 0.15) {
          setMapReady(true)
          return bounds
        }
        return prevBounds // Keep previous bounds to avoid unnecessary refetch
      })
    },
    []
  )

  const handleMapReady = useCallback(({ bounds }: { bounds: ViewportBounds; zoom: number }) => {
    setViewportBounds(bounds)
    setMapReady(true)
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
        onViewportChange={handleViewportChange}
        onMapReady={handleMapReady}
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
          {/* Filter Bar */}
          <FilterBar
            onResultsPress={() => setShowResultsSheet(true)}
            resultsCount={talentProfiles.length + organizations.length + jobs.length}
            onSearchPress={() => {
              setShowSearchInput(!showSearchInput)
            }}
            onFilterPress={() => {
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
            onResultsPress={() => updateResultsRailVisible(!showRail)}
            resultsCount={talentProfiles.length + organizations.length + jobs.length}
            onSearchPress={() => {
              setShowSearchInput(!showSearchInput)
            }}
            onFilterPress={() => {
              setFiltersOpen(!filtersOpen)
            }}
            onResetPress={handleReset}
            railVisible={showRail}
            searchActive={showSearchInput}
            filterActive={filtersOpen}
          />
        </>
      )}

      {/* Modals - Rendered for both mobile and desktop */}
      <WorkerPreviewModal
        userId={workerModalUserId}
        open={workerModalOpen}
        onOpenChange={setWorkerModalOpen}
      />
      <JobPreviewModal jobId={jobModalId} open={jobModalOpen} onOpenChange={setJobModalOpen} />
      <OrganizationPreviewModal
        organizationId={orgModalId}
        open={orgModalOpen}
        onOpenChange={setOrgModalOpen}
      />

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
        onShowWorkersChange={(value) => updateFilters({ showWorkers: value })}
        onShowOrganizationsChange={(value) => updateFilters({ showOrganizations: value })}
        onShowJobsChange={(value) => updateFilters({ showJobs: value })}
      />

      {/* User Profile Panel (map overlay) */}
      <UserProfilePanel
        userId={userPanelUserId}
        open={userPanelOpen}
        onOpenChange={setUserPanelOpen}
        position={isSmallScreen ? { top: 16, left: 16, right: 16 } : { top: 16, right: showRail ? 460 : 16 }}
      />
    </YStack>
  )
}

export default DiscoverMapScreen
