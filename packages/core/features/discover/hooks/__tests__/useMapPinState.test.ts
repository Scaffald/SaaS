import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useMapPinState } from '../useMapPinState'
import type { MapPinType } from '@app/ui'
import type { ClusterInfo } from '../useMapPinState'

describe('useMapPinState', () => {
  const mockPin: MapPinType = {
    id: 'pin-1',
    type: 'worker',
    coordinates: [42.3601, -71.0589],
    data: { id: 'user-1', name: 'John Doe' },
  }

  const mockPin2: MapPinType = {
    id: 'pin-2',
    type: 'organization',
    coordinates: [42.3651, -71.0639],
    data: { id: 'org-1', name: 'Acme Corp' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useMapPinState())

    expect(result.current.pinStates.size).toBe(0)
    expect(result.current.visiblePins).toEqual([])
    expect(result.current.clusteredPins).toEqual([])
    expect(result.current.transitioningPins).toEqual([])
  })

  it('new pins start as transitioning-in', async () => {
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 300 }))

    act(() => {
      result.current.processPins([mockPin], [])
    })

    // Pin should be in transitioning-in state
    const pinState = result.current.pinStates.get('pin-1')
    expect(pinState).toBeDefined()
    expect(pinState?.visibility).toBe('transitioning-in')
    expect(pinState?.opacity).toBe(0.5)
  })

  it('pins transition to visible after delay', async () => {
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 100 }))

    act(() => {
      result.current.processPins([mockPin], [])
    })

    // Pin should start as transitioning-in
    expect(result.current.pinStates.get('pin-1')?.visibility).toBe('transitioning-in')

    // Fast-forward time to complete transition
    act(() => {
      vi.advanceTimersByTime(150) // More than transition duration
    })

    // Allow React to process state updates
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const pinState = result.current.pinStates.get('pin-1')
    // After transition, pin should be visible
    expect(pinState?.visibility).toBe('visible')
    expect(pinState?.opacity).toBe(1)
  })

  it('removed pins transition out', async () => {
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 100 }))

    // Add pin
    act(() => {
      result.current.processPins([mockPin], [])
    })

    // Wait for transition in
    act(() => {
      vi.advanceTimersByTime(150)
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.pinStates.get('pin-1')?.visibility).toBe('visible')

    // Remove pin
    act(() => {
      result.current.processPins([], [])
    })

    // Pin should be transitioning out
    const pinState = result.current.pinStates.get('pin-1')
    expect(pinState?.visibility).toBe('transitioning-out')

    // Fast-forward to complete transition out
    act(() => {
      vi.advanceTimersByTime(150)
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const finalPinState = result.current.pinStates.get('pin-1')
    expect(finalPinState?.visibility).toBe('hidden')
  })

  it('cluster assignment hides pins', () => {
    const { result } = renderHook(() => useMapPinState())

    act(() => {
      result.current.processPins([mockPin], [])
    })

    // Wait for transition in
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Assign to cluster
    act(() => {
      result.current.setPinCluster('pin-1', 1)
    })

    const pinState = result.current.pinStates.get('pin-1')
    expect(pinState?.clusterId).toBe(1)
    expect(pinState?.visibility).toBe('hidden')
  })

  it('visiblePins includes only visible/transitioning-in pins', async () => {
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 100 }))

    act(() => {
      result.current.processPins([mockPin, mockPin2], [])
    })

    // Both pins should be in visiblePins (transitioning-in counts as visible)
    expect(result.current.visiblePins.length).toBe(2)

    // Fast-forward to make them fully visible
    act(() => {
      vi.advanceTimersByTime(150)
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.visiblePins.length).toBe(2)
    expect(result.current.visiblePins.some((p) => p.id === 'pin-1')).toBe(true)
    expect(result.current.visiblePins.some((p) => p.id === 'pin-2')).toBe(true)
  })

  it('clusteredPins includes only clustered pins', () => {
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 300 }))

    act(() => {
      result.current.processPins([mockPin, mockPin2], [])
    })

    // Wait for transition in
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Assign one pin to cluster
    act(() => {
      result.current.setPinCluster('pin-1', 1)
    })

    // Only pin-1 should be in clusteredPins
    expect(result.current.clusteredPins.length).toBe(1)
    expect(result.current.clusteredPins[0].id).toBe('pin-1')
  })

  it('transitioningPins includes transitioning states', async () => {
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 100 }))

    act(() => {
      result.current.processPins([mockPin], [])
    })

    // Pin should be transitioning in
    expect(result.current.transitioningPins.length).toBe(1)
    expect(result.current.transitioningPins[0].id).toBe('pin-1')

    // Fast-forward to complete transition
    act(() => {
      vi.advanceTimersByTime(150)
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Pin should no longer be transitioning (now visible)
    expect(result.current.transitioningPins.length).toBe(0)
  })

  it('clearStates resets all state', () => {
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 300 }))

    act(() => {
      result.current.processPins([mockPin, mockPin2], [])
    })

    expect(result.current.pinStates.size).toBe(2)

    act(() => {
      result.current.clearStates()
    })

    expect(result.current.pinStates.size).toBe(0)
    expect(result.current.visiblePins).toEqual([])
    expect(result.current.clusteredPins).toEqual([])
    expect(result.current.transitioningPins).toEqual([])
  })

  it('processPins handles clusters correctly', () => {
    const clusters: ClusterInfo[] = [
      {
        clusterId: 1,
        coordinates: [42.3601, -71.0589],
        pointCount: 2,
        memberPinIds: ['pin-1', 'pin-2'],
      },
    ]

    const { result } = renderHook(() => useMapPinState({ transitionDuration: 300 }))

    act(() => {
      result.current.processPins([mockPin, mockPin2], clusters)
    })

    // Pins should be processed
    expect(result.current.pinStates.size).toBe(2)
  })

  it('updatePinVisibility updates pin state', async () => {
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 100 }))

    act(() => {
      result.current.processPins([mockPin], [])
    })

    // Wait for transition in
    act(() => {
      vi.advanceTimersByTime(150)
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.pinStates.get('pin-1')?.visibility).toBe('visible')

    // Manually update visibility
    act(() => {
      result.current.updatePinVisibility('pin-1', 'hidden')
    })

    const pinState = result.current.pinStates.get('pin-1')
    expect(pinState?.visibility).toBe('hidden')
    expect(pinState?.opacity).toBe(0)
  })
})

