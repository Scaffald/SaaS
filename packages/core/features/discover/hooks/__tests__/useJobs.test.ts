import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase client - use vi.hoisted
const mockFrom = vi.hoisted(() => vi.fn())
const mockSelect = vi.hoisted(() => vi.fn())
const mockEq = vi.hoisted(() => vi.fn())
const mockLimit = vi.hoisted(() => vi.fn())
const mockSchema = vi.hoisted(() => vi.fn())
const mockReturns = vi.hoisted(() => vi.fn())

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

import { useJobs } from '../useJobs'
import type { ViewportBounds } from '@app/ui'

describe('useJobs', () => {
  const mockBounds: ViewportBounds = {
    north: 43,
    south: 42,
    east: -70,
    west: -72,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up the chain properly
    mockReturns.mockResolvedValue({
      data: [],
      error: null,
    })
    mockLimit.mockReturnThis()
    mockEq.mockReturnThis()
    mockSelect.mockReturnValue({
      eq: mockEq,
      limit: mockLimit,
      returns: mockReturns,
    })
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    mockSchema.mockReturnValue({
      from: mockFrom,
    })

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })
  })

  it('filters by status="open"', () => {
    mockReturns.mockResolvedValue({
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

    renderHook(() => useJobs({ bounds: mockBounds }))

    expect(mockEq).toHaveBeenCalledWith('status', 'open')
  })

  it('filters jobs by bounds in memory', async () => {
    const mockJobs = [
      {
        id: 'job-1',
        title: 'Software Engineer',
        organization_id: 'org-1',
        employment_type: 'full-time',
        remote_option: 'hybrid',
        location: 'Boston, MA',
        address: {
          longitude: -71.0589, // Within bounds
          latitude: 42.3601,
          city: 'Boston',
          state: 'MA',
        },
        pay_range_min_cents: 50000,
        pay_range_max_cents: 80000,
        pay_range_type: 'annual',
        status: 'open',
        position_level: 'mid',
        organizations: { name: 'Acme Corp' },
      },
      {
        id: 'job-2',
        title: 'Designer',
        organization_id: 'org-2',
        employment_type: null,
        remote_option: null,
        location: 'New York, NY',
        address: {
          longitude: -100, // Outside bounds
          latitude: 50,
        },
        pay_range_min_cents: null,
        pay_range_max_cents: null,
        pay_range_type: null,
        status: 'open',
        position_level: null,
        organizations: null,
      },
    ]

    mockReturns.mockResolvedValue({
      data: mockJobs,
      error: null,
    })

    mockUseQuery.mockImplementation(async (options) => {
      const data = options.queryFn ? await options.queryFn() : []
      return {
        data,
        isLoading: false,
        error: null,
      }
    })

    const { result } = renderHook(() => useJobs({ bounds: mockBounds }))

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
      // Only job-1 should be in results (job-2 is outside bounds)
      expect(result.current.data?.length).toBe(1)
      expect(result.current.data?.[0].id).toBe('job-1')
    })
  })

  it('enforces limit of 500', () => {
    mockReturns.mockResolvedValue({
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

    renderHook(() => useJobs({ bounds: mockBounds, limit: 1000 }))

    expect(mockLimit).toHaveBeenCalledWith(500)
  })

  it('transforms jobs correctly', async () => {
    const mockJob = {
      id: 'job-1',
      title: 'Software Engineer',
      organization_id: 'org-1',
      employment_type: 'full-time',
      remote_option: 'hybrid',
      location: 'Boston, MA',
      address: {
        longitude: -71.0589,
        latitude: 42.3601,
        city: 'Boston',
        state: 'MA',
      },
      pay_range_min_cents: 50000,
      pay_range_max_cents: 80000,
      pay_range_type: 'annual',
      status: 'open',
      position_level: 'mid',
      organizations: { name: 'Acme Corp' },
    }

    mockReturns.mockResolvedValue({
      data: [mockJob],
      error: null,
    })

    mockUseQuery.mockImplementation(async (options) => {
      const data = options.queryFn ? await options.queryFn() : []
      return {
        data,
        isLoading: false,
        error: null,
      }
    })

    const { result } = renderHook(() => useJobs({ bounds: mockBounds }))

    await waitFor(() => {
      expect(result.current.data?.[0]).toMatchObject({
        id: 'job-1',
        title: 'Software Engineer',
        organization_name: 'Acme Corp',
        coordinates: [-71.0589, 42.3601],
        status: 'open',
      })
    })
  })

  it('extracts coordinates from address JSONB', async () => {
    const mockJob = {
      id: 'job-1',
      title: 'Engineer',
      organization_id: 'org-1',
      employment_type: null,
      remote_option: null,
      location: null,
      address: {
        longitude: -71.0589,
        latitude: 42.3601,
      },
      pay_range_min_cents: null,
      pay_range_max_cents: null,
      pay_range_type: null,
      status: 'open',
      position_level: null,
      organizations: null,
    }

    mockReturns.mockResolvedValue({
      data: [mockJob],
      error: null,
    })

    mockUseQuery.mockImplementation(async (options) => {
      const data = options.queryFn ? await options.queryFn() : []
      return {
        data,
        isLoading: false,
        error: null,
      }
    })

    const { result } = renderHook(() => useJobs({ bounds: mockBounds }))

    await waitFor(() => {
      expect(result.current.data?.[0].coordinates).toEqual([-71.0589, 42.3601])
    })
  })

  it('filters out jobs without valid coordinates', async () => {
    const mockJobs = [
      {
        id: 'job-1',
        title: 'Valid Job',
        organization_id: 'org-1',
        employment_type: null,
        remote_option: null,
        location: null,
        address: {
          longitude: -71.0589,
          latitude: 42.3601,
        },
        pay_range_min_cents: null,
        pay_range_max_cents: null,
        pay_range_type: null,
        status: 'open',
        position_level: null,
        organizations: null,
      },
      {
        id: 'job-2',
        title: 'Invalid Job',
        organization_id: 'org-2',
        employment_type: null,
        remote_option: null,
        location: null,
        address: null, // No address/coordinates
        pay_range_min_cents: null,
        pay_range_max_cents: null,
        pay_range_type: null,
        status: 'open',
        position_level: null,
        organizations: null,
      },
    ]

    mockReturns.mockResolvedValue({
      data: mockJobs,
      error: null,
    })

    mockUseQuery.mockImplementation(async (options) => {
      const data = options.queryFn ? await options.queryFn() : []
      return {
        data,
        isLoading: false,
        error: null,
      }
    })

    const { result } = renderHook(() => useJobs({ bounds: mockBounds }))

    await waitFor(() => {
      // Only valid job should be included
      expect(result.current.data?.length).toBe(1)
      expect(result.current.data?.[0].id).toBe('job-1')
    })
  })

  it('handles database errors', () => {
    const error = { message: 'Database error' }
    mockReturns.mockResolvedValue({
      data: null,
      error,
    })

    mockUseQuery.mockImplementation(async (options) => {
      let queryError = null
      try {
        if (options.queryFn) {
          await options.queryFn()
        }
      } catch (err) {
        queryError = err
      }
      return {
        data: undefined,
        isLoading: false,
        error: queryError,
      }
    })

    const { result } = renderHook(() => useJobs({ bounds: mockBounds }))

    expect(result.current.error).toBeTruthy()
  })

  it('returns empty array for no results', async () => {
    mockReturns.mockResolvedValue({
      data: [],
      error: null,
    })

    mockUseQuery.mockImplementation(async (options) => {
      const data = options.queryFn ? await options.queryFn() : []
      return {
        data,
        isLoading: false,
        error: null,
      }
    })

    const { result } = renderHook(() => useJobs({ bounds: mockBounds }))

    await waitFor(() => {
      expect(result.current.data).toEqual([])
    })
  })
})

