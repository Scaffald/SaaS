import { captureEvent } from '@scf/core/utils/analytics/client'
import { supabase } from '@scf/core/utils/supabase/client'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { Button, useToast } from '@scaffald/ui'
import { logger } from '@scf/core'

import { IconApple } from './IconApple'

export function AppleSignIn() {
  const { t } = useTranslation()
  const toast = useToast()

  const handleOAuthSignIn = async () => {
    captureEvent('auth_social_sign_in_started', { provider: 'apple' })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: process.env.EXPO_PUBLIC_URL,
      },
    })
    if (error) {
      logger.error('Apple Sign-In Error', error, { provider: 'apple' })
      captureEvent('auth_social_sign_in_failed', {
        provider: 'apple',
        error_code: error.name ?? null,
        message: error.message ?? null,
      })
      toast.show({
        message: t('auth.errors.appleSignInFailed'),
        variant: 'error',
        duration: 5000,
      })
      return
    }
  }

  return (
    <Button
      variant="outline"
      onPress={() => handleOAuthSignIn()}
      iconStart={IconApple}
      style={{ flex: 1, borderRadius: 20 }}
    >
      {t('auth.login.appleButton')}
    </Button>
  )
}
