import {
  AddressAutocomplete,
  type AddressResult,
  type MapContainerRef,
  Sheet,
  SheetContent,
  SheetHeader,
  Switch,
  type ViewportBounds,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { MapAdapter } from './components/map'
import { captureEvent } from '@scf/core/utils/analytics/client'
import {
  List as ListIcon,
  Map as MapIcon,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, View } from 'react-native'
import {
  Button,
  ScrollView,
  Tabs,
  Text,
  useThemeContext,
  useWindowDimensions,
  Row,
  Stack,
} from '@scaffald/ui'
import { JobPreviewModal } from './components/JobPreviewModal'
import { MapFilterBar } from './components/MapFilterBar'
import { OrganizationPreviewModal } from './components/OrganizationPreviewModal'
import { ProfileHoverCard } from './components/ProfileHoverCard'
import { ResultList, type ResultListRef } from './components/ResultList'
import { ResultsRail } from './components/ResultsRail'
import { UserProfilePanel } from './components/UserProfilePanel'
import { WorkerPreviewModal } from './components/WorkerPreviewModal'
import { defaultCenter } from './data/mockProfiles'
import { useJobs } from './hooks/useJobs'
import { type ClusterInfo, type MapPinType, useMapPinState } from './hooks/useMapPinState'
import { useOrganizations } from './hooks/useOrganizations'
import { useTalentProfiles } from './hooks/useTalentProfiles'
import { useUserLocation } from './hooks/useUserLocation'
import { createMapboxGeocodingProvider } from '../../utils/mapbox-geocoding-provider'
import { useMapState } from './providers/MapStateProvider'
import { isPinNearViewportEdge } from './utils/hoverCardPositioning'

type HoverCardTrigger = 'click'
const MAP_RECENTER_DELAY_MS = 360

export const DiscoverMapScreen = () => {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  // Use window dimensions for conditional rendering
  // Breakpoint: 800px (small/medium layout)
  // Native mobile is always treated as small screen
  const { width } = useWindowDimensions()
  const isNativeMobile = Platform.OS !== 'web'
  const isSmallScreen = width <= 800 || isNativeMobile // ensure native mobile always treated as small
  const resultListRef = useRef<ResultListRef>(null)
  const mapRef = useRef<MapContainerRef>(null)
  const layoutRef = useRef<View>(null)

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
  const [activePinId, setActivePinId] = useState<string | null>(null)
  const [activePinType, setActivePinType] = useState<'worker' | 'organization' | 'job' | null>(null)
  const [hoverCardVisible, setHoverCardVisible] = useState(false)
  const [hoverCardPosition, setHoverCardPosition] = useState<{ x: number; y: number } | undefined>(
    undefined
  )
  const recenterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const { data: talentProfilesData, isLoading } = useTalentProfiles({
    bounds: viewportBounds,
    limit: 500,
    enabled: queryEnabled && showWorkers,
  })
  const talentProfiles = useMemo(() => talentProfilesData || [], [talentProfilesData])

  const { data: organizationsData, isLoading: isLoadingOrgs } = useOrganizations({
    bounds: viewportBounds,
    limit: 200,
    enabled: queryEnabled && showOrganizations,
  })
  const organizations = useMemo(() => organizationsData || [], [organizationsData])

  const { data: jobsData, isLoading: isLoadingJobs } = useJobs({
    bounds: viewportBounds,
    limit: 500,
    enabled: queryEnabled && showJobs,
  })
  const jobs = useMemo(() => jobsData || [], [jobsData])

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
  const mapPins: Array<MapPinType> = useMemo(() => {
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
          hourlyRate: job.pay_range_min_cents
            ? Math.round(job.pay_range_min_cents / 100)
            : undefined,
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
    return () => {
      if (recenterTimeoutRef.current) {
        clearTimeout(recenterTimeoutRef.current)
      }
    }
  }, [])

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
    // Only update if cluster ID actually changed to prevent infinite loops
    for (const pin of mapPins) {
      const newClusterId = pinToClusterMap.get(pin.id)
      const currentState = pinStates.get(pin.id)
      const currentClusterId = currentState?.clusterId

      // Only call setPinCluster if the cluster ID actually changed
      if (newClusterId !== currentClusterId) {
        setPinCluster(pin.id, newClusterId)
      }
    }
  }, [clusters, mapPins, setPinCluster, pinStates])

  // Handle cluster changes from MapContainer
  const handleClustersChange = useCallback((clusters: unknown[]) => {
    setClusters(clusters as ClusterInfo[])
  }, [])

  const clearHoverState = useCallback(() => {
    if (recenterTimeoutRef.current) {
      clearTimeout(recenterTimeoutRef.current)
      recenterTimeoutRef.current = null
    }
    setActivePinId(null)
    setActivePinType(null)
    setHoverCardVisible(false)
    setHoverCardPosition(undefined)
  }, [])

  const getPinType = useCallback(
    (pinId: string): 'worker' | 'organization' | 'job' | null => {
      if (talentProfiles.some((p) => p.id === pinId)) {
        return 'worker'
      }
      if (organizations.some((o) => o.id === pinId)) {
        return 'organization'
      }
      if (jobs.some((j) => j.id === pinId)) {
        return 'job'
      }
      return null
    },
    [talentProfiles, organizations, jobs]
  )

  const updateHoverCardPosition = useCallback((pinId: string) => {
    const coords = mapRef.current?.getPinScreenCoordinates?.(pinId)
    if (!coords) {
      return
    }

    if (Platform.OS === 'web') {
      const mapRect = mapRef.current?.getContainerRect?.()
      const layoutNode = layoutRef.current
      const layoutRect =
        layoutNode && 'getBoundingClientRect' in layoutNode
          ? (layoutNode as unknown as HTMLElement).getBoundingClientRect()
          : null
      if (mapRect && layoutRect) {
        setHoverCardPosition({
          x: mapRect.left - layoutRect.left + coords.x,
          y: mapRect.top - layoutRect.top + coords.y,
        })
        return
      }
    }

    setHoverCardPosition(coords)
  }, [])

  const maybeCenterPinForHoverCard = useCallback(
    (pinId: string, { force }: { force?: boolean } = {}) => {
      const mapInstance = mapRef.current
      if (!mapInstance?.centerOnPin) {
        return { recentered: false as const }
      }

      const coords = mapInstance.getPinScreenCoordinates?.(pinId)
      const mapRect = mapInstance.getContainerRect?.()

      const basePadding = {
        horizontal: isSmallScreen ? 140 : 220,
        vertical: isSmallScreen ? 160 : 220,
      }
      const viewport = mapRect
        ? {
            width: mapRect.width,
            height: mapRect.height,
          }
        : null
      const nearEdge = isPinNearViewportEdge(coords ?? null, viewport, basePadding)

      if (force || nearEdge) {
        mapInstance.centerOnPin(pinId, { preserveZoom: true })
        return {
          recentered: true as const,
          reason: nearEdge ? ('edge' as const) : ('forced' as const),
        }
      }

      return { recentered: false as const }
    },
    [isSmallScreen]
  )

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return
    }
    if (!hoverCardVisible || !activePinId) {
      return
    }
    const handleResize = () => {
      updateHoverCardPosition(activePinId)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [hoverCardVisible, activePinId, updateHoverCardPosition])

  const showHoverCardForPin = useCallback(
    (
      pinId: string,
      pinType: 'worker' | 'organization' | 'job',
      options: { trigger: HoverCardTrigger; forceCenter?: boolean } = { trigger: 'click' }
    ) => {
      setActivePinId(pinId)
      setActivePinType(pinType)

      const result = maybeCenterPinForHoverCard(pinId, { force: options.forceCenter })
      const revealHoverCard = () => {
        updateHoverCardPosition(pinId)
        setHoverCardVisible(true)

        if (result.recentered && Platform.OS === 'web') {
          captureEvent('map_profile_hover_card_opened', {
            pin_type: pinType,
            recentered: true,
            trigger: options.trigger,
            viewport: isSmallScreen ? 'mobile' : 'desktop',
            reason: result.reason ?? 'edge',
          })
        }
      }

      if (result.recentered) {
        setHoverCardVisible(false)
        if (recenterTimeoutRef.current) {
          clearTimeout(recenterTimeoutRef.current)
        }
        recenterTimeoutRef.current = setTimeout(() => {
          revealHoverCard()
        }, MAP_RECENTER_DELAY_MS)
      } else {
        revealHoverCard()
      }
    },
    [isSmallScreen, maybeCenterPinForHoverCard, updateHoverCardPosition]
  )

  // Handle pin hover — show hover card without selecting
  const handlePinHover = useCallback(
    (pinId: string | null) => {
      if (Platform.OS !== 'web' || isSmallScreen) return
      if (!pinId) {
        clearHoverState()
        return
      }
      // Don't re-trigger if already showing this pin
      if (activePinId === pinId && hoverCardVisible) return
      const pinType = getPinType(pinId)
      if (pinType) {
        showHoverCardForPin(pinId, pinType, { trigger: 'click' })
      }
    },
    [activePinId, clearHoverState, getPinType, hoverCardVisible, isSmallScreen, showHoverCardForPin]
  )

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
        showHoverCardForPin(pinId, pinType, {
          trigger: 'click',
          forceCenter: isSmallScreen,
        })
      } else {
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
    [clearHoverState, getPinType, isSmallScreen, showHoverCardForPin, updateResultsRailVisible]
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
      // Map recenters via centerLocation prop from state.lastSearchLocation
    },
    [updateSearchLocation]
  )

  // Handle viewport changes from map (debounced by 500ms in MapContainer)
  // Only update viewport bounds for data fetching, not persisted state (to avoid excessive updates)
  const handleViewportChange = useCallback((bounds: ViewportBounds) => {
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
      if (hoverCardVisible && activePinId) {
        updateHoverCardPosition(activePinId)
      }
    },
    [activePinId, hoverCardVisible, updateHoverCardPosition]
  )

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
    <View ref={layoutRef} style={{ flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>
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
      <Row style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {isSmallScreen ? (
          mobileListActive ? (
            <Stack
              flex={1}
              style={{ backgroundColor: colors.bg[t].default }}
              paddingHorizontal={12}
              paddingVertical={12}
            >
              <ResultList
                ref={resultListRef}
                profiles={visibleProfiles}
                organizations={visibleOrganizations}
                jobs={visibleJobs}
                selectedId={selectedProfileId}
                onSelect={handleMobileResultSelect}
                isLoading={isLoading || isLoadingOrgs || isLoadingJobs}
              />
            </Stack>
          ) : (
            <MapAdapter
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
            <MapAdapter
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
              onClose={() => updateResultsRailVisible(false)}
              onCardHover={(id) => mapRef.current?.highlightPin?.(id)}
            />
          </>
        )}
      </Row>

      {/* Hover Card - Web only */}
      {Platform.OS === 'web' && (
        <ProfileHoverCard
          pinId={activePinId}
          pinType={activePinType}
          visible={hoverCardVisible}
          position={hoverCardPosition}
          jobData={activePinType === 'job' && activePinId ? jobs.find((j) => j.id === activePinId) ?? null : null}
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
          visible={filtersSheetOpen}
          onClose={() => setFiltersSheetOpen(false)}
          height="three-quarters"
        >
          <SheetHeader
            title="Filters"
            onClose={() => setFiltersSheetOpen(false)}
            showCloseButton
          />
          <SheetContent>
            <MobileFiltersContent
              showWorkers={showWorkers}
              showOrganizations={showOrganizations}
              showJobs={showJobs}
              onShowWorkersChange={(value) => updateFilters({ showWorkers: value })}
              onShowOrganizationsChange={(value) => updateFilters({ showOrganizations: value })}
              onShowJobsChange={(value) => updateFilters({ showJobs: value })}
              onReset={handleReset}
            />
          </SheetContent>
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
    </View>
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
  const { theme } = useThemeContext()
  const tMobile = theme === 'dark' ? 'dark' : 'light' as const
  const borderColor = theme === 'dark' ? 'rgba(80, 73, 64, 0.3)' : 'rgba(237, 221, 201, 0.5)'
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
    <Row
      style={{
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
        alignItems: 'center',
      }}
    >
      {tokenValidation.valid ? (
        <AddressAutocomplete
          value={searchQuery}
          onChange={onSearchQueryChange}
          onAddressSelect={handleAddressSelect}
          placeholder="Search city, county, or region..."
          provider={createMapboxGeocodingProvider(mapboxToken ?? '')}
          searchOptions={{
            types: ['place', 'region', 'district', 'locality'],
            zoomLevel: 'city',
          }}
          minLength={2}
          maxResults={5}
          debounceMs={300}
        />
      ) : (
        <Stack
          flex={1}
          style={{ backgroundColor: colors.bg[tMobile].default, borderColor: tMobile === 'dark' ? colors.error[300] : colors.error[600], flexShrink: 1 }}
          padding="sm"
          borderRadius={16}
          borderWidth={1}
          gap={8}
        >
          <Text style={{ color: tMobile === 'dark' ? colors.error[300] : colors.error[600] }}>Map Search Unavailable</Text>
          <Text style={{ color: colors.text[tMobile].secondary }}>{tokenValidation.error}</Text>
        </Stack>
      )}

      <Button
        size="md"
        variant="outline"
        iconStart={SlidersHorizontal}
        aria-label="Open filters"
        onPress={onFiltersPress}
        style={{ flexShrink: 0 }}
      />
    </Row>
  )
}

type MobileViewToggleBarProps = {
  activeView: 'map' | 'list'
  onViewChange: (value: string) => void
}

const MobileViewToggleBar = ({ activeView, onViewChange }: MobileViewToggleBarProps) => {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'
  const bgColor = isDark ? 'rgba(30, 28, 25, 0.92)' : 'rgba(242, 244, 247, 0.92)'
  const activeBg = isDark ? '#2a2825' : '#ffffff'

  return (
    <Row
      style={{
        position: 'absolute',
        bottom: 68,
        left: 12,
        right: 12,
        backgroundColor: bgColor,
        borderRadius: 24,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 12,
        zIndex: 60,
        gap: 8,
      }}
    >
      <Tabs
        value={activeView}
        onValueChange={onViewChange}
        triggerSizing="equal"
        containerStyle={{ flex: 1 }}
      >
        <Tabs.Item value="map">
          <Tabs.Trigger
            containerStyle={{
              flex: 1,
              backgroundColor: activeView === 'map' ? activeBg : 'transparent',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Row align="center" justify="center" gap={8}>
              <MapIcon size={18} />
              <Text>Map</Text>
            </Row>
          </Tabs.Trigger>
        </Tabs.Item>
        <Tabs.Item value="list">
          <Tabs.Trigger
            containerStyle={{
              flex: 1,
              backgroundColor: activeView === 'list' ? activeBg : 'transparent',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Row align="center" justify="center" gap={8}>
              <ListIcon size={18} />
              <Text>List</Text>
            </Row>
          </Tabs.Trigger>
        </Tabs.Item>
      </Tabs>
    </Row>
  )
}

type MobileFiltersContentProps = {
  showWorkers: boolean
  showOrganizations: boolean
  showJobs: boolean
  onShowWorkersChange: (value: boolean) => void
  onShowOrganizationsChange: (value: boolean) => void
  onShowJobsChange: (value: boolean) => void
  onReset: () => void
}

const MobileFiltersContent = ({
  showWorkers,
  showOrganizations,
  showJobs,
  onShowWorkersChange,
  onShowOrganizationsChange,
  onShowJobsChange,
  onReset,
}: MobileFiltersContentProps) => {
  return (
    <Stack flex={1} gap={16}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Stack gap={16} paddingBottom={24}>
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
        </Stack>
      </ScrollView>

      <Button
        size="md"
        variant="outline"
        iconStart={RotateCcw}
        onPress={onReset}
        aria-label="Reset filters"
      >
        Reset Filters
      </Button>
    </Stack>
  )
}

type FilterToggleProps = {
  label: string
  description: string
  value: boolean
  onValueChange: (value: boolean) => void
}

const FilterToggle = ({ label, description, value, onValueChange }: FilterToggleProps) => {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light' as const
  return (
    <Stack
      gap={8}
      style={{ backgroundColor: colors.bg[t].muted, borderColor: colors.border[t].default }}
      padding="sm"
      borderRadius={16}
      borderWidth={1}
    >
      <Row justify="space-between" align="center" gap={8}>
        <Text>{label}</Text>
        <Switch checked={value} onChange={onValueChange} accessibilityLabel={label} />
      </Row>
      <Text style={{ color: colors.text[t].secondary }}>{description}</Text>
    </Stack>
  )
}

export default DiscoverMapScreen
