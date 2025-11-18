import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase client - use vi.hoisted
const mockFrom = vi.hoisted(() => vi.fn())
const mockSelect = vi.hoisted(() => vi.fn())
const mockGte = vi.hoisted(() => vi.fn())
const mockLte = vi.hoisted(() => vi.fn())
const mockLimit = vi.hoisted(() => vi.fn())
const mockOrder = vi.hoisted(() => vi.fn())
const mockSchema = vi.hoisted(() => vi.fn())

const mockSupabaseClient = vi.hoisted(() => ({
  schema: mockSchema,
}))

vi.mock('@app/core/utils/supabase/client', () => ({
  supabase: mockSupabaseClient,
}))

// Mock React Query
const mockUseQuery = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
}))

import { useTalentProfiles } from '../useTalentProfiles'
import type { ViewportBounds } from '@app/ui'

describe('useTalentProfiles', () => {
  const mockBounds: ViewportBounds = {
    north: 43,
    south: 42,
    east: -70,
    west: -72,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up the chain properly
    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    })
    mockOrder.mockReturnThis()
    mockLte.mockReturnThis()
    mockGte.mockReturnThis()
    mockSelect.mockReturnValue({
      gte: mockGte,
      lte: mockLte,
      limit: mockLimit,
      order: mockOrder,
    })
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    mockSchema.mockReturnValue({
      from: mockFrom,
    })

    // Default mock - will be overridden by individual tests
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })
  })

  it('includes bounds in queryKey', () => {
    renderHook(() => useTalentProfiles({ bounds: mockBounds }))

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['talent-profiles', mockBounds],
      })
    )
  })

  it('applies bounds filter to Supabase query', async () => {
    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    })

    mockUseQuery.mockImplementation((options) => {
      // Execute queryFn to trigger the actual query
      if (options.queryFn) {
        options.queryFn()
      }
      return {
        data: [],
        isLoading: false,
        error: null,
      }
    })

    renderHook(() => useTalentProfiles({ bounds: mockBounds }))

    // Verify bounds filters are applied
    expect(mockGte).toHaveBeenCalledWith('longitude', mockBounds.west)
    expect(mockLte).toHaveBeenCalledWith('longitude', mockBounds.east)
    expect(mockGte).toHaveBeenCalledWith('latitude', mockBounds.south)
    expect(mockLte).toHaveBeenCalledWith('latitude', mockBounds.north)
  })

  it('enforces limit of 500', () => {
    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    })

    mockUseQuery.mockImplementation((options) => {
      // Execute queryFn to trigger the actual query
      if (options.queryFn) {
        options.queryFn()
      }
      return {
        data: [],
        isLoading: false,
        error: null,
      }
    })

    renderHook(() => useTalentProfiles({ bounds: mockBounds, limit: 1000 }))

    expect(mockLimit).toHaveBeenCalledWith(500)
  })

  it('transforms profiles correctly', async () => {
    const mockProfile = {
      id: 'profile-1',
      name: 'John Doe',
      headline: 'Software Engineer',
      gamified_score: 85,
      skills_summary: { skills: ['JavaScript', 'TypeScript'] },
      certifications: ['AWS Certified'],
      hourly_rate_cents: 5000,
      longitude: -71.0589,
      latitude: 42.3601,
      location: 'Boston, MA',
      years_of_experience: 5,
      calculatedYearsOfExperience: 5,
      avatar_url: 'https://example.com/avatar.jpg',
    }

    mockLimit.mockResolvedValue({
      data: [mockProfile],
      error: null,
    })

    const queryResult: { data: unknown; isLoading: boolean; error: Error | null } = {
      data: undefined,
      isLoading: true,
      error: null,
    }

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) {
        Promise.resolve(options.queryFn())
          .then((data) => {
            queryResult.data = data
            queryResult.isLoading = false
          })
          .catch((err) => {
            queryResult.error = err instanceof Error ? err : new Error(String(err))
            queryResult.isLoading = false
          })
      }
      return queryResult
    })

    const { result, rerender } = renderHook(() => useTalentProfiles({ bounds: mockBounds }))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      rerender()
    })

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
      expect(result.current.data?.[0]?.name).toBe('John Doe')
    }, { timeout: 3000 })
  })

  it('handles database errors', async () => {
    const error = { message: 'Database error' }
    mockLimit.mockResolvedValue({
      data: null,
      error,
    })

    const queryResult: { data: unknown; isLoading: boolean; error: Error | null } = {
      data: undefined,
      isLoading: true,
      error: null,
    }

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) {
        Promise.resolve(options.queryFn())
          .then(() => {
            queryResult.isLoading = false
          })
          .catch((err) => {
            queryResult.error = err instanceof Error ? err : new Error(String(err))
            queryResult.isLoading = false
          })
      }
      return queryResult
    })

    const { result, rerender } = renderHook(() => useTalentProfiles({ bounds: mockBounds }))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      rerender()
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    }, { timeout: 3000 })
  })

  it('returns empty array for no results', async () => {
    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    })

    const queryResult: { data: unknown; isLoading: boolean; error: Error | null } = {
      data: undefined,
      isLoading: true,
      error: null,
    }

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) {
        Promise.resolve(options.queryFn())
          .then((data) => {
            queryResult.data = data
            queryResult.isLoading = false
          })
          .catch((err) => {
            queryResult.error = err instanceof Error ? err : new Error(String(err))
            queryResult.isLoading = false
          })
      }
      return queryResult
    })

    const { result, rerender } = renderHook(() => useTalentProfiles({ bounds: mockBounds }))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      rerender()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([])
    }, { timeout: 3000 })
  })

  it('respects enabled flag', () => {
    renderHook(() => useTalentProfiles({ bounds: mockBounds, enabled: false }))

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    )
  })
})

