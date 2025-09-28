import { useUser } from '@app/core/utils/useUser'
import { supabase } from '@app/core/utils/supabase/client'
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, Text, Platform } from 'react-native'
import { AUTH_ROUTES } from '@app/core/constants/routes'

export default function RootIndex() {
  const { user, isPending } = useUser()
  const router = useRouter()
  const segments = useSegments()

  const params = useLocalSearchParams<{
    token?: string
    type?: string
    redirect_to?: string
  }>()

  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [hasNavigated, setHasNavigated] = useState(false)
  const [isRouterReady, setIsRouterReady] = useState(false)

  // Check if router is ready
  useEffect(() => {
    // On web, router is ready immediately
    if (Platform.OS === 'web') {
      setIsRouterReady(true)
      return
    }

    // On native, wait for segments to be available or use a timeout
    const checkRouter = () => {
      if (segments.length > 0 || router) {
        setIsRouterReady(true)
      }
    }

    checkRouter()

    // Fallback timeout to ensure we don't wait forever
    const timeout = setTimeout(() => {
      setIsRouterReady(true)
    }, 100)

    return () => clearTimeout(timeout)
  }, [segments, router])

  // Handle magic link verification
  useEffect(() => {
    const handleMagicLinkVerification = async () => {
      if (params.token && params.type) {
        console.log('Handling magic link verification:', { token: params.token, type: params.type })
        setIsVerifying(true)
        setVerificationError(null)

        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: params.token,
            type: params.type as unknown as 'email',
          })

          if (error) {
            console.error('Magic link verification error:', error)
            setVerificationError(error.message)
          } else {
            console.log('Magic link verification successful:', data)
            // Session will be automatically set by Supabase
          }
        } catch (err) {
          console.error('Unexpected error during verification:', err)
          setVerificationError(err instanceof Error ? err.message : 'Verification failed')
        } finally {
          setIsVerifying(false)
        }
      }
    }

    handleMagicLinkVerification()
  }, [params.token, params.type])

  // Handle navigation after everything is ready
  useEffect(() => {
    // Don't navigate if we're still loading, verifying, router isn't ready, or have already navigated
    if (isPending || isVerifying || !isRouterReady || hasNavigated || verificationError) {
      return
    }

    const performNavigation = () => {
      try {
        if (user) {
          console.log('Navigating to dashboard for authenticated user')
          router.replace('/dashboard')
        } else {
          console.log('Navigating to auth for unauthenticated user')
          router.replace(AUTH_ROUTES.INDEX?.fullPath || '/auth')
        }
        setHasNavigated(true)
      } catch (error) {
        console.error('Navigation error:', error)
        // Don't retry automatically to avoid infinite loops
      }
    }

    // Use different timing strategies based on platform
    if (Platform.OS === 'web') {
      // On web, navigate immediately
      performNavigation()
    } else {
      // On native, use a small delay to ensure the router is fully ready
      const timeoutId = setTimeout(performNavigation, 50)
      return () => clearTimeout(timeoutId)
    }
  }, [user, isPending, isVerifying, isRouterReady, hasNavigated, verificationError, router])

  // Show loading state while verifying magic link
  if (isVerifying) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Verifying your email...</Text>
      </View>
    )
  }

  // Show error if verification failed
  if (verificationError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>
          Verification failed: {verificationError}
        </Text>
        <Text style={{ textAlign: 'center' }}>Please try requesting a new magic link.</Text>
      </View>
    )
  }

  // Show loading state while checking auth or waiting for navigation
  if (isPending || !isRouterReady || !hasNavigated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    )
  }

  // This should rarely be reached, but provides a fallback
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Initializing...</Text>
    </View>
  )
}
