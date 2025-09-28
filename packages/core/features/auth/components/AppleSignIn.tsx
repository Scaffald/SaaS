import { Button } from '@app/ui'
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
    <Button
      borderRadius="$10"
      flex={1}
      backgroundColor="$color12"
      color="$color1"
      borderColor="$borderColor"
      onPress={() => handleOAuthSignIn()}
      icon={IconApple}
    >
      Sign in with Apple
    </Button>
  )
}
