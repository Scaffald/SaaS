import { supabase } from '@app/core/utils/supabase/client'
import { createContext, useEffect, useState, ReactNode, useCallback } from 'react'

import { AuthStateChangeHandler } from './AuthStateChangeHandler'

// Modern Supabase types with fallbacks for compatibility
type Session = any // Will be properly typed when Supabase types are available
type SupabaseAuthError = {
  message: string
  status?: number
} | null

export type SessionContextHelper = {
  session: Session | null
  error: SupabaseAuthError | null
  isLoading: boolean
  supabaseClient: typeof supabase
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

export type AuthProviderProps = {
  initialSession?: Session | null
  children?: ReactNode
}

export const SessionContext = createContext<SessionContextHelper | null>(null)

export const AuthProvider = ({ children, initialSession }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(initialSession || null)
  const [error, setError] = useState<SupabaseAuthError | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Enhanced signOut function
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(error)
        console.error('Sign out error:', error)
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err)
      setError(err as SupabaseAuthError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Enhanced session refresh function
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        setError(error)
        console.error('Session refresh error:', error)
      } else if (data.session) {
        setSession(data.session)
      }
    } catch (err) {
      console.error('Unexpected session refresh error:', err)
      setError(err as SupabaseAuthError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial session fetch with better error handling
  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const { data, error } = await supabase.auth.getSession()
        
        if (mounted) {
          if (error) {
            console.error('Get session error:', error)
            setError(error)
          } else {
            setSession(data.session)
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Unexpected session fetch error:', err)
          setError(err as SupabaseAuthError)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    return () => {
      mounted = false
    }
  }, [])

  // Auth state change listener with proper typing
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, newSession: Session | null) => {
      console.log('Auth state change:', event, newSession?.user?.id)
      setSession(newSession)
      setError(null) // Clear errors on successful auth state change
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const contextValue: SessionContextHelper = {
    session,
    error,
    isLoading,
    supabaseClient: supabase,
    signOut,
    refreshSession,
  }

  return (
    <SessionContext.Provider value={contextValue}>
      <AuthStateChangeHandler />
      {children}
    </SessionContext.Provider>
  )
}
