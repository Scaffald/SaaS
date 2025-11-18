import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useMapPinState } from '../useMapPinState'
import type { MapPinType } from '@app/ui'
import type { ClusterInfo } from '../useMapPinState'

describe('useMapPinState', () => {
  const mockPin: MapPinType = {
    id: 'pin-1',
    pinType: 'worker',
    title: 'Mock Worker Pin',
    coordinate: [42.3601, -71.0589],
    data: { id: 'user-1', name: 'John Doe' },
  }

  const mockPin2: MapPinType = {
    id: 'pin-2',
    pinType: 'organization',
    title: 'Mock Organization Pin',
    coordinate: [42.3651, -71.0639],
    data: { id: 'org-1', name: 'Acme Corp' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
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
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 50 }))

    act(() => {
      result.current.processPins([mockPin], [])
    })

    // Pin should start as transitioning-in
    expect(result.current.pinStates.get('pin-1')?.visibility).toBe('transitioning-in')

    // Wait for transition to complete
    await waitFor(
      () => {
        const pinState = result.current.pinStates.get('pin-1')
        expect(pinState?.visibility).toBe('visible')
        expect(pinState?.opacity).toBe(1)
      },
      { timeout: 200 }
    )
  })

  it('removed pins transition out', async () => {
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 50 }))

    // Add pin
    act(() => {
      result.current.processPins([mockPin], [])
    })

    // Wait for transition in
    await waitFor(
      () => {
        expect(result.current.pinStates.get('pin-1')?.visibility).toBe('visible')
      },
      { timeout: 200 }
    )

    // Remove pin
    act(() => {
      result.current.processPins([], [])
    })

    // Pin should be transitioning out
    const pinState = result.current.pinStates.get('pin-1')
    expect(pinState?.visibility).toBe('transitioning-out')

    // Wait for transition out to complete
    await waitFor(
      () => {
        const finalPinState = result.current.pinStates.get('pin-1')
        expect(finalPinState?.visibility).toBe('hidden')
      },
      { timeout: 200 }
    )
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
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 50 }))

    act(() => {
      result.current.processPins([mockPin, mockPin2], [])
    })

    // Both pins should be in visiblePins (transitioning-in counts as visible)
    expect(result.current.visiblePins.length).toBe(2)

    // Wait for transitions to complete
    await waitFor(
      () => {
        expect(result.current.visiblePins.length).toBe(2)
        expect(result.current.visiblePins.some((p) => p.id === 'pin-1')).toBe(true)
        expect(result.current.visiblePins.some((p) => p.id === 'pin-2')).toBe(true)
      },
      { timeout: 200 }
    )
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
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 50 }))

    act(() => {
      result.current.processPins([mockPin], [])
    })

    // Pin should be transitioning in
    expect(result.current.transitioningPins.length).toBe(1)
    expect(result.current.transitioningPins[0].id).toBe('pin-1')

    // Wait for transition to complete
    await waitFor(
      () => {
        // Pin should no longer be transitioning (now visible)
        expect(result.current.transitioningPins.length).toBe(0)
      },
      { timeout: 200 }
    )
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
    const { result } = renderHook(() => useMapPinState({ transitionDuration: 50 }))

    act(() => {
      result.current.processPins([mockPin], [])
    })

    // Wait for transition in
    await waitFor(
      () => {
        expect(result.current.pinStates.get('pin-1')?.visibility).toBe('visible')
      },
      { timeout: 200 }
    )

    // Manually update visibility
    act(() => {
      result.current.updatePinVisibility('pin-1', 'hidden')
    })

    const pinState = result.current.pinStates.get('pin-1')
    expect(pinState?.visibility).toBe('hidden')
    expect(pinState?.opacity).toBe(0)
  })
})

