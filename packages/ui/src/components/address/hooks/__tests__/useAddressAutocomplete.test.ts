import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dependencies before importing the hook
const mockProvider = {
  search: vi.fn(),
  geocode: vi.fn(),
  reverseGeocode: vi.fn(),
}

let mockIsReady = true

vi.mock('../useGeocodingProvider', () => ({
  useGeocodingProvider: () => ({
    provider: mockProvider,
    isReady: mockIsReady,
    error: null,
  }),
}))

vi.mock('../useDebounce', () => ({
  useAddressDebounce: (query: string, _delay: number) => query,
  useAddressDebouncedCallback: vi.fn(),
}))

import type { AddressResult, UseAddressAutocompleteReturn } from '../../types'
import { useAddressAutocomplete } from '../useAddressAutocomplete'

describe('useAddressAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const triggerSearch = async (
    result: { current: UseAddressAutocompleteReturn },
    query: string
  ) => {
    await act(async () => {
      result.current.search(query)
      await Promise.resolve()
    })
  }

  it('initializes with empty state', () => {
    const { result } = renderHook(() =>
      useAddressAutocomplete({ provider: mockProvider, debounceMs: 0 })
    )

    expect(result.current.results).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('executes search after debounce delay', async () => {
    const mockResults: AddressResult[] = [
      {
        id: 'test-1',
        formattedAddress: 'Boston, MA',
        streetNumber: '',
        route: 'Boston',
        streetAddress: 'Boston',
        locality: 'Boston',
        administrativeAreaLevel1: 'Massachusetts',
        stateAbbreviation: 'MA',
        postalCode: '',
        country: 'United States',
        countryCode: 'US',
        coordinates: { lat: 42.3601, lng: -71.0589 },
        types: ['locality'],
      },
    ]

    mockProvider.search.mockResolvedValue(mockResults)

    const { result } = renderHook(() =>
      useAddressAutocomplete({ provider: mockProvider, debounceMs: 0 })
    )

    await triggerSearch(result, 'Boston')

    await waitFor(() => {
      expect(mockProvider.search).toHaveBeenCalledWith('Boston', expect.any(Object))
    })

    await waitFor(() => {
      expect(result.current.results).toEqual(mockResults)
    })
  })

  it('stores results in state', async () => {
    const mockResults: AddressResult[] = [
      {
        id: 'test-1',
        formattedAddress: 'Boston, MA',
        streetNumber: '',
        route: 'Boston',
        streetAddress: 'Boston',
        locality: 'Boston',
        administrativeAreaLevel1: 'Massachusetts',
        stateAbbreviation: 'MA',
        postalCode: '',
        country: 'United States',
        countryCode: 'US',
        coordinates: { lat: 42.3601, lng: -71.0589 },
        types: ['locality'],
      },
    ]

    mockProvider.search.mockResolvedValue(mockResults)

    const { result } = renderHook(() =>
      useAddressAutocomplete({ provider: mockProvider, debounceMs: 0 })
    )

    await triggerSearch(result, 'Boston')

    await waitFor(() => {
      expect(result.current.results).toEqual(mockResults)
    })
  })

  it('updates loading state correctly', async () => {
    let resolveSearch!: (value: AddressResult[]) => void
    const searchPromise = new Promise<AddressResult[]>((resolve) => {
      resolveSearch = resolve
    })
    mockProvider.search.mockReturnValue(searchPromise)

    const { result } = renderHook(() =>
      useAddressAutocomplete({ provider: mockProvider, debounceMs: 0 })
    )

    await triggerSearch(result, 'Boston')

    // Wait for debounced query to trigger search
    await waitFor(
      () => {
        expect(result.current.loading).toBe(true)
      },
      { timeout: 2000 }
    )

    // Resolve the search
    resolveSearch([])

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('captures and stores errors', async () => {
    const error = new Error('Search failed')
    mockProvider.search.mockRejectedValue(error)

    const { result } = renderHook(() =>
      useAddressAutocomplete({ provider: mockProvider, debounceMs: 0 })
    )

    await triggerSearch(result, 'Boston')

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.results).toEqual([])
    })
  })

  it('clears results when clearResults is called', async () => {
    const mockResults: AddressResult[] = [
      {
        id: 'test-1',
        formattedAddress: 'Boston, MA',
        streetNumber: '',
        route: 'Boston',
        streetAddress: 'Boston',
        locality: 'Boston',
        administrativeAreaLevel1: 'Massachusetts',
        stateAbbreviation: 'MA',
        postalCode: '',
        country: 'United States',
        countryCode: 'US',
        coordinates: { lat: 42.3601, lng: -71.0589 },
        types: ['locality'],
      },
    ]

    mockProvider.search.mockResolvedValue(mockResults)

    const { result } = renderHook(() =>
      useAddressAutocomplete({ provider: mockProvider, debounceMs: 0 })
    )

    await triggerSearch(result, 'Boston')

    await waitFor(
      () => {
        expect(result.current.results).toEqual(mockResults)
      },
      { timeout: 2000 }
    )

    act(() => {
      result.current.clearResults()
    })

    // clearResults sets results to empty array, error to null, and query to ''
    // The results should be cleared immediately
    await waitFor(() => {
      expect(result.current.results).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })

  it('cancels pending requests when clearResults is called', async () => {
    const abortSpy = vi.fn()
    const originalAbortController = globalThis.AbortController

    // Mock AbortController as a class constructor
    class MockAbortController {
      abort = abortSpy
      signal = { aborted: false }
    }
    globalThis.AbortController = MockAbortController as any

    let resolveSearch: (() => void) | undefined
    mockProvider.search.mockImplementation(
      () =>
        new Promise<unknown>((resolve) => {
          resolveSearch = () => resolve([])
        })
    )

    const { result } = renderHook(() =>
      useAddressAutocomplete({ provider: mockProvider, debounceMs: 0 })
    )

    await triggerSearch(result, 'Boston')

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })

    act(() => {
      result.current.clearResults()
    })

    resolveSearch?.()

    // Abort should be called when clearing
    await waitFor(
      () => {
        expect(abortSpy).toHaveBeenCalled()
      },
      { timeout: 1000 }
    )

    // Restore original
    globalThis.AbortController = originalAbortController
  })

  it('prevents search when query is shorter than minLength', async () => {
    const { result } = renderHook(() =>
      useAddressAutocomplete({
        provider: mockProvider,
        minLength: 3,
        debounceMs: 0,
      })
    )

    await triggerSearch(result, 'Bo')

    await waitFor(() => {
      expect(mockProvider.search).not.toHaveBeenCalled()
    })
  })

  it('limits results to maxResults', async () => {
    const manyResults: AddressResult[] = Array.from({ length: 10 }, (_, i) => ({
      id: `test-${i}`,
      formattedAddress: `City ${i}, MA`,
      streetNumber: '',
      route: `City ${i}`,
      streetAddress: `City ${i}`,
      locality: `City ${i}`,
      administrativeAreaLevel1: 'Massachusetts',
      stateAbbreviation: 'MA',
      postalCode: '',
      country: 'United States',
      countryCode: 'US',
      coordinates: { lat: 42.3601, lng: -71.0589 },
      types: ['locality'],
    }))

    mockProvider.search.mockResolvedValue(manyResults)

    const { result } = renderHook(() =>
      useAddressAutocomplete({
        provider: mockProvider,
        maxResults: 5,
        debounceMs: 0,
      })
    )

    await triggerSearch(result, 'City')

    await waitFor(() => {
      expect(result.current.results).toHaveLength(5)
    })
  })

  it('handles provider not ready state', async () => {
    mockIsReady = false
    const { result, rerender } = renderHook(() =>
      useAddressAutocomplete({ provider: mockProvider, debounceMs: 0 })
    )

    await triggerSearch(result, 'Boston')

    await waitFor(() => {
      expect(result.current.error).toBe('Geocoding provider not available')
      expect(result.current.loading).toBe(false)
    })

    // Reset for other tests
    mockIsReady = true
  })
})
