import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Platform } from 'react-native'
import { useIsomorphicLayoutEffect } from '@unicornlove/ui'

/**
 * Map state interface for persisting search location, filters, and UI preferences
 */
export interface MapState {
  // Search location
  lastSearchLocation: {
    coordinates: [number, number] // [lng, lat]
    label: string
    zoomLevel: number
    timestamp: number
  } | null

  // Filters
  activeFilters: {
    showWorkers: boolean
    showOrganizations: boolean
    showJobs: boolean
  }

  // UI state
  resultsRailVisible: boolean
  mapStyle?: string // For future: multiple map styles

  // Viewport (optional - for restoring exact map position)
  viewport: {
    center: [number, number] // [lng, lat]
    zoom: number
    bounds?: {
      north: number
      south: number
      east: number
      west: number
    }
  } | null
}

interface MapStateContextValue {
  state: MapState
  setState: (state: MapState | ((prev: MapState) => MapState)) => void
  updateSearchLocation: (location: MapState['lastSearchLocation']) => void
  updateFilters: (filters: Partial<MapState['activeFilters']>) => void
  updateResultsRailVisible: (visible: boolean) => void
  updateViewport: (viewport: MapState['viewport']) => void
  clearState: () => void
}

const MapStateContext = createContext<MapStateContextValue | null>(null)

const STORAGE_KEY = '@map_state'
const EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

// Default state
const defaultState: MapState = {
  lastSearchLocation: null,
  activeFilters: {
    showWorkers: true,
    showOrganizations: true,
    showJobs: true,
  },
  resultsRailVisible: true,
  viewport: null,
}

interface PersistedMapState {
  version: 1
  timestamp: number
  data: MapState
}

// Platform-specific storage functions
const getStoredState = async (): Promise<MapState | null> => {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const parsed = JSON.parse(stored) as PersistedMapState

      // Check expiry (24 hours)
      const now = Date.now()
      if (now - parsed.timestamp > EXPIRY_MS) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }

      return parsed.data
    } catch (error) {
      console.warn('MapStateProvider: unable to parse stored state', error)
      return null
    }
  } else {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const parsed = JSON.parse(stored) as PersistedMapState

      // Check expiry (24 hours)
      const now = Date.now()
      if (now - parsed.timestamp > EXPIRY_MS) {
        await AsyncStorage.removeItem(STORAGE_KEY)
        return null
      }

      return parsed.data
    } catch (error) {
      console.warn('MapStateProvider: unable to parse stored state', error)
      return null
    }
  }
}

const setStoredState = (state: MapState) => {
  const persisted: PersistedMapState = {
    version: 1,
    timestamp: Date.now(),
    data: state,
  }

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch (error) {
      console.warn('MapStateProvider: unable to store state', error)
    }
  } else {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch((error) => {
      console.warn('MapStateProvider: unable to store state', error)
    })
  }
}

// Start early state loading
let persistedState: MapState | null = null
export const loadMapStatePromise = getStoredState()
loadMapStatePromise.then((val) => {
  persistedState = val
})

/**
 * MapStateProvider - Manages map state persistence across page reloads
 *
 * Features:
 * - Persists search location, filters, and UI preferences
 * - Auto-restores state on page load (within 24 hours)
 * - Platform-agnostic storage (localStorage for web, AsyncStorage for native)
 * - Automatic state persistence on changes
 *
 * @example
 * ```tsx
 * <MapStateProvider>
 *   <DiscoverMapScreen />
 * </MapStateProvider>
 * ```
 */
export const MapStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setStateInternal] = useState<MapState>(() => persistedState ?? defaultState)
  const [isReady, setIsReady] = useState(false)

  // Load persisted state on mount
  useIsomorphicLayoutEffect(() => {
    async function loadState() {
      await loadMapStatePromise
      if (persistedState) {
        setStateInternal(persistedState)
      }
      setIsReady(true)
    }
    loadState()
  }, [])

  // Persist state on changes (but not on initial load)
  useEffect(() => {
    if (isReady) {
      setStoredState(state)
    }
  }, [state, isReady])

  // Update state with type safety
  const setState = useCallback((newState: MapState | ((prev: MapState) => MapState)) => {
    setStateInternal(newState)
  }, [])

  // Convenience methods for updating specific parts of state
  const updateSearchLocation = useCallback((location: MapState['lastSearchLocation']) => {
    setStateInternal((prev) => ({
      ...prev,
      lastSearchLocation: location,
    }))
  }, [])

  const updateFilters = useCallback((filters: Partial<MapState['activeFilters']>) => {
    setStateInternal((prev) => ({
      ...prev,
      activeFilters: {
        ...prev.activeFilters,
        ...filters,
      },
    }))
  }, [])

  const updateResultsRailVisible = useCallback((visible: boolean) => {
    setStateInternal((prev) => ({
      ...prev,
      resultsRailVisible: visible,
    }))
  }, [])

  const updateViewport = useCallback((viewport: MapState['viewport']) => {
    setStateInternal((prev) => ({
      ...prev,
      viewport,
    }))
  }, [])

  const clearState = useCallback(() => {
    setStateInternal(defaultState)
    // Also clear from storage
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {
        // Ignore errors
      })
    }
  }, [])

  const contextValue = useMemo<MapStateContextValue>(
    () => ({
      state,
      setState,
      updateSearchLocation,
      updateFilters,
      updateResultsRailVisible,
      updateViewport,
      clearState,
    }),
    [
      state,
      setState,
      updateSearchLocation,
      updateFilters,
      updateResultsRailVisible,
      updateViewport,
      clearState,
    ]
  )

  // Don't render children until state is loaded
  if (!isReady) {
    return null
  }

  return <MapStateContext.Provider value={contextValue}>{children}</MapStateContext.Provider>
}

/**
 * Hook to access map state and update functions
 *
 * @example
 * ```tsx
 * const { state, updateSearchLocation, updateFilters } = useMapState()
 *
 * // Update search location
 * updateSearchLocation({
 *   coordinates: [-71.0589, 42.3601],
 *   label: 'Boston, MA',
 *   zoomLevel: 12,
 *   timestamp: Date.now(),
 * })
 *
 * // Update filters
 * updateFilters({ showWorkers: false })
 * ```
 */
export function useMapState(): MapStateContextValue {
  const context = useContext(MapStateContext)
  if (!context) {
    throw new Error('useMapState must be used within MapStateProvider')
  }
  return context
}
