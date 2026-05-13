import { getGlobalQueryClient } from '@scf/core/provider/react-query'
import {
  alias as aliasAnalyticsUser,
  getAnalyticsClient,
  identify as identifyAnalyticsUser,
  initAnalytics,
  shutdownAnalytics,
} from '@scf/core/utils/analytics/client'
import { captureEventWithQueue, flushQueue } from '@scf/core/utils/analytics/queue'
import { clearAllAuthStorage } from '@scf/core/utils/auth/clearAuthStorage'
import { clearSentryUser, setSentryUser } from '@scf/core/utils/sentry'
import { supabase } from '@scf/core/utils/supabase/client'
import { useCookieConsentState } from '@scf/core/utils/cookieConsent'
import {
  requestTrackingAuthorization,
  useTrackingAuthorization,
} from '@scf/core/utils/privacy'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import type { Session } from '@supabase/auth-js'
import { createContext, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AuthStateChangeHandler } from './AuthStateChangeHandler'

// Modern Supabase types with fallbacks for compatibility
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
  clearAuth: () => Promise<void>
  refreshSession: () => Promise<void>
}

export type AuthProviderProps = {
  initialSession?: Session | null
  children?: ReactNode
}

export const SessionContext = createContext<SessionContextHelper | null>(null)

const ANALYTICS_ANONYMOUS_ID_STORAGE_KEY = 'analytics:anonymous_id'
const PERFORMANCE_CATEGORY_ID = 'performance'

export const AuthProvider = ({ children, initialSession }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(initialSession || null)
  const [error, setError] = useState<SupabaseAuthError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isReady: isConsentReady, hasConsentedTo } = useCookieConsentState()
  const hasPerformanceConsent = isConsentReady && hasConsentedTo(PERFORMANCE_CATEGORY_ID)
  // App Tracking Transparency (iOS). `canLinkIdentity` is true on platforms
  // where ATT does not apply (web, Android) and on iOS only when the user
  // tapped "Allow". When false we keep anonymous analytics flowing but skip
  // PostHog identify/alias and strip PII from Sentry — Apple's definition of
  // "tracking" is specifically about cross-app data linking, so anonymous
  // capture is allowed but linking to a stable user id is not.
  const {
    status: trackingStatus,
    isApplicable: isTrackingApplicable,
    canLinkIdentity: canLinkAnalyticsIdentity,
  } = useTrackingAuthorization()
  const hasRequestedTrackingRef = useRef(false)
  const lastSignedInUserRef = useRef<string | null>(null)
  const previousUserIdRef = useRef<string | null>(initialSession?.user?.id ?? null)
  const lastSignOutReasonRef = useRef<'sign_out' | 'auth_cleared' | 'consent_revoked' | null>(null)

  // Basic signOut function - clears Supabase auth only
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(error)
        console.error('Sign out error:', error)
        lastSignOutReasonRef.current = null
      } else {
        lastSignOutReasonRef.current = 'sign_out'
        await captureEventWithQueue('user_signed_out', { reason: 'sign_out' })
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err)
      setError(err as SupabaseAuthError)
      lastSignOutReasonRef.current = null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Comprehensive clearAuth function - clears ALL auth storage
  // Use this for complete cleanup (logout, session expiry, unauthorized errors)
  const clearAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('[AuthProvider] Performing comprehensive auth cleanup')

      const queryClient = getGlobalQueryClient()
      await clearAllAuthStorage(queryClient || undefined)

      console.log('[AuthProvider] Auth cleanup completed')
      lastSignOutReasonRef.current = 'auth_cleared'
      await captureEventWithQueue('user_signed_out', { reason: 'auth_cleared' })
    } catch (err) {
      console.error('[AuthProvider] Unexpected error during auth cleanup:', err)
      setError(err as SupabaseAuthError)
      lastSignOutReasonRef.current = null
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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        void flushQueue()
      }
    })

    return () => {
      unsubscribe()
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

  useEffect(() => {
    if (!isConsentReady) {
      return
    }

    let cancelled = false
    const syncAnalyticsConsent = async () => {
      try {
        if (hasPerformanceConsent) {
          await initAnalytics({ hasConsent: true, debug: __DEV__ })
          if (cancelled) return
          const client = getAnalyticsClient()
          if (client) {
            await AsyncStorage.setItem(ANALYTICS_ANONYMOUS_ID_STORAGE_KEY, client.getDistinctId())
            await flushQueue()
          }
        } else {
          if (previousUserIdRef.current) {
            await captureEventWithQueue('user_signed_out', { reason: 'consent_revoked' })
            lastSignedInUserRef.current = null
            previousUserIdRef.current = null
            lastSignOutReasonRef.current = 'consent_revoked'
          } else {
            lastSignOutReasonRef.current = null
          }
          await shutdownAnalytics()
          await AsyncStorage.removeItem(ANALYTICS_ANONYMOUS_ID_STORAGE_KEY)
        }
      } catch (analyticsError) {
        console.error('[AuthProvider] Failed to synchronize analytics consent', analyticsError)
      }
    }

    void syncAnalyticsConsent()

    return () => {
      cancelled = true
    }
  }, [hasPerformanceConsent, isConsentReady])

  useEffect(() => {
    if (!hasPerformanceConsent) {
      return
    }

    let cancelled = false

    const syncAnalyticsIdentity = async () => {
      try {
        await initAnalytics({ hasConsent: true, debug: __DEV__ })
        if (cancelled) return

        const client = getAnalyticsClient()
        if (!client) return

        if (session?.user) {
          const storedDistinctId = await AsyncStorage.getItem(ANALYTICS_ANONYMOUS_ID_STORAGE_KEY)
          // Only link analytics identity when ATT permits it (always true on
          // web/Android, only when "Allow" on iOS). When denied we keep the
          // anonymous distinct id PostHog already generated and let capture
          // events flow without binding them to the supabase user id.
          if (canLinkAnalyticsIdentity) {
            if (storedDistinctId && storedDistinctId !== session.user.id) {
              aliasAnalyticsUser(session.user.id)
            }

            const traits: Record<string, string | number | boolean | null> = {
              created_at: session.user.created_at,
            }

            if (session.user.email) {
              traits.email = session.user.email
            }

            if (session.user.email_confirmed_at) {
              traits.email_confirmed_at = session.user.email_confirmed_at
            }

            if (session.user.phone) {
              traits.phone = session.user.phone
            }

            const authProvider =
              session.user.app_metadata?.provider ?? session.user.user_metadata?.provider ?? null
            if (authProvider) {
              traits.auth_provider = authProvider
            }

            identifyAnalyticsUser(session.user.id, traits)

            await AsyncStorage.removeItem(ANALYTICS_ANONYMOUS_ID_STORAGE_KEY)
          }
          const provider =
            session.user.app_metadata?.provider ??
            (session.user.identities && session.user.identities.length > 0
              ? session.user.identities[0]?.provider
              : null) ??
            'unknown'

          if (lastSignedInUserRef.current !== session.user.id) {
            await captureEventWithQueue('user_signed_in', {
              provider,
              is_new_user: !storedDistinctId,
              has_anonymous_history: Boolean(storedDistinctId),
            })
            lastSignedInUserRef.current = session.user.id
          }

          previousUserIdRef.current = session.user.id
          lastSignOutReasonRef.current = null
        } else {
          if (previousUserIdRef.current) {
            const reason = lastSignOutReasonRef.current ?? 'session_timeout'
            if (!lastSignOutReasonRef.current) {
              await captureEventWithQueue('user_signed_out', { reason })
            }
          }
          client.reset()
          await AsyncStorage.setItem(ANALYTICS_ANONYMOUS_ID_STORAGE_KEY, client.getDistinctId())
          lastSignedInUserRef.current = null
          lastSignOutReasonRef.current = null
          previousUserIdRef.current = null
        }
      } catch (analyticsError) {
        console.error('[AuthProvider] Failed to synchronize analytics identity', analyticsError)
      }
    }

    void syncAnalyticsIdentity()

    return () => {
      cancelled = true
    }
  }, [hasPerformanceConsent, session?.user, canLinkAnalyticsIdentity])

  // App Tracking Transparency prompt (iOS only). Fires once per app install,
  // after the user has signed in AND given GDPR-style cookie consent — at
  // that point the user has already seen our value proposition and the
  // Apple HIG context requirement is satisfied. The function is idempotent
  // (no-op after first decision); the ref guards against React strict-mode
  // double-invocation.
  useEffect(() => {
    if (!isTrackingApplicable) return
    if (hasRequestedTrackingRef.current) return
    if (!isConsentReady || !session?.user) return
    if (trackingStatus !== 'not-determined') return
    hasRequestedTrackingRef.current = true
    void requestTrackingAuthorization()
  }, [isTrackingApplicable, isConsentReady, session?.user, trackingStatus])

  // Sentry user context. Error reports themselves are not "tracking" under
  // Apple's definition (Guideline 5.1.2(i)) — but linking errors to a stable
  // user identity (id + email) is. When ATT is denied we keep error capture
  // but strip the user object so Apple's reviewers can't argue we link
  // user-level data across sessions without consent.
  useEffect(() => {
    if (session?.user) {
      if (!canLinkAnalyticsIdentity) {
        clearSentryUser()
        return
      }
      const traits: Record<string, unknown> = {
        created_at: session.user.created_at,
      }

      if (session.user.email_confirmed_at) {
        traits.email_confirmed_at = session.user.email_confirmed_at
      }

      const authProvider =
        session.user.app_metadata?.provider ?? session.user.user_metadata?.provider ?? null
      if (authProvider) {
        traits.auth_provider = authProvider
      }

      setSentryUser(session.user.id, session.user.email, traits)
    } else {
      clearSentryUser()
    }
  }, [session?.user, canLinkAnalyticsIdentity])

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

  const contextValue = useMemo<SessionContextHelper>(() => ({
    session,
    error,
    isLoading,
    supabaseClient: supabase,
    signOut,
    clearAuth,
    refreshSession,
  }), [session, error, isLoading, signOut, clearAuth, refreshSession])

  return (
    <SessionContext.Provider value={contextValue}>
      <AuthStateChangeHandler />
      {children}
    </SessionContext.Provider>
  )
}
