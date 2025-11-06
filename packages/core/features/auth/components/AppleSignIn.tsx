import { Button, Theme } from 'tamagui'
import { supabase } from '@app/core/utils/supabase/client'

import { IconApple } from './IconApple'

export function AppleSignIn() {
  // Using supabase directly from import
  const handleOAuthSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: process.env.EXPO_PUBLIC_URL,
      },
    })
    if (error) {
      console.error('Apple Sign-In Error:', error)
      // TODO: Add proper error handling/toast notification
      return
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
        icon={IconApple}
      >
        Login with Apple
      </Button>
    </Theme>
  )
}
