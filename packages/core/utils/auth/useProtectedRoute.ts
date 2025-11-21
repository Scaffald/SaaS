import { ROUTES } from '@app/core/constants/routes'
import { useUser } from '@app/core/utils/useUser'
import { useRouter, useSegments } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'

type UseProtectedRouteOptions = {
  timeoutMs?: number
  suppressTimeout?: boolean
  dependencyLoadingStates?: boolean[]
  onTimeout?: () => void
}

/**
 * Hook to handle protected route navigation
 * This should be used in individual route components that need authentication
 */
export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { user, isPending } = useUser()
  const router = useRouter()
  const segments = useSegments()
  const [hasChecked, setHasChecked] = useState(false)
  const loadingStartTime = useRef<number>(Date.now())

  const { timeoutMs, suppressTimeout = false, dependencyLoadingStates = [], onTimeout } = options

  const timeoutDuration = timeoutMs ?? 10_000
  const isDependenciesLoading = dependencyLoadingStates.some(Boolean)

  const markChecked = useCallback(() => {
    setHasChecked(true)
  }, [])

  const isAuthLoading = isPending
  const isAnyLoading = isAuthLoading || isDependenciesLoading

  // Timeout protection: If loading for too long, assume session is invalid.
  // Timeout only applies when the auth session itself is still pending.
  useEffect(() => {
    if (!isAuthLoading) {
      return
    }

    loadingStartTime.current = Date.now()

    if (suppressTimeout) {
      return
    }

    if (hasChecked) {
      return
    }

    const timeoutId = setTimeout(() => {
      const loadingDuration = Date.now() - loadingStartTime.current

      if (loadingDuration >= timeoutDuration) {
        console.warn('[useProtectedRoute] Loading timeout exceeded - assuming invalid session', {
          timeoutMs: timeoutDuration,
          loadingDuration,
        })

        onTimeout?.()

        const inAuthGroup = segments[0] === 'auth'

        if (!inAuthGroup) {
          try {
            router.replace(ROUTES.AUTH.LOGIN.path)
            setHasChecked(true)
          } catch (error) {
            console.error('[useProtectedRoute] Timeout redirect error:', error)
          }
        }
      }
    }, timeoutDuration)

    return () => clearTimeout(timeoutId)
  }, [isAuthLoading, hasChecked, segments, router, timeoutDuration, suppressTimeout, onTimeout])

  useEffect(() => {
    if (isAuthLoading) {
      loadingStartTime.current = Date.now()
    }
  }, [isAuthLoading])

  useEffect(() => {
    // Don't check if still loading user data
    if (isAnyLoading) {
      return
    }

    // Don't check if we've already performed the check
    if (hasChecked) {
      return
    }

    const inAuthGroup = segments[0] === 'auth'

    // If user is not authenticated and not in auth group, redirect to auth
    if (!user && !inAuthGroup) {
      const performRedirect = () => {
        try {
          router.replace(ROUTES.AUTH.LOGIN.path)
          setHasChecked(true)
        } catch (error) {
          console.error('Protected route redirect error:', error)
        }
      }

      if (Platform.OS === 'web') {
        performRedirect()
      } else {
        // Small delay for native to ensure router is ready
        setTimeout(performRedirect, 50)
      }
    } else if (user && inAuthGroup) {
      // If user is authenticated but in auth group, redirect to dashboard
      const performRedirect = () => {
        try {
          router.replace(ROUTES.DASHBOARD.path)
          setHasChecked(true)
        } catch (error) {
          console.error('Auth redirect error:', error)
        }
      }

      if (Platform.OS === 'web') {
        performRedirect()
      } else {
        setTimeout(performRedirect, 50)
      }
    } else {
      // User is in the correct place, mark as checked
      setHasChecked(true)
    }
  }, [user, isAnyLoading, segments, hasChecked, router])

  return {
    isAuthenticated: !!user,
    isLoading: isAnyLoading || !hasChecked,
    markChecked,
    isAuthLoading,
    isDependenciesLoading,
    user,
  }
}
