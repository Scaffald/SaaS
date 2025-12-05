import { beforeEach, describe, expect, it, vi } from 'vitest'

const useQueryMock = vi.fn()
const useUserMock = vi.fn()
let capturedConfig: unknown
const eqMock = vi.fn()
const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
const fromMock = vi.fn().mockReturnValue({ select: selectMock })
const schemaMock = vi.fn().mockReturnValue({ from: fromMock })

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
}))

vi.mock('../useUser', () => ({
  useUser: useUserMock,
}))

vi.mock('../supabase/client', () => ({
  supabase: {
    schema: schemaMock,
  },
}))

describe('useOrganizations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedConfig = undefined
    schemaMock.mockReturnValue({ from: fromMock })
    fromMock.mockReturnValue({ select: selectMock })
    selectMock.mockReturnValue({ eq: eqMock })
  })

  it('configures react-query with the current user id', async () => {
    useUserMock.mockReturnValue({ user: { id: 'user-123' } })
    eqMock.mockResolvedValue({ data: [], error: null })
    useQueryMock.mockImplementation((config) => {
      capturedConfig = config
      return {} as unknown
    })

    const { useOrganizations } = await import('../useOrganizations')
    useOrganizations()
    const config = capturedConfig as { queryKey: unknown; enabled: boolean }

    expect(config.queryKey).toEqual(['organizations', 'user-123'])
    expect(config.enabled).toBe(true)
    expect(schemaMock).not.toHaveBeenCalled()
  })

  it('short-circuits query function when the user is missing', async () => {
    useUserMock.mockReturnValue({ user: null })
    useQueryMock.mockImplementation((config) => {
      capturedConfig = config
      return {} as unknown
    })

    const { useOrganizations } = await import('../useOrganizations')
    useOrganizations()
    const config = capturedConfig as { queryFn: () => Promise<unknown> }

    await expect(config.queryFn()).resolves.toEqual([])
    expect(schemaMock).not.toHaveBeenCalled()
  })

  it('transforms Supabase rows into memberships sorted by name', async () => {
    useUserMock.mockReturnValue({ user: { id: 'user-123' } })
    const sampleRows = [
      {
        user_id: 'user-123',
        created_at: '2024-01-01',
        teams: {
          organizations: {
            id: 'org-b',
            name: 'Beta Org',
            slug: 'beta',
          },
        },
      },
      {
        user_id: 'user-123',
        created_at: '2024-02-01',
        teams: {
          organizations: {
            id: 'org-a',
            name: 'Alpha Org',
            slug: 'alpha',
          },
        },
      },
      {
        user_id: 'user-123',
        created_at: '2024-03-01',
        teams: {
          organizations: null,
        },
      },
    ]
    eqMock.mockResolvedValue({ data: sampleRows, error: null })
    useQueryMock.mockImplementation((config) => {
      capturedConfig = config
      return {} as unknown
    })

    const { useOrganizations } = await import('../useOrganizations')
    useOrganizations()
    const config = capturedConfig as { queryFn: () => Promise<unknown> }

    const result = await config.queryFn()

    expect(schemaMock).toHaveBeenCalledWith('core')
    expect(fromMock).toHaveBeenCalledWith('team_members')
    expect(selectMock).toHaveBeenCalled()
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-123')
    expect(result).toEqual([
      {
        organization_id: 'org-a',
        organization_name: 'Alpha Org',
        organization_slug: 'alpha',
        user_id: 'user-123',
        role: 'member',
        joined_at: '2024-02-01',
      },
      {
        organization_id: 'org-b',
        organization_name: 'Beta Org',
        organization_slug: 'beta',
        user_id: 'user-123',
        role: 'member',
        joined_at: '2024-01-01',
      },
    ])
  })

  it('throws when Supabase returns an error', async () => {
    useUserMock.mockReturnValue({ user: { id: 'user-123' } })
    eqMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    useQueryMock.mockImplementation((config) => {
      capturedConfig = config
      return {} as unknown
    })

    const { useOrganizations } = await import('../useOrganizations')
    useOrganizations()
    const config = capturedConfig as { queryFn: () => Promise<unknown> }

    await expect(config.queryFn()).rejects.toThrowError('boom')
  })
})


