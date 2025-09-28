import { useUser } from '@app/core/utils/useUser'
import { supabase } from '@app/core/utils/supabase/client'
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'

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
  }, [params.token, params.type, supabase])

  // Handle navigation after router is ready
  useEffect(() => {
    // Don't navigate if we're still loading, verifying, or have already navigated
    if (isPending || isVerifying || hasNavigated || verificationError) {
      return
    }

    // Ensure router is ready by checking if we have segments or if we're on the root
    const isRouterReady = segments.length > 0 || typeof window !== 'undefined'

    if (!isRouterReady) {
      return
    }

    // Use setTimeout to ensure navigation happens after the current render cycle
    const timeoutId = setTimeout(() => {
      try {
        if (user) {
          console.log('Navigating to dashboard for authenticated user')
          router.replace('/dashboard')
        } else {
          console.log('Navigating to auth for unauthenticated user')
          router.replace('/auth')
        }
        setHasNavigated(true)
      } catch (error) {
        console.error('Navigation error:', error)
        // Fallback: try again after a short delay
        setTimeout(() => {
          try {
            if (user) {
              router.replace('/dashboard')
            } else {
              router.replace('/auth')
            }
            setHasNavigated(true)
          } catch (fallbackError) {
            console.error('Fallback navigation error:', fallbackError)
          }
        }, 100)
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [user, isPending, isVerifying, hasNavigated, verificationError, segments, router])

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
  if (isPending || !hasNavigated) {
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
