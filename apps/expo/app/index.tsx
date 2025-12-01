import { AUTH_ROUTES, ROUTES } from '@app/core/constants/routes'
import { supabase } from '@app/core/utils/supabase/client'
import { useUser } from '@app/core/utils/useUser'
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { Text, YStack } from '@unicornlove/ui'

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
          router.replace(ROUTES.DASHBOARD.path)
        } else {
          console.log('Navigating to auth for unauthenticated user')
          router.replace(AUTH_ROUTES.LOGIN.path)
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
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text>Verifying your email...</Text>
      </YStack>
    )
  }

  // Show error if verification failed
  if (verificationError) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text color="$red10" textAlign="center" marginBottom="$4">
          Verification failed: {verificationError}
        </Text>
        <Text textAlign="center">Please try requesting a new magic link.</Text>
      </YStack>
    )
  }

  // Show loading state while checking auth or waiting for navigation
  if (isPending || !isRouterReady || !hasNavigated) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text>Loading...</Text>
      </YStack>
    )
  }

  // This should rarely be reached, but provides a fallback
  return (
    <YStack flex={1} justifyContent="center" alignItems="center">
      <Text>Initializing...</Text>
    </YStack>
  )
}
