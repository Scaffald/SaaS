import { ROUTES } from '@app/core/constants/routes'
import { captureEvent } from '@app/core/utils/analytics/client'
import { initiateAppleSignIn } from '@app/core/utils/auth/initiateAppleSignIn'
import { supabase } from '@app/core/utils/supabase/client'
import * as AppleAuthentication from 'expo-apple-authentication'
import { useRouter } from 'expo-router'
import { Platform } from 'react-native'

export function AppleSignIn() {
  // Using supabase directly from import
  const router = useRouter()
  async function signInWithApple() {
    try {
      captureEvent('auth_social_sign_in_started', { provider: 'apple' })
      const { token, nonce } = await initiateAppleSignIn()
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token,
        nonce,
      })
      if (!error) router.replace(ROUTES.HOME.path)
      if (error) throw error
    } catch (e) {
      const errorCode =
        typeof e === 'object' && e && 'code' in e
          ? String((e as { code: unknown }).code)
          : e instanceof Error
            ? e.name
            : 'unknown'
      const errorMessage = e instanceof Error ? e.message : null
      captureEvent('auth_social_sign_in_failed', {
        provider: 'apple',
        error_code: errorCode,
        message: errorMessage,
      })
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
