import { Button } from '@app/ui'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { useRouter } from 'expo-router'

import { IconGoogle } from './IconGoogle'

export function GoogleSignIn() {
  const router = useRouter()
  const supabase = useSupabase()
  const handleOAuthSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.EXPO_PUBLIC_URL,
      },
    })
    if (error) {
      console.error('Google Sign-In Error:', error)
      // TODO: Add proper error handling/toast notification
    }
  }

  return (
    <Button
      borderRadius="$10"
      flex={1}
      backgroundColor="$color1"
      color="$color12"
      borderColor="$borderColor"
      onPress={() => handleOAuthSignIn()}
      icon={IconGoogle}
    >
      Sign in with Google
    </Button>
  )
}
