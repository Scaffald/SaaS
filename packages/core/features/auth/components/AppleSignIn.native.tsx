import { initiateAppleSignIn } from '@app/core/utils/auth/initiateAppleSignIn'
import { supabase } from '@app/core/utils/supabase/client'
import * as AppleAuthentication from 'expo-apple-authentication'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'

export function AppleSignIn() {
  // Using supabase directly from import
  const router = useRouter()
  async function signInWithApple() {
    try {
      const { token, nonce } = await initiateAppleSignIn()
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token,
        nonce,
      })
      if (!error) router.replace('/')
      if (error) throw error
    } catch (e) {
      if (e instanceof Error && 'code' in e) {
        if (e.code === 'ERR_REQUEST_CANCELED') {
          // handle if the user canceled the sign-in flow
        } else {
          // handle any other errors
        }
      } else {
        console.error('Unexpected error from Apple SignIn: ', e)
      }
    }
  }

  if (Platform.OS !== 'ios') {
    // no Apple sign-in for non-iOS native devices
    return null
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={9}
      style={{ height: 44 }}
      onPress={signInWithApple}
    />
  )
}
