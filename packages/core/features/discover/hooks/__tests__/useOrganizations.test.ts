import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase client - use vi.hoisted
const mockRpc = vi.hoisted(() => vi.fn())
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

import { useOrganizations } from '../useOrganizations'
import type { ViewportBounds } from '@app/ui'

describe('useOrganizations', () => {
  const mockBounds: ViewportBounds = {
    north: 43,
    south: 42,
    east: -70,
    west: -72,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSchema.mockReturnValue({
      rpc: mockRpc,
    })
    mockRpc.mockReturnValue({
      returns: mockReturns,
    })
    mockReturns.mockResolvedValue({
      data: [],
      error: null,
    })

    // Default mock that executes queryFn
    mockUseQuery.mockImplementation(async (options) => {
      const data = options?.queryFn ? await options.queryFn() : []
      return {
        data,
        isLoading: false,
        error: null,
      }
    })
  })

  it('calls RPC function correctly', () => {
    renderHook(() => useOrganizations({ bounds: mockBounds }))

    expect(mockRpc).toHaveBeenCalledWith('get_organizations_with_coords')
  })

  it('filters organizations by bounds in memory', async () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Org 1',
        slug: 'org-1',
        longitude: -71.0589, // Within bounds
        latitude: 42.3601,
        address: { city: 'Boston', state: 'MA' },
        employee_count_range: '10-50',
        industry_name: 'Technology',
      },
      {
        id: 'org-2',
        name: 'Org 2',
        slug: 'org-2',
        longitude: -100, // Outside bounds
        latitude: 50,
        address: null,
        employee_count_range: null,
        industry_name: null,
      },
    ]

    mockReturns.mockResolvedValue({
      data: mockOrgs,
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

    const { result } = renderHook(() => useOrganizations({ bounds: mockBounds }))

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
      // Only org-1 should be in results (org-2 is outside bounds)
      expect(result.current.data?.length).toBe(1)
      expect(result.current.data?.[0].id).toBe('org-1')
    })
  })

  it('enforces limit of 200', async () => {
    const manyOrgs = Array.from({ length: 300 }, (_, i) => ({
      id: `org-${i}`,
      name: `Org ${i}`,
      slug: `org-${i}`,
      longitude: -71.0589,
      latitude: 42.3601,
      address: null,
      employee_count_range: null,
      industry_name: null,
    }))

    mockReturns.mockResolvedValue({
      data: manyOrgs,
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

    const { result } = renderHook(() => useOrganizations({ bounds: mockBounds, limit: 300 }))

    await waitFor(() => {
      expect(result.current.data?.length).toBeLessThanOrEqual(200)
    })
  })

  it('transforms organizations correctly', async () => {
    const mockOrg = {
      id: 'org-1',
      name: 'Acme Corp',
      slug: 'acme-corp',
      longitude: -71.0589,
      latitude: 42.3601,
      address: { city: 'Boston', state: 'MA' },
      employee_count_range: '10-50',
      industry_name: 'Technology',
    }

    mockReturns.mockResolvedValue({
      data: [mockOrg],
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

    const { result } = renderHook(() => useOrganizations({ bounds: mockBounds }))

    await waitFor(() => {
      expect(result.current.data?.[0]).toMatchObject({
        id: 'org-1',
        name: 'Acme Corp',
        industry: 'Technology',
        coordinates: [-71.0589, 42.3601],
      })
    })
  })

  it('filters out invalid coordinates', async () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Valid Org',
        slug: 'valid-org',
        longitude: -71.0589,
        latitude: 42.3601,
        address: null,
        employee_count_range: null,
        industry_name: null,
      },
      {
        id: 'org-2',
        name: 'Invalid Org',
        slug: 'invalid-org',
        longitude: null,
        latitude: null,
        address: null,
        employee_count_range: null,
        industry_name: null,
      },
    ]

    mockReturns.mockResolvedValue({
      data: mockOrgs,
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

    const { result } = renderHook(() => useOrganizations({ bounds: mockBounds }))

    await waitFor(() => {
      // Only valid org should be included
      expect(result.current.data?.length).toBe(1)
      expect(result.current.data?.[0].id).toBe('org-1')
    })
  })

  it('handles RPC errors', () => {
    const error = { message: 'RPC error' }
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

    const { result } = renderHook(() => useOrganizations({ bounds: mockBounds }))

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

    const { result } = renderHook(() => useOrganizations({ bounds: mockBounds }))

    await waitFor(() => {
      expect(result.current.data).toEqual([])
    })
  })
})

