import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useToastController } from '@tamagui/toast'

import { useTeamFormOptions } from '../useTeamFormOptions'

const mockUseQuery = vi.fn()
const mockShow = vi.fn()

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({ show: mockShow }),
}))

vi.mock('@app/core/utils/api', () => ({
  api: {
    teams: {
      members: {
        roles: {
          useQuery: mockUseQuery,
        },
      },
    },
  },
}))

describe('useTeamFormOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockReturnValue({
      data: {
        roles: [
          { id: 'role-1', key: 'member', name: 'Member', description: 'Basic member' },
          { id: 'role-2', key: 'lead', name: 'Team Lead', description: 'Team leader' },
        ],
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    })
  })

  it('returns loading state when query is loading', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useTeamFormOptions({ organizationId: 'org-1' }))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.roles).toEqual([])
  })

  it('shows toast on error', async () => {
    const error = new Error('Failed to load roles')
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error,
      refetch: vi.fn(),
    })

    renderHook(() => useTeamFormOptions({ organizationId: 'org-1' }))

    await waitFor(() => {
      expect(mockShow).toHaveBeenCalledWith('Error', {
        message: 'Failed to load team roles',
      })
    })
  })

  it('transforms roles correctly', () => {
    const { result } = renderHook(() => useTeamFormOptions({ organizationId: 'org-1' }))

    expect(result.current.roles).toHaveLength(2)
    expect(result.current.roles[0]).toEqual({
      id: 'role-1',
      key: 'member',
      name: 'Member',
      description: 'Basic member',
    })
    expect(result.current.roles[1]).toEqual({
      id: 'role-2',
      key: 'lead',
      name: 'Team Lead',
      description: 'Team leader',
    })
  })

  it('disables query when organizationId is not provided', () => {
    renderHook(() => useTeamFormOptions({}))

    expect(mockUseQuery).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        enabled: false,
      }),
    )
  })

  it('enables query when organizationId is provided', () => {
    renderHook(() => useTeamFormOptions({ organizationId: 'org-1' }))

    expect(mockUseQuery).toHaveBeenCalledWith(
      { organizationId: 'org-1' },
      expect.objectContaining({
        enabled: true,
      }),
    )
  })

  it('exposes refetch function', () => {
    const mockRefetch = vi.fn()
    mockUseQuery.mockReturnValue({
      data: { roles: [] },
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useTeamFormOptions({ organizationId: 'org-1' }))

    expect(result.current.refetchRoles).toBe(mockRefetch)
  })

  it('handles empty roles array', () => {
    mockUseQuery.mockReturnValue({
      data: { roles: [] },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useTeamFormOptions({ organizationId: 'org-1' }))

    expect(result.current.roles).toEqual([])
  })

  it('handles null description', () => {
    mockUseQuery.mockReturnValue({
      data: {
        roles: [
          { id: 'role-1', key: 'member', name: 'Member', description: null },
        ],
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useTeamFormOptions({ organizationId: 'org-1' }))

    expect(result.current.roles[0].description).toBeNull()
  })
})

