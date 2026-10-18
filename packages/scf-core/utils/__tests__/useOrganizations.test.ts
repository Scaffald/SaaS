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

  // How the three sources merge is tested without mocks, against the pure
  // function, in organization-memberships.test.ts (#1312).
})
