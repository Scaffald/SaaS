import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef } from 'react'

import { useProtectedRoute } from './useProtectedRoute'
import { useUserRoles } from './useUserRoles'

type UseRoleProtectedRouteOptions = {
  unauthorizedRedirectPath?: string
  onAuthorizationFailure?: (context: { requiredRoles: string[]; userRoles: string[] }) => void
  suppressLogging?: boolean
  /**
   * False makes the hook a no-op that never redirects. Hooks cannot be called
   * conditionally, so a layout that must let one path through (the office
   * layout's redirects for the old pipeline URLs, #1312) turns it off instead.
   */
  enabled?: boolean
}

const DEFAULT_REDIRECT_PATH = '/dashboard'

export function useRoleProtectedRoute(
  requiredRoles: string[],
  options: UseRoleProtectedRouteOptions = {}
) {
  const {
    unauthorizedRedirectPath = DEFAULT_REDIRECT_PATH,
    onAuthorizationFailure,
    suppressLogging = false,
    enabled = true,
  } = options
  const router = useRouter()

  const requiredRolesKey = useMemo(() => {
    const uniqueRoles = Array.from(new Set(requiredRoles))
    uniqueRoles.sort()
    return uniqueRoles.join(',')
  }, [requiredRoles])

  const normalizedRoles = useMemo(
    () => (requiredRolesKey.length > 0 ? requiredRolesKey.split(',') : []),
    [requiredRolesKey]
  )

  const shouldCheckRoles = normalizedRoles.length > 0

  const {
    roles,
    isLoading: rolesLoading,
    isError: rolesError,
    error: rolesErrorDetails,
    refetch,
  } = useUserRoles()

  const dependencyLoadingStates = useMemo(
    () => (shouldCheckRoles && !rolesError ? [rolesLoading] : []),
    [rolesLoading, rolesError, shouldCheckRoles]
  )

  const { isAuthenticated, isLoading: authLoading } = useProtectedRoute({
    dependencyLoadingStates,
  })

  const hasRequiredRole = useMemo(
    () => normalizedRoles.some((role) => roles.includes(role)),
    [normalizedRoles, roles]
  )

  const isCheckingRoles = shouldCheckRoles && isAuthenticated && rolesLoading && !rolesError
  const isLoading = authLoading || isCheckingRoles
  const hasRedirectedRef = useRef(false)
  const lastStateRef = useRef<{
    authorized: boolean
    error: boolean
  } | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      hasRedirectedRef.current = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!enabled || isLoading || !isAuthenticated) {
      return
    }

    if (rolesError) {
      if (!suppressLogging) {
        console.warn('[useRoleProtectedRoute] Role fetch error detected', {
          requiredRoles: normalizedRoles,
          error: rolesErrorDetails?.message ?? 'Unknown error',
        })
      }
      return
    }

    if (hasRequiredRole) {
      hasRedirectedRef.current = false
      if (!suppressLogging) {
        const previous = lastStateRef.current?.authorized ?? null
        if (previous !== true) {
          console.log('[useRoleProtectedRoute] Access granted', {
            requiredRoles: normalizedRoles,
            userRoles: roles,
          })
        }
      }
      lastStateRef.current = { authorized: true, error: false }
      return
    }

    if (onAuthorizationFailure) {
      onAuthorizationFailure({
        requiredRoles: normalizedRoles,
        userRoles: roles,
      })
    }

    if (!hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      if (!suppressLogging) {
        console.warn('[useRoleProtectedRoute] Access denied - redirecting to fallback route', {
          requiredRoles: normalizedRoles,
          userRoles: roles,
          redirectPath: unauthorizedRedirectPath,
        })
      }
      router.replace(unauthorizedRedirectPath)
    }

    lastStateRef.current = { authorized: false, error: false }
  }, [
    enabled,
    isLoading,
    isAuthenticated,
    hasRequiredRole,
    rolesError,
    rolesErrorDetails,
    normalizedRoles,
    roles,
    router,
    unauthorizedRedirectPath,
    onAuthorizationFailure,
    suppressLogging,
  ])

  return {
    isAuthorized: hasRequiredRole,
    isAuthenticated,
    isLoading,
    roles,
    isError: rolesError,
    error: rolesErrorDetails,
    refetchRoles: refetch,
    requiredRoles: normalizedRoles,
    requiredRolesKey,
  }
}
