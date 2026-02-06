import { captureEvent } from '@scf/core/utils/analytics/client'
import { supabase } from '@scf/core/utils/supabase/client'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { Button, Theme, useToastController } from '@unicornlove/ui'
import { logger } from '@scf/core'

import { IconApple } from './IconApple'

export function AppleSignIn() {
  // Using supabase directly from import
  const { t } = useTranslation()
  const toast = useToastController()
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
      toast.show(t('auth.errors.appleSignInFailed'), {
        type: 'error',
        duration: 5000,
      })
      return
    }
  }

  return (
    <Theme inverse>
      <Button
        borderRadius="$10"
        flex={1}
        backgroundColor="$background"
        color="$color"
        borderColor="$borderColor"
        animation="quick"
        hoverStyle={{ scale: 1.02, backgroundColor: '$background' }}
        pressStyle={{ scale: 0.98 }}
        onPress={() => handleOAuthSignIn()}
        icon={IconApple}
      >
        {t('auth.login.appleButton')}
      </Button>
    </Theme>
  )
}
