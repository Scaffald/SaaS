import { Button, Theme } from 'tamagui'
import { supabase } from '@app/core/utils/supabase/client'
import { captureEvent } from '@app/core/utils/analytics/client'

import { IconGoogle } from './IconGoogle'

export function GoogleSignIn() {
  // Using supabase directly from import
  const handleOAuthSignIn = async () => {
    captureEvent('auth_social_sign_in_started', { provider: 'google' })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.EXPO_PUBLIC_URL,
      },
    })
    if (error) {
      console.error('Google Sign-In Error:', error)
      captureEvent('auth_social_sign_in_failed', {
        provider: 'google',
        error_code: error.name ?? null,
        message: error.message ?? null,
      })
      // TODO: Add proper error handling/toast notification
    }
  }

  return (
    <Theme inverse>
      <Button
        rounded="$10"
        flex={1}
        bg="$background"
        color="$color"
        borderColor="$borderColor"
        animation="quick"
        hoverStyle={{ scale: 1.02, bg: '$background' }}
        pressStyle={{ scale: 0.98 }}
        onPress={() => handleOAuthSignIn()}
        icon={IconGoogle}
      >
        Login with Google
      </Button>
    </Theme>
  )
}
