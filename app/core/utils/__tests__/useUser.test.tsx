import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Database } from '@app/supabase/types'
import { createSupabaseClientStub } from '@app/test-utils'

vi.mock('../supabase/useSupabase', () => ({
  useSupabase: vi.fn(),
}))

vi.mock('../supabase/useSessionContext', () => ({
  useSessionContext: vi.fn(),
}))

vi.mock('../useProfileVerifications', () => ({
  useProfileVerifications: vi.fn(),
}))

import { useSupabase } from '../supabase/useSupabase'
import { useSessionContext } from '../supabase/useSessionContext'
import { useProfileVerifications } from '../useProfileVerifications'
import { useUser } from '../useUser'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

type RenderOptions = {
  session?: Session | null
  profileResponse?: {
    data: ProfileRow | null
    error: unknown
    status?: number
  }
  retryAttempts?: number | false
  verificationOverrides?: Partial<ReturnType<typeof useProfileVerifications>>
}

type WrapperProps = {
  children: ReactNode
}

const createSession = (overrides: Partial<Session['user']> = {}): Session =>
  ({
    user: {
      id: 'user-123',
      email: 'user@example.com',
      user_metadata: {},
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      role: 'authenticated',
      ...overrides,
    },
  } as Session)

const createProfile = (overrides: Partial<ProfileRow> = {}): ProfileRow =>
  ({
    id: 'user-123',
    user_id: 'user-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    avatar_url: null,
    name: null,
    profile_complete: false,
    searchable: true,
    ...overrides,
  } as ProfileRow)

const createQueryClient = (retry: number | false = false) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry,
      },
    },
  })

const createProfileVerificationsState = (
  overrides: Partial<ReturnType<typeof useProfileVerifications>> = {}
) => ({
  records: [],
  activeByField: {},
  activeFields: [],
  isVerified: vi.fn().mockReturnValue(false),
  isPending: false,
  refetch: vi.fn(),
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

const renderUseUser = (options: RenderOptions = {}) => {
  const session = options.session ?? createSession()
  const profileResponse =
    options.profileResponse ?? ({ data: null, error: null, status: 200 } as const)

  const maybeSingleMock = vi
    .fn()
    .mockResolvedValue({
      data: profileResponse.data,
      error: profileResponse.error,
      status: profileResponse.status,
    })

  const fromMock = vi.fn((table: string) => {
    if (table !== 'profiles') {
      throw new Error(`Unexpected table: ${table}`)
    }

    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: maybeSingleMock,
    }
  })

  const signOutMock = vi.fn()
  const { client: supabase } = createSupabaseClientStub<Database>({
    from: fromMock,
    auth: { signOut: signOutMock } as unknown,
  })

  vi.mocked(useSupabase).mockReturnValue(supabase)
  vi.mocked(useSessionContext).mockReturnValue({
    session,
    isLoading: false,
  })
  vi.mocked(useProfileVerifications).mockReturnValue(
    createProfileVerificationsState(options.verificationOverrides ?? {})
  )

  const queryClient = createQueryClient(options.retryAttempts)

  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const rendered = renderHook(() => useUser(), { wrapper })

  return {
    rendered,
    queryClient,
    maybeSingleMock,
    signOutMock,
  }
}

describe('useUser', () => {
  it('returns the profile, session, and avatar URL from Supabase', async () => {
    const profile = createProfile({ avatar_url: 'https://cdn.example.com/avatar.png' })

    const { rendered, queryClient } = renderUseUser({
      profileResponse: { data: profile, error: null, status: 200 },
    })

    await waitFor(() => expect(rendered.result.current.isPending).toBe(false))

    expect(rendered.result.current.user?.id).toBe('user-123')
    expect(rendered.result.current.profile).toEqual(profile)
    expect(rendered.result.current.avatarUrl).toBe('https://cdn.example.com/avatar.png')
    expect(rendered.result.current.verifications.records).toEqual([])

    queryClient.clear()
  })

  it('uses the session metadata avatar when the profile image is missing', async () => {
    const session = createSession({
      user_metadata: { avatar_url: 'https://avatars.example.com/user-meta.png' },
    })

    const profile = createProfile({ avatar_url: null })

    const { rendered, queryClient } = renderUseUser({
      session,
      profileResponse: { data: profile, error: null, status: 200 },
    })

    await waitFor(() => expect(rendered.result.current.isPending).toBe(false))

    expect(rendered.result.current.avatarUrl).toBe(
      'https://avatars.example.com/user-meta.png'
    )

    queryClient.clear()
  })

  it('generates a ui-avatars URL when no avatar can be found', async () => {
    const session = createSession({
      email: 'person@example.com',
      user_metadata: {},
    })

    const { rendered, queryClient } = renderUseUser({
      session,
      profileResponse: { data: null, error: null, status: 200 },
    })

    await waitFor(() => expect(rendered.result.current.isPending).toBe(false))

    expect(rendered.result.current.avatarUrl).toContain('https://ui-avatars.com/api.jpg?')
    expect(rendered.result.current.avatarUrl).toContain('name=person%40example.com')

    queryClient.clear()
  })

  it('returns a null profile without retrying when Supabase reports a 404', async () => {
    const { rendered, queryClient, maybeSingleMock, signOutMock } = renderUseUser({
      profileResponse: {
        data: null,
        error: { code: 'PGRST404', message: 'Profile not found' },
        status: 404,
      },
      retryAttempts: 2,
    })

    await waitFor(() => expect(rendered.result.current.isPending).toBe(false))

    expect(rendered.result.current.profile).toBeNull()
    expect(maybeSingleMock).toHaveBeenCalledTimes(1)
    expect(signOutMock).not.toHaveBeenCalled()

    queryClient.clear()
  })
})
