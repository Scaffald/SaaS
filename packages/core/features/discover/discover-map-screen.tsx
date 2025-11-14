import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { Sheet, YStack, XStack, Tabs, Text, Button, useMedia, ScrollView } from 'tamagui'
import {
  MapContainer,
  type MapContainerRef,
  type MapPinType,
  type ViewportBounds,
  AddressAutocomplete,
  type AddressResult,
  ToggleSwitch,
} from '@app/ui'

import { MapFilterBar } from './components/MapFilterBar'
import { ResultsRail } from './components/ResultsRail'
import { WorkerPreviewModal } from './components/WorkerPreviewModal'
import { JobPreviewModal } from './components/JobPreviewModal'
import { OrganizationPreviewModal } from './components/OrganizationPreviewModal'
import { UserProfilePanel } from './components/UserProfilePanel'
import { ProfileHoverCard } from './components/ProfileHoverCard'
import { Platform } from 'react-native'
import { ResultList, type ResultListRef } from './components/ResultList'
import { defaultCenter } from './data/mockProfiles'
import { useTalentProfiles } from './hooks/useTalentProfiles'
import { useOrganizations } from './hooks/useOrganizations'
import { useJobs } from './hooks/useJobs'
import { useUserLocation } from './hooks/useUserLocation'
import { useMapState } from './providers/MapStateProvider'
import { useMapPinState, type ClusterInfo } from './hooks/useMapPinState'
import {
  List as ListIcon,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
  RotateCcw,
  X,
} from '@tamagui/lucide-icons'

export const DiscoverMapScreen = () => {
  // Use Tamagui media hook to check breakpoint
  // $sm = maxWidth: 800px
  // On mobile (≤800px): sm is true
  // On desktop (>800px): sm is false
  const media = useMedia()
  const isNativeMobile = Platform.OS !== 'web'
  const isSmallScreen = media.sm || isNativeMobile // ensure native mobile always treated as small
  const resultListRef = useRef<ResultListRef>(null)
  const mapRef = useRef<MapContainerRef>(null)

  // Location functionality
  const { location } = useUserLocation()

  // Map state from context (persisted)
  const { state, updateSearchLocation, updateFilters, updateResultsRailVisible, clearState } =
    useMapState()

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Modal states
  const [workerModalOpen, setWorkerModalOpen] = useState(false)
  const [workerModalUserId, setWorkerModalUserId] = useState<string | null>(null)
  const [jobModalOpen, setJobModalOpen] = useState(false)
  const [jobModalId, setJobModalId] = useState<string | null>(null)
  const [orgModalOpen, setOrgModalOpen] = useState(false)
  const [orgModalId, setOrgModalId] = useState<string | null>(null)
  const [mobileViewMode, setMobileViewMode] = useState<'map' | 'list'>('map')
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false)
  const [userPanelOpen, setUserPanelOpen] = useState(false)
  const [userPanelUserId, setUserPanelUserId] = useState<string | null>(null)
  const [mobileSearchQuery, setMobileSearchQuery] = useState('')

  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN

  // Hover state management
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null)
  const [hoveredPinType, setHoveredPinType] = useState<'worker' | 'organization' | null>(null)
  const [hoverCardVisible, setHoverCardVisible] = useState(false)
  const [hoverCardPosition, setHoverCardPosition] = useState<{ x: number; y: number } | undefined>(
    undefined
  )
  const [isHoverCardPinned, setIsHoverCardPinned] = useState(false)
  const [isHoverCardLocked, setIsHoverCardLocked] = useState(false)
  const hoverDismissPendingRef = useRef(false)

  // Pin state management for transitions and clustering
  const [clusters, setClusters] = useState<ClusterInfo[]>([])
  const { pinStates, processPins, setPinCluster } = useMapPinState({
    transitionDuration: 300,
  })

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
          pinType: 'worker' as const,
          avatarUrl: profile.avatarUrl || null,
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
          pinType: 'organization' as const,
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
          selected: job.id === selectedProfileId,
          pinType: 'job' as const,
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

  const isPinVisible = useCallback(
    (id: string) => {
      const pinState = pinStates.get(id)
      return (
        !pinState ||
        (pinState.visibility !== 'hidden' && pinState.visibility !== 'transitioning-out')
      )
    },
    [pinStates]
  )

  const visibleProfiles = showWorkers
    ? talentProfiles.filter((profile) => isPinVisible(profile.id))
    : []
  const visibleOrganizations = showOrganizations
    ? organizations.filter((org) => isPinVisible(org.id))
    : []
  const visibleJobs = showJobs ? jobs.filter((job) => isPinVisible(job.id)) : []

  // Process pins with cluster information for state management
  const processPinsRef = useRef(processPins)
  useEffect(() => {
    processPinsRef.current = processPins
  }, [processPins])

  useEffect(() => {
    if (mapPins.length > 0 || clusters.length > 0) {
      processPinsRef.current(mapPins, clusters)
    }
  }, [mapPins, clusters])

  // Update pin cluster membership when clusters change
  useEffect(() => {
    // Create a map of pin IDs to cluster IDs
    const pinToClusterMap = new Map<string, number>()
    for (const cluster of clusters) {
      for (const pinId of cluster.memberPinIds ?? []) {
        pinToClusterMap.set(pinId, cluster.clusterId)
      }
    }

    // Update pin states based on cluster membership
    for (const pin of mapPins) {
      const clusterId = pinToClusterMap.get(pin.id)
      setPinCluster(pin.id, clusterId)
    }
  }, [clusters, mapPins, setPinCluster])

  // Handle cluster changes from MapContainer
  const handleClustersChange = useCallback((newClusters: ClusterInfo[]) => {
    setClusters(newClusters)
  }, [])

  const clearHoverState = useCallback(() => {
    hoverDismissPendingRef.current = false
    setIsHoverCardPinned(false)
    setIsHoverCardLocked(false)
    setHoveredPinId(null)
    setHoveredPinType(null)
    setHoverCardVisible(false)
    setHoverCardPosition(undefined)
  }, [])

  const getPinType = useCallback(
    (pinId: string): 'worker' | 'organization' | null => {
      if (talentProfiles.some((p) => p.id === pinId)) {
        return 'worker'
      }
      if (organizations.some((o) => o.id === pinId)) {
        return 'organization'
      }
      return null
    },
    [talentProfiles, organizations]
  )

  const updateHoverCardPosition = useCallback((pinId: string) => {
    const coords = mapRef.current?.getPinScreenCoordinates?.(pinId)
    if (coords) {
      setHoverCardPosition(coords)
    }
  }, [])

  const showHoverCardForPin = useCallback(
    (pinId: string, pinType: 'worker' | 'organization') => {
      hoverDismissPendingRef.current = false
      setHoveredPinId(pinId)
      setHoveredPinType(pinType)
      setHoverCardVisible(true)
      updateHoverCardPosition(pinId)
    },
    [updateHoverCardPosition]
  )

  // Handle pin hover - show preview card
  const handlePinHover = useCallback(
    (pinId: string | null) => {
      if (pinId === null) {
        if (isHoverCardPinned || isHoverCardLocked) {
          hoverDismissPendingRef.current = true
          return
        }
        clearHoverState()
        return
      }

      if (isHoverCardLocked) {
        return
      }

      hoverDismissPendingRef.current = false

      const pinType = getPinType(pinId)

      if (pinType) {
        setIsHoverCardPinned(false)
        showHoverCardForPin(pinId, pinType)
      } else {
        clearHoverState()
      }
    },
    [clearHoverState, getPinType, isHoverCardLocked, isHoverCardPinned, showHoverCardForPin]
  )

  const handleHoverCardEnter = useCallback(() => {
    hoverDismissPendingRef.current = false
    setIsHoverCardPinned(true)
  }, [])

  const handleHoverCardLeave = useCallback(() => {
    setIsHoverCardPinned(false)
    if (hoverDismissPendingRef.current && !isHoverCardLocked) {
      hoverDismissPendingRef.current = false
      clearHoverState()
    }
  }, [clearHoverState, isHoverCardLocked])

  // Handle pin click - focus corresponding card
  const handleMarkerPress = useCallback(
    (pinId: string | null) => {
      if (!pinId) {
        setSelectedProfileId(null)
        setUserPanelOpen(false)
        setUserPanelUserId(null)
        setWorkerModalOpen(false)
        setJobModalOpen(false)
        setOrgModalOpen(false)
        clearHoverState()
        return
      }

      const pinType = getPinType(pinId)
      if (pinType) {
        setIsHoverCardLocked(true)
        showHoverCardForPin(pinId, pinType)
      } else {
        setIsHoverCardLocked(false)
        clearHoverState()
      }

      setSelectedProfileId(pinId)
      setUserPanelOpen(false)
      setUserPanelUserId(null)
      setWorkerModalOpen(false)
      setWorkerModalUserId(null)
      setJobModalOpen(false)
      setJobModalId(null)
      setOrgModalOpen(false)
      setOrgModalId(null)

      if (isSmallScreen) {
        setMobileViewMode('list')
      } else {
        updateResultsRailVisible(true)
        setTimeout(() => {
          resultListRef.current?.scrollToCard(pinId)
        }, 200)
      }
    },
    [
      clearHoverState,
      getPinType,
      isSmallScreen,
      showHoverCardForPin,
      updateResultsRailVisible,
      setMobileViewMode,
    ]
  )

  const handleReset = useCallback(() => {
    setSelectedProfileId(null)
    // Close any open modals and panels
    setWorkerModalOpen(false)
    setJobModalOpen(false)
    setOrgModalOpen(false)
    setUserPanelOpen(false)
    setUserPanelUserId(null)
    // Clear hover state
    clearHoverState()
    // Clear persisted state
    clearState()
  }, [clearHoverState, clearState])

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
  const handleViewportChange = useCallback((bounds: ViewportBounds, _zoom: number) => {
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
      if (
        centerLatDiff > 0.2 ||
        centerLngDiff > 0.2 ||
        latRangeDiff > 0.15 ||
        lngRangeDiff > 0.15
      ) {
        setMapReady(true)
        return bounds
      }
      return prevBounds // Keep previous bounds to avoid unnecessary refetch
    })
  }, [])

  const handleMapReady = useCallback(({ bounds }: { bounds: ViewportBounds; zoom: number }) => {
    setViewportBounds(bounds)
    setMapReady(true)
  }, [])

  const resultsCount = talentProfiles.length + organizations.length + jobs.length

  useEffect(() => {
    if (!isSmallScreen) {
      setMobileViewMode('map')
      setFiltersSheetOpen(false)
    }
  }, [isSmallScreen])

  const handleMobileViewChange = useCallback((value: string) => {
    setMobileViewMode(value === 'list' ? 'list' : 'map')
  }, [])

  const mobileListActive = isSmallScreen && mobileViewMode === 'list'

  const handleMobileResultSelect = useCallback((id: string) => {
    setSelectedProfileId(id)
    setMobileViewMode('map')
    if (mapRef.current?.centerOnPin) {
      mapRef.current.centerOnPin(id)
    }
  }, [])

  return (
    <YStack flex={1} height="100vh" overflow="hidden" position="relative">
      {/* Filter Bar / Mobile Header */}
      {isSmallScreen ? (
        <MobileSearchHeader
          searchQuery={mobileSearchQuery}
          onSearchQueryChange={setMobileSearchQuery}
          mapboxToken={mapboxToken}
          onLocationSelect={handleLocationSelect}
          onFiltersPress={() => setFiltersSheetOpen(true)}
        />
      ) : (
        <MapFilterBar
          onLocationSelect={handleLocationSelect}
          showWorkers={showWorkers}
          showOrganizations={showOrganizations}
          showJobs={showJobs}
          onShowWorkersChange={(value) => updateFilters({ showWorkers: value })}
          onShowOrganizationsChange={(value) => updateFilters({ showOrganizations: value })}
          onShowJobsChange={(value) => updateFilters({ showJobs: value })}
          resultsCount={resultsCount}
          onResultsPress={() => {
            updateResultsRailVisible(!showRail)
          }}
          onReset={handleReset}
          railVisible={!isSmallScreen && showRail}
        />
      )}

      {/* Map and Results Container */}
      <XStack flex={1} overflow="hidden" position="relative">
        {isSmallScreen ? (
          mobileListActive ? (
            <YStack flex={1} bg="$background" px="$3" py="$3">
              <ResultList
                ref={resultListRef}
                profiles={visibleProfiles}
                organizations={visibleOrganizations}
                jobs={visibleJobs}
                selectedId={selectedProfileId}
                onSelect={handleMobileResultSelect}
                isLoading={isLoading || isLoadingOrgs || isLoadingJobs}
              />
            </YStack>
          ) : (
            <MapContainer
              ref={mapRef}
              pins={mapPins}
              center={mapCenter}
              zoom={7}
              radius={state.lastSearchLocation ? 50 : undefined}
              centerLocation={state.lastSearchLocation?.coordinates}
              onPinPress={handleMarkerPress}
              onPinHover={handlePinHover}
              onViewportChange={handleViewportChange}
              onMapReady={handleMapReady}
              onClustersChange={handleClustersChange}
              pinStates={pinStates}
              style={{ flex: 1 }}
            />
          )
        ) : (
          <>
            <MapContainer
              ref={mapRef}
              pins={mapPins}
              center={mapCenter}
              zoom={7}
              radius={state.lastSearchLocation ? 50 : undefined}
              centerLocation={state.lastSearchLocation?.coordinates}
              onPinPress={handleMarkerPress}
              onPinHover={handlePinHover}
              onViewportChange={handleViewportChange}
              onMapReady={handleMapReady}
              onClustersChange={handleClustersChange}
              pinStates={pinStates}
              style={{ flex: 1 }}
            />
            <ResultsRail
              isVisible={showRail}
              profiles={visibleProfiles}
              organizations={visibleOrganizations}
              jobs={visibleJobs}
              selectedId={selectedProfileId}
              onSelect={(id) => {
                setSelectedProfileId(id)
                if (mapRef.current?.centerOnPin) {
                  mapRef.current.centerOnPin(id)
                }
              }}
              isLoading={isLoading}
              resultListRef={resultListRef}
            />
          </>
        )}
      </XStack>

      {/* Hover Card - Web only */}
      {Platform.OS === 'web' && (
        <ProfileHoverCard
          pinId={hoveredPinId}
          pinType={hoveredPinType}
          visible={hoverCardVisible}
          position={hoverCardPosition}
          onHoverCardEnter={handleHoverCardEnter}
          onHoverCardLeave={handleHoverCardLeave}
        />
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

      {/* Mobile Search & Filters Sheet */}
      {isSmallScreen && (
        <Sheet
          modal
          open={filtersSheetOpen}
          onOpenChange={setFiltersSheetOpen}
          snapPoints={[85, 60]}
          dismissOnSnapToBottom
        >
          <Sheet.Overlay />
          <Sheet.Handle />
          <Sheet.Frame>
            <MobileFiltersContent
              showWorkers={showWorkers}
              showOrganizations={showOrganizations}
              showJobs={showJobs}
              onShowWorkersChange={(value) => updateFilters({ showWorkers: value })}
              onShowOrganizationsChange={(value) => updateFilters({ showOrganizations: value })}
              onShowJobsChange={(value) => updateFilters({ showJobs: value })}
              onClose={() => setFiltersSheetOpen(false)}
              onReset={handleReset}
            />
          </Sheet.Frame>
        </Sheet>
      )}

      {/* User Profile Panel (map overlay) */}
      <UserProfilePanel
        userId={userPanelUserId}
        open={userPanelOpen}
        onOpenChange={setUserPanelOpen}
        position={
          isSmallScreen ? { top: 80, left: 16, right: 16 } : { top: 80, right: showRail ? 460 : 16 }
        }
      />

      {/* Mobile bottom map/list toggle */}
      {isSmallScreen && (
        <MobileViewToggleBar activeView={mobileViewMode} onViewChange={handleMobileViewChange} />
      )}
    </YStack>
  )
}

type MobileSearchHeaderProps = {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  mapboxToken?: string
  onLocationSelect: (location: { longitude: number; latitude: number; label: string }) => void
  onFiltersPress: () => void
}

const validateMapboxToken = (token: string | undefined): { valid: boolean; error?: string } => {
  if (!token) {
    return { valid: false, error: 'Map search unavailable. Please configure a Mapbox token.' }
  }
  if (!token.startsWith('pk.')) {
    return { valid: false, error: 'Invalid Mapbox token format. Please verify configuration.' }
  }
  return { valid: true }
}

const MobileSearchHeader = ({
  searchQuery,
  onSearchQueryChange,
  mapboxToken,
  onLocationSelect,
  onFiltersPress,
}: MobileSearchHeaderProps) => {
  const tokenValidation = useMemo(() => validateMapboxToken(mapboxToken), [mapboxToken])

  const handleAddressSelect = useCallback(
    (address: AddressResult) => {
      onLocationSelect({
        longitude: address.coordinates.lng,
        latitude: address.coordinates.lat,
        label: address.formattedAddress,
      })
      onSearchQueryChange('')
    },
    [onLocationSelect, onSearchQueryChange]
  )

  return (
    <XStack
      width="100%"
      px="$4"
      py="$3"
      gap="$3"
      bg="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      items="center"
    >
      {tokenValidation.valid ? (
        <AddressAutocomplete
          value={searchQuery}
          onChange={onSearchQueryChange}
          onAddressSelect={handleAddressSelect}
          placeholder="Search city, county, or region..."
          provider="mapbox"
          apiKey={mapboxToken}
          zoomLevel="city"
          searchOptions={{
            types: ['place', 'region', 'district', 'locality'],
          }}
          minLength={2}
          maxResults={5}
          debounceMs={300}
          containerProps={{
            flex: 1,
            w: '100%',
            bg: '$background',
            rounded: '$5',
            height: 25,
            justifyContent: 'center',
          }}
        />
      ) : (
        <YStack
          flex={1}
          bg="$background"
          p="$3"
          rounded="$4"
          borderWidth={1}
          borderColor="$red8"
          gap="$2"
        >
          <Text fontSize="$4" fontWeight="600" color="$red10">
            Map Search Unavailable
          </Text>
          <Text fontSize="$2" color="$color10">
            {tokenValidation.error}
          </Text>
        </YStack>
      )}

      <Button
        size="$4"
        circular
        variant="outlined"
        icon={SlidersHorizontal}
        aria-label="Open filters"
        onPress={onFiltersPress}
      />
    </XStack>
  )
}

type MobileViewToggleBarProps = {
  activeView: 'map' | 'list'
  onViewChange: (value: string) => void
}

const MobileViewToggleBar = ({ activeView, onViewChange }: MobileViewToggleBarProps) => {
  return (
    <XStack
      position="absolute"
      b="$3"
      l="$3"
      r="$3"
      bg="$color2"
      rounded="$6"
      p="$1"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: -2 }}
      shadowOpacity={0.15}
      shadowRadius={12}
      style={{ zIndex: 60 }}
    >
      <Tabs value={activeView} onValueChange={onViewChange} activationMode="manual" flex={1}>
        <Tabs.List flex={1} gap="$2" bg="transparent">
          <Tabs.Tab
            value="map"
            flex={1}
            bg={activeView === 'map' ? '$background' : 'transparent'}
            rounded="$5"
            px="$4"
            py="$3"
          >
            <XStack items="center" justify="center" gap="$2">
              <MapIcon size={16} />
              <Text fontSize="$4" fontWeight="600">
                Map
              </Text>
            </XStack>
          </Tabs.Tab>
          <Tabs.Tab
            value="list"
            flex={1}
            bg={activeView === 'list' ? '$background' : 'transparent'}
            rounded="$5"
            px="$4"
            py="$3"
          >
            <XStack items="center" justify="center" gap="$2">
              <ListIcon size={16} />
              <Text fontSize="$4" fontWeight="600">
                List
              </Text>
            </XStack>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>
    </XStack>
  )
}

type MobileFiltersContentProps = {
  showWorkers: boolean
  showOrganizations: boolean
  showJobs: boolean
  onShowWorkersChange: (value: boolean) => void
  onShowOrganizationsChange: (value: boolean) => void
  onShowJobsChange: (value: boolean) => void
  onClose: () => void
  onReset: () => void
}

const MobileFiltersContent = ({
  showWorkers,
  showOrganizations,
  showJobs,
  onShowWorkersChange,
  onShowOrganizationsChange,
  onShowJobsChange,
  onClose,
  onReset,
}: MobileFiltersContentProps) => {
  return (
    <YStack flex={1} p="$4" gap="$4">
      <XStack justify="space-between" items="center">
        <Text fontSize="$6" fontWeight="700">
          Filters
        </Text>
        <Button
          size="$3"
          circular
          variant="outlined"
          icon={X}
          aria-label="Close filters"
          onPress={onClose}
        />
      </XStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack gap="$4" pb="$6">
          <FilterToggle
            label="Workers"
            description="Show worker profiles on the map"
            value={showWorkers}
            onValueChange={onShowWorkersChange}
          />
          <FilterToggle
            label="Employers"
            description="Show employer organizations on the map"
            value={showOrganizations}
            onValueChange={onShowOrganizationsChange}
          />
          <FilterToggle
            label="Jobs"
            description="Show job openings on the map"
            value={showJobs}
            onValueChange={onShowJobsChange}
          />
        </YStack>
      </ScrollView>

      <Button
        size="$4"
        variant="outlined"
        icon={RotateCcw}
        scaleIcon={1.2}
        onPress={onReset}
        aria-label="Reset filters"
      >
        Reset Filters
      </Button>
    </YStack>
  )
}

type FilterToggleProps = {
  label: string
  description: string
  value: boolean
  onValueChange: (value: boolean) => void
}

const FilterToggle = ({ label, description, value, onValueChange }: FilterToggleProps) => (
  <YStack gap="$2" bg="$color2" p="$3" rounded="$4" borderWidth={1} borderColor="$borderColor">
    <XStack justify="space-between" items="center" gap="$2">
      <Text fontSize="$4" fontWeight="600">
        {label}
      </Text>
      <ToggleSwitch checked={value} onCheckedChange={onValueChange} aria-label={label} />
    </XStack>
    <Text fontSize="$2" color="$color10">
      {description}
    </Text>
  </YStack>
)

export default DiscoverMapScreen
