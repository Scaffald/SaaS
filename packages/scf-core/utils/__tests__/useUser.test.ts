import { beforeEach, describe, expect, it, vi } from 'vitest'

const useQueryMock = vi.fn()
let capturedConfig: ReturnType<typeof useQueryMock> | undefined
const useSessionContextMock = vi.fn()
const signOutMock = vi.fn()
const schemaMock = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
}))

vi.mock('../supabase/useSessionContext', () => ({
  useSessionContext: useSessionContextMock,
}))

vi.mock('../supabase/client', () => {
  const eqMock = vi.fn()
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
  const fromMock = vi.fn().mockReturnValue({ select: selectMock })
  schemaMock.mockReturnValue({ from: fromMock })

  return {
    supabase: {
      schema: schemaMock,
      auth: {
        signOut: signOutMock,
      },
    },
  }
})

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedConfig = undefined
  })

  it('returns user and profile data from react-query', async () => {
    const profile = {
      id: 'user-123',
      display_name: 'Test User',
      avatar_path: 'https://example.com/avatar.png',
      about: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
    }
    const refetch = vi.fn()
    useSessionContextMock.mockReturnValue({
      session: {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          user_metadata: {},
        },
      },
      isLoading: false,
    })
    useQueryMock.mockImplementation((config) => {
      capturedConfig = config
      const { queryKey } = config
      expect(queryKey).toEqual(['profile', 'user-123'])
      return { data: profile, isPending: false, refetch }
    })

    const { useUser } = await import('../useUser')
    const result = useUser()

    expect(result.user?.id).toBe('user-123')
    expect(result.profile).toBe(profile)
    expect(result.avatarUrl).toBe('https://example.com/avatar.png')
    expect(result.isLoading).toBe(false)
    expect(result.isPending).toBe(false)
    result.updateProfile()
    expect(refetch).toHaveBeenCalled()
  })

  it('falls back to metadata avatar when profile image missing', async () => {
    useSessionContextMock.mockReturnValue({
      session: {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          user_metadata: { avatar_url: 'https://example.com/metadata.png' },
        },
      },
      isLoading: false,
    })
    useQueryMock.mockImplementation((config) => {
      capturedConfig = config
      return { data: null, isPending: false, refetch: vi.fn() }
    })

    const { useUser } = await import('../useUser')
    const result = useUser()

    expect(result.avatarUrl).toBe('https://example.com/metadata.png')
  })

  it('generates fallback avatar when no profile or metadata provided', async () => {
    useSessionContextMock.mockReturnValue({
      session: {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          user_metadata: {},
        },
      },
      isLoading: true,
    })
    useQueryMock.mockImplementation((config) => {
      capturedConfig = config
      return { data: null, isPending: true, refetch: vi.fn() }
    })

    const { useUser } = await import('../useUser')
    const result = useUser()

    expect(result.avatarUrl).toContain('https://ui-avatars.com/api.jpg?')
    expect(result.avatarUrl).toContain('name=user%40example.com')
    expect(result.isLoading).toBe(true)
    expect(result.isPending).toBe(true)
  })

  it('signs out when Supabase returns no rows', async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'no rows' },
    })
    const eqMock = vi.fn().mockReturnValue({ single: singleMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    const fromMock = vi.fn().mockReturnValue({ select: selectMock })
    schemaMock.mockReturnValue({ from: fromMock })

    const user = {
      id: 'user-123',
      email: 'user@example.com',
      user_metadata: {},
    }
    useSessionContextMock.mockReturnValue({
      session: { user },
      isLoading: false,
    })
    useQueryMock.mockImplementation((config) => {
      capturedConfig = config
      return { data: null, isPending: false, refetch: vi.fn() }
    })

    const { useUser } = await import('../useUser')
    useUser()

    await expect(capturedConfig?.queryFn()).resolves.toBeNull()
    expect(signOutMock).toHaveBeenCalledTimes(1)
  })
})


