import type { Session, SessionContext as SessionContextHelper } from '@supabase/auth-helpers-react'
import { AuthError, type User } from '@supabase/supabase-js'
import { supabase } from '@app/core/utils/supabase/client'
import { createContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'

import { AuthStateChangeHandler } from './AuthStateChangeHandler'
import { ROUTES, AUTH_ROUTES } from '@app/core/constants/routes'

// Use Expo Router for all platforms (including web)
import { router, useSegments } from 'expo-router'

export type AuthProviderProps = {
  initialSession?: Session | null
  children?: React.ReactNode
}

export const SessionContext = createContext<SessionContextHelper>({
  session: null,
  error: null,
  isLoading: false,
  supabaseClient: supabase,
})

export const AuthProvider = ({ children, initialSession }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(initialSession || null)
  const [error, setError] = useState<AuthError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Use protected route logic on all platforms with Expo Router
  useProtectedRoute(session?.user ?? null)

  useEffect(() => {
    setIsLoading(true)
    supabase.auth
      .getSession()
      .then(({ data: { session: newSession } }) => {
        setSession(newSession)
      })
      .catch((error) => setError(new AuthError(error.message)))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <SessionContext.Provider
      value={
        session
          ? {
              session,
              isLoading: false,
              error: null,
              supabaseClient: supabase,
            }
          : error
            ? {
                error,
                isLoading: false,
                session: null,
                supabaseClient: supabase,
              }
            : {
                error: null,
                isLoading,
                session: null,
                supabaseClient: supabase,
              }
      }
    >
      <AuthStateChangeHandler />
      {children}
    </SessionContext.Provider>
  )
}

// Protected route logic - works on all platforms with Expo Router
export function useProtectedRoute(user: User | null) {
  const segments = useSegments()

  useEffect(() => {
    const inAuthGroup = segments[0] === 'auth'

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !user &&
      !inAuthGroup
    ) {
      // Redirect to the auth page.
      replaceRoute(AUTH_ROUTES.INDEX?.fullPath || '/auth')
    } else if (user && inAuthGroup) {
      // Redirect away from the sign-in page.
      replaceRoute('/')
    }
  }, [user, segments])
}

/**
 * Unified route replacement using Expo Router for all platforms
 * Includes platform-specific optimizations where needed
 */
const replaceRoute = (href: string) => {
  if (Platform.OS === 'web') {
    // Web: Use Expo Router directly (no timeout needed)
    router.replace(href)
  } else {
    // Native: Use timeout fix for Expo Router issues
    setTimeout(() => {
      router.replace(href)
    }, 1)
  }
}
