import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { MapPinType as MapPin } from '@app/ui'

/**
 * Pin visibility state types
 */
export type PinVisibilityState = 'visible' | 'hidden' | 'transitioning-in' | 'transitioning-out'

/**
 * Individual pin state tracking
 */
export interface PinState {
  pin: MapPin
  visibility: PinVisibilityState
  clusterId?: number
  opacity: number
}

/**
 * Transition queue item
 */
interface TransitionQueueItem {
  pinId: string
  targetState: PinVisibilityState
  timestamp: number
}

/**
 * Cluster information
 */
export interface ClusterInfo {
  clusterId: number
  coordinates: [number, number]
  pointCount: number
  memberPinIds?: string[]
}

/**
 * Options for useMapPinState hook
 */
export interface UseMapPinStateOptions {
  /**
   * Transition duration in milliseconds
   * @default 300
   */
  transitionDuration?: number
  /**
   * Delay between processing transitions in the queue
   * @default 50
   */
  transitionQueueDelay?: number
}

/**
 * Return type for useMapPinState hook
 */
export interface UseMapPinStateReturn {
  /**
   * Map of pin IDs to their current state
   */
  pinStates: Map<string, PinState>
  /**
   * Pins that are currently visible (not hidden or transitioning out)
   */
  visiblePins: MapPin[]
  /**
   * Pins that are currently clustered
   */
  clusteredPins: MapPin[]
  /**
   * Pins that are currently transitioning
   */
  transitioningPins: MapPin[]
  /**
   * Update pin visibility state
   */
  updatePinVisibility: (pinId: string, visibility: PinVisibilityState) => void
  /**
   * Assign pin to a cluster
   */
  setPinCluster: (pinId: string, clusterId: number | undefined) => void
  /**
   * Queue a transition for a pin
   */
  queueTransition: (pinId: string, targetState: PinVisibilityState) => void
  /**
   * Main function to process new pins and clusters
   */
  processPins: (newPins: MapPin[], clusters: ClusterInfo[]) => void
  /**
   * Clear all pin states
   */
  clearStates: () => void
}

/**
 * Hook for managing map pin visibility, cluster membership, and transitions
 *
 * Features:
 * - Tracks pin visibility states (visible, hidden, transitioning)
 * - Manages cluster membership for pins
 * - Handles transition queue for smooth fade in/out animations
 * - Persists previous pins during query refetches to prevent flash
 *
 * @example
 * ```tsx
 * const { visiblePins, processPins, updatePinVisibility } = useMapPinState({
 *   transitionDuration: 300
 * })
 *
 * // Process new pins from query
 * processPins(mapPins, clusterInfo)
 *
 * // Manually update a pin's visibility
 * updatePinVisibility('pin-123', 'transitioning-out')
 * ```
 */
export function useMapPinState(
  options: UseMapPinStateOptions = {}
): UseMapPinStateReturn {
  const {
    transitionDuration = 300,
    transitionQueueDelay = 50,
  } = options

  // Map of pin IDs to their current state
  const [pinStates, setPinStates] = useState<Map<string, PinState>>(new Map())

  // Cache of previous pins for comparison
  const previousPinsRef = useRef<MapPin[]>([])

  // Transition queue
  const transitionQueueRef = useRef<TransitionQueueItem[]>([])

  // Processing flag to prevent concurrent updates
  const isProcessingRef = useRef(false)

  /**
   * Calculate opacity based on visibility state
   */
  const getOpacity = useCallback((visibility: PinVisibilityState): number => {
    switch (visibility) {
      case 'visible':
        return 1
      case 'hidden':
        return 0
      case 'transitioning-in':
        return 0.5 // Start at 50% during transition
      case 'transitioning-out':
        return 0.5 // Fade to 50% during transition
      default:
        return 1
    }
  }, [])

  /**
   * Update pin visibility state
   */
  const updatePinVisibility = useCallback(
    (pinId: string, visibility: PinVisibilityState) => {
      setPinStates((prev) => {
        const next = new Map(prev)
        const existing = next.get(pinId)

        if (existing) {
          next.set(pinId, {
            ...existing,
            visibility,
            opacity: getOpacity(visibility),
          })
        }

        return next
      })
    },
    [getOpacity]
  )

  /**
   * Assign pin to a cluster
   */
  const setPinCluster = useCallback((pinId: string, clusterId: number | undefined) => {
    setPinStates((prev) => {
      const next = new Map(prev)
      const existing = next.get(pinId)

      if (existing) {
        const newVisibility: PinVisibilityState = clusterId ? 'hidden' : 'visible'
        next.set(pinId, {
          ...existing,
          clusterId,
          visibility: newVisibility,
          opacity: getOpacity(newVisibility),
        })
      }

      return next
    })
  }, [getOpacity])

  /**
   * Queue a transition for a pin
   */
  const queueTransition = useCallback(
    (pinId: string, targetState: PinVisibilityState) => {
      transitionQueueRef.current.push({
        pinId,
        targetState,
        timestamp: Date.now(),
      })
    },
    []
  )

  /**
   * Process transition queue
   */
  useEffect(() => {
    if (transitionQueueRef.current.length === 0 || isProcessingRef.current) {
      return
    }

    isProcessingRef.current = true

    const processNext = () => {
      const item = transitionQueueRef.current.shift()
      if (!item) {
        isProcessingRef.current = false
        return
      }

      // Update pin to transitioning state first
      updatePinVisibility(item.pinId, item.targetState)

      // After transition duration, update to final state
      setTimeout(() => {
        if (item.targetState === 'transitioning-in') {
          updatePinVisibility(item.pinId, 'visible')
        } else if (item.targetState === 'transitioning-out') {
          updatePinVisibility(item.pinId, 'hidden')
        }

        // Process next item in queue
        setTimeout(processNext, transitionQueueDelay)
      }, transitionDuration)
    }

    processNext()
  }, [transitionDuration, transitionQueueDelay, updatePinVisibility])

  /**
   * Main function to process new pins and clusters
   */
  const processPins = useCallback(
    (newPins: MapPin[], clusters: ClusterInfo[]) => {
      const nextStates = new Map<string, PinState>()

      // Create a map of cluster IDs to their info for quick lookup
      const clusterMap = new Map<number, ClusterInfo>()
      for (const cluster of clusters) {
        clusterMap.set(cluster.clusterId, cluster)
      }

      // Create a set of new pin IDs
      const newPinIds = new Set(newPins.map((p) => p.id))

      // Process existing pins - keep them if they still exist, mark for removal if not
      for (const [pinId, state] of pinStates.entries()) {
        if (newPinIds.has(pinId)) {
          // Pin still exists - keep state but update pin data
          const newPin = newPins.find((p) => p.id === pinId)
          if (newPin) {
            nextStates.set(pinId, {
              ...state,
              pin: newPin,
            })
          }
        } else {
          // Pin was removed - queue transition out
          queueTransition(pinId, 'transitioning-out')
          // Keep in state during transition
          nextStates.set(pinId, state)
        }
      }

      // Process new pins
      for (const pin of newPins) {
        if (!nextStates.has(pin.id)) {
          // New pin - check if it should be in a cluster
          // For now, we'll determine cluster membership externally
          // and set it via setPinCluster
          const initialState: PinVisibilityState = 'transitioning-in'
          nextStates.set(pin.id, {
            pin,
            visibility: initialState,
            opacity: getOpacity(initialState),
          })

          // Queue transition in
          queueTransition(pin.id, 'transitioning-in')
        }
      }

      // Update states
      setPinStates(nextStates)

      // Update previous pins cache
      previousPinsRef.current = newPins
    },
    [pinStates, getOpacity, queueTransition]
  )

  /**
   * Clear all pin states
   */
  const clearStates = useCallback(() => {
    setPinStates(new Map())
    previousPinsRef.current = []
    transitionQueueRef.current = []
  }, [])

  // Compute derived state
  const visiblePins = useMemo(() => {
    const pins: MapPin[] = []
    for (const state of pinStates.values()) {
      if (state.visibility === 'visible' || state.visibility === 'transitioning-in') {
        pins.push(state.pin)
      }
    }
    return pins
  }, [pinStates])

  const clusteredPins = useMemo(() => {
    const pins: MapPin[] = []
    for (const state of pinStates.values()) {
      if (state.clusterId !== undefined && state.visibility === 'hidden') {
        pins.push(state.pin)
      }
    }
    return pins
  }, [pinStates])

  const transitioningPins = useMemo(() => {
    const pins: MapPin[] = []
    for (const state of pinStates.values()) {
      if (
        state.visibility === 'transitioning-in' ||
        state.visibility === 'transitioning-out'
      ) {
        pins.push(state.pin)
      }
    }
    return pins
  }, [pinStates])

  return {
    pinStates,
    visiblePins,
    clusteredPins,
    transitioningPins,
    updatePinVisibility,
    setPinCluster,
    queueTransition,
    processPins,
    clearStates,
  }
}

