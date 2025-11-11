import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

describe('discovery location hooks', () => {
  let mockFindNearestQuery: ReturnType<typeof vi.fn>
  let mockLocationCountsQuery: ReturnType<typeof vi.fn>

  const loadHooks = async () => {
    vi.resetModules()
    mockFindNearestQuery = vi.fn()
    mockLocationCountsQuery = vi.fn()

    vi.doMock('@app/core/utils/api', () => ({
      api: {
        map: {
          findNearestResults: {
            useQuery: (...args: unknown[]) => mockFindNearestQuery(...args),
          },
          getLocationCounts: {
            useQuery: (...args: unknown[]) => mockLocationCountsQuery(...args),
          },
        },
      },
    }))

    const locationModule = await import('../useLocationResultCounts')
    const nearestModule = await import('../useFindNearestResults')
    return {
      ...locationModule,
      ...nearestModule,
    }
  }

  afterEach(() => {
    vi.resetModules()
    vi.doUnmock('@app/core/utils/api')
  })

  it('expands radius when search has no results yet', async () => {
    const { useFindNearestResults } = await loadHooks()

    mockFindNearestQuery.mockReturnValue({
      data: {
        location: { lat: 35.1, lng: -80.9 },
        label: 'Alt Location',
        distance: 25,
        counts: { workers: 5, jobs: 3, employers: 2 },
      },
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() =>
      useFindNearestResults({ coordinates: { lat: 35, lng: -81 }, initialRadius: 25, maxAttempts: 2 }),
    )

    expect(mockFindNearestQuery).toHaveBeenCalledWith(
      { coordinates: { lat: 35, lng: -81 }, radius: 25 },
      expect.objectContaining({ enabled: true }),
    )

    act(() => {
      result.current.expandRadius()
    })
    expect(result.current.currentRadius).toBe(75)
    expect(result.current.attempts).toBe(1)

    act(() => {
      result.current.expandRadius()
    })

    expect(result.current.canExpand).toBe(false)
    expect(result.current.currentRadius).toBe(125)
    expect(result.current.attempts).toBe(2)

    act(() => {
      result.current.expandRadius()
    })

    expect(result.current.currentRadius).toBe(125)
    expect(result.current.attempts).toBe(2)
  })

  it('disables nearest results query when coordinates unavailable', async () => {
    const { useFindNearestResults } = await loadHooks()
    mockFindNearestQuery.mockReturnValue({ data: null, isLoading: false, error: null })

    renderHook(() => useFindNearestResults({ coordinates: null }))

    expect(mockFindNearestQuery).toHaveBeenCalledWith(
      { coordinates: { lat: 0, lng: 0 }, radius: 50 },
      expect.objectContaining({ enabled: false }),
    )
  })

  it('fetches location counts with calculated bounds', async () => {
    const { useLocationResultCounts } = await loadHooks()
    mockLocationCountsQuery.mockReturnValue({
      data: { workers: 12, jobs: 3, employers: 1, cached: false },
      isLoading: false,
      error: null,
    })

    const coordinates = { lat: 35, lng: -80 }
    renderHook(() =>
      useLocationResultCounts({ coordinates, city: 'Charlotte', state: 'NC', enabled: true }),
    )

    expect(mockLocationCountsQuery).toHaveBeenCalledWith(
      {
        city: 'Charlotte',
        state: 'NC',
        bounds: { north: 35.5, south: 34.5, east: -79.5, west: -80.5 },
      },
      expect.objectContaining({ enabled: true }),
    )
  })

  it('formats counts and location labels', async () => {
    const { formatCount, formatLocationWithCounts } = await loadHooks()

    expect(formatCount(420)).toBe('420')
    expect(formatCount('many')).toBe('Many results')

    expect(
      formatLocationWithCounts('Charlotte', 'NC', {
        workers: 420,
        jobs: 12,
        employers: 4,
        cached: false,
      }),
    ).toBe('Charlotte, NC - 420 workers, 12 jobs, 4 employers')

    expect(formatLocationWithCounts('Nowhere', 'ZZ')).toBe('Nowhere, ZZ')
  })
})
