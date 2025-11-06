# Map Search by City with Geocoding and Viewport Optimization - Implementation Plan (REQ-13)

## Overview

**Requirement ID**: REQ-13  
**Status**: PLANNED  
**Complexity**: 4/5  
**Readiness**: 5/5  
**Assigned to**: clay@unicorn.love

This plan outlines the implementation of a fully functional map search with geocoding, viewport-based result filtering, state persistence, clustering, and comprehensive error handling.

## Problem Statement

The map search functionality on preview.scaffald.com is currently broken - typing a city name like "Boston" into the search bar does not move the map or show suggestion results. Users need a working geolocation search to quickly navigate to specific cities and discover workers, jobs, and employers in those locations.

The current implementation has the infrastructure in place (MapSearchInput component, Mapbox integration, AddressAutocomplete) but is failing due to provider initialization issues, likely related to API key configuration or domain restrictions.

Additionally, the map currently loads all results regardless of viewport, which can cause performance issues and overwhelm users with too much data.

## Solution Overview

1. **Fix Geocoding**: Resolve API key configuration and provider initialization issues
2. **Viewport Filtering**: Implement dynamic result loading based on map viewport bounds
3. **State Persistence**: Create MapStateProvider to persist search location and filters
4. **Clustering**: Implement result clustering based on zoom level
5. **Error Handling**: Comprehensive error handling for all failure scenarios
6. **Performance**: Optimize queries and implement result limits

## Implementation Tasks

### Task 1: Fix Mapbox provider initialization and API key validation

**Status**: PLANNED  
**Complexity**: 2/5  
**Files**: 
- `packages/ui/src/components/address/providers/mapbox.ts`
- `packages/ui/src/components/address/AddressAutocomplete.tsx`
- `packages/core/features/discover/components/MapSearchInput.tsx`

**Changes**:
- Add explicit API key validation before provider initialization
- Implement retry logic with exponential backoff
- Add user-friendly error messages when API key is missing or invalid
- Prevent search input from being enabled if provider fails

**Implementation Steps**:
1. Add API key validation in `MapboxProvider` constructor
2. Check for `EXPO_PUBLIC_MAPBOX_TOKEN` environment variable
3. Validate token format (starts with `pk.`)
4. If invalid, throw descriptive error with user-friendly message
5. Add error boundary in `AddressAutocomplete` to catch provider errors
6. Display error state in UI instead of silently failing
7. Implement retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
8. Log detailed errors to console for debugging

**Code Reference**:
```63:69:packages/core/features/discover/components/MapSearchInput.tsx
            apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
            zoomLevel="city"
            searchOptions={{
              types: ['place', 'region', 'district', 'locality'],
            }}
            minLength={2}
            maxResults={5}
```

**Proposed Changes**:
```typescript
// In MapSearchInput.tsx
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN

if (!mapboxToken) {
  // Show error message instead of enabling search
  return <ErrorState message="Map search is temporarily unavailable" />
}

// Validate token format
if (!mapboxToken.startsWith('pk.')) {
  console.error('Invalid Mapbox token format')
  return <ErrorState message="Map search configuration error" />
}
```

**Expected Result**:
- Clear error messages when API key is missing or invalid
- Search input disabled with explanatory tooltip when provider unavailable
- Detailed error logging for debugging
- Retry mechanism prevents transient failures

---

### Task 2: Create MapStateProvider for state persistence

**Status**: PLANNED  
**Complexity**: 3/5  
**File**: `packages/core/features/discover/providers/MapStateProvider.tsx` (new file)

**Changes**:
- Create React Context provider for map state management
- Implement platform-specific storage (localStorage for web, AsyncStorage for native)
- Persist search location, filters, zoom level, and results rail visibility
- Auto-restore state on page load with 24-hour expiry

**Implementation Steps**:
1. Create `MapStateProvider.tsx` in `packages/core/features/discover/providers/`
2. Define `MapState` interface with all persisted fields
3. Implement `useIsomorphicLayoutEffect` for early state loading
4. Use `typeof window !== 'undefined'` check for web localStorage
5. Use `@react-native-async-storage/async-storage` for native
6. Create `useMapState()` hook for accessing/updating state
7. Implement auto-persist on state changes with `useEffect`
8. Add 24-hour expiry check for stored data
9. Export provider and hook from feature index

**State Interface**:
```typescript
interface MapState {
  // Search location
  lastSearchLocation: {
    coordinates: [number, number]
    label: string
    zoomLevel: number
    timestamp: number
  } | null
  
  // Filters
  activeFilters: {
    showWorkers: boolean
    showOrganizations: boolean
    showJobs: boolean
    // Future: job type, experience level, etc.
  }
  
  // UI state
  resultsRailVisible: boolean
  mapStyle: string // if multiple styles available
  
  // Viewport (optional - for restoring exact map position)
  viewport: {
    center: [number, number]
    zoom: number
    bounds?: {
      north: number
      south: number
      east: number
      west: number
    }
  } | null
}
```

**Provider Structure**:
```typescript
export const MapStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<MapState>(defaultState)
  
  // Load state on mount
  useIsomorphicLayoutEffect(() => {
    loadPersistedState()
  }, [])
  
  // Persist state on changes
  useEffect(() => {
    persistState(state)
  }, [state])
  
  return (
    <MapStateContext.Provider value={{ state, setState }}>
      {children}
    </MapStateContext.Provider>
  )
}
```

**Expected Result**:
- Map state persists across page reloads
- Search location restored within 24 hours
- Filters and UI preferences maintained
- Platform-agnostic storage implementation

---

### Task 3: Implement viewport-based result filtering

**Status**: PLANNED  
**Complexity**: 4/5  
**Blocked by**: Task 2  
**Files**:
- `packages/core/features/discover/discover-map-screen.tsx`
- `packages/core/features/discover/hooks/useTalentProfiles.ts`
- `packages/core/features/discover/hooks/useOrganizations.ts`
- `packages/core/features/discover/hooks/useJobs.ts`
- `packages/supabase/functions/trpc/routers/workers.router.ts`
- `packages/supabase/functions/trpc/routers/employers.router.ts`
- `packages/supabase/functions/trpc/routers/jobs.router.ts`

**Changes**:
- Extract viewport bounds from map container
- Pass bounds to backend queries as filters
- Implement debounced viewport change detection (500ms)
- Add result limits per query (500 workers, 500 jobs, 200 employers)
- Re-fetch results when map is panned or zoomed

**Implementation Steps**:
1. Add `onViewportChange` callback to `MapContainer` component
2. Extract bounds (north, south, east, west) from map viewport
3. Debounce viewport changes by 500ms to avoid excessive queries
4. Update `useTalentProfiles` hook to accept bounds parameter
5. Update `useOrganizations` hook to accept bounds parameter
6. Update `useJobs` hook to accept bounds parameter
7. Add bounds filtering to backend queries (workers, employers, jobs routers)
8. Implement spatial indexing on coordinate fields (PostGIS)
9. Add query limits and "Zoom in to see more" messaging
10. Handle loading states during viewport changes

**Viewport Bounds Extraction**:
```typescript
// In discover-map-screen.tsx
const handleViewportChange = useCallback(
  debounce((bounds: {
    north: number
    south: number
    east: number
    west: number
  }) => {
    // Update query parameters
    setViewportBounds(bounds)
  }, 500),
  []
)
```

**Backend Query Update**:
```typescript
// In workers.router.ts
if (input.bounds) {
  const { north, south, east, west } = input.bounds
  query = query
    .gte('longitude', west)
    .lte('longitude', east)
    .gte('latitude', south)
    .lte('latitude', north)
}
```

**Expected Result**:
- Only results within visible viewport are fetched and displayed
- Map performs smoothly even with large datasets
- Results update automatically when map is panned or zoomed
- Query limits prevent overwhelming the UI

---

### Task 4: Implement result clustering by zoom level

**Status**: PLANNED  
**Complexity**: 4/5  
**Blocked by**: Task 3  
**Files**:
- `packages/core/features/discover/discover-map-screen.tsx`
- `packages/ui/src/components/map/MapContainer.tsx` (if exists)

**Changes**:
- Implement clustering algorithm based on zoom level
- Group nearby markers into clusters
- Display cluster count on grouped markers
- Expand clusters on click to show individual results
- Adjust cluster radius based on zoom level

**Implementation Steps**:
1. Research clustering libraries (e.g., `supercluster`, `@mapbox/supercluster`)
2. Install appropriate clustering library
3. Create cluster calculation utility function
4. Group markers by zoom level:
   - Zoom 1-8: Cluster by state/region
   - Zoom 9-11: Cluster by city
   - Zoom 12-14: Cluster by neighborhood
   - Zoom 15+: Show individual pins
5. Calculate cluster positions and counts
6. Update map pins to include cluster markers
7. Implement cluster expansion on click
8. Add visual distinction for cluster vs individual markers

**Clustering Logic**:
```typescript
interface ClusterPoint {
  id: string
  coordinates: [number, number]
  type: 'worker' | 'employer' | 'job'
}

function calculateClusters(
  points: ClusterPoint[],
  zoomLevel: number,
  bounds: ViewportBounds
): (ClusterPoint | Cluster)[] {
  // Use supercluster or similar library
  const cluster = new Supercluster({
    radius: getClusterRadius(zoomLevel),
    minZoom: 1,
    maxZoom: 15,
  })
  
  cluster.load(points)
  return cluster.getClusters(bounds, zoomLevel)
}
```

**Expected Result**:
- Dense areas show cluster markers instead of individual pins
- Cluster count displayed on grouped markers
- Smooth transition between cluster and individual views
- Performance improved for large datasets

---

### Task 5: Add empty results handling and nearest location search

**Status**: PLANNED  
**Complexity**: 3/5  
**Blocked by**: Task 3  
**Files**:
- `packages/core/features/discover/discover-map-screen.tsx`
- `packages/core/features/discover/components/MapSearchInput.tsx`

**Changes**:
- Detect when searched location has no results
- Find nearest location with results
- Adjust map viewport to show both searched location and nearest results
- Display informative message and "Expand Search Radius" button

**Implementation Steps**:
1. After search, check if any results in viewport
2. If no results, query for nearest location with results
3. Calculate bounding box that includes both:
   - Searched location
   - Nearest location with results
4. Adjust map zoom and center to fit both locations
5. Display message: "No results in [Location]. Showing nearest results in [Nearest Location]."
6. Add "Expand Search Radius" button (increases radius by 50 miles)
7. Re-query with expanded radius
8. Update map bounds accordingly

**Nearest Location Query**:
```typescript
async function findNearestLocationWithResults(
  searchLocation: [number, number],
  radiusMiles: number = 50
): Promise<{ location: [number, number], label: string } | null> {
  // Query for nearest location with any results
  // Use PostGIS ST_DWithin for spatial search
  // Return location with results and label
}
```

**Expected Result**:
- Users see helpful message when no results in searched location
- Map automatically shows nearest available results
- "Expand Search Radius" provides easy way to find more results
- Better UX when searching for locations with limited data

---

### Task 6: Implement comprehensive error handling

**Status**: PLANNED  
**Complexity**: 3/5  
**Files**:
- `packages/ui/src/components/address/providers/mapbox.ts`
- `packages/core/features/discover/components/MapSearchInput.tsx`
- `packages/core/features/discover/discover-map-screen.tsx`

**Changes**:
- Handle specific geocoding API error codes (401, 429, network errors)
- Display user-friendly error messages in toast notifications
- Implement fallback to cached results when queries fail
- Add retry mechanisms for transient failures

**Implementation Steps**:
1. Create error handling utility with error code mapping
2. Handle 401 Unauthorized: "Map search configuration error. Please contact support."
3. Handle 429 Rate Limited: "Too many searches. Please wait a moment and try again."
4. Handle Network Error: "Connection issue. Please check your internet and try again."
5. Handle Invalid Location: "Location not found. Try a different search term."
6. Implement toast notification system (5 second duration)
7. Add error logging with context for debugging
8. Implement cached results fallback for viewport queries
9. Add "Retry" button for failed queries

**Error Handling**:
```typescript
function handleGeocodingError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('401')) {
      return 'Map search configuration error. Please contact support.'
    }
    if (error.message.includes('429')) {
      return 'Too many searches. Please wait a moment and try again.'
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Connection issue. Please check your internet and try again.'
    }
  }
  return 'Location not found. Try a different search term.'
}
```

**Expected Result**:
- All error scenarios handled gracefully
- Users receive clear, actionable error messages
- Cached results shown when possible
- Errors logged for debugging without exposing technical details

---

### Task 7: Optimize result count queries and caching

**Status**: PLANNED  
**Complexity**: 3/5  
**Files**:
- `packages/supabase/functions/trpc/routers/workers.router.ts`
- `packages/supabase/functions/trpc/routers/jobs.router.ts`
- `packages/supabase/functions/trpc/routers/employers.router.ts`

**Changes**:
- Pre-calculate result counts for major cities (top 500 US cities)
- Cache counts in Redis with 1-hour TTL
- Implement lightweight count queries for non-cached locations
- Add query timeout (1 second) with fallback message

**Implementation Steps**:
1. Create migration to seed major city coordinates
2. Create background job to pre-calculate counts for major cities
3. Store counts in Redis with TTL (1 hour)
4. Implement count query function that checks cache first
5. For non-cached locations, perform lightweight `COUNT(*)` query
6. Add timeout (1 second) - if incomplete, show "Many results"
7. Update count display in search suggestions
8. Implement cache warming strategy

**Count Query Optimization**:
```typescript
async function getResultCount(
  location: string,
  bounds: ViewportBounds,
  type: 'workers' | 'jobs' | 'employers'
): Promise<number | 'many'> {
  // Check Redis cache first
  const cached = await redis.get(`count:${type}:${location}`)
  if (cached) return parseInt(cached, 10)
  
  // Perform lightweight count query with timeout
  try {
    const count = await query
      .select('*', { count: 'exact', head: true })
      .timeout(1000) // 1 second timeout
      .withinBounds(bounds)
    
    // Cache result
    await redis.setex(`count:${type}:${location}`, 3600, count)
    return count
  } catch (error) {
    if (error.name === 'TimeoutError') {
      return 'many'
    }
    throw error
  }
}
```

**Expected Result**:
- Fast count display in search suggestions
- Reduced database load for common searches
- Graceful handling of slow queries
- Improved user experience with instant feedback

---

### Task 8: Add loading states and visual feedback

**Status**: PLANNED  
**Complexity**: 2/5  
**Files**:
- `packages/core/features/discover/components/MapSearchInput.tsx`
- `packages/core/features/discover/discover-map-screen.tsx`
- `packages/ui/src/components/address/AddressAutocomplete.tsx`

**Changes**:
- Show spinner in search input while fetching suggestions
- Display "Searching..." text in dropdown while loading
- Show map loading overlay during viewport result fetch
- Animate map transition when navigating to selected location (300ms ease-in-out)

**Implementation Steps**:
1. Add loading state to `AddressAutocomplete` component
2. Display spinner in search input when `loading` is true
3. Show "Searching..." placeholder in dropdown results
4. Add loading overlay to map when fetching viewport results
5. Implement smooth map transition animation (300ms ease-in-out)
6. Add loading indicators for each result type (workers, jobs, employers)
7. Show skeleton loaders in results rail during fetch

**Loading States**:
```typescript
// In MapSearchInput.tsx
{loading && (
  <XStack position="absolute" right="$3" items="center">
    <Spinner size="small" />
  </XStack>
)}

// In discover-map-screen.tsx
{(isLoading || isLoadingOrgs || isLoadingJobs) && (
  <YStack
    position="absolute"
    top={0}
    left={0}
    right={0}
    bottom={0}
    bg="$background"
    opacity={0.7}
    items="center"
    justify="center"
    zIndex={100}
  >
    <Spinner size="large" />
    <Text mt="$2">Loading results...</Text>
  </YStack>
)}
```

**Expected Result**:
- Clear visual feedback during all loading states
- Users understand when system is working
- Smooth animations improve perceived performance
- No confusing empty states during loading

---

### Task 9: Implement mobile-specific optimizations

**Status**: PLANNED  
**Complexity**: 2/5  
**Blocked by**: Task 1, Task 8  
**Files**:
- `packages/core/features/discover/components/MapSearchInput.tsx`
- `packages/core/features/discover/discover-map-screen.tsx`

**Changes**:
- Increase touch target size to minimum 44x44px
- Show search input as overlay on mobile (not inline)
- Limit suggestions to 3 on mobile (vs 5 on desktop)
- Use bottom sheet for suggestions on mobile instead of dropdown
- Adjust map zoom levels for smaller screens

**Implementation Steps**:
1. Detect mobile screen size (< 640px)
2. Render search input as full-screen overlay on mobile
3. Use bottom sheet component for suggestions (instead of dropdown)
4. Limit `maxResults` to 3 on mobile
5. Adjust zoom levels:
   - City: zoom level 11 (vs 12 on desktop)
   - County: zoom level 9 (vs 10 on desktop)
   - State: zoom level 6 (vs 7 on desktop)
6. Increase touch target sizes for all interactive elements
7. Test on actual mobile devices

**Mobile Adaptations**:
```typescript
const isMobile = width < 640

// In MapSearchInput.tsx
{isMobile ? (
  <Sheet modal open={isVisible} onOpenChange={onClose}>
    <Sheet.Overlay />
    <Sheet.Frame>
      <AddressAutocomplete
        maxResults={3}
        // ... other props
      />
    </Sheet.Frame>
  </Sheet>
) : (
  <AddressAutocomplete
    maxResults={5}
    // ... other props
  />
)}
```

**Expected Result**:
- Mobile users have optimized experience
- Touch targets meet accessibility requirements
- Search experience is appropriate for small screens
- Zoom levels work well on mobile devices

---

### Task 10: Add keyboard navigation and accessibility

**Status**: PLANNED  
**Complexity**: 2/5  
**Blocked by**: Task 1  
**Files**:
- `packages/ui/src/components/address/AddressAutocomplete.tsx`
- `packages/core/features/discover/components/MapSearchInput.tsx`

**Changes**:
- Implement arrow key navigation through suggestions
- Add Enter key to select highlighted suggestion
- Add Escape key to close suggestions dropdown
- Add Tab key handling (close dropdown, move to next element)
- Add screen reader announcements

**Implementation Steps**:
1. Add keyboard event handlers to `AddressAutocomplete`
2. Track highlighted index state
3. Arrow Up/Down: Navigate through suggestions
4. Enter: Select highlighted suggestion
5. Escape: Close dropdown, return focus to input
6. Tab: Close dropdown, move focus to next element
7. Add ARIA labels for screen reader support
8. Announce suggestion count and selected suggestion
9. Test with VoiceOver (iOS) and TalkBack (Android)

**Keyboard Navigation**:
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (!showResults) return
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      )
      break
    case 'ArrowUp':
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
      break
    case 'Enter':
      e.preventDefault()
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleAddressSelect(results[selectedIndex])
      }
      break
    case 'Escape':
      e.preventDefault()
      setShowResults(false)
      inputRef.current?.blur()
      break
    case 'Tab':
      setShowResults(false)
      break
  }
}
```

**Expected Result**:
- Full keyboard navigation support
- Screen reader compatibility
- Accessible to users with disabilities
- Meets WCAG 2.1 AA standards

---

## Technical Implementation Details

### Viewport Bounds Calculation

```typescript
interface ViewportBounds {
  north: number  // Maximum latitude
  south: number  // Minimum latitude
  east: number   // Maximum longitude
  west: number   // Minimum longitude
}

function extractViewportBounds(map: MapInstance): ViewportBounds {
  const bounds = map.getBounds()
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  }
}
```

### Spatial Query Implementation

```typescript
// PostGIS query for viewport filtering
query = query
  .gte('longitude', bounds.west)
  .lte('longitude', bounds.east)
  .gte('latitude', bounds.south)
  .lte('latitude', bounds.north)

// Or using PostGIS spatial functions
query = query.filter(
  'geo',
  'st_within',
  `ST_MakeEnvelope(${bounds.west}, ${bounds.south}, ${bounds.east}, ${bounds.north}, 4326)`
)
```

### State Persistence Structure

```typescript
interface PersistedMapState {
  version: 1
  timestamp: number
  data: {
    searchLocation: {
      coordinates: [number, number]
      label: string
      zoomLevel: number
    } | null
    filters: {
      showWorkers: boolean
      showOrganizations: boolean
      showJobs: boolean
    }
    resultsRailVisible: boolean
    viewport: {
      center: [number, number]
      zoom: number
    } | null
  }
}

const STORAGE_KEY = 'mapState'
const EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
```

### Clustering Configuration

```typescript
const clusterConfig = {
  radius: (zoom: number) => {
    if (zoom <= 8) return 50  // State/region level
    if (zoom <= 11) return 30 // City level
    if (zoom <= 14) return 20 // Neighborhood level
    return 10 // Individual pins
  },
  minZoom: 1,
  maxZoom: 15,
  minPoints: 2, // Minimum points to form cluster
}
```

---

## File Structure

### New Files
- `packages/core/features/discover/providers/MapStateProvider.tsx` - State persistence provider
- `packages/core/features/discover/utils/clustering.ts` - Clustering utilities
- `packages/core/features/discover/utils/viewport-bounds.ts` - Viewport calculation utilities
- `packages/core/features/discover/utils/error-handling.ts` - Error handling utilities
- `docs/features/map-search-city-geocoding-viewport-implementation-plan.md` - This file

### Modified Files
- `packages/ui/src/components/address/providers/mapbox.ts` - API key validation, error handling
- `packages/ui/src/components/address/AddressAutocomplete.tsx` - Loading states, keyboard navigation
- `packages/core/features/discover/components/MapSearchInput.tsx` - Error states, mobile adaptations
- `packages/core/features/discover/discover-map-screen.tsx` - Viewport filtering, state persistence
- `packages/core/features/discover/hooks/useTalentProfiles.ts` - Viewport bounds parameter
- `packages/core/features/discover/hooks/useOrganizations.ts` - Viewport bounds parameter
- `packages/core/features/discover/hooks/useJobs.ts` - Viewport bounds parameter
- `packages/supabase/functions/trpc/routers/workers.router.ts` - Viewport bounds filtering
- `packages/supabase/functions/trpc/routers/employers.router.ts` - Viewport bounds filtering
- `packages/supabase/functions/trpc/routers/jobs.router.ts` - Viewport bounds filtering

---

## Testing Strategy

### Unit Tests
- Test API key validation logic
- Test viewport bounds calculation
- Test clustering algorithm
- Test state persistence and restoration
- Test error handling scenarios

### Integration Tests
- Test geocoding search with valid API key
- Test map navigation to selected location
- Test viewport-based result filtering
- Test state persistence across page reloads
- Test error recovery mechanisms

### Performance Tests
- Test autocomplete response time (< 500ms)
- Test map navigation speed (< 300ms)
- Test viewport result fetch (< 2 seconds)
- Test cluster calculation (< 100ms)
- Test with large datasets (1000+ results)

### User Acceptance Tests
- Verify typing "Boston" shows suggestions and navigates correctly
- Verify only results in viewport are displayed
- Verify search location persists across page reloads
- Verify clustering works at different zoom levels
- Verify error messages are clear and helpful
- Verify mobile experience is optimized

---

## Acceptance Criteria Checklist

### Search Functionality
- [ ] Typing "Boston" shows up to 5 city suggestions after 300ms debounce
- [ ] Selecting "Boston, MA" centers map on Boston with zoom level 12
- [ ] Search input clears and dropdown closes after selection
- [ ] No search triggered with only 1 character (minimum 2 required)

### Viewport Filtering
- [ ] Only workers/jobs/employers within visible map bounds are shown
- [ ] Results update when map is panned (500ms debounce)
- [ ] Results update when map is zoomed
- [ ] Maximum 500 workers, 500 jobs, 200 employers per viewport
- [ ] "Zoom in to see more" message shown when limits exceeded

### Clustering
- [ ] Clusters form at appropriate zoom levels (1-8: state, 9-11: city, 12-14: neighborhood, 15+: individual)
- [ ] Cluster count displayed on grouped markers
- [ ] Clusters expand to show individual pins on click
- [ ] Smooth transition between cluster and individual views

### Empty Results Handling
- [ ] Map shows both searched location and nearest results when no results found
- [ ] Message displayed: "No results in [Location]. Showing nearest results in [Nearest Location]."
- [ ] "Expand Search Radius" button increases radius by 50 miles
- [ ] Expanded search finds and displays results correctly

### State Persistence
- [ ] Last searched location persists across page reloads (within 24 hours)
- [ ] Active filters persist across page reloads
- [ ] Results rail visibility persists
- [ ] State expires after 24 hours (resets to default)

### Error Handling
- [ ] "Map search is temporarily unavailable" shown when API key missing
- [ ] "Too many searches. Please wait a moment" shown on rate limit
- [ ] "Connection issue. Please check your internet" shown on network error
- [ ] Cached results shown with "Unable to update results" banner when query fails
- [ ] "Retry" button available for failed queries

### Performance
- [ ] Autocomplete suggestions appear within 500ms
- [ ] Map navigation completes within 300ms
- [ ] Viewport results load within 2 seconds
- [ ] Cluster calculation completes within 100ms

### Accessibility
- [ ] Arrow Up/Down navigates through suggestions
- [ ] Enter selects highlighted suggestion
- [ ] Escape closes dropdown
- [ ] Screen reader announces suggestion count and selected item
- [ ] All interactive elements have proper ARIA labels

### Mobile Experience
- [ ] Search input opens as full-screen overlay on mobile
- [ ] Only 3 suggestions shown on mobile (vs 5 on desktop)
- [ ] Bottom sheet used for suggestions on mobile
- [ ] Zoom levels adjusted for mobile (city: 11, county: 9, state: 6)
- [ ] Touch targets meet minimum 44x44px requirement

---

## Dependencies

### Required Packages
- `@react-native-async-storage/async-storage` - Native storage (if not already installed)
- `supercluster` or `@mapbox/supercluster` - Clustering algorithm
- `@tamagui/toast` or similar - Toast notifications
- PostGIS extension (already in Supabase)

### Required Environment Variables
- `EXPO_PUBLIC_MAPBOX_TOKEN` - Mapbox API key (must be configured)

### Required Backend Features
- PostGIS spatial indexing on coordinate fields
- Redis for result count caching (optional but recommended)

---

## Rollout Strategy

1. **Phase 1**: Fix API key validation and provider initialization (Task 1)
2. **Phase 2**: Create MapStateProvider (Task 2)
3. **Phase 3**: Implement viewport filtering (Task 3)
4. **Phase 4**: Add clustering (Task 4)
5. **Phase 5**: Implement empty results handling (Task 5)
6. **Phase 6**: Add error handling (Task 6)
7. **Phase 7**: Optimize count queries (Task 7)
8. **Phase 8**: Add loading states (Task 8)
9. **Phase 9**: Mobile optimizations (Task 9)
10. **Phase 10**: Accessibility improvements (Task 10)

**Testing**: Test after each phase to ensure no regressions

---

## Open Questions / Considerations

1. **API Key Configuration**: 
   - Is `EXPO_PUBLIC_MAPBOX_TOKEN` properly configured in all environments?
   - Are domain restrictions preventing access from preview.scaffald.com?
   - Should we add fallback geocoding provider (Google) if Mapbox fails?

2. **Clustering Library**:
   - Which clustering library is best for React Native/Expo?
   - Should we use `supercluster` or `@mapbox/supercluster`?
   - Do we need native module or can we use pure JS implementation?

3. **Redis Caching**:
   - Do we have Redis available in production?
   - Should we use Supabase's built-in caching or external Redis?
   - What's the fallback if Redis is unavailable?

4. **Performance Targets**:
   - Are the performance targets (500ms, 300ms, 2s) realistic?
   - Should we adjust based on network conditions?
   - Do we need to implement progressive loading for very large datasets?

5. **Mobile UX**:
   - Should search input be overlay on mobile or always visible?
   - Is bottom sheet the best pattern for mobile suggestions?
   - Should we implement gesture-based interactions (swipe to close)?

---

## Notes

- This is a complex feature involving multiple systems (frontend, backend, database, caching)
- Coordinate with backend team on spatial indexing and query optimization
- Test thoroughly with real Mapbox API key before deploying
- Consider implementing feature flags for gradual rollout
- Monitor API usage to avoid exceeding rate limits
- Document API key configuration process for other developers
- Consider adding analytics to track search usage patterns

