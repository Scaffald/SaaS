import { captureEvent } from '@scf/core/utils/analytics/client'
import { supabase } from '@scf/core/utils/supabase/client'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { Button, useToast } from '@scaffald/ui'
import { logger } from '@scf/core'

import { IconGoogle } from './IconGoogle'

export function GoogleSignIn() {
  const { t } = useTranslation()
  const toast = useToast()

  const handleOAuthSignIn = async () => {
    captureEvent('auth_social_sign_in_started', { provider: 'google' })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.EXPO_PUBLIC_URL,
      },
    })
    if (error) {
      logger.error('Google Sign-In Error', error, { provider: 'google' })
      captureEvent('auth_social_sign_in_failed', {
        provider: 'google',
        error_code: error.name ?? null,
        message: error.message ?? null,
      })
      toast.show({
        message: t('auth.errors.googleSignInFailed'),
        variant: 'error',
        duration: 5000,
      })
    }
  }

  return (
    <Button
      variant="outline"
      onPress={() => handleOAuthSignIn()}
      iconStart={IconGoogle}
      style={{ flex: 1, borderRadius: 20 }}
    >
      {t('auth.login.googleButton')}
    </Button>
  )
}
