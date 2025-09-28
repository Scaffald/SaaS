import { useUser } from '@app/core/utils/useUser'
import { useSupabase } from '@app/core/utils/supabase/useSupabase.unified'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'

export default function RootIndex() {
  const { user, isPending } = useUser()
  const supabase = useSupabase()
  const params = useLocalSearchParams<{
    token?: string
    type?: string
    redirect_to?: string
  }>()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

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
            type: params.type as any,
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

  // Show loading state while checking auth
  if (isPending) {
    return null
  }

  // Redirect based on authentication status
  if (user) {
    return <Redirect href="/dashboard" />
  } else {
    return <Redirect href="/auth" />
  }
}
