import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const useProtectedRouteMock = vi.hoisted(() =>
  vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
  }))
)

const useUserRolesMock = vi.hoisted(() =>
  vi.fn(() => ({
    roles: ['office'],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }))
)

const routerReplaceMock = vi.hoisted(() => vi.fn())

vi.mock('../useProtectedRoute', () => ({
  useProtectedRoute: useProtectedRouteMock,
}))

vi.mock('../useUserRoles', () => ({
  useUserRoles: useUserRolesMock,
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({
    replace: routerReplaceMock,
  }),
}))

const { useRoleProtectedRoute } = await import('../useRoleProtectedRoute')

describe('useRoleProtectedRoute', () => {
  beforeEach(() => {
    useProtectedRouteMock.mockClear()
    useUserRolesMock.mockClear()
    routerReplaceMock.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('grants access when user has the required role', () => {
    const { result } = renderHook(() => useRoleProtectedRoute(['office']))

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isAuthorized).toBe(true)
    expect(result.current.requiredRoles).toEqual(['office'])
    expect(result.current.requiredRolesKey).toBe('office')
    expect(routerReplaceMock).not.toHaveBeenCalled()
  })

  it('normalizes duplicate roles into sorted unique list', () => {
    const { result } = renderHook(() =>
      useRoleProtectedRoute(['admin', 'office', 'admin', 'manager'])
    )

    expect(result.current.requiredRoles).toEqual(['admin', 'manager', 'office'])
    expect(result.current.requiredRolesKey).toBe('admin,manager,office')
  })

  it('redirects to fallback route when role is missing', async () => {
    const failureSpy = vi.fn()
    useUserRolesMock.mockReturnValueOnce({
      roles: ['basic'],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() =>
      useRoleProtectedRoute(['office'], {
        unauthorizedRedirectPath: '/auth',
        onAuthorizationFailure: failureSpy,
      })
    )

    expect(result.current.isAuthorized).toBe(false)

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalledWith('/auth')
    })

    expect(failureSpy).toHaveBeenCalledWith({
      requiredRoles: ['office'],
      userRoles: ['basic'],
    })
  })

  it('exposes refetch handler from useUserRoles', () => {
    const refetchSpy = vi.fn()
    useUserRolesMock.mockReturnValueOnce({
      roles: ['office'],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchSpy,
    })

    const { result } = renderHook(() => useRoleProtectedRoute(['office']))

    act(() => {
      result.current.refetchRoles()
    })

    expect(refetchSpy).toHaveBeenCalled()
  })
})

