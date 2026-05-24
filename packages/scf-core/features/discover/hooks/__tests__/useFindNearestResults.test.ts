import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestQueryWrapper } from '@test-helpers/test-utils'

const mockUseQuery = vi.fn()

// Hook now uses '@scf/core/utils/map-sdk-hooks'.useFindNearestResults.
vi.mock('@scf/core/utils/map-sdk-hooks', () => ({
  useFindNearestResults: (...args: unknown[]) => mockUseQuery(...args),
}))

const { useFindNearestResults } = await import('../useFindNearestResults')

describe('useFindNearestResults', () => {
  beforeEach(() => {
    mockUseQuery.mockReset()
  })

  it('passes coordinates and options to the query client and returns nearest result data', () => {
    const queryResult = {
      data: {
        location: { lat: 35.2, lng: -80.8 },
        label: 'Charlotte, NC',
        distance: 12,
        counts: { workers: 4, jobs: 2, employers: 1 },
      },
      isLoading: false,
      error: undefined,
    }

    let capturedArgs: { input: unknown; options: unknown } | null = null
    mockUseQuery.mockImplementation((input: unknown, options: unknown) => {
      capturedArgs = { input, options }
      return queryResult
    })

    const { result } = renderHook(() =>
      useFindNearestResults({
        coordinates: { lat: 35.2, lng: -80.8 },
        initialRadius: 25,
        maxAttempts: 4,
      }),
      { wrapper: TestQueryWrapper },
    )

    // SDK now takes a flat { lat, lng, radius } input (no nested coordinates).
    expect(capturedArgs).toEqual({
      input: { lat: 35.2, lng: -80.8, radius: 25 },
      // wrapper no longer forwards an explicit staleTime; the SDK hook
      // owns the cache policy.
      options: expect.objectContaining({ enabled: true }),
    })

    expect(result.current.nearestResult).toEqual(queryResult.data)
    expect(result.current.currentRadius).toBe(25)
    expect(result.current.maxAttempts).toBe(4)
    expect(result.current.attempts).toBe(0)
  })

  it('disables the query when coordinates are missing', () => {
    let capturedArgs: { input: unknown; options: { enabled: boolean } } | null = null
    mockUseQuery.mockImplementation((input: unknown, options: { enabled: boolean }) => {
      capturedArgs = { input, options }
      return { data: null, isLoading: false, error: undefined }
    })

    renderHook(() =>
      useFindNearestResults({
        coordinates: null,
        initialRadius: 40,
        maxAttempts: 2,
      }),
      { wrapper: TestQueryWrapper },
    )

    // Null coordinates → SDK call is null input (not a zeroed-out coordinate).
    expect(capturedArgs).toEqual({
      input: null,
      options: expect.objectContaining({ enabled: false }),
    })
  })

  it('expands the radius up to the max attempts and stops afterwards', () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false, error: undefined })

    const { result } = renderHook(() =>
      useFindNearestResults({
        coordinates: { lat: 0, lng: 0 },
        initialRadius: 10,
        maxAttempts: 2,
      }),
      { wrapper: TestQueryWrapper },
    )

    expect(result.current.currentRadius).toBe(10)
    expect(result.current.attempts).toBe(0)
    expect(result.current.canExpand).toBe(true)

    act(() => {
      result.current.expandRadius()
    })

    expect(result.current.currentRadius).toBe(60)
    expect(result.current.attempts).toBe(1)
    expect(result.current.canExpand).toBe(true)

    act(() => {
      result.current.expandRadius()
    })

    expect(result.current.currentRadius).toBe(110)
    expect(result.current.attempts).toBe(2)
    expect(result.current.canExpand).toBe(false)

    act(() => {
      result.current.expandRadius()
    })

    expect(result.current.currentRadius).toBe(110)
    expect(result.current.attempts).toBe(2)
  })

  it('resets the radius and attempt counter to the initial values', () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false, error: undefined })

    const { result } = renderHook(() =>
      useFindNearestResults({
        coordinates: { lat: 0, lng: 0 },
        initialRadius: 15,
        maxAttempts: 3,
      }),
      { wrapper: TestQueryWrapper },
    )

    act(() => {
      result.current.expandRadius()
      result.current.expandRadius()
    })

    expect(result.current.currentRadius).toBe(115)
    expect(result.current.attempts).toBe(2)

    act(() => {
      result.current.reset()
    })

    expect(result.current.currentRadius).toBe(15)
    expect(result.current.attempts).toBe(0)
    expect(result.current.canExpand).toBe(true)
  })
})


