'use client'

import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { Button, Paragraph, Separator, Sheet, Text, XStack, YStack, useMedia } from '@app/ui'
import { Filter, RefreshCw, MapPin } from '@tamagui/lucide-icons'

import { FilterBar } from './components/FilterBar'
import { RadiusSlider } from './components/RadiusSlider'
import { ResultList, type ResultListRef } from './components/ResultList'
import { defaultCenter, defaultRadiusMeters } from './data/mockProfiles'
import { useTalentProfiles } from './hooks/useTalentProfiles'
import { useUserLocation } from './hooks/useUserLocation'
import type { ActiveFilter } from './types'
import type { TalentMarker } from './map/types'
import { TalentMap } from './map'

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

export const WorkersIndexLeft = () => {
  const _media = useMedia()
  const resultListRef = useRef<ResultListRef>(null)

  // Location functionality
  const {
    location,
    isLoading: isLocationLoading,
    error: _locationError,
    requestLocation,
    permissionStatus,
  } = useUserLocation()

  const [locationQuery, setLocationQuery] = useState('Marlborough, Connecticut, United States')
  const [radiusMeters, setRadiusMeters] = useState(defaultRadiusMeters)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(INITIAL_FILTERS)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [radiusAdjustmentOpen, setRadiusAdjustmentOpen] = useState(false)

  const { data: talentProfiles = [], isLoading } = useTalentProfiles()

  // Determine map center based on user location or default
  const mapCenter: [number, number] = useMemo(() => {
    if (location) {
      return [location.longitude, location.latitude]
    }
    return defaultCenter
  }, [location])

  // Handle location request
  const handleLocationRequest = async () => {
    try {
      await requestLocation()
    } catch (error) {
      console.error('Failed to get location:', error)
    }
  }

  // Update location query when user location changes
  const updateLocationQuery = useCallback(async (lat: number, lng: number) => {
    try {
      // For web, we can use a simple approach or integrate with a geocoding service
      // For now, we'll use a basic format
      setLocationQuery(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
    } catch (error) {
      console.error('Failed to update location query:', error)
      setLocationQuery(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
    }
  }, [])

  // Update location query when location changes
  useEffect(() => {
    if (location) {
      updateLocationQuery(location.latitude, location.longitude)
    }
  }, [location, updateLocationQuery])

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

  const markers: TalentMarker[] = useMemo(
    () =>
      talentProfiles.map((profile) => ({
        id: profile.id,
        coordinate: profile.coordinates,
        title: profile.organization ?? 'Worker',
        metric: `e ${profile.score}`,
        organization: profile.organization,
      })),
    [talentProfiles]
  )

  const handleMarkerPress = (profileId: string) => {
    setSelectedProfileId(profileId)

    // Scroll to card with slight delay for better UX
    setTimeout(() => {
      resultListRef.current?.scrollToCard(profileId)
    }, 100)
  }

  return (
    <YStack flex={1} backgroundColor="$background" height="100vh" overflow="hidden">
      <YStack padding="$5" gap="$4" flexShrink={0}>
        <FilterBar
          locationQuery={locationQuery}
          onLocationChange={setLocationQuery}
          onLocationRequest={handleLocationRequest}
          onAdjustFilters={() => setFiltersOpen(true)}
          filters={allFilters}
          onRemoveFilter={(filterId) => {
            if (filterId === 'radius:custom') {
              // Don't allow removing radius filter
              return
            }
            setActiveFilters((current) => current.filter((filter) => filter.id !== filterId))
          }}
          onClearFilters={() => setActiveFilters([])}
          isLocationLoading={isLocationLoading}
          locationPermissionStatus={permissionStatus}
        />
      </YStack>

      <YStack flex={1} paddingHorizontal="$5" paddingBottom="$5" overflow="hidden">
        <YStack gap="$4" flex={1} overflow="hidden">
          <YStack height={320} flexShrink={0}>
            <TalentMap
              center={mapCenter}
              markers={markers}
              radiusMeters={radiusMeters}
              selectedMarkerId={selectedProfileId}
              onMarkerPress={handleMarkerPress}
            />
          </YStack>
          <YStack flex={1} overflow="hidden">
            <ResultList
              ref={resultListRef}
              profiles={talentProfiles}
              selectedId={selectedProfileId}
              onSelect={setSelectedProfileId}
              isLoading={isLoading}
            />
          </YStack>
        </YStack>
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
            {allFilters.map((filter) => (
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
              <XStack alignItems="center" gap="$2">
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
        <Sheet.Frame padding="$5" gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="700">
              Adjust Search Radius
            </Text>
            <Button size="$2" theme="gray" onPress={() => setRadiusAdjustmentOpen(false)}>
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

export default WorkersIndexLeft
