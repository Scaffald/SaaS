import { ROUTES } from '@scf/core/constants/routes'
import { captureEvent } from '@scf/core/utils/analytics/client'
import { supabase } from '@scf/core/utils/supabase/client'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { useRouter } from 'expo-router'
import { Button } from '@scaffald/ui'

import { IconGoogle } from './IconGoogle'

export function GoogleSignIn() {
  const router = useRouter()
  const { t } = useTranslation()

  async function signInWithGoogle() {
    try {
      captureEvent('auth_social_sign_in_started', { provider: 'google' })
      GoogleSignin.configure({
        iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
        webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      })

      await GoogleSignin.hasPlayServices()

      const response = await GoogleSignin.signIn()
      const token = response?.data?.idToken

      if (token) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token,
        })

        if (error) {
          throw new Error('error', error)
        }

        router.replace(ROUTES.HOME.path)
      } else {
        throw new Error('no ID token present!')
      }
    } catch (error) {
      const errorCode =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code: unknown }).code)
          : error instanceof Error
            ? error.name
            : 'unknown'
      const errorMessage = error instanceof Error ? error.message : null
      captureEvent('auth_social_sign_in_failed', {
        provider: 'google',
        error_code: errorCode,
        message: errorMessage,
      })
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          // user cancelled the login flow
        } else if (error.code === statusCodes.IN_PROGRESS) {
          // operation (e.g. sign in) is in progress already
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          // play services not available or outdated
        } else {
          // some other error happened
        }
      }
    }
  }

  return (
    <Button
      variant="outline"
      onPress={() => signInWithGoogle()}
      iconStart={IconGoogle}
      style={{ flex: 1, borderRadius: 20 }}
    >
      {t('auth.login.googleButton')}
    </Button>
  )
}
