import type { User } from '@supabase/auth-js'
import { act, cleanup, render } from '@testing-library/react-native'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProtectedRoute } from '../useProtectedRoute'

const mockReplace = vi.hoisted(() => vi.fn())
let mockSegments: string[] = []
const useUserMock = vi.hoisted(() => vi.fn<[], MockUseUserState>())

vi.mock('../../useUser', () => ({
  useUser: useUserMock,
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => mockSegments,
}))

type MockUseUserState = {
  session: unknown
  user: User | undefined
  profile: unknown
  avatarUrl: string
  updateProfile: () => Promise<unknown>
  isLoadingSession: boolean
  isLoadingProfile: boolean
  isLoading: boolean
  isPending: boolean
}

const createSupabaseUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  identities: [],
  factors: [],
  email: 'test@example.com',
  ...overrides,
})

const mockUpdateProfile = async () => undefined

const baseUseUserValue: MockUseUserState = {
  session: null,
  user: undefined,
  profile: null,
  avatarUrl: '',
  updateProfile: mockUpdateProfile,
  isLoadingSession: false,
  isLoadingProfile: false,
  isLoading: false,
  isPending: false,
}

const buildUseUserReturn = (overrides: Partial<MockUseUserState>): MockUseUserState => ({
  ...baseUseUserValue,
  ...overrides,
})

type TestComponentProps = {
  dependencyLoadingStates?: boolean[]
  timeoutMs?: number
  suppressTimeout?: boolean
  onLoadingChange?: (isLoading: boolean) => void
}

function TestComponent({
  dependencyLoadingStates,
  timeoutMs,
  suppressTimeout,
  onLoadingChange,
}: TestComponentProps) {
  const state = useProtectedRoute({
    dependencyLoadingStates,
    timeoutMs,
    suppressTimeout,
  })

  useEffect(() => {
    onLoadingChange?.(state.isLoading)
  }, [state.isLoading, onLoadingChange])

  return null
}

describe('useProtectedRoute', () => {
  beforeEach(() => {
    mockSegments = []
    mockReplace.mockReset()
    useUserMock.mockReset()
    useUserMock.mockReturnValue(baseUseUserValue)
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('keeps loading while additional dependency is pending', () => {
    useUserMock.mockReturnValue(
      buildUseUserReturn({
        user: createSupabaseUser(),
        isPending: false,
      })
    )

    let latestLoading = false
    const { rerender } = render(
      <TestComponent
        dependencyLoadingStates={[true]}
        suppressTimeout
        onLoadingChange={(value) => {
          latestLoading = value
        }}
      />
    )

    expect(latestLoading).toBe(true)

    rerender(
      <TestComponent
        dependencyLoadingStates={[false]}
        suppressTimeout
        onLoadingChange={(value) => {
          latestLoading = value
        }}
      />
    )

    expect(latestLoading).toBe(false)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('triggers timeout redirect when auth stays pending', async () => {
    mockSegments = ['office']
    useUserMock.mockReturnValue(
      buildUseUserReturn({
        user: undefined,
        isPending: true,
      })
    )

    render(<TestComponent timeoutMs={100} onLoadingChange={() => {}} />)

    expect(mockReplace).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(150)
    })

    expect(mockReplace).toHaveBeenCalledWith('/auth')
  })

  it('does not trigger timeout when suppressed', async () => {
    mockSegments = ['office']
    useUserMock.mockReturnValue(
      buildUseUserReturn({
        user: undefined,
        isPending: true,
      })
    )

    render(<TestComponent timeoutMs={50} suppressTimeout onLoadingChange={() => {}} />)

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(mockReplace).not.toHaveBeenCalled()
  })
})
